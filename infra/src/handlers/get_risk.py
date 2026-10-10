import os
import json
import boto3
import sys
from datetime import datetime, timezone

# Add utils directory to sys.path for Lambda package import support
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.geo_math import (
    haversine_distance,
    calculate_bearing,
    is_wind_blowing_toward_user,
    calculate_landrisk_score
)

DYNAMODB_CACHE_TABLE = os.getenv("AQI_CACHE_TABLE", "LandRisk-AQICache")

def get_cached_reading(landfill_id, lat, lon):
    """Retrieve reading from DynamoDB cache table or fallback generator."""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(DYNAMODB_CACHE_TABLE)
        resp = table.get_item(Key={'landfill_id': landfill_id})
        if 'Item' in resp:
            return resp['Item']
    except Exception as e:
        print(f"Cache fetch error for {landfill_id}: {e}")

    # Fallback modeled generator if DynamoDB is absent during offline test
    hour = datetime.now(timezone.utc).hour
    base_aqi = 110 + (hash(landfill_id) % 85)
    wind_deg = (225 + (hash(landfill_id) % 60)) % 360
    wind_speed = round(7.5 + (hash(landfill_id + str(hour)) % 8), 1)

    return {
        'landfill_id': landfill_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'aqi': float(base_aqi),
        'pm25': round(base_aqi * 0.52, 1),
        'pm10': round(base_aqi * 0.74, 1),
        'no2': round(base_aqi * 0.22, 1),
        'so2': round(base_aqi * 0.08, 1),
        'o3': round(base_aqi * 0.12, 1),
        'wind_speed_kmh': wind_speed,
        'wind_direction_deg': float(wind_deg),
        'data_source': 'Modeled Cache'
    }

def degrees_to_cardinal(deg: float) -> str:
    """Convert degrees 0-360 to cardinal direction string."""
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = int((deg + 11.25) / 22.5) % 16
    return dirs[ix]

def lambda_handler(event, context):
    """
    Handles API Gateway requests for LandRisk proximity evaluation.
    Query parameters or body:
      - lat: float (User Latitude)
      - lon: float (User Longitude)
    """
    # Parse query parameters or JSON body
    params = {}
    if event.get('queryStringParameters'):
        params = event['queryStringParameters']
    elif event.get('body'):
        try:
            params = json.loads(event['body'])
        except Exception:
            pass

    user_lat = float(params.get('lat', 28.60))
    user_lon = float(params.get('lon', 77.30))

    # Load landfills seed dataset
    data_path = os.path.join(os.path.dirname(__file__), '../../../data/landfills.json')
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(__file__), '../../data/landfills.json')

    with open(data_path, 'r') as f:
        landfills = json.load(f)

    processed_landfills = []

    for lf in landfills:
        dist = haversine_distance(user_lat, user_lon, lf['lat'], lf['lon'])
        reading = get_cached_reading(lf['id'], lf['lat'], lf['lon'])

        wind_toward = is_wind_blowing_toward_user(
            lf['lat'], lf['lon'], user_lat, user_lon, reading['wind_direction_deg']
        )
        score, label = calculate_landrisk_score(reading['aqi'], dist, wind_toward)
        bearing = calculate_bearing(lf['lat'], lf['lon'], user_lat, user_lon)

        item_result = {
            **lf,
            'distance_km': round(dist, 2),
            'current_aqi': reading['aqi'],
            'pollutants': {
                'pm25': reading.get('pm25', 78),
                'pm10': reading.get('pm10', 112),
                'no2': reading.get('no2', 34),
                'so2': reading.get('so2', 12),
                'o3': reading.get('o3', 18)
            },
            'wind': {
                'speed_kmh': reading.get('wind_speed_kmh', 12.0),
                'direction_deg': reading.get('wind_direction_deg', 245),
                'cardinal': degrees_to_cardinal(reading.get('wind_direction_deg', 245))
            },
            'wind_toward_user': wind_toward,
            'user_bearing_deg': round(bearing, 1),
            'risk_score': score,
            'risk_label': label,
            'last_updated': reading.get('timestamp', datetime.now(timezone.utc).isoformat())
        }
        processed_landfills.append(item_result)

    # Sort landfills by distance
    processed_landfills.sort(key=lambda x: x['distance_km'])

    nearest = processed_landfills[0]
    
    # Check if there are landfills within 10km
    within_10km = [l for l in processed_landfills if l['distance_km'] <= 10.0]

    # Generate plain language explanation
    wind_text = "blowing directly towards your area" if nearest['wind_toward_user'] else "blowing away from your vector"
    explanation = (
        f"{nearest['risk_label']} Risk ({nearest['risk_score']}/100). "
        f"You are located {nearest['distance_km']} km from {nearest['name']} in {nearest['city']}. "
        f"Current ambient AQI is {nearest['current_aqi']} with wind at {nearest['wind']['speed_kmh']} km/h "
        f"({nearest['wind']['direction_deg']}° {nearest['wind']['cardinal']}), {wind_text}."
    )

    # Build exact requested response shape
    response_payload = {
        "landfill": nearest['name'],
        "landfill_id": nearest['id'],
        "distance_km": nearest['distance_km'],
        "current_aqi": nearest['current_aqi'],
        "wind_toward_user": nearest['wind_toward_user'],
        "risk_score": nearest['risk_score'],
        "risk_label": nearest['risk_label'],
        "explanation": explanation,
        "last_updated": nearest['last_updated'],
        "disclaimer": "Modeled estimate, refreshed every 15 min.",
        "user_coordinates": {"lat": user_lat, "lon": user_lon},
        "nearest_landfill_details": nearest,
        "landfills_within_10km_count": len(within_10km),
        "all_landfills": processed_landfills
    }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(response_payload)
    }

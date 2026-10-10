import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the bearing angle in degrees from point 1 (landfill) to point 2 (user).
    0 = North, 90 = East, 180 = South, 270 = West.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)

    bearing_rad = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing_rad) + 360) % 360
    return bearing_deg

def is_wind_blowing_toward_user(landfill_lat: float, landfill_lon: float, user_lat: float, user_lon: float, wind_deg: float) -> bool:
    """
    Determines if the wind from the landfill blows towards the user.
    wind_deg: Meteorological wind direction (degrees FROM which wind blows).
    Wind heading (where wind blows TO) = (wind_deg + 180) % 360.
    Returns True if user bearing is within 45 degrees of wind heading.
    """
    bearing_to_user = calculate_bearing(landfill_lat, landfill_lon, user_lat, user_lon)
    wind_heading = (wind_deg + 180) % 360
    
    diff = abs(wind_heading - bearing_to_user)
    if diff > 180:
        diff = 360 - diff
        
    return diff <= 45.0

def calculate_landrisk_score(aqi: float, distance_km: float, wind_toward: bool) -> tuple[float, str]:
    """
    Calculates normalized risk score (0-100) and risk label using formula:
    risk = AQI * (1 / distance_km) * wind_factor (1.5 if wind towards user, else 1.0)
    Normalized to 0-100 range.
    """
    wind_factor = 1.5 if wind_toward else 1.0
    safe_dist = max(distance_km, 0.3)  # prevent division by zero / extreme infinity
    
    raw = aqi * (1.0 / safe_dist) * wind_factor
    
    # Scale factor mapping raw score (~10 to ~300+) into 0-100 scale smoothly
    # AQI 150 at 3km downwind (raw = 150 * 0.33 * 1.5 = 75) -> score ~68
    score = min(100.0, max(0.0, (raw / 110.0) * 100.0))
    score = round(score, 1)

    if score < 25.0:
        label = "Low"
    elif score < 50.0:
        label = "Medium"
    elif score < 75.0:
        label = "High"
    else:
        label = "Severe"

    return score, label

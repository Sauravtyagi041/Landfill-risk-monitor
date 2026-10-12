const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const CACHE_MS = 15 * 60 * 1000;

let cachedResult = null;
let cachedAt = 0;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Environmental data request failed (${response.status}).`);
  return response.json();
}

function toLocations(payload) {
  return Array.isArray(payload) ? payload : [payload];
}

/**
 * Fetch current Open-Meteo weather and air-quality model output for the known
 * landfill coordinates. The user's precise assessment/GPS location is not sent.
 */
export async function fetchLiveEnvironmentalReadings(landfills, { forceRefresh = false } = {}) {
  if (!forceRefresh && cachedResult && Date.now() - cachedAt < CACHE_MS) {
    return cachedResult;
  }

  const latitude = landfills.map((site) => site.lat).join(',');
  const longitude = landfills.map((site) => site.lon).join(',');

  const weatherUrl = new URL(WEATHER_API);
  weatherUrl.search = new URLSearchParams({
    latitude,
    longitude,
    current: 'wind_speed_10m,wind_direction_10m',
    wind_speed_unit: 'kmh',
    timezone: 'auto'
  });

  const airUrl = new URL(AIR_QUALITY_API);
  airUrl.search = new URLSearchParams({
    latitude,
    longitude,
    current: 'us_aqi,pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone',
    timezone: 'auto'
  });

  const [weatherPayload, airPayload] = await Promise.all([
    fetchJson(weatherUrl),
    fetchJson(airUrl)
  ]);
  const weatherLocations = toLocations(weatherPayload);
  const airLocations = toLocations(airPayload);

  if (weatherLocations.length !== landfills.length || airLocations.length !== landfills.length) {
    throw new Error('The environmental provider returned an incomplete set of locations.');
  }

  const readings = landfills.map((site, index) => {
    const weather = weatherLocations[index]?.current;
    const air = airLocations[index]?.current;
    const values = [
      weather?.wind_speed_10m,
      weather?.wind_direction_10m,
      air?.us_aqi,
      air?.pm2_5,
      air?.pm10,
      air?.nitrogen_dioxide,
      air?.sulphur_dioxide,
      air?.ozone
    ];
    if (values.some((value) => value == null || !Number.isFinite(Number(value)))) {
      throw new Error(`The environmental provider returned incomplete data for ${site.name}.`);
    }

    return {
      aqi: Number(air.us_aqi),
      pm25: Number(air.pm2_5),
      pm10: Number(air.pm10),
      no2: Number(air.nitrogen_dioxide),
      so2: Number(air.sulphur_dioxide),
      o3: Number(air.ozone),
      wind_speed_kmh: Number(weather.wind_speed_10m),
      wind_direction_deg: Number(weather.wind_direction_10m),
      provider_time: air.time || weather.time || null
    };
  });

  cachedResult = {
    readings,
    fetched_at: new Date().toISOString(),
    source: 'Open-Meteo current weather and air-quality models'
  };
  cachedAt = Date.now();
  return cachedResult;
}

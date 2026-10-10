export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const bearingRad = Math.atan2(y, x);
  return ((bearingRad * 180) / Math.PI + 360) % 360;
}

export function isWindBlowingTowardUser(lfLat, lfLon, userLat, userLon, windDeg) {
  const bearingToUser = calculateBearing(lfLat, lfLon, userLat, userLon);
  const windHeading = (windDeg + 180) % 360;
  let diff = Math.abs(windHeading - bearingToUser);
  if (diff > 180) diff = 360 - diff;
  return diff <= 45.0;
}

export function calculateLandRiskScore(aqi, distanceKm, windToward) {
  const windFactor = windToward ? 1.5 : 1.0;
  const safeDist = Math.max(distanceKm, 0.3);
  const raw = aqi * (1.0 / safeDist) * windFactor;

  let score = Math.min(100.0, Math.max(0.0, (raw / 110.0) * 100.0));
  score = Math.round(score * 10) / 10;

  let label = "Low";
  if (score >= 75.0) label = "Severe";
  else if (score >= 50.0) label = "High";
  else if (score >= 25.0) label = "Medium";

  return { score, label };
}

export function degreesToCardinal(deg) {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const ix = Math.floor((deg + 11.25) / 22.5) % 16;
  return dirs[ix];
}

/**
 * Computes plume cone polygon coordinates around landfill based on wind heading.
 */
export function generatePlumePolygon(lat, lon, windDeg, distanceKm = 8.0, spreadAngleDeg = 40) {
  const windHeading = (windDeg + 180) % 360; // direction plume travels towards
  const points = [[lat, lon]]; // Landfill origin

  const stepCount = 9;
  const startAngle = windHeading - spreadAngleDeg / 2;
  const angleStep = spreadAngleDeg / stepCount;

  for (let i = 0; i <= stepCount; i++) {
    const angle = startAngle + i * angleStep;
    const rad = (angle * Math.PI) / 180;
    
    // Convert radial offset in km to approx lat/lon degrees (1 deg ~ 111km)
    const dLat = (distanceKm * Math.cos(rad)) / 111.0;
    const dLon = (distanceKm * Math.sin(rad)) / (111.0 * Math.cos((lat * Math.PI) / 180));
    
    points.push([lat + dLat, lon + dLon]);
  }

  return points;
}

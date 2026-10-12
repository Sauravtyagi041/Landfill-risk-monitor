import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import RiskCard from './components/RiskCard';
import AlertsList from './components/AlertsList';
import ArchitectureModal from './components/ArchitectureModal';
import { SEED_LANDFILLS } from './data/seedLandfills';
import {
  haversineDistance,
  isWindBlowingTowardUser,
  calculateLandRiskScore,
  degreesToCardinal
} from './utils/riskCalculator';
import { fetchLiveEnvironmentalReadings } from './utils/liveEnvironmentalData';

export default function App() {
  // Default location centered around Ghazipur Landfill, Delhi (28.60, 77.30)
  const [userLocation, setUserLocation] = useState({ lat: 28.60, lon: 77.30 });
  const [selectedLandfill, setSelectedLandfill] = useState(SEED_LANDFILLS[0]);
  const [riskData, setRiskData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // Load current modeled weather and air-quality data; clearly label offline fallback values.
  const evaluateRisk = useCallback(async (location, { forceRefresh = false } = {}) => {
    let liveData = null;
    try {
      liveData = await fetchLiveEnvironmentalReadings(SEED_LANDFILLS, { forceRefresh });
    } catch (error) {
      console.warn('Live environmental feed unavailable; showing labeled modeled fallback.', error);
    }

    const fetchedAt = liveData?.fetched_at || new Date().toISOString();
    const processed = SEED_LANDFILLS.map((lf, index) => {
      const dist = haversineDistance(location.lat, location.lon, lf.lat, lf.lon);
      const reading = liveData?.readings[index];
      const baseAqi = reading?.aqi ?? (110 + (Math.abs(lf.name.length * 17) % 75));
      const windDeg = reading?.wind_direction_deg ?? ((235 + (Math.abs(lf.name.length * 11) % 50)) % 360);
      const windSpeed = reading?.wind_speed_kmh ?? 12.0;

      const windToward = isWindBlowingTowardUser(lf.lat, lf.lon, location.lat, location.lon, windDeg);
      const { score, label } = calculateLandRiskScore(baseAqi, dist, windToward);

      return {
        ...lf,
        distance_km: Math.round(dist * 100) / 100,
        current_aqi: baseAqi,
        pollutants: reading ? {
          pm25: reading.pm25,
          pm10: reading.pm10,
          no2: reading.no2,
          so2: reading.so2,
          o3: reading.o3
        } : {
          pm25: Math.round(baseAqi * 0.52),
          pm10: Math.round(baseAqi * 0.74),
          no2: Math.round(baseAqi * 0.22),
          so2: Math.round(baseAqi * 0.08),
          o3: Math.round(baseAqi * 0.12)
        },
        wind: {
          speed_kmh: windSpeed,
          direction_deg: windDeg,
          cardinal: degreesToCardinal(windDeg)
        },
        wind_toward_user: windToward,
        precipitation_mm: reading?.precipitation_mm ?? null,
        risk_score: score,
        risk_label: label,
        data_source: liveData?.source || 'Modeled fallback (live feed unavailable)',
        last_updated: fetchedAt
      };
    });

    processed.sort((a, b) => a.distance_km - b.distance_km);
    const nearest = processed[0];
    setSelectedLandfill(nearest);

    const windText = nearest.wind_toward_user ? "blowing directly towards your area" : "blowing away from your vector";
    const explanation = `${nearest.risk_label} relative risk (${nearest.risk_score}/100). You are ${nearest.distance_km} km from ${nearest.name} in ${nearest.city}. The ${liveData ? 'modeled' : 'fallback'} AQI is ${nearest.current_aqi}; wind is ${nearest.wind.speed_kmh} km/h (${nearest.wind.direction_deg}° ${nearest.wind.cardinal}), ${windText}.`;

    setRiskData({
      landfill: nearest.name,
      landfill_id: nearest.id,
      distance_km: nearest.distance_km,
      current_aqi: nearest.current_aqi,
      wind_toward_user: nearest.wind_toward_user,
      risk_score: nearest.risk_score,
      risk_label: nearest.risk_label,
      explanation,
      last_updated: fetchedAt,
      data_source: nearest.data_source,
      disclaimer: liveData
        ? 'AQI and weather are model-based estimates from Open-Meteo, not measurements from a local landfill or air-quality sensor.'
        : 'Live environmental feeds are unavailable. Values shown are generated demo estimates, not live measurements.',
      user_coordinates: location,
      nearest_landfill_details: nearest,
      all_landfills: processed
    });
  }, []);

  useEffect(() => {
    evaluateRisk(userLocation);
  }, [userLocation, evaluateRisk]);

  // Refresh the provider data on its current weather update cadence.
  useEffect(() => {
    const timer = window.setInterval(() => {
      evaluateRisk(userLocation, { forceRefresh: true });
    }, 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [userLocation, evaluateRisk]);

  // Handle GPS location request
  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserLocation(newLoc);
        },
        (err) => {
          alert('Could not retrieve GPS location. Using default map vector.');
        }
      );
    }
  };

  // Keep the risk panel synchronized when a landfill marker is selected.
  const handleSelectLandfill = (lf) => {
    setSelectedLandfill(lf);
    if (!lf) return;
    setRiskData((current) => current ? ({
      ...current,
      landfill: lf.name,
      landfill_id: lf.id,
      distance_km: lf.distance_km ?? current.distance_km,
      current_aqi: lf.current_aqi ?? current.current_aqi,
      wind_toward_user: lf.wind_toward_user ?? false,
      risk_score: lf.risk_score ?? current.risk_score,
      risk_label: lf.risk_label ?? current.risk_label,
      nearest_landfill_details: lf,
      explanation: `${lf.risk_label || 'Modeled'} risk at ${lf.name} in ${lf.city}. The assessment location is ${lf.distance_km ?? current.distance_km} km away; the shaded map cone estimates the downwind area from current modeled wind.`
    }) : current);
  };

  // Handle map click to reposition vector
  const handleMapClick = (lat, lon) => {
    const newLoc = { lat: Math.round(lat * 10000) / 10000, lon: Math.round(lon * 10000) / 10000 };
    setUserLocation(newLoc);
  };

  // Handle search bar input
  const handleSearchLocation = (query) => {
    const q = query.toLowerCase();
    const found = SEED_LANDFILLS.find(
      (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
    );

    if (found) {
      // Place user location 3km south of found landfill for optimal risk demo
      const newLoc = { lat: found.lat - 0.025, lon: found.lon - 0.015 };
      setUserLocation(newLoc);
      setSelectedLandfill(found);
    } else {
      alert(`No landfill found matching "${query}". Try searching "Ghazipur", "Okhla", "Mumbai", or "Delhi".`);
    }
  };

  // Force cache refresh action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await evaluateRisk(userLocation, { forceRefresh: true });
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const landfillsList = riskData?.all_landfills || SEED_LANDFILLS;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans md:h-screen md:min-h-0 md:overflow-hidden">
      {/* Header Bar */}
      <Header
        onUseLocation={handleUseLocation}
        onSearchLocation={handleSearchLocation}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        lastUpdated={riskData?.last_updated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Responsive Dashboard Body */}
      <div className="flex-1 dashboard-grid min-h-0">
        {/* Left Column: Interactive Map */}
        <div className="dashboard-map relative w-full h-full bg-slate-900 border-r border-slate-800">
          <MapView
            userLocation={userLocation}
            landfills={landfillsList}
            selectedLandfill={selectedLandfill}
            onSelectLandfill={handleSelectLandfill}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Right Column: Risk Analytics Side Card */}
        <div className="dashboard-risk h-full overflow-y-auto bg-slate-950 flex flex-col justify-between border-l border-slate-800">
          <RiskCard data={riskData} isRefreshing={isRefreshing} />
        </div>
      </div>

      {/* AWS Serverless Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
}

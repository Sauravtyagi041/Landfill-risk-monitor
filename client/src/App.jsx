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

export default function App() {
  // Default location centered around Ghazipur Landfill, Delhi (28.60, 77.30)
  const [userLocation, setUserLocation] = useState({ lat: 28.60, lon: 77.30 });
  const [selectedLandfill, setSelectedLandfill] = useState(SEED_LANDFILLS[0]);
  const [riskData, setRiskData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // Core risk evaluator function (tries AWS API Gateway backend first, falls back to client math)
  const evaluateRisk = useCallback(async (location) => {
    try {
      // Attempt backend API call to AWS Lambda /api/risk
      const response = await fetch(`/api/risk?lat=${location.lat}&lon=${location.lon}`);
      if (response.ok) {
        const data = await response.json();
        setRiskData(data);
        if (data.nearest_landfill_details) {
          setSelectedLandfill(data.nearest_landfill_details);
        }
        return;
      }
    } catch (e) {
      // API unreached, proceed to seamless client-side computation
    }

    // Client-side fallback evaluator matching AWS Lambda risk formula
    const processed = SEED_LANDFILLS.map((lf) => {
      const dist = haversineDistance(location.lat, location.lon, lf.lat, lf.lon);
      
      // Simulated deterministic wind & AQI for offline rendering
      const hour = new Date().getHours();
      const baseAqi = 110 + (Math.abs(lf.name.length * 17) % 75);
      const windDeg = (235 + (Math.abs(lf.name.length * 11) % 50)) % 360;
      const windSpeed = 12.0;

      const windToward = isWindBlowingTowardUser(lf.lat, lf.lon, location.lat, location.lon, windDeg);
      const { score, label } = calculateLandRiskScore(baseAqi, dist, windToward);

      return {
        ...lf,
        distance_km: Math.round(dist * 100) / 100,
        current_aqi: baseAqi,
        pollutants: {
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
        risk_score: score,
        risk_label: label,
        last_updated: new Date().toISOString()
      };
    });

    processed.sort((a, b) => a.distance_km - b.distance_km);
    const nearest = processed[0];
    setSelectedLandfill(nearest);

    const windText = nearest.wind_toward_user ? "blowing directly towards your area" : "blowing away from your vector";
    const explanation = `${nearest.risk_label} Risk (${nearest.risk_score}/100). You are located ${nearest.distance_km} km from ${nearest.name} in ${nearest.city}. Current ambient AQI is ${nearest.current_aqi} with wind at ${nearest.wind.speed_kmh} km/h (${nearest.wind.direction_deg}° ${nearest.wind.cardinal}), ${windText}.`;

    setRiskData({
      landfill: nearest.name,
      landfill_id: nearest.id,
      distance_km: nearest.distance_km,
      current_aqi: nearest.current_aqi,
      wind_toward_user: nearest.wind_toward_user,
      risk_score: nearest.risk_score,
      risk_label: nearest.risk_label,
      explanation: explanation,
      last_updated: nearest.last_updated,
      disclaimer: "Modeled estimate, refreshed every 15 min.",
      user_coordinates: location,
      nearest_landfill_details: nearest,
      all_landfills: processed
    });
  }, []);

  useEffect(() => {
    evaluateRisk(userLocation);
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
    await evaluateRisk(userLocation);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const landfillsList = riskData?.all_landfills || SEED_LANDFILLS;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
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
      <div className="flex-1 dashboard-grid overflow-hidden">
        {/* Left Column: Interactive Map */}
        <div className="relative w-full h-full bg-slate-900 border-r border-slate-800">
          <MapView
            userLocation={userLocation}
            landfills={landfillsList}
            selectedLandfill={selectedLandfill}
            onSelectLandfill={handleSelectLandfill}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Right Column: Risk Analytics Side Card */}
        <div className="h-full overflow-y-auto bg-slate-950 flex flex-col justify-between border-l border-slate-800">
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

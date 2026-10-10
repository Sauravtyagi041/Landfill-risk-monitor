import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { generatePlumePolygon } from '../utils/riskCalculator';
import { Compass, MapPin, Layers, Radio } from 'lucide-react';

// Custom Marker Icons using SVG strings for high performance and zero external asset breaks
const createLandfillIcon = (riskLabel, isSelected) => {
  let color = '#34d399'; // Low
  if (riskLabel === 'Medium') color = '#fbbf24';
  if (riskLabel === 'High') color = '#fb923c';
  if (riskLabel === 'Severe') color = '#f43f5e';

  const scale = isSelected ? 1.25 : 1.0;
  const stroke = isSelected ? '#ffffff' : 'rgba(0,0,0,0.6)';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${32 * scale}" height="${42 * scale}">
      <defs>
        <filter id="glow-${riskLabel}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path d="M16 0 C7.16 0 0 7.16 0 16 C0 27.5 16 42 16 42 C16 42 32 27.5 32 16 C32 7.16 24.84 0 16 0 Z" fill="${color}" stroke="${stroke}" stroke-width="2" filter="url(#glow-${riskLabel})"/>
      <circle cx="16" cy="16" r="7" fill="#0f172a" />
      <path d="M12 18 L16 11 L20 18 Z" fill="${color}" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-landfill-marker',
    iconSize: [32 * scale, 42 * scale],
    iconAnchor: [16 * scale, 42 * scale],
    popupAnchor: [0, -38 * scale]
  });
};

const userIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-8 h-8 bg-sky-500/30 rounded-full animate-ping"></div>
      <div class="relative w-5 h-5 bg-sky-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  className: 'custom-user-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Map controller to center view smoothly when user or landfill changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Click listener to place user location anywhere on map
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView({
  userLocation,
  landfills,
  selectedLandfill,
  onSelectLandfill,
  onMapClick
}) {
  const [mapTileStyle, setMapTileStyle] = useState('google'); // 'google' | 'hybrid' | 'osm'

  const tileUrls = {
    google: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const selectedLf = landfills.find(l => l.id === (selectedLandfill?.id || landfills[0]?.id)) || landfills[0];

  // Generate plume dispersion polygon for selected landfill based on current wind direction
  const plumePoints = selectedLf
    ? generatePlumePolygon(
        selectedLf.lat,
        selectedLf.lon,
        selectedLf.wind?.direction_deg || 245,
        Math.min(12.0, Math.max(4.0, (selectedLf.distance_km ?? 5.0) * 1.5))
      )
    : [];

  const plumeColor =
    selectedLf?.risk_label === 'Severe'
      ? '#f43f5e'
      : selectedLf?.risk_label === 'High'
      ? '#fb923c'
      : selectedLf?.risk_label === 'Medium'
      ? '#fbbf24'
      : '#34d399';

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapContainer
        center={[userLocation.lat, userLocation.lon]}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={[userLocation.lat, userLocation.lon]} />
        <MapClickHandler onClick={onMapClick} />

        <TileLayer
          attribution='&copy; Google Maps &copy; OpenStreetMap'
          url={tileUrls[mapTileStyle]}
        />

        {/* User Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <p className="font-semibold text-sky-400">Your Location</p>
              <p className="text-slate-300 font-mono text-[10px]">
                {userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Click anywhere on map to reposition location vector</p>
            </div>
          </Popup>
        </Marker>

        {/* Plume / Dispersion Cone Overlay */}
        {plumePoints.length > 0 && (
          <Polygon
            positions={plumePoints}
            pathOptions={{
              color: plumeColor,
              fillColor: plumeColor,
              fillOpacity: 0.25,
              weight: 1.5,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <p className="font-semibold text-amber-400">Plume Dispersion Cone</p>
                <p className="text-[11px] text-slate-300">
                  Wind Direction: {selectedLf?.wind?.direction_deg}° ({selectedLf?.wind?.cardinal})
                </p>
                <p className="text-[10px] text-slate-400">
                  Model predicts primary particulate trajectory extending {selectedLf?.distance_km} km.
                </p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Distance Line from User to Selected Landfill */}
        {selectedLf && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lon],
              [selectedLf.lat, selectedLf.lon]
            ]}
            pathOptions={{
              color: selectedLf.wind_toward_user ? '#f43f5e' : '#38bdf8',
              weight: 2,
              dashArray: '6, 8',
              opacity: 0.8
            }}
          />
        )}

        {/* Landfill Markers */}
        {landfills.map((lf) => {
          const isSelected = selectedLf?.id === lf.id;
          const riskLabel = lf.risk_label || 'Low';
          const distanceKm = lf.distance_km ?? 5.0;
          const currentAqi = lf.current_aqi ?? 120;
          const windSpeed = lf.wind?.speed_kmh ?? 12.0;
          const windCardinal = lf.wind?.cardinal ?? 'SW';

          return (
            <Marker
              key={lf.id}
              position={[lf.lat, lf.lon]}
              icon={createLandfillIcon(riskLabel, isSelected)}
              eventHandlers={{
                click: () => onSelectLandfill(lf)
              }}
            >
              <Popup>
                <div className="p-1.5 font-sans min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1.5">
                    <h3 className="font-bold text-sm text-slate-100">{lf.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold risk-badge-${riskLabel.toLowerCase()}`}>
                      {riskLabel} ({lf.risk_score || 0})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-1">{lf.city}, {lf.country}</p>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div>Distance: <span className="text-sky-400 font-semibold">{distanceKm} km</span></div>
                    <div>AQI: <span className="text-amber-400 font-semibold">{currentAqi}</span></div>
                    <div>Wind: <span className="text-emerald-400">{windSpeed} km/h ({windCardinal})</span></div>
                    <div>Downwind Vector: <span className={lf.wind_toward_user ? 'text-rose-400 font-bold' : 'text-slate-400'}>{lf.wind_toward_user ? 'YES (1.5x factor)' : 'NO'}</span></div>
                  </div>
                  <button
                    onClick={() => onSelectLandfill(lf)}
                    className="w-full mt-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[11px] font-semibold transition-all"
                  >
                    Select & Inspect Risk
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Controls Legend */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setMapTileStyle('google')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            mapTileStyle === 'google'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Google Map
        </button>
        <button
          onClick={() => setMapTileStyle('hybrid')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            mapTileStyle === 'hybrid'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapTileStyle('osm')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            mapTileStyle === 'osm'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          OSM
        </button>
      </div>

      {/* Map Legend Overlay at Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 hidden sm:block max-w-[240px]">
        <div className="flex items-center justify-between font-semibold text-slate-300 border-b border-slate-800 pb-1">
          <span>Exposure Risk Legend</span>
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm"></span>
            <span className="text-slate-300">Low (&lt;25)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span>
            <span className="text-slate-300">Medium (25-49)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm"></span>
            <span className="text-slate-300">High (50-74)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm animate-pulse"></span>
            <span className="text-slate-300">Severe (75+)</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
          Shaded cone represents active plume dispersion vector based on 15-min wind feed.
        </p>
      </div>
    </div>
  );
}

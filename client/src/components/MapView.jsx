import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, CircleMarker, ZoomControl, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { generatePlumePolygon, degreesToCardinal } from '../utils/riskCalculator';
import { Radio, ChevronDown, Map as MapIcon } from 'lucide-react';

const TILE_LAYERS = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

const RISK_COLORS = {
  Low: '#34d399',
  Medium: '#fbbf24',
  High: '#fb923c',
  Severe: '#f43f5e'
};

function createLandfillIcon(riskLabel = 'Low', isSelected = false) {
  const color = RISK_COLORS[riskLabel] || RISK_COLORS.Low;
  const scale = isSelected ? 1.2 : 1;
  const stroke = isSelected ? '#ffffff' : 'rgba(0,0,0,0.65)';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${32 * scale}" height="${42 * scale}">
    <path d="M16 1 C7.7 1 1 7.7 1 16 C1 27 16 41 16 41 C16 41 31 27 31 16 C31 7.7 24.3 1 16 1Z" fill="${color}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="16" cy="16" r="7" fill="#0f172a"/>
    <path d="M12 18 L16 11 L20 18 Z" fill="${color}"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-landfill-marker',
    iconSize: [32 * scale, 42 * scale],
    iconAnchor: [16 * scale, 42 * scale],
    popupAnchor: [0, -38 * scale]
  });
}

const userIcon = L.divIcon({
  html: '<div class="relative flex items-center justify-center w-11 h-11"><div class="absolute w-11 h-11 bg-sky-400/30 rounded-full animate-ping"></div><div class="absolute w-8 h-8 rounded-full border-2 border-white bg-sky-400/50 shadow-[0_0_0_4px_rgba(14,165,233,0.3)]"></div><div class="relative w-5 h-5 bg-sky-500 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center"><div class="w-1 h-1 bg-white rounded-full"></div></div></div>',
  className: 'custom-user-marker',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 0.65 });
  }, [center, map]);
  useEffect(() => {
    const resize = () => map.invalidateSize({ pan: false });
    const timer = window.setTimeout(resize, 100);
    window.addEventListener('resize', resize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [map]);
  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(event) {
      onClick(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

export default function MapView({
  userLocation,
  landfills = [],
  selectedLandfill,
  onSelectLandfill,
  onMapClick
}) {
  const [mapTileStyle, setMapTileStyle] = useState('street');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isWindInfoExpanded, setIsWindInfoExpanded] = useState(false);
  const [isRiskLegendExpanded, setIsRiskLegendExpanded] = useState(false);
  const tileLayer = TILE_LAYERS[mapTileStyle];
  const selectedLf = landfills.find(lf => lf.id === selectedLandfill?.id) || landfills[0];

  const windSpeedKmh = selectedLf?.wind?.speed_kmh == null ? 12 : Number(selectedLf.wind.speed_kmh);
  const plumeRangeKm = Math.round(Math.min(20, Math.max(3, windSpeedKmh * 0.65)) * 10) / 10;
  const windFromDeg = selectedLf?.wind?.direction_deg == null ? 245 : Number(selectedLf.wind.direction_deg);
  const plumeHeading = (windFromDeg + 180) % 360;
  const plumeCardinal = degreesToCardinal(plumeHeading);
  const plumePoints = useMemo(() => {
    if (!selectedLf) return [];
    return generatePlumePolygon(
      selectedLf.lat,
      selectedLf.lon,
      windFromDeg,
      plumeRangeKm,
      52
    );
  }, [selectedLf, windFromDeg, plumeRangeKm]);

  const plumeEndpoint = useMemo(() => {
    if (!selectedLf) return null;
    const angle = (plumeHeading * Math.PI) / 180;
    const lat = selectedLf.lat + (plumeRangeKm * Math.cos(angle)) / 111;
    const lon = selectedLf.lon + (plumeRangeKm * Math.sin(angle)) / (111 * Math.cos((selectedLf.lat * Math.PI) / 180));
    return [lat, lon];
  }, [selectedLf, plumeHeading, plumeRangeKm]);

  const plumeColor = RISK_COLORS[selectedLf?.risk_label] || RISK_COLORS.Low;

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapContainer
        center={[userLocation.lat, userLocation.lon]}
        zoom={11}
        scrollWheelZoom
        preferCanvas
        className="w-full h-full"
        zoomControl={false}
        attributionControl
      >
        <MapController center={[userLocation.lat, userLocation.lon]} />
        <MapClickHandler onClick={onMapClick} />
        <ZoomControl position="bottomright" />

        <TileLayer
          key={mapTileStyle}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
          className={mapTileStyle === 'dark' ? 'landrisk-dark-tiles' : ''}
          updateWhenIdle
          updateWhenZooming={false}
          keepBuffer={2}
        />

        {/* Non-interactive overlays let map clicks pass through to the location picker. */}
        {plumePoints.length > 0 && (
          <Polygon
            positions={plumePoints}
            interactive={false}
            pathOptions={{
              color: plumeColor,
              fillColor: plumeColor,
              fillOpacity: 0.34,
              weight: 2,
              dashArray: '7 5',
              lineCap: 'round'
            }}
          />
        )}

        {selectedLf && plumeEndpoint && (
          <>
            <Polyline
              positions={[[selectedLf.lat, selectedLf.lon], plumeEndpoint]}
              interactive={false}
              pathOptions={{ color: plumeColor, weight: 2, dashArray: '3 6', opacity: 0.8 }}
            />
            <CircleMarker
              center={plumeEndpoint}
              radius={5}
              interactive={false}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: plumeColor, fillOpacity: 1 }}
            />
          </>
        )}

        {selectedLf && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lon],
              [selectedLf.lat, selectedLf.lon]
            ]}
            interactive={false}
            pathOptions={{
              color: selectedLf.wind_toward_user ? '#fb7185' : '#38bdf8',
              weight: 2,
              dashArray: '7 7',
              opacity: 0.9
            }}
          />
        )}

        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} zIndexOffset={2000}>
          <Tooltip permanent direction="top" offset={[0, -18]} className="location-tooltip">
            <span><strong>Assessment location</strong><br />Click map to move</span>
          </Tooltip>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <p className="font-semibold text-sky-400">Assessment location</p>
              <p className="font-mono text-[10px]">{userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°</p>
              <p className="mt-1 text-[10px] text-slate-400">Click the map to move this location.</p>
            </div>
          </Popup>
        </Marker>

        {landfills.map(lf => {
          const isSelected = selectedLf?.id === lf.id;
          const riskLabel = lf.risk_label || 'Low';
          const distanceKm = lf.distance_km ?? 5;
          const currentAqi = lf.current_aqi ?? '—';
          const windSpeed = lf.wind?.speed_kmh ?? '—';
          const windCardinal = lf.wind?.cardinal ?? '—';

          return (
            <Marker
              key={lf.id}
              position={[lf.lat, lf.lon]}
              icon={createLandfillIcon(riskLabel, isSelected)}
              eventHandlers={{ click: () => onSelectLandfill(lf) }}
            >
              <Popup>
                <div className="p-1.5 font-sans min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1.5">
                    <h3 className="font-bold text-sm text-slate-100">{lf.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold risk-badge-${riskLabel.toLowerCase()}`}>
                      {riskLabel} ({lf.risk_score ?? '—'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-1">{lf.city}, {lf.country}</p>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div>Distance: <span className="text-sky-400 font-semibold">{distanceKm} km</span></div>
                    <div>AQI: <span className="text-amber-400 font-semibold">{currentAqi}</span></div>
                    <div>Wind: <span className="text-emerald-400">{windSpeed} km/h ({windCardinal})</span></div>
                    <div>Downwind: <span className={lf.wind_toward_user ? 'text-rose-400 font-bold' : 'text-slate-400'}>{lf.wind_toward_user ? 'Yes' : 'No'}</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectLandfill(lf)}
                    className="w-full mt-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[11px] font-semibold transition-colors"
                  >
                    Select this landfill
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className={"map-layer-control absolute top-4 right-4 z-[500] bg-slate-900/95 border border-slate-700 p-1 rounded-xl shadow-xl " + (isLayerMenuOpen ? 'is-open' : '')}>
        <button
          type="button"
          className="map-layer-menu-trigger flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-slate-100 hover:bg-slate-800"
          aria-label={`Map style: ${TILE_LAYERS[mapTileStyle].name}`}
          aria-expanded={isLayerMenuOpen}
          aria-controls="map-layer-options"
          onClick={() => setIsLayerMenuOpen((open) => !open)}
        >
          <span className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-sky-300" aria-hidden="true" />
            <span>{TILE_LAYERS[mapTileStyle].name}</span>
          </span>
          <ChevronDown className={"map-overlay-chevron w-4 h-4 " + (isLayerMenuOpen ? 'rotate-180' : '')} />
        </button>
        {isLayerMenuOpen && (
          <div id="map-layer-options" className="map-layer-options" role="group" aria-label="Map style">
            {Object.entries(TILE_LAYERS).map(([key, layer]) => (
              <button
                key={key}
                type="button"
                aria-pressed={mapTileStyle === key}
                onClick={() => {
                  setMapTileStyle(key);
                  setIsLayerMenuOpen(false);
                }}
                className={"map-layer-option rounded-lg text-sm font-semibold transition-colors " + (
                  mapTileStyle === key ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                {layer.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={"map-range-card absolute top-4 left-4 z-[500] max-w-[220px] bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs " + (isWindInfoExpanded ? 'is-expanded' : 'is-collapsed')}>
        <button type="button" className="map-overlay-toggle map-range-toggle" aria-expanded={isWindInfoExpanded} onClick={() => setIsWindInfoExpanded((expanded) => !expanded)}>
          <span>Wind impact · up to {plumeRangeKm} km</span>
          <ChevronDown className="map-overlay-chevron w-4 h-4" />
        </button>
        <div className="map-range-details">
          <p className="font-semibold text-slate-100">Estimated wind impact range</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            From {selectedLf?.name || 'the selected landfill'}, wind comes from {windFromDeg}° ({selectedLf?.wind?.cardinal || 'SW'}) at {windSpeedKmh} km/h and carries the plume toward {plumeHeading}° ({plumeCardinal}).
          </p>
          <p className="mt-1 text-xs font-semibold text-sky-300">
            Shaded downwind reach: up to {plumeRangeKm} km
          </p>
          <p className="mt-1 text-[10px] text-slate-400">Indicative model only; actual dispersion varies with weather and terrain.</p>
        </div>
      </div>

      <div className={"map-risk-legend absolute bottom-4 left-4 z-[500] bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-2 " + (isRiskLegendExpanded ? 'is-expanded' : 'is-collapsed')}>
        <button type="button" className="map-overlay-toggle map-legend-toggle" aria-expanded={isRiskLegendExpanded} onClick={() => setIsRiskLegendExpanded((expanded) => !expanded)}>
          <span className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-sky-400" />Risk legend</span>
          <ChevronDown className="map-overlay-chevron w-4 h-4" />
        </button>
        <div className="map-legend-details">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            Risk at landfill sites
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            {Object.entries(RISK_COLORS).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-300">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 border-t border-slate-700 pt-1.5">
            Click an empty area to move your assessment point.
          </p>
        </div>
      </div>
    </div>
  );
}

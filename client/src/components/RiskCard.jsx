import React from 'react';
import PollutantBreakdown from './PollutantBreakdown';
import { ShieldAlert, Wind, Navigation, AlertTriangle, Clock, Info, CheckCircle2, MapPin, Database } from 'lucide-react';

export default function RiskCard({ data, isRefreshing }) {
  if (!data) {
    return (
      <div className="p-6 text-center text-slate-400 font-mono text-xs">
        Loading environmental proximity telemetry...
      </div>
    );
  }

  const {
    landfill,
    distance_km,
    current_aqi,
    wind_toward_user,
    risk_score,
    risk_label,
    explanation,
    last_updated,
    disclaimer,
    nearest_landfill_details,
    data_source
  } = data;

  const lfDetails = nearest_landfill_details || {};
  const wind = lfDetails.wind || { speed_kmh: 12.0, direction_deg: 245, cardinal: 'SW' };
  const pollutants = lfDetails.pollutants || { pm25: 78, pm10: 112, no2: 34, so2: 12, o3: 18 };

  // Gauge needle rotation (score 0 to 100 maps to -90deg to +90deg)
  const needleRotation = -90 + (risk_score / 100) * 180;

  const getRiskColor = (label) => {
    switch (label) {
      case 'Severe': return 'text-rose-500 border-rose-500/40 bg-rose-500/10';
      case 'High': return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
      case 'Medium': return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      default: return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    }
  };

  const getAqiCategory = (aqi) => {
    if (aqi <= 50) return { text: 'Good', color: 'text-emerald-400' };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-amber-400' };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', color: 'text-orange-400' };
    if (aqi <= 200) return { text: 'Unhealthy', color: 'text-rose-400' };
    return { text: 'Very Unhealthy / Hazardous', color: 'text-purple-400' };
  };

  const aqiCat = getAqiCategory(current_aqi);
  const elevatedRisk = risk_label === 'High' || risk_label === 'Severe';
  const moderateRisk = risk_label === 'Medium';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-sans text-slate-100 bg-slate-950/80 backdrop-blur-md border-l border-slate-800/80">
      
      {/* Top Banner: Selected Landfill Overview */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Target Landfill Anchor</span>
            </div>
            <h2 className="text-lg font-bold font-heading text-slate-100">{landfill}</h2>
            <p className="text-xs text-slate-400">{lfDetails.city || 'Delhi Region'}, {lfDetails.country || 'India'}</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-sky-400 shadow">
            {distance_km} km away
          </span>
        </div>

        {/* Capacity & Status pill */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Status: <strong className="text-slate-200">{lfDetails.status || 'Active'}</strong></span>
          <span>Waste: <strong className="text-slate-200">{lfDetails.waste_capacity_tonnes ? (lfDetails.waste_capacity_tonnes / 1000000).toFixed(1) + 'M Tonnes' : '14M Tonnes'}</strong></span>
        </div>
      </div>

      {/* Exposure Risk Score Arc Gauge */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center relative">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-2">
          Personalized Exposure Risk Score
        </span>

        {/* Gauge Arc Graphic */}
        <div className="relative w-48 h-28 mx-auto flex items-end justify-center">
          <svg className="w-48 h-28" viewBox="0 0 100 50">
            {/* Background Arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Colored Gauge Segments */}
            <path d="M 10 50 A 40 40 0 0 1 30 21.7" fill="none" stroke="#34d399" strokeWidth="10" strokeLinecap="round" />
            <path d="M 30 21.7 A 40 40 0 0 1 50 10" fill="none" stroke="#fbbf24" strokeWidth="10" />
            <path d="M 50 10 A 40 40 0 0 1 70 21.7" fill="none" stroke="#fb923c" strokeWidth="10" />
            <path d="M 70 21.7 A 40 40 0 0 1 90 50" fill="none" stroke="#f43f5e" strokeWidth="10" strokeLinecap="round" />
          </svg>

          {/* Score Counter in Center */}
          <div className="absolute bottom-0 text-center">
            <div className="text-3xl font-extrabold font-heading text-slate-100">
              {risk_score}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="mt-3">
          <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md ${getRiskColor(risk_label)}`}>
            {risk_label} Exposure Risk
          </span>
        </div>
      </div>

      {/* Real-time Environmental Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* AQI Panel */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold mb-1">AQI (Model Estimate)</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-slate-100">{current_aqi}</span>
            <span className={`text-[11px] font-semibold ${aqiCat.color}`}>{aqiCat.text}</span>
          </div>
        </div>

        {/* Wind Vector Panel */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>Wind (Current Model)</span>
            <Wind className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-heading text-slate-100">{wind.speed_kmh}</span>
            <span className="text-xs text-slate-400">km/h</span>
            <span className="text-xs font-mono text-emerald-400 ml-auto font-semibold">
              {wind.direction_deg}° ({wind.cardinal})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-slate-400">
        <span className={data_source?.includes('unavailable') ? 'text-amber-300' : 'text-emerald-300'}>
          {data_source?.includes('unavailable') ? 'Live feed unavailable · demo values' : 'Current provider model data'}
        </span>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-sky-300">
          Open-Meteo source
        </a>
      </div>

      {/* Downwind Risk Factor Indicator */}
      <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
        wind_toward_user
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
      }`}>
        <div className="flex items-center gap-2">
          <Navigation className={`w-4 h-4 ${wind_toward_user ? 'rotate-[45deg] text-rose-400' : 'text-emerald-400'}`} />
          <span>
            {wind_toward_user
              ? 'Wind blowing TOWARD your vector (1.5x Multiplier)'
              : 'Wind blowing away from your location (1.0x Base)'}
          </span>
        </div>
        <span className="font-mono font-bold">{wind_toward_user ? 'HIGH IMPACT' : 'NORMAL'}</span>
      </div>

      {/* Context-aware safety advisory */}
      <section
        role="status"
        aria-live="polite"
        className={`p-4 rounded-xl border space-y-2 ${
          elevatedRisk
            ? 'bg-amber-500/10 border-amber-400/40'
            : 'bg-sky-500/10 border-sky-400/30'
        }`}
      >
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${
          elevatedRisk ? 'text-amber-300' : 'text-sky-300'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span>{elevatedRisk ? 'Air quality action reminder' : 'Outdoor activity check'}</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-200">
          {elevatedRisk
            ? `The modeled risk near ${landfill} is ${risk_label.toLowerCase()}. Consider delaying strenuous outdoor activity and check your local official AQI before heading out.`
            : moderateRisk
            ? 'The model shows moderate relative risk here. Consider keeping outdoor exertion shorter if local particle pollution is elevated.'
            : 'The model shows lower relative risk here, but it is not an all-clear. Check local official air-quality updates before making outdoor plans.'}
        </p>
        {elevatedRisk && (
          <div className="rounded-lg bg-slate-950/60 border border-amber-400/20 p-3">
            <p className="text-xs font-semibold text-amber-200">Mask reminder for particle pollution</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              If going outside during high particle pollution is unavoidable, a well-fitting N95 respirator may reduce particle exposure. It does not protect against gases or vapors.
            </p>
          </div>
        )}
        <a
          href="https://www.epa.gov/wildfires/protect-yourself-wildfire-smoke-and-ash"
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-[11px] font-semibold text-sky-300 underline underline-offset-2 hover:text-sky-200"
        >
          EPA guidance on reducing particle exposure
        </a>
        <p className="text-[10px] text-slate-400">
          General information only. This prototype uses modeled readings and is not a public-health alert.
        </p>
      </section>

      {/* Key Contributing Factors List */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Key Contributing Factors</h4>
        <ul className="text-xs space-y-1.5 text-slate-300">
          <li className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-400">Distance Decay ({distance_km} km)</span>
            <span className="font-mono font-semibold text-sky-400">{(1.0 / Math.max(distance_km, 0.3)).toFixed(3)}x</span>
          </li>
          <li className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-400">Wind Direction Vector</span>
            <span className={`font-mono font-semibold ${wind_toward_user ? 'text-rose-400' : 'text-emerald-400'}`}>
              {wind_toward_user ? 'Towards You (1.5x)' : 'Safe Angle (1.0x)'}
            </span>
          </li>
          <li className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-400">Ambient AQI Base</span>
            <span className="font-mono font-semibold text-amber-400">{current_aqi}</span>
          </li>
        </ul>
      </div>

      {/* Pollutant Breakdown Component */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800">
        <PollutantBreakdown pollutants={pollutants} />
      </div>

      {/* Plain Language Explanation */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
          <Info className="w-4 h-4" />
          <span>Exposure Narrative & Recommendation</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800">
          {explanation}
        </p>
      </div>

      {/* Timestamp & Mandatory Disclaimer */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3 text-sky-400" />
            Last data refresh:
          </span>
          <span className="text-slate-300">{new Date(last_updated).toLocaleTimeString()}</span>
        </div>
        <p className="text-[10px] text-amber-400/90 font-sans italic pt-1 border-t border-slate-800">
          {disclaimer}
        </p>
      </div>

    </div>
  );
}

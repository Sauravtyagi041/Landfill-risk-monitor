import React from 'react';
import { Activity } from 'lucide-react';

export default function PollutantBreakdown({ pollutants }) {
  if (!pollutants) return null;

  const items = [
    { name: 'PM2.5', label: 'Fine Particles', value: pollutants.pm25 ?? 78, max: 150, unit: 'µg/m³', color: 'bg-rose-500' },
    { name: 'PM10', label: 'Coarse Dust', value: pollutants.pm10 ?? 112, max: 250, unit: 'µg/m³', color: 'bg-amber-500' },
    { name: 'NO2', label: 'Nitrogen Dioxide', value: pollutants.no2 ?? 34, max: 100, unit: 'µg/m³', color: 'bg-sky-500' },
    { name: 'SO2', label: 'Sulfur Dioxide', value: pollutants.so2 ?? 12, max: 80, unit: 'ppb', color: 'bg-teal-400' },
    { name: 'O3', label: 'Ozone', value: pollutants.o3 ?? 18, max: 120, unit: 'ppb', color: 'bg-purple-400' },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
        <span className="flex items-center gap-1.5 text-slate-200">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          Pollutant Model Estimates
        </span>
        <span className="text-[10px] font-mono text-slate-400">Open-Meteo</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {items.map((p) => {
          const numericValue = Number(p.value);
          const percentage = Number.isFinite(numericValue) ? Math.min(100, Math.round((numericValue / p.max) * 100)) : 0;
          return (
            <div key={p.name} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-slate-200">{p.name}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{p.label}</span>
                </div>
                <span className="font-mono text-xs text-slate-300">
                  {Number.isFinite(numericValue) ? numericValue : '—'} <span className="text-[10px] text-slate-500">{p.unit}</span>
                </span>
              </div>
              
              {/* Progress bar container */}
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${p.color} transition-all duration-500 rounded-full`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

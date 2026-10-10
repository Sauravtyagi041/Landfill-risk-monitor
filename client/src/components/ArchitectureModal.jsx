import React from 'react';
import { X, Server, Database, Clock, Key, Cpu, Radio, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold font-heading text-slate-100">
              AWS Native Serverless System Architecture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Architecture Pipeline Visualizer */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              End-to-End Data Pipeline Architecture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">

              {/* Step 1: Data Sources */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-sky-400 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" />
                  1. Data Feeds
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li className="bg-slate-900 p-1.5 rounded border border-slate-800/80">WAQI API (AQI)</li>
                  <li className="bg-slate-900 p-1.5 rounded border border-slate-800/80">OpenWeather (Wind)</li>
                  <li className="bg-slate-900 p-1.5 rounded border border-slate-800/80">Landfill Seed JSON</li>
                </ul>
              </div>

              {/* Step 2: EventBridge & Secrets */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  2. Automation
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800/80">
                    EventBridge Cron (every 15 min)
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800/80 flex items-center gap-1 text-amber-400">
                    <Key className="w-3 h-3" />
                    AWS Secrets Manager
                  </div>
                </div>
              </div>

              {/* Step 3: DynamoDB Caching */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  3. DynamoDB
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li className="bg-slate-900 p-1.5 rounded border border-slate-800/80">LandfillsTable</li>
                  <li className="bg-slate-900 p-1.5 rounded border border-slate-800/80">AQICacheTable (24h TTL)</li>
                </ul>
              </div>

              {/* Step 4: Risk Calculator Lambda */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  4. Risk Lambda
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800/80 font-mono">
                  Calculates formula:<br />
                  <span className="text-sky-300">AQI × (1/dist) × wind_factor</span>
                </div>
              </div>

              {/* Step 5: Frontend React Leaflet */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-rose-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  5. Client App
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800/80 font-mono">
                  React + Leaflet on AWS Amplify (Zero external API hits)
                </div>
              </div>

            </div>
          </div>

          {/* Modular Extensibility Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Modular Expansion & Future Integrations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-sky-400 block mb-1">OpenAQ Integration</span>
                <p className="text-slate-400 text-[11px]">
                  Plug secondary open air quality monitoring stations into RefreshCache Lambda without altering API Gateway contracts.
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-emerald-400 block mb-1">Sentinel-5P Satellite</span>
                <p className="text-slate-400 text-[11px]">
                  Incorporate satellite methane (CH4) hotspot plume data to augment wind factor calculation.
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-purple-400 block mb-1">AWS IoT Core Sensors</span>
                <p className="text-slate-400 text-[11px]">
                  Stream hyper-local ground truth sensors near landfill perimeters directly into DynamoDB cache table.
                </p>
              </div>
            </div>
          </div>

          {/* Infrastructure SAM Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-sky-400 font-bold font-sans">AWS Infrastructure Provisioning:</div>
            <div>• SAM Template: <span className="text-slate-400">/infra/template.yaml</span></div>
            <div>• Handlers: <span className="text-slate-400">/infra/src/handlers/get_risk.py, refresh_cache.py</span></div>
            <div>• Free Tier Target: <span className="text-emerald-400">Deployable under AWS Free Tier (1M Lambda requests/mo, 25GB DynamoDB)</span></div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-all"
          >
            Close Diagram
          </button>
        </div>

      </div>
    </div>
  );
}

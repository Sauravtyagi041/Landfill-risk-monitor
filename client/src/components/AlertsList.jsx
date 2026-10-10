import React from 'react';
import { Bell, Wind, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

export default function AlertsList({ alerts }) {
  const defaultAlerts = [
    {
      id: 1,
      title: 'Wind Shift Detected',
      time: 'Today, 10:24 AM',
      description: 'Wind direction has shifted southwest towards your vector. Risk level adjusted.',
      type: 'warning',
      icon: Wind
    },
    {
      id: 2,
      title: 'AQI Exceeded Threshold',
      time: 'Today, 08:12 AM',
      description: 'PM2.5 elevated to 78 µg/m³ (Unhealthy). Consider limiting prolonged outdoor activities.',
      type: 'danger',
      icon: AlertTriangle
    },
    {
      id: 3,
      title: 'AWS EventBridge Cache Refresh',
      time: '15 min ago',
      description: 'DynamoDB AQICacheTable synchronized with latest WAQI & OpenWeather feeds.',
      type: 'info',
      icon: RefreshCw
    }
  ];

  const list = alerts && alerts.length > 0 ? alerts : defaultAlerts;

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold font-heading text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Bell className="w-3.5 h-3.5 text-sky-400" />
          Alerts & Notifications
        </h3>
        <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
          Live Stream
        </span>
      </div>

      <div className="space-y-2">
        {list.map((item) => {
          const Icon = item.icon || Bell;
          const isDanger = item.type === 'danger';
          const isWarning = item.type === 'warning';

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                isDanger
                  ? 'bg-rose-500/10 border-rose-500/30 text-slate-200'
                  : isWarning
                  ? 'bg-amber-500/10 border-amber-500/30 text-slate-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Icon className={`w-3.5 h-3.5 ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-sky-400'}`} />
                  <span>{item.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pl-5">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

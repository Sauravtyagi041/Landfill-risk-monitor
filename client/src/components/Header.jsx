import React, { useState } from 'react';
import { ShieldAlert, LocateFixed, Search, Server, RefreshCw, Layers } from 'lucide-react';

export default function Header({ onUseLocation, onSearchLocation, onOpenArchitecture, lastUpdated, isRefreshing, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearchLocation(searchTerm.trim());
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 relative shadow-lg">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 p-0.5 shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-sky-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading tracking-tight bg-gradient-to-r from-sky-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              LandRisk
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              AWS Serverless v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Landfill Proximity & Exposure Prediction System
          </p>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search city, landfill or coordinates (e.g. Ghazipur, Delhi)..."
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </form>
      </div>

      {/* Action Controls & Live Status */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUseLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-all"
          title="Detect Current GPS Location"
        >
          <LocateFixed className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">My Location</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all disabled:opacity-50"
          title="Force refresh 15-min cache"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
        </button>

        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all"
          title="Inspect AWS System Architecture"
        >
          <Server className="w-4 h-4" />
          <span className="hidden lg:inline">AWS Architecture</span>
        </button>
      </div>
    </header>
  );
}

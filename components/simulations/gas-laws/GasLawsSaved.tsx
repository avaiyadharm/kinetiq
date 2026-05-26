"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bookmark, Save, Trash2, FolderOpen, Play, Calendar } from "lucide-react";

interface SavedRun {
  id: string;
  name: string;
  timestamp: string;
  temperature: number;
  volume: number;
  particleCount: number;
  regime: string;
  gasPreset: string;
  enableCollisions: boolean;
  attractiveForce: number;
  gravity: number;
  friction: number;
  elasticity: number;
  particleMode: string;
  showTrails: boolean;
  showHeatMap: boolean;
  enableSound: boolean;
  showCollisionRings: boolean;
}

interface GasLawsSavedProps {
  // Current values to save
  temperature: number;
  volume: number;
  particleCount: number;
  regime: string;
  gasPreset: string;
  enableCollisions: boolean;
  attractiveForce: number;
  gravity: number;
  friction: number;
  elasticity: number;
  particleMode: string;
  showTrails: boolean;
  showHeatMap: boolean;
  enableSound: boolean;
  showCollisionRings: boolean;
  
  // Callback to load values
  onLoadRun: (run: SavedRun) => void;
}

export const GasLawsSaved: React.FC<GasLawsSavedProps> = ({
  temperature,
  volume,
  particleCount,
  regime,
  gasPreset,
  enableCollisions,
  attractiveForce,
  gravity,
  friction,
  elasticity,
  particleMode,
  showTrails,
  showHeatMap,
  enableSound,
  showCollisionRings,
  onLoadRun
}) => {
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [runName, setRunName] = useState("");
  const [message, setMessage] = useState("");

  // Load runs from localstorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kinetiq_gas_laws_runs");
      if (stored) {
        setSavedRuns(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved runs from localStorage", e);
    }
  }, []);

  const saveRunsToLocalStorage = (runs: SavedRun[]) => {
    try {
      localStorage.setItem("kinetiq_gas_laws_runs", JSON.stringify(runs));
      setSavedRuns(runs);
    } catch (e) {
      console.error("Failed to save runs to localStorage", e);
    }
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = runName.trim() || `SOP-THERMO-${Math.floor(100 + Math.random() * 900)}`;
    
    const newRun: SavedRun = {
      id: Math.random().toString(36).substring(2, 9),
      name: nameToUse,
      timestamp: new Date().toLocaleString(),
      temperature,
      volume,
      particleCount,
      regime,
      gasPreset,
      enableCollisions,
      attractiveForce,
      gravity,
      friction,
      elasticity,
      particleMode,
      showTrails,
      showHeatMap,
      enableSound,
      showCollisionRings
    };

    const updated = [newRun, ...savedRuns];
    saveRunsToLocalStorage(updated);
    setRunName("");
    setMessage("Current experiment state archived successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteRun = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent loading
    const updated = savedRuns.filter((r) => r.id !== id);
    saveRunsToLocalStorage(updated);
  };

  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto">
      <div className="max-w-[1000px] mx-auto px-6 md:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/[0.06] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.25em] mb-1">Experiment Archive</div>
            <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-widest text-white">
              Saved Experiments & Runs
            </h2>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              Save your current thermodynamic calibration values, active regime, and microstate constraints for rapid recalls.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Save form */}
          <div className="md:col-span-1 bg-[#141416] border border-white/[0.06] rounded-2xl p-5 h-fit space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2 border-b border-white/5 pb-3">
              <Save className="w-3.5 h-3.5 text-primary" /> Save Current Macrostate
            </h3>

            <form onSubmit={handleSaveCurrent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Experiment Label</label>
                <input
                  type="text"
                  placeholder="e.g., ISO-BOYLE-HE"
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  className="w-full bg-black/45 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary font-mono"
                />
              </div>

              {/* Show preview list of what will be saved */}
              <div className="bg-black/30 border border-white/[0.03] p-3 rounded-xl space-y-1.5 text-[9px] font-mono text-white/50">
                <div className="text-white/35 font-bold uppercase tracking-wider mb-1">State Preview</div>
                <div className="flex justify-between"><span>Regime:</span><span className="text-emerald-400 font-bold uppercase">{regime}</span></div>
                <div className="flex justify-between"><span>Preset:</span><span className="text-cyan-400 font-bold uppercase">{gasPreset}</span></div>
                <div className="flex justify-between"><span>Mode:</span><span className="text-indigo-400 font-bold uppercase">{particleMode}</span></div>
                <div className="flex justify-between"><span>Temp T:</span><span className="text-white font-bold">{Math.round(temperature)} K</span></div>
                <div className="flex justify-between"><span>Vol V:</span><span className="text-white font-bold">{volume.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Particles N:</span><span className="text-white font-bold">{particleCount}</span></div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white hover:bg-primary/95 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Lab Session
              </button>
            </form>

            {message && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase text-center rounded-xl animate-pulse">
                {message}
              </div>
            )}
          </div>

          {/* List of saved runs */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2 border-b border-white/5 pb-3">
              <FolderOpen className="w-4 h-4 text-emerald-500" /> Archived Experiment Sessions ({savedRuns.length})
            </h3>

            {savedRuns.length === 0 ? (
              <div className="bg-[#141416] border border-dashed border-white/5 rounded-2xl p-12 text-center">
                <Bookmark className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/40 font-mono uppercase tracking-widest">No experiment sessions archived yet</p>
                <p className="text-[10px] text-white/20 mt-1">Calibrate physical values and save them to local cache.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {savedRuns.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => onLoadRun(run)}
                    className="bg-[#141416] hover:bg-[#1b1b1e] border border-white/[0.04] hover:border-primary/20 rounded-2xl p-4 transition-all cursor-pointer flex justify-between items-start group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold font-mono text-white text-xs tracking-wider uppercase group-hover:text-primary transition-colors">
                          {run.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-white/30 uppercase">
                          <Calendar className="w-3 h-3" />
                          {run.timestamp}
                        </div>
                      </div>

                      {/* Config summary details */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[8.5px] font-bold font-mono bg-white/5 text-emerald-400 border border-white/5 px-2 py-0.5 rounded uppercase">
                          Regime: {run.regime}
                        </span>
                        <span className="text-[8.5px] font-bold font-mono bg-white/5 text-cyan-400 border border-white/5 px-2 py-0.5 rounded uppercase">
                          Preset: {run.gasPreset}
                        </span>
                        <span className="text-[8.5px] font-bold font-mono bg-white/5 text-indigo-400 border border-white/5 px-2 py-0.5 rounded uppercase">
                          Mode: {run.particleMode}
                        </span>
                        <span className="text-[8.5px] font-mono bg-black/40 text-white/50 px-2 py-0.5 rounded">
                          T = {Math.round(run.temperature)}K
                        </span>
                        <span className="text-[8.5px] font-mono bg-black/40 text-white/50 px-2 py-0.5 rounded">
                          V = {run.volume.toFixed(2)}
                        </span>
                        <span className="text-[8.5px] font-mono bg-black/40 text-white/50 px-2 py-0.5 rounded">
                          N = {run.particleCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onLoadRun(run); }}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/10 transition-all"
                        title="Load experiment config"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRun(run.id, e)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/10 transition-all"
                        title="Delete run from cache"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

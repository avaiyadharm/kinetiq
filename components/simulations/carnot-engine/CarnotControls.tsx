"use client";

import React from "react";
import { useCarnotStore } from "@/store/carnotStore";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { CarnotEngineCore } from "@/lib/physics/carnot";

export const CarnotControls: React.FC = () => {
  const { TH, TC, setTH, setTC, isPlaying, setPlaying, playbackSpeed, setPlaybackSpeed, reset } = useCarnotStore();
  
  // Need theoretical efficiency for display
  const engine = new CarnotEngineCore(1.0, TH, TC);
  const efficiency = engine.getTheoreticalEfficiency();

  return (
    <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Thermodynamic State</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-white/60 font-bold uppercase tracking-wider">Hot Reservoir (T_H)</label>
              <span className="text-xs text-red-400 font-mono">{TH} K</span>
            </div>
            <input 
              type="range" 
              min={350} 
              max={1000} 
              value={TH} 
              onChange={(e) => setTH(Number(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-white/60 font-bold uppercase tracking-wider">Cold Reservoir (T_C)</label>
              <span className="text-xs text-blue-400 font-mono">{TC} K</span>
            </div>
            <input 
              type="range" 
              min={100} 
              max={400} 
              value={TC} 
              onChange={(e) => setTC(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Max Efficiency</span>
          <span className="text-sm text-emerald-400 font-mono font-bold">{(efficiency * 100).toFixed(1)}%</span>
        </div>
        <div className="text-[10px] text-white/40 font-mono text-right">
          η = 1 - (T_C / T_H)
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-between gap-2">
        <button 
          onClick={() => setPlaying(!isPlaying)}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button 
          onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 0.5 : 1)}
          className="bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 px-4 rounded-lg font-bold text-sm transition-colors"
          title="Playback Speed"
        >
          <FastForward className="w-4 h-4 text-emerald-400" />
          {playbackSpeed}x
        </button>
        <button 
          onClick={reset}
          className="bg-white/5 hover:bg-white/10 text-white flex items-center justify-center px-4 rounded-lg transition-colors"
          title="Reset Cycle"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

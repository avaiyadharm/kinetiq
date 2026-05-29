"use client";

import React from "react";
import { useThermalExpansionStore, ExperimentMode, ShapeType } from "@/store/thermalExpansionStore";
import { MATERIAL_DATABASE } from "@/lib/physics/thermalExpansion";
import { Play, Pause, RotateCcw, FastForward, Flame, ShieldAlert, Sparkles, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

export const ThermalExpansionControls: React.FC = () => {
  const {
    temperature,
    targetTemperature,
    setTargetTemperature,
    materialId,
    setMaterialId,
    objectType,
    setObjectType,
    constraint,
    setConstraint,
    experimentMode,
    setExperimentMode,
    isPlaying,
    setConfig,
    playbackSpeed,
    reset,
    triggerThermalShock,
    isBroken
  } = useThermalExpansionStore();

  const currentMaterial = MATERIAL_DATABASE[materialId];

  const handleSpeedToggle = () => {
    let nextSpeed = 1.0;
    if (playbackSpeed === 1.0) nextSpeed = 2.0;
    else if (playbackSpeed === 2.0) nextSpeed = 5.0;
    else if (playbackSpeed === 5.0) nextSpeed = 0.5;
    else nextSpeed = 1.0;
    setConfig("playbackSpeed", nextSpeed);
  };

  const handleBurnerPreset = (temp: number) => {
    setTargetTemperature(temp);
  };

  const handleShockTrigger = (temp: number) => {
    triggerThermalShock(temp);
  };

  const modesList: { id: ExperimentMode; name: string }[] = [
    { id: "free", name: "1. Free Expansion" },
    { id: "fixed", name: "2. Fixed Endpoints" },
    { id: "bridge", name: "3. Bridge Joint Expansion" },
    { id: "railway", name: "4. Railway Buckling" },
    { id: "bimetallic", name: "5. Bimetallic Strip Bending" },
    { id: "shock", name: "6. Thermal Shock test" },
    { id: "cryo", name: "7. Cryogenic Contraction" },
    { id: "fatigue", name: "8. Cyclic Fatigue Loading" },
    { id: "space", name: "9. Spacecraft Sunlight Flux" },
    { id: "precision", name: "10. Precision Engineering" },
  ];

  return (
    <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 flex flex-col gap-5 shrink-0 select-none">
      
      {/* 1. Experiment Mode Picker */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Active Laboratory Experiment</h4>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-[170px] overflow-y-auto pr-1 no-scrollbar">
          {modesList.map((m) => (
            <button
              key={m.id}
              onClick={() => setExperimentMode(m.id)}
              className={cn(
                "px-3 py-2 text-left rounded-lg text-[10px] font-bold transition-all border",
                experimentMode === m.id
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                  : "bg-black/20 border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Thermodynamic Heat Source Controls */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            Thermostat Controls
          </span>
          <span className="text-xs text-amber-400 font-mono font-black">
            {targetTemperature.toFixed(0)} K / {(targetTemperature - 273.15).toFixed(0)} °C
          </span>
        </div>

        {experimentMode === "fatigue" || experimentMode === "space" ? (
          <div className="bg-black/30 px-3 py-2.5 rounded-xl border border-white/5 text-[10px] text-white/40 leading-relaxed font-mono">
            {experimentMode === "fatigue" ? (
              <span className="text-cyan-400/80 animate-pulse">
                &gt;&gt; Automated cyclic heating oscillator running (100 K &lt;-&gt; 650 K)
              </span>
            ) : (
              <span className="text-amber-400/80 animate-pulse">
                &gt;&gt; Low Earth Orbit simulation running. Alternating solar radiation flux.
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="range"
              min={10}
              max={1500}
              value={targetTemperature}
              onChange={(e) => setTargetTemperature(Number(e.target.value))}
              disabled={isBroken}
              className="w-full accent-cyan-500"
            />
            {/* Quick Heat Burner Presets */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "Liquid Helium", value: 4.2 },
                { label: "Liq. Nitrogen", value: 77.15 },
                { label: "Ice Point", value: 273.15 },
                { label: "Standard Ref", value: 293.15 },
                { label: "Boiling Water", value: 373.15 },
                { label: "High Oven", value: 650 },
                { label: "Extreme Melt", value: 1200 }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => handleBurnerPreset(item.value)}
                  disabled={isBroken}
                  className="bg-black/30 hover:bg-white/5 border border-white/5 text-[9px] px-2 py-1 rounded font-mono text-white/70"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Special Heat-Shock Trigger Buttons */}
      {experimentMode === "shock" && (
        <div className="border-t border-white/5 pt-4 flex gap-2">
          <button
            onClick={() => handleShockTrigger(77.15)}
            className="flex-1 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/20 text-blue-400 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Liquid Nitrogen Quench (77K)
          </button>
          <button
            onClick={() => handleShockTrigger(900)}
            className="flex-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            Direct Torch Melt (900K)
          </button>
        </div>
      )}

      {/* 4. Playback and Simulator Control Buttons */}
      <div className="border-t border-white/5 pt-4 flex gap-2">
        <button
          onClick={() => setConfig("isPlaying", !isPlaying)}
          className="flex-1 bg-white/10 hover:bg-white/15 border border-white/5 text-white flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-colors"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? "Pause Engine" : "Resume Engine"}
        </button>
        <button
          onClick={handleSpeedToggle}
          className="bg-black/35 hover:bg-white/5 border border-white/5 text-white flex items-center justify-center gap-1.5 px-3.5 rounded-xl font-bold text-[11px] transition-colors"
          title="Playback SpeedMultiplier"
        >
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
          {playbackSpeed}x
        </button>
        <button
          onClick={reset}
          className="bg-black/35 hover:bg-white/5 border border-white/5 text-white flex items-center justify-center px-3.5 rounded-xl transition-colors"
          title="Reset Simulation Room"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

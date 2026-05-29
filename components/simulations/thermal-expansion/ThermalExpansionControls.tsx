"use client";

import React from "react";
import { useThermalExpansionStore, ExperimentMode } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";
import { Play, Pause, RotateCcw, FastForward, Flame, ShieldAlert, Thermometer, Zap, FlaskConical, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export const ThermalExpansionControls: React.FC = () => {
  const {
    avgTemperature,
    targetTemperature,
    setTargetTemperature,
    materialId,
    setMaterialId,
    objectType,
    experimentMode,
    setExperimentMode,
    isPlaying,
    setConfig,
    playbackSpeed,
    reset,
    triggerThermalShock,
    isFailed,
    bimetallicMat1,
    bimetallicMat2,
    heatingMode,
    setHeatingMode,
    vizSettings,
    setVizSetting,
    heatingRate,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];
  const alpha = mat ? PhysicsEngine.alpha(mat, avgTemperature) : 0;

  const handleSpeedToggle = () => {
    const speeds = [0.5, 1.0, 2.0, 5.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setConfig("playbackSpeed", speeds[nextIdx]);
  };

  const experiments: { id: ExperimentMode; label: string; description: string }[] = [
    { id: "free_expansion",   label: "1. Free Expansion",       description: "σ = 0 · ΔL = αL₀ΔT" },
    { id: "fixed_constraint", label: "2. Fixed Endpoints",      description: "σ = EαΔT" },
    { id: "bridge_gap",       label: "3. Bridge Expansion Gap", description: "gap → constraint" },
    { id: "railway_buckling", label: "4. Railway Buckling",     description: "P_cr = π²EI/(KL)²" },
    { id: "bimetallic",       label: "5. Bimetallic Strip",     description: "κ = Timoshenko" },
    { id: "thermal_shock",    label: "6. Thermal Shock",        description: "∂T/∂t = α_th ∂²T/∂x²" },
    { id: "cryogenic",        label: "7. Cryogenic Contraction",description: "ΔT < 0 → shrink" },
    { id: "fatigue",          label: "8. Cyclic Fatigue",       description: "D = Σ(n/N_f)" },
    { id: "spacecraft",       label: "9. Spacecraft Thermal",   description: "orbital cycling" },
    { id: "precision",        label: "10. Precision Eng.",      description: "Invar — min drift" },
  ];

  const tempPresets = [
    { label: "4.2 K", value: 4.2, desc: "He boiling" },
    { label: "77 K", value: 77.15, desc: "LN₂" },
    { label: "193 K", value: 193, desc: "Dry ice" },
    { label: "273 K", value: 273.15, desc: "Ice point" },
    { label: "293 K", value: 293.15, desc: "Ambient" },
    { label: "373 K", value: 373.15, desc: "Steam pt" },
    { label: "600 K", value: 600, desc: "Hot oven" },
    { label: "1000 K", value: 1000, desc: "Furnace" },
  ];

  return (
    <div className="bg-[#18181b] rounded-2xl border border-white/5 flex flex-col gap-0 overflow-hidden shrink-0 select-none">

      {/* ── 1. Experiment Modes ── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
          <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest">Experiment Mode</h4>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-[172px] overflow-y-auto no-scrollbar">
          {experiments.map(e => (
            <button
              key={e.id}
              onClick={() => setExperimentMode(e.id)}
              className={cn(
                "px-2.5 py-2 text-left rounded-lg transition-all border",
                experimentMode === e.id
                  ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                  : "bg-black/20 border-white/5 text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="text-[9px] font-bold leading-tight">{e.label}</div>
              <div className="text-[7.5px] text-white/30 mt-0.5 font-mono">{e.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Material Selector ── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest">
            {objectType === "bimetallic" ? "Bimetallic Materials" : "Material"}
          </h4>
        </div>

        {objectType === "bimetallic" ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "bimetallicMat1" as const, label: "Top Layer" },
              { key: "bimetallicMat2" as const, label: "Bot Layer" }
            ].map(({ key, label }) => (
              <div key={key}>
                <div className="text-[8px] text-white/30 mb-1 font-mono">{label}</div>
                <select
                  value={key === "bimetallicMat1" ? bimetallicMat1 : bimetallicMat2}
                  onChange={e => setConfig(key, e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none"
                >
                  {Object.entries(MATERIAL_DB).map(([id, m]) => (
                    <option key={id} value={id}>{m.name.split(" ")[0]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <>
            <select
              value={materialId}
              onChange={e => setMaterialId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none"
            >
              {Object.entries(MATERIAL_DB).map(([id, m]) => (
                <option key={id} value={id}>{m.name} — α={( m.alpha0 * 1e6).toFixed(1)}×10⁻⁶/K</option>
              ))}
            </select>
            {mat && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                <span className="text-[8px] font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5 text-white/40">
                  E = {(mat.youngsModulus / 1e9).toFixed(0)} GPa
                </span>
                <span className="text-[8px] font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5 text-white/40">
                  σ_y = {(mat.yieldStrength / 1e6).toFixed(0)} MPa
                </span>
                <span className="text-[8px] font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5 text-cyan-400/60">
                  α = {(alpha * 1e6).toFixed(2)}×10⁻⁶/K
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 3. Temperature Controls ── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest">Thermostat</h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-black text-amber-400">{targetTemperature.toFixed(0)} K</span>
            <span className="text-[8px] text-white/30 font-mono ml-1.5">{(targetTemperature - 273.15).toFixed(0)}°C</span>
          </div>
        </div>

        {experimentMode === "fatigue" || experimentMode === "spacecraft" ? (
          <div className="bg-black/30 px-3 py-2.5 rounded-xl border border-white/5 text-[9px] text-white/40 font-mono animate-pulse">
            {experimentMode === "fatigue"
              ? "Auto-cycling: 98 K ↔ 648 K (fatigue protocol)"
              : "Auto-cycling: sunlight (390 K) ↔ shadow (120 K)"}
          </div>
        ) : (
          <>
            <input
              type="range"
              min={5}
              max={mat ? Math.min(mat.meltingPoint * 0.95, 1800) : 1800}
              step={1}
              value={targetTemperature}
              onChange={e => setTargetTemperature(Number(e.target.value))}
              disabled={isFailed}
              className="w-full accent-amber-500 mb-2.5"
            />
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {tempPresets.map(p => (
                <button
                  key={p.label}
                  onClick={() => setTargetTemperature(p.value)}
                  disabled={isFailed}
                  className="bg-black/30 hover:bg-white/5 border border-white/5 text-[8px] px-2 py-1 rounded font-mono text-white/60 hover:text-white transition-colors"
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Heating Rate Slider */}
            <div className="mt-3.5 pt-3.5 border-t border-white/5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Heating Rate</span>
                <span className="text-[9px] font-mono font-bold text-amber-400">{heatingRate} K/s</span>
              </div>
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={heatingRate}
                onChange={e => setConfig("heatingRate", Number(e.target.value))}
                disabled={isFailed}
                className="w-full accent-amber-500"
              />
            </div>
          </>
        )}
      </div>

      {/* ── 4. Heating Mode ── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3 h-3 text-cyan-400/60" />
          <h4 className="text-[8.5px] font-black text-white/40 uppercase tracking-widest">Heat Diffusion Mode</h4>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "left" as const, label: "One-end", desc: "∂T/∂t diffusion" },
            { id: "both" as const, label: "Both ends", desc: "symmetric" },
            { id: "uniform" as const, label: "Uniform", desc: "instant" },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setHeatingMode(m.id)}
              className={cn(
                "py-1.5 px-1 rounded-lg text-center border text-[8px] font-bold transition-all",
                heatingMode === m.id
                  ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
                  : "bg-black/20 border-white/5 text-white/40 hover:text-white"
              )}
              title={m.desc}
            >
              <div>{m.label}</div>
              <div className="text-[6.5px] font-mono text-white/25 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 5. Visual Magnification ── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex justify-between items-center mb-1.5">
          <h4 className="text-[8.5px] font-black text-white/40 uppercase tracking-widest">Visual Magnification</h4>
          <span className="text-[9px] font-mono font-black text-cyan-400">×{vizSettings.magnification}</span>
        </div>
        <input
          type="range"
          min={1}
          max={1000}
          step={1}
          value={vizSettings.magnification}
          onChange={e => {
            setVizSetting("magnification", Number(e.target.value));
            setVizSetting("autoMagnification", false);
          }}
          disabled={vizSettings.autoMagnification}
          className="w-full accent-cyan-500 mb-2"
        />
        <div className="flex gap-1.5 flex-wrap">
          {[1, 10, 50, 100, 200, 500].map(m => (
            <button
              key={m}
              onClick={() => { setVizSetting("magnification", m); setVizSetting("autoMagnification", false); }}
              className={cn(
                "px-2 py-1 rounded-lg text-[8px] font-mono border transition-all",
                vizSettings.magnification === m && !vizSettings.autoMagnification
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "bg-black/20 border-white/5 text-white/40 hover:text-white"
              )}
            >
              ×{m}
            </button>
          ))}
          <button
            onClick={() => setVizSetting("autoMagnification", !vizSettings.autoMagnification)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[8px] font-mono border transition-all",
              vizSettings.autoMagnification
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-black/20 border-white/5 text-white/40 hover:text-white"
            )}
          >
            Auto
          </button>
        </div>
        <div className="mt-1.5 text-[7.5px] text-white/25 font-mono">
          Real ΔL is microscopic — magnification makes it visible
        </div>
      </div>

      {/* ── 6. Shock trigger ── */}
      {experimentMode === "thermal_shock" && (
        <div className="px-4 py-3 border-b border-white/5 flex gap-2">
          <button
            onClick={() => triggerThermalShock(77.15)}
            className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> LN₂ Quench (77 K)
          </button>
          <button
            onClick={() => triggerThermalShock(1100)}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all"
          >
            <Flame className="w-3.5 h-3.5" /> Torch (1100 K)
          </button>
        </div>
      )}

      {/* ── 7. Playback Controls ── */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={() => setConfig("isPlaying", !isPlaying)}
          className="flex-1 bg-white/8 hover:bg-white/12 border border-white/8 text-white flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-colors"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? "Pause" : "Resume"}
        </button>
        <button
          onClick={handleSpeedToggle}
          className="bg-black/35 hover:bg-white/5 border border-white/5 text-white flex items-center justify-center gap-1.5 px-3 rounded-xl text-[10px] font-bold transition-colors"
          title="Simulation speed"
        >
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
          {playbackSpeed}×
        </button>
        <button
          onClick={reset}
          className="bg-black/35 hover:bg-white/5 border border-white/5 text-white flex items-center justify-center px-3 rounded-xl transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Fix: the store uses "isPlaying" but the component was accessing an unused "temperature"
// Ensure the unused var doesn't cause lint issues
export type { ExperimentMode };

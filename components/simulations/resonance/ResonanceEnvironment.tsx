"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Activity, Settings2, Zap } from "lucide-react";
import { WaveformType } from "./ResonanceCanvas";

interface ResonanceEnvironmentProps {
  mass: number;
  setMass: (v: number) => void;
  springK: number;
  setSpringK: (v: number) => void;
  dampingB: number;
  setDampingB: (v: number) => void;
  driverAmp: number;
  setDriverAmp: (v: number) => void;
  driverFreq: number;
  setDriverFreq: (v: number) => void;
  waveform: WaveformType;
  setWaveform: (v: WaveformType) => void;
  activePreset: string;
  setActivePreset: (v: string) => void;
  simMode: "single" | "coupled" | "duffing" | "parametric" | "beats";
  setSimMode: (v: "single" | "coupled" | "duffing" | "parametric" | "beats") => void;
  duffingAlpha: number;
  setDuffingAlpha: (v: number) => void;
  couplingK: number;
  setCouplingK: (v: number) => void;
  mass2: number;
  setMass2: (v: number) => void;
  dampingB2: number;
  setDampingB2: (v: number) => void;
}

export const PRESETS = [
  {
    name: "Tuning Fork (High Q)",
    mass: 1.0,
    springK: 400.0,
    dampingB: 0.08,
    driverAmp: 2.0,
    driverFreq: 3.18,
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    description: "Extremely low internal friction, leading to a sharp mechanical resonance. Oscillates for a long time at a single frequency with Q ≈ 250."
  },
  {
    name: "Shock Absorber (Critical)",
    mass: 5.0,
    springK: 250.0,
    dampingB: 70.7,
    driverAmp: 10.0,
    driverFreq: 1.13,
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    description: "Damped precisely near the critical point (b = 2*sqrt(k*m)) to prevent ongoing oscillations. Returns quickly to equilibrium."
  },
  {
    name: "Seismograph (Overdamped)",
    mass: 8.0,
    springK: 80.0,
    dampingB: 45.0,
    driverAmp: 10.0,
    driverFreq: 0.5,
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    description: "Highly viscous environment with high mass inertia. Returns slowly to equilibrium without oscillating, tracking long-period waves."
  },
  {
    name: "Duffing Bistable Jump",
    mass: 1.0,
    springK: 50.0,
    dampingB: 0.5,
    driverAmp: 15.0,
    driverFreq: 1.2,
    waveform: "sine" as WaveformType,
    simMode: "duffing" as const,
    duffingAlpha: 30.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    description: "Nonlinear spring stiffness (alpha = 30) causes resonance curve bending. Demonstrates bistability, hysteresis, and amplitude jumps."
  },
  {
    name: "Coupled Normal Modes",
    mass: 2.0,
    springK: 100.0,
    dampingB: 0.2,
    driverAmp: 10.0,
    driverFreq: 1.13,
    waveform: "sine" as WaveformType,
    simMode: "coupled" as const,
    duffingAlpha: 0.0,
    couplingK: 50.0,
    mass2: 2.0,
    dampingB2: 0.2,
    description: "Two masses connected by a coupling spring. Demonstrates symmetric and asymmetric modes, yielding two distinct resonance peaks."
  },
  {
    name: "Parametric Resonance",
    mass: 1.0,
    springK: 100.0,
    dampingB: 0.1,
    driverAmp: 0.0, // Self-excited, driver force is zero
    driverFreq: 3.18, // 2 * f0 (since f0 ≈ 1.59Hz)
    waveform: "sine" as WaveformType,
    simMode: "parametric" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    description: "Spring stiffness is modulated periodically at twice the natural frequency. Drives exponential amplitude growth without direct forcing."
  },
  {
    name: "Resonance Catastrophe",
    mass: 2.0,
    springK: 150.0,
    dampingB: 0.0, // Undamped
    driverAmp: 8.0,
    driverFreq: 1.38, // At resonance
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    description: "Zero damping. Driving exactly at resonance causes continuous linear energy accumulation, leading to theoretical infinite amplitude."
  }
];

const ControlCard = ({ title, icon: Icon, children, glowColor = "#3b82f6" }: any) => (
  <div className="relative group">
    <div 
      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity rounded-[32px] pointer-events-none"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${glowColor}, transparent)` }}
    />
    <div className="bg-[#18181b]/95 border border-white/5 backdrop-blur-md rounded-[32px] p-8 space-y-6 relative overflow-hidden shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 text-white/80 group-hover:text-white transition-colors">
            <Icon className="w-5 h-5" style={{ color: glowColor }} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const PresetButton = ({ label, description, active, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-start text-left p-5 rounded-[24px] border transition-all duration-200 w-full group relative overflow-hidden",
      active 
        ? "bg-white/[0.04] text-white border-white/10 shadow-xl" 
        : "bg-transparent text-white/40 border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
    )}
    style={active ? { borderLeft: `4px solid ${color}` } : {}}
  >
    <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", active ? "text-white" : "text-white/60 group-hover:text-white")}>{label}</span>
    <span className="text-[10px] text-white/40 mt-1.5 leading-relaxed font-medium">{description}</span>
  </button>
);

export const ResonanceEnvironment: React.FC<ResonanceEnvironmentProps> = ({
  mass,
  setMass,
  springK,
  setSpringK,
  dampingB,
  setDampingB,
  driverAmp,
  setDriverAmp,
  driverFreq,
  setDriverFreq,
  waveform,
  setWaveform,
  activePreset,
  setActivePreset,
  simMode,
  setSimMode,
  duffingAlpha,
  setDuffingAlpha,
  couplingK,
  setCouplingK,
  mass2,
  setMass2,
  dampingB2,
  setDampingB2
}) => {

  const selectPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.name);
    setMass(p.mass);
    setSpringK(p.springK);
    setDampingB(p.dampingB);
    setDriverAmp(p.driverAmp);
    setDriverFreq(p.driverFreq);
    setWaveform(p.waveform);
    setSimMode(p.simMode);
    setDuffingAlpha(p.duffingAlpha);
    setCouplingK(p.couplingK);
    setMass2(p.mass2);
    setDampingB2(p.dampingB2);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 overflow-y-auto h-full pb-24 text-white">
      {/* Column 1: Preset Manager */}
      <div className="lg:col-span-1 space-y-6">
        <ControlCard title="Physical Presets" icon={Zap} glowColor="#ffb95f">
          <p className="text-xs text-white/50 leading-relaxed font-medium">
            Pre-configured physical systems representing critical regimes of forced oscillations.
          </p>
          <div className="space-y-4">
            {PRESETS.map((p) => (
              <PresetButton
                key={p.name}
                label={p.name}
                description={p.description}
                active={activePreset === p.name}
                onClick={() => selectPreset(p)}
                color="#ffb95f"
              />
            ))}
          </div>
        </ControlCard>
      </div>

      {/* Column 2 & 3: Environment Controls */}
      <div className="lg:col-span-2 space-y-8">
        <ControlCard title="Oscillator Properties" icon={Settings2} glowColor="#2563eb">
          <div className="space-y-8">
            {/* Simulation Mode Select */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-white/70 block">Simulation Mode</label>
              <div className="grid grid-cols-5 gap-2">
                {(["single", "coupled", "duffing", "parametric", "beats"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSimMode(mode);
                      setActivePreset("Custom");
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all",
                      simMode === mode 
                        ? "bg-primary text-white border-primary shadow-lg" 
                        : "bg-black/40 text-white/60 border-white/5 hover:border-white/10"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Mass 1 Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Mass 1 (m₁)</label>
                <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-sm font-mono font-bold text-primary">{mass.toFixed(1)}</span>
                  <span className="text-[10px] text-white/40 uppercase">kg</span>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.1"
                value={mass}
                onChange={(e) => {
                  setMass(parseFloat(e.target.value));
                  setActivePreset("Custom");
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Coupled Mass 2 Slider (Only visible in Coupled Mode) */}
            {simMode === "coupled" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-black uppercase tracking-wider text-white/70">Mass 2 (m₂)</label>
                  <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                    <span className="text-sm font-mono font-bold text-primary">{mass2.toFixed(1)}</span>
                    <span className="text-[10px] text-white/40 uppercase">kg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={mass2}
                  onChange={(e) => {
                    setMass2(parseFloat(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}

            {/* Spring Stiffness Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Spring Stiffness (k₁ / k₀)</label>
                <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-sm font-mono font-bold text-primary">{springK.toFixed(0)}</span>
                  <span className="text-[10px] text-white/40 uppercase">N/m</span>
                </div>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={springK}
                onChange={(e) => {
                  setSpringK(parseInt(e.target.value));
                  setActivePreset("Custom");
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Coupling Spring Stiffness Slider (Only in Coupled Mode) */}
            {simMode === "coupled" && (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-black uppercase tracking-wider text-white/70">Coupling Spring (k₁₂)</label>
                  <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                    <span className="text-sm font-mono font-bold text-teal-400">{couplingK.toFixed(0)}</span>
                    <span className="text-[10px] text-white/40 uppercase">N/m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={couplingK}
                  onChange={(e) => {
                    setCouplingK(parseInt(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            )}

            {/* Duffing Nonlinear Coefficient Slider (Only in Duffing Mode) */}
            {simMode === "duffing" && (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-black uppercase tracking-wider text-white/70">Duffing Nonlinearity (α)</label>
                  <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                    <span className="text-sm font-mono font-bold text-amber-400">{duffingAlpha.toFixed(1)}</span>
                    <span className="text-[10px] text-white/40 uppercase">N/m³</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={duffingAlpha}
                  onChange={(e) => {
                    setDuffingAlpha(parseFloat(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            {/* Damping Coefficient Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Damping Coefficient (b₁)</label>
                <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-sm font-mono font-bold text-primary">{dampingB.toFixed(2)}</span>
                  <span className="text-[10px] text-white/40 uppercase">N s/m</span>
                </div>
              </div>
              <input
                type="range"
                min="0.0"
                max="80.0"
                step="0.05"
                value={dampingB}
                onChange={(e) => {
                  setDampingB(parseFloat(e.target.value));
                  setActivePreset("Custom");
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Coupled Damping Coefficient Slider (Only in Coupled Mode) */}
            {simMode === "coupled" && (
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-black uppercase tracking-wider text-white/70">Damping Coefficient 2 (b₂)</label>
                  <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                    <span className="text-sm font-mono font-bold text-primary">{dampingB2.toFixed(2)}</span>
                    <span className="text-[10px] text-white/40 uppercase">N s/m</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="80.0"
                  step="0.05"
                  value={dampingB2}
                  onChange={(e) => {
                    setDampingB2(parseFloat(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>
        </ControlCard>

        <ControlCard title="Driver Engine" icon={Activity} glowColor="#0d9488">
          <div className="space-y-8">
            {/* Driving Amplitude Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Driver Force Amplitude (F₀)</label>
                <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-sm font-mono font-bold text-secondary">{driverAmp.toFixed(1)}</span>
                  <span className="text-[10px] text-white/40 uppercase">N</span>
                </div>
              </div>
              <input
                type="range"
                min="0.0"
                max="50.0"
                step="0.5"
                value={driverAmp}
                onChange={(e) => {
                  setDriverAmp(parseFloat(e.target.value));
                  setActivePreset("Custom");
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
            </div>

            {/* Waveform Select */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-white/70 block">Driver Waveform</label>
              <div className="grid grid-cols-3 gap-4">
                {(["sine", "square", "triangle"] as WaveformType[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWaveform(w);
                      setActivePreset("Custom");
                    }}
                    className={cn(
                      "py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all",
                      waveform === w 
                        ? "bg-secondary text-black border-secondary shadow-lg shadow-secondary/20" 
                        : "bg-black/40 text-white/60 border-white/5 hover:border-white/10"
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ControlCard>
      </div>
    </div>
  );
};

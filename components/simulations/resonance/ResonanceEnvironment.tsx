"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Activity, Settings2, ShieldAlert, Zap } from "lucide-react";
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
  waveform: WaveformType;
  setWaveform: (v: WaveformType) => void;
  activePreset: string;
  setActivePreset: (v: string) => void;
}

const PRESETS = [
  {
    name: "Tuning Fork",
    mass: 1.0,
    springK: 400.0,
    dampingB: 0.1, // High Q, extremely slow decay
    waveform: "sine" as WaveformType,
    description: "Extremely low internal friction, leading to high mechanical resonance. Oscillates for a long time at a single sharp peak frequency."
  },
  {
    name: "Acoustic Cavity",
    mass: 2.0,
    springK: 150.0,
    dampingB: 1.2, // Moderate Q
    waveform: "sine" as WaveformType,
    description: "Moderate internal friction and damping. Broad resonance characteristics typical of air pillars and string instruments."
  },
  {
    name: "Automobile Shock Absorber",
    mass: 5.0,
    springK: 250.0,
    dampingB: 70.7, // Critical damping: b = 2*sqrt(k*m) = 2*sqrt(1250) = 70.7
    waveform: "sine" as WaveformType,
    description: "Damped precisely near the critical point to prevent ongoing oscillations. Designed for swift stabilization back to equilibrium."
  },
  {
    name: "Seismograph Pendulum",
    mass: 8.0,
    springK: 80.0,
    dampingB: 45.0, // Overdamped
    waveform: "sine" as WaveformType,
    description: "Highly viscous environment with high mass inertia. Returns very slowly to equilibrium without oscillating."
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
  waveform,
  setWaveform,
  activePreset,
  setActivePreset
}) => {

  const selectPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.name);
    setMass(p.mass);
    setSpringK(p.springK);
    setDampingB(p.dampingB);
    setWaveform(p.waveform);
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
            {/* Mass Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Mass (m)</label>
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
              <div className="flex justify-between text-[9px] text-white/30 font-mono">
                <span>0.5 kg (Inertia Min)</span>
                <span>10.0 kg (Inertia Max)</span>
              </div>
            </div>

            {/* Spring Constant Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Spring Stiffness (k)</label>
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
              <div className="flex justify-between text-[9px] text-white/30 font-mono">
                <span>20 N/m (Compliant)</span>
                <span>500 N/m (Stiff)</span>
              </div>
            </div>

            {/* Damping Coefficient Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-black uppercase tracking-wider text-white/70">Damping Coefficient (b)</label>
                <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-sm font-mono font-bold text-primary">{dampingB.toFixed(1)}</span>
                  <span className="text-[10px] text-white/40 uppercase">N s/m</span>
                </div>
              </div>
              <input
                type="range"
                min="0.0"
                max="80.0"
                step="0.1"
                value={dampingB}
                onChange={(e) => {
                  setDampingB(parseFloat(e.target.value));
                  setActivePreset("Custom");
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-white/30 font-mono">
                <span>0.0 N s/m (Undamped)</span>
                <span>80.0 N s/m (Overdamped Max)</span>
              </div>
            </div>
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
              <div className="flex justify-between text-[9px] text-white/30 font-mono">
                <span>0.0 N (Disabled)</span>
                <span>50.0 N (Maximum Driving)</span>
              </div>
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

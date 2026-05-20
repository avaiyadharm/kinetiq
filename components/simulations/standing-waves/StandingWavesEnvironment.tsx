"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  Wind, 
  TrendingDown, 
  Radio,
  Settings2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BoundaryType } from "./StandingWavesCanvas";

interface StandingWavesEnvironmentProps {
  tension: number;
  setTension: (v: number) => void;
  density: number;
  setDensity: (v: number) => void;
  damping: number;
  setDamping: (v: number) => void;
  boundaryImpedance: number;
  setBoundaryImpedance: (v: number) => void;
  preset: string;
  setPreset: (v: string) => void;
  length: number;
  boundaryType: BoundaryType | "Partially Reflective";
  simMode: "harmonic" | "driven";
  setSimMode: (v: "harmonic" | "driven") => void;
}

const PRESETS = [
  { 
    name: "Nylon String", 
    tension: 120, 
    density: 0.003, 
    damping: 0.15, 
    boundaryImpedance: 2.0,
    description: "Lightweight, highly elastic medium with moderate tension. Simulates standard musical instrument acoustics with high wave velocity."
  },
  { 
    name: "Steel Cable", 
    tension: 800, 
    density: 0.08, 
    damping: 0.05, 
    boundaryImpedance: 24.0,
    description: "Massive linear density operating under extremely high tension. Low spatial attenuation and long decay times characteristic of heavy structural systems."
  },
  { 
    name: "Rubber Cord", 
    tension: 50, 
    density: 0.2, 
    damping: 1.5, 
    boundaryImpedance: 6.0,
    description: "Highly viscous medium with substantial linear mass density and high internal friction. Exhibits rapid energy decay and low wave speeds."
  },
];

const ControlCard = ({ title, icon: Icon, children, glowColor = "#3b82f6" }: any) => (
  <div className="relative group">
    <div 
      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity rounded-[32px] pointer-events-none"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${glowColor}, transparent)` }}
    />
    <div className="bg-[#18181b]/90 border border-white/5 backdrop-blur-md rounded-[32px] p-8 space-y-6 relative overflow-hidden shadow-xl">
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

export default function StandingWavesEnvironment({
  tension,
  setTension,
  density,
  setDensity,
  damping,
  setDamping,
  boundaryImpedance,
  setBoundaryImpedance,
  preset,
  setPreset,
  length,
  boundaryType,
  simMode,
  setSimMode
}: StandingWavesEnvironmentProps) {
  
  // Wave mechanics
  const waveSpeed = Math.sqrt(tension / density);
  const Z1 = Math.sqrt(tension * density);

  let R = -1;
  if (boundaryType === "Fixed-Fixed") R = -1;
  else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") R = 1;
  else if (boundaryType === "Partially Reflective") {
    R = (boundaryImpedance - Z1) / (boundaryImpedance + Z1);
  }

  // Natural frequencies and active mode calculations
  const f1 = waveSpeed / (2 * length);
  const omega1 = 2 * Math.PI * f1;
  const qFactor = damping === 0 ? Infinity : omega1 / (2 * damping);
  const bandwidth = damping / Math.PI;

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPreset(p.name);
    setTension(p.tension);
    setDensity(p.density);
    setDamping(p.damping);
    setBoundaryImpedance(p.boundaryImpedance);
  };

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"derivation" | "dimensional">("derivation");

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 lg:p-8 max-w-7xl mx-auto w-full text-white">
      {/* Left Column: Sliders & Presets */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            Rigorous Physics Core
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Laboratory <span className="text-cyan-400">Environment</span>
          </h2>
          <p className="text-white/40 text-sm font-medium">
            Calibrate the intrinsic mechanical properties of the tensioned medium and surrounding boundary impedances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tension Control */}
          <ControlCard title="String Tension" icon={Zap} glowColor="#fbbf24">
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Restoring Force (T)</span>
                  <p className="text-3xl font-mono font-black text-amber-400">
                    {tension.toFixed(0)} <span className="text-sm text-white/40 font-bold uppercase">N</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">SI Unit</p>
                  <p className="text-xs text-white/50 font-mono font-bold">kg · m/s²</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="range" min="10" max="1000" step="5" value={tension} 
                  onChange={(e) => { setTension(parseFloat(e.target.value)); setPreset("Custom"); }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>10 N</span>
                  <span>500 N</span>
                  <span>1000 N</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] text-white/40 leading-relaxed font-medium">
                Tension represents the uniform axial restoring force acting along the string length. Higher tension increases the local restoring velocity, generating faster propagating wave packets.
              </div>
            </div>
          </ControlCard>

          {/* Linear Mass Density Control */}
          <ControlCard title="Linear Mass Density" icon={Wind} glowColor="#10b981">
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Inertial Medium mass (μ)</span>
                  <p className="text-3xl font-mono font-black text-emerald-400">
                    {(density * 1000).toFixed(1)} <span className="text-sm text-white/40 font-bold uppercase">g/m</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">SI: {density.toFixed(4)} kg/m</span>
                  <p className="text-xs text-white/50 font-mono font-bold">kg / m</p>
                </div>
              </div>

              <div className="space-y-2">
                <input 
                  type="range" min="0.0005" max="0.5" step="0.0005" value={density} 
                  onChange={(e) => { setDensity(parseFloat(e.target.value)); setPreset("Custom"); }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>0.5 g/m</span>
                  <span>250 g/m</span>
                  <span>500 g/m</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] text-white/40 leading-relaxed font-medium">
                Linear mass density ($\mu$) measures the spatial inertia of the medium. Higher inertial mass per unit length resists deformation, leading to a slower wave phase velocity.
              </div>
            </div>
          </ControlCard>

          {/* Temporal Damping Control */}
          <ControlCard title="Temporal Damping" icon={TrendingDown} glowColor="#ef4444">
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Viscous Decay Rate (β)</span>
                  <p className="text-3xl font-mono font-black text-rose-400">
                    {damping.toFixed(2)} <span className="text-sm text-white/40 font-bold uppercase">s⁻¹</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Resonance Width</p>
                  <p className="text-xs text-white/50 font-mono font-bold">Δf = {bandwidth.toFixed(3)} Hz</p>
                </div>
              </div>

              <div className="space-y-2">
                <input 
                  type="range" min="0.0" max="3.0" step="0.05" value={damping} 
                  onChange={(e) => { setDamping(parseFloat(e.target.value)); setPreset("Custom"); }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>0.0 s⁻¹</span>
                  <span>1.5 s⁻¹</span>
                  <span>3.0 s⁻¹</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] text-white/40 leading-relaxed font-medium">
                Damping ($\beta$) represents the continuous internal viscous friction of the medium. Viscous friction dissipates kinetic energy into heat, causing amplitude decay and broadening resonance bandwidth.
              </div>
            </div>
          </ControlCard>

          {/* Boundary Impedance Control */}
          <ControlCard title="Boundary Impedance" icon={Radio} glowColor="#06b6d4">
            <div className="space-y-5">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Mechanical Load (Z₂)</span>
                  <p className="text-3xl font-mono font-black text-cyan-400">
                    {boundaryImpedance.toFixed(1)} <span className="text-sm text-white/40 font-bold uppercase">kg/s</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Reflection Coeff</p>
                  <p className="text-xs text-white/50 font-mono font-bold">R = {R.toFixed(3)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <input 
                  type="range" min="0.0" max="200.0" step="0.5" value={boundaryImpedance} 
                  onChange={(e) => { setBoundaryImpedance(parseFloat(e.target.value)); setPreset("Custom"); }}
                  disabled={boundaryType !== "Partially Reflective"}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-500 disabled:opacity-20"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>0.0 kg/s</span>
                  <span>100.0 kg/s</span>
                  <span>200.0 kg/s</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] text-white/40 leading-relaxed font-medium">
                {boundaryType === "Partially Reflective" ? (
                  <span>Boundary load ($Z_2$) couples the string to an external mechanical absorber. The reflection coefficient $R$ is determined by the impedance mismatch: $R = (Z_2 - Z_1)/(Z_2 + Z_1)$.</span>
                ) : (
                  <span className="text-amber-400/80">Active boundary type is "{boundaryType}". To modify boundary mechanical impedance, select "Partially Reflective" boundary conditions in the Canvas workspace panel.</span>
                )}
              </div>
            </div>
          </ControlCard>
        </div>

        {/* Presets Panel */}
        <div className="bg-[#18181b]/80 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase tracking-[0.2em]">Material Presets</h4>
            <p className="text-xs text-white/40">Instantly deploy physically calibrated medium profiles.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESETS.map((p) => (
              <PresetButton 
                key={p.name}
                label={p.name}
                description={p.description}
                active={preset === p.name}
                onClick={() => applyPreset(p)}
                color="#06b6d4"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Educational Mathematics & Analysis */}
      <div className="w-full lg:w-[480px] flex flex-col gap-6 shrink-0">
        <div className="bg-[#18181b]/95 border border-white/5 backdrop-blur-md rounded-[32px] p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Cpu className="w-40 h-40" />
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase tracking-wider">Analytical Engine</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-black font-mono">Live Calculations</p>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 text-[9px] font-bold uppercase tracking-wider">
              <button 
                onClick={() => setActiveAnalysisTab("derivation")}
                className={cn("px-3 py-1.5 rounded-lg transition-colors", activeAnalysisTab === "derivation" ? "bg-cyan-500 text-black font-black" : "text-white/50 hover:text-white")}
              >
                Derivations
              </button>
              <button 
                onClick={() => setActiveAnalysisTab("dimensional")}
                className={cn("px-3 py-1.5 rounded-lg transition-colors", activeAnalysisTab === "dimensional" ? "bg-cyan-500 text-black font-black" : "text-white/50 hover:text-white")}
              >
                Dimensional Analysis
              </button>
            </div>
          </div>

          {activeAnalysisTab === "derivation" ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Wave Speed Derivation */}
              <div className="space-y-3 p-5 rounded-2xl bg-black/30 border border-white/5 relative group">
                <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">1. Phase Velocity (Wave Speed)</span>
                <div className="font-mono text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">Equation:</span>
                    <span>v = √( T / μ )</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1.5">
                    <span className="text-cyan-400 font-bold font-sans text-[10px] uppercase">Substitution:</span>
                    <span>v = √( {tension} / {density} )</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1 font-bold text-white">
                    <span className="text-white/50 font-sans text-[10px] uppercase font-normal mr-1">Result:</span>
                    <span className="text-base text-cyan-400">{waveSpeed.toFixed(2)}</span>
                    <span className="text-[10px] text-white/40">m/s</span>
                  </div>
                </div>
              </div>

              {/* Medium Impedance Derivation */}
              <div className="space-y-3 p-5 rounded-2xl bg-black/30 border border-white/5 relative group">
                <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">2. Characteristic Impedance</span>
                <div className="font-mono text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">Equation:</span>
                    <span>Z₁ = √( T · μ )</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1.5">
                    <span className="text-cyan-400 font-bold font-sans text-[10px] uppercase">Substitution:</span>
                    <span>Z₁ = √( {tension} · {density} )</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1 font-bold text-white">
                    <span className="text-white/50 font-sans text-[10px] uppercase font-normal mr-1">Result:</span>
                    <span className="text-base text-cyan-400">{Z1.toFixed(4)}</span>
                    <span className="text-[10px] text-white/40">kg/s</span>
                  </div>
                </div>
              </div>

              {/* Boundary Reflection Derivation */}
              <div className="space-y-3 p-5 rounded-2xl bg-black/30 border border-white/5 relative group">
                <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">3. Reflection Coefficient at Boundary</span>
                <div className="font-mono text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">Equation:</span>
                    <span>R = ( Z₂ - Z₁ ) / ( Z₂ + Z₁ )</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1.5">
                    <span className="text-cyan-400 font-bold font-sans text-[10px] uppercase">Substitution:</span>
                    {boundaryType === "Fixed-Fixed" && <span>R = ( 0 - {Z1.toFixed(3)} ) / ( 0 + {Z1.toFixed(3)} )</span>}
                    {(boundaryType === "Free-Free" || boundaryType === "Fixed-Free") && <span>R = ( ∞ - {Z1.toFixed(3)} ) / ( ∞ + {Z1.toFixed(3)} )</span>}
                    {boundaryType === "Partially Reflective" && <span>R = ( {boundaryImpedance.toFixed(1)} - {Z1.toFixed(3)} ) / ( {boundaryImpedance.toFixed(1)} + {Z1.toFixed(3)} )</span>}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1 font-bold text-white">
                    <span className="text-white/50 font-sans text-[10px] uppercase font-normal mr-1">Result:</span>
                    <span className={cn("text-base", R < 0 ? "text-rose-400" : "text-emerald-400")}>{R.toFixed(3)}</span>
                    <span className="text-[10px] text-white/40 uppercase font-sans">
                      {R === -1 && "(Fixed - Node, 180° shift)"}
                      {R === 1 && "(Free - Antinode, 0° shift)"}
                      {R > -1 && R < 1 && R !== 0 && `(Partial Reflection, phase ${R < 0 ? 'inv' : 'pres'})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Damping Quality Q-Factor Derivation */}
              <div className="space-y-3 p-5 rounded-2xl bg-black/30 border border-white/5 relative group">
                <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">4. Fundamental Damping Q-Factor</span>
                <div className="font-mono text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">Equation:</span>
                    <span>Q = ω₁ / (2β) = π f₁ / β</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1.5">
                    <span className="text-cyan-400 font-bold font-sans text-[10px] uppercase">Substitution:</span>
                    <span>Q = ( π · {f1.toFixed(2)} ) / {damping || "10⁻⁶"}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1 font-bold text-white">
                    <span className="text-white/50 font-sans text-[10px] uppercase font-normal mr-1">Result:</span>
                    <span className="text-base text-cyan-400">{qFactor === Infinity ? "∞" : qFactor.toFixed(1)}</span>
                    <span className="text-[10px] text-white/40">Dimensionless</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex gap-3 text-[10px] text-cyan-400 leading-relaxed font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The calculations are computed live from the active physical sliders. Adjust the sliders on the left to witness instantaneous physical coupling across variables.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between overflow-y-auto pr-1 no-scrollbar">
              {/* Speed Dimensional Analysis */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-black/30 border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-wider font-black text-emerald-400">Phase Velocity [v]</span>
                  <span className="text-[10px] font-mono text-white/40">Unit: m/s</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                  We verify that the speed equation yields a velocity unit:
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 space-y-1.5 font-bold">
                  <div>[v] = √ ( [T] / [μ] )</div>
                  <div className="text-cyan-400">[v] = √ ( (kg · m / s²) / (kg / m) )</div>
                  <div className="text-emerald-400">[v] = √ ( m² / s² ) = m / s</div>
                </div>
              </div>

              {/* Impedance Dimensional Analysis */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-black/30 border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-wider font-black text-emerald-400">Characteristic Impedance [Z]</span>
                  <span className="text-[10px] font-mono text-white/40">Unit: kg/s</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                  Characteristic impedance measures resistance to wave propagation in a mechanical system:
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 space-y-1.5 font-bold">
                  <div>[Z₁] = √ ( [T] · [μ] )</div>
                  <div className="text-cyan-400">[Z₁] = √ ( (kg · m / s²) · (kg / m) )</div>
                  <div className="text-emerald-400">[Z₁] = √ ( kg² / s² ) = kg / s</div>
                </div>
              </div>

              {/* Q-Factor Dimensional Analysis */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-black/30 border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-wider font-black text-emerald-400">Quality Q-Factor [Q]</span>
                  <span className="text-[10px] font-mono text-white/40">Unit: Dimensionless</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                  The Quality Factor relates frequency and dissipation rate, yielding a dimensionless scaling ratio:
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 space-y-1.5 font-bold">
                  <div>[Q] = [ω₀] / [2β]</div>
                  <div className="text-cyan-400">[Q] = (rad / s) / (s⁻¹)</div>
                  <div className="text-emerald-400">[Q] = 1 (Dimensionless Ratio)</div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-3 text-[10px] text-emerald-400 leading-relaxed font-medium">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Consistent units prove that Kinetiq's simulation calculations conform entirely to Newtonian physics. No arbitrary cinematic multipliers are used.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

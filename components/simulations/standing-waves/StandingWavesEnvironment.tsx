import React from "react";
import { motion } from "framer-motion";
import { Settings, Droplets, Wind, Scissors, Activity, TrendingDown } from "lucide-react";
import { BoundaryType } from "./StandingWavesCanvas";

interface StandingWavesEnvironmentProps {
  tension: number;
  setTension: (v: number) => void;
  density: number;
  setDensity: (v: number) => void;
  damping: number;
  setDamping: (v: number) => void;
  reflection: number;
  setReflection: (v: number) => void;
  preset: string;
  setPreset: (v: string) => void;
  length: number;
  boundaryType: BoundaryType;
}

const PRESETS = [
  { name: "Ideal String (Custom)", tension: 100, density: 0.01, damping: 0, reflection: 1 },
  { name: "Nylon Guitar String", tension: 70, density: 0.005, damping: 0.1, reflection: 0.95 },
  { name: "Heavy Steel Cable", tension: 500, density: 0.5, damping: 0.3, reflection: 0.85 },
  { name: "Rubber Cord", tension: 20, density: 0.05, damping: 0.8, reflection: 0.6 },
];

export default function StandingWavesEnvironment({
  tension, setTension, density, setDensity, damping, setDamping, reflection, setReflection, preset, setPreset, length, boundaryType
}: StandingWavesEnvironmentProps) {
  
  const waveSpeed = Math.sqrt(tension / density);
  const qFactor = damping === 0 ? "∞" : (1 / (2 * damping)).toFixed(1);

  const applyPreset = (pName: string) => {
    const p = PRESETS.find(x => x.name === pName);
    if (p) {
      setPreset(p.name);
      setTension(p.tension);
      setDensity(p.density);
      setDamping(p.damping);
      setReflection(p.reflection);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-20">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-amber-500" />
          Environment Configuration
        </h2>
        <p className="text-white/50 text-sm tracking-wide">
          Configure the physical properties of the resonant medium. All parameters mathematically dictate wave speed, attenuation, and resonance Q-factor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Presets */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">Medium Presets</h3>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p.name)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all border ${
                    preset === p.name 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <ParameterSlider
              label="String Tension (T)"
              value={tension}
              min={10} max={1000} step={10}
              unit="N"
              onChange={(v: number) => { setTension(v); setPreset("Custom"); }}
              color="amber"
              description="Restoring force. Increases wave speed."
            />
            
            <ParameterSlider
              label="Linear Density (ρ)"
              value={density}
              min={0.001} max={1.0} step={0.001}
              unit="kg/m"
              onChange={(v: number) => { setDensity(v); setPreset("Custom"); }}
              color="amber"
              description="Inertial resistance. Decreases wave speed."
            />
            
            <ParameterSlider
              label="Temporal Damping (β)"
              value={damping}
              min={0} max={2.0} step={0.05}
              unit="s⁻¹"
              onChange={(v: number) => { setDamping(v); setPreset("Custom"); }}
              color="rose"
              description="Energy dissipation rate over time."
            />

            <ParameterSlider
              label="Reflection Coeff. (R)"
              value={reflection}
              min={0.1} max={1.0} step={0.05}
              unit=""
              onChange={(v: number) => { setReflection(v); setPreset("Custom"); }}
              color="cyan"
              description="Fraction of amplitude reflected at boundary."
            />

          </div>
        </div>

        {/* Right Col: Telemetry & Graphs */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Activity className="w-32 h-32" />
            </div>
            
            <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest relative z-10">Live Computations</h3>
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-sm text-white/60">Wave Speed (v)</span>
                <div className="text-right">
                  <div className="text-2xl font-mono text-emerald-400">{waveSpeed.toFixed(1)} <span className="text-sm">m/s</span></div>
                  <div className="text-[10px] text-white/40 font-mono">v = √(T/ρ)</div>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-sm text-white/60">Quality Factor (Q)</span>
                <div className="text-right">
                  <div className="text-2xl font-mono text-amber-400">{qFactor}</div>
                  <div className="text-[10px] text-white/40 font-mono">Resonance Sharpness</div>
                </div>
              </div>

              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-sm text-white/60">Fundamental (f₁)</span>
                <div className="text-right">
                  <div className="text-2xl font-mono text-cyan-400">
                    {(boundaryType === "Fixed-Free" ? waveSpeed / (4 * length) : waveSpeed / (2 * length)).toFixed(2)} <span className="text-sm">Hz</span>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">Boundary constrained</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Attenuation Profile
            </h3>
            <div className="h-24 w-full bg-white/5 rounded-lg border border-white/10 relative overflow-hidden">
              <svg width="100%" height="100%" preserveAspectRatio="none">
                <path 
                  d={`M 0,0 L ${Array.from({length: 100}).map((_, i) => {
                    const t = i / 100; // t from 0 to 1 normalized
                    const y = Math.exp(-damping * t * 5); // display 5 seconds of decay
                    return `${t * 100}%,${(1 - y) * 100}%`;
                  }).join(' L ')} L 100%,100% L 0,100% Z`}
                  fill="rgba(244, 63, 94, 0.1)"
                />
                <path 
                  d={`M 0,0 ${Array.from({length: 100}).map((_, i) => {
                    const t = i / 100;
                    const y = Math.exp(-damping * t * 5);
                    return `L ${t * 100}%,${(1 - y) * 100}%`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="rgba(244, 63, 94, 0.8)"
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/30 pointer-events-none">
                A(t) = A₀e^(-βt)
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ParameterSlider({ label, value, min, max, step, unit, onChange, color, description }: any) {
  const colors = {
    amber: "text-amber-400 border-amber-400/20 bg-amber-400/10",
    cyan: "text-cyan-400 border-cyan-400/20 bg-cyan-400/10",
    rose: "text-rose-400 border-rose-400/20 bg-rose-400/10",
    emerald: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  };

  const accent = colors[color as keyof typeof colors];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-mono text-white/60 uppercase tracking-wider">{label}</label>
        <div className={`px-2 py-0.5 rounded text-xs font-mono border ${accent}`}>
          {value.toFixed(step < 0.1 ? 3 : 1)} {unit}
        </div>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <div className="text-[10px] text-white/40">{description}</div>
    </div>
  );
}

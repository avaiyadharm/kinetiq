"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  Wind, 
  TrendingDown, 
  Radio,
  Clock,
  Activity,
  Settings2,
  AlertCircle
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
  reflection: number;
  setReflection: (v: number) => void;
  preset: string;
  setPreset: (v: string) => void;
  length: number;
  boundaryType: BoundaryType;
}

const PRESETS = [
  { name: "Ideal String", tension: 100, density: 0.01, damping: 0, reflection: 1 },
  { name: "Nylon String", tension: 70, density: 0.005, damping: 0.1, reflection: 0.95 },
  { name: "Steel Cable", tension: 500, density: 0.5, damping: 0.3, reflection: 0.85 },
  { name: "Rubber Cord", tension: 20, density: 0.05, damping: 0.8, reflection: 0.6 },
];

const ControlCard = ({ title, icon: Icon, children, glowColor = "#3b82f6" }: any) => (
  <div className="relative group">
    <div 
      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity rounded-[32px] pointer-events-none"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${glowColor}, transparent)` }}
    />
    <div className="bg-[#18181b] border border-white/5 rounded-[32px] p-8 space-y-6 relative overflow-hidden shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-white/5 text-white/80 group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" style={{ color: glowColor }} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const PresetButton = ({ label, value, active, onClick, color }: any) => (
  <button
    onClick={() => onClick(value)}
    className={cn(
      "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
      active 
        ? "bg-white/10 text-white border-white/20 shadow-lg" 
        : "bg-transparent text-white/40 border-white/5 hover:border-white/10 hover:text-white/60"
    )}
    style={active ? { borderColor: `${color}40`, color: color } : {}}
  >
    {label}
  </button>
);

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
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar">
      {/* Main Configuration Grid */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Environment <span className="text-cyan-400">Config</span>
          </h2>
          <p className="text-white/40 text-sm font-medium">Configure the physical properties of the resonant medium affecting wave propagation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* String Tension */}
          <ControlCard title="String Tension" icon={Zap} glowColor="#fbbf24">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Current Force</span>
                  <p className="text-3xl font-mono font-black text-white">{tension.toFixed(1)} <span className="text-sm text-white/40">N</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-400 font-mono">v = √(T/ρ)</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-tighter">Restoring Force</p>
                </div>
              </div>
              
              <input 
                type="range" min="10" max="1000" step="10" value={tension} 
                onChange={(e) => { setTension(parseFloat(e.target.value)); setPreset("Custom"); }}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
              />

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  "Higher tension increases wave speed and raises fundamental frequency."
                </p>
              </div>
            </div>
          </ControlCard>

          {/* Linear Density */}
          <ControlCard title="Linear Density" icon={Wind} glowColor="#10b981">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Mass per Length</span>
                  <p className="text-3xl font-mono font-black text-white">{density.toFixed(4)} <span className="text-sm text-white/40">kg/m</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-400 font-mono">ρ</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-tighter">Inertial Mass</p>
                </div>
              </div>

              <input 
                type="range" min="0.001" max="1.0" step="0.001" value={density} 
                onChange={(e) => { setDensity(parseFloat(e.target.value)); setPreset("Custom"); }}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  "Heavier material decreases wave speed and lowers resonant frequencies."
                </p>
              </div>
            </div>
          </ControlCard>

          {/* Damping */}
          <ControlCard title="Temporal Damping" icon={TrendingDown} glowColor="#ef4444">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Decay Rate</span>
                  <p className="text-3xl font-mono font-black text-white">{damping.toFixed(2)} <span className="text-sm text-white/40">s⁻¹</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-red-400 font-mono">Q = {qFactor}</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-tighter">Quality Factor</p>
                </div>
              </div>

              <input 
                type="range" min="0" max="2.0" step="0.05" value={damping} 
                onChange={(e) => { setDamping(parseFloat(e.target.value)); setPreset("Custom"); }}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-red-500"
              />

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  "Energy dissipation causes amplitude decay and broadens resonance peaks."
                </p>
              </div>
            </div>
          </ControlCard>

          {/* Reflection Coefficient */}
          <ControlCard title="Reflection Coefficient" icon={Radio} glowColor="#06b6d4">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Boundary Reflection</span>
                  <p className="text-3xl font-mono font-black text-white">{(reflection * 100).toFixed(0)} <span className="text-sm text-white/40">%</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-cyan-400 font-mono">R ∈ [0,1]</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-tighter">Amplitude Ratio</p>
                </div>
              </div>

              <input 
                type="range" min="0.1" max="1.0" step="0.05" value={reflection} 
                onChange={(e) => { setReflection(parseFloat(e.target.value)); setPreset("Custom"); }}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  Perfect reflection (R=1) preserves standing waves; absorption (R less than 1) broadens modes.
                </p>
              </div>
            </div>
          </ControlCard>
        </div>

        {/* Presets Section */}
        <div className="bg-gradient-to-r from-white/[0.02] to-transparent rounded-[32px] p-8 border border-white/5">
          <div className="flex flex-col gap-6">
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Medium Presets</h4>
              <p className="text-xs text-white/40">Load pre-configured material properties.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <PresetButton 
                  key={p.name} 
                  label={p.name} 
                  value={p.name} 
                  active={preset === p.name}
                  onClick={(val: string) => applyPreset(val)}
                  color="#06b6d4"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Wave Analysis */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] rotate-12">
            <Settings2 className="w-32 h-32" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Wave Analysis</h3>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">Live Computations</p>
          </div>

          <div className="space-y-6">
            {[
              { label: "Wave Speed", val: waveSpeed.toFixed(1) + " m/s", color: "text-emerald-400", formula: "v = √(T/ρ)" },
              { label: "Impedance", val: (Math.sqrt(tension * density) * 1000).toFixed(1), color: "text-blue-400", formula: "Z = √(Tρ)" },
              { label: "Damping Q-Factor", val: qFactor + " ", color: "text-pink-400", formula: "Q = 1/(2β)" },
              { label: "Reflection Loss", val: ((1 - reflection) * 100).toFixed(1) + "%", color: "text-purple-400", formula: "Loss = 1-R" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
                  <div className="text-right">
                    <span className={cn("text-lg font-mono font-bold", stat.color)}>{stat.val}</span>
                    <p className="text-[10px] text-white/20 font-mono">{stat.formula}</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className={cn("h-full", stat.color.replace('text-', 'bg-'))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-cyan-400/80 leading-relaxed">
                All parameters update in real-time. Wave propagation recalculates every frame.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

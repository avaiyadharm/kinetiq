"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  Wind, 
  Droplets, 
  Zap, 
  Clock, 
  Activity, 
  ChevronRight,
  Settings2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EnvironmentConfig() {
  const [gravity, setGravity] = useState(9.8);
  const [drag, setDrag] = useState(0.5);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [friction, setFriction] = useState(0.2);
  const [wind, setWind] = useState(0);
  const [windDir, setWindDir] = useState(1);
  const [timeScale, setTimeScale] = useState(1);

  const gravityPresets = [
    { label: "Moon", val: 1.62 },
    { label: "Mars", val: 3.71 },
    { label: "Earth", val: 9.8 },
    { label: "Jupiter", val: 24.79 },
  ];

  const frictionPresets = [
    { label: "Ice", val: 0.05 },
    { label: "Wood", val: 0.35 },
    { label: "Concrete", val: 0.7 },
    { label: "Rubber", val: 0.9 },
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar">
      {/* Main Configuration Grid */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Environment <span className="text-primary">Config</span>
          </h2>
          <p className="text-white/40 text-sm font-medium">Control the physical world parameters affecting the simulation pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gravity Control */}
          <ControlCard title="Gravity Field" icon={Globe} glowColor="#3b82f6">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Current Acceleration</span>
                  <p className="text-3xl font-mono font-black text-white">{gravity.toFixed(2)} <span className="text-sm text-white/40">m/s²</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400 font-mono">F = m × g</p>
                  <p className="text-[10px] text-white/20 uppercase tracking-tighter">Live Equation</p>
                </div>
              </div>
              
              <input 
                type="range" min="0" max="25" step="0.01" value={gravity} 
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
              />

              <div className="flex flex-wrap gap-2">
                {gravityPresets.map(p => (
                  <PresetButton 
                    key={p.label} label={p.label} value={p.val} 
                    active={Math.abs(gravity - p.val) < 0.1} onClick={setGravity}
                    color="#3b82f6"
                  />
                ))}
              </div>
            </div>
          </ControlCard>

          {/* Atmospheric Drag */}
          <ControlCard title="Atmospheric Drag" icon={Droplets} glowColor="#10b981">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Drag Coefficient (k)</span>
                  <p className="text-3xl font-mono font-black text-white">{dragEnabled ? drag.toFixed(2) : "OFF"}</p>
                </div>
                <button 
                  onClick={() => setDragEnabled(!dragEnabled)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    dragEnabled ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" : "bg-white/5 text-white/30 border border-white/5"
                  )}
                >
                  {dragEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <input 
                type="range" min="0" max="2" step="0.01" value={drag} 
                disabled={!dragEnabled}
                onChange={(e) => setDrag(parseFloat(e.target.value))}
                className={cn(
                  "w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500",
                  dragEnabled ? "bg-white/5" : "bg-white/5 opacity-20"
                )}
              />

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] text-white/40 leading-relaxed italic">
                  "Air resistance opposes motion and reduces velocity over time proportional to the square of speed."
                </p>
              </div>
            </div>
          </ControlCard>

          {/* Surface Friction */}
          <ControlCard title="Surface Friction" icon={Zap} glowColor="#ff85a2">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Coefficient (μ)</span>
                  <p className="text-3xl font-mono font-black text-white">{friction.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-pink-400 font-mono">F_f = μ × N</p>
                </div>
              </div>

              <input 
                type="range" min="0" max="1" step="0.01" value={friction} 
                onChange={(e) => setFriction(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-pink-500"
              />

              <div className="flex flex-wrap gap-2">
                {frictionPresets.map(p => (
                  <PresetButton 
                    key={p.label} label={p.label} value={p.val} 
                    active={Math.abs(friction - p.val) < 0.05} onClick={setFriction}
                    color="#ff85a2"
                  />
                ))}
              </div>
            </div>
          </ControlCard>

          {/* Wind System */}
          <ControlCard title="Wind Dynamics" icon={Wind} glowColor="#a855f7">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Velocity</span>
                  <p className="text-3xl font-mono font-black text-white">{(wind * windDir).toFixed(1)} <span className="text-sm text-white/40">m/s</span></p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setWindDir(-1)}
                    className={cn("p-2 rounded-lg border transition-all", windDir === -1 ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-white/5 border-white/5 text-white/20")}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <button 
                    onClick={() => setWindDir(1)}
                    className={cn("p-2 rounded-lg border transition-all", windDir === 1 ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-white/5 border-white/5 text-white/20")}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <input 
                type="range" min="0" max="50" step="1" value={wind} 
                onChange={(e) => setWind(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
              
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                <Activity className="w-3 h-3" />
                <span>Simulating Laminar Flow</span>
              </div>
            </div>
          </ControlCard>
        </div>

        {/* Time Scale Section */}
        <div className="bg-gradient-to-r from-white/[0.02] to-transparent rounded-[32px] p-8 border border-white/5">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/5">
                <Clock className="w-8 h-8 text-white/20" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Temporal Dilation</h4>
                <p className="text-xs text-white/40">Adjust the relative time scale for the simulation.</p>
              </div>
            </div>
            <div className="flex-1 w-full space-y-4">
               <div className="flex justify-between font-mono text-[10px] text-white/40">
                  <span>0.25x</span>
                  <span className="text-white font-bold">{timeScale.toFixed(2)}x</span>
                  <span>3.00x</span>
               </div>
               <input 
                type="range" min="0.25" max="3" step="0.25" value={timeScale} 
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Impact Analysis */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] rotate-12">
            <Settings2 className="w-32 h-32" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Impact Analysis</h3>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">Simulation Delta-V</p>
          </div>

          <div className="space-y-6">
            {[
              { label: "Gravitational Load", val: (gravity / 9.8).toFixed(2) + " G", color: "text-blue-400" },
              { label: "Drag Induction", val: dragEnabled ? (drag * 15).toFixed(1) + "%" : "0.0%", color: "text-emerald-400" },
              { label: "Friction Loss", val: (friction * 100).toFixed(0) + " %", color: "text-pink-400" },
              { label: "Wind Force Peak", val: (wind * 0.8).toFixed(1) + " N", color: "text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
                  <span className={cn("text-sm font-mono font-bold", stat.color)}>{stat.val}</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    className={cn("h-full", stat.color.replace('text-', 'bg-'))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-[10px] text-blue-400/80 leading-relaxed">
                Environment changes take effect immediately on next simulation cycle (60Hz).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

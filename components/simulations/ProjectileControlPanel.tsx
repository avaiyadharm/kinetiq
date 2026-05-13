"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Globe2, Rocket, Zap, Compass, Weight, Info } from "lucide-react";

interface ProjectileControlPanelProps {
  angle: number;
  setAngle: (v: number) => void;
  velocity: number;
  setVelocity: (v: number) => void;
  mass: number;
  setMass: (v: number) => void;
  gravity: number;
  setGravity: (v: number) => void;
  airResistance: boolean;
  setAirResistance: (v: boolean) => void;
  showPath: boolean;
  setShowPath: (v: boolean) => void;
}

const planets = [
  { name: "Mercury", gravity: 3.7, style: "bg-gradient-to-br from-gray-400 to-gray-600 shadow-[0_0_10px_rgba(156,163,175,0.4)]" },
  { name: "Venus", gravity: 8.87, style: "bg-gradient-to-br from-yellow-600 to-orange-800 shadow-[0_0_10px_rgba(234,179,8,0.4)]" },
  { name: "Earth", gravity: 9.81, style: "bg-gradient-to-br from-blue-500 to-emerald-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]" },
  { name: "Moon", gravity: 1.62, style: "bg-gradient-to-br from-slate-200 to-slate-400 shadow-[0_0_10px_rgba(255,255,255,0.4)]" },
  { name: "Mars", gravity: 3.71, style: "bg-gradient-to-br from-red-500 to-orange-700 shadow-[0_0_10px_rgba(239,68,68,0.4)]" },
  { name: "Jupiter", gravity: 24.79, style: "bg-gradient-to-br from-amber-600 to-orange-900 shadow-[0_0_10px_rgba(245,158,11,0.4)]" },
  { name: "Saturn", gravity: 10.44, style: "bg-gradient-to-br from-yellow-500 to-amber-700 shadow-[0_0_10px_rgba(234,179,8,0.3)] ring-1 ring-amber-500/20" },
  { name: "Uranus", gravity: 8.69, style: "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]" },
  { name: "Neptune", gravity: 11.15, style: "bg-gradient-to-br from-blue-700 to-indigo-900 shadow-[0_0_10px_rgba(67,56,202,0.4)]" },
  { name: "Pluto", gravity: 0.62, style: "bg-gradient-to-br from-slate-400 to-stone-600 shadow-[0_0_10px_rgba(148,163,184,0.3)]" },
];

const PlanetSphere = ({ style, selected }: { style: string, selected: boolean }) => (
  <div className={cn(
    "w-6 h-6 rounded-full transition-transform duration-500",
    style,
    selected ? "scale-110" : "scale-90 opacity-60 grayscale-[0.2]"
  )} />
);

const CustomToggle = ({ checked, colorClass = "bg-primary" }: { checked: boolean, colorClass?: string }) => (
  <div className={cn(
    "relative w-10 h-5 rounded-full transition-colors duration-200 border border-white/10",
    checked ? colorClass : "bg-white/5"
  )}>
    <motion.div 
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm"
    />
  </div>
);

export const ProjectileControlPanel: React.FC<Readonly<ProjectileControlPanelProps>> = ({
  angle, setAngle,
  velocity, setVelocity,
  mass, setMass,
  gravity, setGravity,
  airResistance, setAirResistance,
  showPath, setShowPath
}) => {
  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-2 scrollbar-hide pb-6">
      {/* 1. Launch Angle */}
      <div className="space-y-3 px-1">
        <div className="flex justify-between items-center group/value">
          <Label className="text-[10px] font-bold text-white/40 group-hover/value:text-white transition-colors cursor-default uppercase tracking-widest flex items-center gap-2">
            <Compass className="w-3 h-3 text-primary" />
            Launch Angle
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono text-sm font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
              {angle}°
            </span>
          </div>
        </div>
        <Slider value={[angle]} onValueChange={(v) => setAngle(v[0])} max={90} step={1} className="cursor-pointer" />
      </div>

      {/* 2. Initial Velocity */}
      <div className="space-y-3 px-1">
        <div className="flex justify-between items-center group/value">
          <Label className="text-[10px] font-bold text-white/40 group-hover/value:text-white transition-colors cursor-default uppercase tracking-widest flex items-center gap-2">
            <Rocket className="w-3 h-3 text-success" />
            Launch Velocity
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-success font-mono text-sm font-bold bg-success/10 px-2 py-0.5 rounded border border-success/30">
              {velocity} m/s
            </span>
          </div>
        </div>
        <Slider value={[velocity]} onValueChange={(v) => setVelocity(v[0])} max={50} step={0.1} className="cursor-pointer" />
      </div>

      {/* 3. Celestial Environment Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Globe2 className="w-3 h-3 text-indigo-400" />
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Celestial Environment</Label>
        </div>
        
        <div className="grid grid-cols-5 gap-2 px-1">
          {planets.map((planet) => (
            <motion.button
              key={planet.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGravity(planet.gravity)}
              className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-xl border transition-all duration-300",
                gravity === planet.gravity 
                  ? "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                  : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <PlanetSphere style={planet.style} selected={gravity === planet.gravity} />
              <span className={cn(
                "text-[7px] font-bold uppercase tracking-tighter transition-colors",
                gravity === planet.gravity ? "text-white" : "text-white/30"
              )}>{planet.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 4. Gravity & Mass */}
      <div className="grid grid-cols-2 gap-4 px-1">
        <div className="space-y-3">
           <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-400" />
            Gravity
          </Label>
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-2 text-center">
            <span className="text-amber-400 font-mono text-xs font-bold">{gravity.toFixed(2)} m/s²</span>
          </div>
          <Slider value={[gravity]} onValueChange={(v) => setGravity(v[0])} max={30} min={0.1} step={0.01} className="cursor-pointer" />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Weight className="w-3 h-3 text-purple-400" />
            Mass
          </Label>
          <div className="bg-purple-400/5 border border-purple-400/20 rounded-lg p-2 text-center">
            <span className="text-purple-400 font-mono text-xs font-bold">{mass} kg</span>
          </div>
          <Slider value={[mass]} onValueChange={(v) => setMass(v[0])} max={50} min={0.1} step={0.1} className="cursor-pointer" />
        </div>
      </div>

      {/* 6. Physics Theory & Formulas */}
      <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Theory & Formulas</Label>
        </div>

        <div className="space-y-3 font-serif italic text-white/60 text-[11px] leading-relaxed">
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 not-italic font-sans">
             <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Max Height (H)</span>
                <span className="text-primary font-mono text-[10px]">u² sin² θ / 2g</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Horizontal Range (R)</span>
                <span className="text-success font-mono text-[10px]">u² sin 2θ / g</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Time of Flight (T)</span>
                <span className="text-success font-mono text-[10px]">2u sin θ / g</span>
             </div>
             
          </div>
          <p className="px-1 text-[10px] text-white/30">
            * These formulas assume ground-to-ground trajectory and neglect air resistance for ideal kinematic analysis.
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3 mt-auto px-1">
        <div 
          onClick={() => setAirResistance(!airResistance)}
          className={cn(
            "flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer group/toggle",
            airResistance ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/5"
          )}
        >
          <div className="flex items-center justify-between">
             <span className="text-[9px] font-bold text-white/60 uppercase">Air Drag</span>
             <CustomToggle checked={airResistance} colorClass="bg-primary" />
          </div>
          <span className={cn("text-[8px] font-bold", airResistance ? "text-primary" : "text-white/20")}>
            {airResistance ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div 
          onClick={() => setShowPath(!showPath)}
          className={cn(
            "flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer group/toggle",
            showPath ? "bg-success/10 border-success/30" : "bg-white/5 border-white/5"
          )}
        >
          <div className="flex items-center justify-between">
             <span className="text-[9px] font-bold text-white/60 uppercase">Path</span>
             <CustomToggle checked={showPath} colorClass="bg-success" />
          </div>
          <span className={cn("text-[8px] font-bold", showPath ? "text-success" : "text-white/20")}>
            {showPath ? "Visible" : "Hidden"}
          </span>
        </div>
      </div>
    </div>
  );
};

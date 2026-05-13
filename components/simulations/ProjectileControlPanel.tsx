"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProjectileControlPanelProps {
  angle: number;
  setAngle: (v: number) => void;
  velocity: number;
  setVelocity: (v: number) => void;
  mass: number;
  setMass: (v: number) => void;
  airResistance: boolean;
  setAirResistance: (v: boolean) => void;
  showPath: boolean;
  setShowPath: (v: boolean) => void;
}

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
  airResistance, setAirResistance,
  showPath, setShowPath
}) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Angle Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default uppercase tracking-tight">Launch Angle</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-primary font-mono text-sm font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.1)] group-hover/badge:bg-primary/20 group-hover/badge:border-primary/50 transition-colors">
              {angle}°
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </span>
          </div>
        </div>
        <Slider value={[angle]} onValueChange={(v) => setAngle(v[0])} max={90} step={1} className="cursor-pointer" />
      </div>

      {/* Velocity Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default uppercase tracking-tight">Initial Velocity</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-success font-mono text-sm font-bold bg-success/10 px-2 py-0.5 rounded border border-success/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.1)] group-hover/badge:bg-success/20 group-hover/badge:border-success/50 transition-colors">
              {velocity} m/s
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </span>
          </div>
        </div>
        <Slider value={[velocity]} onValueChange={(v) => setVelocity(v[0])} max={50} step={0.1} className="cursor-pointer" />
      </div>

      {/* Mass Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default uppercase tracking-tight">Projectile Mass</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-accent font-mono text-sm font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover/badge:bg-accent/20 group-hover/badge:border-accent/50 transition-colors">
              {mass} kg
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            </span>
          </div>
        </div>
        <Slider value={[mass]} onValueChange={(v) => setMass(v[0])} max={50} min={0.1} step={0.1} className="cursor-pointer" />
      </div>

      <div className="pt-2 flex flex-col gap-3 mt-auto">
        <div 
          onClick={() => setAirResistance(!airResistance)}
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group/toggle",
            airResistance 
              ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]" 
              : "bg-[#18181b] border-white/5 hover:border-white/10"
          )}
        >
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-white group-hover/toggle:text-primary transition-colors pointer-events-none uppercase tracking-tight">Air Resistance</Label>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", airResistance ? "text-primary/70" : "text-white/20")}>
              {airResistance ? "Enabled" : "Disabled"}
            </span>
          </div>
          <CustomToggle checked={airResistance} colorClass="bg-primary" />
        </div>

        <div 
          onClick={() => setShowPath(!showPath)}
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group/toggle",
            showPath 
              ? "bg-success/10 border-success/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
              : "bg-[#18181b] border-white/5 hover:border-white/10"
          )}
        >
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-bold text-white group-hover/toggle:text-success transition-colors pointer-events-none uppercase tracking-tight">Show Trajectory</Label>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", showPath ? "text-success/70" : "text-white/20")}>
              {showPath ? "Visible" : "Hidden"}
            </span>
          </div>
          <CustomToggle checked={showPath} colorClass="bg-success" />
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

export const ProjectileControlPanel: React.FC<Readonly<ProjectileControlPanelProps>> = ({
  angle, setAngle,
  velocity, setVelocity,
  mass, setMass,
  airResistance, setAirResistance,
  showPath, setShowPath
}) => {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Angle Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white">Launch Angle</Label>
          <span className="text-primary font-mono text-sm font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{angle}°</span>
        </div>
        <Slider 
          value={[angle]} 
          onValueChange={(v) => setAngle(v[0])} 
          max={90} 
          step={1} 
          className="cursor-pointer"
        />
      </div>

      {/* Velocity Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white">Initial Velocity</Label>
          <span className="text-success font-mono text-sm font-bold bg-success/10 px-2 py-0.5 rounded border border-success/20">{velocity} m/s</span>
        </div>
        <Slider 
          value={[velocity]} 
          onValueChange={(v) => setVelocity(v[0])} 
          max={50} 
          step={0.1} 
          className="cursor-pointer"
        />
      </div>

      <div className="pt-2 grid grid-cols-2 gap-4 mt-auto">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/40 border border-border shadow-sm">
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Air Resistance</Label>
          <Switch checked={airResistance} onCheckedChange={setAirResistance} className="data-[state=checked]:bg-primary" />
        </div>
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-black/40 border border-border shadow-sm">
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Show Trajectory</Label>
          <Switch checked={showPath} onCheckedChange={setShowPath} className="data-[state=checked]:bg-primary" />
        </div>
      </div>
    </div>
  );
};

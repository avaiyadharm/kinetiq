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
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col gap-8">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Kinematics</h3>
      
      {/* Angle Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white/80">Launch Angle</Label>
          <span className="text-blue-400 font-mono text-sm font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{angle}°</span>
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
          <Label className="text-sm font-bold text-white/80">Initial Velocity</Label>
          <span className="text-purple-400 font-mono text-sm font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{velocity} m/s</span>
        </div>
        <Slider 
          value={[velocity]} 
          onValueChange={(v) => setVelocity(v[0])} 
          max={50} 
          step={0.1} 
          className="cursor-pointer"
        />
      </div>

      <div className="pt-2 grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Air Resistance</Label>
          <Switch checked={airResistance} onCheckedChange={setAirResistance} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Show Trajectory</Label>
          <Switch checked={showPath} onCheckedChange={setShowPath} />
        </div>
      </div>
    </div>
  );
};

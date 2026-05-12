"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PendulumControlPanelProps {
  length: number;
  setLength: (v: number) => void;
  mass: number;
  setMass: (v: number) => void;
  gravity: number;
  setGravity: (v: number) => void;
  friction: number;
  setFriction: (v: number) => void;
  showGraphs: boolean;
  setShowGraphs: (v: boolean) => void;
}

export const PendulumControlPanel: React.FC<Readonly<PendulumControlPanelProps>> = ({
  length, setLength,
  mass, setMass,
  gravity, setGravity,
  friction, setFriction,
  showGraphs, setShowGraphs
}) => {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Length Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white">String Length (L)</Label>
          <span className="text-primary font-mono text-sm font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{length.toFixed(1)}m</span>
        </div>
        <Slider 
          value={[length]} 
          onValueChange={(v) => setLength(v[0])} 
          min={0.1}
          max={1.0} 
          step={0.1} 
          className="cursor-pointer"
        />
      </div>

      {/* Mass Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white">Bob Mass (m)</Label>
          <span className="text-success font-mono text-sm font-bold bg-success/10 px-2 py-0.5 rounded border border-success/20">{mass.toFixed(1)}kg</span>
        </div>
        <Slider 
          value={[mass]} 
          onValueChange={(v) => setMass(v[0])} 
          min={0.1}
          max={2.0} 
          step={0.1} 
          className="cursor-pointer"
        />
      </div>

      {/* Gravity Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white">Gravity (g)</Label>
          <span className="text-amber-500 font-mono text-sm font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{gravity.toFixed(1)} m/s²</span>
        </div>
        <Slider 
          value={[gravity]} 
          onValueChange={(v) => setGravity(v[0])} 
          min={1.6}
          max={24.8} 
          step={0.1} 
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-tighter">
           <span>Moon (1.6)</span>
           <span>Earth (9.8)</span>
           <span>Jupiter (24.8)</span>
        </div>
      </div>

      {/* Friction Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-bold text-white">Damping (Friction)</Label>
          <span className="text-red-500 font-mono text-sm font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{(friction * 100).toFixed(0)}%</span>
        </div>
        <Slider 
          value={[friction]} 
          onValueChange={(v) => setFriction(v[0])} 
          min={0}
          max={0.5} 
          step={0.01} 
          className="cursor-pointer"
        />
      </div>

      <div className="pt-2 mt-auto">
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-border">
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold text-white uppercase tracking-widest">Real-time Telemetry</Label>
            <p className="text-[10px] text-white/40">Enable Period/Energy Graphs</p>
          </div>
          <Switch checked={showGraphs} onCheckedChange={setShowGraphs} className="data-[state=checked]:bg-primary" />
        </div>
      </div>
    </div>
  );
};

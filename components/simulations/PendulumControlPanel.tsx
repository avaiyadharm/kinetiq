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
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default">String Length (L)</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-primary font-mono text-sm font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.1)] group-hover/badge:bg-primary/20 group-hover/badge:border-primary/50 transition-colors">
              {length.toFixed(1)}m
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </span>
          </div>
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
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default">Bob Mass (m)</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-success font-mono text-sm font-bold bg-success/10 px-2 py-0.5 rounded border border-success/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.1)] group-hover/badge:bg-success/20 group-hover/badge:border-success/50 transition-colors">
              {mass.toFixed(1)}kg
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </span>
          </div>
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
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default">Gravity (g)</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-amber-500 font-mono text-sm font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover/badge:bg-amber-500/20 group-hover/badge:border-amber-500/50 transition-colors">
              {gravity.toFixed(1)} m/s²
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </span>
          </div>
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
        <div className="flex justify-between items-center group/value">
          <Label className="text-sm font-bold text-white/70 group-hover/value:text-white transition-colors cursor-default">Damping (Friction)</Label>
          <div className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all active:scale-95 group/badge">
            <span className="text-red-500 font-mono text-sm font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover/badge:bg-red-500/20 group-hover/badge:border-red-500/50 transition-colors">
              {(friction * 100).toFixed(0)}%
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </span>
          </div>
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

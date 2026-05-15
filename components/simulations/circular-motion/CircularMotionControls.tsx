"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Zap, Target, ArrowRight } from "lucide-react";

interface CircularMotionControlsProps {
  radius: number;
  setRadius: (v: number) => void;
  mass: number;
  setMass: (v: number) => void;
  tangentialForce: number;
  setTangentialForce: (v: number) => void;
  initialOmega: number;
  setInitialOmega: (v: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  onReset: () => void;
  showVectors: any;
  setShowVectors: (v: any) => void;
  showTrail: boolean;
  setShowTrail: (v: boolean) => void;
  isUCM: boolean;
  setIsUCM: (v: boolean) => void;
}

export const CircularMotionControls: React.FC<CircularMotionControlsProps> = ({
  radius,
  setRadius,
  mass,
  setMass,
  tangentialForce,
  setTangentialForce,
  initialOmega,
  setInitialOmega,
  isPlaying,
  setIsPlaying,
  onReset,
  showVectors,
  setShowVectors,
  showTrail,
  setShowTrail,
  isUCM,
  setIsUCM,
}) => {
  const toggleVector = (key: string) => {
    setShowVectors({ ...showVectors, [key]: !showVectors[key] });
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md h-full overflow-y-auto custom-scrollbar">
      {/* Simulation State */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant={isPlaying ? "destructive" : "default"}
          className="flex-1 gap-2 font-bold tracking-tight uppercase text-xs"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Start"}
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1 gap-2 border-white/10 hover:bg-white/5 font-bold tracking-tight uppercase text-xs"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div className="h-px bg-white/5" />

      {/* Physics Mode */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs font-bold text-white/60 uppercase tracking-widest">Physics Mode</Label>
            <p className="text-[10px] text-white/40">{isUCM ? "Uniform Circular Motion" : "Non-Uniform Circular Motion"}</p>
          </div>
          <Switch checked={isUCM} onCheckedChange={setIsUCM} />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Parameters */}
      <div className="space-y-6">
        {/* Radius */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3 text-indigo-400" /> Radius (r)
            </Label>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">{radius.toFixed(2)}m</span>
          </div>
          <Slider
            value={[radius]}
            min={0.5}
            max={1.8}
            step={0.05}
            onValueChange={(v) => setRadius(v[0])}
          />
        </div>

        {/* Mass */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3 text-emerald-400" /> Mass (m)
            </Label>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{mass.toFixed(1)}kg</span>
          </div>
          <Slider
            value={[mass]}
            min={0.1}
            max={5.0}
            step={0.1}
            onValueChange={(v) => setMass(v[0])}
          />
        </div>

        {/* Initial Omega / Force */}
        {isUCM ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <RotateCcw className="w-3 h-3 text-cyan-400" /> Angular Velocity (ω)
              </Label>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{initialOmega.toFixed(2)} rad/s</span>
            </div>
            <Slider
              value={[initialOmega]}
              min={0}
              max={10}
              step={0.1}
              onValueChange={(v) => setInitialOmega(v[0])}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <ArrowRight className="w-3 h-3 text-orange-400" /> Tangential Force (Fₜ)
              </Label>
              <span className="text-xs font-mono text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">{tangentialForce.toFixed(1)}N</span>
            </div>
            <Slider
              value={[tangentialForce]}
              min={-10}
              max={10}
              step={0.5}
              onValueChange={(v) => setTangentialForce(v[0])}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-white/5" />

      {/* Visual Toggles */}
      <div className="space-y-4">
        <Label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Visual Overlays</Label>
        
        <div className="grid grid-cols-2 gap-3">
            {[
                { id: 'velocity', label: 'Velocity', color: 'border-cyan-500/50 text-cyan-400' },
                { id: 'centripetal', label: 'Centripetal', color: 'border-pink-500/50 text-pink-400' },
                { id: 'tangential', label: 'Tangential', color: 'border-orange-500/50 text-orange-400' },
                { id: 'resultant', label: 'Resultant', color: 'border-emerald-500/50 text-emerald-400' },
                { id: 'radius', label: 'Radius', color: 'border-indigo-500/50 text-indigo-400' },
            ].map(v => (
                <button
                    key={v.id}
                    onClick={() => toggleVector(v.id)}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                        showVectors[v.id] ? v.color + ' bg-white/5' : 'border-white/5 text-white/20 hover:border-white/10'
                    }`}
                >
                    {v.label}
                </button>
            ))}
            <button
                onClick={() => setShowTrail(!showTrail)}
                className={`px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                    showTrail ? 'border-white/20 text-white bg-white/10' : 'border-white/5 text-white/20 hover:border-white/10'
                }`}
            >
                Path Trail
            </button>
        </div>
      </div>
    </div>
  );
};

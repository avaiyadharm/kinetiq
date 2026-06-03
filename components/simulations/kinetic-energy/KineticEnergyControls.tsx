"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Weight, Compass, Zap, HelpCircle, Activity } from "lucide-react";

interface KineticEnergyControlsProps {
  subMode: string;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;

  // Translational
  transMass: number;
  setTransMass: (v: number) => void;
  transVelocity: number;
  setTransVelocity: (v: number) => void;
  transFriction: number;
  setTransFriction: (v: number) => void;
  setImpulseBoost: React.Dispatch<React.SetStateAction<number>>;

  // Rotational
  rotShape: "ring" | "disk" | "sphere" | "rod";
  setRotShape: (v: "ring" | "disk" | "sphere" | "rod") => void;
  rotMass: number;
  setRotMass: (v: number) => void;
  rotRadius: number;
  setRotRadius: (v: number) => void;
  rotOmega: number;
  setRotOmega: (v: number) => void;

  // Relativistic
  relMass: number;
  setRelMass: (v: number) => void;
  relBeta: number;
  setRelBeta: (v: number) => void;

  // Thermal
  thermalTemp: number;
  setThermalTemp: (v: number) => void;
  thermalGas: "He" | "Ar" | "Xe";
  setThermalGas: (v: "He" | "Ar" | "Xe") => void;
  particleCount: number;
  setParticleCount: (v: number) => void;

  // Quantum
  quantumN: number;
  setQuantumN: (v: number) => void;
  wellWidth: number;
  setWellWidth: (v: number) => void;
  quantumParticle: "electron" | "proton";
  setQuantumParticle: (v: "electron" | "proton") => void;
}

// Custom text/number input for sliders
const ValueInput = ({
  value,
  onChange,
  min,
  max,
  suffix,
  colorClass = "bg-primary/10 border-primary/30 text-primary",
  step = 1
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix: string;
  colorClass?: string;
  step?: number;
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toFixed(2));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    setLocalValue(value.toFixed(step >= 1 ? 0 : 2));
  };

  return (
    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded border transition-all focus-within:ring-1", colorClass)}>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        step={step}
        className="bg-transparent border-none outline-none font-mono text-xs font-bold w-14 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white"
      />
      <span className="text-[9px] font-bold opacity-45 uppercase text-white/50">{suffix}</span>
    </div>
  );
};

export const KineticEnergyControls: React.FC<Readonly<KineticEnergyControlsProps>> = ({
  subMode,
  isPlaying,
  setIsPlaying,

  // Translational
  transMass, setTransMass,
  transVelocity, setTransVelocity,
  transFriction, setTransFriction,
  setImpulseBoost,

  // Rotational
  rotShape, setRotShape,
  rotMass, setRotMass,
  rotRadius, setRotRadius,
  rotOmega, setRotOmega,

  // Relativistic
  relMass, setRelMass,
  relBeta, setRelBeta,

  // Thermal
  thermalTemp, setThermalTemp,
  thermalGas, setThermalGas,
  particleCount, setParticleCount,

  // Quantum
  quantumN, setQuantumN,
  wellWidth, setWellWidth,
  quantumParticle, setQuantumParticle,
}) => {
  return (
    <div className="flex flex-col gap-4">
      
      {/* Simulation Playback State */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 border",
            isPlaying
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          )}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Pause Sim
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Sim
            </>
          )}
        </button>
      </div>

      {/* ── 1. TRANSLATIONAL CONTROLS ── */}
      {subMode === "translational" && (
        <div className="space-y-4">
          {/* Mass Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Weight className="w-3 h-3 text-cyan-400" />
                Block Mass
              </Label>
              <ValueInput
                value={transMass}
                onChange={setTransMass}
                min={0.5} max={50.0}
                step={0.1}
                suffix="kg"
              />
            </div>
            <Slider
              value={[transMass]}
              onValueChange={(v) => setTransMass(v[0])}
              min={0.5} max={50.0} step={0.1}
              className="cursor-pointer"
            />
          </div>

          {/* Velocity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                Initial Velocity
              </Label>
              <ValueInput
                value={transVelocity}
                onChange={setTransVelocity}
                min={-30.0} max={30.0}
                step={0.5}
                suffix="m/s"
              />
            </div>
            <Slider
              value={[transVelocity]}
              onValueChange={(v) => setTransVelocity(v[0])}
              min={-30.0} max={30.0} step={0.5}
              className="cursor-pointer"
            />
          </div>

          {/* Friction Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                Friction Coeff.
              </Label>
              <ValueInput
                value={transFriction}
                onChange={setTransFriction}
                min={0.0} max={0.8}
                step={0.01}
                suffix="μ"
              />
            </div>
            <Slider
              value={[transFriction]}
              onValueChange={(v) => setTransFriction(v[0])}
              min={0.0} max={0.8} step={0.01}
              className="cursor-pointer"
            />
          </div>

          {/* Sudden Impulse Push */}
          <button
            onClick={() => setImpulseBoost((prev) => prev + 1)}
            className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-bold rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-cyan-400/20" />
            Apply Impulse (+15 N·s)
          </button>
        </div>
      )}

      {/* ── 2. ROTATIONAL CONTROLS ── */}
      {subMode === "rotational" && (
        <div className="space-y-4">
          {/* Shape Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Inertia Geometry</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["ring", "disk", "sphere", "rod"] as const).map((shape) => (
                <button
                  key={shape}
                  onClick={() => setRotShape(shape)}
                  className={cn(
                    "py-2 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition-all",
                    rotShape === shape
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-lg"
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white/80"
                  )}
                >
                  {shape === "ring" && "Thin Ring (MR²)"}
                  {shape === "disk" && "Solid Disk (½MR²)"}
                  {shape === "sphere" && "Solid Sphere (⅖MR²)"}
                  {shape === "rod" && "Center Rod (¹/₁₂ML²)"}
                </button>
              ))}
            </div>
          </div>

          {/* Rotational Mass */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Weight className="w-3 h-3 text-cyan-400" />
                Rotor Mass
              </Label>
              <ValueInput
                value={rotMass}
                onChange={setRotMass}
                min={0.2} max={10.0}
                step={0.1}
                suffix="kg"
              />
            </div>
            <Slider
              value={[rotMass]}
              onValueChange={(v) => setRotMass(v[0])}
              min={0.2} max={10.0} step={0.1}
              className="cursor-pointer"
            />
          </div>

          {/* Rotational Radius */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                Rotor Radius
              </Label>
              <ValueInput
                value={rotRadius}
                onChange={setRotRadius}
                min={0.1} max={2.0}
                step={0.05}
                suffix="m"
              />
            </div>
            <Slider
              value={[rotRadius]}
              onValueChange={(v) => setRotRadius(v[0])}
              min={0.1} max={2.0} step={0.05}
              className="cursor-pointer"
            />
          </div>

          {/* Angular Velocity ω */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                Angular Speed (ω)
              </Label>
              <ValueInput
                value={rotOmega}
                onChange={setRotOmega}
                min={0.0} max={40.0}
                step={0.5}
                suffix="rad/s"
              />
            </div>
            <Slider
              value={[rotOmega]}
              onValueChange={(v) => setRotOmega(v[0])}
              min={0.0} max={40.0} step={0.5}
              className="cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── 3. RELATIVISTIC CONTROLS ── */}
      {subMode === "relativistic" && (
        <div className="space-y-4">
          {/* Particle Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Test Particle</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["electron", "proton"] as const).map((particle) => (
                <button
                  key={particle}
                  onClick={() => setQuantumParticle(particle)}
                  className={cn(
                    "py-2 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition-all",
                    quantumParticle === particle
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white/80"
                  )}
                >
                  {particle === "electron" ? "Electron (0.511 MeV)" : "Proton (938.3 MeV)"}
                </button>
              ))}
            </div>
          </div>

          {/* Particle Scaling factor (Mass) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Weight className="w-3 h-3 text-cyan-400" />
                Mass Multiplier
              </Label>
              <ValueInput
                value={relMass}
                onChange={setRelMass}
                min={0.1} max={10.0}
                step={0.1}
                suffix="x"
              />
            </div>
            <Slider
              value={[relMass]}
              onValueChange={(v) => setRelMass(v[0])}
              min={0.1} max={10.0} step={0.1}
              className="cursor-pointer"
            />
          </div>

          {/* Speed Beta v/c */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                Velocity Fraction (v/c)
              </Label>
              <ValueInput
                value={relBeta}
                onChange={setRelBeta}
                min={0.0} max={0.999}
                step={0.001}
                suffix="c"
              />
            </div>
            <Slider
              value={[relBeta]}
              onValueChange={(v) => setRelBeta(v[0])}
              min={0.0} max={0.999} step={0.001}
              className="cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── 4. THERMAL CONTROLS ── */}
      {subMode === "thermal" && (
        <div className="space-y-4">
          {/* Gas Type Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ideal Gas Species</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["He", "Ar", "Xe"] as const).map((gas) => (
                <button
                  key={gas}
                  onClick={() => setThermalGas(gas)}
                  className={cn(
                    "py-2 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition-all",
                    thermalGas === gas
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white/80"
                  )}
                >
                  {gas === "He" && "Helium (4u)"}
                  {gas === "Ar" && "Argon (40u)"}
                  {gas === "Xe" && "Xenon (131u)"}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature (K) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                Temperature
              </Label>
              <ValueInput
                value={thermalTemp}
                onChange={setThermalTemp}
                min={10} max={1200}
                step={5}
                suffix="K"
              />
            </div>
            <Slider
              value={[thermalTemp]}
              onValueChange={(v) => setThermalTemp(v[0])}
              min={10} max={1200} step={5}
              className="cursor-pointer"
            />
          </div>

          {/* Molecular Density (Particle Count) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Weight className="w-3 h-3 text-cyan-400" />
                Molecules Count
              </Label>
              <ValueInput
                value={particleCount}
                onChange={setParticleCount}
                min={20} max={200}
                step={5}
                suffix="pcs"
              />
            </div>
            <Slider
              value={[particleCount]}
              onValueChange={(v) => setParticleCount(v[0])}
              min={20} max={200} step={5}
              className="cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── 5. QUANTUM CONTROLS ── */}
      {subMode === "quantum" && (
        <div className="space-y-4">
          {/* Particle Type */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Confined Particle</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["electron", "proton"] as const).map((particle) => (
                <button
                  key={particle}
                  onClick={() => setQuantumParticle(particle)}
                  className={cn(
                    "py-2 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition-all",
                    quantumParticle === particle
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white/80"
                  )}
                >
                  {particle === "electron" ? "Electron" : "Proton"}
                </button>
              ))}
            </div>
          </div>

          {/* Quantum State n */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                Energy State (n)
              </Label>
              <ValueInput
                value={quantumN}
                onChange={setQuantumN}
                min={1} max={5}
                step={1}
                suffix="idx"
              />
            </div>
            <Slider
              value={[quantumN]}
              onValueChange={(v) => setQuantumN(v[0])}
              min={1} max={5} step={1}
              className="cursor-pointer"
            />
          </div>

          {/* Box Width L (nm) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                Well Width (L)
              </Label>
              <ValueInput
                value={wellWidth}
                onChange={setWellWidth}
                min={0.5} max={4.0}
                step={0.1}
                suffix="nm"
              />
            </div>
            <Slider
              value={[wellWidth]}
              onValueChange={(v) => setWellWidth(v[0])}
              min={0.5} max={4.0} step={0.1}
              className="cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── INFO BOX FOOTER ── */}
      <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
        <div className="flex items-center gap-1.5 text-white/40">
          <HelpCircle className="w-4 h-4 text-cyan-500" />
          <Label className="text-[10px] font-bold uppercase tracking-wider">Physics Formula Summary</Label>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 font-mono text-[10.5px]">
          {subMode === "translational" && (
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Formula</span>
              <span>KE = ½ m v²</span>
            </div>
          )}
          {subMode === "rotational" && (
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Formula</span>
              <span>KE_rot = ½ I ω²</span>
            </div>
          )}
          {subMode === "relativistic" && (
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Formula</span>
              <span>KE = (γ - 1) m c²</span>
            </div>
          )}
          {subMode === "thermal" && (
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Formula</span>
              <span>KE_avg = ³/₂ k_B T</span>
            </div>
          )}
          {subMode === "quantum" && (
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Formula</span>
              <span>E_n = n²h² / (8mL²)</span>
            </div>
          )}
        </div>
        <p className="px-1 text-[9px] text-white/20 leading-normal">
          Change tabs above to see detailed LaTeX derivations or analytical comparison charts.
        </p>
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Zap, Settings2, Activity, Sliders, RefreshCw, Sparkles, 
  HelpCircle, Info, AlertTriangle, CheckCircle2, ChevronRight, Gauge
} from "lucide-react";
import { WaveformType } from "./ResonanceCanvas";

interface ResonanceEnvironmentProps {
  mass: number;
  setMass: (v: number) => void;
  springK: number;
  setSpringK: (v: number) => void;
  dampingB: number;
  setDampingB: (v: number) => void;
  driverAmp: number;
  setDriverAmp: (v: number) => void;
  driverFreq: number;
  setDriverFreq: (v: number) => void;
  waveform: WaveformType;
  setWaveform: (v: WaveformType) => void;
  activePreset: string;
  setActivePreset: (v: string) => void;
  simMode: "single" | "coupled" | "duffing" | "parametric" | "beats";
  setSimMode: (v: "single" | "coupled" | "duffing" | "parametric" | "beats") => void;
  duffingAlpha: number;
  setDuffingAlpha: (v: number) => void;
  couplingK: number;
  setCouplingK: (v: number) => void;
  mass2: number;
  setMass2: (v: number) => void;
  dampingB2: number;
  setDampingB2: (v: number) => void;
  
  // Custom added props
  springK2: number;
  setSpringK2: (v: number) => void;
  couplingB: number;
  setCouplingB: (v: number) => void;
  driverAmp2: number;
  setDriverAmp2: (v: number) => void;
  driverFreq2: number;
  setDriverFreq2: (v: number) => void;
  initX1: number;
  setInitX1: (v: number) => void;
  initV1: number;
  setInitV1: (v: number) => void;
  initX2: number;
  setInitX2: (v: number) => void;
  initV2: number;
  setInitV2: (v: number) => void;
  parametricEpsilon: number;
  setParametricEpsilon: (v: number) => void;
  timeStep: number;
  setTimeStep: (v: number) => void;
  solverTolerance: number;
  setSolverTolerance: (v: number) => void;
  adaptiveStepping: boolean;
  setAdaptiveStepping: (v: boolean) => void;
  integrator: "rk4" | "symplectic_euler" | "velocity_verlet" | "adaptive_rk";
  setIntegrator: (v: "rk4" | "symplectic_euler" | "velocity_verlet" | "adaptive_rk") => void;
  substeps: number;
  setSubsteps: (v: number) => void;
  telemetry: {
    currentAmplitude: number;
    currentAmplitude2: number;
    qFactor: number;
    phaseLagDeg: number;
    peakFreqHz: number;
    naturalFreqHz: number;
    currentFreqHz: number;
    dissipatedPower: number;
    totalEnergy: number;
    integrationError: number;
    solverStatus: string;
    energyDrift: number;
    truncationError: number;
  };
}

export const PRESETS = [
  {
    name: "Tuning Fork (High Q)",
    mass: 1.0,
    springK: 400.0,
    dampingB: 0.08,
    driverAmp: 2.0,
    driverFreq: 3.18,
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    springK2: 100.0,
    couplingB: 0.0,
    driverAmp2: 0.0,
    driverFreq2: 1.5,
    initX1: 0.0,
    initV1: 0.0,
    initX2: 0.0,
    initV2: 0.0,
    parametricEpsilon: 0.3,
    timeStep: 0.005,
    substeps: 20,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Extremely low internal friction, leading to a sharp mechanical resonance. Oscillates for a long time at a single frequency with Q ≈ 250."
  },
  {
    name: "Shock Absorber (Critical)",
    mass: 5.0,
    springK: 250.0,
    dampingB: 70.7,
    driverAmp: 15.0,
    driverFreq: 0.5,
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    springK2: 100.0,
    couplingB: 0.0,
    driverAmp2: 0.0,
    driverFreq2: 1.5,
    initX1: 1.5,
    initV1: 0.0,
    initX2: 0.0,
    initV2: 0.0,
    parametricEpsilon: 0.3,
    timeStep: 0.01,
    substeps: 20,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Damped precisely near the critical point (b = 2*sqrt(k*m)) to prevent ongoing oscillations. Returns quickly to equilibrium."
  },
  {
    name: "Seismograph (Overdamped)",
    mass: 8.0,
    springK: 80.0,
    dampingB: 80.0,
    driverAmp: 25.0,
    driverFreq: 0.2,
    waveform: "sine" as WaveformType,
    simMode: "single" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    springK2: 100.0,
    couplingB: 0.0,
    driverAmp2: 0.0,
    driverFreq2: 1.5,
    initX1: 1.0,
    initV1: 0.0,
    initX2: 0.0,
    initV2: 0.0,
    parametricEpsilon: 0.3,
    timeStep: 0.01,
    substeps: 20,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Highly viscous environment with high mass inertia. Returns slowly to equilibrium without oscillating, tracking long-period waves."
  },
  {
    name: "Duffing Bistability",
    mass: 1.0,
    springK: 50.0,
    dampingB: 0.5,
    driverAmp: 15.0,
    driverFreq: 1.2,
    waveform: "sine" as WaveformType,
    simMode: "duffing" as const,
    duffingAlpha: 30.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    springK2: 100.0,
    couplingB: 0.0,
    driverAmp2: 0.0,
    driverFreq2: 1.5,
    initX1: 0.0,
    initV1: 0.0,
    initX2: 0.0,
    initV2: 0.0,
    parametricEpsilon: 0.3,
    timeStep: 0.01,
    substeps: 20,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Nonlinear spring stiffness (alpha = 30) causes resonance curve bending. Demonstrates bistability, hysteresis, and amplitude jumps."
  },
  {
    name: "Coupled Normal Modes",
    mass: 2.0,
    springK: 100.0,
    dampingB: 0.2,
    driverAmp: 10.0,
    driverFreq: 1.13,
    waveform: "sine" as WaveformType,
    simMode: "coupled" as const,
    duffingAlpha: 0.0,
    couplingK: 50.0,
    mass2: 2.0,
    dampingB2: 0.2,
    springK2: 100.0,
    couplingB: 0.1,
    driverAmp2: 0.0,
    driverFreq2: 1.5,
    initX1: 0.5,
    initV1: 0.0,
    initX2: -0.5,
    initV2: 0.0,
    parametricEpsilon: 0.3,
    timeStep: 0.01,
    substeps: 20,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Two masses connected by a coupling spring. Demonstrates symmetric and asymmetric modes, yielding two distinct resonance peaks."
  },
  {
    name: "Parametric Resonance",
    mass: 1.0,
    springK: 100.0,
    dampingB: 0.1,
    driverAmp: 0.0,
    driverFreq: 3.18,
    waveform: "sine" as WaveformType,
    simMode: "parametric" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    springK2: 100.0,
    couplingB: 0.0,
    driverAmp2: 0.0,
    driverFreq2: 1.5,
    initX1: 0.2,
    initV1: 0.0,
    initX2: 0.0,
    initV2: 0.0,
    parametricEpsilon: 0.35,
    timeStep: 0.005,
    substeps: 25,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Spring stiffness is modulated periodically at twice the natural frequency. Drives exponential amplitude growth without direct forcing."
  },
  {
    name: "Beats & Interference",
    mass: 1.0,
    springK: 100.0,
    dampingB: 0.05,
    driverAmp: 10.0,
    driverFreq: 1.50,
    waveform: "sine" as WaveformType,
    simMode: "beats" as const,
    duffingAlpha: 0.0,
    couplingK: 0.0,
    mass2: 1.0,
    dampingB2: 0.1,
    springK2: 100.0,
    couplingB: 0.0,
    driverAmp2: 10.0,
    driverFreq2: 1.68,
    initX1: 0.0,
    initV1: 0.0,
    initX2: 0.0,
    initV2: 0.0,
    parametricEpsilon: 0.3,
    timeStep: 0.01,
    substeps: 20,
    adaptiveStepping: false,
    integrator: "rk4" as const,
    description: "Superposition of two driving frequencies close to the natural frequency. Demonstrates periodic amplitude modulation (beats)."
  }
];

const ConsoleCard = ({ title, icon: Icon, children, glowColor = "#3b82f6" }: any) => (
  <div className="relative group">
    <div 
      className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity rounded-[32px] pointer-events-none"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${glowColor}, transparent)` }}
    />
    <div className="bg-[#18181b]/95 border border-white/5 backdrop-blur-md rounded-[32px] p-6 space-y-5 relative overflow-hidden shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/5 text-white/80 group-hover:text-white transition-colors">
          <Icon className="w-4 h-4" style={{ color: glowColor }} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const PresetButton = ({ label, description, active, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-start text-left p-4 rounded-[20px] border transition-all duration-200 w-full group relative overflow-hidden",
      active 
        ? "bg-white/[0.04] text-white border-white/15 shadow-xl" 
        : "bg-transparent text-white/40 border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
    )}
    style={active ? { borderLeft: `4px solid ${color}` } : {}}
  >
    <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", active ? "text-white" : "text-white/60 group-hover:text-white")}>{label}</span>
    <span className="text-[9px] text-white/40 mt-1 leading-relaxed font-medium line-clamp-2">{description}</span>
  </button>
);

const ParameterSlider = ({ 
  label, 
  symbol, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  unit, 
  colorClass = "text-primary",
  accentClass = "accent-primary"
}: {
  label: string;
  symbol: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  colorClass?: string;
  accentClass?: string;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/70">{label}</span>
          <span className="text-[9px] font-mono text-white/30">({symbol})</span>
        </div>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>{value.toFixed(step >= 0.1 ? (step >= 1 ? 0 : 2) : 3)}</span>
          <span className="text-[9px] text-white/30 font-medium">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn("w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer", accentClass)}
      />
    </div>
  );
};

export const ResonanceEnvironment: React.FC<ResonanceEnvironmentProps> = ({
  mass,
  setMass,
  springK,
  setSpringK,
  dampingB,
  setDampingB,
  driverAmp,
  setDriverAmp,
  driverFreq,
  setDriverFreq,
  waveform,
  setWaveform,
  activePreset,
  setActivePreset,
  simMode,
  setSimMode,
  duffingAlpha,
  setDuffingAlpha,
  couplingK,
  setCouplingK,
  mass2,
  setMass2,
  dampingB2,
  setDampingB2,
  springK2,
  setSpringK2,
  couplingB,
  setCouplingB,
  driverAmp2,
  setDriverAmp2,
  driverFreq2,
  setDriverFreq2,
  initX1,
  setInitX1,
  initV1,
  setInitV1,
  initX2,
  setInitX2,
  initV2,
  setInitV2,
  parametricEpsilon,
  setParametricEpsilon,
  timeStep,
  setTimeStep,
  solverTolerance,
  setSolverTolerance,
  adaptiveStepping,
  setAdaptiveStepping,
  integrator,
  setIntegrator,
  substeps,
  setSubsteps,
  telemetry
}) => {

  const selectPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.name);
    setMass(p.mass);
    setSpringK(p.springK);
    setDampingB(p.dampingB);
    setDriverAmp(p.driverAmp);
    setDriverFreq(p.driverFreq);
    setWaveform(p.waveform);
    setSimMode(p.simMode);
    setDuffingAlpha(p.duffingAlpha);
    setCouplingK(p.couplingK);
    setMass2(p.mass2);
    setDampingB2(p.dampingB2);
    setSpringK2(p.springK2);
    setCouplingB(p.couplingB);
    setDriverAmp2(p.driverAmp2);
    setDriverFreq2(p.driverFreq2);
    setInitX1(p.initX1);
    setInitV1(p.initV1);
    setInitX2(p.initX2);
    setInitV2(p.initV2);
    setParametricEpsilon(p.parametricEpsilon);
    setTimeStep(p.timeStep);
    setSubsteps(p.substeps);
    setAdaptiveStepping(p.adaptiveStepping);
    setIntegrator(p.integrator);
  };

  // Critical timestep calculation dt = 2 / w0 = 2 / sqrt(k/m)
  const f0 = Math.sqrt(springK / mass) / (2 * Math.PI);
  const w0 = 2 * Math.PI * f0;
  const dtCrit = w0 > 0 ? 2.0 / w0 : Infinity;
  const isTimeStepCritical = timeStep >= dtCrit;
  const isTimeStepCaution = timeStep >= dtCrit * 0.8 && timeStep < dtCrit;

  // Single Oscillator analytical math
  const getSingleMath = () => {
    const zeta = dampingB / (2 * Math.sqrt(mass * springK));
    const Q = 1 / (2 * Math.max(0.0001, zeta));
    const bw = f0 / Q;
    const decay = 2 * mass / Math.max(0.001, dampingB);
    
    // phase lag in degrees at driver frequency
    const w = 2 * Math.PI * driverFreq;
    const num = dampingB * w;
    const den = springK - mass * w * w;
    let phase = Math.atan2(num, den) * (180 / Math.PI);
    if (phase < 0) phase += 360;
    
    const fRes = zeta < 0.707 ? f0 * Math.sqrt(1 - 2 * zeta * zeta) : 0.0;
    
    return { zeta, Q, bw, decay, phase, fRes };
  };

  // Coupled Oscillators analytical math
  const getCoupledMath = () => {
    const f01 = Math.sqrt(springK / mass) / (2 * Math.PI);
    const f02 = Math.sqrt(springK2 / mass2) / (2 * Math.PI);
    
    // Generalized eigenvalue solver det(K - lam * M) = 0
    const A = mass * mass2;
    const B = -(mass * (springK2 + couplingK) + mass2 * (springK + couplingK));
    const C = springK * springK2 + couplingK * (springK + springK2);
    
    const disc = B * B - 4 * A * C;
    let fSym = f01;
    let fAsym = f02;
    if (disc >= 0) {
      const lam1 = (-B - Math.sqrt(disc)) / (2 * A);
      const lam2 = (-B + Math.sqrt(disc)) / (2 * A);
      fSym = Math.sqrt(Math.max(0, lam1)) / (2 * Math.PI);
      fAsym = Math.sqrt(Math.max(0, lam2)) / (2 * Math.PI);
    }
    
    return { f01, f02, fSym, fAsym, split: Math.abs(fAsym - fSym) };
  };

  // Duffing analytical math
  const getDuffingMath = () => {
    const amp = telemetry.currentAmplitude;
    // Backbone shift: f_res = f0 * sqrt(1 + 0.75 * alpha * a^2 / k)
    const fRes = f0 * Math.sqrt(Math.max(0.01, 1 + 0.75 * duffingAlpha * amp * amp / springK));
    return { fRes, type: duffingAlpha > 0 ? "Hardening Spring" : duffingAlpha < 0 ? "Softening Spring" : "Linear Spring" };
  };

  // Parametric analytical math
  const getParametricMath = () => {
    const zeta = dampingB / (2 * Math.sqrt(mass * springK));
    const epsCrit = 4 * zeta;
    const isUnstable = parametricEpsilon > epsCrit;
    return { epsCrit, isUnstable };
  };

  // Beats analytical math
  const getBeatsMath = () => {
    const fBeat = Math.abs(driverFreq - driverFreq2);
    const tBeat = fBeat > 0.001 ? 1 / fBeat : Infinity;
    return { fBeat, tBeat };
  };

  // ----------------------------------------------------
  // SVG Mathematical Plots Generators
  // ----------------------------------------------------
  
  // Plot 1: Single Resonance Lorentzian
  const renderSingleResonanceSVG = () => {
    const points: [number, number][] = [];
    const width = 300;
    const height = 130;
    const padding = 20;
    
    const fMin = 0.1;
    const fMax = 5.0;
    
    const w0_local = 2 * Math.PI * f0;
    // Calculate scaling factors
    const maxAmpTheoretical = driverAmp / Math.max(0.05, dampingB * w0_local);
    const ampScale = (height - 2 * padding) / Math.max(0.1, maxAmpTheoretical * 1.2);
    
    // Sweep frequency and draw curve
    for (let x = padding; x < width - padding; x++) {
      const pct = (x - padding) / (width - 2 * padding);
      const f = fMin + pct * (fMax - fMin);
      const w = 2 * Math.PI * f;
      const denom = Math.sqrt(Math.pow(w0_local * w0_local - w * w, 2) + Math.pow(w * (dampingB / mass), 2));
      const amp = (driverAmp / mass) / Math.max(0.01, denom);
      
      const y = height - padding - amp * ampScale;
      points.push([x, Math.max(padding, y)]);
    }
    
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    
    // Active driver frequency marker
    const activePct = (driverFreq - fMin) / (fMax - fMin);
    const activeX = padding + activePct * (width - 2 * padding);
    
    const activeW = 2 * Math.PI * driverFreq;
    const activeDenom = Math.sqrt(Math.pow(w0_local * w0_local - activeW * activeW, 2) + Math.pow(activeW * (dampingB / mass), 2));
    const activeAmp = (driverAmp / mass) / Math.max(0.01, activeDenom);
    const activeY = height - padding - activeAmp * ampScale;
    
    const singleData = getSingleMath();
    const bwStartPct = (Math.max(fMin, f0 - singleData.bw / 2) - fMin) / (fMax - fMin);
    const bwEndPct = (Math.min(fMax, f0 + singleData.bw / 2) - fMin) / (fMax - fMin);
    const bwStartX = padding + bwStartPct * (width - 2 * padding);
    const bwEndX = padding + bwEndPct * (width - 2 * padding);
    
    return (
      <svg className="w-full h-[140px] bg-black/60 rounded-2xl border border-white/5 overflow-visible">
        {/* Gridlines */}
        {[1, 2, 3, 4].map(hz => {
          const x = padding + ((hz - fMin) / (fMax - fMin)) * (width - 2 * padding);
          return (
            <g key={hz}>
              <line x1={x} y1={padding} x2={x} y2={height - padding} className="stroke-white/[0.05]" strokeDasharray="2,2" />
              <text x={x} y={height - 6} className="text-[8px] fill-white/30 font-mono text-center" textAnchor="middle">{hz} Hz</text>
            </g>
          );
        })}
        {/* Bandwidth Shading */}
        {dampingB > 0 && (
          <rect 
            x={bwStartX} 
            y={padding} 
            width={Math.max(2, bwEndX - bwStartX)} 
            height={height - 2 * padding} 
            className="fill-teal-500/10" 
          />
        )}
        {/* Resonance Curve */}
        <path d={pathData} fill="none" className="stroke-teal-400" strokeWidth="1.5" />
        
        {/* Active Driver Cursor */}
        <line x1={activeX} y1={padding} x2={activeX} y2={height - padding} className="stroke-amber-500/60" strokeDasharray="3,3" />
        <circle cx={activeX} cy={Math.max(padding, activeY)} r="4" className="fill-amber-400 stroke-black stroke-2" />
        
        {/* Labels */}
        <text x={padding + 5} y={padding + 10} className="text-[8px] fill-white/40 font-mono">Lorentzian Response (A vs f)</text>
        {activeX > padding && activeX < width - padding && (
          <text x={activeX + 6} y={Math.max(padding + 10, activeY - 5)} className="text-[8px] fill-amber-400 font-mono font-bold">
            {driverFreq.toFixed(2)} Hz
          </text>
        )}
      </svg>
    );
  };

  // Plot 2: Coupled Peaks Splitting
  const renderCoupledResonanceSVG = () => {
    const points1: [number, number][] = [];
    const points2: [number, number][] = [];
    const width = 300;
    const height = 130;
    const padding = 20;
    
    const fMin = 0.1;
    const fMax = 5.0;
    
    const tempAmps: {f: number, a1: number, a2: number}[] = [];
    let maxAmp = 0.01;
    
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const pct = i / steps;
      const f = fMin + pct * (fMax - fMin);
      const w = 2 * Math.PI * f;
      
      const r11 = springK + couplingK - w * w * mass;
      const i11 = w * (dampingB + couplingB);
      
      const r22 = springK2 + couplingK - w * w * mass2;
      const i22 = w * (dampingB2 + couplingB);
      
      const r12 = -couplingK;
      const i12 = -w * couplingB;
      
      const rProd = r11 * r22 - i11 * i22;
      const iProd = r11 * i22 + r22 * i11;
      
      const rSq12 = r12 * r12 - i12 * i12;
      const iSq12 = 2 * r12 * i12;
      
      const detReal = rProd - rSq12;
      const detImag = iProd - iSq12;
      const detSq = detReal * detReal + detImag * detImag + 1e-6;
      
      const num1Real = driverAmp * r22 - driverAmp2 * r12;
      const num1Imag = driverAmp * i22 - driverAmp2 * i12;
      const amp1 = Math.sqrt(num1Real * num1Real + num1Imag * num1Imag) / Math.sqrt(detSq);
      
      const num2Real = driverAmp2 * r11 - driverAmp * r12;
      const num2Imag = driverAmp2 * i11 - driverAmp * i12;
      const amp2 = Math.sqrt(num2Real * num2Real + num2Imag * num2Imag) / Math.sqrt(detSq);
      
      tempAmps.push({ f, a1: amp1, a2: amp2 });
      if (amp1 > maxAmp) maxAmp = amp1;
      if (amp2 > maxAmp) maxAmp = amp2;
    }
    
    const ampScale = (height - 2 * padding) / (maxAmp * 1.1);
    
    tempAmps.forEach((item) => {
      const x = padding + ((item.f - fMin) / (fMax - fMin)) * (width - 2 * padding);
      const y1 = height - padding - item.a1 * ampScale;
      const y2 = height - padding - item.a2 * ampScale;
      
      points1.push([x, Math.max(padding, y1)]);
      points2.push([x, Math.max(padding, y2)]);
    });
    
    const path1 = points1.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const path2 = points2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    
    const activeX = padding + ((driverFreq - fMin) / (fMax - fMin)) * (width - 2 * padding);
    const activeX2 = padding + ((driverFreq2 - fMin) / (fMax - fMin)) * (width - 2 * padding);
    
    return (
      <svg className="w-full h-[140px] bg-black/60 rounded-2xl border border-white/5 overflow-visible">
        {/* Gridlines */}
        {[1, 2, 3, 4].map(hz => {
          const x = padding + ((hz - fMin) / (fMax - fMin)) * (width - 2 * padding);
          return (
            <g key={hz}>
              <line x1={x} y1={padding} x2={x} y2={height - padding} className="stroke-white/[0.05]" strokeDasharray="2,2" />
              <text x={x} y={height - 6} className="text-[8px] fill-white/30 font-mono text-center" textAnchor="middle">{hz} Hz</text>
            </g>
          );
        })}
        
        {/* Peaks paths */}
        <path d={path1} fill="none" className="stroke-teal-400" strokeWidth="1.5" />
        <path d={path2} fill="none" className="stroke-purple-400" strokeWidth="1.5" />
        
        {/* Driver 1 freq line */}
        {driverAmp > 0 && (
          <line x1={activeX} y1={padding} x2={activeX} y2={height - padding} className="stroke-teal-400/40" strokeDasharray="3,3" />
        )}
        {/* Driver 2 freq line */}
        {driverAmp2 > 0 && (
          <line x1={activeX2} y1={padding} x2={activeX2} y2={height - padding} className="stroke-purple-400/40" strokeDasharray="3,3" />
        )}
        
        <text x={padding + 5} y={padding + 10} className="text-[8px] fill-white/40 font-mono">Mode Splitting Spectrum</text>
        <text x={width - padding - 80} y={padding + 10} className="text-[8px] fill-teal-400 font-mono">Mass 1</text>
        <text x={width - padding - 80} y={padding + 20} className="text-[8px] fill-purple-400 font-mono">Mass 2</text>
      </svg>
    );
  };

  // Plot 3: Duffing Bent Amplitude
  const renderDuffingResonanceSVG = () => {
    const width = 300;
    const height = 130;
    const padding = 20;
    
    const fMin = 0.1;
    const fMax = 5.0;
    
    const points: [number, number][] = [];
    const aMax = Math.max(1.0, (driverAmp / Math.max(0.1, dampingB)) * 0.4);
    const steps = 180;
    
    for (let i = 1; i <= steps; i++) {
      const a = (i / steps) * aMax;
      const kEff = springK + 0.75 * duffingAlpha * a * a;
      
      const A = mass * mass;
      const B = dampingB * dampingB - 2 * mass * kEff;
      const C = kEff * kEff - (driverAmp * driverAmp) / (a * a);
      
      const disc = B * B - 4 * A * C;
      if (disc >= 0) {
        const omega2_1 = (-B + Math.sqrt(disc)) / (2 * A);
        const omega2_2 = (-B - Math.sqrt(disc)) / (2 * A);
        
        if (omega2_1 > 0) {
          const f1 = Math.sqrt(omega2_1) / (2 * Math.PI);
          if (f1 >= fMin && f1 <= fMax) points.push([f1, a]);
        }
        if (omega2_2 > 0) {
          const f2 = Math.sqrt(omega2_2) / (2 * Math.PI);
          if (f2 >= fMin && f2 <= fMax) points.push([f2, a]);
        }
      }
    }
    
    let maxA = 0.1;
    points.forEach(p => { if (p[1] > maxA) maxA = p[1]; });
    
    const xScale = (width - 2 * padding) / (fMax - fMin);
    const yScale = (height - 2 * padding) / maxA;
    
    const svgPoints = points.map(p => {
      const x = padding + (p[0] - fMin) * xScale;
      const y = height - padding - p[1] * yScale;
      return [x, y];
    });
    
    // Sort by y coordinate to sweep smoothly and draw bent curve parametric path
    svgPoints.sort((a, b) => a[1] - b[1]);
    
    let pathData = "";
    if (svgPoints.length > 0) {
      pathData = svgPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    }
    
    // Backbone curve
    const backbonePoints: [number, number][] = [];
    for (let i = 0; i <= 50; i++) {
      const a = (i / 50) * maxA;
      const fRes = f0 * Math.sqrt(Math.max(0.1, 1 + 0.75 * duffingAlpha * a * a / springK));
      if (fRes >= fMin && fRes <= fMax) {
        const x = padding + (fRes - fMin) * xScale;
        const y = height - padding - a * yScale;
        backbonePoints.push([x, y]);
      }
    }
    const backbonePath = backbonePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    
    const activeX = padding + (driverFreq - fMin) * xScale;
    
    return (
      <svg className="w-full h-[140px] bg-black/60 rounded-2xl border border-white/5 overflow-visible">
        {/* Gridlines */}
        {[1, 2, 3, 4].map(hz => {
          const x = padding + ((hz - fMin) / (fMax - fMin)) * (width - 2 * padding);
          return (
            <g key={hz}>
              <line x1={x} y1={padding} x2={x} y2={height - padding} className="stroke-white/[0.05]" strokeDasharray="2,2" />
              <text x={x} y={height - 6} className="text-[8px] fill-white/30 font-mono text-center" textAnchor="middle">{hz} Hz</text>
            </g>
          );
        })}
        
        {/* Backbone Curve */}
        {backbonePath && (
          <path d={backbonePath} fill="none" className="stroke-amber-500/50" strokeWidth="1" strokeDasharray="3,2" />
        )}
        
        {/* Bent Response Curve */}
        {pathData && (
          <path d={pathData} fill="none" className="stroke-rose-500" strokeWidth="1.8" />
        )}
        
        {/* Active frequency cursor line */}
        <line x1={activeX} y1={padding} x2={activeX} y2={height - padding} className="stroke-white/20" strokeDasharray="2,2" />
        
        <text x={padding + 5} y={padding + 10} className="text-[8px] fill-white/40 font-mono">Duffing Bending & Backbone</text>
        <text x={width - padding - 90} y={height - padding - 10} className="text-[8px] fill-amber-500/80 font-mono">Backbone</text>
      </svg>
    );
  };

  // Plot 4: Parametric Instability Mathieu Tongue
  const renderParametricResonanceSVG = () => {
    const width = 300;
    const height = 130;
    const padding = 20;
    
    const rMin = 0.5;
    const rMax = 3.0;
    const epMin = 0.0;
    const epMax = 1.0;
    
    const zeta = dampingB / (2 * Math.sqrt(mass * springK));
    
    // Instability tongue boundary
    const tonguePoints: [number, number][] = [];
    const steps = 80;
    
    for (let i = 0; i <= steps; i++) {
      const ratio = rMin + (i / steps) * (rMax - rMin);
      const diff = 1 - 4 / (ratio * ratio);
      // epsilon threshold boundary
      const epB = 2 * Math.sqrt(4 * zeta * zeta + diff * diff);
      
      if (epB <= epMax) {
        const x = padding + ((ratio - rMin) / (rMax - rMin)) * (width - 2 * padding);
        const y = height - padding - ((epB - epMin) / (epMax - epMin)) * (height - 2 * padding);
        tonguePoints.push([x, y]);
      }
    }
    
    let tonguePath = "";
    if (tonguePoints.length > 0) {
      tonguePoints.sort((a, b) => a[0] - b[0]);
      // Close shape to the top
      const allPolyPoints = [
        [tonguePoints[0][0], tonguePoints[0][1]],
        ...tonguePoints,
        [tonguePoints[tonguePoints.length - 1][0], tonguePoints[tonguePoints.length - 1][1]],
        [tonguePoints[tonguePoints.length - 1][0], padding],
        [tonguePoints[0][0], padding]
      ];
      tonguePath = allPolyPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + " Z";
    }
    
    // current operating ratio
    const currentRatio = driverFreq / Math.max(0.1, f0);
    const activeX = padding + ((currentRatio - rMin) / (rMax - rMin)) * (width - 2 * padding);
    const activeY = height - padding - ((parametricEpsilon - epMin) / (epMax - epMin)) * (height - 2 * padding);
    
    const diffActive = 1 - 4 / (currentRatio * currentRatio);
    const epBoundActive = 2 * Math.sqrt(4 * zeta * zeta + diffActive * diffActive);
    const isUnstable = parametricEpsilon > epBoundActive;
    
    return (
      <svg className="w-full h-[140px] bg-black/60 rounded-2xl border border-white/5 overflow-visible">
        {/* Gridlines */}
        {[1.0, 2.0, 3.0].map(r => {
          const x = padding + ((r - rMin) / (rMax - rMin)) * (width - 2 * padding);
          return (
            <g key={r}>
              <line x1={x} y1={padding} x2={x} y2={height - padding} className="stroke-white/[0.05]" strokeDasharray="2,2" />
              <text x={x} y={height - 6} className="text-[8px] fill-white/30 font-mono text-center" textAnchor="middle">{r} &Omega;/&omega;&#8320;</text>
            </g>
          );
        })}
        
        {/* Epsilon ticks */}
        {[0.2, 0.5, 0.8].map(ep => {
          const y = height - padding - ((ep - epMin) / (epMax - epMin)) * (height - 2 * padding);
          return (
            <g key={ep}>
              <line x1={padding} y1={y} x2={width - padding} className="stroke-white/[0.03]" />
              <text x={6} y={y + 3} className="text-[7px] fill-white/30 font-mono">{ep.toFixed(1)} &epsilon;</text>
            </g>
          );
        })}
        
        {/* Instability Tongue */}
        {tonguePath && (
          <path d={tonguePath} fill="url(#tongueGrad)" className="stroke-rose-500/30" strokeWidth="1" />
        )}
        
        {/* Gradient for Tongue */}
        <defs>
          <linearGradient id="tongueGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        
        {/* Active Point */}
        {activeX > padding && activeX < width - padding && activeY > padding && activeY < height - padding && (
          <>
            <circle cx={activeX} cy={activeY} r="5" className={cn(isUnstable ? "fill-rose-500 animate-ping" : "fill-emerald-500")} />
            <circle cx={activeX} cy={activeY} r="4" className={cn("stroke-black stroke-2", isUnstable ? "fill-rose-400" : "fill-emerald-400")} />
          </>
        )}
        
        <text x={padding + 5} y={padding + 10} className="text-[8px] fill-white/40 font-mono">Floquet Mathieu Instability Map</text>
        <text x={width - padding - 60} y={padding + 10} className={cn("text-[8px] font-mono font-black uppercase tracking-wider", isUnstable ? "fill-rose-400" : "fill-emerald-400")}>
          {isUnstable ? "Unstable" : "Stable"}
        </text>
      </svg>
    );
  };

  // Plot 5: Beats Interference Envelope
  const renderBeatsResonanceSVG = () => {
    const pointsWave: [number, number][] = [];
    const pointsEnvPlus: [number, number][] = [];
    const pointsEnvMinus: [number, number][] = [];
    
    const width = 300;
    const height = 130;
    const padding = 20;
    
    const fBeat = Math.abs(driverFreq - driverFreq2);
    const tMax = fBeat > 0.05 ? 2.5 / fBeat : 4.0;
    
    const A1 = driverAmp * 0.08;
    const A2 = driverAmp2 * 0.08;
    const maxCombined = A1 + A2;
    const yScale = (height - 2 * padding) / Math.max(0.1, maxCombined * 2.2);
    const yCenter = height / 2;
    
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const pct = i / steps;
      const t = pct * tMax;
      
      const xVal = A1 * Math.cos(2 * Math.PI * driverFreq * t) + A2 * Math.cos(2 * Math.PI * driverFreq2 * t);
      const envVal = Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(2 * Math.PI * (driverFreq - driverFreq2) * t));
      
      const svgX = padding + pct * (width - 2 * padding);
      const svgYWave = yCenter - xVal * yScale;
      const svgYEnvPlus = yCenter - envVal * yScale;
      const svgYEnvMinus = yCenter + envVal * yScale;
      
      pointsWave.push([svgX, svgYWave]);
      pointsEnvPlus.push([svgX, svgYEnvPlus]);
      pointsEnvMinus.push([svgX, svgYEnvMinus]);
    }
    
    const pathWave = pointsWave.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const pathEnvPlus = pointsEnvPlus.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    const pathEnvMinus = pointsEnvMinus.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
    
    return (
      <svg className="w-full h-[140px] bg-black/60 rounded-2xl border border-white/5 overflow-visible">
        {/* Envelope */}
        <path d={pathEnvPlus} fill="none" className="stroke-amber-500/60" strokeWidth="1" strokeDasharray="3,2" />
        <path d={pathEnvMinus} fill="none" className="stroke-amber-500/60" strokeWidth="1" strokeDasharray="3,2" />
        
        {/* Superposed Waveform */}
        <path d={pathWave} fill="none" className="stroke-blue-400" strokeWidth="1.2" />
        
        <text x={padding + 5} y={padding + 10} className="text-[8px] fill-white/40 font-mono">Wave Interference Envelope</text>
        <text x={width - padding - 80} y={padding + 10} className="text-[8px] fill-amber-400 font-mono">
          f_beat: {fBeat.toFixed(2)} Hz
        </text>
      </svg>
    );
  };

  const activeSingleData = getSingleMath();
  const activeCoupledData = getCoupledMath();
  const activeDuffingData = getDuffingMath();
  const activeParametricData = getParametricMath();
  const activeBeatsData = getBeatsMath();

  return (
    <div className="max-w-[1440px] mx-auto p-6 text-white space-y-8 select-none">
      
      {/* Dynamic Header console */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-5 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">
            Environment <span className="text-primary">Config Laboratory</span>
          </h2>
          <p className="text-[10px] text-white/40 mt-1 font-mono uppercase tracking-wider">
            Resonance Control Center & Scientific Instrumentation Panel
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              SOLVER: {integrator.replace("_", " ")}
            </span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-400">
              Regime: {simMode.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* 3-Column Computational Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: Presets & Integrator Deck */}
        <div className="space-y-6">
          
          {/* Preset Manager */}
          <ConsoleCard title="Physical Regimes" icon={Zap} glowColor="#ff9900">
            <p className="text-[10px] text-white/50 leading-relaxed font-medium">
              Configure mathematically distinct resonance environments. Select a preset to load parameters.
            </p>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {PRESETS.map((p) => (
                <PresetButton
                  key={p.name}
                  label={p.name}
                  description={p.description}
                  active={activePreset === p.name}
                  onClick={() => selectPreset(p)}
                  color="#ff9900"
                />
              ))}
            </div>
          </ConsoleCard>

          {/* Integration Solver Controls */}
          <ConsoleCard title="Numerical Integrator" icon={Settings2} glowColor="#06b6d4">
            <div className="space-y-5">
              
              {/* Solver Algorithm Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">Numerical Solver</label>
                <select 
                  value={integrator}
                  onChange={(e) => {
                    setIntegrator(e.target.value as any);
                    setActivePreset("Custom");
                  }}
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-xs text-cyan-400 font-mono outline-none focus:border-cyan-500"
                >
                  <option value="rk4">Runge-Kutta 4th Order (RK4)</option>
                  <option value="symplectic_euler">Symplectic Euler</option>
                  <option value="velocity_verlet">Velocity Verlet</option>
                  <option value="adaptive_rk">Adaptive RK45 (Cash-Karp)</option>
                </select>
              </div>

              {/* Time Step Slider */}
              <ParameterSlider
                label="Integration Timestep"
                symbol="Δt"
                value={timeStep}
                min={0.001}
                max={0.05}
                step={0.001}
                unit="s"
                colorClass="text-cyan-400 font-mono"
                accentClass="accent-cyan-500"
                onChange={(val) => {
                  setTimeStep(val);
                  setActivePreset("Custom");
                }}
              />

              {/* Substeps Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/70">Substeps per Frame</span>
                  </div>
                  <div className="flex items-baseline gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                    <span className="text-xs font-mono font-bold text-cyan-400">{substeps}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={substeps}
                  onChange={(e) => {
                    setSubsteps(parseInt(e.target.value));
                    setActivePreset("Custom");
                  }}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Adaptive stepping controls (if RK45 active) */}
              {integrator === "adaptive_rk" && (
                <div className="space-y-4 pt-3 border-t border-white/5 animate-fadeIn">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-mono text-white/60">Adaptive Step</span>
                    <button
                      onClick={() => {
                        setAdaptiveStepping(!adaptiveStepping);
                        setActivePreset("Custom");
                      }}
                      className={cn(
                        "w-10 h-5 rounded-full p-0.5 transition-all duration-200",
                        adaptiveStepping ? "bg-cyan-500" : "bg-white/15"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full bg-white transition-all", adaptiveStepping ? "translate-x-5" : "translate-x-0")} />
                    </button>
                  </div>
                  
                  {adaptiveStepping && (
                    <ParameterSlider
                      label="Local Error Tol"
                      symbol="tolerance"
                      value={solverTolerance}
                      min={1e-6}
                      max={1e-3}
                      step={1e-6}
                      unit="m"
                      colorClass="text-cyan-400 font-mono"
                      accentClass="accent-cyan-500"
                      onChange={(val) => {
                        setSolverTolerance(val);
                        setActivePreset("Custom");
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </ConsoleCard>

          {/* Numerical Stability diagnostics */}
          <ConsoleCard title="Solver Diagnostics" icon={Activity} glowColor="#f43f5e">
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Status indicator */}
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-[9px] text-white/40 uppercase font-black tracking-wider">Solver Status</div>
                  <div className={cn("text-xs font-mono font-bold mt-1.5 uppercase flex items-center gap-1", 
                    telemetry.solverStatus === "stable" ? "text-emerald-400" : 
                    telemetry.solverStatus === "warning" ? "text-amber-400 animate-pulse" : "text-rose-500 font-black animate-bounce"
                  )}>
                    {telemetry.solverStatus === "stable" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {telemetry.solverStatus === "warning" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {telemetry.solverStatus === "divergent" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {telemetry.solverStatus}
                  </div>
                </div>

                {/* Energy conservation drift */}
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                  <div className="text-[9px] text-white/40 uppercase font-black tracking-wider">Energy Drift (ΔE)</div>
                  <div className={cn("text-xs font-mono font-bold mt-1.5", 
                    Math.abs(telemetry.energyDrift) < 1e-4 ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {Math.abs(telemetry.energyDrift) < 1e-4 ? "< 10⁻⁴ J" : `${telemetry.energyDrift.toExponential(2)} J`}
                  </div>
                </div>
              </div>

              {/* Truncation error estimate */}
              <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">Est. Truncation Error</span>
                  <span className="text-[8px] text-white/20 font-mono">Max Local</span>
                </div>
                <div className="text-xs font-mono font-bold mt-1 text-cyan-400">
                  {telemetry.truncationError > 0 ? `${telemetry.truncationError.toExponential(4)} m` : "N/A (Fixed Step)"}
                </div>
              </div>

              {/* Step size warnings */}
              {isTimeStepCritical && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[9px] leading-relaxed font-semibold">
                    <span className="font-bold">CRITICAL WARNING:</span> Step size (Δt = {timeStep}s) exceeds the mathematical stability boundary (Δt_crit = {dtCrit.toFixed(4)}s). Divergence expected.
                  </div>
                </div>
              )}

              {isTimeStepCaution && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[9px] leading-relaxed font-semibold">
                    <span className="font-bold">STABILITY CAUTION:</span> Timestep (Δt = {timeStep}s) is close to the stability limit. Consider dropping Δt or increasing substeps.
                  </div>
                </div>
              )}

              {!isTimeStepCritical && !isTimeStepCaution && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[9px] leading-relaxed font-medium">
                    Integrator step is stable. Δt = {timeStep}s is below the critical threshold (Δt_crit = {dtCrit.toFixed(4)}s).
                  </div>
                </div>
              )}
            </div>
          </ConsoleCard>

        </div>

        {/* COLUMN 2: Physical Parameters Panel */}
        <div className="space-y-6">
          <ConsoleCard title="Physical Parameters" icon={Sliders} glowColor="#2563eb">
            <div className="space-y-6">
              
              {/* Regime Select Buttons */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">Simulation Regime</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["single", "coupled", "duffing", "parametric", "beats"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSimMode(mode);
                        setActivePreset("Custom");
                      }}
                      className={cn(
                        "py-2 px-1 rounded-xl border font-black text-[9px] uppercase tracking-wider transition-all",
                        simMode === mode 
                          ? "bg-primary text-white border-primary shadow-lg" 
                          : "bg-black/50 text-white/60 border-white/5 hover:border-white/10"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Masses & Inertia Group */}
              <div className="space-y-4 pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Masses & Inertia</h4>
                <ParameterSlider
                  label={simMode === "coupled" ? "Mass 1" : "Mass"}
                  symbol="m₁"
                  value={mass}
                  min={0.2}
                  max={15.0}
                  step={0.1}
                  unit="kg"
                  colorClass="text-teal-400"
                  accentClass="accent-teal-500"
                  onChange={(val) => {
                    setMass(val);
                    setActivePreset("Custom");
                  }}
                />

                {simMode === "coupled" && (
                  <ParameterSlider
                    label="Mass 2"
                    symbol="m₂"
                    value={mass2}
                    min={0.2}
                    max={15.0}
                    step={0.1}
                    unit="kg"
                    colorClass="text-purple-400"
                    accentClass="accent-purple-500"
                    onChange={(val) => {
                      setMass2(val);
                      setActivePreset("Custom");
                    }}
                  />
                )}
              </div>

              {/* Springs & Stiffness Group */}
              <div className="space-y-4 pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Springs & Stiffness</h4>
                <ParameterSlider
                  label={simMode === "coupled" ? "Stiffness 1" : "Stiffness"}
                  symbol="k₁"
                  value={springK}
                  min={10}
                  max={600}
                  step={5}
                  unit="N/m"
                  colorClass="text-teal-400"
                  accentClass="accent-teal-500"
                  onChange={(val) => {
                    setSpringK(val);
                    setActivePreset("Custom");
                  }}
                />

                {simMode === "coupled" && (
                  <>
                    <ParameterSlider
                      label="Stiffness 2"
                      symbol="k₂"
                      value={springK2}
                      min={10}
                      max={600}
                      step={5}
                      unit="N/m"
                      colorClass="text-purple-400"
                      accentClass="accent-purple-500"
                      onChange={(val) => {
                        setSpringK2(val);
                        setActivePreset("Custom");
                      }}
                    />
                    <ParameterSlider
                      label="Coupling Stiffness"
                      symbol="k_c"
                      value={couplingK}
                      min={0}
                      max={200}
                      step={2}
                      unit="N/m"
                      colorClass="text-amber-400"
                      accentClass="accent-amber-500"
                      onChange={(val) => {
                        setCouplingK(val);
                        setActivePreset("Custom");
                      }}
                    />
                  </>
                )}
              </div>

              {/* Dissipation & Damping Group */}
              <div className="space-y-4 pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Damping & Friction</h4>
                <ParameterSlider
                  label={simMode === "coupled" ? "Damping 1" : "Damping"}
                  symbol="b₁"
                  value={dampingB}
                  min={0.0}
                  max={80.0}
                  step={0.05}
                  unit="N s/m"
                  colorClass="text-teal-400"
                  accentClass="accent-teal-500"
                  onChange={(val) => {
                    setDampingB(val);
                    setActivePreset("Custom");
                  }}
                />

                {simMode === "coupled" && (
                  <>
                    <ParameterSlider
                      label="Damping 2"
                      symbol="b₂"
                      value={dampingB2}
                      min={0.0}
                      max={80.0}
                      step={0.05}
                      unit="N s/m"
                      colorClass="text-purple-400"
                      accentClass="accent-purple-500"
                      onChange={(val) => {
                        setDampingB2(val);
                        setActivePreset("Custom");
                      }}
                    />
                    <ParameterSlider
                      label="Coupling Damping"
                      symbol="b_c"
                      value={couplingB}
                      min={0.0}
                      max={20.0}
                      step={0.05}
                      unit="N s/m"
                      colorClass="text-amber-400"
                      accentClass="accent-amber-500"
                      onChange={(val) => {
                        setCouplingB(val);
                        setActivePreset("Custom");
                      }}
                    />
                  </>
                )}
              </div>

              {/* Driving Forces Group */}
              {simMode !== "parametric" && (
                <div className="space-y-4 pt-3 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Driving Engines</h4>
                  <ParameterSlider
                    label={simMode === "coupled" ? "Driver Amp 1" : simMode === "beats" ? "Driver Amp 1" : "Driver Amplitude"}
                    symbol="F₁"
                    value={driverAmp}
                    min={0.0}
                    max={60.0}
                    step={0.5}
                    unit="N"
                    colorClass="text-amber-400"
                    accentClass="accent-amber-500"
                    onChange={(val) => {
                      setDriverAmp(val);
                      setActivePreset("Custom");
                    }}
                  />

                  <ParameterSlider
                    label={simMode === "coupled" ? "Driver Freq 1" : simMode === "beats" ? "Driver Freq 1" : "Driver Frequency"}
                    symbol="f₁"
                    value={driverFreq}
                    min={0.05}
                    max={6.0}
                    step={0.01}
                    unit="Hz"
                    colorClass="text-amber-400"
                    accentClass="accent-amber-500"
                    onChange={(val) => {
                      setDriverFreq(val);
                      setActivePreset("Custom");
                    }}
                  />

                  {(simMode === "coupled" || simMode === "beats") && (
                    <>
                      <ParameterSlider
                        label="Driver Amp 2"
                        symbol="F₂"
                        value={driverAmp2}
                        min={0.0}
                        max={60.0}
                        step={0.5}
                        unit="N"
                        colorClass="text-purple-400"
                        accentClass="accent-purple-500"
                        onChange={(val) => {
                          setDriverAmp2(val);
                          setActivePreset("Custom");
                        }}
                      />

                      <ParameterSlider
                        label="Driver Freq 2"
                        symbol="f₂"
                        value={driverFreq2}
                        min={0.05}
                        max={6.0}
                        step={0.01}
                        unit="Hz"
                        colorClass="text-purple-400"
                        accentClass="accent-purple-500"
                        onChange={(val) => {
                          setDriverFreq2(val);
                          setActivePreset("Custom");
                        }}
                      />
                    </>
                  )}

                  {/* Waveform Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block">Driver Waveform</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["sine", "square", "triangle"] as WaveformType[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => {
                            setWaveform(w);
                            setActivePreset("Custom");
                          }}
                          className={cn(
                            "py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all",
                            waveform === w 
                              ? "bg-amber-500 text-black border-amber-500 shadow-md" 
                              : "bg-black/50 text-white/60 border-white/5 hover:border-white/10"
                          )}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Initial States Group */}
              <div className="space-y-4 pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Initial States</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ParameterSlider
                    label="Init Disp 1"
                    symbol="x₁₀"
                    value={initX1}
                    min={-2.0}
                    max={2.0}
                    step={0.05}
                    unit="m"
                    colorClass="text-teal-400"
                    accentClass="accent-teal-500"
                    onChange={(val) => {
                      setInitX1(val);
                      setActivePreset("Custom");
                    }}
                  />
                  <ParameterSlider
                    label="Init Vel 1"
                    symbol="v₁₀"
                    value={initV1}
                    min={-5.0}
                    max={5.0}
                    step={0.1}
                    unit="m/s"
                    colorClass="text-teal-400"
                    accentClass="accent-teal-500"
                    onChange={(val) => {
                      setInitV1(val);
                      setActivePreset("Custom");
                    }}
                  />
                </div>

                {simMode === "coupled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <ParameterSlider
                      label="Init Disp 2"
                      symbol="x₂₀"
                      value={initX2}
                      min={-2.0}
                      max={2.0}
                      step={0.05}
                      unit="m"
                      colorClass="text-purple-400"
                      accentClass="accent-purple-500"
                      onChange={(val) => {
                        setInitX2(val);
                        setActivePreset("Custom");
                      }}
                    />
                    <ParameterSlider
                      label="Init Vel 2"
                      symbol="v₂₀"
                      value={initV2}
                      min={-5.0}
                      max={5.0}
                      step={0.1}
                      unit="m/s"
                      colorClass="text-purple-400"
                      accentClass="accent-purple-500"
                      onChange={(val) => {
                        setInitV2(val);
                        setActivePreset("Custom");
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Nonlinear & Parametric parameters */}
              {(simMode === "duffing" || simMode === "parametric") && (
                <div className="space-y-4 pt-3 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Nonlinear Dynamics</h4>
                  
                  {simMode === "duffing" && (
                    <ParameterSlider
                      label="Nonlinear Coeff"
                      symbol="α"
                      value={duffingAlpha}
                      min={-150.0}
                      max={150.0}
                      step={1.0}
                      unit="N/m³"
                      colorClass="text-rose-400"
                      accentClass="accent-rose-500"
                      onChange={(val) => {
                        setDuffingAlpha(val);
                        setActivePreset("Custom");
                      }}
                    />
                  )}

                  {simMode === "parametric" && (
                    <ParameterSlider
                      label="Modulation Depth"
                      symbol="ε"
                      value={parametricEpsilon}
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      unit=""
                      colorClass="text-rose-400"
                      accentClass="accent-rose-500"
                      onChange={(val) => {
                        setParametricEpsilon(val);
                        setActivePreset("Custom");
                      }}
                    />
                  )}
                </div>
              )}

            </div>
          </ConsoleCard>
        </div>

        {/* COLUMN 3: Physics & SVG Plots */}
        <div className="space-y-6">
          
          {/* Governing ODE & Explanatory panel */}
          <ConsoleCard title="Governing Mechanics" icon={HelpCircle} glowColor="#8b5cf6">
            <div className="space-y-4">
              
              {/* Equations block */}
              {simMode === "single" && (
                <div className="space-y-3">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-center text-sm text-cyan-400 py-5">
                    m&middot;x&#776; + b&middot;x&#775; + k&middot;x = F&#8320;&middot;cos(&omega;&middot;t)
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                    This represents the classic **Forced Damped Harmonic Oscillator**. The mass inertial resistance, linear spring damping velocity, and spring restoration forces balance the external driving force.
                  </p>
                </div>
              )}

              {simMode === "coupled" && (
                <div className="space-y-3">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-2xl font-mono text-[10px] text-cyan-400 space-y-1.5 py-4 leading-relaxed">
                    <div>m&#8321;&middot;x&#776;&#8321; + (b&#8321; + b&#9986;)&middot;x&#775;&#8321; - b&#9986;&middot;x&#775;&#8322; + (k&#8321; + k&#9986;)&middot;x&#8321; - k&#9986;&middot;x&#8322; = F&#8321;(t)</div>
                    <div>m&#8322;&middot;x&#776;&#8322; + (b&#8322; + b&#9986;)&middot;x&#775;&#8322; - b&#9986;&middot;x&#775;&#8321; + (k&#8322; + k&#9986;)&middot;x&#8322; - k&#9986;&middot;x&#8321; = F&#8322;(t)</div>
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                    **Coupled Oscillators** interchange energy via the central spring stiffness $k_c$ and damper $b_c$. The normal modes describe the symmetric (in-phase) and asymmetric (out-of-phase) states.
                  </p>
                </div>
              )}

              {simMode === "duffing" && (
                <div className="space-y-3">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-center text-sm text-cyan-400 py-5">
                    m&middot;x&#776; + b&middot;x&#775; + k&middot;x + &alpha;&middot;x&sup3; = F&#8320;&middot;cos(&omega;&middot;t)
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                    The **Duffing Oscillator** introduces cubic nonlinearity $\alpha x^3$. It shifts the resonance peak, causing hysteresis, amplitude jumps, and potentially chaos under large driver forces.
                  </p>
                </div>
              )}

              {simMode === "parametric" && (
                <div className="space-y-3">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-center text-sm text-cyan-400 py-5">
                    m&middot;x&#776; + b&middot;x&#775; + k&#8320;&middot;[1 + &epsilon;&middot;cos(&Omega;&middot;t)]&middot;x = 0
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                    **Parametric Resonance** is driven by periodic stiffness modulation (e.g. child on a swing). Instability (Mathieu tongue) occurs and grows exponentially when modulation freq $\Omega \approx 2\omega_0$.
                  </p>
                </div>
              )}

              {simMode === "beats" && (
                <div className="space-y-3">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-center text-sm text-cyan-400 py-5">
                    x(t) = A&middot;cos(&omega;&#8321;&middot;t) + B&middot;cos(&omega;&#8322;&middot;t)
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                    When driven by two multi-tone signals close in frequency (f₁ ≈ f₂), phase interference produces envelope modulation cycling at the beat frequency f_beat = |f₁ - f₂|.
                  </p>
                </div>
              )}

            </div>
          </ConsoleCard>

          {/* Live analytical dependent variables */}
          <ConsoleCard title="Analytical Quantities" icon={Sparkles} glowColor="#a855f7">
            <div className="space-y-3 font-mono text-[10px] leading-relaxed">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <div className="text-white/40 font-semibold mb-1">NATURAL FREQ (f₀)</div>
                  <div className="text-sm font-bold text-teal-400">{f0.toFixed(2)} Hz</div>
                  <div className="text-[8px] text-white/30">{w0.toFixed(1)} rad/s</div>
                </div>

                {simMode === "single" && (
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 font-semibold mb-1">QUALITY FACTOR (Q)</div>
                    <div className="text-sm font-bold text-amber-400">{activeSingleData.Q.toFixed(1)}</div>
                    <div className="text-[8px] text-white/30">Damping η = {activeSingleData.zeta.toFixed(4)}</div>
                  </div>
                )}

                {simMode === "coupled" && (
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 font-semibold mb-1">MODE SPLITTING (Δf)</div>
                    <div className="text-sm font-bold text-indigo-400">{activeCoupledData.split.toFixed(2)} Hz</div>
                    <div className="text-[8px] text-white/30">f_sym: {activeCoupledData.fSym.toFixed(2)} Hz</div>
                  </div>
                )}

                {simMode === "duffing" && (
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 font-semibold mb-1">SHIFTED RES. FREQ</div>
                    <div className="text-sm font-bold text-rose-400">{activeDuffingData.fRes.toFixed(2)} Hz</div>
                    <div className="text-[8px] text-white/30">{activeDuffingData.type}</div>
                  </div>
                )}

                {simMode === "parametric" && (
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 font-semibold mb-1">CRIT MODULATION</div>
                    <div className="text-sm font-bold text-rose-400">{activeParametricData.epsCrit.toFixed(3)} &epsilon;</div>
                    <div className={cn("text-[8px] font-bold uppercase", activeParametricData.isUnstable ? "text-rose-500 animate-pulse" : "text-emerald-400")}>
                      {activeParametricData.isUnstable ? "Unstable (Growth)" : "Stable (Decay)"}
                    </div>
                  </div>
                )}

                {simMode === "beats" && (
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 font-semibold mb-1">BEAT FREQ (f_beat)</div>
                    <div className="text-sm font-bold text-amber-400">{activeBeatsData.fBeat.toFixed(2)} Hz</div>
                    <div className="text-[8px] text-white/30">Period T = {activeBeatsData.tBeat.toFixed(2)} s</div>
                  </div>
                )}
              </div>

              {simMode === "single" && (
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl flex justify-between">
                  <span>Bandwidth (Δf): {activeSingleData.bw.toFixed(3)} Hz</span>
                  <span>Decay Time (τ): {activeSingleData.decay.toFixed(2)} s</span>
                </div>
              )}

              {simMode === "coupled" && (
                <div className="p-3 bg-black/40 border border-white/5 rounded-2xl flex justify-between text-[9px]">
                  <span>Mass 1 f0: {activeCoupledData.f01.toFixed(2)} Hz</span>
                  <span>Mass 2 f0: {activeCoupledData.f02.toFixed(2)} Hz</span>
                  <span>f_asym: {activeCoupledData.fAsym.toFixed(2)} Hz</span>
                </div>
              )}
            </div>
          </ConsoleCard>

          {/* Mathematical SVG Diagrams */}
          <ConsoleCard title="Scientific Plots" icon={RefreshCw} glowColor="#a855f7">
            <div className="space-y-4">
              
              {/* Dynamic plotting logic depending on regime */}
              {simMode === "single" && renderSingleResonanceSVG()}
              {simMode === "coupled" && renderCoupledResonanceSVG()}
              {simMode === "duffing" && renderDuffingResonanceSVG()}
              {simMode === "parametric" && renderParametricResonanceSVG()}
              {simMode === "beats" && renderBeatsResonanceSVG()}
              
              <div className="text-[9px] text-white/30 leading-relaxed font-semibold text-center italic">
                *Charts represent mathematically computed analytical solutions updated in real-time.
              </div>
            </div>
          </ConsoleCard>

        </div>

      </div>
    </div>
  );
};

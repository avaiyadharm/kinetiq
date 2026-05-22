"use client";

import React, { useState } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { ResonanceCanvas, WaveformType } from "./ResonanceCanvas";
import { ResonanceEnvironment } from "./ResonanceEnvironment";
import { ResonanceTheory } from "./ResonanceTheory";
import { 
  Play, Pause, RotateCcw, Activity, Zap, Settings2, Sparkles, Sliders, RefreshCw, BarChart2, BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── ClickableValue Slider Component ─────────────────────────────────────────
interface ClickableValueProps {
  value: number;
  label: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  colorClass?: string;
  format?: (val: number) => string;
}

const ClickableValue = ({ 
  value, 
  label, 
  unit, 
  min, 
  max, 
  step, 
  onChange, 
  colorClass = "text-white", 
  format 
}: ClickableValueProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>
            {format ? format(value) : value.toFixed(2)}
          </span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div 
        className="relative h-6 flex items-center group cursor-pointer"
        onMouseDown={(e) => {
          setIsDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onChange(min + percent * (max - min));
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const snapped = Math.round((min + percent * (max - min)) / step) * step;
            onChange(Math.min(max, Math.max(min, snapped)));
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={cn("h-full opacity-50 group-hover:opacity-100 transition-opacity")} 
            style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: "currentColor" }} 
          />
        </div>
        <div
          className={cn("absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform", 
            isDragging ? "scale-150" : "group-hover:scale-125")}
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
};

// ─── ControlCard Wrapper Component ───────────────────────────────────────────
interface ControlCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  color?: string;
}

const ControlCard = ({ title, icon: Icon, children, color }: ControlCardProps) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
      <Icon className="w-24 h-24" style={{ color }} />
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <div className="p-2 rounded-lg bg-white/5" style={{ color }}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest text-white/90">{title}</h3>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export const ResonanceSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  
  // Physical parameters state (Mass 1, stiffness, damping, driver)
  const [mass, setMass] = useState<number>(2.0);        // kg
  const [springK, setSpringK] = useState<number>(100.0);   // N/m
  const [dampingB, setDampingB] = useState<number>(0.5);    // N s/m
  const [driverAmp, setDriverAmp] = useState<number>(10.0);   // N
  const [driverFreq, setDriverFreq] = useState<number>(1.13); // Hz
  const [waveform, setWaveform] = useState<WaveformType>("sine");

  // Advanced states
  const [simMode, setSimMode] = useState<"single" | "coupled" | "duffing" | "parametric" | "beats">("single");
  const [integrator, setIntegrator] = useState<"rk4" | "symplectic_euler" | "velocity_verlet" | "adaptive_rk">("rk4");
  const [duffingAlpha, setDuffingAlpha] = useState<number>(30.0); // N/m^3
  const [couplingK, setCouplingK] = useState<number>(50.0); // N/m coupling
  const [mass2, setMass2] = useState<number>(2.0); // kg mass 2
  const [dampingB2, setDampingB2] = useState<number>(0.5); // N s/m damping 2
  const [substeps, setSubsteps] = useState<number>(20);

  // Expanded physical states for university-grade control console
  const [springK2, setSpringK2] = useState<number>(100.0); // N/m stiffness 2
  const [couplingB, setCouplingB] = useState<number>(0.1); // N s/m coupling damping
  const [driverAmp2, setDriverAmp2] = useState<number>(0.0); // N driving amp 2
  const [driverFreq2, setDriverFreq2] = useState<number>(1.5); // Hz driving freq 2
  const [initX1, setInitX1] = useState<number>(0.0); // m initial displacement 1
  const [initV1, setInitV1] = useState<number>(0.0); // m/s initial velocity 1
  const [initX2, setInitX2] = useState<number>(0.0); // m initial displacement 2
  const [initV2, setInitV2] = useState<number>(0.0); // m/s initial velocity 2
  const [parametricEpsilon, setParametricEpsilon] = useState<number>(0.3); // epsilon modulation depth
  const [timeStep, setTimeStep] = useState<number>(0.01); // s integration timestep
  const [solverTolerance, setSolverTolerance] = useState<number>(1e-5); // m local error tolerance
  const [adaptiveStepping, setAdaptiveStepping] = useState<boolean>(false); // adaptive step toggle
  const [autoSweep, setAutoSweep] = useState<boolean>(false);
  const [sweepSpeed, setSweepSpeed] = useState<number>(0.05); // Hz/s
  const [showCursors, setShowCursors] = useState<boolean>(true);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  // Playback parameters
  const [slowMotion, setSlowMotion] = useState<number>(0.1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string>("Custom");
  
  // Trigger states
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [impulseTrigger, setImpulseTrigger] = useState<number>(0);
  const [resetPhaseTrigger, setResetPhaseTrigger] = useState<number>(0);
  const [clearSweepTrigger, setClearSweepTrigger] = useState<number>(0);

  // Live telemetry state from Canvas
  const [telemetry, setTelemetry] = useState({
    currentAmplitude: 0,
    currentAmplitude2: 0,
    qFactor: 0,
    phaseLagDeg: 0,
    peakFreqHz: 0,
    naturalFreqHz: 0,
    currentFreqHz: 0,
    dissipatedPower: 0,
    totalEnergy: 0,
    integrationError: 0,
    solverStatus: "stable",
    energyDrift: 0,
    truncationError: 0,
  });

  const handleReset = () => {
    setResetTrigger(prev => prev + 1);
  };

  const handleApplyImpulse = () => {
    setImpulseTrigger(prev => prev + 1);
  };

  const handleResetPhase = () => {
    setResetPhaseTrigger(prev => prev + 1);
  };

  const handleClearSweep = () => {
    setClearSweepTrigger(prev => prev + 1);
  };

  return (
    <SimulationPageLayout
      title="Resonance & Oscillations Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      <div className="flex-1 overflow-hidden">
        {activeTab === "canvas" && (
          <div className="h-full flex flex-col xl:flex-row">
            {/* Simulation Canvas Workspace */}
            <div className="flex-1 min-h-[450px] xl:h-full bg-black relative">
              <ResonanceCanvas
                params={{
                  mass,
                  springK,
                  dampingB,
                  driverAmp,
                  driverFreq,
                  waveform,
                  slowMotion,
                  isPlaying,
                  showVectors,
                  simMode,
                  integrator,
                  duffingAlpha,
                  couplingK,
                  mass2,
                  dampingB2,
                  substeps,
                  autoSweep,
                  sweepSpeed,
                  showCursors,
                  showValidation,
                  springK2,
                  couplingB,
                  driverAmp2,
                  driverFreq2,
                  initX1,
                  initV1,
                  initX2,
                  initV2,
                  parametricEpsilon,
                  timeStep,
                  solverTolerance,
                  adaptiveStepping,
                }}
                onStateUpdate={setTelemetry}
                resetTrigger={resetTrigger}
                impulseTrigger={impulseTrigger}
                resetPhaseTrigger={resetPhaseTrigger}
                clearSweepTrigger={clearSweepTrigger}
                setDriverFreq={setDriverFreq}
              />

              {/* Float HUD Header overlay */}
              <div className="absolute top-6 left-6 p-4 bg-black/75 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none z-10">
                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">PHYSICAL INTEGRATOR</div>
                <div className="text-sm font-mono text-cyan-400 font-bold uppercase">
                  {integrator.replace("_", " ")}: {substeps} Steps
                </div>
                <div className="text-[9px] text-white/40">Step size: Δt = {((slowMotion * 0.0166) / substeps).toFixed(5)}s</div>
              </div>
            </div>

            {/* Right Sidebar - controls panel */}
            <aside className="w-full xl:w-[360px] border-t xl:border-t-0 xl:border-l border-border bg-[#18181b] flex flex-col h-1/2 xl:h-full overflow-y-auto shrink-0 select-none">
              
              {/* Playback Controls & Quick resets */}
              <div className="p-6 border-b border-border flex flex-col gap-4 bg-black/20">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95",
                      isPlaying 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "PAUSE LAB" : "RUN LAB"}
                  </button>
                  <button
                    onClick={handleReset}
                    title="Reset simulation parameters and state"
                    className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-90"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button 
                    onClick={handleApplyImpulse}
                    className="py-2 px-3 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 font-bold uppercase tracking-wider transition-all"
                  >
                    Apply Impulse
                  </button>
                  <button 
                    onClick={handleResetPhase}
                    className="py-2 px-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 font-bold uppercase tracking-wider transition-all"
                  >
                    Reset Phase
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* 1. Lab Mode Configuration */}
                <ControlCard title="Lab Regime" icon={Sliders} color="#3b82f6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Simulation Mode</label>
                      <select 
                        value={simMode}
                        onChange={(e) => {
                          setSimMode(e.target.value as any);
                          setActivePreset("Custom");
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="single">Single Oscillator</option>
                        <option value="coupled">Coupled Oscillators</option>
                        <option value="duffing">Duffing Nonlinear</option>
                        <option value="parametric">Parametric Resonance</option>
                        <option value="beats">Beats & Interference</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Numerical Solver</label>
                      <select 
                        value={integrator}
                        onChange={(e) => setIntegrator(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-mono text-cyan-400"
                      >
                        <option value="rk4">Runge-Kutta 4th Order (RK4)</option>
                        <option value="symplectic_euler">Symplectic Euler</option>
                        <option value="velocity_verlet">Velocity Verlet</option>
                        <option value="adaptive_rk">Adaptive RK45 (Cash-Karp)</option>
                      </select>
                    </div>

                    <ClickableValue
                      label="Integration Substeps"
                      value={substeps}
                      unit=""
                      min={5}
                      max={100}
                      step={1}
                      onChange={setSubsteps}
                      colorClass="text-cyan-400 font-mono"
                    />
                  </div>
                </ControlCard>

                {/* 2. Driver Engine Configuration */}
                <ControlCard title="Driver Engine" icon={Zap} color="#f59e0b">
                  <div className="space-y-5">
                    {simMode !== "parametric" && (
                      <ClickableValue
                        label="Forcing Amplitude (F₀)"
                        value={driverAmp}
                        unit="N"
                        min={0}
                        max={50}
                        step={0.5}
                        onChange={(val) => {
                          setDriverAmp(val);
                          setActivePreset("Custom");
                        }}
                        colorClass="text-amber-400"
                      />
                    )}
                    <ClickableValue
                      label="Driving Frequency (fd)"
                      value={driverFreq}
                      unit="Hz"
                      min={0.1}
                      max={5.0}
                      step={0.01}
                      onChange={(val) => {
                        setDriverFreq(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-amber-400"
                    />

                    {/* Waveform Selector */}
                    {simMode !== "parametric" && (
                      <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                        {(["sine", "square", "triangle"] as WaveformType[]).map((w) => (
                          <button
                            key={w}
                            onClick={() => {
                              setWaveform(w);
                              setActivePreset("Custom");
                            }}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                              waveform === w 
                                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" 
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </ControlCard>

                {/* 3. Resonator Physical Parameters */}
                <ControlCard title="Resonator Parameters" icon={Settings2} color="#0d9488">
                  <div className="space-y-5">
                    <ClickableValue
                      label={simMode === "coupled" ? "Mass 1 (m₁)" : "Mass (m)"}
                      value={mass}
                      unit="kg"
                      min={0.5}
                      max={10.0}
                      step={0.1}
                      onChange={(val) => {
                        setMass(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400"
                    />
                    
                    {simMode === "coupled" && (
                      <ClickableValue
                        label="Mass 2 (m₂)"
                        value={mass2}
                        unit="kg"
                        min={0.5}
                        max={10.0}
                        step={0.1}
                        onChange={(val) => {
                          setMass2(val);
                          setActivePreset("Custom");
                        }}
                        colorClass="text-teal-400 animate-fadeIn"
                      />
                    )}

                    <ClickableValue
                      label={simMode === "coupled" ? "Spring Stiffness (k₁)" : "Stiffness (k)"}
                      value={springK}
                      unit="N/m"
                      min={20}
                      max={500}
                      step={5}
                      onChange={(val) => {
                        setSpringK(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400"
                    />

                    {simMode === "coupled" && (
                      <ClickableValue
                        label="Coupling spring (k₁₂)"
                        value={couplingK}
                        unit="N/m"
                        min={0}
                        max={200}
                        step={5}
                        onChange={(val) => {
                          setCouplingK(val);
                          setActivePreset("Custom");
                        }}
                        colorClass="text-indigo-400 font-bold"
                      />
                    )}

                    {simMode === "duffing" && (
                      <ClickableValue
                        label="Duffing Nonlinearity (α)"
                        value={duffingAlpha}
                        unit="N/m³"
                        min={0}
                        max={100}
                        step={1}
                        onChange={(val) => {
                          setDuffingAlpha(val);
                          setActivePreset("Custom");
                        }}
                        colorClass="text-rose-400 font-bold"
                      />
                    )}

                    <ClickableValue
                      label={simMode === "coupled" ? "Damping 1 (b₁)" : "Damping (b)"}
                      value={dampingB}
                      unit="N s/m"
                      min={0.0}
                      max={80.0}
                      step={0.05}
                      onChange={(val) => {
                        setDampingB(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400"
                    />

                    {simMode === "coupled" && (
                      <ClickableValue
                        label="Damping 2 (b₂)"
                        value={dampingB2}
                        unit="N s/m"
                        min={0.0}
                        max={80.0}
                        step={0.05}
                        onChange={(val) => {
                          setDampingB2(val);
                          setActivePreset("Custom");
                        }}
                        colorClass="text-teal-400"
                      />
                    )}
                  </div>
                </ControlCard>

                {/* 4. Frequency Sweep Laboratory */}
                <ControlCard title="Sweep Laboratory" icon={RefreshCw} color="#10b981">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Auto Sweep</span>
                      <button
                        onClick={() => setAutoSweep(!autoSweep)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-200",
                          autoSweep ? "bg-emerald-600" : "bg-white/10"
                        )}
                      >
                        <div 
                          className={cn("w-4 h-4 rounded-full bg-white transition-all", 
                            autoSweep ? "translate-x-6" : "translate-x-0")} 
                        />
                      </button>
                    </div>

                    <ClickableValue
                      label="Sweep Speed"
                      value={sweepSpeed}
                      unit="Hz/s"
                      min={0.01}
                      max={0.2}
                      step={0.01}
                      onChange={setSweepSpeed}
                      colorClass="text-emerald-400"
                    />

                    <button
                      onClick={handleClearSweep}
                      className="w-full py-2 bg-black/40 hover:bg-black/60 border border-white/5 text-white/80 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Clear Sweep History
                    </button>
                  </div>
                </ControlCard>

                {/* 5. Live Analytical Telemetry */}
                <ControlCard title="Live Telemetry" icon={Activity} color="#10b981">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Q-Factor</div>
                      <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                        {telemetry.qFactor === Infinity ? "∞" : telemetry.qFactor.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Phase Lag</div>
                      <div className="text-lg font-mono font-bold text-teal-400 mt-1">
                        {telemetry.phaseLagDeg.toFixed(1)}°
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Peak Freq</div>
                      <div className="text-lg font-mono font-bold text-blue-400 mt-1">
                        {telemetry.peakFreqHz.toFixed(2)} Hz
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Power Diss</div>
                      <div className="text-lg font-mono font-bold text-red-400 mt-1">
                        {telemetry.dissipatedPower.toFixed(2)} W
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Displacements</span>
                        <span className="text-[8px] text-white/30 font-mono">1: Teal | 2: Purple</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400 mt-1 flex justify-between">
                        <span>x₁: {telemetry.currentAmplitude.toFixed(3)} m</span>
                        {simMode === "coupled" && <span>x₂: {telemetry.currentAmplitude2.toFixed(3)} m</span>}
                      </div>
                    </div>
                  </div>
                </ControlCard>

                {/* 6. Display Settings / Toggles */}
                <ControlCard title="Instrumentation" icon={Sparkles} color="#b4c5ff">
                  <div className="space-y-4">
                    {/* Vectors Toggler */}
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Show Force Vectors</span>
                      <button
                        onClick={() => setShowVectors(!showVectors)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-200",
                          showVectors ? "bg-blue-600" : "bg-white/10"
                        )}
                      >
                        <div 
                          className={cn("w-4 h-4 rounded-full bg-white transition-all", 
                            showVectors ? "translate-x-6" : "translate-x-0")} 
                        />
                      </button>
                    </div>

                    {/* Scope Cursors Toggler */}
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Scope Cursors</span>
                      <button
                        onClick={() => setShowCursors(!showCursors)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-200",
                          showCursors ? "bg-cyan-600" : "bg-white/10"
                        )}
                      >
                        <div 
                          className={cn("w-4 h-4 rounded-full bg-white transition-all", 
                            showCursors ? "translate-x-6" : "translate-x-0")} 
                        />
                      </button>
                    </div>

                    {/* Validation Panel Toggler */}
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Validation Overlay</span>
                      <button
                        onClick={() => setShowValidation(!showValidation)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-200",
                          showValidation ? "bg-teal-600" : "bg-white/10"
                        )}
                      >
                        <div 
                          className={cn("w-4 h-4 rounded-full bg-white transition-all", 
                            showValidation ? "translate-x-6" : "translate-x-0")} 
                        />
                      </button>
                    </div>

                    {/* Simulation Speed (Slow-mo) */}
                    <ClickableValue
                      label="Visual Speed Factor"
                      value={slowMotion}
                      unit="x"
                      min={0.01}
                      max={1.00}
                      step={0.01}
                      onChange={setSlowMotion}
                      colorClass="text-indigo-400"
                    />
                  </div>
                </ControlCard>

              </div>
            </aside>
          </div>
        )}

        {activeTab === "config" && (
          <ResonanceEnvironment
            mass={mass}
            setMass={setMass}
            springK={springK}
            setSpringK={setSpringK}
            dampingB={dampingB}
            setDampingB={setDampingB}
            driverAmp={driverAmp}
            setDriverAmp={setDriverAmp}
            driverFreq={driverFreq}
            setDriverFreq={setDriverFreq}
            waveform={waveform}
            setWaveform={setWaveform}
            activePreset={activePreset}
            setActivePreset={setActivePreset}
            simMode={simMode}
            setSimMode={setSimMode}
            duffingAlpha={duffingAlpha}
            setDuffingAlpha={setDuffingAlpha}
            couplingK={couplingK}
            setCouplingK={setCouplingK}
            mass2={mass2}
            setMass2={setMass2}
            dampingB2={dampingB2}
            setDampingB2={setDampingB2}
            springK2={springK2}
            setSpringK2={setSpringK2}
            couplingB={couplingB}
            setCouplingB={setCouplingB}
            driverAmp2={driverAmp2}
            setDriverAmp2={setDriverAmp2}
            driverFreq2={driverFreq2}
            setDriverFreq2={setDriverFreq2}
            initX1={initX1}
            setInitX1={setInitX1}
            initV1={initV1}
            setInitV1={setInitV1}
            initX2={initX2}
            setInitX2={setInitX2}
            initV2={initV2}
            setInitV2={setInitV2}
            parametricEpsilon={parametricEpsilon}
            setParametricEpsilon={setParametricEpsilon}
            timeStep={timeStep}
            setTimeStep={setTimeStep}
            solverTolerance={solverTolerance}
            setSolverTolerance={setSolverTolerance}
            adaptiveStepping={adaptiveStepping}
            setAdaptiveStepping={setAdaptiveStepping}
            integrator={integrator}
            setIntegrator={setIntegrator}
            substeps={substeps}
            setSubsteps={setSubsteps}
            telemetry={telemetry}
          />
        )}

        {activeTab === "theory" && <ResonanceTheory />}

        {activeTab === "guide" && (
          <div className="max-w-4xl mx-auto space-y-12 pb-24 text-white overflow-y-auto h-full px-6 pt-6 font-body-md">
            <header className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Student Guide
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
                Resonance <span className="text-blue-400">Laboratory Guide</span>
              </h2>
              <p className="text-base text-white/50 leading-relaxed max-w-3xl font-body-md">
                Follow these interactive laboratory procedures to explore the physics of resonance, non-linear jump behavior, normal modes, and phase transitions.
              </p>
            </header>

            <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-3 relative z-10">
                <span className="w-6 h-[2px] bg-blue-400/50" /> 
                Experiment 1: Phase Shifts & Resonant Amplitude
              </h3>
              <ol className="list-decimal pl-6 space-y-4 text-sm text-white/70">
                <li>
                  Ensure you are in the <strong>Single Oscillator</strong> mode. Set Mass = 2.0 kg, spring $k = 100$ N/m, and damping $b = 0.5$ N s/m. This gives a natural frequency of $f_0 \approx 1.13$ Hz.
                </li>
                <li>
                  Drive the system at $f_d = 0.50$ Hz. Notice on the <strong>Phasor Diagram</strong> (bottom-left) that the driver vector (blue) and mass position vector (teal) rotate almost in-phase. The phase lag $\phi \approx 10^\circ$.
                </li>
                <li>
                  Slowly adjust $f_d$ to $1.13$ Hz. Notice the amplitude increase. The phase angle is now exactly $90^\circ$ — velocity is aligned with force, maximizing instantaneous power transfer!
                </li>
                <li>
                  Increase $f_d$ to $3.00$ Hz. The mass displacement lags by almost $180^\circ$ and moves completely opposite to the driving force.
                </li>
              </ol>
            </section>

            <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-3 relative z-10">
                <span className="w-6 h-[2px] bg-blue-400/50" /> 
                Experiment 2: Auto Frequency Sweep & Bandwidth
              </h3>
              <ol className="list-decimal pl-6 space-y-4 text-sm text-white/70">
                <li>
                  Select the <strong>Tuning Fork (High Q)</strong> preset.
                </li>
                <li>
                  In the right panel, scroll down to <strong>Sweep Laboratory</strong> and turn on <strong>Auto Sweep</strong>.
                </li>
                <li>
                  Observe the driving frequency $f_d$ incrementing slowly. Watch the Lorentzian spectrum graph (top-right); yellow crosshairs will trace the experimental amplitude response.
                </li>
                <li>
                  Notice that the peak is extremely narrow, which corresponds mathematically to a high Quality Factor ($Q \approx 250$). The half-power bandwidth is visually represented by the horizontal bandwidth line $\Delta f$.
                </li>
              </ol>
            </section>

            <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-3 relative z-10">
                <span className="w-6 h-[2px] bg-blue-400/50" /> 
                Experiment 3: Duffing Hysteresis & Jump Resonances
              </h3>
              <ol className="list-decimal pl-6 space-y-4 text-sm text-white/70">
                <li>
                  Select the <strong>Duffing Bistable Jump</strong> preset. This configures a hardening spring ($\alpha = 30$).
                </li>
                <li>
                  Sweep the frequency manually upwards from $0.8$ Hz. Notice the peak bends to the right. The amplitude increases to high values and then suddenly "jumps" down to a lower branch around $1.4$ Hz.
                </li>
                <li>
                  Now sweep the frequency downwards from $1.8$ Hz. The system stays on the lower amplitude branch until it reaches $1.0$ Hz, where it suddenly jumps up to the higher branch. This is the hysteresis region!
                </li>
              </ol>
            </section>
          </div>
        )}
      </div>
    </SimulationPageLayout>
  );
};

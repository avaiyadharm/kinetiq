"use client";

import React, { useState } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { SoundWavesCanvas } from "./SoundWavesCanvas";
import { SoundWavesTheory } from "./SoundWavesTheory";
import { SoundWavesGuide } from "./SoundWavesGuide";
import { 
  Play, Pause, RotateCcw, Activity, Zap, Settings2, Sparkles, Sliders, RefreshCw, BarChart2, Volume2, Waves
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
            className="h-full opacity-50 group-hover:opacity-100 transition-opacity" 
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

export type RegimeType = "propagation" | "resonance" | "doppler" | "interference" | "room" | "impedance";
export type VisModeType = "particles" | "pressure" | "density" | "velocity" | "energy";

export const SoundWavesSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");

  // Core Physical Constants (Air default at 20°C)
  const [speedOfSound, setSpeedOfSound] = useState<number>(343.0); // c (m/s)
  const [density, setDensity] = useState<number>(1.2); // rho (kg/m^3)
  const [bulkModulus, setBulkModulus] = useState<number>(speedOfSound * speedOfSound * density); // B = c^2 * rho (Pa)
  const [damping, setDamping] = useState<number>(0.1); // Wave dissipation
  const [nonlinearBeta, setNonlinearBeta] = useState<number>(0.0); // Nonlinear parameter beta

  // Basic Driver Source
  const [frequency, setFrequency] = useState<number>(340.0); // f (Hz)
  const [amplitude, setAmplitude] = useState<number>(1.5); // Source pressure amplitude (Pa)
  const [visMode, setVisMode] = useState<VisModeType>("particles");

  // Regime Selection
  const [regime, setRegime] = useState<RegimeType>("propagation");
  
  // Numerical vs Analytical Solver Mode
  const [solverType, setSolverType] = useState<"fdtd" | "analytical">("analytical");

  // Standing Waves / Pipe Parameters
  const [pipeType, setPipeType] = useState<"open-open" | "open-closed">("open-open");
  const [pipeLength, setPipeLength] = useState<number>(1.5); // L (m)
  const [harmonic, setHarmonic] = useState<number>(1); // Harmonics n = 1, 2, 3...

  // Doppler Parameters
  const [sourceSpeed, setSourceSpeed] = useState<number>(150.0); // vs (m/s)
  const [observerSpeed, setObserverSpeed] = useState<number>(0.0); // vo (m/s)

  // Interference Parameters
  const [beatFreq, setBeatFreq] = useState<number>(5.0); // f_beat = |f1 - f2| (Hz)
  const [phaseDiff, setPhaseDiff] = useState<number>(0.0); // Phase shift (rad)
  const [sourcesCount, setSourcesCount] = useState<number>(2); // 1 or 2 sources

  // Room Acoustics Parameters
  const [roomWidth, setRoomWidth] = useState<number>(10.0); // m
  const [roomHeight, setRoomHeight] = useState<number>(6.0); // m
  const [absorptionCoeff, setAbsorptionCoeff] = useState<number>(0.15); // alpha (Sabine absorption)
  
  // Boundary Impedance Parameters
  const [boundaryL, setBoundaryL] = useState<"absorbing" | "reflective" | "pml">("absorbing");
  const [boundaryR, setBoundaryR] = useState<"absorbing" | "reflective" | "pml">("absorbing");
  const [impedanceRatio, setImpedanceRatio] = useState<number>(2.5); // Z2 / Z1 ratio

  // Simulator playback
  const [slowMotion, setSlowMotion] = useState<number>(0.1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string>("Air (20°C)");

  // Live Telemetry states updated from SoundWavesCanvas
  const [telemetry, setTelemetry] = useState({
    pressureAmp: 0,
    wavelength: 1.0,
    wavenumber: 6.28,
    angularFreq: 2136.0,
    impedance: 411.6,
    soundIntensity: 0,
    soundLevelDb: 0,
    cflNumber: 0.85,
    timestep: 0.00001,
    reverbTime: 1.2,
    dopplerShiftedFreq: 340.0,
    energyDensity: 0,
    nonlinearDistortion: 0,
  });

  const handleReset = () => {
    setSpeedOfSound(343.0);
    setDensity(1.2);
    setBulkModulus(343.0 * 343.0 * 1.2);
    setDamping(0.1);
    setNonlinearBeta(0.0);
    setFrequency(340.0);
    setAmplitude(1.5);
    setVisMode("particles");
    setRegime("propagation");
    setSolverType("analytical");
    setPipeType("open-open");
    setPipeLength(1.5);
    setHarmonic(1);
    setSourceSpeed(150.0);
    setObserverSpeed(0.0);
    setBeatFreq(5.0);
    setPhaseDiff(0.0);
    setRoomWidth(10.0);
    setRoomHeight(6.0);
    setAbsorptionCoeff(0.15);
    setBoundaryL("absorbing");
    setBoundaryR("absorbing");
    setImpedanceRatio(2.5);
    setSlowMotion(0.1);
    setIsPlaying(true);
    setActivePreset("Air (20°C)");
  };

  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === "Air (20°C)") {
      setSpeedOfSound(343.0);
      setDensity(1.2);
      setBulkModulus(343.0 * 343.0 * 1.2);
    } else if (presetName === "Cold Air (0°C)") {
      setSpeedOfSound(331.0);
      setDensity(1.29);
      setBulkModulus(331.0 * 331.0 * 1.29);
    } else if (presetName === "Helium Gas") {
      setSpeedOfSound(972.0);
      setDensity(0.18);
      setBulkModulus(972.0 * 972.0 * 0.18);
    } else if (presetName === "Water") {
      setSpeedOfSound(1482.0);
      setDensity(1000.0);
      setBulkModulus(1482.0 * 1482.0 * 1000.0);
    } else if (presetName === "Vacuum") {
      setSpeedOfSound(0.001); // Avoid division by zero
      setDensity(0.0);
      setBulkModulus(0.0);
    }
  };

  return (
    <SimulationPageLayout
      title="Sound Waves & Acoustic Resonance Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      <div className="flex-1 overflow-hidden">
        {activeTab === "canvas" && (
          <div className="h-full flex flex-col xl:flex-row">
            {/* Main Canvas visualization panel */}
            <div className="flex-1 min-h-[450px] xl:h-full bg-black relative">
              <SoundWavesCanvas
                params={{
                  speedOfSound,
                  density,
                  bulkModulus,
                  damping,
                  nonlinearBeta,
                  frequency,
                  amplitude,
                  regime,
                  solverType,
                  pipeType,
                  pipeLength,
                  harmonic,
                  sourceSpeed,
                  observerSpeed,
                  beatFreq,
                  phaseDiff,
                  sourcesCount,
                  roomWidth,
                  roomHeight,
                  absorptionCoeff,
                  boundaryL,
                  boundaryR,
                  impedanceRatio,
                  slowMotion,
                  isPlaying,
                  visMode,
                }}
                onStateUpdate={setTelemetry}
              />

              {/* HUD Header Overlay */}
              <div className="absolute top-6 left-6 p-4 bg-black/85 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none z-10">
                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">ACOUSTIC SOLVER CORE</div>
                <div className="text-sm font-mono text-cyan-400 font-bold uppercase">
                  {solverType === "fdtd" ? "1D FDTD Numerical PDE Solver" : "Analytical Boundary Solver"}
                </div>
                {solverType === "fdtd" && (
                  <div className="text-[9px] text-white/40">
                    CFL Number: {telemetry.cflNumber.toFixed(3)} | Timestep: {(telemetry.timestep * 1000000).toFixed(2)} μs
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar controls panel */}
            <aside className="w-full xl:w-[360px] border-t xl:border-t-0 xl:border-l border-border bg-[#18181b] flex flex-col h-1/2 xl:h-full overflow-y-auto shrink-0 select-none">
              {/* Playback Controls & Quick Presets */}
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

                {/* Medium Presets */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Medium presets</label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {["Air (20°C)", "Helium Gas", "Water"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          "py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                          activePreset === preset 
                            ? "bg-primary text-white shadow-md" 
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {preset.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 1. Laboratory Regime Config */}
                <ControlCard title="Laboratory Mode" icon={Sliders} color="#3b82f6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Acoustic Regime</label>
                      <select 
                        value={regime}
                        onChange={(e) => {
                          setRegime(e.target.value as RegimeType);
                          if (e.target.value === "room" || e.target.value === "doppler" || e.target.value === "interference") {
                            setSolverType("analytical"); // Force analytic models for 2D visualizations
                          }
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="propagation">1. Longitudinal Propagation</option>
                        <option value="resonance">2. Air Column Resonance</option>
                        <option value="doppler">3. Doppler Shift Simulator</option>
                        <option value="interference">4. Interference & Beats</option>
                        <option value="room">5. Sabine Room Acoustics</option>
                        <option value="impedance">6. Boundary Impedance Mismatch</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Visualization Mode</label>
                      <select 
                        value={visMode}
                        onChange={(e) => setVisMode(e.target.value as VisModeType)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="particles">Particle Oscillation Grid</option>
                        <option value="pressure">Continuous Pressure Field</option>
                        <option value="density">Density Field Variation</option>
                        <option value="velocity">Particle Velocity Vectors</option>
                        <option value="energy">Acoustic Energy Flow</option>
                      </select>
                    </div>

                    {regime === "propagation" && (
                      <div className="space-y-1 pt-2 border-t border-white/5">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Numerical PDE Solver</label>
                        <select 
                          value={solverType}
                          onChange={(e) => setSolverType(e.target.value as "fdtd" | "analytical")}
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-mono text-cyan-400"
                        >
                          <option value="analytical">Wave Equation Analytical Solution</option>
                          <option value="fdtd">1D FDTD Finite Difference Method</option>
                        </select>
                      </div>
                    )}
                  </div>
                </ControlCard>

                {/* 2. Source Parameters */}
                <ControlCard title="Acoustic Source" icon={Volume2} color="#f59e0b">
                  <div className="space-y-5">
                    <ClickableValue
                      label="Source Frequency (f)"
                      value={frequency}
                      unit="Hz"
                      min={80}
                      max={1200}
                      step={10}
                      onChange={setFrequency}
                      colorClass="text-amber-400 font-mono"
                    />

                    <ClickableValue
                      label="Pressure Amplitude (p₀)"
                      value={amplitude}
                      unit="Pa"
                      min={0.1}
                      max={5.0}
                      step={0.1}
                      onChange={setAmplitude}
                      colorClass="text-amber-400 font-mono"
                    />
                  </div>
                </ControlCard>

                {/* 3. Regime-Specific Subpanels */}
                {regime === "resonance" && (
                  <ControlCard title="Resonator Cavity" icon={Waves} color="#10b981">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Pipe End Conditions</label>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                          {["open-open", "open-closed"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setPipeType(type as any)}
                              className={cn(
                                "py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                pipeType === type 
                                  ? "bg-[#10b981] text-black shadow-md" 
                                  : "text-white/40 hover:text-white"
                              )}
                            >
                              {type.replace("-", " ")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <ClickableValue
                        label="Pipe Length (L)"
                        value={pipeLength}
                        unit="m"
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        onChange={setPipeLength}
                        colorClass="text-emerald-400 font-mono"
                      />

                      <ClickableValue
                        label="Cavity Harmonic (n)"
                        value={harmonic}
                        unit=""
                        min={1}
                        max={pipeType === "open-closed" ? 7 : 8}
                        step={pipeType === "open-closed" ? 2 : 1}
                        onChange={setHarmonic}
                        colorClass="text-emerald-400 font-mono"
                        format={(v) => `n = ${Math.round(v)}`}
                      />
                    </div>
                  </ControlCard>
                )}

                {regime === "doppler" && (
                  <ControlCard title="Doppler Kinematics" icon={Activity} color="#ec4899">
                    <div className="space-y-5">
                      <ClickableValue
                        label="Source Velocity (vs)"
                        value={sourceSpeed}
                        unit="m/s"
                        min={0}
                        max={500}
                        step={10}
                        onChange={setSourceSpeed}
                        colorClass="text-pink-400 font-mono"
                        format={(v) => `${v.toFixed(0)} m/s (Mach ${(v / speedOfSound).toFixed(2)})`}
                      />

                      <ClickableValue
                        label="Observer Velocity (vo)"
                        value={observerSpeed}
                        unit="m/s"
                        min={-150}
                        max={150}
                        step={5}
                        onChange={setObserverSpeed}
                        colorClass="text-pink-400 font-mono"
                      />
                    </div>
                  </ControlCard>
                )}

                {regime === "interference" && (
                  <ControlCard title="Wave Interference" icon={Zap} color="#8b5cf6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Sources Setup</label>
                        <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                          {[1, 2].map((num) => (
                            <button
                              key={num}
                              onClick={() => setSourcesCount(num)}
                              className={cn(
                                "py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                sourcesCount === num 
                                  ? "bg-violet-600 text-white shadow-md" 
                                  : "text-white/40 hover:text-white"
                              )}
                            >
                              {num === 1 ? "1 Source + Beat" : "2 Interfering"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {sourcesCount === 1 ? (
                        <ClickableValue
                          label="Secondary Freq Offset (f_beat)"
                          value={beatFreq}
                          unit="Hz"
                          min={0.5}
                          max={20.0}
                          step={0.5}
                          onChange={setBeatFreq}
                          colorClass="text-violet-400 font-mono"
                          format={(v) => `Δf = ${v.toFixed(1)} Hz`}
                        />
                      ) : (
                        <ClickableValue
                          label="Phase Difference (Δφ)"
                          value={phaseDiff}
                          unit="rad"
                          min={0}
                          max={2 * Math.PI}
                          step={Math.PI / 6}
                          onChange={setPhaseDiff}
                          colorClass="text-violet-400 font-mono"
                          format={(v) => `${(v / Math.PI).toFixed(2)} π`}
                        />
                      )}
                    </div>
                  </ControlCard>
                )}

                {regime === "room" && (
                  <ControlCard title="Room Geometry" icon={Settings2} color="#f97316">
                    <div className="space-y-5">
                      <ClickableValue
                        label="Room Width"
                        value={roomWidth}
                        unit="m"
                        min={6.0}
                        max={16.0}
                        step={0.5}
                        onChange={setRoomWidth}
                        colorClass="text-orange-400 font-mono"
                      />

                      <ClickableValue
                        label="Wall Absorption (α)"
                        value={absorptionCoeff}
                        unit=""
                        min={0.02}
                        max={0.85}
                        step={0.01}
                        onChange={setAbsorptionCoeff}
                        colorClass="text-orange-400 font-mono"
                        format={(v) => `${(v * 100).toFixed(0)}% Absorb`}
                      />
                    </div>
                  </ControlCard>
                )}

                {regime === "impedance" && (
                  <ControlCard title="Impedance Physics" icon={RefreshCw} color="#06b6d4">
                    <div className="space-y-5">
                      <ClickableValue
                        label="Medium 2 Impedance Ratio"
                        value={impedanceRatio}
                        unit="Z₂/Z₁"
                        min={0.1}
                        max={10.0}
                        step={0.1}
                        onChange={setImpedanceRatio}
                        colorClass="text-cyan-400 font-mono"
                        format={(v) => `${v.toFixed(1)}x Z₁`}
                      />
                    </div>
                  </ControlCard>
                )}

                {/* 4. Expert Physics Constants */}
                <ControlCard title="Medium Physics" icon={Settings2} color="#0d9488">
                  <div className="space-y-5">
                    <ClickableValue
                      label="Speed of Sound (c)"
                      value={speedOfSound}
                      unit="m/s"
                      min={150.0}
                      max={1600.0}
                      step={5.0}
                      onChange={(v) => {
                        setSpeedOfSound(v);
                        setBulkModulus(v * v * density);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400 font-mono"
                    />

                    <ClickableValue
                      label="Medium Density (ρ)"
                      value={density}
                      unit="kg/m³"
                      min={0.1}
                      max={1200.0}
                      step={0.1}
                      onChange={(v) => {
                        setDensity(v);
                        setBulkModulus(speedOfSound * speedOfSound * v);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400 font-mono"
                    />

                    <ClickableValue
                      label="Medium Damping Factor"
                      value={damping}
                      unit="s⁻¹"
                      min={0.0}
                      max={2.0}
                      step={0.05}
                      onChange={setDamping}
                      colorClass="text-teal-400 font-mono"
                    />

                    {regime === "propagation" && (
                      <ClickableValue
                        label="Nonlinear Parameter (β)"
                        value={nonlinearBeta}
                        unit=""
                        min={0.0}
                        max={8.0}
                        step={0.2}
                        onChange={setNonlinearBeta}
                        colorClass="text-red-400 font-mono"
                        format={(v) => v === 0 ? "Off (Linear)" : `β = ${v.toFixed(1)}`}
                      />
                    )}
                  </div>
                </ControlCard>

                {/* 5. Live Telemetry */}
                <ControlCard title="Acoustical Telemetry" icon={Activity} color="#10b981">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Acoustic Z</div>
                      <div className="text-sm font-mono font-bold text-amber-400 mt-1">
                        {telemetry.impedance.toFixed(1)} <span className="text-[9px] text-white/30 font-sans">Rayls</span>
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Wavelength (λ)</div>
                      <div className="text-sm font-mono font-bold text-teal-400 mt-1">
                        {telemetry.wavelength.toFixed(3)} <span className="text-[9px] text-white/30 font-sans">m</span>
                      </div>
                    </div>
                    
                    {regime === "doppler" ? (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                        <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Doppler Freq (f')</div>
                        <div className="text-base font-mono font-bold text-pink-400 mt-1">
                          {telemetry.dopplerShiftedFreq.toFixed(1)} Hz (was {frequency} Hz)
                        </div>
                      </div>
                    ) : regime === "room" ? (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                        <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Reverb Decay Time (T₆₀)</div>
                        <div className="text-base font-mono font-bold text-orange-400 mt-1">
                          Sabine: {telemetry.reverbTime.toFixed(2)} s
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                          <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Pressure Level</div>
                          <div className="text-sm font-mono font-bold text-blue-400 mt-1">
                            {telemetry.soundLevelDb.toFixed(1)} <span className="text-[9px] text-white/30 font-sans">dB</span>
                          </div>
                        </div>
                        <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                          <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Intensity (I)</div>
                          <div className="text-sm font-mono font-bold text-red-400 mt-1">
                            {(telemetry.soundIntensity * 1000).toFixed(3)} <span className="text-[9px] text-white/30 font-sans">mW/m²</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Energy & Wave States</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-1 flex justify-between">
                        <span>u_avg: {(telemetry.energyDensity * 1000).toFixed(3)} mJ/m³</span>
                        <span>k: {telemetry.wavenumber.toFixed(2)} rad/m</span>
                      </div>
                    </div>
                  </div>
                </ControlCard>

                {/* 6. Visual Speed factor control */}
                <ControlCard title="Visual Playback" icon={Sparkles} color="#b4c5ff">
                  <div className="space-y-4">
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
          <div className="flex-1 p-10 bg-[#18181b] overflow-y-auto text-white space-y-6">
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-primary">Environment Settings & Solver Coefficients</h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-3xl">
              Adjust the microphysical constants of the medium and configuration details of the Numerical PDE Solvers.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl pt-4">
              <div className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Thermodynamic Relations</h3>
                <div className="space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Medium Density (ρ)</span>
                    <span className="font-mono">{density.toFixed(2)} kg/m³</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Adiabatic Bulk Modulus (B)</span>
                    <span className="font-mono">{(bulkModulus / 1000).toFixed(1)} kPa</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Specific Acoustic Impedance (Z₀)</span>
                    <span className="font-mono">{(speedOfSound * density).toFixed(1)} N·s/m³</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Reference Intensity (I₀)</span>
                    <span className="font-mono">10⁻¹² W/m² (Hearing Threshold)</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">PDE Solver Specifications (1D FDTD)</h3>
                <div className="space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Grid Resolution (Δx)</span>
                    <span className="font-mono">0.015 m (80 Grid Nodes)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Calculated Timestep (Δt)</span>
                    <span className="font-mono">{(telemetry.timestep * 1000000).toFixed(2)} μs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Courant-Friedrichs-Lewy (CFL) limit</span>
                    <span className="font-mono">C = c·Δt/Δx ≤ 1.00</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Perfectly Matched Layer (PML) nodes</span>
                    <span className="font-mono">15 Nodes (Left & Right boundaries)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "theory" && (
          <SoundWavesTheory />
        )}

        {activeTab === "guide" && (
          <SoundWavesGuide />
        )}
      </div>
    </SimulationPageLayout>
  );
};

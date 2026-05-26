"use client";

import React, { useState, useRef, useCallback } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { GasLawsCanvas, GasLawsTelemetry } from "./GasLawsCanvas";
import { GasLawsConfig } from "./GasLawsConfig";
import { GasLawsTheory } from "./GasLawsTheory";
import { GasLawsGuide } from "./GasLawsGuide";
import { GasLawsAnalytics } from "./GasLawsAnalytics";
import { GasLawsSaved } from "./GasLawsSaved";
import {
  Play, Pause, RotateCcw, Activity, Thermometer, Settings2,
  Sparkles, Sliders, Layers, Volume2, Compass, BarChart2, Bookmark,
  Lock, Unlock, Grid, Workflow, Target, ShieldAlert
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
  disabled?: boolean;
}

const ClickableValue = ({
  value, label, unit, min, max, step, onChange,
  colorClass = "text-white", format, disabled = false
}: ClickableValueProps) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div className={cn("flex flex-col gap-2 transition-opacity", disabled && "opacity-40 pointer-events-none")}>
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>
            {format ? format(value) : value.toFixed(1)}
          </span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div
        className="relative h-6 flex items-center group cursor-pointer"
        onMouseDown={(e) => {
          if (disabled) return;
          setIsDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onChange(Math.round((min + pct * (max - min)) / step) * step);
        }}
        onMouseMove={(e) => {
          if (disabled || !isDragging) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onChange(Math.min(max, Math.max(min, Math.round((min + pct * (max - min)) / step) * step)));
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full opacity-60 group-hover:opacity-100 transition-opacity rounded-full"
            style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: "currentColor" }}
          />
        </div>
        <div
          className={cn("absolute w-3 h-3 rounded-full bg-white shadow-lg transition-transform",
            isDragging ? "scale-150" : "group-hover:scale-125")}
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const ControlCard = ({
  title, icon: Icon, children, color
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  color?: string;
}) => (
  <div className="bg-[#18181b] rounded-[22px] p-4.5 border border-white/5 space-y-4 shadow-xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
      <Icon className="w-16 h-16" style={{ color }} />
    </div>
    <div className="flex items-center gap-2.5 relative z-10">
      <div className="p-1.5 rounded-lg bg-white/5" style={{ color }}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/80">{title}</h3>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <div className={cn("flex items-center justify-between", disabled && "opacity-40 pointer-events-none")}>
    <span className="text-[10px] font-bold text-white/55 uppercase tracking-wider">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative w-8 h-4 rounded-full transition-colors",
        checked ? "bg-emerald-500" : "bg-white/10"
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all",
        checked ? "left-4.5" : "left-0.5"
      )} />
    </button>
  </div>
);

interface SavedRun {
  id: string;
  name: string;
  timestamp: string;
  temperature: number;
  volume: number;
  particleCount: number;
  regime: string;
  gasPreset: string;
  enableCollisions: boolean;
  attractiveForce: number;
  gravity: number;
  friction: number;
  elasticity: number;
  particleMode: string;
  showTrails: boolean;
  showHeatMap: boolean;
  enableSound: boolean;
  showCollisionRings: boolean;
}

export const GasLawsSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePreset, setActivePreset] = useState("Ideal Gas");
  const [expertiseLevel, setExpertiseLevel] = useState<"beginner" | "intermediate" | "expert">("intermediate");

  // Physical parameters
  const [temperature, setTemperature] = useState(300); // Kelvin
  const [volume, setVolume] = useState(0.5);            // Piston width fraction (0.3 to 1.0)
  const [particleCount, setParticleCount] = useState(100);
  const [regime, setRegime] = useState<"free" | "boyle" | "charles" | "gay-lussac" | "avogadro">("free");
  const [gasPreset, setGasPreset] = useState<"ideal" | "helium" | "xenon" | "real">("ideal");

  // New calibrations state
  const [gravity, setGravity] = useState(0);
  const [friction, setFriction] = useState(0);
  const [elasticity, setElasticity] = useState(1.0);

  // New particle modes
  const [particleMode, setParticleMode] = useState<"normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy">("normal");
  const [showTrails, setShowTrails] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [enableSound, setEnableSound] = useState(false);
  const [showCollisionRings, setShowCollisionRings] = useState(true);
  
  // Custom mode parameters
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [entropyConstraint, setEntropyConstraint] = useState(false);

  const [resetTrigger, setResetTrigger] = useState(0);

  // Live telemetry state from Canvas
  const [telemetry, setTelemetry] = useState<GasLawsTelemetry>({
    measuredPressure: 0.005,
    idealPressure: 0.005,
    measuredTemp: 300,
    measuredVolume: 50000,
    particlesEscaped: 0,
    meanSpeed: 45,
    vanDerWaalsPressure: 0.005,
    speedHistogram: new Array(15).fill(0),
    temperatureTarget: 300,
    entropy: 0,
    entropyMax: 3.58,
    diffusionMixing: 0,
    meanFreePath: 0,
    collisionCount: 0
  });

  // Data history state for charting
  const [history, setHistory] = useState<{
    pv: { p: number; v: number }[];
    pt: { p: number; t: number }[];
    vt: { v: number; t: number }[];
    entropy: number[];
    collisions: number[];
    times: number[];
  }>({ pv: [], pt: [], vt: [], entropy: [], collisions: [], times: [] });

  const lastHistoryUpdateTimeRef = useRef<number>(0);

  const handleReset = () => {
    setIsPlaying(true);
    setTemperature(300);
    setVolume(0.5);
    setParticleCount(100);
    setRegime("free");
    setGasPreset("ideal");
    setGravity(0);
    setFriction(0);
    setElasticity(1.0);
    setParticleMode("normal");
    setShowTrails(false);
    setShowHeatMap(false);
    setEnableSound(false);
    setShowCollisionRings(true);
    setBarrierOpen(false);
    setEntropyConstraint(false);
    setHistory({ pv: [], pt: [], vt: [], entropy: [], collisions: [], times: [] });
    setResetTrigger(prev => prev + 1);
    setActivePreset("Ideal Gas");
  };

  const handlePresetSelect = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === "Ideal Gas") {
      setGasPreset("ideal");
      setAttractiveForce(0);
    } else if (presetName === "Helium Gas") {
      setGasPreset("helium");
      setAttractiveForce(0);
    } else if (presetName === "Xenon Gas") {
      setGasPreset("xenon");
      setAttractiveForce(0);
    } else if (presetName === "Real Gas (vdw)") {
      setGasPreset("real");
      setAttractiveForce(4.0);
    }
  };

  const [attractiveForce, setAttractiveForce] = useState(0.0);
  const [slowMotion, setSlowMotion] = useState(0.5);

  const isTempLocked = regime === "boyle" || regime === "avogadro";
  const isVolumeLocked = regime === "charles" || regime === "gay-lussac" || regime === "avogadro";

  const handleVolumeChangeFromCanvas = useCallback((newVol: number) => {
    setVolume(newVol);
  }, []);

  const addHeatDirectly = useCallback((amount: number) => {
    if (!isTempLocked) {
      setTemperature(prev => Math.max(100, Math.min(800, prev + amount)));
    }
  }, [isTempLocked]);

  // State callback listener from canvas simulation loop
  const handleStateUpdate = useCallback((tele: GasLawsTelemetry) => {
    setTelemetry(tele);

    // Throttle history accumulation to every 300ms
    const now = Date.now();
    if (now - lastHistoryUpdateTimeRef.current > 300) {
      setHistory((prev) => {
        const nextPv = [...prev.pv, { p: tele.measuredPressure, v: tele.measuredVolume }].slice(-100);
        const nextPt = [...prev.pt, { p: tele.measuredPressure, t: tele.measuredTemp }].slice(-100);
        const nextVt = [...prev.vt, { v: tele.measuredVolume, t: tele.measuredTemp }].slice(-100);
        const nextEntropy = [...prev.entropy, tele.entropy].slice(-100);
        const nextCollisions = [...prev.collisions, tele.collisionCount].slice(-100);
        const nextTimes = [...prev.times, now].slice(-100);

        return {
          pv: nextPv,
          pt: nextPt,
          vt: nextVt,
          entropy: nextEntropy,
          collisions: nextCollisions,
          times: nextTimes
        };
      });
      lastHistoryUpdateTimeRef.current = now;
    }
  }, []);

  // Load configuration run from archive saved runs
  const handleLoadSavedRun = (run: SavedRun) => {
    setTemperature(run.temperature);
    setVolume(run.volume);
    setParticleCount(run.particleCount);
    setRegime(run.regime as any);
    setGasPreset(run.gasPreset as any);
    setGravity(run.gravity);
    setFriction(run.friction);
    setElasticity(run.elasticity);
    setParticleMode(run.particleMode as any);
    setShowTrails(run.showTrails);
    setShowHeatMap(run.showHeatMap);
    setEnableSound(run.enableSound);
    setShowCollisionRings(run.showCollisionRings);
    
    // Set appropriate presets list selected
    if (run.gasPreset === "ideal") setActivePreset("Ideal Gas");
    else if (run.gasPreset === "helium") setActivePreset("Helium Gas");
    else if (run.gasPreset === "xenon") setActivePreset("Xenon Gas");
    else if (run.gasPreset === "real") setActivePreset("Real Gas (vdw)");

    setResetTrigger(prev => prev + 1);
    setActiveTab("canvas"); // jump to canvas to watch
  };

  const handleActivateExperimentMode = (mode: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy") => {
    setParticleMode(mode);
    if (mode === "diffusion") {
      setGasPreset("ideal");
      setActivePreset("Ideal Gas");
      setBarrierOpen(false);
      setGravity(0);
      setFriction(0);
    } else if (mode === "brownian") {
      setGasPreset("ideal");
      setActivePreset("Ideal Gas");
      setParticleCount(120);
      setGravity(0);
      setFriction(0);
    } else if (mode === "mean-free-path") {
      setParticleCount(100);
      setGravity(0);
      setFriction(0);
    } else if (mode === "entropy") {
      setParticleCount(120);
      setEntropyConstraint(true);
      setGravity(0);
      setFriction(0);
    } else {
      setEntropyConstraint(false);
    }
    setResetTrigger(prev => prev + 1);
    setActiveTab("canvas");
  };

  const PRESETS = ["Ideal Gas", "Helium Gas", "Xenon Gas", "Real Gas (vdw)"];

  return (
    <SimulationPageLayout
      title="Gas Laws & Statistical Mechanics Lab"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showValidationTab={false}
      showModesTab={true}
      showAnalyticsTab={true}
      showSavedTab={true}
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "canvas" && (
          <div className="h-full flex flex-col xl:flex-row">

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col md:flex-row min-h-[450px] xl:h-full bg-black relative overflow-hidden">
              <div className="flex-1 relative flex flex-col justify-center">
                
                <GasLawsCanvas
                  temperature={temperature}
                  volume={volume}
                  particleCount={particleCount}
                  regime={regime}
                  gasPreset={gasPreset}
                  enableCollisions={gasPreset !== "ideal"}
                  attractiveForce={attractiveForce}
                  isPlaying={isPlaying}
                  slowMotion={slowMotion}
                  onVolumeChange={handleVolumeChangeFromCanvas}
                  onStateUpdate={handleStateUpdate}
                  resetTrigger={resetTrigger}
                  addHeatTrigger={addHeatDirectly}
                  
                  // calibrations
                  gravity={gravity}
                  friction={friction}
                  elasticity={elasticity}
                  
                  // modes
                  particleMode={particleMode}
                  showTrails={showTrails}
                  showHeatMap={showHeatMap}
                  enableSound={enableSound}
                  showCollisionRings={showCollisionRings}
                  barrierOpen={barrierOpen}
                  entropyConstraint={entropyConstraint}
                />

                {/* Solver HUD */}
                <div className="absolute top-5 left-5 p-3.5 bg-black/85 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none z-10 max-w-[280px]">
                  <div className="text-[8.5px] text-white/30 uppercase tracking-[0.2em] font-bold">Active Engine</div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    {particleMode === "normal" && "Maxwell-Boltzmann Kinetic Particle Engine"}
                    {particleMode === "diffusion" && "Fickian Particle Mixing Engine"}
                    {particleMode === "brownian" && "Einsteinian Langevin Random-Walk Solver"}
                    {particleMode === "mean-free-path" && "Kinetic Collision Cross-Section Tracer"}
                    {particleMode === "entropy" && "Gibbs-Shannon Information Entropy Matrix"}
                  </div>
                  <div className="text-[8px] text-white/40 font-mono mt-0.5 leading-relaxed">
                    N = {particleCount} atoms
                    {" | "}Reg = {regime.toUpperCase()}
                    <br />
                    Z = {((telemetry.measuredPressure * telemetry.measuredVolume) / (particleCount * 1.5 * (telemetry.measuredTemp || 1))).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Control Panel */}
            <aside className="w-full xl:w-[355px] border-t xl:border-t-0 xl:border-l border-border bg-[#18181b] flex flex-col h-1/2 xl:h-full overflow-y-auto shrink-0 select-none">
              
              {/* Level Selector */}
              <div className="p-4 border-b border-white/5 bg-black/40 flex flex-col gap-2">
                <div className="flex bg-black/40 border border-white/5 rounded-xl p-1">
                  {(["beginner", "intermediate", "expert"] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setExpertiseLevel(lvl)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                        expertiseLevel === lvl ? "bg-primary text-white shadow-md" : "text-white/40 hover:text-white"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback + Presets */}
              <div className="p-5 border-b border-border flex flex-col gap-4 bg-black/20">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95",
                      isPlaying
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "PAUSE" : "RUN"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-90"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white/35 uppercase tracking-widest block">
                    Gas Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {PRESETS.map((pName) => (
                      <button
                        key={pName}
                        onClick={() => handlePresetSelect(pName)}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-[8.5px] font-bold uppercase tracking-wider transition-all text-center",
                          activePreset === pName
                            ? "bg-primary/90 text-white shadow-md"
                            : "text-white/35 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {pName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="p-5 space-y-5">

                {/* Mode Interactive Option Card */}
                {particleMode === "diffusion" && (
                  <ControlCard title="Diffusion Controller" icon={Workflow} color="#10b981">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/70 uppercase">Mixing Ratio:</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{telemetry.diffusionMixing.toFixed(1)} %</span>
                      </div>
                      <button
                        onClick={() => setBarrierOpen(!barrierOpen)}
                        className={cn(
                          "w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                          barrierOpen
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-white/5 text-white/80 border-white/10"
                        )}
                      >
                        {barrierOpen ? "Close Barrier Partition" : "Open Barrier Partition"}
                      </button>
                    </div>
                  </ControlCard>
                )}

                {particleMode === "entropy" && (
                  <ControlCard title="Entropy Constraints" icon={Grid} color="#8b5cf6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/70 uppercase">Entropy S:</span>
                        <span className="text-xs font-mono font-bold text-purple-400">{telemetry.entropy.toFixed(3)}</span>
                      </div>
                      <Toggle
                        label="Confine to Left Side"
                        checked={entropyConstraint}
                        onChange={setEntropyConstraint}
                      />
                    </div>
                  </ControlCard>
                )}

                {particleMode === "mean-free-path" && (
                  <ControlCard title="Mean Free Path Diagnostics" icon={Target} color="#ec4899">
                    <div className="space-y-1.5 text-[10px] font-mono text-white/60">
                      <div className="flex justify-between">
                        <span>Measured Path λ:</span>
                        <span className="text-pink-400 font-bold">{telemetry.meanFreePath.toFixed(1)} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Theoretical λ (2D):</span>
                        <span className="text-white/40">1 / (2r · (N/V))</span>
                      </div>
                    </div>
                  </ControlCard>
                )}

                {/* 1. Gas Law Regime */}
                <ControlCard title="Thermodynamic Regime" icon={Sliders} color="#3b82f6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Gas Regime (Lock Variable)</label>
                      <select
                        value={regime}
                        onChange={(e) => {
                          const newRegime = e.target.value as any;
                          setRegime(newRegime);
                          if (newRegime === "boyle") {
                            setTemperature(300); 
                          }
                        }}
                        className="w-full bg-black/40 border border-white/8 rounded-xl p-2.5 text-[11px] text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="free">Free Ideal Gas (Lock None)</option>
                        <option value="boyle">Boyle&apos;s Law (Lock Temp T)</option>
                        <option value="charles">Charles&apos;s Law (Lock Pressure P)</option>
                        <option value="gay-lussac">Gay-Lussac&apos;s Law (Lock Volume V)</option>
                        <option value="avogadro">Avogadro&apos;s Law (Lock P & T)</option>
                      </select>
                    </div>
                  </div>
                </ControlCard>

                {/* 2. Thermodynamic State Variables */}
                <ControlCard title="Thermodynamic Variables" icon={Thermometer} color="#ec4899">
                  <div className="space-y-4">
                    <ClickableValue
                      label="Target Temperature (T)"
                      value={temperature} unit="K"
                      min={100} max={800} step={20}
                      onChange={setTemperature}
                      colorClass="text-pink-400"
                      format={(v) => `${Math.round(v)} K`}
                      disabled={isTempLocked}
                    />
                    
                    <ClickableValue
                      label="Target Volume Scale (V)"
                      value={volume} unit=""
                      min={0.3} max={1.0} step={0.05}
                      onChange={setVolume}
                      colorClass="text-cyan-400"
                      format={(v) => v.toFixed(2)}
                      disabled={isVolumeLocked}
                    />

                    <ClickableValue
                      label="Particle Count (N)"
                      value={particleCount} unit="atoms"
                      min={20} max={250} step={10}
                      onChange={setParticleCount}
                      colorClass="text-emerald-400"
                      format={(v) => Math.round(v).toString()}
                    />
                  </div>
                </ControlCard>

                {/* 3. Real Gas Corrections */}
                {expertiseLevel !== "beginner" && (
                  <ControlCard title="Real Gas Corrections" icon={Layers} color="#f59e0b">
                    <div className="space-y-4">
                      <Toggle 
                        label="Hard Sphere Collisions (b)" 
                        checked={gasPreset !== "ideal"} 
                        onChange={() => {}}
                        disabled={true} // bound directly to presets
                      />
                      
                      <ClickableValue
                        label="Intermolecular Attraction (a)"
                        value={attractiveForce} unit=""
                        min={0} max={10} step={0.5}
                        onChange={setAttractiveForce}
                        colorClass="text-amber-400"
                        format={(v) => v.toFixed(1)}
                        disabled={gasPreset !== "real"}
                      />
                    </div>
                  </ControlCard>
                )}

                {/* 4. Visual Overlays */}
                {expertiseLevel !== "beginner" && (
                  <ControlCard title="Visual Overlays & Audio" icon={Sparkles} color="#10b981">
                    <div className="space-y-3">
                      <Toggle
                        label="Particle Trails"
                        checked={showTrails}
                        onChange={setShowTrails}
                      />
                      <Toggle
                        label="Density Heat-Map"
                        checked={showHeatMap}
                        onChange={setShowHeatMap}
                      />
                      <Toggle
                        label="Collision Wavelets"
                        checked={showCollisionRings}
                        onChange={setShowCollisionRings}
                      />
                      <Toggle
                        label="Sonar Click Audio"
                        checked={enableSound}
                        onChange={setEnableSound}
                      />
                    </div>
                  </ControlCard>
                )}

                {/* 5. Live State Telemetry */}
                <ControlCard title="State Telemetry" icon={Activity} color="#10b981">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                      <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">Measured Pressure P</div>
                      <div className="text-[12px] font-mono font-bold mt-1 text-rose-400">{(telemetry.measuredPressure * 100).toFixed(2)} kPa</div>
                    </div>
                    
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                      <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">Ideal Pressure (NkbT/V)</div>
                      <div className="text-[12px] font-mono font-bold mt-1 text-cyan-400">{(telemetry.idealPressure * 100).toFixed(2)} kPa</div>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">Live Temp</div>
                      <div className="text-[11px] font-mono font-bold mt-1 text-amber-400">{Math.round(telemetry.measuredTemp)} K</div>
                    </div>

                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">Mean Speed</div>
                      <div className="text-[11px] font-mono font-bold mt-1 text-indigo-400">{telemetry.meanSpeed.toFixed(1)} m/s</div>
                    </div>

                    {expertiseLevel === "expert" && (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                        <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">Van der Waals Theoretical P</div>
                        <div className="text-[11px] font-mono font-bold mt-1 text-pink-400">{(telemetry.vanDerWaalsPressure * 100).toFixed(2)} kPa</div>
                      </div>
                    )}
                  </div>
                </ControlCard>

              </div>
            </aside>
          </div>
        )}

        {activeTab === "config" && (
          <GasLawsConfig
            temperature={temperature}
            volume={volume}
            particleCount={particleCount}
            regime={regime}
            gasPreset={gasPreset}
            enableCollisions={gasPreset !== "ideal"}
            attractiveForce={attractiveForce}
            telemetry={telemetry}
            expertiseLevel={expertiseLevel}
            
            // calibrations callbacks
            gravity={gravity}
            setGravity={setGravity}
            friction={friction}
            setFriction={setFriction}
            elasticity={elasticity}
            setElasticity={setElasticity}
            
            // visual overlays
            showTrails={showTrails}
            setShowTrails={setShowTrails}
            showHeatMap={showHeatMap}
            setShowHeatMap={setShowHeatMap}
            enableSound={enableSound}
            setEnableSound={setEnableSound}
            showCollisionRings={showCollisionRings}
            setShowCollisionRings={setShowCollisionRings}
          />
        )}
        
        {activeTab === "theory" && <GasLawsTheory expertiseLevel={expertiseLevel} />}
        
        {activeTab === "guide" && <GasLawsGuide />}

        {/* Experiment Modes Tab */}
        {activeTab === "modes" && (
          <div className="flex-1 bg-[#111113] overflow-y-auto">
            <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8 space-y-8 pb-20">
              <div className="border-b border-white/[0.06] pb-6">
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.25em] mb-1">Laboratory Syllabus</div>
                <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-widest text-white">
                  Experiment Modes & Regimes
                </h2>
                <p className="text-[11px] text-white/40 mt-1.5 max-w-xl">
                  Select a specific thermodynamic experiment mode to launch dedicated physics coordinates, microstate constraints, and statistics trackers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Normal Gas Law */}
                <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/20 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/10">
                        <Sliders className="w-4 h-4" />
                      </div>
                      {particleMode === "normal" && (
                        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Active</span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Ideal & Real Gas Macrostate</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Evaluate standard thermodynamic states. Modify volume by dragging the piston and regulate temperature to verify Charles's, Boyle's, and Gay-Lussac's formulations.
                    </p>
                  </div>
                  <button
                    onClick={() => handleActivateExperimentMode("normal")}
                    className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Activate Session
                  </button>
                </div>

                {/* Diffusion Mode */}
                <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/10">
                        <Workflow className="w-4 h-4" />
                      </div>
                      {particleMode === "diffusion" && (
                        <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase">Active</span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Fickian Gas Diffusion</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Partition the chamber into Blue and Orange gas species. Slide open the partition gate slider on canvas to watch thermal random walk diffusion mix the species.
                    </p>
                  </div>
                  <button
                    onClick={() => handleActivateExperimentMode("diffusion")}
                    className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Activate Session
                  </button>
                </div>

                {/* Brownian Motion */}
                <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-yellow-500/20 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/10">
                        <Activity className="w-4 h-4" />
                      </div>
                      {particleMode === "brownian" && (
                        <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded uppercase">Active</span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Einstein's Brownian Motion</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Spawn 1 large yellow macro-molecule buffeted continuously by 120 rapid, light micro-particles. Traces its trajectory path to illustrate molecular random walks.
                    </p>
                  </div>
                  <button
                    onClick={() => handleActivateExperimentMode("brownian")}
                    className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Activate Session
                  </button>
                </div>

                {/* Mean Free Path */}
                <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-pink-500/20 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/10">
                        <Target className="w-4 h-4" />
                      </div>
                      {particleMode === "mean-free-path" && (
                        <span className="text-[8px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded uppercase">Active</span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Mean Free Path Tracer</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Highlight a test particle in pink and connect its consecutive collision nodes. Measures the average distance traveled between collision impacts live.
                    </p>
                  </div>
                  <button
                    onClick={() => handleActivateExperimentMode("mean-free-path")}
                    className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Activate Session
                  </button>
                </div>

                {/* Entropy & Second Law */}
                <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/20 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/10">
                        <Grid className="w-4 h-4" />
                      </div>
                      {particleMode === "entropy" && (
                        <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded uppercase">Active</span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Shannon Information Entropy</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Divides the chamber coordinates into 36 grid blocks to calculate the spatial Shannon entropy. Enable partition constraint to drop entropy, then release to watch it climb.
                    </p>
                  </div>
                  <button
                    onClick={() => handleActivateExperimentMode("entropy")}
                    className="w-full mt-6 py-2 bg-white/5 group-hover:bg-primary text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Activate Session
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <GasLawsAnalytics
            history={history}
            particleCount={particleCount}
            currentTemp={telemetry.measuredTemp}
            currentVolume={telemetry.measuredVolume}
            currentPressure={telemetry.measuredPressure}
          />
        )}

        {activeTab === "saved" && (
          <GasLawsSaved
            temperature={temperature}
            volume={volume}
            particleCount={particleCount}
            regime={regime}
            gasPreset={gasPreset}
            enableCollisions={gasPreset !== "ideal"}
            attractiveForce={attractiveForce}
            gravity={gravity}
            friction={friction}
            elasticity={elasticity}
            particleMode={particleMode}
            showTrails={showTrails}
            showHeatMap={showHeatMap}
            enableSound={enableSound}
            showCollisionRings={showCollisionRings}
            onLoadRun={handleLoadSavedRun}
          />
        )}
      </div>
    </SimulationPageLayout>
  );
};

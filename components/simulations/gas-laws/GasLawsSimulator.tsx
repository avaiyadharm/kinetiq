"use client";

import React, { useState } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { GasLawsCanvas, GasLawsTelemetry } from "./GasLawsCanvas";
import { GasLawsConfig } from "./GasLawsConfig";
import { GasLawsTheory } from "./GasLawsTheory";
import { GasLawsGuide } from "./GasLawsGuide";
import {
  Play, Pause, RotateCcw, Activity, Thermometer, Settings2,
  Sparkles, Sliders, Layers, Flame, Snowflake, Gauge, Wind
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
  <div className="bg-[#18181b] rounded-[28px] p-5 border border-white/5 space-y-5 shadow-xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-6 opacity-[0.035] group-hover:opacity-[0.07] transition-opacity">
      <Icon className="w-20 h-20" style={{ color }} />
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <div className="p-2 rounded-lg bg-white/5" style={{ color }}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-white/80">{title}</h3>
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

  const [enableCollisions, setEnableCollisions] = useState(true);
  const [attractiveForce, setAttractiveForce] = useState(3.0);
  const [slowMotion, setSlowMotion] = useState(0.5);
  
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
    temperatureTarget: 300
  });

  const handleReset = () => {
    setIsPlaying(true);
    setTemperature(300);
    setVolume(0.5);
    setParticleCount(100);
    setRegime("free");
    setGasPreset("ideal");
    setEnableCollisions(true);
    setAttractiveForce(3.0);
    setSlowMotion(0.5);
    setResetTrigger(prev => prev + 1);
    setActivePreset("Ideal Gas");
  };

  const handlePresetSelect = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === "Ideal Gas") {
      setGasPreset("ideal");
      setEnableCollisions(false);
      setAttractiveForce(0);
    } else if (presetName === "Helium Gas") {
      setGasPreset("helium");
      setEnableCollisions(true);
      setAttractiveForce(0);
    } else if (presetName === "Xenon Gas") {
      setGasPreset("xenon");
      setEnableCollisions(true);
      setAttractiveForce(0);
    } else if (presetName === "Real Gas (vdw)") {
      setGasPreset("real");
      setEnableCollisions(true);
      setAttractiveForce(4.0);
    }
  };

  // Determine locking states based on active regime
  // Boyle's (Isothermal): constant T -> lock T slider
  // Charles's (Isobaric): constant P, V is dependent -> lock V slider
  // Gay-Lussac's (Isochoric): constant V -> lock V slider
  // Avogadro's: constant P/T, V is dependent -> lock T and V slider
  const isTempLocked = regime === "boyle" || regime === "avogadro";
  const isVolumeLocked = regime === "charles" || regime === "gay-lussac" || regime === "avogadro";

  const handleVolumeChangeFromCanvas = (newVol: number) => {
    setVolume(newVol);
  };

  const addHeatDirectly = (amount: number) => {
    if (!isTempLocked) {
      setTemperature(prev => Math.max(100, Math.min(800, prev + amount)));
    }
  };

  const PRESETS = ["Ideal Gas", "Helium Gas", "Xenon Gas", "Real Gas (vdw)"];

  return (
    <SimulationPageLayout
      title="Gas Laws & Statistical Mechanics Lab"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showValidationTab={false}
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
                  enableCollisions={enableCollisions}
                  attractiveForce={attractiveForce}
                  isPlaying={isPlaying}
                  slowMotion={slowMotion}
                  onVolumeChange={handleVolumeChangeFromCanvas}
                  onStateUpdate={setTelemetry}
                  resetTrigger={resetTrigger}
                  addHeatTrigger={addHeatDirectly}
                />

                {/* Solver HUD */}
                <div className="absolute top-5 left-5 p-3.5 bg-black/85 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none z-10">
                  <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Active Engine</div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    Maxwell-Boltzmann Kinetic Particle Engine
                  </div>
                  <div className="text-[9px] text-white/40 font-mono">
                    N = {particleCount} particles
                    {" | "}Regime = {regime.toUpperCase()}
                    {" | "}Z = {((telemetry.measuredPressure * telemetry.measuredVolume) / (particleCount * 1.5 * (telemetry.measuredTemp || 1))).toFixed(3)}
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
                          // Adjust properties according to regime lock
                          if (newRegime === "boyle") {
                            setTemperature(300); // Lock temperature
                          } else if (newRegime === "charles") {
                            // isobaric Charles law - let V scale from T
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
                        checked={enableCollisions} 
                        onChange={setEnableCollisions}
                        disabled={gasPreset === "ideal"}
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

                {/* 4. Visualization speed & others */}
                {expertiseLevel !== "beginner" && (
                  <ControlCard title="Visualization" icon={Sparkles} color="#10b981">
                    <div className="space-y-4">
                      <ClickableValue
                        label="Visual Speed Factor"
                        value={slowMotion} unit="x"
                        min={0.1} max={1.0} step={0.05}
                        onChange={setSlowMotion}
                        colorClass="text-indigo-400"
                        format={(v) => `${v.toFixed(2)}x`}
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
            enableCollisions={enableCollisions}
            attractiveForce={attractiveForce}
            telemetry={telemetry}
            expertiseLevel={expertiseLevel}
          />
        )}
        
        {activeTab === "theory" && <GasLawsTheory expertiseLevel={expertiseLevel} />}
        
        {activeTab === "guide" && <GasLawsGuide />}
      </div>
    </SimulationPageLayout>
  );
};

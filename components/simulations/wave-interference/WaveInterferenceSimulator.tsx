"use client";

import React, { useState, useEffect, useRef } from "react";
import { WaveInterferenceCanvas } from "./WaveInterferenceCanvas";
import { WaveInterferenceTheory } from "./WaveInterferenceTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Waves, Settings, Maximize2, HelpCircle, Activity, Radiation, MousePointer2, Layers, BookOpen, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- ClickableValue: Premium Tactile Slider + Parameter Field ---
interface ClickableValueProps {
  value: number;
  label: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  colorClass?: string;
  formatter?: (val: number) => string;
}

const ClickableValue: React.FC<ClickableValueProps> = ({
  value, label, unit, min, max, step = 0.1, onChange, colorClass = "text-white", formatter
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value.toString());
  }

  const handleBlur = () => {
    setIsEditing(false);
    let val = parseFloat(inputValue);
    if (isNaN(val)) val = value;
    val = Math.max(min, Math.min(max, val));
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  const increment = () => {
    const next = Math.min(max, value + step);
    onChange(parseFloat(next.toFixed(2)));
  };

  const decrement = () => {
    const prev = Math.max(min, value - step);
    onChange(parseFloat(prev.toFixed(2)));
  };

  const display = formatter ? formatter(value) : value.toFixed(2);

  return (
    <div className="flex flex-col gap-2.5 w-full bg-[#18181b]/35 border border-white/[0.03] p-4 rounded-2xl">
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">{label}</label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={decrement}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors active:scale-90 font-mono text-sm"
        >
          -
        </button>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsEditing(true)}
          className={cn(
            "flex-1 group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer transition-all hover:bg-white/[0.06] hover:border-white/10",
            isEditing && "ring-1 ring-primary/50 bg-white/5 border-primary/45"
          )}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:ring-0 text-base font-mono font-black text-white p-0 text-center"
              autoFocus
            />
          ) : (
            <div className="flex items-baseline gap-1.5 mx-auto">
              <span className={cn("text-lg font-mono font-black tracking-tight transition-colors", colorClass)}>
                {display}
              </span>
              <span className="text-[9px] font-black text-white/35 uppercase">{unit}</span>
            </div>
          )}
        </motion.div>

        <button
          onClick={increment}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors active:scale-90 font-mono text-sm"
        >
          +
        </button>
      </div>

      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer mt-1",
          colorClass.includes("violet") ? "accent-violet-500" :
            colorClass.includes("emerald") ? "accent-emerald-500" :
              colorClass.includes("cyan") ? "accent-cyan-500" :
                colorClass.includes("orange") ? "accent-orange-500" :
                  colorClass.includes("rose") ? "accent-rose-500" : "accent-primary"
        )}
      />
    </div>
  );
};

interface ControlCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  color?: string;
}

const ControlCard = ({ title, icon: Icon, children, color }: ControlCardProps) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group shrink-0">
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

export default function WaveInterferenceSimulator() {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);

  // Advanced Physics params
  const [frequency, setFrequency] = useState(1.5);
  const [amplitude, setAmplitude] = useState(1.0);
  const [separation, setSeparation] = useState(3.0);
  const [numSources, setNumSources] = useState<1 | 2>(2);
  const [phaseDifference, setPhaseDifference] = useState(0);
  const [waveSpeed, setWaveSpeed] = useState(2.0);
  const [damping, setDamping] = useState(0.05);
  const [renderMode, setRenderMode] = useState(0);

  const lastTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    const update = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setTime((prevTime) => prevTime + dt);
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setTime(0);
    setFrequency(1.5);
    setAmplitude(1.0);
    setSeparation(3.0);
    setNumSources(2);
    setPhaseDifference(0);
    setWaveSpeed(2.0);
    setDamping(0.05);
    setRenderMode(0);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const renderModes = ["Displacement", "Intensity", "Phase", "Grayscale", "Neon", "Contour"];

  // Telemetry Derived Values
  const lambda = waveSpeed / frequency;
  const omega = 2 * Math.PI * frequency;
  const k = 2 * Math.PI / lambda;

  const ratio = separation / lambda;
  const antinodalLines = numSources === 2 ? 1 + 2 * Math.floor(ratio) : 0;
  const nodalLines = numSources === 2 ? 2 * Math.floor(ratio + 0.5) : 0;

  // Fringe Angle (First order maximum)
  const firstOrderAngle = numSources === 2 && ratio >= 1 ? (Math.asin(1 / ratio) * 180 / Math.PI).toFixed(1) + "°" : "N/A";

  return (
    <SimulationPageLayout
      title="Wave Interference"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      {activeTab === "canvas" && (
        <div className="flex-1 flex flex-col xl:flex-row p-6 gap-6 overflow-hidden">
          {/* Main Visualizer */}
          <div className="flex-1 relative flex flex-col bg-[#18181b] rounded-[32px] border border-border shadow-2xl overflow-hidden min-h-[500px]">
            <div className="absolute top-6 left-6 z-20 flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-all border border-white/10 shadow-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                {isPlaying ? "Pause" : "Run"}
              </button>
            </div>
            <div className="absolute top-6 right-6 z-20">
              <button className="bg-black/80 backdrop-blur-md p-2 rounded-xl text-white/50 hover:text-white transition-all border border-white/10 shadow-lg">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
              <WaveInterferenceCanvas
                frequency={frequency}
                separation={separation}
                numSources={numSources}
                waveSpeed={waveSpeed}
                amplitude={amplitude}
                phaseDifference={phaseDifference}
                damping={damping}
                renderMode={renderMode}
                time={time}
                isPlaying={isPlaying}
              />
            </div>
          </div>

          {/* Configuration Panel Sidebar */}
          <div className="w-full xl:w-[460px] flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">

            {/* Live Scientific Telemetry & Equations */}
            <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl shrink-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Activity className="w-32 h-32 text-cyan-500" />
              </div>

              <div className="relative z-10 flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  Scientific Telemetry
                </h3>

                {/* Live Equation Box */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Wave Equation</div>
                  <div className="font-mono text-xs md:text-sm text-cyan-400 font-bold tracking-tight overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
                    z = {amplitude.toFixed(1)} sin({k.toFixed(1)}r₁ - {omega.toFixed(1)}t)
                    {numSources === 2 && (
                      <span className="text-violet-400"> + {amplitude.toFixed(1)} sin({k.toFixed(1)}r₂ - {omega.toFixed(1)}t {(phaseDifference > 0) ? `+ ${(phaseDifference / Math.PI).toFixed(2)}π` : ""})</span>
                    )}
                  </div>
                </div>

                {/* Wave Dynamics Matrix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-cyan-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wavelength (λ)</span>
                    <span className="text-base font-mono font-black text-cyan-400">{lambda.toFixed(2)} <span className="text-xs text-cyan-500/50">m</span></span>
                    <span className="text-[8px] font-mono text-white/30 uppercase mt-1">v = fλ → {waveSpeed.toFixed(1)} = {frequency.toFixed(1)} × {lambda.toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wave Number (k)</span>
                    <span className="text-base font-mono font-black text-emerald-400">{k.toFixed(2)} <span className="text-xs text-emerald-500/50">rad/m</span></span>
                    <span className="text-[8px] font-mono text-white/30 uppercase mt-1">k = 2π/λ</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-rose-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Angular Freq (ω)</span>
                    <span className="text-base font-mono font-black text-rose-400">{omega.toFixed(2)} <span className="text-xs text-rose-500/50">rad/s</span></span>
                    <span className="text-[8px] font-mono text-white/30 uppercase mt-1">ω = 2πf</span>
                  </div>
                  {numSources === 2 ? (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-amber-500/30 transition-colors">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Interference Topology</span>
                      <div className="flex gap-2 items-baseline">
                        <span className="text-base font-mono font-black text-amber-400">{antinodalLines}</span>
                        <span className="text-[9px] text-amber-500/50 uppercase font-bold">Max</span>
                        <span className="text-base font-mono font-black text-white/40">/</span>
                        <span className="text-base font-mono font-black text-amber-400">{nodalLines}</span>
                        <span className="text-[9px] text-amber-500/50 uppercase font-bold">Min</span>
                      </div>
                      <span className="text-[8px] font-mono text-white/30 uppercase mt-1">θ₁ = {firstOrderAngle}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 opacity-50">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Interference Topology</span>
                      <span className="text-base font-mono font-black text-white/30">N/A</span>
                      <span className="text-[8px] font-mono text-white/30 uppercase mt-1">Requires dual sources</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ControlCard title="Source Dynamics" icon={Activity} color="#22d3ee">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] ml-1">Visualization Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {renderModes.map((mode, i) => (
                      <button
                        key={i}
                        onClick={() => setRenderMode(i)}
                        className={cn("py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all",
                          renderMode === i ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5 hover:text-white")}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <ClickableValue
                  label="Oscillator Frequency"
                  unit="Hz"
                  value={frequency}
                  min={0.5}
                  max={8.0}
                  step={0.1}
                  onChange={setFrequency}
                  colorClass="text-cyan-400"
                />

                <ClickableValue
                  label="Base Amplitude"
                  unit="A₀"
                  value={amplitude}
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  onChange={setAmplitude}
                  colorClass="text-emerald-400"
                />
              </div>
            </ControlCard>

            <ControlCard title="Interference Topology" icon={Radiation} color="#8b5cf6">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] ml-1">Active Emitters</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNumSources(1)}
                      className={cn("py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all",
                        numSources === 1 ? "bg-violet-500/20 border-violet-500 text-violet-400" : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5 hover:text-white")}
                    >
                      Single
                    </button>
                    <button
                      onClick={() => setNumSources(2)}
                      className={cn("py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all",
                        numSources === 2 ? "bg-violet-500/20 border-violet-500 text-violet-400" : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5 hover:text-white")}
                    >
                      Dual
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {numSources === 2 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <ClickableValue
                        label="Emitter Separation"
                        unit="m"
                        value={separation}
                        min={0.5}
                        max={8.0}
                        step={0.1}
                        onChange={setSeparation}
                        colorClass="text-violet-400"
                      />

                      <ClickableValue
                        label="Phase Difference (Δφ)"
                        unit="rad"
                        value={phaseDifference}
                        min={0}
                        max={2 * Math.PI}
                        step={Math.PI / 8}
                        formatter={(v) => (v / Math.PI).toFixed(2) + "π"}
                        onChange={setPhaseDifference}
                        colorClass="text-rose-400"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ControlCard>

          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="flex-1 p-12 overflow-y-auto bg-[#09090b]">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold font-display text-white">Environment Configuration</h2>
            <p className="text-white/60">Fine-tune the physical properties of the computational wave medium.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ControlCard title="Medium Properties" icon={Settings} color="#10b981">
                <div className="space-y-6">
                  <ClickableValue
                    label="Wave Propagation Speed (v)"
                    unit="m/s"
                    value={waveSpeed}
                    min={0.5}
                    max={8.0}
                    step={0.5}
                    onChange={setWaveSpeed}
                    colorClass="text-emerald-400"
                  />

                  <ClickableValue
                    label="Spatial Damping Factor"
                    unit="m⁻¹"
                    value={damping}
                    min={0.0}
                    max={0.5}
                    step={0.01}
                    onChange={setDamping}
                    colorClass="text-orange-400"
                  />
                </div>
              </ControlCard>
            </div>
          </div>
        </div>
      )}

      {activeTab === "theory" && (
        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <WaveInterferenceTheory />
        </div>
      )}

      {activeTab === "guide" && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar bg-black/50">
          <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">

            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-2">
                <HelpCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">System Operations Guide</h2>
              <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
                Comprehensive operational manual for the Wave Interference computational environment. Learn how to navigate the visualization modes, interpret scientific telemetry, and utilize interactive probing tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Telemetry Guide Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Scientific Telemetry</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  The sidebar dynamically computes real-time constants (k, ω, λ). Watch as the exact governing superposition wave equation updates automatically when you modify frequency, amplitude, or phase parameters.
                </p>
              </div>

              {/* Cursor Probing Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <MousePointer2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Interactive Probing</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Hover directly over the simulation canvas. The computational engine will lock onto your cursor to measure precise path differences (Δr), local intensity, and identify constructive vs. destructive interference nodes.
                </p>
              </div>

              {/* Visualization Modes Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-violet-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Layers className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Topology Rendering</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Toggle between 6 different WebGL visualization topologies. Use <strong className="text-white/80">Phase</strong> mode to observe wavefront rotation, <strong className="text-white/80">Intensity</strong> to view energy density, or <strong className="text-white/80">Contour</strong> to map precise spatial amplitudes.
                </p>
              </div>

              {/* Source Control Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-amber-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Settings2 className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Source Control</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Enable dual sources to form interference fringes. Tune the <strong className="text-white/80">Phase Difference</strong> to artificially shift the interference pattern, converting central maximums into minimums.
                </p>
              </div>

              {/* Damping Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-rose-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Waves className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Wave Damping</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Realistic waves lose energy over distance via inverse-square attenuation. Apply the <strong className="text-white/80">Damping</strong> parameter to simulate frictional loss and visualize how wave intensity drops exponentially.
                </p>
              </div>

              {/* Theory Connect Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-blue-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Theoretical Integration</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Switch to the <strong className="text-white/80">Theoretical Basis</strong> tab for mathematical derivations of superposition. Compare the formulas to the live readout of fringe angles and nodal counts on the sidebar.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </SimulationPageLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { StandingWavesCanvas, BoundaryType, RenderMode } from "./StandingWavesCanvas";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { Play, Pause, Waves, Settings, Activity, Maximize2, Layers, HelpCircle, MousePointer2, Settings2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { StandingWavesTheory } from "./StandingWavesTheory";
import StandingWavesEnvironment from "./StandingWavesEnvironment";

// --- ClickableValue: Premium Tactile Slider + Parameter Field ---
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

const ClickableValue = ({ value, label, unit, min, max, step, onChange, colorClass = "text-white", format }: ClickableValueProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>{format ? format(value) : value.toFixed(1)}</span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div className="relative h-6 flex items-center group cursor-pointer"
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
               // Snap to step
               const rawVal = min + percent * (max - min);
               const snapped = Math.round(rawVal / step) * step;
               onChange(snapped);
             }
           }}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={cn("h-full opacity-50 group-hover:opacity-100 transition-opacity")} style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: "currentColor" }} />
        </div>
        <div 
          className={cn("absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform", isDragging ? "scale-150" : "group-hover:scale-125")}
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
};

const ControlCard = ({ title, icon: Icon, children, color }: any) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl shrink-0 relative overflow-hidden group">
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

export const StandingWavesSimulator = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);

  // Physics parameters
  const [harmonic, setHarmonic] = useState(3);
  const [length, setLength] = useState(2.0); // m
  const [amplitude, setAmplitude] = useState(1.0);
  const [boundaryType, setBoundaryType] = useState<BoundaryType>("Fixed-Fixed");
  const [renderMode, setRenderMode] = useState<RenderMode>("Displacement");

  // Environment State
  const [tension, setTension] = useState(100); 
  const [density, setDensity] = useState(0.01);
  const [damping, setDamping] = useState(0);
  const [reflection, setReflection] = useState(1.0);
  const [preset, setPreset] = useState("Ideal String");

  // Derived Physics
  const waveSpeed = Math.sqrt(tension / density);
  
  // Handlers for physical consistency
  const handleBoundaryChange = (type: BoundaryType) => {
    setBoundaryType(type);
    if (type === "Fixed-Free" && harmonic % 2 === 0) {
      setHarmonic(Math.max(1, harmonic - 1));
    }
  };

  const handleHarmonicChange = (newVal: number) => {
    if (boundaryType === "Fixed-Free") {
      // For Fixed-Free boundaries, harmonic mode (n) must be an odd integer (1, 3, 5...)
      const val = Math.round(newVal);
      if (val % 2 === 0) {
        if (val > harmonic) {
          setHarmonic(val + 1);
        } else {
          setHarmonic(Math.max(1, val - 1));
        }
      } else {
        setHarmonic(Math.max(1, val));
      }
    } else {
      setHarmonic(Math.max(1, Math.round(newVal)));
    }
  };

  const handleWaveSpeedChange = (v: number) => {
    // Keep density fixed, change tension to achieve target wave speed: T = v^2 * rho
    setTension(v * v * density);
  };
  
  // Visualization parameters
  const [showComponents, setShowComponents] = useState(false);
  const [showNodes, setShowNodes] = useState(true);
  const [showAntinodes, setShowAntinodes] = useState(true);

  // Telemetry computation
  let lambda = 0;
  let k = 0;
  let baseFuncStr = "sin";
  
  const activeHarmonic = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;

  if (boundaryType === "Fixed-Fixed") {
    lambda = (2 * length) / activeHarmonic;
    k = (2 * Math.PI) / lambda;
    baseFuncStr = "sin";
  } else if (boundaryType === "Free-Free") {
    lambda = (2 * length) / activeHarmonic;
    k = (2 * Math.PI) / lambda;
    baseFuncStr = "cos";
  } else if (boundaryType === "Fixed-Free") {
    lambda = (4 * length) / activeHarmonic;
    k = (2 * Math.PI) / lambda;
    baseFuncStr = "sin";
  }
  const frequency = waveSpeed / lambda;
  const omega = 2 * Math.PI * frequency;

  // Render loop
  useEffect(() => {
    if (!isPlaying) return;
    let animationId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setTime((t) => t + dt);
      animationId = requestAnimationFrame(render);
    };
    
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const handleReset = () => {
    setTime(0);
    setHarmonic(3);
    setTension(100);
    setDensity(0.01);
    setDamping(0);
    setReflection(1.0);
    setLength(2.0);
    setBoundaryType("Fixed-Fixed");
    setRenderMode("Displacement");
  };

  return (
    <SimulationPageLayout 
      title="Standing Waves & Resonance" 
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
                <StandingWavesCanvas 
                  amplitude={amplitude}
                  harmonic={harmonic}
                  waveSpeed={waveSpeed}
                  boundaryType={boundaryType}
                  renderMode={renderMode}
                  showComponents={showComponents}
                  showNodes={showNodes}
                  showAntinodes={showAntinodes}
                  isPlaying={isPlaying}
                  time={time}
                  length={length}
                  tension={tension}
                  density={density}
                  damping={damping}
                  reflection={reflection}
                />
             </div>
          </div>

          {/* Configuration Panel Sidebar */}
          <div className="w-full xl:w-[460px] flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
            
            {/* Live Scientific Telemetry & Equations */}
            <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl shrink-0 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                 <Activity className="w-32 h-32 text-emerald-500" />
               </div>
               
               <div className="relative z-10 flex flex-col gap-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   Resonance Telemetry
                 </h3>
                 
                 {/* Live Equation Box */}
                 <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                   <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Standing Wave Equation</div>
                   <div className="font-mono text-xs md:text-sm text-emerald-400 font-bold tracking-tight overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
                     y(x,t) = { (amplitude * 2).toFixed(1) } {baseFuncStr}({k.toFixed(2)}x) cos({omega.toFixed(1)}t)
                   </div>
                   {showComponents && (
                     <div className="font-mono text-[10px] text-white/50 tracking-tight mt-1 flex flex-col gap-1">
                       <span className="text-cyan-400">y₁(x,t) = {amplitude.toFixed(1)} {baseFuncStr}({k.toFixed(2)}x - {omega.toFixed(1)}t)</span>
                       <span className="text-rose-400">y₂(x,t) = {amplitude.toFixed(1)} {baseFuncStr}({k.toFixed(2)}x + {omega.toFixed(1)}t)</span>
                     </div>
                   )}
                 </div>

                 {/* Wave Dynamics Matrix */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Resonant Frequency (f)</span>
                     <span className="text-base font-mono font-black text-emerald-400">{frequency.toFixed(1)} <span className="text-xs text-emerald-500/50">Hz</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">f = v / λ</span>
                   </div>
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-cyan-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wavelength (λ)</span>
                     <span className="text-base font-mono font-black text-cyan-400">{lambda.toFixed(2)} <span className="text-xs text-cyan-500/50">m</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">λ = {waveSpeed.toFixed(0)} / {frequency.toFixed(1)}</span>
                   </div>
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-violet-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wave Number (k)</span>
                     <span className="text-base font-mono font-black text-violet-400">{k.toFixed(2)} <span className="text-xs text-violet-500/50">rad/m</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">k = 2π/λ</span>
                   </div>
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-amber-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Angular Freq (ω)</span>
                     <span className="text-base font-mono font-black text-amber-400">{omega.toFixed(1)} <span className="text-xs text-amber-500/50">rad/s</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">ω = 2πf</span>
                   </div>
                   {/* Resonance Condition Geometry */}
                  <div className="col-span-2 bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Resonance Geometry</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" 
                        ? `L = ${activeHarmonic}λ/2` 
                        : `L = ${activeHarmonic}λ/4 (n odd)`}
                    </span>
                  </div>
                 </div>
               </div>
            </div>

            <ControlCard title="Boundary & Topology" icon={Settings} color="#10b981">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Boundary Conditions</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Fixed-Fixed", "Free-Free", "Fixed-Free"].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => handleBoundaryChange(mode as any)}
                        className={cn(
                          "px-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          boundaryType === mode 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" 
                            : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                        )}
                      >
                        {mode.replace("-", "\n")}
                      </button>
                    ))}
                  </div>
                </div>

                <ClickableValue 
                  label="Harmonic Mode (n)"
                  value={harmonic}
                  unit=""
                  min={1}
                  max={8}
                  step={1}
                  onChange={handleHarmonicChange}
                  colorClass="text-emerald-400"
                  format={(v) => `n = ${v}`}
                />

                <ClickableValue 
                  label="String Length (L)"
                  value={length}
                  unit="m"
                  min={1.0}
                  max={5.0}
                  step={0.1}
                  onChange={setLength}
                  colorClass="text-emerald-400"
                />
              </div>
            </ControlCard>

            <ControlCard title="Medium Dynamics" icon={Waves} color="#3b82f6">
              <div className="space-y-6">
                <ClickableValue 
                  label="Wave Speed (v)"
                  value={waveSpeed}
                  unit="m/s"
                  min={50}
                  max={500}
                  step={10}
                  onChange={handleWaveSpeedChange}
                  colorClass="text-blue-400"
                />
                <ClickableValue 
                  label="Base Amplitude (A)"
                  value={amplitude}
                  unit="m"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  onChange={setAmplitude}
                  colorClass="text-blue-400"
                />
              </div>
            </ControlCard>

            <ControlCard title="Visualization Engine" icon={Layers} color="#8b5cf6">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Rendering Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Displacement", "Energy", "Phase", "Scientific"].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setRenderMode(mode as any)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border",
                          renderMode === mode 
                            ? "bg-violet-500/20 text-violet-400 border-violet-500/50" 
                            : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Component Traveling Waves</span>
                    <button 
                      onClick={() => setShowComponents(!showComponents)}
                      className={cn("w-10 h-5 rounded-full relative transition-colors", showComponents ? "bg-violet-500" : "bg-white/10")}
                    >
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showComponents ? "left-6" : "left-1")} />
                    </button>
                  </label>
                  
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Show Nodes</span>
                    <button 
                      onClick={() => setShowNodes(!showNodes)}
                      className={cn("w-10 h-5 rounded-full relative transition-colors", showNodes ? "bg-rose-500" : "bg-white/10")}
                    >
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showNodes ? "left-6" : "left-1")} />
                    </button>
                  </label>

                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Show Antinodes</span>
                    <button 
                      onClick={() => setShowAntinodes(!showAntinodes)}
                      className={cn("w-10 h-5 rounded-full relative transition-colors", showAntinodes ? "bg-emerald-500" : "bg-white/10")}
                    >
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showAntinodes ? "left-6" : "left-1")} />
                    </button>
                  </label>
                </div>
              </div>
            </ControlCard>

          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <StandingWavesEnvironment
            tension={tension}
            setTension={setTension}
            density={density}
            setDensity={setDensity}
            damping={damping}
            setDamping={setDamping}
            reflection={reflection}
            setReflection={setReflection}
            preset={preset}
            setPreset={setPreset}
            length={length}
            boundaryType={boundaryType}
          />
        </div>
      )}

      {activeTab === "theory" && (
        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <StandingWavesTheory />
        </div>
      )}

      {activeTab === "guide" && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar bg-black/50">
          <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
            
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                <HelpCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">System Operations Guide</h2>
              <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
                Comprehensive operational manual for the Standing Wave & Resonance computational environment. Learn how to navigate the visualization modes, interpret scientific telemetry, and utilize interactive probing tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Telemetry Guide Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Resonance Telemetry</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  The sidebar dynamically computes real-time constants (k, ω, λ, f). Watch as the exact governing superposition wave equation updates automatically when you modify frequency, amplitude, or boundary parameters.
                </p>
              </div>

              {/* Cursor Probing Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <MousePointer2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Interactive Probing</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Hover directly over the simulation canvas. The computational engine will lock onto your cursor to measure precise local displacement and identify whether you are near a node or an antinode.
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
                  Toggle between 4 different WebGL visualization topologies. Use <strong className="text-white/80">Phase</strong> mode to observe temporal phase shifts, <strong className="text-white/80">Energy</strong> to view localized energy density, or <strong className="text-white/80">Displacement</strong> to observe raw string motion.
                </p>
              </div>

              {/* Boundary Control Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-amber-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Settings2 className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Boundary Conditions</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Switch between <strong className="text-white/80">Fixed-Fixed</strong> (like a guitar string), <strong className="text-white/80">Free-Free</strong>, and <strong className="text-white/80">Fixed-Free</strong> (like a closed pipe). Notice how the boundary conditions alter the fundamental wavelength formulas.
                </p>
              </div>

              {/* Wave Components Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-rose-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Waves className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Component Waves</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Enable <strong className="text-white/80">Component Traveling Waves</strong> to visualize the left-moving and right-moving waves that sum to create the standing wave. This is a direct visual proof of the superposition principle.
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
                  Switch to the <strong className="text-white/80">Theoretical Basis</strong> tab for mathematical derivations of superposition. Compare the formulas to the live readout of resonant frequencies on the sidebar.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </SimulationPageLayout>
  );
};

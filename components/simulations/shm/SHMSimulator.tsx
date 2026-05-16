"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SHMCanvas } from "./SHMCanvas";
import { SHMGraphs } from "./SHMGraphs";
import { SHMTheory } from "./SHMTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Info, BookOpen, Activity, Maximize2, Gauge, Target, Zap, RotateCcw, Play, Pause, Calculator, ArrowUpRight, Sliders, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Types ---
interface StateRef {
  time: number;
}

// --- Sub-components ---

interface ClickableValueProps {
  value: number;
  label: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  colorClass?: string;
}

const ClickableValue: React.FC<ClickableValueProps> = ({ 
  value, label, unit, min, max, step = 0.01, onChange, colorClass = "text-white"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

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

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</label>
      </div>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsEditing(true)}
        className={cn(
          "group relative flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20 shadow-lg",
          isEditing && "ring-2 ring-primary/50 bg-white/10 border-primary/50"
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
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-mono font-black text-white p-0"
            autoFocus
          />
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-mono font-black tracking-tight transition-colors", colorClass)}>
                {value.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-white/20">{unit}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 text-white/20 group-hover:text-primary transition-colors">
               <Calculator className="w-3.5 h-3.5" />
            </div>
          </>
        )}
      </motion.div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer",
          colorClass.includes("violet") ? "accent-violet-500" : 
          colorClass.includes("emerald") ? "accent-emerald-500" :
          colorClass.includes("cyan") ? "accent-cyan-500" :
          colorClass.includes("orange") ? "accent-orange-500" : "accent-primary"
        )}
      />
    </div>
  );
};

const RelationBox = ({ formula, calc, result }: { formula: string; calc: string; result: string }) => (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 group hover:border-primary/30 transition-all">
        <div className="flex justify-between items-baseline">
            <span className="text-xs font-mono font-bold text-primary">{formula}</span>
            <span className="text-sm font-mono font-black text-white">{result}</span>
        </div>
        <p className="text-[9px] font-mono text-white/20 group-hover:text-white/40 transition-colors">Substitution: {calc}</p>
    </div>
);

export default function SHMSimulator() {
  // --- Master State ---
  const [amplitude, setAmplitude] = useState(0.8);
  const [mass, setMass] = useState(1.5);
  const [kConstant, setKConstant] = useState(25.0);
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<"spring" | "pendulum">("spring");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [time, setTime] = useState(0);

  const [showVectors, setShowVectors] = useState({
    displacement: true,
    velocity: true,
    acceleration: true,
    force: false,
  });
  const [showTrail, setShowTrail] = useState(true);

  const [graphs, setGraphs] = useState({
    x: [] as any[],
    v: [] as any[],
    a: [] as any[],
    F: [] as any[],
    KE: [] as any[],
    PE: [] as any[],
  });

  const lastTimeRef = useRef<number | null>(null);
  const stateRef = useRef<StateRef>({ time: 0 });

  // --- Derived Physics Object (Reactive Engine) ---
  const g = 9.81;
  // ω = √(k/m) for spring, ω = √(g/L) for pendulum. 
  // Let's use kConstant to represent L for pendulum for simplicity or just add a separate slider
  const L = mode === "pendulum" ? (g / (kConstant / mass)) : 1.0; 
  const angularFreq = Math.sqrt(kConstant / mass);
  
  const currentX = amplitude * Math.cos(angularFreq * time + phase);
  const currentV = -amplitude * angularFreq * Math.sin(angularFreq * time + phase);
  const currentA = -amplitude * angularFreq * angularFreq * Math.cos(angularFreq * time + phase);
  const currentF = mass * currentA;
  const currentKE = 0.5 * mass * currentV * currentV;
  const currentPE = 0.5 * kConstant * currentX * currentX;

  // --- Physics Loop ---
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;
    const update = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        animationFrameId = requestAnimationFrame(update);
        return;
      }

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      stateRef.current.time += dt;
      setTime(stateRef.current.time);

      // Graphing
      const x = amplitude * Math.cos(angularFreq * stateRef.current.time + phase);
      const v = -amplitude * angularFreq * Math.sin(angularFreq * stateRef.current.time + phase);
      const a = -amplitude * angularFreq * angularFreq * Math.cos(angularFreq * stateRef.current.time + phase);
      const F = mass * a;
      const KE = 0.5 * mass * v * v;
      const PE = 0.5 * kConstant * x * x;

      setGraphs(prev => ({
        x: [...prev.x, { time: stateRef.current.time, value: x }].slice(-100),
        v: [...prev.v, { time: stateRef.current.time, value: v }].slice(-100),
        a: [...prev.a, { time: stateRef.current.time, value: a }].slice(-100),
        F: [...prev.F, { time: stateRef.current.time, value: F }].slice(-100),
        KE: [...prev.KE, { time: stateRef.current.time, value: KE }].slice(-100),
        PE: [...prev.PE, { time: stateRef.current.time, value: PE }].slice(-100),
      }));

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, amplitude, angularFreq, phase, mass, kConstant]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setTime(0);
    stateRef.current.time = 0;
    setGraphs({ x: [], v: [], a: [], F: [], KE: [], PE: [] });
  }, []);

  const renderCanvas = () => (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 via-transparent to-[#06b6d4]/5 pointer-events-none" />
      
      <div className="flex-1 p-6 relative flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="flex-1 z-10 flex flex-col gap-6">
             <div className="flex-1 relative min-h-0">
                <SHMCanvas 
                    amplitude={amplitude}
                    angularFreq={angularFreq}
                    phase={phase}
                    time={time}
                    isPlaying={isPlaying}
                    mode={mode}
                    mass={mass}
                    kConstant={kConstant}
                    showVectors={showVectors}
                    showTrail={showTrail}
                />
             </div>
          
          <div className="bg-[#18181b] border border-white/5 rounded-[24px] p-4 flex items-center justify-center gap-8 overflow-x-auto no-scrollbar shrink-0">
            {[
                { id: 'displacement', label: 'Displacement (x)', color: 'bg-violet-500' },
                { id: 'velocity', label: 'Velocity (v)', color: 'bg-cyan-500' },
                { id: 'acceleration', label: 'Acceleration (a)', color: 'bg-orange-500' },
                { id: 'force', label: 'Force (F)', color: 'bg-pink-500' },
            ].map(v => (
                <div key={v.id} className={cn("flex items-center gap-2 transition-opacity", showVectors[v.id as keyof typeof showVectors] ? "opacity-100" : "opacity-20")}>
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", v.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{v.label}</span>
                </div>
            ))}
          </div>

          <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-8 shadow-2xl shrink-0">
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                        "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-lg active:scale-95",
                        isPlaying ? "bg-red-500 shadow-red-500/20" : "bg-primary shadow-primary/20"
                    )}
                  >
                      {isPlaying ? <Pause className="w-6 h-6 text-white fill-current" /> : <Play className="w-6 h-6 text-white fill-current ml-1" />}
                  </button>
                  <button 
                    onClick={handleReset}
                    className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-[20px] transition-all border border-white/5 flex items-center justify-center active:scale-95"
                  >
                      <RotateCcw className="w-5 h-5 text-white/40" />
                  </button>
              </div>

              <div className="h-10 w-px bg-white/5 hidden md:block" />

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
                  <ClickableValue 
                    label="Amplitude (A)"
                    value={amplitude}
                    unit="m"
                    min={0.1}
                    max={1.5}
                    step={0.05}
                    onChange={setAmplitude}
                    colorClass="text-violet-400"
                  />
                  <ClickableValue 
                    label={mode === "spring" ? "Spring Constant (k)" : "Restoring Const (k)"}
                    value={kConstant}
                    unit="N/m"
                    min={5}
                    max={100}
                    step={1}
                    onChange={setKConstant}
                    colorClass="text-emerald-400"
                  />
                  <ClickableValue 
                    label="Mass (m)"
                    value={mass}
                    unit="kg"
                    min={0.1}
                    max={10}
                    step={0.1}
                    onChange={setMass}
                    colorClass="text-cyan-400"
                  />
              </div>
          </div>
        </div>

        <div className="w-full lg:w-[420px] flex flex-col gap-6 z-10 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
               <BookOpen className="w-24 h-24 text-primary" />
            </div>
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Info className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-bold uppercase tracking-tight">Phase Pulse</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed italic relative z-10">
              {mode === "spring" 
                ? "Spring-Mass: Restoration is provided by elastic potential energy. x and a are exactly 180° out of phase." 
                : "Pendulum: Restoration is provided by gravity. Valid for small angles where sin(θ) ≈ θ."
              }
            </p>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-black/40 border border-violet-500/10">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">Energy Total</span>
                    <p className="text-xl font-mono font-bold text-white">{(currentKE + currentPE).toFixed(1)} <span className="text-[10px] text-white/20">J</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/10">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Max Velocity</span>
                    <p className="text-xl font-mono font-bold text-white">{(amplitude * angularFreq).toFixed(1)} <span className="text-[10px] text-white/20">m/s</span></p>
                </div>
            </div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Telemetry Pipeline</span>
                  <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active 60Hz</span>
                  </div>
              </div>
              <SHMGraphs 
                xData={graphs.x}
                vData={graphs.v}
                aData={graphs.a}
                FData={graphs.F}
                KEData={graphs.KE}
                PEData={graphs.PE}
                amplitude={amplitude}
                angularFreq={angularFreq}
                mass={mass}
              />
          </div>
          
          <div className="mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                  <p className="text-xs font-bold text-white tracking-tight">Oscillator Lab</p>
                  <p className="text-[10px] text-white/40">Adjust parameters in Config</p>
              </div>
              <button 
                onClick={() => setActiveTab("config")}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
              >
                  <Maximize2 className="w-4 h-4 text-primary" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ControlCard = ({ title, icon: Icon, children, color }: any) => (
    <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
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

  const renderConfig = () => (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
      <div className="flex-1 space-y-8 max-w-5xl">
        <div className="space-y-2">
           <h2 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
              Environment <span className="text-primary">Config</span>
              <Badge variant="outline" className="text-[10px] tracking-widest border-primary/20 text-primary bg-primary/5 uppercase h-6">Experimental</Badge>
           </h2>
           <p className="text-white/40 text-sm font-medium">Fine-tune the physical constraints and system parameters for the harmonic oscillator.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ControlCard title="Physical Basis" icon={Target} color="#8b5cf6">
               <div className="space-y-6">
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setMode("spring")}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            mode === "spring" ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                          Spring-Mass
                      </button>
                      <button 
                        onClick={() => setMode("pendulum")}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            mode === "pendulum" ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                          Pendulum
                      </button>
                  </div>
                  <ClickableValue 
                    label="Amplitude (A)"
                    value={amplitude}
                    unit="m"
                    min={0.1}
                    max={1.5}
                    onChange={setAmplitude}
                    colorClass="text-violet-400"
                  />
               </div>
            </ControlCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ControlCard title="System Parameters" icon={Zap} color="#10b981">
               <div className="space-y-6">
                  <ClickableValue 
                    label={mode === "spring" ? "Spring Constant (k)" : "Restoring Const (k)"}
                    value={kConstant}
                    unit="N/m"
                    min={5}
                    max={100}
                    onChange={setKConstant}
                    colorClass="text-emerald-400"
                  />
                  <ClickableValue 
                    label="System Mass (m)"
                    value={mass}
                    unit="kg"
                    min={0.1}
                    max={10}
                    onChange={setMass}
                    colorClass="text-cyan-400"
                  />
               </div>
            </ControlCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ControlCard title="Initial Conditions" icon={RotateCcw} color="#06b6d4">
               <div className="space-y-6">
                  <ClickableValue 
                    label="Initial Phase (φ)"
                    value={phase}
                    unit="rad"
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.1}
                    onChange={setPhase}
                    colorClass="text-cyan-400"
                  />
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block">Derived Angular Frequency</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-mono font-black text-white">{angularFreq.toFixed(2)}</span>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">rad/s</span>
                      </div>
                  </div>
               </div>
            </ControlCard>
          </motion.div>

          <ControlCard title="Visual Layers" icon={Layers} color="#ec4899">
             <div className="grid grid-cols-2 gap-3 pt-2">
                {Object.keys(showVectors).map((key) => (
                    <button
                        key={key}
                        onClick={() => setShowVectors({...showVectors, [key]: !showVectors[key as keyof typeof showVectors]})}
                        className={cn(
                            "px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            showVectors[key as keyof typeof showVectors] 
                                ? "bg-white/10 text-white border-white/20" 
                                : "bg-transparent text-white/20 border-white/5 hover:border-white/10"
                        )}
                    >
                        {key}
                    </button>
                ))}
                <button
                    onClick={() => setShowTrail(!showTrail)}
                    className={cn(
                        "px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all col-span-2",
                        showTrail ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/20 border-white/5"
                    )}
                >
                    Motion Trail Path
                </button>
             </div>
          </ControlCard>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden h-full">
           <div className="space-y-1">
             <h3 className="text-lg font-black uppercase tracking-tight text-white">Dynamic Analysis</h3>
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">Harmonic Stability</p>
           </div>
           
           <div className="space-y-6">
               {[
                   { label: "Position", val: currentX.toFixed(3), unit: "m" },
                   { label: "Velocity", val: currentV.toFixed(3), unit: "m/s" },
                   { label: "Acceleration", val: currentA.toFixed(2), unit: "m/s²" },
                   { label: "Potential E", val: currentPE.toFixed(2), unit: "J" },
                   { label: "Kinetic E", val: currentKE.toFixed(2), unit: "J" },
               ].map(stat => (
                   <div key={stat.label} className="space-y-2 group">
                       <div className="flex justify-between items-end">
                           <div className="space-y-0.5">
                               <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
                           </div>
                           <span className="text-xs font-mono font-bold text-white">{stat.val} <span className="text-[10px] text-white/20">{stat.unit}</span></span>
                       </div>
                   </div>
               ))}
           </div>

           <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Oscillation Relations</h4>
                    <Calculator className="w-3 h-3 text-primary/40" />
                </div>
                <div className="space-y-3">
                    <RelationBox 
                        formula="ω = √(k/m)" 
                        calc={`√(${kConstant.toFixed(1)} / ${mass.toFixed(1)})`}
                        result={`${angularFreq.toFixed(2)} rad/s`} 
                    />
                    <RelationBox 
                        formula="f = ω / 2π" 
                        calc={`${angularFreq.toFixed(2)} / 6.28`}
                        result={`${(angularFreq / (2 * Math.PI)).toFixed(2)} Hz`} 
                    />
                    <RelationBox 
                        formula="E = ½kA²" 
                        calc={`0.5 × ${kConstant} × ${amplitude.toFixed(2)}²`}
                        result={`${(0.5 * kConstant * amplitude * amplitude).toFixed(2)} J`} 
                    />
                </div>
           </div>

           <div className="pt-6 border-t border-white/5">
                <button 
                    onClick={handleReset}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Oscillator
                </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <SimulationPageLayout 
      title="Simple Harmonic Motion"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeTab === "canvas" && renderCanvas()}
            {activeTab === "config" && renderConfig()}
            {activeTab === "theory" && (
                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#09090b]">
                   <div className="max-w-4xl mx-auto space-y-8">
                      <div className="space-y-2">
                         <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                            Theoretical <span className="text-primary">Basis</span>
                         </h2>
                         <p className="text-white/40 text-sm font-medium">Deep-dive into the calculus and energy manifolds governing oscillators.</p>
                      </div>
                      <SHMTheory />
                   </div>
                </div>
            )}
            {activeTab === "guide" && (
                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#09090b] flex items-center justify-center">
                   <div className="text-center space-y-6 max-w-lg">
                      <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto border border-primary/20">
                         <BookOpen className="w-10 h-10 text-primary" />
                      </div>
                      <div className="space-y-2">
                         <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Laboratory Guide</h2>
                         <p className="text-white/40 text-sm leading-relaxed">
                            Welcome to the Harmonic Oscillator Laboratory. Use the <strong>Simulation Canvas</strong> to observe phase shifts and energy transfer. Navigate to <strong>Environment Config</strong> to switch between Spring and Pendulum systems.
                         </p>
                      </div>
                      <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 text-left">
                         <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Quick Shortcuts</h4>
                         <ul className="space-y-3 text-xs text-white/60 font-medium">
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Start oscillation via HUD</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Change Amplitude to adjust max Energy</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Toggle KE/PE graphs to see conservation</li>
                         </ul>
                      </div>
                   </div>
                </div>
            )}
          </motion.div>
      </AnimatePresence>
    </SimulationPageLayout>
  );
}

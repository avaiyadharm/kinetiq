"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CircularMotionCanvas } from "./CircularMotionCanvas";
import { CircularMotionControls } from "./CircularMotionControls";
import { CircularMotionGraphs } from "./CircularMotionGraphs";
import { CircularMotionTheory } from "./CircularMotionTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Info, BookOpen, Activity, Maximize2, Gauge, Target, Zap, RotateCcw, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Types ---
interface StateRef {
  theta: number;
  omega: number;
  smoothOmega: number;
}

// --- Sub-components ---

interface ClickableValueProps {
  value: number;
  label: string;
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
              <span className="text-xs font-bold text-white/20 uppercase">{unit}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 text-white/20 group-hover:text-white/40 transition-colors">
               <Maximize2 className="w-3 h-3" />
            </div>
          </>
        )}
      </motion.div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer",
          colorClass.includes("indigo") ? "accent-indigo-500" : 
          colorClass.includes("emerald") ? "accent-emerald-500" :
          colorClass.includes("cyan") ? "accent-cyan-500" :
          colorClass.includes("orange") ? "accent-orange-500" : "accent-primary"
        )}
      />
    </div>
  );
};

export default function CircularMotionSimulator() {
  // Physics State
  const [radius, setRadius] = useState(1.2);
  const [mass, setMass] = useState(1.0);
  const [omega, setOmega] = useState(2.0); // rad/s
  const [theta, setTheta] = useState(0); // rad
  const [tangentialForce, setTangentialForce] = useState(0); // N
  const [isUCM, setIsUCM] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("canvas");

  // Visualization State
  const [showVectors, setShowVectors] = useState({
    velocity: true,
    centripetal: true,
    tangential: false,
    resultant: false,
    radius: true,
  });
  const [showTrail, setShowTrail] = useState(true);

  // Data for Graphs
  const [graphs, setGraphs] = useState({
    omega: [] as { time: number; value: number }[],
    theta: [] as { time: number; value: number }[],
    ac: [] as { time: number; value: number }[],
    at: [] as { time: number; value: number }[],
    v: [] as { time: number; value: number }[],
    aTotal: [] as { time: number; value: number }[],
  });

  const lastTimeRef = useRef<number | null>(null);
  const stateRef = useRef<StateRef>({ 
    theta: 0, 
    omega: 2.0, 
    smoothOmega: 2.0 
  });

  // Physics Update Loop
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;

    const update = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        animationFrameId = requestAnimationFrame(update);
        return;
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Smooth Angular Velocity Interpolation
      stateRef.current.smoothOmega += (omega - stateRef.current.smoothOmega) * 0.1;
      
      // Physics Logic
      let alpha = 0;
      if (!isUCM) {
        alpha = tangentialForce / (mass * radius);
        stateRef.current.omega += alpha * dt;
      } else {
        stateRef.current.omega = stateRef.current.smoothOmega;
      }

      stateRef.current.theta += stateRef.current.omega * dt;
      
      if (stateRef.current.theta > Math.PI * 2) stateRef.current.theta -= Math.PI * 2;
      if (stateRef.current.theta < -Math.PI * 2) stateRef.current.theta += Math.PI * 2;

      setTheta(stateRef.current.theta);
      setOmega(stateRef.current.omega);

      const v = radius * stateRef.current.omega;
      const ac = Math.abs((v * v) / radius);
      const at = Math.abs(radius * alpha);
      const aTotal = Math.sqrt(ac * ac + at * at);

      setGraphs(prev => {
        const newOmega = [...prev.omega, { time, value: stateRef.current.omega }].slice(-50);
        const newTheta = [...prev.theta, { time, value: stateRef.current.theta }].slice(-50);
        const newAc = [...prev.ac, { time, value: ac }].slice(-50);
        const newAt = [...prev.at, { time, value: at }].slice(-50);
        const newV = [...prev.v, { time, value: v }].slice(-50);
        const newATotal = [...prev.aTotal, { time, value: aTotal }].slice(-50);
        return { omega: newOmega, theta: newTheta, ac: newAc, at: newAt, v: newV, aTotal: newATotal };
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isUCM, tangentialForce, mass, radius]);

  useEffect(() => {
    if (isUCM) stateRef.current.omega = omega;
  }, [omega, isUCM]);

  const handleReset = useCallback(() => {
    const defaultOmega = isUCM ? omega : 0;
    stateRef.current = { 
      theta: 0, 
      omega: defaultOmega, 
      smoothOmega: defaultOmega 
    };
    setTheta(0);
    if (!isUCM) setOmega(0);
    setGraphs({ omega: [], theta: [], ac: [], at: [], v: [], aTotal: [] });
    setIsPlaying(false);
  }, [isUCM, omega]);

  const renderCanvas = () => (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/5 via-transparent to-[#6366f1]/5 pointer-events-none" />
      
      <div className="flex-1 p-6 relative flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Simulation View */}
        <div className="flex-1 z-10 flex flex-col gap-6">
             <div className="flex-1 relative min-h-0">
                <CircularMotionCanvas 
                    radius={radius}
                    mass={mass}
                    omega={omega}
                    alpha={isUCM ? 0 : tangentialForce / (mass * radius)}
                    theta={theta}
                    isPlaying={isPlaying}
                    showVectors={showVectors}
                    showTrail={showTrail}
                    isUCM={isUCM}
                />
             </div>
          
          {/* Legend Horizontal */}
          <div className="bg-[#18181b] border border-white/5 rounded-[24px] p-4 flex items-center justify-center gap-8 overflow-x-auto no-scrollbar shrink-0">
            {[
                { id: 'velocity', label: 'Velocity (v)', color: 'bg-cyan-500' },
                { id: 'centripetal', label: 'Centripetal (a꜀)', color: 'bg-pink-500' },
                { id: 'tangential', label: 'Tangential (aₜ)', color: 'bg-orange-500' },
                { id: 'resultant', label: 'Resultant (a)', color: 'bg-emerald-500' },
                { id: 'radius', label: 'Radius (r)', color: 'bg-indigo-500' },
            ].map(v => (
                <div key={v.id} className={cn("flex items-center gap-2 transition-opacity", showVectors[v.id as keyof typeof showVectors] ? "opacity-100" : "opacity-20")}>
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", v.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{v.label}</span>
                </div>
            ))}
          </div>

          {/* Interactive Control Bar */}
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
                    label="Radius (r)"
                    value={radius}
                    unit="m"
                    min={0.5}
                    max={1.8}
                    step={0.05}
                    onChange={setRadius}
                    colorClass="text-indigo-400"
                  />
                  <ClickableValue 
                    label="Mass (m)"
                    value={mass}
                    unit="kg"
                    min={0.1}
                    max={5}
                    step={0.1}
                    onChange={setMass}
                    colorClass="text-emerald-400"
                  />
                  {isUCM ? (
                      <ClickableValue 
                        label="Angular Vel (ω)"
                        value={omega}
                        unit="r/s"
                        min={0}
                        max={10}
                        step={0.1}
                        onChange={setOmega}
                        colorClass="text-cyan-400"
                      />
                  ) : (
                      <ClickableValue 
                        label="Tang Force (Fₜ)"
                        value={tangentialForce}
                        unit="N"
                        min={-10}
                        max={10}
                        step={0.5}
                        onChange={setTangentialForce}
                        colorClass="text-orange-400"
                      />
                  )}
              </div>
          </div>
        </div>

        {/* Live Telemetry Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6 z-10 overflow-y-auto custom-scrollbar pr-1">
          {/* Summary Insight Card */}
          <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
               <BookOpen className="w-24 h-24 text-primary" />
            </div>
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Info className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-bold uppercase tracking-tight">Theory Pulse</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed italic relative z-10">
              {isUCM 
                ? "Uniform mode: Velocity magnitude is constant. The only acceleration is centripetal, pulling the object inward." 
                : "Non-uniform mode: Tangential force is applied. Speed varies alongside path curvature."
              }
            </p>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/10">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Centripetal</span>
                    <p className="text-xl font-mono font-bold text-white">{(mass * radius * omega * omega).toFixed(1)} <span className="text-[10px] text-white/20">N</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-orange-500/10">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">Tangential</span>
                    <p className="text-xl font-mono font-bold text-white">{(isUCM ? 0 : tangentialForce).toFixed(1)} <span className="text-[10px] text-white/20">N</span></p>
                </div>
            </div>
          </div>

          {/* Real-time Graphs Section */}
          <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Telemetry Pipeline</span>
                  <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active 60Hz</span>
                  </div>
              </div>
              <CircularMotionGraphs 
                omegaData={graphs.omega}
                thetaData={graphs.theta}
                acData={graphs.ac}
                atData={graphs.at}
                vData={graphs.v}
                aTotalData={graphs.aTotal}
              />
          </div>
          
          {/* Quick Controls Section */}
          <div className="mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                  <p className="text-xs font-bold text-white tracking-tight">Interactive Lab</p>
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
           <p className="text-white/40 text-sm font-medium">Fine-tune the physical constraints and system parameters for the radial manifold.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ControlCard title="Radial Geometry" icon={Target} color="#6366f1">
              <div className="space-y-6">
                  <div className="flex justify-between items-end">
                      <div className="space-y-1">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Radius (r)</span>
                          <p className="text-3xl font-mono font-black text-white">{radius.toFixed(2)} <span className="text-sm text-white/20">m</span></p>
                      </div>
                      <div className="text-right text-[10px] font-bold text-indigo-400 font-mono">r = {radius.toFixed(1)}m</div>
                  </div>
                  <input 
                      type="range" min="0.5" max="1.8" step="0.01" value={radius} 
                      onChange={(e) => setRadius(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 transition-all hover:accent-indigo-400"
                  />
              </div>
            </ControlCard>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ControlCard title="Mass Inertia" icon={Zap} color="#10b981">
              <div className="space-y-6">
                  <div className="flex justify-between items-end">
                      <div className="space-y-1">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">System Mass (m)</span>
                          <p className="text-3xl font-mono font-black text-white">{mass.toFixed(1)} <span className="text-sm text-white/20">kg</span></p>
                      </div>
                      <div className="text-right text-[10px] font-bold text-emerald-400 font-mono">m = {mass.toFixed(1)}kg</div>
                  </div>
                  <input 
                      type="range" min="0.1" max="5" step="0.05" value={mass} 
                      onChange={(e) => setMass(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 transition-all hover:accent-emerald-400"
                  />
              </div>
            </ControlCard>
          </motion.div>

          <ControlCard title="Force Dynamics" icon={Gauge} color="#f59e0b">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Physics Mode</span>
                        <p className="text-lg font-bold text-white uppercase">{isUCM ? "Uniform" : "Non-Uniform"}</p>
                    </div>
                    <button 
                        onClick={() => setIsUCM(!isUCM)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
                            !isUCM ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-white/5 text-white/30 border-white/10 hover:border-white/20"
                        )}
                    >
                        {isUCM ? "UCM Mode" : "NUCM Mode"}
                    </button>
                </div>
                {!isUCM && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                           <span>Tangential Force (Fₜ)</span>
                           <span className="text-orange-400">{tangentialForce.toFixed(1)} N</span>
                       </div>
                       <input 
                            type="range" min="-10" max="10" step="0.5" value={tangentialForce} 
                            onChange={(e) => setTangentialForce(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-orange-500"
                        />
                   </div>
                )}
            </div>
          </ControlCard>

          <ControlCard title="Visual Layers" icon={Activity} color="#ec4899">
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

      {/* Config Analysis Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden h-full">
           <div className="space-y-1">
             <h3 className="text-lg font-black uppercase tracking-tight text-white">Radial Analysis</h3>
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">System Stability</p>
           </div>
           
           <div className="space-y-6">
               {[
                   { label: "Centripetal Load", val: (mass * radius * omega * omega).toFixed(1) + " N", percent: Math.min(100, (mass * radius * omega * omega)), color: "bg-cyan-500" },
                   { label: "Angular Frequency", val: (omega / (2 * Math.PI)).toFixed(2) + " Hz", percent: Math.min(100, omega * 10), color: "bg-indigo-500" },
                   { label: "Tangential Strain", val: (mass * (tangentialForce/mass)).toFixed(1) + " N", percent: Math.min(100, Math.abs(tangentialForce) * 10), color: "bg-orange-500" },
               ].map(stat => (
                   <div key={stat.label} className="space-y-2">
                       <div className="flex justify-between items-end">
                           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
                           <span className="text-xs font-mono font-bold text-white">{stat.val}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${stat.percent}%` }}
                               className={cn("h-full", stat.color)}
                           />
                       </div>
                   </div>
               ))}
           </div>

           <div className="pt-6 border-t border-white/5">
                <button 
                    onClick={handleReset}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Manifold
                </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <SimulationPageLayout 
      title="Circular Motion Dynamics"
      activeTab={activeTab}
      onTabChange={setActiveTab}
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
                         <p className="text-white/40 text-sm font-medium">Deep-dive into the calculus and vectors governing rotational manifolds.</p>
                      </div>
                      <CircularMotionTheory />
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
                            Welcome to the Circular Motion Laboratory. Use the <strong>Simulation Canvas</strong> to observe vector transformations in real-time. Navigate to <strong>Environment Config</strong> to manipulate physical constants like mass and radius.
                         </p>
                      </div>
                      <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 text-left">
                         <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Quick Shortcuts</h4>
                         <ul className="space-y-3 text-xs text-white/60 font-medium">
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Start simulation via Config or HUD</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Toggle vector visibility for clarity</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> NUCM mode enables tangential forces</li>
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

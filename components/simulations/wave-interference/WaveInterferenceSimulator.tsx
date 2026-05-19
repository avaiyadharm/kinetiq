"use client";

import React, { useState, useEffect, useRef } from "react";
import { WaveInterferenceCanvas } from "./WaveInterferenceCanvas";
import { WaveInterferenceTheory } from "./WaveInterferenceTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Waves, Settings, Maximize2, HelpCircle } from "lucide-react";
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
          colorClass.includes("orange") ? "accent-orange-500" : "accent-primary"
        )}
      />
    </div>
  );
};

const ControlCard = ({ title, icon: Icon, children, color }: any) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 md:p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
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

  // Physics params
  const [frequency, setFrequency] = useState(1.5);
  const [separation, setSeparation] = useState(3.0);
  const [numSources, setNumSources] = useState<1 | 2>(2);
  const waveSpeed = 2.0;

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
    setSeparation(3.0);
    setNumSources(2);
    setTimeout(() => setIsPlaying(true), 100);
  };

  return (
    <SimulationPageLayout 
      title="Wave Interference" 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      {activeTab === "canvas" && (
        <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
          {/* Main Visualizer */}
          <div className="flex-1 relative flex flex-col bg-[#18181b] rounded-[32px] border border-border shadow-2xl overflow-hidden min-h-[500px]">
             <div className="absolute top-6 left-6 z-10 flex gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-all border border-white/10"
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                  {isPlaying ? "Pause" : "Run"}
                </button>
             </div>
             <div className="absolute top-6 right-6 z-10">
                <button className="bg-black/60 backdrop-blur-md p-2 rounded-xl text-white/50 hover:text-white transition-all border border-white/10">
                  <Maximize2 className="w-4 h-4" />
                </button>
             </div>
             
             <div className="flex-1 flex items-center justify-center p-4">
                <WaveInterferenceCanvas 
                  frequency={frequency}
                  separation={separation}
                  numSources={numSources}
                  waveSpeed={waveSpeed}
                  time={time}
                  isPlaying={isPlaying}
                />
             </div>
          </div>

          {/* Quick Config Panel Sidebar */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
            <ControlCard title="Wave Parameters" icon={Waves} color="#22d3ee">
              <div className="space-y-6">
                <ClickableValue 
                  label="Oscillator Frequency"
                  unit="Hz"
                  value={frequency}
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  onChange={setFrequency}
                  colorClass="text-cyan-400"
                />

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] ml-1">Active Sources</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setNumSources(1)}
                      className={cn("py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all", 
                        numSources === 1 ? "bg-primary/20 border-primary text-primary" : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5 hover:text-white")}
                    >
                      Single
                    </button>
                    <button 
                      onClick={() => setNumSources(2)}
                      className={cn("py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all", 
                        numSources === 2 ? "bg-primary/20 border-primary text-primary" : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5 hover:text-white")}
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
                    >
                      <ClickableValue 
                        label="Source Separation"
                        unit="m"
                        value={separation}
                        min={1.0}
                        max={8.0}
                        step={0.5}
                        onChange={setSeparation}
                        colorClass="text-violet-400"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ControlCard>
            
            <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-4 shadow-xl">
               <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Live Telemetry</h3>
               <div className="space-y-2">
                 <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Wavelength (λ)</span>
                   <span className="text-sm font-mono font-bold text-emerald-400">{(waveSpeed / frequency).toFixed(2)} m</span>
                 </div>
                 {numSources === 2 && (
                   <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">d / λ Ratio</span>
                     <span className="text-sm font-mono font-bold text-amber-400">{(separation / (waveSpeed / frequency)).toFixed(2)}</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="flex-1 p-12 overflow-y-auto bg-[#09090b]">
           <div className="max-w-3xl mx-auto space-y-8">
             <h2 className="text-3xl font-bold font-display text-white">Full Environment Configuration</h2>
             <p className="text-white/60">Configure the underlying simulation parameters, rendering quality, and numerical solver preferences.</p>
             
             {/* Extended config options could go here */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ControlCard title="Wave Engine" icon={Settings} color="#10b981">
                  <div className="space-y-6">
                    <ClickableValue 
                      label="Wave Propagation Speed"
                      unit="m/s"
                      value={waveSpeed}
                      min={0.5}
                      max={5.0}
                      step={0.5}
                      onChange={() => {}} // Read-only for now, or implement state
                      colorClass="text-emerald-400"
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
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-4 max-w-lg">
            <HelpCircle className="w-16 h-16 text-primary/40 mx-auto" />
            <h3 className="text-2xl font-bold text-white">Laboratory Guide</h3>
            <p className="text-white/60">
              Select <strong>Dual Sources</strong> to observe interference patterns. Adjust the <strong>Frequency</strong> and <strong>Separation</strong> to see how the number of nodal and antinodal lines changes.
            </p>
          </div>
        </div>
      )}
    </SimulationPageLayout>
  );
}

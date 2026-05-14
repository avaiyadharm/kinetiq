"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Gauge, Weight, Rocket, Zap, TrendingUp, RefreshCcw, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

export const ForceAccelerationDemo: React.FC = () => {
  // User Inputs
  const [acceleration, setAcceleration] = useState(2.0);
  const [mass, setMass] = useState(10);
  
  // State for UI triggers
  const [isRunning, setIsRunning] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  
  // Refs for performance (Direct DOM updates)
  const bgRef = useRef<HTMLDivElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const forceRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const objectRef = useRef<HTMLDivElement>(null);

  // Simulation State Refs
  const totalDistanceRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const historyRef = useRef<{ t: number; v: number }[]>([]);

  useEffect(() => {
    let animationFrame: number;

    const update = (time: number) => {
      if (isRunning) {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        if (!startTimeRef.current) startTimeRef.current = time;

        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        const elapsed = (time - startTimeRef.current) / 1000;

        // Physics Calculation (Constant Acceleration)
        // v = u + at (where u=0)
        const currentVel = acceleration * elapsed;
        velocityRef.current = currentVel;

        // s = ut + 0.5at^2 (where u=0)
        const nextDist = 0.5 * acceleration * elapsed * elapsed;
        totalDistanceRef.current = nextDist;

        // Update Direct DOM for maximum precision and performance
        if (bgRef.current) {
          // background speed scales with velocity for infinite track feel
          bgRef.current.style.backgroundPositionX = `-${(nextDist * 20) % 100}px`;
        }
        if (timeRef.current) {
          timeRef.current.innerText = `${elapsed.toFixed(2)}s`;
        }
        if (distRef.current) {
          distRef.current.innerText = `${nextDist.toFixed(2)}m`;
        }
        if (velRef.current) {
          velRef.current.innerText = `${currentVel.toFixed(2)}m/s`;
        }
        if (forceRef.current) {
          forceRef.current.innerText = `${(mass * acceleration).toFixed(1)}N`;
        }

        // Velocity-Time Graph (Dynamic Scaling)
        if (pathRef.current) {
          // Dynamic Axis Scaling: Grow axes as time/velocity increases
          const maxT = Math.max(10, elapsed); 
          const maxV = Math.max(20, currentVel);

          if (historyRef.current.length === 0 || elapsed - historyRef.current[historyRef.current.length - 1].t > 0.05) {
            historyRef.current.push({ t: elapsed, v: currentVel });
          }

          const points = historyRef.current.map(p => {
            const x = (p.t / maxT) * 100;
            const y = 100 - (p.v / maxV) * 100;
            return `${x.toFixed(2)} ${y.toFixed(2)}`;
          });

          if (points.length > 1) {
            const dAttr = `M ${points.join(' L ')}`;
            pathRef.current.setAttribute('d', dAttr);
            if (glowRef.current) glowRef.current.setAttribute('d', dAttr);
            if (fillRef.current) {
              fillRef.current.setAttribute('d', `${dAttr} L ${points[points.length-1].split(' ')[0]} 100 L 0 100 Z`);
            }
          }

          // Update Axis Labels (Dynamic)
          const timeAxis = document.getElementById('time-axis-max');
          const velAxis = document.getElementById('vel-axis-max');
          if (timeAxis) timeAxis.innerText = `${maxT.toFixed(0)}s`;
          if (velAxis) velAxis.innerText = `${maxV.toFixed(0)}m/s`;
        }

        if (objectRef.current) {
          const tilt = Math.min(acceleration * 2, 10);
          objectRef.current.style.transform = `scale(${0.6 + (mass/40)}) rotate(${tilt}deg)`;
        }
      }
      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isRunning, acceleration, mass]);

  const handleStart = () => {
    setIsRunning(true);
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    velocityRef.current = 0;
    totalDistanceRef.current = 0;
    lastTimeRef.current = 0;
    startTimeRef.current = 0;
    historyRef.current = [];
    if (timeRef.current) timeRef.current.innerText = "0.00s";
    if (distRef.current) distRef.current.innerText = "0.00m";
    if (velRef.current) velRef.current.innerText = "0.00m/s";
    if (pathRef.current) {
      pathRef.current.setAttribute('d', '');
      if (fillRef.current) fillRef.current.setAttribute('d', '');
      if (glowRef.current) glowRef.current.setAttribute('d', '');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d2b33] rounded-[40px] border-4 border-[#3b82f6]/20 overflow-hidden relative group font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b33] via-[#1a3a4a] to-[#0d2b33] opacity-50" />
      
      <div className="flex-1 flex flex-col p-8 gap-6 z-10">
        {/* Track Area */}
        <div className="h-48 relative rounded-[30px] bg-black/40 border-2 border-white/5 overflow-hidden flex items-center justify-center">
          <div 
            ref={bgRef}
            className="absolute inset-0 opacity-20 transition-none will-change-transform" 
            style={{
                backgroundImage: 'linear-gradient(90deg, #fff 2px, transparent 2px), linear-gradient(180deg, #fff 1px, transparent 1px)',
                backgroundSize: '100px 100%',
                backgroundRepeat: 'repeat-x'
            }} 
          />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <div className={cn("w-2 h-2 rounded-full bg-emerald-400", isRunning && "animate-pulse")} />
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">t:</span>
               <span ref={timeRef} className="text-sm font-mono font-bold text-emerald-400">0.00s</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">v:</span>
               <span ref={velRef} className="text-sm font-mono font-bold text-white">0.00m/s</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">s:</span>
               <span ref={distRef} className="text-sm font-mono font-bold text-[#3b82f6]">0.00m</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-white/60">F = m·a = <span ref={forceRef} className="text-[#3b82f6]">{(mass * acceleration).toFixed(1)}N</span></span>
          </div>

          <motion.div
            ref={objectRef}
            style={{ transform: `scale(${0.6 + (mass/40)})` }}
            animate={{ 
              x: isGlitching ? [0, -2, 2, -1, 0] : 0,
            }}
            className={cn(
              "w-24 h-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-colors relative z-10",
              isRunning ? "bg-[#3b82f6] shadow-[#3b82f6]/40" : "bg-emerald-500/80 shadow-emerald-500/20"
            )}
          >
            {/* Rocket Thruster Effect - scales with acceleration */}
            {isRunning && (
              <div 
                className="absolute -left-12 bg-gradient-to-r from-transparent via-[#3b82f6]/40 to-[#3b82f6] blur-xl animate-pulse rounded-full" 
                style={{ 
                  width: `${16 + acceleration * 4}px`, 
                  height: '32px' 
                }}
              />
            )}
            
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
               <Rocket className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Live Calculation Panel - Expert Addition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Velocity Derivation</p>
             <div className="flex items-center gap-3 text-lg font-bold">
               <span className="text-white">v</span>
               <span className="text-white/20">=</span>
               <span className="text-emerald-400">u + at</span>
               <span className="text-white/20">→</span>
               <span className="text-white">0 + ({acceleration})·t</span>
             </div>
          </div>
          <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Displacement Derivation</p>
             <div className="flex items-center gap-3 text-lg font-bold">
               <span className="text-white">s</span>
               <span className="text-white/20">=</span>
               <span className="text-[#3b82f6]">ut + ½at²</span>
               <span className="text-white/20">→</span>
               <span className="text-white">0 + 0.5·({acceleration})·t²</span>
             </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 bg-black/40 rounded-[30px] border-2 border-white/5 p-8 relative overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-emerald-400" />
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Live Motion Analysis (Dynamic Scaling)</span>
              </div>
              <div className="text-[10px] font-mono text-white/20">v = at | Area = Displacement</div>
           </div>
           
           <div className="flex-1 relative border-l-2 border-b-2 border-white/10 ml-16 mb-8">
              <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-between text-[9px] font-bold text-white/20 uppercase py-2 pr-4 text-right">
                 <span id="vel-axis-max">20m/s</span>
                 <span id="vel-axis-mid">10m/s</span>
                 <span>0</span>
                 <span className="rotate-[-90deg] absolute -left-12 top-1/2 -translate-y-1/2 whitespace-nowrap">Velocity (m/s)</span>
              </div>
              <div className="absolute left-0 right-0 -bottom-8 flex justify-between text-[9px] font-bold text-white/20 uppercase">
                 <span>0</span>
                 <span id="time-axis-max">10s</span>
                 <span className="absolute left-1/2 -translate-x-1/2 top-4">Elapsed Time (s)</span>
              </div>

              <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 opacity-[0.03]">
                 {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white" />)}
                 {[...Array(5)].map((_, i) => <div key={i} className="border-b border-white" />)}
              </div>

              <svg 
                className="absolute inset-0 w-full h-full overflow-visible" 
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                 <defs>
                   <linearGradient id="velGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                     <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                   </linearGradient>
                 </defs>
                 
                 <path ref={fillRef} fill="url(#velGradient)" />
                 <path ref={pathRef} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                 <path ref={glowRef} fill="none" stroke="#10b981" strokeWidth="6" strokeOpacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
           </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-black/20 rounded-[35px] border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          <ClickableValue 
            label="Payload Mass"
            value={mass}
            unit="kg"
            min={1}
            max={50}
            onChange={setMass}
            colorClass="text-[#ff85a2]"
          />

          <div className="flex justify-center gap-4 col-span-2">
            {!isRunning ? (
              <button 
                onClick={handleStart}
                className="px-8 py-4 rounded-full bg-emerald-500 text-white font-bold flex items-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <Rocket className="w-5 h-5" />
                Apply Force
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="px-8 py-4 rounded-full bg-[#ff85a2] text-white font-bold flex items-center gap-3 shadow-lg shadow-[#ff85a2]/20 hover:scale-105 transition-all"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop
              </button>
            )}
            <button 
              onClick={handleReset}
              className="w-14 h-14 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>

          <ClickableValue 
            label="Target Accel"
            value={acceleration}
            unit="m/s²"
            min={0.1}
            max={5}
            step={0.1}
            onChange={setAcceleration}
            colorClass="text-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};

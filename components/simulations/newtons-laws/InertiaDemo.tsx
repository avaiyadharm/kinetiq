"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play, Square, RefreshCcw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

export const InertiaDemo: React.FC = () => {
  const [velocity, setVelocity] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [mass, setMass] = useState(5);
  const [isMoving, setIsMoving] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [history, setHistory] = useState<{ t: number, d: number }[]>([]);
  
  const bgRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const pointRef = useRef<SVGCircleElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  
  // Simulation State Refs
  const totalDistanceRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const startTimeRef = useRef(0);
  const historyRef = useRef<{ t: number, d: number }[]>([]);

  useEffect(() => {
    let animationFrame: number;
    const update = (time: number) => {
      if (isMoving) {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        if (!startTimeRef.current) startTimeRef.current = time;
        
        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        const elapsed = (time - startTimeRef.current) / 1000;
        
        // Physics Calculation (Uniform Rectilinear Motion)
        // v = constant (Newton's First Law)
        // s = v * t
        const currentVel = velocityRef.current;
        const nextDist = currentVel * elapsed;
        totalDistanceRef.current = nextDist;

        // Update Direct DOM for maximum precision
        if (bgRef.current) {
          // background speed pinned to velocity
          bgRef.current.style.backgroundPositionX = `-${(nextDist * 20) % 100}px`;
        }
        if (distRef.current) {
          distRef.current.innerText = `${nextDist.toFixed(2)}m`;
        }

        // Displacement-Time Graph (Dynamic Scaling)
        if (pathRef.current) {
          // Dynamic Axis Scaling: Grow axes as time/distance increases
          const maxT = Math.max(10, elapsed); 
          const maxS = Math.max(40, nextDist);

          if (historyRef.current.length === 0 || elapsed - historyRef.current[historyRef.current.length - 1].t > 0.05) {
            historyRef.current.push({ t: elapsed, d: nextDist });
          }

          const points = historyRef.current.map(p => {
            const x = (p.t / maxT) * 100;
            const y = 100 - (p.d / maxS) * 100;
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
          const timeAxis = document.getElementById('inertia-time-max');
          const distAxis = document.getElementById('inertia-dist-max');
          if (timeAxis) timeAxis.innerText = `${maxT.toFixed(0)}s`;
          if (distAxis) distAxis.innerText = `${maxS.toFixed(0)}m`;
        }
      }
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isMoving]);

  const handleApplyForce = () => {
    // Impulse: Force applied for a tiny duration creates velocity
    // F * dt = m * dv
    const impulseForce = 50; // N
    const dt = 0.2; // s
    const initialVelocity = (impulseForce * dt) / mass;
    
    velocityRef.current = initialVelocity;
    setVelocity(initialVelocity); // For UI display
    setIsMoving(true);
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
    
    // Reset timers for new run
    startTimeRef.current = 0;
    lastTimeRef.current = 0;
    totalDistanceRef.current = 0;
    historyRef.current = [];
  };

  const handleStop = () => {
    setIsMoving(false);
  };

  const reset = () => {
    totalDistanceRef.current = 0;
    historyRef.current = [];
    velocityRef.current = 0;
    setVelocity(0);
    setIsMoving(false);
    startTimeRef.current = 0;
    lastTimeRef.current = 0;
    if (distRef.current) distRef.current.innerText = "0.00m";
    if (pathRef.current) {
       pathRef.current.setAttribute('d', '');
       if (fillRef.current) fillRef.current.setAttribute('d', '');
       if (glowRef.current) glowRef.current.setAttribute('d', '');
    }
  };

  const visualScale = 0.6 + (mass / 40);

  return (
    <div className="flex flex-col h-full bg-[#0d2b33] rounded-[40px] border-4 border-[#3b82f6]/20 overflow-hidden relative group font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b33] via-[#1a3a4a] to-[#0d2b33] opacity-50" />
      
      <div className="flex-1 flex flex-col p-8 gap-6 z-10">
        <div className="h-48 relative rounded-[30px] bg-black/40 border-2 border-white/5 overflow-hidden flex items-center justify-center">
          <div 
            ref={bgRef}
            className="absolute inset-0 opacity-20 transition-none will-change-transform" 
            style={{
                backgroundImage: 'linear-gradient(90deg, #fff 2px, transparent 2px), linear-gradient(180deg, #fff 1px, transparent 1px)',
                backgroundSize: '50px 100%',
                backgroundRepeat: 'repeat-x'
            }} 
          />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <div className={cn("w-2 h-2 rounded-full bg-[#3b82f6]", isMoving && "animate-pulse")} />
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">v:</span>
               <span className="text-sm font-mono font-bold text-white">{velocity.toFixed(2)}m/s</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">s:</span>
               <span ref={distRef} className="text-sm font-mono font-bold text-[#3b82f6]">0.00m</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">m = {mass}kg</span>
          </div>

          <motion.div
            animate={{ 
              x: isGlitching ? [0, -2, 2, -1, 0] : 0,
              scale: isMoving ? visualScale * 1.05 : visualScale,
              rotate: isMoving ? [0, 1, -1, 0] : 0
            }}
            transition={{
              x: { duration: 0.2 },
              rotate: { repeat: Infinity, duration: 0.5 },
              scale: { type: "spring", stiffness: 300, damping: 20 }
            }}
            className={cn(
              "w-20 h-20 rounded-[28px] shadow-2xl flex items-center justify-center transition-colors relative z-10",
              isMoving ? "bg-[#3b82f6] shadow-[#3b82f6]/40" : "bg-[#ff85a2] shadow-[#ff85a2]/40"
            )}
          >
            {isMoving && (
               <div className="absolute inset-0 rounded-[28px] bg-[#3b82f6]/20 animate-ping opacity-20" />
            )}
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
               <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          </motion.div>
        </div>

        {/* Live Calculation Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3 text-center">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Net External Force</p>
             <div className="flex items-center gap-3 text-xl font-bold text-emerald-400">
               <span>∑F = 0</span>
               <span className="text-white/20 text-xs font-normal ml-2">v = const | a = 0</span>
             </div>
          </div>
          <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Uniform Motion Equation</p>
             <div className="flex items-center gap-3 text-lg font-bold">
               <span className="text-white">s</span>
               <span className="text-white/20">=</span>
               <span className="text-[#3b82f6]">v · t</span>
               <span className="text-white/20">→</span>
               <span className="text-white">({velocity.toFixed(1)}) · t</span>
             </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 bg-black/40 rounded-[30px] border-2 border-white/5 p-8 relative overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Displacement-Time Analysis (Dynamic)</span>
              </div>
              <div className="text-[10px] font-mono text-white/20">Slope = Constant Velocity</div>
           </div>
           
           <div className="flex-1 relative border-l-2 border-b-2 border-white/10 ml-16 mb-8">
              <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-between text-[9px] font-bold text-white/20 uppercase py-2 pr-4 text-right">
                 <span id="inertia-dist-max">40m</span>
                 <span>20m</span>
                 <span>0m</span>
                 <span className="rotate-[-90deg] absolute -left-12 top-1/2 -translate-y-1/2 whitespace-nowrap">Displacement (m)</span>
              </div>
              <div className="absolute left-0 right-0 -bottom-8 flex justify-between text-[9px] font-bold text-white/20 uppercase">
                 <span>0s</span>
                 <span id="inertia-time-max">10s</span>
                 <span className="absolute left-1/2 -translate-x-1/2 top-4">Elapsed Time (s)</span>
              </div>

              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-[0.03]">
                 {[...Array(5)].map((_, i) => <div key={i} className="border-r border-white" />)}
                 {[...Array(5)].map((_, i) => <div key={i} className="border-b border-white" />)}
              </div>

              <svg 
                className="absolute inset-0 w-full h-full overflow-visible" 
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                 <defs>
                   <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                     <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                   </linearGradient>
                 </defs>
                 
                 <path ref={fillRef} fill="url(#graphGradient)" />
                 <path ref={pathRef} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                 <path ref={glowRef} fill="none" stroke="#3b82f6" strokeWidth="6" strokeOpacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
           </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/5 flex flex-col md:flex-row items-center justify-between z-10 gap-6">
        <div className="flex flex-col gap-1 pr-8">
          <h3 className="text-xl font-bold text-white font-display uppercase tracking-tight">The Law of Inertia</h3>
          <p className="text-[#ff85a2] text-[10px] uppercase font-black tracking-[0.2em]">Newton's First Law</p>
        </div>

        <div className="flex-1 max-w-xs px-8 border-x border-white/5">
          <ClickableValue 
            label="Object Mass"
            value={mass}
            unit="kg"
            min={1}
            max={20}
            onChange={setMass}
            colorClass="text-[#ff85a2]"
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleApplyForce}
            disabled={isMoving}
            className="px-8 py-4 bg-[#3b82f6] text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#3b82f6]/20 disabled:opacity-50 disabled:grayscale"
          >
            <Zap className="w-4 h-4 fill-current" />
            Apply Impulse
          </button>
          
          <button 
            onClick={handleStop}
            className="px-8 py-4 bg-[#ff85a2] text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ff85a2]/20"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>

          <button 
            onClick={reset}
            className="w-14 h-14 bg-white/5 text-white/40 hover:text-white rounded-2xl transition-all border border-white/5 flex items-center justify-center"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

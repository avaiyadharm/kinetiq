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
  
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    let animationFrame: number;
    const update = (time: number) => {
      if (isMoving) {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        if (!startTimeRef.current) startTimeRef.current = time;
        
        const dt = (time - lastTimeRef.current) / 1000;
        const distChange = Math.abs(velocity * dt * 10); // Scale distance
        
        setTotalDistance((prev) => prev + distChange);
        
        // Update history for graph
        const elapsed = (time - startTimeRef.current) / 1000;
        if (elapsed % 0.2 < 0.05) { // Sample every 0.2s
           setHistory(prev => [...prev.slice(-50), { t: elapsed, d: totalDistance + distChange }]);
        }

        lastTimeRef.current = time;
      }
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isMoving, velocity, totalDistance]);

  const handleApplyForce = () => {
    const impulse = 5 / mass; 
    setVelocity(impulse);
    setIsMoving(true);
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 200);
    // Reset start time for graph
    startTimeRef.current = 0;
    lastTimeRef.current = 0;
  };

  const handleStop = () => {
    setIsMoving(false);
    setVelocity(0);
  };

  const reset = () => {
    setTotalDistance(0);
    setHistory([]);
    setVelocity(0);
    setIsMoving(false);
    startTimeRef.current = 0;
    lastTimeRef.current = 0;
  };

  const scale = 0.7 + (mass / 30);

  return (
    <div className="flex flex-col h-full bg-[#0d2b33] rounded-[40px] border-4 border-[#3b82f6]/20 overflow-hidden relative group">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b33] via-[#1a3a4a] to-[#0d2b33] opacity-50" />
      
      <div className="flex-1 flex flex-col p-8 gap-6 z-10">
        {/* Infinite Scrolling Track */}
        <div className="h-48 relative rounded-[30px] bg-black/40 border-2 border-white/5 overflow-hidden flex items-center justify-center">
          {/* Scrolling Grid Background */}
          <motion.div 
            animate={{ backgroundPositionX: isMoving ? [`0px`, `-100px`] : `0px` }}
            transition={{ repeat: Infinity, duration: 1 / (velocity || 0.1), ease: "linear" }}
            className="absolute inset-0 opacity-20" 
            style={{
                backgroundImage: 'linear-gradient(90deg, #fff 2px, transparent 2px), linear-gradient(180deg, #fff 1px, transparent 1px)',
                backgroundSize: '50px 100%',
                backgroundRepeat: 'repeat-x'
            }} 
          />
          
          {/* Distance Markers */}
          <div className="absolute inset-0 pointer-events-none">
             {/* We can't easily animate text markers with backgroundPosition, so we just use the grid */}
          </div>

          <div className="absolute top-4 left-4 bg-black/40 px-4 py-2 rounded-full border border-white/10">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-2">Displacement:</span>
             <span className="text-sm font-mono font-bold text-[#3b82f6]">{totalDistance.toFixed(1)}m</span>
          </div>

          {/* The Puck (Static in Center, Environment Scrolls) */}
          <motion.div
            animate={{ 
              x: isGlitching ? [0, -2, 2, -1, 0] : 0,
              scale: isMoving ? scale * 1.05 : scale,
              rotate: isMoving ? [0, 1, -1, 0] : 0
            }}
            transition={{
              x: { duration: 0.2 },
              rotate: { repeat: Infinity, duration: 0.5 },
              scale: { type: "spring", stiffness: 300, damping: 20 }
            }}
            className={cn(
              "w-20 h-20 rounded-[28px] shadow-2xl flex items-center justify-center cursor-pointer transition-colors relative z-10",
              isMoving ? "bg-[#3b82f6] shadow-[#3b82f6]/40" : "bg-[#ff85a2] shadow-[#ff85a2]/40"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
               <div className="w-5 h-5 rounded-full bg-white" />
            </div>
            <span className="absolute -top-10 text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">Mass: {mass}kg</span>
          </motion.div>
        </div>

        {/* Distance-Time Graph */}
        <div className="flex-1 bg-black/40 rounded-[30px] border-2 border-white/5 p-6 relative overflow-hidden flex flex-col">
           <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Live Distance-Time Graph</span>
           </div>
           
           <div className="flex-1 relative border-l border-b border-white/10 ml-8 mb-6">
              {/* Graph Axis Labels */}
              <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-[8px] font-bold text-white/20 uppercase py-2">
                 <span>Dist</span>
                 <span>(m)</span>
              </div>
              <div className="absolute left-0 right-0 -bottom-6 flex justify-between text-[8px] font-bold text-white/20 uppercase px-2">
                 <span>0s</span>
                 <span>Time (s)</span>
              </div>

              {/* SVG Path for Graph */}
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                 <path 
                   d={history.length > 1 ? `M ${history.map((p, i) => {
                     const x = (i / Math.max(history.length - 1, 1)) * 100;
                     // Find max distance in current history for scaling, or use a fixed range
                     const maxD = Math.max(...history.map(h => h.d), 10);
                     const y = 100 - (p.d / maxD) * 100;
                     return `${x}% ${y}%`;
                   }).join(' L ')}` : ''}
                   fill="none"
                   stroke="#3b82f6"
                   strokeWidth="3"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   className="transition-all duration-200"
                 />
                 {/* Current Point */}
                 {history.length > 0 && (
                   <circle 
                     cx="100%" 
                     cy={`${100 - (history[history.length-1].d / Math.max(...history.map(h => h.d), 10)) * 100}%`} 
                     r="4" 
                     fill="#3b82f6" 
                     className="animate-pulse"
                   />
                 )}
              </svg>
           </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-10">
        <div className="flex flex-col gap-1 pr-8">
          <h3 className="text-xl font-bold text-white font-display uppercase tracking-tight">Infinite Inertia</h3>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Newton's First Law</p>
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

        <div className="flex items-center gap-4 pl-8">
          <button 
            onClick={handleApplyForce}
            disabled={isMoving}
            className="px-6 py-3 bg-[#3b82f6] text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Zap className="w-4 h-4 fill-current" />
            Apply Force
          </button>
          
          <button 
            onClick={handleStop}
            className="px-6 py-3 bg-[#ff85a2] text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>

          <button 
            onClick={reset}
            className="p-3 bg-white/5 text-white/40 hover:text-white rounded-xl transition-all"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gauge, Weight, Rocket, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

export const ForceAccelerationDemo: React.FC = () => {
  const [acceleration, setAcceleration] = useState(2.5);
  const [mass, setMass] = useState(10);
  const [force, setForce] = useState(0);
  const [position, setPosition] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    // F = ma
    setForce(mass * acceleration);
  }, [acceleration, mass]);

  useEffect(() => {
    let animationFrame: number;
    let startTime: number;

    const update = (time: number) => {
      if (!startTime) startTime = time;
      const t = (time - startTime) / 1000;
      
      // s = 1/2 * a * t^2
      const s = 0.5 * acceleration * t * t * 10; // Scale for visual
      
      if (s < 90) {
        setPosition(s);
        animationFrame = requestAnimationFrame(update);
      } else {
        setPosition(90);
        setIsRunning(false);
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);
      }
    };

    if (isRunning) {
      animationFrame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isRunning, acceleration]);

  const handleStart = () => {
    setPosition(0);
    setIsRunning(true);
  };

  // Scaling factor for mass: 10kg is baseline, 20kg is larger
  const scale = 0.8 + (mass / 50); 

  return (
    <div className="flex flex-col h-full bg-[#0d2b33] rounded-[40px] border-4 border-[#3b82f6]/20 overflow-hidden relative">
      {/* Simulation Area */}
      <div className="flex-1 relative m-12 rounded-[30px] bg-black/40 border-2 border-white/5 overflow-hidden">
        {/* Distance Markers */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-10 text-[8px] font-bold text-white/10 uppercase tracking-widest">
           {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(m => <span key={m}>{m}m</span>)}
        </div>

        {/* The Experiment Object (Stitch Hovercraft) */}
        <motion.div
          animate={{ 
            left: `${position}%`,
            x: isGlitching ? [0, -3, 3, -1, 0] : 0,
            scale: scale
          }}
          transition={{
            left: { type: "tween", ease: "linear", duration: 0 },
            x: { duration: 0.2 },
            scale: { type: "spring", stiffness: 300, damping: 20 }
          }}
          className="absolute bottom-10 w-24 h-16 origin-bottom"
        >
          {/* Flame particles if accelerating fast */}
          {isRunning && acceleration > 2 && (
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5], x: [-5, -10, -5] }}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-12 h-6 bg-gradient-to-r from-transparent to-[#ff85a2] blur-md rounded-full"
            />
          )}
          
          <div className="w-full h-full bg-[#3b82f6] rounded-[24px] shadow-2xl shadow-[#3b82f6]/40 flex items-center justify-center relative">
             <div className="absolute -top-1 w-12 h-4 bg-white/20 rounded-full blur-sm" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white">{mass}kg</span>
                <div className="w-8 h-1 bg-white/20 rounded-full mt-1" />
             </div>
          </div>
        </motion.div>
      </div>

      {/* Formula Display */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 bg-black/70 backdrop-blur-xl px-12 py-6 rounded-[35px] border border-white/10 z-20 shadow-2xl">
         <div className="flex items-center gap-8">
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Force (F)</span>
                <span className="text-2xl font-black text-[#3b82f6] tracking-tight">{force.toFixed(1)}N</span>
            </div>
            <span className="text-3xl font-light text-white/10">=</span>
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Mass (m)</span>
                <span className="text-2xl font-black text-[#ff85a2] tracking-tight">{mass}kg</span>
            </div>
            <span className="text-3xl font-light text-white/10">×</span>
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Accel (a)</span>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">{acceleration.toFixed(2)}m/s²</span>
            </div>
         </div>
         
         <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
         
         <div className="flex items-center gap-3 font-mono text-[11px] text-white/40 italic">
           <span className="text-white/20">General Form:</span>
           <div className="flex items-center gap-1">
             <span>F</span>
             <span>=</span>
             <span>m</span>
             <div className="flex flex-col items-center text-[9px] leading-none mx-0.5">
               <span className="border-b border-white/40 pb-0.5">dv</span>
               <span className="pt-0.5">dt</span>
             </div>
             <span>+</span>
             <span>v</span>
             <div className="flex flex-col items-center text-[9px] leading-none mx-0.5">
               <span className="border-b border-white/40 pb-0.5">dm</span>
               <span className="pt-0.5">dt</span>
             </div>
           </div>
         </div>
      </div>

      {/* Controls */}
      <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
        <ClickableValue 
          label="Payload Mass"
          value={mass}
          unit="kg"
          min={1}
          max={50}
          onChange={setMass}
          colorClass="text-[#ff85a2]"
        />

        <div className="flex justify-center">
          <button 
            onClick={handleStart}
            disabled={isRunning}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Rocket className="w-8 h-8 fill-current" />
          </button>
        </div>

        <ClickableValue 
          label="Target Acceleration"
          value={acceleration}
          unit="m/s²"
          min={0.1}
          max={10}
          step={0.1}
          onChange={setAcceleration}
          colorClass="text-[#3b82f6]"
        />
      </div>
    </div>
  );
};

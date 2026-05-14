"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Flame, Rocket as RocketIcon, TrendingUp, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

export const ActionReactionDemo: React.FC = () => {
  // User Inputs
  const [mass, setMass] = useState(15);
  const [isIgnited, setIsIgnited] = useState(false);
  
  // Refs for high-performance updates
  const skyRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const forceRef = useRef<HTMLSpanElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);

  // Physics State
  const altitudeRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const forceValRef = useRef(100); // Constant Thrust Force (N)

  useEffect(() => {
    let animationFrame: number;
    const particles: { el: HTMLDivElement; life: number; vy: number; vx: number }[] = [];

    const update = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const gravity = 9.8;
      const thrust = isIgnited ? forceValRef.current : 0;
      
      // F_net = Thrust - Weight
      const weight = mass * gravity;
      const netForce = thrust - weight;
      const acceleration = netForce / mass;

      // Update Physics
      velocityRef.current += acceleration * dt;
      // Clamp velocity at 0 if on ground and not ignited
      if (altitudeRef.current <= 0 && !isIgnited) {
        velocityRef.current = Math.max(0, velocityRef.current);
      }
      
      altitudeRef.current += velocityRef.current * dt;
      
      // Ground Collision
      if (altitudeRef.current <= 0) {
        altitudeRef.current = 0;
        velocityRef.current = Math.max(0, velocityRef.current);
      }

      // Update DOM
      if (skyRef.current) {
        // Scroll sky background based on altitude
        skyRef.current.style.backgroundPositionY = `${altitudeRef.current * 10}px`;
      }
      if (altRef.current) altRef.current.innerText = `${altitudeRef.current.toFixed(1)}m`;
      if (velRef.current) velRef.current.innerText = `${velocityRef.current.toFixed(1)}m/s`;
      if (forceRef.current) forceRef.current.innerText = `${thrust.toFixed(0)}N`;

      if (rocketRef.current) {
        // Visual shake during ignition
        const shake = isIgnited ? (Math.random() - 0.5) * 2 : 0;
        // Hover effect when high
        const hover = Math.sin(time / 500) * 5;
        // Only apply hover/shake if off ground or ignited
        const yOffset = altitudeRef.current > 0 || isIgnited ? hover + shake : 0;
        rocketRef.current.style.transform = `translateY(${yOffset}px) scale(${0.8 + (mass / 50)})`;
      }

      // Particle System (Manual DOM management for performance)
      if (isIgnited && particleContainerRef.current) {
        const p = document.createElement('div');
        p.className = "absolute w-3 h-3 rounded-full bg-[#ff85a2] blur-sm opacity-60";
        p.style.left = `calc(50% + ${(Math.random() - 0.5) * 30}px)`;
        p.style.bottom = "0px";
        particleContainerRef.current.appendChild(p);
        particles.push({ 
          el: p, 
          life: 1, 
          vy: 5 + Math.random() * 5, 
          vx: (Math.random() - 0.5) * 2 
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 2;
        if (p.life <= 0) {
          p.el.remove();
          particles.splice(i, 1);
        } else {
          const currentY = parseFloat(p.el.style.bottom || "0");
          const currentX = parseFloat(p.el.style.left.match(/-?\d+/)?.[0] || "0");
          p.el.style.bottom = `${currentY - p.vy}px`;
          p.el.style.opacity = p.life.toString();
          p.el.style.transform = `scale(${1 + (1 - p.life)})`;
        }
      }

      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [isIgnited, mass]);

  const handleReset = () => {
    altitudeRef.current = 0;
    velocityRef.current = 0;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d2b33] rounded-[40px] border-4 border-[#3b82f6]/20 overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b33] via-[#1a3a4a] to-[#0d2b33] opacity-50" />
      
      <div className="flex-1 flex flex-col p-8 gap-6 z-10">
        {/* Sky Area (Infinite Scroller) */}
        <div className="flex-1 relative rounded-[30px] bg-black/40 border-2 border-white/5 overflow-hidden flex flex-col items-center justify-center">
          <div 
            ref={skyRef}
            className="absolute inset-0 opacity-20 transition-none will-change-transform" 
            style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundRepeat: 'repeat'
            }} 
          />

          {/* Telemetry Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <div className={cn("w-2 h-2 rounded-full bg-emerald-400", isIgnited && "animate-pulse")} />
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">Altitude:</span>
               <span ref={altRef} className="text-sm font-mono font-bold text-emerald-400">0.0m</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">Velocity:</span>
               <span ref={velRef} className="text-sm font-mono font-bold text-white">0.0m/s</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-white/60">Applied Thrust: <span ref={forceRef} className="text-[#3b82f6]">0N</span></span>
          </div>

          {/* Action-Reaction Vectors */}
          <div className="relative w-32 h-64 flex flex-col items-center justify-center pt-24">
             <AnimatePresence>
               {isIgnited && (
                 <>
                   {/* Action Vector (Down) */}
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 120 }}
                     exit={{ opacity: 0, height: 0 }}
                     className="absolute top-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center origin-top z-0"
                   >
                      <div className="w-1.5 flex-1 bg-gradient-to-b from-[#ff85a2] to-transparent" />
                      <ArrowDown className="w-6 h-6 text-[#ff85a2] -mt-2" />
                      <span className="text-[8px] font-bold text-[#ff85a2] uppercase tracking-tighter bg-black/80 px-2 py-1 rounded-full border border-[#ff85a2]/20 mt-2 whitespace-nowrap">Action: Exhaust Force</span>
                   </motion.div>

                   {/* Reaction Vector (Up) */}
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 120 }}
                     exit={{ opacity: 0, height: 0 }}
                     className="absolute bottom-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center origin-bottom z-0"
                   >
                      <span className="text-[8px] font-bold text-[#3b82f6] uppercase tracking-tighter bg-black/80 px-2 py-1 rounded-full border border-[#3b82f6]/20 mb-2 whitespace-nowrap">Reaction: Thrust Force</span>
                      <ArrowUp className="w-6 h-6 text-[#3b82f6] -mb-2" />
                      <div className="w-1.5 flex-1 bg-gradient-to-t from-[#3b82f6] to-transparent" />
                   </motion.div>
                 </>
               )}
             </AnimatePresence>

             {/* The Rocket */}
             <div ref={rocketRef} className="relative z-10 w-24 h-40 flex flex-col items-center transition-none will-change-transform">
                <div className="w-full h-full bg-[#3b82f6] rounded-t-full rounded-b-[40px] shadow-2xl shadow-[#3b82f6]/40 relative border-b-8 border-black/20">
                   <div className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                      <div className="w-4 h-4 rounded-full bg-[#ff85a2]/20 animate-pulse" />
                   </div>
                   {/* Fins */}
                   <div className="absolute -left-6 bottom-4 w-10 h-16 bg-[#ff85a2] rounded-l-full -skew-y-12 border-r-4 border-black/10" />
                   <div className="absolute -right-6 bottom-4 w-10 h-16 bg-[#ff85a2] rounded-r-full skew-y-12 border-l-4 border-black/10" />
                </div>
                
                {/* Exhaust Particle Container */}
                <div ref={particleContainerRef} className="absolute top-full left-0 right-0 h-96 pointer-events-none" />
             </div>
          </div>
        </div>

        {/* Calculation Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Net Force Analysis</p>
             <div className="flex items-center gap-3 text-lg font-bold">
               <span className="text-[#3b82f6]">F<sub>thrust</sub></span>
               <span className="text-white/20">-</span>
               <span className="text-[#ff85a2]">W</span>
               <span className="text-white/20">=</span>
               <span className="text-white">m·a</span>
               <span className="text-white/20">→</span>
               <span className="text-white">{(isIgnited ? 100 - mass * 9.8 : -mass * 9.8).toFixed(1)}N</span>
             </div>
          </div>
          <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Action = -Reaction</p>
             <div className="flex items-center gap-3 text-lg font-bold">
               <span className="text-[#ff85a2]">F<sub>exhaust</sub></span>
               <span className="text-white/20">=</span>
               <span className="text-white">-</span>
               <span className="text-[#3b82f6]">F<sub>thrust</sub></span>
               <span className="text-white/20">|</span>
               <span className="text-white">100N</span>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-black/20 rounded-[35px] border border-white/5 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex flex-col gap-1">
             <h3 className="text-lg font-bold text-white tracking-tight">The Third Law</h3>
             <p className="text-[#ff85a2] text-[10px] font-black uppercase tracking-[0.3em]">Momentum & Force Pairs</p>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onMouseDown={() => setIsIgnited(true)}
              onMouseUp={() => setIsIgnited(false)}
              onMouseLeave={() => setIsIgnited(false)}
              className={cn(
                "group relative px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all duration-300 overflow-hidden",
                isIgnited 
                  ? "bg-[#ff85a2] text-white scale-110 shadow-[0_0_50px_rgba(255,133,162,0.4)]" 
                  : "bg-white/5 text-[#ff85a2] border-2 border-[#ff85a2]/30 hover:bg-[#ff85a2]/10"
              )}
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                 <Flame className={cn("w-5 h-5", isIgnited && "animate-bounce")} />
                 {isIgnited ? "IGNITION ACTIVE" : "HOLD TO IGNITE"}
              </div>
              {isIgnited && (
                <motion.div 
                  layoutId="glow"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                />
              )}
            </button>
            <button 
              onClick={handleReset}
              className="w-14 h-14 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>

          <ClickableValue 
            label="Rocket Mass"
            value={mass}
            unit="kg"
            min={5}
            max={50}
            onChange={setMass}
            colorClass="text-[#3b82f6]"
          />
        </div>
      </div>
    </div>
  );
};

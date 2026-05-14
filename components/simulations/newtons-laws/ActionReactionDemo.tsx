"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

export const ActionReactionDemo: React.FC = () => {
  const [isIgnited, setIsIgnited] = useState(false);
  const [altitude, setAltitude] = useState(0);
  const [mass, setMass] = useState(15);
  const [particles, setParticles] = useState<{ id: number, x: number }[]>([]);

  useEffect(() => {
    let interval: any;
    if (isIgnited) {
      // Force = 100N. a = 100/m. 
      const acceleration = 10 / mass; 
      interval = setInterval(() => {
        setParticles(prev => [
          ...prev.slice(-20),
          { id: Date.now() + Math.random(), x: Math.random() * 40 - 20 }
        ]);
        setAltitude(prev => Math.min(prev + acceleration, 60));
      }, 50);
    } else {
      setAltitude(prev => Math.max(0, prev - 0.5));
    }
    return () => clearInterval(interval);
  }, [isIgnited, mass]);

  // Visual scaling: 15kg is baseline
  const scale = 0.8 + (mass / 50);

  return (
    <div className="flex flex-col h-full bg-[#0d2b33] rounded-[40px] border-4 border-[#3b82f6]/20 overflow-hidden relative">
      {/* Sky Area */}
      <div className="flex-1 relative m-12 rounded-[30px] bg-gradient-to-b from-[#0d2b33] to-[#1a3a4a] border-2 border-white/5 overflow-hidden flex flex-col items-center justify-end">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px'}} />
        
        {/* The Rocket (Experiment 626 style) */}
        <motion.div
          animate={{ bottom: `${altitude}%`, scale: scale }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 }
          }}
          className="relative w-24 h-40 flex flex-col items-center z-10 origin-bottom"
        >
          {/* Action Vector (Down) */}
          {isIgnited && (
            <motion.div 
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              className="absolute -bottom-24 flex flex-col items-center origin-top"
            >
               <div className="w-1.5 h-20 bg-gradient-to-b from-[#ff85a2] to-transparent" />
               <ArrowDown className="w-6 h-6 text-[#ff85a2] -mt-2" />
               <span className="text-[8px] font-bold text-[#ff85a2] uppercase tracking-tighter bg-black/40 px-2 py-1 rounded mt-1">Action: Exhaust Force</span>
            </motion.div>
          )}

          {/* Reaction Vector (Up) */}
          {isIgnited && (
            <motion.div 
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              className="absolute -top-24 flex flex-col items-center origin-bottom"
            >
               <span className="text-[8px] font-bold text-[#3b82f6] uppercase tracking-tighter bg-black/40 px-2 py-1 rounded mb-1">Reaction: Thrust Force</span>
               <ArrowUp className="w-6 h-6 text-[#3b82f6] -mb-2" />
               <div className="w-1.5 h-20 bg-gradient-to-t from-[#3b82f6] to-transparent" />
            </motion.div>
          )}

          {/* Rocket Body (Stitch Aesthetic) */}
          <div className="w-full h-full bg-[#3b82f6] rounded-t-full rounded-b-[40px] shadow-2xl shadow-[#3b82f6]/40 relative border-b-8 border-black/20">
             <div className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#ff85a2]/20" />
             </div>
             {/* Fins */}
             <div className="absolute -left-6 bottom-0 w-10 h-16 bg-[#ff85a2] rounded-l-full -skew-y-12 border-r-4 border-black/10" />
             <div className="absolute -right-6 bottom-0 w-10 h-16 bg-[#ff85a2] rounded-r-full skew-y-12 border-l-4 border-black/10" />
          </div>

          {/* Exhaust Particles */}
          <AnimatePresence>
            {isIgnited && particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: 100, scale: 2 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 w-4 h-4 rounded-full bg-[#ff85a2] blur-sm"
                style={{ left: `calc(50% + ${p.x}px)` }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="p-10 bg-black/40 backdrop-blur-xl border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
        <div className="text-left space-y-1">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Action & Reaction</h3>
          <p className="text-[#ff85a2] text-[10px] font-bold uppercase tracking-[0.3em]">Newton's Third Law</p>
        </div>

        <button 
          onMouseDown={() => setIsIgnited(true)}
          onMouseUp={() => setIsIgnited(false)}
          onMouseLeave={() => setIsIgnited(false)}
          onTouchStart={() => setIsIgnited(true)}
          onTouchEnd={() => setIsIgnited(false)}
          className={cn(
            "group relative px-8 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all duration-300",
            isIgnited 
              ? "bg-[#ff85a2] text-white scale-110 shadow-[0_0_40px_rgba(255,133,162,0.6)]" 
              : "bg-white/5 text-[#ff85a2] border-2 border-[#ff85a2]/30 hover:bg-[#ff85a2]/10"
          )}
        >
          <div className="flex items-center justify-center gap-3">
             <Flame className={cn("w-4 h-4 transition-transform", isIgnited ? "animate-bounce" : "group-hover:scale-110")} />
             {isIgnited ? "IGNITION" : "HOLD TO IGNITE"}
          </div>
        </button>

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
  );
};

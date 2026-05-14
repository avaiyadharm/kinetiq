"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Flame, Rocket as RocketIcon, TrendingUp, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

export const ActionReactionDemo: React.FC = () => {
  // User Inputs
  const [mass, setMass] = useState(15);
  // Interaction State
  const [isPressed, setIsPressed] = useState(false); // Only for button UI

  // Refs for high-performance updates
  const containerRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const netForceRef = useRef<HTMLDivElement>(null);
  
  // High-performance DOM refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const motionVectorRef = useRef<HTMLDivElement>(null);

  // Physics State Refs
  const altitudeRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const currentThrustRef = useRef(0);
  const isIgnitedRef = useRef(false);
  const thrustPowerRef = useRef(800);

  useEffect(() => {
    let animationFrame: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const particles: { x: number; y: number; vy: number; vx: number; life: number; color: string }[] = [];

    const update = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.016);
      lastTimeRef.current = time;

      const g = 9.8;
      const weight = mass * g;
      const thrust = isIgnitedRef.current ? thrustPowerRef.current : 0;
      currentThrustRef.current += (thrust - currentThrustRef.current) * 0.2;
      
      const netForce = thrust - weight;
      const acceleration = netForce / mass;

      velocityRef.current += acceleration * dt;
      altitudeRef.current += velocityRef.current * dt;
      
      if (altitudeRef.current <= 0) {
        altitudeRef.current = 0;
        if (velocityRef.current < 0) velocityRef.current = 0;
      }

      // Update Telemetry (Direct DOM)
      const vel = velocityRef.current;
      const alt = altitudeRef.current;
      if (altRef.current) altRef.current.innerText = `${alt.toFixed(1)}m`;
      if (velRef.current) {
        velRef.current.innerText = `${Math.abs(vel).toFixed(1)}m/s`;
        velRef.current.style.color = vel > 0.1 ? "#34d399" : vel < -0.1 ? "#ff85a2" : "#ffffff";
      }
      
      if (statusRef.current) {
        let status = "LANDED";
        let color = "rgba(255,255,255,0.2)";

        if (alt > 0.1) {
          if (isIgnitedRef.current && netForce > 0) {
            status = "POWERED ASCENT";
            color = "#3b82f6";
          } else if (vel > 0.1) {
            status = "COASTING UPWARD";
            color = "#34d399";
          } else if (Math.abs(vel) <= 0.1) {
            status = "APEX";
            color = "#fbbf24";
          } else {
            status = "DESCENDING";
            color = "#ff85a2";
          }
        } else if (isIgnitedRef.current && netForce <= 0) {
          status = "THRUST ACTIVE (STATIC)";
          color = "#3b82f6";
        }

        statusRef.current.innerText = status;
        statusRef.current.style.color = color;
      }

      if (netForceRef.current) {
         netForceRef.current.innerHTML = `
            <div class="flex flex-col items-end gap-1">
               <div class="flex gap-4 text-[10px] font-mono">
                  <span class="text-[#3b82f6]">F<sub>t</sub>: ${thrust.toFixed(0)}N</span>
                  <span class="text-[#ff85a2]">W: ${weight.toFixed(1)}N</span>
               </div>
               <div class="text-emerald-400 font-bold">${netForce.toFixed(1)}N</div>
               <div class="text-[9px] text-white/40">a: ${acceleration.toFixed(2)}m/s²</div>
            </div>
         `;
      }

      // Visualizer Visibility (Direct DOM)
      if (visualizerRef.current) {
        const targetOpacity = isIgnitedRef.current ? 1 : 0;
        const currentOpacity = parseFloat(visualizerRef.current.style.opacity || "0");
        visualizerRef.current.style.opacity = (currentOpacity + (targetOpacity - currentOpacity) * 0.1).toString();
        visualizerRef.current.style.transform = `translate(-50%, ${isIgnitedRef.current ? 0 : -20}px)`;
        
        const eq = visualizerRef.current.querySelector('.equation');
        if (eq) eq.innerHTML = `F<sub>exhaust</sub> (${thrust.toFixed(0)}N) = -F<sub>thrust</sub>`;
      }

      // Motion Vector (Direct DOM)
      if (motionVectorRef.current) {
         motionVectorRef.current.style.height = `${(currentThrustRef.current / thrustPowerRef.current) * 100}%`;
         motionVectorRef.current.style.backgroundColor = isIgnitedRef.current ? "#3b82f6" : "#4ade80";
      }

      // Parallax Stars
      if (skyRef.current) {
        skyRef.current.style.transform = `translate3d(0, ${(alt * 10) % 1000}px, 0)`;
      }

      // Rocket Movement
      if (rocketRef.current) {
        const vShake = isIgnitedRef.current ? (Math.random() - 0.5) * 4 : 0;
        const visualY = alt > 200 ? 0 : -Math.min(alt * 1.5, 300);
        rocketRef.current.style.transform = `translate3d(${vShake}px, ${visualY + vShake}px, 0)`;
        
        const vanesUp = rocketRef.current.querySelectorAll('.vane-up');
        const vanesDown = rocketRef.current.querySelectorAll('.vane-down');
        
        const isAscending = vel > 0.5;
        const isDescending = vel < -0.5 && alt > 0.1;

        vanesUp.forEach(v => (v as HTMLElement).style.opacity = isAscending ? "1" : "0.05");
        vanesDown.forEach(v => (v as HTMLElement).style.opacity = isDescending ? "1" : "0.05");
      }

      // Camera Shake
      if (containerRef.current) {
        const cShake = (Math.random() - 0.5) * (thrust / 150);
        containerRef.current.style.transform = `translate3d(0, ${cShake}px, 0)`;
      }

      // Canvas Particles
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (thrust > 50) {
          for (let i = 0; i < Math.floor(thrust / 150); i++) {
            particles.push({
              x: canvas.width / 2 + (Math.random() - 0.5) * 30,
              y: 0,
              vy: 5 + Math.random() * 10,
              vx: (Math.random() - 0.5) * 4,
              life: 1,
              color: Math.random() > 0.5 ? "#ff85a2" : "#fbbf24"
            });
          }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 0.03;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          p.x += p.vx;
          p.y += p.vy;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.life * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [mass]);

  const toggleIgnition = (state: boolean) => {
    isIgnitedRef.current = state;
    setIsPressed(state);
  };

  const handleReset = () => {
    altitudeRef.current = 0;
    velocityRef.current = 0;
    lastTimeRef.current = 0;
    currentThrustRef.current = 0;
    isIgnitedRef.current = false;
    setIsPressed(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#050a10] rounded-[40px] border-4 border-white/5 overflow-hidden relative font-sans transition-transform duration-75">
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 border-[20px] border-black/20">
         <div className="w-full h-full border border-white/5 grid grid-cols-12 grid-rows-12 opacity-10">
            {[...Array(144)].map((_, i) => <div key={i} className="border border-white/5" />)}
         </div>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-4 z-10">
        {/* Main Viewport */}
        <div className="flex-1 relative rounded-[30px] bg-gradient-to-b from-[#0a1118] to-[#1a2a3a] border-2 border-white/10 overflow-hidden flex flex-col items-center justify-end pb-24 shadow-inner">
          <div 
            ref={skyRef}
            className="absolute inset-0 opacity-40 will-change-transform" 
            style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px), radial-gradient(circle, #fff 0.5px, transparent 0.5px)',
                backgroundSize: '80px 80px, 40px 40px',
                backgroundPosition: '0 0, 20px 20px',
                backgroundRepeat: 'repeat'
            }} 
          />

          {/* HUD: Motion Vector */}
          <div className="absolute top-1/2 left-12 -translate-y-1/2 flex flex-col items-center gap-8 opacity-20">
             <div className="w-1.5 h-32 bg-white/10 rounded-full relative overflow-hidden">
                <div ref={motionVectorRef} className="absolute bottom-0 left-0 w-full bg-emerald-400 transition-all duration-75" style={{ height: '0%' }} />
             </div>
             <p className="rotate-[-90deg] text-[8px] font-black tracking-widest text-white/40">THRUST VECTOR</p>
          </div>

          {/* Action-Reaction Visualizer (Zero-Render) */}
          <div ref={visualizerRef} className="absolute left-1/2 -translate-x-1/2 top-1/4 w-full max-w-md pointer-events-none transition-all duration-300 opacity-0 flex flex-col items-center gap-12">
            <div className="flex items-center gap-24">
               <div className="flex flex-col items-center">
                  <ArrowUp className="w-10 h-10 text-[#3b82f6] animate-bounce" />
                  <span className="text-[9px] font-black text-[#3b82f6] uppercase tracking-[0.3em] bg-black/60 px-3 py-1 rounded-full border border-[#3b82f6]/20">Reaction Force</span>
               </div>
               <div className="flex flex-col items-center">
                  <ArrowDown className="w-10 h-10 text-[#ff85a2] animate-bounce" />
                  <span className="text-[9px] font-black text-[#ff85a2] uppercase tracking-[0.3em] bg-black/60 px-3 py-1 rounded-full border border-[#ff85a2]/20">Action Force</span>
               </div>
            </div>
            <div className="equation text-lg font-black text-white/60 tracking-widest uppercase">
               F<sub>exhaust</sub> = -F<sub>thrust</sub>
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full border border-white/5 text-center max-w-xs leading-relaxed">
               As the rocket pushes exhaust gases downward (Action), the gases push the rocket upward (Reaction) with equal force.
            </div>
          </div>

          {/* Meters */}
          <div className="absolute top-6 left-6 flex flex-col gap-3">
            <div className="bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl min-w-[150px]">
               <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">ALTITUDE METER</p>
               <span ref={altRef} className="text-3xl font-mono font-bold text-emerald-400">0.0m</span>
            </div>
            <div className="bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl min-w-[150px]">
               <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">VELOCITY VECTOR</p>
               <span ref={velRef} className="text-3xl font-mono font-bold text-white tracking-tighter">0.0m/s</span>
            </div>
          </div>

          {/* Flight Status */}
          <div className="absolute top-6 right-6 flex flex-col gap-3">
            <div className="bg-black/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 flex flex-col items-end shadow-2xl">
               <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">FLIGHT STATUS</p>
               <span ref={statusRef} className="text-[11px] font-black text-white/20 uppercase tracking-widest">IDLE</span>
            </div>
            <div className={cn(
              "bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl border flex items-center gap-3 transition-all duration-300",
              isPressed ? "border-[#3b82f6]/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-white/5 opacity-50"
            )}>
               <div className={cn("w-2 h-2 rounded-full", isPressed ? "bg-[#3b82f6] animate-pulse" : "bg-white/20")} />
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                 THRUST: {isPressed ? "ON" : "OFF"}
               </span>
            </div>
          </div>

          {/* Directional Vanes */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1/2 w-48 h-64 pointer-events-none flex justify-between items-center z-0">
             <div className="flex flex-col gap-4 items-center">
                <ArrowUp className="vane-up w-8 h-8 text-emerald-400 opacity-10 transition-opacity" />
                <ArrowDown className="vane-down w-8 h-8 text-[#ff85a2] opacity-10 transition-opacity" />
             </div>
             <div className="flex flex-col gap-4 items-center">
                <ArrowUp className="vane-up w-8 h-8 text-emerald-400 opacity-10 transition-opacity" />
                <ArrowDown className="vane-down w-8 h-8 text-[#ff85a2] opacity-10 transition-opacity" />
             </div>
          </div>

          {/* The Rocket */}
          <div ref={rocketRef} className="relative z-10 w-24 h-48 flex flex-col items-center will-change-transform">
             <div className="w-16 h-40 bg-gradient-to-b from-[#3b82f6] to-[#1e40af] rounded-t-[50px] rounded-b-[20px] relative shadow-2xl border-b-8 border-black/20">
                <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col gap-4">
                   <div className="w-6 h-6 rounded-full bg-[#050a10] border-2 border-white/20 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                   </div>
                </div>
                <div className="absolute -left-6 bottom-2 w-8 h-20 bg-[#ff85a2] rounded-l-full rounded-tr-[15px] border-r-4 border-black/10 shadow-lg" />
                <div className="absolute -right-6 bottom-2 w-8 h-20 bg-[#ff85a2] rounded-r-full rounded-tl-[15px] border-l-4 border-black/10 shadow-lg" />
                
                {/* Engine Nozzle */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-zinc-700 rounded-full" />
                
                {/* Engine Glow */}
                <div className={cn(
                  "absolute -bottom-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-500 blur-3xl transition-opacity duration-300 pointer-events-none",
                  isPressed ? "opacity-100" : "opacity-0"
                )} />
             </div>
             
             {/* Canvas Particles */}
             <canvas 
               ref={canvasRef} 
               width={400} 
               height={600} 
               className="absolute top-[85%] left-1/2 -translate-x-1/2 pointer-events-none" 
             />
          </div>
        </div>

        {/* Physics Analysis Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col gap-4">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Net Force Analysis (F = ma)</p>
             <div ref={netForceRef} className="flex-1 flex items-center justify-end">
                {/* Dynamically updated */}
                <div className="text-white/20 font-mono italic text-xs text-right">Calculating vectors...</div>
             </div>
          </div>

          <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col gap-2">
             <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Conservation of Momentum</p>
             <p className="text-[11px] text-white/50 leading-relaxed italic">
               The rocket continues upward even after thrust cutoff due to its momentum ($p = mv$). Gravity must work to decelerate this velocity to zero before the rocket falls.
             </p>
          </div>

          <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col justify-center">
            <ClickableValue 
                label="Rocket Mass (m)"
                value={mass}
                unit="kg"
                min={5}
                max={50}
                onChange={setMass}
                colorClass="text-emerald-400"
              />
          </div>
        </div>

        {/* Master Control */}
        <div className="flex items-center gap-4 mt-2">
            <button 
              onMouseDown={() => toggleIgnition(true)}
              onMouseUp={() => toggleIgnition(false)}
              onMouseLeave={() => toggleIgnition(false)}
              onTouchStart={() => toggleIgnition(true)}
              onTouchEnd={() => toggleIgnition(false)}
              className={cn(
                "flex-1 py-8 rounded-[30px] font-black text-lg uppercase tracking-[0.3em] transition-all duration-300 relative overflow-hidden group select-none active:scale-[0.95]",
                isPressed 
                  ? "bg-[#3b82f6] text-white shadow-[0_0_80px_rgba(59,130,246,0.4)]" 
                  : "bg-white/5 text-white/30 border-2 border-white/5 hover:border-white/20 hover:bg-white/10"
              )}
            >
               <div className="relative z-10 flex items-center justify-center gap-4 pointer-events-none">
                  <Flame className={cn("w-6 h-6", isPressed && "animate-bounce text-orange-300")} />
                  {isPressed ? "THRUST ACTIVE" : "HOLD TO IGNITE"}
               </div>
               {isPressed && (
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
               )}
            </button>
            
            <button 
              onClick={handleReset}
              className="w-24 py-8 rounded-[30px] bg-white/5 text-white/20 hover:text-white flex items-center justify-center border border-white/5 transition-all"
            >
               <RefreshCcw className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

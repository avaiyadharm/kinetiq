"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Flame, Rocket as RocketIcon, TrendingUp, RefreshCcw, Activity, Info, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClickableValue } from "./shared";

// --- Types & Constants ---
type FlightState = "LANDED" | "POWERED ASCENT" | "COASTING UPWARD" | "APEX" | "DESCENDING";

const G = 9.8;
const MAX_DATA_POINTS = 100;

// --- Helper Components ---

const LiveGraph = ({ data, label, color, min, max, unit }: { data: number[], label: string, color: string, min: number, max: number, unit: string }) => {
  const points = data.map((v, i) => {
    const x = (i / (MAX_DATA_POINTS - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 flex-1 min-w-[120px]">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{label}</span>
        <span className="text-[10px] font-mono text-white/60">{data[data.length - 1]?.toFixed(1)}{unit}</span>
      </div>
      <div className="h-12 w-full relative overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            className="transition-all duration-100"
          />
        </svg>
      </div>
    </div>
  );
};

export const ActionReactionDemo: React.FC = () => {
  // User Inputs
  const [mass, setMass] = useState(15);
  const [isPressed, setIsPressed] = useState(false);

  // Refs for high-performance updates
  const containerRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const netForceRef = useRef<HTMLDivElement>(null);
  const interpretRef = useRef<HTMLDivElement>(null);
  
  // Visual Refs
  const visualizerRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);
  const flameCoreRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Physics State Refs
  const altitudeRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isIgnitedRef = useRef(false);
  const thrustPowerRef = useRef(250); // Improved scaling

  // Graph Data States (React states for graph re-renders, but throttled)
  const [graphs, setGraphs] = useState({
    alt: [] as number[],
    vel: [] as number[],
    acc: [] as number[]
  });

  useEffect(() => {
    let animationFrame: number;
    let lastGraphUpdate = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const particles: { x: number; y: number; vy: number; vx: number; life: number; color: string }[] = [];

    const update = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.016);
      lastTimeRef.current = time;

      // --- Physics Core ---
      const weight = mass * G;
      const thrust = isIgnitedRef.current ? thrustPowerRef.current : 0;
      const netForce = thrust - weight;
      const acceleration = netForce / mass;

      // Update Motion
      velocityRef.current += acceleration * dt;
      altitudeRef.current += velocityRef.current * dt;
      
      // Ground Collision
      if (altitudeRef.current <= 0) {
        altitudeRef.current = 0;
        if (velocityRef.current < 0) velocityRef.current = 0;
      }

      // --- State Logic ---
      let status: FlightState = "LANDED";
      let interpretation = "Rocket is stationary on the launch pad. Forces are balanced by ground support.";
      let statusColor = "rgba(255,255,255,0.2)";

      if (altitudeRef.current > 0.1) {
        if (isIgnitedRef.current) {
          status = "POWERED ASCENT";
          interpretation = "ENGINE ACTIVE: Rocket pushes gas down (Action). Gas pushes rocket up (Reaction). Result: Positive Acceleration.";
          statusColor = "#3b82f6";
        } else if (velocityRef.current > 0.1) {
          status = "COASTING UPWARD";
          interpretation = "THRUST OFF: Engine stopped. Rocket continues rising due to INERTIA. Gravity is decelerating the rocket.";
          statusColor = "#a855f7";
        } else if (Math.abs(velocityRef.current) <= 0.1) {
          status = "APEX";
          interpretation = "VELOCITY ZERO: Gravity has canceled out upward momentum. Rocket is at maximum altitude.";
          statusColor = "#fbbf24";
        } else {
          status = "DESCENDING";
          interpretation = "GRAVITY DOMINANT: Rocket is falling. Acceleration is constant -9.8m/s² downward.";
          statusColor = "#ff85a2";
        }
      } else if (isIgnitedRef.current && netForce <= 0) {
        status = "POWERED ASCENT"; // Though it might not move if mass is too high
        interpretation = "THRUST ACTIVE: Insufficient force to overcome weight. Static equilibrium.";
      }

      // --- Telemetry Updates (Direct DOM) ---
      if (altRef.current) altRef.current.innerText = `${altitudeRef.current.toFixed(1)}m`;
      if (velRef.current) {
        velRef.current.innerText = `${velocityRef.current.toFixed(1)}m/s`;
        velRef.current.style.color = velocityRef.current > 0.1 ? "#3b82f6" : velocityRef.current < -0.1 ? "#ff85a2" : "#ffffff";
      }
      if (statusRef.current) {
        statusRef.current.innerText = status;
        statusRef.current.style.color = statusColor;
      }
      if (interpretRef.current) {
        interpretRef.current.innerText = interpretation;
      }

      // Net Force Analysis Panel
      if (netForceRef.current) {
        netForceRef.current.innerHTML = `
          <div class="flex flex-col items-end gap-2">
            <div class="flex gap-4 text-[10px] font-mono">
              <span class="text-[#3b82f6] ${thrust === 0 ? 'opacity-20' : 'opacity-100'} transition-opacity">F<sub>thrust</sub>: ${thrust.toFixed(0)}N</span>
              <span class="text-[#ff85a2]">W (mg): ${weight.toFixed(1)}N</span>
            </div>
            <div class="text-white font-black text-xl tracking-tighter">F<sub>net</sub>: <span class="${netForce > 0 ? 'text-[#3b82f6]' : 'text-[#ff85a2]'}">${netForce.toFixed(1)}N</span></div>
            <div class="text-[10px] font-mono text-white/40">a: ${acceleration.toFixed(2)}m/s²</div>
          </div>
        `;
      }

      // --- Visual Logic ---
      
      // Action/Reaction Visualizer - ONLY visible during thrust
      if (visualizerRef.current) {
        const targetOpacity = isIgnitedRef.current ? 1 : 0;
        const currentOpacity = parseFloat(visualizerRef.current.style.opacity || "0");
        visualizerRef.current.style.opacity = (currentOpacity + (targetOpacity - currentOpacity) * 0.15).toString();
        visualizerRef.current.style.transform = `translate(-50%, ${isIgnitedRef.current ? 0 : -20}px)`;
      }

      // Flame & Exhaust - ONLY during thrust
      if (flameRef.current && flameCoreRef.current) {
        if (isIgnitedRef.current) {
          const flicker = 0.8 + Math.random() * 0.4;
          flameRef.current.style.opacity = "1";
          flameRef.current.style.transform = `scale(${flicker})`;
          flameCoreRef.current.style.transform = `scaleY(${1.2 + Math.random() * 0.5})`;
        } else {
          flameRef.current.style.opacity = "0";
        }
      }

      // Parallax Background
      if (skyRef.current) {
        skyRef.current.style.transform = `translate3d(0, ${(altitudeRef.current * 2) % 1000}px, 0)`;
      }

      // Rocket Movement
      if (rocketRef.current) {
        const vShake = isIgnitedRef.current ? (Math.random() - 0.5) * 4 : 0;
        const viewportHeight = 400; // estimated
        const visualY = -Math.min(altitudeRef.current * 0.8, 300); // Scaled for visual clarity
        rocketRef.current.style.transform = `translate3d(${vShake}px, ${visualY + vShake}px, 0)`;
      }

      // Camera Shake
      if (containerRef.current) {
        const cShake = isIgnitedRef.current ? (Math.random() - 0.5) * (thrust / 100) : 0;
        containerRef.current.style.transform = `translate3d(0, ${cShake}px, 0)`;
      }

      // --- Particle System ---
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (isIgnitedRef.current) {
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: canvas.width / 2 + (Math.random() - 0.5) * 20,
              y: 0,
              vy: 8 + Math.random() * 12,
              vx: (Math.random() - 0.5) * 6,
              life: 1,
              color: Math.random() > 0.5 ? "#3b82f6" : "#ffffff"
            });
          }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 0.025;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          p.x += p.vx;
          p.y += p.vy;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.life * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Graph Throttled Update ---
      if (time - lastGraphUpdate > 100) {
        setGraphs(prev => ({
          alt: [...prev.alt.slice(-(MAX_DATA_POINTS - 1)), altitudeRef.current],
          vel: [...prev.vel.slice(-(MAX_DATA_POINTS - 1)), velocityRef.current],
          acc: [...prev.acc.slice(-(MAX_DATA_POINTS - 1)), acceleration]
        }));
        lastGraphUpdate = time;
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
    isIgnitedRef.current = false;
    setIsPressed(false);
    setGraphs({ alt: [], vel: [], acc: [] });
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#050a10] rounded-[40px] border-4 border-white/5 overflow-hidden relative font-sans transition-transform duration-75">
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 border-[20px] border-black/20">
         <div className="w-full h-full border border-white/5 grid grid-cols-12 grid-rows-12 opacity-10">
            {[...Array(144)].map((_, i) => <div key={i} className="border border-white/5" />)}
         </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-3 z-10 overflow-y-auto custom-scrollbar">
        {/* Main Viewport */}
        <div className="h-[320px] relative rounded-[30px] bg-gradient-to-b from-[#0a1118] to-[#1a2a3a] border-2 border-white/10 overflow-hidden flex flex-col items-center justify-end pb-16 shadow-inner shrink-0">
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

          {/* Action-Reaction Visualizer (ONLY during thrust) */}
          <div ref={visualizerRef} className="absolute left-1/2 -translate-x-1/2 top-1/6 w-full max-w-md pointer-events-none transition-all duration-300 opacity-0 flex flex-col items-center gap-4 z-30">
            <div className="flex items-center gap-24">
               <div className="flex flex-col items-center gap-1">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <ArrowUp className="w-8 h-8 text-[#3b82f6] drop-shadow-[0_0_10px_#3b82f6]" />
                  </motion.div>
                  <span className="text-[8px] font-black text-[#3b82f6] uppercase tracking-[0.2em] bg-black/80 px-3 py-1 rounded-full border border-[#3b82f6]/40 shadow-xl">REACTION</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <ArrowDown className="w-8 h-8 text-[#ff85a2] drop-shadow-[0_0_10px_#ff85a2]" />
                  </motion.div>
                  <span className="text-[8px] font-black text-[#ff85a2] uppercase tracking-[0.2em] bg-black/80 px-3 py-1 rounded-full border border-[#ff85a2]/40 shadow-xl">ACTION</span>
               </div>
            </div>
            <div className="bg-black/80 border border-white/10 px-6 py-2 rounded-full backdrop-blur-xl">
               <p className="text-sm font-mono font-black text-white tracking-widest uppercase">
                  F<sub>exhaust</sub> = -F<sub>thrust</sub>
               </p>
            </div>
          </div>

          {/* Telemetry HUD */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 min-w-[120px]">
               <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">ALTITUDE</p>
               <span ref={altRef} className="text-2xl font-mono font-bold text-white">0.0m</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 min-w-[120px]">
               <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">VELOCITY</p>
               <span ref={velRef} className="text-2xl font-mono font-bold text-white">0.0m/s</span>
            </div>
          </div>

          {/* Flight State HUD */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-30">
            <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex flex-col items-end">
               <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">SIM STATE</p>
               <span ref={statusRef} className="text-[10px] font-black uppercase tracking-widest text-white/40">LANDED</span>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-xl border flex items-center gap-3 transition-all duration-300 backdrop-blur-md",
              isPressed ? "bg-[#3b82f6]/20 border-[#3b82f6]/50 shadow-lg" : "bg-black/60 border-white/5 opacity-50"
            )}>
               <Activity className={cn("w-3 h-3", isPressed ? "text-[#3b82f6] animate-pulse" : "text-white/20")} />
               <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                 THRUST: {isPressed ? "ACTIVE" : "OFF"}
               </span>
            </div>
          </div>

          {/* The Rocket */}
          <div ref={rocketRef} className="relative z-10 w-20 h-32 flex flex-col items-center will-change-transform">
             <div className="w-12 h-32 bg-gradient-to-b from-[#3b82f6] to-[#1e40af] rounded-t-[40px] rounded-b-[15px] relative shadow-2xl border-b-4 border-black/20">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col gap-3">
                   <div className="w-4 h-4 rounded-full bg-[#050a10] border border-white/20 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                   </div>
                </div>
                <div className="absolute -left-4 bottom-2 w-6 h-16 bg-[#3b82f6] rounded-l-full rounded-tr-[10px] border-r-2 border-black/10 shadow-lg" />
                <div className="absolute -right-4 bottom-2 w-6 h-16 bg-[#3b82f6] rounded-r-full rounded-tl-[10px] border-l-2 border-black/10 shadow-lg" />
                
                {/* Engine Nozzle */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-zinc-800 rounded-full" />
                
                {/* Engine Flame (ONLY during thrust) */}
                <div ref={flameRef} className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-12 h-32 flex flex-col items-center opacity-0 pointer-events-none will-change-transform z-0">
                   <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-500/40 to-blue-300 rounded-full blur-2xl" />
                   <div className="absolute top-0 w-8 h-24 bg-gradient-to-t from-transparent via-blue-500 to-cyan-300 rounded-full blur-md" />
                   <div ref={flameCoreRef} className="absolute top-0 w-4 h-16 bg-white rounded-full blur-[2px] origin-top" />
                </div>
             </div>
             
             {/* Exhaust Particles (ONLY during thrust) */}
             <canvas 
               ref={canvasRef} 
               width={300} 
               height={500} 
               className="absolute top-[85%] left-1/2 -translate-x-1/2 pointer-events-none" 
             />
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <LiveGraph data={graphs.alt} label="Altitude Profile" color="#3b82f6" min={0} max={500} unit="m" />
          <LiveGraph data={graphs.vel} label="Velocity Vector" color="#a855f7" min={-50} max={80} unit="m/s" />
          <LiveGraph data={graphs.acc} label="Acceleration G" color="#ff85a2" min={-15} max={15} unit="m/s²" />
        </div>

        {/* Analysis & Interpretation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 shrink-0">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <Gauge className="w-3 h-3 text-white/40" />
                <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Force Analysis</p>
             </div>
             <div ref={netForceRef} className="flex-1 flex items-center justify-end">
                <div className="text-white/20 font-mono italic text-[9px]">Waiting...</div>
             </div>
          </div>

          <div className="bg-primary/5 p-3 rounded-2xl border border-primary/20 flex flex-col gap-1.5">
             <div className="flex items-center gap-2">
                <Info className="w-3 h-3 text-primary" />
                <p className="text-[8px] text-primary uppercase tracking-widest font-black">Interpretation</p>
             </div>
             <p ref={interpretRef} className="text-[10px] text-white/60 leading-tight font-medium">
               Select mass and hold trigger to begin.
             </p>
          </div>

          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
            <ClickableValue 
                label="Mass (m)"
                value={mass}
                unit="kg"
                min={5}
                max={50}
                onChange={setMass}
                colorClass="text-[#3b82f6]"
              />
          </div>
        </div>

        {/* Control Interface */}
        <div className="flex items-center gap-3 shrink-0">
            <button 
              onMouseDown={() => toggleIgnition(true)}
              onMouseUp={() => toggleIgnition(false)}
              onMouseLeave={() => toggleIgnition(false)}
              onTouchStart={() => toggleIgnition(true)}
              onTouchEnd={() => toggleIgnition(false)}
              className={cn(
                "flex-1 py-5 rounded-[20px] font-black text-base uppercase tracking-[0.3em] transition-all duration-300 relative overflow-hidden group select-none active:scale-[0.98]",
                isPressed 
                  ? "bg-[#3b82f6] text-white shadow-[0_0_100px_rgba(59,130,246,0.3)]" 
                  : "bg-white/5 text-white/20 border border-white/5 hover:border-white/10 hover:text-white/40"
              )}
            >
               <div className="relative z-10 flex items-center justify-center gap-3">
                  <Flame className={cn("w-4 h-4", isPressed && "animate-pulse")} />
                  {isPressed ? "THRUST ACTIVE" : "HOLD TO IGNITE"}
               </div>
               
               {isPressed && (
                 <motion.div 
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                   animate={{ x: ['-100%', '200%'] }}
                   transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 />
               )}
            </button>
            
            <button 
              onClick={handleReset}
              className="w-20 py-6 rounded-[25px] bg-white/5 text-white/10 hover:text-white/40 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-all"
            >
               <RefreshCcw className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { RotateCcw, Play, Pause, SkipForward, BarChart2, Info, List, Settings } from "lucide-react";
import { SimulationPageLayout } from "@/components/simulations/SimulationPageLayout";
import { ProjectileMotionCanvas } from "@/components/simulations/ProjectileMotionCanvas";
import { ProjectileControlPanel } from "@/components/simulations/ProjectileControlPanel";
import { TrajectoryGraph } from "@/components/simulations/TrajectoryGraph";

export default function ProjectileMotionPage() {
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(15);
  const [mass, setMass] = useState(10);
  const [gravity, setGravity] = useState(9.81);
  const [airResistance, setAirResistance] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Real-time calculated values from Simulation
  const [stats, setStats] = useState({
    time: 0,
    range: 0,
    maxHeight: 0
  });

  // THEORETICAL PREDICTIONS (Based on the formulas)
  const theoreticalStats = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(rad);
    const vy = velocity * Math.sin(rad);
    
    // T = 2u sin θ / g
    const t = Math.max(0, (2 * vy) / gravity);
    // R = u² sin 2θ / g
    const r = (Math.pow(velocity, 2) * Math.sin(2 * rad)) / gravity;
    // H = u² sin² θ / 2g
    const h = (Math.pow(velocity, 2) * Math.pow(Math.sin(rad), 2)) / (2 * gravity);
    
    return { time: t, range: r, maxHeight: h };
  }, [angle, velocity, gravity]);

  // Which stats to display in the Bento Cards
  // ALWAYS show the predictive/theoretical stats when not playing to ensure instant accuracy.
  // Switch to live 'stats' only when the simulation is active.
  const displayStats = isPlaying ? stats : theoreticalStats;
  const isPredictive = !isPlaying;

  const handleUpdateStats = useCallback((newStats: { time: number; range: number; maxHeight: number }) => {
    setStats(newStats);
  }, []);

  const handleSimulationEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2);

  return (
    <SimulationPageLayout title="Projectile Motion">
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
        {/* Top Data Dashboard - Bento Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-black/40 border-b border-white/5 backdrop-blur-sm shadow-sm">
          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#27272a] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <RotateCcw className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">Simulation Time</span>
              {isPredictive && <span className="text-[8px] font-bold text-primary/40 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">TARGET</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{displayStats.time.toFixed(2)}</span>
              <span className="text-xs font-bold text-white/40">seconds</span>
            </div>
          </div>
          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#27272a] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart2 className="w-8 h-8 text-success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-success text-[10px] font-bold uppercase tracking-[0.2em]">Horizontal Range</span>
              {isPredictive && <span className="text-[8px] font-bold text-success/40 bg-success/5 px-1.5 py-0.5 rounded border border-success/10">TARGET</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{displayStats.range.toFixed(1)}</span>
              <span className="text-xs font-bold text-white/40">meters</span>
            </div>
          </div>
          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#27272a] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Info className="w-8 h-8 text-accent" />
            </div>
            <div className="flex items-center justify-between">
               <span className="text-accent text-[10px] font-bold uppercase tracking-[0.2em]">Peak Altitude</span>
               {isPredictive && <span className="text-[8px] font-bold text-accent/40 bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10">TARGET</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{displayStats.maxHeight.toFixed(1)}</span>
              <span className="text-xs font-bold text-white/40">meters</span>
            </div>
          </div>
          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group hover:bg-[#27272a] transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <List className="w-8 h-8 text-white/20" />
            </div>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Initial Energy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{kineticEnergy.toFixed(1)}</span>
              <span className="text-xs font-bold text-white/40">joules</span>
            </div>
          </div>
        </div>

        {/* The Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-black/20">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
          
          <ProjectileMotionCanvas 
            angle={angle} 
            velocity={velocity} 
            mass={mass}
            gravity={gravity}
            airResistance={airResistance}
            isPlaying={isPlaying}
            showPath={showPath}
            onUpdateStats={handleUpdateStats}
            onSimulationEnd={handleSimulationEnd}
          />
          
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 rounded-2xl bg-[#18181b]/80 backdrop-blur-xl border border-white/10 z-20 shadow-2xl">
             <button 
              onClick={() => {
                setIsPlaying(false);
                setStats({ time: 0, range: 0, maxHeight: 0 });
              }}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all active:scale-90"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 flex items-center justify-center rounded-xl bg-primary text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all active:scale-90" title="Step Forward">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Bottom Panel - Bento Grid Layout */}
        <div className="h-[40%] border-t border-white/5 bg-black p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
          {/* Controls Column */}
          <section className="bg-[#09090b] rounded-2xl p-6 border border-white/5 flex flex-col h-full">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Variable Injection
            </h3>
            <ProjectileControlPanel 
              angle={angle} setAngle={setAngle}
              velocity={velocity} setVelocity={setVelocity}
              mass={mass} setMass={setMass}
              gravity={gravity} setGravity={setGravity}
              airResistance={airResistance} setAirResistance={setAirResistance}
              showPath={showPath} setShowPath={setShowPath}
            />
          </section>

          {/* Graph Column */}
          <section className="bg-[#09090b] rounded-2xl p-6 border border-white/5 h-full relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-success" />
              Trajectory Analysis
            </h3>
            <div className="flex-1 min-h-[200px]">
              <TrajectoryGraph angle={angle} velocity={velocity} gravity={gravity} />
            </div>
          </section>

          {/* System Logs Column */}
          <section className="bg-[#09090b] rounded-2xl p-6 border border-white/5 flex flex-col h-full relative overflow-hidden">
             <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <List className="w-4 h-4 text-accent" />
                System Diagnostics
             </h3>
             <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] text-primary/70 scrollbar-hide">
               <p className="flex gap-2"><span className="opacity-40">08:30:12</span> <span className="text-success">OK</span> Gravity vector locked: 9.81 m/s²</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:12</span> <span className="text-success">OK</span> Atmosphere: Standard Pressure</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:14</span> <span className={`${airResistance ? 'text-success' : 'text-accent'}`}>{airResistance ? 'OK' : 'WRN'}</span> Air resistance {airResistance ? 'enabled' : 'disabled'}</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:15</span> <span className="text-white/40">INF</span> Mass current: {mass} kg</p>
               <div className="pt-2 border-t border-white/5 animate-pulse">
                 <p className="text-white/10">{isPlaying ? '> Simulating vector flow_' : '> Awaiting user trigger_'}</p>
               </div>
             </div>
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
          </section>
        </div>
      </div>
    </SimulationPageLayout>
  );
}

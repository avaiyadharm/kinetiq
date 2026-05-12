"use client";

import React, { useState } from "react";
import { RotateCcw, Play, Pause, SkipForward, Info, BarChart2, List, Settings } from "lucide-react";
import { SimulationPageLayout } from "@/components/simulations/SimulationPageLayout";
import { ProjectileMotionCanvas } from "@/components/simulations/ProjectileMotionCanvas";
import { ProjectileControlPanel } from "@/components/simulations/ProjectileControlPanel";
import { TrajectoryGraph } from "@/components/simulations/TrajectoryGraph";

export default function ProjectileMotionPage() {
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(15);
  const [mass, setMass] = useState(10);
  const [airResistance, setAirResistance] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Real-time calculated values
  const time = 1.2; // Mock value
  const range = 14.5; // Mock value
  const maxHeight = 8.2; // Mock value

  return (
    <SimulationPageLayout title="Projectile Motion">
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/30">
        {/* Top Data Dashboard - Bento Style */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-white border-b border-border shadow-sm">
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-col gap-1 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <RotateCcw className="w-8 h-8 text-primary" />
            </div>
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">Simulation Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground font-mono">{time.toFixed(2)}</span>
              <span className="text-xs font-bold text-foreground/40">seconds</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-col gap-1 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart2 className="w-8 h-8 text-success" />
            </div>
            <span className="text-success text-[10px] font-bold uppercase tracking-[0.2em]">Horizontal Range</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground font-mono">{range.toFixed(1)}</span>
              <span className="text-xs font-bold text-foreground/40">meters</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-col gap-1 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Info className="w-8 h-8 text-accent" />
            </div>
            <span className="text-accent text-[10px] font-bold uppercase tracking-[0.2em]">Peak Altitude</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground font-mono">{maxHeight.toFixed(1)}</span>
              <span className="text-xs font-bold text-foreground/40">meters</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border flex flex-col gap-1 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <List className="w-8 h-8 text-foreground/40" />
            </div>
            <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-[0.2em]">Kinetic Energy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground font-mono">112.5</span>
              <span className="text-xs font-bold text-foreground/40">joules</span>
            </div>
          </div>
        </div>

        {/* The Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100/50">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
          
          <ProjectileMotionCanvas 
            angle={angle} 
            velocity={velocity} 
            isPlaying={isPlaying}
            showPath={showPath}
          />
          
          {/* Playback Controls Overlay - Premium Floating Bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/90 backdrop-blur-md border border-border z-20 shadow-xl">
             <button 
              onClick={() => setIsPlaying(false)}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 text-foreground/40 hover:text-foreground transition-all active:scale-90"
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
            <button className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 text-foreground/40 hover:text-foreground transition-all active:scale-90" title="Step Forward">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Bottom Panel - Bento Grid Layout */}
        <div className="h-[40%] border-t border-border bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
          {/* Controls Column */}
          <section className="bg-gray-50 rounded-2xl p-6 border border-border flex flex-col h-full">
            <h3 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Variable Injection
            </h3>
            <ProjectileControlPanel 
              angle={angle} setAngle={setAngle}
              velocity={velocity} setVelocity={setVelocity}
              mass={mass} setMass={setMass}
              airResistance={airResistance} setAirResistance={setAirResistance}
              showPath={showPath} setShowPath={setShowPath}
            />
          </section>

          {/* Graph Column */}
          <section className="bg-gray-50 rounded-2xl p-6 border border-border h-full relative overflow-hidden group">
            <h3 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-success" />
              Trajectory Analysis
            </h3>
            <div className="h-[calc(100%-40px)] w-full">
              <TrajectoryGraph angle={angle} velocity={velocity} />
            </div>
          </section>

          {/* System Logs Column */}
          <section className="bg-gray-50 rounded-2xl p-6 border border-border flex flex-col h-full relative overflow-hidden">
             <h3 className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <List className="w-4 h-4 text-accent" />
                System Diagnostics
             </h3>
             <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] text-primary/70 scrollbar-hide">
               <p className="flex gap-2"><span className="opacity-40">08:30:12</span> <span className="text-success">OK</span> Gravity vector locked: 9.81 m/s²</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:12</span> <span className="text-success">OK</span> Atmosphere: Standard Pressure</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:14</span> <span className="text-accent">WRN</span> Air resistance disabled</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:15</span> <span className="text-foreground/40">INF</span> Ready for initial discharge...</p>
               <div className="pt-2 border-t border-border animate-pulse">
                 <p className="text-foreground/20">&gt; Awaiting user trigger_</p>
               </div>
             </div>
             {/* Decorative element */}
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
          </section>
        </div>
      </div>
    </SimulationPageLayout>
  );
}

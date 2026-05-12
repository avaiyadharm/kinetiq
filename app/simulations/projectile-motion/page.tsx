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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#091421]">
        {/* Top Data Dashboard - Bento Style */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-[#050f1c]/50 border-b border-white/5 shadow-inner">
          <div className="bg-[#16202e] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <RotateCcw className="w-8 h-8 text-[#2563eb]" />
            </div>
            <span className="text-[#2563eb] text-[10px] font-bold uppercase tracking-[0.2em]">Simulation Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{time.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#8d90a0]">seconds</span>
            </div>
          </div>
          <div className="bg-[#16202e] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart2 className="w-8 h-8 text-[#6bd8cb]" />
            </div>
            <span className="text-[#6bd8cb] text-[10px] font-bold uppercase tracking-[0.2em]">Horizontal Range</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{range.toFixed(1)}</span>
              <span className="text-xs font-bold text-[#8d90a0]">meters</span>
            </div>
          </div>
          <div className="bg-[#16202e] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Info className="w-8 h-8 text-[#ffb596]" />
            </div>
            <span className="text-[#ffb596] text-[10px] font-bold uppercase tracking-[0.2em]">Peak Altitude</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">{maxHeight.toFixed(1)}</span>
              <span className="text-xs font-bold text-[#8d90a0]">meters</span>
            </div>
          </div>
          <div className="bg-[#16202e] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <List className="w-8 h-8 text-[#c3c6d7]" />
            </div>
            <span className="text-[#c3c6d7] text-[10px] font-bold uppercase tracking-[0.2em]">Kinetic Energy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white font-mono">112.5</span>
              <span className="text-xs font-bold text-[#8d90a0]">joules</span>
            </div>
          </div>
        </div>

        {/* The Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-black/40">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{backgroundImage: 'radial-gradient(circle, #2563eb 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
          
          <ProjectileMotionCanvas 
            angle={angle} 
            velocity={velocity} 
            isPlaying={isPlaying}
            showPath={showPath}
          />
          
          {/* Playback Controls Overlay - Premium Floating Bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 rounded-3xl bg-[#050f1c]/80 backdrop-blur-2xl border border-white/10 z-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             <button 
              onClick={() => setIsPlaying(false)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 text-[#c3c6d7] hover:text-white transition-all active:scale-90"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[#2563eb] text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-blue-900/40"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 text-[#c3c6d7] hover:text-white transition-all active:scale-90" title="Step Forward">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Bottom Panel - Bento Grid Layout */}
        <div className="h-[40%] border-t border-white/5 bg-[#050f1c] p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto shadow-[0_-20px_40px_rgba(0,0,0,0.2)]">
          {/* Controls Column */}
          <section className="bg-[#091421] rounded-2xl p-6 border border-white/5 flex flex-col h-full">
            <h3 className="text-xs font-bold text-[#c3c6d7] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#2563eb]" />
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
          <section className="bg-[#091421] rounded-2xl p-6 border border-white/5 h-full relative overflow-hidden group">
            <h3 className="text-xs font-bold text-[#c3c6d7] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#6bd8cb]" />
              Trajectory Analysis
            </h3>
            <div className="h-[calc(100%-40px)] w-full">
              <TrajectoryGraph angle={angle} velocity={velocity} />
            </div>
          </section>

          {/* System Logs Column */}
          <section className="bg-[#091421] rounded-2xl p-6 border border-white/5 flex flex-col h-full relative overflow-hidden">
             <h3 className="text-xs font-bold text-[#c3c6d7] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <List className="w-4 h-4 text-[#ffb596]" />
                System Diagnostics
             </h3>
             <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] text-[#2563eb]/70 scrollbar-hide">
               <p className="flex gap-2"><span className="opacity-40">08:30:12</span> <span className="text-[#6bd8cb]">OK</span> Gravity vector locked: 9.81 m/s²</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:12</span> <span className="text-[#6bd8cb]">OK</span> Atmosphere: Standard Pressure</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:14</span> <span className="text-[#ffb596]">WRN</span> Air resistance disabled</p>
               <p className="flex gap-2"><span className="opacity-40">08:30:15</span> <span className="text-white/40">INF</span> Ready for initial discharge...</p>
               <div className="pt-2 border-t border-white/5 animate-pulse">
                 <p className="text-white/20">&gt; Awaiting user trigger_</p>
               </div>
             </div>
             {/* Decorative element */}
             <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#2563eb]/5 rounded-full blur-3xl"></div>
          </section>
        </div>
      </div>
    </SimulationPageLayout>
  );
}

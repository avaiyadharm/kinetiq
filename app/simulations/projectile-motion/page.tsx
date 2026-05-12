"use client";

import React, { useState } from "react";
import { RotateCcw, Play, Pause, SkipForward } from "lucide-react";
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

  return (
    <SimulationPageLayout title="Projectile Motion">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Data Bar */}
        <div className="flex justify-end gap-4 p-4 bg-[#0a0a0c] border-b border-white/5">
          <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Time</span>
            <span className="text-white font-mono font-bold">{time.toFixed(2)}s</span>
          </div>
          <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">Range</span>
            <span className="text-white font-mono font-bold">{range.toFixed(1)}m</span>
          </div>
        </div>

        {/* The Canvas */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <ProjectileMotionCanvas 
            angle={angle} 
            velocity={velocity} 
            isPlaying={isPlaying}
            showPath={showPath}
          />
          
          {/* Playback Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 z-20">
             <button 
              onClick={() => setIsPlaying(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="h-[35%] border-t border-white/5 bg-[#0a0a0c] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          <ProjectileControlPanel 
            angle={angle} setAngle={setAngle}
            velocity={velocity} setVelocity={setVelocity}
            mass={mass} setMass={setMass}
            airResistance={airResistance} setAirResistance={setAirResistance}
            showPath={showPath} setShowPath={setShowPath}
          />
          <div className="col-span-1 md:col-span-1 h-full">
            <TrajectoryGraph angle={angle} velocity={velocity} />
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-center gap-4">
             <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Simulation Log</h3>
             <div className="space-y-2 font-mono text-[10px] text-blue-400/60">
               <p>&gt; Gravity: 9.81 m/s²</p>
               <p>&gt; Initial state stabilized...</p>
               <p>&gt; Ready for computation.</p>
             </div>
          </div>
        </div>
      </div>
    </SimulationPageLayout>
  );
}

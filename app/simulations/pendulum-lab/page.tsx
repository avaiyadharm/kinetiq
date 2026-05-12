"use client";

import React, { useState } from "react";
import { RotateCcw, Play, Pause, Info, BarChart2, List, Settings } from "lucide-react";
import { SimulationPageLayout } from "@/components/simulations/SimulationPageLayout";
import { PendulumCanvas } from "@/components/simulations/PendulumCanvas";
import { PendulumControlPanel } from "@/components/simulations/PendulumControlPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function PendulumLabPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [length, setLength] = useState(0.5);
  const [mass, setMass] = useState(1.0);
  const [gravity, setGravity] = useState(9.8);
  const [friction, setFriction] = useState(0.05);
  const [showGraphs, setShowGraphs] = useState(true);
  const [currentAngle, setCurrentAngle] = useState(45);

  const resetSimulation = () => {
    setIsPlaying(false);
    setLength(0.5);
    setMass(1.0);
    setGravity(9.8);
    setFriction(0.05);
  };

  return (
    <SimulationPageLayout title="Pendulum Lab">
      <div className="flex-1 flex overflow-hidden">
        {/* Simulation Area */}
        <div className="flex-1 relative bg-[#091421] border-r border-white/5">
          <PendulumCanvas 
            length={length}
            mass={mass}
            gravity={gravity}
            friction={friction}
            isPlaying={isPlaying}
            onAngleChange={setCurrentAngle}
          />

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                  isPlaying ? "bg-rose-500 text-white" : "bg-[#2563eb] text-white"
                }`}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button 
                onClick={resetSimulation}
                className="w-12 h-12 rounded-full bg-[#16202e] border border-white/10 flex items-center justify-center text-[#c3c6d7] hover:text-white transition-all shadow-xl"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto bg-[#050f1c]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-2xl">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8d90a0] uppercase tracking-widest">Angular Displacement</span>
                  <span className="text-xl font-mono font-bold text-[#2563eb]">{currentAngle.toFixed(2)}°</span>
               </div>
               <div className="w-[1px] h-8 bg-white/10 mx-2" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8d90a0] uppercase tracking-widest">Period (T)</span>
                  <span className="text-xl font-mono font-bold text-[#6bd8cb]">{(2 * Math.PI * Math.sqrt(length / gravity)).toFixed(2)}s</span>
               </div>
            </div>
          </div>

          {/* Graphs Overlay */}
          <AnimatePresence>
            {showGraphs && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-8 right-8 w-64 flex flex-col gap-4 pointer-events-none"
              >
                <div className="bg-[#050f1c]/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl pointer-events-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <BarChart2 className="w-3 h-3 text-[#2563eb]" /> Energy Distribution
                    </span>
                  </div>
                  <div className="h-24 w-full flex items-end gap-1 px-1">
                     {/* Dummy bar chart */}
                     <div className="flex-1 bg-[#2563eb]/20 border-t-2 border-[#2563eb] rounded-t-sm" style={{ height: '80%' }} />
                     <div className="flex-1 bg-[#6bd8cb]/20 border-t-2 border-[#6bd8cb] rounded-t-sm" style={{ height: '40%' }} />
                     <div className="flex-1 bg-amber-400/20 border-t-2 border-amber-400 rounded-t-sm" style={{ height: '60%' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Controls */}
        <div className="w-[400px] bg-[#050f1c] p-8 overflow-y-auto">
          <div className="flex items-center gap-3 mb-10">
            <Settings className="w-5 h-5 text-[#2563eb]" />
            <h2 className="text-lg font-bold text-white font-display">Experiment Parameters</h2>
          </div>
          
          <PendulumControlPanel 
            length={length}
            setLength={setLength}
            mass={mass}
            setMass={setMass}
            gravity={gravity}
            setGravity={setGravity}
            friction={friction}
            setFriction={setFriction}
            showGraphs={showGraphs}
            setShowGraphs={setShowGraphs}
          />

          <div className="mt-12 p-6 rounded-2xl bg-[#2563eb]/5 border border-[#2563eb]/20">
            <div className="flex items-center gap-2 text-[#2563eb] mb-3">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Physics Tip</span>
            </div>
            <p className="text-xs text-[#c3c6d7] leading-relaxed italic">
              "The period of a simple pendulum is independent of its mass and amplitude (for small angles)."
            </p>
          </div>
        </div>
      </div>
    </SimulationPageLayout>
  );
}

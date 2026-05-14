"use client";

import React, { useState } from "react";
import { SimulationPageLayout } from "@/components/simulations/SimulationPageLayout";
import { InertiaDemo } from "@/components/simulations/newtons-laws/InertiaDemo";
import { ForceAccelerationDemo } from "@/components/simulations/newtons-laws/ForceAccelerationDemo";
import { ActionReactionDemo } from "@/components/simulations/newtons-laws/ActionReactionDemo";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gauge, Rocket, Info, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type LawTab = "inertia" | "acceleration" | "reaction";

export default function NewtonsLawsPage() {
  const [activeLaw, setActiveLaw] = useState<LawTab>("inertia");

  const tabs = [
    { id: "inertia", label: "1st Law: Inertia", icon: Zap, color: "#ff85a2" },
    { id: "acceleration", label: "2nd Law: F=ma", icon: Gauge, color: "#3b82f6" },
    { id: "reaction", label: "3rd Law: Reaction", icon: Rocket, color: "#10b981" },
  ];

  return (
    <SimulationPageLayout title="Newton's Laws of Motion">
      <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
        {/* Watercolor Background Gradient Override */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b33] via-[#1a3a4a] to-[#0d2b33] opacity-20 pointer-events-none" />
        
        {/* Sub-navigation Tabs */}
        <div className="p-8 pb-0 flex gap-4 z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeLaw === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLaw(tab.id as LawTab)}
                className={cn(
                  "px-8 py-5 rounded-[24px] flex items-center gap-3 transition-all relative overflow-hidden group",
                  isActive 
                    ? "bg-[#18181b] border-2 border-white/10 shadow-2xl" 
                    : "hover:bg-white/5 border-2 border-transparent"
                )}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" 
                  style={{ backgroundColor: tab.color }} 
                />
                <div 
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    isActive ? "bg-white/5" : "bg-transparent"
                  )}
                >
                  <Icon 
                    className="w-5 h-5 transition-transform group-hover:scale-110" 
                    style={{ color: isActive ? tab.color : "rgba(255,255,255,0.4)" }} 
                  />
                </div>
                <span className={cn(
                  "font-bold text-sm tracking-tight",
                  isActive ? "text-white" : "text-white/40 group-hover:text-white/60"
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 pt-6 relative flex flex-col lg:flex-row gap-8 overflow-hidden">
          {/* Main Simulation View */}
          <div className="flex-1 min-h-[400px] z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLaw}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="h-full"
              >
                {activeLaw === "inertia" && <InertiaDemo />}
                {activeLaw === "acceleration" && <ForceAccelerationDemo />}
                {activeLaw === "reaction" && <ActionReactionDemo />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Theory Sidebar */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6 z-10">
             <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                   <BookOpen className="w-24 h-24" />
                </div>
                
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Info className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-bold uppercase tracking-tight">Theoretical Basis</h3>
                </div>

                <div className="space-y-4">
                  {activeLaw === "inertia" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <p className="text-white/60 text-sm leading-relaxed italic">
                        "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an unbalanced force."
                      </p>
                      <div className="p-4 rounded-2xl bg-black/40 border border-[#ff85a2]/20">
                         <span className="text-[10px] font-bold text-[#ff85a2] uppercase tracking-[0.2em] block mb-2">Practical insight</span>
                         <p className="text-xs text-white/40 leading-relaxed">
                            Objects are "lazy"—this resistance to change is Inertia. Increasing the mass makes the puck harder to start or stop.
                         </p>
                      </div>
                    </div>
                  )}
                  {activeLaw === "acceleration" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <p className="text-white/60 text-sm leading-relaxed italic">
                        "The acceleration of an object depends on the mass and the amount of force applied."
                      </p>
                      <div className="p-4 rounded-2xl bg-black/40 border border-[#3b82f6]/20">
                         <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-[0.2em] block mb-2">Equation</span>
                         <p className="text-2xl font-mono font-bold text-white tracking-tighter">F = m × a</p>
                         <p className="text-xs text-white/40 mt-2 leading-relaxed">
                            Push harder (Force ↑) to go faster. Use a heavier object (Mass ↑) and you'll need more force for the same acceleration.
                         </p>
                      </div>
                    </div>
                  )}
                  {activeLaw === "reaction" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                      <p className="text-white/60 text-sm leading-relaxed italic">
                        "For every action, there is an equal and opposite reaction."
                      </p>
                      <div className="p-4 rounded-2xl bg-black/40 border border-[#10b981]/20">
                         <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-[0.2em] block mb-2">Newtonian Pair</span>
                         <p className="text-xs text-white/40 leading-relaxed">
                            Forces always come in pairs. The rocket pushes gas down (Action), and the gas pushes the rocket up (Reaction).
                         </p>
                      </div>
                    </div>
                  )}
                </div>
             </div>

             {/* Quick Tip Box */}
             <div className="bg-gradient-to-br from-[#ff85a2]/10 to-[#3b82f6]/10 rounded-[32px] p-8 border border-white/5 space-y-3">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">Scientific Laboratory v1.0</span>
                <p className="text-sm text-white font-bold leading-tight">Experiment 626: "The laws of physics apply even in the most chaotic environments."</p>
             </div>
          </div>
        </div>
      </div>
    </SimulationPageLayout>
  );
}

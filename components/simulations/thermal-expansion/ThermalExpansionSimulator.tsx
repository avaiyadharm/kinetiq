"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { ThermalExpansionCanvas } from "./ThermalExpansionCanvas";
import { ThermalExpansionControls } from "./ThermalExpansionControls";
import { ThermalExpansionConfig } from "./ThermalExpansionConfig";
import { ThermalExpansionGraphs } from "./ThermalExpansionGraphs";
import { ThermalExpansionAnalytics } from "./ThermalExpansionAnalytics";
import { ThermalExpansionTheory } from "./ThermalExpansionTheory";
import { ThermalExpansionGuide } from "./ThermalExpansionGuide";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DATABASE, ThermalExpansionPhysicsEngine } from "@/lib/physics/thermalExpansion";
import { Shield, ShieldAlert, Cpu, Thermometer, Info } from "lucide-react";

export const ThermalExpansionSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  
  const {
    temperature,
    materialId,
    constraint,
    isPlaying,
    isBroken,
    plasticStrain,
    fatigueAccumulated,
    objectType,
    tick,
    reset,
    L0
  } = useThermalExpansionStore();

  const currentMaterial = MATERIAL_DATABASE[materialId];

  // Global physics tick loop running in the background
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        tick(dt);
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, tick]);

  // Derived variables for live header telemetry overlay
  const stressStatus = React.useMemo(() => {
    if (objectType === "bimetallic") return { label: "Bending Mode", color: "text-amber-400" };
    const res = ThermalExpansionPhysicsEngine.getStressAndStrain(
      L0,
      currentMaterial,
      temperature,
      constraint,
      plasticStrain
    );
    if (res.isBroken) return { label: "FRACTURED", color: "text-red-500 font-black animate-pulse" };
    if (res.isDeformed) return { label: "PLASTIC WARP", color: "text-amber-500 font-bold" };
    if (Math.abs(res.stress) > currentMaterial.yieldStrength * 0.5) return { label: "HIGH ELASTIC", color: "text-amber-400" };
    return { label: "SAFE", color: "text-emerald-400" };
  }, [temperature, materialId, constraint, L0, plasticStrain, objectType, currentMaterial]);

  const handleReset = () => {
    reset();
  };

  const renderCanvasTab = () => (
    <div className="flex-1 flex flex-col p-6 gap-6 bg-[#09090b] overflow-hidden relative">
      {/* Engineering Blueprint Faint Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 relative">
        
        {/* Left Side: Physical Visualization Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full min-h-0">
          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden flex-1 relative shadow-2xl min-h-0">
            
            {/* The canvas component */}
            <ThermalExpansionCanvas />

            {/* Micro Live Overlay HUD */}
            <div className="absolute top-5 left-5 flex gap-2.5 pointer-events-none flex-wrap">
              {[
                { label: "Target Mat", value: currentMaterial.name.toUpperCase(), color: "text-cyan-400" },
                { label: "State", value: objectType.toUpperCase(), color: "text-white" },
                { label: "Temp", value: `${temperature.toFixed(1)} K`, color: temperature > 293.15 ? "text-amber-500" : "text-cyan-400" },
                { label: "Stress Integrity", value: stressStatus.label, color: stressStatus.color }
              ].map(item => (
                <div key={item.label} className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex flex-col">
                  <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">{item.label}</span>
                  <span className={`text-xs font-mono font-black mt-0.5 ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Fatigue percentage badge */}
            <div className="absolute top-5 right-5 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/20 text-center">
                <div className="text-[8px] text-cyan-400/60 uppercase font-black tracking-widest">FATIGUE DECAY</div>
                <div className="text-sm font-mono font-black text-cyan-400 mt-0.5">{(fatigueAccumulated * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Core Analytics Banner */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Thermometer className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider">Strain Rate</div>
                <div className="text-sm font-mono font-black text-cyan-400">
                  {objectType === "bimetallic" ? "N/A" : (plasticStrain * 100).toExponential(2)}
                </div>
              </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider">Restraint</div>
                <div className="text-sm font-mono font-black text-amber-400">{constraint.toUpperCase()}</div>
              </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                {isBroken ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <Shield className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider">Yield Alert</div>
                <div className={`text-sm font-mono font-black ${isBroken ? "text-red-400" : "text-emerald-400"}`}>
                  {isBroken ? "CRACKED" : "STABLE"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Graph Engine & Preset Controllers */}
        <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-1 h-full min-h-0">
          
          {/* Scientific Graph Area */}
          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden h-[260px] relative shadow-lg shrink-0">
            <ThermalExpansionGraphs />
          </div>

          {/* Interactive controls */}
          <ThermalExpansionControls />

          {/* Quick Informational Guide */}
          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Thermodynamics Lab Note</h3>
            </div>
            <p className="text-[10.5px] text-white/40 leading-relaxed font-mono">
              In bimetallic strip bending, Timoshenko&apos;s formula derives curvature $\kappa_c$ using alloy thickness ratios and Young&apos;s Modulus mismatches. For solid rails/bridges, structural buckling risk occurs once expansion joint clearances close.
            </p>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <SimulationPageLayout
      title="Thermal Expansion Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showAnalyticsTab={true}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {activeTab === "canvas" && renderCanvasTab()}
          {activeTab === "config" && <ThermalExpansionConfig />}
          {activeTab === "theory" && <ThermalExpansionTheory />}
          {activeTab === "guide" && <ThermalExpansionGuide />}
          {activeTab === "analytics" && <ThermalExpansionAnalytics />}
        </motion.div>
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

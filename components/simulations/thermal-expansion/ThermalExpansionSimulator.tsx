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
import { Shield, ShieldAlert, Cpu, Thermometer, Info, Activity } from "lucide-react";

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
    L0,
    history
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
      0,
      plasticStrain
    );
    if (res.isBroken) return { label: "FRACTURED", color: "text-red-500 font-black animate-pulse" };
    if (res.isDeformed) return { label: "PLASTIC WARP", color: "text-amber-500 font-bold" };
    if (Math.abs(res.stress) > currentMaterial.yieldStrength * 0.5) return { label: "HIGH ELASTIC", color: "text-amber-400" };
    return { label: "SAFE", color: "text-emerald-400" };
  }, [temperature, materialId, constraint, L0, plasticStrain, objectType, currentMaterial]);

  // Calculate current expansion delta for the HUD
  const currentDeltaL = React.useMemo(() => {
    const L = ThermalExpansionPhysicsEngine.getLength(L0, currentMaterial, temperature, plasticStrain);
    return (L - L0) * 1000; // mm
  }, [temperature, materialId, L0, plasticStrain, currentMaterial]);

  const handleReset = () => {
    reset();
  };

  const renderCanvasTab = () => (
    <div className="flex-1 flex overflow-hidden relative bg-[#09090b]">
      {/* Engineering Blueprint Faint Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      {/* LEFT PANEL: Main Physics Canvas — takes all remaining space */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-3 relative">
        
        {/* ── HUD Telemetry Header ── */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {[
            { label: "Material", value: currentMaterial.name.toUpperCase(), color: "text-cyan-400" },
            { label: "Object", value: objectType.toUpperCase(), color: "text-white" },
            { label: "Temperature", value: `${temperature.toFixed(1)} K`, color: temperature > 293.15 ? "text-amber-400" : temperature < 250 ? "text-blue-400" : "text-cyan-400" },
            { label: "ΔL", value: `${currentDeltaL >= 0 ? "+" : ""}${currentDeltaL.toFixed(3)} mm`, color: currentDeltaL >= 0 ? "text-emerald-400" : "text-blue-400" },
            { label: "Integrity", value: stressStatus.label, color: stressStatus.color },
          ].map(item => (
            <div key={item.label} className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex flex-col">
              <span className="text-[8px] text-white/35 uppercase font-black tracking-widest">{item.label}</span>
              <span className={`text-[11px] font-mono font-black mt-0.5 ${item.color}`}>{item.value}</span>
            </div>
          ))}
          
          {/* Fatigue and simulation status on the right */}
          <div className="ml-auto flex items-center gap-2">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/20 flex flex-col text-center">
              <span className="text-[8px] text-cyan-400/50 uppercase font-black tracking-widest">Fatigue</span>
              <span className={`text-[11px] font-mono font-black ${fatigueAccumulated > 0.7 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}>
                {(fatigueAccumulated * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-xl border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-white/20"}`} style={{ boxShadow: isPlaying ? "0 0 6px rgba(16,185,129,0.6)" : "none" }} />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isPlaying ? "RUNNING" : "PAUSED"}</span>
            </div>
          </div>
        </div>

        {/* ── Main Canvas: fills all available vertical space ── */}
        <div className="flex-1 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl min-h-0">
          <ThermalExpansionCanvas />

          {/* Broken overlay indicator */}
          {isBroken && (
            <div className="absolute inset-0 border-2 border-red-500/50 rounded-2xl pointer-events-none animate-pulse" />
          )}
        </div>

        {/* ── Bottom Analytics Banner: 3 compact stat cards ── */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-[#18181b] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Thermometer className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-[8px] text-white/35 uppercase font-bold tracking-wider">Plastic Strain</div>
              <div className="text-xs font-mono font-black text-cyan-400">
                {objectType === "bimetallic" ? "—" : plasticStrain.toExponential(2)}
              </div>
            </div>
          </div>
          <div className="bg-[#18181b] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[8px] text-white/35 uppercase font-bold tracking-wider">Constraint</div>
              <div className="text-xs font-mono font-black text-amber-400">{constraint.toUpperCase()}</div>
            </div>
          </div>
          <div className="bg-[#18181b] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
              {isBroken ? (
                <ShieldAlert className="w-4 h-4 text-red-400" />
              ) : (
                <Shield className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="text-[8px] text-white/35 uppercase font-bold tracking-wider">Yield Alert</div>
              <div className={`text-xs font-mono font-black ${isBroken ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                {isBroken ? "CRACKED" : "STABLE"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Graphs + Controls — fixed width, independently scrollable */}
      <div className="w-[340px] shrink-0 border-l border-white/5 flex flex-col bg-[#0c0c0e] overflow-hidden">
        
        {/* ── Graph Panel: fixed height section ── */}
        <div className="h-[340px] shrink-0 border-b border-white/5 relative">
          <ThermalExpansionGraphs />
        </div>

        {/* ── Controls + Info: scrollable area ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-3">
            
            {/* Experiment Controls */}
            <ThermalExpansionControls />

            {/* Quick Informational Note */}
            <div className="bg-[#18181b] p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <h3 className="text-[9px] font-black text-white/50 uppercase tracking-widest">Physics Note</h3>
              </div>
              <p className="text-[9.5px] text-white/35 leading-relaxed font-mono">
                In bimetallic strips, Timoshenko&apos;s formula computes curvature κ from alloy thickness ratios and Young&apos;s Modulus mismatches. For constrained rods, thermal stress σ = E · α · ΔT grows linearly with constraint stiffness.
              </p>
            </div>

            {/* Live data points counter */}
            <div className="flex items-center gap-2 justify-between bg-black/30 px-3 py-2.5 rounded-xl border border-white/5 text-[9px] font-mono text-white/30">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-cyan-400/60" />
                <span>Telemetry Buffer</span>
              </div>
              <span className="text-cyan-400/70 font-black">{history.length} / 1000 pts</span>
            </div>
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
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

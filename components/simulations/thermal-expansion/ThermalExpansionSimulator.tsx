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
import { ThermalExpansionEquationPanel } from "./ThermalExpansionEquationPanel";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";
import { Shield, ShieldAlert, Thermometer, Activity, Cpu } from "lucide-react";

export const ThermalExpansionSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");

  const {
    avgTemperature,
    materialId,
    constraint,
    isPlaying,
    isFailed,
    isYielding,
    plasticStrain,
    fatigueAccumulated,
    objectType,
    tick,
    reset,
    L0,
    history,
    realDeltaL,
    stressAtConstraint,
    factorOfSafety,
    vizSettings,
    experimentMode,
    willBuckle,
  } = useThermalExpansionStore();

  const currentMaterial = MATERIAL_DB[materialId];

  // Global physics tick loop
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (isPlaying) tick(dt);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, tick]);

  // Derived HUD values
  const alpha = currentMaterial ? PhysicsEngine.alpha(currentMaterial, avgTemperature) : 0;
  const sigma_y = currentMaterial ? PhysicsEngine.yieldStrength(currentMaterial, avgTemperature) : 0;

  const statusLabel = () => {
    if (isFailed) return { text: "FRACTURED", cls: "text-red-400 animate-pulse" };
    if (willBuckle) return { text: "BUCKLING", cls: "text-red-400 animate-pulse" };
    if (isYielding) return { text: "YIELDING", cls: "text-amber-400" };
    if (fatigueAccumulated > 0.8) return { text: "FATIGUE RISK", cls: "text-amber-400" };
    return { text: "STABLE", cls: "text-emerald-400" };
  };
  const status = statusLabel();

  const renderCanvasTab = () => (
    <div className="flex-1 flex overflow-hidden relative bg-[#09090b]">
      {/* Engineering blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      {/* ── LEFT PANEL: Canvas + Equation Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-3 relative">

        {/* HUD strip */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {[
            {
              label: "Material",
              value: currentMaterial ? currentMaterial.name.split(" ")[0].toUpperCase() : "—",
              color: "text-white",
            },
            {
              label: "α (T)",
              value: `${(alpha * 1e6).toFixed(2)} ×10⁻⁶/K`,
              color: "text-cyan-400",
            },
            {
              label: "Temperature",
              value: `${avgTemperature.toFixed(1)} K`,
              color: avgTemperature > 600 ? "text-red-400" : avgTemperature > 400 ? "text-amber-400" : avgTemperature < 200 ? "text-blue-400" : "text-cyan-400",
            },
            {
              label: "Real ΔL",
              value: `${realDeltaL >= 0 ? "+" : ""}${(realDeltaL * 1000).toFixed(3)} mm`,
              color: realDeltaL >= 0 ? "text-emerald-400" : "text-blue-400",
            },
            {
              label: "Stress",
              value: `${(stressAtConstraint / 1e6).toFixed(1)} MPa`,
              color: Math.abs(stressAtConstraint) > sigma_y ? "text-red-400" : Math.abs(stressAtConstraint) > sigma_y * 0.5 ? "text-amber-400" : "text-white/60",
            },
            {
              label: "Status",
              value: status.text,
              color: status.cls,
            },
          ].map(item => (
            <div key={item.label} className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex flex-col min-w-0">
              <span className="text-[7.5px] text-white/30 uppercase font-black tracking-widest whitespace-nowrap">{item.label}</span>
              <span className={`text-[10.5px] font-mono font-black mt-0.5 whitespace-nowrap ${item.color}`}>{item.value}</span>
            </div>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <div className="bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 flex flex-col text-center">
              <span className="text-[7.5px] text-white/30 uppercase font-black tracking-widest">×Mag</span>
              <span className="text-[10.5px] font-mono font-black text-cyan-400">{vizSettings.magnification}×</span>
            </div>
            <div className="bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 flex flex-col text-center">
              <span className="text-[7.5px] text-white/30 uppercase font-black tracking-widest">FoS</span>
              <span className={`text-[10.5px] font-mono font-black ${factorOfSafety < 1.5 ? "text-red-400" : factorOfSafety < 2 ? "text-amber-400" : "text-emerald-400"}`}>
                {factorOfSafety >= 999 ? "∞" : factorOfSafety.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-xl border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-white/20"}`}
                style={{ boxShadow: isPlaying ? "0 0 6px rgba(16,185,129,0.6)" : "none" }} />
              <span className="text-[8.5px] font-black text-white/40 uppercase tracking-widest">{isPlaying ? "LIVE" : "PAUSED"}</span>
            </div>
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl min-h-0">
          <ThermalExpansionCanvas />
          {isFailed && (
            <div className="absolute inset-0 border-2 border-red-500/40 rounded-2xl pointer-events-none animate-pulse" />
          )}
        </div>

        {/* Equation Panel — live formula engine */}
        <ThermalExpansionEquationPanel />

        {/* Bottom analytics strip */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-[#18181b] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-7 h-7 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="text-[7.5px] text-white/30 uppercase font-bold tracking-wider">α_th (diffusivity)</div>
              <div className="text-[10px] font-mono font-black text-cyan-400">
                {currentMaterial ? PhysicsEngine.thermalDiffusivity(currentMaterial).toExponential(2) : "—"} m²/s
              </div>
            </div>
          </div>
          <div className="bg-[#18181b] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="text-[7.5px] text-white/30 uppercase font-bold tracking-wider">Crystal Structure</div>
              <div className="text-[10px] font-mono font-black text-amber-400 leading-tight">
                {currentMaterial?.crystalStructure.split(" ")[0] ?? "—"}
              </div>
            </div>
          </div>
          <div className="bg-[#18181b] px-4 py-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
              {isFailed ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="text-[7.5px] text-white/30 uppercase font-bold tracking-wider">Fatigue Dmg</div>
              <div className={`text-[10px] font-mono font-black ${fatigueAccumulated > 0.7 ? "text-red-400" : "text-emerald-400"}`}>
                {(fatigueAccumulated * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Graph + Controls ── */}
      <div className="w-[340px] shrink-0 border-l border-white/5 flex flex-col bg-[#0c0c0e] overflow-hidden">
        {/* Graph - fixed height */}
        <div className="h-[300px] shrink-0 border-b border-white/5">
          <ThermalExpansionGraphs />
        </div>
        {/* Controls - scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-3">
            <ThermalExpansionControls />

            {/* Data buffer display */}
            <div className="flex items-center gap-2 justify-between bg-black/30 px-3 py-2 rounded-xl border border-white/5 text-[8.5px] font-mono text-white/25">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-cyan-400/50" />
                <span>Telemetry</span>
              </div>
              <span className="text-cyan-400/60 font-black">{history.length} pts · {experimentMode.replace(/_/g, " ")}</span>
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
      onReset={reset}
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
          {activeTab === "canvas"    && renderCanvasTab()}
          {activeTab === "config"    && <ThermalExpansionConfig />}
          {activeTab === "theory"    && <ThermalExpansionTheory />}
          {activeTab === "guide"     && <ThermalExpansionGuide />}
          {activeTab === "analytics" && <ThermalExpansionAnalytics />}
        </motion.div>
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

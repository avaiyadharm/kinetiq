"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { CircuitGridCanvas } from "./CircuitGridCanvas";
import { CircuitGridControls } from "./CircuitGridControls";
import { CircuitGridTheory } from "./CircuitGridTheory";
import { CircuitGridGuide } from "./CircuitGridGuide";
import { CircuitGridAnalytics } from "./CircuitGridAnalytics";
import { useCircuitStore } from "@/store/circuitStore";

const TAB_ANIM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18 },
} as const;

// ─── Live Equation Overlay ─────────────────────────────────────────────────────
const LiveEquationOverlay: React.FC = () => {
  const { components } = useCircuitStore();
  const battery = components.find((c) => c.type === "battery");
  const resistors = components.filter((c) => c.type === "resistor");
  const bulbs = components.filter((c) => c.type === "bulb");
  const leds = components.filter((c) => c.type === "led");
  const activeLights = [...bulbs, ...leds].filter((c) => (c.brightness ?? 0) > 0.01);

  if (!battery) return null;

  const totalPower = components.reduce((s, c) => s + (c.power ?? 0), 0);
  const maxCurrent = Math.max(...components.filter((c) => c.current !== undefined).map((c) => c.current!), 0);

  return (
    <motion.div
      layout
      className="absolute bottom-4 right-4 z-20 pointer-events-none"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="rounded-xl border border-emerald-500/20 bg-black/75 backdrop-blur-md px-4 py-3 flex flex-col gap-1.5 min-w-[220px] shadow-xl">
        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25 mb-1">Live Equations</div>
        <div className="text-[11px] font-mono text-white/30">V = {battery.value}V</div>
        <div className="text-[11px] font-mono text-emerald-300/80">I_max = {(maxCurrent * 1000).toFixed(2)} mA</div>
        <div className="text-[11px] font-mono text-yellow-300/80">P_total = {totalPower.toFixed(4)} W</div>
        {activeLights.length > 0 && (
          <div className="text-[11px] font-mono text-cyan-300/70">
            💡 {activeLights.length} light{activeLights.length > 1 ? "s" : ""} active
          </div>
        )}
        <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            animate={{ width: `${Math.min(100, (totalPower / 2) * 100)}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Canvas Tab ────────────────────────────────────────────────────────────────
const CanvasTab: React.FC = () => {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Canvas area */}
      <div className="flex-1 min-w-0 relative overflow-hidden">
        <CircuitGridCanvas />
        <LiveEquationOverlay />
      </div>

      {/* Controls sidebar */}
      <aside className="w-[300px] shrink-0 border-l border-white/5 bg-[#0e0e14] overflow-hidden">
        <CircuitGridControls />
      </aside>
    </div>
  );
};

// ─── Root Simulator ────────────────────────────────────────────────────────────
export const CircuitGridSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const { clearGrid, loadPreset, setActivePalette } = useCircuitStore();

  // Load the series preset and set wire as default tool on first mount
  React.useEffect(() => {
    loadPreset("series");
    setActivePalette("wire");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    clearGrid();
    setActiveTab("canvas");
  };

  return (
    <SimulationPageLayout
      title="Circuit Grid Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showAnalyticsTab
    >
      <AnimatePresence mode="wait">
        {(activeTab === "canvas" || activeTab === "config") && (
          <motion.div key="canvas" {...TAB_ANIM} className="flex flex-1 min-h-0 overflow-hidden">
            <CanvasTab />
          </motion.div>
        )}
        {activeTab === "theory" && (
          <motion.div key="theory" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <CircuitGridTheory />
            </div>
          </motion.div>
        )}
        {activeTab === "guide" && (
          <motion.div key="guide" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8">
              <CircuitGridGuide />
            </div>
          </motion.div>
        )}
        {activeTab === "analytics" && (
          <motion.div key="analytics" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <CircuitGridAnalytics />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

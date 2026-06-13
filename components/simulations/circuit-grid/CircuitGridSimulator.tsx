"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { CircuitGridCanvas } from "./CircuitGridCanvas";
import { CircuitGridControls } from "./CircuitGridControls";
import { CircuitGridTheory } from "./CircuitGridTheory";
import { CircuitGridGuide } from "./CircuitGridGuide";
import { CircuitGridAnalytics } from "./CircuitGridAnalytics";
import { CircuitGridEquations } from "./CircuitGridEquations";
import { useCircuitStore, computeEquivalentR } from "@/store/circuitStore";

const TAB_ANIM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18 },
} as const;

// ─── Live Equation Overlay ─────────────────────────────────────────────────────
const LiveEquationOverlay: React.FC = () => {
  const { components, diagnostics } = useCircuitStore();
  const battery = components.find((c) => c.type === "battery");
  const activeLights = components
    .filter((c) => ["bulb", "led"].includes(c.type))
    .filter((c) => (c.brightness ?? 0) > 0.01);

  if (!battery) return null;

  const totalPower = components.reduce((s, c) => s + (c.power ?? 0), 0);
  const I_bat = Math.abs(battery.signedCurrent ?? 0);
  const r_int = battery.internalR ?? 0;
  const V_terminal = battery.value - I_bat * r_int;
  const R_eq = computeEquivalentR(components);

  const hasError = diagnostics.some((d) => d.severity === "error" && d.type !== "ok");
  const errorMsg = diagnostics.find((d) => d.severity === "error" && d.type !== "ok");

  return (
    <motion.div
      layout
      className="absolute bottom-4 right-4 z-20 pointer-events-none"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className={`rounded-xl border bg-black/80 backdrop-blur-md px-4 py-3 flex flex-col gap-1.5 min-w-[240px] shadow-xl ${
          hasError
            ? "border-rose-500/40"
            : "border-emerald-500/20"
        }`}
      >
        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25 mb-0.5">
          Live Circuit State
        </div>

        {hasError && errorMsg ? (
          <div className="text-[10px] font-mono text-rose-300 leading-relaxed">
            ⚠ {errorMsg.type === "open_circuit"
              ? "Open Circuit — No current flows"
              : errorMsg.type === "short_circuit"
              ? "Short Circuit — Check battery wiring"
              : errorMsg.message.slice(0, 60)}
          </div>
        ) : (
          <>
            <div className="text-[11px] font-mono text-white/40">
              EMF = {battery.value}V
              {r_int > 0 && (
                <span className="text-emerald-300/70 ml-2">
                  V_t = {V_terminal.toFixed(3)}V
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-blue-300/80">
              I_supply = {(I_bat * 1000).toFixed(2)} mA
            </div>
            <div className="text-[11px] font-mono text-yellow-300/80">
              P_total = {totalPower.toFixed(4)} W
            </div>
            {isFinite(R_eq) && (
              <div className="text-[11px] font-mono text-orange-300/70">
                R_eq = {R_eq >= 1000 ? (R_eq / 1000).toFixed(2) + "kΩ" : R_eq.toFixed(2) + "Ω"}
              </div>
            )}
            {activeLights.length > 0 && (
              <div className="text-[11px] font-mono text-cyan-300/70">
                💡 {activeLights.length} light{activeLights.length > 1 ? "s" : ""} active
              </div>
            )}
          </>
        )}

        {/* Power bar normalized to battery power output */}
        <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${hasError ? "bg-rose-500" : "bg-gradient-to-r from-emerald-600 to-emerald-400"}`}
            animate={{
              width: hasError
                ? "100%"
                : `${Math.min(100, (totalPower / Math.max(battery.value * I_bat, 0.001)) * 100)}%`,
            }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <div className="text-[8px] font-mono text-white/20">
          {hasError ? "circuit error" : `${((totalPower / Math.max(battery.value * I_bat, 0.001)) * 100).toFixed(0)}% power efficiency`}
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
            {/* Two-column layout for analytics + live equations */}
            <div className="flex gap-8 max-w-6xl mx-auto px-8 py-8">
              <div className="flex-1 min-w-0">
                <CircuitGridAnalytics />
              </div>
              <div className="w-[380px] shrink-0">
                <div className="sticky top-8">
                  <CircuitGridEquations />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

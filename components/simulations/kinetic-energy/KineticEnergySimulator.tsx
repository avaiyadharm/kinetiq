"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { KineticEnergyCanvas } from "./KineticEnergyCanvas";
import { KineticEnergyControls } from "./KineticEnergyControls";
import { KineticEnergyTheory } from "./KineticEnergyTheory";
import { KineticEnergyGuide } from "./KineticEnergyGuide";
import { KineticEnergyAnalytics } from "./KineticEnergyAnalytics";
import { useKEStore } from "@/store/kineticEnergyStore";

const TAB_ANIM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.18 },
} as const;

export const KineticEnergySimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const { reset, mode } = useKEStore();

  const handleReset = () => {
    reset();
    setActiveTab("canvas");
  };

  return (
    <SimulationPageLayout
      title="Kinetic Energy Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showAnalyticsTab
    >
      <AnimatePresence mode="wait">
        {activeTab === "canvas" && (
          <motion.div key="canvas" {...TAB_ANIM} className="flex flex-1 min-h-0 overflow-hidden">
            {/* Canvas pane */}
            <div className="flex-1 min-w-0 p-6 flex flex-col">
              {/* Mode badge row */}
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-[10px] font-mono font-black uppercase tracking-widest text-blue-400">
                  {mode.replace(/([A-Z])/g, " $1").trim()} Mode
                </div>
                <div className="text-[10px] text-white/25 font-mono uppercase tracking-wider">
                  Semi-Implicit Euler · Real-Time Physics
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <KineticEnergyCanvas />
              </div>
            </div>

            {/* Right sidebar: controls */}
            <aside className="w-[300px] shrink-0 border-l border-white/5 bg-[#111113] p-5 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-5">
                Parameters
              </div>
              <KineticEnergyControls />
            </aside>
          </motion.div>
        )}

        {activeTab === "config" && (
          <motion.div key="config" {...TAB_ANIM} className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 p-6 flex flex-col">
              <div className="flex-1 min-h-0">
                <KineticEnergyCanvas />
              </div>
            </div>
            <aside className="w-[320px] shrink-0 border-l border-white/5 bg-[#111113] p-5 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-5">
                Environment Config
              </div>
              <KineticEnergyControls />
            </aside>
          </motion.div>
        )}

        {activeTab === "theory" && (
          <motion.div key="theory" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <KineticEnergyTheory />
            </div>
          </motion.div>
        )}

        {activeTab === "guide" && (
          <motion.div key="guide" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8">
              <KineticEnergyGuide />
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div key="analytics" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <KineticEnergyAnalytics />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

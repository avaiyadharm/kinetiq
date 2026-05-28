"use client";

import React, { useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { CarnotCanvas } from "./CarnotCanvas";
import { CarnotPVGraph } from "./CarnotPVGraph";
import { CarnotControls } from "./CarnotControls";
import { CarnotConfig } from "./CarnotConfig";
import { CarnotTheory } from "./CarnotTheory";
import { CarnotGuide } from "./CarnotGuide";
import { useCarnotStore } from "@/store/carnotStore";
import { CarnotEngineCore } from "@/lib/physics/carnot";
import { Activity, Flame, Snowflake, Zap } from "lucide-react";

export const CarnotSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");

  const { TH, TC, n, currentStage, stageProgress, reset } = useCarnotStore();

  const engine = useMemo(() => new CarnotEngineCore(n, TH, TC), [n, TH, TC]);
  const currentState = engine.getStateAt(currentStage, stageProgress);
  const netWork = engine.getNetWork();
  const heatIn = engine.getHeatIn();
  const efficiency = engine.getTheoreticalEfficiency();

  const handleReset = useCallback(() => reset(), [reset]);

  const renderCanvas = () => (
    <div className="flex-1 flex flex-col p-6 gap-6 bg-[#09090b] overflow-hidden">
      {/* Faint grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 relative">
        {/* Main Physical Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden flex-1 relative shadow-2xl min-h-0">
            <CarnotCanvas engine={engine} />

            {/* Live State Overlay */}
            <div className="absolute top-5 left-5 flex gap-3 pointer-events-none flex-wrap">
              {[
                { label: "Stage", value: currentStage.replace(/_/g, " "), color: "text-cyan-400" },
                { label: "Volume", value: `${currentState.V.toFixed(2)} L`, color: "text-white" },
                { label: "Pressure", value: `${(currentState.P / 1000).toFixed(1)} kPa`, color: "text-white" },
                { label: "Temp", value: `${currentState.T.toFixed(0)} K`, color: currentState.T > (TH + TC) / 2 ? "text-red-400" : "text-blue-400" },
              ].map(item => (
                <div key={item.label} className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex flex-col">
                  <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">{item.label}</span>
                  <span className={`text-sm font-mono font-black ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Efficiency badge */}
            <div className="absolute top-5 right-5 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/20 text-center">
                <div className="text-[8px] text-cyan-400/60 uppercase font-black tracking-widest">Max Efficiency</div>
                <div className="text-xl font-mono font-black text-cyan-400">{(efficiency * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase font-black tracking-wider">Heat In (Q_H)</div>
                <div className="text-lg font-mono font-black text-red-400">{heatIn.toFixed(1)} J</div>
              </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase font-black tracking-wider">Net Work (W)</div>
                <div className="text-lg font-mono font-black text-emerald-400">{netWork.toFixed(1)} J</div>
              </div>
            </div>
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Snowflake className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-[9px] text-white/40 uppercase font-black tracking-wider">Heat Out (Q_C)</div>
                <div className="text-lg font-mono font-black text-blue-400">{(heatIn - netWork).toFixed(1)} J</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Graph */}
        <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden h-[260px] relative shadow-lg shrink-0">
            <CarnotPVGraph engine={engine} />
          </div>

          <CarnotControls />

          <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Carnot&apos;s Theorem</h3>
            </div>
            <p className="text-[11px] text-white/45 leading-relaxed">
              No heat engine operating between two reservoirs can exceed the Carnot efficiency. This is a consequence of the Second Law of Thermodynamics — all reversible engines have the same efficiency, all irreversible engines have lower efficiency.
            </p>
            <div className="mt-3 p-3 bg-black/40 rounded-xl border border-cyan-500/10 text-center">
              <span className="font-mono text-sm text-cyan-400 font-black">η = 1 − T<sub>C</sub> / T<sub>H</sub></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SimulationPageLayout
      title="Carnot Engine"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
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
          {activeTab === "canvas" && renderCanvas()}
          {activeTab === "config" && <CarnotConfig />}
          {activeTab === "theory" && <CarnotTheory />}
          {activeTab === "guide" && <CarnotGuide />}
        </motion.div>
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

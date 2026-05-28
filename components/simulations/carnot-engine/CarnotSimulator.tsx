"use client";

import React, { useMemo } from "react";
import { SimulationPageLayout } from "@/components/simulations/SimulationPageLayout";
import { CarnotCanvas } from "./CarnotCanvas";
import { CarnotPVGraph } from "./CarnotPVGraph";
import { CarnotControls } from "./CarnotControls";
import { useCarnotStore } from "@/store/carnotStore";
import { CarnotEngineCore } from "@/lib/physics/carnot";
import { Activity, Flame, Snowflake, Zap } from "lucide-react";

export const CarnotSimulator: React.FC = () => {
  const { TH, TC, n, currentStage, stageProgress } = useCarnotStore();
  
  // Re-instantiate engine for helper calcs
  const engine = useMemo(() => new CarnotEngineCore(n, TH, TC), [n, TH, TC]);
  const currentState = engine.getStateAt(currentStage, stageProgress);
  const netWork = engine.getNetWork();
  const heatIn = engine.getHeatIn();

  return (
    <SimulationPageLayout title="Carnot Engine">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Physical Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden aspect-video relative shadow-2xl">
            <CarnotCanvas engine={engine} />
            
            {/* Live State Overlay */}
            <div className="absolute top-6 left-6 flex gap-4 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col">
                <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-1">Active Stage</span>
                <span className="text-sm font-bold text-emerald-400">
                  {currentStage.replace("_", " ")}
                </span>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col">
                <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-1">Volume (V)</span>
                <span className="text-sm font-bold font-mono text-white">
                  {currentState.V.toFixed(2)} L
                </span>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col">
                <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-1">Temp (T)</span>
                <span className="text-sm font-bold font-mono text-white">
                  {currentState.T.toFixed(1)} K
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Heat Absorbed (Q_H)</div>
                <div className="text-lg font-mono font-bold text-red-400">{heatIn.toFixed(1)} J</div>
              </div>
            </div>
            
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Net Work (W)</div>
                <div className="text-lg font-mono font-bold text-emerald-400">{netWork.toFixed(1)} J</div>
              </div>
            </div>

            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Snowflake className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Heat Rejected (Q_C)</div>
                <div className="text-lg font-mono font-bold text-blue-400">{(heatIn - netWork).toFixed(1)} J</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Graph */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden h-[300px] relative shadow-lg">
            <CarnotPVGraph engine={engine} />
          </div>
          
          <CarnotControls />
          
          <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Carnot Theorem</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              No heat engine operating between two heat reservoirs can be more efficient than a reversible Carnot engine operating between those same two reservoirs.
              The theoretical maximum efficiency depends only on the temperatures of the hot ($T_H$) and cold ($T_C$) reservoirs.
            </p>
          </div>
        </div>

      </div>
    </SimulationPageLayout>
  );
};

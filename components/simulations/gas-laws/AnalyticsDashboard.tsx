"use client";

import React from "react";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { cn } from "@/lib/utils";
import { ShieldAlert, Activity, CheckCircle } from "lucide-react";

export const AnalyticsDashboard: React.FC = () => {
  const {
    measuredPressure,
    idealPressure,
    measuredTemp,
    measuredVolume,
    v_rms,
    meanSpeed,
    v_mostProbable,
    systemEnergy,
    entropy,
    compressibilityZ,
    collisionCount,
    entropyConvergence,
    isEquilibrium
  } = useGasLawsStore();

  const pressureError = idealPressure > 0 ? Math.abs((measuredPressure - idealPressure) / idealPressure) * 100 : 0;
  
  return (
    <div className="bg-[#0c0c0e]/95 border-b border-white/5 px-6 py-4 flex flex-col gap-4 select-none shrink-0 z-10 font-mono text-xs">
      
      {/* Extreme Pressure Warning Banner */}
      {measuredPressure > 5000 && (
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center justify-between text-red-400 animate-pulse text-[9px] font-bold tracking-widest uppercase">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Warning: Extreme Regime — Ideal Gas Approximation Breaking Down
          </span>
          <span className="text-red-500/80">Real-Gas Corrections Active</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        
        {/* Thermodynamics Panel */}
        <div className="flex flex-col gap-1 w-full md:w-1/3">
          <div className="text-zinc-500 mb-1 font-sans font-bold tracking-wider text-[10px]">THERMODYNAMICS</div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">P_measured (P)</span>
            <span className="text-emerald-400 font-semibold">{measuredPressure.toFixed(1)} kPa</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">P_ideal</span>
            <span className="text-emerald-500/70">{idealPressure.toFixed(1)} kPa</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Ideal Deviation</span>
            <span className={cn(
              pressureError > 12 ? "text-red-400 font-bold" : "text-emerald-500/70"
            )}>{pressureError.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
            <span className="text-zinc-400">Compressibility Z</span>
            <span className={cn(
              "font-bold",
              Math.abs(compressibilityZ - 1) < 0.01 
                ? "text-zinc-400" 
                : compressibilityZ > 1 
                  ? "text-amber-400" 
                  : "text-indigo-400"
            )}>
              {compressibilityZ.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Kinematics Panel */}
        <div className="flex flex-col gap-1 w-full md:w-1/3">
          <div className="text-zinc-500 mb-1 font-sans font-bold tracking-wider text-[10px]">KINEMATICS</div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">v_rms</span>
            <span className="text-pink-400">{v_rms.toFixed(1)} m/s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">v_average (v_bar)</span>
            <span className="text-pink-500/70">{meanSpeed.toFixed(1)} m/s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">v_most_probable (v_p)</span>
            <span className="text-pink-500/70">{v_mostProbable.toFixed(1)} m/s</span>
          </div>
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
            <span className="text-zinc-400">Collision Frequency</span>
            <span className="text-emerald-400">{collisionCount} Hz</span>
          </div>
        </div>

        {/* State & Statistical Mechanics Panel */}
        <div className="flex flex-col gap-1 w-full md:w-1/3">
          <div className="text-zinc-500 mb-1 font-sans font-bold tracking-wider text-[10px]">STATE & STAT-MECH</div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Temperature (T)</span>
            <span className="text-white font-semibold">{measuredTemp.toFixed(1)} K</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Volume (V)</span>
            <span className="text-white font-semibold">{(measuredVolume / 1000).toFixed(5)} m³ <span className="text-white/40">({measuredVolume.toFixed(1)} L)</span></span>
          </div>
          <div className="flex justify-between items-center" title="Coarse-grained Shannon spatial entropy S = -sum P_i ln P_i">
            <span className="text-zinc-400">Shannon Entropy S</span>
            <span className="text-indigo-400">{entropy.toFixed(3)} k_B <span className="text-zinc-500 text-[10px]">({entropyConvergence.toFixed(0)}%)</span></span>
          </div>
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
            <span className="text-zinc-400">Thermal State</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase font-sans flex items-center gap-1",
              isEquilibrium 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            )}>
              {isEquilibrium ? <CheckCircle className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5 animate-pulse" />}
              {isEquilibrium ? "EQUILIBRIUM" : "THERMALIZING"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { cn } from "@/lib/utils";

const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

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
    collisionCount
  } = useGasLawsStore();

  const pressureError = idealPressure > 0 ? Math.abs((measuredPressure - idealPressure) / idealPressure) * 100 : 0;
  
  return (
    <div className="bg-[#0c0c0e]/95 border-b border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-start md:justify-between gap-6 select-none shrink-0 z-10 font-mono text-xs">
      <div className="flex flex-col gap-1 w-full md:w-1/3">
        <div className="text-zinc-500 mb-1 font-sans font-bold tracking-wider text-[10px]">THERMODYNAMICS</div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">P_meas</span>
          <span className="text-emerald-400 font-semibold">{measuredPressure.toFixed(1)} kPa</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">P_ideal</span>
          <span className="text-emerald-500/70">{idealPressure.toFixed(1)} kPa</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Error %</span>
          <span className={cn(
            pressureError > 5 ? "text-red-400" : "text-emerald-500/70"
          )}>{pressureError.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
          <span className="text-zinc-400">Z-Factor</span>
          <span className="text-orange-400">{compressibilityZ.toFixed(3)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full md:w-1/3">
        <div className="text-zinc-500 mb-1 font-sans font-bold tracking-wider text-[10px]">KINEMATICS</div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">v_rms</span>
          <span className="text-pink-400">{v_rms.toFixed(1)} m/s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">v_avg</span>
          <span className="text-pink-500/70">{meanSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">v_p</span>
          <span className="text-pink-500/70">{v_mostProbable.toFixed(1)} m/s</span>
        </div>
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
          <span className="text-zinc-400">Collisions</span>
          <span className="text-emerald-400">{collisionCount} / sec</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full md:w-1/3">
        <div className="text-zinc-500 mb-1 font-sans font-bold tracking-wider text-[10px]">STATE</div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Temp</span>
          <span className="text-white font-semibold">{measuredTemp.toFixed(1)} K</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Volume</span>
          <span className="text-white font-semibold">{measuredVolume.toFixed(2)} dm³</span>
        </div>
        <div className="flex justify-between items-center" title="Coarse-grained Shannon spatial entropy calculated over a 10x10 cell grid in units of k_B (S = -sum P_i ln P_i)">
          <span className="text-zinc-400">Entropy S</span>
          <span className="text-indigo-400">{entropy.toFixed(3)} k_B</span>
        </div>
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
          <span className="text-zinc-400">Sys Energy</span>
          <span className="text-emerald-400">{systemEnergy.toFixed(1)} J</span>
        </div>
      </div>
    </div>
  );
};

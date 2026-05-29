"use client";

import React, { useMemo } from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DATABASE, ThermalExpansionPhysicsEngine } from "@/lib/physics/thermalExpansion";
import { Activity, Download, Trash2, ShieldAlert, CheckCircle, BarChart3 } from "lucide-react";

export const ThermalExpansionAnalytics: React.FC = () => {
  const {
    temperature,
    materialId,
    objectType,
    constraint,
    gapSize,
    history,
    logs,
    clearLogs,
    plasticStrain,
    fatigueAccumulated,
    isBroken,
    L0,
    crossSectionalArea
  } = useThermalExpansionStore();

  const currentMaterial = MATERIAL_DATABASE[materialId];

  // 1. Solve current macroscopic stats
  const stats = useMemo(() => {
    const dT = temperature - ThermalExpansionPhysicsEngine.T_REF;
    const alpha = ThermalExpansionPhysicsEngine.getAlphaAtT(currentMaterial, temperature);
    const length = ThermalExpansionPhysicsEngine.getLength(L0, currentMaterial, temperature, plasticStrain);
    const deltaL = length - L0;

    let stress = 0;
    let strain = 0;
    let stressStatus = "No stress (Free expansion)";
    let stressStatusColor = "text-emerald-400";

    if (objectType !== "bimetallic") {
      const res = ThermalExpansionPhysicsEngine.getStressAndStrain(L0, currentMaterial, temperature, constraint, gapSize, plasticStrain);
      stress = res.stress;
      strain = res.strain;

      const ratio = Math.abs(stress) / currentMaterial.yieldStrength;
      if (res.isBroken) {
        stressStatus = "CRITICAL: Fracture / Failure";
        stressStatusColor = "text-red-500 font-black animate-pulse";
      } else if (res.isDeformed) {
        stressStatus = "WARNING: Plastic Yielding";
        stressStatusColor = "text-amber-500 font-bold";
      } else if (ratio > 0.5) {
        stressStatus = "High Stress (Elastic)";
        stressStatusColor = "text-amber-400";
      } else if (ratio > 0.05) {
        stressStatus = "Low Stress (Elastic)";
        stressStatusColor = "text-cyan-400";
      }
    }

    const mass = currentMaterial.density * L0 * crossSectionalArea;
    const energy = mass * currentMaterial.heatCapacity * dT; // Joules

    return {
      alpha,
      length,
      deltaL,
      stress,
      strain,
      energy,
      stressStatus,
      stressStatusColor,
      mass
    };
  }, [temperature, materialId, objectType, constraint, gapSize, L0, crossSectionalArea, plasticStrain]);

  // 2. Statistical error analysis (Least Squares Fit of alpha from history)
  const errorAnalysis = useMemo(() => {
    if (history.length < 5) return null;

    // Linear fit of: y = DeltaL / L0 vs x = DeltaT
    // slope of this line is our measured alpha!
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const N = history.length;

    history.forEach(p => {
      const x = p.temp - ThermalExpansionPhysicsEngine.T_REF; // Delta T
      const y = p.deltaL / L0; // Strain
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const denominator = N * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-12) return null;

    const measuredAlpha = (N * sumXY - sumX * sumY) / denominator;
    
    // Calculate standard error (residual sum of squares)
    let residualSumSq = 0;
    history.forEach(p => {
      const x = p.temp - ThermalExpansionPhysicsEngine.T_REF;
      const y = p.deltaL / L0;
      const predictedY = measuredAlpha * x;
      residualSumSq += (y - predictedY) ** 2;
    });

    const variance = residualSumSq / (N - 2 || 1);
    const standardError = Math.sqrt(variance / (sumXX - (sumX * sumX) / N || 1));

    // Deviation from reference preset value
    const theoreticalAlpha = currentMaterial.alpha;
    const deviationPercent = (Math.abs(measuredAlpha - theoreticalAlpha) / theoreticalAlpha) * 100;

    return {
      measuredAlpha,
      standardError,
      deviationPercent,
      r2: Math.max(0, 1 - (residualSumSq / (history.reduce((acc, p) => acc + (p.deltaL / L0 - sumY / N) ** 2, 0) || 1)))
    };
  }, [history, L0, currentMaterial]);

  // Handle downloading the telemetry log as TXT
  const handleDownloadLogs = () => {
    if (logs.length === 0) return;
    const content = logs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.type.toUpperCase()}] ${l.message}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kinetiq_thermal_lab_telemetry_log.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#09090b] p-6 overflow-y-auto custom-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Title */}
        <div>
          <h2 className="text-2xl font-black text-white font-display">LABORATORY TELEMETRY & ERROR ANALYTICS</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
            Live computational readout, material limits, and standard error estimations
          </p>
        </div>

        {/* 1. Primary Numerical Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Temperature", value: `${temperature.toFixed(1)} K`, desc: `${(temperature - 273.15).toFixed(1)} °C`, color: "text-amber-400" },
            { label: "Expansion Coefficient (α)", value: `${(stats.alpha * 1e6).toFixed(2)} ×10⁻⁶`, desc: "per Kelvin (1/K)", color: "text-cyan-400" },
            { label: "Total Length (L)", value: `${stats.length.toFixed(5)} m`, desc: `ΔL: ${(stats.deltaL * 1000).toFixed(3)} mm`, color: "text-white" },
            { label: "Internal Heat Energy (Q)", value: `${(stats.energy / 1000).toFixed(1)} kJ`, desc: `Absorbed / Transferred`, color: "text-orange-400" }
          ].map(item => (
            <div key={item.label} className="bg-[#18181b] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{item.label}</span>
              <div className="mt-2.5">
                <span className={`text-lg font-mono font-black ${item.color}`}>{item.value}</span>
                <span className="block text-[9px] text-white/40 font-mono mt-0.5">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Advanced Stress / Strain HUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 md:col-span-2 space-y-4">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Activity className="w-4 h-4" />
              Structural Stress & Fatigue Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Mechanical Strain (ε)</span>
                <span className="text-white font-black block">{stats.strain.toExponential(4)}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Structural Stress (σ)</span>
                <span className="text-white font-black block">
                  {objectType === "bimetallic" ? "N/A" : `${stats.stress.toFixed(2)} MPa`}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Yield Failure Limit</span>
                <span className="text-rose-400 font-bold block">{currentMaterial.yieldStrength} MPa</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Safety Status</span>
                <span className={stats.stressStatusColor}>{stats.stressStatus}</span>
              </div>
            </div>

            {/* Fatigue Damage Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-white/40 uppercase tracking-wider">
                <span>Fatigue Accumulation Damage</span>
                <span className={fatigueAccumulated >= 0.8 ? "text-red-400" : "text-white"}>
                  {(fatigueAccumulated * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    fatigueAccumulated >= 0.8 ? "bg-red-500" : fatigueAccumulated >= 0.4 ? "bg-amber-500" : "bg-cyan-500"
                  }`}
                  style={{ width: `${fatigueAccumulated * 100}%` }}
                />
              </div>
            </div>

            {/* Plastic Permanent Strain */}
            <div className="flex justify-between items-center bg-black/35 p-3 rounded-xl border border-white/5 text-[10px] font-mono">
              <span className="text-white/40 uppercase tracking-wider font-bold">Plastic Strain (Creep Hysteresis)</span>
              <span className={plasticStrain !== 0 ? "text-amber-400 font-black" : "text-white/60"}>
                {plasticStrain.toExponential(3)} (Permanent)
              </span>
            </div>
          </div>

          {/* Material Yield strength limit card */}
          <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">
                Material Limits
              </h4>
              <div className="space-y-2 text-[10px] font-mono text-white/60">
                <div className="flex justify-between">
                  <span>Young&apos;s Modulus:</span>
                  <strong className="text-white">{currentMaterial.youngsModulus} GPa</strong>
                </div>
                <div className="flex justify-between">
                  <span>Density:</span>
                  <strong className="text-white">{currentMaterial.density} kg/m³</strong>
                </div>
                <div className="flex justify-between">
                  <span>Melting Point:</span>
                  <strong className="text-white">{currentMaterial.meltingPoint} K</strong>
                </div>
                <div className="flex justify-between">
                  <span>Thermal Conductivity:</span>
                  <strong className="text-white">{currentMaterial.thermalConductivity} W/m·K</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              {isBroken ? (
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <div className="text-[9px] text-white/40 leading-relaxed font-mono">
                {isBroken ? (
                  <span className="text-red-400 font-black">MATERIAL FRACTURED</span>
                ) : (
                  <span>MATERIAL INTEGRITY SOLID</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. Statistical Least-Squares Error Estimation */}
        <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5">
          <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2 mb-4">
            <BarChart3 className="w-4 h-4" />
            Statistical Regression: Derived Expansion Coefficient
          </h3>

          {errorAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
              <div className="space-y-3">
                <div>
                  <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Derived Slope Coefficient (α_fit)</span>
                  <span className="text-white font-black block text-sm mt-0.5">
                    {errorAnalysis.measuredAlpha.toExponential(5)} / K
                  </span>
                </div>
                <div>
                  <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Reference Preset (α_theory)</span>
                  <span className="text-cyan-400 font-bold block">
                    {currentMaterial.alpha.toExponential(2)} / K
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Standard Error (Standard Deviation)</span>
                  <span className="text-white/80 block">
                    ± {errorAnalysis.standardError.toExponential(4)}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 uppercase text-[9px] font-bold tracking-wider">Percentage Deviation</span>
                  <span className={errorAnalysis.deviationPercent > 2.0 ? "text-amber-400 font-bold block" : "text-emerald-400 font-bold block"}>
                    {errorAnalysis.deviationPercent.toFixed(3)} % {errorAnalysis.deviationPercent > 2.0 ? "(Non-linear Drift)" : "(High Fit)"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/40 font-mono py-2 italic text-center">
              Requires at least 5 telemetry coordinates (start temperature change to compile).
            </div>
          )}
        </div>

        {/* 4. Event Log Console */}
        <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 flex flex-col h-[280px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Live Instrumentation Event Log
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadLogs}
                disabled={logs.length === 0}
                className="p-1.5 bg-black/40 hover:bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-lg transition-all"
                title="Download raw logs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={clearLogs}
                className="p-1.5 bg-black/40 hover:bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-lg transition-all text-red-400/80 hover:text-red-400"
                title="Clear Logs Console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-white/70 space-y-1.5 pr-2 select-text custom-scrollbar">
            {logs.map((l, index) => (
              <div key={index} className="flex gap-3 leading-relaxed">
                <span className="text-white/20 select-none">
                  {new Date(l.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={
                  l.type === "error" ? "text-red-400" : l.type === "warning" ? "text-amber-400" : "text-white/70"
                }>
                  {l.message}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center text-white/20 italic py-10">No events logged.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

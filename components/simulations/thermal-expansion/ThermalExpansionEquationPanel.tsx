"use client";

import React from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";

// ============================================================
// Live Equation Engine Panel
// Shows formula → live substitution → result for every experiment
// ============================================================

interface EquationRow {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  unit: string;
  color: string;
}

export const ThermalExpansionEquationPanel: React.FC = () => {
  const {
    experimentMode,
    materialId,
    bimetallicMat1,
    bimetallicMat2,
    avgTemperature,
    L0,
    thickness,
    crossSectionalArea,
    diameter,
    constraint,
    gapSize,
    realDeltaL,
    stressAtConstraint,
    mechanicalStrain,
    bimetallicCurvature,
    bimetallicDeflection,
    bucklingCriticalLoad,
    bucklingLoad,
    fatigueAccumulated,
    cycleCount,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];
  const mat1 = MATERIAL_DB[bimetallicMat1];
  const mat2 = MATERIAL_DB[bimetallicMat2];

  const dT = avgTemperature - PhysicsEngine.T_REF;
  const alpha = mat ? PhysicsEngine.alpha(mat, avgTemperature) : 0;
  const E = mat ? PhysicsEngine.youngsModulus(mat, avgTemperature) : 0;
  const sigma_y = mat ? PhysicsEngine.yieldStrength(mat, avgTemperature) : 0;

  // Format helpers
  const fmtAlpha = (a: number) => `${(a * 1e6).toFixed(2)}×10⁻⁶`;
  const fmtE = (e: number) => `${(e / 1e9).toFixed(0)}×10⁹`;
  const fmtMPa = (pa: number) => `${(pa / 1e6).toFixed(1)}`;
  const fmtm = (m: number) => Math.abs(m) >= 0.001 ? `${m.toFixed(4)}` : m.toExponential(3);
  const fmtT = (T: number) => T.toFixed(1);
  const fmtL = (l: number) => l.toFixed(2);

  // Build equations based on mode
  const equations: EquationRow[] = [];

  if (!mat) return null;

  if (experimentMode === "free_expansion" || experimentMode === "cryogenic" || experimentMode === "precision") {
    equations.push({
      label: "Linear Thermal Expansion",
      formula: "ΔL = α · L₀ · ΔT",
      substitution: `ΔL = (${fmtAlpha(alpha)}) · ${fmtL(L0)} · (${fmtT(dT)})`,
      result: `ΔL = ${fmtm(realDeltaL)} m`,
      unit: `= ${(realDeltaL * 1000).toFixed(3)} mm`,
      color: "text-cyan-400"
    });
    equations.push({
      label: "Final Length",
      formula: "L = L₀ (1 + α ΔT)",
      substitution: `L = ${fmtL(L0)} · (1 + ${fmtAlpha(alpha)} · ${fmtT(dT)})`,
      result: `L = ${PhysicsEngine.rodLength(mat, L0, avgTemperature).toFixed(6)} m`,
      unit: `ε_th = ${(alpha * dT * 100).toFixed(5)}%`,
      color: "text-emerald-400"
    });
  }

  if (experimentMode === "fixed_constraint") {
    equations.push({
      label: "Thermal Strain (Constrained)",
      formula: "ε_th = α · ΔT",
      substitution: `ε_th = (${fmtAlpha(alpha)}) · (${fmtT(dT)})`,
      result: `ε_th = ${(alpha * dT).toExponential(4)}`,
      unit: "(dimensionless)",
      color: "text-amber-400"
    });
    equations.push({
      label: "Thermal Stress (Hooke's Law)",
      formula: "σ = −E · α · ΔT",
      substitution: `σ = −(${fmtE(E)}) · (${fmtAlpha(alpha)}) · (${fmtT(dT)})`,
      result: `σ = ${fmtMPa(stressAtConstraint)} MPa`,
      unit: `σ_y = ${fmtMPa(sigma_y)} MPa`,
      color: Math.abs(stressAtConstraint) > sigma_y ? "text-red-400" : "text-amber-400"
    });
  }

  if (experimentMode === "bimetallic" || experimentMode === "spacecraft") {
    const a1 = mat1 ? PhysicsEngine.alpha(mat1, avgTemperature) : 0;
    const a2 = mat2 ? PhysicsEngine.alpha(mat2, avgTemperature) : 0;
    equations.push({
      label: "Bimetallic Curvature (Timoshenko 1925)",
      formula: "κ = [6(α₂−α₁)(1+m)² ΔT] / [t·D]",
      substitution: `κ = [6·(${fmtAlpha(a2)}−${fmtAlpha(a1)})·4·(${fmtT(dT)})] / [${thickness.toFixed(3)}·D]`,
      result: `κ = ${bimetallicCurvature.toFixed(4)} m⁻¹`,
      unit: `R = ${bimetallicCurvature !== 0 ? (1 / Math.abs(bimetallicCurvature)).toFixed(2) : "∞"} m`,
      color: "text-purple-400"
    });
    equations.push({
      label: "Tip Deflection",
      formula: "δ = κ L² / 2",
      substitution: `δ = ${bimetallicCurvature.toFixed(4)} · ${L0}² / 2`,
      result: `δ = ${(bimetallicDeflection * 1000).toFixed(3)} mm`,
      unit: "(cantilever end-point)",
      color: "text-pink-400"
    });
  }

  if (experimentMode === "railway_buckling") {
    const I = (Math.PI / 64) * Math.pow(diameter, 4);
    equations.push({
      label: "Euler Buckling Critical Load",
      formula: "P_cr = π²EI / (KL)²",
      substitution: `P_cr = π²·(${fmtE(E)})·${(I * 1e6).toFixed(2)}×10⁻⁶ / (1·${fmtL(L0)})²`,
      result: `P_cr = ${(bucklingCriticalLoad / 1e3).toFixed(1)} kN`,
      unit: "",
      color: bucklingLoad > bucklingCriticalLoad ? "text-red-400" : "text-cyan-400"
    });
    equations.push({
      label: "Thermal Compressive Load",
      formula: "P_th = E · α · ΔT · A",
      substitution: `P_th = (${fmtE(E)})·(${fmtAlpha(alpha)})·(${fmtT(dT)})·${(crossSectionalArea * 1e4).toFixed(3)}×10⁻⁴`,
      result: `P_th = ${(bucklingLoad / 1e3).toFixed(1)} kN`,
      unit: bucklingLoad > bucklingCriticalLoad ? "⚠ P > P_cr → BUCKLING" : "P < P_cr → stable",
      color: bucklingLoad > bucklingCriticalLoad ? "text-red-400" : "text-emerald-400"
    });
  }

  if (experimentMode === "thermal_shock") {
    const sigma_shock = (E * mat.alpha0 * Math.abs(dT)) / (1 - mat.poissonsRatio);
    equations.push({
      label: "Biaxial Thermal Shock Stress",
      formula: "σ_shock = Eα ΔT / (1−ν)",
      substitution: `σ_shock = (${fmtE(E)})·(${fmtAlpha(alpha)})·(${fmtT(Math.abs(dT))}) / (1−${mat.poissonsRatio})`,
      result: `σ_shock = ${(sigma_shock / 1e6).toFixed(0)} MPa`,
      unit: `σ_y = ${fmtMPa(sigma_y)} MPa`,
      color: sigma_shock > sigma_y ? "text-red-400" : "text-amber-400"
    });
  }

  if (experimentMode === "fatigue") {
    const { damagePerCycle, Nf } = mat
      ? PhysicsEngine.fatigueDamagePerCycle(mat, 373 - 275, 373 + 275)
      : { damagePerCycle: 0, Nf: 0 };
    equations.push({
      label: "Palmgren-Miner Damage Rule",
      formula: "D = n / N_f",
      substitution: `D = ${cycleCount} / ${Nf.toLocaleString()}`,
      result: `D = ${(fatigueAccumulated * 100).toFixed(2)}%`,
      unit: fatigueAccumulated >= 1 ? "⚠ FATIGUE FAILURE" : "Remaining life: " + ((1 - fatigueAccumulated) * 100).toFixed(1) + "%",
      color: fatigueAccumulated > 0.8 ? "text-red-400" : "text-amber-400"
    });
    equations.push({
      label: "Cycles to Failure (Basquin's Law)",
      formula: "N_f = (σ_f' / σ_a)^(1/b)",
      substitution: `N_f = (${fmtMPa(mat.yieldStrength * 1.5)} / Δσ)^(1/0.12)`,
      result: `N_f ≈ ${Nf.toLocaleString()} cycles`,
      unit: `Δσ from ΔT = ${Math.abs(275 * 2).toFixed(0)} K cycle`,
      color: "text-orange-400"
    });
  }

  if (experimentMode === "bridge_gap") {
    equations.push({
      label: "Linear Thermal Expansion",
      formula: "ΔL = α · L₀ · ΔT",
      substitution: `ΔL = (${fmtAlpha(alpha)}) · ${fmtL(L0)} · (${fmtT(dT)})`,
      result: `ΔL = ${(realDeltaL * 1000).toFixed(3)} mm`,
      unit: `Gap = ${(gapSize * 1000).toFixed(1)} mm`,
      color: realDeltaL > gapSize ? "text-red-400" : "text-cyan-400"
    });
    equations.push({
      label: "Gap Status",
      formula: "Constraint activates when ΔL > gap",
      substitution: `${(realDeltaL * 1000).toFixed(3)} mm ${realDeltaL > gapSize ? ">" : "<"} ${(gapSize * 1000).toFixed(1)} mm`,
      result: realDeltaL > gapSize ? "CONSTRAINED — σ builds" : "FREE — σ = 0",
      unit: realDeltaL > gapSize ? `σ = ${fmtMPa(stressAtConstraint)} MPa` : "",
      color: realDeltaL > gapSize ? "text-amber-400" : "text-emerald-400"
    });
  }

  return (
    <div className="shrink-0 bg-[#0e0e12] border-t border-white/5 px-4 py-3 select-none">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Live Equation Engine</span>
        <span className="ml-auto text-[8px] font-mono text-white/25">{experimentMode.replace(/_/g, " ").toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {equations.map((eq, i) => (
          <div key={i} className="bg-black/40 rounded-xl border border-white/5 px-3.5 py-2.5">
            <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-1.5">{eq.label}</div>
            <div className="grid grid-cols-3 gap-1.5 text-[9.5px] font-mono">
              {/* Formula */}
              <div className="bg-black/40 rounded-lg px-2 py-1.5 border border-white/5">
                <div className="text-[7px] text-white/25 uppercase tracking-wider mb-0.5">Formula</div>
                <div className="text-white/70 font-bold">{eq.formula}</div>
              </div>
              {/* Substitution */}
              <div className="bg-black/40 rounded-lg px-2 py-1.5 border border-white/5">
                <div className="text-[7px] text-white/25 uppercase tracking-wider mb-0.5">Substitution</div>
                <div className="text-white/55 text-[8px] leading-relaxed break-words">{eq.substitution}</div>
              </div>
              {/* Result */}
              <div className="bg-black/40 rounded-lg px-2 py-1.5 border border-white/5">
                <div className="text-[7px] text-white/25 uppercase tracking-wider mb-0.5">Result</div>
                <div className={`font-black ${eq.color}`}>{eq.result}</div>
                {eq.unit && <div className="text-[7.5px] text-white/30 mt-0.5">{eq.unit}</div>}
              </div>
            </div>
          </div>
        ))}

        {equations.length === 0 && (
          <div className="text-[9px] text-white/20 italic text-center py-2">
            Select an experiment mode to see live equations.
          </div>
        )}
      </div>
    </div>
  );
};

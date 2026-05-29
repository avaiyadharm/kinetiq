"use client";

import React from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";

// ============================================================
// Engineering-Grade Analytics Page
// ============================================================

const Stat: React.FC<{ label: string; value: string; unit?: string; color?: string; sub?: string }> = ({
  label, value, unit, color = "text-white", sub
}) => (
  <div className="bg-[#18181b] px-4 py-3.5 rounded-xl border border-white/5 space-y-0.5">
    <div className="text-[8px] font-black text-white/30 uppercase tracking-widest">{label}</div>
    <div className={`text-sm font-mono font-black ${color} flex items-baseline gap-1.5`}>
      {value}
      {unit && <span className="text-[9px] text-white/35 font-normal">{unit}</span>}
    </div>
    {sub && <div className="text-[8px] font-mono text-white/25">{sub}</div>}
  </div>
);

export const ThermalExpansionAnalytics: React.FC = () => {
  const {
    avgTemperature,
    materialId,
    L0,
    crossSectionalArea,
    diameter,
    constraint,
    objectType,
    experimentMode,
    realDeltaL,
    stressAtConstraint,
    mechanicalStrain,
    factorOfSafety,
    isYielding,
    isFailed,
    fatigueAccumulated,
    cycleCount,
    plasticStrain,
    bucklingCriticalLoad,
    bucklingLoad,
    willBuckle,
    bimetallicCurvature,
    bimetallicDeflection,
    bimetallicMat1,
    bimetallicMat2,
    history,
    thermalProfile,
    vizSettings,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];
  const mat1 = MATERIAL_DB[bimetallicMat1];
  const mat2 = MATERIAL_DB[bimetallicMat2];

  if (!mat) return null;

  const dT = avgTemperature - PhysicsEngine.T_REF;
  const alpha = PhysicsEngine.alpha(mat, avgTemperature);
  const E = PhysicsEngine.youngsModulus(mat, avgTemperature);
  const σ_y = PhysicsEngine.yieldStrength(mat, avgTemperature);
  const alpha_th = PhysicsEngine.thermalDiffusivity(mat);

  const thermalStrain = alpha * dT;
  const volume = crossSectionalArea * L0;
  const strainEnergy = Math.abs(stressAtConstraint) > 0
    ? PhysicsEngine.strainEnergy(stressAtConstraint, volume, E)
    : 0;
  const volumeExpanded = PhysicsEngine.volumetricExpansion(mat, avgTemperature, volume);

  const maxT = Math.max(...thermalProfile);
  const minT = Math.min(...thermalProfile);
  const thermalGradient = (maxT - minT) / L0; // K/m

  const I = (Math.PI / 64) * Math.pow(diameter, 4);
  const r_gyration = Math.sqrt(I / crossSectionalArea);
  const slenderness = L0 / r_gyration;

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto custom-scrollbar select-text">
      <div className="max-w-5xl mx-auto p-8 pb-16 space-y-8">

        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Engineering Analysis
          </h2>
          <p className="text-sm text-cyan-400 mt-1 font-mono uppercase tracking-wider">
            {mat.name} · {experimentMode.replace(/_/g, " ").toUpperCase()} · {avgTemperature.toFixed(1)} K
          </p>
        </div>

        {/* Material Properties at Current Temperature */}
        <section>
          <h3 className="text-base font-bold text-white/80 mb-3 font-display flex items-center gap-2">
            Material State at T = {avgTemperature.toFixed(0)} K
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="α(T) — CTE"
              value={`${(alpha * 1e6).toFixed(3)}`}
              unit="×10⁻⁶ /K"
              color="text-cyan-400"
              sub="Temperature-corrected"
            />
            <Stat
              label="E(T) — Young's Modulus"
              value={`${(E / 1e9).toFixed(1)}`}
              unit="GPa"
              color="text-amber-400"
              sub={`E₀ = ${(mat.youngsModulus / 1e9).toFixed(0)} GPa`}
            />
            <Stat
              label="σ_y(T) — Yield Strength"
              value={`${(σ_y / 1e6).toFixed(0)}`}
              unit="MPa"
              color="text-orange-400"
              sub={`σ_y0 = ${(mat.yieldStrength / 1e6).toFixed(0)} MPa`}
            />
            <Stat
              label="α_th — Thermal Diffusivity"
              value={alpha_th.toExponential(2)}
              unit="m²/s"
              color="text-purple-400"
              sub="k/(ρ·cₚ)"
            />
            <Stat
              label="Density ρ"
              value={mat.density.toLocaleString()}
              unit="kg/m³"
              color="text-white/70"
              sub={mat.crystalStructure}
            />
            <Stat
              label="k — Conductivity"
              value={mat.thermalConductivity.toFixed(1)}
              unit="W/(m·K)"
              color="text-white/70"
            />
            <Stat
              label="Poisson's Ratio ν"
              value={mat.poissonsRatio.toFixed(3)}
              unit=""
              color="text-white/70"
            />
            <Stat
              label="Melting Point T_m"
              value={mat.meltingPoint.toFixed(0)}
              unit="K"
              color={avgTemperature > mat.meltingPoint * 0.9 ? "text-red-400" : "text-white/70"}
              sub={`T/T_m = ${(avgTemperature / mat.meltingPoint * 100).toFixed(0)}%`}
            />
          </div>
        </section>

        {/* Thermal Expansion Results */}
        <section>
          <h3 className="text-base font-bold text-white/80 mb-3 font-display">Thermal Expansion Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="ΔL — Real Expansion"
              value={realDeltaL >= 0.001
                ? `+${(realDeltaL * 1000).toFixed(3)}`
                : `${(realDeltaL * 1e6).toFixed(2)}`}
              unit={realDeltaL >= 0.001 ? "mm" : "μm"}
              color={realDeltaL >= 0 ? "text-emerald-400" : "text-blue-400"}
              sub={`Visual × ${vizSettings.magnification}`}
            />
            <Stat
              label="ε_th — Thermal Strain"
              value={(thermalStrain * 100).toFixed(5)}
              unit="%"
              color="text-cyan-400"
              sub="α · ΔT (dimensionless)"
            />
            <Stat
              label="ΔT from reference"
              value={dT >= 0 ? `+${dT.toFixed(1)}` : dT.toFixed(1)}
              unit="K"
              color={dT > 0 ? "text-amber-400" : "text-blue-400"}
              sub="from 293.15 K (20°C)"
            />
            <Stat
              label="V — Volume"
              value={(volumeExpanded * 1e6).toFixed(4)}
              unit="×10⁻⁶ m³"
              color="text-white/70"
              sub={`γ ΔT ≈ 3α ΔT = ${(3 * alpha * dT * 100).toFixed(4)}%`}
            />
          </div>
        </section>

        {/* Stress & Structural Integrity */}
        <section>
          <h3 className="text-base font-bold text-white/80 mb-3 font-display">Structural Mechanics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="σ — Thermal Stress"
              value={(stressAtConstraint / 1e6).toFixed(1)}
              unit="MPa"
              color={Math.abs(stressAtConstraint) > σ_y ? "text-red-400" : "text-amber-400"}
              sub={`σ = ${constraint !== "free" ? "E·α·ΔT" : "0 (free)"}`}
            />
            <Stat
              label="Factor of Safety"
              value={factorOfSafety >= 999 ? "∞" : factorOfSafety.toFixed(2)}
              color={factorOfSafety < 1 ? "text-red-400" : factorOfSafety < 2 ? "text-amber-400" : "text-emerald-400"}
              sub="σ_y / |σ| — min 2.0 for design"
            />
            <Stat
              label="U — Elastic Strain Energy"
              value={strainEnergy.toFixed(3)}
              unit="J"
              color="text-white/70"
              sub="σ²V/(2E)"
            />
            <Stat
              label="ε_plastic — Permanent Strain"
              value={plasticStrain.toExponential(3)}
              color={plasticStrain > 0 ? "text-amber-400" : "text-white/40"}
              sub={plasticStrain > 0 ? "Plastic deformation active" : "No plastic deformation"}
            />
            <Stat
              label="Status"
              value={isFailed ? "FRACTURED" : isYielding ? "YIELDING" : "ELASTIC"}
              color={isFailed ? "text-red-400" : isYielding ? "text-amber-400" : "text-emerald-400"}
            />
            <Stat
              label="Fatigue Damage D"
              value={`${(fatigueAccumulated * 100).toFixed(2)}`}
              unit="%"
              color={fatigueAccumulated > 0.8 ? "text-red-400" : "text-white/70"}
              sub={`${cycleCount} cycles (Palmgren-Miner)`}
            />
            <Stat
              label="ΔT_max Spatial"
              value={thermalGradient.toFixed(1)}
              unit="K/m"
              color={thermalGradient > 100 ? "text-amber-400" : "text-white/70"}
              sub={`Max: ${maxT.toFixed(0)} K, Min: ${minT.toFixed(0)} K`}
            />
            <Stat
              label="σ_shock — Biaxial"
              value={((E * alpha * Math.abs(dT)) / (1 - mat.poissonsRatio) / 1e6).toFixed(0)}
              unit="MPa"
              color="text-white/60"
              sub="EαΔT/(1−ν)"
            />
          </div>
        </section>

        {/* Buckling */}
        <section>
          <h3 className="text-base font-bold text-white/80 mb-3 font-display">Euler Column Buckling Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="P_cr — Critical Load"
              value={(bucklingCriticalLoad / 1e3).toFixed(1)}
              unit="kN"
              color="text-cyan-400"
              sub="π²EI/(KL)² — pin-pin K=1"
            />
            <Stat
              label="P_th — Thermal Load"
              value={(bucklingLoad / 1e3).toFixed(1)}
              unit="kN"
              color={willBuckle ? "text-red-400" : "text-white/70"}
              sub={willBuckle ? "⚠ P > P_cr → BUCKLE" : "P < P_cr → stable"}
            />
            <Stat
              label="I — Moment of Inertia"
              value={(I * 1e8).toFixed(3)}
              unit="×10⁻⁸ m⁴"
              color="text-white/60"
              sub={`d = ${(diameter * 100).toFixed(1)} cm`}
            />
            <Stat
              label="Slenderness Ratio"
              value={slenderness.toFixed(0)}
              color={slenderness > 200 ? "text-amber-400" : "text-white/70"}
              sub="KL/r_g — >200: slender column"
            />
          </div>
        </section>

        {/* Bimetallic */}
        {(objectType === "bimetallic" || experimentMode === "bimetallic" || experimentMode === "spacecraft") && mat1 && mat2 && (
          <section>
            <h3 className="text-base font-bold text-white/80 mb-3 font-display">Bimetallic Strip Analysis (Timoshenko)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat
                label="κ — Curvature"
                value={bimetallicCurvature.toFixed(5)}
                unit="m⁻¹"
                color="text-purple-400"
              />
              <Stat
                label="R — Radius of Curvature"
                value={bimetallicCurvature !== 0 ? (1 / Math.abs(bimetallicCurvature)).toFixed(2) : "∞"}
                unit="m"
                color="text-white/70"
              />
              <Stat
                label="δ — Tip Deflection"
                value={(bimetallicDeflection * 1000).toFixed(3)}
                unit="mm"
                color="text-pink-400"
                sub="κL²/2 (cantilever)"
              />
              <Stat
                label={`α₁ — ${mat1.name.split(" ")[0]}`}
                value={`${(PhysicsEngine.alpha(mat1, avgTemperature) * 1e6).toFixed(2)}`}
                unit="×10⁻⁶/K"
                color="text-white/60"
              />
              <Stat
                label={`α₂ — ${mat2.name.split(" ")[0]}`}
                value={`${(PhysicsEngine.alpha(mat2, avgTemperature) * 1e6).toFixed(2)}`}
                unit="×10⁻⁶/K"
                color="text-white/60"
              />
              <Stat
                label="Δα — Mismatch"
                value={`${((PhysicsEngine.alpha(mat2, avgTemperature) - PhysicsEngine.alpha(mat1, avgTemperature)) * 1e6).toFixed(3)}`}
                unit="×10⁻⁶/K"
                color="text-amber-400"
              />
            </div>
          </section>
        )}

        {/* Raw Log */}
        <section>
          <h3 className="text-base font-bold text-white/80 mb-3 font-display">Physics Engine Log</h3>
          <div className="bg-black/40 rounded-xl border border-white/5 p-4 max-h-52 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-1">
            {useThermalExpansionStore.getState().logs.slice(0, 60).map((log, i) => (
              <div key={i} className={
                log.type === "error" ? "text-red-400" :
                log.type === "warning" ? "text-amber-400" :
                "text-white/35"
              }>
                <span className="text-white/20 mr-2">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                {log.message}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

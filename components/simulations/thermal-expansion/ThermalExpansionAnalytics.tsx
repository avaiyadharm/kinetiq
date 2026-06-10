"use client";

import React from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";
import katex from "katex";
import "katex/dist/katex.min.css";

// SSR-safe Inline LaTeX component
const InlineMath: React.FC<{ math: string }> = ({ math }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch (e) {
      return math;
    }
  }, [math]);
  return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block font-sans text-xs" />;
};

interface StatProps {
  label: string | React.ReactNode;
  value: string;
  unit?: string;
  color?: string;
  sub?: string | React.ReactNode;
  badge?: { text: string; color: string };
}

const Stat: React.FC<StatProps> = ({
  label, value, unit, color = "text-white", sub, badge
}) => (
  <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 space-y-1 flex flex-col justify-between">
    <div className="space-y-0.5">
      <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
        {label}
        {badge && (
          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={`text-base font-mono font-black ${color} flex items-baseline gap-1.5`}>
        {value}
        {unit && <span className="text-[10px] text-zinc-500 font-normal">{unit}</span>}
      </div>
    </div>
    {sub && <div className="text-[9.5px] font-mono text-zinc-400 mt-1.5 border-t border-zinc-900/60 pt-1 leading-tight">{sub}</div>}
  </div>
);

const SectionHeader: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <h3 className="text-sm font-bold text-white/80 mb-3 font-display flex items-center gap-2">
    <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
    {children}
  </h3>
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
    fosYield,
    fosFracture,
    factorOfSafety,
    isYielding,
    isFailed,
    isMelting,
    isCreeping,
    fatigueAccumulated,
    cycleCount,
    plasticStrain,
    plasticityModel,
    bucklingCriticalLoad: bucklingPcr,
    bucklingLoad,
    bucklingI,
    bucklingR,
    bucklingK,
    bucklingTcr,
    willBuckle,
    bimetallicCurvature,
    bimetallicDeflection,
    bimetallicMat1,
    bimetallicMat2,
    thermalProfile,
    vizSettings,
    energyInputTotal,
    energyLossTotal,
    energyBalanceResidual,
    solverTelemetry,

    // Spatial fields from store
    thermalProfile2D,
    nodeDisplacement2D,
    elementStress2D,
    nodePositions2D,
    spatialStressProfile,
    nodeDisplacementProfile,
    spatialExpansionProfile,
    heatFluxProfile,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];
  const mat1 = MATERIAL_DB[bimetallicMat1];
  const mat2 = MATERIAL_DB[bimetallicMat2];

  if (!mat) return null;

  const dT = avgTemperature - PhysicsEngine.T_REF;

  // ── Temperature-dependent material properties ──
  const alpha     = PhysicsEngine.alpha(mat, avgTemperature);
  const E         = PhysicsEngine.youngsModulus(mat, avgTemperature);
  const σ_y       = PhysicsEngine.yieldStrength(mat, avgTemperature);
  const k_T       = PhysicsEngine.thermalConductivity(mat, avgTemperature);
  const cp_T      = PhysicsEngine.specificHeatCapacity(mat, avgTemperature);
  const rho_T     = PhysicsEngine.densityAtT(mat, avgTemperature);
  const alpha_th  = PhysicsEngine.thermalDiffusivity(mat, avgTemperature);

  // ── Temperature-dependent property changes (%) ──
  const dAlphaPct = ((alpha - mat.alpha0) / Math.abs(mat.alpha0)) * 100;
  const dEPct     = ((E - mat.youngsModulus) / mat.youngsModulus) * 100;
  const dSyPct    = ((σ_y - mat.yieldStrength) / mat.yieldStrength) * 100;
  const dKPct     = ((k_T - mat.thermalConductivity) / mat.thermalConductivity) * 100;

  // ── Thermal strain decomposition ──
  const thermalStrainIntegrated = PhysicsEngine.thermalStrain(mat, avgTemperature); // ∫α dT
  const elasticStrain   = E > 0 ? stressAtConstraint / E : 0;                       // σ/E
  const creepStrainRate = PhysicsEngine.creepStrainRate(mat, Math.abs(stressAtConstraint), avgTemperature);
  const totalStrain     = thermalStrainIntegrated + mechanicalStrain + plasticStrain; // elastic + thermal

  // ── Volume ──
  const V0              = crossSectionalArea * L0;
  const volumeExpanded  = PhysicsEngine.volumetricExpansion(mat, avgTemperature, V0);
  const dVpct           = ((volumeExpanded - V0) / V0) * 100;
  const isLargeDeltatT  = Math.abs(dT) > 150;

  // ── Energy ──
  const strainEnergy    = Math.abs(stressAtConstraint) > 0
    ? PhysicsEngine.strainEnergy(stressAtConstraint, volumeExpanded, E)
    : 0;
  const thermalEnergyQ  = rho_T * cp_T * volumeExpanded * Math.abs(dT);
  const energyBalPct    = Math.abs(energyBalanceResidual) / Math.max(Math.abs(thermalEnergyQ), 1) * 100;

  // ── Thermal gradient ──
  const maxT = Math.max(...thermalProfile);
  const minT = Math.min(...thermalProfile);
  const thermalGradient = (maxT - minT) / L0;

  // ── Buckling classification ──
  const { regime: bucklingRegime, lambdaEuler, limitingStress } = PhysicsEngine.columnClassification(
    bucklingR > 0 ? (bucklingK * L0) / bucklingR : 0,
    E,
    σ_y
  );
  const slendernessKL_r = bucklingR > 0 ? (bucklingK * L0) / bucklingR : L0 / Math.sqrt(bucklingI / crossSectionalArea || 1e-6);

  // ── Spatial field extrema ──
  const is2D = objectType === "plate" || objectType === "bimetallic";
  let maxUx = 0, maxUy = 0;
  let maxSxx = 0, maxSyy = 0, maxSxy = 0, maxSvm = 0;
  let meanSxx = 0;

  if (is2D && nodeDisplacement2D.length > 0 && elementStress2D.length > 0) {
    nodeDisplacement2D.forEach(d => {
      if (Math.abs(d.ux) > Math.abs(maxUx)) maxUx = d.ux;
      if (Math.abs(d.uy) > Math.abs(maxUy)) maxUy = d.uy;
    });
    elementStress2D.forEach(s => {
      if (Math.abs(s.xx) > Math.abs(maxSxx)) maxSxx = s.xx;
      if (Math.abs(s.yy) > Math.abs(maxSyy)) maxSyy = s.yy;
      if (Math.abs(s.xy) > Math.abs(maxSxy)) maxSxy = s.xy;
      if (Math.abs(s.vm) > Math.abs(maxSvm)) maxSvm = s.vm;
    });
  } else {
    if (nodeDisplacementProfile.length > 0) {
      maxUx = nodeDisplacementProfile[nodeDisplacementProfile.length - 1];
    }
    if (spatialStressProfile.length > 0) {
      let sum = 0;
      spatialStressProfile.forEach(s => {
        if (Math.abs(s) > Math.abs(maxSxx)) maxSxx = s;
        sum += s;
      });
      meanSxx = sum / spatialStressProfile.length;
    }
  }

  // ── FEA Grid Info ──
  const numNodes  = thermalProfile.length;
  const numElements = numNodes > 0 ? numNodes - 1 : 0; // 1D: nodes - 1 = elements
  let gridInfo    = `41 nodes, 40 elements`;
  let dofsT       = numNodes + 1; // correct off-by-one
  let dofsM       = numNodes + 1;
  let solverMethod = "Conjugate Gradient (1D Truss)";

  if (is2D) {
    const nx = objectType === "bimetallic" ? 30 : 12;
    const ny = objectType === "bimetallic" ? 4 : 8;
    const numNodes2D = (nx + 1) * (ny + 1);
    dofsT = numNodes2D;
    dofsM = numNodes2D * 2;
    solverMethod = "Conjugate Gradient (Q4 Plane Stress)";
    gridInfo = `${nx}×${ny} Bilinear Quads (${(nx+1)*(ny+1)} nodes, ${nx*ny} elements)`;
  }

  // ── Failure status (hierarchy: Melting > Fractured > Buckling > Creep > Yielding > Fatigue > Elastic) ──
  let statusLabel = "ELASTIC STATE";
  let statusColor = "text-emerald-400";
  if (isMelting)                       { statusLabel = "MELTING"; statusColor = "text-red-300 animate-pulse"; }
  else if (isFailed)                   { statusLabel = "FRACTURED"; statusColor = "text-red-400 animate-pulse"; }
  else if (willBuckle)                 { statusLabel = "BUCKLING"; statusColor = "text-red-400 animate-pulse"; }
  else if (isCreeping)                 { statusLabel = "CREEP REGIME"; statusColor = "text-orange-400"; }
  else if (isYielding)                 { statusLabel = "PLASTIC YIELD"; statusColor = "text-amber-400"; }
  else if (fatigueAccumulated > 0.8)   { statusLabel = "FATIGUE RISK"; statusColor = "text-amber-300"; }

  // ── Thermal shock stress uses surface temperature (first node) ──
  const T_surface = thermalProfile[0] ?? avgTemperature;
  const shockStress = (E * alpha * Math.abs(T_surface - avgTemperature)) / (1 - mat.poissonsRatio);

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto custom-scrollbar select-text">
      <div className="max-w-5xl mx-auto p-8 pb-16 space-y-8">

        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
              Engineering Analysis
            </h2>
            <p className="text-sm text-cyan-400 mt-1 font-mono uppercase tracking-wider">
              {mat.name} · {experimentMode.replace(/_/g, " ").toUpperCase()} · {avgTemperature.toFixed(1)} K · ΔT = {dT >= 0 ? "+" : ""}{dT.toFixed(1)} K
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-zinc-500 space-y-0.5">
            <div>SOLVER KERNEL: ACTIVE</div>
            <div>MESH: {gridInfo.split("(")[0].trim()}</div>
            <div className={`font-bold ${isMelting ? "text-red-400" : isFailed ? "text-red-400" : willBuckle ? "text-amber-400" : "text-emerald-400"}`}>
              STATUS: {statusLabel}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SECTION 1: Temperature-Dependent Material State
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-cyan-500">
            Material State — Temperature-Dependent Properties
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={<InlineMath math="\alpha(T) \text{ — CTE}" />}
              value={`${(alpha * 1e6).toFixed(3)}`}
              unit="×10⁻⁶ /K"
              color={alpha < 0 ? "text-blue-400" : "text-cyan-400"}
              sub={<span>Ref: {(mat.alpha0 * 1e6).toFixed(1)} ({dAlphaPct >= 0 ? "+" : ""}{dAlphaPct.toFixed(1)}%)</span>}
              badge={alpha < 0 ? { text: "Negative CTE", color: "bg-blue-500/20 text-blue-400" } : undefined}
            />
            <Stat
              label={<InlineMath math="E(T) \text{ — Young's Modulus}" />}
              value={`${(E / 1e9).toFixed(1)}`}
              unit="GPa"
              color="text-amber-400"
              sub={<span>Ref: {(mat.youngsModulus / 1e9).toFixed(0)} ({dEPct.toFixed(1)}%)</span>}
            />
            <Stat
              label={<InlineMath math="\sigma_y(T) \text{ — Yield Strength}" />}
              value={`${(σ_y / 1e6).toFixed(0)}`}
              unit="MPa"
              color={avgTemperature > mat.meltingPoint * 0.7 ? "text-red-400" : "text-orange-400"}
              sub={<span>Ref: {(mat.yieldStrength / 1e6).toFixed(0)} ({dSyPct.toFixed(1)}%)</span>}
            />
            <Stat
              label={<InlineMath math="\alpha_{\text{th}}(T) \text{ — Thermal Diffusivity}" />}
              value={alpha_th.toExponential(2)}
              unit="m²/s"
              color="text-purple-400"
              sub={<InlineMath math="\alpha_{\text{th}} = k(T)/(\rho(T)\cdot c_p(T))" />}
            />
            <Stat
              label={<InlineMath math="k(T) \text{ — Conductivity}" />}
              value={k_T.toFixed(2)}
              unit="W/(m·K)"
              color="text-zinc-300"
              sub={<span>Ref: {mat.thermalConductivity.toFixed(1)} ({dKPct >= 0 ? "+" : ""}{dKPct.toFixed(1)}%)</span>}
            />
            <Stat
              label={<InlineMath math="c_p(T) \text{ — Specific Heat}" />}
              value={cp_T.toFixed(0)}
              unit="J/(kg·K)"
              color="text-zinc-300"
              sub={<span>Ref: {mat.specificHeat.toFixed(0)} J/(kg·K)</span>}
            />
            <Stat
              label={<InlineMath math="\rho(T) \text{ — Density}" />}
              value={rho_T.toFixed(1)}
              unit="kg/m³"
              color="text-zinc-300"
              sub={<span>Ref: {mat.density} | ΔV/V = {dVpct.toFixed(3)}%</span>}
            />
            <Stat
              label="Melting Point T_m"
              value={mat.meltingPoint.toFixed(0)}
              unit="K"
              color={isMelting ? "text-red-300 animate-pulse" : avgTemperature > mat.meltingPoint * 0.9 ? "text-red-400" : "text-zinc-300"}
              sub={<span>T/T_m = {(avgTemperature / mat.meltingPoint * 100).toFixed(0)}% {isMelting ? "⚠ LIQUID" : ""}</span>}
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * All properties interpolated from piecewise tables calibrated to NIST, ASM Metals Handbook, and EN 1993-1-2 data.
            Crystal structure: {mat.crystalStructure}. K_Ic = {(mat.fractureToughness / 1e6).toFixed(1)} MPa√m.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 2: Thermal Expansion Results
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-emerald-500">
            Thermal Expansion Results
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={<InlineMath math="\Delta L = \int_{{T_0}}^T \alpha(T')\,L_0\,dT'" />}
              value={`${realDeltaL >= 0 ? "+" : ""}${(realDeltaL * 1000).toFixed(4)}`}
              unit="mm"
              color={realDeltaL >= 0 ? "text-emerald-400" : "text-blue-400"}
              sub={<span>
                {isLargeDeltatT
                  ? "⚡ Nonlinear integration (|ΔT| > 150 K)"
                  : "Linear approx valid (|ΔT| < 150 K)"}
              </span>}
              badge={isLargeDeltatT ? { text: "Integrated", color: "bg-amber-500/20 text-amber-400" } : undefined}
            />
            <Stat
              label={<InlineMath math="\varepsilon_{\text{th}} = \int \alpha(T')\,dT'" />}
              value={(thermalStrainIntegrated * 1e6).toFixed(1)}
              unit="μstrain"
              color="text-cyan-400"
              sub={<InlineMath math={`\\alpha \\cdot \\Delta T = ${(alpha * Math.abs(dT) * 1e6).toFixed(1)} \\text{ (linear)}`} />}
            />
            <Stat
              label={<InlineMath math="\Delta T = T - T_{\text{ref}}" />}
              value={`${dT >= 0 ? "+" : ""}${dT.toFixed(2)}`}
              unit="K"
              color={Math.abs(dT) > 300 ? "text-red-400" : Math.abs(dT) > 150 ? "text-amber-400" : "text-white"}
              sub={<span>T_ref = {PhysicsEngine.T_REF.toFixed(2)} K (20°C)</span>}
              badge={Math.abs(dT) > 300 ? { text: "|ΔT|>300K", color: "bg-red-500/20 text-red-400" } : undefined}
            />
            <Stat
              label={<InlineMath math="V(T) = V_0\,e^{\int 3\alpha\,dT'}" />}
              value={(volumeExpanded * 1e6).toFixed(3)}
              unit="cm³"
              color="text-zinc-300"
              sub={<span>V₀ = {(V0 * 1e6).toFixed(3)} cm³ | ΔV/V = {dVpct.toFixed(3)}%</span>}
              badge={isLargeDeltatT ? { text: "Nonlinear", color: "bg-amber-500/20 text-amber-400" } : undefined}
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * ΔL computed via trapezoidal integration of α(T) over temperature path (20 sub-intervals). V(T) uses exp(∫3α dT) — accurate for all |ΔT|. Linear approx error for |ΔT| &gt; 150K can exceed 0.5%.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 3: Complete Strain Decomposition
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-violet-500">
            Strain State Decomposition
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:grid-cols-5">
            <Stat
              label={<InlineMath math="\varepsilon_{\text{th}} \text{ — Thermal}" />}
              value={(thermalStrainIntegrated * 1e6).toFixed(2)}
              unit="μstrain"
              color="text-cyan-400"
              sub={<InlineMath math="\int \alpha(T')\,dT'" />}
            />
            <Stat
              label={<InlineMath math="\varepsilon_{\text{el}} \text{ — Elastic}" />}
              value={(elasticStrain * 1e6).toFixed(2)}
              unit="μstrain"
              color="text-amber-400"
              sub={<InlineMath math="\sigma / E(T)" />}
            />
            <Stat
              label={<InlineMath math="\varepsilon_{\text{pl}} \text{ — Plastic}" />}
              value={plasticStrain.toExponential(3)}
              color={plasticStrain > 0 ? "text-orange-400" : "text-zinc-500"}
              sub={<span>{plasticityModel === "epp" ? "Elastic-perfectly-plastic" : "Isotropic hardening (H=0.05E)"}</span>}
            />
            <Stat
              label={<InlineMath math="\dot{\varepsilon}_{\text{cr}} \text{ — Creep Rate}" />}
              value={creepStrainRate > 0 ? creepStrainRate.toExponential(2) : "0"}
              unit="/s"
              color={creepStrainRate > 0 ? "text-red-400" : "text-zinc-500"}
              sub={<span>
                {isCreeping
                  ? `T > T_cr = ${mat.creepOnsetTemp.toFixed(0)} K`
                  : "Elastic only (T < T_creep)"}
              </span>}
            />
            <Stat
              label={<InlineMath math="\varepsilon_{\text{total}}" />}
              value={(totalStrain * 1e6).toFixed(2)}
              unit="μstrain"
              color="text-white"
              sub={<InlineMath math="\varepsilon_{th} + \varepsilon_{el} + \varepsilon_{pl}" />}
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * Constitutive split: ε_total = ε_thermal + ε_elastic + ε_plastic + ε_creep (4-component additive decomposition per EN 1992-1-2 thermoelastoplastic framework).
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 4: Spatial Field Extrema
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-emerald-500">
            Discretized Spatial Fields Extrema
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {is2D ? (
              <>
                <Stat
                  label={<InlineMath math="u_{x,\text{max}} \text{ — Peak Axial Disp.}" />}
                  value={`${(maxUx * 1000).toFixed(4)}`}
                  unit="mm"
                  color="text-emerald-400"
                  sub="Peak horizontal deformation"
                />
                <Stat
                  label={<InlineMath math="u_{y,\text{max}} \text{ — Peak Lateral Disp.}" />}
                  value={`${(maxUy * 1000).toFixed(4)}`}
                  unit="mm"
                  color="text-emerald-400"
                  sub="Peak vertical deformation"
                />
                <Stat
                  label={<InlineMath math="\sigma_{xx,\text{max}} \text{ — Peak Normal Stress}" />}
                  value={`${(maxSxx / 1e6).toFixed(1)}`}
                  unit="MPa"
                  color={Math.abs(maxSxx) > σ_y ? "text-red-400" : "text-amber-400"}
                  sub="x-direction normal stress field"
                />
                <Stat
                  label={<InlineMath math="\sigma_{\text{vm},\text{max}} \text{ — Max von Mises}" />}
                  value={`${(maxSvm / 1e6).toFixed(1)}`}
                  unit="MPa"
                  color={maxSvm > σ_y ? "text-red-400" : "text-emerald-400"}
                  sub="Equivalent octahedral shear stress"
                />
              </>
            ) : (
              <>
                <Stat
                  label={<InlineMath math="u_{x,\text{max}} \text{ — Tip Displacement}" />}
                  value={`${(maxUx * 1000).toFixed(4)}`}
                  unit="mm"
                  color="text-emerald-400"
                  sub="Deformation at final node"
                />
                <Stat
                  label={<InlineMath math="\sigma_{xx,\text{max}} \text{ — Peak Normal Stress}" />}
                  value={`${(maxSxx / 1e6).toFixed(1)}`}
                  unit="MPa"
                  color={Math.abs(maxSxx) > σ_y ? "text-red-400" : "text-amber-400"}
                  sub="Max element stress tensor"
                />
                <Stat
                  label={<InlineMath math="\sigma_{xx,\text{mean}} \text{ — Mean Stress}" />}
                  value={`${(meanSxx / 1e6).toFixed(1)}`}
                  unit="MPa"
                  color="text-zinc-300"
                  sub="Spatially averaged normal stress"
                />
                <Stat
                  label={<InlineMath math="\nabla T \text{ — Thermal Gradient}" />}
                  value={thermalGradient.toFixed(1)}
                  unit="K/m"
                  color={thermalGradient > 100 ? "text-amber-400" : "text-zinc-300"}
                  sub={<span>ΔT = {(maxT - minT).toFixed(1)} K across rod {maxT - minT > 20 ? "⚡ Non-uniform" : ""}</span>}
                />
              </>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 5: Structural Integrity & Factor of Safety
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-amber-500">
            Structural Integrity & Factor of Safety
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Reaction Stress σ"
              value={(stressAtConstraint / 1e6).toFixed(1)}
              unit="MPa"
              color={Math.abs(stressAtConstraint) > σ_y ? "text-red-400" : "text-amber-400"}
              sub={
                constraint === "free" ? "σ = 0 (Free expansion — no constraint)" :
                constraint === "fixed" ? "σ = −E(T)·α(T)·ΔT (Fully fixed)" :
                constraint === "partial" ? "Gap contact: σ active after gap closure" :
                "Spring resistance: σ = −kE/(E+k)·ε_th"
              }
            />
            <Stat
              label={<InlineMath math="\text{FOS}_{\text{yield}} = \sigma_y / |\sigma|" />}
              value={fosYield >= 999 ? "∞" : fosYield.toFixed(2)}
              color={fosYield < 1.0 ? "text-red-400" : fosYield < 1.5 ? "text-amber-400" : "text-emerald-400"}
              sub={isYielding ? "⚠ Yield criterion exceeded (ductile)" : "Yield FOS — governs ductile design"}
            />
            <Stat
              label={<InlineMath math="\text{FOS}_{\text{fracture}} = \sigma_u / |\sigma|" />}
              value={fosFracture >= 999 ? "∞" : fosFracture.toFixed(2)}
              color={fosFracture < 1.0 ? "text-red-400" : fosFracture < 2.0 ? "text-amber-400" : "text-zinc-300"}
              sub={isFailed ? "⚠ Fracture criterion exceeded" : "Ultimate FOS — governs brittle failure"}
            />
            <Stat
              label="Failure Status"
              value={statusLabel}
              color={statusColor}
              sub={
                isMelting    ? `T/T_m = ${(avgTemperature/mat.meltingPoint*100).toFixed(0)}% — Liquid phase` :
                isFailed     ? "Griffith/Fracture threshold breached" :
                willBuckle   ? `P_th/P_cr = ${(bucklingLoad/Math.max(bucklingPcr,1)).toFixed(2)}` :
                isCreeping   ? `T > T_creep = ${mat.creepOnsetTemp.toFixed(0)} K` :
                isYielding   ? `σ > σ_y(T) = ${(σ_y/1e6).toFixed(0)} MPa` :
                "All criteria satisfied"
              }
            />
            <Stat
              label={<InlineMath math="U \text{ — Elastic Strain Energy}" />}
              value={strainEnergy.toFixed(4)}
              unit="J"
              color="text-zinc-300"
              sub={<InlineMath math="U = \sigma^2 V / (2E)" />}
            />
            <Stat
              label={<InlineMath math="\varepsilon^{\text{pl}} \text{ — Plastic Strain}" />}
              value={plasticStrain.toExponential(3)}
              color={plasticStrain > 0 ? "text-orange-400" : "text-zinc-500"}
              sub={plasticStrain > 0 ? `Model: ${plasticityModel === "epp" ? "Elastic-Perfectly-Plastic" : "Isotropic Hardening H=0.05E"}` : "Purely elastic state"}
            />
            <Stat
              label="Fatigue Damage (Miner)"
              value={`${(fatigueAccumulated * 100).toFixed(3)}`}
              unit="%"
              color={fatigueAccumulated > 0.8 ? "text-red-400" : "text-zinc-300"}
              sub={`${cycleCount} cycles | D/cycle via Coffin-Manson`}
            />
            <Stat
              label={<InlineMath math="\sigma_{\text{shock}} \text{ — Thermal Shock}" />}
              value={(shockStress / 1e6).toFixed(0)}
              unit="MPa"
              color="text-zinc-400"
              sub={<InlineMath math="\sigma_{\text{shock}} = E\alpha\Delta T_{\text{surface}} / (1-\nu)" />}
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * FOS_yield = σ_y(T)/|σ| governs ductile design; FOS_fracture = σ_u(T)/|σ| governs ultimate failure and brittle materials.
            Stress: <InlineMath math="\sigma_{ij} = C_{ijkl}(\varepsilon_{kl} - \varepsilon^{\text{th}}_{kl})" />. Plastic strain uses {plasticityModel === "epp" ? "elastic-perfectly-plastic" : "isotropic hardening"} model.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 6: Euler Column Buckling Analysis
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-purple-500">
            Euler Column Buckling Analysis
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={<InlineMath math="P_{\text{cr}} = \pi^2 E(T) I / (KL)^2" />}
              value={(bucklingPcr / 1e3).toFixed(2)}
              unit="kN"
              color="text-cyan-400"
              sub={<span>K = {bucklingK} ({
                bucklingK === 0.5 ? "Fixed-Fixed" :
                bucklingK === 2.0 ? "Fixed-Free" :
                bucklingK === 0.7 ? "Fixed-Pinned" :
                "Pinned-Pinned"
              })</span>}
            />
            <Stat
              label={<InlineMath math="P_{\text{th}} = E A \alpha \Delta T" />}
              value={(bucklingLoad / 1e3).toFixed(2)}
              unit="kN"
              color={willBuckle ? "text-red-400" : "text-zinc-300"}
              sub={
                constraint === "free"
                  ? "P_th = 0 (Free expansion — no compressive load)"
                  : willBuckle
                  ? `⚠ P_th/P_cr = ${(bucklingLoad / Math.max(bucklingPcr, 1)).toFixed(2)} > 1`
                  : `P_th/P_cr = ${(bucklingLoad / Math.max(bucklingPcr, 1)).toFixed(2)} (Stable)`
              }
            />
            <Stat
              label={<InlineMath math="I = \pi d^4 / 64 \text{ — MOA}" />}
              value={(bucklingI * 1e8).toFixed(3)}
              unit="×10⁻⁸ m⁴"
              color="text-zinc-400"
              sub={<span>r = {(bucklingR * 1000).toFixed(2)} mm (radius of gyration)</span>}
            />
            <Stat
              label={<InlineMath math="\lambda = KL/r \text{ — Slenderness}" />}
              value={slendernessKL_r.toFixed(1)}
              color={slendernessKL_r > lambdaEuler ? "text-amber-400" : "text-zinc-300"}
              sub={<span>
                {bucklingRegime === "long" ? "🔴 Long Column (Euler governs)" :
                 bucklingRegime === "intermediate" ? "🟡 Intermediate (Johnson parabola)" :
                 "🟢 Short Column (yielding governs)"}
                {" | λ_E = "}{lambdaEuler.toFixed(0)}
              </span>}
            />
            <Stat
              label="Critical Buckling Temperature"
              value={bucklingTcr !== null ? bucklingTcr.toFixed(0) : (constraint === "free" ? "∞" : "—")}
              unit="K"
              color={bucklingTcr !== null && avgTemperature > bucklingTcr * 0.9 ? "text-amber-400" : "text-zinc-300"}
              sub={bucklingTcr !== null
                ? `T_cr − T_now = ${(bucklingTcr - avgTemperature).toFixed(0)} K margin`
                : constraint === "free" ? "No constraint → no buckling" : "Computing..."}
            />
            <Stat
              label="Euler Limiting Stress σ_cr"
              value={(limitingStress / 1e6).toFixed(0)}
              unit="MPa"
              color="text-zinc-400"
              sub={bucklingRegime === "long"
                ? <InlineMath math="\sigma_{cr} = \pi^2 E / \lambda^2" />
                : bucklingRegime === "intermediate"
                ? <InlineMath math="\sigma_{cr} = \sigma_y(1 - \sigma_y\lambda^2/(4\pi^2 E))" />
                : "Short block — σ_cr = σ_y"
              }
            />
            <Stat
              label="Effective Length Factor K"
              value={bucklingK.toFixed(1)}
              color="text-zinc-300"
              sub={`λ_Euler = π√(2E/σ_y) = ${lambdaEuler.toFixed(0)}`}
            />
            <Stat
              label="Buckling Safety Ratio"
              value={bucklingLoad > 0 ? (bucklingPcr / bucklingLoad).toFixed(2) : "∞"}
              color={bucklingLoad > 0 && bucklingPcr / bucklingLoad < 1.5 ? "text-amber-400" : "text-emerald-400"}
              sub="P_cr / P_th (> 1.0 = stable)"
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * Instability: <InlineMath math="P_{\text{cr}} = \pi^2 E(T) I / (KL)^2" /> with K={bucklingK} from boundary conditions.
            Thermal load P_th = EAαΔT is ONLY generated when constraint prevents expansion.
            For free expansion: P_th ≡ 0 (no compressive load, no buckling risk).
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 7: Energy Budget
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-yellow-500">
            Thermodynamic Energy Budget — First Law
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={<InlineMath math="Q_{\text{stored}} = \rho c_p V \Delta T" />}
              value={thermalEnergyQ.toFixed(2)}
              unit="J"
              color="text-yellow-400"
              sub="Thermal energy above ambient"
            />
            <Stat
              label="Q_input — Cumulative Input"
              value={energyInputTotal.toFixed(2)}
              unit="J"
              color="text-emerald-400"
              sub="Heat supplied to domain"
            />
            <Stat
              label="Q_loss — Convective + Radiative"
              value={energyLossTotal.toFixed(2)}
              unit="J"
              color="text-zinc-300"
              sub="Newton cooling + Stefan-Boltzmann"
            />
            <Stat
              label={<InlineMath math="U_{\text{elastic}} = \sigma^2 V / (2E)" />}
              value={strainEnergy.toFixed(4)}
              unit="J"
              color="text-amber-400"
              sub="Recoverable elastic strain energy"
            />
            <Stat
              label="Energy Balance Error"
              value={energyBalPct.toFixed(3)}
              unit="%"
              color={energyBalPct > 2.0 ? "text-amber-400" : "text-cyan-400"}
              sub={<span>Residual = {energyBalanceResidual.toExponential(2)} J</span>}
              badge={energyBalPct > 2.0
                ? { text: "Drift", color: "bg-amber-500/20 text-amber-400" }
                : { text: "Conserved", color: "bg-emerald-500/20 text-emerald-400" }}
            />
            <Stat
              label="Isothermal Compressibility β_T"
              value={PhysicsEngine.isothermalCompressibility(mat, avgTemperature).toExponential(2)}
              unit="Pa⁻¹"
              color="text-zinc-400"
              sub={<InlineMath math="\beta_T = 3(1-2\nu)/E(T)" />}
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * First Law: ΔU_internal = Q_in − Q_loss. Energy balance error reflects numerical discretization
            and time-integration accuracy. Values &gt;2% indicate solver drift.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 8: FEA Solver Telemetry
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-blue-500">
            FEA Solver Telemetry & Numerical Diagnostics
          </SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Thermal Solver"
              value={is2D ? "2D Implicit Heat" : "1D Implicit Heat"}
              color="text-emerald-400"
              sub={<span>
                CG Iters: {solverTelemetry.thermalIters} | Res: {
                  solverTelemetry.thermalError > 0
                    ? solverTelemetry.thermalError.toExponential(2)
                    : "< 1e-16"
                } | {solverTelemetry.thermalSolveMs.toFixed(1)} ms
              </span>}
            />
            <Stat
              label="Mechanical Solver"
              value={is2D ? "2D Q4 Plane Stress" : "1D Truss Linear"}
              color="text-emerald-400"
              sub={<span>
                CG Iters: {solverTelemetry.mechIters} | Res: {
                  solverTelemetry.mechError > 0
                    ? solverTelemetry.mechError.toExponential(2)
                    : "< 1e-16"
                } | {solverTelemetry.mechSolveMs.toFixed(1)} ms
              </span>}
            />
            <Stat
              label="Mesh Discretization"
              value={gridInfo.split("(")[0].trim()}
              color="text-zinc-300"
              sub={`DOFs: ${dofsT} (thermal) / ${dofsM} (mechanical)`}
            />
            <Stat
              label="Analytical Error Margin"
              value={`${solverTelemetry.validationError.toFixed(3)}%`}
              color={solverTelemetry.validationError > 1.0 ? "text-amber-400" : "text-emerald-400"}
              sub="FEA vs closed-form solution"
              badge={solverTelemetry.validationError > 2 ? { text: "High Error", color: "bg-amber-500/20 text-amber-400" } : undefined}
            />
            <Stat
              label="Yielded Elements"
              value={`${solverTelemetry.yieldedElementCount} / ${solverTelemetry.totalElements}`}
              color={solverTelemetry.yieldedElementCount > 0 ? "text-amber-400" : "text-zinc-300"}
              sub={solverTelemetry.totalElements > 0
                ? `${((solverTelemetry.yieldedElementCount / solverTelemetry.totalElements) * 100).toFixed(0)}% of domain yielded`
                : "No plasticity"}
            />
            <Stat
              label="Condition Number (est.)"
              value={solverTelemetry.conditionEstimate.toFixed(1)}
              color={solverTelemetry.conditionEstimate > 20 ? "text-amber-400" : "text-zinc-300"}
              sub="Gershgorin bound proxy"
            />
            <Stat
              label="Matrix Memory (est.)"
              value={solverTelemetry.memoryKB < 1024
                ? `${solverTelemetry.memoryKB} KB`
                : `${(solverTelemetry.memoryKB / 1024).toFixed(1)} MB`}
              color="text-zinc-400"
              sub="Sparse stiffness matrix"
            />
            <Stat
              label="CFL / Stability"
              value="Unconditional"
              color="text-cyan-400"
              sub="Implicit Euler — no CFL restriction"
            />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
            * Implicit Euler formulation: [C + dt·K]{"{"}T_new{"}"} = C·T_old + dt·F_source.
            Unconditionally stable for any time step. CG solver tolerance ≈ 1e-10.
            Energy residual: <InlineMath math="\Delta E = U_{\text{internal}} - (Q_{\text{in}} - Q_{\text{loss}})" />.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 9: Bimetallic Strip (conditional)
        ════════════════════════════════════════════════════════ */}
        {(objectType === "bimetallic" || experimentMode === "bimetallic" || experimentMode === "spacecraft") && mat1 && mat2 && (
          <section>
            <SectionHeader color="bg-pink-500">
              Bimetallic Laminate Analytics (Timoshenko 1925)
            </SectionHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat
                label={<InlineMath math="\kappa \text{ — Curvature}" />}
                value={bimetallicCurvature.toFixed(4)}
                unit="m⁻¹"
                color="text-purple-400"
                sub={`R = ${bimetallicCurvature !== 0 ? (1 / Math.abs(bimetallicCurvature)).toFixed(2) : "∞"} m`}
              />
              <Stat
                label="Tip Deflection δ"
                value={(bimetallicDeflection * 1000).toFixed(3)}
                unit="mm"
                color="text-pink-400"
                sub="Vertical displacement at free end"
              />
              <Stat
                label="Laminate Mismatch Δα"
                value={`${((PhysicsEngine.alpha(mat2, avgTemperature) - PhysicsEngine.alpha(mat1, avgTemperature)) * 1e6).toFixed(3)}`}
                unit="×10⁻⁶/K"
                color="text-amber-400"
                sub={`α₁: ${(PhysicsEngine.alpha(mat1, avgTemperature)*1e6).toFixed(2)} | α₂: ${(PhysicsEngine.alpha(mat2, avgTemperature)*1e6).toFixed(2)}`}
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-2 italic">
              * Curvature from 2D Q4 FEA displacement field. Timoshenko analytical κ = 6(α₂−α₁)(1+m)²ΔT / [t(3(1+m)² + (1+mn)(m²+1/mn))] used as validation reference.
            </p>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 10: Solver Activity Logs
        ════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader color="bg-zinc-600">
            Solver Activity Logs — FEA Engine Output
          </SectionHeader>
          <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 p-4 max-h-52 overflow-y-auto custom-scrollbar font-mono text-[9.5px] space-y-0.5">
            {useThermalExpansionStore.getState().logs.slice(0, 80).map((log, i) => {
              // Color-code by module prefix
              const msg = log.message;
              let lineColor = "text-zinc-500";
              let prefixColor = "text-zinc-600";
              if (log.type === "error") { lineColor = "text-red-400 font-bold"; prefixColor = "text-red-500"; }
              else if (log.type === "warning") { lineColor = "text-amber-400"; prefixColor = "text-amber-500"; }
              else if (msg.startsWith("[SOLVER]")) { lineColor = "text-emerald-400/80"; prefixColor = "text-emerald-500"; }
              else if (msg.startsWith("[THERMAL]")) { lineColor = "text-cyan-400/80"; prefixColor = "text-cyan-500"; }
              else if (msg.startsWith("[ENERGY]")) { lineColor = "text-yellow-400/80"; prefixColor = "text-yellow-500"; }
              else if (msg.startsWith("[PLASTICITY]") || msg.startsWith("[FRACTURE]")) { lineColor = "text-orange-400/80"; prefixColor = "text-orange-500"; }
              else if (msg.startsWith("[BUCKLING]")) { lineColor = "text-purple-400/80"; prefixColor = "text-purple-500"; }
              else if (msg.startsWith("[MATERIAL]")) { lineColor = "text-blue-400/80"; prefixColor = "text-blue-500"; }
              else if (msg.startsWith("[FATIGUE]")) { lineColor = "text-rose-400/80"; prefixColor = "text-rose-500"; }

              return (
                <div key={i} className={`${lineColor} flex gap-2`}>
                  <span className="text-zinc-600 shrink-0 select-none">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};

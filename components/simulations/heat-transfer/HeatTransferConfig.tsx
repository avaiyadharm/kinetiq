"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, Settings2, Shield, BarChart2, Zap, BookOpen, 
  HelpCircle, GraduationCap, CheckCircle2, AlertTriangle, Info
} from "lucide-react";

import { MATERIALS } from "./HeatTransferCanvas";

interface HeatTransferConfigProps {
  gridSize: number;
  dx: number;
  dt: number;
  thickness: number;
  ambientTemp: number;
  convectionCoeff: number;
  solverMode: "transient" | "steady";
  boundaryType: "insulated" | "fixed" | "convective";
  telemetry: {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    thermalEnergy: number;
    maxFluxMag: number;
    stabilityRatio: number;
    simTime: number;
    residual: number;
    solverIterations: number;
    stableTimestepLimit: number;
    energyInflow: number;
    energyOutflow: number;
    conservationError: number;
    fourierNumber?: number;
    truncationErrorEstimate?: number;
    temporalError?: number;
    gridIndependence?: number;
    nodeDensity?: number;
    infinityNorm?: number;
    localFluxImbalance?: number;
    dtSubSteps?: number;
  };
  expertiseLevel: "beginner" | "intermediate" | "expert";
}

const StatRow = ({ label, value, unit, color = "text-white/80", mono = true, border = true, sub }: {
  label: string; value: string; unit?: string; color?: string; mono?: boolean; border?: boolean; sub?: string;
}) => (
  <div className={cn("flex justify-between items-baseline py-2.5 px-1 group", border && "border-b border-white/[0.04]")}>
    <div>
      <span className="text-[11px] text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
      {sub && <div className="text-[9px] text-white/25 mt-0.5">{sub}</div>}
    </div>
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className={cn("text-[12px] font-bold", color, mono && "font-mono")}>{value}</span>
      {unit && <span className="text-[9px] text-white/30 font-sans uppercase">{unit}</span>}
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, color, children, span = 1 }: {
  title: string; icon: React.ComponentType<{ className?: string }>; color: string;
  children: React.ReactNode; span?: number;
}) => (
  <div className={cn(
    "bg-[#141416] rounded-2xl border border-white/[0.06] overflow-hidden relative group",
    span === 2 && "md:col-span-2", span === 3 && "md:col-span-3"
  )}>
    <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${color}40, ${color}10, transparent)` }} />
    <div className="p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white/80">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

const EquationBlock = ({ equation, label, color = "#38bdf8" }: { equation: string; label?: string; color?: string }) => (
  <div className="bg-black/50 border border-white/[0.04] rounded-xl px-4 py-3 my-3">
    {label && <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 font-bold">{label}</div>}
    <div className="font-mono text-[13px] font-bold text-center leading-relaxed" style={{ color }}>{equation}</div>
  </div>
);

const StatusIndicator = ({ status, label }: { status: "stable" | "warning" | "critical"; label: string }) => {
  const colors = {
    stable: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: CheckCircle2 },
    warning: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: AlertTriangle },
    critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", icon: AlertTriangle },
  };
  const c = colors[status];
  const Icon = c.icon;
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider", c.bg, c.text, c.border)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
};

export const HeatTransferConfig: React.FC<HeatTransferConfigProps> = ({
  gridSize,
  dx,
  dt,
  thickness,
  ambientTemp,
  convectionCoeff,
  solverMode,
  boundaryType,
  telemetry,
  expertiseLevel,
}) => {
  // Derived computations
  const totalNodes = gridSize * gridSize;
  const plateWidth = gridSize * dx; // m
  const fo = telemetry.fourierNumber || telemetry.stabilityRatio;
  // ADI CN is unconditionally stable; we report vs explicit limit for education
  let stabilityStatus: "stable" | "warning" | "critical" = "stable";
  if (fo >= 10.0) stabilityStatus = "critical";
  else if (fo >= 0.25) stabilityStatus = "stable";
  else if (fo >= 0.15) stabilityStatus = "warning";

  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.25em] mb-1">Computational Thermodynamics</div>
            <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-widest text-white">
              Numerical Solver & Material Diagnostics
            </h2>
            <p className="text-[11px] text-white/40 mt-1.5 max-w-xl leading-relaxed">
              Verify simulation stability margins, grid discretization values, physical constants, and convergence rates.
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap gap-3">
          <StatusIndicator
            status={stabilityStatus}
            label={`Fourier Fo = ${fo.toFixed(4)} (explicit limit = 0.25)`}
          />
          <StatusIndicator
            status="stable"
            label={solverMode === "transient" ? "ADI Crank-Nicolson (Implicit)" : "Gauss-Seidel Relaxation"}
          />
          <StatusIndicator
            status="stable"
            label={`${gridSize}\u00D7${gridSize} grid (${totalNodes.toLocaleString()} nodes)`}
          />
          {solverMode === "transient" && (
            <StatusIndicator
              status="stable"
              label={`Sim time: ${telemetry.simTime.toFixed(3)} s`}
            />
          )}
        </div>

        {/* Configurations Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Spatial parameters */}
          <SectionCard title="Spatial Grid Properties" icon={Settings2} color="#0d9488">
            <StatRow label="Grid Resolution" value={`${gridSize} \u00D7 ${gridSize}`} unit="nodes" color="text-teal-400" />
            <StatRow label="Total Compute Cells" value={totalNodes.toLocaleString()} unit="cells" color="text-teal-400" />
            <StatRow label="Cell Pitch (\u0394x = \u0394y)" value={(dx * 1000).toFixed(1)} unit="mm" color="text-cyan-400" sub={`${dx} m`} />
            <StatRow label="Plate Physical Size" value={`${plateWidth.toFixed(2)} \u00D7 ${plateWidth.toFixed(2)}`} unit="m" color="text-cyan-400" sub="Total simulated surface area" />
            <StatRow label="Plate Thickness (t_z)" value={(thickness * 1000).toFixed(0)} unit="mm" color="text-purple-400" sub={`${thickness} m`} />
            <StatRow 
              label="Boundary Condition" 
              value={boundaryType.toUpperCase()} 
              unit="" 
              color="text-white/60" 
              border={false} 
              sub={boundaryType === "insulated" ? "Neumann (Adiabatic)" : boundaryType === "fixed" ? "Dirichlet" : "Convective Robin"}
            />
          </SectionCard>

          {/* Solver settings */}
          <SectionCard title="Temporal & Solver Diagnostics" icon={Zap} color="#f59e0b">
            <StatRow label="Solver Algorithm" value={solverMode === "transient" ? "ADI Crank-Nicolson" : "Gauss-Seidel"} unit="" color="text-amber-400" sub={solverMode === "transient" ? "Unconditionally stable, 2nd-order" : "Iterative relaxation"} />
            <StatRow label="Time Step (\u0394t)" value={(dt * 1000).toFixed(1)} unit="ms" color="text-amber-400" sub={`${dt.toFixed(4)} s`} />
            <StatRow
              label="Expl. Stability Limit (\u0394t_crit)"
              value={(telemetry.stableTimestepLimit * 1000).toFixed(2)}
              unit="ms"
              color={fo > 0.25 ? "text-cyan-400" : "text-amber-400"}
              sub={fo > 0.25 ? "ADI allows exceeding explicit limit" : "Within explicit stable zone"}
            />
            <StatRow label="Fourier Number Fo" value={fo.toFixed(4)} unit="" color={fo < 0.25 ? "text-emerald-400" : "text-cyan-400"} sub="Fo = \u03B1\u00B7\u0394t / \u0394x\u00B2" />
            {solverMode === "steady" && (
              <StatRow label="GS Iters / Frame" value={`${telemetry.solverIterations}`} unit="" color="text-amber-400" sub="Convergence residual below" />
            )}
            {solverMode === "steady" && (
              <StatRow label="Max Residual" value={telemetry.residual.toExponential(2)} unit="\u00B0C" color={telemetry.residual < 0.01 ? "text-emerald-400" : "text-amber-400"} sub="Max |\u0394T| per sweep" />
            )}
            <StatRow
              label="Numerical Precision"
              value="Float64"
              unit="bit"
              color="text-white/60"
              border={false}
              sub="Double-precision physics buffers"
            />
          </SectionCard>

          {/* Telemetry and physical properties */}
          <SectionCard title="System Thermal Metrics" icon={BarChart2} color="#ec4899">
            <StatRow label="T max" value={telemetry.maxTemp.toFixed(2)} unit="°C" color="text-rose-400" />
            <StatRow label="T min" value={telemetry.minTemp.toFixed(2)} unit="°C" color="text-cyan-400" />
            <StatRow label="T avg" value={telemetry.avgTemp.toFixed(2)} unit="°C" color="text-pink-400" />
            <StatRow
              label="Peak Heat Flux |q|_max"
              value={(telemetry.maxFluxMag / 1000).toFixed(2)}
              unit="kW/m²"
              color="text-orange-400"
              sub="q = -k·|∇T|"
            />
            <StatRow
              label="Stored Thermal Energy"
              value={telemetry.thermalEnergy.toExponential(3)}
              unit="J"
              color="text-pink-400"
              sub="∫∫ ρ·c_p·(T - T_ref) dV"
            />
            <StatRow label="Power Inflow P_in" value={telemetry.energyInflow.toFixed(2)} unit="W" color="text-emerald-400" sub="Heat entering the domain" />
            <StatRow label="Power Outflow P_out" value={telemetry.energyOutflow.toFixed(2)} unit="W" color="text-rose-400" sub="Heat leaving the domain" />
            <StatRow
              label="Conservation Error"
              value={telemetry.conservationError.toExponential(3)}
              unit="W"
              color={Math.abs(telemetry.conservationError) < 1e-4 ? "text-emerald-400" : "text-amber-400"}
              border={false}
              sub="dE/dt - (P_in - P_out)"
            />
            {expertiseLevel === "expert" && (
              <>
                <StatRow label="Max Error Norm (L\u221E)" value={telemetry.infinityNorm?.toExponential(3) || "N/A"} color="text-purple-400" sub="Peak residual across all cells" />
                <StatRow label="Max Flux Imbalance" value={telemetry.localFluxImbalance?.toExponential(3) || "N/A"} unit="W" color="text-rose-400" sub="Max local error in \u2207\u00B7q" />
                <StatRow label="Adaptive Substeps" value={telemetry.dtSubSteps?.toString() || "1"} unit="step(s)" color="text-indigo-400" border={false} sub="Steps required per \u0394t to satisfy CFL" />
              </>
            )}
          </SectionCard>
        </div>
 
        {/* Governing Equations Cards */}
        <SectionCard title="Governing Physical Equations & Solver Theory" icon={Shield} color="#06b6d4" span={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <EquationBlock
                equation={"\u03C1c_p\u2202T/\u2202t = \u2207\u00B7(k\u2207T)"}
                label="Conservative 2D Heat Equation"
                color="#06b6d4"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {expertiseLevel === "beginner" && "Temperature flows from hot to cold — faster in conductors, slower in insulators, controlled by thermal conductivity k and capacity \u03C1c_p."}
                {expertiseLevel === "intermediate" && "Conservation of energy in a heterogeneous domain. Conductive flux is channeled along pathways of high thermal conductivity k."}
                {expertiseLevel === "expert" && "Conservative parabolic PDE. In interfaces, heat flux conservation requires continuous normal derivatives of k\u2207T. Replaced diffusivity formulation to accurately represent high capacity gradients."}
              </p>
            </div>
            <div>
              <EquationBlock
                equation={"ADI CN: (I - r\u03B4x\u00B2)(I - r\u03B4y\u00B2)T^n+1 = ..."}
                label="ADI Crank-Nicolson Discretization"
                color="#10b981"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {expertiseLevel === "beginner" && "Instead of computing each timestep explicitly (which can blow up), this solver uses a two-pass approach that is always numerically stable regardless of timestep size."}
                {expertiseLevel === "intermediate" && "The Alternating Direction Implicit (ADI) method splits each timestep into two half-steps: one implicit in x, one implicit in y. Each produces a tridiagonal system solved in O(N) via the Thomas Algorithm (TDMA)."}
                {expertiseLevel === "expert" && "Peaceman-Rachford ADI: unconditionally stable with global truncation error O(\u0394t\u00B2 + \u0394x\u00B2). Each half-step is solved with TDMA (forward/backward sweep). Operator splitting exactly factorizes the 2D Crank-Nicolson stencil."}
              </p>
            </div>
            <div>
              <EquationBlock
                equation={"q\u20D7 = -k \u2207T [W/m\u00B2]"}
                label="Fourier's Law of Heat Conduction"
                color="#f59e0b"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {expertiseLevel === "beginner" && "Heat naturally flows from hot to cold — Fourier's law says the flow rate is proportional to how steep the temperature gradient is, and how conductive the material is."}
                {expertiseLevel === "intermediate" && "Heat flux vector q = -k\u2207T [W/m\u00B2] always points from high to low temperature (negative gradient). k is the material thermal conductivity. Flux vectors are rendered with arrow glyphs colored by magnitude."}
                {expertiseLevel === "expert" && "The constitutive relation Q_cond = -k A \u2207T follows from irreversible thermodynamics (Onsager reciprocal relations). Fourier's law assumes local equilibrium — valid except at nanoscales or in phonon-ballistic regimes."}
              </p>
            </div>
          </div>

          {/* Material Properties Table */}
          <div className="mt-6 border-t border-white/[0.05] pt-5">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Physical Material Properties</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="text-white/30 uppercase tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Material</th>
                    <th className="text-right py-2 pr-4 font-bold">k [W/m\u00B7K]</th>
                    <th className="text-right py-2 pr-4 font-bold">\u03C1 [kg/m\u00B3]</th>
                    <th className="text-right py-2 pr-4 font-bold">c_p [J/kg\u00B7K]</th>
                    <th className="text-right py-2 font-bold">\u03B1 [m\u00B2/s]</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(MATERIALS).map((m) => (
                    <tr key={m.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-4 text-white/70 font-bold text-[11px]">{m.name}</td>
                      <td className="py-2 pr-4 text-amber-400 text-right">{m.k}</td>
                      <td className="py-2 pr-4 text-cyan-400 text-right">{m.rho.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-pink-400 text-right">{m.cp}</td>
                      <td className="py-2 text-emerald-400 text-right">{m.alpha.toExponential(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        {/* Educational Info Box */}
        <div className="bg-black/20 border border-white/[0.04] rounded-2xl p-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Acoustic vs Thermal Physics Stencil</h4>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Notice the difference between this solver and the Wave Equation solver. Acoustic waves are hyperbolic: they conserve momentum and oscillate back and forth (second-order in time). Heat diffusion is parabolic: it dampens high-frequency variations immediately and travels as a relaxing dispersion curve (first-order in time).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

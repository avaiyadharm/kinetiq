"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, Settings2, Shield, BarChart2, Zap, BookOpen, 
  HelpCircle, GraduationCap, CheckCircle2, AlertTriangle, Info
} from "lucide-react";

interface HeatTransferConfigProps {
  gridSize: number;
  dx: number;
  dt: number;
  ambientTemp: number;
  convectionCoeff: number;
  solverMode: "transient" | "steady";
  boundaryType: "insulated" | "fixed" | "convective";
  telemetry: {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    thermalEnergy: number;
    iterations: number;
    stableTimestepLimit: number;
  };
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
  ambientTemp,
  convectionCoeff,
  solverMode,
  boundaryType,
  telemetry,
}) => {
  const [educLevel, setEducLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // Derived computations
  const totalNodes = gridSize * gridSize;
  const plateWidth = gridSize * dx; // m
  const maxAlpha = 1.0; // Normalized Copper conductivity
  const stabilityCriteriaValue = (maxAlpha * dt) / (dx * dx); // r = alpha * dt / dx^2
  
  // 2D Explicit FDTD stability requires r <= 0.25
  const stabilityStatus = stabilityCriteriaValue <= 0.23 
    ? "stable" 
    : stabilityCriteriaValue <= 0.25 
      ? "warning" 
      : "critical";

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
          
          <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/[0.06] shrink-0">
            {[
              { id: "beginner", label: "Beginner", icon: HelpCircle },
              { id: "intermediate", label: "Standard", icon: BookOpen },
              { id: "advanced", label: "Expert", icon: GraduationCap },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setEducLevel(item.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all",
                    educLevel === item.id 
                      ? "bg-primary text-white shadow-lg" 
                      : "text-white/35 hover:text-white/70"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap gap-3">
          <StatusIndicator 
            status={stabilityStatus} 
            label={`FTCS Stability parameter (r): ${stabilityCriteriaValue.toFixed(4)}`} 
          />
          <StatusIndicator 
            status={stabilityStatus === "critical" ? "critical" : "stable"} 
            label={solverMode === "transient" ? "FDTD Dynamic Mode" : "Gauss-Seidel Steady Mode"} 
          />
          <StatusIndicator 
            status="stable" 
            label={`${gridSize} \u00D7 ${gridSize} (${totalNodes} nodes)`} 
          />
        </div>

        {/* Configurations Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Spatial parameters */}
          <SectionCard title="Spatial Grid Properties" icon={Settings2} color="#0d9488">
            <StatRow label="Grid Resolution" value={`${gridSize} \u00D7 ${gridSize}`} unit="nodes" color="text-teal-400" />
            <StatRow label="Total Compute Cells" value={totalNodes.toLocaleString()} unit="cells" color="text-teal-400" />
            <StatRow label="Cell Pitch (\u0394x = \u0394y)" value={(dx * 1000).toFixed(1)} unit="mm" color="text-cyan-400" sub={`${dx} m`} />
            <StatRow label="Plate Physical Size" value={`${plateWidth.toFixed(2)} \u00D7 ${plateWidth.toFixed(2)}`} unit="m" color="text-cyan-400" sub="Total simulated surface area" />
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
            <StatRow label="Time Step (\u0394t)" value={(dt * 1000).toFixed(2)} unit="ms" color="text-amber-400" sub={`${dt.toFixed(5)} seconds`} />
            <StatRow label="Solver Type" value={solverMode === "transient" ? "Explicit FDTD" : "Gauss-Seidel"} unit="" color="text-amber-400" />
            <StatRow 
              label="Stability Limit (\u0394t_max)" 
              value={(telemetry.stableTimestepLimit * 1000).toFixed(2)} 
              unit="ms" 
              color="text-amber-400" 
              sub="Maximum stable timestep limit" 
            />
            {solverMode === "steady" && (
              <StatRow label="Gauss-Seidel Iterations" value={`${telemetry.iterations}`} unit="steps/frame" color="text-amber-400" />
            )}
            <StatRow 
              label="Numerical Precision" 
              value="Float32" 
              unit="bit" 
              color="text-white/60" 
              border={false} 
              sub="Single-precision floating grid" 
            />
          </SectionCard>

          {/* Telemetry and physical properties */}
          <SectionCard title="System Thermal Metrics" icon={BarChart2} color="#ec4899">
            <StatRow label="Max Grid Temp" value={telemetry.maxTemp.toFixed(1)} unit="\u00B0C" color="text-pink-400" />
            <StatRow label="Min Grid Temp" value={telemetry.minTemp.toFixed(1)} unit="\u00B0C" color="text-pink-400" />
            <StatRow label="Average Temperature" value={telemetry.avgTemp.toFixed(2)} unit="\u00B0C" color="text-pink-400" />
            <StatRow 
              label="Total Stored Heat" 
              value={telemetry.thermalEnergy.toExponential(3)} 
              unit="J" 
              color="text-pink-400" 
              sub="\u222B\u222B \u03C1\u00B7c_p\u00B7T dA"
            />
            <StatRow label="Ambient Environment (T_amb)" value={ambientTemp.toFixed(1)} unit="\u00B0C" color="text-white/60" />
            <StatRow 
              label="Convective Loss (h)" 
              value={convectionCoeff.toFixed(2)} 
              unit="W/m\u00B2K" 
              color="text-white/60" 
              border={false}
            />
          </SectionCard>
        </div>

        {/* Governing Equations Cards */}
        <SectionCard title="Governing Physical Equations" icon={Shield} color="#06b6d4" span={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <EquationBlock 
                equation={"\u2202T/\u2202t = \u03B1 \u2207\u2212\u00B2 T = \u03B1 (\u2202\u00B2T/\u2202x\u00B2 + \u2202\u00B2T/\u2202y\u00B2)"} 
                label="Continuous 2D Heat Equation (Transient conduction)" 
                color="#06b6d4" 
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {educLevel === "beginner" && "This describes how temperature shifts over time in a material: it flows outward from hot peaks to cold valleys at a rate determined by diffusivity (\u03B1)."}
                {educLevel === "intermediate" && "Partial differential equation representing conservation of energy in an isotropic conduction domain. Thermal diffusivity \u03B1 is k / (\u03C1\u00B7c_p)."}
                {educLevel === "advanced" && "Derived from local conservation of thermal energy: \u03C1\u00B7c_p\u00B7\u2202T/\u2202t = -\u2207\u00B7q. Substituting Fourier's linear conduction law (q = -k\u2207T) yields the classic parabolic diffusion equation."}
              </p>
            </div>
            <div>
              <EquationBlock 
                equation={"r = \u03B1 \u0394t / \u0394x\u00B2 \u2264 0.25"} 
                label="Von Neumann Stability Limit (2D FTCS)" 
                color="#10b981" 
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {educLevel === "beginner" && "To prevent calculations from blowing up to infinity, the time step must be kept small compared to the physical cell size."}
                {educLevel === "intermediate" && "Explicit time integration (Forward-Time Central-Space) is conditionally stable. The Courant diffusion number must satisfy r \u2264 1/4 in 2D."}
                {educLevel === "advanced" && "Derived by substituting harmonic error modes T_ij^n = e^(j(k_x x_i + k_y y_j)) into the discretization stencil. The amplification factor must remain \u2264 1, imposing dt \u2264 dx\u00B2 / (4\u03B1) in isotropic grids."}
              </p>
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

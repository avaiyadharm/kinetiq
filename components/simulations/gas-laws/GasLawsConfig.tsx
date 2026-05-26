"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, Settings2, Shield, BarChart2, Zap, BookOpen, 
  HelpCircle, GraduationCap, CheckCircle2, AlertTriangle, Info
} from "lucide-react";

interface GasLawsConfigProps {
  temperature: number;
  volume: number;
  particleCount: number;
  regime: "free" | "boyle" | "charles" | "gay-lussac" | "avogadro";
  gasPreset: "ideal" | "helium" | "xenon" | "real";
  enableCollisions: boolean;
  attractiveForce: number;
  telemetry: {
    measuredPressure: number;
    idealPressure: number;
    measuredTemp: number;
    measuredVolume: number;
    particlesEscaped: number;
    meanSpeed: number;
    vanDerWaalsPressure: number;
    temperatureTarget: number;
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

export const GasLawsConfig: React.FC<GasLawsConfigProps> = ({
  temperature,
  volume,
  particleCount,
  regime,
  gasPreset,
  enableCollisions,
  attractiveForce,
  telemetry,
  expertiseLevel,
}) => {
  // Compressibility factor Z = PV / (N * k_B * T)
  const kb = 1.5; // matching canvas scale
  const V_scaled = telemetry.measuredVolume;
  const T_measured = telemetry.measuredTemp || 1;
  const P_measured = telemetry.measuredPressure;
  const Z = (P_measured * V_scaled) / (particleCount * kb * T_measured);

  // Volume occupied by hard spheres: N * pi * r^2
  let particleRadius = 4.0;
  if (gasPreset === "helium") particleRadius = 3.0;
  else if (gasPreset === "xenon") particleRadius = 8.5;
  else if (gasPreset === "real") particleRadius = 6.0;

  const totalExcludedVolume = particleCount * Math.PI * particleRadius * particleRadius;
  const excludedVolumePercentage = (totalExcludedVolume / V_scaled) * 100;

  // Gas characteristics values
  const GAS_DATA = [
    { name: "Ideal Gas", mass: 1.0, radius: 0.0, collisions: "No", attraction: "None" },
    { name: "Helium (He)", mass: 0.5, radius: 3.0, collisions: "Yes", attraction: "None" },
    { name: "Xenon (Xe)", mass: 4.0, radius: 8.5, collisions: "Yes", attraction: "None" },
    { name: "Real Gas (vdw)", mass: 2.0, radius: 6.0, collisions: "Yes", attraction: "Variable" },
  ];

  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.25em] mb-1">Statistical Mechanics & Diagnostics</div>
            <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-widest text-white">
              Thermodynamic State Variables & Diagnostics
            </h2>
            <p className="text-[11px] text-white/40 mt-1.5 max-w-xl leading-relaxed">
              Verify macrostate parameters, measure microstate speed distribution convergence, and monitor real gas deviations.
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap gap-3">
          <StatusIndicator
            status={Z > 0.8 && Z < 1.2 ? "stable" : "warning"}
            label={`Compressibility Factor Z = ${Z.toFixed(3)} (Ideal Z = 1.0)`}
          />
          <StatusIndicator
            status="stable"
            label={`Active Regime: ${regime.toUpperCase()}`}
          />
          <StatusIndicator
            status="stable"
            label={`${particleCount} particles inside chamber`}
          />
          <StatusIndicator
            status={excludedVolumePercentage < 15 ? "stable" : "warning"}
            label={`Excluded Co-Volume: ${excludedVolumePercentage.toFixed(1)}% of chamber`}
          />
        </div>

        {/* Configuration Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Spatial parameters */}
          <SectionCard title="Chamber Physical Dimensions" icon={Settings2} color="#0d9488">
            <StatRow label="Chamber Area (Volume)" value={(telemetry.measuredVolume / 1000).toFixed(2)} unit="dm²" color="text-teal-400" sub="Measured cross-sectional area" />
            <StatRow label="Volume Fraction V" value={volume.toFixed(2)} unit="" color="text-teal-400" />
            <StatRow label="Piston Position X" value={Math.round(volume * 100).toString()} unit="%" color="text-cyan-400" />
            <StatRow label="Particle Radius (r)" value={particleRadius.toFixed(1)} unit="px" color="text-cyan-400" />
            <StatRow label="Excluded Volume (b)" value={Math.round(totalExcludedVolume).toLocaleString()} unit="px²" color="text-purple-400" sub={`${excludedVolumePercentage.toFixed(1)}% of volume`} />
            <StatRow 
              label="Chamber Regime" 
              value={regime.toUpperCase()} 
              unit="" 
              color="text-white/60" 
              border={false} 
              sub={regime === "free" ? "Ideal Gas Law free mode" : `${regime.toUpperCase()} Law constraints active`}
            />
          </SectionCard>

          {/* Microscopic kinetics */}
          <SectionCard title="Microscopic Kinetics" icon={Zap} color="#f59e0b">
            <StatRow label="Total Particles N" value={particleCount.toString()} unit="atoms" color="text-amber-400" sub="Absolute particle count" />
            <StatRow label="Average Temp (T)" value={`${Math.round(telemetry.measuredTemp)}`} unit="K" color="text-amber-400" sub={`Target Temp: ${temperature} K`} />
            <StatRow label="Mean Speed (v_avg)" value={telemetry.meanSpeed.toFixed(1)} unit="m/s" color="text-cyan-400" sub="Mean arithmetic speed" />
            <StatRow label="RMS Velocity (v_rms)" value={Math.sqrt((2 * kb * telemetry.measuredTemp) / (gasPreset === "helium" ? 0.5 : gasPreset === "xenon" ? 4.0 : gasPreset === "real" ? 2.0 : 1.0)).toFixed(1)} unit="m/s" color="text-cyan-400" sub="Root mean square speed" />
            <StatRow label="Maxwell-Boltzmann Binning" value="15 Bins" unit="" color="text-amber-400" sub="Live speed histogram distribution" />
            <StatRow
              label="Thermostat Method"
              value="Velocity Scaling"
              unit=""
              color="text-white/60"
              border={false}
              sub="Smoothed kinetic thermostat relaxation"
            />
          </SectionCard>

          {/* Telemetry and physical properties */}
          <SectionCard title="Statistical Telemetry" icon={BarChart2} color="#ec4899">
            <StatRow label="Measured Pressure (P)" value={(telemetry.measuredPressure * 100).toFixed(2)} unit="kPa" color="text-rose-400" sub="Calculated from wall collisions momentum" />
            <StatRow label="Ideal Pressure (NkbT/V)" value={(telemetry.idealPressure * 100).toFixed(2)} unit="kPa" color="text-cyan-400" />
            <StatRow label="Van der Waals Pressure" value={(telemetry.vanDerWaalsPressure * 100).toFixed(2)} unit="kPa" color="text-pink-400" sub="Theoretical corrected pressure" />
            <StatRow
              label="Pressure Deviation"
              value={`${Math.abs(((telemetry.measuredPressure - telemetry.idealPressure) / telemetry.idealPressure) * 100).toFixed(1)}`}
              unit="%"
              color="text-orange-400"
              sub="|P_meas - P_ideal| / P_ideal"
            />
            <StatRow
              label="Attractive Parameter (a)"
              value={gasPreset === "real" ? attractiveForce.toFixed(1) : "0.0"}
              unit="L²·atm/mol²"
              color="text-pink-400"
              sub="Intermolecular cohesive forces"
            />
            <StatRow label="Collisions Enabled" value={enableCollisions || gasPreset !== "ideal" ? "Yes" : "No"} unit="" color="text-emerald-400" border={false} />
          </SectionCard>
        </div>
 
        {/* Governing Equations Cards */}
        <SectionCard title="Governing Physical Equations & Solver Theory" icon={Shield} color="#06b6d4" span={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <EquationBlock
                equation={"P · V = N · k_B · T"}
                label="Ideal Gas Law"
                color="#06b6d4"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {expertiseLevel === "beginner" && "The fundamental gas equation connecting pressure, volume, temperature, and amount of gas. Assumes zero particle size and zero attraction."}
                {expertiseLevel === "intermediate" && "Governs the macroscopic state of non-interacting point particles. Evaluates average pressure P in terms of kinetic thermal energy."}
                {expertiseLevel === "expert" && "Classical macroscopic equation of state. Derived from partition function of non-interacting degrees of freedom. P is exactly spherical kinetic momentum transfer."}
              </p>
            </div>
            <div>
              <EquationBlock
                equation={"(P + a·N²/V²)(V - N·b) = N·k_B·T"}
                label="Van der Waals Equation (Real Gas)"
                color="#10b981"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {expertiseLevel === "beginner" && "Adjusts the ideal gas law to account for the actual space occupied by particles (b) and the electrostatic pull between them (a)."}
                {expertiseLevel === "intermediate" && "Corrects ideal gas law by accounting for finite particle volumes (co-volume b) and short-range attractive forces (pressure drop factor a)."}
                {expertiseLevel === "expert" && "Semiphenomenological equation of state for real fluids. Parameter b represents four times the molecular volume. Parameter a accounts for the attractive electrostatic dispersion forces."}
              </p>
            </div>
            <div>
              <EquationBlock
                equation={"f(v) = (m·v / (k_B·T)) · exp(-m·v² / (2·k_B·T))"}
                label="2D Maxwell-Boltzmann Distribution"
                color="#f59e0b"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                {expertiseLevel === "beginner" && "Calculates the statistical speed of gas particles. Most particles move around a medium speed, but some are very slow or very fast."}
                {expertiseLevel === "intermediate" && "The statistical speed probability density function for a gas in 2D. The peak velocity shifts to the right as temperature increases or mass decreases."}
                {expertiseLevel === "expert" && "The probability density function for particle speed in a 2D isotropic thermalized ensemble, derived from integrating the Gaussian velocity distribution in polar coordinates."}
              </p>
            </div>
          </div>

          {/* Gas Preset Properties Table */}
          <div className="mt-6 border-t border-white/[0.05] pt-5">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Thermodynamic Gas Properties Table</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="text-white/30 uppercase tracking-wider">
                    <th className="text-left py-2 pr-4 font-bold">Gas Preset</th>
                    <th className="text-right py-2 pr-4 font-bold">Relative Mass</th>
                    <th className="text-right py-2 pr-4 font-bold">Atomic Radius [pm]</th>
                    <th className="text-right py-2 pr-4 font-bold">Hard Collisions</th>
                    <th className="text-right py-2 font-bold">Cohesive Attractions</th>
                  </tr>
                </thead>
                <tbody>
                  {GAS_DATA.map((g) => (
                    <tr key={g.name} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-4 text-white/70 font-bold text-[11px]">{g.name}</td>
                      <td className="py-2 pr-4 text-amber-400 text-right">{g.mass}</td>
                      <td className="py-2 pr-4 text-cyan-400 text-right">{g.radius.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-pink-400 text-right">{g.collisions}</td>
                      <td className="py-2 text-emerald-400 text-right">{g.attraction}</td>
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
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Note on Pressure Fluctuations</h4>
              <p className="text-[11px] text-white/40 leading-relaxed">
                You might notice that the measured pressure is slightly noisy and fluctuates around the ideal gas curve. This is not a numerical error; it represents physical **shot noise** due to the discrete nature of particles colliding with the walls! In a macroscale container with 10²³ particles, this noise is averaged out, but in our microscopic simulation chamber with finite particles, it is directly visible.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

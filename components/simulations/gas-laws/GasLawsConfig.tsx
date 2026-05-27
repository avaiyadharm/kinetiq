"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, Settings2, Shield, BarChart2, Zap, Info, Sliders, Volume2, Sparkles, HelpCircle
} from "lucide-react";

interface GasLawsConfigProps {
  temperature: number;
  volume: number;
  particleCount: number;
  regime: "free" | "boyle" | "charles" | "gay-lussac" | "avogadro" | "adiabatic";
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

  // Physics Calibrations
  gravity: number;
  setGravity: (v: number) => void;
  friction: number;
  setFriction: (v: number) => void;
  elasticity: number;
  setElasticity: (v: number) => void;

  // Visualization Toggles
  showTrails: boolean;
  setShowTrails: (v: boolean) => void;
  showHeatMap: boolean;
  setShowHeatMap: (v: boolean) => void;
  enableSound: boolean;
  setEnableSound: (v: boolean) => void;
  showCollisionRings: boolean;
  setShowCollisionRings: (v: boolean) => void;
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
  gravity,
  setGravity,
  friction,
  setFriction,
  elasticity,
  setElasticity,
  showTrails,
  setShowTrails,
  showHeatMap,
  setShowHeatMap,
  enableSound,
  setEnableSound,
  showCollisionRings,
  setShowCollisionRings
}) => {
  const kb = 0.05; 
  const V_scaled = telemetry.measuredVolume;
  const T_measured = telemetry.measuredTemp || 1;
  const P_measured = telemetry.measuredPressure;
  const Z = (P_measured * V_scaled) / (particleCount * kb * T_measured);

  let b_coeff = 0.0;
  let particleRadius = 4.0;
  if (gasPreset === "helium") {
    particleRadius = 3.0;
    b_coeff = 0.005;
  } else if (gasPreset === "xenon") {
    particleRadius = 8.5;
    b_coeff = 0.022;
  } else if (gasPreset === "real") {
    particleRadius = 6.0;
    b_coeff = 0.015;
  }

  const totalExcludedVolume = particleCount * b_coeff;
  const excludedVolumePercentage = (totalExcludedVolume / V_scaled) * 100;

  const GAS_DATA = [
    { name: "Ideal Gas", mass: 1.0, radius: 0.0, collisions: "No", attraction: "None" },
    { name: "Helium (He)", mass: 0.5, radius: 3.0, collisions: "Yes", attraction: "None" },
    { name: "Xenon (Xe)", mass: 4.0, radius: 8.5, collisions: "Yes", attraction: "None" },
    { name: "Real Gas (vdw)", mass: 2.0, radius: 6.0, collisions: "Yes", attraction: "Variable" },
  ];

  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-8 pb-24">
        
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Compressibility Factor Z = {Z.toFixed(3)}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            Regime: {regime.toUpperCase()}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            N = {particleCount} atoms
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border-purple-500/20">
            Co-Volume: {excludedVolumePercentage.toFixed(1)}%
          </div>
        </div>

        {/* Configuration Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Spatial parameters */}
          <SectionCard title="Chamber Physical Dimensions" icon={Settings2} color="#0d9488">
            <StatRow label="Chamber Volume (V)" value={telemetry.measuredVolume.toFixed(2)} unit="dm³" color="text-teal-400" sub="Measured virtual volume" />
            <StatRow label="Volume Fraction V" value={volume.toFixed(2)} unit="" color="text-teal-400" />
            <StatRow label="Piston Position X" value={Math.round(volume * 100).toString()} unit="%" color="text-cyan-400" />
            <StatRow label="Particle Radius (r)" value={particleRadius.toFixed(1)} unit="px" color="text-cyan-400" />
            <StatRow label="Excluded Volume (b)" value={totalExcludedVolume.toFixed(3)} unit="dm³" color="text-purple-400" sub={`${excludedVolumePercentage.toFixed(1)}% of volume`} />
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
            <StatRow label="RMS Velocity (v_rms)" value={Math.sqrt((2 * 1.5 * telemetry.measuredTemp) / (gasPreset === "helium" ? 0.5 : gasPreset === "xenon" ? 4.0 : gasPreset === "real" ? 2.0 : 1.0)).toFixed(1)} unit="m/s" color="text-cyan-400" sub="Root mean square speed" />
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

        {/* ─── NEW SECTION: Advanced Environment Calibrations ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Calibrations sliders card */}
          <SectionCard title="Advanced Physics Environment Constants" icon={Sliders} color="#3b82f6">
            <div className="space-y-6 mt-2">
              
              {/* Gravity slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/60">Gravity Vector (g_y)</span>
                  <span className="text-blue-400 font-mono">{gravity.toFixed(2)} m/s²</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={gravity}
                  onChange={(e) => setGravity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[8px] text-white/30 block">Applies a downward acceleration to particles, causing sedimentation.</span>
              </div>

              {/* Friction / Drag slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/60">Air Friction / Drag Coefficient</span>
                  <span className="text-blue-400 font-mono">{friction.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.15"
                  step="0.005"
                  value={friction}
                  onChange={(e) => setFriction(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[8px] text-white/30 block">Introduces drag forces that continuously dissipate kinetic energy.</span>
              </div>

              {/* Elasticity / Restitution slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-white/60">Collision Elasticity (Restitution)</span>
                  <span className="text-blue-400 font-mono">{elasticity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.02"
                  value={elasticity}
                  onChange={(e) => setElasticity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[8px] text-white/30 block">Restitution coeff. Under 1.0, collisions are inelastic, losing thermal velocity.</span>
              </div>

            </div>
          </SectionCard>

          {/* Diagnostic Visualizations toggles card */}
          <SectionCard title="Visual Telemetry Overlays & Audio" icon={Sparkles} color="#10b981">
            <div className="space-y-4.5 mt-2">
              
              {/* Particle Trails */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <div>
                  <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider block">Motion Blur Trails</span>
                  <span className="text-[8.5px] text-white/30 block">Draws historical position trails behind particles.</span>
                </div>
                <button
                  onClick={() => setShowTrails(!showTrails)}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors",
                    showTrails ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                    showTrails ? "left-4.5" : "left-0.5"
                  )} />
                </button>
              </div>

              {/* Density Heat-Map */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <div>
                  <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider block">Spatial Heat-Map Grid</span>
                  <span className="text-[8.5px] text-white/30 block">Overlays a concentration grid colored by local density.</span>
                </div>
                <button
                  onClick={() => setShowHeatMap(!showHeatMap)}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors",
                    showHeatMap ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                    showHeatMap ? "left-4.5" : "left-0.5"
                  )} />
                </button>
              </div>

              {/* Collision Rings */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <div>
                  <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider block">Collision Wavelets</span>
                  <span className="text-[8.5px] text-white/30 block">Spawns visual expanding shock rings on impact points.</span>
                </div>
                <button
                  onClick={() => setShowCollisionRings(!showCollisionRings)}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors",
                    showCollisionRings ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                    showCollisionRings ? "left-4.5" : "left-0.5"
                  )} />
                </button>
              </div>

              {/* Audio feedback */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-white/40" />
                  <div>
                    <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider block">Sonal Telemetry Audio</span>
                    <span className="text-[8.5px] text-white/30 block">Plays synthesized bleep sounds during boundary collisions.</span>
                  </div>
                </div>
                <button
                  onClick={() => setEnableSound(!enableSound)}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors",
                    enableSound ? "bg-emerald-500" : "bg-white/10"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                    enableSound ? "left-4.5" : "left-0.5"
                  )} />
                </button>
              </div>

            </div>
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

      </div>
    </div>
  );
};

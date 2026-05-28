"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCarnotStore, ThermostatMethod, SolverMode } from "@/store/carnotStore";
import { cn } from "@/lib/utils";
import {
  Thermometer, Atom, Settings2, AlertTriangle, Eye,
  BarChart2, Cpu, ChevronDown, ChevronRight, Zap, Activity
} from "lucide-react";

// ─── Reusable Components ──────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ icon, title, subtitle, color, isOpen, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`} style={{ background: `${color}1a` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="text-left">
        <div className="text-sm font-black text-white uppercase tracking-wider">{title}</div>
        <div className="text-[10px] text-white/30 font-mono mt-0.5">{subtitle}</div>
      </div>
    </div>
    <div className={cn("transition-transform", isOpen ? "rotate-180" : "")}>
      <ChevronDown className="w-4 h-4 text-white/30" />
    </div>
  </button>
);

const ConfigSlider: React.FC<{
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  description?: string;
}> = ({ label, value, unit, min, max, step = 0.01, onChange, color = "#06b6d4", description }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</div>
        {description && <div className="text-[9px] text-white/20 mt-0.5 font-mono">{description}</div>}
      </div>
      <span className="text-sm font-mono font-bold" style={{ color }}>{value.toFixed(step < 1 ? 2 : 0)} <span className="text-[10px] text-white/30">{unit}</span></span>
    </div>
    <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all"
        style={{ width: `${((value - min) / (max - min)) * 100}%`, background: color }}
      />
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full opacity-0 h-0 absolute"
      style={{ marginTop: "-8px" }}
    />
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-transparent appearance-none cursor-pointer -mt-4"
    />
  </div>
);

const ToggleSwitch: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
  description?: string;
}> = ({ label, value, onChange, color = "#06b6d4", description }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</div>
      {description && <div className="text-[9px] text-white/25 font-mono mt-0.5">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-10 h-5 rounded-full transition-all relative border",
        value ? "border-transparent" : "bg-white/5 border-white/10"
      )}
      style={{ background: value ? color : undefined }}
    >
      <div className={cn(
        "w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all shadow-sm",
        value ? "left-[22px]" : "left-[3px]"
      )} />
    </button>
  </div>
);

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-5 space-y-5 border-t border-white/5 bg-black/10">{children}</div>
);

// ─── Live Efficiency Gauge ─────────────────────────────────────────────────────
const EfficiencyGauge: React.FC<{ TH: number; TC: number; losses: number }> = ({ TH, TC, losses }) => {
  const carnotEff = 1 - TC / TH;
  const realEff = Math.max(0, carnotEff - losses);
  return (
    <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Efficiency Readout</span>
        <span className="text-[9px] font-mono text-white/20">Live Estimate</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Carnot Max (η)</span>
            <span className="text-[9px] font-mono text-cyan-400">{(carnotEff * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${carnotEff * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Real Engine (η_real)</span>
            <span className="text-[9px] font-mono text-orange-400">{(realEff * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${realEff * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-white/5">
        <span className="text-[9px] text-white/20 font-mono">Efficiency Loss</span>
        <span className="text-[9px] font-mono text-red-400">-{(losses * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const CarnotConfig: React.FC = () => {
  const store = useCarnotStore();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    thermal: true, molecular: false, mechanics: false,
    losses: false, viz: false, graph: false, solver: false
  });

  const toggle = (k: string) => setOpenSections(s => ({ ...s, [k]: !s[k] }));

  const totalLosses =
    (store.heatLeakageEnabled ? store.thermalLeakage * 0.001 : 0) +
    (store.frictionLossEnabled ? store.mechanicalFriction * 0.08 : 0) +
    (store.inelasticCollisionsEnabled ? (1 - store.collisionElasticity) * 0.05 : 0) +
    (store.turbulenceEnabled ? 0.03 : 0) +
    (store.nonIdealGasEnabled ? 0.02 : 0);

  const thermostatDescriptions: Record<ThermostatMethod, string> = {
    velocity_scaling: "Simple rescaling of all particle velocities to match target T. Instantaneous, non-physical.",
    andersen: "Randomly resets particle velocities from Boltzmann distribution at fixed collision rate. Generates canonical ensemble.",
    berendsen: "Exponentially decays temperature deviation with time constant τ. Smooth but doesn't sample canonical ensemble exactly.",
    nose_hoover: "Extended Lagrangian method with virtual 'heat bath' variable. Rigorously generates NVT ensemble. Preferred for precision."
  };

  const solverDescriptions: Record<SolverMode, string> = {
    molecular_dynamics: "Numerically integrates Newton's equations for all N particles. O(N²) scaling. Maximum physical fidelity.",
    monte_carlo: "Statistical sampling of configuration space using Metropolis criterion. Efficient for equilibrium properties.",
    hybrid_statistical: "MD for short-range dynamics; MC for rare-event sampling. Best performance/accuracy tradeoff."
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] custom-scrollbar">
      {/* Engineering grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative max-w-5xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Engine <span className="text-cyan-400">Configuration</span>
            </h2>
            <span className="text-[10px] font-black border border-cyan-500/20 text-cyan-400 bg-cyan-500/5 px-2 py-1 rounded uppercase tracking-widest">
              Advanced
            </span>
          </div>
          <p className="text-white/30 text-sm font-mono">
            Full thermodynamic parameter calibration for the Carnot cycle simulation engine.
          </p>
        </div>

        {/* Live Efficiency Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Hot Reservoir", value: `${store.TH} K`, color: "text-red-400", bg: "bg-red-500/5 border-red-500/10" },
            { label: "Cold Reservoir", value: `${store.TC} K`, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
            { label: "Carnot Efficiency", value: `${((1 - store.TC / store.TH) * 100).toFixed(2)}%`, color: "text-cyan-400", bg: "bg-cyan-500/5 border-cyan-500/10" },
          ].map(m => (
            <div key={m.label} className={`p-4 rounded-xl border ${m.bg}`}>
              <div className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">{m.label}</div>
              <div className={`text-2xl font-mono font-black ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* ── Section A: Thermal Reservoir ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<Thermometer className="w-5 h-5" />}
            title="Thermal Reservoir Configuration"
            subtitle="Heat source / sink physical parameters"
            color="#ef4444"
            isOpen={openSections.thermal}
            onToggle={() => toggle("thermal")}
          />
          <AnimatePresence>
            {openSections.thermal && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ConfigSlider label="Hot Reservoir Temperature (T_H)" value={store.TH} unit="K" min={350} max={1200} step={1} onChange={store.setTH} color="#ef4444" description="Upper thermal boundary. Defines maximum entropy source." />
                    <ConfigSlider label="Cold Reservoir Temperature (T_C)" value={store.TC} unit="K" min={100} max={400} step={1} onChange={store.setTC} color="#3b82f6" description="Lower thermal sink. Entropy is deposited here." />
                    <ConfigSlider label="Heat Capacity" value={store.heatCapacity} unit="J/K" min={100} max={50000} step={100} onChange={v => store.setConfig("heatCapacity", v)} color="#f59e0b" description="Thermal mass of each reservoir. Higher = more stable temperature." />
                    <ConfigSlider label="Thermal Conductivity" value={store.thermalConductivity} unit="W/mK" min={0.1} max={5} step={0.01} onChange={v => store.setConfig("thermalConductivity", v)} color="#8b5cf6" description="Rate of heat diffusion. Affects coupling transient response." />
                    <ConfigSlider label="Heat Exchange Rate" value={store.heatExchangeRate} unit="W" min={1} max={500} step={1} onChange={v => store.setConfig("heatExchangeRate", v)} color="#10b981" description="Power throughput between reservoir and working gas." />
                    <ConfigSlider label="Coupling Strength" value={store.couplingStrength} unit="" min={0} max={1} step={0.01} onChange={v => store.setConfig("couplingStrength", v)} color="#06b6d4" description="Thermodynamic coupling coefficient. 1.0 = perfect contact." />
                    <ConfigSlider label="Thermal Leakage" value={store.thermalLeakage} unit="W" min={0} max={20} step={0.1} onChange={v => store.setConfig("thermalLeakage", v)} color="#f97316" description="Parasitic heat loss to the surroundings. Reduces efficiency." />
                    <ConfigSlider label="Ambient Temperature" value={store.ambientTemp} unit="K" min={200} max={400} step={1} onChange={v => store.setConfig("ambientTemp", v)} color="#94a3b8" description="Environmental reference temperature for leakage calculation." />
                  </div>
                  <EfficiencyGauge TH={store.TH} TC={store.TC} losses={totalLosses} />
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section B: Molecular Dynamics ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<Atom className="w-5 h-5" />}
            title="Molecular Dynamics Settings"
            subtitle="Microscopic particle simulation parameters"
            color="#8b5cf6"
            isOpen={openSections.molecular}
            onToggle={() => toggle("molecular")}
          />
          <AnimatePresence>
            {openSections.molecular && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ConfigSlider label="Particle Count (N)" value={store.particleCount} unit="" min={10} max={1000} step={10} onChange={v => store.setConfig("particleCount", v)} color="#8b5cf6" description="Total number of simulated gas molecules." />
                    <ConfigSlider label="Molecular Mass" value={store.molecularMass} unit="amu" min={1} max={131} step={1} onChange={v => store.setConfig("molecularMass", v)} color="#a855f7" description="H=1, He=4, N₂=28, Ar=40, Xe=131 amu." />
                    <ConfigSlider label="Particle Radius" value={store.particleRadius} unit="pm" min={50} max={400} step={5} onChange={v => store.setConfig("particleRadius", v)} color="#7c3aed" description="Effective collision cross-section radius." />
                    <ConfigSlider label="Collision Elasticity" value={store.collisionElasticity} unit="" min={0.5} max={1} step={0.01} onChange={v => store.setConfig("collisionElasticity", v)} color="#ec4899" description="1.0 = perfectly elastic; <1 = energy dissipation per collision." />
                    <ConfigSlider label="Intermolecular Attraction" value={store.intermolecularAttraction} unit="eV" min={0} max={0.5} step={0.001} onChange={v => store.setConfig("intermolecularAttraction", v)} color="#f43f5e" description="Lennard-Jones well depth. 0 = ideal gas; >0 = real gas attraction." />
                    <ConfigSlider label="Drag Coefficient" value={store.dragCoefficient} unit="" min={0} max={0.5} step={0.01} onChange={v => store.setConfig("dragCoefficient", v)} color="#64748b" description="Viscous drag on each particle. Simulates non-vacuum environments." />
                    <ConfigSlider label="Gravity" value={store.gravity} unit="m/s²" min={0} max={20} step={0.1} onChange={v => store.setConfig("gravity", v)} color="#94a3b8" description="Gravitational acceleration on particles. 0 = weightless chamber." />
                    <ConfigSlider label="Brownian Noise" value={store.brownianNoise} unit="" min={0} max={1} step={0.01} onChange={v => store.setConfig("brownianNoise", v)} color="#06b6d4" description="Random thermal noise amplitude. Mimics sub-grid fluctuations." />
                  </div>

                  {/* Thermostat Selector */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">Thermostat Method</div>
                    <div className="grid grid-cols-2 gap-3">
                      {(["velocity_scaling", "andersen", "berendsen", "nose_hoover"] as ThermostatMethod[]).map(method => (
                        <button
                          key={method}
                          onClick={() => store.setConfig("thermostatMethod", method)}
                          className={cn(
                            "p-4 rounded-xl border text-left transition-all",
                            store.thermostatMethod === method
                              ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                              : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/10"
                          )}
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider mb-1">
                            {method.replace(/_/g, " ")}
                          </div>
                          <div className="text-[9px] leading-relaxed opacity-70">
                            {thermostatDescriptions[method].substring(0, 60)}...
                          </div>
                        </button>
                      ))}
                    </div>
                    {store.thermostatMethod && (
                      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 text-[10px] text-white/50 leading-relaxed font-mono">
                        {thermostatDescriptions[store.thermostatMethod]}
                      </div>
                    )}
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section C: Engine Mechanics ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<Settings2 className="w-5 h-5" />}
            title="Engine Mechanical Parameters"
            subtitle="Piston, compression, and cycle mechanics"
            color="#10b981"
            isOpen={openSections.mechanics}
            onToggle={() => toggle("mechanics")}
          />
          <AnimatePresence>
            {openSections.mechanics && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ConfigSlider label="Piston Speed" value={store.pistonSpeed} unit="m/s" min={0.1} max={5} step={0.1} onChange={v => store.setConfig("pistonSpeed", v)} color="#10b981" description="Rate of piston displacement during expansion/compression." />
                    <ConfigSlider label="Compression Ratio" value={store.compressionRatio} unit="" min={2} max={20} step={0.5} onChange={v => store.setConfig("compressionRatio", v)} color="#06b6d4" description="V_max / V_min. Higher ratio = wider PV loop = more work." />
                    <ConfigSlider label="Minimum Volume" value={store.minVolume} unit="L" min={0.5} max={5} step={0.1} onChange={v => store.setConfig("minVolume", v)} color="#f59e0b" description="Dead volume at maximum compression." />
                    <ConfigSlider label="Maximum Volume" value={store.maxVolume} unit="L" min={5} max={50} step={0.5} onChange={v => store.setConfig("maxVolume", v)} color="#f59e0b" description="Full expansion volume limit." />
                    <ConfigSlider label="Mechanical Friction" value={store.mechanicalFriction} unit="" min={0} max={1} step={0.01} onChange={v => store.setConfig("mechanicalFriction", v)} color="#ef4444" description="Piston wall friction coefficient. Converts work to heat." />
                    <ConfigSlider label="Engine RPM" value={store.engineRPM} unit="rpm" min={10} max={3600} step={10} onChange={v => store.setConfig("engineRPM", v)} color="#8b5cf6" description="Cycle frequency. Higher RPM = less time for heat exchange." />
                    <ConfigSlider label="Insulation Quality" value={store.insulationQuality} unit="" min={0} max={1} step={0.01} onChange={v => store.setConfig("insulationQuality", v)} color="#94a3b8" description="Thermal isolation of cylinder walls. 1.0 = perfect adiabat." />
                    <ConfigSlider label="Expansion Rate" value={store.expansionRate} unit="×" min={0.1} max={5} step={0.1} onChange={v => store.setConfig("expansionRate", v)} color="#34d399" description="Speed multiplier for expansion strokes." />
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section D: Real Engine Losses ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Real Engine Losses"
            subtitle="Irreversibility and entropy generation effects"
            color="#f97316"
            isOpen={openSections.losses}
            onToggle={() => toggle("losses")}
          />
          <AnimatePresence>
            {openSections.losses && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <ToggleSwitch label="Heat Leakage" value={store.heatLeakageEnabled} onChange={v => store.setConfig("heatLeakageEnabled", v)} color="#f97316" description="Parasitic thermal loss through cylinder walls." />
                    <ToggleSwitch label="Mechanical Friction" value={store.frictionLossEnabled} onChange={v => store.setConfig("frictionLossEnabled", v)} color="#ef4444" description="Piston friction converts useful work to heat." />
                    <ToggleSwitch label="Inelastic Collisions" value={store.inelasticCollisionsEnabled} onChange={v => store.setConfig("inelasticCollisionsEnabled", v)} color="#f59e0b" description="Molecular collision energy loss. Reduces pressure." />
                    <ToggleSwitch label="Turbulence" value={store.turbulenceEnabled} onChange={v => store.setConfig("turbulenceEnabled", v)} color="#a78bfa" description="Fluid dynamic losses at high flow velocities." />
                    <ToggleSwitch label="Non-Ideal Gas Effects" value={store.nonIdealGasEnabled} onChange={v => store.setConfig("nonIdealGasEnabled", v)} color="#22d3ee" description="Van der Waals attraction and volume correction." />
                  </div>

                  {store.nonIdealGasEnabled && (
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5 mt-2">
                      <ConfigSlider label="Van der Waals a" value={store.vanDerWaalsA} unit="L²·atm/mol²" min={0} max={10} step={0.01} onChange={v => store.setConfig("vanDerWaalsA", v)} color="#22d3ee" description="Intermolecular attraction correction." />
                      <ConfigSlider label="Van der Waals b" value={store.vanDerWaalsB} unit="L/mol" min={0} max={0.5} step={0.001} onChange={v => store.setConfig("vanDerWaalsB", v)} color="#22d3ee" description="Excluded volume correction." />
                    </div>
                  )}

                  <div className="mt-4">
                    <EfficiencyGauge TH={store.TH} TC={store.TC} losses={totalLosses} />
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section E: Visualization ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<Eye className="w-5 h-5" />}
            title="Visualization Settings"
            subtitle="Rendering effects and scientific overlays"
            color="#06b6d4"
            isOpen={openSections.viz}
            onToggle={() => toggle("viz")}
          />
          <AnimatePresence>
            {openSections.viz && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <ToggleSwitch label="Motion Blur" value={store.vizSettings.motionBlur} onChange={v => store.setVizSetting("motionBlur", v)} color="#06b6d4" description="Temporal anti-aliasing on fast-moving particles." />
                    <ToggleSwitch label="Thermal Heatmap" value={store.vizSettings.thermalHeatmap} onChange={v => store.setVizSetting("thermalHeatmap", v)} color="#ef4444" description="Color-codes regions by local temperature." />
                    <ToggleSwitch label="Particle Trails" value={store.vizSettings.particleTrails} onChange={v => store.setVizSetting("particleTrails", v)} color="#8b5cf6" description="Renders trajectory history of individual molecules." />
                    <ToggleSwitch label="Entropy Overlay" value={store.vizSettings.entropyOverlay} onChange={v => store.setVizSetting("entropyOverlay", v)} color="#f59e0b" description="Visualizes local Shannon entropy density." />
                    <ToggleSwitch label="Pressure Field" value={store.vizSettings.pressureField} onChange={v => store.setVizSetting("pressureField", v)} color="#10b981" description="Pressure contour map across the cylinder volume." />
                    <ToggleSwitch label="Velocity Vectors" value={store.vizSettings.velocityVectors} onChange={v => store.setVizSetting("velocityVectors", v)} color="#06b6d4" description="Arrow glyphs showing individual particle velocities." />
                    <ToggleSwitch label="Path Tracing" value={store.vizSettings.pathTracing} onChange={v => store.setVizSetting("pathTracing", v)} color="#a855f7" description="Ray-traced photorealistic particle rendering." />
                    <ToggleSwitch label="Collision Wavelets" value={store.vizSettings.collisionWavelets} onChange={v => store.setVizSetting("collisionWavelets", v)} color="#f43f5e" description="Shows pressure waves emanating from each collision." />
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section F: Graph Engine ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<BarChart2 className="w-5 h-5" />}
            title="Graph Engine Settings"
            subtitle="Scientific graph rendering and sampling parameters"
            color="#10b981"
            isOpen={openSections.graph}
            onToggle={() => toggle("graph")}
          />
          <AnimatePresence>
            {openSections.graph && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ConfigSlider label="Graph Smoothing" value={store.graphSettings.smoothing} unit="" min={0} max={1} step={0.01} onChange={v => store.setGraphSetting("smoothing", v)} color="#10b981" description="Bezier spline interpolation strength." />
                    <ConfigSlider label="Sampling Rate" value={store.graphSettings.samplingRate} unit="Hz" min={5} max={120} step={5} onChange={v => store.setGraphSetting("samplingRate", v)} color="#06b6d4" description="Data acquisition frequency for all plots." />
                    <ConfigSlider label="Rolling Average Window" value={store.graphSettings.rollingAvgWindow} unit="frames" min={5} max={200} step={5} onChange={v => store.setGraphSetting("rollingAvgWindow", v)} color="#8b5cf6" description="Moving average for noise reduction on live data." />
                    <ConfigSlider label="Histogram Bins" value={store.graphSettings.histogramBins} unit="" min={5} max={100} step={5} onChange={v => store.setGraphSetting("histogramBins", v)} color="#f59e0b" description="Number of bins for Maxwell-Boltzmann speed distribution." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                    <ToggleSwitch label="Log Scale X" value={store.graphSettings.logScaleX} onChange={v => store.setGraphSetting("logScaleX", v)} color="#10b981" description="Logarithmic x-axis for wide dynamic range." />
                    <ToggleSwitch label="Log Scale Y" value={store.graphSettings.logScaleY} onChange={v => store.setGraphSetting("logScaleY", v)} color="#10b981" description="Logarithmic y-axis." />
                    <ToggleSwitch label="Multi-Curve Overlay" value={store.graphSettings.multiCurveOverlay} onChange={v => store.setGraphSetting("multiCurveOverlay", v)} color="#06b6d4" description="Overlay multiple simulation runs for comparison." />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">Interpolation Method</div>
                    <div className="flex gap-3">
                      {(["linear", "cubic", "step"] as const).map(method => (
                        <button
                          key={method}
                          onClick={() => store.setGraphSetting("interpolation", method)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                            store.graphSettings.interpolation === method
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-white/[0.02] border-white/5 text-white/30 hover:border-white/10"
                          )}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Section G: Solver ── */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden">
          <SectionHeader
            icon={<Cpu className="w-5 h-5" />}
            title="Simulation Engine"
            subtitle="Physics solver selection and computational diagnostics"
            color="#f59e0b"
            isOpen={openSections.solver}
            onToggle={() => toggle("solver")}
          />
          <AnimatePresence>
            {openSections.solver && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                <SectionCard>
                  <div className="space-y-3">
                    {(["molecular_dynamics", "monte_carlo", "hybrid_statistical"] as SolverMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => store.setConfig("solverMode", mode)}
                        className={cn(
                          "w-full p-5 rounded-xl border text-left transition-all",
                          store.solverMode === mode
                            ? "bg-amber-500/10 border-amber-500/20"
                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn(
                            "text-[11px] font-black uppercase tracking-widest",
                            store.solverMode === mode ? "text-amber-300" : "text-white/50"
                          )}>
                            {mode.replace(/_/g, " ")}
                          </div>
                          {store.solverMode === mode && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/30 leading-relaxed font-mono">
                          {solverDescriptions[mode]}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Performance readout */}
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {[
                      { label: "FPS", value: store.solverMode === "molecular_dynamics" ? "~45" : store.solverMode === "monte_carlo" ? "~120" : "~90", color: "text-cyan-400" },
                      { label: "CPU Load", value: store.solverMode === "molecular_dynamics" ? "~70%" : store.solverMode === "monte_carlo" ? "~30%" : "~55%", color: "text-amber-400" },
                      { label: "Accuracy", value: store.solverMode === "molecular_dynamics" ? "98.5%" : store.solverMode === "monte_carlo" ? "91.2%" : "95.8%", color: "text-emerald-400" },
                    ].map(m => (
                      <div key={m.label} className="p-4 rounded-xl bg-black/30 border border-white/5 text-center">
                        <div className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">{m.label}</div>
                        <div className={`text-xl font-mono font-black ${m.color}`}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

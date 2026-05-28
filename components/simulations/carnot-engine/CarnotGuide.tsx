"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BookOpen, Play, BarChart2, Activity, FlaskConical,
  Beaker, HelpCircle, ChevronRight, CheckCircle2, Info,
  Thermometer, ArrowRight, Zap, Target
} from "lucide-react";

// ─── Section Navigation ───────────────────────────────────────────────────────
type Section = "start" | "cycle" | "graphs" | "analytics" | "experiments" | "advanced" | "help";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "start", label: "Getting Started", icon: <BookOpen className="w-4 h-4" />, color: "#06b6d4" },
  { id: "cycle", label: "Running the Cycle", icon: <Play className="w-4 h-4" />, color: "#10b981" },
  { id: "graphs", label: "Reading Graphs", icon: <BarChart2 className="w-4 h-4" />, color: "#f59e0b" },
  { id: "analytics", label: "Engine Analytics", icon: <Activity className="w-4 h-4" />, color: "#ef4444" },
  { id: "experiments", label: "Experiment Modes", icon: <FlaskConical className="w-4 h-4" />, color: "#8b5cf6" },
  { id: "advanced", label: "Advanced Experiments", icon: <Beaker className="w-4 h-4" />, color: "#a855f7" },
  { id: "help", label: "Interactive Help", icon: <HelpCircle className="w-4 h-4" />, color: "#f43f5e" },
];

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
  detail?: string;
  color?: string;
}> = ({ step, title, description, detail, color = "#06b6d4" }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: step * 0.07 }}
    className="flex gap-4 p-5 rounded-xl bg-[#18181b] border border-white/5"
  >
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black"
      style={{ background: `${color}15`, color }}>
      {step}
    </div>
    <div className="flex-1 space-y-1">
      <div className="text-sm font-black text-white">{title}</div>
      <div className="text-xs text-white/50 leading-relaxed">{description}</div>
      {detail && <div className="text-[10px] font-mono text-white/25 leading-relaxed mt-2 p-2 bg-black/30 rounded-lg">{detail}</div>}
    </div>
  </motion.div>
);

// ─── Callout Box ──────────────────────────────────────────────────────────────
const Callout: React.FC<{ type: "info" | "tip" | "warning"; children: React.ReactNode }> = ({ type, children }) => {
  const styles = {
    info: { border: "#06b6d4", bg: "#06b6d420", icon: <Info className="w-4 h-4 text-cyan-400" />, label: "Note" },
    tip: { border: "#10b981", bg: "#10b98120", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, label: "Pro Tip" },
    warning: { border: "#f59e0b", bg: "#f59e0b15", icon: <Zap className="w-4 h-4 text-amber-400" />, label: "Important" },
  }[type];
  return (
    <div className="flex gap-3 p-4 rounded-xl border" style={{ background: styles.bg, borderColor: `${styles.border}30` }}>
      <div className="shrink-0 mt-0.5">{styles.icon}</div>
      <div className="text-xs text-white/60 leading-relaxed">{children}</div>
    </div>
  );
};

// ─── Experiment Card ──────────────────────────────────────────────────────────
const ExperimentCard: React.FC<{
  number: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  goal: string;
  steps: string[];
  color: string;
}> = ({ number, title, difficulty, goal, steps, color }) => {
  const [expanded, setExpanded] = useState(false);
  const diffColor = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" }[difficulty];
  return (
    <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
              style={{ background: `${color}15`, color }}>
              {number}
            </div>
            <div>
              <div className="text-sm font-black text-white">{title}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: diffColor }}>
                ● {difficulty}
              </div>
            </div>
          </div>
          <ChevronRight className={cn("w-4 h-4 text-white/20 transition-transform", expanded ? "rotate-90" : "")} />
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5">
          <div className="pt-4">
            <div className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">Objective</div>
            <div className="text-xs text-white/60 leading-relaxed">{goal}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-2">Procedure</div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 text-xs text-white/50">
                  <span className="text-[10px] font-mono" style={{ color }}>{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FAQ Card ─────────────────────────────────────────────────────────────────
const FAQ: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="text-sm font-bold text-white/80">{q}</div>
        <ChevronRight className={cn("w-4 h-4 text-white/20 shrink-0 transition-transform", open ? "rotate-90" : "")} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed border-t border-white/5 pt-3">{a}</div>
      )}
    </div>
  );
};

// ─── Layout Annotation ────────────────────────────────────────────────────────
const LayoutDiagram: React.FC = () => (
  <div className="relative bg-black/40 border border-white/5 rounded-2xl p-6 h-[280px] overflow-hidden">
    <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{ backgroundImage: "linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

    {/* Sidebar */}
    <div className="absolute left-4 top-4 bottom-4 w-[18%] bg-[#18181b] border border-white/10 rounded-xl p-2 flex flex-col gap-2">
      <div className="text-[7px] text-cyan-400 font-black uppercase tracking-widest">Navigation</div>
      {["Canvas", "Config", "Theory", "Guide"].map((item) => (
        <div key={item} className="bg-white/5 rounded-md px-2 py-1.5 text-[7px] text-white/50 font-bold">{item}</div>
      ))}
    </div>

    {/* Main Canvas */}
    <div className="absolute left-[23%] right-[27%] top-4 bottom-16 bg-[#18181b] border border-white/10 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="text-[8px] text-white/30 uppercase font-black tracking-widest">Simulation Canvas</div>
        <div className="text-[7px] text-white/20 mt-1">Piston + Reservoirs</div>
      </div>
    </div>

    {/* PV Graph */}
    <div className="absolute right-4 top-4 w-[24%] bottom-[52%] bg-[#18181b] border border-white/10 rounded-xl flex items-center justify-center">
      <div className="text-[7px] text-white/25 uppercase font-black tracking-widest">P-V Graph</div>
    </div>

    {/* Controls */}
    <div className="absolute right-4 top-[52%] w-[24%] bottom-16 bg-[#18181b] border border-white/10 rounded-xl flex items-center justify-center">
      <div className="text-[7px] text-white/25 uppercase font-black tracking-widest">Controls</div>
    </div>

    {/* Analytics bar */}
    <div className="absolute left-[23%] right-[27%] bottom-4 h-10 bg-[#18181b] border border-white/10 rounded-xl flex items-center justify-around px-3">
      {["Q_H", "W_net", "Q_C"].map(l => (
        <div key={l} className="text-[7px] text-white/30 font-mono font-black">{l}</div>
      ))}
    </div>

    {/* Annotation arrows */}
    <div className="absolute left-[10%] top-[50%] text-[7px] text-cyan-400/60 font-black rotate-[-5deg]">← Sidebar</div>
    <div className="absolute left-[40%] top-[8%] text-[7px] text-emerald-400/60 font-black">Main Engine ↓</div>
    <div className="absolute right-[3%] top-[30%] text-[7px] text-violet-400/60 font-black rotate-90">Graphs</div>
    <div className="absolute left-[30%] bottom-[7%] text-[7px] text-amber-400/60 font-black">Analytics ↑</div>
  </div>
);

// ─── Graph Guide ──────────────────────────────────────────────────────────────
const GraphGuide: React.FC<{
  title: string;
  xAxis: string;
  yAxis: string;
  areaDesc: string;
  curveDesc: string;
  color: string;
}> = ({ title, xAxis, yAxis, areaDesc, curveDesc, color }) => (
  <div className="p-5 rounded-xl bg-[#18181b] border border-white/5 space-y-3">
    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{title}</div>
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-black/30 rounded-lg">
        <div className="text-[9px] text-white/30 uppercase font-black mb-1">X-Axis</div>
        <div className="text-[10px] text-white/70 font-mono">{xAxis}</div>
      </div>
      <div className="p-3 bg-black/30 rounded-lg">
        <div className="text-[9px] text-white/30 uppercase font-black mb-1">Y-Axis</div>
        <div className="text-[10px] text-white/70 font-mono">{yAxis}</div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="text-[9px] text-white/30 uppercase font-black">Enclosed Area Means</div>
      <div className="text-[10px] text-white/55 leading-relaxed" style={{ borderLeft: `2px solid ${color}50`, paddingLeft: "8px" }}>{areaDesc}</div>
    </div>
    <div className="text-[9px] text-white/40 leading-relaxed">{curveDesc}</div>
  </div>
);

// ─── Analytics Metric ─────────────────────────────────────────────────────────
const MetricExplain: React.FC<{
  metric: string;
  symbol: string;
  unit: string;
  meaning: string;
  color: string;
}> = ({ metric, symbol, unit, meaning, color }) => (
  <div className="flex gap-4 p-4 rounded-xl bg-[#18181b] border border-white/5 items-start">
    <div className="text-2xl font-mono font-black shrink-0" style={{ color }}>{symbol}</div>
    <div className="flex-1 space-y-1">
      <div className="flex items-baseline gap-2">
        <div className="text-sm font-black text-white">{metric}</div>
        <div className="text-[9px] font-mono text-white/25">[{unit}]</div>
      </div>
      <div className="text-xs text-white/45 leading-relaxed">{meaning}</div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const CarnotGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>("start");

  return (
    <div className="flex-1 overflow-hidden flex bg-[#09090b]">

      {/* Fixed sidebar nav */}
      <div className="w-56 shrink-0 border-r border-white/5 overflow-y-auto custom-scrollbar py-6 px-3 space-y-1">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-3 mb-4">User Guide</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border",
              activeSection === item.id
                ? "border-white/10 text-white bg-white/5"
                : "border-transparent text-white/35 hover:text-white/60 hover:bg-white/[0.02]"
            )}
          >
            <div style={{ color: activeSection === item.id ? item.color : undefined }}>
              {item.icon}
            </div>
            <span className="leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto p-8 space-y-6">

          {/* ── Section A: Getting Started ── */}
          {activeSection === "start" && (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Getting <span className="text-cyan-400">Started</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Learn the layout of the Carnot Engine Laboratory.</p>
              </div>
              <LayoutDiagram />
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Simulation Canvas", desc: "The main piston visualization. Shows cylinder, piston position, and thermal reservoirs swapping in real-time.", color: "#10b981" },
                  { label: "P-V Graph", desc: "Pressure-Volume indicator diagram tracing the engine's thermodynamic state. The enclosed loop area = net work.", color: "#06b6d4" },
                  { label: "Controls Panel", desc: "Set T_H and T_C. Play/Pause and adjust playback speed. Reset restores initial state.", color: "#f59e0b" },
                  { label: "Analytics Bar", desc: "Shows Q_H (heat absorbed), W_net (net work), and Q_C (heat rejected) calculated from current parameters.", color: "#ef4444" },
                  { label: "Navigation Sidebar", desc: "Access Simulation Canvas, Environment Config, Theoretical Basis, and this User Guide.", color: "#8b5cf6" },
                  { label: "Stage Indicator", desc: "Overlay shows which of the 4 Carnot stages is currently executing and live V and T values.", color: "#a855f7" },
                ].map(c => (
                  <div key={c.label} className="p-4 rounded-xl bg-[#18181b] border border-white/5">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: c.color }}>{c.label}</div>
                    <div className="text-[11px] text-white/50 leading-relaxed">{c.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Section B: Running the Cycle ── */}
          {activeSection === "cycle" && (
            <motion.div key="cycle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Running the <span className="text-emerald-400">Carnot Cycle</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Step-by-step walkthrough of a complete cycle.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="Set Hot Reservoir Temperature" description="Use the T_H slider in the Controls panel. Start with T_H = 500 K for a clear temperature differential." detail="Recommended: T_H ≥ 400K. Higher T_H = higher maximum Carnot efficiency." color="#ef4444" />
                <StepCard step={2} title="Set Cold Reservoir Temperature" description="Set T_C to a value comfortably below T_H. T_C = 300 K is a good baseline (room temperature)." detail="The efficiency η = 1 - T_C/T_H. With T_H=500K, T_C=300K gives η=40%." color="#3b82f6" />
                <StepCard step={3} title="Press Play" description="The cycle starts automatically in Isothermal Expansion. Watch the hot reservoir (red block) appear under the cylinder." detail="The piston expands as gas absorbs Q_H from the hot reservoir at constant T_H." color="#10b981" />
                <StepCard step={4} title="Observe Isothermal Expansion (Stage 1)" description="The gas volume increases while temperature remains constant. The piston moves up, and the P-V dot traces a hyperbola." color="#ef4444" />
                <StepCard step={5} title="Observe Adiabatic Expansion (Stage 2)" description="The reservoir is replaced by the insulating stand. Gas continues expanding but now cools as it does work." detail="The temperature drops from T_H to T_C during this stage. No heat is exchanged." color="#f97316" />
                <StepCard step={6} title="Observe Isothermal Compression (Stage 3)" description="The cold reservoir (blue block) appears. Work is done on the gas, and heat Q_C is rejected to the cold sink." color="#3b82f6" />
                <StepCard step={7} title="Observe Adiabatic Compression (Stage 4)" description="The insulating stand returns. Gas is compressed back to its original state while temperature rises from T_C to T_H." color="#8b5cf6" />
                <StepCard step={8} title="Cycle Repeats" description="The system returns to its initial state and the cycle begins again. Observe that the PV loop forms a closed shape." detail="The area enclosed by the PV loop equals the net work output W_net per cycle." color="#06b6d4" />
              </div>
              <Callout type="tip">
                Use <strong>Pause</strong> to freeze the simulation at any stage and inspect the exact state variables. The stage overlay will show you which of the 4 processes is paused.
              </Callout>
            </motion.div>
          )}

          {/* ── Section C: Graphs ── */}
          {activeSection === "graphs" && (
            <motion.div key="graphs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Reading the <span className="text-amber-400">Graphs</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Scientific interpretation of all graph types.</p>
              </div>
              <div className="space-y-4">
                <GraphGuide
                  title="P-V Indicator Diagram"
                  xAxis="Volume V (litres)"
                  yAxis="Pressure P (Pa)"
                  areaDesc="Net work output W_net per cycle. The larger the enclosed loop, the more useful work is extracted."
                  curveDesc="Red curve (1→2): isothermal expansion at T_H. Orange (2→3): adiabatic expansion. Blue (3→4): isothermal compression at T_C. Purple (4→1): adiabatic compression. The state dot traces these curves in real time."
                  color="#06b6d4"
                />
                <GraphGuide
                  title="T-S Diagram"
                  xAxis="Entropy S (J/K)"
                  yAxis="Temperature T (K)"
                  areaDesc="Net work output equals (T_H − T_C) × ΔS. The rectangle shape is unique to the Carnot cycle."
                  curveDesc="The Carnot cycle appears as a perfect rectangle in T-S space. This is the hallmark of the reversible cycle. Any irreversibility would round the corners inward, reducing the enclosed area."
                  color="#f59e0b"
                />
              </div>
              <Callout type="info">
                The white dot on the P-V graph moves in real-time as the simulation runs. Pause the simulation to precisely inspect which point on the theoretical curve corresponds to the current state.
              </Callout>
            </motion.div>
          )}

          {/* ── Section D: Analytics ── */}
          {activeSection === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Engine <span className="text-red-400">Analytics</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Understanding every telemetry readout in the dashboard.</p>
              </div>
              <div className="space-y-3">
                <MetricExplain metric="Heat Absorbed" symbol="Q_H" unit="Joules" color="#ef4444"
                  meaning="Total thermal energy drawn from the hot reservoir per complete cycle. Q_H = nRT_H × ln(V₂/V₁). This represents the engine's 'fuel' intake." />
                <MetricExplain metric="Net Work Output" symbol="W" unit="Joules" color="#10b981"
                  meaning="Useful mechanical energy produced per cycle. W = Q_H − Q_C = nR(T_H − T_C)ln(V₂/V₁). This is the energy available for external applications." />
                <MetricExplain metric="Heat Rejected" symbol="Q_C" unit="Joules" color="#3b82f6"
                  meaning="Waste heat dumped to the cold reservoir per cycle. Q_C = nRT_C × ln(V₃/V₄). This heat is irretrievably lost for work purposes." />
                <MetricExplain metric="Thermal Efficiency" symbol="η" unit="%" color="#06b6d4"
                  meaning="Fraction of Q_H converted to useful work. η = W/Q_H = 1 − T_C/T_H. This is the maximum possible efficiency — no real engine can exceed it." />
                <MetricExplain metric="Volume" symbol="V" unit="Litres" color="#8b5cf6"
                  meaning="Current cylinder volume. Changes continuously as the piston moves. Minimum at end of compression, maximum at end of isothermal expansion." />
                <MetricExplain metric="Temperature" symbol="T" unit="Kelvin" color="#f59e0b"
                  meaning="Current gas temperature. Constant during isothermal stages. Changes during adiabatic stages following TV^(γ-1) = const." />
              </div>
            </motion.div>
          )}

          {/* ── Section E: Experiment Modes ── */}
          {activeSection === "experiments" && (
            <motion.div key="experiments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Experiment <span className="text-violet-400">Modes</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Comparative and investigative simulation setups.</p>
              </div>
              <Callout type="info">
                Navigate to <strong>Environment Config</strong> to modify all parameters mentioned below. These experiments are designed to reveal specific thermodynamic phenomena.
              </Callout>
              <div className="space-y-4">
                {[
                  {
                    title: "Reversible vs Irreversible Engine",
                    desc: "Compare the ideal Carnot engine against a real engine with friction and heat leakage.",
                    setup: "1. Run the baseline simulation. Note efficiency η₀. 2. Enable 'Mechanical Friction' and 'Heat Leakage' in Config → Real Engine Losses. 3. Observe efficiency reduction and entropy generation.",
                    expected: "Efficiency will decrease below the Carnot maximum. Entropy production becomes positive. The PV loop area shrinks."
                  },
                  {
                    title: "Temperature Differential Study",
                    desc: "Investigate how T_H − T_C determines the maximum achievable efficiency.",
                    setup: "1. Fix T_C = 300K. 2. Vary T_H from 350K to 1000K in steps. 3. Record η at each point. 4. Plot η vs T_H/T_C.",
                    expected: "Efficiency increases monotonically with T_H. η approaches 1 only as T_H → ∞. Even at T_H = 1000K, η = 70%."
                  },
                  {
                    title: "Molecular Mass Effect",
                    desc: "Observe how molecular mass changes gas behavior at the microscopic level.",
                    setup: "1. Go to Config → Molecular Dynamics. 2. Set mass to He (4 amu), then Ar (40 amu), then Xe (131 amu). 3. Observe changes in pressure and velocity distributions.",
                    expected: "Lighter gases have higher RMS velocities (v_rms = √(3kT/m)) and higher pressures for same T. Macroscopic efficiency is unchanged — a fundamental Carnot result."
                  },
                ].map((exp, i) => (
                  <div key={i} className="bg-[#18181b] border border-white/5 rounded-xl p-5 space-y-3">
                    <div className="text-sm font-black text-white">{exp.title}</div>
                    <div className="text-xs text-white/50 leading-relaxed">{exp.desc}</div>
                    <div className="p-3 bg-black/30 rounded-lg border border-white/5 space-y-1">
                      <div className="text-[9px] font-black text-white/25 uppercase tracking-widest">Setup</div>
                      <div className="text-[10px] text-white/40 leading-relaxed font-mono">{exp.setup}</div>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Expected Result</div>
                      <div className="text-[10px] text-white/40 leading-relaxed">{exp.expected}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Section F: Advanced Experiments ── */}
          {activeSection === "advanced" && (
            <motion.div key="advanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Advanced <span className="text-purple-400">Experiments</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Guided research-grade thermodynamic investigations.</p>
              </div>
              <div className="space-y-3">
                <ExperimentCard
                  number="E1" title="Maximum Carnot Efficiency" difficulty="Easy" color="#10b981"
                  goal="Demonstrate that the Carnot efficiency depends only on the ratio T_C/T_H, not on the working substance, cycle speed, or particle count."
                  steps={[
                    "Set T_H = 600K, T_C = 200K. Note η = 66.7%.",
                    "Change molecular mass from 4 to 131 amu. Observe η is unchanged.",
                    "Change particle count from 50 to 500. Observe η is unchanged.",
                    "Increase/decrease playback speed. Observe η is unchanged.",
                    "Record: η depends only on the temperature ratio, confirming Carnot's theorem."
                  ]}
                />
                <ExperimentCard
                  number="E2" title="Entropy Generation Investigation" difficulty="Medium" color="#f59e0b"
                  goal="Quantify irreversible entropy production when real losses are introduced and verify the Clausius inequality."
                  steps={[
                    "Run the ideal cycle. Verify total entropy change per cycle = 0.",
                    "Enable 'Heat Leakage' and set thermal leakage = 5W.",
                    "Observe entropy increase over successive cycles.",
                    "Enable 'Mechanical Friction' = 0.3. Observe additional entropy generation.",
                    "Measure efficiency degradation and correlate with ΔS_total."
                  ]}
                />
                <ExperimentCard
                  number="E3" title="Heat Leakage Effect" difficulty="Medium" color="#ef4444"
                  goal="Quantify how parasitic heat loss reduces the effective temperature differential and decreases efficiency."
                  steps={[
                    "Run baseline with thermal leakage = 0. Record W_net and η.",
                    "Set leakage = 2W. Record new W_net and η.",
                    "Set leakage = 10W. Record new W_net and η.",
                    "Plot efficiency vs leakage rate.",
                    "Calculate at what leakage rate W_net approaches zero (engine becomes unviable)."
                  ]}
                />
                <ExperimentCard
                  number="E4" title="Real Gas (Van der Waals) Deviation" difficulty="Hard" color="#8b5cf6"
                  goal="Compare the PV diagram of an ideal gas vs a real Van der Waals gas and quantify work output difference."
                  steps={[
                    "Run with Non-Ideal Gas Effects disabled. Record PV loop area.",
                    "Enable Non-Ideal Gas. Set a=3.6 L²atm/mol², b=0.043 L/mol (CO₂).",
                    "Observe how the PV isotherms deviate from hyperbolas.",
                    "At low volumes, note the attractive forces reduce pressure below ideal.",
                    "Calculate percentage reduction in enclosed area (net work)."
                  ]}
                />
                <ExperimentCard
                  number="E5" title="Refrigeration Cycle" difficulty="Hard" color="#3b82f6"
                  goal="Observe the reverse Carnot cycle behavior and measure the Coefficient of Performance."
                  steps={[
                    "Conceptually: reverse the cycle direction (compression before expansion from hot).",
                    "Set T_H = 300K (room), T_C = 260K (freezer).",
                    "Calculate theoretical COP_ref = T_C/(T_H-T_C) = 260/40 = 6.5.",
                    "Observe that a real refrigerator achieves COP < 6.5 due to irreversibilities.",
                    "Compare with the heat pump COP = T_H/(T_H-T_C) = 300/40 = 7.5."
                  ]}
                />
                <ExperimentCard
                  number="E6" title="Thermal Equilibrium Study" difficulty="Easy" color="#06b6d4"
                  goal="Observe what happens as T_H approaches T_C and verify that efficiency → 0."
                  steps={[
                    "Set T_H = 500K, T_C = 490K. Observe very low efficiency (~2%).",
                    "Reduce the temperature gap further to 5K.",
                    "Observe that W_net approaches zero and the PV loop shrinks.",
                    "At T_H = T_C, the engine produces no work (η = 0).",
                    "Confirm: work extraction requires a temperature differential."
                  ]}
                />
                <ExperimentCard
                  number="E7" title="MD vs Statistical Solver Comparison" difficulty="Hard" color="#f97316"
                  goal="Compare results from the Molecular Dynamics and Monte Carlo solvers for the same thermodynamic state."
                  steps={[
                    "Switch to Molecular Dynamics solver. Record average P, V, T over 10 cycles.",
                    "Switch to Monte Carlo solver with the same parameters.",
                    "Compare thermodynamic state variables and efficiency.",
                    "Note computational load differences in the Config panel.",
                    "Identify which solver produces more accurate kinetic energy distributions."
                  ]}
                />
              </div>
            </motion.div>
          )}

          {/* ── Section G: Interactive Help ── */}
          {activeSection === "help" && (
            <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                  Interactive <span className="text-red-400">Help</span>
                </h2>
                <p className="text-white/40 text-sm mt-2">Contextual answers to common questions and diagnostics.</p>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-black text-white/25 uppercase tracking-widest px-1 mb-3">Frequently Asked Questions</div>
                <FAQ
                  q="Why isn't the efficiency 100% even at very high T_H?"
                  a="The Carnot efficiency η = 1 − T_C/T_H approaches 100% only as T_H → ∞ (impossible) or T_C → 0 (absolute zero, also unattainable). The Second Law fundamentally prevents 100% conversion of heat to work — some energy must always be rejected to the cold reservoir."
                />
                <FAQ
                  q="Why does the piston speed affect work but not efficiency?"
                  a="For an ideal Carnot engine, the cycle is quasi-static, meaning each stage happens infinitely slowly to maintain equilibrium. In the simulation, faster cycles reduce time for heat exchange but the thermodynamic state variables (and therefore efficiency) depend only on temperatures, not cycle rate. In real engines, higher RPM does reduce efficiency."
                />
                <FAQ
                  q="What does the enclosed area of the P-V diagram represent?"
                  a="The enclosed area = net work W_net extracted per cycle, in joules. This is because W = ∮P dV. The isothermal curves are hyperbolas (PV = const), and the adiabatic curves are steeper hyperbolas (PV^γ = const). The difference in their areas gives the net work."
                />
                <FAQ
                  q="Why do the adiabatic strokes appear steeper than the isothermal strokes on the PV diagram?"
                  a="During an adiabatic process, PV^γ = const where γ > 1 (for monatomic ideal gas γ = 5/3). During an isothermal process, PV = const (or PV^1 = const). Since γ > 1, the adiabatic slope dP/dV = −γP/V is steeper in magnitude than the isothermal slope dP/dV = −P/V."
                />
                <FAQ
                  q="What happens to entropy during each stage?"
                  a="Stage 1 (Isothermal Exp): ΔS = +Q_H/T_H > 0 (entropy increases). Stage 2 (Adiabatic Exp): ΔS = 0. Stage 3 (Isothermal Comp): ΔS = −Q_C/T_C < 0 (entropy decreases). Stage 4 (Adiabatic Comp): ΔS = 0. Net: ΔS_total = 0 for ideal Carnot. The Second Law is satisfied with equality."
                />
                <FAQ
                  q="Why does changing molecular mass not affect efficiency?"
                  a="The Carnot efficiency η = 1 − T_C/T_H is a purely thermodynamic result — it depends only on the reservoir temperatures. Molecular mass affects microscopic details like particle velocities and collision frequencies, but these cancel out in the macroscopic work and heat integrals. This universality is the profound content of Carnot's theorem."
                />
                <FAQ
                  q="How do I interpret the thermostat methods?"
                  a="Velocity Scaling: crudely rescales all particle velocities every timestep. Andersen: randomly reassigns individual particle velocities from the Maxwell-Boltzmann distribution. Berendsen: uses weak coupling to rescale velocities. Nose-Hoover: adds a fictitious heat-bath variable to the Lagrangian, rigorously producing the canonical ensemble. For research accuracy, prefer Nose-Hoover."
                />
              </div>

              <div className="p-5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <div className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">Quick Reference Card</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  {[
                    ["η_max", "1 − T_C/T_H"],
                    ["W_net", "nR(T_H−T_C)ln(V₂/V₁)"],
                    ["Q_H", "nRT_H·ln(V₂/V₁)"],
                    ["Q_C", "nRT_C·ln(V₃/V₄)"],
                    ["COP_ref", "T_C/(T_H−T_C)"],
                    ["COP_hp", "T_H/(T_H−T_C)"],
                    ["v_rms", "√(3k_B T/m)"],
                    ["⟨KE⟩", "(3/2)k_B T"],
                  ].map(([sym, eq]) => (
                    <div key={sym} className="flex items-center gap-2 p-2 bg-black/30 rounded-lg">
                      <span className="text-cyan-400 font-black shrink-0 w-14">{sym}</span>
                      <span className="text-white/40">{eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

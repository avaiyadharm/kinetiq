"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCarnotStore } from "@/store/carnotStore";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, Atom, ChevronDown } from "lucide-react";

// ─── Math Rendering Components ────────────────────────────────────────────────
const Sub = ({ children }: { children: React.ReactNode }) => (
  <sub className="text-[0.7em] relative bottom-[-0.3em] font-serif">{children}</sub>
);
const Sup = ({ children }: { children: React.ReactNode }) => (
  <sup className="text-[0.7em] relative top-[-0.3em] font-serif">{children}</sup>
);
const Var = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-serif italic mx-0.5 text-slate-200 tracking-wide ${className || ""}`}>{children}</span>
);
const MathFrac = ({ num, den }: { num: React.ReactNode; den: React.ReactNode }) => (
  <span className="inline-flex flex-col items-center justify-center align-middle mx-1.5 font-serif text-[0.9em]">
    <span className="border-b border-white/50 pb-[3px] mb-[3px] px-1">{num}</span>
    <span className="pt-[1px] px-1">{den}</span>
  </span>
);
const MathBlock = ({ children, label, color = "#06b6d4" }: { children: React.ReactNode; label?: string; color?: string }) => (
  <div className="my-5 relative group">
    {label && (
      <div className="absolute -top-3 left-6 px-3 text-[9px] uppercase tracking-[0.2em] font-black z-10 rounded"
        style={{ background: "#18181b", color }}>
        {label}
      </div>
    )}
    <div className="bg-black/40 border border-white/8 rounded-2xl py-6 px-6 flex items-center justify-center overflow-x-auto shadow-inner"
      style={{ borderColor: `${color}15` }}>
      <div className="font-serif text-lg tracking-wider text-white whitespace-nowrap flex items-center gap-1">
        {children}
      </div>
    </div>
  </div>
);

// ─── Section Wrapper ─────────────────────────────────────────────────────────
const TheorySection: React.FC<{
  number: string;
  title: string;
  color: string;
  tag: string;
  children: React.ReactNode;
}> = ({ number, title, color, tag, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.5 }}
    className="p-8 rounded-2xl bg-[#18181b] border border-white/5 space-y-6 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 text-[120px] font-black opacity-[0.03] leading-none pointer-events-none select-none"
      style={{ color }}>{number}</div>
    <div className="flex items-start gap-4">
      <div className="text-3xl font-black font-mono" style={{ color }}>{number}</div>
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color }}>{tag}</div>
        <h3 className="text-xl font-black uppercase tracking-tight text-white">{title}</h3>
      </div>
    </div>
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const P = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-white/60 text-sm leading-relaxed", className)}>{children}</p>
);

const StageCard: React.FC<{
  number: string;
  title: string;
  color: string;
  description: string;
  formulae: React.ReactNode[];
  micro: string[];
}> = ({ number, title, color, description, formulae, micro }) => (
  <div className="p-5 rounded-xl bg-black/30 border space-y-4" style={{ borderColor: `${color}20` }}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
        style={{ background: `${color}15`, color }}>{number}</div>
      <div className="text-sm font-black uppercase tracking-wider" style={{ color }}>{title}</div>
    </div>
    <P>{description}</P>
    <div className="space-y-2">
      {formulae.map((f, i) => (
        <div key={i} className="bg-black/40 border border-white/5 rounded-lg py-3 px-4 font-serif text-sm text-white flex items-center justify-center">
          {f}
        </div>
      ))}
    </div>
    <div className="space-y-1.5 pt-2 border-t border-white/5">
      <div className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-2">Microscopic Interpretation</div>
      {micro.map((m, i) => (
        <div key={i} className="flex items-center gap-2 text-[10px] text-white/40">
          <div className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
          {m}
        </div>
      ))}
    </div>
  </div>
);

// ─── Live Efficiency Calculator ───────────────────────────────────────────────
const LiveEfficiencyCalc: React.FC = () => {
  const { TH, TC } = useCarnotStore();
  const eff = 1 - TC / TH;
  return (
    <div className="p-5 rounded-xl bg-black/40 border border-cyan-500/15 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Live Calculator — Connected to Simulation</div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-[9px] text-white/30 uppercase font-bold mb-1">T_H</div>
          <div className="text-2xl font-mono font-black text-red-400">{TH} K</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-white/30 uppercase font-bold mb-1">T_C</div>
          <div className="text-2xl font-mono font-black text-blue-400">{TC} K</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-white/30 uppercase font-bold mb-1">η_max</div>
          <div className="text-2xl font-mono font-black text-cyan-400">{(eff * 100).toFixed(2)}%</div>
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${eff * 100}%` }} />
      </div>
      <div className="text-[10px] text-white/30 font-mono text-center">
        η = 1 − ({TC} / {TH}) = {eff.toFixed(4)}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
type Level = "beginner" | "intermediate" | "expert";

export const CarnotTheory: React.FC = () => {
  const [level, setLevel] = useState<Level>("intermediate");

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] custom-scrollbar">
      <div className="relative max-w-4xl mx-auto p-8 space-y-8">

        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Theoretical <span className="text-cyan-400">Basis</span>
            </h2>
            <span className="text-[10px] border border-cyan-500/20 text-cyan-400 bg-cyan-500/5 px-2 py-1 rounded font-black uppercase tracking-widest">
              Interactive Curriculum
            </span>
          </div>
          <P>Thermodynamics, statistical mechanics, and Carnot cycle theory — from introductory concepts to advanced formalism.</P>

          {/* Difficulty Level Selector */}
          <div className="flex bg-black/30 border border-white/5 p-1 rounded-xl w-fit">
            {([
              { id: "beginner" as Level, label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { id: "intermediate" as Level, label: "Intermediate", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
              { id: "expert" as Level, label: "Expert", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
            ]).map(l => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={cn(
                  "px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border",
                  level === l.id ? `${l.bg} ${l.color}` : "text-white/30 border-transparent hover:text-white/50"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Section 1: Introduction to Heat Engines ── */}
        <TheorySection number="01" title="Introduction to Heat Engines" color="#f59e0b" tag="Foundation">
          {level === "beginner" && (
            <>
              <P>
                A <span className="text-white font-bold">heat engine</span> is any device that converts thermal energy (heat) into mechanical energy (work). 
                Think of it like a machine that extracts energy from a hot source, uses some of it to do useful work (like turning a turbine), 
                and dumps the leftover heat into a cold reservoir (like the atmosphere).
              </P>
              <div className="grid grid-cols-3 gap-3 my-4">
                {[
                  { label: "Hot Source", desc: "Provides energy Q_H", color: "#ef4444", emoji: "🔥" },
                  { label: "Engine", desc: "Converts heat → work", color: "#10b981", emoji: "⚙️" },
                  { label: "Cold Sink", desc: "Absorbs waste Q_C", color: "#3b82f6", emoji: "❄️" },
                ].map(c => (
                  <div key={c.label} className="p-4 rounded-xl text-center border" style={{ borderColor: `${c.color}20`, background: `${c.color}08` }}>
                    <div className="text-2xl mb-1">{c.emoji}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.color }}>{c.label}</div>
                    <div className="text-[9px] text-white/40 mt-1">{c.desc}</div>
                  </div>
                ))}
              </div>
              <P>Every heat engine operates in a <span className="text-white font-bold">cycle</span> — the working substance (usually a gas) is returned to its original state after each round, allowing the machine to run continuously.</P>
            </>
          )}
          {level !== "beginner" && (
            <>
              <P>A heat engine operates between two thermal reservoirs at temperatures T<sub>H</sub> (hot) and T<sub>C</sub> (cold), absorbing heat Q<sub>H</sub>, producing net work W, and rejecting heat Q<sub>C</sub>. By the First Law:</P>
              <MathBlock label="Energy Conservation" color="#f59e0b">
                <Var>W</Var> = <Var>Q</Var><Sub>H</Sub> − <Var>Q</Var><Sub>C</Sub>
              </MathBlock>
              {level === "expert" && (
                <>
                  <P>The cyclic nature requires ∮dU = 0, so the net work equals the net heat transfer. Thermodynamic cycles are most elegantly described on state-space diagrams where the enclosed area directly represents work.</P>
                  <MathBlock label="Clausius Theorem" color="#f59e0b">
                    ∮ <MathFrac num="δQ" den={<><Var>T</Var></>} /> ≤ 0
                  </MathBlock>
                  <P className="text-xs">Equality holds for reversible cycles. Any irreversibility strictly increases entropy, producing less work than the theoretical maximum.</P>
                </>
              )}
            </>
          )}
        </TheorySection>

        {/* ── Section 2: Carnot Cycle ── */}
        <TheorySection number="02" title="The Carnot Cycle" color="#ef4444" tag="Core Theory">
          <P>The Carnot cycle consists of exactly four reversible processes, forming the most efficient possible heat engine cycle between two temperature reservoirs.</P>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <StageCard
              number="1"
              title="Isothermal Expansion"
              color="#ef4444"
              description="Gas expands in contact with the hot reservoir at constant temperature T_H. Heat Q_H is absorbed and converted to work."
              formulae={[
                <><Var>Q</Var><Sub>H</Sub> = <Var>nRT</Var><Sub>H</Sub> ln(<MathFrac num={<><Var>V</Var><Sub>2</Sub></>} den={<><Var>V</Var><Sub>1</Sub></>} />)</>,
                <><Var>PV</Var> = const</>
              ]}
              micro={[
                "Heat flows into gas from hot reservoir",
                "Kinetic energy of molecules stays constant",
                "Molecules perform work as piston expands",
                "Entropy increases: ΔS = Q_H / T_H"
              ]}
            />
            <StageCard
              number="2"
              title="Adiabatic Expansion"
              color="#f97316"
              description="Gas expands with no heat exchange. Temperature drops from T_H to T_C as internal energy converts to work."
              formulae={[
                <><Var>PV</Var><Sup>γ</Sup> = const</>,
                <><Var>TV</Var><Sup>γ−1</Sup> = const</>
              ]}
              micro={[
                "No heat exchange — perfectly insulated",
                "Molecules lose kinetic energy doing work",
                "Temperature drops from T_H to T_C",
                "Entropy is conserved (ΔS = 0)"
              ]}
            />
            <StageCard
              number="3"
              title="Isothermal Compression"
              color="#3b82f6"
              description="Gas is compressed in contact with the cold reservoir at constant temperature T_C. Heat Q_C is rejected."
              formulae={[
                <><Var>Q</Var><Sub>C</Sub> = <Var>nRT</Var><Sub>C</Sub> ln(<MathFrac num={<><Var>V</Var><Sub>3</Sub></>} den={<><Var>V</Var><Sub>4</Sub></>} />)</>
              ]}
              micro={[
                "Work done on gas by piston compression",
                "Excess kinetic energy flows to cold reservoir",
                "Temperature held constant by cold contact",
                "Entropy decreases: ΔS = −Q_C / T_C"
              ]}
            />
            <StageCard
              number="4"
              title="Adiabatic Compression"
              color="#8b5cf6"
              description="Gas is compressed with no heat exchange. Temperature rises from T_C back to T_H, returning the system to its initial state."
              formulae={[
                <><Var>PV</Var><Sup>γ</Sup> = const</>,
                <><Var>W</Var> = <MathFrac num={<><Var>P</Var><Sub>1</Sub><Var>V</Var><Sub>1</Sub> − <Var>P</Var><Sub>2</Sub><Var>V</Var><Sub>2</Sub></>} den={<>γ − 1</>} /></>
              ]}
              micro={[
                "No heat exchange during rapid compression",
                "Work input increases molecular kinetic energy",
                "Temperature rises from T_C to T_H",
                "Entropy conserved (reversible process)"
              ]}
            />
          </div>
        </TheorySection>

        {/* ── Section 3: Carnot Efficiency ── */}
        <TheorySection number="03" title="Carnot Efficiency" color="#06b6d4" tag="Key Result">
          <P>The Carnot efficiency is the maximum possible thermal efficiency for any heat engine operating between two reservoirs. No real engine can exceed it.</P>
          <MathBlock label="Maximum Thermal Efficiency" color="#06b6d4">
            <Var>η</Var> = 1 −
            <MathFrac num={<><Var>T</Var><Sub>C</Sub></>} den={<><Var>T</Var><Sub>H</Sub></>} /> =
            <MathFrac num={<><Var>W</Var><Sub>net</Sub></>} den={<><Var>Q</Var><Sub>H</Sub></>} />
          </MathBlock>
          {level !== "beginner" && (
            <P>This result follows from combining the First and Second Laws. Since the cycle is reversible, total entropy change is zero: ΔS<sub>H</sub> + ΔS<sub>C</sub> = −Q<sub>H</sub>/T<sub>H</sub> + Q<sub>C</sub>/T<sub>C</sub> = 0, giving Q<sub>C</sub>/Q<sub>H</sub> = T<sub>C</sub>/T<sub>H</sub>.</P>
          )}
          <LiveEfficiencyCalc />
        </TheorySection>

        {/* ── Section 4: Entropy ── */}
        <TheorySection number="04" title="Entropy & The Second Law" color="#8b5cf6" tag="Statistical Foundation">
          <P>Entropy is a measure of the <span className="text-white font-bold">disorder</span> or the number of accessible microstates of a system. In thermodynamics, it tracks the irreversibility of processes.</P>
          <MathBlock label="Thermodynamic Entropy" color="#8b5cf6">
            Δ<Var>S</Var> = <MathFrac num="δQ" den={<><Var>T</Var></>} />
          </MathBlock>
          {level === "expert" && (
            <>
              <P>For a reversible process, entropy change is exactly δQ/T. For irreversible processes, total entropy strictly increases:</P>
              <MathBlock label="Second Law (Differential Form)" color="#8b5cf6">
                d<Var>S</Var> ≥ <MathFrac num="δQ" den={<><Var>T</Var></>} />
              </MathBlock>
              <P className="text-xs">The Boltzmann entropy S = k<sub>B</sub> ln(Ω) connects this macroscopic quantity to Ω, the number of microstates. During isothermal expansion, Ω increases as gas occupies more volume, raising entropy.</P>
            </>
          )}
          {level === "beginner" && (
            <P>Think of entropy as "spreadness." When gas expands, molecules spread out into more positions — entropy increases. When compressed, they're squeezed together — entropy decreases. The total entropy of the universe only ever stays the same or increases — this is the <span className="text-white font-bold">Second Law</span>.</P>
          )}
        </TheorySection>

        {/* ── Section 5: Statistical Mechanics ── */}
        <TheorySection number="05" title="Statistical Mechanics Connection" color="#10b981" tag="Microscopic Theory">
          <P>Temperature, pressure, and entropy are not fundamental — they emerge from the collective behavior of billions of molecules.</P>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {[
              {
                label: "Mean Kinetic Energy",
                formula: <><span>{"⟨"}</span><Var>KE</Var><span>{"⟩"}</span> = <MathFrac num="3" den="2" /><Var>k</Var><Sub>B</Sub><Var>T</Var></>,
                desc: "Average kinetic energy per molecule is proportional to absolute temperature."
              },
              {
                label: "RMS Velocity",
                formula: <><Var>v</Var><Sub>rms</Sub> = √(<MathFrac num={<>3<Var>k</Var><Sub>B</Sub><Var>T</Var></>} den={<><Var>m</Var></>} />)</>,
                desc: "Root mean square speed of molecules in an ideal gas."
              },
              {
                label: "Ideal Gas Law",
                formula: <><Var>PV</Var> = <Var>Nk</Var><Sub>B</Sub><Var>T</Var></>,
                desc: "Macroscopic law derived from microscopic momentum transfer at walls."
              }
            ].map(item => (
              <div key={item.label} className="p-4 rounded-xl bg-black/30 border border-emerald-500/10 space-y-3">
                <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{item.label}</div>
                <div className="font-serif text-sm text-white text-center py-2">{item.formula}</div>
                <div className="text-[9px] text-white/35 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
          {level === "expert" && (
            <P>The Maxwell-Boltzmann speed distribution f(v) = 4π(m/2πk<sub>B</sub>T)<sup>3/2</sup> v² exp(−mv²/2k<sub>B</sub>T) gives the probability of a molecule having speed v. As T<sub>H</sub> increases, the distribution broadens and shifts to higher speeds, increasing pressure on the piston.</P>
          )}
        </TheorySection>

        {/* ── Section 6: Real vs Ideal ── */}
        <TheorySection number="06" title="Real vs Ideal Engines" color="#f97316" tag="Practical Analysis">
          <P>The Carnot engine is an idealization. All real engines suffer irreversible losses that reduce efficiency below the Carnot limit.</P>
          <div className="overflow-hidden rounded-xl border border-white/5 mt-4">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-3 text-white/50 font-black uppercase tracking-wider">Property</th>
                  <th className="text-center p-3 text-cyan-400 font-black uppercase tracking-wider">Carnot (Ideal)</th>
                  <th className="text-center p-3 text-orange-400 font-black uppercase tracking-wider">Real Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["Process Type", "Fully Reversible", "Irreversible"],
                  ["Entropy Production", "Zero", "Positive"],
                  ["Heat Leakage", "None", "Parasitic Losses"],
                  ["Friction", "Zero", "Mechanical Losses"],
                  ["Efficiency", "η = 1 − Tc/TH", "η < 1 − Tc/TH"],
                  ["Cycle Speed", "Quasi-static (→ 0)", "Finite Rate"],
                ].map(([prop, ideal, real]) => (
                  <tr key={prop as string} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-white/50 font-medium">{prop}</td>
                    <td className="p-3 text-center text-cyan-400">{ideal}</td>
                    <td className="p-3 text-center text-orange-400">{real}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TheorySection>

        {/* ── Section 7: T-S Diagram ── */}
        <TheorySection number="07" title="T-S Diagram Analysis" color="#f59e0b" tag="State Space">
          <P>The Temperature-Entropy (T-S) diagram provides a powerful view of the Carnot cycle. The <span className="text-white font-bold">area enclosed</span> by the rectangle equals the net work output.</P>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Isothermal Expansion", color: "#ef4444", desc: "Horizontal line at T_H. Entropy increases as Q_H enters." },
              { label: "Adiabatic Expansion", color: "#f97316", desc: "Vertical line at S_max. No entropy change; temperature drops." },
              { label: "Isothermal Compression", color: "#3b82f6", desc: "Horizontal line at T_C. Entropy decreases as Q_C exits." },
              { label: "Adiabatic Compression", color: "#8b5cf6", desc: "Vertical line at S_min. No entropy change; temperature rises." },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl bg-black/30 border" style={{ borderColor: `${s.color}20` }}>
                <div className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color: s.color }}>{s.label}</div>
                <div className="text-[10px] text-white/40 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
          <MathBlock label="Net Work from T-S Diagram" color="#f59e0b">
            <Var>W</Var><Sub>net</Sub> = (<Var>T</Var><Sub>H</Sub> − <Var>T</Var><Sub>C</Sub>) × (<Var>S</Var><Sub>max</Sub> − <Var>S</Var><Sub>min</Sub>)
          </MathBlock>
        </TheorySection>

        {/* ── Section 8: P-V Diagram ── */}
        <TheorySection number="08" title="P-V Diagram Analysis" color="#10b981" tag="State Space">
          <P>The Pressure-Volume diagram shows the work done as the area enclosed by the cycle path. Clockwise = positive net work (heat engine). Counter-clockwise = work input (refrigerator).</P>
          <div className="grid grid-cols-2 gap-3">
            {[
              { stage: "1→2", label: "Isothermal Exp.", formula: "PV = nRT_H (hyperbola)", color: "#ef4444" },
              { stage: "2→3", label: "Adiabatic Exp.", formula: "PV^γ = const (steeper)", color: "#f97316" },
              { stage: "3→4", label: "Isothermal Comp.", formula: "PV = nRT_C (hyperbola)", color: "#3b82f6" },
              { stage: "4→1", label: "Adiabatic Comp.", formula: "PV^γ = const (steeper)", color: "#8b5cf6" },
            ].map(s => (
              <div key={s.stage} className="p-3 rounded-lg bg-black/30 border" style={{ borderColor: `${s.color}15` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono font-black" style={{ color: s.color }}>{s.stage}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/40">{s.label}</span>
                </div>
                <div className="text-[9px] font-mono text-white/25">{s.formula}</div>
              </div>
            ))}
          </div>
        </TheorySection>

        {/* ── Section 9: Refrigerator Mode ── */}
        <TheorySection number="09" title="Refrigerator & Heat Pump Mode" color="#3b82f6" tag="Reverse Cycle">
          <P>Running the Carnot cycle in reverse requires work input W and moves heat from cold to hot — the principle behind refrigeration and heat pumps.</P>
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-5 rounded-xl bg-black/30 border border-blue-500/15 space-y-3">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Refrigerator COP</div>
              <MathBlock label="" color="#3b82f6">
                <Var>COP</Var><Sub>ref</Sub> = <MathFrac num={<><Var>T</Var><Sub>C</Sub></>} den={<><Var>T</Var><Sub>H</Sub> − <Var>T</Var><Sub>C</Sub></>} />
              </MathBlock>
              <P>Heat removed from cold reservoir per unit of work input.</P>
            </div>
            <div className="p-5 rounded-xl bg-black/30 border border-red-500/15 space-y-3">
              <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">Heat Pump COP</div>
              <MathBlock label="" color="#ef4444">
                <Var>COP</Var><Sub>hp</Sub> = <MathFrac num={<><Var>T</Var><Sub>H</Sub></>} den={<><Var>T</Var><Sub>H</Sub> − <Var>T</Var><Sub>C</Sub></>} />
              </MathBlock>
              <P>Heat delivered to hot reservoir per unit of work input.</P>
            </div>
          </div>
          <P>Note that COP<sub>hp</sub> = COP<sub>ref</sub> + 1, and both are always greater than 1 for the ideal reverse-Carnot cycle. Real heat pumps are limited by irreversibilities.</P>
        </TheorySection>

        {/* ── Section 10: Advanced Theory ── */}
        <TheorySection number="10" title="Advanced Thermodynamic Theory" color="#a855f7" tag="Expert Level">
          <div className="space-y-4">
            {level !== "expert" && (
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 text-center">
                <div className="text-[10px] text-violet-400 font-black uppercase tracking-widest mb-2">Switch to Expert Mode</div>
                <div className="text-xs text-white/40">Full derivations, partition functions, and advanced entropy formalism are shown in Expert mode.</div>
                <button onClick={() => setLevel("expert")} className="mt-3 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-violet-500/15 transition-colors">
                  Unlock Expert Content
                </button>
              </div>
            )}
            {level === "expert" && (
              <>
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Clausius Inequality</div>
                  <MathBlock label="Integral Form" color="#a855f7">
                    ∮ <MathFrac num="δQ" den={<><Var>T</Var></>} /> ≤ 0
                  </MathBlock>
                  <P>The Clausius inequality is the most general statement of the Second Law. For a reversible cycle the integral is exactly zero; for any irreversible cycle it is strictly negative.</P>
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Helmholtz Free Energy</div>
                  <MathBlock label="Free Energy" color="#a855f7">
                    <Var>F</Var> = <Var>U</Var> − <Var>TS</Var>
                  </MathBlock>
                  <P>The Helmholtz free energy F is minimized at constant T, V equilibrium. Maximum work extractable from an isothermal process is −ΔF.</P>
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Partition Function</div>
                  <MathBlock label="Canonical Ensemble" color="#a855f7">
                    <Var>Z</Var> = Σ exp(−β<Var>E</Var><Sub>i</Sub>),   β = <MathFrac num="1" den={<><Var>k</Var><Sub>B</Sub><Var>T</Var></>} />
                  </MathBlock>
                  <P>The partition function Z encodes all thermodynamic information. Free energy F = −k<sub>B</sub>T ln(Z), entropy S = k<sub>B</sub>(ln Z + βU), and average energy ⟨E⟩ = −∂ln Z / ∂β.</P>
                </div>
              </>
            )}
          </div>
        </TheorySection>

      </div>
    </div>
  );
};

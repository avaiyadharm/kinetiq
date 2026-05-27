"use client";

import React from "react";

// Scientific Typography Components
const Sub = ({ children }: { children: React.ReactNode }) => <sub className="text-[0.7em] relative bottom-[-0.3em] font-serif">{children}</sub>;
const Sup = ({ children }: { children: React.ReactNode }) => <sup className="text-[0.7em] relative top-[-0.3em] font-serif">{children}</sup>;
const Var = ({ children, className }: { children: React.ReactNode, className?: string }) => <span className={`font-serif italic mx-0.5 text-slate-200 tracking-wide ${className || ""}`}>{children}</span>;

const MathEq = ({ children, block = false, label }: { children: React.ReactNode, block?: boolean, label?: string }) => {
  if (!block) {
    return <span className="font-serif italic mx-0.5 text-slate-200 tracking-wide">{children}</span>;
  }
  return (
    <div className="my-6 relative group w-full">
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-violet-400 font-black z-10 shadow-sm">{label}</div>}
      <div className="bg-black/40 border border-white/10 rounded-2xl py-6 px-6 flex items-center justify-center overflow-x-auto shadow-inner relative">
        <div className="font-serif text-lg tracking-wider text-white whitespace-nowrap flex items-center gap-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const MathFrac = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
  <span className="inline-flex flex-col items-center justify-center align-middle mx-2 font-serif text-[0.9em] translate-y-[-0.1em]">
    <span className="border-b border-white/60 pb-[3px] mb-[3px] px-1">{num}</span>
    <span className="pt-[1px] px-1">{den}</span>
  </span>
);

export const SHMTheory: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Section 1 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-violet-400">Defining SHM</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Simple Harmonic Motion is a periodic oscillation where the restoring force is{" "}
          <span className="text-white font-bold">directly proportional</span> to the displacement from
          equilibrium and directed opposite to it:
        </p>
        <MathEq block label="Hooke's Law">
          <span className="text-pink-400">F</span> = <span className="text-rose-400">−k</span><span className="text-violet-400">x</span>
        </MathEq>
        <p className="text-white/40 text-xs">
          where <Var className="text-rose-400 font-bold">k</Var> is the spring constant (N/m) and{" "}
          <Var className="text-violet-400 font-bold">x</Var> is displacement (m).
        </p>
      </div>

      {/* Section 2 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-cyan-400">Equations of Motion</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Newton&apos;s Second Law gives the differential equation of SHM:
        </p>
        <MathEq block label="Differential Equation">
          <Var>m</Var> <MathFrac num={<>d<Sup>2</Sup>x</>} den={<>dt<Sup>2</Sup></>} /> + <Var>k x</Var> = 0 &nbsp;→&nbsp; <MathFrac num={<>d<Sup>2</Sup>x</>} den={<>dt<Sup>2</Sup></>} /> + ω<Sup>2</Sup><Var>x</Var> = 0
        </MathEq>
        <p className="text-white/60 text-sm leading-relaxed">
          The general solution (with initial conditions) is:
        </p>
        <div className="space-y-2">
          {[
            { label: <><Var>x</Var>(<Var>t</Var>) = <Var>A</Var> cos(<Var>ωt</Var> + <Var>φ</Var>)</>, color: "text-violet-400", desc: "Displacement" },
            { label: <><Var>v</Var>(<Var>t</Var>) = −<Var>A ω</Var> sin(<Var>ωt</Var> + <Var>φ</Var>)</>, color: "text-cyan-400", desc: "Velocity" },
            { label: <><Var>a</Var>(<Var>t</Var>) = −<Var>A ω</Var><Sup>2</Sup> cos(<Var>ωt</Var> + <Var>φ</Var>)</>, color: "text-amber-400", desc: "Acceleration" },
          ].map((eq, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
              <span className={`font-serif text-sm font-bold ${eq.color}`}>{eq.label}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">{eq.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-amber-400">Angular Frequency & Period</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { formula: <><Var>ω</Var> = &radic;(<MathFrac num={<Var>k</Var>} den={<Var>m</Var>} />)</>, label: "Spring", color: "text-amber-400" },
            { formula: <><Var>ω</Var> = &radic;(<MathFrac num={<Var>g</Var>} den={<Var>L</Var>} />)</>, label: "Pendulum", color: "text-orange-400" },
            { formula: <><Var>T</Var> = <MathFrac num="2π" den={<Var>ω</Var>} /></>, label: "Period", color: "text-violet-400" },
            { formula: <><Var>f</Var> = <MathFrac num="1" den={<Var>T</Var>} /> = <MathFrac num={<Var>ω</Var>} den="2π" /></>, label: "Frequency", color: "text-cyan-400" },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-center items-center text-center space-y-1">
              <span className={`font-serif text-base font-black ${item.color}`}>{item.formula}</span>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400">Energy in SHM</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Total mechanical energy is <span className="text-white font-bold">conserved</span>. As the
          oscillator moves, kinetic and potential energy continuously interchange:
        </p>
        <div className="space-y-2">
          {[
            { eq: <><Var>KE</Var> = <MathFrac num="1" den="2" /><Var>m v</Var><Sup>2</Sup> = <MathFrac num="1" den="2" /><Var>m A</Var><Sup>2</Sup><Var>ω</Var><Sup>2</Sup> sin<Sup>2</Sup>(<Var>ω t</Var> + <Var>φ</Var>)</>, color: "text-emerald-400", label: "Kinetic" },
            { eq: <><Var>PE</Var> = <MathFrac num="1" den="2" /><Var>k x</Var><Sup>2</Sup> = <MathFrac num="1" den="2" /><Var>m A</Var><Sup>2</Sup><Var>ω</Var><Sup>2</Sup> cos<Sup>2</Sup>(<Var>ω t</Var> + <Var>φ</Var>)</>, color: "text-orange-400", label: "Potential" },
            { eq: <><Var>E</Var><Sub>total</Sub> = <MathFrac num="1" den="2" /><Var>m A</Var><Sup>2</Sup><Var>ω</Var><Sup>2</Sup> = <MathFrac num="1" den="2" /><Var>k A</Var><Sup>2</Sup> (constant)</>, color: "text-violet-400", label: "Total" },
          ].map((e, i) => (
            <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <span className={`font-serif text-sm font-bold ${e.color}`}>{e.eq}</span>
              <span className="text-[10px] text-white/20 uppercase tracking-widest shrink-0">{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-pink-400">Phase Relationships</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { qty: "Velocity", phase: <>Leads <Var>x</Var> by <MathFrac num="π" den="2" /> (90°)</>, color: "text-cyan-400" },
            { qty: "Acceleration", phase: <>Leads <Var>v</Var> by <MathFrac num="π" den="2" /> (180° from <Var>x</Var>)</>, color: "text-amber-400" },
            { qty: "Force", phase: "In phase with acceleration", color: "text-pink-400" },
            { qty: "PE → KE", phase: "Transfer at max at equilibrium", color: "text-emerald-400" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-white/5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}>{item.qty}</span>
              <span className="text-[10px] font-medium text-white/40 italic flex items-center">{item.phase}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


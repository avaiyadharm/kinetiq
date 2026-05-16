"use client";

import React from "react";

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
        <div className="font-mono text-center text-xl font-bold text-white bg-black/30 rounded-xl py-4 border border-white/5">
          <span className="text-pink-400">F</span>
          <span className="text-white/60"> = </span>
          <span className="text-rose-400">−k</span>
          <span className="text-violet-400">x</span>
        </div>
        <p className="text-white/40 text-xs">
          where <span className="text-rose-400 font-bold font-mono">k</span> is the spring constant (N/m) and{" "}
          <span className="text-violet-400 font-bold font-mono">x</span> is displacement (m).
        </p>
      </div>

      {/* Section 2 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-cyan-400">Equations of Motion</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Newton&apos;s Second Law gives the differential equation of SHM:
        </p>
        <div className="font-mono text-center text-base font-bold text-white bg-black/30 rounded-xl py-3 border border-white/5">
          mẍ + kx = 0 &nbsp;→&nbsp; ẍ + ω²x = 0
        </div>
        <p className="text-white/60 text-sm leading-relaxed">
          The general solution (with initial conditions) is:
        </p>
        <div className="space-y-2">
          {[
            { label: "x(t) = A·cos(ωt + φ)", color: "#8b5cf6", desc: "Displacement" },
            { label: "v(t) = −Aω·sin(ωt + φ)", color: "#06b6d4", desc: "Velocity" },
            { label: "a(t) = −Aω²·cos(ωt + φ)", color: "#f59e0b", desc: "Acceleration" },
          ].map(eq => (
            <div key={eq.label} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
              <code className="font-mono text-sm font-bold" style={{ color: eq.color }}>{eq.label}</code>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">{eq.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-amber-400">Angular Frequency & Period</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { formula: "ω = √(k/m)", label: "Spring", color: "#f59e0b" },
            { formula: "ω = √(g/L)", label: "Pendulum", color: "#f97316" },
            { formula: "T = 2π/ω", label: "Period", color: "#8b5cf6" },
            { formula: "f = 1/T = ω/2π", label: "Frequency", color: "#06b6d4" },
          ].map(item => (
            <div key={item.formula} className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1">
              <code className="font-mono text-base font-black" style={{ color: item.color }}>{item.formula}</code>
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
            { eq: "KE = ½mv² = ½mA²ω²sin²(ωt + φ)", color: "#10b981", label: "Kinetic" },
            { eq: "PE = ½kx² = ½mA²ω²cos²(ωt + φ)", color: "#f97316", label: "Potential" },
            { eq: "E_total = ½mA²ω² = ½kA² (constant)", color: "#a78bfa", label: "Total" },
          ].map(e => (
            <div key={e.label} className="p-3 rounded-xl bg-black/20 border border-white/5 flex justify-between items-center">
              <code className="font-mono text-xs font-bold" style={{ color: e.color }}>{e.eq}</code>
              <span className="text-[10px] text-white/20 uppercase tracking-widest shrink-0 ml-3">{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5 */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-pink-400">Phase Relationships</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { qty: "Velocity", phase: "Leads x by π/2 (90°)", color: "text-cyan-400" },
            { qty: "Acceleration", phase: "Leads v by π/2 (180° from x)", color: "text-amber-400" },
            { qty: "Force", phase: "In phase with acceleration", color: "text-pink-400" },
            { qty: "PE → KE", phase: "Transfer at max at equilibrium", color: "text-emerald-400" },
          ].map(item => (
            <div key={item.qty} className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-white/5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}>{item.qty}</span>
              <span className="text-[10px] font-medium text-white/40 italic">{item.phase}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

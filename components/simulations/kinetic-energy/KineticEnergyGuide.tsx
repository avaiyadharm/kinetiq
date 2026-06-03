"use client";
import React from "react";
import { useKEStore, KEMode } from "@/store/kineticEnergyStore";

const MODES = [
  {
    id: "freeparticle" as KEMode,
    icon: "●",
    title: "Free Particle",
    concept: "KE = ½mv²",
    steps: [
      "Set the mass and initial velocity using the sliders.",
      "Apply a force — watch kinetic energy grow as ½mv² updates in real time.",
      "Enable friction to see energy dissipation as thermal loss.",
      "Notice the parabolic relationship: doubling velocity → 4× kinetic energy.",
      "Observe the velocity vector scale with speed.",
    ],
    insight: "The energy bar shows KE as the only energy form — no height, no rotation. Perfect for isolating the v² dependence.",
  },
  {
    id: "inclinedplane" as KEMode,
    icon: "◸",
    title: "Inclined Plane",
    concept: "PE → KE via gravity",
    steps: [
      "Place the block at the top using the button.",
      "Adjust the angle θ to change the gravitational component along the ramp.",
      "Increase friction μ to observe energy loss to heat.",
      "The normal force N = mg·cosθ appears as a green vector.",
      "Watch KE + PE stay constant (conservation) with zero friction.",
    ],
    insight: "PE at the top = mgh = KE at the bottom. The exit speed = √(2gh). Friction makes the exit speed less than the ideal value.",
  },
  {
    id: "projectile" as KEMode,
    icon: "⌒",
    title: "Projectile Motion",
    concept: "2D kinematics + energy",
    steps: [
      "Set launch angle and speed in the controls panel.",
      "Press LAUNCH — the ball follows a parabolic path.",
      "Enable air resistance to see the trajectory deviate from ideal.",
      "The dotted curve shows the ideal (drag-free) trajectory.",
      "Track how KE and PE trade off along the path.",
    ],
    insight: "At peak height, vₓ is constant but vᵧ = 0, so KE is minimum. KE is maximum at launch and landing.",
  },
  {
    id: "collision" as KEMode,
    icon: "◌",
    title: "Collision & Momentum",
    concept: "elastic vs inelastic",
    steps: [
      "Set masses and velocities for both bodies.",
      "Set restitution e = 1.0 for elastic (KE conserved) collision.",
      "Set e = 0 for perfectly inelastic — bodies stick together.",
      "Watch the ΔKE lost display in the analytics panel.",
      "Observe Newton's third law: equal and opposite impulses during contact.",
    ],
    insight: "Momentum is always conserved. KE is only conserved when e = 1. The energy lost goes into deformation, sound, and heat.",
  },
  {
    id: "rotational" as KEMode,
    icon: "⟳",
    title: "Rotational Dynamics",
    concept: "KE_rot = ½Iω²",
    steps: [
      "Select a shape — each has a different moment of inertia formula.",
      "Apply torque to accelerate the object.",
      "Compare: a ring (I = mr²) stores more KE than a disk (I = ½mr²) at the same ω.",
      "Add friction to see angular deceleration.",
      "Observe: α = τ/I — more torque or less inertia → faster spin-up.",
    ],
    insight: "Mass far from the axis contributes more to I (scales with r²). A ring of the same mass and radius as a disk is harder to spin up — but stores more energy once spinning.",
  },
  {
    id: "rollercoaster" as KEMode,
    icon: "~",
    title: "Roller Coaster",
    concept: "PE ↔ KE continuous exchange",
    steps: [
      "Release the cart from the top — watch PE convert to KE as it descends.",
      "The energy bar shows continuous PE↔KE exchange.",
      "Increase rolling friction μ to see the cart slow over time.",
      "The cart may not complete loops if initial energy is too low.",
      "Energy = KE + PE = constant (minus friction losses) at any point.",
    ],
    insight: "For a loop of radius r, the minimum speed at the top is √(gr) — the condition for maintaining contact (centripetal acceleration = g).",
  },
  {
    id: "vehicle" as KEMode,
    icon: "▬",
    title: "Vehicle Scale Comparison",
    concept: "KE scales enormously with mass × v²",
    steps: [
      "Select vehicles from the control panel to add them to the chart.",
      "Compare a bullet vs a car — the bullet has tiny mass but extreme velocity.",
      "A rocket has both enormous mass AND speed → TJ-scale kinetic energy.",
      "An asteroid demonstrates why planetary impacts are catastrophic.",
      "All values use KE = ½mv² with real published values.",
    ],
    insight: "A 747 at cruise has ~6 GJ of KE — equivalent to 1.5 tons of TNT. This is why impact engineering is critical in vehicle safety design.",
  },
];

const CONCEPTS = [
  { label: "KE = ½mv²",           color: "#3b82f6", desc: "Classical kinetic energy" },
  { label: "W = ΔKE",             color: "#10b981", desc: "Work-energy theorem" },
  { label: "E = KE + PE = const", color: "#a78bfa", desc: "Conservation of energy" },
  { label: "p = mv",              color: "#ec4899", desc: "Linear momentum" },
  { label: "KE_rot = ½Iω²",       color: "#8b5cf6", desc: "Rotational kinetic energy" },
  { label: "KE_rel = (γ-1)mc²",   color: "#ef4444", desc: "Relativistic kinetic energy" },
  { label: "P = dKE/dt = F·v",    color: "#f97316", desc: "Mechanical power" },
];

export const KineticEnergyGuide: React.FC = () => {
  const { mode, setMode, reset } = useKEStore();
  const current = MODES.find(m => m.id === mode) || MODES[0];

  return (
    <div className="flex flex-col gap-7">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-black text-white tracking-tight">Lab Guide</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          7 simulation modes, each demonstrating a different aspect of kinetic energy. Follow the steps for each mode below.
        </p>
      </div>

      {/* Key Concepts Quick Reference */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-3">Key Equations</div>
        <div className="grid grid-cols-1 gap-2">
          {CONCEPTS.map(c => (
            <div key={c.label} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
              <code className="text-[12px] font-mono font-bold" style={{ color: c.color }}>{c.label}</code>
              <span className="text-[11px] text-white/30">— {c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Select Mode</div>
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); reset(); }}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-[10px] font-mono text-left transition-all border ${
                mode === m.id
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                  : "bg-white/3 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60"
              }`}
            >
              <span>{m.icon}</span>
              <div>
                <div className="font-bold">{m.title}</div>
                <div className="text-[9px] opacity-60">{m.concept}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Mode Guide */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{current.icon}</div>
          <div>
            <div className="text-base font-black text-white">{current.title}</div>
            <code className="text-[11px] text-blue-300 font-mono">{current.concept}</code>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Steps</div>
          {current.steps.map((step, i) => (
            <div key={i} className="flex gap-3 text-[12px] text-white/60 leading-relaxed">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[12px] text-amber-300 leading-relaxed">
          <span className="font-bold text-amber-400">💡 Key Insight: </span>
          {current.insight}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col gap-2.5">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Tips</div>
        {[
          "Use the Analytics tab to see real-time graphs of KE, PE, momentum, and power.",
          "Pause the simulation (⏸ Pause) at any moment to examine exact values.",
          "The energy bar at the bottom of the canvas shows KE vs PE vs thermal loss.",
          "Adjust Playback Speed to slow down fast collisions or speed up slow processes.",
          "Scientific Mode (in Viz toggles) reveals extra numerical precision overlay.",
        ].map((tip, i) => (
          <div key={i} className="flex gap-2.5 text-[11px] text-white/45 leading-relaxed">
            <span className="text-white/20 shrink-0">›</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

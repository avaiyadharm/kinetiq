"use client";

import React from "react";
import { Info, HelpCircle, Settings, BookOpen, Layers } from "lucide-react";

export const KineticEnergyGuide: React.FC = () => {
  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-text selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-10 text-zinc-300 leading-relaxed font-sans pb-24">
        
        {/* Title */}
        <div className="border-b border-zinc-850 pb-5">
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display uppercase">
            Kinetic Energy Lab: User Manual
          </h2>
          <p className="text-xs text-cyan-400 font-mono mt-1 uppercase tracking-wider">
            Instructions for Interacting with Classial, Relativistic, and Waveform Energy States
          </p>
        </div>

        {/* Section: Overview */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            1. Lab Session Overview
          </h3>
          <p>
            The Kinetic Energy Simulator allows you to explore energy in motion across five distinct regimes: Classical Translational, Rotational, Relativistic, Thermal, and Quantum. By altering mass, speed, geometry, and thermal states, you can see how kinetic calculations behave under extreme boundary conditions.
          </p>
        </section>

        {/* Section: Operating Modes */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            2. Interactive Sub-Modes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Translational */}
            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Translational Mode</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Observe a sliding mass block on a track. Adjust block mass and speed to inspect changes in energy. Add sliding friction to decelerate the block, or trigger sudden force boosts using the **Apply Impulse** button.
              </p>
            </div>

            {/* Rotational */}
            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Rotational Mode</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Spin wheels of varying geometry (rings, solid disks, spheres, thin center-pivot rods). Adjust mass and radius to see how spatial distribution shifts moment of inertia (<InlineMath math="I" />) and spinning energy.
              </p>
            </div>

            {/* Relativistic */}
            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Relativistic Mode</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Accelerate subatomic particles to relativistic fractions of the speed of light (<InlineMath math="c" />). Observe Lorentz length contraction and Doppler color shifting, and check how classical kinetic approximations diverge from exact relativistic integrals.
              </p>
            </div>

            {/* Thermal */}
            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Thermal Mode</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Simulate gas particles bouncing in a chamber. Adjust temperature and choose different gas elements (Helium, Argon, Xenon). The speed of the particles will shift according to their root-mean-square speeds.
              </p>
            </div>

          </div>

          {/* Quantum Well */}
          <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Quantum (Particle in a Box) Mode</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Confine an electron or proton inside a 1D potential well of width <InlineMath math="L" />. Toggle energy states (<InlineMath math="n" />) to view wavefunctions <InlineMath math="\psi(x)" /> and probability densities <InlineMath math="|\psi(x)|^2" />. Observe that quantum kinetic energy is discrete and non-zero even at the ground state.
            </p>
          </div>
        </section>

        {/* Section: Analytics & Navigation */}
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            3. Analytics Tab Operations
          </h3>
          <p className="text-sm">
            Transition to the **Data Analytics** tab to view dynamic comparison charts matching your current settings:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 pl-2 space-y-1.5">
            <li><strong>Relativistic Deviation:</strong> Graphs the classical <InlineMath math="\frac{1}{2}mv^2" /> curve alongside the relativistic curve, illustrating the divergence at speeds above <InlineMath math="0.5c" />.</li>
            <li><strong>Maxwell-Boltzmann Distribution:</strong> Plots speed histograms of gas molecules matching selected temperatures.</li>
            <li><strong>Quantum Ladder:</strong> Renders discrete energy steps showing the quadratic <InlineMath math="n^2" /> relationship.</li>
          </ul>
        </section>

        {/* Alert note */}
        <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl flex gap-3 items-start">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-400 leading-normal">
            <strong>Simulation Controls:</strong> Use the **Pause Sim** button in the sidebar to halt calculations. Click **Reset Laboratory** on the sidebar footer to restore default parameter bounds.
          </div>
        </div>

      </div>
    </div>
  );
};

// Inline helper for guide compilation
const InlineMath: React.FC<{ math: string }> = ({ math }) => {
  return <span className="font-mono bg-zinc-900/80 px-1 py-0.5 rounded text-[10.5px] text-cyan-400">{math}</span>;
};

"use client";

import React from "react";
import { BookOpen, Sliders, Activity, Target, ShieldAlert, GitMerge } from "lucide-react";

export const GasLawsGuide: React.FC = () => {
  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 bg-[#18181b] overflow-y-auto text-white">
      <div className="max-w-[1000px] mx-auto w-full space-y-8 animate-fadeIn pb-24">
        {/* Header */}
        <div className="border-b border-white/5 pb-8">
          <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-500" /> Operational Manual & Lab Guide
          </h2>
          <p className="text-sm text-white/50 mt-3 leading-relaxed">
            Comprehensive operational guidelines for conducting isobaric, isothermal, and isochoric experiments inside the kinetic gas particle chamber.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chamber Initialization */}
          <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-4">
              <Target className="w-5 h-5" /> Thermodynamic States & Variable Locking
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              To study specific empirical gas laws, utilize the **Gas Regime** controls to lock variables, mimicking classical laboratory constraints:
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
              <li><strong>Boyle&apos;s Law (Isothermal):</strong> Locks Temperature (<MathEq>T</MathEq>). Drag the piston handle on the canvas to decrease or increase volume, and observe the inverse response in Pressure (<MathEq>P</MathEq>).</li>
              <li><strong>Charles&apos;s Law (Isobaric):</strong> Locks Pressure (<MathEq>P</MathEq>). Adjust the temperature slider. The piston will automatically expand or contract to maintain constant pressure.</li>
              <li><strong>Gay-Lussac&apos;s Law (Isochoric):</strong> Locks Volume (<MathEq>V</MathEq>). The piston is fixed in place. Heating the gas causes pressure to rise proportionally.</li>
              <li><strong>Avogadro&apos;s Law:</strong> Locks Pressure (<MathEq>P</MathEq>) and Temperature (<MathEq>T</MathEq>). Adding or removing particles triggers volume adjustments to maintain equilibrium.</li>
            </ul>
          </div>

          {/* Benchmark Scenarios */}
          <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400 font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-4">
              <Sliders className="w-5 h-5" /> Pre-Configured Gas Presets
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Standardized physical gases are provided to illustrate how particle mass and radius affect microscopic kinetics and macroscopic outputs:
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
              <li><strong>Ideal Gas:</strong> Point-like particles (<MathEq>r=0</MathEq>) with zero attractive forces. Perfect match to the theoretical ideal gas law.</li>
              <li><strong>Helium (He):</strong> Low mass, small radius. Particles move at very high speeds, producing rapid, low-impact wall collisions.</li>
              <li><strong>Xenon (Xe):</strong> High mass, large radius. Slow-moving, heavy particles that occupy substantial co-volume, creating noticeable deviations from ideal behavior.</li>
              <li><strong>Real Gas (Van der Waals):</strong> Activates both hard-sphere collisions and short-range attractive forces to demonstrate non-ideal gas characteristics.</li>
            </ul>
          </div>
        </div>

        {/* Diagnostic post-processing */}
        <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest font-display border-b border-white/5 pb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Real-time Diagnostics Suite
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
              <strong className="text-white text-xs uppercase tracking-wider block font-display text-emerald-400">Maxwell-Boltzmann Distribution</strong>
              <p className="text-sm text-white/60 leading-relaxed">
                A live histogram displays the velocity distribution of the gas particles. Compare the simulated speed distribution with the theoretical curve at the selected temperature.
              </p>
            </div>

            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
              <strong className="text-white text-xs uppercase tracking-wider block font-display text-indigo-400">Mechanical Pressure Integration</strong>
              <p className="text-sm text-white/60 leading-relaxed">
                Rather than using <MathEq>PV=nRT</MathEq> to calculate pressure, the solver measures actual collision force on the walls. The telemetry charts both values to verify kinetic theory.
              </p>
            </div>

            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
              <strong className="text-white text-xs uppercase tracking-wider block font-display text-rose-400">Isothermal Thermostat</strong>
              <p className="text-sm text-white/60 leading-relaxed">
                When locked in Isothermal mode, the simulation applies a velocity scaling algorithm (thermostat) to maintain average particle speeds, balancing cooling/heating effects.
              </p>
            </div>
          </div>
        </div>

        {/* Safety guidelines */}
        <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Numerical Limits & Collision Mechanics
          </h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Due to the discretized nature of particle-in-a-box simulations, extreme input values can create numerical anomalies. Observe the following precautions:
          </p>
          <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
            <li><strong>Thermal Leakage:</strong> At extreme temperatures (<MathEq>T &gt; 1000 K</MathEq>), high-speed particles may traverse past the boundary walls in a single timestep. The engine enforces a velocity cap to prevent escaping particles.</li>
            <li><strong>Shot Noise:</strong> With low particle counts (<MathEq>N &lt; 50</MathEq>), the measured wall pressure will fluctuate wildly due to the low frequency of discrete wall impacts. Use higher particle counts to smooth the telemetry.</li>
            <li><strong>Van der Waals Choking:</strong> At high densities (low volume and high particle count) combined with high attractive forces, particles may condense into a liquid-like state, causing a sharp drop in pressure.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Help helper component for equations
const MathEq = ({ children }: { children: React.ReactNode }) => (
  <span className="font-serif italic mx-0.5 text-slate-200 tracking-wide">{children}</span>
);

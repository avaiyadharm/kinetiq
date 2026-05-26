"use client";

import React from "react";
import { BookOpen, Activity, Box, Variable, Layers, Cpu } from "lucide-react";

// Scientific Typography Components
const Sub = ({ children }: { children: React.ReactNode }) => <sub className="text-[0.7em] relative bottom-[-0.3em] font-serif">{children}</sub>;
const Sup = ({ children }: { children: React.ReactNode }) => <sup className="text-[0.7em] relative top-[-0.3em] font-serif">{children}</sup>;

const MathEq = ({ children, block = false, label }: { children: React.ReactNode, block?: boolean, label?: string }) => {
  if (!block) {
    return <span className="font-serif italic mx-0.5 text-slate-200 tracking-wide">{children}</span>;
  }
  return (
    <div className="my-8 relative group w-full">
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-emerald-500 font-black z-10 shadow-sm">{label}</div>}
      <div className="bg-black/40 border border-white/10 rounded-2xl py-8 px-6 flex items-center justify-center overflow-x-auto shadow-inner relative">
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

const SectionHeader = ({ title, icon: Icon, id }: { title: string, icon: React.ElementType, id?: string }) => (
  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mt-16 mb-8" id={id}>
    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-xl font-black font-display uppercase tracking-widest text-white">{title}</h3>
  </div>
);

const DefItem = ({ term, sym, unit, desc }: { term: string, sym: React.ReactNode, unit: string, desc: string }) => (
  <div className="flex flex-col md:flex-row md:items-baseline gap-3 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-3 rounded-lg transition-colors">
    <div className="md:w-1/3 flex items-baseline gap-2 shrink-0">
      <span className="font-bold text-white/90 text-sm tracking-wide">{term}</span>
      <span className="font-serif italic text-emerald-400 font-bold">{sym}</span>
    </div>
    <div className="md:w-2/3 flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-white/50 bg-white/5 w-fit px-2 py-0.5 rounded uppercase tracking-widest border border-white/5">{unit}</span>
      <span className="text-sm text-white/60 leading-relaxed">{desc}</span>
    </div>
  </div>
);

export const GasLawsTheory: React.FC<{ expertiseLevel: "beginner" | "intermediate" | "expert" }> = ({ expertiseLevel }) => {
  return (
    <div className="flex-1 p-6 md:p-10 lg:p-14 bg-[#18181b] overflow-y-auto text-white selection:bg-emerald-500/30">
      <div className="max-w-[900px] mx-auto w-full space-y-8 animate-fadeIn pb-24">
        
        {/* Header */}
        <div className="flex flex-col border-b border-white/10 pb-10">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.25em] mb-3">Thermodynamics & Kinetic Theory</div>
          <h2 className="text-2xl md:text-3xl font-black font-display uppercase tracking-widest text-white flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-emerald-400" /> Theoretical Basis of Gas Dynamics
          </h2>
          <p className="text-sm md:text-base text-white/50 mt-5 leading-relaxed max-w-2xl font-serif">
            A comprehensive investigation of the mathematical formulations, macroscopic gas laws, and microscopic kinetic foundations driving the gas chamber simulation.
          </p>
        </div>

        {/* 1. Macro Gas Laws */}
        <section>
          <SectionHeader title="1. Empirical Gas Laws" icon={Activity} />
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Historically, the behavior of gases was formulated via experimental observation under controlled states. Four empirical laws establish the correlations between Pressure (<MathEq>P</MathEq>), Volume (<MathEq>V</MathEq>), Temperature (<MathEq>T</MathEq>), and Particle Count (<MathEq>N</MathEq>):
          </p>

          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-8 mb-3">Boyle's Law (Constant T, N)</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Formulated by Robert Boyle, it states that the pressure of a given mass of an ideal gas is inversely proportional to its volume when temperature remains constant (isothermal regime):
          </p>
          <MathEq block label="Boyle's Relation">
            P · V = \text{"constant"} \implies P_1 V_1 = P_2 V_2
          </MathEq>

          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-8 mb-3">Charles's Law (Constant P, N)</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Formulated by Jacques Charles, it indicates that the volume of an ideal gas is directly proportional to its absolute temperature at constant pressure (isobaric regime):
          </p>
          <MathEq block label="Charles's Relation">
            <MathFrac num="V" den="T" /> = \text{"constant"} \implies <MathFrac num="V_1" den="T_1" /> = <MathFrac num="V_2" den="T_2" />
          </MathEq>

          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-8 mb-3">Gay-Lussac's Law (Constant V, N)</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Formulated by Joseph Louis Gay-Lussac, it states that the pressure of a given mass of gas is directly proportional to its absolute temperature at constant volume (isochoric regime):
          </p>
          <MathEq block label="Gay-Lussac's Relation">
            <MathFrac num="P" den="T" /> = \text{"constant"} \implies <MathFrac num="P_1" den="T_1" /> = <MathFrac num="P_2" den="T_2" />
          </MathEq>

          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-8 mb-3">Avogadro's Law (Constant P, T)</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Amedeo Avogadro postulatd that equal volumes of gases at the same temperature and pressure contain equal numbers of particles:
          </p>
          <MathEq block label="Avogadro's Relation">
            <MathFrac num="V" den="N" /> = \text{"constant"} \implies <MathFrac num="V_1" den="N_1" /> = <MathFrac num="V_2" den="N_2" />
          </MathEq>
        </section>

        {/* 2. Ideal Gas Equation */}
        <section>
          <SectionHeader title="2. The Ideal Gas Equation" icon={Variable} />
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            Combining the empirical laws yields the unified equation of state for an ideal gas, establishing a singular equation relating all thermodynamic state variables:
          </p>
          <MathEq block label="Ideal Gas Law">
            P · V = N · k_B · T \quad \text{"or"} \quad P · V = n · R · T
          </MathEq>
          
          <div className="bg-[#141416] border border-white/5 rounded-2xl p-2 shadow-lg mt-6">
            <DefItem 
              term="Pressure" sym="P" unit="Pa or N/m²"
              desc="The average perpendicular force per unit area exerted by gas particles on the container walls. Measured in the simulation from the sum of particle momentum transfers."
            />
            <DefItem 
              term="Volume" sym="V" unit="m³"
              desc="The spatial volume occupied by the gas. In our 2D engine, this corresponds directly to the container cross-sectional area (Width × Height)."
            />
            <DefItem 
              term="Temperature" sym="T" unit="Kelvin (K)"
              desc="A macroscopic measure of the average kinetic energy of the particles. Measured in the engine as the mean squared velocity."
            />
            <DefItem 
              term="Particle Count" sym="N" unit="dimensionless"
              desc="The absolute number of gas particles inside the chamber. In chemistry, this is replaced by the number of moles (n = N / N_A)."
            />
            <DefItem 
              term="Boltzmann Constant" sym="k_B" unit="1.3806 × 10⁻²³ J/K"
              desc="The physical constant relating the average kinetic energy of particles in a gas with the thermodynamic temperature."
            />
            <DefItem 
              term="Ideal Gas Constant" sym="R" unit="8.314 J / (mol · K)"
              desc="The molar equivalent of the Boltzmann constant, R = N_A · k_B."
            />
          </div>
        </section>

        {/* 3. Microscopic Kinetic Theory */}
        <section>
          <SectionHeader title="3. Kinetic Theory of Gases" icon={Cpu} />
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            Kinetic theory connects macroscopic parameters to microscopic mechanics. It assumes that gases consist of a large number of sub-microscopic particles in continuous random motion, colliding elastically with each other and the walls.
          </p>

          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">Mechanical Derivation of Pressure</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            When a particle of mass <MathEq>m</MathEq> and velocity component <MathEq>v_x</MathEq> hits a vertical wall elastically, the velocity reverses to <MathEq>-v_x</MathEq>. The momentum transferred to the wall is:
          </p>
          <MathEq block>
            \Delta p_x = 2 m |v_x|
          </MathEq>
          <p className="text-sm text-white/70 leading-relaxed mt-4">
            Summing these impacts over a time window <MathEq>\Delta t</MathEq> across a wall of area <MathEq>A</MathEq> yields the pressure:
          </p>
          <MathEq block label="Microscopic Pressure">
            P = <MathFrac num={<>\sum \Delta p_x</>} den={<>A \cdot \Delta t</>} /> = <MathFrac num={<>\sum 2 m |v_x|</>} den={<>A \cdot \Delta t</>} />
          </MathEq>
          <p className="text-sm text-white/70 leading-relaxed mt-4">
            This collision-based momentum integration is the exact method utilized by our Canvas physics engine to measure simulated pressure!
          </p>

          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-10 mb-3">Maxwell-Boltzmann Speed Distribution</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            In thermodynamic equilibrium, particle speeds follow the Maxwell-Boltzmann distribution. In a 2D space, the distribution of speed <MathEq>v</MathEq> is governed by:
          </p>
          <MathEq block label="2D Maxwell-Boltzmann PDF">
            f(v) = <MathFrac num={<>m v</>} den={<>k_B T</>} /> \exp\left( - <MathFrac num={<>m v^2</>} den={<>2 k_B T</>} /> \right)
          </MathEq>
          <p className="text-sm text-white/70 leading-relaxed mt-4">
            The root-mean-square velocity in 2D is:
          </p>
          <MathEq block>
            {"v_{\\text{rms}} = \\sqrt{"}<MathFrac num={<>2 k_B T</>} den="m" />{"}"}
          </MathEq>
        </section>

        {/* 4. Real Gas Corrections */}
        {expertiseLevel !== "beginner" && (
          <section>
            <SectionHeader title="4. Real Gas & Van der Waals Corrections" icon={Layers} />
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Ideal gas theory assumes point-like particles with zero volume and zero attractive forces. Real gases deviate from this at high density and low temperature. The **Van der Waals equation of state** introduces two empirical parameters to correct for this:
            </p>
            <div className="bg-[#141416] border border-white/5 p-6 rounded-2xl mb-8">
              <h5 className="font-bold text-white uppercase tracking-widest text-xs mb-3 text-emerald-400">Van der Waals Equation</h5>
              <MathEq block>
                \left( P + a <MathFrac num={<>n^2</>} den={<>V^2</>} /> \right) (V - n b) = n R T
              </MathEq>
              <div className="space-y-4 mt-6 border-t border-white/5 pt-4">
                <p className="text-xs text-white/60">
                  <strong className="text-emerald-400">Co-volume correction (b):</strong> Accounts for the finite volume occupied by the gas particles. The effective volume available for particles to move is reduced to <MathEq>V - nb</MathEq>. In the simulation, this is modeled by enabling hard-sphere particle-particle collisions.
                </p>
                <p className="text-xs text-white/60">
                  <strong className="text-emerald-400">Intermolecular attraction (a):</strong> Accounts for attractive electrostatic forces (van der Waals forces) between particles. This attraction pulls outer particles inward, decreasing the collision force on the walls. In the simulation, we model this by applying a short-range attractive force between nearby particles, which decreases the measured pressure.
                </p>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

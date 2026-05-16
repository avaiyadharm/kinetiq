"use client";
import React from "react";

const FormulaCard = ({
  title,
  formula,
  description,
  color,
}: {
  title: string;
  formula: string;
  description: string;
  color: string;
}) => (
  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/10 transition-all group">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white/80 transition-colors">
        {title}
      </h4>
    </div>
    <div className="p-4 rounded-xl bg-black/40 border border-white/5">
      <p className="text-lg font-mono font-bold text-white tracking-wide">{formula}</p>
    </div>
    <p className="text-xs text-white/40 leading-relaxed">{description}</p>
  </div>
);

const ConceptSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">
        {title}
      </h3>
      <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
    </div>
    {children}
  </div>
);

export const GravitationTheory: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Intro */}
      <div className="p-8 rounded-[24px] bg-gradient-to-br from-orange-500/5 to-violet-500/5 border border-white/5">
        <p className="text-sm text-white/60 leading-relaxed">
          Newton&apos;s Law of Universal Gravitation describes the attractive force between any two masses
          in the universe. Every particle attracts every other particle with a force proportional to the
          product of their masses and inversely proportional to the square of the distance between them.
          This is one of the most fundamental laws in physics, governing everything from falling apples
          to the orbits of galaxies.
        </p>
      </div>

      {/* Newton's Law */}
      <ConceptSection title="Newton's Law of Universal Gravitation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormulaCard
            title="Gravitational Force"
            formula="F = G·M·m / r²"
            description="The gravitational force between two masses M and m separated by distance r. G is the universal gravitational constant (6.674 × 10⁻¹¹ N·m²/kg²)."
            color="#ec4899"
          />
          <FormulaCard
            title="Gravitational Field Strength"
            formula="g = G·M / r²"
            description="The gravitational field strength at distance r from a mass M. This gives the acceleration due to gravity at that point, independent of the test mass."
            color="#f97316"
          />
        </div>
      </ConceptSection>

      {/* Orbital Mechanics */}
      <ConceptSection title="Circular Orbital Mechanics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormulaCard
            title="Orbital Velocity"
            formula="v = √(G·M / r)"
            description="The velocity required for a stable circular orbit at radius r around mass M. Faster → falls inward. Slower → spirals outward."
            color="#06b6d4"
          />
          <FormulaCard
            title="Orbital Period (Kepler's 3rd Law)"
            formula="T² = (4π²/GM) · r³"
            description="The time to complete one orbit is related to the cube of the orbital radius. This is Kepler's third law, derivable from Newton's gravitation."
            color="#8b5cf6"
          />
          <FormulaCard
            title="Angular Velocity"
            formula="ω = √(G·M / r³)"
            description="The rate of angular rotation for a circular orbit. Derived by equating gravitational force to the centripetal force requirement."
            color="#f59e0b"
          />
          <FormulaCard
            title="Centripetal Acceleration"
            formula="ac = v²/r = G·M/r²"
            description="In a circular orbit, gravitational acceleration provides the exact centripetal acceleration needed. This is the equilibrium condition for a stable orbit."
            color="#34d399"
          />
        </div>
      </ConceptSection>

      {/* Energy */}
      <ConceptSection title="Gravitational Potential Energy & Orbital Energy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormulaCard
            title="Gravitational Potential Energy"
            formula="PE = −G·M·m / r"
            description="The potential energy is always negative (bound system). It approaches zero as r → ∞. The negative sign reflects that work must be done against gravity to separate the masses."
            color="#f97316"
          />
          <FormulaCard
            title="Kinetic Energy in Orbit"
            formula="KE = ½mv² = G·M·m / 2r"
            description="For a circular orbit, KE = −½ × PE. The kinetic energy is always positive and exactly half the magnitude of the potential energy."
            color="#10b981"
          />
          <FormulaCard
            title="Total Mechanical Energy"
            formula="E = KE + PE = −G·M·m / 2r"
            description="The total energy is negative for bound orbits. |E| = KE. A more negative total energy means a more tightly bound orbit (smaller radius)."
            color="#ec4899"
          />
          <FormulaCard
            title="Escape Velocity"
            formula="v_esc = √(2GM / r)"
            description="The minimum speed needed to escape the gravitational field entirely (reach r → ∞ with v → 0). Note: v_esc = √2 × v_orbital."
            color="#06b6d4"
          />
        </div>
      </ConceptSection>

      {/* Kepler's Laws */}
      <ConceptSection title="Kepler's Laws of Planetary Motion">
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-violet-400">
              1st Law — Law of Orbits
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Every planet moves in an elliptical orbit with the Sun at one focus. Circular orbits are a
              special case where both foci coincide (eccentricity = 0).
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              2nd Law — Law of Areas
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              A line joining a planet to the Sun sweeps out equal areas in equal intervals of time.
              This is equivalent to conservation of angular momentum: L = mvr = constant.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400">
              3rd Law — Law of Periods
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              The square of the orbital period is proportional to the cube of the semi-major axis:
              T² ∝ r³. For our simulation: T = 2π√(r³/GM).
            </p>
          </div>
        </div>
      </ConceptSection>

      {/* Key Relationships */}
      <ConceptSection title="Critical Relationships">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/50 font-mono">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Orbit condition:</span>{" "}
              F_gravity = F_centripetal → GMm/r² = mv²/r
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Energy relation:</span>{" "}
              KE = −½PE → E_total = −KE
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Escape vs Orbit:</span>{" "}
              v_escape = √2 × v_orbital
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Shell theorem:</span>{" "}
              Uniform sphere acts as point mass at center
            </div>
          </div>
        </div>
      </ConceptSection>
    </div>
  );
};

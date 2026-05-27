"use client";
import React from "react";

const Sub = ({ children }: { children: React.ReactNode }) => <sub className="text-[0.7em] relative bottom-[-0.2em]">{children}</sub>;
const Sup = ({ children }: { children: React.ReactNode }) => <sup className="text-[0.7em] relative top-[-0.2em]">{children}</sup>;

const MathFrac = ({ num, den }: { num: React.ReactNode; den: React.ReactNode }) => (
  <span className="inline-flex flex-col items-center justify-center align-middle mx-1.5 font-serif text-[0.85em] translate-y-[-0.1em]">
    <span className="border-b border-white/60 pb-[2px] mb-[2px] px-1">{num}</span>
    <span className="pt-[1px] px-1">{den}</span>
  </span>
);

const FormulaCard = ({ title, formula, description, color }: {
  title: string; formula: React.ReactNode; description: string; color: string;
}) => (
  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/10 transition-all group">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white/80 transition-colors">{title}</h4>
    </div>
    <div className="p-4 rounded-xl bg-black/40 border border-white/5">
      <div className="text-lg font-mono font-bold text-white tracking-wide flex items-center flex-wrap gap-1">{formula}</div>
    </div>
    <p className="text-xs text-white/40 leading-relaxed">{description}</p>
  </div>
);

const ConceptSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">{title}</h3>
      <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
    </div>
    {children}
  </div>
);

export const CollisionTheory: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Intro */}
      <div className="p-8 rounded-[24px] bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-white/5">
        <p className="text-sm text-white/60 leading-relaxed">
          A <span className="text-white font-bold">collision</span> occurs when two or more bodies exert forces on each other
          over a short time interval. Collisions are fundamental to understanding how momentum and energy transfer between
          objects. From atomic-scale particle interactions to car crashes, the physics of collisions governs how systems
          exchange kinetic energy and momentum. The two key principles at play are the{" "}
          <span className="text-violet-400 font-bold">conservation of linear momentum</span> and the{" "}
          <span className="text-cyan-400 font-bold">conservation of kinetic energy</span> (in elastic collisions).
        </p>
      </div>

      {/* Types of Collisions */}
      <ConceptSection title="Types of Collisions">
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Perfectly Elastic Collision</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Both <span className="text-white font-bold">momentum and kinetic energy are conserved</span>. The objects
              bounce off each other with no loss of kinetic energy to heat, sound, or deformation. The coefficient of
              restitution <span className="font-mono text-emerald-400 font-bold">e = 1</span>. Examples include ideal
              billiard ball collisions and atomic particle scattering.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400">Inelastic Collision</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              <span className="text-white font-bold">Momentum is conserved but kinetic energy is NOT</span>. Some kinetic
              energy is converted into heat, sound, or permanent deformation. The coefficient of restitution{" "}
              <span className="font-mono text-orange-400 font-bold">0 &lt; e &lt; 1</span>. Most real-world collisions
              are inelastic — car crashes, sports ball impacts, etc.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-rose-400">Perfectly Inelastic Collision</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              The maximum possible kinetic energy is lost. The objects{" "}
              <span className="text-white font-bold">stick together</span> after collision and move as one combined mass.
              The coefficient of restitution <span className="font-mono text-rose-400 font-bold">e = 0</span>. Momentum
              is still conserved: m₁v₁ + m₂v₂ = (m₁ + m₂)v&apos;.
            </p>
          </div>
        </div>
      </ConceptSection>

      {/* Conservation of Momentum */}
      <ConceptSection title="Conservation of Linear Momentum">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormulaCard
            title="Momentum (p)"
            formula={<>p = m · v</>}
            description="Linear momentum is the product of mass and velocity. It is a vector quantity — direction matters. A heavier or faster object carries more momentum."
            color="#ec4899"
          />
          <FormulaCard
            title="Conservation Law"
            formula={<>m<Sub>1</Sub>v<Sub>1</Sub> + m<Sub>2</Sub>v<Sub>2</Sub> = m<Sub>1</Sub>v<Sub>1</Sub>' + m<Sub>2</Sub>v<Sub>2</Sub>'</>}
            description="In the absence of external forces, the total momentum of a system is conserved. This holds for ALL collision types — elastic, inelastic, and perfectly inelastic."
            color="#8b5cf6"
          />
          <FormulaCard
            title="Impulse (J) & Momentum Change"
            formula={<>J = ∫ F dt = Δp</>}
            description="The impulse (J) experienced during a collision equals the change in momentum (Δp). The area under the Force-Time graph equals this momentum change. A larger force over a shorter time produces the SAME impulse as a smaller force over a longer time."
            color="#06b6d4"
          />
          <FormulaCard
            title="Center of Mass Velocity"
            formula={<>v<Sub>cm</Sub> = <MathFrac num={<>m<Sub>1</Sub>v<Sub>1</Sub> + m<Sub>2</Sub>v<Sub>2</Sub></>} den={<>m<Sub>1</Sub> + m<Sub>2</Sub></>} /></>}
            description="The velocity of the center of mass remains constant throughout any collision (no external forces). This is a powerful frame for analysis."
            color="#f59e0b"
          />
        </div>
      </ConceptSection>

      {/* Elastic Collision Formulas */}
      <ConceptSection title="Elastic Collision Equations (1D)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormulaCard
            title="Post-Collision Velocity of m₁"
            formula={<>v<Sub>1</Sub>' = <MathFrac num={<>(m<Sub>1</Sub> - m<Sub>2</Sub>)v<Sub>1</Sub> + 2m<Sub>2</Sub>v<Sub>2</Sub></>} den={<>m<Sub>1</Sub> + m<Sub>2</Sub></>} /></>}
            description="In a 1D elastic collision, this gives the final velocity of mass 1. If m₁ = m₂, the objects simply exchange velocities — a beautiful result!"
            color="#8b5cf6"
          />
          <FormulaCard
            title="Post-Collision Velocity of m₂"
            formula={<>v<Sub>2</Sub>' = <MathFrac num={<>(m<Sub>2</Sub> - m<Sub>1</Sub>)v<Sub>2</Sub> + 2m<Sub>1</Sub>v<Sub>1</Sub></>} den={<>m<Sub>1</Sub> + m<Sub>2</Sub></>} /></>}
            description="Symmetric to v₁'. Note: when a light object hits a heavy stationary one, it bounces back. When a heavy object hits a light one, both move forward."
            color="#06b6d4"
          />
          <FormulaCard
            title="KE Conservation Check"
            formula={<>½m<Sub>1</Sub>v<Sub>1</Sub><Sup>2</Sup> + ½m<Sub>2</Sub>v<Sub>2</Sub><Sup>2</Sup> = ½m<Sub>1</Sub>v<Sub>1</Sub>'<Sup>2</Sup> + ½m<Sub>2</Sub>v<Sub>2</Sub>'<Sup>2</Sup></>}
            description="In an elastic collision, the total kinetic energy before equals the total after. This provides a second equation alongside momentum conservation."
            color="#10b981"
          />
          <FormulaCard
            title="Relative Velocity Reversal"
            formula={<>v<Sub>1</Sub> - v<Sub>2</Sub> = -(v<Sub>1</Sub>' - v<Sub>2</Sub>')</>}
            description="In elastic collisions, the relative velocity of approach equals the relative velocity of separation. This is equivalent to e = 1."
            color="#f97316"
          />
        </div>
      </ConceptSection>

      {/* Coefficient of Restitution */}
      <ConceptSection title="Coefficient of Restitution">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormulaCard
            title="Definition"
            formula={<>e = <MathFrac num={<>|v<Sub>2</Sub>' - v<Sub>1</Sub>'|</>} den={<>|v<Sub>1</Sub> - v<Sub>2</Sub>|</>} /></>}
            description="The ratio of relative speed of separation to relative speed of approach. It quantifies the 'bounciness' of a collision from 0 (perfectly inelastic) to 1 (perfectly elastic)."
            color="#f59e0b"
          />
          <FormulaCard
            title="Energy Loss Relation"
            formula={<>KE<Sub>lost</Sub> = ½μ v<Sub>rel</Sub><Sup>2</Sup>(1 - e<Sup>2</Sup>)</>}
            description="Where μ = m₁m₂/(m₁+m₂) is the reduced mass and v_rel is the relative approach velocity. This elegantly connects e to the fraction of kinetic energy dissipated."
            color="#ec4899"
          />
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/50 font-mono">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-emerald-400 font-bold">e = 1:</span> Perfectly elastic, KE fully conserved
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-amber-400 font-bold">0 &lt; e &lt; 1:</span> Inelastic, partial KE loss
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-rose-400 font-bold">e = 0:</span> Perfectly inelastic, objects stick
            </div>
          </div>
        </div>
      </ConceptSection>

      {/* Special Cases */}
      <ConceptSection title="Important Special Cases">
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-violet-400">Equal Masses (m₁ = m₂)</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              In an elastic collision, objects with equal masses <span className="text-white font-bold">exchange velocities</span>.
              If m₂ is initially at rest, m₁ stops completely and m₂ moves with m₁&apos;s original velocity. This is famously
              demonstrated with Newton&apos;s Cradle.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Heavy Hits Light (m₁ ≫ m₂)</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              The heavy object barely changes velocity while the light object bounces away at roughly{" "}
              <span className="text-white font-bold">twice the heavy object&apos;s velocity</span>. Think of a bowling ball hitting
              a marble — the marble flies off at high speed while the bowling ball continues almost unchanged.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400">Light Hits Heavy (m₁ ≪ m₂)</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              The light object <span className="text-white font-bold">bounces back</span> with approximately its original
              speed (reversed), while the heavy object barely moves. Like a tennis ball bouncing off a wall — the wall
              (effectively infinite mass) absorbs almost no energy.
            </p>
          </div>
        </div>
      </ConceptSection>

      {/* Critical Relationships */}
      <ConceptSection title="Key Relationships & Insights">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/50 font-mono">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Always true:</span>{" "}
              Σp_before = Σp_after (all collision types)
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Elastic only:</span>{" "}
              ΣKE_before = ΣKE_after
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Max KE loss:</span>{" "}
              Perfectly inelastic (e = 0, objects stick)
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-primary font-bold">Newton&apos;s 3rd:</span>{" "}
              F₁₂ = −F₂₁ (action-reaction during impact)
            </div>
          </div>
        </div>
      </ConceptSection>
    </div>
  );
};

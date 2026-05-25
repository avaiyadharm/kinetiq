"use client";

import React from "react";
import { cn } from "@/lib/utils";
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
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-teal-500 font-black z-10 shadow-sm">{label}</div>}
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
    <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-xl font-black font-display uppercase tracking-widest text-white">{title}</h3>
  </div>
);

const DefItem = ({ term, sym, unit, desc }: { term: string, sym: React.ReactNode, unit: string, desc: string }) => (
  <div className="flex flex-col md:flex-row md:items-baseline gap-3 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-3 rounded-lg transition-colors">
    <div className="md:w-1/3 flex items-baseline gap-2 shrink-0">
      <span className="font-bold text-white/90 text-sm tracking-wide">{term}</span>
      <span className="font-serif italic text-teal-400 font-bold">{sym}</span>
    </div>
    <div className="md:w-2/3 flex flex-col gap-1.5">
      <span className="text-[10px] font-mono text-white/50 bg-white/5 w-fit px-2 py-0.5 rounded uppercase tracking-widest border border-white/5">{unit}</span>
      <span className="text-sm text-white/60 leading-relaxed">{desc}</span>
    </div>
  </div>
);

export const HeatTransferTheory: React.FC<{ expertiseLevel: "beginner" | "intermediate" | "expert" }> = ({ expertiseLevel }) => {
  return (
    <div className="flex-1 p-6 md:p-10 lg:p-14 bg-[#18181b] overflow-y-auto text-white selection:bg-teal-500/30">
      <div className="max-w-[900px] mx-auto w-full space-y-8 animate-fadeIn pb-24">
        
        {/* Header */}
        <div className="flex flex-col border-b border-white/10 pb-10">
          <div className="text-[10px] font-bold text-teal-500 uppercase tracking-[0.25em] mb-3">Computational Thermodynamics</div>
          <h2 className="text-2xl md:text-3xl font-black font-display uppercase tracking-widest text-white flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-teal-400" /> Theoretical Basis & Numerical Formulation
          </h2>
          <p className="text-sm md:text-base text-white/50 mt-5 leading-relaxed max-w-2xl font-serif">
            A rigorous mathematical foundation and finite difference discretization theory driving the kinetic thermal solver.
          </p>
        </div>

        {/* 1. Governing Equations */}
        <section>
          <SectionHeader title="1. Governing Equations" icon={Activity} />
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Heat transfer within a continuum is strictly governed by the first law of thermodynamics (conservation of energy) combined with phenomenological transport laws.
          </p>

          <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest mt-10 mb-4">Fourier's Law of Heat Conduction</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            The fundamental constitutive relation for thermal conduction in an isotropic medium is Fourier's Law, which postulates that the local heat flux vector <MathEq>q</MathEq> is proportional to the negative temperature gradient:
          </p>
          <MathEq block label="Fourier's Law">
            q = -k ∇T
          </MathEq>
          
          <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest mt-10 mb-4">Conservation of Thermal Energy</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Applying the Reynolds Transport Theorem or a differential control volume analysis, the rate of change of stored thermal energy must balance the net heat flux divergence and volumetric heat generation <MathEq>Q</MathEq>:
          </p>
          <MathEq block label="Energy Conservation">
            ρ C<Sub>p</Sub> <MathFrac num="∂T" den="∂t" /> = -∇ · q + Q
          </MathEq>
          <p className="text-sm text-white/70 leading-relaxed mt-4">
            Substituting Fourier's Law yields the general Heat Diffusion Equation. For a homogeneous medium with constant thermal conductivity <MathEq>k</MathEq>, and assuming no internal generation (<MathEq>Q = 0</MathEq>), the equation simplifies to the parabolic parabolic PDE:
          </p>
          <MathEq block label="Heat Diffusion Equation">
            <MathFrac num="∂T" den="∂t" /> = α ∇²T
          </MathEq>
        </section>

        {/* 2. Dimensional Analysis */}
        <section>
          <SectionHeader title="2. Dimensional Analysis" icon={Variable} />
          <div className="bg-[#141416] border border-white/5 rounded-2xl p-2 shadow-lg">
            <DefItem 
              term="Heat Flux" sym="q" unit="W / m²"
              desc="Vector quantity representing the rate of thermal energy transfer per unit cross-sectional area. The solver calculates this as the spatial gradient norm multiplied by local conductivity."
            />
            <DefItem 
              term="Thermal Conductivity" sym="k" unit="W / (m · K)"
              desc="Material property defining the ability to conduct heat. High conductivity implies rapid heat transfer (e.g., Copper). In the solver, interfacial conductivity employs a harmonic mean to preserve flux continuity."
            />
            <DefItem 
              term="Density" sym="ρ" unit="kg / m³"
              desc="Volumetric mass density of the continuum."
            />
            <DefItem 
              term="Specific Heat Capacity" sym={<>C<Sub>p</Sub></>} unit="J / (kg · K)"
              desc="Amount of thermal energy required to raise the temperature of a unit mass by one degree. The simulator accounts for temperature-dependent specific heat via exact integration."
            />
            <DefItem 
              term="Thermal Diffusivity" sym="α" unit="m² / s"
              desc="Defined as α = k / (ρ C_p). Represents how rapidly a material responds to changes in its thermal environment relative to its ability to store energy."
            />
          </div>
        </section>

        {/* 3. Boundary Constraints */}
        <section>
          <SectionHeader title="3. Boundary Constraints" icon={Box} />
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            The parabolic PDE requires well-posed spatial constraints at the domain boundary <MathEq>Γ</MathEq>. The numerical solver rigorously implements three classical boundary conditions:
          </p>
          <div className="space-y-6">
            <div className="bg-[#141416] border border-white/5 p-6 rounded-2xl">
              <h5 className="font-bold text-white uppercase tracking-widest text-xs mb-2 text-rose-400">Dirichlet (Fixed Temperature)</h5>
              <p className="text-sm text-white/60 mb-4">Enforces a prescribed temperature. Computationally, this acts as an infinite thermal reservoir capable of infinite heat flux.</p>
              <MathEq block>T(x,y,t) = T<Sub>fixed</Sub> &nbsp;&nbsp;&nbsp; (on Γ)</MathEq>
            </div>
            <div className="bg-[#141416] border border-white/5 p-6 rounded-2xl">
              <h5 className="font-bold text-white uppercase tracking-widest text-xs mb-2 text-amber-400">Neumann (Adiabatic / Insulated)</h5>
              <p className="text-sm text-white/60 mb-4">Specifies zero heat flux normal to the boundary (<MathEq>n</MathEq>). Conserves total energy within the closed system.</p>
              <MathEq block><MathFrac num="∂T" den="∂n" /> = 0 &nbsp;&nbsp;&nbsp; (on Γ)</MathEq>
            </div>
            <div className="bg-[#141416] border border-white/5 p-6 rounded-2xl">
              <h5 className="font-bold text-white uppercase tracking-widest text-xs mb-2 text-cyan-400">Robin (Convective Cooling)</h5>
              <p className="text-sm text-white/60 mb-4">Couples conduction at the surface to a convective ambient fluid <MathEq>T<Sub>∞</Sub></MathEq> via the heat transfer coefficient <MathEq>h</MathEq>. The solver linearizes radiation heat transfer into an effective convective term.</p>
              <MathEq block>-k <MathFrac num="∂T" den="∂n" /> = h(T - T<Sub>∞</Sub>) &nbsp;&nbsp;&nbsp; (on Γ)</MathEq>
            </div>
          </div>
        </section>

        {/* 4. Numerical Discretization */}
        <section>
          <SectionHeader title="4. Numerical Discretization" icon={Layers} />
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            The continuous physical domain is discretized into a Cartesian mesh with uniform spacing <MathEq>Δx = Δy</MathEq>. The spatial Laplacian <MathEq>∇²T</MathEq> is approximated using second-order central finite differences:
          </p>
          <MathEq block label="Spatial Discretization">
            ∇²T<Sub>i,j</Sub> ≈ <MathFrac num={<>T<Sub>i+1,j</Sub> - 2T<Sub>i,j</Sub> + T<Sub>i-1,j</Sub></>} den="Δx²" /> + <MathFrac num={<>T<Sub>i,j+1</Sub> - 2T<Sub>i,j</Sub> + T<Sub>i,j-1</Sub></>} den="Δy²" />
          </MathEq>
          
          <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest mt-10 mb-4">Temporal Integration: Crank-Nicolson Method</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            The transient simulator utilizes the implicit Crank-Nicolson scheme, which averages the explicit (Forward Euler) and fully implicit (Backward Euler) derivatives in time. This guarantees unconditional stability and second-order temporal accuracy <MathEq>O(Δt²)</MathEq>:
          </p>
          <MathEq block label="Crank-Nicolson Step">
            <MathFrac num={<>T<Sub>i,j</Sub><Sup>n+1</Sup> - T<Sub>i,j</Sub><Sup>n</Sup></>} den="Δt" /> = <MathFrac num="α" den="2" /> ( ∇²T<Sub>i,j</Sub><Sup>n+1</Sup> + ∇²T<Sub>i,j</Sub><Sup>n</Sup> )
          </MathEq>

          <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest mt-10 mb-4">Alternating Direction Implicit (ADI) Formulation</h4>
          <p className="text-sm text-white/70 leading-relaxed">
            Direct inversion of the full 2D implicit matrix is computationally prohibitive, requiring <MathEq>O(N³)</MathEq> operations. Instead, the solver employs the Peaceman-Rachford ADI algorithm, splitting the temporal step into two fractional sub-steps. This factorization reduces the operator to two tridiagonal matrices:
          </p>
          <div className="space-y-4">
            <MathEq block label="Sweep 1 (Implicit in X)">
              <MathFrac num={<>T<Sup>n+1/2</Sup> - T<Sup>n</Sup></>} den="Δt/2" /> = α ( δ<Sub>x</Sub><Sup>2</Sup> T<Sup>n+1/2</Sup> + δ<Sub>y</Sub><Sup>2</Sup> T<Sup>n</Sup> )
            </MathEq>
            <MathEq block label="Sweep 2 (Implicit in Y)">
              <MathFrac num={<>T<Sup>n+1</Sup> - T<Sup>n+1/2</Sup></>} den="Δt/2" /> = α ( δ<Sub>x</Sub><Sup>2</Sup> T<Sup>n+1/2</Sup> + δ<Sub>y</Sub><Sup>2</Sup> T<Sup>n+1</Sup> )
            </MathEq>
          </div>
          <p className="text-sm text-white/70 leading-relaxed mt-6">
            Each directional sweep produces a block-tridiagonal system that is strictly diagonally dominant, solvable in linear <MathEq>O(N)</MathEq> time using the Thomas Algorithm (TDMA).
          </p>
        </section>

        {/* 5. Computational Stability Analysis */}
        <section>
          <SectionHeader title="5. Computational Stability Analysis" icon={Cpu} />
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            The dimensionless parameter governing temporal stability and diffusion distance per step is the Fourier Number (<MathEq>F<Sub>o</Sub></MathEq>):
          </p>
          <MathEq block label="Fourier Number">
            F<Sub>o</Sub> = <MathFrac num="α Δt" den="Δx²" />
          </MathEq>
          <p className="text-sm text-white/70 leading-relaxed">
            For standard explicit finite difference (FTCS) schemes in 2D, von Neumann stability analysis demands that the spectral radius of the amplification matrix remains less than or equal to unity, yielding the explicit stability constraint:
          </p>
          <MathEq block label="Explicit Stability Limit">
            F<Sub>o</Sub> ≤ <MathFrac num="1" den="4" />
          </MathEq>
          <p className="text-sm text-white/70 leading-relaxed mt-6">
            Exceeding this limit in explicit schemes causes non-physical oscillatory divergence. However, because our numerical engine leverages the implicit ADI formulation, the scheme is <strong>unconditionally stable</strong> for any <MathEq>F<Sub>o</Sub></MathEq>.
          </p>
          <div className="mt-8 p-6 bg-teal-500/10 border-l-4 border-teal-500 rounded-r-xl shadow-lg">
            <h5 className="font-bold text-teal-400 uppercase tracking-widest text-xs mb-3">Simulator Diagnostic Mapping</h5>
            <p className="text-sm text-white/70 leading-relaxed">
              In the simulator's <strong>System Diagnostics</strong> panel, you will observe the live Fourier number. While the ADI solver remains mathematically stable at <MathEq>F<Sub>o</Sub> {">"} 10.0</MathEq>, large time steps induce a temporal splitting error (truncation error of order <MathEq>O(Δt³)</MathEq>) arising from the cross-derivative terms. This is visible in the metrics dashboard as an elevated <strong>Temporal Truncation Error</strong>. 
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

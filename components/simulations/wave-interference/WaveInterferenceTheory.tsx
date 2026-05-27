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
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-primary font-black z-10 shadow-sm">{label}</div>}
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

export const WaveInterferenceTheory = () => {
  return (
    <div>
      <div className="max-w-4xl mx-auto space-y-12 pb-24 text-white">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Theoretical Framework
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-display">Superposition & Interference</h2>
          <p className="text-lg text-white/60 leading-relaxed max-w-2xl font-serif">
            A rigorous analysis of wave propagation, the principle of superposition, and the mathematics governing constructive and destructive interference in two dimensions.
          </p>
        </header>

        <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5">
          <h3 className="text-xl font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-primary/50" /> 
            1. The Wave Equation
          </h3>
          <p className="text-white/70 leading-relaxed">
            A spherical wave emitted from a point source can be described by a scalar function representing the displacement (or pressure) at distance <Var>r</Var> and time <Var>t</Var>. Including spatial attenuation, the wave amplitude is given by:
          </p>
          <MathEq block label="Spherical Wave Equation">
            <Var>z</Var>(<Var>r</Var>, <Var>t</Var>) = ( <MathFrac num={<>A<Sub>0</Sub></>} den={<>&radic;r</>} /> ) &middot; sin(<Var>k r</Var> − <Var>ω t</Var> + &phi;<Sub>0</Sub>)
          </MathEq>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white font-sans uppercase tracking-wider text-[10px] mr-2">k (wavenumber)</strong> = <MathFrac num="2π" den="λ" /></li>
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white font-sans uppercase tracking-wider text-[10px] mr-2">ω (angular freq)</strong> = 2π<Var>f</Var></li>
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white font-sans uppercase tracking-wider text-[10px] mr-2">r</strong> Radial distance from source</li>
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white font-sans uppercase tracking-wider text-[10px] mr-2">A₀</strong> Initial source amplitude</li>
          </ul>
        </section>

        <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5">
          <h3 className="text-xl font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-primary/50" /> 
            2. The Principle of Superposition
          </h3>
          <p className="text-white/70 leading-relaxed">
            When two or more waves traverse the same space, the net displacement at any point is the algebraic sum of the individual displacements. For two coherent sources:
          </p>
          <MathEq block label="Superposition Principle">
            <Var>z</Var><Sub>net</Sub>(<Var>x</Var>, <Var>y</Var>, <Var>t</Var>) = <Var>z</Var><Sub>1</Sub>(<Var>r</Var><Sub>1</Sub>, <Var>t</Var>) + <Var>z</Var><Sub>2</Sub>(<Var>r</Var><Sub>2</Sub>, <Var>t</Var>)
          </MathEq>
          <p className="text-white/70 leading-relaxed">
            The phase difference &Delta;&phi; at a point P determines the nature of interference. Assuming sources are in phase initially:
          </p>
          <MathEq block label="Phase Difference">
            &Delta;&phi; = <Var>k</Var>(<Var>r</Var><Sub>2</Sub> − <Var>r</Var><Sub>1</Sub>) = ( <MathFrac num="2π" den="λ" /> ) &middot; &Delta;<Var>r</Var>
          </MathEq>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-xl space-y-2">
              <h4 className="font-bold text-emerald-400 mb-2 font-display">Constructive Interference</h4>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">Occurs when the path difference &Delta;<Var>r</Var> is an integer multiple of the wavelength.</p>
              <div className="text-sm font-serif text-center text-white/80 font-bold tracking-widest">&Delta;<Var>r</Var> = <Var>n</Var>λ &nbsp;&nbsp;(<Var>n</Var> = 0, 1, 2, ...)</div>
            </div>
            <div className="p-5 border border-violet-500/30 bg-violet-500/5 rounded-xl space-y-2">
              <h4 className="font-bold text-violet-400 mb-2 font-display">Destructive Interference</h4>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">Occurs when the path difference &Delta;<Var>r</Var> is a half-integer multiple of the wavelength.</p>
              <div className="text-sm font-serif text-center text-white/80 font-bold tracking-widest">&Delta;<Var>r</Var> = ( <Var>n</Var> + <MathFrac num="1" den="2" /> )λ</div>
            </div>
          </div>
        </section>

        <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5">
          <h3 className="text-xl font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-primary/50" /> 
            3. Wave Energy & Visualization
          </h3>
          <p className="text-white/70 leading-relaxed">
            The way waves are observed depends on whether we measure their immediate displacement or their time-averaged energy. The visualization engine provides multiple rendering modes to study these properties:
          </p>
          <ul className="space-y-4 text-sm text-white/60">
            <li className="bg-white/5 p-4 rounded-xl border border-white/5">
              <strong className="text-cyan-400 text-base mb-1 block">Displacement Mode</strong>
              Plots the instantaneous net wave height <Var>z</Var><Sub>net</Sub>. Positive peaks (crests) and negative peaks (troughs) alternate over time.
            </li>
            <li className="bg-white/5 p-4 rounded-xl border border-white/5">
              <strong className="text-amber-400 text-base mb-1 block">Intensity Mode</strong>
              Plots the energy density. Wave intensity <Var>I</Var> is proportional to the square of the amplitude: 
              <div className="font-serif text-white/80 my-3 text-center text-base"><Var>I</Var> &propto; <Var>A</Var><Sup>2</Sup></div>
              In regions of constructive interference, the intensity is four times that of a single source (4<Var>A</Var><Sup>2</Sup>), whereas destructive regions have zero intensity.
            </li>
            <li className="bg-white/5 p-4 rounded-xl border border-white/5">
              <strong className="text-rose-400 text-base mb-1 block">Phase Mode</strong>
              Visualizes the continuous spatial evolution of the wave's phase angle using a complex sum to map the local phase to a continuous color spectrum.
            </li>
          </ul>
        </section>

        <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
             <span className="w-32 h-32 text-cyan-500 rounded-full bg-cyan-500/20 block blur-3xl" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-3 relative z-10">
            <span className="w-6 h-[2px] bg-cyan-400/50" /> 
            4. Scientific Telemetry & Interactive Probing
          </h3>
          <p className="text-white/70 leading-relaxed relative z-10">
            This laboratory is designed as a fully computable environment. The new <strong>Scientific Telemetry</strong> and <strong>Interactive Probing</strong> systems connect mathematical abstraction directly to visual phenomena in real-time.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60 relative z-10">
            <li className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors">
              <strong className="text-cyan-400 text-base mb-2 block font-bold tracking-widest uppercase">Live Wave Equation Engine</strong>
              The sidebar telemetry tracks the live state of the simulation, computing dynamic variables such as angular frequency <Var>ω</Var>, wave number <Var>k</Var>, and the resulting interference topology (Nodal/Antinodal counts). Modifying any slider updates the governing super-position equation instantly.
            </li>
            <li className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
              <strong className="text-emerald-400 text-base mb-2 block font-bold tracking-widest uppercase">Cursor Physics Inspector</strong>
              Hovering over the WebGL simulation canvas turns your cursor into a mathematical probe. It calculates the physical distances from both sources (<Var>r</Var><Sub>1</Sub>, <Var>r</Var><Sub>2</Sub>), exact path difference (&Delta;<Var>r</Var>), and local displacement (<Var>z</Var>), automatically identifying whether you are hovering over a Constructive or Destructive superposition region.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};


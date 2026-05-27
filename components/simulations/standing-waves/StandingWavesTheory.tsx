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
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-emerald-400 font-black z-10 shadow-sm">{label}</div>}
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

export const StandingWavesTheory = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 text-white">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Theoretical Framework
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
          Wave Mechanics & <span className="text-emerald-400">Resonance Theory</span>
        </h2>
        <p className="text-base text-white/50 leading-relaxed max-w-3xl">
          An advanced university-level exploration of standing wave physics, boundary conditions, characteristic impedance, acoustic pressure transformations, 2D Chladni membranes, and discrete coupled normal modes.
        </p>
      </header>

      {/* 1. Superposition */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
           <span className="w-32 h-32 text-emerald-500 rounded-full bg-emerald-500/20 block blur-3xl" />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          1. Superposition of Counter-Propagating Waves
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          A standing wave is not a separate physical wave form, but rather the steady-state interference pattern resulting from the superposition of two identical traveling waves propagating in opposite directions:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-serif text-sm relative z-10">
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
            <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider font-sans">Right-Traveling Wave</span>
            <span className="text-cyan-400 font-bold"><Var className="text-cyan-400">y</Var><Sub>1</Sub>(<Var className="text-cyan-400">x</Var>,<Var className="text-cyan-400">t</Var>) = <Var className="text-cyan-400">A e</Var><Sup>−βt</Sup> sin(<Var className="text-cyan-400">kx − ωt</Var>)</span>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
            <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider font-sans">Left-Traveling Wave</span>
            <span className="text-rose-400 font-bold"><Var className="text-rose-400">y</Var><Sub>2</Sub>(<Var className="text-rose-400">x</Var>,<Var className="text-rose-400">t</Var>) = <Var className="text-rose-400">A e</Var><Sup>−βt</Sup> sin(<Var className="text-rose-400">kx + ωt</Var>)</span>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          By applying the trigonometric sum-to-product identity, <span className="font-serif italic text-slate-200">sin(α) + sin(β) = 2 sin((α+β)/2) cos((α-β)/2)</span>, the combined displacement <span className="font-serif italic text-slate-200">y(x,t) = y₁ + y₂</span> is:
        </p>
        <MathEq block label="Superposition Formula">
          <Var>y</Var>(<Var>x</Var>,<Var>t</Var>) = 2<Var>A e</Var><Sup>−βt</Sup> sin(<Var>kx</Var>) cos(<Var>ωt</Var>)
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Here, the spatial dependent part <Var>sin(kx)</Var> represents the wave envelope (amplitude envelope), while the time dependent part <Var>cos(ωt)</Var> represents temporal oscillation. The phase terms <Var>kx</Var> and <Var>ωt</Var> are completely decoupled. Consequently, the nodes (zeros) and antinodes (peaks) remain fixed in space, and the wave oscillates in place without moving energy along the medium.
        </p>
      </section>

      {/* 2. Boundary Conditions */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          2. Boundary Conditions & Mechanical Impedance
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Boundaries constrain wave propagation by forcing specific value requirements at the ends of the medium. We define the characteristic mechanical impedance of the string as:
        </p>
        <MathEq block label="Mechanical Impedance">
          <Var>Z</Var><Sub>1</Sub> = &radic;(<Var>T</Var> &middot; &mu;) &nbsp;&nbsp; [kg/s]
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          When a wave encounters an arbitrary boundary terminated by a mechanical load of impedance <Var>Z</Var><Sub>2</Sub>, it undergoes partial reflection. The reflection coefficient <Var>R</Var> is governed by the impedance mismatch:
        </p>
        <MathEq block label="Reflection Coefficient">
          <Var>R</Var> = <MathFrac num={<>Z<Sub>2</Sub> − Z<Sub>1</Sub></>} den={<>Z<Sub>2</Sub> + Z<Sub>1</Sub></>} />
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          We identify four key boundary conditions for a medium of length <Var>L</Var>:
        </p>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-xs font-serif text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-white/5 text-white/80 font-sans uppercase tracking-wider text-[10px]">
                <th className="p-3 border border-white/10">Type</th>
                <th className="p-3 border border-white/10">Math Boundary Condition</th>
                <th className="p-3 border border-white/10">Allowed Wavelength (λ<Sub>n</Sub>)</th>
                <th className="p-3 border border-white/10">Harmonic Series</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-white/10 font-bold font-sans text-white">Fixed-Fixed</td>
                <td className="p-3 border border-white/10"><Var>y</Var>(0,<Var>t</Var>) = 0, <Var>y</Var>(<Var>L</Var>,<Var>t</Var>) = 0</td>
                <td className="p-3 border border-white/10"><MathFrac num={<>2<Var>L</Var></>} den={<Var>n</Var>} /></td>
                <td className="p-3 border border-white/10"><Var>n</Var> = 1, 2, 3, 4,...</td>
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="p-3 border border-white/10 font-bold font-sans text-white">Free-Free</td>
                <td className="p-3 border border-white/10"><MathFrac num={<>&part;<Var>y</Var></>} den={<>&part;<Var>x</Var></>} /> |<Sub><Var>x</Var>=0,<Var>L</Var></Sub> = 0</td>
                <td className="p-3 border border-white/10"><MathFrac num={<>2<Var>L</Var></>} den={<Var>n</Var>} /></td>
                <td className="p-3 border border-white/10"><Var>n</Var> = 1, 2, 3, 4,...</td>
              </tr>
              <tr>
                <td className="p-3 border border-white/10 font-bold font-sans text-white">Fixed-Free</td>
                <td className="p-3 border border-white/10"><Var>y</Var>(0,<Var>t</Var>) = 0, <MathFrac num={<>&part;<Var>y</Var></>} den={<>&part;<Var>x</Var></>} /> |<Sub><Var>x</Var>=<Var>L</Var></Sub> = 0</td>
                <td className="p-3 border border-white/10"><MathFrac num={<>4<Var>L</Var></>} den={<Var>n</Var>} /></td>
                <td className="p-3 border border-white/10"><Var>n</Var> = 1, 3, 5, 7,... (odd only)</td>
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="p-3 border border-white/10 font-bold font-sans text-white">Partial Impedance</td>
                <td className="p-3 border border-white/10"><Var>T</Var> <MathFrac num={<>&part;<Var>y</Var></>} den={<>&part;<Var>x</Var></>} /> |<Sub><Var>x</Var>=<Var>L</Var></Sub> = −<Var>Z</Var><Sub>2</Sub> <MathFrac num={<>&part;<Var>y</Var></>} den={<>&part;<Var>t</Var></>} /></td>
                <td className="p-3 border border-white/10">Non-integral spectrum</td>
                <td className="p-3 border border-white/10">Continuous wave leakage</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Air Columns */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          3. Acoustic Air Column Resonance
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Resonance in air columns (such as organ pipes or wind instruments) is described by longitudinal sound pressure waves. Unlike strings where displacement is transverse, air column waves oscillate parallel to the direction of propagation.
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          There is a fundamental 90° spatial phase shift between air particle displacement wave <Var>s</Var>(<Var>x</Var>,<Var>t</Var>) and pressure deviation wave <Var>p</Var>(<Var>x</Var>,<Var>t</Var>). The acoustic pressure variation is related to the spatial derivative of displacement via the bulk modulus <Var>B</Var> of air:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-serif text-cyan-400 text-lg font-bold tracking-wider my-4 relative z-10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-white/5 pb-2">
            <span><Var>s</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>s</Var><Sub>0</Sub> sin(<Var>kx</Var>) cos(<Var>ωt</Var>)</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-sans font-normal">[Displacement]</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-rose-400">
            <span><Var>p</Var>(<Var>x</Var>,<Var>t</Var>) = −<Var>B</Var> <MathFrac num={<>&part;s</>} den={<>&part;x</>} /> = −<Var>B k s</Var><Sub>0</Sub> cos(<Var>kx</Var>) cos(<Var>ωt</Var>)</span>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-sans font-normal">[Pressure]</span>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-sans text-xs">
          Consequently:
          <br />• At an <strong>open end</strong>: Air particles are free to move, producing a <strong>displacement antinode</strong>. Because it is exposed to the atmosphere, the pressure must remain at ambient pressure, forming a <strong>pressure node</strong>.
          <br />• At a <strong>closed end</strong>: Air particles are blocked by a rigid wall, producing a <strong>displacement node</strong>. The compression of air against the wall generates a maximum pressure fluctuation, forming a <strong>pressure antinode</strong>.
        </p>
      </section>

      {/* 4. 2D Membranes & Chladni */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          4. 2D Membranes and Chladni Sand Formations
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          A 2D flexible membrane (drumhead) vibrates according to the 2D wave equation:
        </p>
        <MathEq block label="2D Wave Equation">
          <MathFrac num={<>&part;<Sup>2</Sup><Var>z</Var></>} den={<>&part;<Var>t</Var><Sup>2</Sup></>} /> = <Var>v</Var><Sup>2</Sup> ( <MathFrac num={<>&part;<Sup>2</Sup><Var>z</Var></>} den={<>&part;<Var>x</Var><Sup>2</Sup></>} /> + <MathFrac num={<>&part;<Sup>2</Sup><Var>z</Var></>} den={<>&part;<Var>y</Var><Sup>2</Sup></>} /> )
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          For a circular membrane of radius <Var>a</Var> clamped at the boundary (<Var>z</Var>(<Var>a</Var>, &theta;) = 0), the normal modes are described in polar coordinates using Bessel functions of the first kind:
        </p>
        <MathEq block label="Circular Membrane Modes">
          <Var>z</Var>(<Var>r</Var>, &theta;, <Var>t</Var>) = <Var>A</Var> &middot; <Var>J</Var><Sub>m</Sub>(<Var>k</Var><Sub>mn</Sub><Var>r</Var>) cos(<Var>m</Var>&theta;) cos(ω<Sub>mn</Sub><Var>t</Var>)
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Where <Var>J</Var><Sub>m</Sub> is the Bessel function of order <Var>m</Var>, and <Var>k</Var><Sub>mn</Sub> = <Var>x</Var><Sub>mn</Sub> / <Var>a</Var>, with <Var>x</Var><Sub>mn</Sub> representing the <Var>n</Var>-th zero of <Var>J</Var><Sub>m</Sub>(<Var>x</Var>).
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-bold text-amber-400">
          Physics of Chladni Sand Patterns:
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          When the membrane is driven into resonance, its local vertical acceleration oscillates as <Var>a</Var><Sub>z</Sub>(<Var>x</Var>,<Var>y</Var>,<Var>t</Var>) = −&omega;<Sup>2</Sup> <Var>z</Var>(<Var>x</Var>,<Var>y</Var>,<Var>t</Var>). Sand particles placed on the membrane will bounce violently when the peak vertical acceleration exceeds gravity (&omega;<Sup>2</Sup> |<Var>z</Var>(<Var>x</Var>,<Var>y</Var>)| &gt; <Var>g</Var>). 
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          As a particle lands, it receives a random kinetic kick that shifts its position laterally. However, in regions near the <strong>nodal lines</strong> where the displacement amplitude is zero (<Var>z</Var>(<Var>x</Var>,<Var>y</Var>) &approx; 0), the acceleration is less than gravity. The particle remains stationary here. Over time, sand migrates away from high-acceleration regions and settles exclusively on the nodal lines, drawing the mode's spatial geometry.
        </p>
      </section>

      {/* 5. Coupled Oscillators */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          5. Coupled Oscillators and the Continuous Limit
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          A continuous string can be mathematically modeled as the limit of a series of discrete coupled mass oscillators. Consider a chain of <Var>N</Var> identical beads of mass <Var>m</Var> separated by spacing <Var>dx</Var>, under uniform tension <Var>T</Var>.
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Applying Newton's second law to the transverse displacement <Var>y</Var><Sub><Var>i</Var></Sub> of the <Var>i</Var>-th bead:
        </p>
        <MathEq block label="Bead Equation of Motion">
          <Var>m</Var> <MathFrac num={<>d<Sup>2</Sup><Var>y</Var><Sub><Var>i</Var></Sub></>} den={<>d<Var>t</Var><Sup>2</Sup></>} /> = <Var>T</Var> &middot; [ <MathFrac num={<><Var>y</Var><Sub><Var>i</Var>+1</Sub> − <Var>y</Var><Sub><Var>i</Var></Sub></>} den="dx" /> − <MathFrac num={<><Var>y</Var><Sub><Var>i</Var></Sub> − <Var>y</Var><Sub><Var>i</Var>−1</Sub></>} den="dx" /> ] − <Var>b</Var> <MathFrac num={<>d<Var>y</Var><Sub><Var>i</Var></Sub></>} den="dt" />
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Dividing by mass <Var>m</Var> = &mu; <Var>dx</Var>:
        </p>
        <MathEq block label="Continuous Limit Differential Step">
          <MathFrac num={<>d<Sup>2</Sup><Var>y</Var><Sub><Var>i</Var></Sub></>} den={<>d<Var>t</Var><Sup>2</Sup></>} /> = ( <MathFrac num={<Var>T</Var>} den="&mu;" /> ) &middot; [ <MathFrac num={<><Var>y</Var><Sub><Var>i</Var>+1</Sub> − 2<Var>y</Var><Sub><Var>i</Var></Sub> + <Var>y</Var><Sub><Var>i</Var>−1</Sub></>} den="dx²" /> ] − ( <MathFrac num="b" den={<>&mu; dx</>} /> ) <MathFrac num={<>d<Var>y</Var><Sub><Var>i</Var></Sub></>} den="dt" />
        </MathEq>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-sans">
          As the number of beads <Var>N</Var> &rarr; &infin; and the spacing <Var>dx</Var> &rarr; 0, the finite difference term becomes the partial spatial derivative <MathFrac num={<>&part;<Sup>2</Sup><Var>y</Var></>} den={<>&part;<Var>x</Var><Sup>2</Sup></>} />, recovering the continuous classical wave equation. By offering a discrete bead-spring visualization, we highlight this fundamental relationship between finite degrees of freedom and continuous wave fields.
        </p>
      </section>

      {/* 6. Real World Connections */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-tight text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          6. Real-World Physical Applications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm">
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <h4 className="font-bold text-emerald-400 mb-2 font-display">Acoustic String Instruments</h4>
            <p className="text-white/50 leading-relaxed text-xs">
              Guitars, violins, and pianos utilize fixed boundary strings. The mechanical energy of the vibrating string couples through the bridge into the instrument body, which acts as a 3D resonant cavity to radiate sound.
            </p>
          </div>
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <h4 className="font-bold text-emerald-400 mb-2 font-display">Woodwinds and Pipe Organs</h4>
            <p className="text-white/50 leading-relaxed text-xs">
              Organ pipes use air resonance columns. Cylindrical pipes open at both ends produce all harmonics, while closed-end pipes produce only odd harmonics, creating a distinctively hollow, darker acoustic tone.
            </p>
          </div>
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <h4 className="font-bold text-emerald-400 mb-2 font-display">Laser Resonant Cavities</h4>
            <p className="text-white/50 leading-relaxed text-xs">
              An optical laser cavity uses highly reflective mirrors as boundaries to trap electromagnetic waves. Light waves interfere constructively to form stable optical standing waves, amplifying specific resonant frequencies.
            </p>
          </div>
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-colors">
            <h4 className="font-bold text-emerald-400 mb-2 font-display">Structural Resonance (Bridges)</h4>
            <p className="text-white/50 leading-relaxed text-xs">
              Suspension bridges act as large mechanical resonance lines. Steady crosswinds can cause vortex shedding that matches the bridge's natural torsional modes, creating catastrophic dynamic load failures (e.g., Tacoma Narrows).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};


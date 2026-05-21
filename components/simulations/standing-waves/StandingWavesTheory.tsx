import React from "react";

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-mono text-xs relative z-10">
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
            <span className="text-white/40 block mb-1">Right-Traveling Wave</span>
            <span className="text-cyan-400 font-bold">y₁(x,t) = A e<sup>-βt</sup> sin(kx - ωt)</span>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
            <span className="text-white/40 block mb-1">Left-Traveling Wave</span>
            <span className="text-rose-400 font-bold">y₂(x,t) = A e<sup>-βt</sup> sin(kx + ωt)</span>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          By applying the trigonometric sum-to-product identity, <span className="font-serif italic">sin(α) + sin(β) = 2 sin((α+β)/2) cos((α-β)/2)</span>, the combined displacement <span className="font-serif italic">y(x,t) = y₁ + y₂</span> is:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-lg font-bold tracking-wider my-4 relative z-10">
          y(x,t) = 2A e<sup>-βt</sup> sin(kx) cos(ωt)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Here, the spatial dependent part <span className="font-serif italic">sin(kx)</span> represents the wave envelope (amplitude envelope), while the time dependent part <span className="font-serif italic">cos(ωt)</span> represents temporal oscillation. The phase terms <span className="font-serif italic">kx</span> and <span className="font-serif italic">ωt</span> are completely decoupled. Consequently, the nodes (zeros) and antinodes (peaks) remain fixed in space, and the wave oscillates in place without moving energy along the medium.
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
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 my-3">
          Z₁ = &radic;(T &middot; &mu;) &nbsp; [kg/s]
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          When a wave encounters an arbitrary boundary terminated by a mechanical load of impedance <span className="font-serif italic">Z<sub>2</sub></span>, it undergoes partial reflection. The reflection coefficient <span className="font-serif italic">R</span> is governed by the impedance mismatch:
        </p>
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-cyan-400 font-bold my-3">
          R = (Z<sub>2</sub> - Z₁) / (Z<sub>2</sub> + Z₁)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          We identify four key boundary conditions for a medium of length <span className="font-serif italic">L</span>:
        </p>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-xs font-mono text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-white/5 text-white/80">
                <th className="p-3 border border-white/10">Type</th>
                <th className="p-3 border border-white/10">Math Boundary Condition</th>
                <th className="p-3 border border-white/10">Allowed Wavelength (&lambda;<sub>n</sub>)</th>
                <th className="p-3 border border-white/10">Harmonic Series</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-white/10 font-bold text-white">Fixed-Fixed</td>
                <td className="p-3 border border-white/10">y(0,t) = 0, y(L,t) = 0</td>
                <td className="p-3 border border-white/10">2L / n</td>
                <td className="p-3 border border-white/10">n = 1, 2, 3, 4,...</td>
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="p-3 border border-white/10 font-bold text-white">Free-Free</td>
                <td className="p-3 border border-white/10">&part;y/&part;x |<sub>x=0,L</sub> = 0</td>
                <td className="p-3 border border-white/10">2L / n</td>
                <td className="p-3 border border-white/10">n = 1, 2, 3, 4,...</td>
              </tr>
              <tr>
                <td className="p-3 border border-white/10 font-bold text-white">Fixed-Free</td>
                <td className="p-3 border border-white/10">y(0,t) = 0, &part;y/&part;x |<sub>x=L</sub> = 0</td>
                <td className="p-3 border border-white/10">4L / n</td>
                <td className="p-3 border border-white/10">n = 1, 3, 5, 7,... (odd only)</td>
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="p-3 border border-white/10 font-bold text-white">Partial Impedance</td>
                <td className="p-3 border border-white/10">T &part;y/&part;x |<sub>x=L</sub> = -Z<sub>2</sub> &part;y/&part;t</td>
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
          There is a fundamental 90&deg; spatial phase shift between air particle displacement wave <span className="font-serif italic">s(x,t)</span> and pressure deviation wave <span className="font-serif italic">p(x,t)</span>. The acoustic pressure variation is related to the spatial derivative of displacement via the bulk modulus <span className="font-serif italic">B</span> of air:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-cyan-400 text-lg font-bold tracking-wider my-4 relative z-10 flex flex-col gap-2">
          <span>s(x,t) = s₀ sin(kx) cos(ωt) &nbsp; [Displacement]</span>
          <span className="text-rose-400">p(x,t) = -B &part;s/&part;x = -B k s₀ cos(kx) cos(ωt) &nbsp; [Pressure]</span>
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
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
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 my-3">
          &part;²z/&part;t² = v² (&part;²z/&part;x² + &part;²z/&part;y²)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          For a circular membrane of radius <span className="font-serif italic">a</span> clamped at the boundary (<span className="font-serif italic">z(a, &theta;) = 0</span>), the normal modes are described in polar coordinates using Bessel functions of the first kind:
        </p>
        <div className="p-5 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-cyan-400 text-sm font-bold tracking-wider my-4 relative z-10">
          z(r, &theta;, t) = A &middot; J<sub>m</sub>(k<sub>mn</sub> r) &middot; cos(m &theta;) &middot; cos(&omega;<sub>mn</sub> t)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Where <span className="font-serif italic">J<sub>m</sub></span> is the Bessel function of order <span className="font-serif italic">m</span>, and <span className="font-serif italic">k<sub>mn</sub> = x<sub>mn</sub> / a</span>, with <span className="font-serif italic">x<sub>mn</sub></span> representing the <span className="font-serif italic">n</span>-th zero of <span className="font-serif italic">J<sub>m</sub>(x)</span>.
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-bold text-amber-400">
          Physics of Chladni Sand Patterns:
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          When the membrane is driven into resonance, its local vertical acceleration oscillates as <span className="font-serif italic">a<sub>z</sub>(x,y,t) = -&omega;² z(x,y,t)</span>. Sand particles placed on the membrane will bounce violently when the peak vertical acceleration exceeds gravity (<span className="font-serif italic">&omega;² |z(x,y)| &gt; g</span>). 
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          As a particle lands, it receives a random kinetic kick that shifts its position laterally. However, in regions near the <strong>nodal lines</strong> where the displacement amplitude is zero (<span className="font-serif italic">z(x,y) &approx; 0</span>), the acceleration is less than gravity. The particle remains stationary here. Over time, sand migrates away from high-acceleration regions and settles exclusively on the nodal lines, drawing the mode's spatial geometry.
        </p>
      </section>

      {/* 5. Coupled Oscillators */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          5. Coupled Oscillators and the Continuous Limit
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          A continuous string can be mathematically modeled as the limit of a series of discrete coupled mass oscillators. Consider a chain of <span className="font-serif italic">N</span> identical beads of mass <span className="font-serif italic">m</span> separated by spacing <span className="font-serif italic">dx</span>, under uniform tension <span className="font-serif italic">T</span>.
        </p>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Applying Newton's second law to the transverse displacement <span className="font-serif italic">y<sub>i</sub></span> of the <span className="font-serif italic">i</span>-th bead:
        </p>
        <div className="p-5 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-rose-400 text-sm font-bold tracking-wider my-4 relative z-10">
          m d²y<sub>i</sub>/dt² = T &middot; [ (y<sub>i+1</sub> - y<sub>i</sub>)/dx - (y<sub>i</sub> - y<sub>i-1</sub>)/dx ] - b dy<sub>i</sub>/dt
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          Dividing by mass <span className="font-serif italic">m = &mu; dx</span>:
        </p>
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 my-3">
          d²y<sub>i</sub>/dt² = (T / &mu;) &middot; [ (y<sub>i+1</sub> - 2y<sub>i</sub> + y<sub>i-1</sub>) / dx² ] - (b / &mu; dx) dy<sub>i</sub>/dt
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10">
          As the number of beads <span className="font-serif italic">N &rarr; &infin;</span> and the spacing <span className="font-serif italic">dx &rarr; 0</span>, the finite difference term becomes the partial spatial derivative <span className="font-serif italic">&part;²y/&part;x²</span>, recovering the continuous classical wave equation. By offering a discrete bead-spring visualization, we highlight this fundamental relationship between finite degrees of freedom and continuous wave fields.
        </p>
      </section>

      {/* 6. Real World Connections */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
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

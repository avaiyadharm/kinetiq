import React from "react";

export const StandingWavesTheory = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 text-white">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Theoretical Framework
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-display">Standing Waves & Resonance</h2>
        <p className="text-lg text-white/60 leading-relaxed max-w-2xl">
          A rigorous analysis of wave superposition, boundary conditions, and the emergence of resonant harmonic modes in bounded continuous media.
        </p>
      </header>

      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
           <span className="w-32 h-32 text-emerald-500 rounded-full bg-emerald-500/20 block blur-3xl" />
        </div>
        <h3 className="text-xl font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          1. Superposition of Counter-Propagating Waves
        </h3>
        <p className="text-white/70 leading-relaxed relative z-10">
          A standing wave emerges when two continuous harmonic waves of identical frequency (\( f \)) and amplitude (\( A \)) propagate in opposite directions through the same medium.
        </p>
        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto text-center font-mono text-white/80 font-bold tracking-widest relative z-10">
          <div className="text-cyan-400">y₁(x,t) = A sin(kx - ωt)</div>
          <div className="text-rose-400 mt-2">y₂(x,t) = A sin(kx + ωt)</div>
        </div>
        <p className="text-white/70 leading-relaxed relative z-10">
          By the Principle of Superposition, the resultant displacement \( y(x,t) \) is their algebraic sum. Applying the trigonometric identity for the sum of sines:
        </p>
        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto text-center font-mono text-emerald-400 text-xl font-bold tracking-widest relative z-10">
          y(x,t) = 2A sin(kx) cos(ωt)
        </div>
        <p className="text-white/70 leading-relaxed relative z-10">
          This equation factors cleanly into a spatial term, \( 2A \sin(kx) \), and a temporal term, \( \cos(\omega t) \). Unlike traveling waves, the phase argument \( (kx \pm \omega t) \) is absent. This implies the wave profile does not propagate spatially; it simply oscillates in place.
        </p>
      </section>

      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-xl font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          2. Nodes, Antinodes, and Energy
        </h3>
        <p className="text-white/70 leading-relaxed relative z-10">
          The spatial envelope function determines the local amplitude of oscillation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-colors">
            <h4 className="text-rose-400 font-bold uppercase tracking-widest mb-2 text-sm">Nodes (Zero Displacement)</h4>
            <p className="text-white/60 text-sm mb-3">
              Locations where the spatial envelope equals zero continuously. This occurs due to perfect destructive interference at all times.
            </p>
            <div className="font-mono text-xs text-center p-3 bg-white/5 rounded-lg text-white/80">sin(kx) = 0 → x = n(λ/2)</div>
          </div>
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors">
            <h4 className="text-cyan-400 font-bold uppercase tracking-widest mb-2 text-sm">Antinodes (Max Displacement)</h4>
            <p className="text-white/60 text-sm mb-3">
              Locations where the spatial envelope is maximized. This occurs due to perfect constructive interference.
            </p>
            <div className="font-mono text-xs text-center p-3 bg-white/5 rounded-lg text-white/80">sin(kx) = ±1 → x = (2n+1)(λ/4)</div>
          </div>
        </div>
        <p className="text-white/70 leading-relaxed mt-4 relative z-10">
          <strong>Energy Flow:</strong> In a perfect standing wave, there is zero net transport of energy across any node. Energy remains completely trapped between adjacent nodes, oscillating smoothly between local Kinetic Energy (when passing through equilibrium) and local Potential Energy (at maximum displacement).
        </p>
      </section>

      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-xl font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          3. Boundary Conditions & Resonance
        </h3>
        <p className="text-white/70 leading-relaxed relative z-10">
          A standing wave can only be sustained if its wavelength satisfies the geometric constraints of the medium's boundaries. This quantization restricts the allowed modes of vibration to specific <strong>Harmonics</strong> (\( n \)).
        </p>
        <ul className="space-y-4 text-sm text-white/60 relative z-10">
          <li className="bg-white/5 p-4 rounded-xl border border-white/5">
            <strong className="text-emerald-400 text-base mb-1 block">Fixed-Fixed Boundaries (String, Open Pipe)</strong>
            Displacement must be zero at both ends. \( y(0) = y(L) = 0 \). <br/>
            Resulting wavelength: <strong>\( L = n \lambda / 2 \)</strong> (where \( n = 1, 2, 3... \))
          </li>
          <li className="bg-white/5 p-4 rounded-xl border border-white/5">
            <strong className="text-emerald-400 text-base mb-1 block">Free-Free Boundaries (Open Air Column)</strong>
            Slope (strain) must be zero at both ends. \( y'(0) = y'(L) = 0 \). <br/>
            Resulting wavelength: <strong>\( L = n \lambda / 2 \)</strong>. While the wavelength math matches Fixed-Fixed, the spatial profile shifts by a quarter-wave (antinodes at ends).
          </li>
          <li className="bg-white/5 p-4 rounded-xl border border-white/5">
            <strong className="text-emerald-400 text-base mb-1 block">Fixed-Free Boundaries (Closed Pipe)</strong>
            One node and one antinode at the boundaries. \( y(0) = 0, y'(L) = 0 \). <br/>
            Resulting wavelength: <strong>\( L = (2n-1) \lambda / 4 \)</strong>. Only odd harmonics exist.
          </li>
        </ul>
        <div className="mt-4 p-5 border border-amber-500/30 bg-amber-500/5 rounded-xl relative z-10">
          <h4 className="font-bold text-amber-400 mb-2 uppercase tracking-widest text-sm">Resonant Frequencies</h4>
          <p className="text-sm text-white/60 mb-3">Since wave speed \( v = f \lambda \), the allowed frequencies for a fixed-fixed system are linearly quantized:</p>
          <div className="text-lg font-mono text-center text-amber-400 font-bold tracking-widest">fₙ = n(v / 2L)</div>
        </div>
      </section>
    </div>
  );
};

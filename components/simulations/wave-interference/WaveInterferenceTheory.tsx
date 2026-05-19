import React from "react";

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
          <p className="text-lg text-white/60 leading-relaxed max-w-2xl">
            A rigorous analysis of wave propagation, the principle of superposition, and the mathematics governing constructive and destructive interference in two dimensions.
          </p>
        </header>

        <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5">
          <h3 className="text-xl font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-3">
            <span className="w-6 h-[2px] bg-primary/50" /> 
            1. The Wave Equation
          </h3>
          <p className="text-white/70 leading-relaxed">
            A spherical wave emitted from a point source can be described by a scalar function representing the displacement (or pressure) at distance \( r \) and time \( t \). Including spatial attenuation, the wave amplitude is given by:
          </p>
          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto text-center font-mono text-emerald-400 text-xl font-bold tracking-widest">
            z(r, t) = (A₀ / √r) · sin(kr - ωt + φ₀)
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white">k (wavenumber)</strong> = \( 2\\pi / \\lambda \)</li>
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white">ω (angular freq)</strong> = 2πf</li>
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white">\(r\)</strong> = Radial distance from source</li>
            <li className="flex items-center gap-2 bg-white/5 p-3 rounded-lg"><strong className="text-white">A₀</strong> = Initial source amplitude</li>
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
          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto text-center font-mono text-cyan-400 text-xl font-bold tracking-widest">
            z_net(x, y, t) = z₁(r₁, t) + z₂(r₂, t)
          </div>
          <p className="text-white/70 leading-relaxed">
            The phase difference Δφ at a point P determines the nature of interference. Assuming sources are in phase initially:
          </p>
          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto text-center font-mono text-violet-400 text-xl font-bold tracking-widest">
            Δφ = k(r₂ - r₁) = (2π / λ) · Δr
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-xl">
              <h4 className="font-bold text-emerald-400 mb-2">Constructive Interference</h4>
              <p className="text-sm text-white/60 mb-3">Occurs when the path difference Δr is an integer multiple of the wavelength.</p>
              <div className="text-sm font-mono text-center text-white/80 font-bold tracking-widest">Δr = nλ (n = 0, 1, 2, ...)</div>
            </div>
            <div className="p-5 border border-violet-500/30 bg-violet-500/5 rounded-xl">
              <h4 className="font-bold text-violet-400 mb-2">Destructive Interference</h4>
              <p className="text-sm text-white/60 mb-3">Occurs when the path difference Δr is a half-integer multiple of the wavelength.</p>
              <div className="text-sm font-mono text-center text-white/80 font-bold tracking-widest">Δr = (n + ½)λ</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

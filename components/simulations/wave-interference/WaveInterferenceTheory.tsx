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
              Plots the instantaneous net wave height z_net. Positive peaks (crests) and negative peaks (troughs) alternate over time.
            </li>
            <li className="bg-white/5 p-4 rounded-xl border border-white/5">
              <strong className="text-amber-400 text-base mb-1 block">Intensity Mode</strong>
              Plots the energy density. Wave intensity \( I \) is proportional to the square of the amplitude: 
              <div className="font-mono text-white/80 my-2 tracking-widest">I ∝ A²</div>
              In regions of constructive interference, the intensity is four times that of a single source (\( 4A^2 \)), whereas destructive regions have zero intensity.
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
              The sidebar telemetry tracks the live state of the simulation, computing dynamic variables such as angular frequency \( \omega \), wave number \( k \), and the resulting interference topology (Nodal/Antinodal counts). Modifying any slider updates the governing super-position equation instantly.
            </li>
            <li className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
              <strong className="text-emerald-400 text-base mb-2 block font-bold tracking-widest uppercase">Cursor Physics Inspector</strong>
              Hovering over the WebGL simulation canvas turns your cursor into a mathematical probe. It calculates the physical distances from both sources (\( r_1 \), \( r_2 \)), exact path difference (\( \Delta r \)), and local displacement (\( z \)), automatically identifying whether you are hovering over a Constructive or Destructive superposition region.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

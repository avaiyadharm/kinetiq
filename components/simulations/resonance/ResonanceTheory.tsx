import React from "react";

export const ResonanceTheory = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 text-white overflow-y-auto h-full px-6 pt-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Theoretical Framework
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
          Forced Oscillations & <span className="text-emerald-400">Resonance Theory</span>
        </h2>
        <p className="text-base text-white/50 leading-relaxed max-w-3xl font-body-md">
          A mathematically rigorous analysis of driven damped harmonic systems, phase lag transitions, Lorentzian power distributions, energy storage lifetimes, and quality factors.
        </p>
      </header>

      {/* 1. Governing Equation */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <span className="w-32 h-32 text-emerald-500 rounded-full bg-emerald-500/20 block blur-3xl" />
        </div>
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10 font-display-lg">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          1. The Equations of Motion
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          A physical system consisting of a mass <em>m</em> attached to a spring of constant <em>k</em> in a medium with damping coefficient <em>b</em>, subjected to a periodic driving force <em>F(t) = F₀ cos(ω t)</em>, is governed by Newton's Second Law:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-lg font-bold tracking-wider my-4 relative z-10">
          m ẍ + b ẋ + k x = F₀ cos(ω t)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          Dividing by mass <em>m</em>, we convert this into standard parameter form:
        </p>
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 my-3">
          ẍ + 2β ẋ + ω₀² x = f₀ cos(ω t)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          where:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-xs text-white/60 font-mono">
          <li><strong>ω₀ = √(k/m)</strong>: Natural angular frequency of the undamped system (rad/s)</li>
          <li><strong>β = b/(2m)</strong>: Damping factor or attenuation rate (s⁻¹)</li>
          <li><strong>f₀ = F₀/m</strong>: Driving acceleration amplitude (N/kg or m/s²)</li>
          <li><strong>ω = 2π f_d</strong>: Driving angular frequency (rad/s)</li>
        </ul>
      </section>

      {/* 2. Steady-State Amplitude & Phase */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          2. The Steady-State Solution
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          The general solution to the differential equation contains a <em>transient</em> component (which decays exponentially as e<sup>-βt</sup>) and a <em>steady-state</em> component (which oscillates at the driving frequency). After a few decay lifetimes (τ = 1/β), only the steady-state particular solution remains:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-lg font-bold tracking-wider my-4 relative z-10">
          x(t) = A(ω) cos(ω t - φ)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          By substituting this solution back into the governing equation and using trigonometric identities or complex exponential phasor arithmetic, we derive the expressions for steady-state amplitude <em>A(ω)</em> and phase angle <em>φ(ω)</em>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-mono text-xs relative z-10">
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
            <span className="text-white/40 block mb-1">Steady-State Amplitude A(ω)</span>
            <span className="text-cyan-400 font-bold text-sm">F₀ / √[ (k - mω²)² + (bω)² ]</span>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
            <span className="text-white/40 block mb-1">Phase Shift φ(ω)</span>
            <span className="text-rose-400 font-bold text-sm">arctan[ bω / (k - mω²) ]</span>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          The phase shift represents the time lag between the peak of the driving force and the peak displacement of the mass. This value transitions smoothly across three physical regimes:
        </p>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-xs font-mono text-left border-collapse border border-white/10 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-white/5 text-white/80">
                <th className="p-3 border border-white/10">Driving Frequency</th>
                <th className="p-3 border border-white/10">Phase Lag (φ)</th>
                <th className="p-3 border border-white/10">Physical Regime</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-white/10 font-bold text-white">ω ≪ ω₀ (Low Freq)</td>
                <td className="p-3 border border-white/10">φ → 0°</td>
                <td className="p-3 border border-white/10">Stiffness-dominated; mass moves in-phase with driving force.</td>
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="p-3 border border-white/10 font-bold text-white">ω = ω₀ (Resonance)</td>
                <td className="p-3 border border-white/10">φ = 90° (π/2 rad)</td>
                <td className="p-3 border border-white/10">Damping-dominated; velocity is in-phase with force, maximizing power transfer.</td>
              </tr>
              <tr>
                <td className="p-3 border border-white/10 font-bold text-white">ω ≫ ω₀ (High Freq)</td>
                <td className="p-3 border border-white/10">φ → 180° (π rad)</td>
                <td className="p-3 border border-white/10">Inertia-dominated; mass moves out-of-phase with driver.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Resonance Curve & Q-Factor */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          3. Lorentzian Resonance & Quality Factor (Q)
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          The amplitude curve displays a peak near the natural frequency. The exact peak frequency is slightly lower than the undamped frequency due to damping:
        </p>
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-white/80 my-3">
          ω_peak = √(ω₀² - 2β²)
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          The sharpness of the resonance peak is characterized by the <strong>Quality Factor (Q)</strong>. Physically, Q is defined as 2π times the ratio of energy stored to energy dissipated per cycle. Mathematically, for light damping:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-lg font-bold tracking-wider my-4 relative z-10">
          Q = ω₀ / (2β) = √(k m) / b
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          A high Q means the peak is extremely high and narrow, meaning the system is highly sensitive to frequency matches. The <strong>Full Width at Half Maximum (FWHM)</strong> of the power curve (known as half-power bandwidth Δω) relates directly to Q:
        </p>
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-cyan-400 font-bold my-3">
          Δω = ω₂ - ω₁ = ω₀ / Q
        </div>
      </section>
    </div>
  );
};

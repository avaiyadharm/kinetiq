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
          A mathematically rigorous analysis of driven damped harmonic systems, normal modes in coupled systems, nonlinear amplitude hysteresis, parametric pumping, and numerical conservation laws.
        </p>
      </header>

      {/* 1. Governing Equation */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10 font-display-lg">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          1. Equations of Motion across Regimes
        </h3>
        
        <div className="space-y-6 text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          <div>
            <h4 className="font-bold text-white mb-2">A. Single Driven Damped Harmonic Oscillator</h4>
            <p className="mb-2">A mass <em>m</em> attached to a spring of constant <em>k</em> in a viscous damping medium <em>b</em>, driven by <em>F(t) = F₀ cos(ω t)</em>, is governed by:</p>
            <div className="p-4 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-base font-bold my-2">
              m ẍ + b ẋ + k x = F₀ cos(ω t)
            </div>
            <p className="text-xs text-white/40">
              Parameter form: ẍ + 2β ẋ + ω₀² x = f₀ cos(ω t), where ω₀ = √(k/m) is the natural angular frequency and β = b/(2m) is the attenuation rate.
            </p>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="font-bold text-white mb-2">B. Coupled Oscillators (Two Degrees of Freedom)</h4>
            <p className="mb-2">Two masses $m_1$ and $m_2$ connected to anchors and linked by a coupling spring $k_{12}$. Mass 1 is driven directly:</p>
            <div className="p-4 bg-black/50 rounded-2xl border border-white/5 font-mono text-emerald-400 text-sm space-y-2 my-2">
              <div>m₁ ẍ₁ + b₁ ẋ₁ + k₁ x₁ + k₁₂ (x₁ - x₂) = F₀ cos(ω t)</div>
              <div>m₂ ẍ₂ + b₂ ẋ₂ + k₂ x₂ + k₁₂ (x₂ - x₁) = 0</div>
            </div>
            <p className="text-xs text-white/40">
              This system exhibits two normal modes of oscillation: the symmetric mode (in-phase, lower frequency) and asymmetric mode (out-of-phase, higher frequency).
            </p>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="font-bold text-white mb-2">C. Nonlinear Duffing Oscillator</h4>
            <p className="mb-2">Includes a cubic spring stiffness term $\alpha x^3$ representing structural nonlinearity (hardening spring for $\alpha &gt; 0$):</p>
            <div className="p-4 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-base font-bold my-2">
              m ẍ + b ẋ + k x + α x³ = F₀ cos(ω t)
            </div>
            <p className="text-xs text-white/40">
              The nonlinear stiffness bends the resonance peak towards higher frequencies (for α &gt; 0), causing bistability, hysteresis, and sudden amplitude jumps.
            </p>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="font-bold text-white mb-2">D. Parametric Resonance (Mathieu System)</h4>
            <p className="mb-2">The system parameters themselves vary periodically. Modulating the spring stiffness $k(t) = k_0 [1 + \epsilon \cos(2\omega t)]$ drives the system:</p>
            <div className="p-4 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-base font-bold my-2">
              m ẍ + b ẋ + k₀ [ 1 + ε cos(2ω t) ] x = 0
            </div>
            <p className="text-xs text-white/40">
              If the modulation frequency is near twice the natural frequency ($2\omega_0$), energy is pumped parametrically into the system, causing exponential growth in amplitude.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Steady-State Amplitude & Phase */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          2. Analytical Steady-State Solution
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          For a linear single driven oscillator, after the transient decay, only the steady-state particular solution remains:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-lg font-bold tracking-wider my-4 relative z-10">
          x_ss(t) = A(ω) cos(ω t - φ)
        </div>
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
          The phase shift transitions smoothly from $0^\circ$ (stiffness-dominated below resonance), through $90^\circ$ (damping-dominated exactly at resonance), to $180^\circ$ (inertia-dominated above resonance).
        </p>
      </section>

      {/* 3. Resonance Curve & Q-Factor */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          3. Quality Factor (Q) & Energy flow
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          The Quality Factor $Q$ measures the sharpness of the resonance. Physically, it is defined as:
        </p>
        <div className="p-6 bg-black/50 rounded-2xl border border-white/5 text-center font-mono text-emerald-400 text-lg font-bold tracking-wider my-4 relative z-10">
          Q = 2π × (Energy Stored / Energy Dissipated per cycle) = √(m k) / b
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          It is related to the half-power bandwidth ({"$\\Delta f = f_2 - f_1$"}) at the FWHM height {"$A_{max}/\\sqrt{2}$"} by:
        </p>
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center font-mono text-xs text-cyan-400 font-bold my-3">
          Q = f_0 / Δf
        </div>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          The instantaneous mechanical energy is the sum of kinetic and potential energy:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3 font-mono text-xs text-center">
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-white/40 block mb-1">Kinetic Energy (KE)</span>
            <span className="text-white font-bold">½ m v²</span>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-white/40 block mb-1">Potential Energy (PE)</span>
            <span className="text-white font-bold">½ k x²</span>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-white/40 block mb-1">Dissipated Power (P_diss)</span>
            <span className="text-white font-bold">b v²</span>
          </div>
        </div>
      </section>

      {/* 4. Numerical Physics Engine Integration */}
      <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
        <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-3 relative z-10">
          <span className="w-6 h-[2px] bg-emerald-400/50" /> 
          4. Integrator Algorithms & Stability
        </h3>
        <p className="text-white/70 text-sm leading-relaxed relative z-10 font-body-md">
          Simulating high-frequency resonance requires numerical stability. Antigravity-Kinetiq implements three integration schemes:
        </p>
        <div className="space-y-4 text-xs font-mono">
          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="text-emerald-400 font-bold block mb-1">Runge-Kutta 4th Order (RK4)</span>
            <p className="text-white/60">
              An explicit solver with local error $O(\Delta t^5)$. Highly accurate for smooth forces but can experience energy drift (numerical explosion) in long undamped simulations.
            </p>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="text-emerald-400 font-bold block mb-1">Symplectic Euler</span>
            <p className="text-white/60">
              A first-order geometric integrator that updates velocity implicitly, then position:
              <br /><em>{"v_{n+1} = v_n + a_n Δt"}</em>
              <br /><em>{"x_{n+1} = x_n + v_{n+1} Δt"}</em>
              <br />Preserves phase-space volume (Hamiltonian energy conservation) over infinite time.
            </p>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="text-emerald-400 font-bold block mb-1">Velocity Verlet</span>
            <p className="text-white/60">
              A second-order symplectic integrator that preserves phase-space conservation:
              <br /><em>{"x_{n+1} = x_n + v_n Δt + ½ a_n Δt²"}</em>
              <br /><em>{"v_{n+1} = v_n + ½ (a_n + a_{n+1}) Δt"}</em>
              <br />Highly stable for oscillatory systems, maintaining bounded energy errors.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

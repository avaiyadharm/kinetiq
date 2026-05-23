"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, HelpCircle, GraduationCap } from "lucide-react";

export const SoundWavesTheory: React.FC = () => {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  return (
    <div className="flex-1 p-8 bg-[#18181b] overflow-y-auto text-white">
      <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Theoretical Basis & Wave Mechanics
          </h2>
          <p className="text-xs text-white/50 mt-1">Explore the governing equations and physical principles behind acoustic wave phenomena.</p>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          {[
            { id: "beginner", label: "Beginner", icon: HelpCircle },
            { id: "intermediate", label: "Intermediate", icon: BookOpen },
            { id: "advanced", label: "Advanced", icon: GraduationCap },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setLevel(item.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  level === item.id 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-white/40 hover:text-white"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Beginner Mode */}
      {level === "beginner" && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">What is a Sound Wave?</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Unlike waves on a string or ripples on water which move up and down, <strong>sound is a longitudinal wave</strong>. 
              This means that air molecules oscillate <strong>back and forth parallel</strong> to the direction that the sound wave is traveling. 
              As sound travels through the air, it pushes molecules together in some areas and pulls them apart in others.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                <span className="text-xs font-bold text-white uppercase tracking-widest block mb-2">Compressions (High Density)</span>
                <p className="text-xs text-white/60 leading-relaxed">
                  Regions where air molecules are squeezed closely together, resulting in a higher local air pressure. In the simulation, these appear as <span className="text-red-400">red-tinted</span> zones.
                </p>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                <span className="text-xs font-bold text-white uppercase tracking-widest block mb-2">Rarefactions (Low Density)</span>
                <p className="text-xs text-white/60 leading-relaxed">
                  Regions where air molecules are spread thin, resulting in lower pressure. In the simulation, these appear as <span className="text-cyan-400">cyan-tinted</span> zones.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider font-display">How to Read the Simulation</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              The simulation shows multiple visualizations simultaneously. Here is what each element represents:
            </p>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-400 block">Solid Cyan Line = Pressure p(x,t)</strong>
                  Shows how air pressure varies along the wave at this instant. Peaks = compressions, troughs = rarefactions.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-400 block">Dashed Purple Line = Displacement {"\u03BE"}(x,t)</strong>
                  Shows how far each air molecule has moved from its equilibrium position. This is always 90{"\u00B0"} ahead of the pressure wave.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="w-3 h-3 rounded-full bg-white/60 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white/80 block">White Dots = Air Particles</strong>
                  In {'"'}Particle Oscillation{'"'} mode, dots represent air molecules. They move horizontally (parallel to wave propagation), bunching together at compressions and spreading apart at rarefactions.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider font-display">Pitch, Loudness, and Speed</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Every sound wave has core characteristics that map to how humans hear them:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-white/70">
              <li>
                <strong className="text-white">Pitch (Frequency):</strong> The rate at which the wave oscillates back and forth. More cycles per second (measured in Hertz, Hz) create a higher pitch.
              </li>
              <li>
                <strong className="text-white">Loudness (Amplitude):</strong> Measured in decibels SPL (dB SPL), this is computed as 20{"\u00B7"}log{"\u2081\u2080"}(p{"\u2098\u2099\u2098"}/p{"\u2080"}) where p{"\u2080"} = 20 {"\u00B5"}Pa is the threshold of human hearing.
              </li>
              <li>
                <strong className="text-white">Speed of Sound:</strong> How fast the energy travels through the medium. In air at room temperature, sound travels at roughly 343 meters per second. The speed depends on the medium: c = {"\u221A"}(B/{"\u03C1"}), where B is the bulk modulus and {"\u03C1"} is density.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Intermediate Mode */}
      {level === "intermediate" && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">Acoustic Variables & Wave Formulas</h3>
            <p className="text-sm text-white/80 leading-relaxed font-sans">
              To describe sound waves mathematically, we connect several interrelated quantities:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-teal-300 bg-black/40 border border-white/5 p-6 rounded-2xl">
              <div className="space-y-1.5">
                <div>Wavelength: {"\u03BB"} = c / f</div>
                <div>Angular Frequency: {"\u03C9"} = 2{"\u03C0"}f</div>
                <div>Wavenumber: k = 2{"\u03C0"} / {"\u03BB"} = {"\u03C9"}/c</div>
              </div>
              <div className="space-y-1.5">
                <div>Acoustic Impedance: Z = {"\u03C1"}{"\u00B7"}c</div>
                <div>Acoustic Intensity: I = p{"\u00B7"}v = p{"\u00B2"}{"\u2098\u2099\u2098"} / ({"\u03C1"}{"\u00B7"}c)</div>
                <div>SPL: L = 20{"\u00B7"}log{"\u2081\u2080"}(p{"\u2098\u2099\u2098"} / 20 {"\u00B5"}Pa)</div>
              </div>
            </div>
            <p className="text-xs text-white/50 italic leading-relaxed pt-2">
              Note: The decibel formula uses 20{"\u00B7"}log{"\u2081\u2080"}(p/p{"\u2080"}) for pressure ratios (not 10{"\u00B7"}log{"\u2081\u2080"} which applies to intensity ratios). The reference pressure p{"\u2080"} = 20 {"\u00B5"}Pa corresponds to the threshold of human hearing at 1 kHz.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider">Phase Relationship: Pressure vs. Displacement</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              In a traveling sound wave, pressure and displacement are always <strong>90{"\u00B0"} out of phase</strong>. This is because pressure is the spatial derivative of displacement:
            </p>
            <div className="font-mono text-xs text-cyan-300 bg-black/40 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <div>p(x,t) = -B {"\u00B7"} {"\u2202\u03BE"}/{"\u2202"}x</div>
              <div className="text-white/30">equivalently</div>
              <div>If {"\u03BE"}(x,t) = {"\u03BE\u2080"} cos(kx - {"\u03C9"}t)  then  p(x,t) = B{"\u00B7"}k{"\u00B7\u03BE\u2080"} sin(kx - {"\u03C9"}t)</div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              This means: where displacement is maximum (particles are at their farthest from equilibrium), pressure variation is zero. Where pressure is maximum (particles are most compressed), the displacement crosses zero. The cyan and purple curves on the canvas demonstrate this relationship in real time.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider">Air Column Resonance</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              When sound waves are confined in a tube, they reflect off the boundaries and superpose. This creates <strong>standing waves</strong>, but the boundary conditions dictate which resonant frequencies are allowed:
            </p>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest block">Open-Open Pipe (Both Ends Open)</span>
                <p className="text-xs text-white/70">
                  Open ends communicate with the atmosphere, so pressure is constrained to zero at both boundaries (<strong>Pressure Nodes</strong>). 
                  Since particles are free to move at open ends, these are <strong>Displacement Antinodes</strong>.
                </p>
                <div className="font-mono text-xs text-emerald-400 space-y-1">
                  <div>p(x,t) = p{"\u2080"} sin(n{"\u03C0"}x/L) cos({"\u03C9\u2099"}t)   {"\u2014"} nodes at x=0, x=L</div>
                  <div>{"\u03BE"}(x,t) = {"\u03BE\u2080"} cos(n{"\u03C0"}x/L) sin({"\u03C9\u2099"}t)   {"\u2014"} antinodes at x=0, x=L</div>
                  <div>f{"\u2099"} = n{"\u00B7"}c / (2L),  n = 1, 2, 3, 4...</div>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest block">Open-Closed Pipe (One Closed End)</span>
                <p className="text-xs text-white/70">
                  The closed wall halts molecule movement (<strong>Displacement Node = Velocity Node</strong>) and creates maximum pressure variation (<strong>Pressure Antinode</strong>). 
                  The open end remains a Pressure Node / Displacement Antinode.
                </p>
                <div className="font-mono text-xs text-emerald-400 space-y-1">
                  <div>p(x,t) = p{"\u2080"} sin(n{"\u03C0"}x/(2L)) cos({"\u03C9\u2099"}t)   {"\u2014"} node at x=0, antinode at x=L</div>
                  <div>{"\u03BE"}(x,t) = {"\u03BE\u2080"} cos(n{"\u03C0"}x/(2L)) sin({"\u03C9\u2099"}t)   {"\u2014"} antinode at x=0, node at x=L</div>
                  <div>f{"\u2099"} = n{"\u00B7"}c / (4L),  n = 1, 3, 5, 7... (odd only)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-pink-400 uppercase tracking-wider">Impedance Mismatch & Reflection</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              When a wave encounters a boundary between two different media (e.g., air to water), part of the energy is reflected and part is transmitted. The coefficients depend on the <strong>acoustic impedance</strong> ratio:
            </p>
            <div className="font-mono text-xs text-pink-300 bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
              <div>Reflection coefficient: R = (Z{"\u2082"} - Z{"\u2081"}) / (Z{"\u2082"} + Z{"\u2081"})</div>
              <div>Transmission coefficient: T = 2Z{"\u2082"} / (Z{"\u2082"} + Z{"\u2081"})</div>
              <div className="text-white/30 pt-2">Energy conservation: R{"\u00B2"} + (Z{"\u2081"}/Z{"\u2082"})T{"\u00B2"} = 1</div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              When Z{"\u2082"} {">"} Z{"\u2081"} (e.g., air to concrete), R is positive: the reflected wave is in-phase with the incident. When Z{"\u2082"} {"<"} Z{"\u2081"} (e.g., air to vacuum), R is negative: the reflected wave is inverted (180{"\u00B0"} phase flip).
            </p>
          </div>
        </div>
      )}

      {/* Advanced Mode */}
      {level === "advanced" && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">The Governing Acoustic Wave Equation</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              By combining the linearized conservation of mass (continuity equation) and linearized conservation of momentum (Euler{"\u0027"}s equation) for an inviscid, compressible fluid:
            </p>
            <div className="font-mono text-xs text-cyan-300 bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-center text-sm">{"\u2202\u00B2"}p / {"\u2202"}t{"\u00B2"} = c{"\u00B2"} {"\u2207\u00B2"}p</div>
              <div className="text-white/30 text-center">where c = {"\u221A"}(B/{"\u03C1\u2080"}) is the adiabatic speed of sound</div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              The displacement field {"\u03BE"}(x,t) and pressure field p(x,t) are linked by the constitutive relation:
            </p>
            <div className="font-mono text-xs text-cyan-300 bg-black/40 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <div>p = -B {"\u00B7"} {"\u2202\u03BE"}/{"\u2202"}x    (1D case)</div>
              <div className="text-white/30">This introduces the 90{"\u00B0"} spatial phase shift between pressure and displacement.</div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider">Acoustic Energy Transport</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Acoustic energy is transported by the instantaneous acoustic intensity vector, defined as the product of pressure and particle velocity:
            </p>
            <div className="font-mono text-xs text-emerald-300 bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="text-center">I(x,t) = p(x,t) {"\u00B7"} v(x,t)   [W/m{"\u00B2"}]</div>
              <div className="text-white/30 text-center">For a progressive plane wave: I = p{"\u00B2"}{"\u2098\u2099\u2098"} / ({"\u03C1\u2080"}c)</div>
              <div className="text-white/30 text-center pt-1">Energy density: u = p{"\u00B2"}/(2B) + {"\u00BD"}{"\u03C1\u2080"}v{"\u00B2"}</div>
              <div className="text-white/30 text-center">Potential energy + Kinetic energy per unit volume</div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              In the simulator, the {"\u0022"}Acoustic Energy Flow{"\u0022"} visualization mode renders I(x,t) as vector arrows. For a progressive wave, these always point in the propagation direction. For a standing wave, the time-averaged intensity is zero (energy oscillates back and forth without net transport).
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider">Numerical PDE Solver (1D FDTD)</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              The real-time simulator uses a central Finite Difference Time Domain (FDTD) scheme to integrate pressure oscillations over time. 
              The discretized grid updates pressure at node i and time step n+1 via:
            </p>
            <div className="font-mono text-[11px] text-emerald-300 bg-black/40 border border-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
{`p_i^(n+1) = (1 / (1 + σ·Δt/2)) × [ 2·p_i^n - (1 - σ·Δt/2)·p_i^(n-1) + C²·(p_(i+1)^n - 2·p_i^n + p_(i-1)^n) ]`}
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Where C = c{"\u00B7"}{"\u0394"}t/{"\u0394"}x is the Courant number. 
              The CFL stability condition C {"\u2264"} 1.0 must be enforced to prevent numerical blow-up. 
              Boundary absorption is implemented via Perfectly Matched Layers (PML) where the damping coefficient {"\u03C3"} ramps quadratically from zero to {"\u03C3"}{"\u2098\u2090\u2093"} within the first 25 grid nodes at each boundary.
            </p>
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs text-white/50">
              <div className="font-bold text-white/70">Grid Transparency (visible in FDTD mode):</div>
              <div>{"\u2022"} Grid nodes shown as faint tick marks along equilibrium axis</div>
              <div>{"\u2022"} PML regions shaded in faint red at domain boundaries</div>
              <div>{"\u2022"} CFL number and timestep displayed in HUD overlay</div>
              <div>{"\u2022"} Numerical dispersion: phase velocity error {"\u2248"} O(({"\u0394"}x){"\u00B2"}) for central differences</div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-pink-400 uppercase tracking-wider">Sabine Reverberation and Ray Acoustics</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              In concert halls and room acoustics, sound propagation at high frequencies can be modeled as rays. 
              The decay of energy in a diffuse acoustic field obeys Sabine{"\u0027"}s equation:
            </p>
            <div className="font-mono text-xs text-pink-300 bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              T{"\u2086\u2080"} = 0.161 {"\u00B7"} V / A
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Where V is the room volume (m{"\u00B3"}) and A = {"\u2211"} S{"\u1D62"}{"\u00B7"}{"\u03B1\u1D62"} is the total equivalent absorption area (metric Sabines). 
              The simulator computes V assuming a 3m ceiling height, and uses all 6 surfaces with the user-specified absorption coefficient {"\u03B1"}.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider">Nonlinear Acoustics & Wave Steepening</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              At high amplitudes, the assumption of linear acoustics breaks down. The local speed of sound becomes pressure-dependent:
            </p>
            <div className="font-mono text-xs text-cyan-300 bg-black/40 border border-white/5 p-4 rounded-xl text-center space-y-1">
              <div>c(p) = c{"\u2080"} (1 + {"\u03B2"} {"\u00B7"} p / B)</div>
              <div className="text-white/30">{"\u03B2"} = (1 + B/A)/2 {"\u2248"} 1.2 for air</div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              This causes compressions (high pressure) to travel faster than rarefactions, leading to <strong>wave steepening</strong> and eventually <strong>shock wave formation</strong>. The FDTD solver implements this by computing a local Courant number at each grid point based on the pressure-modified speed of sound.
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

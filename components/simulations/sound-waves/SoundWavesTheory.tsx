"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, HelpCircle, GraduationCap } from "lucide-react";

export const SoundWavesTheory: React.FC = () => {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  return (
    <div className="flex-1 p-8 bg-[#18181b] overflow-y-auto text-white space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Theoretical Basis & Wave Mechanics
          </h2>
          <p className="text-xs text-white/50 mt-1">Explore the governing equations and physical principles behind acoustic wave phenomena.</p>
        </div>

        {/* Level Selectors */}
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
        <div className="space-y-6 max-w-4xl animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">What is a Sound Wave?</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Unlike waves on a string or ripples on water which move up and down, **sound is a longitudinal wave**. 
              This means that air molecules oscillate **back and forth parallel** to the direction that the sound wave is traveling. 
              As sound travels through the air, it pushes molecules together in some areas and pulls them apart in others.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                <span className="text-xs font-bold text-white uppercase tracking-widest block mb-2">Compressions (High Density)</span>
                <p className="text-xs text-white/60 leading-relaxed">
                  Regions where air molecules are squeezed closely together, resulting in a higher local air pressure.
                </p>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                <span className="text-xs font-bold text-white uppercase tracking-widest block mb-2">Rarefactions (Low Density)</span>
                <p className="text-xs text-white/60 leading-relaxed">
                  Regions where air molecules are spread thin, resulting in lower pressure (a partial vacuum).
                </p>
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
                <strong className="text-white">Loudness (Amplitude):</strong> Measured in decibels (dB), this relates to the peak pressure level of the wave. Higher peak pressures push on our eardrums harder, creating louder sounds.
              </li>
              <li>
                <strong className="text-white">Speed of Sound:</strong> How fast the energy travels through the medium. In air at room temperature, sound travels at roughly 343 meters per second. In denser media like water, it travels much faster (around 1482 m/s).
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Intermediate Mode */}
      {level === "intermediate" && (
        <div className="space-y-6 max-w-4xl animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">Acoustic Variables & Wave Formulas</h3>
            <p className="text-sm text-white/80 leading-relaxed font-sans">
              To describe sound waves mathematically, we connect several interrelated quantities:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-teal-300 bg-black/40 border border-white/5 p-6 rounded-2xl">
              <div className="space-y-1.5">
                <div>Wavelength: λ = c / f</div>
                <div>Angular Frequency: ω = 2πf</div>
                <div>Wavenumber: k = 2π / λ</div>
              </div>
              <div className="space-y-1.5">
                <div>Acoustic Impedance: Z = ρ·c</div>
                <div>Acoustic Intensity: I = p_rms² / (ρ·c)</div>
                <div>Decibel Level: L = 10·log₁₀(I / I₀)</div>
              </div>
            </div>
            <p className="text-xs text-white/50 italic leading-relaxed pt-2">
              Where I₀ = 10⁻¹² W/m² is the universal reference threshold of human hearing, ρ is the density of the medium, and c is the speed of propagation.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider">Air Column Resonance</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              When sound waves are confined in a tube, they reflect off the boundaries and superpose. This creates **standing waves**, but the boundary conditions dictate which resonant frequencies are allowed:
            </p>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest block">Open-Open Pipe (Both Ends Open)</span>
                <p className="text-xs text-white/70">
                  Open ends must communicate with the open atmosphere, meaning pressure variation is constrained to zero (Pressure Node / Displacement Antinode). 
                  Allowed harmonics are integers: **n = 1, 2, 3, 4...**
                </p>
                <div className="font-mono text-xs text-emerald-400">f_n = n·c / (2L)</div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest block">Open-Closed Pipe (One Closed End)</span>
                <p className="text-xs text-white/70">
                  The closed wall halts molecule movement (Displacement Node / Pressure Antinode). The open end remains a pressure node.
                  Only odd harmonics are allowed: **n = 1, 3, 5, 7...**
                </p>
                <div className="font-mono text-xs text-emerald-400">f_n = n·c / (4L)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Mode */}
      {level === "advanced" && (
        <div className="space-y-6 max-w-4xl animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">The Governing Acoustic Wave Equation</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              By combining the linear conservation of mass (continuity equation) and linear conservation of momentum (Euler's equation) for an inviscid fluid:
            </p>
            <div className="font-mono text-xs text-cyan-300 bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              ∂²p / ∂t² = c² ∇²p
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Where pressure variation p relates to the adiabatic bulk modulus B and density ρ₀ via c = √(B/ρ₀). 
              The displacement field ξ(x,t) satisfies p = -B·∂ξ/∂x, which introduces the 90° spatial phase shift visible between pressure and displacement plots.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider">Numerical PDE Solver (1D FDTD)</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              The real-time simulator uses a central Finite Difference Time Domain (FDTD) scheme to integrate pressure oscillations over time. 
              The discretized grid updates pressure at node $i$ and time $n+1$ via:
            </p>
            <div className="font-mono text-[11px] text-emerald-300 bg-black/40 border border-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
p_i^(n+1) = (1 / (1 + σ·Δt/2)) * [ 2·p_i^n - (1 - σ·Δt/2)·p_i^(n-1) + C²·(p_(i+1)^n - 2·p_i^n + p_(i-1)^n) ]
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Where C = c·Δt/Δx is the Courant number. 
              To avoid numerical instability, we must satisfy the Courant-Friedrichs-Lewy (CFL) limit C ≤ 1.0. 
              Boundary absorption is enforced by ramping up the damping coefficient σ quadratically within the Perfectly Matched Layer (PML) boundary zones.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-pink-400 uppercase tracking-wider">Sabine Reverberation and Ray Acoustics</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              In concert halls and room acoustics, sound propagation can be modeled as high-frequency rays. 
              The decay of energy in a diffuse acoustic field obeys Sabine's equation:
            </p>
            <div className="font-mono text-xs text-pink-300 bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              T₆₀ = 0.161 · V / A
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Where V is the room volume and A = ∑ S_i·α_i is the total equivalent absorption area (metric Sabines) of room surfaces with surface area S_i and absorption coefficient α_i.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

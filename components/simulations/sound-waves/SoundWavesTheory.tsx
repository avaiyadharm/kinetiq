"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, HelpCircle, GraduationCap } from "lucide-react";

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
      {label && <div className="absolute -top-3 left-6 bg-[#18181b] px-3 text-[9px] uppercase tracking-[0.2em] text-teal-500 font-black z-10 shadow-sm">{label}</div>}
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
                  <strong className="text-purple-400 block">Dashed Purple Line = Displacement ξ(x,t)</strong>
                  Shows how far each air molecule has moved from its equilibrium position. This is always 90° ahead of the pressure wave.
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
            <ul className="list-disc pl-5 space-y-3 text-xs text-white/70">
              <li>
                <strong className="text-white font-sans uppercase tracking-widest text-[10px] block mb-1">Pitch (Frequency)</strong> The rate at which the wave oscillates back and forth. More cycles per second (measured in Hertz, Hz) create a higher pitch.
              </li>
              <li>
                <strong className="text-white font-sans uppercase tracking-widest text-[10px] block mb-1">Loudness (Amplitude)</strong> Measured in decibels SPL (dB SPL), this is computed as <Var>L</Var> = 20 log<Sub>10</Sub>(<MathFrac num={<>p<Sub>rms</Sub></>} den={<>p<Sub>0</Sub></>} />) where <Var>p</Var><Sub>0</Sub> = 20 μPa is the threshold of human hearing.
              </li>
              <li>
                <strong className="text-white font-sans uppercase tracking-widest text-[10px] block mb-1">Speed of Sound</strong> How fast the energy travels through the medium. In air at room temperature, sound travels at roughly 343 meters per second. The speed depends on the medium: <Var>c</Var> = √(<MathFrac num={<Var>B</Var>} den="ρ" />), where <Var>B</Var> is the bulk modulus and ρ is density.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Intermediate Mode */}
      {level === "intermediate" && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider font-display">Acoustic Variables & Wave Formulas</h3>
            <p className="text-sm text-white/80 leading-relaxed font-sans">
              To describe sound waves mathematically, we connect several interrelated quantities:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-serif text-sm text-teal-300 bg-black/40 border border-white/5 p-6 rounded-2xl">
              <div className="space-y-4 flex flex-col justify-center">
                <div className="flex items-center gap-1">Wavelength: <Var>λ</Var> = <MathFrac num={<Var>c</Var>} den={<Var>f</Var>} /></div>
                <div className="flex items-center gap-1">Angular Frequency: <Var>ω</Var> = 2π<Var>f</Var></div>
                <div className="flex items-center gap-1">Wavenumber: <Var>k</Var> = <MathFrac num="2π" den={<Var>λ</Var>} /> = <MathFrac num={<Var>ω</Var>} den={<Var>c</Var>} /></div>
              </div>
              <div className="space-y-4 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-1">Acoustic Impedance: <Var>Z</Var> = ρ<Var>c</Var></div>
                <div className="flex items-center gap-1">Acoustic Intensity: <Var>I</Var> = <Var>p v</Var> = <MathFrac num={<>p<Sup>2</Sup><Sub>rms</Sub></>} den="ρ c" /></div>
                <div className="flex items-center gap-1">SPL: <Var>L</Var> = 20 log<Sub>10</Sub>(<MathFrac num={<>p<Sub>rms</Sub></>} den="20 μPa" />)</div>
              </div>
            </div>
            <p className="text-xs text-white/50 italic leading-relaxed pt-2">
              Note: The decibel formula uses 20 log<Sub>10</Sub>(p/p<Sub>0</Sub>) for pressure ratios (not 10 log<Sub>10</Sub> which applies to intensity ratios). The reference pressure p<Sub>0</Sub> = 20 μPa corresponds to the threshold of human hearing at 1 kHz.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider font-display">Phase Relationship: Pressure vs. Displacement</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              In a traveling sound wave, pressure and displacement are always <strong>90° out of phase</strong>. This is because pressure is the spatial derivative of displacement:
            </p>
            <MathEq block label="Pressure-Displacement Relation">
              <div className="flex flex-col items-center gap-2">
                <div><Var>p</Var>(<Var>x</Var>,<Var>t</Var>) = −<Var>B</Var> <MathFrac num={<>&part;ξ</>} den={<>&part;x</>} /></div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-sans font-normal my-1">equivalently</div>
                <div>If <Var>ξ</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>ξ</Var><Sub>0</Sub> cos(<Var>kx</Var> − <Var>ωt</Var>) &nbsp;then&nbsp; <Var>p</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>B k ξ</Var><Sub>0</Sub> sin(<Var>kx</Var> − <Var>ωt</Var>)</div>
              </div>
            </MathEq>
            <p className="text-xs text-white/60 leading-relaxed">
              This means: where displacement is maximum (particles are at their farthest from equilibrium), pressure variation is zero. Where pressure is maximum (particles are most compressed), the displacement crosses zero. The cyan and purple curves on the canvas demonstrate this relationship in real time.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider font-display">Air Column Resonance</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              When sound waves are confined in a tube, they reflect off the boundaries and superpose. This creates <strong>standing waves</strong>, but the boundary conditions dictate which resonant frequencies are allowed:
            </p>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest block border-b border-white/5 pb-2">Open-Open Pipe (Both Ends Open)</span>
                <p className="text-xs text-white/70">
                  Open ends communicate with the atmosphere, so pressure is constrained to zero at both boundaries (<strong>Pressure Nodes</strong>). 
                  Since particles are free to move at open ends, these are <strong>Displacement Antinodes</strong>.
                </p>
                <div className="font-serif text-sm text-emerald-400 space-y-3 py-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <Var>p</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>p</Var><Sub>0</Sub> sin(<MathFrac num={<Var>n π x</Var>} den={<Var>L</Var>} />) cos(<Var>ω</Var><Sub>n</Sub><Var>t</Var>)
                    <span className="text-[10px] text-white/45 uppercase tracking-widest font-sans ml-auto">nodes at x = 0, L</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <Var>ξ</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>ξ</Var><Sub>0</Sub> cos(<MathFrac num={<Var>n π x</Var>} den={<Var>L</Var>} />) sin(<Var>ω</Var><Sub>n</Sub><Var>t</Var>)
                    <span className="text-[10px] text-white/45 uppercase tracking-widest font-sans ml-auto">antinodes at x = 0, L</span>
                  </div>
                  <div className="flex items-center gap-1 border-t border-emerald-500/10 pt-2 text-xs">
                    <Var>f</Var><Sub>n</Sub> = <MathFrac num={<Var>n c</Var>} den={<>2<Var>L</Var></>} /> &nbsp;&nbsp;(where <Var>n</Var> = 1, 2, 3, 4...)
                  </div>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-widest block border-b border-white/5 pb-2">Open-Closed Pipe (One Closed End)</span>
                <p className="text-xs text-white/70">
                  The closed wall halts molecule movement (<strong>Displacement Node = Velocity Node</strong>) and creates maximum pressure variation (<strong>Pressure Antinode</strong>). 
                  The open end remains a Pressure Node / Displacement Antinode.
                </p>
                <div className="font-serif text-sm text-emerald-400 space-y-3 py-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <Var>p</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>p</Var><Sub>0</Sub> sin(<MathFrac num={<Var>n π x</Var>} den={<>2<Var>L</Var></>} />) cos(<Var>ω</Var><Sub>n</Sub><Var>t</Var>)
                    <span className="text-[10px] text-white/45 uppercase tracking-widest font-sans ml-auto">node at x = 0, antinode at x = L</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <Var>ξ</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>ξ</Var><Sub>0</Sub> cos(<MathFrac num={<Var>n π x</Var>} den={<>2<Var>L</Var></>} />) sin(<Var>ω</Var><Sub>n</Sub><Var>t</Var>)
                    <span className="text-[10px] text-white/45 uppercase tracking-widest font-sans ml-auto">antinode at x = 0, node at x = L</span>
                  </div>
                  <div className="flex items-center gap-1 border-t border-emerald-500/10 pt-2 text-xs">
                    <Var>f</Var><Sub>n</Sub> = <MathFrac num={<Var>n c</Var>} den={<>4<Var>L</Var></>} /> &nbsp;&nbsp;(where <Var>n</Var> = 1, 3, 5, 7... odd only)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-pink-400 uppercase tracking-wider font-display">Impedance Mismatch & Reflection</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              When a wave encounters a boundary between two different media (e.g., air to water), part of the energy is reflected and part is transmitted. The coefficients depend on the <strong>acoustic impedance</strong> ratio:
            </p>
            <div className="font-serif text-sm text-pink-300 bg-black/40 border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                Reflection Coefficient: <Var>R</Var> = <MathFrac num={<>Z<Sub>2</Sub> − Z<Sub>1</Sub></>} den={<>Z<Sub>2</Sub> + Z<Sub>1</Sub></>} />
              </div>
              <div className="flex items-center gap-2">
                Transmission Coefficient: <Var>T</Var> = <MathFrac num={<>2 Z<Sub>2</Sub></>} den={<>Z<Sub>2</Sub> + Z<Sub>1</Sub></>} />
              </div>
              <div className="flex items-center gap-2 border-t border-pink-500/10 pt-4 text-xs text-white/50">
                Energy Conservation: <Var>R</Var><Sup>2</Sup> + (<MathFrac num={<>Z<Sub>1</Sub></>} den={<>Z<Sub>2</Sub></>} />) <Var>T</Var><Sup>2</Sup> = 1
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              When Z<Sub>2</Sub> &gt; Z<Sub>1</Sub> (e.g., air to concrete), R is positive: the reflected wave is in-phase with the incident. When Z<Sub>2</Sub> &lt; Z<Sub>1</Sub> (e.g., air to vacuum), R is negative: the reflected wave is inverted (180° phase flip).
            </p>
          </div>
        </div>
      )}

      {/* Advanced Mode */}
      {level === "advanced" && (
        <div className="space-y-6 w-full animate-fadeIn">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider font-display">The Governing Acoustic Wave Equation</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              By combining the linearized conservation of mass (continuity equation) and linearized conservation of momentum (Euler's equation) for an inviscid, compressible fluid:
            </p>
            <MathEq block label="Acoustic Wave Equation">
              <div className="flex flex-col items-center gap-2">
                <div><MathFrac num={<>&part;<Sup>2</Sup><Var>p</Var></>} den={<>&part;<Var>t</Var><Sup>2</Sup></>} /> = <Var>c</Var><Sup>2</Sup> &nabla;<Sup>2</Sup><Var>p</Var></div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-sans font-normal mt-1">where <Var>c</Var> = √(<MathFrac num={<Var>B</Var>} den={<>ρ<Sub>0</Sub></>} />) is the adiabatic speed of sound</div>
              </div>
            </MathEq>
            <p className="text-sm text-white/80 leading-relaxed">
              The displacement field <Var>ξ</Var>(<Var>x</Var>,<Var>t</Var>) and pressure field <Var>p</Var>(<Var>x</Var>,<Var>t</Var>) are linked by the constitutive relation:
            </p>
            <MathEq block label="Constitutive Relation">
              <div className="flex flex-col items-center gap-2">
                <div><Var>p</Var> = −<Var>B</Var> <MathFrac num={<>&part;ξ</>} den={<>&part;x</>} /> &nbsp;&nbsp;(1D case)</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-sans font-normal mt-1">Introduces the 90° spatial phase shift between pressure and displacement</div>
              </div>
            </MathEq>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-emerald-400 uppercase tracking-wider font-display">Acoustic Energy Transport</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Acoustic energy is transported by the instantaneous acoustic intensity vector, defined as the product of pressure and particle velocity:
            </p>
            <div className="font-serif text-sm text-emerald-300 bg-black/40 border border-white/5 p-6 rounded-2xl space-y-3">
              <div className="text-center"><Var>I</Var>(<Var>x</Var>,<Var>t</Var>) = <Var>p</Var>(<Var>x</Var>,<Var>t</Var>) <Var>v</Var>(<Var>x</Var>,<Var>t</Var>) &nbsp; [W/m<Sup>2</Sup>]</div>
              <div className="text-white/50 text-center text-xs">For a progressive plane wave: <Var>I</Var> = <MathFrac num={<>p<Sup>2</Sup><Sub>rms</Sub></>} den={<>ρ<Sub>0</Sub> c</>} /></div>
              <div className="text-white/50 text-center text-xs pt-1 border-t border-emerald-500/10">Energy density: <Var>u</Var> = <MathFrac num={<>p<Sup>2</Sup></>} den="2B" /> + <MathFrac num="1" den="2" /> ρ<Sub>0</Sub> <Var>v</Var><Sup>2</Sup></div>
              <div className="text-white/30 text-center text-[10px] uppercase tracking-widest font-sans">Potential energy + Kinetic energy per unit volume</div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              In the simulator, the "Acoustic Energy Flow" visualization mode renders <Var>I</Var>(<Var>x</Var>,<Var>t</Var>) as vector arrows. For a progressive wave, these always point in the propagation direction. For a standing wave, the time-averaged intensity is zero (energy oscillates back and forth without net transport).
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider font-display">Numerical PDE Solver (1D FDTD)</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              The real-time simulator uses a central Finite Difference Time Domain (FDTD) scheme to integrate pressure oscillations over time. 
              The discretized grid updates pressure at node i and time step n+1 via:
            </p>
            <MathEq block label="Discretized FDTD Equation">
              <Var>p</Var><Sub>i</Sub><Sup>n+1</Sup> = ( <MathFrac num="1" den={<>1 + <MathFrac num="σ Δt" den="2" /></>} /> ) &times; [ 2 <Var>p</Var><Sub>i</Sub><Sup>n</Sup> − (1 − <MathFrac num="σ Δt" den="2" />) <Var>p</Var><Sub>i</Sub><Sup>n−1</Sup> + <Var>C</Var><Sup>2</Sup> ( <Var>p</Var><Sub>i+1</Sub><Sup>n</Sup> − 2 <Var>p</Var><Sub>i</Sub><Sup>n</Sup> + <Var>p</Var><Sub>i−1</Sub><Sup>n</Sup> ) ]
            </MathEq>
            <p className="text-xs text-white/60 leading-relaxed">
              Where C = c·Δt/Δx is the Courant number. 
              The CFL stability condition C ≤ 1.0 must be enforced to prevent numerical blow-up. 
              Boundary absorption is implemented via Perfectly Matched Layers (PML) where the damping coefficient σ ramps quadratically from zero to σ<Sub>max</Sub> within the first 25 grid nodes at each boundary.
            </p>
            <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs text-white/50">
              <div className="font-bold text-white/70">Grid Transparency (visible in FDTD mode):</div>
              <div>• Grid nodes shown as faint tick marks along equilibrium axis</div>
              <div>• PML regions shaded in faint red at domain boundaries</div>
              <div>• CFL number and timestep displayed in HUD overlay</div>
              <div>• Numerical dispersion: phase velocity error ≈ O((Δx)²) for central differences</div>
            </div>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-pink-400 uppercase tracking-wider font-display">Sabine Reverberation and Ray Acoustics</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              In concert halls and room acoustics, sound propagation at high frequencies can be modeled as rays. 
              The decay of energy in a diffuse acoustic field obeys Sabine's equation:
            </p>
            <MathEq block label="Sabine's Reverberation Formula">
              <Var>T</Var><Sub>60</Sub> = 0.161 <MathFrac num={<Var>V</Var>} den={<Var>A</Var>} />
            </MathEq>
            <p className="text-xs text-white/60 leading-relaxed">
              Where V is the room volume (m³) and A = Σ S<Sub>i</Sub>·α<Sub>i</Sub> is the total equivalent absorption area (metric Sabines). 
              The simulator computes V assuming a 3m ceiling height, and uses all 6 surfaces with the user-specified absorption coefficient α.
            </p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider font-display">Nonlinear Acoustics & Wave Steepening</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              At high amplitudes, the assumption of linear acoustics breaks down. The local speed of sound becomes pressure-dependent:
            </p>
            <MathEq block label="Nonlinear Sound Speed">
              <div className="flex flex-col items-center gap-2">
                <div><Var>c</Var>(<Var>p</Var>) = <Var>c</Var><Sub>0</Sub> ( 1 + β <MathFrac num={<Var>p</Var>} den={<Var>B</Var>} /> )</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-sans font-normal mt-1">β = <MathFrac num={<>1 + <MathFrac num="B" den="A" /></>} den="2" /> &approx; 1.2 for air</div>
              </div>
            </MathEq>
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

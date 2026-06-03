"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Helper math components for SSR-safe and clean LaTeX rendering
const InlineMath: React.FC<{ math: string }> = ({ math }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch (e) {
      return math;
    }
  }, [math]);
  return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
};

const DisplayMath: React.FC<{ math: string }> = ({ math }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, { displayMode: true, throwOnError: false });
    } catch (e) {
      return math;
    }
  }, [math]);
  return (
    <div 
      className="my-4 overflow-x-auto py-2 px-4 bg-zinc-950/60 rounded-xl border border-zinc-800/40 text-center select-all custom-scrollbar" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};

export const KineticEnergyTheory: React.FC = () => {
  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-text selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-12 text-zinc-300 leading-relaxed font-sans pb-24">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            KINETIC ENERGY: THEORETICAL BASIS
          </h2>
          <p className="text-sm text-cyan-400 mt-2 font-mono uppercase tracking-wider">
            From Classical Work Integration to Relativistic Divergence and Quantum Operators
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">1. Classical Kinematics & Work-Energy Theorem</h3>
          <p>
            Kinetic energy (<InlineMath math="E_k" />) represents the capacity of a system to perform thermodynamic or mechanical work by virtue of its state of motion. Historically stemming from Gottfried Leibniz&apos;s formulation of <em>vis viva</em> (&quot;living force&quot;, quantified as <InlineMath math="mv^2" />), the modern definition was formalized by Gaspard-Gustave Coriolis.
          </p>
          <p>
            The fundamental derivation of classical translational kinetic energy originates from Newton&apos;s second law of motion (<InlineMath math="\mathbf{F} = m\mathbf{a}" />) and the definition of mechanical work (<InlineMath math="W = \int \mathbf{F} \cdot d\mathbf{r}" />).
          </p>
          
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h4 className="text-cyan-400 font-bold font-mono text-xs uppercase tracking-wider">Derivation of Translational Kinetic Energy</h4>
            <p className="text-sm">
              Consider a constant mass <InlineMath math="m" /> accelerated along a straight line by a net force <InlineMath math="F" />. The work done on the object as it moves from position <InlineMath math="x_1" /> to <InlineMath math="x_2" /> is integrated as:
            </p>
            <DisplayMath math="W = \int_{x_1}^{x_2} F dx = \int_{x_1}^{x_2} m \frac{dv}{dt} dx" />
            <p className="text-sm">
              Using the chain rule, we substitute <InlineMath math="\frac{dx}{dt} = v" />, mapping the integration limits from spatial coordinates to velocity states:
            </p>
            <DisplayMath math="W = \int_{v_1}^{v_2} m v dv = m \left[ \frac{1}{2}v^2 \right]_{v_1}^{v_2} = \frac{1}{2}mv_2^2 - \frac{1}{2}mv_1^2 = \Delta E_k" />
            <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/40 text-xs text-zinc-400">
              <strong>Theorem (Work-Energy):</strong> The net work performed by all forces on a particle equals the absolute variation of its kinetic energy. When starting from rest (<InlineMath math="v_1 = 0" />), the kinetic energy is exactly:
              <DisplayMath math="E_k = \frac{1}{2} m v^2" />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">2. Rotational Kinetic Energy & Rigid Body Inertia</h3>
          <p>
            For a rigid body rotating about a fixed axis with angular velocity <InlineMath math="\omega" /> (rad/s), individual differential mass elements <InlineMath math="dm" /> have varying linear speeds depending on their radial distance <InlineMath math="r" /> from the axis of rotation: <InlineMath math="v = r\omega" />.
          </p>
          <p>
            Summing the translational kinetic energies of all differential elements yields the total rotational kinetic energy:
          </p>
          <DisplayMath math="E_{\text{rot}} = \int \frac{1}{2} v^2 dm = \int \frac{1}{2} (r\omega)^2 dm = \frac{1}{2} \omega^2 \left( \int r^2 dm \right)" />
          <p>
            We define the integral term as the **Moment of Inertia** (<InlineMath math="I" />, measured in <InlineMath math="\text{kg}\cdot\text{m}^2" />):
          </p>
          <DisplayMath math="I = \int r^2 dm" />
          <p>
            Which simplifies the expression for rotational energy to the rotational analog of the classical formula:
          </p>
          <DisplayMath math="E_{\text{rot}} = \frac{1}{2} I \omega^2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-3">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono block">Analytical Inertia Profiles</span>
              <p className="text-xs text-zinc-400">
                The moment of inertia depends fundamentally on how the mass is distributed relative to the axis:
              </p>
              <ul className="list-disc list-inside text-[11px] text-zinc-500 space-y-2 pl-1">
                <li><strong>Thin Ring (radius R):</strong> All mass is concentrated at the edge: <InlineMath math="I = MR^2" />.</li>
                <li><strong>Solid Disk (radius R):</strong> Mass is distributed uniformly: <InlineMath math="I = \frac{1}{2}MR^2" />.</li>
                <li><strong>Solid Sphere (radius R):</strong> Mass packed in three dimensions: <InlineMath math="I = \frac{2}{5}MR^2" />.</li>
                <li><strong>Thin Rod (length L, center pivot):</strong> Mass along one dimension: <InlineMath math="I = \frac{1}{12}ML^2" />.</li>
              </ul>
            </div>

            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-3">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono block">Combined Planar Motion</span>
              <p className="text-xs text-zinc-400">
                For a rolling wheel (translation + rotation without slipping), the total kinetic energy is split between linear velocity of the center of mass (<InlineMath math="v_{\text{cm}}" />) and rotation about the center of mass:
              </p>
              <DisplayMath math="E_{\text{total}} = \frac{1}{2}M v_{\text{cm}}^2 + \frac{1}{2}I_{\text{cm}} \omega^2" />
              <div className="p-2.5 bg-black/50 rounded-lg border border-zinc-800/50 font-mono text-[10px] text-zinc-300">
                Using <InlineMath math="v_{\text{cm}} = R\omega" />, a rolling solid disk has:
                <DisplayMath math="E_{\text{total}} = \frac{3}{4} M v_{\text{cm}}^2" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">3. Relativistic Kinetic Energy</h3>
          <p>
            At velocities approaching the speed of light (<InlineMath math="v \to c" />), classical mechanics fails. Einstein&apos;s Special Theory of Relativity dictates that energy and relativistic momentum are governed by the Lorentz factor <InlineMath math="\gamma" />:
          </p>
          <DisplayMath math="\gamma = \frac{1}{\sqrt{1 - \beta^2}} \quad \text{where} \quad \beta = \frac{v}{c}" />
          <p>
            The total relativistic energy <InlineMath math="E" /> is the sum of the rest mass energy (<InlineMath math="E_0 = mc^2" />) and the kinetic energy (<InlineMath math="E_k" />):
          </p>
          <DisplayMath math="E = \gamma m c^2 = E_k + m c^2" />
          <p>
            Isolating the relativistic kinetic energy yields:
          </p>
          <DisplayMath math="E_k = (\gamma - 1) m c^2" />

          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h4 className="text-amber-400 font-bold font-mono text-xs uppercase tracking-wider">Proof of Classical Convergence via Taylor Expansion</h4>
            <p className="text-sm">
              To verify consistency with Newtonian mechanics at low speeds (<InlineMath math="v \ll c" /> or <InlineMath math="\beta \ll 1" />), we perform a Taylor expansion of the Lorentz factor <InlineMath math="\gamma = (1-\beta^2)^{-1/2}" /> centered at <InlineMath math="\beta = 0" />:
            </p>
            <DisplayMath math="(1 - \beta^2)^{-1/2} = 1 + \frac{1}{2}\beta^2 + \frac{3}{8}\beta^4 + \frac{5}{16}\beta^6 + \dots" />
            <p className="text-sm">
              Substituting this back into the relativistic kinetic energy formula:
            </p>
            <DisplayMath math="E_k = \left( 1 + \frac{1}{2}\beta^2 + \frac{3}{8}\beta^4 + \dots - 1 \right) m c^2 = \left( \frac{1}{2}\frac{v^2}{c^2} + \frac{3}{8}\frac{v^4}{c^4} + \dots \right) m c^2" />
            <DisplayMath math="E_k = \frac{1}{2}m v^2 + \frac{3}{8}m \frac{v^4}{c^2} + \mathcal{O}(v^6)" />
            <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/40 text-xs text-zinc-400 leading-normal">
              <strong>Physical Insight:</strong> As <InlineMath math="v/c \to 0" />, the higher order terms vanish, converging exactly to the classical expression <InlineMath math="\frac{1}{2}mv^2" />. However, as <InlineMath math="v \to c" />, the Lorentz factor <InlineMath math="\gamma \to \infty" />, requiring infinite energy to reach the speed of light.
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">4. Thermal Kinetic Energy (Kinetic Theory of Gases)</h3>
          <p>
            From a microscopic statistical perspective, the macroscopic thermodynamic parameter of temperature is a direct measure of the average translational kinetic energy of a gas ensemble&apos;s constituent particles.
          </p>
          <p>
            For a system with <InlineMath math="d" /> spatial degrees of freedom, the Maxwell-Boltzmann equipartition theorem states that each active degree of freedom contributes <InlineMath math="\frac{1}{2} k_B T" /> of thermal energy per particle:
          </p>
          <DisplayMath math="\langle E_k \rangle = \frac{d}{2} k_B T" />
          <p>
            Where <InlineMath math="k_B \approx 1.3806 \times 10^{-23}\text{ J/K}" /> is the Boltzmann constant. In standard 3D space (<InlineMath math="d=3" />):
          </p>
          <DisplayMath math="\langle E_k \rangle = \frac{3}{2} k_B T" />
          
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-sm space-y-2">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">Root-Mean-Square (RMS) Speed</span>
            <p className="text-zinc-400 text-xs">
              Equating the statistical average kinetic energy to the mechanical definition (<InlineMath math="\langle \frac{1}{2} m v^2 \rangle = \frac{3}{2} k_B T" />), we define the Root-Mean-Square velocity <InlineMath math="v_{\text{rms}}" />:
            </p>
            <DisplayMath math="v_{\text{rms}} = \sqrt{\langle v^2 \rangle} = \sqrt{\frac{3 k_B T}{m}}" />
            <p className="text-zinc-400 text-xs">
              Here, heavier gas species (like Xenon, <InlineMath math="131\text{ u}" />) travel significantly slower than light elements (like Helium, <InlineMath math="4\text{ u}" />) at identical temperatures, though they share the same average kinetic energy.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">5. Quantum Mechanics: Kinetic Operators & Quantized Energy</h3>
          <p>
            In quantum mechanics, physical observables are replaced by mathematical operators acting on the system wavefunctions <InlineMath math="\psi(\mathbf{r}, t)" />. The kinetic energy operator <InlineMath math="\hat{T}" /> is derived from the classical relation connecting momentum <InlineMath math="\mathbf{p}" /> to kinetic energy: <InlineMath math="T = \frac{\mathbf{p}^2}{2m}" />.
          </p>
          <p>
            Substituting the quantum mechanical momentum operator <InlineMath math="\hat{\mathbf{p}} = -i\hbar\nabla" />:
          </p>
          <DisplayMath math="\hat{T} = \frac{\hat{\mathbf{p}}^2}{2m} = \frac{(-i\hbar\nabla)^2}{2m} = -\frac{\hbar^2}{2m}\nabla^2" />
          <p>
            Where <InlineMath math="\hbar = h/2\pi" /> is the reduced Planck constant and <InlineMath math="\nabla^2" /> is the Laplacian operator.
          </p>

          <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800 space-y-4">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">Quantized Solution: 1D Particle in an Infinite Potential Well</span>
            <p className="text-sm">
              Consider a particle confined to a 1D region of width <InlineMath math="L" /> with infinite potential boundaries (<InlineMath math="V(x)=0" /> for <InlineMath math="0 < x < L" />, and <InlineMath math="V(x)=\infty" /> elsewhere). Solving the time-independent Schrödinger Equation:
            </p>
            <DisplayMath math="-\frac{\hbar^2}{2m}\frac{d^2\psi(x)}{dx^2} = E \psi(x)" />
            <p className="text-sm">
              Applying boundary conditions <InlineMath math="\psi(0) = \psi(L) = 0" /> yields quantized wavefunctions:
            </p>
            <DisplayMath math="\psi_n(x) = \sqrt{\frac{2}{L}}\sin\left(\frac{n\pi x}{L}\right) \quad \text{for } n \in \{1, 2, 3, \dots\}" />
            <p className="text-sm">
              Operating <InlineMath math="\hat{T}" /> on these wavefunctions returns the discrete energy eigenvalues:
            </p>
            <DisplayMath math="E_n = \frac{n^2 \pi^2 \hbar^2}{2 m L^2} = \frac{n^2 h^2}{8 m L^2}" />
            <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-zinc-800/40">
              <strong>Quantum Limit Note:</strong> Kinetic energy in a confined quantum system cannot be zero. The ground state state <InlineMath math="n=1" /> has a non-zero zero-point energy: <InlineMath math="E_1 = \frac{h^2}{8mL^2}" />.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

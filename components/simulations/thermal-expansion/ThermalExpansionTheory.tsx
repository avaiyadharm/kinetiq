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
  return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block" />;
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
      className="my-6 overflow-x-auto py-2 px-4 bg-zinc-950/60 rounded-xl border border-zinc-800/40 text-center select-all custom-scrollbar" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};

export const ThermalExpansionTheory: React.FC = () => {
  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-text selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-12 text-zinc-300 leading-relaxed font-sans pb-24">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            THERMAL EXPANSION: THEORETICAL BASIS
          </h2>
          <p className="text-sm text-cyan-400 mt-2 font-mono uppercase tracking-wider">
            From Microscopic Anharmonic Potentials to Macroscopic Structural Continuum
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">1. Introduction to Thermal Expansion</h3>
          <p>
            Thermal expansion describes the volumetric and dimensional deviations that solids, liquids, and gases undergo in response to temperature variations. From a classical thermodynamics perspective, temperature is defined as a monotonic function of the average kinetic energy of the constituent particles. In a gas, this manifests as translational momentum; in a solid lattice, it corresponds to the vibrational energy of bound atoms.
          </p>
          <div className="bg-zinc-900/30 border border-zinc-800/60 p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Physical Limitations & Quantum Regimes</h4>
            <p className="text-sm text-zinc-400">
              The classical assumption that temperature <InlineMath math="T" /> directly equals average vibrational kinetic energy <InlineMath math="\langle K_k \rangle = \frac{3}{2} k_B T" /> breaks down at low temperatures. In cryogenic regimes (e.g., <InlineMath math="T < 100\text{ K}" />), quantum effects dominate:
            </p>
            <ul className="list-disc list-inside text-sm text-zinc-400 space-y-2 pl-2">
              <li>
                <strong>Quantum Zero-Point Energy:</strong> As <InlineMath math="T \to 0\text{ K}" />, atomic motion does not freeze entirely. Heisenberg&apos;s uncertainty principle enforces a residual, minimum zero-point vibration amplitude:
                <DisplayMath math="A_{\text{min}} = \sqrt{\frac{\hbar}{2 \sqrt{m k_{\text{bond}}}}}" />
                where <InlineMath math="\hbar" /> is the reduced Planck constant (<InlineMath math="\text{J}\cdot\text{s}" />), <InlineMath math="m" /> is the atomic mass (<InlineMath math="\text{kg}" />), and <InlineMath math="k_{\text{bond}}" /> is the bond spring stiffness (<InlineMath math="\text{N/m}" />).
              </li>
              <li>
                <strong>Debye Phonon Theory:</strong> Solid-state heat storage is governed by quantized lattice vibrations called <em>phonons</em>. At low temperatures, high-frequency modes freeze out. The heat capacity <InlineMath math="C_v" /> and thermal expansion follow the Debye <InlineMath math="T^3" /> power law:
                <DisplayMath math="C_v(T) = \frac{9 R T^3}{\Theta_D^3} \int_{0}^{\Theta_D/T} \frac{x^4 e^x}{(e^x - 1)^2} dx \propto T^3 \quad (\text{as } T \to 0)" />
                where <InlineMath math="\Theta_D" /> is the Debye temperature of the material (<InlineMath math="\text{K}" />) and <InlineMath math="R" /> is the universal gas constant (<InlineMath math="\text{J}/(\text{mol}\cdot\text{K})" />).
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">2. Microscopic Origin: Potential Anharmonicity</h3>
          <p>
            A common misconception is that thermal expansion is simply a result of atoms vibrating faster and pushing each other apart. In a perfectly <strong>harmonic potential well</strong>, an atom&apos;s average position remains invariant with temperature.
          </p>
          <p>
            Consider a one-dimensional potential energy well <InlineMath math="V(r)" />. Let <InlineMath math="x = r - r_e" /> represent the displacement from the equilibrium interatomic distance <InlineMath math="r_e" /> (at <InlineMath math="0\text{ K}" />). We Taylor-expand <InlineMath math="V(x)" /> about <InlineMath math="x = 0" />:
          </p>
          <DisplayMath math="V(x) = V(0) + \left.\frac{dV}{dr}\right|_{r_e} x + \frac{1}{2}f x^2 - g x^3 - d x^4 + \dots" />
          <p>
            Where:
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1 pl-4 font-mono">
            <li><InlineMath math="f = \left.\frac{d^2V}{dr^2}\right|_{r_e} > 0" /> is the harmonic force constant (bond stiffness) [<InlineMath math="\text{N/m}" /> or <InlineMath math="\text{J/m}^2" />].</li>
            <li><InlineMath math="g = -\frac{1}{2}\left.\frac{d^3V}{dr^3}\right|_{r_e} > 0" /> is the cubic anharmonic parameter (asymmetric potential skew) [<InlineMath math="\text{N/m}^2" /> or <InlineMath math="\text{J/m}^3" />].</li>
            <li><InlineMath math="d = -\frac{1}{6}\left.\frac{d^4V}{dr^4}\right|_{r_e}" /> is the quartic anharmonic parameter [<InlineMath math="\text{N/m}^3" /> or <InlineMath math="\text{J/m}^4" />].</li>
            <li>Note that the first derivative <InlineMath math="\left.\frac{dV}{dr}\right|_{r_e} = 0" /> because <InlineMath math="r_e" /> is a local potential minimum.</li>
          </ul>

          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h4 className="text-cyan-400 font-bold font-mono text-xs uppercase tracking-wider">Mathematical Proof of Anharmonic Necessity</h4>
            <p className="text-sm">
              Using classical statistical mechanics, the thermal average displacement <InlineMath math="\langle x \rangle" /> is obtained from the Boltzmann distribution:
            </p>
            <DisplayMath math="\langle x \rangle = \frac{\int_{-\infty}^{\infty} x e^{-\beta V(x)} dx}{\int_{-\infty}^{\infty} e^{-\beta V(x)} dx}" />
            <p className="text-sm">
              where <InlineMath math="\beta = 1/(k_B T)" />. For small displacements, we approximate <InlineMath math="e^{-\beta V(x)} \approx e^{-\beta \frac{1}{2} f x^2} \left( 1 + \beta g x^3 \right)" />. Substituting this in:
            </p>
            <DisplayMath math="\langle x \rangle \approx \frac{\int_{-\infty}^{\infty} x (1 + \beta g x^3) e^{-\frac{1}{2}\beta f x^2} dx}{\int_{-\infty}^{\infty} (1 + \beta g x^3) e^{-\frac{1}{2}\beta f x^2} dx} = \frac{\beta g \int_{-\infty}^{\infty} x^4 e^{-\frac{1}{2}\beta f x^2} dx}{\int_{-\infty}^{\infty} e^{-\frac{1}{2}\beta f x^2} dx}" />
            <p className="text-sm">
              Using standard Gaussian integrals (<InlineMath math="\int_{-\infty}^{\infty} e^{-a x^2} dx = \sqrt{\pi/a}" /> and <InlineMath math="\int_{-\infty}^{\infty} x^4 e^{-a x^2} dx = \frac{3}{4}\sqrt{\pi}/a^{5/2}" />):
            </p>
            <DisplayMath math="\langle x \rangle \approx \beta g \frac{\frac{3}{4}\sqrt{\pi}\left(\frac{\beta f}{2}\right)^{-5/2}}{\sqrt{\pi}\left(\frac{\beta f}{2}\right)^{-1/2}} = \frac{3g}{2 f^2 \beta} = \frac{3 g k_B T}{2 f^2}" />
            <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/40 text-xs text-zinc-400">
              <strong>Implication:</strong> If <InlineMath math="g = 0" /> (strictly harmonic potential), then <InlineMath math="\langle x \rangle = 0" /> at all temperatures—meaning <strong>zero thermal expansion</strong>. Expansion is a purely emergent phenomenon of anharmonic asymmetry (<InlineMath math="g > 0" />), which skews the potential well making it shallower at larger separations.
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">3. Microscopic Potential Models</h3>
          <p>
            Two primary analytical potentials are widely utilized to describe interatomic binding forces and compute thermal expansion:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-3">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono block">Lennard-Jones (12-6) Potential</span>
              <DisplayMath math="V_{\text{LJ}}(r) = 4\epsilon \left[ \left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^6 \right]" />
              <p className="text-xs text-zinc-400">
                A mathematical approximation of noble gas and van der Waals interactions.
              </p>
              <ul className="list-disc list-inside text-[11px] text-zinc-500 space-y-1 pl-1">
                <li><InlineMath math="\epsilon" />: potential well depth (bond energy) [<InlineMath math="\text{J}" />].</li>
                <li><InlineMath math="\sigma" />: distance where potential is zero [<InlineMath math="\text{m}" />].</li>
                <li><InlineMath math="r^{-12}" />: Pauli repulsion of overlapping electron shells.</li>
                <li><InlineMath math="r^{-6}" />: attractive London dispersion forces.</li>
              </ul>
              <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800/50 font-mono text-[10.5px] text-zinc-300">
                <strong>Force derivation:</strong>
                <DisplayMath math="F(r) = -\frac{dV_{\text{LJ}}}{dr} = \frac{24\epsilon}{r} \left[ 2\left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^6 \right]" />
                Equilibrium: <InlineMath math="r_0 = 2^{1/6}\sigma" />.
              </div>
            </div>

            <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-3">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono block">Morse Potential</span>
              <DisplayMath math="V_{\text{Morse}}(r) = D_e \left( 1 - e^{-a(r-r_e)} \right)^2" />
              <p className="text-xs text-zinc-400">
                An accurate description of covalent molecular bonds, accounting for vibrational states and dissociation limits.
              </p>
              <ul className="list-disc list-inside text-[11px] text-zinc-500 space-y-1 pl-1">
                <li><InlineMath math="D_e" />: depth of potential well (dissociation energy) [<InlineMath math="\text{J}" />].</li>
                <li><InlineMath math="r_e" />: equilibrium bond spacing [<InlineMath math="\text{m}" />].</li>
                <li><InlineMath math="a" />: governs potential width (stiffness) [<InlineMath math="\text{m}^{-1}" />].</li>
                <li>Naturally approaches <InlineMath math="D_e" /> as <InlineMath math="r \to \infty" /> (bond breakage).</li>
              </ul>
              <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800/50 font-mono text-[10.5px] text-zinc-300">
                <strong>Force derivation:</strong>
                <DisplayMath math="F(r) = -2 a D_e \left(1 - e^{-a(r-r_e)}\right) e^{-a(r-r_e)}" />
                Equilibrium: <InlineMath math="r_0 = r_e" />.
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">4. Thermodynamic Consistency</h3>
          <p>
            Thermal expansion is fundamentally driven by the minimization of the Helmholtz free energy <InlineMath math="F = U - TS" /> (where <InlineMath math="U" /> is internal energy, <InlineMath math="T" /> is temperature, and <InlineMath math="S" /> is entropy). The volumetric expansion coefficient <InlineMath math="\alpha_V" /> [<InlineMath math="\text{K}^{-1}" />] is thermodynamically related to entropy via Maxwell relations:
          </p>
          <DisplayMath math="\alpha_V = \frac{1}{V}\left(\frac{\partial V}{\partial T}\right)_P = -\frac{1}{V}\frac{\partial^2 F}{\partial P \partial T} = \frac{\beta_T}{V} \left(\frac{\partial S}{\partial V}\right)_T" />
          <p>
            where <InlineMath math="\beta_T = -\frac{1}{V}\left(\frac{\partial V}{\partial P}\right)_T" /> is the isothermal compressibility [<InlineMath math="\text{Pa}^{-1}" />].
          </p>
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-sm space-y-2">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">Physical Mechanism (Entropy Drive)</span>
            <p className="text-zinc-400 text-xs">
              When a solid lattice expands, atomic spacings increase, causing a corresponding decrease in the frequency of lattice vibration modes (phonons). Lower phonon frequencies increase the density of accessible vibrational states, leading to an increase in lattice vibrational entropy (<InlineMath math="S" />). Thus, thermal expansion is an entropy-driven state change that minimizes the system&apos;s overall free energy at elevated temperatures.
            </p>
            <p className="text-zinc-400 text-xs mt-1">
              This volume dependence of vibrational modes is quantified by the <strong>Grüneisen parameter</strong> <InlineMath math="\gamma_G" />:
            </p>
            <DisplayMath math="\gamma_G = \frac{\alpha_V V K_T}{C_v}" />
            <p className="text-zinc-400 text-xs">
              where <InlineMath math="K_T = 1/\beta_T" /> is the isothermal bulk modulus [<InlineMath math="\text{Pa}" />] and <InlineMath math="C_v" /> is the heat capacity at constant volume [<InlineMath math="\text{J}/(\text{mol}\cdot\text{K})" />].
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">5. Macroscopic Expansion Equations</h3>
          <p>
            At the macroscopic scale, the cumulative microscopic spacing changes yield dimensional shifts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-[#121214] p-4 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Linear Expansion</span>
              <DisplayMath math="\Delta L = \alpha L_0 \Delta T" />
              <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                Applies to thin rods. <InlineMath math="\alpha" /> is the linear coefficient [<InlineMath math="\text{K}^{-1}" />].
              </p>
            </div>

            <div className="bg-[#121214] p-4 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono">Area Expansion</span>
              <DisplayMath math="\Delta A = \beta A_0 \Delta T" />
              <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                Applies to flat plates. <InlineMath math="\beta" /> is the area coefficient [<InlineMath math="\text{K}^{-1}" />].
              </p>
            </div>

            <div className="bg-[#121214] p-4 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest font-mono">Volume Expansion</span>
              <DisplayMath math="\Delta V = \gamma V_0 \Delta T" />
              <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                Applies to 3D solids. <InlineMath math="\gamma" /> is the volume coefficient [<InlineMath math="\text{K}^{-1}" />].
              </p>
            </div>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
            <div className="text-xs text-zinc-400 space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wider block">Validity Conditions & Physical Assumptions</span>
              <p>These classical macroscopic relationships hold true ONLY under the following strict engineering limits:</p>
              <ul className="list-decimal list-inside space-y-1 text-zinc-500 pl-1">
                <li><strong>Isotropy:</strong> The material properties must be uniform in all spatial directions.</li>
                <li><strong>Small Strain Approximation:</strong> Elastic strain must remain small (<InlineMath math="\epsilon_L = \Delta L / L_0 \ll 1" />).</li>
                <li><strong>Constant Properties:</strong> The coefficient <InlineMath math="\alpha" /> is assumed temperature-independent over <InlineMath math="\Delta T" />.</li>
                <li><strong>Stress-free state:</strong> No boundary constraints block spatial displacements.</li>
              </ul>
            </div>
            <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 text-xs text-zinc-400">
              <strong>Isotropic Derivation of <InlineMath math="\beta \approx 2\alpha" /> and <InlineMath math="\gamma \approx 3\alpha" />:</strong>
              <br />
              For a volume <InlineMath math="V_0 = L_0^3" /> undergoing expansion:
              <DisplayMath math="V(T) = [L_0(1 + \alpha \Delta T)]^3 = V_0(1 + 3\alpha\Delta T + 3\alpha^2\Delta T^2 + \alpha^3\Delta T^3)" />
              Since typical coefficients are small (<InlineMath math="\alpha \approx 10^{-5}\text{ K}^{-1}" />), higher-order terms (<InlineMath math="\alpha^2, \alpha^3" />) are negligible for engineering strains, yielding <InlineMath math="V(T) \approx V_0(1 + 3\alpha\Delta T)" /> and <InlineMath math="\gamma \approx 3\alpha" />.
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">6. Continuum Thermoelasticity</h3>
          <p>
            Under mechanical constraints, thermal expansion induces substantial mechanical stresses. The simple relation:
          </p>
          <DisplayMath math="\sigma = -E \alpha \Delta T" />
          <p>
            is <strong>only valid</strong> for a strictly 1D rod fully clamped at both ends in a uniform temperature field. For multi-dimensional systems, one must solve the equations of <strong>continuum thermoelasticity</strong>.
          </p>

          <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800 space-y-4">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">Duhamel-Neumann Constitutive Relation</span>
            <p className="text-sm">
              For an elastic solid, the Cauchy stress tensor <InlineMath math="\sigma_{ij}" /> [<InlineMath math="\text{Pa}" />] is related to total strain <InlineMath math="\epsilon_{kl}" /> and thermal strain <InlineMath math="\epsilon_{kl}^{th}" /> by Hooke&apos;s law:
            </p>
            <DisplayMath math="\sigma_{ij} = C_{ijkl} \left( \epsilon_{kl} - \epsilon_{kl}^{th} \right) \quad \text{where} \quad \epsilon_{kl}^{th} = \alpha_{kl} \Delta T" />
            <p className="text-sm">
              where <InlineMath math="C_{ijkl}" /> is the 4th-rank elastic stiffness tensor [<InlineMath math="\text{Pa}" />] and <InlineMath math="\alpha_{kl}" /> is the second-rank thermal expansion tensor [<InlineMath math="\text{K}^{-1}" />]. For an isotropic material, this simplifies using the Lamé constants <InlineMath math="\lambda" /> and <InlineMath math="\mu" /> [<InlineMath math="\text{Pa}" />]:
            </p>
            <DisplayMath math="\sigma_{ij} = \lambda \epsilon_{kk} \delta_{ij} + 2\mu \epsilon_{ij} - (3\lambda + 2\mu)\alpha \Delta T \delta_{ij}" />
            <p className="text-sm">
              where <InlineMath math="\delta_{ij}" /> is the Kronecker delta and <InlineMath math="\epsilon_{kk} = \epsilon_{xx} + \epsilon_{yy} + \epsilon_{zz}" /> is the trace of the strain tensor (volumetric strain). Expressed in terms of displacements <InlineMath math="u_i" /> [<InlineMath math="\text{m}" />], the static Navier-Cauchy equation becomes:
            </p>
            <DisplayMath math="(\lambda + \mu) \frac{\partial^2 u_j}{\partial x_i \partial x_j} + \mu \frac{\partial^2 u_i}{\partial x_j \partial x_j} - (3\lambda + 2\mu)\alpha \frac{\partial T}{\partial x_i} = 0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>Physical Insight:</strong> A spatial temperature gradient (<InlineMath math="\nabla T" />) acts mathematically as a body force in the continuum, generating shear stresses and localized concentrations even in unconstrained geometries.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">7. Failure Mechanics & Yielding</h3>
          <p>
            Thermomechanical loading induces progressive failure in structures. Solids do not fail instantaneously; instead, they transition through specific physical regimes:
          </p>
          
          <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 space-y-4 text-xs text-zinc-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">1. Elastic Limit & von Mises Yielding</span>
                <p>
                  As thermal stress increases, the material remains elastic until the equivalent von Mises stress <InlineMath math="\sigma_{vm}" /> exceeds the temperature-dependent yield strength <InlineMath math="\sigma_y(T)" />:
                </p>
                <DisplayMath math="\sigma_{vm} = \sqrt{\frac{1}{2}\left[(\sigma_{xx}-\sigma_{yy})^2 + (\sigma_{yy}-\sigma_{zz})^2 + 6\tau_{xy}^2 \right]} \ge \sigma_y(T)" />
                <p>
                  At high temperatures, atomic bonds soften, causing <InlineMath math="\sigma_y(T)" /> to decline sharply.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">2. Plastic Deformation & Creep</span>
                <p>
                  Once <InlineMath math="\sigma_{vm} > \sigma_y(T)" />, the material undergoes irreversible plastic flow, accumulating permanent plastic strain. Under prolonged stress at elevated temperatures (<InlineMath math="T > 0.4 T_{\text{melting}}" />), materials undergo <strong>creep</strong> (time-dependent dislocation climbing and grain boundary sliding).
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 space-y-2">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">3. Thermal Shock & Griffith Fracture Mechanics</span>
              <p>
                Sudden thermal shifts create high localized stress. If surface microcracks exist, the stress intensity factor <InlineMath math="K_I" /> [<InlineMath math="\text{Pa}\cdot\text{m}^{0.5}" />] is computed as:
              </p>
              <DisplayMath math="K_I = Y \sigma \sqrt{\pi a}" />
              <p>
                where <InlineMath math="a" /> is the crack length [<InlineMath math="\text{m}" />] and <InlineMath math="Y" /> is a dimensionless geometric correction factor. Brittle fracture propagates catastrophically when <InlineMath math="K_I \ge K_{Ic}" /> (fracture toughness).
              </p>
            </div>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">8. Bimetallic Bending: Timoshenko Theory</h3>
          <p>
            When two materials with different linear thermal expansion coefficients (<InlineMath math="\alpha_1 \neq \alpha_2" />) are bonded, heating the strip induces bending.
          </p>
          <p>
            According to Stephen Timoshenko&apos;s classical structural mechanics derivation, the curvature <InlineMath math="\kappa" /> [<InlineMath math="\text{m}^{-1}" />] of the bimetallic strip of total thickness <InlineMath math="t = h_1 + h_2" /> is:
          </p>
          
          <DisplayMath math="\kappa = \frac{1}{R} = \frac{6(\alpha_2 - \alpha_1)(1+m)^2 \Delta T}{t \left[ 3(1+m)^2 + (1+mn)\left(m^2 + \frac{1}{mn}\right) \right]}" />
          
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider block">Variable Legend & Dimensional Units</span>
            <ul className="grid grid-cols-2 gap-2 text-xs text-zinc-400 font-mono">
              <li><InlineMath math="m = h_1/h_2" />: Layer thickness ratio [dimensionless]</li>
              <li><InlineMath math="n = E_1/E_2" />: Young&apos;s Modulus ratio [dimensionless]</li>
              <li><InlineMath math="t = h_1 + h_2" />: Total strip thickness [<InlineMath math="\text{m}" />]</li>
              <li><InlineMath math="\kappa" />: Bending curvature [<InlineMath math="\text{m}^{-1}" />]</li>
            </ul>
            <div className="text-xs text-zinc-500 border-t border-zinc-900 pt-2 leading-relaxed">
              <strong>Key Assumptions:</strong> (1) Euler-Bernoulli beam theory (plane sections remain plane), (2) thin beam geometry (<InlineMath math="t \ll L" />), (3) small curvature (<InlineMath math="\kappa t \ll 1" />), and (4) perfect interfacial bonding (zero slip). A mismatch in moduli (<InlineMath math="n \neq 1" />) shifts the neutral bending axis away from the geometric centroid.
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">9. Advanced Tensor Expansion</h3>
          <p>
            In anisotropic solids (e.g., non-cubic single crystals, wood, carbon-fiber composites), thermal expansion varies directionally. The expansion coefficient is a symmetric second-rank tensor, <InlineMath math="\alpha_{ij}" />:
          </p>
          <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 space-y-4">
            <DisplayMath math="\epsilon_{ij}^{th} = \alpha_{ij} \Delta T \implies \begin{bmatrix} \epsilon_{xx}^{th} \\ \epsilon_{yy}^{th} \\ \epsilon_{zz}^{th} \\ 2\epsilon_{yz}^{th} \\ 2\epsilon_{zx}^{th} \\ 2\epsilon_{xy}^{th} \end{bmatrix} = \begin{bmatrix} \alpha_{11} & \alpha_{12} & \alpha_{13} \\ \alpha_{21} & \alpha_{22} & \alpha_{23} \\ \alpha_{31} & \alpha_{32} & \alpha_{33} \end{bmatrix} \Delta T" />
            <p className="text-sm">
              In low-symmetry crystals (monoclinic, triclinic), temperature changes induce shear strains (<InlineMath math="\alpha_{ij} \neq 0" /> for <InlineMath math="i \neq j" />). In high-symmetry cubic crystals, the tensor isotropic limit is reached: <InlineMath math="\alpha_{11} = \alpha_{22} = \alpha_{33} = \alpha" /> and all off-diagonals are zero.
            </p>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-400 leading-relaxed font-mono">
              <strong>Engineering Example:</strong> Carbon fiber reinforced polymers (CFRP) possess negative longitudinal coefficients <InlineMath math="\alpha_L \approx -1 \times 10^{-6}\text{ K}^{-1}" /> along the carbon fibers and positive transverse coefficients <InlineMath math="\alpha_T \approx 30 \times 10^{-6}\text{ K}^{-1}" /> along the polymer matrix, demanding careful laminate design to prevent warping.
            </div>
          </div>
        </section>

        {/* Section 10 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">10. Case Studies & Material Anomalies</h3>
          <p>
            Lattice structures, molecular bonds, and electron clouds dictate a material&apos;s thermal behavior:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-400">
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
              <span className="text-cyan-400 font-bold block">Invar (Fe-36Ni) near-zero expansion</span>
              <p>
                Invar maintains a near-zero coefficient (<InlineMath math="\alpha \approx 1.2 \times 10^{-6}\text{ K}^{-1}" />) over a wide temperature range. This anomaly arises from the <strong>magnetostriction effect</strong>: as temperature increases, the decrease in ferromagnetic order causes the atomic moments to collapse, contracting the lattice and compensating for the standard anharmonic expansion.
              </p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
              <span className="text-amber-400 font-bold block">Negative Thermal Expansion (NTE)</span>
              <p>
                Materials like Zirconium Tungstate (<InlineMath math="\text{ZrW}_2\text{O}_8" />) contract upon heating over a large range. This occurs due to <strong>rigid unit modes (RUMs)</strong>: the transverse thermal vibrations of polyhedral units (like metal-oxygen tetrahedra) pull the linked framework units closer together, overcoming standard bond-length expansion.
              </p>
            </div>
          </div>
        </section>

        {/* Section 11 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">11. Computational Physics Connections</h3>
          <p>
            In modern scientific simulation, thermoelastic PDEs are solved numerically by transforming the strong form into a weak form for Finite Element Analysis (FEA).
          </p>
          <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800 space-y-4">
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">Variational Principle (Weak Formulation)</span>
            <p className="text-sm">
              Applying virtual displacements <InlineMath math="\delta u_i" /> and integrating by parts over the volume <InlineMath math="V" /> yields the virtual work balance:
            </p>
            <DisplayMath math="\int_V \delta\epsilon_{ij} C_{ijkl} \epsilon_{kl} dV = \int_V \delta\epsilon_{ij} C_{ijkl} \alpha_{kl} \Delta T dV + \int_{\partial V_t} \delta u_i t_i dS" />
            <p className="text-sm">
              where <InlineMath math="t_i" /> is the traction vector applied on the boundary <InlineMath math="\partial V_t" />. This weak form is discretized using shape functions to assemble the global matrix equation:
            </p>
            <DisplayMath math="[K] \{u\} = \{F^{th}\} + \{F^{ext}\}" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Here, the mechanical solvers in this laboratory compute <InlineMath math="[K]" /> (the global stiffness matrix) using numerical Gauss quadrature, evaluating local stress states and deformed node geometries in real-time.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

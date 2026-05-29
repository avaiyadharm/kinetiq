"use client";

import React from "react";

export const ThermalExpansionTheory: React.FC = () => {
  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-text selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-10 text-white/80 leading-relaxed font-sans pb-16">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-6">
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
            Thermal expansion is the tendency of matter to change its shape, area, volume, and density in response to a change in temperature. Temperature is a monotonic function of the average molecular kinetic energy of a system. When a substance is heated, the kinetic energy of its constituent particles increases, causing them to oscillate more rapidly about their equilibrium positions.
          </p>
        </section>

        {/* Section 2 & 3 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">2. The Microscopic Origin: Anharmonic Potentials</h3>
          <p>
            A common misconception is that thermal expansion is simply a result of atoms vibrating faster and pushing each other apart. In a perfectly **harmonic potential well** (where the restoring force is strictly proportional to displacement, i.e., $V(r) = \frac{1}{2}k(r-r_0)^2$), a particle&apos;s average position remains exactly at $r_0$ regardless of its vibrational energy.
          </p>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 font-mono text-xs">
            <h4 className="text-cyan-400 font-bold uppercase tracking-wider">The Lennard-Jones Potential Well</h4>
            <p>
              Real atomic bonds are described by asymmetric (anharmonic) potentials, such as the Lennard-Jones potential:
            </p>
            <div className="bg-black/60 p-4 rounded-xl text-center text-sm text-white font-bold my-3 border border-white/5">
              V(r) = 4ε [ (σ/r)¹² − (σ/r)⁶ ]
            </div>
            <p className="text-white/60 leading-relaxed">
              As temperature increases, the total thermal energy rises. Because the potential curve is shallower (less steep) at larger separations (r &gt; r₀) than at compressed separations (r &lt; r₀), the atom spends more time at larger distances. Consequently, the <strong>mean interatomic spacing ⟨r⟩</strong> shifts rightward:
            </p>
            <div className="text-center text-cyan-400 font-bold text-sm">
              ⟨r⟩_T &gt; ⟨r⟩_0  as  T increases
            </div>
          </div>
        </section>

        {/* Section 4, 5, 6 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">3. Macroscopic Equations of Expansion</h3>
          <p>
            At the macroscopic scale, these microscopic spacing increments sum up to yield measurable dimensional changes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            
            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Linear Expansion</span>
              <div className="font-mono text-sm text-white font-bold my-1">ΔL = α L₀ ΔT</div>
              <p className="text-[10.5px] text-white/50 leading-relaxed">
                Applies to thin rods and tracks. $L = L_0(1 + \alpha \Delta T)$ where $\alpha$ is the linear coefficient.
              </p>
            </div>

            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono">Area Expansion</span>
              <div className="font-mono text-sm text-white font-bold my-1">ΔA = β A₀ ΔT</div>
              <p className="text-[10.5px] text-white/50 leading-relaxed">
                Applies to flat plates. For isotropic solids, the area coefficient is $\beta \approx 2\alpha$.
              </p>
            </div>

            <div className="bg-[#18181b] p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest font-mono">Volume Expansion</span>
              <div className="font-mono text-sm text-white font-bold my-1">ΔV = γ V₀ ΔT</div>
              <p className="text-[10.5px] text-white/50 leading-relaxed">
                Applies to 3D solids and fluids. The volume coefficient is $\gamma \approx 3\alpha$.
              </p>
            </div>

          </div>

          <div className="bg-black/35 p-4 rounded-xl border border-white/5 mt-4">
            <h4 className="text-white text-xs font-bold font-mono mb-2 uppercase tracking-wide">Derivation of Volume Relation (γ ≈ 3α)</h4>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              Consider a cube of side L₀. Upon heating, its volume becomes:<br />
              V = L³ = [L₀(1 + α ΔT)]³ = L₀³ (1 + 3α ΔT + 3α² ΔT² + α³ ΔT³)<br />
              Since α ~ 10⁻⁵ K⁻¹, the higher-order terms (α², α³) are extremely small and can be neglected:<br />
              V ≈ V₀(1 + 3α ΔT) ⟹ γ ≈ 3α
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">4. Thermal Stress and Structural Constraints</h3>
          <p>
            If a material is heated but constrained at its boundaries, it is prevented from expanding. The material experiences a mechanical compressive strain equal and opposite to its free thermal expansion strain.
          </p>
          
          <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-white/70">
              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Compressive Strain</span>
                <div className="text-white font-bold text-sm">ε_thermal = ΔL / L₀ = α ΔT</div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Thermal Stress (Hooke&apos;s Law)</span>
                <div className="text-white font-bold text-sm">σ = E ε_thermal = E α ΔT</div>
              </div>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Where $E$ is Young&apos;s Modulus. If the induced stress $\sigma$ exceeds the material&apos;s **Yield Strength** ($\sigma_y$), the material enters the plastic deformation regime. Beyond this point, the material does not return to its original length upon cooling, accumulating **plastic strain** (creep) and leading to structural warping, buckling, or catastrophic fracture.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">5. Bimetallic Composites: Timoshenko curvature</h3>
          <p>
            When two materials with different thermal expansion coefficients ($\alpha_1 \ne \alpha_2$) are bonded together, heating the composite strip causes the material with the higher coefficient to expand more than the other, forcing the strip to bend into an arc.
          </p>
          <p>
            According to Stephen Timoshenko&apos;s bimetallic bending theory, the curvature $\kappa_c = 1/R$ of a composite strip of thickness $t = h_1 + h_2$ is governed by:
          </p>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center font-mono text-xs my-2">
            <span className="text-white/50 block text-[9px] uppercase tracking-wider mb-2">Bimetallic Curvature Equation</span>
            <div className="text-sm text-cyan-400 font-black my-2">
              κ_c = [ 6(α₂ − α₁)(1 + m)² ΔT ] / [ t ( 3(1 + m)² + (1 + mn)(m² + 1/mn) ) ]
            </div>
            <span className="text-[10px] text-white/40 block leading-relaxed mt-2">
              Where $m = h_1/h_2$ (thickness ratio) and $n = E_1/E_2$ (elastic modulus ratio).
            </span>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white font-display">6. Advanced Tensor Expansion (Expert Mode)</h3>
          <p>
            In anisotropic solids (e.g., non-cubic single crystals, wood, carbon fiber composites), thermal expansion varies with direction. The thermal expansion is represented mathematically by a second-rank symmetric tensor, α_ij:
          </p>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10.5px] leading-relaxed text-white/60">
            <div className="text-white font-bold text-center text-xs my-2">
              ε_ij = α_ij · ΔT
            </div>
            <p>
              In three dimensions, the strain tensor components are:
              <br />
              ε_xx = α_11 ΔT, &nbsp;&nbsp; ε_yy = α_22 ΔT, &nbsp;&nbsp; ε_zz = α_33 ΔT
              <br />
              For monoclinic or triclinic systems, off-diagonal shear strains ε_xy are also induced by uniform temperature changes.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

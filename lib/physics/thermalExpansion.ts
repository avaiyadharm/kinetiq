// ============================================================
// KINETIQ THERMAL EXPANSION — SCIENTIFIC PHYSICS ENGINE
// ============================================================
// All equations are physically accurate. Units: SI throughout.
// Temperature: Kelvin | Length: meters | Stress: Pa | Strain: dimensionless
// ============================================================

export interface MaterialProperties {
  id: string;
  name: string;
  category: "metal" | "ceramic" | "polymer" | "composite";
  crystalStructure: string;

  // Thermal properties
  alpha0: number;          // Linear CTE at 293 K (1/K)
  alphaTempCoeff: number;  // dα/dT — temperature coefficient of CTE (1/K²)
  thermalConductivity: number;   // k  W/(m·K)
  specificHeat: number;          // c_p  J/(kg·K)
  density: number;               // ρ  kg/m³
  emissivity: number;            // ε (0–1)

  // Derived thermal
  // thermalDiffusivity = k / (ρ·c_p)  m²/s

  // Mechanical properties at 293 K
  youngsModulus: number;    // E  Pa (already in Pa not GPa)
  poissonsRatio: number;    // ν
  yieldStrength: number;    // σ_y  Pa
  ultimateStrength: number; // σ_u  Pa
  fatigueLimit: number;     // σ_f  Pa (endurance limit)

  // Temperature-dependence factors
  // E(T) = E0 * (1 - Etemp * (T - 293))
  eTempCoeff: number;       // dimensionless / K
  // σ_y(T) = σ_y0 * (1 - syTempCoeff * (T - 293))
  syTempCoeff: number;      // dimensionless / K

  // Failure
  meltingPoint: number;   // K
  description: string;
  color: string;          // CSS hex for material chip
}

// ============================================================
// MATERIAL DATABASE — 13 Engineering Materials
// ============================================================
export const MATERIAL_DB: Record<string, MaterialProperties> = {
  steel: {
    id: "steel", name: "Structural Steel (A36)", category: "metal",
    crystalStructure: "BCC (Body-Centred Cubic)",
    alpha0: 12e-6, alphaTempCoeff: 5e-9,
    thermalConductivity: 50, specificHeat: 490, density: 7850, emissivity: 0.28,
    youngsModulus: 200e9, poissonsRatio: 0.29,
    yieldStrength: 250e6, ultimateStrength: 400e6, fatigueLimit: 200e6,
    eTempCoeff: 3e-4, syTempCoeff: 5e-4,
    meltingPoint: 1773,
    description: "Standard construction steel. High strength, moderate CTE. Susceptible to thermal buckling when constrained.",
    color: "#78716c"
  },
  stainless: {
    id: "stainless", name: "Stainless Steel (316L)", category: "metal",
    crystalStructure: "FCC (Face-Centred Cubic)",
    alpha0: 16e-6, alphaTempCoeff: 8e-9,
    thermalConductivity: 16, specificHeat: 502, density: 8000, emissivity: 0.12,
    youngsModulus: 193e9, poissonsRatio: 0.28,
    yieldStrength: 290e6, ultimateStrength: 580e6, fatigueLimit: 220e6,
    eTempCoeff: 2.8e-4, syTempCoeff: 4e-4,
    meltingPoint: 1643,
    description: "Austenitic stainless. Higher CTE than carbon steel, very low thermal conductivity — prone to thermal gradients.",
    color: "#94a3b8"
  },
  aluminum: {
    id: "aluminum", name: "Aluminum (6061-T6)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 23.6e-6, alphaTempCoeff: 1.2e-8,
    thermalConductivity: 167, specificHeat: 896, density: 2700, emissivity: 0.09,
    youngsModulus: 69e9, poissonsRatio: 0.33,
    yieldStrength: 276e6, ultimateStrength: 310e6, fatigueLimit: 97e6,
    eTempCoeff: 5e-4, syTempCoeff: 8e-4,
    meltingPoint: 933,
    description: "Lightweight structural alloy. Very high CTE and high thermal conductivity — heats uniformly but expands significantly.",
    color: "#cbd5e1"
  },
  copper: {
    id: "copper", name: "Copper (C10100)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 17e-6, alphaTempCoeff: 6e-9,
    thermalConductivity: 385, specificHeat: 385, density: 8960, emissivity: 0.03,
    youngsModulus: 117e9, poissonsRatio: 0.35,
    yieldStrength: 70e6, ultimateStrength: 220e6, fatigueLimit: 60e6,
    eTempCoeff: 3.5e-4, syTempCoeff: 6e-4,
    meltingPoint: 1358,
    description: "Excellent thermal and electrical conductor. Very low yield strength — easily plastically deforms under thermal stress.",
    color: "#b45309"
  },
  brass: {
    id: "brass", name: "Brass (C26000)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 20e-6, alphaTempCoeff: 9e-9,
    thermalConductivity: 120, specificHeat: 385, density: 8530, emissivity: 0.06,
    youngsModulus: 100e9, poissonsRatio: 0.34,
    yieldStrength: 125e6, ultimateStrength: 330e6, fatigueLimit: 110e6,
    eTempCoeff: 4e-4, syTempCoeff: 5e-4,
    meltingPoint: 1173,
    description: "Cu-Zn alloy with high CTE. Used in precision fittings and valves where thermal expansion must be controlled.",
    color: "#ca8a04"
  },
  titanium: {
    id: "titanium", name: "Titanium (Ti-6Al-4V)", category: "metal",
    crystalStructure: "HCP (Hexagonal Close-Packed)",
    alpha0: 8.6e-6, alphaTempCoeff: 3e-9,
    thermalConductivity: 6.7, specificHeat: 526, density: 4430, emissivity: 0.35,
    youngsModulus: 114e9, poissonsRatio: 0.34,
    yieldStrength: 880e6, ultimateStrength: 950e6, fatigueLimit: 500e6,
    eTempCoeff: 2e-4, syTempCoeff: 3e-4,
    meltingPoint: 1941,
    description: "Aerospace alloy. Low CTE and very high strength. Poor thermal conductor — prone to large spatial gradients.",
    color: "#6366f1"
  },
  tungsten: {
    id: "tungsten", name: "Tungsten (W)", category: "metal",
    crystalStructure: "BCC",
    alpha0: 4.5e-6, alphaTempCoeff: 1.5e-9,
    thermalConductivity: 173, specificHeat: 134, density: 19300, emissivity: 0.05,
    youngsModulus: 411e9, poissonsRatio: 0.28,
    yieldStrength: 1510e6, ultimateStrength: 1720e6, fatigueLimit: 900e6,
    eTempCoeff: 1e-4, syTempCoeff: 2e-4,
    meltingPoint: 3695,
    description: "Highest melting point metal. Extremely stiff. Used in lamp filaments and rocket nozzle throats.",
    color: "#52525b"
  },
  invar: {
    id: "invar", name: "Invar-36 (Fe-36Ni)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 1.2e-6, alphaTempCoeff: 2e-10,
    thermalConductivity: 13.5, specificHeat: 515, density: 8100, emissivity: 0.14,
    youngsModulus: 141e9, poissonsRatio: 0.26,
    yieldStrength: 276e6, ultimateStrength: 483e6, fatigueLimit: 200e6,
    eTempCoeff: 1.5e-4, syTempCoeff: 2.5e-4,
    meltingPoint: 1700,
    description: "Near-zero CTE due to magnetostrictive compensation. Used in clocks, seismic sensors, and space telescope mirrors.",
    color: "#0891b2"
  },
  glass: {
    id: "glass", name: "Borosilicate Glass (Pyrex)", category: "ceramic",
    crystalStructure: "Amorphous",
    alpha0: 3.3e-6, alphaTempCoeff: 2e-10,
    thermalConductivity: 1.14, specificHeat: 830, density: 2230, emissivity: 0.92,
    youngsModulus: 63e9, poissonsRatio: 0.20,
    yieldStrength: 50e6, ultimateStrength: 50e6, fatigueLimit: 20e6,
    eTempCoeff: 1e-4, syTempCoeff: 0,
    meltingPoint: 1100,
    description: "Very low CTE, brittle. High susceptibility to thermal shock fracture due to extreme temperature gradients across cross-section.",
    color: "#7dd3fc"
  },
  concrete: {
    id: "concrete", name: "Reinforced Concrete", category: "ceramic",
    crystalStructure: "Amorphous composite",
    alpha0: 10e-6, alphaTempCoeff: 3e-9,
    thermalConductivity: 1.4, specificHeat: 880, density: 2400, emissivity: 0.88,
    youngsModulus: 30e9, poissonsRatio: 0.20,
    yieldStrength: 3e6, ultimateStrength: 30e6, fatigueLimit: 2e6,
    eTempCoeff: 5e-4, syTempCoeff: 0,
    meltingPoint: 1900,
    description: "Very low tensile strength — expansion joints mandatory. Bridges and pavements require carefully sized thermal gaps.",
    color: "#a8a29e"
  },
  carbon_fiber: {
    id: "carbon_fiber", name: "Carbon Fiber (CFRP)", category: "composite",
    crystalStructure: "Hexagonal layers (fiber), amorphous (matrix)",
    alpha0: -0.5e-6, alphaTempCoeff: 5e-11,
    thermalConductivity: 10, specificHeat: 710, density: 1600, emissivity: 0.95,
    youngsModulus: 181e9, poissonsRatio: 0.27,
    yieldStrength: 1200e6, ultimateStrength: 1500e6, fatigueLimit: 700e6,
    eTempCoeff: 5e-5, syTempCoeff: 1e-4,
    meltingPoint: 3900,
    description: "Slightly negative CTE along fiber direction. Used in precision structures where thermal stability is critical (telescope, aircraft).",
    color: "#1f2937"
  },
  silicon: {
    id: "silicon", name: "Silicon (Monocrystalline)", category: "ceramic",
    crystalStructure: "Diamond cubic (FCC-based)",
    alpha0: 2.6e-6, alphaTempCoeff: 8e-9,
    thermalConductivity: 148, specificHeat: 700, density: 2330, emissivity: 0.65,
    youngsModulus: 130e9, poissonsRatio: 0.27,
    yieldStrength: 7000e6, ultimateStrength: 7000e6, fatigueLimit: 3000e6,
    eTempCoeff: 3e-4, syTempCoeff: 0,
    meltingPoint: 1687,
    description: "Brittle semiconductor. High thermal conductivity but nonlinear CTE. Critical in microelectronics packaging for thermal mismatch stress.",
    color: "#818cf8"
  },
  ice: {
    id: "ice", name: "Water Ice (Ih)", category: "ceramic",
    crystalStructure: "Hexagonal (Ih)",
    alpha0: 51e-6, alphaTempCoeff: 2e-7,
    thermalConductivity: 2.22, specificHeat: 2090, density: 917, emissivity: 0.97,
    youngsModulus: 9e9, poissonsRatio: 0.33,
    yieldStrength: 1e6, ultimateStrength: 1.5e6, fatigueLimit: 0.5e6,
    eTempCoeff: 0, syTempCoeff: 0,
    meltingPoint: 273.15,
    description: "Very high CTE. Frost heave in civil engineering is caused by ice expansion in soil pores. Valid only below 273.15 K.",
    color: "#bae6fd"
  }
};

// ============================================================
// PHYSICS ENGINE — All Methods Static, SI Units
// ============================================================
export class PhysicsEngine {
  static readonly T_REF = 293.15;  // Reference temperature (20 °C) K
  static readonly K_B = 1.380649e-23;  // Boltzmann constant J/K
  static readonly N_NODES = 40;    // Spatial nodes for 1D heat diffusion

  // ----------------------------------------------------------
  // 1. Temperature-Dependent CTE
  // α(T) = α₀ · (1 + αTempCoeff · (T − T_ref))
  // ----------------------------------------------------------
  static alpha(mat: MaterialProperties, T: number): number {
    return mat.alpha0 * (1 + mat.alphaTempCoeff * (T - this.T_REF));
  }

  // ----------------------------------------------------------
  // 2. Temperature-Dependent Young's Modulus
  // E(T) = E₀ · (1 − eTempCoeff · (T − T_ref))
  // ----------------------------------------------------------
  static youngsModulus(mat: MaterialProperties, T: number): number {
    const factor = Math.max(0.3, 1 - mat.eTempCoeff * (T - this.T_REF));
    return mat.youngsModulus * factor;
  }

  // ----------------------------------------------------------
  // 3. Temperature-Dependent Yield Strength
  // σ_y(T) = σ_y0 · (1 − syTempCoeff · (T − T_ref))
  // ----------------------------------------------------------
  static yieldStrength(mat: MaterialProperties, T: number): number {
    const factor = Math.max(0.05, 1 - mat.syTempCoeff * (T - this.T_REF));
    return mat.yieldStrength * factor;
  }

  // ----------------------------------------------------------
  // 4. Thermal Diffusivity  α_th = k / (ρ · c_p)  m²/s
  // ----------------------------------------------------------
  static thermalDiffusivity(mat: MaterialProperties): number {
    return mat.thermalConductivity / (mat.density * mat.specificHeat);
  }

  // ----------------------------------------------------------
  // 5. Linear Thermal Expansion
  // ΔL = α(T) · L₀ · ΔT      L = L₀ (1 + α ΔT)
  // ----------------------------------------------------------
  static deltaL(mat: MaterialProperties, L0: number, T: number, plasticStrain = 0): number {
    const dT = T - this.T_REF;
    return mat.alpha0 * L0 * dT + plasticStrain * L0;
  }

  static rodLength(mat: MaterialProperties, L0: number, T: number, plasticStrain = 0): number {
    return L0 + this.deltaL(mat, L0, T, plasticStrain);
  }

  // ----------------------------------------------------------
  // 6. Thermal Strain (free)  ε_th = α ΔT
  // ----------------------------------------------------------
  static thermalStrain(mat: MaterialProperties, T: number): number {
    return mat.alpha0 * (T - this.T_REF);
  }

  // ----------------------------------------------------------
  // 7. Constraint Mechanics
  // FREE:    σ = 0,  ΔL = α L₀ ΔT
  // FIXED:   ΔL = 0, σ = −E α ΔT  (compressive when heating)
  // PARTIAL: gap closes first, then constraint activates
  // SPRING:  σ = k_spring × u  (spring support)
  // ----------------------------------------------------------
  static constraintState(
    mat: MaterialProperties,
    L0: number,
    T: number,
    constraint: "free" | "fixed" | "partial" | "spring",
    gapSize = 0,
    springStiffness = 100e6,  // Pa/m
    plasticStrain = 0
  ): {
    stress: number;       // Pa (+ tension, − compression)
    mechanicalStrain: number;
    actualDeltaL: number; // m
    isYielding: boolean;
    isFailed: boolean;
    factorOfSafety: number;
  } {
    const ε_th = this.thermalStrain(mat, T) + plasticStrain;
    const freeDeltaL = ε_th * L0;
    const E = this.youngsModulus(mat, T);
    const σ_y = this.yieldStrength(mat, T);

    let stress = 0;
    let mechanicalStrain = 0;
    let actualDeltaL = freeDeltaL;

    if (constraint === "fixed") {
      // Fully fixed: mechanical strain exactly cancels thermal strain
      mechanicalStrain = -ε_th;
      stress = E * mechanicalStrain;  // negative = compressive
      actualDeltaL = 0;
    } else if (constraint === "partial") {
      if (freeDeltaL > gapSize) {
        // Gap fully closed, constraint activates
        const constrainedDeformation = freeDeltaL - gapSize;
        mechanicalStrain = -constrainedDeformation / L0;
        stress = E * mechanicalStrain;
        actualDeltaL = gapSize;
      } else {
        // Freely expanding within gap
        stress = 0;
        actualDeltaL = freeDeltaL;
      }
    } else if (constraint === "spring") {
      // Elastic spring: force = k × displacement, stress = force / A
      // Equilibrium: σ_spring + σ_thermal = 0 (compatibility)
      // σ = E·ε_mech = −(k_s·L0/A)·ε_mech, but simplified for 1D:
      const kL = springStiffness * L0;   // effective stiffness in Pa
      stress = -(E * kL / (E + kL)) * ε_th;
      mechanicalStrain = stress / E;
      actualDeltaL = freeDeltaL + mechanicalStrain * L0;
    }

    const isYielding = Math.abs(stress) > σ_y;
    const failureMultiplier = (mat.category === "ceramic") ? 1.0 : 1.8;
    const isFailed = Math.abs(stress) > σ_y * failureMultiplier;
    const factorOfSafety = stress !== 0 ? σ_y / Math.abs(stress) : 999;

    return { stress, mechanicalStrain, actualDeltaL, isYielding, isFailed, factorOfSafety };
  }

  // ----------------------------------------------------------
  // 8. Euler Buckling Critical Load  P_cr = π²EI / (KL)²
  // For a column with moment of inertia I = (π/64)·d⁴ for circular
  // or I = b·h³/12 for rectangular cross-section.
  // K = effective length factor (1.0 = pin-pin)
  // ----------------------------------------------------------
  static bucklingCriticalLoad(
    mat: MaterialProperties,
    T: number,
    L: number,       // m
    area: number,    // m²
    sectionType: "circular" | "rectangular" = "circular",
    dimension = 0.05  // diameter or height (m)
  ): { Pcr: number; slendernessRatio: number; willBuckle: boolean; thermalLoad: number } {
    const E = this.youngsModulus(mat, T);
    const K = 1.0;  // pin-pin

    let I = 0;
    if (sectionType === "circular") {
      I = (Math.PI / 64) * Math.pow(dimension, 4);
    } else {
      const b = dimension;
      I = (b * Math.pow(dimension, 3)) / 12;
    }

    const Pcr = (Math.PI * Math.PI * E * I) / Math.pow(K * L, 2);

    // Radius of gyration
    const r = Math.sqrt(I / area);
    const slendernessRatio = (K * L) / r;

    // Thermal compressive load (fixed constraint)
    const σ_th = E * mat.alpha0 * (T - this.T_REF);
    const thermalLoad = σ_th * area;

    return { Pcr, slendernessRatio, willBuckle: thermalLoad > Pcr, thermalLoad };
  }

  // ----------------------------------------------------------
  // 9. Bimetallic Strip — Timoshenko Curvature Theory (1925)
  // κ = [6(α₂−α₁)(1+m)² ΔT] / [t·(3(1+m)² + (1+mn)(m²+1/mn))]
  // ----------------------------------------------------------
  static bimetallicCurvature(
    mat1: MaterialProperties,
    mat2: MaterialProperties,
    T: number,
    totalThickness: number  // t = h1 + h2 (m)
  ): { curvature: number; radius: number; deflection: (L: number) => number; stressInterface: number } {
    const dT = T - this.T_REF;
    const a1 = this.alpha(mat1, T);
    const a2 = this.alpha(mat2, T);
    const E1 = this.youngsModulus(mat1, T);
    const E2 = this.youngsModulus(mat2, T);
    const t = totalThickness;

    // Equal thickness assumed: m = h1/h2 = 1
    const m = 1;
    const n = E1 / E2;

    const numerator = 6 * (a2 - a1) * Math.pow(1 + m, 2) * dT;
    const denominator = t * (3 * Math.pow(1 + m, 2) + (1 + m * n) * (m * m + 1 / (m * n)));

    const curvature = Math.abs(denominator) > 1e-30 ? numerator / denominator : 0;
    const radius = Math.abs(curvature) > 1e-15 ? 1 / curvature : Infinity;

    // Tip deflection δ = κ L²/2
    const deflection = (L: number) => curvature * L * L * 0.5;

    // Interfacial stress: σ ≈ E_avg · (α2 - α1) · ΔT
    const Eavg = (E1 + E2) / 2;
    const stressInterface = Eavg * Math.abs(a2 - a1) * Math.abs(dT);

    return { curvature, radius, deflection, stressInterface };
  }

  // ----------------------------------------------------------
  // 10. Thermal Shock — Surface Stress
  // σ_shock = E · α · ΔT_surface / (1 − ν)
  // ΔT_surface estimated from Biot number and thermal diffusivity
  // ----------------------------------------------------------
  static thermalShockStress(
    mat: MaterialProperties,
    T_surface: number,   // K — new surface temperature
    T_initial: number,   // K — initial temperature
    thickness: number    // m — characteristic length
  ): { shockStress: number; shockFactor: number; thermalGradient: number } {
    const dT = Math.abs(T_surface - T_initial);
    const E = this.youngsModulus(mat, (T_surface + T_initial) / 2);
    const α_th = this.thermalDiffusivity(mat);

    // Biaxial thermal shock stress (restrained in-plane)
    const shockStress = (E * mat.alpha0 * dT) / (1 - mat.poissonsRatio);

    // Thermal gradient through thickness
    const thermalGradient = dT / thickness;  // K/m

    const σ_y = this.yieldStrength(mat, T_surface);
    const shockFactor = shockStress / σ_y;

    return { shockStress, shockFactor, thermalGradient };
  }

  // ----------------------------------------------------------
  // 11. Coffin-Manson Fatigue Model
  // Δε_p = C · N_f^(-c)  →  cycles to failure: N_f = (Δε_p/C)^(-1/c)
  // Simplified: N_f ≈ σ_f² / (E · Δσ²)  (stress-life for high-cycle)
  // Damage per cycle: d = 1 / N_f
  // ----------------------------------------------------------
  static fatigueDamagePerCycle(
    mat: MaterialProperties,
    T_low: number,
    T_high: number
  ): { damagePerCycle: number; Nf: number; strainRange: number } {
    const dT = Math.abs(T_high - T_low);
    const E = this.youngsModulus(mat, (T_high + T_low) / 2);
    const strainRange = mat.alpha0 * dT;
    const stressRange = E * strainRange;

    // Basquin's equation (stress-life): N_f = (σ_f' / Δσ)^(1/b)
    // Simplified with b = -0.12 (typical), σ_f' ≈ 1.5 σ_y
    const σ_f = 1.5 * mat.yieldStrength;
    const b = 0.12;
    const Nf = Math.pow(σ_f / Math.max(stressRange, 0.01 * σ_f), 1 / b);
    const damagePerCycle = 1 / Nf;

    return { damagePerCycle, Nf: Math.round(Nf), strainRange };
  }

  // ----------------------------------------------------------
  // 12. 1D Heat Diffusion — Explicit Finite Difference
  // ∂T/∂t = α_th · ∂²T/∂x²
  // Returns new temperature array for N_NODES spatial nodes
  // Boundary: T[0] = T_left (heat source), T[N-1] = T_ambient
  // CFL stability: Δt ≤ Δx² / (2·α_th)
  // ----------------------------------------------------------
  static heatDiffusionStep(
    T_nodes: number[],   // Current temperature profile [K], length N_NODES
    mat: MaterialProperties,
    L0: number,          // Rod length (m)
    T_heat: number,      // Temperature at heated end (K)
    T_ambient: number,   // Far-end boundary temperature (K)
    dt: number,          // Time step (s)
    heatingMode: "left" | "both" | "uniform"
  ): number[] {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    const alpha_th = this.thermalDiffusivity(mat);

    // CFL stability criterion
    const dtMax = (dx * dx) / (2 * alpha_th);
    const dtSafe = Math.min(dt, dtMax * 0.9);
    const r = alpha_th * dtSafe / (dx * dx);  // Fourier number

    const T_new = [...T_nodes];

    // Interior nodes: explicit finite difference
    for (let i = 1; i < N - 1; i++) {
      T_new[i] = T_nodes[i] + r * (T_nodes[i + 1] - 2 * T_nodes[i] + T_nodes[i - 1]);
    }

    // Boundary conditions
    if (heatingMode === "left") {
      T_new[0] = T_heat;           // Dirichlet: left end at T_heat
      T_new[N - 1] = T_ambient;    // Dirichlet: right end ambient
    } else if (heatingMode === "both") {
      T_new[0] = T_heat;
      T_new[N - 1] = T_heat;
    } else {
      // Uniform: all nodes jump (no diffusion delay — for instant heating demos)
      for (let i = 0; i < N; i++) T_new[i] = T_heat;
    }

    return T_new;
  }

  // Multi-step diffusion for larger dt
  static heatDiffusionMultiStep(
    T_nodes: number[],
    mat: MaterialProperties,
    L0: number,
    T_heat: number,
    T_ambient: number,
    totalDt: number,
    heatingMode: "left" | "both" | "uniform"
  ): number[] {
    const dx = L0 / (T_nodes.length - 1);
    const alpha_th = this.thermalDiffusivity(mat);
    const dtStable = (dx * dx) / (2 * alpha_th) * 0.9;

    let T = [...T_nodes];
    let remaining = totalDt;

    const maxSubsteps = 200;
    let steps = 0;
    while (remaining > 1e-12 && steps < maxSubsteps) {
      const step = Math.min(remaining, dtStable);
      T = this.heatDiffusionStep(T, mat, L0, T_heat, T_ambient, step, heatingMode);
      remaining -= step;
      steps++;
    }
    return T;
  }

  // ----------------------------------------------------------
  // 13. Spatial Expansion Profile
  // Returns ΔL for each node based on local temperature
  // ----------------------------------------------------------
  static spatialExpansion(
    mat: MaterialProperties,
    T_nodes: number[],
    L0: number
  ): { deltaLPerNode: number[]; totalDeltaL: number; avgTemp: number } {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    const deltaLPerNode = T_nodes.map(T => mat.alpha0 * (T - this.T_REF) * dx);
    const totalDeltaL = deltaLPerNode.reduce((a, b) => a + b, 0);
    const avgTemp = T_nodes.reduce((a, b) => a + b, 0) / N;
    return { deltaLPerNode, totalDeltaL, avgTemp };
  }

  // ----------------------------------------------------------
  // 14. Spatial Stress Profile (for fixed constraint)
  // σ(x) = E(T(x)) · α(T(x)) · ΔT(x)
  // ----------------------------------------------------------
  static spatialStress(
    mat: MaterialProperties,
    T_nodes: number[],
    constraint: "free" | "fixed" | "partial" | "spring"
  ): number[] {
    if (constraint === "free") return new Array(T_nodes.length).fill(0);
    return T_nodes.map(T => {
      const E = this.youngsModulus(mat, T);
      const ε = mat.alpha0 * (T - this.T_REF);
      return -E * ε;  // Compressive (negative) for heating under constraint
    });
  }

  // ----------------------------------------------------------
  // 15. Atomic Vibration Amplitude (from equipartition theorem)
  // ½kA² = ½k_BT  →  A = sqrt(k_B T / k_bond)
  // ----------------------------------------------------------
  static vibrationAmplitude(T: number, bondStiffness: number): number {
    return Math.sqrt((this.K_B * T) / bondStiffness);
  }

  // Anharmonic mean position shift (Morse potential expansion)
  // ⟨r⟩ = r₀ + (3aK_B T)/(2k_bond r₀)
  // Simplified: shift proportional to T
  static anharmonicShift(T: number, alpha0: number): number {
    // Normalized: shift = alpha0 * (T - T_ref) in units of r0
    return alpha0 * (T - this.T_REF);
  }

  // ----------------------------------------------------------
  // 16. Visual Magnification System
  // Returns ideal magnification so that ΔL fills visible canvas
  // ----------------------------------------------------------
  static recommendedMagnification(deltaL_real: number, L0: number): number {
    // We want visual ΔL / L0 ≈ 0.05 (5% visual expansion)
    if (Math.abs(deltaL_real) < 1e-12) return 1;
    const visualFraction = 0.05;
    const mag = (visualFraction * L0) / Math.abs(deltaL_real);
    // Clamp to sensible range
    const levels = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return levels.reduce((prev, cur) =>
      Math.abs(cur - mag) < Math.abs(prev - mag) ? cur : prev
    );
  }

  // ----------------------------------------------------------
  // 17. Elastic Strain Energy
  // U = σ² V / (2E)
  // ----------------------------------------------------------
  static strainEnergy(
    stress: number,
    volume: number,
    youngsModulus: number
  ): number {
    return (stress * stress * volume) / (2 * youngsModulus);
  }

  // ----------------------------------------------------------
  // 18. Volumetric Expansion
  // ΔV/V = γ ΔT ≈ 3α ΔT
  // ----------------------------------------------------------
  static volumetricExpansion(mat: MaterialProperties, T: number, V0: number): number {
    const gamma = 3 * mat.alpha0;
    return V0 * (1 + gamma * (T - this.T_REF));
  }
}

// ============================================================
// TYPE EXPORTS FOR STORE
// ============================================================
export type ExperimentMode =
  | "free_expansion"
  | "fixed_constraint"
  | "bridge_gap"
  | "railway_buckling"
  | "bimetallic"
  | "thermal_shock"
  | "cryogenic"
  | "fatigue"
  | "spacecraft"
  | "precision";

export type ConstraintType = "free" | "fixed" | "partial" | "spring";
export type ShapeType = "rod" | "bridge" | "railway" | "bimetallic" | "cube" | "plate" | "ring";
export type HeatingMode = "left" | "both" | "uniform";

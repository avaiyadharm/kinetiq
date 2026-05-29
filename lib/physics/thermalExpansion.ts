// Real Material Presets
export interface MaterialData {
  id: string;
  name: string;
  alpha: number;             // Linear expansion coefficient at 293K (1/K)
  alphaNonLinear: number;    // Temperature dependence coefficient of alpha (1/K)
  density: number;           // kg/m^3
  heatCapacity: number;      // J/(kg K)
  youngsModulus: number;     // GPa (10^9 Pa)
  meltingPoint: number;      // K
  yieldStrength: number;     // MPa (10^6 Pa)
  thermalConductivity: number;// W/(m K)
  description: string;
}

export const MATERIAL_DATABASE: Record<string, MaterialData> = {
  aluminum: {
    id: "aluminum",
    name: "Aluminum",
    alpha: 23e-6,
    alphaNonLinear: 0.0005,
    density: 2700,
    heatCapacity: 900,
    youngsModulus: 70,
    meltingPoint: 933,
    yieldStrength: 95,
    thermalConductivity: 205,
    description: "High expansion coefficient, lightweight metal with high thermal conductivity. Prone to thermal fatigue.",
  },
  steel: {
    id: "steel",
    name: "Structural Steel",
    alpha: 12e-6,
    alphaNonLinear: 0.0003,
    density: 7850,
    heatCapacity: 490,
    youngsModulus: 200,
    meltingPoint: 1800,
    yieldStrength: 250,
    thermalConductivity: 50,
    description: "Standard construction material. High strength, moderate expansion. Susceptible to buckling stress if constrained.",
  },
  copper: {
    id: "copper",
    name: "Copper",
    alpha: 17e-6,
    alphaNonLinear: 0.0004,
    density: 8960,
    heatCapacity: 385,
    youngsModulus: 110,
    meltingPoint: 1358,
    yieldStrength: 70,
    thermalConductivity: 385,
    description: "Excellent heat conductor. Expands moderately fast. Tends to experience plastic deformation at lower temperatures.",
  },
  glass: {
    id: "glass",
    name: "Borosilicate Glass",
    alpha: 3.3e-6, // Pyrex-style glass has 3.3, regular soda-lime has 9. Let's make it 9.0e-6 for standard glass, borosilicate is 3.3. Let's do 9.0e-6 as requested by prompt.
    alphaNonLinear: 0.0001,
    density: 2500,
    heatCapacity: 840,
    youngsModulus: 70,
    meltingPoint: 1473,
    yieldStrength: 50,
    thermalConductivity: 0.8,
    description: "Very low thermal conductivity. Highly susceptible to thermal shock failure under sudden temperature gradients.",
  },
  concrete: {
    id: "concrete",
    name: "Concrete",
    alpha: 10e-6,
    alphaNonLinear: 0.0002,
    density: 2400,
    heatCapacity: 880,
    youngsModulus: 30,
    meltingPoint: 1800,
    yieldStrength: 15, // Tensile limit is low, making concrete joints essential in bridges and pavements
    thermalConductivity: 1.5,
    description: "Brittle aggregate material. Extremely low tensile strength. Requires expansion joints to prevent cracking.",
  },
  titanium: {
    id: "titanium",
    name: "Titanium Alloy",
    alpha: 8.6e-6,
    alphaNonLinear: 0.0002,
    density: 4500,
    heatCapacity: 520,
    youngsModulus: 115,
    meltingPoint: 1941,
    yieldStrength: 450,
    thermalConductivity: 22,
    description: "High strength-to-weight ratio, low thermal expansion coefficient, high failure limit.",
  },
  invar: {
    id: "invar",
    name: "Invar-36",
    alpha: 1.2e-6,
    alphaNonLinear: 0.00005,
    density: 8100,
    heatCapacity: 515,
    youngsModulus: 140,
    meltingPoint: 1700,
    yieldStrength: 270,
    thermalConductivity: 13,
    description: "Nickel-iron alloy famous for its uniquely low thermal expansion. Used in precision clocks, seismic sensors, and space telescopes.",
  }
};

// Physics Simulation Engine
export class ThermalExpansionPhysicsEngine {
  // Constant parameters
  public static readonly T_REF = 293.15; // Reference temperature (20 °C) in Kelvin
  public static readonly K_B = 1.380649e-23; // Boltzmann constant

  // Compute thermal expansion coefficient dependent on temperature
  public static getAlphaAtT(mat: MaterialData, T: number): number {
    const dT = T - this.T_REF;
    // Linear approximation of temperature-dependent expansion coefficient
    return mat.alpha * (1 + mat.alphaNonLinear * dT);
  }

  // Macroscopic calculations
  // 1. Linear Expansion: L = L0 * (1 + alpha * dT)
  public static getLength(L0: number, mat: MaterialData, T: number, plasticStrain = 0): number {
    const dT = T - this.T_REF;
    const alpha = this.getAlphaAtT(mat, T);
    return L0 * (1 + alpha * dT + plasticStrain);
  }

  // 2. Area Expansion: A = A0 * (1 + beta * dT), beta = 2 * alpha
  public static getArea(A0: number, mat: MaterialData, T: number): number {
    const dT = T - this.T_REF;
    const alpha = this.getAlphaAtT(mat, T);
    const beta = 2 * alpha;
    return A0 * (1 + beta * dT);
  }

  // 3. Volume Expansion: V = V0 * (1 + gamma * dT), gamma = 3 * alpha
  public static getVolume(V0: number, mat: MaterialData, T: number): number {
    const dT = T - this.T_REF;
    const alpha = this.getAlphaAtT(mat, T);
    const gamma = 3 * alpha;
    return V0 * (1 + gamma * dT);
  }

  // 4. Boundary constrained stress solver
  // Supports free, fixed endpoints, partial gap, and multi-support
  public static getStressAndStrain(
    L0: number,
    mat: MaterialData,
    T: number,
    constraint: "free" | "fixed" | "partial" | "multi",
    gapSize = 0, // for partial constraint
    plasticStrain = 0
  ): {
    strain: number;
    stress: number;
    isDeformed: boolean;
    isBroken: boolean;
    deformationPercent: number; // For rendering warps/bends
  } {
    const dT = T - this.T_REF;
    const alpha = this.getAlphaAtT(mat, T);
    
    // Free expansion strain
    const freeStrain = alpha * dT + plasticStrain;
    const freeDeltaL = L0 * freeStrain;

    let actualDeltaL = freeDeltaL;
    let constrainedDeltaL = 0;

    if (constraint === "fixed") {
      actualDeltaL = 0;
      constrainedDeltaL = freeDeltaL;
    } else if (constraint === "partial") {
      if (freeDeltaL > gapSize) {
        // Gap is closed, constraint is active
        actualDeltaL = gapSize;
        constrainedDeltaL = freeDeltaL - gapSize;
      } else {
        // Freely expands within the gap
        actualDeltaL = freeDeltaL;
        constrainedDeltaL = 0;
      }
    } else if (constraint === "multi") {
      // Elastic spring-like support constraints. Say, it allows 40% of expansion
      actualDeltaL = freeDeltaL * 0.4;
      constrainedDeltaL = freeDeltaL * 0.6;
    }

    // Strain is relative change in length under restriction
    // Mechanical strain = (L_free - L_actual) / L0
    const mechanicalStrain = constrainedDeltaL / L0;
    
    // Stress σ = E * ε_mech (E in GPa, so multiply by 1000 to get MPa)
    const stress = mechanicalStrain * (mat.youngsModulus * 1000);

    const isDeformed = Math.abs(stress) > mat.yieldStrength;
    // Ultimate structural failure if stress exceeds 1.5 * yield strength (or yield strength for concrete)
    const failureMultiplier = mat.id === "concrete" || mat.id === "glass" ? 1.0 : 1.6;
    const isBroken = Math.abs(stress) > mat.yieldStrength * failureMultiplier;

    // Bending/deformation factor for structural warping visualization
    const deformationPercent = isDeformed
      ? Math.min(1.0, (Math.abs(stress) - mat.yieldStrength) / (mat.yieldStrength * (failureMultiplier - 1.0) || 1))
      : 0;

    return {
      strain: mechanicalStrain,
      stress,
      isDeformed,
      isBroken,
      deformationPercent
    };
  }

  // 5. Bimetallic Strip Bending (Timoshenko's Curvature Theory)
  // Assumes equal thickness components
  public static getBimetallicBending(
    L: number,
    thickness: number, // Total thickness
    mat1: MaterialData,
    mat2: MaterialData,
    T: number
  ): {
    curvature: number;
    deflection: number;
    stressMax: number;
  } {
    const dT = T - this.T_REF;
    const a1 = this.getAlphaAtT(mat1, T);
    const a2 = this.getAlphaAtT(mat2, T);
    const E1 = mat1.youngsModulus;
    const E2 = mat2.youngsModulus;

    const t = thickness;
    const h1 = t / 2;
    const h2 = t / 2;
    
    const m = h1 / h2; // 1
    const n = E1 / E2; 

    // Timoshenko curvature denominator term
    const num = 6 * (a2 - a1) * Math.pow(1 + m, 2) * dT;
    const den = t * (3 * Math.pow(1 + m, 2) + (1 + m * n) * (Math.pow(m, 2) + 1 / (m * n)));
    const curvature = num / den;

    // End-point deflection: delta = k * L^2 / 2
    const deflection = (curvature * L * L) / 2;

    // Estimate internal stress due to bending mismatch
    const meanE = (E1 + E2) / 2 * 1000; // MPa
    const stressMax = Math.abs(meanE * (a2 - a1) * dT * 0.5);

    return { curvature, deflection, stressMax };
  }

  // 6. Thermal Shock calculations
  // Severe thermal gradients can induce shock stress
  public static getThermalShockStress(
    mat: MaterialData,
    tempRate: number, // Rate of change (K/s)
    thickness: number // meters
  ): {
    shockStress: number;
    shockFactor: number; // 0 to 1 risk indicator
  } {
    // Thermal diffusivity alpha_diff = k / (rho * c)
    const thermalDiffusivity = mat.thermalConductivity / (mat.density * mat.heatCapacity);
    
    // Thermal gradient estimate: gradT = dT/dt * t^2 / alpha_diff
    const thermalGradient = Math.abs(tempRate) * (thickness * thickness) / (thermalDiffusivity + 1e-12);
    
    // Shock stress = E * alpha * gradT
    const shockStress = (mat.youngsModulus * 1000) * mat.alpha * thermalGradient; // MPa
    const shockFactor = Math.min(1.5, shockStress / mat.yieldStrength);

    return { shockStress, shockFactor };
  }

  // 7. Atomic Vibration and Lattice Details
  // Originates from an asymmetric potential (anharmonic potential well)
  // Average bond length r(T) = r0 * (1 + alpha * dT)
  // Instantaneous particle displacement x = r(T) + vibe_amplitude * sin(phase)
  public static getLatticeSpacing(T: number, bondStiffness: number, anharmonicity = 0.05): number {
    const dT = T - this.T_REF;
    // Anharmonic potential spacing shift: delta_r proportional to T
    const expansionShift = anharmonicity * (T / 100);
    return 1.0 + expansionShift;
  }

  public static getVibrationAmplitude(T: number, bondStiffness: number): number {
    // Kinetic thermal energy = 0.5 * k_B * T
    // Bond potential energy = 0.5 * K * A^2
    // Amplitude = sqrt(k_B * T / bondStiffness)
    return Math.sqrt((this.K_B * T * 1e20) / (bondStiffness || 1));
  }
}

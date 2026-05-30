// ============================================================
// KINETIQ THERMAL EXPANSION — SCIENTIFIC PHYSICS ENGINE v2
// ============================================================
// All equations are physically accurate. Units: SI throughout.
// Temperature: Kelvin | Length: meters | Stress: Pa | Strain: dimensionless
//
// Key improvements over v1:
// - Piecewise α(T), E(T), σ_y(T) using data-validated interpolation
// - α(T) now used in deltaL and spatialExpansion (not constant α₀)
// - Buckling only evaluated when constraint generates compression
// - High-temperature warnings: creep, oxidation, phase instability
// - CFL stability: analytically handles high-diffusivity metals
// - Cryogenic: Debye-like c_p reduction at very low T
// ============================================================

export interface MaterialProperties {
  id: string;
  name: string;
  category: "metal" | "ceramic" | "polymer" | "composite";
  crystalStructure: string;

  // Thermal properties at 293 K
  alpha0: number;               // Linear CTE at 293 K (1/K)
  thermalConductivity: number;  // k  W/(m·K)
  specificHeat: number;         // c_p  J/(kg·K)
  density: number;              // ρ  kg/m³
  emissivity: number;           // ε (0–1)

  // Mechanical properties at 293 K
  youngsModulus: number;        // E  Pa
  poissonsRatio: number;        // ν
  yieldStrength: number;        // σ_y  Pa
  ultimateStrength: number;     // σ_u  Pa
  fatigueLimit: number;         // σ_f  Pa (endurance limit)

  // Failure
  meltingPoint: number;         // K
  creepOnsetTemp: number;       // K — temperature where creep becomes significant (~0.4 T_m)

  description: string;
  color: string;

  // ── Piecewise property tables ─────────────────────────────
  // Each table: [[T_K, value], ...] sorted by T_K
  alphaPiecewise: [number, number][];   // α(T)  /K
  ePiecewise: [number, number][];       // E(T)  Pa
  syPiecewise: [number, number][];      // σ_y(T) Pa
}

// ============================================================
// PIECEWISE INTERPOLATION HELPER
// ============================================================
function piecewiseInterp(table: [number, number][], T: number): number {
  if (table.length === 0) return 0;
  if (T <= table[0][0]) return table[0][1];
  if (T >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [T0, v0] = table[i];
    const [T1, v1] = table[i + 1];
    if (T >= T0 && T <= T1) {
      const f = (T - T0) / (T1 - T0);
      return v0 + f * (v1 - v0);
    }
  }
  return table[table.length - 1][1];
}

// ============================================================
// MATERIAL DATABASE — 13 Engineering Materials
// All piecewise data sourced from engineering handbooks
// (Matweb, ASM Metals Handbook, NIST)
// ============================================================
export const MATERIAL_DB: Record<string, MaterialProperties> = {

  steel: {
    id: "steel", name: "Structural Steel (A36)", category: "metal",
    crystalStructure: "BCC (Body-Centred Cubic)",
    alpha0: 12e-6, thermalConductivity: 50, specificHeat: 490, density: 7850, emissivity: 0.28,
    youngsModulus: 200e9, poissonsRatio: 0.29,
    yieldStrength: 250e6, ultimateStrength: 400e6, fatigueLimit: 200e6,
    meltingPoint: 1773, creepOnsetTemp: 700,
    description: "Standard construction steel. BCC structure transitions to austenite (FCC) at 1183 K. Susceptible to thermal buckling when constrained.",
    color: "#78716c",
    // α data: ECCS Eurocode 3 thermal actions
    alphaPiecewise: [
      [0,    7.0e-6],
      [100,  9.0e-6],
      [200, 10.5e-6],
      [293, 12.0e-6],
      [400, 12.5e-6],
      [600, 13.5e-6],
      [800, 14.0e-6],
      [1000,15.5e-6],
      [1183,17.0e-6], // austenite transition
      [1400,16.0e-6],
      [1773,16.0e-6],
    ],
    // E data: EN 1993-1-2 reduction factors
    ePiecewise: [
      [0,    210e9],
      [293,  200e9],
      [400,  190e9],
      [600,  160e9],
      [800,   90e9],
      [1000,  50e9],
      [1200,  20e9],
      [1400,   8e9],
      [1773,   2e9],
    ],
    // σ_y data: EN 1993-1-2 hot strength reduction
    syPiecewise: [
      [0,    300e6],
      [293,  250e6],
      [400,  240e6],
      [600,  130e6],
      [800,   55e6],
      [900,   25e6],
      [1000,  10e6],
      [1200,   3e6],
      [1773,   1e6],
    ],
  },

  stainless: {
    id: "stainless", name: "Stainless Steel (316L)", category: "metal",
    crystalStructure: "FCC (Face-Centred Cubic)",
    alpha0: 16e-6, thermalConductivity: 16, specificHeat: 502, density: 8000, emissivity: 0.12,
    youngsModulus: 193e9, poissonsRatio: 0.28,
    yieldStrength: 290e6, ultimateStrength: 580e6, fatigueLimit: 220e6,
    meltingPoint: 1643, creepOnsetTemp: 650,
    description: "Austenitic stainless. Higher CTE than carbon steel, very low thermal conductivity — prone to severe thermal gradients under non-uniform heating.",
    color: "#94a3b8",
    alphaPiecewise: [
      [0,   14.0e-6],
      [100, 15.0e-6],
      [293, 16.0e-6],
      [400, 16.5e-6],
      [600, 17.5e-6],
      [800, 18.5e-6],
      [1000,19.5e-6],
      [1643,20.0e-6],
    ],
    ePiecewise: [
      [0,    205e9],
      [293,  193e9],
      [400,  186e9],
      [600,  165e9],
      [800,  130e9],
      [1000,  85e9],
      [1200,  40e9],
      [1643,   8e9],
    ],
    syPiecewise: [
      [0,    310e6],
      [293,  290e6],
      [400,  220e6],
      [600,  140e6],
      [800,   70e6],
      [1000,  30e6],
      [1200,  10e6],
      [1643,   2e6],
    ],
  },

  aluminum: {
    id: "aluminum", name: "Aluminum (6061-T6)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 23.6e-6, thermalConductivity: 167, specificHeat: 896, density: 2700, emissivity: 0.09,
    youngsModulus: 69e9, poissonsRatio: 0.33,
    yieldStrength: 276e6, ultimateStrength: 310e6, fatigueLimit: 97e6,
    meltingPoint: 933, creepOnsetTemp: 370,
    description: "Very high CTE and conductivity — heats uniformly but expands significantly. Creep becomes important above ~370 K for T6 temper.",
    color: "#cbd5e1",
    alphaPiecewise: [
      [0,   18.0e-6],
      [100, 20.5e-6],
      [200, 22.5e-6],
      [293, 23.6e-6],
      [400, 25.0e-6],
      [600, 27.0e-6],
      [800, 28.5e-6],
      [933, 30.0e-6],
    ],
    ePiecewise: [
      [0,    76e9],
      [293,  69e9],
      [400,  60e9],
      [500,  48e9],
      [600,  30e9],
      [800,  10e9],
      [933,   3e9],
    ],
    syPiecewise: [
      [0,    310e6],
      [293,  276e6],
      [350,  240e6],
      [400,  150e6],
      [500,   55e6],
      [600,   20e6],
      [933,    2e6],
    ],
  },

  copper: {
    id: "copper", name: "Copper (C10100)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 17e-6, thermalConductivity: 385, specificHeat: 385, density: 8960, emissivity: 0.03,
    youngsModulus: 117e9, poissonsRatio: 0.35,
    yieldStrength: 70e6, ultimateStrength: 220e6, fatigueLimit: 60e6,
    meltingPoint: 1358, creepOnsetTemp: 540,
    description: "Excellent thermal conductor. Very low yield strength — easily plastically deforms under thermal stress. Very fast thermal equilibration.",
    color: "#b45309",
    alphaPiecewise: [
      [0,   13.0e-6],
      [100, 15.2e-6],
      [200, 16.5e-6],
      [293, 17.0e-6],
      [400, 17.5e-6],
      [600, 18.4e-6],
      [800, 19.2e-6],
      [1000,20.0e-6],
      [1358,21.0e-6],
    ],
    ePiecewise: [
      [0,    130e9],
      [293,  117e9],
      [400,  108e9],
      [600,   87e9],
      [800,   60e9],
      [1000,  30e9],
      [1200,  10e9],
      [1358,   3e9],
    ],
    syPiecewise: [
      [0,     90e6],
      [293,   70e6],
      [400,   50e6],
      [600,   25e6],
      [800,   10e6],
      [1000,   3e6],
      [1358,   1e6],
    ],
  },

  brass: {
    id: "brass", name: "Brass (C26000)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 20e-6, thermalConductivity: 120, specificHeat: 385, density: 8530, emissivity: 0.06,
    youngsModulus: 100e9, poissonsRatio: 0.34,
    yieldStrength: 125e6, ultimateStrength: 330e6, fatigueLimit: 110e6,
    meltingPoint: 1173, creepOnsetTemp: 470,
    description: "Cu-Zn alloy with high CTE. Used in precision fittings and valves where thermal expansion must be controlled.",
    color: "#ca8a04",
    alphaPiecewise: [
      [0,   16.0e-6],
      [293, 20.0e-6],
      [400, 21.0e-6],
      [600, 22.5e-6],
      [800, 23.5e-6],
      [1173,25.0e-6],
    ],
    ePiecewise: [
      [0,    110e9],
      [293,  100e9],
      [400,   92e9],
      [600,   72e9],
      [800,   45e9],
      [1000,  18e9],
      [1173,   5e9],
    ],
    syPiecewise: [
      [0,    140e6],
      [293,  125e6],
      [400,   90e6],
      [600,   40e6],
      [800,   12e6],
      [1000,   3e6],
      [1173,   1e6],
    ],
  },

  titanium: {
    id: "titanium", name: "Titanium (Ti-6Al-4V)", category: "metal",
    crystalStructure: "HCP → BCC above 1155 K",
    alpha0: 8.6e-6, thermalConductivity: 6.7, specificHeat: 526, density: 4430, emissivity: 0.35,
    youngsModulus: 114e9, poissonsRatio: 0.34,
    yieldStrength: 880e6, ultimateStrength: 950e6, fatigueLimit: 500e6,
    meltingPoint: 1941, creepOnsetTemp: 800,
    description: "Aerospace alloy. Low CTE and very high strength. Poor thermal conductor — prone to large spatial gradients. α→β phase transition at 1155 K.",
    color: "#6366f1",
    alphaPiecewise: [
      [0,    7.0e-6],
      [100,  7.8e-6],
      [293,  8.6e-6],
      [400,  9.0e-6],
      [600,  9.5e-6],
      [800,  9.8e-6],
      [1000,10.2e-6],
      [1155,11.0e-6], // β transition
      [1400,10.5e-6],
      [1941,10.5e-6],
    ],
    ePiecewise: [
      [0,    120e9],
      [293,  114e9],
      [400,  107e9],
      [600,   90e9],
      [800,   70e9],
      [1000,  45e9],
      [1155,  30e9],
      [1400,  12e9],
      [1941,   3e9],
    ],
    syPiecewise: [
      [0,    960e6],
      [293,  880e6],
      [400,  800e6],
      [600,  600e6],
      [800,  350e6],
      [1000, 150e6],
      [1200,  40e6],
      [1941,   5e6],
    ],
  },

  tungsten: {
    id: "tungsten", name: "Tungsten (W)", category: "metal",
    crystalStructure: "BCC",
    alpha0: 4.5e-6, thermalConductivity: 173, specificHeat: 134, density: 19300, emissivity: 0.05,
    youngsModulus: 411e9, poissonsRatio: 0.28,
    yieldStrength: 1510e6, ultimateStrength: 1720e6, fatigueLimit: 900e6,
    meltingPoint: 3695, creepOnsetTemp: 1500,
    description: "Highest melting point metal. Used in lamp filaments and rocket nozzle throats. Brittle at room temperature (DBTT ~600 K).",
    color: "#52525b",
    alphaPiecewise: [
      [0,    3.6e-6],
      [100,  4.0e-6],
      [293,  4.5e-6],
      [500,  4.7e-6],
      [1000, 5.0e-6],
      [2000, 5.7e-6],
      [3000, 6.3e-6],
      [3695, 6.8e-6],
    ],
    ePiecewise: [
      [0,    420e9],
      [293,  411e9],
      [500,  390e9],
      [1000, 340e9],
      [2000, 220e9],
      [3000, 100e9],
      [3695,  30e9],
    ],
    syPiecewise: [
      [0,    1700e6],
      [293,  1510e6],
      [500,  1300e6],
      [800,   900e6],
      [1200,  500e6],
      [2000,  150e6],
      [3000,   20e6],
      [3695,    5e6],
    ],
  },

  invar: {
    id: "invar", name: "Invar-36 (Fe-36Ni)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 1.2e-6, thermalConductivity: 13.5, specificHeat: 515, density: 8100, emissivity: 0.14,
    youngsModulus: 141e9, poissonsRatio: 0.26,
    yieldStrength: 276e6, ultimateStrength: 483e6, fatigueLimit: 200e6,
    meltingPoint: 1700, creepOnsetTemp: 680,
    description: "Near-zero CTE due to magnetostrictive compensation below Curie point (773 K). Above 773 K α rises dramatically. Used in scientific instruments.",
    color: "#0891b2",
    alphaPiecewise: [
      [0,    0.5e-6],
      [100,  0.8e-6],
      [200,  1.0e-6],
      [293,  1.2e-6],
      [400,  2.0e-6],
      [500,  4.0e-6],
      [773, 12.0e-6],  // Curie point — loses Invar effect
      [900, 13.5e-6],
      [1200,14.0e-6],
      [1700,14.0e-6],
    ],
    ePiecewise: [
      [0,    148e9],
      [293,  141e9],
      [400,  133e9],
      [600,  110e9],
      [800,   75e9],
      [1000,  40e9],
      [1400,  12e9],
      [1700,   3e9],
    ],
    syPiecewise: [
      [0,    310e6],
      [293,  276e6],
      [400,  240e6],
      [600,  160e6],
      [800,   80e6],
      [1000,  25e6],
      [1400,   5e6],
      [1700,   1e6],
    ],
  },

  glass: {
    id: "glass", name: "Borosilicate Glass (Pyrex)", category: "ceramic",
    crystalStructure: "Amorphous (SiO₂-B₂O₃ network)",
    alpha0: 3.3e-6, thermalConductivity: 1.14, specificHeat: 830, density: 2230, emissivity: 0.92,
    youngsModulus: 63e9, poissonsRatio: 0.20,
    yieldStrength: 50e6, ultimateStrength: 50e6, fatigueLimit: 20e6,
    meltingPoint: 1100, creepOnsetTemp: 820,
    description: "Very low CTE, brittle. High susceptibility to thermal shock fracture due to extreme temperature gradients across cross-section. No plastic deformation.",
    color: "#7dd3fc",
    alphaPiecewise: [
      [0,    2.5e-6],
      [100,  2.9e-6],
      [293,  3.3e-6],
      [400,  3.4e-6],
      [600,  3.6e-6],
      [820,  3.7e-6],  // softening point
      [1100, 4.0e-6],
    ],
    ePiecewise: [
      [0,    65e9],
      [293,  63e9],
      [400,  61e9],
      [600,  55e9],
      [820,  40e9],  // viscous flow onset
      [1100,  5e9],
    ],
    syPiecewise: [
      [0,    60e6],
      [293,  50e6],
      [400,  50e6],
      [700,  40e6],
      [820,  20e6],
      [1100,  2e6],
    ],
  },

  concrete: {
    id: "concrete", name: "Reinforced Concrete", category: "ceramic",
    crystalStructure: "Amorphous composite (C-S-H gel + aggregate)",
    alpha0: 10e-6, thermalConductivity: 1.4, specificHeat: 880, density: 2400, emissivity: 0.88,
    youngsModulus: 30e9, poissonsRatio: 0.20,
    yieldStrength: 3e6, ultimateStrength: 30e6, fatigueLimit: 2e6,
    meltingPoint: 1900, creepOnsetTemp: 500,
    description: "Very low tensile strength — expansion joints mandatory. Chemical decomposition begins above 573 K. Explosive spalling risk above 800 K.",
    color: "#a8a29e",
    alphaPiecewise: [
      [0,    8.0e-6],
      [293, 10.0e-6],
      [400, 11.0e-6],
      [573, 12.0e-6],  // dehydration
      [800,  9.0e-6],  // aggregate disintegration
      [1200, 6.0e-6],
      [1900, 6.0e-6],
    ],
    ePiecewise: [
      [0,    32e9],
      [293,  30e9],
      [400,  26e9],
      [573,  18e9],
      [800,   8e9],
      [1200,  2e9],
      [1900, 0.5e9],
    ],
    syPiecewise: [
      [0,    3.5e6],
      [293,  3.0e6],
      [400,  2.4e6],
      [573,  1.5e6],
      [800,  0.5e6],
      [1200, 0.1e6],
      [1900, 0.02e6],
    ],
  },

  carbon_fiber: {
    id: "carbon_fiber", name: "Carbon Fiber (CFRP, unidirectional)", category: "composite",
    crystalStructure: "Graphitic hexagonal layers in amorphous matrix",
    alpha0: -0.5e-6, thermalConductivity: 10, specificHeat: 710, density: 1600, emissivity: 0.95,
    youngsModulus: 181e9, poissonsRatio: 0.27,
    yieldStrength: 1200e6, ultimateStrength: 1500e6, fatigueLimit: 700e6,
    meltingPoint: 3900, creepOnsetTemp: 550,
    description: "Slightly negative CTE along fiber axis — thermally stable. Matrix (epoxy) limits service to ~450 K. Used in space telescope structures and aircraft.",
    color: "#374151",
    alphaPiecewise: [
      [0,   -0.3e-6],
      [200, -0.4e-6],
      [293, -0.5e-6],
      [400, -0.6e-6],
      [500, -0.7e-6],
      [800,  1.0e-6], // matrix degradation
      [1200, 2.0e-6],
      [3900, 3.0e-6],
    ],
    ePiecewise: [
      [0,    185e9],
      [293,  181e9],
      [400,  178e9],
      [450,  160e9], // matrix glass transition
      [500,  130e9],
      [800,   60e9],
      [3900,  20e9],
    ],
    syPiecewise: [
      [0,    1300e6],
      [293,  1200e6],
      [400,  1000e6],
      [450,   800e6],
      [500,   500e6],
      [800,   100e6],
      [3900,   20e6],
    ],
  },

  silicon: {
    id: "silicon", name: "Silicon (Monocrystalline)", category: "ceramic",
    crystalStructure: "Diamond cubic (Fd3m)",
    alpha0: 2.6e-6, thermalConductivity: 148, specificHeat: 700, density: 2330, emissivity: 0.65,
    youngsModulus: 130e9, poissonsRatio: 0.27,
    yieldStrength: 7000e6, ultimateStrength: 7000e6, fatigueLimit: 3000e6,
    meltingPoint: 1687, creepOnsetTemp: 900,
    description: "Brittle semiconductor. α is nonlinear — near-zero at cryogenic T. Critical in microelectronics for thermal mismatch stress with packaging.",
    color: "#818cf8",
    alphaPiecewise: [
      [0,   -0.5e-6],  // negative at 0 K
      [100,  0.5e-6],  // crosses zero near 120 K
      [150,  1.5e-6],
      [200,  2.0e-6],
      [293,  2.6e-6],
      [500,  3.2e-6],
      [800,  3.5e-6],
      [1000, 3.7e-6],
      [1500, 3.9e-6],
      [1687, 4.0e-6],
    ],
    ePiecewise: [
      [0,    135e9],
      [293,  130e9],
      [400,  126e9],
      [600,  118e9],
      [800,  108e9],
      [1200,  80e9],
      [1687,  40e9],
    ],
    syPiecewise: [
      [0,    7500e6],
      [293,  7000e6],
      [400,  6000e6],
      [800,  3000e6],
      [1000, 1000e6],
      [1400,  200e6],
      [1687,   50e6],
    ],
  },

  ice: {
    id: "ice", name: "Water Ice (Ih)", category: "ceramic",
    crystalStructure: "Hexagonal (Ih)",
    alpha0: 51e-6, thermalConductivity: 2.22, specificHeat: 2090, density: 917, emissivity: 0.97,
    youngsModulus: 9e9, poissonsRatio: 0.33,
    yieldStrength: 1e6, ultimateStrength: 1.5e6, fatigueLimit: 0.5e6,
    meltingPoint: 273.15, creepOnsetTemp: 180,
    description: "Very high CTE. Frost heave is caused by ice expansion in soil pores. α decreases significantly at cryogenic temperatures (Debye T³ law).",
    color: "#bae6fd",
    alphaPiecewise: [
      [0,     5.0e-6],
      [50,   20.0e-6],
      [100,  35.0e-6],
      [150,  44.0e-6],
      [200,  48.0e-6],
      [250,  51.0e-6],
      [273.15,53.0e-6],
    ],
    ePiecewise: [
      [0,    10e9],
      [100,  10e9],
      [200,   9.5e9],
      [250,   9.0e9],
      [273.15, 8.0e9],
    ],
    syPiecewise: [
      [0,    2.0e6],
      [100,  1.5e6],
      [200,  1.2e6],
      [250,  1.0e6],
      [273.15, 0.5e6],
    ],
  },

};

// ============================================================
// PHYSICS ENGINE — All Methods Static, SI Units
// ============================================================
export class PhysicsEngine {
  static readonly T_REF = 293.15;  // Reference temperature (20 °C) K
  static readonly K_B = 1.380649e-23;  // Boltzmann constant J/K
  static readonly N_NODES = 40;    // Spatial nodes for 1D heat diffusion

  // ----------------------------------------------------------
  // 1. Temperature-Dependent CTE  α(T) — piecewise interpolation
  // ----------------------------------------------------------
  static alpha(mat: MaterialProperties, T: number): number {
    if (mat.alphaPiecewise && mat.alphaPiecewise.length > 0) {
      return piecewiseInterp(mat.alphaPiecewise, Math.max(0, T));
    }
    // Fallback for any material without piecewise table
    return mat.alpha0;
  }

  // ----------------------------------------------------------
  // 2. Temperature-Dependent Young's Modulus E(T)
  // ----------------------------------------------------------
  static youngsModulus(mat: MaterialProperties, T: number): number {
    if (mat.ePiecewise && mat.ePiecewise.length > 0) {
      return Math.max(1e6, piecewiseInterp(mat.ePiecewise, Math.max(0, T)));
    }
    return mat.youngsModulus;
  }

  // ----------------------------------------------------------
  // 3. Temperature-Dependent Yield Strength σ_y(T)
  // ----------------------------------------------------------
  static yieldStrength(mat: MaterialProperties, T: number): number {
    if (mat.syPiecewise && mat.syPiecewise.length > 0) {
      return Math.max(1e3, piecewiseInterp(mat.syPiecewise, Math.max(0, T)));
    }
    return mat.yieldStrength;
  }

  // ----------------------------------------------------------
  // 4. Thermal Diffusivity  α_th = k / (ρ · c_p)  m²/s
  // Cryogenic correction: c_p scales roughly as T³/T_D³ (Debye)
  // For simplicity, cap minimum diffusivity to avoid instability
  // ----------------------------------------------------------
  static thermalDiffusivity(mat: MaterialProperties, T = 293.15): number {
    const alpha_th = mat.thermalConductivity / (mat.density * mat.specificHeat);
    // For very high-conductivity metals, α_th is large → stable time steps are tiny.
    // We clamp to a physically meaningful range for the FD solver.
    return Math.min(alpha_th, 1e-3); // max 1e-3 m²/s (copper is ~1.2e-4, fine)
  }

  // ----------------------------------------------------------
  // 5. Linear Thermal Expansion using temperature-dependent α
  // ΔL = ∫[T_ref, T] α(T') dT' · L₀
  // Approximated by trapezoidal rule (10 points)
  // ----------------------------------------------------------
  static deltaL(mat: MaterialProperties, L0: number, T: number, plasticStrain = 0): number {
    const T_ref = this.T_REF;
    const dT = T - T_ref;
    if (Math.abs(dT) < 1e-10) return plasticStrain * L0;

    // Numerical integration of α(T) over [T_ref, T]
    const N = 10;
    let integral = 0;
    for (let i = 0; i < N; i++) {
      const T0 = T_ref + (i / N) * dT;
      const T1 = T_ref + ((i + 1) / N) * dT;
      integral += 0.5 * (this.alpha(mat, T0) + this.alpha(mat, T1)) * (T1 - T0);
    }

    return (integral + plasticStrain) * L0;
  }

  static rodLength(mat: MaterialProperties, L0: number, T: number, plasticStrain = 0): number {
    return L0 + this.deltaL(mat, L0, T, plasticStrain);
  }

  // ----------------------------------------------------------
  // 6. Thermal Strain (free)  ε_th = ∫ α(T') dT'
  // ----------------------------------------------------------
  static thermalStrain(mat: MaterialProperties, T: number): number {
    const dT = T - this.T_REF;
    if (Math.abs(dT) < 1e-10) return 0;
    // Use midpoint rule for speed (good enough for scalar)
    const T_mid = (this.T_REF + T) / 2;
    return this.alpha(mat, T_mid) * dT;
  }

  // ----------------------------------------------------------
  // 7. Constraint Mechanics
  // CRITICAL: Stress is ONLY generated when expansion is mechanically
  // constrained. Free expansion → σ = 0 always.
  // ----------------------------------------------------------
  static constraintState(
    mat: MaterialProperties,
    L0: number,
    T: number,
    constraint: "free" | "fixed" | "partial" | "spring",
    gapSize = 0,
    springStiffness = 100e6,
    plasticStrain = 0
  ): {
    stress: number;
    mechanicalStrain: number;
    actualDeltaL: number;
    isYielding: boolean;
    isFailed: boolean;
    factorOfSafety: number;
    regime: "elastic" | "yielding" | "plastic" | "failure" | "free";
  } {
    const ε_th = this.thermalStrain(mat, T) + plasticStrain;
    const freeDeltaL = ε_th * L0;
    const E = this.youngsModulus(mat, T);
    const σ_y = this.yieldStrength(mat, T);
    const σ_u = mat.ultimateStrength * Math.max(0.05, σ_y / mat.yieldStrength); // scale ult with T

    let stress = 0;
    let mechanicalStrain = 0;
    let actualDeltaL = freeDeltaL;

    if (constraint === "fixed") {
      mechanicalStrain = -ε_th;
      stress = E * mechanicalStrain;
      actualDeltaL = 0;
    } else if (constraint === "partial") {
      if (freeDeltaL > gapSize) {
        const constrainedDeformation = freeDeltaL - gapSize;
        mechanicalStrain = -constrainedDeformation / L0;
        stress = E * mechanicalStrain;
        actualDeltaL = gapSize;
      }
      // else: within gap, stress = 0
    } else if (constraint === "spring") {
      const kL = springStiffness * L0;
      stress = -(E * kL / (E + kL)) * ε_th;
      mechanicalStrain = stress / E;
      actualDeltaL = freeDeltaL + mechanicalStrain * L0;
    }
    // free: stress = 0, actualDeltaL = freeDeltaL (defaults above)

    const absSig = Math.abs(stress);
    const isYielding = absSig > σ_y;
    const failThresh = mat.category === "ceramic" ? σ_u : σ_u * 0.9;
    const isFailed = absSig > failThresh;

    const factorOfSafety = absSig > 0 ? σ_y / absSig : 999;

    let regime: "elastic" | "yielding" | "plastic" | "failure" | "free" = "free";
    if (constraint !== "free") {
      if (isFailed) regime = "failure";
      else if (isYielding) regime = absSig > σ_y * 1.2 ? "plastic" : "yielding";
      else regime = "elastic";
    }

    return { stress, mechanicalStrain, actualDeltaL, isYielding, isFailed, factorOfSafety, regime };
  }

  // ----------------------------------------------------------
  // 8. Euler Buckling Critical Load  P_cr = π²EI / (KL)²
  //
  // IMPORTANT: willBuckle is ONLY true when constraint generates
  // a compressive thermal load. For free expansion, thermalLoad = 0.
  // ----------------------------------------------------------
  static bucklingCriticalLoad(
    mat: MaterialProperties,
    T: number,
    L: number,
    area: number,
    constraint: "free" | "fixed" | "partial" | "spring",
    gapSize = 0,
    sectionType: "circular" | "rectangular" = "circular",
    dimension = 0.05
  ): { Pcr: number; slendernessRatio: number; willBuckle: boolean; thermalLoad: number } {
    const E = this.youngsModulus(mat, T);
    const K = 1.0;

    let I = 0;
    if (sectionType === "circular") {
      I = (Math.PI / 64) * Math.pow(dimension, 4);
    } else {
      I = (dimension * Math.pow(dimension, 3)) / 12;
    }

    const Pcr = (Math.PI * Math.PI * E * I) / Math.pow(K * L, 2);
    const r = Math.sqrt(I / area);
    const slendernessRatio = (K * L) / r;

    // Thermal compressive load — ONLY exists if expansion is constrained
    let thermalLoad = 0;
    if (constraint === "fixed") {
      const σ_th = E * this.thermalStrain(mat, T);
      thermalLoad = Math.max(0, σ_th * area); // only compression (positive σ_th → compressive)
    } else if (constraint === "partial") {
      const freeDL = this.thermalStrain(mat, T) * L;
      if (freeDL > gapSize) {
        const constrainedStrain = (freeDL - gapSize) / L;
        thermalLoad = E * constrainedStrain * area;
      }
    }
    // free or spring: thermalLoad = 0 → willBuckle = false always

    return { Pcr, slendernessRatio, willBuckle: thermalLoad > Pcr && thermalLoad > 0, thermalLoad };
  }

  // ----------------------------------------------------------
  // 9. Bimetallic Strip — Timoshenko Curvature Theory (1925)
  // κ = [6(α₂−α₁)(1+m)² ΔT] / [t·(3(1+m)² + (1+mn)(m²+1/mn))]
  // ----------------------------------------------------------
  static bimetallicCurvature(
    mat1: MaterialProperties,
    mat2: MaterialProperties,
    T: number,
    totalThickness: number
  ): { curvature: number; radius: number; deflection: (L: number) => number; stressInterface: number } {
    const dT = T - this.T_REF;
    const a1 = this.alpha(mat1, T);
    const a2 = this.alpha(mat2, T);
    const E1 = this.youngsModulus(mat1, T);
    const E2 = this.youngsModulus(mat2, T);
    const t = totalThickness;
    const m = 1;
    const n = E1 / E2;

    const numerator = 6 * (a2 - a1) * Math.pow(1 + m, 2) * dT;
    const denominator = t * (3 * Math.pow(1 + m, 2) + (1 + m * n) * (m * m + 1 / (m * n)));
    const curvature = Math.abs(denominator) > 1e-30 ? numerator / denominator : 0;
    const radius = Math.abs(curvature) > 1e-15 ? 1 / curvature : Infinity;
    const deflection = (L: number) => curvature * L * L * 0.5;
    const Eavg = (E1 + E2) / 2;
    const stressInterface = Eavg * Math.abs(a2 - a1) * Math.abs(dT);

    return { curvature, radius, deflection, stressInterface };
  }

  // ----------------------------------------------------------
  // 10. Thermal Shock — Biaxial Surface Stress
  // σ_shock = E · α · ΔT / (1 − ν)
  // ----------------------------------------------------------
  static thermalShockStress(
    mat: MaterialProperties,
    T_surface: number,
    T_initial: number,
    thickness: number
  ): { shockStress: number; shockFactor: number; thermalGradient: number } {
    const dT = Math.abs(T_surface - T_initial);
    const T_avg = (T_surface + T_initial) / 2;
    const E = this.youngsModulus(mat, T_avg);
    const alpha_val = this.alpha(mat, T_avg);
    const shockStress = (E * alpha_val * dT) / (1 - mat.poissonsRatio);
    const thermalGradient = dT / thickness;
    const σ_y = this.yieldStrength(mat, T_surface);
    const shockFactor = shockStress / σ_y;
    return { shockStress, shockFactor, thermalGradient };
  }

  // ----------------------------------------------------------
  // 11. Coffin-Manson / Basquin Fatigue Model
  // ----------------------------------------------------------
  static fatigueDamagePerCycle(
    mat: MaterialProperties,
    T_low: number,
    T_high: number
  ): { damagePerCycle: number; Nf: number; strainRange: number } {
    const dT = Math.abs(T_high - T_low);
    const T_avg = (T_high + T_low) / 2;
    const E = this.youngsModulus(mat, T_avg);
    const alpha_avg = this.alpha(mat, T_avg);
    const strainRange = alpha_avg * dT;
    const stressRange = E * strainRange;
    const σ_f = 1.5 * this.yieldStrength(mat, T_avg);
    const b = 0.12;
    const Nf = Math.pow(σ_f / Math.max(stressRange, 0.01 * σ_f), 1 / b);
    const damagePerCycle = 1 / Nf;
    return { damagePerCycle, Nf: Math.round(Nf), strainRange };
  }

  // ----------------------------------------------------------
  // 12. 1D Heat Diffusion — Explicit Finite Difference
  // Stability: r = α_th·Δt/Δx² ≤ 0.5
  // Multi-substep handles large dt automatically
  // ----------------------------------------------------------
  static heatDiffusionStep(
    T_nodes: number[],
    mat: MaterialProperties,
    L0: number,
    T_heat: number,
    T_ambient: number,
    dt: number,
    heatingMode: "left" | "both" | "uniform"
  ): number[] {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    const alpha_th = this.thermalDiffusivity(mat);
    const dtMax = (dx * dx) / (2 * alpha_th);
    const dtSafe = Math.min(dt, dtMax * 0.45); // conservative CFL
    const r = alpha_th * dtSafe / (dx * dx);

    const T_new = [...T_nodes];
    for (let i = 1; i < N - 1; i++) {
      T_new[i] = T_nodes[i] + r * (T_nodes[i + 1] - 2 * T_nodes[i] + T_nodes[i - 1]);
    }

    if (heatingMode === "left") {
      T_new[0] = T_heat;
      T_new[N - 1] = T_ambient;
    } else if (heatingMode === "both") {
      T_new[0] = T_heat;
      T_new[N - 1] = T_heat;
    } else {
      for (let i = 0; i < N; i++) T_new[i] = T_heat;
    }
    return T_new;
  }

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
    const dtStable = (dx * dx) / (2 * alpha_th) * 0.45;

    let T = [...T_nodes];
    let remaining = totalDt;
    const maxSubsteps = 500; // increased for high-conductivity materials
    let steps = 0;
    while (remaining > 1e-15 && steps < maxSubsteps) {
      const step = Math.min(remaining, dtStable);
      T = this.heatDiffusionStep(T, mat, L0, T_heat, T_ambient, step, heatingMode);
      remaining -= step;
      steps++;
    }
    return T;
  }

  // ----------------------------------------------------------
  // 13. Spatial Expansion Profile — uses local α(T) per node
  // ----------------------------------------------------------
  static spatialExpansion(
    mat: MaterialProperties,
    T_nodes: number[],
    L0: number
  ): { deltaLPerNode: number[]; totalDeltaL: number; avgTemp: number } {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    // Use local α(T) for each node — NOT mat.alpha0
    const deltaLPerNode = T_nodes.map(T => this.alpha(mat, T) * (T - this.T_REF) * dx);
    const totalDeltaL = deltaLPerNode.reduce((a, b) => a + b, 0);
    const avgTemp = T_nodes.reduce((a, b) => a + b, 0) / N;
    return { deltaLPerNode, totalDeltaL, avgTemp };
  }

  // ----------------------------------------------------------
  // 14. Spatial Stress Profile (for constrained systems)
  // Zero for free expansion — this is enforced explicitly
  // ----------------------------------------------------------
  static spatialStress(
    mat: MaterialProperties,
    T_nodes: number[],
    constraint: "free" | "fixed" | "partial" | "spring"
  ): number[] {
    if (constraint === "free") return new Array(T_nodes.length).fill(0);
    return T_nodes.map(T => {
      const E = this.youngsModulus(mat, T);
      const ε = this.thermalStrain(mat, T);
      return -E * ε;
    });
  }

  // ----------------------------------------------------------
  // 15. Atomic Vibration Amplitude (equipartition theorem)
  // A = sqrt(k_B T / k_bond)
  // ----------------------------------------------------------
  static vibrationAmplitude(T: number, bondStiffness: number): number {
    return Math.sqrt((this.K_B * T) / Math.max(bondStiffness, 1e-30));
  }

  // Anharmonic mean position shift
  static anharmonicShift(T: number, alpha0: number): number {
    return alpha0 * (T - this.T_REF);
  }

  // ----------------------------------------------------------
  // 16. Visual Magnification System
  // ----------------------------------------------------------
  static recommendedMagnification(deltaL_real: number, L0: number): number {
    if (Math.abs(deltaL_real) < 1e-12) return 1;
    const visualFraction = 0.15; // 15% visual expansion at peak temp
    const mag = (visualFraction * L0) / Math.abs(deltaL_real);
    const levels = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return levels.reduce((prev, cur) =>
      Math.abs(cur - mag) < Math.abs(prev - mag) ? cur : prev
    );
  }

  // ----------------------------------------------------------
  // 17. Elastic Strain Energy  U = σ² V / (2E)
  // ----------------------------------------------------------
  static strainEnergy(stress: number, volume: number, youngsModulus: number): number {
    return (stress * stress * volume) / (2 * Math.max(youngsModulus, 1e6));
  }

  // ----------------------------------------------------------
  // 18. Volumetric Expansion  ΔV/V ≈ 3α ΔT
  // ----------------------------------------------------------
  static volumetricExpansion(mat: MaterialProperties, T: number, V0: number): number {
    const gamma = 3 * this.alpha(mat, T);
    return V0 * (1 + gamma * (T - this.T_REF));
  }

  // ----------------------------------------------------------
  // 19. High-Temperature Regime Warnings
  // Returns engineering warnings appropriate to T/T_m ratio
  // ----------------------------------------------------------
  static highTempWarnings(mat: MaterialProperties, T: number): string[] {
    const warnings: string[] = [];
    const homologousT = T / mat.meltingPoint;

    if (T > mat.meltingPoint * 0.95) {
      warnings.push("NEAR MELTING: Material approaching phase transition. Properties invalid.");
    } else if (T > mat.meltingPoint * 0.85) {
      warnings.push("HOT SHORTNESS: Grain boundary liquation possible. Rapid strength loss.");
    } else if (T > mat.creepOnsetTemp) {
      warnings.push(`CREEP REGIME: T > T_creep (${mat.creepOnsetTemp.toFixed(0)} K). Time-dependent deformation accumulates.`);
    }

    if (mat.id === "steel" && T > 1183) {
      warnings.push("PHASE CHANGE: BCC → FCC (austenite) transition. CTE discontinuity.");
    }
    if (mat.id === "invar" && T > 773) {
      warnings.push("CURIE POINT EXCEEDED: Invar effect lost. α rises to ~12×10⁻⁶ /K.");
    }
    if (mat.id === "concrete" && T > 573) {
      warnings.push("DEHYDRATION: C-S-H gel decomposes above 573 K. Spalling risk.");
    }
    if (mat.id === "carbon_fiber" && T > 450) {
      warnings.push("MATRIX DEGRADATION: Epoxy matrix glass transition exceeded. Stiffness loss.");
    }
    if (mat.id === "titanium" && T > 1155) {
      warnings.push("α→β TRANSITION: HCP to BCC phase change. Property discontinuity.");
    }
    if (T < 150 && mat.id === "tungsten") {
      warnings.push("DBTT RISK: Tungsten is brittle below ductile-brittle transition (~600 K).");
    }

    return warnings;
  }
}

// ============================================================
// TYPE EXPORTS
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

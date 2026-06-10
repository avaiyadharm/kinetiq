// ============================================================
// KINETIQ THERMAL EXPANSION — SCIENTIFIC PHYSICS ENGINE v3
// ============================================================
// All equations are physically accurate. Units: SI throughout.
// Temperature: Kelvin | Length: meters | Stress: Pa | Strain: dimensionless
//
// v3 Scientific Audit improvements:
// - k(T): piecewise thermal conductivity for all materials
// - cp(T): piecewise specific heat capacity for all materials
// - ρ(T): computed from volumetric expansion
// - volumetricExpansion: integrated using trapezoidal rule
// - bucklingCriticalLoad: K factor correctly applied in formula
// - Column classification: Euler / Johnson / Short regimes
// - criticalBucklingTemperature: iterative search
// - Fracture toughness K_Ic for all materials
// - Refined thermalDiffusivity uses k(T) and cp(T)
// ============================================================

export interface MaterialProperties {
  id: string;
  name: string;
  category: "metal" | "ceramic" | "polymer" | "composite";
  crystalStructure: string;

  // Thermal properties at 293 K (reference values)
  alpha0: number;               // Linear CTE at 293 K (1/K)
  thermalConductivity: number;  // k  W/(m·K) — reference value
  specificHeat: number;         // c_p  J/(kg·K) — reference value
  density: number;              // ρ  kg/m³
  emissivity: number;           // ε (0–1)

  // Mechanical properties at 293 K
  youngsModulus: number;        // E  Pa
  poissonsRatio: number;        // ν
  yieldStrength: number;        // σ_y  Pa
  ultimateStrength: number;     // σ_u  Pa
  fatigueLimit: number;         // σ_f  Pa (endurance limit)
  fractureToughness: number;    // K_Ic  Pa√m (Griffith criterion)

  // Failure
  meltingPoint: number;         // K
  creepOnsetTemp: number;       // K — temperature where creep becomes significant (~0.4 T_m)

  description: string;
  color: string;

  // ── Piecewise property tables ─────────────────────────────
  // Each table: [[T_K, value], ...] sorted by T_K
  alphaPiecewise: [number, number][];   // α(T)  /K
  ePiecewise:     [number, number][];   // E(T)  Pa
  syPiecewise:    [number, number][];   // σ_y(T) Pa
  kPiecewise:     [number, number][];   // k(T)  W/(m·K)
  cpPiecewise:    [number, number][];   // cp(T)  J/(kg·K)
}

// ============================================================
// PIECEWISE LINEAR INTERPOLATION HELPER
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
// (Matweb, ASM Metals Handbook, NIST, Eurocode 3 EN 1993-1-2)
// ============================================================
export const MATERIAL_DB: Record<string, MaterialProperties> = {

  steel: {
    id: "steel", name: "Structural Steel (A36)", category: "metal",
    crystalStructure: "BCC (Body-Centred Cubic)",
    alpha0: 12e-6, thermalConductivity: 50, specificHeat: 490, density: 7850, emissivity: 0.28,
    youngsModulus: 200e9, poissonsRatio: 0.29,
    yieldStrength: 250e6, ultimateStrength: 400e6, fatigueLimit: 200e6,
    fractureToughness: 50e6,   // ~50 MPa√m for structural steel
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
    // k(T): ASM Metals Handbook Vol 2 — decreases with T due to phonon scattering
    kPiecewise: [
      [0,    55.0],
      [100,  52.0],
      [293,  50.0],
      [400,  48.0],
      [600,  40.0],
      [800,  34.0],
      [1000, 30.0],
      [1200, 28.0],
      [1773, 25.0],
    ],
    // cp(T): NIST — increases with T, jump at Curie/austenite transition
    cpPiecewise: [
      [0,    100.0],
      [100,  370.0],
      [200,  450.0],
      [293,  490.0],
      [400,  530.0],
      [600,  600.0],
      [800,  650.0],
      [1000, 680.0],
      [1183, 750.0],
      [1400, 700.0],
      [1773, 680.0],
    ],
  },

  stainless: {
    id: "stainless", name: "Stainless Steel (316L)", category: "metal",
    crystalStructure: "FCC (Face-Centred Cubic)",
    alpha0: 16e-6, thermalConductivity: 16, specificHeat: 502, density: 8000, emissivity: 0.12,
    youngsModulus: 193e9, poissonsRatio: 0.28,
    yieldStrength: 290e6, ultimateStrength: 580e6, fatigueLimit: 220e6,
    fractureToughness: 200e6,  // ~200 MPa√m — austenitic SS is very tough
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
    kPiecewise: [
      [0,    10.0],
      [100,  13.0],
      [293,  16.0],
      [400,  18.0],
      [600,  21.0],
      [800,  24.0],
      [1000, 26.0],
      [1643, 29.0],
    ],
    cpPiecewise: [
      [0,    300.0],
      [100,  420.0],
      [293,  502.0],
      [400,  530.0],
      [600,  560.0],
      [800,  580.0],
      [1000, 600.0],
      [1643, 620.0],
    ],
  },

  aluminum: {
    id: "aluminum", name: "Aluminum (6061-T6)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 23.6e-6, thermalConductivity: 167, specificHeat: 896, density: 2700, emissivity: 0.09,
    youngsModulus: 69e9, poissonsRatio: 0.33,
    yieldStrength: 276e6, ultimateStrength: 310e6, fatigueLimit: 97e6,
    fractureToughness: 29e6,   // ~29 MPa√m for 6061-T6
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
    // k(T): slightly increases then decreases for AA6061
    kPiecewise: [
      [0,    80.0],
      [100,  130.0],
      [200,  155.0],
      [293,  167.0],
      [400,  175.0],
      [500,  180.0],
      [700,  170.0],
      [933,  155.0],
    ],
    cpPiecewise: [
      [0,    200.0],
      [100,  600.0],
      [200,  800.0],
      [293,  896.0],
      [400,  960.0],
      [600,  1030.0],
      [933,  1100.0],
    ],
  },

  copper: {
    id: "copper", name: "Copper (C10100)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 17e-6, thermalConductivity: 385, specificHeat: 385, density: 8960, emissivity: 0.03,
    youngsModulus: 117e9, poissonsRatio: 0.35,
    yieldStrength: 70e6, ultimateStrength: 220e6, fatigueLimit: 60e6,
    fractureToughness: 70e6,   // ~70 MPa√m
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
    // k(T): decreases monotonically with T for pure metals (electron-phonon scattering)
    kPiecewise: [
      [0,    480.0],
      [100,  430.0],
      [200,  405.0],
      [293,  385.0],
      [400,  375.0],
      [600,  358.0],
      [800,  342.0],
      [1000, 330.0],
      [1358, 315.0],
    ],
    cpPiecewise: [
      [0,    100.0],
      [100,  330.0],
      [200,  370.0],
      [293,  385.0],
      [400,  395.0],
      [600,  410.0],
      [800,  420.0],
      [1200, 430.0],
      [1358, 435.0],
    ],
  },

  brass: {
    id: "brass", name: "Brass (C26000)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 20e-6, thermalConductivity: 120, specificHeat: 385, density: 8530, emissivity: 0.06,
    youngsModulus: 100e9, poissonsRatio: 0.34,
    yieldStrength: 125e6, ultimateStrength: 330e6, fatigueLimit: 110e6,
    fractureToughness: 50e6,
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
    kPiecewise: [
      [0,    90.0],
      [100,  108.0],
      [293,  120.0],
      [400,  125.0],
      [600,  130.0],
      [800,  133.0],
      [1173, 135.0],
    ],
    cpPiecewise: [
      [0,    250.0],
      [100,  340.0],
      [293,  385.0],
      [400,  400.0],
      [600,  415.0],
      [800,  425.0],
      [1173, 435.0],
    ],
  },

  titanium: {
    id: "titanium", name: "Titanium (Ti-6Al-4V)", category: "metal",
    crystalStructure: "HCP → BCC above 1155 K",
    alpha0: 8.6e-6, thermalConductivity: 6.7, specificHeat: 526, density: 4430, emissivity: 0.35,
    youngsModulus: 114e9, poissonsRatio: 0.34,
    yieldStrength: 880e6, ultimateStrength: 950e6, fatigueLimit: 500e6,
    fractureToughness: 75e6,   // ~75 MPa√m for Ti-6Al-4V
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
    // k(T): unusual — increases with T for Ti alloys (unlike most metals)
    kPiecewise: [
      [0,    4.0],
      [100,  5.0],
      [293,  6.7],
      [400,  8.0],
      [600,  11.0],
      [800,  14.0],
      [1000, 17.5],
      [1155, 20.0],
      [1400, 22.0],
      [1941, 25.0],
    ],
    cpPiecewise: [
      [0,    180.0],
      [100,  380.0],
      [200,  476.0],
      [293,  526.0],
      [400,  560.0],
      [600,  614.0],
      [800,  651.0],
      [1000, 680.0],
      [1941, 700.0],
    ],
  },

  tungsten: {
    id: "tungsten", name: "Tungsten (W)", category: "metal",
    crystalStructure: "BCC",
    alpha0: 4.5e-6, thermalConductivity: 173, specificHeat: 134, density: 19300, emissivity: 0.05,
    youngsModulus: 411e9, poissonsRatio: 0.28,
    yieldStrength: 1510e6, ultimateStrength: 1720e6, fatigueLimit: 900e6,
    fractureToughness: 5e6,    // ~5 MPa√m — very brittle below DBTT
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
    kPiecewise: [
      [0,    220.0],
      [100,  200.0],
      [293,  173.0],
      [500,  150.0],
      [1000, 120.0],
      [2000,  95.0],
      [3000,  80.0],
      [3695,  70.0],
    ],
    cpPiecewise: [
      [0,     50.0],
      [100,  110.0],
      [293,  134.0],
      [500,  145.0],
      [1000, 160.0],
      [2000, 175.0],
      [3000, 185.0],
      [3695, 190.0],
    ],
  },

  invar: {
    id: "invar", name: "Invar-36 (Fe-36Ni)", category: "metal",
    crystalStructure: "FCC",
    alpha0: 1.2e-6, thermalConductivity: 13.5, specificHeat: 515, density: 8100, emissivity: 0.14,
    youngsModulus: 141e9, poissonsRatio: 0.26,
    yieldStrength: 276e6, ultimateStrength: 483e6, fatigueLimit: 200e6,
    fractureToughness: 120e6,  // ~120 MPa√m — good toughness
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
    kPiecewise: [
      [0,    10.0],
      [100,  11.5],
      [293,  13.5],
      [400,  15.0],
      [600,  18.5],
      [773,  20.0],
      [900,  20.5],
      [1200, 21.0],
      [1700, 21.5],
    ],
    cpPiecewise: [
      [0,    220.0],
      [100,  400.0],
      [293,  515.0],
      [400,  540.0],
      [600,  570.0],
      [773,  610.0],
      [900,  580.0],
      [1200, 565.0],
      [1700, 555.0],
    ],
  },

  glass: {
    id: "glass", name: "Borosilicate Glass (Pyrex)", category: "ceramic",
    crystalStructure: "Amorphous (SiO₂-B₂O₃ network)",
    alpha0: 3.3e-6, thermalConductivity: 1.14, specificHeat: 830, density: 2230, emissivity: 0.92,
    youngsModulus: 63e9, poissonsRatio: 0.20,
    yieldStrength: 50e6, ultimateStrength: 50e6, fatigueLimit: 20e6,
    fractureToughness: 0.75e6, // ~0.75 MPa√m — extremely brittle
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
    // Glass: k slowly increases with T (amorphous phonon transport)
    kPiecewise: [
      [0,    0.80],
      [100,  0.95],
      [293,  1.14],
      [400,  1.25],
      [600,  1.40],
      [820,  1.55],
      [1100, 1.75],
    ],
    cpPiecewise: [
      [0,    300.0],
      [100,  580.0],
      [293,  830.0],
      [400,  900.0],
      [600,  1000.0],
      [820,  1100.0],
      [1100, 1200.0],
    ],
  },

  concrete: {
    id: "concrete", name: "Reinforced Concrete", category: "ceramic",
    crystalStructure: "Amorphous composite (C-S-H gel + aggregate)",
    alpha0: 10e-6, thermalConductivity: 1.4, specificHeat: 880, density: 2400, emissivity: 0.88,
    youngsModulus: 30e9, poissonsRatio: 0.20,
    yieldStrength: 3e6, ultimateStrength: 30e6, fatigueLimit: 2e6,
    fractureToughness: 1.2e6,  // ~1.2 MPa√m — very low (brittle composite)
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
    // k(T): decreases significantly with T for concrete (moisture loss, aggregate breakdown)
    kPiecewise: [
      [0,    1.80],
      [100,  1.65],
      [200,  1.52],
      [293,  1.40],
      [400,  1.25],
      [573,  1.05],
      [800,  0.90],
      [1200, 0.70],
      [1900, 0.60],
    ],
    cpPiecewise: [
      [0,    500.0],
      [100,  720.0],
      [200,  820.0],
      [293,  880.0],
      [400,  940.0],
      [573, 1000.0],
      [700,  880.0],  // endothermic decomposition complete
      [800,  750.0],
      [1200, 700.0],
      [1900, 680.0],
    ],
  },

  carbon_fiber: {
    id: "carbon_fiber", name: "Carbon Fiber (CFRP, unidirectional)", category: "composite",
    crystalStructure: "Graphitic hexagonal layers in amorphous matrix",
    alpha0: -0.5e-6, thermalConductivity: 10, specificHeat: 710, density: 1600, emissivity: 0.95,
    youngsModulus: 181e9, poissonsRatio: 0.27,
    yieldStrength: 1200e6, ultimateStrength: 1500e6, fatigueLimit: 700e6,
    fractureToughness: 20e6,   // ~20 MPa√m — composite interlaminar
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
    // k(T): fiber direction conductivity, decreases as matrix degrades
    kPiecewise: [
      [0,    12.0],
      [100,  11.0],
      [293,  10.0],
      [400,   9.5],
      [450,   8.5],
      [500,   6.5],
      [800,   4.0],
      [3900,  2.0],
    ],
    cpPiecewise: [
      [0,    350.0],
      [100,  550.0],
      [200,  660.0],
      [293,  710.0],
      [400,  760.0],
      [450,  810.0],
      [500,  850.0],
      [800,  950.0],
      [3900, 1050.0],
    ],
  },

  silicon: {
    id: "silicon", name: "Silicon (Monocrystalline)", category: "ceramic",
    crystalStructure: "Diamond cubic (Fd3m)",
    alpha0: 2.6e-6, thermalConductivity: 148, specificHeat: 700, density: 2330, emissivity: 0.65,
    youngsModulus: 130e9, poissonsRatio: 0.27,
    yieldStrength: 7000e6, ultimateStrength: 7000e6, fatigueLimit: 3000e6,
    fractureToughness: 0.9e6,  // ~0.9 MPa√m — extremely brittle semiconductor
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
    // k(T): drops dramatically with T (phonon-phonon scattering ~ T^-1 above Debye T)
    kPiecewise: [
      [0,    3000.0],
      [50,   1000.0],
      [100,   500.0],
      [200,   260.0],
      [293,   148.0],
      [400,    90.0],
      [600,    52.0],
      [800,    33.0],
      [1000,   22.0],
      [1200,   18.0],
      [1687,   15.0],
    ],
    cpPiecewise: [
      [0,     10.0],
      [50,   200.0],
      [100,  460.0],
      [200,  620.0],
      [293,  700.0],
      [500,  780.0],
      [800,  830.0],
      [1200, 870.0],
      [1687, 900.0],
    ],
  },

  ice: {
    id: "ice", name: "Water Ice (Ih)", category: "ceramic",
    crystalStructure: "Hexagonal (Ih)",
    alpha0: 51e-6, thermalConductivity: 2.22, specificHeat: 2090, density: 917, emissivity: 0.97,
    youngsModulus: 9e9, poissonsRatio: 0.33,
    yieldStrength: 1e6, ultimateStrength: 1.5e6, fatigueLimit: 0.5e6,
    fractureToughness: 0.12e6, // ~0.12 MPa√m — extremely brittle
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
    // k(T): ice conductivity increases significantly at low T
    kPiecewise: [
      [0,    12.0],
      [50,    7.0],
      [100,   4.5],
      [150,   3.2],
      [200,   2.6],
      [250,   2.3],
      [273.15, 2.22],
    ],
    cpPiecewise: [
      [0,     50.0],
      [50,   400.0],
      [100,  900.0],
      [150, 1400.0],
      [200, 1700.0],
      [250, 2000.0],
      [273.15, 2090.0],
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
  // 4. Temperature-Dependent Thermal Conductivity k(T)  W/(m·K)
  // ----------------------------------------------------------
  static thermalConductivity(mat: MaterialProperties, T: number): number {
    if (mat.kPiecewise && mat.kPiecewise.length > 0) {
      return Math.max(0.01, piecewiseInterp(mat.kPiecewise, Math.max(0, T)));
    }
    return mat.thermalConductivity;
  }

  // ----------------------------------------------------------
  // 5. Temperature-Dependent Specific Heat cp(T)  J/(kg·K)
  //    Includes Debye T³ behavior at cryogenic T
  // ----------------------------------------------------------
  static specificHeatCapacity(mat: MaterialProperties, T: number): number {
    if (mat.cpPiecewise && mat.cpPiecewise.length > 0) {
      return Math.max(1.0, piecewiseInterp(mat.cpPiecewise, Math.max(0, T)));
    }
    return mat.specificHeat;
  }

  // ----------------------------------------------------------
  // 6. Temperature-Dependent Density ρ(T)  kg/m³
  //    ρ(T) = ρ₀ / (1 + 3α(T)ΔT)  from volumetric expansion
  // ----------------------------------------------------------
  static densityAtT(mat: MaterialProperties, T: number): number {
    const dT = T - this.T_REF;
    // Use integrated alpha for accuracy at large ΔT
    const alpha_avg = this.alpha(mat, (this.T_REF + T) / 2);
    const volumetricStrain = 3 * alpha_avg * dT;
    return mat.density / (1 + volumetricStrain);
  }

  // ----------------------------------------------------------
  // 7. Thermal Diffusivity  α_th = k(T) / (ρ(T) · cp(T))  m²/s
  //    Now uses temperature-dependent k, cp, ρ
  // ----------------------------------------------------------
  static thermalDiffusivity(mat: MaterialProperties, T = 293.15): number {
    const k   = this.thermalConductivity(mat, T);
    const rho = this.densityAtT(mat, T);
    const cp  = this.specificHeatCapacity(mat, T);
    const alpha_th = k / (rho * cp);
    return Math.min(alpha_th, 1e-3); // max 1e-3 m²/s (copper is ~1.2e-4, fine)
  }

  // ----------------------------------------------------------
  // 8. Linear Thermal Expansion using temperature-dependent α
  //    ΔL = ∫[T_ref, T] α(T') dT' · L₀
  //    Uses trapezoidal rule with N=20 sub-intervals
  //    Correct for arbitrarily large ΔT
  // ----------------------------------------------------------
  static deltaL(mat: MaterialProperties, L0: number, T: number, plasticStrain = 0): number {
    const T_ref = this.T_REF;
    const dT = T - T_ref;
    if (Math.abs(dT) < 1e-10) return plasticStrain * L0;

    // Trapezoidal integration of α(T) over [T_ref, T]
    const N = 20;
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
  // 9. Thermal Strain (per unit length)  ε_th = ∫ α(T') dT'
  //    Returns the correctly integrated thermal strain scalar
  // ----------------------------------------------------------
  static thermalStrain(mat: MaterialProperties, T: number): number {
    const dT = T - this.T_REF;
    if (Math.abs(dT) < 1e-10) return 0;
    // Use trapezoidal integration (10 points sufficient for scalar)
    const N = 10;
    let integral = 0;
    for (let i = 0; i < N; i++) {
      const T0 = this.T_REF + (i / N) * dT;
      const T1 = this.T_REF + ((i + 1) / N) * dT;
      integral += 0.5 * (this.alpha(mat, T0) + this.alpha(mat, T1)) * (T1 - T0);
    }
    return integral;
  }

  // ----------------------------------------------------------
  // 10. Constraint Mechanics
  //    CRITICAL: Stress is ONLY generated when expansion is constrained.
  //    Free expansion → σ = 0 always (no exceptions).
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
    fosYield: number;
    fosFracture: number;
    regime: "elastic" | "yielding" | "plastic" | "failure" | "free";
  } {
    const ε_th = this.thermalStrain(mat, T) + plasticStrain;
    const freeDeltaL = ε_th * L0;
    const E = this.youngsModulus(mat, T);
    const σ_y = this.yieldStrength(mat, T);
    // Scale ultimate strength proportionally with yield degradation
    const σ_u = mat.ultimateStrength * Math.max(0.05, σ_y / mat.yieldStrength);

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
    } else if (constraint === "spring") {
      // Spring equilibrium: F_spring = k_spring * u, F_thermal = E*A*ε_th
      // Combined: stress = -E * k_spring*L0/(E + k_spring*L0) * ε_th
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

    // FOS_yield = σ_y / |σ| (governs ductile design)
    const fosYield    = absSig > 0 ? σ_y / absSig : 999;
    // FOS_fracture = σ_u / |σ| (governs brittle/ultimate failure)
    const fosFracture = absSig > 0 ? σ_u / absSig : 999;

    let regime: "elastic" | "yielding" | "plastic" | "failure" | "free" = "free";
    if (constraint !== "free") {
      if (isFailed) regime = "failure";
      else if (isYielding) regime = absSig > σ_y * 1.2 ? "plastic" : "yielding";
      else regime = "elastic";
    }

    return { stress, mechanicalStrain, actualDeltaL, isYielding, isFailed, fosYield, fosFracture, regime };
  }

  // ----------------------------------------------------------
  // 11. Euler Column Buckling Critical Load
  //     P_cr = π²·E(T)·I / (K·L)²
  //
  //     K is the EFFECTIVE LENGTH FACTOR — depends on end conditions:
  //       Pinned-Pinned:  K = 1.0
  //       Fixed-Fixed:    K = 0.5
  //       Fixed-Free:     K = 2.0
  //       Fixed-Pinned:   K = 0.7
  //
  //     IMPORTANT: willBuckle is ONLY true when constraint generates
  //     a compressive thermal load. Free expansion → thermalLoad = 0.
  // ----------------------------------------------------------
  static bucklingCriticalLoad(
    mat: MaterialProperties,
    T: number,
    L: number,
    area: number,
    constraint: "free" | "fixed" | "partial" | "spring",
    gapSize = 0,
    sectionType: "circular" | "rectangular" = "circular",
    dimension = 0.05,
    K = 1.0   // Effective length factor — must be supplied correctly by caller
  ): { Pcr: number; slendernessRatio: number; willBuckle: boolean; thermalLoad: number; I: number; r_gyration: number } {
    const E = this.youngsModulus(mat, T);

    let I = 0;
    if (sectionType === "circular") {
      I = (Math.PI / 64) * Math.pow(dimension, 4);
    } else {
      I = (dimension * Math.pow(dimension, 3)) / 12;
    }

    // Euler critical load with correct K
    const Pcr = (Math.PI * Math.PI * E * I) / Math.pow(K * L, 2);
    const r_gyration = Math.sqrt(I / area);
    // Slenderness ratio: λ = KL/r
    const slendernessRatio = (K * L) / r_gyration;

    // Thermal compressive load — ONLY exists if expansion is constrained
    let thermalLoad = 0;
    if (constraint === "fixed") {
      const ε_th = this.thermalStrain(mat, T);
      thermalLoad = Math.max(0, E * ε_th * area); // compressive only (heating)
    } else if (constraint === "partial") {
      const freeDL = this.thermalStrain(mat, T) * L;
      if (freeDL > gapSize) {
        const constrainedStrain = (freeDL - gapSize) / L;
        thermalLoad = E * constrainedStrain * area;
      }
    } else if (constraint === "spring") {
      // Spring provides partial constraint — generates partial compressive load
      const ε_th = this.thermalStrain(mat, T);
      const kL = 1e7 * L; // default spring stiffness
      const stress = (E * kL / (E + kL)) * ε_th;
      thermalLoad = Math.max(0, stress * area);
    }
    // free: thermalLoad = 0 → willBuckle = false always

    return {
      Pcr,
      slendernessRatio,
      willBuckle: thermalLoad > Pcr && thermalLoad > 0,
      thermalLoad,
      I,
      r_gyration
    };
  }

  // ----------------------------------------------------------
  // 12. Column Classification
  //     Determines Euler / Johnson / Short regime based on slenderness
  //
  //     λ_euler = π·√(2E/σ_y)  [Euler-Johnson transition]
  //     λ_cc    = π·√(E/σ_y)   [short column limit, approx]
  //
  //     λ > λ_euler  → Long Column (Euler buckling governs)
  //     λ_cc < λ ≤ λ_euler → Intermediate (J.B. Johnson parabola)
  //     λ ≤ λ_cc    → Short Column (yielding before buckling)
  // ----------------------------------------------------------
  static columnClassification(
    lambda: number,
    E: number,
    sigma_y: number
  ): { regime: "short" | "intermediate" | "long"; lambdaEuler: number; lambdaCC: number; limitingStress: number } {
    const lambdaEuler = Math.PI * Math.sqrt(2 * E / sigma_y);
    const lambdaCC    = Math.PI * Math.sqrt(E / sigma_y);

    let regime: "short" | "intermediate" | "long";
    let limitingStress: number;

    if (lambda > lambdaEuler) {
      regime = "long";
      // Euler critical stress
      limitingStress = (Math.PI * Math.PI * E) / (lambda * lambda);
    } else if (lambda > lambdaCC) {
      regime = "intermediate";
      // J.B. Johnson parabola: σ_cr = σ_y(1 - σ_y·λ²/(4π²E))
      limitingStress = sigma_y * (1 - sigma_y * lambda * lambda / (4 * Math.PI * Math.PI * E));
    } else {
      regime = "short";
      limitingStress = sigma_y; // yielding governs
    }

    return { regime, lambdaEuler, lambdaCC, limitingStress };
  }

  // ----------------------------------------------------------
  // 13. Critical Buckling Temperature
  //     Find T_cr where P_thermal(T) = P_cr(T)
  //     Uses bisection search over [T_ref, T_melt]
  // ----------------------------------------------------------
  static criticalBucklingTemperature(
    mat: MaterialProperties,
    L: number,
    area: number,
    constraint: "free" | "fixed" | "partial" | "spring",
    gapSize: number,
    sectionType: "circular" | "rectangular",
    dimension: number,
    K: number
  ): number | null {
    if (constraint === "free") return null;

    const T_lo = this.T_REF;
    const T_hi = mat.meltingPoint * 0.98;

    // Check if buckling even occurs at max temperature
    const resAtMax = this.bucklingCriticalLoad(mat, T_hi, L, area, constraint, gapSize, sectionType, dimension, K);
    if (!resAtMax.willBuckle) return null;

    // Bisection
    let lo = T_lo;
    let hi = T_hi;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      const res = this.bucklingCriticalLoad(mat, mid, L, area, constraint, gapSize, sectionType, dimension, K);
      if (res.thermalLoad > res.Pcr) {
        hi = mid;
      } else {
        lo = mid;
      }
      if (hi - lo < 0.5) break;
    }
    return (lo + hi) / 2;
  }

  // ----------------------------------------------------------
  // 14. Bimetallic Strip — Timoshenko Curvature Theory (1925)
  //     κ = [6(α₂−α₁)(1+m)² ΔT] / [t·(3(1+m)² + (1+mn)(m²+1/mn))]
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
  // 15. Thermal Shock — Biaxial Surface Stress
  //     σ_shock = E·α·ΔT / (1 − ν)  (biaxial restrained surface)
  //     ΔT here should be the temperature front difference
  // ----------------------------------------------------------
  static thermalShockStress(
    mat: MaterialProperties,
    T_surface: number,
    T_initial: number,
    thickness: number
  ): { shockStress: number; shockFactor: number; thermalGradient: number; K_I: number; K_Ic: number } {
    const dT = Math.abs(T_surface - T_initial);
    const T_avg = (T_surface + T_initial) / 2;
    const E = this.youngsModulus(mat, T_avg);
    const alpha_val = this.alpha(mat, T_avg);
    // Biaxial thermal stress at surface (surface is restrained by interior)
    const shockStress = (E * alpha_val * dT) / (1 - mat.poissonsRatio);
    const thermalGradient = dT / Math.max(thickness, 1e-6);

    // Griffith Criterion: K_I = Y * σ * √(π * a)
    const a = 0.001; // 1mm surface micro-crack (conservative assumption)
    const Y = 1.12;  // Geometry factor for edge crack
    const K_I = Y * shockStress * Math.sqrt(Math.PI * a);

    const K_Ic = mat.fractureToughness;

    const shockFactor = K_I / K_Ic;
    return { shockStress, shockFactor, thermalGradient, K_I, K_Ic };
  }

  // ----------------------------------------------------------
  // 16. Coffin-Manson / Basquin Fatigue Model
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
  // 17. 1D Heat Diffusion — Explicit Finite Difference (legacy)
  //     Stability: r = α_th·Δt/Δx² ≤ 0.5
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
    const dtSafe = Math.min(dt, dtMax * 0.45);
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
    const maxSubsteps = 500;
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
  // 18. Spatial Expansion Profile — uses local α(T) per node
  // ----------------------------------------------------------
  static spatialExpansion(
    mat: MaterialProperties,
    T_nodes: number[],
    L0: number
  ): { deltaLPerNode: number[]; totalDeltaL: number; avgTemp: number } {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    const deltaLPerNode = T_nodes.map(T => this.alpha(mat, T) * (T - this.T_REF) * dx);
    const totalDeltaL = deltaLPerNode.reduce((a, b) => a + b, 0);
    const avgTemp = T_nodes.reduce((a, b) => a + b, 0) / N;
    return { deltaLPerNode, totalDeltaL, avgTemp };
  }

  // ----------------------------------------------------------
  // 19. Spatial Stress Profile (for constrained systems)
  //     Zero for free expansion — enforced explicitly
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
  // 20. Volumetric Expansion  V(T) = V₀ · exp(∫3α(T')dT')
  //     Uses trapezoidal integration — correct for large ΔT
  //     For small ΔT: ≈ V₀(1 + 3α·ΔT)  (linear approximation)
  // ----------------------------------------------------------
  static volumetricExpansion(mat: MaterialProperties, T: number, V0: number): number {
    const dT = T - this.T_REF;
    if (Math.abs(dT) < 1e-10) return V0;

    // Integrate 3α(T) over [T_ref, T]
    const N = 20;
    let integral = 0;
    for (let i = 0; i < N; i++) {
      const T0 = this.T_REF + (i / N) * dT;
      const T1 = this.T_REF + ((i + 1) / N) * dT;
      integral += 0.5 * (3 * this.alpha(mat, T0) + 3 * this.alpha(mat, T1)) * (T1 - T0);
    }

    // Use exponential form for accuracy: V = V₀·exp(∫3αdT)
    // For small ΔT this converges to V₀(1 + 3αΔT); for large ΔT it's more accurate
    return V0 * Math.exp(integral);
  }

  // ----------------------------------------------------------
  // 21. Elastic Strain Energy  U = σ²V / (2E)
  // ----------------------------------------------------------
  static strainEnergy(stress: number, volume: number, youngsModulus: number): number {
    return (stress * stress * volume) / (2 * Math.max(youngsModulus, 1e6));
  }

  // ----------------------------------------------------------
  // 22. Atomic Vibration Amplitude (equipartition theorem)
  //     A = sqrt(k_B T / k_bond)
  // ----------------------------------------------------------
  static vibrationAmplitude(T: number, bondStiffness: number): number {
    return Math.sqrt((this.K_B * T) / Math.max(bondStiffness, 1e-30));
  }

  static anharmonicShift(T: number, alpha0: number): number {
    return alpha0 * (T - this.T_REF);
  }

  // ----------------------------------------------------------
  // 23. Visual Magnification System
  // ----------------------------------------------------------
  static recommendedMagnification(deltaL_real: number, L0: number): number {
    if (Math.abs(deltaL_real) < 1e-12) return 1;
    const visualFraction = 0.15;
    const mag = (visualFraction * L0) / Math.abs(deltaL_real);
    const levels = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return levels.reduce((prev, cur) =>
      Math.abs(cur - mag) < Math.abs(prev - mag) ? cur : prev
    );
  }

  // ----------------------------------------------------------
  // 24. High-Temperature Regime Warnings
  // ----------------------------------------------------------
  static highTempWarnings(mat: MaterialProperties, T: number): string[] {
    const warnings: string[] = [];

    if (T > mat.meltingPoint) {
      warnings.push(`[MATERIAL] MELTING: T = ${T.toFixed(0)} K exceeds T_melt = ${mat.meltingPoint.toFixed(0)} K. Material in liquid phase — all mechanical results invalid.`);
    } else if (T > mat.meltingPoint * 0.95) {
      warnings.push(`[MATERIAL] NEAR MELTING: Homologous T = ${(T/mat.meltingPoint*100).toFixed(0)}%. Properties highly unreliable.`);
    } else if (T > mat.meltingPoint * 0.85) {
      warnings.push(`[MATERIAL] HOT SHORTNESS: Grain boundary liquation possible at ${T.toFixed(0)} K. Rapid strength loss.`);
    } else if (T > mat.creepOnsetTemp) {
      warnings.push(`[MATERIAL] CREEP REGIME: T = ${T.toFixed(0)} K > T_creep = ${mat.creepOnsetTemp.toFixed(0)} K. Time-dependent deformation accumulates.`);
    }

    if (mat.id === "steel" && T > 1183) {
      warnings.push("[MATERIAL] PHASE CHANGE: BCC → FCC (austenite) transition at 1183 K. CTE discontinuity active.");
    }
    if (mat.id === "invar" && T > 773) {
      warnings.push("[MATERIAL] CURIE POINT: Invar effect lost above 773 K. α rises to ~12×10⁻⁶ /K.");
    }
    if (mat.id === "concrete" && T > 573) {
      warnings.push("[MATERIAL] DEHYDRATION: C-S-H gel decomposes above 573 K. Explosive spalling risk.");
    }
    if (mat.id === "carbon_fiber" && T > 450) {
      warnings.push("[MATERIAL] MATRIX DEGRADATION: Epoxy matrix Tg exceeded. Stiffness loss accelerating.");
    }
    if (mat.id === "titanium" && T > 1155) {
      warnings.push("[MATERIAL] α→β TRANSITION: HCP→BCC phase change at 1155 K. Property discontinuity.");
    }
    if (T < 150 && mat.id === "tungsten") {
      warnings.push("[MATERIAL] DBTT RISK: Tungsten below ductile-brittle transition (~600 K). Brittle fracture risk.");
    }

    return warnings;
  }

  // ----------------------------------------------------------
  // 25. Heat Flux Profile  q(x) = -k·dT/dx   [W/m²]
  //     Central difference on interior; forward/backward at ends.
  // ----------------------------------------------------------
  static heatFluxProfile(T_nodes: number[], mat: MaterialProperties, L0: number): number[] {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    const k = mat.thermalConductivity;  // Use reference k for profile shape
    const q = new Array<number>(N);

    q[0] = -k * (T_nodes[1] - T_nodes[0]) / dx;
    for (let i = 1; i < N - 1; i++) {
      q[i] = -k * (T_nodes[i + 1] - T_nodes[i - 1]) / (2 * dx);
    }
    q[N - 1] = -k * (T_nodes[N - 1] - T_nodes[N - 2]) / dx;

    return q;
  }

  // ----------------------------------------------------------
  // 26. Node Displacement Profile  u(x)  [m]
  //     Computes cumulative axial displacement at each node.
  // ----------------------------------------------------------
  static nodeDisplacementProfile(
    T_nodes: number[],
    mat: MaterialProperties,
    L0: number,
    constraint: "free" | "fixed" | "partial" | "spring"
  ): number[] {
    const N = T_nodes.length;
    const dx = L0 / (N - 1);
    const u = new Array<number>(N).fill(0);

    for (let i = 1; i < N; i++) {
      const localStrain = this.alpha(mat, T_nodes[i - 1]) * (T_nodes[i - 1] - this.T_REF);
      u[i] = u[i - 1] + localStrain * dx;
    }

    if (constraint === "fixed") {
      // Both ends pinned: subtract linear correction so u[0]=0, u[N-1]=0
      const rightDisp = u[N - 1];
      for (let i = 0; i < N; i++) {
        u[i] -= (i / (N - 1)) * rightDisp;
      }
    }

    return u;
  }

  // ----------------------------------------------------------
  // 27. Expansion Velocity  v = d(ΔL)/dt  [m/s]
  // ----------------------------------------------------------
  static expansionVelocity(deltaL1: number, deltaL2: number, dt: number): number {
    if (dt < 1e-12) return 0;
    return (deltaL2 - deltaL1) / dt;
  }

  // ----------------------------------------------------------
  // 28. Creep Strain Rate (simplified power-law estimate)
  //     dε/dt = A · σⁿ · exp(-Q/(R·T))
  //     Returns only if T > creepOnsetTemp
  // ----------------------------------------------------------
  static creepStrainRate(
    mat: MaterialProperties,
    stress: number,
    T: number
  ): number {
    if (T < mat.creepOnsetTemp) return 0;
    // Generic power-law creep constants (order-of-magnitude estimates)
    const A = 1e-30;  // Pre-exponential coefficient (material-specific)
    const n = 5.0;    // Stress exponent (5 is typical for power-law creep)
    const Q = 250e3;  // Activation energy J/mol (typical for metals ~150-350 kJ/mol)
    const R = 8.314;  // Gas constant J/(mol·K)
    return A * Math.pow(Math.abs(stress), n) * Math.exp(-Q / (R * T));
  }

  // ----------------------------------------------------------
  // 29. Isothermal Compressibility
  //     β_T = 3(1-2ν)/E
  // ----------------------------------------------------------
  static isothermalCompressibility(mat: MaterialProperties, T: number): number {
    const E = this.youngsModulus(mat, T);
    return (3 * (1 - 2 * mat.poissonsRatio)) / E;
  }

} // end class PhysicsEngine

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

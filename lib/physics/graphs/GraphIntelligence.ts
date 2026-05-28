import { useGasLawsStore } from "@/store/gasLawsStore";
import { GasEngine } from "@/lib/physics/engine";
import { ThermodynamicsAnalyzer } from "@/lib/physics/thermodynamics";

export type GraphType = 
  | "PV"                  // P-V Diagram
  | "VT"                  // V-T Graph
  | "PT"                  // P-T Graph
  | "Entropy"             // Entropy vs Time
  | "MaxwellBoltzmann"    // Velocity distribution
  | "BoltzmannEnergy"     // Kinetic energy distribution
  | "CollisionAnalytics"  // Collision frequency vs density
  | "Diffusion"           // Concentration vs position
  | "DiffusionVariance"   // Variance of position vs time
  | "Compressibility"     // Z factor vs Pressure
  | "PhaseSpace"          // Phase Space scatter plot
  | "OccupancyGrid";      // Coarse-grained density grid

export interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface GraphPanelProps {
  regime: "free" | "boyle" | "charles" | "gay-lussac" | "avogadro" | "adiabatic";
  gasPreset: "ideal" | "helium" | "xenon" | "real";
  particleMode: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy";
  simulationMode: "md" | "mc";
  attractiveForce: number;
  particleMass: number;
  particleCount: number;
}

export const GraphIntelligence = {
  // Determine Primary Graph based on regime
  getPrimaryGraph: (
    regime: string, 
    gasPreset: string, 
    particleMode: string
  ): GraphType => {
    if (regime === "charles" || regime === "avogadro") return "VT";
    if (regime === "gay-lussac") return "PT";
    if (particleMode === "entropy") return "Entropy";
    if (particleMode === "diffusion") return "Diffusion";
    return "PV"; // Default for "free", "boyle", "adiabatic", or "real" gas
  },

  // Determine Secondary Graph based on regime
  getSecondaryGraph: (
    regime: string, 
    gasPreset: string, 
    particleMode: string
  ): GraphType => {
    if (regime === "adiabatic") return "BoltzmannEnergy";
    if (gasPreset === "real" || gasPreset === "xenon") return "Compressibility";
    if (particleMode === "entropy") return "OccupancyGrid";
    if (particleMode === "diffusion") return "DiffusionVariance";
    if (particleMode === "mean-free-path") return "CollisionAnalytics";
    return "MaxwellBoltzmann";
  },

  // Get optimal initial viewport for a graph type
  getDefaultViewport: (gType: GraphType, particleCount: number, currentV_rms: number): Viewport => {
    const activePMax = Math.max(8000, particleCount * 12);
    switch (gType) {
      case "PV": return { xMin: 2.0, xMax: 12.0, yMin: 0, yMax: activePMax };
      case "VT": return { xMin: 0, xMax: 900, yMin: 2.0, yMax: 12.0 };
      case "PT": return { xMin: 0, xMax: 900, yMin: 0, yMax: activePMax };
      case "Entropy": return { xMin: 0, xMax: 300, yMin: 0, yMax: 5.0 };
      case "MaxwellBoltzmann": return { xMin: 0, xMax: Math.max(1200, currentV_rms * 2.2), yMin: 0, yMax: 0.005 };
      case "BoltzmannEnergy": return { xMin: 0, xMax: 150, yMin: 0, yMax: 0.05 };
      case "CollisionAnalytics": return { xMin: 0, xMax: 200, yMin: 0, yMax: 5000 };
      case "Diffusion": return { xMin: 0, xMax: 1.0, yMin: 0, yMax: 0.5 };
      case "DiffusionVariance": return { xMin: 0, xMax: 300, yMin: 0, yMax: 0.1 };
      case "Compressibility": return { xMin: 0, xMax: 15000, yMin: 0.2, yMax: 2.2 };
      case "PhaseSpace": return { xMin: 0, xMax: 1.0, yMin: -6, yMax: 6 };
      case "OccupancyGrid": return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
      default: return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
    }
  },

  formatScientific: (num: number, precision = 1): string => {
    if (Math.abs(num) < 1e-3 && num !== 0) return num.toExponential(precision);
    if (num >= 10000) return num.toExponential(precision);
    return num.toFixed(precision);
  }
};

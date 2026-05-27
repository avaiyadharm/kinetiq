import { create } from 'zustand';
import { ThermodynamicsState } from '@/lib/physics/thermodynamics';

interface GasLawsStore extends ThermodynamicsState {
  setTelemetry: (state: Partial<ThermodynamicsState>) => void;
  pvHistory: {v: number, p: number}[];
  setPvHistory: (history: {v: number, p: number}[]) => void;
}

export const useGasLawsStore = create<GasLawsStore>((set) => ({
  measuredPressure: 0,
  idealPressure: 0,
  measuredTemp: 300,
  measuredVolume: 10,
  meanSpeed: 0,
  v_rms: 0,
  v_mostProbable: 0,
  speedHistogram: [],
  collisionCount: 0,
  meanFreePath: 0,
  systemEnergy: 0,
  entropy: 0,
  entropyMax: 1,
  compressibilityZ: 1,
  binWidth: 5,
  diffusionMixing: 0,
  vanDerWaalsPressure: 0,
  particlesEscaped: 0,
  temperatureTarget: 300,
  pvHistory: [],
  
  // New statistical mechanics defaults
  energyHistogram: [],
  energyBinWidth: 0,
  phaseSpacePoints: [],
  microstateOccupancy: [],
  entropyConvergence: 0,
  isEquilibrium: false,
  meanFreePathTheory: 0,
  
  setTelemetry: (newState) => set(newState),
  setPvHistory: (history) => set({ pvHistory: history })
}));

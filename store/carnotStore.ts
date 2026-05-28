import { create } from "zustand";
import { CycleStage } from "@/lib/physics/carnot";

// ─── Thermostat Methods ────────────────────────────────────────────────────────
export type ThermostatMethod = "velocity_scaling" | "andersen" | "berendsen" | "nose_hoover";
export type SolverMode = "molecular_dynamics" | "monte_carlo" | "hybrid_statistical";

// ─── Visualization Flags ───────────────────────────────────────────────────────
export interface VizSettings {
  motionBlur: boolean;
  thermalHeatmap: boolean;
  particleTrails: boolean;
  entropyOverlay: boolean;
  pressureField: boolean;
  velocityVectors: boolean;
  pathTracing: boolean;
  collisionWavelets: boolean;
}

// ─── Graph Settings ────────────────────────────────────────────────────────────
export interface GraphSettings {
  smoothing: number;        // 0-1
  samplingRate: number;     // Hz
  rollingAvgWindow: number; // frames
  histogramBins: number;
  interpolation: "linear" | "cubic" | "step";
  logScaleX: boolean;
  logScaleY: boolean;
  multiCurveOverlay: boolean;
}

// ─── Full Store State ──────────────────────────────────────────────────────────
interface CarnotState {
  // Core cycle parameters
  TH: number;
  TC: number;
  V1: number;
  V2: number;
  n: number;

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;

  // Cycle state
  currentStage: CycleStage;
  stageProgress: number;
  globalTime: number;

  // ── Extended Config ───────────────────────────
  // Thermal Reservoir
  heatCapacity: number;         // J/K
  thermalConductivity: number;  // W/mK
  heatExchangeRate: number;     // W
  couplingStrength: number;     // 0-1
  thermalLeakage: number;       // W (heat loss to environment)
  ambientTemp: number;          // K

  // Molecular Dynamics
  particleCount: number;
  molecularMass: number;        // amu
  particleRadius: number;       // pm
  collisionElasticity: number;  // 0-1
  intermolecularAttraction: number; // eV
  dragCoefficient: number;
  gravity: number;              // m/s²
  brownianNoise: number;        // 0-1
  thermostatMethod: ThermostatMethod;

  // Engine Mechanics
  pistonSpeed: number;          // m/s
  compressionRatio: number;
  minVolume: number;            // L
  maxVolume: number;            // L
  mechanicalFriction: number;   // 0-1
  engineRPM: number;
  insulationQuality: number;    // 0-1
  expansionRate: number;
  compressionRate: number;

  // Real Engine Losses
  heatLeakageEnabled: boolean;
  frictionLossEnabled: boolean;
  inelasticCollisionsEnabled: boolean;
  turbulenceEnabled: boolean;
  nonIdealGasEnabled: boolean;
  vanDerWaalsA: number;
  vanDerWaalsB: number;

  // Visualization
  vizSettings: VizSettings;

  // Graph settings
  graphSettings: GraphSettings;

  // Solver
  solverMode: SolverMode;

  // ── Actions ───────────────────────────────────
  setTH: (t: number) => void;
  setTC: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setPlaybackSpeed: (s: number) => void;
  tick: (dt: number) => void;
  reset: () => void;
  setConfig: <K extends keyof CarnotState>(key: K, value: CarnotState[K]) => void;
  setVizSetting: <K extends keyof VizSettings>(key: K, value: VizSettings[K]) => void;
  setGraphSetting: <K extends keyof GraphSettings>(key: K, value: GraphSettings[K]) => void;
}

const STAGES: CycleStage[] = [
  "ISOTHERMAL_EXPANSION",
  "ADIABATIC_EXPANSION",
  "ISOTHERMAL_COMPRESSION",
  "ADIABATIC_COMPRESSION"
];

export const useCarnotStore = create<CarnotState>((set, get) => ({
  // Core
  TH: 500,
  TC: 300,
  V1: 2.0,
  V2: 6.0,
  n: 1.0,

  // Playback
  isPlaying: true,
  playbackSpeed: 1.0,

  // Cycle
  currentStage: "ISOTHERMAL_EXPANSION",
  stageProgress: 0,
  globalTime: 0,

  // Extended config defaults
  heatCapacity: 5000,
  thermalConductivity: 0.85,
  heatExchangeRate: 50,
  couplingStrength: 0.9,
  thermalLeakage: 2.0,
  ambientTemp: 293,

  particleCount: 100,
  molecularMass: 4.0,
  particleRadius: 120,
  collisionElasticity: 1.0,
  intermolecularAttraction: 0.0,
  dragCoefficient: 0.0,
  gravity: 0.0,
  brownianNoise: 0.05,
  thermostatMethod: "velocity_scaling",

  pistonSpeed: 0.5,
  compressionRatio: 4.0,
  minVolume: 2.0,
  maxVolume: 10.0,
  mechanicalFriction: 0.0,
  engineRPM: 60,
  insulationQuality: 1.0,
  expansionRate: 1.0,
  compressionRate: 1.0,

  heatLeakageEnabled: false,
  frictionLossEnabled: false,
  inelasticCollisionsEnabled: false,
  turbulenceEnabled: false,
  nonIdealGasEnabled: false,
  vanDerWaalsA: 0.0,
  vanDerWaalsB: 0.0,

  vizSettings: {
    motionBlur: false,
    thermalHeatmap: true,
    particleTrails: false,
    entropyOverlay: false,
    pressureField: false,
    velocityVectors: false,
    pathTracing: false,
    collisionWavelets: false,
  },

  graphSettings: {
    smoothing: 0.5,
    samplingRate: 60,
    rollingAvgWindow: 30,
    histogramBins: 20,
    interpolation: "linear",
    logScaleX: false,
    logScaleY: false,
    multiCurveOverlay: false,
  },

  solverMode: "molecular_dynamics",

  // ── Actions ─────────────────────────────────────────────
  setTH: (t) => set({ TH: Math.max(t, get().TC + 10) }),
  setTC: (t) => set({ TC: Math.min(t, get().TH - 10) }),
  setPlaying: (p) => set({ isPlaying: p }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),
  setConfig: (key, value) => set({ [key]: value } as Pick<CarnotState, typeof key>),
  setVizSetting: (key, value) => set(s => ({ vizSettings: { ...s.vizSettings, [key]: value } })),
  setGraphSetting: (key, value) => set(s => ({ graphSettings: { ...s.graphSettings, [key]: value } })),

  tick: (dt) => {
    const state = get();
    if (!state.isPlaying) return;
    
    // Cap dt at 0.1s to prevent huge jumps when the browser tab is backgrounded
    const cappedDt = Math.min(dt, 0.1);
    
    const stageDuration = 2.5 / state.playbackSpeed;
    const progressDelta = cappedDt / stageDuration;
    let newProgress = state.stageProgress + progressDelta;
    let newStage = state.currentStage;
    
    while (newProgress >= 1.0) {
      newProgress -= 1.0;
      const idx = STAGES.indexOf(newStage);
      newStage = STAGES[(idx + 1) % STAGES.length];
    }
    
    set({ 
      stageProgress: newProgress, 
      currentStage: newStage, 
      globalTime: state.globalTime + cappedDt 
    });
  },

  reset: () => set({
    currentStage: "ISOTHERMAL_EXPANSION",
    stageProgress: 0,
    globalTime: 0,
    isPlaying: false
  })
}));

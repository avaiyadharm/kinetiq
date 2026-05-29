import { create } from "zustand";
import { MATERIAL_DATABASE, MaterialData, ThermalExpansionPhysicsEngine } from "@/lib/physics/thermalExpansion";

export type ShapeType = "rod" | "bridge" | "railway" | "cube" | "plate" | "ring" | "liquid" | "bimetallic";
export type StructuralConstraint = "free" | "fixed" | "partial" | "multi";
export type ExperimentMode = 
  | "free" 
  | "fixed" 
  | "bridge" 
  | "railway" 
  | "bimetallic" 
  | "shock" 
  | "cryo" 
  | "fatigue" 
  | "space" 
  | "precision";

export type SimulationEngineType = "fea" | "md" | "statistical" | "hybrid";

export interface LogEntry {
  timestamp: number;
  message: string;
  type: "info" | "warning" | "error";
}

export interface HistoryPoint {
  time: number;
  temp: number;
  length: number;
  deltaL: number;
  stress: number;
  strain: number;
  energy: number;
  fatigue: number;
  deflection: number;
}

export interface VizSettings {
  thermalGlow: boolean;
  heatmaps: boolean;
  latticeRendering: boolean;
  particleTrails: boolean;
  deformationAmplification: number;
}

export interface GraphSettings {
  smoothing: number;
  samplingRate: number;
  logScale: boolean;
  overlayComparison: boolean;
}

interface ThermalExpansionState {
  // Main state
  temperature: number;        // Current T (K)
  targetTemperature: number;  // Target T (K)
  materialId: string;         // Preset material
  objectType: ShapeType;      // Shape selection
  constraint: StructuralConstraint;
  experimentMode: ExperimentMode;
  engineType: SimulationEngineType;

  // Geometry
  L0: number;                 // Initial length (m)
  thickness: number;          // Thickness (m)
  crossSectionalArea: number; // Cross sectional area (m^2)
  gapSize: number;            // Constraint gap size (m)
  liquidContainerVol: number; // Volume of liquid container (L)

  // Bimetallic configuration
  bimetallicMat1: string;
  bimetallicMat2: string;

  // Playback
  isPlaying: boolean;
  playbackSpeed: number;
  time: number;

  // Historial and analysis data
  history: HistoryPoint[];
  logs: LogEntry[];
  
  // Physical history accumulation
  plasticStrain: number;      // Permanent strain from yield stress
  fatigueAccumulated: number; // Fatigue damage (0 to 1)
  isBroken: boolean;
  isDeformed: boolean;
  crackLocations: { x: number; y: number; size: number }[];

  // Sub-system config
  atomCount: number;
  vibrationIntensity: number;
  bondStiffness: number;
  thermalNoise: number;

  // Settings wrappers
  vizSettings: VizSettings;
  graphSettings: GraphSettings;

  // Actions
  setTemperature: (t: number) => void;
  setTargetTemperature: (t: number) => void;
  setMaterialId: (id: string) => void;
  setObjectType: (type: ShapeType) => void;
  setConstraint: (constraint: StructuralConstraint) => void;
  setExperimentMode: (mode: ExperimentMode) => void;
  setConfig: <K extends keyof ThermalExpansionState>(key: K, value: ThermalExpansionState[K]) => void;
  setVizSetting: <K extends keyof VizSettings>(key: K, value: VizSettings[K]) => void;
  setGraphSetting: <K extends keyof GraphSettings>(key: K, value: GraphSettings[K]) => void;
  
  // Simulation utilities
  tick: (dt: number) => void;
  reset: () => void;
  addLog: (message: string, type?: "info" | "warning" | "error") => void;
  clearLogs: () => void;
  triggerThermalShock: (targetTemp: number) => void;
}

export const useThermalExpansionStore = create<ThermalExpansionState>((set, get) => {
  // Setup standard initial state
  return {
    temperature: 293.15,
    targetTemperature: 293.15,
    materialId: "steel",
    objectType: "rod",
    constraint: "free",
    experimentMode: "free",
    engineType: "fea",

    L0: 10,
    thickness: 0.1,
    crossSectionalArea: 0.01,
    gapSize: 0.02,
    liquidContainerVol: 5.0,

    bimetallicMat1: "copper",
    bimetallicMat2: "steel",

    isPlaying: true,
    playbackSpeed: 1.0,
    time: 0,

    history: [],
    logs: [
      { timestamp: Date.now(), message: "Thermal Expansion Laboratory Engine Initialized.", type: "info" }
    ],

    plasticStrain: 0,
    fatigueAccumulated: 0,
    isBroken: false,
    isDeformed: false,
    crackLocations: [],

    atomCount: 120,
    vibrationIntensity: 1.0,
    bondStiffness: 12.0,
    thermalNoise: 0.05,

    vizSettings: {
      thermalGlow: true,
      heatmaps: true,
      latticeRendering: true,
      particleTrails: false,
      deformationAmplification: 2.0
    },

    graphSettings: {
      smoothing: 0.4,
      samplingRate: 60,
      logScale: false,
      overlayComparison: false
    },

    setTemperature: (t) => set({ temperature: Math.max(1.0, t) }),
    setTargetTemperature: (t) => {
      const currentT = get().temperature;
      // Log target change if significant
      if (Math.abs(get().targetTemperature - t) > 1) {
        get().addLog(`Temperature target set to ${t.toFixed(1)} K (${(t - 273.15).toFixed(1)} °C)`, "info");
      }
      set({ targetTemperature: Math.max(1.0, t) });
    },
    setMaterialId: (id) => {
      const mat = MATERIAL_DATABASE[id];
      if (mat) {
        get().addLog(`Primary material switched to: ${mat.name}`, "info");
        set({ materialId: id, isBroken: false, isDeformed: false, plasticStrain: 0, crackLocations: [] });
      }
    },
    setObjectType: (type) => {
      get().addLog(`Selected object representation: ${type.toUpperCase()}`, "info");
      set({ objectType: type, isBroken: false, isDeformed: false, plasticStrain: 0, crackLocations: [] });
    },
    setConstraint: (constraint) => {
      get().addLog(`Boundary structural constraint set to: ${constraint.toUpperCase()}`, "info");
      set({ constraint, isBroken: false, isDeformed: false, plasticStrain: 0, crackLocations: [] });
    },
    setExperimentMode: (mode) => {
      get().addLog(`Experiment Mode activated: ${mode.replace(/_/g, " ").toUpperCase()}`, "info");
      
      // Load presets based on mode
      const updates: Partial<ThermalExpansionState> = { 
        experimentMode: mode,
        isBroken: false,
        isDeformed: false,
        plasticStrain: 0,
        crackLocations: []
      };

      switch (mode) {
        case "free":
          updates.objectType = "rod";
          updates.constraint = "free";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          break;
        case "fixed":
          updates.objectType = "rod";
          updates.constraint = "fixed";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          break;
        case "bridge":
          updates.objectType = "bridge";
          updates.constraint = "partial";
          updates.gapSize = 0.015; // 1.5 cm expansion gap
          updates.materialId = "concrete";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          break;
        case "railway":
          updates.objectType = "railway";
          updates.constraint = "partial";
          updates.gapSize = 0.005; // 5 mm expansion gap
          updates.materialId = "steel";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          break;
        case "bimetallic":
          updates.objectType = "bimetallic";
          updates.bimetallicMat1 = "copper";
          updates.bimetallicMat2 = "steel";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          break;
        case "shock":
          updates.objectType = "rod";
          updates.materialId = "glass";
          updates.constraint = "free";
          updates.targetTemperature = 800; // start hot
          updates.temperature = 800;
          break;
        case "cryo":
          updates.objectType = "rod";
          updates.constraint = "fixed"; // show stress contraction cracks
          updates.targetTemperature = 77.15; // liquid nitrogen temp
          updates.temperature = 293.15;
          break;
        case "fatigue":
          updates.objectType = "rod";
          updates.constraint = "fixed";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          updates.fatigueAccumulated = 0;
          break;
        case "space":
          updates.objectType = "bimetallic";
          updates.bimetallicMat1 = "aluminum";
          updates.bimetallicMat2 = "invar";
          updates.temperature = 293.15;
          updates.targetTemperature = 293.15;
          break;
        case "precision":
          updates.objectType = "rod";
          updates.constraint = "multi";
          updates.materialId = "invar";
          updates.targetTemperature = 293.15;
          updates.temperature = 293.15;
          break;
      }

      set(updates);
    },
    setConfig: (key, value) => set({ [key]: value } as Pick<ThermalExpansionState, typeof key>),
    setVizSetting: (key, value) => set(s => ({ vizSettings: { ...s.vizSettings, [key]: value } })),
    setGraphSetting: (key, value) => set(s => ({ graphSettings: { ...s.graphSettings, [key]: value } })),

    addLog: (message, type = "info") => {
      const newEntry: LogEntry = {
        timestamp: Date.now(),
        message,
        type
      };
      set(s => ({ logs: [newEntry, ...s.logs].slice(0, 200) }));
    },
    clearLogs: () => set({ logs: [] }),

    triggerThermalShock: (targetTemp) => {
      const currentTemp = get().temperature;
      const mat = MATERIAL_DATABASE[get().materialId];
      
      get().addLog(`CRITICAL: Applying immediate thermal shock from ${currentTemp.toFixed(1)}K to ${targetTemp.toFixed(1)}K!`, "warning");
      
      // Calculate immediate thermal shock stress based on the huge temperature step
      const rate = (targetTemp - currentTemp) / 0.05; // treated as immediate
      const { shockStress, shockFactor } = ThermalExpansionPhysicsEngine.getThermalShockStress(mat, rate, get().thickness);

      set({ temperature: targetTemp, targetTemperature: targetTemp });

      if (shockStress > mat.yieldStrength) {
        set({ isBroken: true, isDeformed: true });
        
        // Spawn cracks
        const count = 3 + Math.floor(Math.random() * 5);
        const newCracks = [];
        for (let i = 0; i < count; i++) {
          newCracks.push({
            x: 0.2 + Math.random() * 0.6,
            y: 0.3 + Math.random() * 0.4,
            size: 15 + Math.random() * 25
          });
        }
        set({ crackLocations: newCracks });
        get().addLog(`THERMAL SHOCK FAILURE: Micro-cracking propagated through ${mat.name}. Stress: ${shockStress.toFixed(1)} MPa exceeds limit.`, "error");
      } else {
        get().addLog(`Thermal shock survived by ${mat.name}. Stress induced: ${shockStress.toFixed(1)} MPa.`, "info");
      }
    },

    tick: (dt) => {
      const state = get();
      if (!state.isPlaying) return;

      const cappedDt = Math.min(dt, 0.1) * state.playbackSpeed;
      let nextTemp = state.temperature;

      // 1. Automatic thermal cycle controllers for specific modes
      if (state.experimentMode === "fatigue") {
        // Continuous sinusoidal heating/cooling cycle: T oscillates between 100K and 650K
        const period = 5.0; // 5 seconds per full cycle
        const w = (2 * Math.PI) / period;
        nextTemp = 375 + 275 * Math.sin(w * state.time);
        set({ temperature: nextTemp, targetTemperature: nextTemp });
      } else if (state.experimentMode === "space") {
        // Spacecraft orbit cycle: 10s sunlight (400K), 10s shadow (120K)
        const cyclePeriod = 12.0;
        const phase = (state.time % cyclePeriod) / cyclePeriod;
        if (phase < 0.5) {
          // Direct sunlight heating
          nextTemp = state.temperature + (400 - state.temperature) * 0.15;
        } else {
          // Deep space cooling shadow
          nextTemp = state.temperature + (120 - state.temperature) * 0.15;
        }
        set({ temperature: nextTemp });
      } else {
        // Standard thermostat adjustment towards target temp
        const deltaT = state.targetTemperature - state.temperature;
        const speed = 0.8; // heat transfer coefficient
        nextTemp = state.temperature + deltaT * speed * cappedDt;
        set({ temperature: nextTemp });
      }

      const mat = MATERIAL_DATABASE[state.materialId];
      const dT = nextTemp - ThermalExpansionPhysicsEngine.T_REF;

      // 2. Plastic strain and hysteresis tracking
      let nextPlasticStrain = state.plasticStrain;
      let nextFatigue = state.fatigueAccumulated;
      let nextIsBroken = state.isBroken;
      let nextIsDeformed = state.isDeformed;

      if (!nextIsBroken) {
        // Get mechanical stress/strain state
        const analysis = ThermalExpansionPhysicsEngine.getStressAndStrain(
          state.L0,
          mat,
          nextTemp,
          state.objectType === "bimetallic" ? "free" : state.constraint,
          state.gapSize,
          state.plasticStrain
        );

        // Accumulate permanent plastic deformation (creep) if stress exceeds yield strength
        if (analysis.stress > mat.yieldStrength) {
          const excessStress = analysis.stress - mat.yieldStrength;
          nextPlasticStrain += excessStress * 1e-6 * cappedDt; // simple linear flow rule
          nextIsDeformed = true;

          // Fatigue accumulation
          nextFatigue = Math.min(1.0, nextFatigue + (excessStress / mat.yieldStrength) * 0.05 * cappedDt);
        } else if (analysis.stress < -mat.yieldStrength) {
          // Compressive yield
          const excessStress = -analysis.stress - mat.yieldStrength;
          nextPlasticStrain -= excessStress * 1e-6 * cappedDt;
          nextIsDeformed = true;
          
          nextFatigue = Math.min(1.0, nextFatigue + (excessStress / mat.yieldStrength) * 0.05 * cappedDt);
        }

        // Stress check fatigue damage
        if (state.experimentMode === "fatigue") {
          const stressAmp = Math.abs(analysis.stress);
          if (stressAmp > 0) {
            nextFatigue = Math.min(1.0, nextFatigue + (stressAmp / (mat.yieldStrength * 1.5)) * 0.04 * cappedDt);
          }
        }

        // Crack propagation and failure threshold
        if (nextFatigue >= 1.0) {
          nextIsBroken = true;
          get().addLog(`FATIGUE FAILURE: Material fatigue reaches critical limit! Structure fractured.`, "error");
          
          // Generate crack locations
          const count = 4;
          const newCracks = [];
          for (let i = 0; i < count; i++) {
            newCracks.push({
              x: 0.15 + (i * 0.23) + Math.random() * 0.08,
              y: 0.4 + Math.random() * 0.2,
              size: 20 + Math.random() * 20
            });
          }
          set({ crackLocations: newCracks });
        }

        if (analysis.isBroken) {
          nextIsBroken = true;
          get().addLog(`CRITICAL FAILURE: Thermal stress (${analysis.stress.toFixed(1)} MPa) exceeds structural threshold!`, "error");
          
          // Spawn cracks
          const count = 4;
          const newCracks = [];
          for (let i = 0; i < count; i++) {
            newCracks.push({
              x: 0.2 + Math.random() * 0.6,
              y: 0.35 + Math.random() * 0.3,
              size: 15 + Math.random() * 30
            });
          }
          set({ crackLocations: newCracks });
        }

        set({
          plasticStrain: nextPlasticStrain,
          fatigueAccumulated: nextFatigue,
          isBroken: nextIsBroken,
          isDeformed: nextIsDeformed
        });
      }

      // 3. Log data to telemetry history (at 60Hz limit)
      const nextTime = state.time + cappedDt;
      const historyInterval = 1 / state.graphSettings.samplingRate;
      
      const lastHistoryPoint = state.history[state.history.length - 1];
      if (!lastHistoryPoint || (nextTime - lastHistoryPoint.time) >= historyInterval) {
        // Calculate variables for history entry
        const length = ThermalExpansionPhysicsEngine.getLength(state.L0, mat, nextTemp, state.plasticStrain);
        const deltaL = length - state.L0;
        
        let stress = 0;
        let strain = 0;
        if (state.objectType !== "bimetallic") {
          const res = ThermalExpansionPhysicsEngine.getStressAndStrain(
            state.L0,
            mat,
            nextTemp,
            state.constraint,
            state.gapSize,
            state.plasticStrain
          );
          stress = res.stress;
          strain = res.strain;
        }

        // Bimetallic bending variables
        let deflection = 0;
        if (state.objectType === "bimetallic") {
          const mat1 = MATERIAL_DATABASE[state.bimetallicMat1];
          const mat2 = MATERIAL_DATABASE[state.bimetallicMat2];
          const res = ThermalExpansionPhysicsEngine.getBimetallicBending(
            state.L0,
            state.thickness,
            mat1,
            mat2,
            nextTemp
          );
          deflection = res.deflection;
          stress = res.stressMax;
        }

        // Heat/Internal energy: Q = m*c*dT
        // mass m = density * volume = density * L0 * crossSectionalArea
        const mass = mat.density * state.L0 * state.crossSectionalArea;
        const energy = mass * mat.heatCapacity * dT; // Joules

        const newPoint: HistoryPoint = {
          time: nextTime,
          temp: nextTemp,
          length,
          deltaL,
          stress,
          strain,
          energy,
          fatigue: state.fatigueAccumulated,
          deflection
        };

        set(s => ({
          history: [...s.history, newPoint].slice(-1000) // Keep rolling 1000 points
        }));
      }

      set({ time: nextTime });
    },

    reset: () => {
      const mode = get().experimentMode;
      get().addLog("Simulator reset. Restoring current mode variables...", "info");
      
      // Simply re-trigger mode setup to clear buffers
      get().setExperimentMode(mode);
      set({
        time: 0,
        history: [],
        plasticStrain: 0,
        fatigueAccumulated: 0,
        isBroken: false,
        isDeformed: false,
        crackLocations: []
      });
    }
  };
});

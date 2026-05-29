import { create } from "zustand";
import {
  MATERIAL_DB,
  MaterialProperties,
  PhysicsEngine,
  ExperimentMode,
  ConstraintType,
  ShapeType,
  HeatingMode
} from "@/lib/physics/thermalExpansion";

// Re-export types for components
export type { ExperimentMode, ConstraintType, ShapeType, HeatingMode };

// ============================================================
// Data Types
// ============================================================

export interface HistoryPoint {
  time: number;
  avgTemp: number;
  deltaL: number;         // m — real physical expansion
  stress: number;         // Pa
  strain: number;
  energy: number;         // J
  deflection: number;     // m (bimetallic tip)
  curvature: number;      // 1/m
  damage: number;         // 0–1
  cycleCount: number;
}

export interface LogEntry {
  timestamp: number;
  message: string;
  type: "info" | "warning" | "error";
}

export interface VizSettings {
  showThermalGradient: boolean;
  showStressColors: boolean;
  showAtomicLattice: boolean;
  showHeatFront: boolean;
  magnification: number;           // Visual scale multiplier for ΔL
  autoMagnification: boolean;
  deformationExaggeration: number; // Additional visual exaggeration (1–10)
}

export interface GraphSettings {
  overlayIdeal: boolean;
  showYieldLine: boolean;
  showCriticalLoad: boolean;
}

// ============================================================
// State Interface
// ============================================================
interface ThermalExpansionState {
  // Core configuration
  materialId: string;
  objectType: ShapeType;
  constraint: ConstraintType;
  experimentMode: ExperimentMode;
  heatingMode: HeatingMode;

  // Geometry
  L0: number;               // Initial length (m)
  thickness: number;        // Cross-section thickness (m)
  diameter: number;         // For circular cross-sections (m)
  crossSectionalArea: number; // m²
  gapSize: number;          // Expansion joint gap (m)

  // Bimetallic
  bimetallicMat1: string;
  bimetallicMat2: string;

  // Simulation state
  isPlaying: boolean;
  playbackSpeed: number;
  time: number;

  // Temperature
  targetTemperature: number;        // K — thermostat target
  thermalProfile: number[];         // K array of N_NODES temperatures along rod
  ambientTemperature: number;       // K

  // Heating rate for thermostat
  heatingRate: number;  // K/s — how fast target temperature is applied to boundary

  // Derived physics state (updated each tick)
  avgTemperature: number;           // K — mean of thermalProfile
  realDeltaL: number;               // m — real physical ΔL
  stressAtConstraint: number;       // Pa
  mechanicalStrain: number;
  isYielding: boolean;
  isFailed: boolean;
  factorOfSafety: number;
  bucklingLoad: number;             // N
  bucklingCriticalLoad: number;     // N
  willBuckle: boolean;
  bimetallicCurvature: number;      // 1/m
  bimetallicDeflection: number;     // m
  fatigueAccumulated: number;       // 0–1
  cycleCount: number;
  plasticStrain: number;            // permanent strain

  // Spatial profiles
  spatialStressProfile: number[];   // Pa, one per node
  spatialExpansionProfile: number[]; // m, per-node expansion

  // History
  history: HistoryPoint[];
  logs: LogEntry[];

  // Crack state
  crackLocations: { x: number; y: number; size: number }[];

  // Settings
  vizSettings: VizSettings;
  graphSettings: GraphSettings;

  // ── Actions ──────────────────────────────────────────────
  setMaterialId: (id: string) => void;
  setObjectType: (type: ShapeType) => void;
  setConstraint: (c: ConstraintType) => void;
  setExperimentMode: (mode: ExperimentMode) => void;
  setTargetTemperature: (T: number) => void;
  setHeatingMode: (mode: HeatingMode) => void;
  setConfig: <K extends keyof ThermalExpansionState>(key: K, value: ThermalExpansionState[K]) => void;
  setVizSetting: <K extends keyof VizSettings>(key: K, value: VizSettings[K]) => void;
  setGraphSetting: <K extends keyof GraphSettings>(key: K, value: GraphSettings[K]) => void;

  tick: (dt: number) => void;
  reset: () => void;
  triggerThermalShock: (T_new: number) => void;
  addLog: (message: string, type?: "info" | "warning" | "error") => void;
  clearLogs: () => void;
}

// ============================================================
// Helper: Initialize thermal profile (uniform at ambient)
// ============================================================
function initThermalProfile(T: number): number[] {
  return new Array(PhysicsEngine.N_NODES).fill(T);
}

// ============================================================
// Experiment mode presets
// ============================================================
type Preset = Partial<Pick<ThermalExpansionState,
  "objectType" | "constraint" | "materialId" | "bimetallicMat1" | "bimetallicMat2" |
  "targetTemperature" | "heatingMode" | "gapSize" | "heatingRate"
>>;

const EXPERIMENT_PRESETS: Record<ExperimentMode, Preset> = {
  free_expansion:    { objectType: "rod",         constraint: "free",    materialId: "steel",    heatingMode: "uniform", targetTemperature: 293.15 },
  fixed_constraint:  { objectType: "rod",         constraint: "fixed",   materialId: "steel",    heatingMode: "uniform", targetTemperature: 293.15 },
  bridge_gap:        { objectType: "bridge",       constraint: "partial", materialId: "concrete", heatingMode: "uniform", gapSize: 0.012, targetTemperature: 293.15 },
  railway_buckling:  { objectType: "railway",      constraint: "fixed",   materialId: "steel",    heatingMode: "uniform", targetTemperature: 293.15 },
  bimetallic:        { objectType: "bimetallic",   constraint: "free",    bimetallicMat1: "copper", bimetallicMat2: "invar", heatingMode: "uniform", targetTemperature: 293.15 },
  thermal_shock:     { objectType: "rod",          constraint: "free",    materialId: "glass",    heatingMode: "left",    targetTemperature: 800, heatingRate: 500 },
  cryogenic:         { objectType: "rod",          constraint: "fixed",   materialId: "steel",    heatingMode: "uniform", targetTemperature: 77.15 },
  fatigue:           { objectType: "rod",          constraint: "fixed",   materialId: "steel",    heatingMode: "uniform", targetTemperature: 293.15 },
  spacecraft:        { objectType: "bimetallic",   constraint: "free",    bimetallicMat1: "aluminum", bimetallicMat2: "invar", heatingMode: "uniform", targetTemperature: 293.15 },
  precision:         { objectType: "rod",          constraint: "spring",  materialId: "invar",    heatingMode: "uniform", targetTemperature: 293.15 },
};

// ============================================================
// Store
// ============================================================
export const useThermalExpansionStore = create<ThermalExpansionState>((set, get) => {
  const AMBIENT = 293.15;
  const N = PhysicsEngine.N_NODES;

  const initialState = {
    materialId: "steel",
    objectType: "rod" as ShapeType,
    constraint: "free" as ConstraintType,
    experimentMode: "free_expansion" as ExperimentMode,
    heatingMode: "uniform" as HeatingMode,

    L0: 10,
    thickness: 0.05,
    diameter: 0.05,
    crossSectionalArea: Math.PI * (0.025 ** 2), // π r²
    gapSize: 0.012,

    bimetallicMat1: "copper",
    bimetallicMat2: "invar",

    isPlaying: true,
    playbackSpeed: 1.0,
    time: 0,

    targetTemperature: AMBIENT,
    thermalProfile: initThermalProfile(AMBIENT),
    ambientTemperature: AMBIENT,
    heatingRate: 50,  // K/s default

    avgTemperature: AMBIENT,
    realDeltaL: 0,
    stressAtConstraint: 0,
    mechanicalStrain: 0,
    isYielding: false as boolean,
    isFailed: false as boolean,
    factorOfSafety: 999,
    bucklingLoad: 0,
    bucklingCriticalLoad: 0,
    willBuckle: false as boolean,
    bimetallicCurvature: 0,
    bimetallicDeflection: 0,
    fatigueAccumulated: 0,
    cycleCount: 0,
    plasticStrain: 0,

    spatialStressProfile: new Array(N).fill(0),
    spatialExpansionProfile: new Array(N).fill(0),

    history: [],
    logs: [{ timestamp: Date.now(), message: "Thermal Expansion Laboratory initialized. Physics engine ready.", type: "info" as const }],
    crackLocations: [],

    vizSettings: {
      showThermalGradient: true,
      showStressColors: true,
      showAtomicLattice: true,
      showHeatFront: true,
      magnification: 100,
      autoMagnification: true,
      deformationExaggeration: 1,
    },

    graphSettings: {
      overlayIdeal: true,
      showYieldLine: true,
      showCriticalLoad: true,
    },
  };

  return {
    ...initialState,

    setMaterialId: (id) => {
      const mat = MATERIAL_DB[id];
      if (!mat) return;
      get().addLog(`Material → ${mat.name} | α = ${(mat.alpha0 * 1e6).toFixed(2)} ×10⁻⁶ /K | E = ${(mat.youngsModulus / 1e9).toFixed(0)} GPa`, "info");
      set({ materialId: id, plasticStrain: 0, isFailed: false, isYielding: false, crackLocations: [] });
    },

    setObjectType: (type) => {
      set({ objectType: type, plasticStrain: 0, isFailed: false, crackLocations: [] });
    },

    setConstraint: (c) => {
      get().addLog(`Boundary condition → ${c.toUpperCase()}`, "info");
      set({ constraint: c, plasticStrain: 0, isFailed: false, isYielding: false, crackLocations: [] });
    },

    setExperimentMode: (mode) => {
      const preset = EXPERIMENT_PRESETS[mode];
      const T0 = preset.targetTemperature ?? AMBIENT;
      get().addLog(`Experiment → ${mode.replace(/_/g, " ").toUpperCase()}`, "info");
      set({
        experimentMode: mode,
        ...preset,
        thermalProfile: initThermalProfile(AMBIENT),
        history: [],
        plasticStrain: 0,
        isFailed: false,
        isYielding: false,
        fatigueAccumulated: 0,
        cycleCount: 0,
        crackLocations: [],
      });
    },

    setTargetTemperature: (T) => {
      set({ targetTemperature: Math.max(5, Math.min(4000, T)) });
    },

    setHeatingMode: (mode) => {
      set({ heatingMode: mode });
    },

    setConfig: (key, value) => set({ [key]: value } as any),
    setVizSetting: (key, value) => set(s => ({ vizSettings: { ...s.vizSettings, [key]: value } })),
    setGraphSetting: (key, value) => set(s => ({ graphSettings: { ...s.graphSettings, [key]: value } })),

    addLog: (message, type = "info") => {
      const entry: LogEntry = { timestamp: Date.now(), message, type };
      set(s => ({ logs: [entry, ...s.logs].slice(0, 300) }));
    },

    clearLogs: () => set({ logs: [] }),

    triggerThermalShock: (T_new) => {
      const s = get();
      const mat = MATERIAL_DB[s.materialId];
      const { shockStress, shockFactor } = PhysicsEngine.thermalShockStress(
        mat, T_new, s.avgTemperature, s.thickness
      );
      get().addLog(
        `THERMAL SHOCK: ΔT=${Math.abs(T_new - s.avgTemperature).toFixed(0)} K | σ_shock = ${(shockStress / 1e6).toFixed(0)} MPa | Factor = ${shockFactor.toFixed(2)}`,
        shockFactor > 1 ? "error" : "warning"
      );
      // Instant temperature jump at surface
      const newProfile = [...s.thermalProfile];
      newProfile[0] = T_new;
      newProfile[1] = T_new * 0.8 + s.thermalProfile[1] * 0.2;
      set({ thermalProfile: newProfile, targetTemperature: T_new });

      if (shockFactor > 1) {
        const cracks = Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
          x: 0.1 + Math.random() * 0.8,
          y: 0.3 + Math.random() * 0.4,
          size: 15 + Math.random() * 20
        }));
        set({ isFailed: true, crackLocations: cracks });
        get().addLog(`FRACTURE: Thermal shock stress (${(shockStress / 1e6).toFixed(0)} MPa) exceeds tensile strength of ${mat.name}.`, "error");
      }
    },

    // ── Main Physics Tick ──────────────────────────────────
    tick: (dt) => {
      const s = get();
      if (!s.isPlaying || s.isFailed) return;

      const scaledDt = Math.min(dt, 0.05) * s.playbackSpeed;
      const mat = MATERIAL_DB[s.materialId];

      // ── 1. Fatigue mode: oscillate temperature ──────────
      let targetT = s.targetTemperature;
      let newCycleCount = s.cycleCount;

      if (s.experimentMode === "fatigue") {
        const period = 6.0;
        const phase = (s.time % period) / period;
        targetT = 373 + 275 * Math.sin(2 * Math.PI * phase);
        // Count cycles
        const prevPhase = ((s.time - scaledDt) % period) / period;
        if (prevPhase > 0.9 && phase < 0.1) newCycleCount += 1;
        set({ targetTemperature: targetT, cycleCount: newCycleCount });
      } else if (s.experimentMode === "spacecraft") {
        const cyclePeriod = 15.0;
        const phase = (s.time % cyclePeriod) / cyclePeriod;
        targetT = phase < 0.5 ? 390 : 120;
        set({ targetTemperature: targetT });
      }

      // ── 2. Heat diffusion (with heating rate ramping) ──
      let activeTargetT = targetT;
      if (s.experimentMode !== "fatigue" && s.experimentMode !== "spacecraft") {
        const currentRefT = s.heatingMode === "uniform" ? s.avgTemperature : s.thermalProfile[0];
        const maxDeltaT = s.heatingRate * scaledDt;
        const diff = targetT - currentRefT;
        if (Math.abs(diff) > maxDeltaT) {
          activeTargetT = currentRefT + Math.sign(diff) * maxDeltaT;
        }
      }

      const newProfile = PhysicsEngine.heatDiffusionMultiStep(
        s.thermalProfile,
        mat,
        s.L0,
        activeTargetT,
        s.ambientTemperature,
        scaledDt,
        s.heatingMode
      );

      // ── 3. Derived spatial properties ─────────────────
      const { totalDeltaL, avgTemp } = PhysicsEngine.spatialExpansion(mat, newProfile, s.L0);
      const spatialStress = PhysicsEngine.spatialStress(mat, newProfile, s.constraint);
      const { deltaLPerNode } = PhysicsEngine.spatialExpansion(mat, newProfile, s.L0);

      // ── 4. Constraint mechanics at average temperature ─
      const constraintResult = PhysicsEngine.constraintState(
        mat, s.L0, avgTemp, s.constraint, s.gapSize, 100e6, s.plasticStrain
      );

      // ── 5. Plastic strain accumulation ─────────────────
      let newPlasticStrain = s.plasticStrain;
      const σ_y = PhysicsEngine.yieldStrength(mat, avgTemp);
      if (constraintResult.isYielding && !s.isFailed) {
        const excess = Math.abs(constraintResult.stress) - σ_y;
        newPlasticStrain += (excess / (mat.youngsModulus * 1e-6)) * scaledDt;
      }

      // ── 6. Fatigue damage accumulation ─────────────────
      let newFatigue = s.fatigueAccumulated;
      if (s.experimentMode === "fatigue" && newCycleCount > s.cycleCount) {
        const { damagePerCycle } = PhysicsEngine.fatigueDamagePerCycle(mat, 373 - 275, 373 + 275);
        newFatigue = Math.min(1.0, s.fatigueAccumulated + damagePerCycle);
        if (newFatigue >= 1.0) {
          get().addLog(`FATIGUE FAILURE: ${mat.name} reached critical damage after ${newCycleCount} cycles.`, "error");
          const cracks = Array.from({ length: 4 }, (_, i) => ({
            x: 0.15 + i * 0.22 + Math.random() * 0.06,
            y: 0.35 + Math.random() * 0.3,
            size: 18 + Math.random() * 15
          }));
          set({ isFailed: true, crackLocations: cracks });
          return;
        }
      }

      const bucklingResult = PhysicsEngine.bucklingCriticalLoad(
        mat, avgTemp, s.L0, s.crossSectionalArea, s.constraint, s.gapSize, "circular", s.diameter
      );
      if (bucklingResult.willBuckle && !s.willBuckle) {
        get().addLog(
          `BUCKLING: Thermal compressive load (${(bucklingResult.thermalLoad / 1e3).toFixed(0)} kN) exceeds P_cr = ${(bucklingResult.Pcr / 1e3).toFixed(0)} kN at ${avgTemp.toFixed(0)} K`,
          "error"
        );
      }

      // ── 8. Bimetallic calculations ─────────────────────
      let biCurvature = 0;
      let biDeflection = 0;
      if (s.objectType === "bimetallic" || s.experimentMode === "bimetallic" || s.experimentMode === "spacecraft") {
        const mat1 = MATERIAL_DB[s.bimetallicMat1];
        const mat2 = MATERIAL_DB[s.bimetallicMat2];
        if (mat1 && mat2) {
          const biResult = PhysicsEngine.bimetallicCurvature(mat1, mat2, avgTemp, s.thickness);
          biCurvature = biResult.curvature;
          biDeflection = biResult.deflection(s.L0);
        }
      }

      // ── 9. Auto-magnification ──────────────────────────
      let newMag = s.vizSettings.magnification;
      if (s.vizSettings.autoMagnification && Math.abs(totalDeltaL) > 1e-9) {
        newMag = PhysicsEngine.recommendedMagnification(totalDeltaL, s.L0);
      }

      // ── 10. Failure check ──────────────────────────────
      let failed: boolean = s.isFailed;
      if (constraintResult.isFailed && !failed) {
        get().addLog(
          `FAILURE: σ = ${(constraintResult.stress / 1e6).toFixed(0)} MPa exceeds ultimate strength of ${mat.name} at T = ${avgTemp.toFixed(0)} K`,
          "error"
        );
        failed = true;
        const cracks = Array.from({ length: 4 }, () => ({
          x: 0.2 + Math.random() * 0.6,
          y: 0.35 + Math.random() * 0.3,
          size: 18 + Math.random() * 22
        }));
        set({ isFailed: true, crackLocations: cracks });
      }

      // ── 11. History recording ──────────────────────────
      const nextTime = s.time + scaledDt;
      const lastPt = s.history[s.history.length - 1];
      const needsRecord = !lastPt || (nextTime - lastPt.time) >= (1 / 30);

      let newHistory = s.history;
      if (needsRecord) {
        const mass = mat.density * s.L0 * s.crossSectionalArea;
        const energy = mass * mat.specificHeat * (avgTemp - s.ambientTemperature);
        const pt: HistoryPoint = {
          time: nextTime,
          avgTemp,
          deltaL: totalDeltaL,
          stress: constraintResult.stress,
          strain: constraintResult.mechanicalStrain,
          energy,
          deflection: biDeflection,
          curvature: biCurvature,
          damage: newFatigue,
          cycleCount: newCycleCount,
        };
        newHistory = [...s.history, pt].slice(-1500);
      }

      // ── 12. Yield warning log ──────────────────────────
      if (constraintResult.isYielding && !s.isYielding) {
        get().addLog(
          `YIELD: σ = ${(constraintResult.stress / 1e6).toFixed(0)} MPa > σ_y = ${(σ_y / 1e6).toFixed(0)} MPa at T = ${avgTemp.toFixed(0)} K`,
          "warning"
        );
      }

      set({
        thermalProfile: newProfile,
        avgTemperature: avgTemp,
        realDeltaL: totalDeltaL,
        stressAtConstraint: constraintResult.stress,
        mechanicalStrain: constraintResult.mechanicalStrain,
        isYielding: constraintResult.isYielding,
        factorOfSafety: constraintResult.factorOfSafety,
        bucklingLoad: bucklingResult.thermalLoad,
        bucklingCriticalLoad: bucklingResult.Pcr,
        willBuckle: bucklingResult.willBuckle,
        bimetallicCurvature: biCurvature,
        bimetallicDeflection: biDeflection,
        fatigueAccumulated: newFatigue,
        cycleCount: newCycleCount,
        plasticStrain: newPlasticStrain,
        spatialStressProfile: spatialStress,
        spatialExpansionProfile: deltaLPerNode,
        history: newHistory,
        time: nextTime,
        vizSettings: s.vizSettings.autoMagnification
          ? { ...s.vizSettings, magnification: newMag }
          : s.vizSettings,
      });
    },

    reset: () => {
      const mode = get().experimentMode;
      const preset = EXPERIMENT_PRESETS[mode];
      const T0 = preset.targetTemperature ?? AMBIENT;
      get().addLog("Simulator reset.", "info");
      set({
        ...preset,
        thermalProfile: initThermalProfile(AMBIENT),
        history: [],
        plasticStrain: 0,
        isFailed: false,
        isYielding: false,
        fatigueAccumulated: 0,
        cycleCount: 0,
        crackLocations: [],
        time: 0,
        willBuckle: false,
        bucklingLoad: 0,
        avgTemperature: AMBIENT,
        realDeltaL: 0,
        stressAtConstraint: 0,
        mechanicalStrain: 0,
        factorOfSafety: 999,
        spatialStressProfile: new Array(PhysicsEngine.N_NODES).fill(0),
        spatialExpansionProfile: new Array(PhysicsEngine.N_NODES).fill(0),
      });
    },
  };
});

// Backwards-compatibility alias for components that import MATERIAL_DATABASE
export { MATERIAL_DB as MATERIAL_DATABASE };

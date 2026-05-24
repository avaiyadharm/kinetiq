"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Material Physics ────────────────────────────────────────────────────────
// All values from engineering handbooks (SI units)
export interface Material {
  id: string;
  name: string;
  k: number;          // Thermal conductivity [W/m·K]
  rho: number;        // Density [kg/m³]
  cp: number;         // Specific heat [J/kg·K]
  color: string;      // Tailwind for UI
  canvasColor: string;
  get alpha(): number; // Thermal diffusivity [m²/s]
}

export class PhysicalMaterial implements Material {
  id: string;
  name: string;
  k: number;
  rho: number;
  cp: number;
  color: string;
  canvasColor: string;

  constructor(data: Omit<Material, "alpha">) {
    this.id = data.id;
    this.name = data.name;
    this.k = data.k;
    this.rho = data.rho;
    this.cp = data.cp;
    this.color = data.color;
    this.canvasColor = data.canvasColor;
  }

  get alpha() { return this.k / (this.rho * this.cp); }
}

// Thermal diffusivity: α = k/(ρ·cₚ) [m²/s]
// Copper:  α ≈ 1.17e-4 m²/s
// Iron:    α ≈ 2.34e-5 m²/s
// Glass:   α ≈ 3.40e-7 m²/s
// Wood:    α ≈ 1.26e-7 m²/s

export const MATERIALS: Record<string, Material> = {
  copper: {
    id: "copper", name: "Copper",
    k: 401, rho: 8960, cp: 385,
    color: "bg-orange-500", canvasColor: "rgb(249,115,22)",
    get alpha() { return this.k / (this.rho * this.cp); } // 1.165e-4
  },
  aluminum: {
    id: "aluminum", name: "Aluminum",
    k: 237, rho: 2700, cp: 900,
    color: "bg-slate-300", canvasColor: "rgb(203,213,225)",
    get alpha() { return this.k / (this.rho * this.cp); } // 9.74e-5
  },
  iron: {
    id: "iron", name: "Steel / Iron",
    k: 50, rho: 7870, cp: 490,
    color: "bg-zinc-500", canvasColor: "rgb(113,113,122)",
    get alpha() { return this.k / (this.rho * this.cp); } // 1.30e-5
  },
  glass: {
    id: "glass", name: "Borosilicate Glass",
    k: 1.0, rho: 2230, cp: 835,
    color: "bg-sky-400", canvasColor: "rgb(56,189,248)",
    get alpha() { return this.k / (this.rho * this.cp); } // 5.37e-7
  },
  wood: {
    id: "wood", name: "Oak Wood",
    k: 0.17, rho: 700, cp: 1700,
    color: "bg-amber-800", canvasColor: "rgb(146,64,14)",
    get alpha() { return this.k / (this.rho * this.cp); } // 1.43e-7
  },
  air: {
    id: "air", name: "Air / Void",
    k: 0.026, rho: 1.2, cp: 1005,
    color: "bg-zinc-900", canvasColor: "rgb(24,24,27)",
    get alpha() { return this.k / (this.rho * this.cp); } // 2.15e-5
  },
};

export type DrawTool = "source" | "sink" | "material" | "erase";
export type ColormapName = "thermal" | "icefire" | "jet" | "viridis" | "grayscale";
export type SolverMode = "transient" | "steady";
export type BoundaryType = "insulated" | "fixed" | "convective";

export interface Telemetry {
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  thermalEnergy: number;       // [J] stored thermal energy above reference
  maxFluxMag: number;          // [W/m²] peak heat flux magnitude
  stabilityRatio: number;      // r = α·Δt/Δx² (explicit), ≤ 0.25 for 2D stability
  simTime: number;             // [s] elapsed simulation time
  residual: number;            // Max |T_new - T_old| for convergence tracking
  solverIterations: number;    // GS iterations this frame
  stableTimestepLimit: number; // [s] CFL-based Δt_max
}

interface HeatTransferCanvasProps {
  gridSize: number;
  dx: number;          // [m] node spacing
  dt: number;          // [s] timestep (transient mode)
  ambientTemp: number; // [°C] T_∞
  convectionCoeff: number; // [W/m²K] h
  solverMode: SolverMode;
  boundaryType: BoundaryType;
  drawTool: DrawTool;
  selectedMaterial: string;
  brushSize: number;
  colormap: ColormapName;
  showFluxVectors: boolean;
  showIsotherms: boolean;
  showGridLines: boolean;
  showColorbar: boolean;
  isPlaying: boolean;
  activePreset: string;
  onTelemetryUpdate: (t: Telemetry) => void;
  stepsPerFrame: number; // sub-steps per animation frame
}

// ─── TDMA (Thomas Algorithm) for tridiagonal systems ────────────────────────
// Solves A·x = d where A is tridiagonal with diagonals a (lower), b (main), c (upper)
// In-place, O(n) time. Used for Crank-Nicolson ADI sweeps.
function tdma(
  a: Float64Array, // sub-diagonal (index 0 unused)
  b: Float64Array, // main diagonal
  c: Float64Array, // super-diagonal (last index unused)
  d: Float64Array, // RHS → solution on exit
  n: number
) {
  // Forward sweep
  const cPrime = new Float64Array(n);
  const dPrime = new Float64Array(n);
  cPrime[0] = c[0] / b[0];
  dPrime[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cPrime[i - 1];
    cPrime[i] = c[i] / m;
    dPrime[i] = (d[i] - a[i] * dPrime[i - 1]) / m;
  }
  // Back substitution
  d[n - 1] = dPrime[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    d[i] = dPrime[i] - cPrime[i] * d[i + 1];
  }
}

// ─── Colormap ────────────────────────────────────────────────────────────────
function getColormapColor(
  t: number, tMin: number, tMax: number, map: ColormapName
): { r: number; g: number; b: number } {
  const range = tMax - tMin;
  const norm = range > 1e-6 ? Math.max(0, Math.min(1, (t - tMin) / range)) : 0.5;

  if (map === "thermal") {
    // Ironbow: black → purple → red → orange → yellow → white
    if (norm < 0.2) {
      const f = norm / 0.2;
      return { r: Math.round(f * 50), g: 0, b: Math.round(f * 160) };
    } else if (norm < 0.4) {
      const f = (norm - 0.2) / 0.2;
      return { r: Math.round(50 + f * 160), g: 0, b: Math.round(160 - f * 90) };
    } else if (norm < 0.6) {
      const f = (norm - 0.4) / 0.2;
      return { r: 210, g: Math.round(f * 100), b: Math.round(70 - f * 50) };
    } else if (norm < 0.8) {
      const f = (norm - 0.6) / 0.2;
      return { r: 230, g: Math.round(100 + f * 120), b: 20 };
    } else {
      const f = (norm - 0.8) / 0.2;
      return { r: Math.round(230 + f * 25), g: Math.round(220 + f * 35), b: Math.round(20 + f * 235) };
    }
  } else if (map === "icefire") {
    if (norm < 0.25) {
      const f = norm / 0.25;
      return { r: 0, g: Math.round(f * 180), b: 255 };
    } else if (norm < 0.5) {
      const f = (norm - 0.25) / 0.25;
      return { r: 0, g: Math.round(180 - f * 150), b: Math.round(255 - f * 215) };
    } else if (norm < 0.75) {
      const f = (norm - 0.5) / 0.25;
      return { r: Math.round(f * 210), g: Math.round(30 + f * 80), b: 40 };
    } else {
      const f = (norm - 0.75) / 0.25;
      return { r: Math.round(210 + f * 45), g: Math.round(110 - f * 110), b: 40 };
    }
  } else if (map === "jet") {
    if (norm < 0.25) {
      const f = norm / 0.25;
      return { r: 0, g: Math.round(f * 255), b: 255 };
    } else if (norm < 0.5) {
      const f = (norm - 0.25) / 0.25;
      return { r: 0, g: 255, b: Math.round(255 - f * 255) };
    } else if (norm < 0.75) {
      const f = (norm - 0.5) / 0.25;
      return { r: Math.round(f * 255), g: 255, b: 0 };
    } else {
      const f = (norm - 0.75) / 0.25;
      return { r: 255, g: Math.round(255 - f * 255), b: 0 };
    }
  } else if (map === "viridis") {
    // Perceptually uniform: purple → blue → teal → green → yellow
    const r_arr = [68, 59, 33, 94, 253];
    const g_arr = [1, 82, 145, 201, 231];
    const b_arr = [84, 139, 140, 98, 37];
    const seg = Math.min(3, Math.floor(norm * 4));
    const f = norm * 4 - seg;
    return {
      r: Math.round(r_arr[seg] + f * (r_arr[seg + 1] - r_arr[seg])),
      g: Math.round(g_arr[seg] + f * (g_arr[seg + 1] - g_arr[seg])),
      b: Math.round(b_arr[seg] + f * (b_arr[seg + 1] - b_arr[seg])),
    };
  } else {
    const val = Math.round(norm * 255);
    return { r: val, g: val, b: val };
  }
}

// ─── Preset Configurations ───────────────────────────────────────────────────
function buildPreset(
  presetName: string, N: number, ambientTemp: number
): { temp: Float64Array; fixed: Uint8Array; materialId: Uint8Array } {
  // materialId index: 0=iron, 1=copper, 2=aluminum, 3=glass, 4=wood, 5=air
  const MATERIAL_KEYS = ["iron", "copper", "aluminum", "glass", "wood", "air"];
  const temp = new Float64Array(N * N).fill(ambientTemp);
  const fixed = new Uint8Array(N * N); // 0=free, 1=hot, 2=cold
  const materialId = new Uint8Array(N * N); // default: iron (0)

  const setRect = (
    i0: number, i1: number, j0: number, j1: number,
    T: number | null, fix: number, matIdx: number
  ) => {
    for (let j = Math.max(0, j0); j <= Math.min(N - 1, j1); j++) {
      for (let i = Math.max(0, i0); i <= Math.min(N - 1, i1); i++) {
        const idx = j * N + i;
        if (T !== null) temp[idx] = T;
        if (fix >= 0) fixed[idx] = fix;
        materialId[idx] = matIdx;
      }
    }
  };

  const setDisc = (cx: number, cy: number, r: number, T: number | null, fix: number, matIdx: number) => {
    for (let j = cy - r; j <= cy + r; j++) {
      for (let i = cx - r; i <= cx + r; i++) {
        if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r) {
          const idx = j * N + i;
          if (idx < 0 || idx >= N * N) continue;
          if (T !== null) temp[idx] = T;
          if (fix >= 0) fixed[idx] = fix;
          materialId[idx] = matIdx;
        }
      }
    }
  };

  if (presetName === "CPU Heatsink") {
    const cx = Math.floor(N / 2), cy = Math.floor(N / 2);
    const dieW = Math.max(2, Math.floor(N * 0.12));
    const finH = Math.max(4, Math.floor(N * 0.38));
    const baseH = 3;
    const numFins = 7;
    const finSpacing = Math.floor((2 * dieW + 8) / numFins);

    // Copper heat spreader base
    setRect(cx - dieW - 5, cx + dieW + 5, cy - baseH, cy + baseH, null, 0, 1);
    // Silicon CPU die (heat source)
    setRect(cx - dieW, cx + dieW, cy - 2, cy + 2, 95, 1, 3); // glass ≈ silicon
    // Copper fins
    for (let f = 0; f < numFins; f++) {
      const fi = cx - dieW - 4 + f * finSpacing;
      setRect(fi, fi + 1, cy - finH, cy + finH, null, 0, 1);
    }

  } else if (presetName === "Thermal Bridge") {
    const cy = Math.floor(N / 2);
    const bridgeW = Math.max(2, Math.floor(N * 0.08));
    // Fill with wood insulator
    for (let k = 0; k < N * N; k++) materialId[k] = 4;
    // Hot left wall
    for (let j = 1; j < N - 1; j++) { temp[j * N] = 100; fixed[j * N] = 1; }
    // Cold right wall
    for (let j = 1; j < N - 1; j++) { temp[j * N + (N - 1)] = 5; fixed[j * N + (N - 1)] = 2; }
    // Copper bridge through center
    setRect(0, N - 1, cy - bridgeW, cy + bridgeW, null, 0, 1);

  } else if (presetName === "Corner Heating") {
    const r = Math.floor(N * 0.18);
    setDisc(0, 0, r, 100, 1, 1);                     // hot TL corner, copper
    setDisc(N - 1, N - 1, r, 5, 2, 2);               // cold BR corner, aluminum
    setDisc(N - 1, 0, Math.floor(r * 0.7), null, 0, 4); // insulator SW
    setDisc(0, N - 1, Math.floor(r * 0.7), null, 0, 4); // insulator NE

  } else if (presetName === "Insulated Box") {
    const cx = Math.floor(N / 2), cy = Math.floor(N / 2);
    const boxW = Math.floor(N * 0.28);
    // Hot core
    setRect(cx - 2, cx + 2, cy - 2, cy + 2, 100, 1, 1);
    // Wood insulating walls (outline only)
    for (let j = cy - boxW; j <= cy + boxW; j++) {
      for (let i = cx - boxW; i <= cx + boxW; i++) {
        if (j < 0 || j >= N || i < 0 || i >= N) continue;
        if (Math.abs(j - cy) === boxW || Math.abs(i - cx) === boxW) {
          materialId[j * N + i] = 4; // wood
        }
      }
    }

  } else if (presetName === "Fins Array") {
    // Horizontal flat plate with vertical copper fins, left edge heated
    for (let j = 1; j < N - 1; j++) { temp[j * N] = 120; fixed[j * N] = 1; } // left hot
    const numFins = 5, finThick = Math.max(1, Math.floor(N * 0.03));
    const finHeight = Math.floor(N * 0.5);
    const spacing = Math.floor(N / (numFins + 1));
    for (let f = 0; f < numFins; f++) {
      const fi = (f + 1) * spacing;
      setRect(fi - finThick, fi + finThick, Math.floor(N / 2) - finHeight, Math.floor(N / 2) + finHeight, null, 0, 1);
    }
  }

  return { temp, fixed, materialId };
}

// ─── Component ───────────────────────────────────────────────────────────────
export const HeatTransferCanvas: React.FC<HeatTransferCanvasProps> = ({
  gridSize, dx, dt, ambientTemp, convectionCoeff,
  solverMode, boundaryType, drawTool, selectedMaterial,
  brushSize, colormap, showFluxVectors, showIsotherms, showGridLines, showColorbar,
  isPlaying, activePreset, onTelemetryUpdate, stepsPerFrame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Physics buffers (Float64 for numerical precision) ──────────────────────
  const tempRef = useRef<Float64Array | null>(null);
  const tempNextRef = useRef<Float64Array | null>(null);
  const fixedRef = useRef<Uint8Array | null>(null);
  const materialIdRef = useRef<Uint8Array | null>(null); // index into MATERIAL_KEYS
  const simTimeRef = useRef<number>(0);

  // ── Render-state (for re-draw triggers without re-mounting solver) ─────────
  const [renderTick, setRenderTick] = useState(0);

  // ── Cross-section slice ────────────────────────────────────────────────────
  const [sliceAxis, setSliceAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [sliceIndex, setSliceIndex] = useState(Math.floor(gridSize / 2));
  const [isDraggingSlice, setIsDraggingSlice] = useState(false);

  // ── Material lookup array (ordered by index) ──────────────────────────────
  const MATERIAL_KEYS = ["iron", "copper", "aluminum", "glass", "wood", "air"];
  const getMat = (idx: number) => MATERIALS[MATERIAL_KEYS[idx] ?? "iron"];

  // ── Initialize / reload on preset or gridSize change ──────────────────────
  const initGrid = useCallback((preset: string, N: number) => {
    const { temp, fixed, materialId } = buildPreset(preset, N, ambientTemp);
    tempRef.current = temp;
    tempNextRef.current = new Float64Array(N * N);
    fixedRef.current = fixed;
    materialIdRef.current = materialId;
    simTimeRef.current = 0;
    setSliceIndex(Math.floor(N / 2));
    setRenderTick((t) => t + 1);
  }, [ambientTemp]);

  useEffect(() => {
    initGrid(activePreset, gridSize);
  }, [activePreset, gridSize]);

  // ── Canvas mouse interactions ──────────────────────────────────────────────
  const applyBrush = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const temp = tempRef.current;
    const fixed = fixedRef.current;
    const matId = materialIdRef.current;
    if (!canvas || !temp || !fixed || !matId) return;

    const rect = canvas.getBoundingClientRect();
    const N = gridSize;
    const cellX = Math.floor(((clientX - rect.left) / rect.width) * N);
    const cellY = Math.floor(((clientY - rect.top) / rect.height) * N);
    if (cellX < 0 || cellX >= N || cellY < 0 || cellY >= N) return;

    const radius = brushSize - 1;
    const matIdx = MATERIAL_KEYS.indexOf(selectedMaterial);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx2 = -radius; dx2 <= radius; dx2++) {
        if (dx2 * dx2 + dy * dy > radius * radius) continue;
        const nx = cellX + dx2, ny = cellY + dy;
        if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
        const idx = ny * N + nx;
        if (drawTool === "source") { temp[idx] = 100; fixed[idx] = 1; }
        else if (drawTool === "sink") { temp[idx] = 5; fixed[idx] = 2; }
        else if (drawTool === "material") { fixed[idx] = 0; matId[idx] = Math.max(0, matIdx); }
        else if (drawTool === "erase") { temp[idx] = ambientTemp; fixed[idx] = 0; matId[idx] = 0; }
      }
    }
    setRenderTick((t) => t + 1);
  }, [gridSize, brushSize, drawTool, selectedMaterial, ambientTemp]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const N = gridSize;
    const mx = ((e.clientX - rect.left) / rect.width) * N;
    const my = ((e.clientY - rect.top) / rect.height) * N;
    const nearH = sliceAxis === "horizontal" && Math.abs(my - sliceIndex) < 1.5;
    const nearV = sliceAxis === "vertical" && Math.abs(mx - sliceIndex) < 1.5;
    if (nearH || nearV) { setIsDraggingSlice(true); return; }
    applyBrush(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingSlice) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const val = sliceAxis === "horizontal"
        ? ((e.clientY - rect.top) / rect.height) * gridSize
        : ((e.clientX - rect.left) / rect.width) * gridSize;
      setSliceIndex(Math.max(0, Math.min(gridSize - 1, Math.floor(val))));
    } else if (e.buttons === 1) {
      applyBrush(e.clientX, e.clientY);
    }
  };
  const handleMouseUp = () => setIsDraggingSlice(false);

  // ── Physics Solver ─────────────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;

    const step = () => {
      const tOld = tempRef.current;
      const tNew = tempNextRef.current;
      const fixed = fixedRef.current;
      const matId = materialIdRef.current;
      if (!tOld || !tNew || !fixed || !matId) return;

      const N = gridSize;
      const h = convectionCoeff;    // [W/m²K]
      const T_inf = ambientTemp;     // [°C]

      if (solverMode === "steady") {
        // ── Gauss-Seidel relaxation (in-place on tOld) ─────────────────────
        const GS_ITERS = 60;
        for (let iter = 0; iter < GS_ITERS; iter++) {
          for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
              const idx = j * N + i;
              if (fixed[idx] > 0) continue;
              const mat = getMat(matId[idx]);
              const kC = mat.k;
              const kR = (kC + getMat(matId[idx + 1]).k) * 0.5;
              const kL = (kC + getMat(matId[idx - 1]).k) * 0.5;
              const kT = (kC + getMat(matId[idx - N]).k) * 0.5;
              const kB = (kC + getMat(matId[idx + N]).k) * 0.5;
              const denom = (kR + kL + kT + kB) / (dx * dx) + h / dx;
              const num =
                (kR * tOld[idx + 1] + kL * tOld[idx - 1] +
                 kT * tOld[idx - N] + kB * tOld[idx + N]) / (dx * dx) +
                h * T_inf / dx;
              tOld[idx] = num / denom;
            }
          }
          // Apply outer BCs during relaxation
          applyBoundaryConditions(tOld, N, boundaryType, T_inf, h, dx, dt);
        }
        // Copy for telemetry
        tNew.set(tOld);

      } else {
        // ── ADI Crank-Nicolson implicit transient solver ────────────────────
        // Alternating Direction Implicit (ADI) method:
        //   Half-step: implicit in x, explicit in y
        //   Half-step: implicit in y, explicit in x
        // Unconditionally stable, 2nd-order accurate in space and time.

        const halfDt = dt * 0.5;

        // === Half step 1: x-implicit, y-explicit ===========================
        // For each row j, solve tridiagonal system
        const a = new Float64Array(N);
        const b = new Float64Array(N);
        const c = new Float64Array(N);
        const d = new Float64Array(N);

        // Intermediate storage
        const tHalf = new Float64Array(N * N);
        tHalf.set(tOld);

        for (let j = 1; j < N - 1; j++) {
          for (let i = 0; i < N; i++) {
            const idx = j * N + i;
            if (fixed[idx] > 0) {
              a[i] = 0; b[i] = 1; c[i] = 0; d[i] = tOld[idx];
              continue;
            }
            if (i === 0 || i === N - 1) {
              a[i] = 0; b[i] = 1; c[i] = 0;
              d[i] = boundaryType === "fixed" ? T_inf : tOld[idx];
              continue;
            }
            const mat = getMat(matId[idx]);
            const alpha = mat.alpha; // [m²/s]
            const r = alpha * halfDt / (dx * dx);

            const rR = (alpha + getMat(matId[idx + 1]).alpha) * 0.5 * halfDt / (dx * dx);
            const rL = (alpha + getMat(matId[idx - 1]).alpha) * 0.5 * halfDt / (dx * dx);
            const rT = (alpha + getMat(matId[idx - N]).alpha) * 0.5 * halfDt / (dx * dx);
            const rB = (alpha + getMat(matId[idx + N]).alpha) * 0.5 * halfDt / (dx * dx);

            a[i] = -rL;
            b[i] = 1 + rL + rR;
            c[i] = -rR;
            // RHS: explicit y-direction
            d[i] = tOld[idx]
              + rT * (tOld[idx - N] - tOld[idx])
              + rB * (tOld[idx + N] - tOld[idx]);
          }
          tdma(a, b, c, d, N);
          for (let i = 0; i < N; i++) tHalf[j * N + i] = d[i];
        }
        applyBoundaryConditions(tHalf, N, boundaryType, T_inf, h, dx, halfDt);

        // === Half step 2: y-implicit, x-explicit ===========================
        for (let i = 1; i < N - 1; i++) {
          for (let j = 0; j < N; j++) {
            const idx = j * N + i;
            if (fixed[idx] > 0) {
              a[j] = 0; b[j] = 1; c[j] = 0; d[j] = tHalf[idx];
              continue;
            }
            if (j === 0 || j === N - 1) {
              a[j] = 0; b[j] = 1; c[j] = 0;
              d[j] = boundaryType === "fixed" ? T_inf : tHalf[idx];
              continue;
            }
            const mat = getMat(matId[idx]);
            const alpha = mat.alpha;

            const rR = (alpha + getMat(matId[idx + 1]).alpha) * 0.5 * halfDt / (dx * dx);
            const rL = (alpha + getMat(matId[idx - 1]).alpha) * 0.5 * halfDt / (dx * dx);
            const rT = (alpha + getMat(matId[idx - N]).alpha) * 0.5 * halfDt / (dx * dx);
            const rB = (alpha + getMat(matId[idx + N]).alpha) * 0.5 * halfDt / (dx * dx);

            a[j] = -rT;
            b[j] = 1 + rT + rB;
            c[j] = -rB;
            // RHS: explicit x-direction
            d[j] = tHalf[idx]
              + rL * (tHalf[idx - 1] - tHalf[idx])
              + rR * (tHalf[idx + 1] - tHalf[idx]);
          }
          tdma(a, b, c, d, N);
          for (let j = 0; j < N; j++) tNew[j * N + i] = d[j];
        }

        // Copy boundary columns
        for (let j = 0; j < N; j++) {
          tNew[j * N] = tHalf[j * N];
          tNew[j * N + N - 1] = tHalf[j * N + N - 1];
        }
        for (let i = 0; i < N; i++) {
          tNew[i] = tHalf[i];
          tNew[(N - 1) * N + i] = tHalf[(N - 1) * N + i];
        }
        applyBoundaryConditions(tNew, N, boundaryType, T_inf, h, dx, dt);

        // Advance time
        simTimeRef.current += dt;

        // Swap buffers
        tempRef.current = tNew;
        tempNextRef.current = tOld; // reuse old buffer next step
      }
    };

    // ── Telemetry computation ─────────────────────────────────────────────
    const computeTelemetry = () => {
      const tData = tempRef.current;
      const matId = materialIdRef.current;
      if (!tData || !matId) return;
      const N = gridSize;
      let sumT = 0, maxT = -Infinity, minT = Infinity;
      let thermalEnergy = 0, maxFlux = 0, residual = 0;
      const T_ref = ambientTemp + 273.15; // reference for energy

      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          const idx = j * N + i;
          const T = tData[idx];
          sumT += T;
          if (T > maxT) maxT = T;
          if (T < minT) minT = T;

          // Thermal energy above ambient reference: E = ρ·cₚ·(T-T_ref)·V
          const mat = getMat(matId[idx]);
          const cellVol = dx * dx * 0.01; // assuming 1cm thickness
          thermalEnergy += mat.rho * mat.cp * (T + 273.15 - T_ref) * cellVol;

          // Heat flux magnitude: q = k·|∇T|
          const gx = (tData[idx + 1] - tData[idx - 1]) / (2 * dx);
          const gy = (tData[idx + N] - tData[idx - N]) / (2 * dx);
          const flux = getMat(matId[idx]).k * Math.sqrt(gx * gx + gy * gy);
          if (flux > maxFlux) maxFlux = flux;
        }
      }

      // Compute residual (max change from last step) — approximate
      const tNext = tempNextRef.current;
      if (tNext && solverMode === "transient") {
        for (let k = 0; k < N * N; k++) {
          const diff = Math.abs(tData[k] - tNext[k]);
          if (diff > residual) residual = diff;
        }
      }

      // CFL stability limit for the fastest material (copper)
      const maxAlpha = MATERIALS["copper"].alpha; // 1.17e-4 m²/s
      const stableTimestepLimit = (dx * dx) / (4 * maxAlpha);
      const stabilityRatio = maxAlpha * dt / (dx * dx);

      onTelemetryUpdate({
        avgTemp: sumT / ((N - 2) * (N - 2)),
        maxTemp: maxT === -Infinity ? ambientTemp : maxT,
        minTemp: minT === Infinity ? ambientTemp : minT,
        thermalEnergy,
        maxFluxMag: maxFlux,
        stabilityRatio,
        simTime: simTimeRef.current,
        residual,
        solverIterations: solverMode === "steady" ? 60 : stepsPerFrame,
        stableTimestepLimit,
      });
    };

    const loop = () => {
      if (isPlaying) {
        for (let s = 0; s < Math.max(1, stepsPerFrame); s++) step();
        setRenderTick((t) => t + 1);
        computeTelemetry();
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gridSize, dx, dt, solverMode, boundaryType, convectionCoeff, ambientTemp, stepsPerFrame, onTelemetryUpdate]);

  // ── Canvas Rendering ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const tData = tempRef.current;
    const matId = materialIdRef.current;
    const fixed = fixedRef.current;
    if (!canvas || !tData || !matId || !fixed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const N = gridSize;
    const cellW = W / N, cellH = H / N;

    // Compute global temperature range for colormap normalization
    let tMin = Infinity, tMax = -Infinity;
    for (let k = 0; k < N * N; k++) {
      if (tData[k] < tMin) tMin = tData[k];
      if (tData[k] > tMax) tMax = tData[k];
    }
    // Ensure minimum range for colormap
    if (tMax - tMin < 1) { tMin = ambientTemp - 0.5; tMax = ambientTemp + 0.5; }

    // ── 1. Temperature field (rasterize to ImageData for performance) ──────
    const imgData = ctx.createImageData(W, H);
    const pix = imgData.data;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        const { r, g, b } = getColormapColor(tData[idx], tMin, tMax, colormap);

        // Material tint overlay
        let cr = r, cg = g, cb = b;
        const mIdx = matId[idx];
        if (mIdx === 1) { // copper: orange tint
          cr = Math.round(r * 0.72 + 249 * 0.28);
          cg = Math.round(g * 0.72 + 115 * 0.28);
          cb = Math.round(b * 0.72 + 22 * 0.28);
        } else if (mIdx === 4) { // wood: brown tint
          cr = Math.round(r * 0.72 + 146 * 0.28);
          cg = Math.round(g * 0.72 + 64 * 0.28);
          cb = Math.round(b * 0.72 + 14 * 0.28);
        } else if (mIdx === 3) { // glass: blue tint
          cr = Math.round(r * 0.72 + 56 * 0.28);
          cg = Math.round(g * 0.72 + 189 * 0.28);
          cb = Math.round(b * 0.72 + 248 * 0.28);
        } else if (mIdx === 5) { // air: darken
          cr = Math.round(r * 0.5);
          cg = Math.round(g * 0.5);
          cb = Math.round(b * 0.5);
        }

        // Fill pixel block
        const px0 = Math.round(i * cellW), px1 = Math.round((i + 1) * cellW);
        const py0 = Math.round(j * cellH), py1 = Math.round((j + 1) * cellH);
        for (let py = py0; py < py1; py++) {
          for (let px = px0; px < px1; px++) {
            const p = (py * W + px) * 4;
            pix[p] = cr; pix[p + 1] = cg; pix[p + 2] = cb; pix[p + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // ── 2. Grid lines ──────────────────────────────────────────────────────
    if (showGridLines) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= N; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(W, i * cellH); ctx.stroke();
      }
    }

    // ── 3. Isotherms (Marching Squares) ────────────────────────────────────
    if (showIsotherms) {
      const isoCount = 8;
      const isoStep = (tMax - tMin) / (isoCount + 1);
      ctx.lineWidth = 1;
      for (let k = 1; k <= isoCount; k++) {
        const isoT = tMin + k * isoStep;
        // Color the isotherm line according to its temperature
        const { r, g, b } = getColormapColor(isoT, tMin, tMax, colormap);
        ctx.strokeStyle = `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},0.55)`;

        for (let j = 0; j < N - 1; j++) {
          for (let i = 0; i < N - 1; i++) {
            const tTL = tData[j * N + i];
            const tTR = tData[j * N + i + 1];
            const tBL = tData[(j + 1) * N + i];
            const tBR = tData[(j + 1) * N + i + 1];

            const crossings: { x: number; y: number }[] = [];
            // Left edge
            if ((tTL >= isoT) !== (tBL >= isoT)) {
              const f = (isoT - tTL) / (tBL - tTL);
              crossings.push({ x: i * cellW, y: (j + f) * cellH });
            }
            // Right edge
            if ((tTR >= isoT) !== (tBR >= isoT)) {
              const f = (isoT - tTR) / (tBR - tTR);
              crossings.push({ x: (i + 1) * cellW, y: (j + f) * cellH });
            }
            // Top edge
            if ((tTL >= isoT) !== (tTR >= isoT)) {
              const f = (isoT - tTL) / (tTR - tTL);
              crossings.push({ x: (i + f) * cellW, y: j * cellH });
            }
            // Bottom edge
            if ((tBL >= isoT) !== (tBR >= isoT)) {
              const f = (isoT - tBL) / (tBR - tBL);
              crossings.push({ x: (i + f) * cellW, y: (j + 1) * cellH });
            }
            if (crossings.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(crossings[0].x, crossings[0].y);
              ctx.lineTo(crossings[1].x, crossings[1].y);
              ctx.stroke();
            }
          }
        }
      }
    }

    // ── 4. Heat Flux Vectors q = -k·∇T ────────────────────────────────────
    if (showFluxVectors && matId) {
      const stride = Math.max(2, Math.floor(N / 16));
      // First pass: compute max flux for normalization
      let maxFluxLocal = 0;
      for (let j = stride; j < N - stride; j += stride) {
        for (let i = stride; i < N - stride; i += stride) {
          const idx = j * N + i;
          const gx = (tData[idx + 1] - tData[idx - 1]) / (2 * dx);
          const gy = (tData[idx + N] - tData[idx - N]) / (2 * dx);
          const k = getMat(matId[idx]).k;
          const mag = k * Math.sqrt(gx * gx + gy * gy);
          if (mag > maxFluxLocal) maxFluxLocal = mag;
        }
      }
      if (maxFluxLocal < 1e-10) maxFluxLocal = 1;

      for (let j = stride; j < N - stride; j += stride) {
        for (let i = stride; i < N - stride; i += stride) {
          const idx = j * N + i;
          const gx = (tData[idx + 1] - tData[idx - 1]) / (2 * dx);
          const gy = (tData[idx + N] - tData[idx - N]) / (2 * dx);
          const k = getMat(matId[idx]).k;
          const qx = -k * gx, qy = -k * gy;
          const mag = Math.sqrt(qx * qx + qy * qy);
          if (mag < 0.01 * maxFluxLocal) continue;

          const cx2 = i * cellW + cellW / 2;
          const cy2 = j * cellH + cellH / 2;
          // Arrow length proportional to sqrt(mag) for visual clarity
          const normLen = Math.sqrt(mag / maxFluxLocal);
          const arrowLen = normLen * cellW * stride * 0.65;
          const angle = Math.atan2(qy, qx);
          const ex = cx2 + Math.cos(angle) * arrowLen;
          const ey = cy2 + Math.sin(angle) * arrowLen;

          // Color arrow by flux magnitude (hot=red, cool=cyan)
          const fluxNorm = mag / maxFluxLocal;
          const ar = Math.round(fluxNorm * 255);
          const ab = Math.round((1 - fluxNorm) * 200);
          ctx.strokeStyle = `rgba(${ar},80,${ab},0.8)`;
          ctx.fillStyle = `rgba(${ar},80,${ab},0.9)`;
          ctx.lineWidth = 1 + normLen;

          ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(ex, ey); ctx.stroke();
          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 5 * Math.cos(angle - Math.PI / 6), ey - 5 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(ex - 5 * Math.cos(angle + Math.PI / 6), ey - 5 * Math.sin(angle + Math.PI / 6));
          ctx.closePath(); ctx.fill();
        }
      }
    }

    // ── 5. Fixed BC indicator dots ─────────────────────────────────────────
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const fix = fixed[j * N + i];
        if (fix === 0) continue;
        ctx.fillStyle = fix === 1 ? "rgba(239,68,68,0.85)" : "rgba(56,189,248,0.85)";
        ctx.beginPath();
        ctx.arc(
          i * cellW + cellW / 2,
          j * cellH + cellH / 2,
          Math.max(2, cellW * 0.22), 0, 2 * Math.PI
        );
        ctx.fill();
      }
    }

    // ── 6. Colorbar ────────────────────────────────────────────────────────
    if (showColorbar) {
      const barX = W - 22, barY = 16, barW = 12, barH = H - 32;
      const barImg = ctx.createImageData(barW, barH);
      for (let py = 0; py < barH; py++) {
        const t = tMax - (py / barH) * (tMax - tMin);
        const { r, g, b } = getColormapColor(t, tMin, tMax, colormap);
        for (let px = 0; px < barW; px++) {
          const p = (py * barW + px) * 4;
          barImg.data[p] = r; barImg.data[p + 1] = g; barImg.data[p + 2] = b; barImg.data[p + 3] = 220;
        }
      }
      ctx.putImageData(barImg, barX, barY);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Tick labels
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "right";
      const tickCount = 5;
      for (let t = 0; t <= tickCount; t++) {
        const py2 = barY + (t / tickCount) * barH;
        const temp2 = tMax - (t / tickCount) * (tMax - tMin);
        ctx.fillText(`${temp2.toFixed(0)}°`, barX - 2, py2 + 3);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath(); ctx.moveTo(barX, py2); ctx.lineTo(barX - 4, py2); ctx.stroke();
      }
      ctx.textAlign = "left";
    }

    // ── 7. Slice line ──────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (sliceAxis === "horizontal") {
      const sy = sliceIndex * cellH + cellH / 2;
      ctx.moveTo(0, sy); ctx.lineTo(W, sy);
    } else {
      const sx = sliceIndex * cellW + cellW / 2;
      ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Slice handles
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
    if (sliceAxis === "horizontal") {
      const sy = sliceIndex * cellH + cellH / 2;
      [8, W - 8].forEach(px => { ctx.beginPath(); ctx.arc(px, sy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); });
    } else {
      const sx = sliceIndex * cellW + cellW / 2;
      [8, H - 8].forEach(py => { ctx.beginPath(); ctx.arc(sx, py, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); });
    }

  }, [renderTick, colormap, gridSize, showFluxVectors, showIsotherms, showGridLines, showColorbar, sliceAxis, sliceIndex, dx, ambientTemp]);

  // ── Cross-section profile ──────────────────────────────────────────────────
  const sliceProfile = useMemo(() => {
    const tData = tempRef.current;
    if (!tData) return [] as number[];
    const profile: number[] = [];
    for (let k = 0; k < gridSize; k++) {
      const idx = sliceAxis === "horizontal"
        ? sliceIndex * gridSize + k
        : k * gridSize + sliceIndex;
      profile.push(tData[idx]);
    }
    return profile;
  }, [renderTick, sliceIndex, sliceAxis, gridSize]);

  const tMin_slice = Math.min(...sliceProfile);
  const tMax_slice = Math.max(...sliceProfile);
  const range_slice = tMax_slice - tMin_slice;

  const chartPath = useMemo(() => {
    if (sliceProfile.length === 0) return "";
    const len = sliceProfile.length;
    const W = 100, H = 80, padX = 8, padY = 8;
    const scaleX = (W - 2 * padX) / (len - 1);
    const scaleY = range_slice > 0.1 ? (H - 2 * padY) / range_slice : 1;
    return sliceProfile.reduce((acc, val, i) => {
      const px = padX + i * scaleX;
      const py = H - padY - (val - tMin_slice) * scaleY;
      return acc + (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
    }, "");
  }, [sliceProfile, tMin_slice, range_slice]);

  return (
    <div className="h-full flex flex-col gap-4 p-5">
      {/* Main Simulation Canvas */}
      <div className="flex-1 bg-black rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center min-h-[280px]">
        {/* Slice toggle */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => { setSliceAxis(a => a === "horizontal" ? "vertical" : "horizontal"); setSliceIndex(Math.floor(gridSize / 2)); }}
            className="px-2.5 py-1 bg-black/80 backdrop-blur rounded-lg border border-white/10 text-[9px] font-bold uppercase tracking-wider hover:bg-white/5 transition-all text-white/50 hover:text-white"
          >
            ↕ Slice {sliceAxis === "horizontal" ? "→ Vertical" : "→ Horizontal"}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          width={520}
          height={520}
          className={cn(
            "max-w-full max-h-full aspect-square rounded-xl cursor-crosshair border border-white/5",
            isDraggingSlice && "cursor-ns-resize"
          )}
        />

        {/* Slice coordinate HUD */}
        <div className="absolute bottom-3 left-3 px-3 py-2 bg-black/80 backdrop-blur rounded-xl border border-white/5 pointer-events-none">
          <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">Slice</div>
          <div className="text-[10px] font-mono font-bold text-teal-400">
            {sliceAxis === "horizontal" ? "y" : "x"} = {(sliceIndex * dx).toFixed(3)} m
          </div>
        </div>
      </div>

      {/* 1D Temperature Profile Chart */}
      <div className="h-36 bg-[#141416] rounded-2xl border border-white/5 p-3 flex flex-col">
        <div className="flex justify-between items-center mb-1.5 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              1D Temperature Cross-Section
            </span>
          </div>
          <div className="text-[8px] font-mono text-white/25 uppercase">
            {tMin_slice.toFixed(1)}°C → {tMax_slice.toFixed(1)}°C | L = {(gridSize * dx).toFixed(2)} m
          </div>
        </div>

        <div className="flex-1 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 80" preserveAspectRatio="none">
            {/* Background grid */}
            {[20, 40, 60].map(y => (
              <line key={y} x1="8" y1={y} x2="92" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            ))}
            {/* Profile */}
            {chartPath && (
              <path
                d={chartPath}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Gradient fill under curve */}
            {chartPath && (
              <>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={chartPath + ` L 92 72 L 8 72 Z`}
                  fill="url(#chartFill)"
                />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Helper: apply outer boundary conditions ──────────────────────────────────
function applyBoundaryConditions(
  T: Float64Array, N: number,
  type: BoundaryType, T_inf: number,
  h: number, dx: number, dt: number
) {
  if (type === "fixed") {
    for (let k = 0; k < N; k++) {
      T[k] = T_inf;                  // top
      T[(N - 1) * N + k] = T_inf;   // bottom
      T[k * N] = T_inf;             // left
      T[k * N + N - 1] = T_inf;    // right
    }
  } else if (type === "insulated") {
    // Neumann zero-flux: ghost cell = first interior cell
    for (let k = 0; k < N; k++) {
      T[k] = T[N + k];                                         // top
      T[(N - 1) * N + k] = T[(N - 2) * N + k];               // bottom
      T[k * N] = T[k * N + 1];                                 // left
      T[k * N + N - 1] = T[k * N + N - 2];                   // right
    }
  } else {
    // Robin convective: ∂T/∂n = h/k·(T_inf - T) → finite difference
    // T_ghost = T_interior + (h·dx/k)·(T_inf - T_surface)
    const hFactor = h * dx;
    for (let k = 1; k < N - 1; k++) {
      // Top row
      const iT = N + k;
      T[k] = T[iT] - hFactor * (T[k] - T_inf);
      // Bottom row
      const iB = (N - 2) * N + k;
      T[(N - 1) * N + k] = T[iB] - hFactor * (T[(N - 1) * N + k] - T_inf);
      // Left col
      const iL = k * N + 1;
      T[k * N] = T[iL] - hFactor * (T[k * N] - T_inf);
      // Right col
      const iR = k * N + N - 2;
      T[k * N + N - 1] = T[iR] - hFactor * (T[k * N + N - 1] - T_inf);
    }
  }
}

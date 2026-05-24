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
  silicon: {
    id: "silicon", name: "Silicon (CPU Die)",
    k: 148, rho: 2330, cp: 700,
    color: "bg-indigo-600", canvasColor: "rgb(79,70,229)",
    get alpha() { return this.k / (this.rho * this.cp); } // 9.08e-5
  }
};

export const MATERIAL_KEYS = ["iron", "copper", "aluminum", "glass", "wood", "air", "silicon"];

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
  residual: number;            // Solver equation residual (norm of linear system residual)
  solverIterations: number;    // GS iterations this frame
  stableTimestepLimit: number; // [s] CFL-based Δt_max
  energyInflow: number;        // [W] total heat power entering grid
  energyOutflow: number;       // [W] total heat power leaving grid
  conservationError: number;   // [W] net energy conservation mismatch rate
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
  const temp = new Float64Array(N * N).fill(ambientTemp);
  const fixed = new Uint8Array(N * N); // 0=free, 1=hot, 2=cold
  
  // Set default material based on preset
  let defaultMat = 0; // default: iron
  if (presetName === "CPU Heatsink" || presetName === "Fins Array") {
    defaultMat = 5; // default: air
  } else if (presetName === "Thermal Bridge") {
    defaultMat = 4; // default: wood
  } else if (presetName === "Insulated Box") {
    defaultMat = 2; // default: aluminum (high conductivity outside box)
  }
  const materialId = new Uint8Array(N * N).fill(defaultMat);

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
    // Silicon CPU die (heat source, silicon index 6)
    setRect(cx - dieW, cx + dieW, cy - 2, cy + 2, 95, 1, 6);
    // Copper fins
    for (let f = 0; f < numFins; f++) {
      const fi = cx - dieW - 4 + f * finSpacing;
      setRect(fi, fi + 1, cy - finH, cy + finH, null, 0, 1);
    }

  } else if (presetName === "Thermal Bridge") {
    const cy = Math.floor(N / 2);
    const bridgeW = Math.max(2, Math.floor(N * 0.08));
    // Fill with wood insulator (defaultMat is already wood)
    // Hot left wall
    for (let j = 1; j < N - 1; j++) { temp[j * N] = 100; fixed[j * N] = 1; }
    // Cold right wall
    for (let j = 1; j < N - 1; j++) { temp[j * N + (N - 1)] = 5; fixed[j * N + (N - 1)] = 2; }
    // Copper bridge through center
    setRect(0, N - 1, cy - bridgeW, cy + bridgeW, null, 0, 1);

  } else if (presetName === "Corner Heating") {
    const r = Math.floor(N * 0.18);
    // Hot TL corner, copper
    setDisc(0, 0, r, 100, 1, 1);
    // Cold BR corner, aluminum
    setDisc(N - 1, N - 1, r, 5, 2, 2);
    
    // Add asymmetric wood barriers (forces asymmetric flux channelling)
    setRect(Math.floor(N * 0.4), Math.floor(N * 0.75), Math.floor(N * 0.15), Math.floor(N * 0.35), null, 0, 4); // wood obstacle SW-ish
    setDisc(Math.floor(N * 0.3), Math.floor(N * 0.75), Math.floor(r * 0.7), null, 0, 4); // insulator SW
    setDisc(Math.floor(N * 0.75), Math.floor(N * 0.3), Math.floor(r * 0.7), null, 0, 5); // air pocket NE

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

  // Preallocated workspace to avoid GC overhead in real-time solvers
  const aRef = useRef<Float64Array | null>(null);
  const bRef = useRef<Float64Array | null>(null);
  const cRef = useRef<Float64Array | null>(null);
  const dRef = useRef<Float64Array | null>(null);
  const tHalfRef = useRef<Float64Array | null>(null);

  // ── Render-state (for re-draw triggers without re-mounting solver) ─────────
  const [renderTick, setRenderTick] = useState(0);

  // ── Cross-section slice ────────────────────────────────────────────────────
  const [sliceAxis, setSliceAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [sliceIndex, setSliceIndex] = useState(Math.floor(gridSize / 2));
  const [isDraggingSlice, setIsDraggingSlice] = useState(false);

  // ── Material lookup array (ordered by index) ──────────────────────────────
  const getMat = (idx: number) => MATERIALS[MATERIAL_KEYS[idx] ?? "iron"];

  // ── Initialize / reload on preset or gridSize change ──────────────────────
  const initGrid = useCallback((preset: string, N: number) => {
    const { temp, fixed, materialId } = buildPreset(preset, N, ambientTemp);
    tempRef.current = temp;
    tempNextRef.current = new Float64Array(N * N);
    fixedRef.current = fixed;
    materialIdRef.current = materialId;
    simTimeRef.current = 0;

    aRef.current = new Float64Array(N);
    bRef.current = new Float64Array(N);
    cRef.current = new Float64Array(N);
    dRef.current = new Float64Array(N);
    tHalfRef.current = new Float64Array(N * N);
    tHalfRef.current.set(temp);

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
    const GS_ITERS = 60;

    const step = () => {
      const tOld = tempRef.current;
      const tNew = tempNextRef.current;
      const fixed = fixedRef.current;
      const matId = materialIdRef.current;
      if (!tOld || !tNew || !fixed || !matId) return;

      const N = gridSize;
      const h = convectionCoeff;    // [W/m²K]
      const T_inf = ambientTemp;     // [°C]

      // Helper to check if a cell is fixed (sources or air background)
      const isFixed = (k: number) => fixed[k] > 0 || matId[k] === 5;

      // Force air cells to ambient temperature
      for (let k = 0; k < N * N; k++) {
        if (matId[k] === 5) {
          tOld[k] = T_inf;
          tNew[k] = T_inf;
        }
      }

      if (solverMode === "steady") {
        // ── Conservative Gauss-Seidel relaxation (in-place on tOld) ─────────
        const dy = dx; // isotropic grid
        
        for (let iter = 0; iter < GS_ITERS; iter++) {
          for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
              const idx = j * N + i;
              if (isFixed(idx)) continue;

              const mat = getMat(matId[idx]);
              const k_idx = mat.k;
              let num = 0;
              let denom = 0;

              // Left neighbor
              if (i === 0) {
                if (boundaryType === "fixed") {
                  num += 2 * k_idx * T_inf; denom += 2 * k_idx;
                } else if (boundaryType === "convective") {
                  num += (h * dx) * T_inf; denom += h * dx;
                }
              } else {
                const idxL = idx - 1;
                const k_nbr = getMat(matId[idxL]).k;
                let k_interface = 0;
                let T_val = 0;
                if (matId[idxL] === 5) { // Air neighbor
                  k_interface = h * dx; T_val = T_inf;
                } else {
                  k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
                  T_val = tOld[idxL];
                }
                num += k_interface * T_val; denom += k_interface;
              }

              // Right neighbor
              if (i === N - 1) {
                if (boundaryType === "fixed") {
                  num += 2 * k_idx * T_inf; denom += 2 * k_idx;
                } else if (boundaryType === "convective") {
                  num += (h * dx) * T_inf; denom += h * dx;
                }
              } else {
                const idxR = idx + 1;
                const k_nbr = getMat(matId[idxR]).k;
                let k_interface = 0;
                let T_val = 0;
                if (matId[idxR] === 5) {
                  k_interface = h * dx; T_val = T_inf;
                } else {
                  k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
                  T_val = tOld[idxR];
                }
                num += k_interface * T_val; denom += k_interface;
              }

              // Top neighbor
              if (j === 0) {
                if (boundaryType === "fixed") {
                  num += 2 * k_idx * T_inf; denom += 2 * k_idx;
                } else if (boundaryType === "convective") {
                  num += (h * dy) * T_inf; denom += h * dy;
                }
              } else {
                const idxT = idx - N;
                const k_nbr = getMat(matId[idxT]).k;
                let k_interface = 0;
                let T_val = 0;
                if (matId[idxT] === 5) {
                  k_interface = h * dy; T_val = T_inf;
                } else {
                  k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
                  T_val = tOld[idxT];
                }
                num += k_interface * T_val; denom += k_interface;
              }

              // Bottom neighbor
              if (j === N - 1) {
                if (boundaryType === "fixed") {
                  num += 2 * k_idx * T_inf; denom += 2 * k_idx;
                } else if (boundaryType === "convective") {
                  num += (h * dy) * T_inf; denom += h * dy;
                }
              } else {
                const idxB = idx + N;
                const k_nbr = getMat(matId[idxB]).k;
                let k_interface = 0;
                let T_val = 0;
                if (matId[idxB] === 5) {
                  k_interface = h * dy; T_val = T_inf;
                } else {
                  k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
                  T_val = tOld[idxB];
                }
                num += k_interface * T_val; denom += k_interface;
              }

              tOld[idx] = denom > 0 ? num / denom : T_inf;
            }
          }
        }
        tNew.set(tOld);

      } else {
        // ── Conservative ADI Crank-Nicolson implicit solver ─────────────────
        const halfDt = dt * 0.5;
        const dy = dx;
        
        const a = aRef.current;
        const b = bRef.current;
        const c = cRef.current;
        const d = dRef.current;
        const tHalf = tHalfRef.current;
        if (!a || !b || !c || !d || !tHalf) return;

        tHalf.set(tOld);

        const getNeighborCoeff = (
          idx: number, idxNbr: number,
          halfDt: number, dist: number, C_idx: number, k_idx: number
        ) => {
          if (matId[idxNbr] === 5) { // Air convective cooling
            const rConv = h * halfDt / (C_idx * dist);
            return { r: rConv, isFixed: true, T: T_inf };
          }
          const fixNbr = fixed[idxNbr];
          const k_nbr = getMat(matId[idxNbr]).k;
          const k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
          const rCond = k_interface * halfDt / (C_idx * dist * dist);
          if (fixNbr > 0) {
            return { r: rCond, isFixed: true, T: tOld[idxNbr] };
          }
          return { r: rCond, isFixed: false, T: 0 };
        };

        const getNeighborCoeffHalf = (
          idx: number, idxNbr: number,
          halfDt: number, dist: number, C_idx: number, k_idx: number
        ) => {
          if (matId[idxNbr] === 5) {
            const rConv = h * halfDt / (C_idx * dist);
            return { r: rConv, isFixed: true, T: T_inf };
          }
          const fixNbr = fixed[idxNbr];
          const k_nbr = getMat(matId[idxNbr]).k;
          const k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
          const rCond = k_interface * halfDt / (C_idx * dist * dist);
          if (fixNbr > 0) {
            return { r: rCond, isFixed: true, T: tHalf[idxNbr] };
          }
          return { r: rCond, isFixed: false, T: 0 };
        };

        // === Half step 1: x-implicit, y-explicit ===========================
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            const idx = j * N + i;
            if (isFixed(idx)) {
              a[i] = 0; b[i] = 1; c[i] = 0; d[i] = tOld[idx];
              continue;
            }

            const mat = getMat(matId[idx]);
            const C_idx = mat.rho * mat.cp;
            const k_idx = mat.k;
            const T_current = tOld[idx];

            let rhsY = 0;
            let rL = 0;
            let rR = 0;
            let lhsExtra = 0;
            let rhsExtra = 0;

            // --- Y direction (explicit) ---
            // Top neighbor
            if (j === 0) {
              if (boundaryType === "fixed") {
                const r = (2 * k_idx) * halfDt / (C_idx * dy * dy);
                rhsY += r * (T_inf - T_current);
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dy);
                rhsY += r * (T_inf - T_current);
              }
            } else {
              const res = getNeighborCoeff(idx, idx - N, halfDt, dy, C_idx, k_idx);
              if (res.isFixed) {
                rhsY += res.r * (res.T - T_current);
              } else {
                rhsY += res.r * (tOld[idx - N] - T_current);
              }
            }
            // Bottom neighbor
            if (j === N - 1) {
              if (boundaryType === "fixed") {
                const r = (2 * k_idx) * halfDt / (C_idx * dy * dy);
                rhsY += r * (T_inf - T_current);
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dy);
                rhsY += r * (T_inf - T_current);
              }
            } else {
              const res = getNeighborCoeff(idx, idx + N, halfDt, dy, C_idx, k_idx);
              if (res.isFixed) {
                rhsY += res.r * (res.T - T_current);
              } else {
                rhsY += res.r * (tOld[idx + N] - T_current);
              }
            }

            // --- X direction (implicit) ---
            // Left neighbor
            if (i === 0) {
              if (boundaryType === "fixed") {
                rL = (2 * k_idx) * halfDt / (C_idx * dx * dx);
                rhsExtra += rL * T_inf;
                lhsExtra += rL;
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dx);
                rhsExtra += r * T_inf;
                lhsExtra += r;
              }
            } else {
              const res = getNeighborCoeff(idx, idx - 1, halfDt, dx, C_idx, k_idx);
              if (res.isFixed) {
                rhsExtra += res.r * res.T;
              } else {
                rL = res.r;
              }
            }
            // Right neighbor
            if (i === N - 1) {
              if (boundaryType === "fixed") {
                rR = (2 * k_idx) * halfDt / (C_idx * dx * dx);
                rhsExtra += rR * T_inf;
                lhsExtra += rR;
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dx);
                rhsExtra += r * T_inf;
                lhsExtra += r;
              }
            } else {
              const res = getNeighborCoeff(idx, idx + 1, halfDt, dx, C_idx, k_idx);
              if (res.isFixed) {
                rhsExtra += res.r * res.T;
              } else {
                rR = res.r;
              }
            }

            a[i] = -rL;
            b[i] = 1 + rL + rR + lhsExtra;
            c[i] = -rR;
            d[i] = T_current + rhsY + rhsExtra;
          }
          tdma(a, b, c, d, N);
          for (let i = 0; i < N; i++) tHalf[j * N + i] = d[i];
        }

        // === Half step 2: y-implicit, x-explicit ===========================
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            const idx = j * N + i;
            if (isFixed(idx)) {
              a[j] = 0; b[j] = 1; c[j] = 0; d[j] = tHalf[idx];
              continue;
            }

            const mat = getMat(matId[idx]);
            const C_idx = mat.rho * mat.cp;
            const k_idx = mat.k;
            const T_current = tHalf[idx];

            let rhsX = 0;
            let rT = 0;
            let rB = 0;
            let lhsExtra = 0;
            let rhsExtra = 0;

            // --- X direction (explicit) ---
            // Left neighbor
            if (i === 0) {
              if (boundaryType === "fixed") {
                const r = (2 * k_idx) * halfDt / (C_idx * dx * dx);
                rhsX += r * (T_inf - T_current);
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dx);
                rhsX += r * (T_inf - T_current);
              }
            } else {
              const res = getNeighborCoeffHalf(idx, idx - 1, halfDt, dx, C_idx, k_idx);
              if (res.isFixed) {
                rhsX += res.r * (res.T - T_current);
              } else {
                rhsX += res.r * (tHalf[idx - 1] - T_current);
              }
            }
            // Right neighbor
            if (i === N - 1) {
              if (boundaryType === "fixed") {
                const r = (2 * k_idx) * halfDt / (C_idx * dx * dx);
                rhsX += r * (T_inf - T_current);
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dx);
                rhsX += r * (T_inf - T_current);
              }
            } else {
              const res = getNeighborCoeffHalf(idx, idx + 1, halfDt, dx, C_idx, k_idx);
              if (res.isFixed) {
                rhsX += res.r * (res.T - T_current);
              } else {
                rhsX += res.r * (tHalf[idx + 1] - T_current);
              }
            }

            // --- Y direction (implicit) ---
            // Top neighbor
            if (j === 0) {
              if (boundaryType === "fixed") {
                rT = (2 * k_idx) * halfDt / (C_idx * dy * dy);
                rhsExtra += rT * T_inf;
                lhsExtra += rT;
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dy);
                rhsExtra += r * T_inf;
                lhsExtra += r;
              }
            } else {
              const res = getNeighborCoeffHalf(idx, idx - N, halfDt, dy, C_idx, k_idx);
              if (res.isFixed) {
                rhsExtra += res.r * res.T;
              } else {
                rT = res.r;
              }
            }
            // Bottom neighbor
            if (j === N - 1) {
              if (boundaryType === "fixed") {
                rB = (2 * k_idx) * halfDt / (C_idx * dy * dy);
                rhsExtra += rB * T_inf;
                lhsExtra += rB;
              } else if (boundaryType === "convective") {
                const r = h * halfDt / (C_idx * dy);
                rhsExtra += r * T_inf;
                lhsExtra += r;
              }
            } else {
              const res = getNeighborCoeffHalf(idx, idx + N, halfDt, dy, C_idx, k_idx);
              if (res.isFixed) {
                rhsExtra += res.r * res.T;
              } else {
                rB = res.r;
              }
            }

            a[j] = -rT;
            b[j] = 1 + rT + rB + lhsExtra;
            c[j] = -rB;
            d[j] = T_current + rhsX + rhsExtra;
          }
          tdma(a, b, c, d, N);
          for (let j = 0; j < N; j++) tNew[j * N + i] = d[j];
        }

        // Advance time
        simTimeRef.current += dt;

        // Swap buffers
        tempRef.current = tNew;
        tempNextRef.current = tOld;
      }
    };

    // ── Telemetry computation ─────────────────────────────────────────────
    const computeTelemetry = () => {
      const tData = tempRef.current;
      const tOld = tempNextRef.current;
      const matId = materialIdRef.current;
      const fixed = fixedRef.current;
      if (!tData || !matId || !fixed || !tOld) return;
      const N = gridSize;
      const h = convectionCoeff;
      const T_inf = ambientTemp;

      const isFixed = (k: number) => fixed[k] > 0 || matId[k] === 5;

      let sumT = 0, maxT = -Infinity, minT = Infinity;
      let thermalEnergy = 0, maxFlux = 0;
      let energyInflow = 0, energyOutflow = 0;

      // Volumetric thermal energy and temperature bounds
      let freeCount = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const idx = j * N + i;
          const T = tData[idx];
          if (!isFixed(idx)) {
            sumT += T;
            freeCount++;
          }
          if (T > maxT) maxT = T;
          if (T < minT) minT = T;

          const mat = getMat(matId[idx]);
          const C_idx = mat.rho * mat.cp;
          // Volumetric heat energy above ambient reference
          // V = dx * dy * 1.0 (assuming 1.0 m thickness)
          thermalEnergy += C_idx * (T - T_inf) * dx * dx;

          // Heat flux magnitude: q = k·|∇T|
          let gx = 0;
          let gy = 0;
          if (i > 0 && i < N - 1) gx = (tData[idx + 1] - tData[idx - 1]) / (2 * dx);
          else if (i === 0) gx = (tData[idx + 1] - T) / dx;
          else gx = (T - tData[idx - 1]) / dx;

          if (j > 0 && j < N - 1) gy = (tData[idx + N] - tData[idx - N]) / (2 * dx);
          else if (j === 0) gy = (tData[idx + N] - T) / dx;
          else gy = (T - tData[idx - N]) / dx;

          const flux = mat.k * Math.sqrt(gx * gx + gy * gy);
          if (flux > maxFlux) maxFlux = flux;

          // Energy Inflow and Outflow
          if (isFixed(idx)) {
            const neighbors = [
              { r: idx - 1, cond: i > 0 },
              { r: idx + 1, cond: i < N - 1 },
              { r: idx - N, cond: j > 0 },
              { r: idx + N, cond: j < N - 1 },
            ];
            for (const nbr of neighbors) {
              if (nbr.cond && !isFixed(nbr.r)) {
                const k_nbr = getMat(matId[nbr.r]).k;
                let q = 0;
                if (matId[idx] === 5) {
                  q = h * (T_inf - tData[nbr.r]);
                } else {
                  const k_interface = 2 * mat.k * k_nbr / (mat.k + k_nbr);
                  q = k_interface * (T - tData[nbr.r]) / dx;
                }
                const P = q * dx; // Area = dx * 1.0
                if (P > 0) energyInflow += P;
                else energyOutflow += Math.abs(P);
              }
            }
          } else {
            const boundaries = [
              { cond: i === 0 },
              { cond: i === N - 1 },
              { cond: j === 0 },
              { cond: j === N - 1 },
            ];
            for (const b of boundaries) {
              if (b.cond) {
                let P = 0;
                if (boundaryType === "fixed") {
                  const q = 2 * mat.k * (T_inf - T) / dx;
                  P = q * dx;
                } else if (boundaryType === "convective") {
                  const q = h * (T_inf - T);
                  P = q * dx;
                }
                if (P > 0) energyInflow += P;
                else energyOutflow += Math.abs(P);
              }
            }
          }
        }
      }

      // Compute PDE equation residual norm L2 over free cells
      let sumResSq = 0;
      let resCount = 0;

      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const idx = j * N + i;
          if (isFixed(idx)) continue;

          const mat = getMat(matId[idx]);
          const C_idx = mat.rho * mat.cp;
          const k_idx = mat.k;

          const getFluxNbr = (idxNbr: number, dist: number) => {
            if (matId[idxNbr] === 5) {
              return h * (T_inf - (tData[idx] + tOld[idx]) * 0.5);
            }
            const k_nbr = getMat(matId[idxNbr]).k;
            const k_interface = 2 * k_idx * k_nbr / (k_idx + k_nbr);
            const T_idx_avg = (tData[idx] + tOld[idx]) * 0.5;
            const T_nbr_avg = isFixed(idxNbr) ? tOld[idxNbr] : (tData[idxNbr] + tOld[idxNbr]) * 0.5;
            return k_interface * (T_nbr_avg - T_idx_avg) / dist;
          };

          // Net spatial flux rate (W/m³)
          let fluxX = 0;
          if (i === 0) {
            const fluxR = getFluxNbr(idx + 1, dx);
            let fluxL = 0;
            if (boundaryType === "fixed") fluxL = 2 * k_idx * (T_inf - (tData[idx] + tOld[idx]) * 0.5) / dx;
            else if (boundaryType === "convective") fluxL = h * (T_inf - (tData[idx] + tOld[idx]) * 0.5);
            fluxX = (fluxR + fluxL) / dx;
          } else if (i === N - 1) {
            const fluxL = getFluxNbr(idx - 1, dx);
            let fluxR = 0;
            if (boundaryType === "fixed") fluxR = 2 * k_idx * (T_inf - (tData[idx] + tOld[idx]) * 0.5) / dx;
            else if (boundaryType === "convective") fluxR = h * (T_inf - (tData[idx] + tOld[idx]) * 0.5);
            fluxX = (fluxR + fluxL) / dx;
          } else {
            fluxX = (getFluxNbr(idx + 1, dx) + getFluxNbr(idx - 1, dx)) / dx;
          }

          let fluxY = 0;
          if (j === 0) {
            const fluxB = getFluxNbr(idx + N, dx);
            let fluxT = 0;
            if (boundaryType === "fixed") fluxT = 2 * k_idx * (T_inf - (tData[idx] + tOld[idx]) * 0.5) / dx;
            else if (boundaryType === "convective") fluxT = h * (T_inf - (tData[idx] + tOld[idx]) * 0.5);
            fluxY = (fluxB + fluxT) / dx;
          } else if (j === N - 1) {
            const fluxT = getFluxNbr(idx - N, dx);
            let fluxB = 0;
            if (boundaryType === "fixed") fluxB = 2 * k_idx * (T_inf - (tData[idx] + tOld[idx]) * 0.5) / dx;
            else if (boundaryType === "convective") fluxB = h * (T_inf - (tData[idx] + tOld[idx]) * 0.5);
            fluxY = (fluxB + fluxT) / dx;
          } else {
            fluxY = (getFluxNbr(idx + N, dx) + getFluxNbr(idx - N, dx)) / dx;
          }

          // residual R = C * (dT/dt) - (q_net)
          const dTdt = (tData[idx] - tOld[idx]) / dt;
          const R = solverMode === "steady" 
            ? (fluxX + fluxY) // in steady state, flux sum should be zero
            : C_idx * dTdt - (fluxX + fluxY);

          sumResSq += R * R;
          resCount++;
        }
      }
      const residualNorm = resCount > 0 ? Math.sqrt(sumResSq / resCount) : 0;

      // Energy conservation mismatch error: (E_new - E_old)/dt - (P_in - P_out)
      let E_old = 0;
      for (let k = 0; k < N * N; k++) {
        const mat = getMat(matId[k]);
        E_old += mat.rho * mat.cp * (tOld[k] - T_inf) * dx * dx;
      }
      const conservationError = (thermalEnergy - E_old) / dt - (energyInflow - energyOutflow);

      const maxAlpha = MATERIALS["copper"].alpha;
      const stableTimestepLimit = (dx * dx) / (4 * maxAlpha);
      const stabilityRatio = maxAlpha * dt / (dx * dx);

      onTelemetryUpdate({
        avgTemp: freeCount > 0 ? sumT / freeCount : ambientTemp,
        maxTemp: maxT === -Infinity ? ambientTemp : maxT,
        minTemp: minT === Infinity ? ambientTemp : minT,
        thermalEnergy,
        maxFluxMag: maxFlux,
        stabilityRatio,
        simTime: simTimeRef.current,
        residual: residualNorm,
        solverIterations: solverMode === "steady" ? GS_ITERS : stepsPerFrame,
        stableTimestepLimit,
        energyInflow,
        energyOutflow,
        conservationError,
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

  const sliceGradients = useMemo(() => {
    const len = sliceProfile.length;
    const grads = new Float64Array(len);
    if (len < 2) return grads;
    for (let k = 0; k < len; k++) {
      if (k === 0) {
        grads[k] = (sliceProfile[1] - sliceProfile[0]) / dx;
      } else if (k === len - 1) {
        grads[k] = (sliceProfile[len - 1] - sliceProfile[len - 2]) / dx;
      } else {
        grads[k] = (sliceProfile[k + 1] - sliceProfile[k - 1]) / (2 * dx);
      }
    }
    return grads;
  }, [sliceProfile, dx]);

  const maxGrad_slice = useMemo(() => {
    if (sliceGradients.length === 0) return 0;
    let m = 0;
    for (let k = 0; k < sliceGradients.length; k++) {
      const a = Math.abs(sliceGradients[k]);
      if (a > m) m = a;
    }
    return m;
  }, [sliceGradients]);

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

  const gradPath = useMemo(() => {
    if (sliceProfile.length === 0) return "";
    const len = sliceProfile.length;
    const W = 100, H = 80, padX = 8, padY = 8;
    const scaleX = (W - 2 * padX) / (len - 1);
    const scaleY = maxGrad_slice > 0.1 ? (H - 2 * padY) / maxGrad_slice : 1;
    return Array.from(sliceGradients).reduce((acc, val, i) => {
      const px = padX + i * scaleX;
      const py = H - padY - Math.abs(val) * scaleY;
      return acc + (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
    }, "");
  }, [sliceGradients, maxGrad_slice]);

  const sliceExtrema = useMemo(() => {
    const len = sliceProfile.length;
    if (len < 2) return [];
    let minIdx = 0, maxIdx = 0;
    for (let k = 1; k < len; k++) {
      if (sliceProfile[k] < sliceProfile[minIdx]) minIdx = k;
      if (sliceProfile[k] > sliceProfile[maxIdx]) maxIdx = k;
    }
    const pts: { idx: number; type: "max" | "min"; val: number }[] = [
      { idx: maxIdx, type: "max", val: sliceProfile[maxIdx] }
    ];
    if (minIdx !== maxIdx) {
      pts.push({ idx: minIdx, type: "min", val: sliceProfile[minIdx] });
    }
    return pts;
  }, [sliceProfile]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const pad = 0.08;
    if (pct < pad || pct > 1 - pad) {
      setHoverIndex(null);
      return;
    }
    const innerPct = (pct - pad) / (1 - 2 * pad);
    const idx = Math.round(innerPct * (gridSize - 1));
    setHoverIndex(Math.max(0, Math.min(gridSize - 1, idx)));
  };

  const handleSvgMouseLeave = () => setHoverIndex(null);

  // Helper to format units
  const L = gridSize * dx;

  // Retrieve hover details
  const hoverDetails = useMemo(() => {
    if (hoverIndex === null || !materialIdRef.current || !tempRef.current) return null;
    const cellIdx = sliceAxis === "horizontal"
      ? sliceIndex * gridSize + hoverIndex
      : hoverIndex * gridSize + sliceIndex;
    const temp = tempRef.current[cellIdx];
    const gradVal = sliceGradients[hoverIndex];
    const matIdx = materialIdRef.current[cellIdx];
    const mat = getMat(matIdx);
    const flux = mat.k * Math.abs(gradVal);
    const pos = hoverIndex * dx;
    return { temp, grad: gradVal, flux, matName: mat.name, pos };
  }, [hoverIndex, sliceIndex, sliceAxis, gridSize, dx, sliceGradients]);

  return (
    <div className="h-full flex flex-col gap-4 p-5">
      {/* Main Simulation Canvas with CAD-style Rulers */}
      <div className="flex-1 bg-black rounded-2xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-6 min-h-[300px]">
        {/* Slice axis selection */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={() => { setSliceAxis(a => a === "horizontal" ? "vertical" : "horizontal"); setSliceIndex(Math.floor(gridSize / 2)); }}
            className="px-2.5 py-1 bg-black/80 backdrop-blur rounded-lg border border-white/10 text-[9px] font-bold uppercase tracking-wider hover:bg-white/5 transition-all text-white/50 hover:text-white"
          >
            ↕ Slice {sliceAxis === "horizontal" ? "→ Vertical" : "→ Horizontal"}
          </button>
        </div>

        {/* Ruler Layout */}
        <div className="flex flex-col items-center select-none w-full max-w-[530px] mx-auto">
          {/* Top ruler */}
          <div className="flex w-full">
            <div className="w-[30px] shrink-0" />
            <div className="flex-1 h-[18px] relative border-b border-white/10">
              <svg className="w-full h-full text-white/30 text-[8px] font-mono">
                <line x1="0%" y1="100%" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" />
                <line x1="0%" y1="50%" x2="0%" y2="100%" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50%" y1="50%" x2="50%" y2="100%" stroke="currentColor" strokeWidth="0.5" />
                <line x1="100%" y1="50%" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" />
                <text x="2%" y="60%" fill="currentColor">0.00m</text>
                <text x="47%" y="60%" fill="currentColor">{(L * 0.5).toFixed(2)}m</text>
                <text x="90%" y="60%" fill="currentColor">{L.toFixed(2)}m</text>
              </svg>
            </div>
          </div>

          <div className="flex w-full items-stretch">
            {/* Left ruler */}
            <div className="w-[30px] relative border-r border-white/10 shrink-0">
              <svg className="w-full h-full text-white/30 text-[8px] font-mono">
                <line x1="100%" y1="0%" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50%" y1="0%" x2="100%" y2="0%" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50%" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50%" y1="100%" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" />
                <text x="0%" y="8%" fill="currentColor">0.00m</text>
                <text x="0%" y="52%" fill="currentColor">{(L * 0.5).toFixed(2)}m</text>
                <text x="0%" y="96%" fill="currentColor">{L.toFixed(2)}m</text>
              </svg>
            </div>

            {/* Canvas wrapper */}
            <div className="flex-1 aspect-square bg-[#09090b] rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                width={520}
                height={520}
                className={cn(
                  "max-w-full max-h-full aspect-square rounded-xl cursor-crosshair",
                  isDraggingSlice && "cursor-ns-resize"
                )}
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        </div>

        {/* Slice coordinate HUD */}
        <div className="absolute bottom-3 left-3 px-3 py-2 bg-black/80 backdrop-blur rounded-xl border border-white/5 pointer-events-none">
          <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">Slice</div>
          <div className="text-[10px] font-mono font-bold text-teal-400">
            {sliceAxis === "horizontal" ? "y" : "x"} = {(sliceIndex * dx).toFixed(3)} m
          </div>
        </div>
      </div>

      {/* 1D Temperature Profile and Thermal Gradient Chart */}
      <div className="bg-[#141416] rounded-2xl border border-white/5 p-3 flex flex-col relative">
        <div className="flex justify-between items-center mb-1.5 px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                Temperature (°C)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-[1px] border-t border-dashed border-orange-400" />
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                Gradient |dT/dn| (°C/m)
              </span>
            </div>
          </div>
          <div className="text-[8px] font-mono text-white/25 uppercase">
            Slice Length: {L.toFixed(2)} m
          </div>
        </div>

        <div className="flex gap-4 items-stretch">
          {/* SVG Plot */}
          <div className="flex-1 h-36 relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 100 80"
              preserveAspectRatio="none"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={handleSvgMouseLeave}
            >
              {/* Background grid */}
              {[20, 40, 60].map(y => (
                <line key={y} x1="8" y1={y} x2="92" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              ))}

              {/* Temperature Curve */}
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

              {/* Gradient Curve (Dashed Orange) */}
              {gradPath && maxGrad_slice > 0.1 && (
                <path
                  d={gradPath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Extrema Circles & Text */}
              {sliceExtrema.map(({ idx, type, val }) => {
                const W = 100, H = 80, padX = 8, padY = 8;
                const scaleX = (W - 2 * padX) / (sliceProfile.length - 1);
                const scaleY = range_slice > 0.1 ? (H - 2 * padY) / range_slice : 1;
                const px = padX + idx * scaleX;
                const py = H - padY - (val - tMin_slice) * scaleY;
                return (
                  <g key={`${type}-${idx}`}>
                    <circle cx={px} cy={py} r="2.5" fill={type === "max" ? "#ef4444" : "#3b82f6"} stroke="white" strokeWidth="0.5" />
                    <text
                      x={px}
                      y={type === "max" ? py - 5 : py + 8}
                      className="text-[4px] font-bold font-mono fill-white/80"
                      textAnchor="middle"
                    >
                      {type.toUpperCase()}: {val.toFixed(1)}°
                    </text>
                  </g>
                );
              })}

              {/* Dotted Hover Line */}
              {hoverIndex !== null && (
                <line
                  x1={8 + (hoverIndex / (gridSize - 1)) * 84}
                  y1={8}
                  x2={8 + (hoverIndex / (gridSize - 1)) * 84}
                  y2={72}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              )}
            </svg>
          </div>

          {/* Interactive Hover HUD */}
          <div className="w-[140px] shrink-0 bg-black/40 border border-white/5 rounded-xl p-2.5 flex flex-col justify-center gap-1.5 font-mono text-[9px]">
            {hoverDetails ? (
              <>
                <div className="text-white/40 uppercase text-[8px] font-bold tracking-wider border-b border-white/5 pb-1">
                  Cell Analyzer
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Pos:</span>
                  <span className="text-teal-400 font-bold">{hoverDetails.pos.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Temp:</span>
                  <span className="text-teal-400 font-bold">{hoverDetails.temp.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Grad:</span>
                  <span className="text-orange-400 font-bold">{hoverDetails.grad.toFixed(1)} °C/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Flux:</span>
                  <span className="text-rose-400 font-bold">{(hoverDetails.flux / 1000).toFixed(2)} kW/m²</span>
                </div>
                <div className="flex justify-between truncate">
                  <span className="text-white/40">Mat:</span>
                  <span className="text-white/70 font-bold truncate max-w-[80px]">{hoverDetails.matName}</span>
                </div>
              </>
            ) : (
              <div className="text-white/20 text-center py-4 flex flex-col items-center justify-center h-full">
                <span>Hover plot to analyze cells</span>
              </div>
            )}
          </div>
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

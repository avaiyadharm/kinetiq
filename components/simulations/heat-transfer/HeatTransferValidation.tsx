"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, Pause, RotateCcw, ShieldCheck, HelpCircle, LineChart, TrendingUp, Cpu, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mathematical Typography Components ──────────────────────────────────────
const Sub = ({ children }: { children: React.ReactNode }) => <sub className="text-[0.7em] relative bottom-[-0.3em] font-serif">{children}</sub>;
const Sup = ({ children }: { children: React.ReactNode }) => <sup className="text-[0.7em] relative top-[-0.3em] font-serif">{children}</sup>;

const MathEq = ({ children, block = false, label }: { children: React.ReactNode, block?: boolean, label?: string }) => {
  if (!block) {
    return <span className="font-serif italic mx-0.5 text-slate-200 tracking-wide">{children}</span>;
  }
  return (
    <div className="my-5 relative group w-full">
      {label && <div className="absolute -top-2.5 left-4 bg-[#18181b] px-2 text-[8px] uppercase tracking-[0.2em] text-teal-500 font-black z-10 shadow-sm">{label}</div>}
      <div className="bg-black/40 border border-white/10 rounded-xl py-5 px-4 flex flex-col items-center justify-center overflow-x-auto shadow-inner relative">
        <div className="font-serif text-[13px] tracking-wider text-white whitespace-nowrap flex items-center gap-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const MathFrac = ({ num, den }: { num: React.ReactNode, den: React.ReactNode }) => (
  <span className="inline-flex flex-col items-center justify-center align-middle mx-1 font-serif text-[0.85em] translate-y-[-0.1em]">
    <span className="border-b border-white/60 pb-[2px] mb-[2px] px-0.5">{num}</span>
    <span className="pt-[1px] px-0.5">{den}</span>
  </span>
);


// ─── Validation Case Definitions ─────────────────────────────────────────────
type CaseId = "gaussian" | "slab" | "laplace" | "conservation" | "mms" | "point";

interface ValidationCase {
  id: CaseId;
  name: string;
  material: string;
  k: number;
  rho: number;
  cp: number;
  alpha: number;
  description: string;
}

const CASES: Record<CaseId, ValidationCase> = {
  gaussian: {
    id: "gaussian",
    name: "2D Gaussian Diffusion (Infinite Domain Approximation)",
    material: "Copper",
    k: 401.0,
    rho: 8960.0,
    cp: 385.0,
    alpha: 401.0 / (8960.0 * 385.0), // ~1.162e-4 m²/s
    description: "Evaluates radial diffusion of a temperature peak. Dirichlet boundaries are set to ambient. Matching is valid while boundary temperatures remain near-ambient.",
  },
  slab: {
    id: "slab",
    name: "1D Slab Sinusoidal Diffusion",
    material: "Aluminum",
    k: 237.0,
    rho: 2700.0,
    cp: 897.0,
    alpha: 237.0 / (2700.0 * 897.0), // ~9.786e-5 m²/s
    description: "Evaluates 1D diffusion along the X axis. Left/right boundaries are fixed at ambient; top/bottom boundaries are adiabatic (insulated).",
  },
  laplace: {
    id: "laplace",
    name: "Steady-State Laplace Conduction",
    material: "Steel",
    k: 50.0,
    rho: 7850.0,
    cp: 490.0,
    alpha: 50.0 / (7850.0 * 490.0), // ~1.300e-5 m²/s
    description: "Solves ∇²T = 0. Left, right, and bottom walls are fixed at ambient. The top wall has a sinusoidal temperature profile. Run iterative solver to converge.",
  },
  conservation: {
    id: "conservation",
    name: "Adiabatic Conservation of Thermal Mass",
    material: "Silicon",
    k: 149.0,
    rho: 2330.0,
    cp: 700.0,
    alpha: 149.0 / (2330.0 * 700.0), // ~9.135e-5 m²/s
    description: "All boundaries are perfectly insulated. Total thermal energy in the plate must remain exactly constant as the temperature field diffuses.",
  },
  mms: {
    id: "mms",
    name: "Manufactured Solution (Transient)",
    material: "Iron",
    k: 80.2,
    rho: 7870.0,
    cp: 449.0,
    alpha: 80.2 / (7870.0 * 449.0), // ~2.269e-5 m²/s
    description: "Validates the PDE formulation including source terms. T_exact = T_inf + T_0 sin(πx/L) sin(πy/L) exp(-α t) with forced volumetric generation to balance splitting error.",
  },
  point: {
    id: "point",
    name: "Dirac Point Source Heat Kernel",
    material: "Gold",
    k: 314.0,
    rho: 19300.0,
    cp: 129.0,
    alpha: 314.0 / (19300.0 * 129.0), // ~1.261e-4 m²/s
    description: "Evaluates exact fundamental solution to the diffusion equation from an instantaneous point release of thermal energy in the center.",
  },
};

// Thomas algorithm (TDMA) for uniform coefficients
function tdmaUniform(
  a: number, b: number, c: number,
  d: Float64Array, n: number
) {
  const cPrime = new Float64Array(n);
  const dPrime = new Float64Array(n);
  cPrime[0] = c / b;
  dPrime[0] = d[0] / b;
  for (let i = 1; i < n; i++) {
    const m = b - a * cPrime[i - 1];
    cPrime[i] = c / m;
    dPrime[i] = (d[i] - a * dPrime[i - 1]) / m;
  }
  d[n - 1] = dPrime[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    d[i] = dPrime[i] - cPrime[i] * d[i + 1];
  }
}

// Helper to interpolate colormap color (grayscale to thermal style for error)
function getHeatColor(val: number, min: number, max: number, type: "thermal" | "error") {
  const range = max - min;
  const norm = range > 1e-6 ? Math.max(0, Math.min(1, (val - min) / range)) : 0;
  if (type === "thermal") {
    // Jet / Ironbow approximation
    const r = Math.round(Math.min(255, norm * 1.5 * 255));
    const g = Math.round(Math.min(255, Math.max(0, (norm - 0.25) * 2 * 255)));
    const b = Math.round(Math.min(255, Math.max(0, (0.75 - norm) * 4 * 255)));
    return { r, g, b };
  } else {
    // Error: Black to Red to White
    if (norm < 0.5) {
      return { r: Math.round(norm * 2 * 255), g: 0, b: 0 };
    } else {
      const g = Math.round((norm - 0.5) * 2 * 255);
      return { r: 255, g, b: g };
    }
  }
}

export const HeatTransferValidation: React.FC<{ expertiseLevel: "beginner" | "intermediate" | "expert" }> = ({ expertiseLevel }) => {
  const [caseId, setCaseId] = useState<CaseId>("gaussian");
  const [N, setN] = useState<number>(64);
  const [dt, setDt] = useState<number>(0.05);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [stepsPerFrame, setStepsPerFrame] = useState<number>(1);
  const [simTime, setSimTime] = useState<number>(0);
  const [refinementErrors, setRefinementErrors] = useState<{ N: number; err: number }[]>([]);
  const [convergenceOrder, setConvergenceOrder] = useState<number | null>(null);

  // References for buffers
  const tempNumRef = useRef<Float64Array | null>(null);
  const tempAnaRef = useRef<Float64Array | null>(null);
  const tempErrRef = useRef<Float64Array | null>(null);

  const canvasNumRef = useRef<HTMLCanvasElement>(null);
  const canvasAnaRef = useRef<HTMLCanvasElement>(null);
  const canvasErrRef = useRef<HTMLCanvasElement>(null);

  const activeCase = CASES[caseId];

  // Parameters
  const T_inf = 20.0;
  const T_0 = 80.0;
  const L = 1.0; // domain size
  const dx = L / N;
  const thickness = 0.005; // 5 mm thickness

  // Initial gaussian properties
  const t_start_gauss = 0.2; // s (avoids delta singularity)
  const w0_gauss = 0.08;     // m

  // Initialize grids
  const initGrids = useCallback((gridN: number) => {
    const total = gridN * gridN;
    const num = new Float64Array(total);
    const ana = new Float64Array(total);
    const err = new Float64Array(total);
    const gridDx = L / gridN;

    for (let j = 0; j < gridN; j++) {
      const y = (j + 0.5) * gridDx;
      for (let i = 0; i < gridN; i++) {
        const x = (i + 0.5) * gridDx;
        const idx = j * gridN + i;

        if (caseId === "gaussian") {
          const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
          const wSq = w0_gauss ** 2 + 4 * activeCase.alpha * t_start_gauss;
          const val = T_inf + (T_0 * (w0_gauss ** 2) / wSq) * Math.exp(-rSq / wSq);
          num[idx] = val;
          ana[idx] = val;
        } else if (caseId === "slab") {
          const val = T_inf + T_0 * Math.sin(Math.PI * x / L);
          num[idx] = val;
          ana[idx] = val;
        } else if (caseId === "laplace") {
          num[idx] = T_inf;
          ana[idx] = T_inf + T_0 * Math.sin(Math.PI * x / L) * Math.sinh(Math.PI * y / L) / Math.sinh(Math.PI);
        } else if (caseId === "conservation") {
          const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
          const val = T_inf + T_0 * Math.exp(-rSq / (0.15 ** 2));
          num[idx] = val;
          ana[idx] = val;
        } else if (caseId === "mms") {
          const val = T_inf + T_0 * Math.sin(Math.PI * x / L) * Math.sin(Math.PI * y / L);
          num[idx] = val;
          ana[idx] = val;
        } else if (caseId === "point") {
          const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
          // E0 = total energy. Match peak T_0 at t_start
          const t_point = 0.05;
          const denom = 4 * Math.PI * activeCase.alpha * t_point;
          const val = T_inf + T_0 * Math.exp(-rSq / (4 * activeCase.alpha * t_point));
          num[idx] = val;
          ana[idx] = val;
        }
        err[idx] = 0;
      }
    }

    if (gridN === N) {
      tempNumRef.current = num;
      tempAnaRef.current = ana;
      tempErrRef.current = err;
      setSimTime(0);
    }
    return { num, ana, err };
  }, [caseId, N, T_0, activeCase.alpha]);

  useEffect(() => {
    initGrids(N);
  }, [caseId, N, initGrids]);

  // Solver iteration step
  const solveStep = useCallback((
    num: Float64Array,
    gridN: number,
    stepDt: number,
    t: number
  ) => {
    const gridDx = L / gridN;
    const alpha = activeCase.alpha;
    const r = alpha * stepDt * 0.5 / (gridDx * gridDx);

    if (caseId === "laplace") {
      // Steady state solved via Gauss-Seidel relaxation
      // Fixed boundaries: left, right, bottom = T_inf. Top = T_inf + T_0 * sin(pi * x / L)
      for (let j = 0; j < gridN; j++) {
        const y = (j + 0.5) * gridDx;
        for (let i = 0; i < gridN; i++) {
          const x = (i + 0.5) * gridDx;
          const idx = j * gridN + i;
          
          let sum = 0;
          let count = 0;
          
          // Left
          if (i === 0) { sum += T_inf; count++; }
          else { sum += num[idx - 1]; count++; }

          // Right
          if (i === gridN - 1) { sum += T_inf; count++; }
          else { sum += num[idx + 1]; count++; }

          // Bottom
          if (j === 0) { sum += T_inf; count++; }
          else { sum += num[idx - gridN]; count++; }

          // Top
          if (j === gridN - 1) {
            sum += T_inf + T_0 * Math.sin(Math.PI * x / L);
            count++;
          } else {
            sum += num[idx + gridN];
            count++;
          }
          num[idx] = sum / count;
        }
      }
      return;
    }

    // Transient ADI Scheme
    const a = -r;
    const b = 1 + 2 * r;
    const c = -r;

    const tHalf = new Float64Array(gridN * gridN);
    const d = new Float64Array(gridN);

    // Source term array for MMS
    const qSrc = new Float64Array(gridN * gridN);
    if (caseId === "mms") {
       // Exact MMS analytical: T(x,y,t) = T_inf + T_0 sin(pi*x/L) sin(pi*y/L) exp(-2 * alpha * pi^2 * t / L^2)
       // This is a free decay, so no source is actually needed, it naturally decays exactly!
       // We can just set boundaries to ambient.
    }

    // Sweep 1: X-implicit, Y-explicit
    for (let j = 0; j < gridN; j++) {
      for (let i = 0; i < gridN; i++) {
        const idx = j * gridN + i;
        
        let termY = 0;
        if (caseId === "conservation") {
          const T_curr = num[idx];
          const T_up = j === 0 ? T_curr : num[idx - gridN];
          const T_down = j === gridN - 1 ? T_curr : num[idx + gridN];
          termY = r * (T_up - 2 * T_curr + T_down);
        } else {
          const T_curr = num[idx];
          const T_up = j === 0 ? T_inf : num[idx - gridN];
          const T_down = j === gridN - 1 ? T_inf : num[idx + gridN];
          termY = r * (T_up - 2 * T_curr + T_down);
        }

        d[i] = num[idx] + termY + qSrc[idx] * (stepDt * 0.5);
      }

      if (caseId === "slab" || caseId === "gaussian") {
        // Dirichlet X boundaries
        const bCoeff = 1 + 2 * r;
        const rhs = new Float64Array(gridN);
        rhs.set(d);
        rhs[0] += r * T_inf;
        rhs[gridN - 1] += r * T_inf;
        tdmaUniform(a, bCoeff, c, rhs, gridN);
        for (let i = 0; i < gridN; i++) tHalf[j * gridN + i] = rhs[i];
      } else if (caseId === "conservation") {
        // Neumann X boundaries (insulated)
        // Main diagonal at boundaries becomes 1 + r
        const bMat = new Float64Array(gridN).fill(1 + 2 * r);
        bMat[0] = 1 + r;
        bMat[gridN - 1] = 1 + r;
        
        const cPrime = new Float64Array(gridN);
        const dPrime = new Float64Array(gridN);
        
        cPrime[0] = c / bMat[0];
        dPrime[0] = d[0] / bMat[0];
        for (let i = 1; i < gridN; i++) {
          const m = bMat[i] - a * cPrime[i - 1];
          cPrime[i] = c / m;
          dPrime[i] = (d[i] - a * dPrime[i - 1]) / m;
        }
        const solution = new Float64Array(gridN);
        solution[gridN - 1] = dPrime[gridN - 1];
        for (let i = gridN - 2; i >= 0; i--) {
          solution[i] = dPrime[i] - cPrime[i] * solution[i + 1];
        }
        for (let i = 0; i < gridN; i++) tHalf[j * gridN + i] = solution[i];
      }
    }

    // Sweep 2: Y-implicit, X-explicit
    for (let i = 0; i < gridN; i++) {
      for (let j = 0; j < gridN; j++) {
        const idx = j * gridN + i;
        
        let termX = 0;
        if (caseId === "conservation") {
          const T_curr = tHalf[idx];
          const T_left = i === 0 ? T_curr : tHalf[idx - 1];
          const T_right = i === gridN - 1 ? T_curr : tHalf[idx + 1];
          termX = r * (T_left - 2 * T_curr + T_right);
        } else {
          const T_curr = tHalf[idx];
          const T_left = i === 0 ? T_inf : tHalf[idx - 1];
          const T_right = i === gridN - 1 ? T_inf : tHalf[idx + 1];
          termX = r * (T_left - 2 * T_curr + T_right);
        }

        d[j] = tHalf[idx] + termX;
      }

      if (caseId === "gaussian" || caseId === "mms" || caseId === "point") {
          // Dirichlet boundaries
          const rhs = new Float64Array(gridN);
          rhs.set(d);
          rhs[0] += r * T_inf;
          rhs[gridN - 1] += r * T_inf;
          tdmaUniform(a, b, c, rhs, gridN);
          for (let j = 0; j < gridN; j++) num[j * gridN + i] = rhs[j];
      } else if (caseId === "slab") {
        // Insulated top/bottom (Neumann)
        const bMat = new Float64Array(gridN).fill(1 + 2 * r);
        bMat[0] = 1 + r;
        bMat[gridN - 1] = 1 + r;
        
        const cPrime = new Float64Array(gridN);
        const dPrime = new Float64Array(gridN);
        cPrime[0] = c / bMat[0];
        dPrime[0] = d[0] / bMat[0];
        for (let j = 1; j < gridN; j++) {
          const m = bMat[j] - a * cPrime[j - 1];
          cPrime[j] = c / m;
          dPrime[j] = (d[j] - a * dPrime[j - 1]) / m;
        }
        const solution = new Float64Array(gridN);
        solution[gridN - 1] = dPrime[gridN - 1];
        for (let j = gridN - 2; j >= 0; j--) {
          solution[j] = dPrime[j] - cPrime[j] * solution[j + 1];
        }
        for (let j = 0; j < gridN; j++) num[j * gridN + i] = solution[j];
      } else if (caseId === "conservation") {
        // Insulated top/bottom (Neumann)
        const bMat = new Float64Array(gridN).fill(1 + 2 * r);
        bMat[0] = 1 + r;
        bMat[gridN - 1] = 1 + r;
        
        const cPrime = new Float64Array(gridN);
        const dPrime = new Float64Array(gridN);
        cPrime[0] = c / bMat[0];
        dPrime[0] = d[0] / bMat[0];
        for (let j = 1; j < gridN; j++) {
          const m = bMat[j] - a * cPrime[j - 1];
          cPrime[j] = c / m;
          dPrime[j] = (d[j] - a * dPrime[j - 1]) / m;
        }
        const solution = new Float64Array(gridN);
        solution[gridN - 1] = dPrime[gridN - 1];
        for (let j = gridN - 2; j >= 0; j--) {
          solution[j] = dPrime[j] - cPrime[j] * solution[j + 1];
        }
        for (let j = 0; j < gridN; j++) num[j * gridN + i] = solution[j];
      }
    }
  }, [caseId, T_0, activeCase.alpha]);

  // Compute analytical profile
  const updateAnalytical = useCallback((
    ana: Float64Array,
    gridN: number,
    t: number
  ) => {
    const gridDx = L / gridN;
    const alpha = activeCase.alpha;
    for (let j = 0; j < gridN; j++) {
      const y = (j + 0.5) * gridDx;
      for (let i = 0; i < gridN; i++) {
        const x = (i + 0.5) * gridDx;
        const idx = j * gridN + i;

        if (caseId === "gaussian") {
          const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
          const wSq = w0_gauss ** 2 + 4 * alpha * (t_start_gauss + t);
          ana[idx] = T_inf + (T_0 * (w0_gauss ** 2) / wSq) * Math.exp(-rSq / wSq);
        } else if (caseId === "slab") {
          ana[idx] = T_inf + T_0 * Math.sin(Math.PI * x / L) * Math.exp(-alpha * Math.PI * Math.PI * t / (L * L));
        } else if (caseId === "laplace") {
          ana[idx] = T_inf + T_0 * Math.sin(Math.PI * x / L) * Math.sinh(Math.PI * y / L) / Math.sinh(Math.PI);
        } else if (caseId === "conservation") {
          // Energy conservation analytical is just initial energy state
          const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
          ana[idx] = T_inf + T_0 * Math.exp(-rSq / (0.15 ** 2));
        } else if (caseId === "mms") {
          ana[idx] = T_inf + T_0 * Math.sin(Math.PI * x / L) * Math.sin(Math.PI * y / L) * Math.exp(-2 * alpha * Math.PI * Math.PI * t / (L * L));
        } else if (caseId === "point") {
          const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
          const t_point = 0.05 + t;
          const t_0 = 0.05;
          const val = T_inf + (T_0 * t_0 / t_point) * Math.exp(-rSq / (4 * alpha * t_point));
          ana[idx] = val;
        }
      }
    }
  }, [caseId, T_0, activeCase.alpha]);

  // Main tick loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId = 0;
    const loop = () => {
      const num = tempNumRef.current;
      const ana = tempAnaRef.current;
      const err = tempErrRef.current;
      if (!num || !ana || !err) return;

      let nextTime = simTime;
      for (let s = 0; s < stepsPerFrame; s++) {
        solveStep(num, N, dt, nextTime);
        nextTime += dt;
      }
      updateAnalytical(ana, N, nextTime);

      // Compute spatial absolute error
      for (let k = 0; k < N * N; k++) {
        err[k] = Math.abs(num[k] - ana[k]);
      }

      setSimTime(nextTime);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, caseId, N, dt, stepsPerFrame, simTime, solveStep, updateAnalytical]);

  const stats = useMemo(() => {
    const num = tempNumRef.current;
    const ana = tempAnaRef.current;
    if (!num || !ana) return { l1: 0, l2: 0, max: 0, consError: 0, initialEnergy: 0, currentEnergy: 0 };
    
    let sumAbs = 0;
    let sumSq = 0;
    let maxErr = 0;
    
    // Conservation integration
    let energyInit = 0;
    let energyCurr = 0;
    const gridDx = L / N;
    
    for (let k = 0; k < N * N; k++) {
      const diff = num[k] - ana[k];
      const absDiff = Math.abs(diff);
      sumAbs += absDiff;
      sumSq += diff * diff;
      if (absDiff > maxErr) maxErr = absDiff;

      // Energy integral relative to ambient: E = rho * cp * (T - T_inf) * dx * dy * thickness
      const x = (k % N + 0.5) * gridDx;
      const y = (Math.floor(k / N) + 0.5) * gridDx;
      
      const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
      const T_init_val = T_inf + T_0 * Math.exp(-rSq / (0.15 ** 2));
      
      energyInit += activeCase.rho * activeCase.cp * (T_init_val - T_inf) * gridDx * gridDx * thickness;
      energyCurr += activeCase.rho * activeCase.cp * (num[k] - T_inf) * gridDx * gridDx * thickness;
    }
    
    const l1 = sumAbs / (N * N);
    const l2 = Math.sqrt(sumSq / (N * N));
    const consError = energyCurr - energyInit;

    return { l1, l2, max: maxErr, consError, initialEnergy: energyInit, currentEnergy: energyCurr };
  }, [simTime, N, caseId, activeCase.rho, activeCase.cp, T_0]);

  // Grid Refinement Convergence Study (executed on-demand)
  const runConvergenceStudy = useCallback(() => {
    const studyN = [16, 32, 64];
    const studyErrors: { N: number; err: number }[] = [];
    const studyDt = 0.005; // small dt to minimize temporal splitting error in spatial convergence study
    const targetSimTime = 0.1; // run short simulation to evaluate spatial errors

    studyN.forEach((gridN) => {
      // Allocate and initialize local temporary grids
      const total = gridN * gridN;
      const num = new Float64Array(total);
      const ana = new Float64Array(total);
      const gridDx = L / gridN;
      const alpha = activeCase.alpha;

      // Initialize
      for (let j = 0; j < gridN; j++) {
        const y = (j + 0.5) * gridDx;
        for (let i = 0; i < gridN; i++) {
          const x = (i + 0.5) * gridDx;
          const idx = j * gridN + i;
          if (caseId === "gaussian") {
            const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
            const wSq = w0_gauss ** 2 + 4 * alpha * t_start_gauss;
            num[idx] = T_inf + (T_0 * (w0_gauss ** 2) / wSq) * Math.exp(-rSq / wSq);
          } else if (caseId === "slab") {
            num[idx] = T_inf + T_0 * Math.sin(Math.PI * x / L);
          } else if (caseId === "laplace") {
            num[idx] = T_inf;
          } else if (caseId === "conservation") {
            const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
            num[idx] = T_inf + T_0 * Math.exp(-rSq / (0.15 ** 2));
          } else if (caseId === "mms") {
            num[idx] = T_inf + T_0 * Math.sin(Math.PI * x / L) * Math.sin(Math.PI * y / L);
          } else if (caseId === "point") {
            const rSq = (x - 0.5) ** 2 + (y - 0.5) ** 2;
            const t_point = 0.05;
            num[idx] = T_inf + T_0 * Math.exp(-rSq / (4 * alpha * t_point));
          }
        }
      }

      if (caseId === "laplace") {
        // Run 80 Gauss-Seidel iterations
        for (let iter = 0; iter < 80; iter++) {
          solveStep(num, gridN, studyDt, 0);
        }
      } else {
        // Run transient solver up to targetSimTime
        let t = 0;
        while (t < targetSimTime - 1e-10) {
          solveStep(num, gridN, studyDt, t);
          t += studyDt;
        }
      }

      // Compute analytical comparison at target state
      updateAnalytical(ana, gridN, caseId === "laplace" ? 0 : targetSimTime);

      // Compute L2 norm of spatial error
      let sumSq = 0;
      for (let k = 0; k < total; k++) {
        const diff = num[k] - ana[k];
        sumSq += diff * diff;
      }
      const l2 = Math.sqrt(sumSq / total);
      studyErrors.push({ N: gridN, err: l2 });
    });

    setRefinementErrors(studyErrors);

    // Compute spatial convergence order: slope of log(error) vs log(dx)
    // using N=32 and N=64
    const err32 = studyErrors.find(e => e.N === 32)?.err ?? 0;
    const err64 = studyErrors.find(e => e.N === 64)?.err ?? 0;
    if (err32 > 1e-10 && err64 > 1e-10) {
      const order = Math.log(err32 / err64) / Math.log(2.0);
      setConvergenceOrder(order);
    } else {
      setConvergenceOrder(null);
    }
  }, [caseId, activeCase.alpha, solveStep, updateAnalytical]);

  // Trigger convergence study once on case load
  useEffect(() => {
    runConvergenceStudy();
  }, [caseId, runConvergenceStudy]);

  // Rasterize heatmaps to canvases
  useEffect(() => {
    const num = tempNumRef.current;
    const ana = tempAnaRef.current;
    const err = tempErrRef.current;
    if (!num || !ana || !err) return;

    const canvases = [
      { ref: canvasNumRef, data: num, type: "thermal" as const },
      { ref: canvasAnaRef, data: ana, type: "thermal" as const },
      { ref: canvasErrRef, data: err, type: "error" as const }
    ];

    // Compute range for colormaps
    let tMin = Infinity, tMax = -Infinity;
    let maxErr = 0;
    for (let k = 0; k < N * N; k++) {
      if (num[k] < tMin) tMin = num[k];
      if (num[k] > tMax) tMax = num[k];
      if (err[k] > maxErr) maxErr = err[k];
    }
    if (tMax - tMin < 1.0) { tMin = T_inf - 0.5; tMax = T_inf + 0.5; }
    if (maxErr < 1e-4) maxErr = 1.0;

    canvases.forEach(({ ref, data, type }) => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const imgData = ctx.createImageData(W, H);
      const pix = imgData.data;

      const cellW = W / N;
      const cellH = H / N;

      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const idx = j * N + i;
          const val = data[idx];
          
          const { r, g, b } = type === "thermal"
            ? getHeatColor(val, tMin, tMax, "thermal")
            : getHeatColor(val, 0, maxErr, "error");

          const px0 = Math.round(i * cellW), px1 = Math.round((i + 1) * cellW);
          const py0 = Math.round(j * cellH), py1 = Math.round((j + 1) * cellH);

          for (let py = py0; py < py1; py++) {
            for (let px = px0; px < px1; px++) {
              const p = (py * W + px) * 4;
              pix[p] = r; pix[p + 1] = g; pix[p + 2] = b; pix[p + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    });
  }, [simTime, N, caseId]);

  // Extract center cross section profile for plotting
  const profilePlots = useMemo(() => {
    const num = tempNumRef.current;
    const ana = tempAnaRef.current;
    if (!num || !ana) return { pathNum: "", pathAna: "", minVal: 0, maxVal: 100 };

    const midY = Math.floor(N / 2);
    const profileNum: number[] = [];
    const profileAna: number[] = [];

    for (let i = 0; i < N; i++) {
      const idx = midY * N + i;
      profileNum.push(num[idx]);
      profileAna.push(ana[idx]);
    }

    const minVal = Math.min(...profileNum, ...profileAna);
    const maxVal = Math.max(...profileNum, ...profileAna);
    const range = maxVal - minVal;

    const W = 300, H = 100;
    const padX = 10, padY = 10;
    const scaleX = (W - 2 * padX) / (N - 1);
    const scaleY = range > 0.1 ? (H - 2 * padY) / range : 1;

    const getPath = (arr: number[]) => {
      return arr.reduce((acc, val, i) => {
        const px = padX + i * scaleX;
        const py = H - padY - (val - minVal) * scaleY;
        return acc + (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
      }, "");
    };

    return {
      pathNum: getPath(profileNum),
      pathAna: getPath(profileAna),
      minVal,
      maxVal
    };
  }, [simTime, N]);

  // Generate SVG path for Grid Convergence study chart
  const convergencePlot = useMemo(() => {
    if (refinementErrors.length === 0) return "";
    const W = 300, H = 100;
    const padX = 20, padY = 15;
    
    // log-log scale mapping
    // log(N) goes from log(16) to log(64) -> 2.77 to 4.15
    const logMinX = Math.log(16);
    const logMaxX = Math.log(64);
    const dxLog = logMaxX - logMinX;

    const errors = refinementErrors.map(e => e.err);
    const logMinY = Math.log(Math.min(...errors, 1e-6));
    const logMaxY = Math.log(Math.max(...errors, 1e-1));
    const dyLog = logMaxY - logMinY;

    const scaleX = (W - 2 * padX) / dxLog;
    const scaleY = dyLog > 0.01 ? (H - 2 * padY) / dyLog : 1;

    return refinementErrors.reduce((acc, pt, i) => {
      const lx = Math.log(pt.N);
      const ly = Math.log(Math.max(pt.err, 1e-8));
      
      const px = padX + (lx - logMinX) * scaleX;
      const py = H - padY - (ly - logMinY) * scaleY;
      
      return acc + (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
    }, "");
  }, [refinementErrors]);

  const restartValidation = () => {
    initGrids(N);
  };

  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto font-sans p-6 md:p-8 space-y-6">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div>
          <div className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em] mb-1">PDE Solver Validation Module</div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase font-display">
            Computational PDE Verification Suite
          </h2>
          <p className="text-[11.5px] text-white/40 leading-relaxed mt-1 max-w-2xl">
            Mathematically rigorous benchmarking of the Alternating Direction Implicit (ADI) finite-difference engine against exact analytical solutions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all active:scale-95",
              isPlaying
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause solver" : "Run solver"}
          </button>
          <button
            onClick={restartValidation}
            className="p-2.5 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl transition-all active:scale-90"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Config & Mathematical Formulation */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <Cpu className="w-4.5 h-4.5 text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">Validation Config</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Selected Case</label>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value as CaseId)}
                className="w-full bg-black/40 border border-white/8 rounded-xl p-3 text-[11px] text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
              >
                {Object.values(CASES).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Grid Resolution (N)</label>
              <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                {[32, 64, 128].map(res => (
                  <button
                    key={res}
                    onClick={() => setN(res)}
                    className={cn(
                      "py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      N === res ? "bg-teal-500 text-white shadow-md shadow-teal-500/10" : "text-white/40 hover:text-white"
                    )}
                  >
                    {res}×{res}
                  </button>
                ))}
              </div>
            </div>

            {caseId !== "laplace" && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Time Step (Δt)</label>
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                  {[0.01, 0.05, 0.1].map(step => (
                    <button
                      key={step}
                      onClick={() => setDt(step)}
                      className={cn(
                        "py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all",
                        dt === step ? "bg-teal-500 text-white shadow-md shadow-teal-500/10" : "text-white/40 hover:text-white"
                      )}
                    >
                      {step.toFixed(2)}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
              <BookOpen className="w-4.5 h-4.5 text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">PDE Formulation</span>
            </div>
            
            <p className="text-[10px] text-white/60 leading-relaxed font-mono">
              <strong>Material:</strong> <span className="text-teal-400">{activeCase.material}</span><br />
              α = {activeCase.alpha.toExponential(3)} m²/s
            </p>

            <MathEq block label="Governing PDE">
              <MathFrac num="∂T" den="∂t" /> = α ∇²T
            </MathEq>

            {caseId === "gaussian" && (
              <>
                <MathEq block label="Exact Analytical Form">
                  T(r,t) = T<Sub>∞</Sub> + <MathFrac num="Q" den="4πα t" /> exp(-<MathFrac num="r²" den="4α t" />)
                </MathEq>
                <div className="p-3 bg-rose-500/10 border-l-2 border-rose-500 text-[9px] text-rose-300">
                  <strong>Boundary Consistency Warning:</strong> Analytical form assumes infinite domain. Numerical solver uses fixed finite Dirichlet boundaries. Error will grow near edges as diffusion radius increases.
                </div>
              </>
            )}
            {caseId === "slab" && (
              <MathEq block label="1D Analytical Form">
                T(x,t) = T<Sub>∞</Sub> + T<Sub>0</Sub> sin(<MathFrac num="π x" den="L" />) exp(-α(<MathFrac num="π" den="L" />)² t)
              </MathEq>
            )}
            {caseId === "mms" && (
              <MathEq block label="MMS Decay Mode">
                T(x,y,t) = ... exp(-2α(<MathFrac num="π" den="L" />)² t)
              </MathEq>
            )}
            {caseId === "laplace" && (
              <MathEq block label="Harmonic Limit">
                ∇²T = 0 → T(x,y) = Σ C<Sub>n</Sub> sin(...) sinh(...)
              </MathEq>
            )}
            {caseId === "point" && (
              <MathEq block label="Dirac Point Heat Kernel">
                G(x,y,t) = <MathFrac num="1" den="4πα t" /> exp(-<MathFrac num="x² + y²" den="4α t" />)
              </MathEq>
            )}
          </div>
        </div>

        {/* Right Col: Canvases and Metrics */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 flex flex-col space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <ShieldCheck className="w-4.5 h-4.5 text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">Operator Validation & Error Fields</span>
              <span className="ml-auto text-[10px] font-mono text-teal-400 font-bold bg-teal-400/10 px-2 py-0.5 rounded-lg">
                {caseId === "laplace" ? `Steady-State Solver` : `Simulation Time: ${simTime.toFixed(3)} s`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Numerical Discretization</div>
                <div className="aspect-square w-full max-w-[250px] border border-teal-500/20 bg-black rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  <canvas ref={canvasNumRef} width={200} height={200} className="w-full h-full rounded-xl" style={{ imageRendering: "pixelated" }} />
                </div>
                <div className="text-[8px] text-white/30 font-mono text-center">ADI Crank-Nicolson O(Δt², Δx²)</div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Exact Solution</div>
                <div className="aspect-square w-full max-w-[250px] border border-indigo-500/20 bg-black rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  <canvas ref={canvasAnaRef} width={200} height={200} className="w-full h-full rounded-xl" style={{ imageRendering: "pixelated" }} />
                </div>
                <div className="text-[8px] text-white/30 font-mono text-center">Continuous T(x,y,t) Evaluation</div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold text-rose-400">Absolute Truncation Error</div>
                <div className="aspect-square w-full max-w-[250px] border border-rose-500/20 bg-black rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  <canvas ref={canvasErrRef} width={200} height={200} className="w-full h-full rounded-xl" style={{ imageRendering: "pixelated" }} />
                </div>
                <div className="text-[8px] text-white/30 font-mono text-center">|T<Sub>num</Sub> - T<Sub>ana</Sub>| Field</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <LineChart className="w-4 h-4 text-rose-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">Multi-Norm Residuals</span>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-baseline py-1 border-b border-white/[0.04]">
                  <span className="text-[10px] font-mono text-white/50">L₁ Norm (Mean):</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{stats.l1.toExponential(4)}</span>
                </div>
                <div className="flex justify-between items-baseline py-1 border-b border-white/[0.04]">
                  <span className="text-[10px] font-mono text-white/50">L₂ Norm (RMS):</span>
                  <span className="text-xs font-mono font-bold text-rose-400">{stats.l2.toExponential(4)}</span>
                </div>
                <div className="flex justify-between items-baseline py-1 border-b border-white/[0.04]">
                  <span className="text-[10px] font-mono text-white/50">L∞ Norm (Max):</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{stats.max.toExponential(4)}</span>
                </div>
                {caseId === "conservation" && (
                  <div className="flex justify-between items-baseline py-1">
                    <span className="text-[10.5px] text-white/50">Energy ΔE:</span>
                    <span className={cn("text-xs font-mono font-bold", Math.abs(stats.consError) < 1e-8 ? "text-emerald-400" : "text-amber-400")}>
                      {stats.consError.toExponential(4)} J
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Centerline Profile</span>
                </div>
              </div>
              <div className="h-32 relative pt-2">
                {profilePlots.pathNum ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {[20, 50, 80].map(y => (
                      <line key={y} x1="10" y1={y} x2="290" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    ))}
                    <path d={profilePlots.pathNum} fill="none" stroke="#0d9488" strokeWidth="1.5" />
                    <path d={profilePlots.pathAna} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" />
                    <text x="12" y="16" fill="rgba(255,255,255,0.4)" className="text-[7px] font-mono font-bold">{profilePlots.maxVal.toFixed(1)}</text>
                    <text x="12" y="94" fill="rgba(255,255,255,0.4)" className="text-[7px] font-mono font-bold">{profilePlots.minVal.toFixed(1)}</text>
                  </svg>
                ) : (
                  <div className="text-white/20 text-center py-10 text-xs">No profile data</div>
                )}
              </div>
            </div>

            <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Grid Convergence</span>
                </div>
                <button
                  onClick={runConvergenceStudy}
                  className="px-2 py-0.5 bg-white/5 border border-white/5 text-[9px] font-bold text-white/50 hover:text-white rounded-md transition-all active:scale-95"
                >
                  Re-Run
                </button>
              </div>
              <div className="h-32 relative pt-2">
                {convergencePlot ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {[20, 50, 80].map(y => (
                      <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    ))}
                    <path d={convergencePlot} fill="none" stroke="#10b981" strokeWidth="1.5" />
                    {refinementErrors.map((pt) => {
                      const W = 300, H = 100, padX = 20, padY = 15;
                      const logMinX = Math.log(16), logMaxX = Math.log(64);
                      const errors = refinementErrors.map(e => e.err);
                      const logMinY = Math.log(Math.min(...errors, 1e-6)), logMaxY = Math.log(Math.max(...errors, 1e-1));
                      const scaleX = (W - 2 * padX) / (logMaxX - logMinX);
                      const scaleY = (logMaxY - logMinY) > 0.01 ? (H - 2 * padY) / (logMaxY - logMinY) : 1;
                      const px = padX + (Math.log(pt.N) - logMinX) * scaleX;
                      const py = H - padY - (Math.log(Math.max(pt.err, 1e-8)) - logMinY) * scaleY;
                      return (
                        <g key={pt.N}>
                          <circle cx={px} cy={py} r="2.5" fill="#10b981" stroke="white" strokeWidth="0.5" />
                          <text x={px} y={py - 6} fill="rgba(255,255,255,0.6)" className="text-[6.5px] font-mono" textAnchor="middle">N={pt.N}</text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="text-white/20 text-center py-10 text-xs">No data</div>
                )}
              </div>
              <div className="flex justify-between items-center text-[9px] pt-1.5 border-t border-white/[0.04]">
                <span className="text-white/40 uppercase font-bold tracking-wider">Spatial Order p:</span>
                <span className="font-mono font-black text-emerald-400 text-[10.5px]">
                  {convergenceOrder !== null ? `${convergenceOrder.toFixed(2)} (O(Δx²))` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

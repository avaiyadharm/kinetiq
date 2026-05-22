"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════════════════
//  TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export type BoundaryType = "Fixed-Fixed" | "Free-Free" | "Fixed-Free";
export type RenderMode = "Displacement" | "Energy" | "Phase" | "Scientific";
export type SystemType = "string" | "air" | "membrane";
export type EnergyMode = "KE" | "PE" | "Total" | "TimeAvg";

interface StandingWavesCanvasProps {
  systemType: SystemType;
  solverType: "analytical" | "numerical";
  discreteBeads: boolean;
  membraneGeometry: "rectangular" | "circular";
  m2D: number;
  n2D: number;
  sandPattern: boolean;
  probeX: number;
  setProbeX: (x: number) => void;
  showPhaseSpace: boolean;
  showFourier: boolean;

  amplitude: number;          // A₀ (m) — SI: physical displacement amplitude
  harmonic: number;           // n — mode number
  waveSpeed: number;          // v (m/s) — derived: √(T/μ)
  boundaryType: BoundaryType | "Partially Reflective";
  renderMode: RenderMode;
  showComponents: boolean;
  showNodes: boolean;
  showAntinodes: boolean;
  isPlaying: boolean;
  time: number;               // wall-clock time (s)
  length: number;             // L (m) — string/pipe length
  tension: number;            // T (N) — string tension
  density: number;            // μ (kg/m) — linear mass density
  damping: number;            // β (s⁻¹) — damping coefficient
  reflection: number;         // R — reflection coefficient
  simMode?: "harmonic" | "driven";
  drivingFrequency?: number;  // f_d (Hz)
  visualAmplitudeFactor?: number; // display zoom factor (1–10, not physical)
  boundaryImpedance?: number; // Z₂ (kg/s) — impedance at right boundary

  // Superposition mode
  showSuperposition?: boolean;
  harmonic2?: number;
  amplitude2?: number;

  // Visualization controls
  slowMotionFactor?: number;      // τ_scale: scales t_vis = time × slowMotionFactor
  showEnergyHeatmap?: boolean;
  energyMode?: EnergyMode;
  showSolverDiagnostics?: boolean;
  manualPhase?: number;           // override phase when paused
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BESSEL FUNCTION HELPERS (for circular membrane modes)
// ═══════════════════════════════════════════════════════════════════════════════
const BESSEL_ZEROS: { [m: number]: number[] } = {
  0: [2.4048, 5.5201, 8.6537, 11.7915],
  1: [3.8317, 7.0156, 10.1735, 13.3237],
  2: [5.1356, 8.4172, 11.6198, 14.7960],
  3: [6.3802, 9.7610, 13.0152, 16.2235],
};

const factorial = (n: number): number => {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

const besselJ = (m: number, x: number): number => {
  const absX = Math.abs(x);
  if (absX === 0) return m === 0 ? 1 : 0;
  if (absX < 20) {
    let sum = 0;
    for (let k = 0; k <= 12; k++) {
      const numerator = Math.pow(-1, k) * Math.pow(absX / 2, 2 * k + m);
      const denominator = factorial(k) * factorial(k + m);
      sum += numerator / denominator;
    }
    return x < 0 && m % 2 !== 0 ? -sum : sum;
  }
  return Math.sqrt(2 / (Math.PI * absX)) * Math.cos(absX - (m * Math.PI / 2) - Math.PI / 4);
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const StandingWavesCanvas: React.FC<StandingWavesCanvasProps> = ({
  systemType,
  solverType,
  discreteBeads,
  membraneGeometry,
  m2D,
  n2D,
  sandPattern,
  probeX,
  setProbeX,
  showPhaseSpace,
  showFourier,

  amplitude,
  harmonic,
  waveSpeed,
  boundaryType,
  renderMode,
  showComponents,
  showNodes,
  showAntinodes,
  isPlaying,
  time,
  length,
  tension,
  density,
  damping,
  reflection,
  simMode = "harmonic",
  drivingFrequency = 10.0,
  visualAmplitudeFactor = 5,
  boundaryImpedance = 0,

  showSuperposition = false,
  harmonic2 = 2,
  amplitude2 = 0.5,

  slowMotionFactor = 0.04,
  showEnergyHeatmap = false,
  energyMode = "Total",
  showSolverDiagnostics = false,
  manualPhase,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingProbeRef = useRef(false);

  // Numerical 1D Wave Solver state
  const numGridSize = discreteBeads ? 15 : 60;
  const yNumRef = useRef<Float32Array>(new Float32Array(numGridSize));
  const yPrevRef = useRef<Float32Array>(new Float32Array(numGridSize));
  const timeNumRef = useRef(0);   // accumulates simulation time (= t_vis units)
  const dtLastRef = useRef(1e-4); // last dt used in numerical solver

  // Phase history for phase-space orbit
  const phaseHistoryRef = useRef<{ y: number; v: number }[]>([]);

  // Oscilloscope buffer: rolling displacement at probe position
  const oscBufferRef = useRef<{ t: number; y: number }[]>([]);

  // Air column particle system
  const airParticlesRef = useRef<{ x0: number; y0: number }[]>([]);

  // Chladni 2D sand particle system
  const sandParticlesRef = useRef<{ x: number; y: number }[]>([]);

  // L2 error tracking (analytical vs numerical)
  const l2ErrorRef = useRef(0);

  // Energy conservation tracking
  const energyHistRef = useRef<{ t: number; E: number }[]>([]);

  // Hover Probe overlay state
  const [hoverData, setHoverData] = useState({
    visible: false, x: 0, y: 0, px: 0, z: 0, energy: 0, uK: 0, uP: 0,
    velocity: 0, slope: 0, nodeType: "", definition: ""
  });

  // ── Initialization ────────────────────────────────────────────────────────

  const initializeAirParticles = () => {
    const pts = [];
    for (let i = 0; i < 300; i++) {
      pts.push({ x0: Math.random() * length, y0: (Math.random() - 0.5) * 100 });
    }
    airParticlesRef.current = pts;
  };

  const initializeSandParticles = () => {
    const pts = [];
    const Lx = 440, Ly = 360, a = 220;
    if (membraneGeometry === "rectangular") {
      for (let i = 0; i < 1500; i++) {
        pts.push({ x: (Math.random() - 0.5) * Lx, y: (Math.random() - 0.5) * Ly });
      }
    } else {
      for (let i = 0; i < 1500; i++) {
        const r = Math.sqrt(Math.random()) * a;
        const theta = Math.random() * 2 * Math.PI;
        pts.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
      }
    }
    sandParticlesRef.current = pts;
  };

  const initializeNumericalWave = () => {
    const M = numGridSize;
    const y = new Float32Array(M);
    const y_prev = new Float32Array(M);

    if (simMode === "harmonic") {
      let k_val = 0;
      if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" || boundaryType === "Partially Reflective") {
        k_val = (harmonic * Math.PI) / length;
      } else if (boundaryType === "Fixed-Free") {
        const oddH = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
        k_val = (oddH * Math.PI) / (2 * length);
      }
      for (let i = 0; i < M; i++) {
        const x = (i / (M - 1)) * length;
        const y_init = boundaryType === "Free-Free"
          ? amplitude * Math.cos(k_val * x)
          : amplitude * Math.sin(k_val * x);
        y[i] = y_init;
        y_prev[i] = y_init;
      }
    }
    yNumRef.current = y;
    yPrevRef.current = y_prev;
    timeNumRef.current = 0;
    dtLastRef.current = 1e-4;
    phaseHistoryRef.current = [];
    oscBufferRef.current = [];
    l2ErrorRef.current = 0;
    energyHistRef.current = [];
  };

  useEffect(() => { initializeAirParticles(); }, [length]);
  useEffect(() => { initializeSandParticles(); }, [membraneGeometry, m2D, n2D, amplitude]);
  useEffect(() => { initializeNumericalWave(); }, [length, boundaryType, simMode, harmonic, discreteBeads, amplitude]);

  // ── Spring rendering helper ───────────────────────────────────────────────
  const drawSpring = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, coils = 7) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      const px = x1 + dx * t, py = y1 + dy * t;
      if (i === 0 || i === coils) { ctx.lineTo(px, py); }
      else { const off = (i % 2 === 0 ? 1 : -1) * 7; ctx.lineTo(px + nx * off, py + ny * off); }
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };

  // ── Main render loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastFrameTime = performance.now();

    const render = (now: number) => {
      const dt_frame = Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.018)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        ctx.moveTo(0, (H / 10) * i); ctx.lineTo(W, (H / 10) * i);
        ctx.moveTo((W / 10) * i, 0); ctx.lineTo((W / 10) * i, H);
      }
      ctx.stroke();

      // ────────────────────────────────────────────────────────────────────
      //  §1  UNIFIED SIMULATION TIME
      //  t_vis = time × slowMotionFactor
      //  BOTH the oscillatory part cos(ωt) AND the decay exp(-βt) use t_vis.
      //  This makes the simulation self-consistent:
      //    y(x, t_vis) = A₀·exp(-β·t_vis)·sin(kx)·cos(ω·t_vis)
      //  which IS a solution to the damped wave equation in t_vis time.
      //  The Q-factor Q = ω/(2β) directly predicts visible ring-down duration.
      // ────────────────────────────────────────────────────────────────────
      const t_vis = manualPhase !== undefined && !isPlaying
        ? manualPhase
        : time * slowMotionFactor;

      const isDriven = simMode === "driven";
      const mu = density;   // kg/m  — linear mass density
      const T = tension;    // N     — string tension
      const v = Math.sqrt(Math.max(T / mu, 1e-10));   // m/s — wave speed v = √(T/μ)
      const v_cap = Math.min(v, 400);                  // cap for numerical solver stability
      const Z1 = Math.sqrt(T * mu);                   // kg/s — characteristic impedance

      let R = -1;
      let Z2 = 0;
      if (boundaryType === "Fixed-Fixed") { R = -1; Z2 = 0; }
      else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") { R = 1; Z2 = 1e8; }
      else if (boundaryType === "Partially Reflective") {
        Z2 = boundaryImpedance ?? 0;
        R = (Z2 - Z1) / (Z2 + Z1);
      }
      const T_coeff = (Z2 + Z1) > 0 ? (2 * Z2) / (Z2 + Z1) : 0;

      // ── Effective harmonic (Fixed-Free only allows odd modes) ─────────────
      let n_eff = harmonic;
      if (boundaryType === "Fixed-Free" && harmonic % 2 === 0) {
        n_eff = Math.max(1, harmonic - 1);
      }

      // ── Wave parameters derived from physical quantities ─────────────────
      let k_global = 0, omega_global = 0, lambda_global = 0;
      const isFreeLeft = boundaryType === "Free-Free";

      if (!isDriven) {
        if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" || boundaryType === "Partially Reflective") {
          k_global = (n_eff * Math.PI) / length;        // rad/m  k = nπ/L
          lambda_global = (2 * length) / n_eff;         // m     λ = 2L/n
        } else {
          k_global = (n_eff * Math.PI) / (2 * length);  // rad/m  k = nπ/(2L)
          lambda_global = (4 * length) / n_eff;         // m     λ = 4L/n
        }
        omega_global = k_global * v_cap;  // rad/s   ω = kv
      } else {
        const fd = drivingFrequency;
        omega_global = 2 * Math.PI * fd;
        const w_v2 = (omega_global * omega_global) / (v_cap * v_cap);
        const b_w_v2 = (damping * omega_global) / (v_cap * v_cap);
        k_global = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
        lambda_global = k_global > 0 ? (2 * Math.PI) / k_global : 0;
      }

      const beta = damping;  // s⁻¹  — damping coefficient β = b/(2m)

      // ── Display scale: pixels per meter ──────────────────────────────────
      // Auto-scales so the wave always occupies ~35% of half-height.
      // visualAmplitudeFactor (1-10) is a DISPLAY ZOOM only, not physical.
      const pixPerMeter = (H * 0.35) * (visualAmplitudeFactor / 5) / Math.max(1e-6, amplitude);
      const A_px = amplitude * pixPerMeter;  // amplitude in pixels (display only)

      // ── Analytical SI physics functions ───────────────────────────────────
      //  All return SI values: meters, m/s, dimensionless slope, J/m
      let y_SI: (x: number) => number;         // displacement (m)
      let dydt_SI: (x: number) => number;      // ∂y/∂t_vis (m/s in sim time)
      let dydx_SI: (x: number) => number;      // ∂y/∂x (dimensionless slope)
      let y1_fn: (x: number) => number;        // forward traveling component
      let y2_fn: (x: number) => number;        // backward traveling component

      let decayEnv = 1.0;

      if (solverType === "analytical") {
        if (!isDriven) {
          decayEnv = Math.exp(-beta * t_vis);  // UNIFIED: same t_vis as oscillation

          if (isFreeLeft) {
            // Free-Free: antinodes at both ends, displacement ∝ cos(kx)
            y_SI   = (x) => amplitude * decayEnv * Math.cos(k_global * x) * Math.cos(omega_global * t_vis);
            dydt_SI = (x) => amplitude * decayEnv * Math.cos(k_global * x) *
                              (-beta * Math.cos(omega_global * t_vis) - omega_global * Math.sin(omega_global * t_vis));
            dydx_SI = (x) => -amplitude * decayEnv * k_global * Math.sin(k_global * x) * Math.cos(omega_global * t_vis);
            y1_fn   = (x) => 0.5 * amplitude * decayEnv * Math.cos(k_global * x - omega_global * t_vis);
            y2_fn   = (x) => 0.5 * amplitude * decayEnv * Math.cos(k_global * x + omega_global * t_vis);
          } else {
            // Fixed-Fixed / Fixed-Free: nodes at fixed ends, displacement ∝ sin(kx)
            y_SI   = (x) => amplitude * decayEnv * Math.sin(k_global * x) * Math.cos(omega_global * t_vis);
            dydt_SI = (x) => amplitude * decayEnv * Math.sin(k_global * x) *
                              (-beta * Math.cos(omega_global * t_vis) - omega_global * Math.sin(omega_global * t_vis));
            dydx_SI = (x) => amplitude * decayEnv * k_global * Math.cos(k_global * x) * Math.cos(omega_global * t_vis);
            y1_fn   = (x) => 0.5 * amplitude * decayEnv * Math.sin(k_global * x - omega_global * t_vis);
            y2_fn   = (x) => 0.5 * amplitude * decayEnv * Math.sin(k_global * x + omega_global * t_vis);
          }
        } else {
          // Driven mode: complex transfer function solution
          const alpha = k_global > 0 ? (beta * omega_global) / (v_cap * v_cap * k_global) : 0;
          const exp_2aL = Math.exp(-2 * alpha * length);
          const den_re = 1 + R * exp_2aL * Math.cos(2 * k_global * length);
          const den_im = -R * exp_2aL * Math.sin(2 * k_global * length);
          const den_mag2 = den_re * den_re + den_im * den_im;

          const getComplexY = (x: number) => {
            const exp_ax = Math.exp(-alpha * x);
            const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
            const nr = exp_ax * Math.cos(k_global * x) + R * exp_a2Lx * Math.cos(k_global * (2 * length - x));
            const ni = -exp_ax * Math.sin(k_global * x) - R * exp_a2Lx * Math.sin(k_global * (2 * length - x));
            return { re: (nr * den_re + ni * den_im) / den_mag2, im: (ni * den_re - nr * den_im) / den_mag2 };
          };

          y_SI    = (x) => { const Y = getComplexY(x); return amplitude * (Y.re * Math.cos(omega_global * t_vis) - Y.im * Math.sin(omega_global * t_vis)); };
          dydt_SI = (x) => { const Y = getComplexY(x); return -omega_global * amplitude * (Y.re * Math.sin(omega_global * t_vis) + Y.im * Math.cos(omega_global * t_vis)); };
          dydx_SI = (x) => {
            const exp_ax = Math.exp(-alpha * x);
            const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
            const tr = -exp_ax * Math.cos(k_global * x) + R * exp_a2Lx * Math.cos(k_global * (2 * length - x));
            const ti = exp_ax * Math.sin(k_global * x) - R * exp_a2Lx * Math.sin(k_global * (2 * length - x));
            const npr = alpha * tr - k_global * ti, npi = alpha * ti + k_global * tr;
            const Ypr = (npr * den_re + npi * den_im) / den_mag2;
            const Ypi = (npi * den_re - npr * den_im) / den_mag2;
            return amplitude * (Ypr * Math.cos(omega_global * t_vis) - Ypi * Math.sin(omega_global * t_vis));
          };
          y1_fn = (x) => y_SI(x) / 2;
          y2_fn = (x) => y_SI(x) / 2;
        }
      } else {
        // Numerical solver interpolation
        const yNum = yNumRef.current;
        const yPrev = yPrevRef.current;
        const M = numGridSize;
        const dtLast = dtLastRef.current;

        y_SI = (x) => {
          const ir = (x / length) * (M - 1);
          const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
          return yNum[il] * (1 - (ir - il)) + yNum[ih] * (ir - il);
        };
        dydt_SI = (x) => {
          const ir = (x / length) * (M - 1);
          const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
          const w = ir - il;
          const y_now = yNum[il] * (1 - w) + yNum[ih] * w;
          const y_prev_val = yPrev[il] * (1 - w) + yPrev[ih] * w;
          return (y_now - y_prev_val) / Math.max(dtLast, 1e-8);
        };
        dydx_SI = (x) => {
          const ir = (x / length) * (M - 1);
          const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
          const dx_num = length / (M - 1);
          return (yNum[ih] - yNum[il]) / Math.max(1e-8, (ih - il) * dx_num);
        };
        y1_fn = (x) => y_SI(x) / 2;
        y2_fn = (x) => y_SI(x) / 2;
      }

      // ── Superposition: add second harmonic if enabled ─────────────────────
      const y_net: (x: number) => number = showSuperposition && !isDriven && solverType === "analytical"
        ? (x) => {
            const k2 = (harmonic2 * Math.PI) / length;
            const omega2 = k2 * v_cap;
            const decayEnv2 = Math.exp(-beta * t_vis);
            return y_SI(x) + amplitude2 * decayEnv2 * Math.sin(k2 * x) * Math.cos(omega2 * t_vis);
          }
        : y_SI;

      // ────────────────────────────────────────────────────────────────────
      //  §2  ENERGY DENSITY (SI: J/m)
      //  u_K = ½μ(∂y/∂t_vis)²   [J/m]  — kinetic energy density
      //  u_P = ½T(∂y/∂x)²       [J/m]  — potential (elastic) energy density
      //  u   = u_K + u_P         [J/m]  — total energy density
      //  E_total = ∫₀ᴸ u dx      [J]    — total stored energy
      //  Theory: E = ¼μω²A²L exp(-2βt)  →  dE/dt = -2β·E
      // ────────────────────────────────────────────────────────────────────
      const uK_fn = (x: number): number => 0.5 * mu * dydt_SI(x) ** 2;
      const uP_fn = (x: number): number => 0.5 * T * dydx_SI(x) ** 2;
      const u_fn  = (x: number): number => uK_fn(x) + uP_fn(x);

      // Total energy (trapezoidal integration over string)
      let E_total_SI = 0;
      if (systemType === "string") {
        const nInt = 200, dxInt = length / nInt;
        for (let i = 0; i <= nInt; i++) {
          const w = (i === 0 || i === nInt) ? 0.5 : 1.0;
          E_total_SI += w * u_fn(i * dxInt) * dxInt;
        }
      }

      // Theoretical energy (light-damping approximation, harmonic mode)
      const E_theory = 0.25 * mu * omega_global * omega_global * amplitude * amplitude *
                       decayEnv * decayEnv * length;

      // Conservation diagnostic: relative error |E_num - E_theory| / E_theory
      const E_rel_err = E_theory > 1e-30
        ? Math.abs(E_total_SI - E_theory) / E_theory
        : 0;

      // Track energy history for dE/dt measurement
      if (isPlaying && systemType === "string" && !isDriven) {
        const hist = energyHistRef.current;
        hist.push({ t: t_vis, E: E_total_SI });
        if (hist.length > 120) hist.shift();
      }

      // ── Numerical solver step ─────────────────────────────────────────────
      if (isPlaying && solverType === "numerical" && systemType !== "membrane") {
        const M = numGridSize;
        const dx = length / (M - 1);
        const yArr = yNumRef.current;
        const yPrev = yPrevRef.current;

        const r_target = 0.8;
        const dt_stable = r_target * dx / v_cap;
        // Use simulation time step (wall time × slowMotionFactor)
        const dt_sim = dt_frame * slowMotionFactor;
        const numSteps = Math.min(100, Math.ceil(dt_sim / dt_stable));
        const dt = dt_sim / numSteps;
        dtLastRef.current = dt;

        for (let step = 0; step < numSteps; step++) {
          timeNumRef.current += dt;
          const t_num = timeNumRef.current;
          const y_next = new Float32Array(M);
          const r = v_cap * dt / dx;
          const betaNum = beta;

          for (let i = 1; i < M - 1; i++) {
            const laplacian = yArr[i + 1] - 2 * yArr[i] + yArr[i - 1];
            y_next[i] = (2 * yArr[i] - yPrev[i] * (1 - betaNum * dt) + r * r * laplacian) / (1 + betaNum * dt);
          }

          // Left boundary
          if (isDriven) {
            y_next[0] = amplitude * Math.sin(2 * Math.PI * drivingFrequency * t_num);
          } else {
            if (boundaryType.startsWith("Fixed")) {
              y_next[0] = 0;
            } else {
              // Free left: ∂y/∂x = 0 → Neumann condition via ghost node
              y_next[0] = (2 * yArr[0] - yPrev[0] * (1 - betaNum * dt) + 2 * r * r * (yArr[1] - yArr[0])) / (1 + betaNum * dt);
            }
          }

          // Right boundary
          if (boundaryType === "Fixed-Fixed") {
            y_next[M - 1] = 0;
          } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
            // Free right: Neumann ∂y/∂x = 0
            y_next[M - 1] = (2 * yArr[M - 1] - yPrev[M - 1] * (1 - betaNum * dt) + 2 * r * r * (yArr[M - 2] - yArr[M - 1])) / (1 + betaNum * dt);
          } else if (boundaryType === "Partially Reflective") {
            if (Z2 > 1000) {
              y_next[M - 1] = 0;
            } else {
              const gamma = Z2 * dx / (T * dt);
              const denom = 1 + betaNum * dt + 2 * r * r * gamma;
              y_next[M - 1] = (2 * (1 - r * r) * yArr[M - 1] - (1 - betaNum * dt - 2 * r * r * gamma) * yPrev[M - 1] + 2 * r * r * yArr[M - 2]) / denom;
            }
          }
          yPrev.set(yArr);
          yArr.set(y_next);
        }

        // L2 error vs analytical (harmonic mode only)
        if (!isDriven) {
          let err2 = 0;
          const k_a = boundaryType === "Fixed-Free"
            ? ((n_eff * Math.PI) / (2 * length))
            : ((n_eff * Math.PI) / length);
          const omega_a = k_a * v_cap;
          const env_a = Math.exp(-beta * timeNumRef.current);
          for (let i = 0; i < M; i++) {
            const x = (i / (M - 1)) * length;
            const y_an = amplitude * env_a * (isFreeLeft ? Math.cos(k_a * x) : Math.sin(k_a * x)) * Math.cos(omega_a * t_vis);
            err2 += (yNumRef.current[i] - y_an) ** 2;
          }
          l2ErrorRef.current = Math.sqrt(err2 / M);
        }
      }

      // ── Oscilloscope: push current probe displacement ─────────────────────
      if (isPlaying && systemType === "string") {
        const y_probe = y_net(probeX);
        const oscBuf = oscBufferRef.current;
        oscBuf.push({ t: t_vis, y: y_probe });
        if (oscBuf.length > 400) oscBuf.shift();
      }

      // ═══════════════════════════════════════════════════════════════════════
      //  RENDER: STRING MODULE
      // ═══════════════════════════════════════════════════════════════════════
      if (systemType === "string") {
        const isScientific = renderMode === "Scientific";
        const isEnergyMode = renderMode === "Energy";
        const PAD_L = 60, PAD_R = 60;
        const stripeW = W - PAD_L - PAD_R;
        const centerY = H / 2;

        // ── Calibrated X axis with SI tick marks ─────────────────────────
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD_L, centerY);
        ctx.lineTo(W - PAD_R, centerY);
        ctx.stroke();

        // X tick marks every 0.1 m (or 0.25 m for long strings)
        const tickSpacingM = length > 4 ? 0.5 : length > 2 ? 0.25 : 0.1;
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        for (let xm = 0; xm <= length + 1e-9; xm += tickSpacingM) {
          const px = PAD_L + (xm / length) * stripeW;
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, centerY - 4); ctx.lineTo(px, centerY + 4);
          ctx.stroke();
          ctx.fillText(`${xm.toFixed(2)}`, px, centerY + 14);
        }
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "8px monospace";
        ctx.textAlign = "right";
        ctx.fillText("x (m)", W - PAD_R + 30, centerY + 14);

        // Y axis (left side) with amplitude scale reference
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.textAlign = "right";
        ctx.font = "8px monospace";
        // +A₀ label
        ctx.fillText(`+${amplitude.toFixed(3)} m`, PAD_L - 6, centerY - A_px + 4);
        // -A₀ label
        ctx.fillText(`-${amplitude.toFixed(3)} m`, PAD_L - 6, centerY + A_px + 4);
        // Origin
        ctx.fillText("0 m", PAD_L - 6, centerY + 4);

        // Y scale bar (thin vertical line on left)
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD_L - 18, centerY - A_px);
        ctx.lineTo(PAD_L - 18, centerY + A_px);
        ctx.stroke();
        // Half ticks
        ctx.beginPath();
        ctx.moveTo(PAD_L - 22, centerY - A_px); ctx.lineTo(PAD_L - 14, centerY - A_px);
        ctx.moveTo(PAD_L - 22, centerY);        ctx.lineTo(PAD_L - 14, centerY);
        ctx.moveTo(PAD_L - 22, centerY + A_px); ctx.lineTo(PAD_L - 14, centerY + A_px);
        ctx.stroke();

        // ── Decay envelope visualization ──────────────────────────────────
        //  The decay bounds |y| ≤ A₀·exp(-β·t_vis) are drawn as shaded region
        if (!isDriven && solverType === "analytical" && beta > 0) {
          const A_env_px = A_px * decayEnv;
          ctx.strokeStyle = "rgba(245,158,11,0.35)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          for (let px = PAD_L; px <= W - PAD_R; px++) {
            const x = ((px - PAD_L) / stripeW) * length;
            const env_mag = amplitude * decayEnv * Math.abs(isFreeLeft ? Math.cos(k_global * x) : Math.sin(k_global * x));
            if (px === PAD_L) {
              ctx.moveTo(px, centerY - env_mag * pixPerMeter);
            } else {
              ctx.lineTo(px, centerY - env_mag * pixPerMeter);
            }
          }
          ctx.stroke();
          ctx.beginPath();
          for (let px = PAD_L; px <= W - PAD_R; px++) {
            const x = ((px - PAD_L) / stripeW) * length;
            const env_mag = amplitude * decayEnv * Math.abs(isFreeLeft ? Math.cos(k_global * x) : Math.sin(k_global * x));
            if (px === PAD_L) {
              ctx.moveTo(px, centerY + env_mag * pixPerMeter);
            } else {
              ctx.lineTo(px, centerY + env_mag * pixPerMeter);
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // ── Energy density mode ───────────────────────────────────────────
        if (isEnergyMode) {
          // u_max for vertical scaling
          const omega_sq = omega_global > 0 ? omega_global * omega_global : 1;
          const k_sq = k_global > 0 ? k_global * k_global : 1;
          const u_ref = Math.max(
            0.5 * mu * (amplitude * omega_sq) * amplitude,
            0.5 * T * (amplitude * k_sq) * amplitude,
            1e-20
          );
          const energyPixScale = (H * 0.28) / u_ref;

          if (energyMode === "KE" || energyMode === "Total" || energyMode === "TimeAvg") {
            ctx.strokeStyle = "rgba(16,185,129,0.75)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let px = PAD_L; px <= W - PAD_R; px++) {
              const x = ((px - PAD_L) / stripeW) * length;
              const py = centerY - uK_fn(x) * energyPixScale;
              px === PAD_L ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          if (energyMode === "PE" || energyMode === "Total" || energyMode === "TimeAvg") {
            ctx.strokeStyle = "rgba(249,115,22,0.75)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let px = PAD_L; px <= W - PAD_R; px++) {
              const x = ((px - PAD_L) / stripeW) * length;
              const py = centerY - uP_fn(x) * energyPixScale;
              px === PAD_L ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Total energy density
          ctx.strokeStyle = "#d946ef";
          ctx.lineWidth = 3;
          ctx.shadowColor = "rgba(217,70,239,0.4)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          const ePts: [number, number][] = [];
          for (let px = PAD_L; px <= W - PAD_R; px++) {
            const x = ((px - PAD_L) / stripeW) * length;
            const E = u_fn(x);
            const py = centerY - E * energyPixScale;
            ePts.push([px, py]);
            px === PAD_L ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Fill under total energy
          ctx.fillStyle = "rgba(217,70,239,0.06)";
          ctx.beginPath();
          ctx.moveTo(PAD_L, centerY);
          for (const pt of ePts) ctx.lineTo(pt[0], pt[1]);
          ctx.lineTo(W - PAD_R, centerY);
          ctx.closePath();
          ctx.fill();

          // Labels with SI units
          ctx.font = "9px monospace";
          ctx.fillStyle = "rgba(16,185,129,0.9)";
          ctx.textAlign = "left";
          ctx.fillText("─ ─  u_K = ½μ(∂y/∂t)²  [J/m]", PAD_L + 8, 36);
          ctx.fillStyle = "rgba(249,115,22,0.9)";
          ctx.fillText("─ ─  u_P = ½T(∂y/∂x)²  [J/m]", PAD_L + 8, 50);
          ctx.fillStyle = "#d946ef";
          ctx.fillText(`——  u = u_K + u_P  (Total)  E_total = ${E_total_SI.toExponential(3)} J`, PAD_L + 8, 64);
          ctx.fillStyle = "rgba(255,255,255,0.20)";
          ctx.font = "8px monospace";
          ctx.fillText("Note: Standing waves have ZERO net energy flux (Poynting vector = 0 on average). KE ↔ PE exchange is local.", PAD_L + 8, H - 20);
          ctx.fillStyle = E_rel_err < 0.05 ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)";
          ctx.fillText(`E_theory = ${E_theory.toExponential(3)} J  |  rel err = ${(E_rel_err * 100).toFixed(2)}%`, PAD_L + 8, H - 8);

        } else {
          // ── Displacement / Phase / Scientific rendering ─────────────────

          // Component traveling waves
          if (showComponents && solverType === "analytical" && !isEnergyMode) {
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(34,211,238,0.40)";
            ctx.beginPath();
            for (let px = PAD_L; px <= W - PAD_R; px++) {
              const x = ((px - PAD_L) / stripeW) * length;
              const py = centerY - y1_fn(x) * pixPerMeter;
              px === PAD_L ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.strokeStyle = "rgba(244,63,94,0.40)";
            ctx.beginPath();
            for (let px = PAD_L; px <= W - PAD_R; px++) {
              const x = ((px - PAD_L) / stripeW) * length;
              const py = centerY - y2_fn(x) * pixPerMeter;
              px === PAD_L ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Labels for traveling components
            ctx.font = "8px monospace";
            ctx.fillStyle = "rgba(34,211,238,0.8)";
            ctx.textAlign = "left";
            ctx.fillText("→  y₊ = ½A·sin(kx − ωt_vis)", PAD_L + 8, 30);
            ctx.fillStyle = "rgba(244,63,94,0.8)";
            ctx.fillText("←  y₋ = ½A·sin(kx + ωt_vis)", PAD_L + 8, 44);
          }

          if (discreteBeads) {
            // ── Discrete bead-spring model ──────────────────────────────────
            const M = numGridSize;
            const beadCoords: [number, number][] = [];
            for (let i = 0; i < M; i++) {
              const x_m = (i / (M - 1)) * length;
              const px = PAD_L + (i / (M - 1)) * stripeW;
              const py = centerY - y_net(x_m) * pixPerMeter;
              beadCoords.push([px, py]);
            }
            for (let i = 0; i < M - 1; i++) drawSpring(ctx, beadCoords[i][0], beadCoords[i][1], beadCoords[i + 1][0], beadCoords[i + 1][1]);

            for (let i = 0; i < M; i++) {
              ctx.beginPath();
              if (i === 0 && isDriven) ctx.fillStyle = "#38bdf8";
              else if ((i === 0 || i === M - 1) && boundaryType.startsWith("Fixed")) ctx.fillStyle = "#ef4444";
              else ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "rgba(0,0,0,0.5)";
              ctx.arc(beadCoords[i][0], beadCoords[i][1], 6.5, 0, Math.PI * 2);
              ctx.fill(); ctx.stroke();
            }
          } else if (showEnergyHeatmap && !isEnergyMode) {
            // ── Energy heatmap coloring on string ──────────────────────────
            const omega_sq_hm = omega_global > 0 ? omega_global * omega_global : 1;
            const k_sq_hm = k_global > 0 ? k_global * k_global : 1;
            const u_max_hm = Math.max(
              0.5 * mu * amplitude * amplitude * omega_sq_hm,
              0.5 * T * amplitude * amplitude * k_sq_hm,
              1e-20
            );
            for (let px = PAD_L; px < W - PAD_R; px++) {
              const x = ((px - PAD_L) / stripeW) * length;
              const x_next = ((px - PAD_L + 1) / stripeW) * length;
              const py1 = centerY - y_net(x) * pixPerMeter;
              const py2 = centerY - y_net(x_next) * pixPerMeter;
              const E_local = u_fn(x);
              const t_norm = Math.min(1, E_local / u_max_hm);
              // Hue: 217 (blue-purple) → 168 (green) by energy level
              const r = Math.round(217 * t_norm + 16 * (1 - t_norm));
              const g = Math.round(70 * t_norm + 185 * (1 - t_norm));
              const b = Math.round(239 * t_norm + 129 * (1 - t_norm));
              ctx.strokeStyle = `rgb(${r},${g},${b})`;
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.moveTo(px, py1); ctx.lineTo(px + 1, py2);
              ctx.stroke();
            }
          } else {
            // ── Standard wave rendering ─────────────────────────────────────
            if (renderMode === "Phase") {
              // §6 Per-point BINARY phase coloring based on sign of sin(kx)
              // Standing wave: y = A·sin(kx)·cos(ωt)
              // sin(kx) > 0 → same phase as cos(ωt) → CYAN
              // sin(kx) < 0 → anti-phase            → ROSE
              for (let px = PAD_L; px < W - PAD_R; px++) {
                const x = ((px - PAD_L) / stripeW) * length;
                const x_next = ((px - PAD_L + 1) / stripeW) * length;
                const py1 = centerY - y_net(x) * pixPerMeter;
                const py2 = centerY - y_net(x_next) * pixPerMeter;
                const spatialSign = isFreeLeft ? Math.cos(k_global * x) : Math.sin(k_global * x);
                const isPositivePhase = spatialSign > 0.05;
                const isNegativePhase = spatialSign < -0.05;
                ctx.strokeStyle = isPositivePhase
                  ? "rgba(56,189,248,0.95)"   // cyan: in-phase
                  : isNegativePhase
                    ? "rgba(244,63,94,0.95)"  // rose: anti-phase (π shift)
                    : "rgba(180,180,180,0.5)"; // gray: near-node
                ctx.lineWidth = 4.5;
                ctx.shadowColor = "rgba(56,189,248,0.3)";
                ctx.shadowBlur = isPositivePhase ? 8 : 0;
                ctx.beginPath();
                ctx.moveTo(px, py1); ctx.lineTo(px + 1, py2);
                ctx.stroke();
              }
              ctx.shadowBlur = 0;

              // Phase legend
              ctx.font = "8px monospace";
              ctx.fillStyle = "rgba(56,189,248,0.9)"; ctx.textAlign = "left";
              ctx.fillText("■ Positive phase (φ = 0)", PAD_L + 8, 30);
              ctx.fillStyle = "rgba(244,63,94,0.9)";
              ctx.fillText("■ Negative phase (φ = π, anti-phase across node)", PAD_L + 8, 44);
              ctx.fillStyle = "rgba(180,180,180,0.6)";
              ctx.fillText("▪ Node transition (|sin(kx)| < 0.05)", PAD_L + 8, 58);
            } else {
              // Displacement or Scientific: single-color wave
              ctx.beginPath();
              for (let px = PAD_L; px <= W - PAD_R; px++) {
                const x = ((px - PAD_L) / stripeW) * length;
                const py = centerY - y_net(x) * pixPerMeter;
                px === PAD_L ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
              }
              ctx.lineWidth = isScientific ? 2.0 : 4.5;
              if (renderMode === "Displacement") {
                ctx.strokeStyle = "#ffffff";
                ctx.shadowColor = "rgba(255,255,255,0.25)";
                ctx.shadowBlur = isScientific ? 0 : 10;
              } else {
                // Scientific: clean, no glow
                ctx.strokeStyle = "rgba(200,220,255,0.9)";
                ctx.shadowBlur = 0;
              }
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }

          // ── Node / Antinode markers ──────────────────────────────────────
          const nodes: number[] = [];
          const antinodes: number[] = [];

          if (solverType === "analytical" && !isDriven) {
            const lam = k_global > 0 ? (2 * Math.PI) / k_global : 0;
            if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
              for (let m = 0; m <= n_eff; m++) {
                const xn = m * lam / 2;
                if (xn >= -1e-4 && xn <= length + 1e-4) nodes.push(Math.max(0, Math.min(length, xn)));
              }
              for (let m = 0; m < n_eff; m++) {
                const xa = (2 * m + 1) * lam / 4;
                if (xa > 0 && xa < length) antinodes.push(xa);
              }
            } else if (boundaryType === "Free-Free") {
              for (let m = 0; m <= n_eff; m++) {
                const xa = m * lam / 2;
                if (xa >= -1e-4 && xa <= length + 1e-4) antinodes.push(Math.max(0, Math.min(length, xa)));
              }
              for (let m = 0; m < n_eff; m++) {
                const xn = (2 * m + 1) * lam / 4;
                if (xn > 0 && xn < length) nodes.push(xn);
              }
            } else if (boundaryType === "Fixed-Free") {
              for (let m = 0; m * lam / 2 <= length + 1e-4; m++) {
                const xn = m * lam / 2;
                if (xn >= -1e-4) nodes.push(Math.max(0, xn));
              }
              for (let m = 0; (2 * m + 1) * lam / 4 <= length; m++) {
                antinodes.push((2 * m + 1) * lam / 4);
              }
            }
          } else if (solverType === "numerical" && !isDriven) {
            const activeH2 = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
            const lam_num = boundaryType === "Fixed-Free" ? (4 * length / activeH2) : (2 * length / activeH2);
            if (boundaryType === "Free-Free") {
              for (let m = 0; m <= activeH2; m++) antinodes.push(m * lam_num / 2);
              for (let m = 0; m < activeH2; m++) nodes.push((2 * m + 1) * lam_num / 4);
            } else if (boundaryType === "Fixed-Free") {
              for (let m = 0; m * lam_num / 2 <= length + 1e-4; m++) nodes.push(m * lam_num / 2);
              for (let m = 0; (2 * m + 1) * lam_num / 4 <= length; m++) antinodes.push((2 * m + 1) * lam_num / 4);
            } else {
              for (let m = 0; m <= activeH2; m++) nodes.push(m * lam_num / 2);
              for (let m = 0; m < activeH2; m++) antinodes.push((2 * m + 1) * lam_num / 4);
            }
          } else if (isDriven && k_global > 0) {
            const phi_R = R < 0 ? Math.PI : 0;
            for (let m = 0; m < 12; m++) {
              const x = length - ((2 * m + 1) * Math.PI + phi_R) / (2 * k_global);
              if (x >= -0.01 && x <= length + 0.01) nodes.push(x);
            }
            for (let m = 0; m < 12; m++) {
              const x = length - (2 * m * Math.PI + phi_R) / (2 * k_global);
              if (x >= -0.01 && x <= length + 0.01) antinodes.push(x);
            }
          }

          // Draw nodes
          if (showNodes) {
            nodes.forEach((xn, idx) => {
              const px_n = PAD_L + (xn / length) * stripeW;
              ctx.fillStyle = isScientific ? "#ffffff" : "#ef4444";
              ctx.beginPath();
              ctx.arc(px_n, centerY, 6, 0, Math.PI * 2);
              ctx.fill();

              if (!isScientific) {
                ctx.fillStyle = "rgba(239,68,68,0.12)";
                ctx.beginPath();
                ctx.arc(px_n, centerY, 14, 0, Math.PI * 2);
                ctx.fill();
              }

              // Node position label
              ctx.fillStyle = "rgba(239,68,68,0.85)";
              ctx.font = "bold 7.5px monospace";
              ctx.textAlign = "center";
              ctx.fillText(`N${idx}`, px_n, centerY - 20);
              ctx.fillStyle = "rgba(239,68,68,0.55)";
              ctx.fillText(`${xn.toFixed(3)}m`, px_n, centerY - 10);

              // Phase inversion label at internal nodes
              if (idx > 0 && idx < nodes.length) {
                ctx.fillStyle = "rgba(255,165,0,0.75)";
                ctx.font = "bold 9px monospace";
                ctx.fillText("π", px_n + 14, centerY - 20);
              }
            });
          }

          // Draw antinodes with oscillation arrows
          if (showAntinodes) {
            antinodes.forEach((xa, idx) => {
              const px_a = PAD_L + (xa / length) * stripeW;
              ctx.fillStyle = isScientific ? "#ffffff" : "#10b981";
              ctx.beginPath();
              ctx.arc(px_a, centerY, 6, 0, Math.PI * 2);
              ctx.fill();

              // Direction arrow from current instantaneous displacement
              const curDisp = y_net(xa) * pixPerMeter;
              const direction = curDisp > 3 ? 1 : curDisp < -3 ? -1 : 0;
              if (direction !== 0 && !isScientific) {
                const arrowColor = direction > 0 ? "#10b981" : "#f43f5e";
                ctx.strokeStyle = arrowColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px_a, centerY);
                ctx.lineTo(px_a, centerY - direction * 36);
                ctx.stroke();
                ctx.fillStyle = arrowColor;
                ctx.beginPath();
                ctx.moveTo(px_a - 5, centerY - direction * 29);
                ctx.lineTo(px_a + 5, centerY - direction * 29);
                ctx.lineTo(px_a, centerY - direction * 38);
                ctx.fill();
              }

              // Antinode position label
              ctx.fillStyle = "rgba(16,185,129,0.80)";
              ctx.font = "bold 7.5px monospace";
              ctx.textAlign = "center";
              ctx.fillText(`A${idx + 1}`, px_a, centerY + 22);
              ctx.fillStyle = "rgba(16,185,129,0.50)";
              ctx.fillText(`${xa.toFixed(3)}m`, px_a, centerY + 32);
            });
          }
        }

        // ── Boundary condition decorations ────────────────────────────────
        ctx.textAlign = "left";
        if (isDriven) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(PAD_L - 6, centerY - 25, 6, 50);
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 8px monospace";
          ctx.fillText(`DRIVER  f_d = ${drivingFrequency.toFixed(1)} Hz`, PAD_L + 4, centerY - 28);
        } else {
          if (boundaryType.startsWith("Fixed")) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(PAD_L - 6, centerY - 25, 6, 50);
            ctx.fillStyle = "rgba(239,68,68,0.80)";
            ctx.font = "bold 8px monospace";
            ctx.fillText("FIXED  (y=0, π-shift)", PAD_L + 4, centerY - 28);
          } else {
            ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(PAD_L, centerY, 7, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = "rgba(56,189,248,0.80)";
            ctx.font = "bold 8px monospace";
            ctx.fillText("FREE  (∂y/∂x=0, no shift)", PAD_L + 12, centerY - 28);
          }
        }

        if (boundaryType === "Fixed-Fixed") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(W - PAD_R, centerY - 25, 6, 50);
          ctx.fillStyle = "rgba(239,68,68,0.80)";
          ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
          ctx.fillText("FIXED  (y=0, π-shift)", W - PAD_R - 4, centerY - 28);
        } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
          ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(W - PAD_R, centerY, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = "rgba(56,189,248,0.80)";
          ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
          ctx.fillText("FREE  (∂y/∂x=0)", W - PAD_R - 12, centerY - 28);
        } else if (boundaryType === "Partially Reflective") {
          const R_frac = R * R, T_frac = 1 - R_frac;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(W - PAD_R - 3, centerY - 25, 3, 50);
          if (T_frac > 0.01) {
            ctx.fillStyle = `rgba(245,158,11,${Math.min(0.8, T_frac * 1.5)})`;
            ctx.fillRect(W - PAD_R, centerY - 20, 12, 40);
            ctx.fillStyle = "rgba(245,158,11,0.8)";
            ctx.font = "bold 7px monospace"; ctx.textAlign = "left";
            ctx.fillText("LEAK", W - PAD_R + 2, centerY - 24);
          }
          ctx.fillStyle = "rgba(217,70,239,0.90)";
          ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
          ctx.fillText(`R=${R.toFixed(3)}  |R|²=${R_frac.toFixed(3)}  T=${T_coeff.toFixed(3)}`, W - PAD_R - 4, centerY - 28);
        }
        ctx.textAlign = "left";

        // ── Governing equation label ──────────────────────────────────────
        const eqStr = isDriven
          ? `y(x,t) = Re[Y(x)·e^{iωt}]  f_d=${drivingFrequency.toFixed(1)}Hz`
          : `y(x,t) = A₀·e^{-β·t_vis}·${isFreeLeft ? "cos" : "sin"}(${k_global.toFixed(3)}x)·cos(${omega_global.toFixed(2)}t_vis)`;
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(eqStr, W / 2, H - 52);
        ctx.fillText(`t_vis = ${t_vis.toFixed(3)} s  |  τ_scale = ${slowMotionFactor}×  |  v = ${v_cap.toFixed(2)} m/s`, W / 2, H - 40);

        // ── Phasor widget at probe position ───────────────────────────────
        if (!isDriven && solverType === "analytical" && systemType === "string") {
          const probePxX = PAD_L + (probeX / length) * stripeW;
          const phasorCX = probePxX;
          const phasorCY = H - 85;
          const phasorR = 20;
          const phase = omega_global * t_vis;

          // Phasor circle background
          ctx.fillStyle = "rgba(10,10,12,0.80)";
          ctx.strokeStyle = "rgba(217,70,239,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(phasorCX, phasorCY, phasorR + 6, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();

          // Phasor circle
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(phasorCX, phasorCY, phasorR, 0, Math.PI * 2);
          ctx.stroke();

          // Rotating phasor arm
          const spatialFactor = isFreeLeft ? Math.cos(k_global * probeX) : Math.sin(k_global * probeX);
          const phasorLen = phasorR * Math.abs(spatialFactor) * decayEnv;
          ctx.strokeStyle = "#d946ef";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(phasorCX, phasorCY);
          ctx.lineTo(phasorCX + phasorLen * Math.cos(-phase), phasorCY + phasorLen * Math.sin(-phase));
          ctx.stroke();

          // Projection onto real axis (= current displacement)
          const projX = phasorCX + phasorLen * Math.cos(-phase);
          ctx.strokeStyle = "rgba(217,70,239,0.5)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(projX, phasorCY);
          ctx.lineTo(projX, phasorCY + phasorR + 6);
          ctx.stroke();
          ctx.setLineDash([]);

          // Phase label
          ctx.fillStyle = "#d946ef";
          ctx.font = "7px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`φ=${(phase % (2 * Math.PI)).toFixed(2)}rad`, phasorCX, phasorCY + phasorR + 20);
          ctx.fillText(`PHASOR @ x=${probeX.toFixed(2)}m`, phasorCX, phasorCY - phasorR - 10);
        }

        // ── Oscilloscope strip ────────────────────────────────────────────
        const oscBuf = oscBufferRef.current;
        if (oscBuf.length > 2 && !isDriven) {
          const oscX = W - 200, oscY = H - 90, oscW = 170, oscH = 70;

          ctx.fillStyle = "rgba(8,8,12,0.88)";
          ctx.strokeStyle = "rgba(16,185,129,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(oscX, oscY, oscW, oscH, 10);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.font = "bold 7px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`OSCILLOSCOPE  x=${probeX.toFixed(2)}m`, oscX + 8, oscY + 14);
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillText(`y ∈ [−${amplitude.toFixed(3)}, +${amplitude.toFixed(3)}] m`, oscX + 8, oscY + 24);

          // Center line
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(oscX + 8, oscY + oscH / 2 + 8);
          ctx.lineTo(oscX + oscW - 8, oscY + oscH / 2 + 8);
          ctx.stroke();

          // Waveform
          const plotH = oscH - 30;
          const plotW = oscW - 16;
          const maxY_osc = Math.max(amplitude * 0.01, amplitude);

          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const len_osc = oscBuf.length;
          for (let i = 0; i < len_osc; i++) {
            const fx = oscX + 8 + (i / Math.max(1, len_osc - 1)) * plotW;
            const fy = oscY + 36 + plotH / 2 - (oscBuf[i].y / maxY_osc) * (plotH / 2 - 2);
            i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
          }
          ctx.stroke();

          // Current value dot
          const lastY = oscBuf[oscBuf.length - 1]?.y ?? 0;
          const dotX = oscX + oscW - 8;
          const dotY = oscY + 36 + plotH / 2 - (lastY / maxY_osc) * (plotH / 2 - 2);
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // ── Scientific annotation panel (top-left) ────────────────────────
        if (isScientific) {
          const annX = PAD_L + 4, annY = 18;
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.font = "7.5px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`v = √(T/μ) = √(${T}/${mu}) = ${v_cap.toFixed(2)} m/s`, annX, annY);
          ctx.fillText(`k = ${n_eff}π/L = ${k_global.toFixed(4)} rad/m`, annX, annY + 12);
          ctx.fillText(`ω = kv = ${omega_global.toFixed(3)} rad/s`, annX, annY + 24);
          ctx.fillText(`f = ω/2π = ${(omega_global / (2 * Math.PI)).toFixed(3)} Hz`, annX, annY + 36);
          ctx.fillText(`λ = 2π/k = ${lambda_global.toFixed(4)} m`, annX, annY + 48);
          ctx.fillText(`Q = ω/(2β) = ${beta > 0 ? (omega_global / (2 * beta)).toFixed(1) : "∞"}`, annX, annY + 60);
          ctx.fillText(`τ_vis = ${beta > 0 ? (1 / beta).toFixed(3) : "∞"} s  (sim time to 1/e)`, annX, annY + 72);
          ctx.fillText(`E_total = ${E_total_SI.toExponential(3)} J`, annX, annY + 84);
          ctx.fillText(`Z = √(Tμ) = ${Z1.toFixed(4)} kg/s`, annX, annY + 96);
        }

      } else if (systemType === "air") {
        // ═══════════════════════════════════════════════════════════════════
        //  RENDER: AIR COLUMN MODULE
        //  Physical acoustic conventions:
        //  Fixed end (closed) = displacement node (s = 0)
        //  Free end  (open)   = displacement antinode (∂s/∂x = 0)
        //
        //  Displacement:
        //    Closed-Closed (Fixed-Fixed): s = A·sin(kx),  k = nπ/L
        //    Open-Open     (Free-Free):   s = A·cos(kx),  k = nπ/L
        //    Closed-Open   (Fixed-Free):  s = A·sin(kx),  k = (2n-1)π/(2L)
        //
        //  Pressure: p = -B·∂s/∂x  (90° out of phase with displacement)
        // ═══════════════════════════════════════════════════════════════════
        const pipeX = 100, pipeY = H / 2 - 60, pipeW = W - 200, pipeH = 120;
        const samples = 150;
        const dx_px = pipeW / samples;
        const A_air_px = amplitude * 35 * (visualAmplitudeFactor / 5);

        let k_air = 0, omega_air = 0;
        let s_disp: (x: number) => number;
        let p_press: (x: number) => number;
        let isClosedLeft = true, isClosedRight = false;

        if (solverType === "analytical") {
          if (boundaryType === "Fixed-Fixed") {
            // CLOSED-CLOSED: s = A·sin(kx), p ∝ -cos(kx)
            isClosedLeft = true; isClosedRight = true;
            k_air = (harmonic * Math.PI) / length;
            omega_air = k_air * v_cap;
            s_disp  = (x) => A_air_px * Math.sin(k_air * x) * Math.cos(omega_air * t_vis);
            p_press = (x) => -Math.cos(k_air * x) * Math.cos(omega_air * t_vis);
          } else if (boundaryType === "Free-Free") {
            // OPEN-OPEN: s = A·cos(kx), p ∝ sin(kx)
            isClosedLeft = false; isClosedRight = false;
            k_air = (harmonic * Math.PI) / length;
            omega_air = k_air * v_cap;
            s_disp  = (x) => A_air_px * Math.cos(k_air * x) * Math.cos(omega_air * t_vis);
            p_press = (x) => Math.sin(k_air * x) * Math.cos(omega_air * t_vis);
          } else if (boundaryType === "Fixed-Free") {
            // CLOSED-OPEN: s = A·sin(kx), odd harmonics only, k = (2n-1)π/(2L)
            isClosedLeft = true; isClosedRight = false;
            const oddH = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
            k_air = (oddH * Math.PI) / (2 * length);
            omega_air = k_air * v_cap;
            s_disp  = (x) => A_air_px * Math.sin(k_air * x) * Math.cos(omega_air * t_vis);
            p_press = (x) => -Math.cos(k_air * x) * Math.cos(omega_air * t_vis);
          } else {
            // Partially Reflective — use Fixed-Fixed formula as base
            isClosedLeft = true; isClosedRight = false;
            k_air = (harmonic * Math.PI) / length;
            omega_air = k_air * v_cap;
            s_disp  = (x) => A_air_px * Math.sin(k_air * x) * Math.cos(omega_air * t_vis);
            p_press = (x) => -Math.cos(k_air * x) * Math.cos(omega_air * t_vis);
          }
        } else {
          const yNum = yNumRef.current;
          const yPrev = yPrevRef.current;
          const M_air = numGridSize;
          s_disp  = (x) => {
            const ir = (x / length) * (M_air - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M_air - 1, Math.ceil(ir));
            return (yNum[il] * (1 - (ir - il)) + yNum[ih] * (ir - il)) * 35;
          };
          p_press = (x) => {
            const ir = (x / length) * (M_air - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M_air - 1, Math.ceil(ir));
            const dxN = length / (M_air - 1);
            return -(yNum[ih] - yNum[il]) / Math.max(1e-5, (ih - il) * dxN) * 1.5;
          };
          omega_air = omega_global;
          k_air = k_global;
          isClosedLeft = boundaryType.startsWith("Fixed");
          isClosedRight = boundaryType === "Fixed-Fixed";
        }

        // Pressure shading inside pipe
        for (let i = 0; i < samples; i++) {
          const px = pipeX + i * dx_px;
          const x = (i / samples) * length;
          const P = p_press(x);
          ctx.fillStyle = P > 0
            ? `rgba(239,68,68,${Math.min(0.65, P * 0.7)})`
            : `rgba(56,189,248,${Math.min(0.65, Math.abs(P) * 0.7)})`;
          ctx.fillRect(px, pipeY + 1, dx_px + 0.5, pipeH - 2);
        }

        // Air molecule particle animation
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        for (const p of airParticlesRef.current) {
          const s = s_disp(p.x0);
          const px = pipeX + (p.x0 / length) * pipeW + s;
          const py = pipeY + pipeH / 2 + p.y0;
          ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fill();
        }

        // Pipe walls
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(pipeX, pipeY); ctx.lineTo(pipeX + pipeW, pipeY);
        ctx.moveTo(pipeX, pipeY + pipeH); ctx.lineTo(pipeX + pipeW, pipeY + pipeH);
        ctx.stroke();

        // Closed end = solid wall, open end = open circle
        if (isClosedLeft) {
          ctx.beginPath(); ctx.moveTo(pipeX, pipeY); ctx.lineTo(pipeX, pipeY + pipeH); ctx.stroke();
          ctx.fillStyle = "rgba(239,68,68,0.7)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
          ctx.fillText("CLOSED  s=0  p=max", pipeX + 8, pipeY - 8);
        } else {
          ctx.fillStyle = "rgba(56,189,248,0.7)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
          ctx.fillText("OPEN  s=max  p=0", pipeX + 8, pipeY - 8);
        }
        if (isClosedRight) {
          ctx.beginPath(); ctx.moveTo(pipeX + pipeW, pipeY); ctx.lineTo(pipeX + pipeW, pipeY + pipeH); ctx.stroke();
          ctx.fillStyle = "rgba(239,68,68,0.7)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
          ctx.fillText("CLOSED  s=0  p=max", pipeX + pipeW - 8, pipeY - 8);
        } else {
          ctx.fillStyle = "rgba(56,189,248,0.7)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
          ctx.fillText("OPEN  s=max  p=0", pipeX + pipeW - 8, pipeY - 8);
        }

        // Displacement and pressure curves below pipe
        const curveY = H - 80;
        ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(pipeX, curveY); ctx.lineTo(pipeX + pipeW, curveY); ctx.stroke();
        ctx.setLineDash([]);

        // Displacement curve (cyan)
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = pipeX + (i / samples) * pipeW;
          const x = (i / samples) * length;
          const py = curveY - (s_disp(x) / Math.max(A_air_px, 0.1)) * 35;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Pressure curve (red)
        ctx.strokeStyle = "#ef4444";
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = pipeX + (i / samples) * pipeW;
          const x = (i / samples) * length;
          const py = curveY - p_press(x) * 35;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.font = "9px monospace"; ctx.textAlign = "left";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("—  Displacement s(x,t)  [normalized]", pipeX, H - 20);
        ctx.fillStyle = "#ef4444";
        ctx.fillText("—  Acoustic Pressure p = −B·∂s/∂x  [90° phase shift from s]", pipeX + 250, H - 20);

        // Acoustic parameters
        const B_bulk = density * v_cap * v_cap;  // Pa — bulk modulus B = ρv²
        ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "7.5px monospace";
        ctx.fillText(`v = ${v_cap.toFixed(1)} m/s  |  B = ρv² = ${B_bulk.toFixed(0)} Pa  |  k = ${k_air.toFixed(4)} rad/m  |  ω = ${omega_air.toFixed(2)} rad/s  |  f = ${(omega_air/(2*Math.PI)).toFixed(2)} Hz`, pipeX, pipeY - 22);

      } else if (systemType === "membrane") {
        // ═══════════════════════════════════════════════════════════════════
        //  RENDER: 2D MEMBRANE MODULE (Chladni patterns)
        // ═══════════════════════════════════════════════════════════════════
        const centerX = W / 2, centerY = H / 2;
        const Lx = 440, Ly = 360, radius = 220;
        const isRect = membraneGeometry === "rectangular";
        const k_mn = isRect ? 0 : (BESSEL_ZEROS[m2D]?.[n2D - 1] || 2.4048) / radius;
        const omega_mem = 4.0;

        if (!sandPattern) {
          const stepX = 12, stepY = 12;
          for (let x = -Lx / 2; x <= Lx / 2; x += stepX) {
            for (let y = -Ly / 2; y <= Ly / 2; y += stepY) {
              if (!isRect && (x * x + y * y) > radius * radius) continue;
              let z = 0;
              if (isRect) {
                const xn = (x + Lx / 2) / Lx, yn = (y + Ly / 2) / Ly;
                z = amplitude * Math.sin(m2D * Math.PI * xn) * Math.sin(n2D * Math.PI * yn) * Math.cos(omega_mem * t_vis);
              } else {
                const r = Math.sqrt(x * x + y * y), theta = Math.atan2(y, x);
                z = amplitude * besselJ(m2D, k_mn * r) * Math.cos(m2D * theta) * Math.cos(omega_mem * t_vis);
              }
              ctx.fillStyle = z > 0.01
                ? `rgba(239,68,68,${Math.min(0.85, z * 0.85)})`
                : z < -0.01
                  ? `rgba(56,189,248,${Math.min(0.85, Math.abs(z) * 0.85)})`
                  : "rgba(128,128,128,0.1)";
              ctx.fillRect(centerX + x - stepX / 2, centerY + y - stepY / 2, stepX, stepY);
            }
          }
        } else {
          if (isPlaying) {
            const particles = sandParticlesRef.current;
            const eps = 2.0;
            const calcAmp = (px: number, py: number) => {
              if (isRect) {
                if (Math.abs(px) > Lx / 2 || Math.abs(py) > Ly / 2) return 0;
                return amplitude * Math.sin(m2D * Math.PI * (px + Lx / 2) / Lx) * Math.sin(n2D * Math.PI * (py + Ly / 2) / Ly);
              } else {
                const r = Math.sqrt(px * px + py * py);
                if (r > radius) return 0;
                return amplitude * besselJ(m2D, k_mn * r) * Math.cos(m2D * Math.atan2(py, px));
              }
            };
            for (const p of particles) {
              const ac = Math.abs(calcAmp(p.x, p.y));
              const gradX = (Math.abs(calcAmp(p.x + eps, p.y)) - Math.abs(calcAmp(p.x - eps, p.y))) / (2 * eps);
              const gradY = (Math.abs(calcAmp(p.x, p.y + eps)) - Math.abs(calcAmp(p.x, p.y - eps))) / (2 * eps);
              if (ac > 0.03) { p.x += (Math.random() - 0.5) * ac * 5.2; p.y += (Math.random() - 0.5) * ac * 5.2; }
              p.x -= gradX * 10.0; p.y -= gradY * 10.0;
              if (isRect) {
                p.x = Math.max(-Lx / 2, Math.min(Lx / 2, p.x));
                p.y = Math.max(-Ly / 2, Math.min(Ly / 2, p.y));
              } else {
                const r = Math.sqrt(p.x * p.x + p.y * p.y);
                if (r > radius) { p.x *= (radius / r) * 0.99; p.y *= (radius / r) * 0.99; }
              }
            }
          }
          ctx.fillStyle = "rgba(245,158,11,0.75)";
          for (const p of sandParticlesRef.current) {
            ctx.beginPath(); ctx.arc(centerX + p.x, centerY + p.y, 1.4, 0, Math.PI * 2); ctx.fill();
          }
        }

        // Plate frame
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
        ctx.beginPath();
        if (isRect) ctx.rect(centerX - Lx / 2, centerY - Ly / 2, Lx, Ly);
        else ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "bold 10px monospace";
        if (isRect) ctx.fillText(`RECTANGULAR MODE (m=${m2D}, n=${n2D})  f ≈ ${(omega_global / (2 * Math.PI)).toFixed(2)} Hz`, centerX - Lx / 2, centerY - Ly / 2 - 10);
        else ctx.fillText(`CIRCULAR DRUMHEAD  (m=${m2D}, n=${n2D})  x_mn=${BESSEL_ZEROS[m2D]?.[n2D - 1]?.toFixed(4)}  f ≈ ${(omega_global / (2 * Math.PI)).toFixed(2)} Hz`, centerX - radius, centerY - radius - 10);
      }

      // ═══════════════════════════════════════════════════════════════════════
      //  HUD OVERLAYS (Phase-Space & Fourier) for non-membrane systems
      // ═══════════════════════════════════════════════════════════════════════
      if (systemType !== "membrane") {
        const M = numGridSize;
        const currentY = new Float32Array(M);
        const prevY = new Float32Array(M);
        const dx_num = length / (M - 1);

        if (solverType === "numerical") {
          currentY.set(yNumRef.current);
          prevY.set(yPrevRef.current);
        } else {
          for (let i = 0; i < M; i++) {
            const x = i * dx_num;
            currentY[i] = y_SI(x);
            prevY[i] = currentY[i] - dydt_SI(x) * 0.005;
          }
        }

        // Draggable probe line
        const PAD_L2 = 60;
        const stripeW2 = W - 2 * PAD_L2;
        const probePx2 = PAD_L2 + (probeX / length) * stripeW2;
        ctx.strokeStyle = "rgba(217,70,239,0.45)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(probePx2, 20); ctx.lineTo(probePx2, H - 20); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#d946ef";
        ctx.beginPath(); ctx.moveTo(probePx2 - 5, 20); ctx.lineTo(probePx2 + 5, 20); ctx.lineTo(probePx2, 27); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(probePx2 - 5, H - 20); ctx.lineTo(probePx2 + 5, H - 20); ctx.lineTo(probePx2, H - 27); ctx.closePath(); ctx.fill();

        // ── Phase-Space HUD ──────────────────────────────────────────────
        if (showPhaseSpace) {
          const hudX = 24, hudY = H - 180, hudW = 170, hudH = 150;
          ctx.fillStyle = "rgba(10,10,12,0.90)"; ctx.strokeStyle = "rgba(217,70,239,0.35)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 14); ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#d946ef"; ctx.font = "bold 7.5px monospace"; ctx.textAlign = "left";
          ctx.fillText("PHASE-SPACE  y vs ∂y/∂t", hudX + 10, hudY + 16);
          ctx.fillStyle = "rgba(255,255,255,0.40)";
          ctx.fillText(`probe x = ${probeX.toFixed(3)} m`, hudX + 10, hudY + 28);
          ctx.fillText(`y = ${y_SI(probeX).toExponential(3)} m`, hudX + 10, hudY + 40);

          const axesX = hudX + hudW / 2, axesY = hudY + hudH / 2 + 20;
          ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(hudX + 10, axesY); ctx.lineTo(hudX + hudW - 10, axesY);
          ctx.moveTo(axesX, hudY + 50); ctx.lineTo(axesX, hudY + hudH - 10);
          ctx.stroke();

          const probeIdx = Math.max(0, Math.min(M - 1, Math.round((probeX / length) * (M - 1))));
          const y_probe_ph = currentY[probeIdx];
          const v_probe_ph = (currentY[probeIdx] - prevY[probeIdx]) / Math.max(dtLastRef.current, 1e-8);

          if (isPlaying) {
            phaseHistoryRef.current.push({ y: y_probe_ph, v: v_probe_ph });
            if (phaseHistoryRef.current.length > 180) phaseHistoryRef.current.shift();
          }

          const scaleY_ph = 50 / Math.max(1e-6, amplitude);
          const scaleV_ph = 35 / Math.max(1e-6, amplitude * (omega_global || 20));

          const history = phaseHistoryRef.current;
          if (history.length > 1) {
            ctx.strokeStyle = "rgba(217,70,239,0.85)"; ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < history.length; i++) {
              const px = axesX + history[i].y * scaleY_ph;
              const py = axesY - history[i].v * scaleV_ph;
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          const curPx = axesX + y_probe_ph * scaleY_ph;
          const curPy = axesY - v_probe_ph * scaleV_ph;
          ctx.fillStyle = "#d946ef"; ctx.beginPath(); ctx.arc(curPx, curPy, 4, 0, Math.PI * 2); ctx.fill();

          // Axis labels
          ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "6.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText("y (m)", axesX, hudY + 52);
          ctx.save(); ctx.translate(hudX + 10, axesY); ctx.rotate(-Math.PI / 2);
          ctx.fillText("∂y/∂t (m/s)", 0, 0); ctx.restore();
        }

        // ── Fourier HUD ───────────────────────────────────────────────────
        if (showFourier) {
          const hudX = W - 194, hudY = H - 185, hudW = 170, hudH = 155;
          ctx.fillStyle = "rgba(10,10,12,0.90)"; ctx.strokeStyle = "rgba(139,92,246,0.35)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 14); ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#a78bfa"; ctx.font = "bold 7.5px monospace"; ctx.textAlign = "left";
          ctx.fillText("FOURIER MODES  |Aₙ|/A₀", hudX + 10, hudY + 16);
          ctx.fillStyle = "rgba(255,255,255,0.40)";
          // §7: Correct inner product A_n = (2/(M-1)) Σ y[i]·φₙ(xᵢ)
          ctx.fillText("Aₙ = (2/L) ∫ y·φₙ dx", hudX + 10, hudY + 28);

          // §7: Correct Fourier projection with proper normalization
          const weights: number[] = [];
          for (let n = 1; n <= 6; n++) {
            let sum = 0;
            for (let i = 0; i < M; i++) {
              const x_norm = i / (M - 1);  // NOTE: (M-1) not M for proper dx
              let phi = 0;
              if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
                phi = Math.sin(n * Math.PI * x_norm);
              } else if (boundaryType === "Free-Free") {
                phi = Math.cos(n * Math.PI * x_norm);
              } else if (boundaryType === "Fixed-Free") {
                phi = Math.sin((2 * n - 1) * Math.PI * x_norm / 2);
              }
              sum += currentY[i] * phi;
            }
            // Correct normalization: (2/(M-1)) accounting for trapezoidal integration
            const A_n = Math.abs(sum * 2 / Math.max(1, M - 1));
            weights.push(A_n);
          }

          const maxW = Math.max(...weights, amplitude * 0.01);
          const startX = hudX + 12, startY = hudY + hudH - 30;
          const barSpacing = 24, maxBarH = 80;

          for (let i = 0; i < 6; i++) {
            const normalized = weights[i] / Math.max(amplitude, maxW);
            const barH = Math.max(2, Math.min(maxBarH, normalized * maxBarH));
            const barX = startX + i * barSpacing, barY = startY - barH;
            const isActive = (i + 1) === harmonic;

            const grad = ctx.createLinearGradient(barX, startY, barX, barY);
            grad.addColorStop(0, isActive ? "#10b981" : "#8b5cf6");
            grad.addColorStop(1, isActive ? "#38bdf8" : "#38bdf8");
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(barX, barY, 14, barH, [2, 2, 0, 0]); ctx.fill();

            // Fraction label
            if (weights[i] / Math.max(amplitude, 0.001) > 0.05) {
              ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "6px monospace"; ctx.textAlign = "center";
              ctx.fillText(`${(normalized * 100).toFixed(0)}%`, barX + 7, barY - 3);
            }

            // Mode label and frequency
            ctx.fillStyle = isActive ? "#10b981" : "rgba(255,255,255,0.5)";
            ctx.font = isActive ? "bold 7px monospace" : "7px monospace";
            ctx.fillText(`n${i + 1}`, barX + 4, startY + 11);
            ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "6px monospace";
            const fn = (i + 1) * v_cap / (2 * length);
            ctx.fillText(`${fn.toFixed(1)}`, barX + 2, startY + 22);
          }

          // Frequency unit label
          ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "6px monospace"; ctx.textAlign = "left";
          ctx.fillText("Hz↑", startX, startY + 22);
        }

        // ── §10  PDE Solver Diagnostics HUD ─────────────────────────────
        if (showSolverDiagnostics && systemType === "string") {
          const hudX = W / 2 - 160, hudY = 16, hudW = 320, hudH = 110;
          ctx.fillStyle = "rgba(10,10,14,0.94)"; ctx.strokeStyle = "rgba(56,189,248,0.4)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 12); ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#38bdf8"; ctx.font = "bold 7.5px monospace"; ctx.textAlign = "left";
          ctx.fillText("◈  SCIENTIFIC VALIDATION  (PDE Diagnostics)", hudX + 10, hudY + 16);

          const M_diag = numGridSize;
          const dx_diag = length / (M_diag - 1);
          const dt_stable_diag = 0.8 * dx_diag / v_cap;
          const dt_sim_diag = 0.016 * slowMotionFactor;  // estimate: ~60fps
          const numSteps_est = Math.max(1, Math.ceil(dt_sim_diag / dt_stable_diag));
          // §9: Compute actual CFL (not hardcoded 0.8)
          const dt_actual = dt_sim_diag / numSteps_est;
          const cfl_actual = v_cap * dt_actual / dx_diag;
          const cflColor = cfl_actual <= 1.0 ? "#10b981" : "#ef4444";

          ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "7px monospace";
          ctx.fillText(`Grid: M=${M_diag} nodes  dx=${dx_diag.toFixed(5)} m  v=${v_cap.toFixed(2)} m/s`, hudX + 10, hudY + 30);
          ctx.fillText(`dt_sim ≈ ${dt_actual.toExponential(3)} s  substeps/frame ≈ ${numSteps_est}`, hudX + 10, hudY + 42);

          ctx.fillStyle = cflColor; ctx.font = "bold 7.5px monospace";
          ctx.fillText(`CFL  C = v·dt/dx = ${cfl_actual.toFixed(4)}  ${cfl_actual <= 1.0 ? "✓ STABLE" : "✗ UNSTABLE — increase substeps"}`, hudX + 10, hudY + 56);

          // Boundary condition check
          const yArr_d = yNumRef.current;
          const bc_L = Math.abs(yArr_d[0]);
          const bc_R = Math.abs(yArr_d[M_diag - 1]);
          const bcColor = (bc_L < 1e-8 && bc_R < 1e-8 && boundaryType === "Fixed-Fixed") ? "#10b981" : "rgba(255,255,255,0.5)";
          ctx.fillStyle = bcColor;
          ctx.fillText(`BC check: y(0)=${bc_L.toExponential(2)} m  y(L)=${bc_R.toExponential(2)} m  (Fixed→target:0)`, hudX + 10, hudY + 70);

          // L2 error
          if (solverType === "numerical") {
            const errColor = l2ErrorRef.current < 1e-3 ? "#10b981" : l2ErrorRef.current < 1e-1 ? "#f59e0b" : "#ef4444";
            ctx.fillStyle = errColor;
            ctx.fillText(`L2 error vs analytical: ${l2ErrorRef.current.toExponential(3)} m  ${l2ErrorRef.current < 1e-3 ? "✓ Good" : l2ErrorRef.current < 1e-1 ? "△ Moderate" : "✗ High"}`, hudX + 10, hudY + 82);
          }

          // Energy conservation
          const hist2 = energyHistRef.current;
          if (hist2.length > 10) {
            const dE_dt_num = (hist2[hist2.length - 1].E - hist2[0].E) / Math.max(hist2[hist2.length - 1].t - hist2[0].t, 1e-10);
            const dE_dt_theory = -2 * beta * E_total_SI;
            const consErr = E_total_SI > 1e-30 ? Math.abs(dE_dt_num - dE_dt_theory) / Math.max(Math.abs(dE_dt_theory), 1e-30) : 0;
            const consColor = consErr < 0.05 ? "#10b981" : consErr < 0.2 ? "#f59e0b" : "#ef4444";
            ctx.fillStyle = consColor;
            ctx.fillText(`dE/dt: measured=${dE_dt_num.toExponential(2)} J/s  theory −2βE=${dE_dt_theory.toExponential(2)} J/s  err=${(consErr * 100).toFixed(1)}%`, hudX + 10, hudY + 94);
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.fillText(`E_total = ${E_total_SI.toExponential(3)} J  |  E_theory = ${E_theory.toExponential(3)} J  |  rel_err = ${(E_rel_err * 100).toFixed(2)}%`, hudX + 10, hudY + 94);
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [
    systemType, solverType, discreteBeads, membraneGeometry, m2D, n2D, sandPattern,
    probeX, showPhaseSpace, showFourier,
    amplitude, harmonic, waveSpeed, boundaryType, renderMode, showComponents,
    showNodes, showAntinodes, isPlaying, time, length, tension, density, damping,
    reflection, simMode, drivingFrequency, boundaryImpedance, visualAmplitudeFactor,
    slowMotionFactor, showEnergyHeatmap, energyMode, showSolverDiagnostics,
    manualPhase, showSuperposition, harmonic2, amplitude2,
  ]);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || systemType === "membrane") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * length;
    if (Math.abs(clickX - probeX) < 0.06 * length) isDraggingProbeRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const currentMouseX = u * length;

    if (Math.abs(currentMouseX - probeX) < 0.05 * length && systemType !== "membrane") {
      canvasRef.current.style.cursor = "col-resize";
    } else { canvasRef.current.style.cursor = "crosshair"; }

    if (isDraggingProbeRef.current) {
      setProbeX(Math.max(0.01, Math.min(length - 0.01, currentMouseX)));
    }

    // Membrane hover
    if (systemType === "membrane") {
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const mappedX = (mx / rect.width) * 1000 - 500;
      const mappedY = (my / rect.height) * 600 - 300;
      const Lx = 440, Ly = 360, radius = 220;
      const r_m = Math.sqrt(mappedX * mappedX + mappedY * mappedY);
      const inBounds = membraneGeometry === "rectangular"
        ? (Math.abs(mappedX) <= Lx / 2 && Math.abs(mappedY) <= Ly / 2)
        : r_m <= radius;
      if (inBounds) {
        const k_mn = membraneGeometry === "circular" ? (BESSEL_ZEROS[m2D]?.[n2D - 1] || 2.4048) / radius : 0;
        let z_val = 0;
        if (membraneGeometry === "rectangular") {
          z_val = amplitude * Math.sin(m2D * Math.PI * (mappedX + Lx / 2) / Lx) * Math.sin(n2D * Math.PI * (mappedY + Ly / 2) / Ly);
        } else {
          z_val = amplitude * besselJ(m2D, k_mn * r_m) * Math.cos(m2D * Math.atan2(mappedY, mappedX));
        }
        const isNodal = Math.abs(z_val) < 0.06;
        setHoverData({
          visible: true, x: e.clientX, y: e.clientY,
          px: membraneGeometry === "circular" ? r_m : mappedX,
          z: z_val, uK: 0, uP: 0, velocity: 0, slope: 0,
          energy: 0.5 * tension * z_val * z_val,
          nodeType: isNodal ? "Nodal Line (Zero amplitude)" : "Vibrating Membrane Point",
          definition: isNodal
            ? "Zero-displacement line. Sand accumulates here in Chladni patterns due to gradient flow."
            : "Point oscillates transversely. Constructive/destructive interference in 2D."
        });
      } else { setHoverData(prev => ({ ...prev, visible: false })); }
      return;
    }

    // 1D string hover — compute full local physics
    const t_vis_hover = manualPhase !== undefined && !isPlaying ? manualPhase : 0;
    const mu_h = density, T_h = tension;
    const v_h = Math.sqrt(Math.max(T_h / mu_h, 1e-10));
    let k_h = 0, omega_h = 0;
    const n_eff_h = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
    if (boundaryType === "Fixed-Free") {
      k_h = (n_eff_h * Math.PI) / (2 * length);
    } else {
      k_h = (n_eff_h * Math.PI) / length;
    }
    omega_h = k_h * Math.min(v_h, 400);
    const beta_h = damping;
    const env_h = Math.exp(-beta_h * t_vis_hover);
    const isFreeL_h = boundaryType === "Free-Free";

    let y_val = 0, dydt_val = 0, dydx_val = 0;
    if (solverType === "analytical" && simMode !== "driven") {
      y_val    = amplitude * env_h * (isFreeL_h ? Math.cos(k_h * currentMouseX) : Math.sin(k_h * currentMouseX)) * Math.cos(omega_h * t_vis_hover);
      dydt_val = amplitude * env_h * (isFreeL_h ? Math.cos(k_h * currentMouseX) : Math.sin(k_h * currentMouseX)) *
                 (-beta_h * Math.cos(omega_h * t_vis_hover) - omega_h * Math.sin(omega_h * t_vis_hover));
      dydx_val = amplitude * env_h * k_h * (isFreeL_h ? -Math.sin(k_h * currentMouseX) : Math.cos(k_h * currentMouseX)) * Math.cos(omega_h * t_vis_hover);
    } else {
      const yN = yNumRef.current, yP = yPrevRef.current;
      const M_h = numGridSize;
      const ir = (currentMouseX / length) * (M_h - 1);
      const il = Math.max(0, Math.floor(ir)), ih = Math.min(M_h - 1, Math.ceil(ir));
      const w = ir - il, dx_h = length / (M_h - 1);
      y_val    = yN[il] * (1 - w) + yN[ih] * w;
      dydt_val = (y_val - (yP[il] * (1 - w) + yP[ih] * w)) / Math.max(dtLastRef.current, 1e-8);
      dydx_val = (yN[ih] - yN[il]) / Math.max(1e-5, (ih - il) * dx_h);
    }

    const local_uK = 0.5 * mu_h * dydt_val * dydt_val;
    const local_uP = 0.5 * T_h * dydx_val * dydx_val;
    const envelope = Math.abs(isFreeL_h ? Math.cos(k_h * currentMouseX) : Math.sin(k_h * currentMouseX));
    let nodeType = "Intermediate Point";
    let definition = "Dynamic oscillation. Local superposition of propagating wavefronts.";
    if (envelope < 0.10) { nodeType = "Node (Zero Amplitude)"; definition = "Continuous destructive interference. Displacement always zero. Phase inverts across this point."; }
    else if (envelope > 0.92) { nodeType = "Antinode (Maximum Amplitude)"; definition = "Continuous constructive interference. Maximum displacement excursion. KE and PE alternate here."; }

    setHoverData({
      visible: true, x: e.clientX, y: e.clientY, px: currentMouseX,
      z: y_val, velocity: dydt_val, slope: dydx_val,
      uK: local_uK, uP: local_uP, energy: local_uK + local_uP,
      nodeType, definition
    });
  };

  const handleMouseUp = () => { isDraggingProbeRef.current = false; };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#09090b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="w-full h-full object-contain"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDraggingProbeRef.current = false; setHoverData(prev => ({ ...prev, visible: false })); }}
      />

      {/* Status HUD — top-left */}
      <div className="absolute top-24 left-6 flex flex-col gap-1.5 pointer-events-none z-10 select-none">
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg w-fit">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"}`} />
          <span className="text-xs font-mono font-bold text-white/90 tracking-widest uppercase">
            {isPlaying ? "Simulation Active" : "Simulation Paused"}
          </span>
        </div>
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg uppercase w-fit">
          {systemType === "string" ? "1D Transverse String" : systemType === "air" ? "Acoustic Air Pipe" : "2D Resonant Membrane"} | {solverType === "analytical" ? "Analytical" : "Numerical PDE"}
        </div>
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg uppercase w-fit">
          t_vis = time × {slowMotionFactor} | display zoom = {visualAmplitudeFactor}× (visual only)
        </div>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoverData.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.08 }}
            className="fixed pointer-events-none z-50 bg-black/95 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl"
            style={{
              left: hoverData.x + 20,
              top: hoverData.y + 20,
              transform: `translate(${hoverData.x > window.innerWidth - 340 ? "-110%" : "0"}, ${hoverData.y > window.innerHeight - 280 ? "-110%" : "0"})`,
              minWidth: 280,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hoverData.nodeType.includes("Node") && !hoverData.nodeType.includes("Anti") ? "bg-rose-500" : hoverData.nodeType.includes("Antinode") ? "bg-emerald-500" : "bg-cyan-500"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{hoverData.nodeType}</span>
            </div>
            <p className="text-[9px] text-white/50 leading-relaxed mb-3">{hoverData.definition}</p>
            <div className="space-y-1.5 border-t border-white/5 pt-2">
              <div className="flex justify-between gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Position (x)</span>
                <span className="text-xs font-mono font-bold text-white/80">{hoverData.px.toFixed(4)} m</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Displacement (y)</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{hoverData.z.toExponential(4)} m</span>
              </div>
              {systemType !== "membrane" && (
                <>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Velocity (∂y/∂t)</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{hoverData.velocity.toExponential(3)} m/s</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Slope (∂y/∂x)</span>
                    <span className="text-xs font-mono font-bold text-violet-400">{hoverData.slope.toExponential(3)}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">KE density (u_K)</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{hoverData.uK.toExponential(3)} J/m</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">PE density (u_P)</span>
                    <span className="text-xs font-mono font-bold text-orange-400">{hoverData.uP.toExponential(3)} J/m</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Total u(x,t)</span>
                    <span className="text-xs font-mono font-bold text-fuchsia-400">{hoverData.energy.toExponential(3)} J/m</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

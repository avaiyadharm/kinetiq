"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  amplitude: number;
  harmonic: number;
  waveSpeed: number; // v
  boundaryType: BoundaryType | "Partially Reflective";
  renderMode: RenderMode;
  showComponents: boolean;
  showNodes: boolean;
  showAntinodes: boolean;
  isPlaying: boolean;
  time: number;
  length: number; // L
  tension: number;
  density: number;
  damping: number;
  reflection: number;
  simMode?: "harmonic" | "driven";
  drivingFrequency?: number;
  visualAmplitudeFactor?: number;
  boundaryImpedance?: number;

  // NEW PHYSICS PROPS
  slowMotionFactor?: number;      // 0.001–1.0: scales temporal phase for visibility
  showEnergyHeatmap?: boolean;    // color string by local u(x,t)
  energyMode?: EnergyMode;        // which energy density component to show
  showSolverDiagnostics?: boolean; // PDE diagnostics HUD
  manualPhase?: number;           // override for frame-advance when paused
}

// Zeros of J_m(x) for m = 0,1,2,3
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
  visualAmplitudeFactor = 1,
  boundaryImpedance = 0,

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
  const timeNumRef = useRef(0);

  // Phase History for phase-space orbit
  const phaseHistoryRef = useRef<{ y: number; v: number }[]>([]);

  // Air Column Particle system
  const airParticlesRef = useRef<{ x0: number; y0: number }[]>([]);

  // Chladni 2D sand particle system
  const sandParticlesRef = useRef<{ x: number; y: number }[]>([]);

  // L2 error tracking (analytical vs numerical)
  const l2ErrorRef = useRef(0);

  // Hover Probe overlay state
  const [hoverData, setHoverData] = useState({
    visible: false, x: 0, y: 0, px: 0, z: 0, energy: 0, nodeType: "", definition: ""
  });

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
    phaseHistoryRef.current = [];
    l2ErrorRef.current = 0;
  };

  useEffect(() => { initializeAirParticles(); }, [length]);
  useEffect(() => { initializeSandParticles(); }, [membraneGeometry, m2D, n2D, amplitude]);
  useEffect(() => { initializeNumericalWave(); }, [length, boundaryType, simMode, harmonic, discreteBeads, amplitude]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastFrameTime = performance.now();

    const render = (now: number) => {
      const dt_frame = Math.min(0.03, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        ctx.moveTo(0, (height / 10) * i); ctx.lineTo(width, (height / 10) * i);
        ctx.moveTo((width / 10) * i, 0); ctx.lineTo((width / 10) * i, height);
      }
      ctx.stroke();

      const isDriven = simMode === "driven";
      const mu = density;
      const T = tension;
      const v = Math.min(400, Math.sqrt(T / mu));
      const Z1 = Math.sqrt(T * mu);

      let R = -1, Z2 = 0;
      if (boundaryType === "Fixed-Fixed") { R = -1; Z2 = 0; }
      else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") { R = 1; Z2 = 1e8; }
      else if (boundaryType === "Partially Reflective") {
        Z2 = boundaryImpedance ?? 0;
        R = (Z2 - Z1) / (Z2 + Z1);
      }

      // Transmission coefficient T_coeff = 2Z2/(Z1+Z2)
      const T_coeff = (Z2 + Z1) > 0 ? (2 * Z2) / (Z2 + Z1) : 0;

      // -------------------------------------------------------
      // SCALED VISUAL TIME: make oscillation perceptible
      // Uses slowMotionFactor to scale how fast cos(ωt) evolves
      // -------------------------------------------------------
      const t_vis = manualPhase !== undefined && !isPlaying
        ? manualPhase
        : time * slowMotionFactor;

      let y_net = (x: number) => 0;
      let dy_dt = (x: number) => 0;
      let dy_dx = (x: number) => 0;
      let omega = 0;
      let visualScale = 1;
      let k_global = 0;

      // -------------------------------------------------------
      // INTEGRATE NUMERICAL ENGINE
      // -------------------------------------------------------
      if (isPlaying && solverType === "numerical" && systemType !== "membrane") {
        const M = numGridSize;
        const dx = length / (M - 1);
        const y = yNumRef.current;
        const y_prev = yPrevRef.current;

        const r_target = 0.8;
        const dt_stable = r_target * dx / v;
        const numSteps = Math.min(100, Math.ceil(dt_frame / dt_stable));
        const dt = dt_frame / numSteps;

        let cfl = v * dt / dx;

        for (let step = 0; step < numSteps; step++) {
          timeNumRef.current += dt;
          const t_num = timeNumRef.current;
          const y_next = new Float32Array(M);
          const r = v * dt / dx;
          const beta = damping;

          for (let i = 1; i < M - 1; i++) {
            const laplacian = y[i + 1] - 2 * y[i] + y[i - 1];
            y_next[i] = (2 * y[i] - y_prev[i] * (1 - beta * dt) + r * r * laplacian) / (1 + beta * dt);
          }

          // Left boundary
          if (isDriven) {
            y_next[0] = amplitude * Math.sin(2 * Math.PI * drivingFrequency * t_num);
          } else {
            if (boundaryType.startsWith("Fixed")) { y_next[0] = 0; }
            else { y_next[0] = (2 * y[0] - y_prev[0] * (1 - beta * dt) + 2 * r * r * (y[1] - y[0])) / (1 + beta * dt); }
          }

          // Right boundary
          if (boundaryType === "Fixed-Fixed") { y_next[M - 1] = 0; }
          else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
            y_next[M - 1] = (2 * y[M - 1] - y_prev[M - 1] * (1 - beta * dt) + 2 * r * r * (y[M - 2] - y[M - 1])) / (1 + beta * dt);
          } else if (boundaryType === "Partially Reflective") {
            if (Z2 > 150) { y_next[M - 1] = 0; }
            else {
              const gamma = Z2 * dx / (T * dt);
              const coeff_y = 2 * (1 - r * r);
              const coeff_yprev = 1 - beta * dt - 2 * r * r * gamma;
              const coeff_ym2 = 2 * r * r;
              const denom = 1 + beta * dt + 2 * r * r * gamma;
              y_next[M - 1] = (coeff_y * y[M - 1] - coeff_yprev * y_prev[M - 1] + coeff_ym2 * y[M - 2]) / denom;
            }
          }
          y_prev.set(y);
          y.set(y_next);
        }

        // Store CFL for diagnostics display
        const dx_store = length / (M - 1);
        const dt_stable_store = r_target * dx_store / v;
        const dt_actual = dt_frame / Math.max(1, Math.ceil(dt_frame / dt_stable_store));
        (canvas as unknown as { _cfl?: number })._cfl = v * dt_actual / dx_store;
      }

      // -------------------------------------------------------
      // RENDER STRING MODULE
      // -------------------------------------------------------
      if (systemType === "string") {
        visualScale = ((height * 0.35) / 1.5) * (visualAmplitudeFactor / 5);
        const A_px = amplitude * visualScale;

        let y1_fn = (x: number) => 0;
        let y2_fn = (x: number) => 0;

        if (solverType === "analytical") {
          if (!isDriven) {
            let n_eff = harmonic;
            let k = 0;
            if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" || boundaryType === "Partially Reflective") {
              k = (n_eff * Math.PI) / length;
            } else if (boundaryType === "Fixed-Free") {
              const oddH = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
              n_eff = oddH;
              k = (oddH * Math.PI) / (2 * length);
            }
            k_global = k;
            const omega_0 = k * v;
            const beta = damping;
            // Damped natural frequency
            omega = Math.sqrt(Math.max(0, omega_0 * omega_0 - beta * beta));
            // PHYSICAL decay: A(t) = A0 * exp(-β*t) - coupled to REAL time, not visual time
            // Visual phase uses slowMotionFactor-scaled time for perceivable oscillation
            const physicalDecayEnvelope = Math.exp(-beta * time); // real-time decay
            const A_eff = A_px * physicalDecayEnvelope;

            if (boundaryType === "Free-Free") {
              y_net = (x: number) => A_eff * Math.cos(k * x) * Math.cos(omega * t_vis);
              y1_fn = (x: number) => 0.5 * A_eff * Math.cos(k * x - omega * t_vis);
              y2_fn = (x: number) => 0.5 * A_eff * Math.cos(k * x + omega * t_vis);
              dy_dt = (x: number) => {
                const dA = -beta * A_eff * Math.cos(omega * t_vis) - omega * A_eff * Math.sin(omega * t_vis);
                return dA * Math.cos(k * x);
              };
              dy_dx = (x: number) => -k * A_eff * Math.sin(k * x) * Math.cos(omega * t_vis);
            } else {
              y_net = (x: number) => A_eff * Math.sin(k * x) * Math.cos(omega * t_vis);
              y1_fn = (x: number) => 0.5 * A_eff * Math.sin(k * x - omega * t_vis);
              y2_fn = (x: number) => 0.5 * A_eff * Math.sin(k * x + omega * t_vis);
              dy_dt = (x: number) => {
                const dA = -beta * A_eff * Math.cos(omega * t_vis) - omega * A_eff * Math.sin(omega * t_vis);
                return dA * Math.sin(k * x);
              };
              dy_dx = (x: number) => k * A_eff * Math.cos(k * x) * Math.cos(omega * t_vis);
            }
          } else {
            const f_d = drivingFrequency;
            omega = 2 * Math.PI * f_d;
            const beta = damping;
            const w_v2 = (omega * omega) / (v * v);
            const b_w_v2 = (beta * omega) / (v * v);
            k_global = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
            const alpha = k_global > 0 ? (beta * omega) / (v * v * k_global) : 0;
            const k = k_global;

            const exp_2aL = Math.exp(-2 * alpha * length);
            const den_re = 1 + R * exp_2aL * Math.cos(2 * k * length);
            const den_im = -R * exp_2aL * Math.sin(2 * k * length);
            const den_mag2 = den_re * den_re + den_im * den_im;

            const getY = (x: number) => {
              const exp_ax = Math.exp(-alpha * x);
              const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
              const nr = exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
              const ni = -exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));
              return { re: (nr * den_re + ni * den_im) / den_mag2, im: (ni * den_re - nr * den_im) / den_mag2 };
            };

            y_net = (x: number) => { const Y = getY(x); return A_px * (Y.re * Math.cos(omega * t_vis) - Y.im * Math.sin(omega * t_vis)); };
            dy_dt = (x: number) => { const Y = getY(x); return -omega * A_px * (Y.re * Math.sin(omega * t_vis) + Y.im * Math.cos(omega * t_vis)); };
            dy_dx = (x: number) => {
              const exp_ax = Math.exp(-alpha * x);
              const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
              const tr = -exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
              const ti = exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));
              const npr = alpha * tr - k * ti, npi = alpha * ti + k * tr;
              const Ypr = (npr * den_re + npi * den_im) / den_mag2;
              const Ypi = (npi * den_re - npr * den_im) / den_mag2;
              return A_px * (Ypr * Math.cos(omega * t_vis) - Ypi * Math.sin(omega * t_vis));
            };
          }
        } else {
          // Numerical interpolation
          const y = yNumRef.current;
          const y_prev = yPrevRef.current;
          const M = numGridSize;

          y_net = (x: number) => {
            const ir = (x / length) * (M - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
            return (y[il] * (1 - (ir - il)) + y[ih] * (ir - il)) * visualScale;
          };
          dy_dt = (x: number) => {
            const ir = (x / length) * (M - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
            const w = ir - il;
            const dt_approx = 0.005;
            return ((y[il] - y_prev[il]) * (1 - w) + (y[ih] - y_prev[ih]) * w) / dt_approx * visualScale;
          };
          dy_dx = (x: number) => {
            const ir = (x / length) * (M - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
            const dx = length / (M - 1);
            return (y[ih] - y[il]) / Math.max(1e-5, (ih - il) * dx) * visualScale;
          };

          // Compute L2 error vs analytical if harmonic mode
          if (solverType === "numerical" && !isDriven && isPlaying) {
            let err2 = 0;
            const M2 = numGridSize;
            const k_a = boundaryType === "Fixed-Free"
              ? ((harmonic % 2 === 0 ? harmonic - 1 : harmonic) * Math.PI) / (2 * length)
              : (harmonic * Math.PI) / length;
            const omega_a = k_a * v;
            const envelope_a = Math.exp(-damping * timeNumRef.current);
            for (let i = 0; i < M2; i++) {
              const x = (i / (M2 - 1)) * length;
              const y_analytical = amplitude * envelope_a * Math.sin(k_a * x) * Math.cos(omega_a * timeNumRef.current);
              err2 += Math.pow(yNumRef.current[i] - y_analytical, 2);
            }
            l2ErrorRef.current = Math.sqrt(err2 / M2);
          }
        }

        const isScientific = renderMode === "Scientific";
        const isEnergyMode = renderMode === "Energy";

        // Center reference line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(50, height / 2);
        ctx.lineTo(width - 50, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isEnergyMode) {
          // -------------------------------------------------------
          // TRUE ENERGY DENSITY VISUALIZATION
          // KE(x,t) = ½μ(∂y/∂t)²   PE(x,t) = ½T(∂y/∂x)²
          // -------------------------------------------------------
          // Use SI units: amplitude in m, omega in rad/s, k in rad/m
          // Physical derivatives: divide out visualScale
          const u_max = 0.5 * mu * Math.pow(amplitude * (omega || 20), 2) + 0.5 * T * Math.pow(amplitude * (k_global || 5), 2);
          const visualEnergyScale = (height * 0.28) / Math.max(1e-8, u_max);

          const getKE = (x: number) => { const v_phys = dy_dt(x) / visualScale; return 0.5 * mu * v_phys * v_phys; };
          const getPE = (x: number) => { const s_phys = dy_dx(x) / visualScale; return 0.5 * T * s_phys * s_phys; };

          if (energyMode === "KE" || energyMode === "Total" || energyMode === "TimeAvg") {
            ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              const py = height / 2 - getKE(x) * visualEnergyScale;
              px === 50 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          if (energyMode === "PE" || energyMode === "Total" || energyMode === "TimeAvg") {
            ctx.strokeStyle = "rgba(249, 115, 22, 0.7)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              const py = height / 2 - getPE(x) * visualEnergyScale;
              px === 50 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Total energy density (fuchsia)
          ctx.strokeStyle = "#d946ef";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "rgba(217, 70, 239, 0.4)";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          const energyPts: [number, number][] = [];
          for (let px = 50; px <= width - 50; px++) {
            const x = ((px - 50) / (width - 100)) * length;
            const E = getKE(x) + getPE(x);
            const py = height / 2 - E * visualEnergyScale;
            energyPts.push([px, py]);
            px === 50 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Filled area under total energy
          ctx.fillStyle = "rgba(217, 70, 239, 0.06)";
          ctx.beginPath();
          ctx.moveTo(50, height / 2);
          for (const pt of energyPts) ctx.lineTo(pt[0], pt[1]);
          ctx.lineTo(width - 50, height / 2);
          ctx.closePath();
          ctx.fill();

          // Legends
          ctx.font = "9px monospace";
          ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
          ctx.fillText("--- KE = ½μ(∂y/∂t)²  (J/m)", 60, 38);
          ctx.fillStyle = "rgba(249, 115, 22, 0.9)";
          ctx.fillText("--- PE = ½T(∂y/∂x)²  (J/m)", 60, 52);
          ctx.fillStyle = "#d946ef";
          ctx.fillText("——  u = KE + PE  Total energy density (J/m)", 60, 66);

          // Energy note
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.font = "8px monospace";
          ctx.fillText("Note: Standing waves have ZERO net energy flux. KE↔PE exchange is local.", 60, height - 16);

        } else {
          // Standard displacement or phase mode

          // Component waves
          if (showComponents && solverType === "analytical") {
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(34, 211, 238, 0.45)";
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              px === 50 ? ctx.moveTo(px, height / 2 - y1_fn(x)) : ctx.lineTo(px, height / 2 - y1_fn(x));
            }
            ctx.stroke();

            ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              px === 50 ? ctx.moveTo(px, height / 2 - y2_fn(x)) : ctx.lineTo(px, height / 2 - y2_fn(x));
            }
            ctx.stroke();
          }

          if (discreteBeads) {
            // --- DISCRETE BEAD-SPRING MODE ---
            const M = numGridSize;
            const beadCoords: [number, number][] = [];
            for (let i = 0; i < M; i++) {
              const x_m = (i / (M - 1)) * length;
              const px = 50 + (i / (M - 1)) * (width - 100);
              const py = height / 2 - y_net(x_m);
              beadCoords.push([px, py]);
            }
            for (let i = 0; i < M - 1; i++) drawSpring(ctx, beadCoords[i][0], beadCoords[i][1], beadCoords[i + 1][0], beadCoords[i + 1][1]);

            ctx.lineWidth = 1.5;
            for (let i = 0; i < M; i++) {
              ctx.beginPath();
              if (i === 0 && isDriven) ctx.fillStyle = "#38bdf8";
              else if ((i === 0 || i === M - 1) && boundaryType.startsWith("Fixed")) ctx.fillStyle = "#ef4444";
              else ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "rgba(0,0,0,0.5)";
              ctx.arc(beadCoords[i][0], beadCoords[i][1], 6.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          } else {
            // --- CONTINUOUS STRING ---

            if (showEnergyHeatmap && !isEnergyMode) {
              // Color the string by local energy density (heatmap coloring)
              const u_max_hm = 0.5 * mu * Math.pow(amplitude * (omega || 20), 2) + 0.5 * T * Math.pow(amplitude * (k_global || 5), 2);
              const N = width - 100;
              for (let px = 50; px < width - 50; px++) {
                const x = ((px - 50) / N) * length;
                const x_next = ((px - 49) / N) * length;
                const py1 = height / 2 - y_net(x);
                const py2 = height / 2 - y_net(x_next);
                const v_phys = dy_dt(x) / visualScale;
                const s_phys = dy_dx(x) / visualScale;
                const E = 0.5 * mu * v_phys * v_phys + 0.5 * T * s_phys * s_phys;
                const t_norm = Math.min(1, E / Math.max(1e-8, u_max_hm));
                // Hot → cold: fuchsia (high) → cyan (low) → dark (zero)
                const r = Math.round(217 * t_norm);
                const g = Math.round(70 * (1 - t_norm) + 211 * t_norm);
                const b = Math.round(239 * t_norm + 238 * (1 - t_norm));
                ctx.strokeStyle = `rgb(${r},${g},${b})`;
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                ctx.moveTo(px, py1);
                ctx.lineTo(px + 1, py2);
                ctx.stroke();
              }
            } else {
              // Standard single color wave
              ctx.beginPath();
              for (let px = 50; px <= width - 50; px++) {
                const x = ((px - 50) / (width - 100)) * length;
                const py = height / 2 - y_net(x);
                px === 50 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
              }
              ctx.lineWidth = isScientific ? 2.5 : 4.5;
              if (renderMode === "Displacement") {
                ctx.strokeStyle = "#ffffff";
                ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
                ctx.shadowBlur = 10;
              } else if (renderMode === "Phase") {
                const phaseVal = ((omega || 1) * t_vis) % (2 * Math.PI);
                ctx.strokeStyle = `hsl(${(phaseVal / (2 * Math.PI)) * 360}, 95%, 65%)`;
                ctx.shadowColor = `hsla(${(phaseVal / (2 * Math.PI)) * 360}, 95%, 65%, 0.3)`;
                ctx.shadowBlur = 12;
              } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
              }
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }

          // -------------------------------------------------------
          // NODE / ANTINODE MARKERS — Analytically precise positions
          // Nodes:     x_n = m * λ/2    for m = 0,...,n
          // Antinodes: x_a = (2m+1)λ/4  for m = 0,...,n-1
          // Markers always drawn at equilibrium height (height/2)
          // -------------------------------------------------------
          const nodes: number[] = [];
          const antinodes: number[] = [];

          if (solverType === "analytical" && !isDriven) {
            const lam = k_global > 0 ? (2 * Math.PI) / k_global : 0;
            if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
              // Nodes at x = m*L/n = m*λ/2, m = 0..n
              for (let m = 0; m <= harmonic; m++) {
                const xn = m * lam / 2;
                if (xn >= -0.001 && xn <= length + 0.001) nodes.push(Math.min(length, Math.max(0, xn)));
              }
              // Antinodes at x = (2m+1)λ/4, m = 0..n-1
              for (let m = 0; m < harmonic; m++) {
                const xa = (2 * m + 1) * lam / 4;
                if (xa > 0 && xa < length) antinodes.push(xa);
              }
            } else if (boundaryType === "Free-Free") {
              for (let m = 0; m <= harmonic; m++) {
                const xa = m * lam / 2;
                if (xa >= -0.001 && xa <= length + 0.001) antinodes.push(Math.min(length, Math.max(0, xa)));
              }
              for (let m = 0; m < harmonic; m++) {
                const xn = (2 * m + 1) * lam / 4;
                if (xn > 0 && xn < length) nodes.push(xn);
              }
            } else if (boundaryType === "Fixed-Free") {
              // Nodes at x = m*λ/2, m = 0,1,2...
              for (let m = 0; (m * lam / 2) <= length + 0.001; m++) {
                const xn = m * lam / 2;
                if (xn >= -0.001) nodes.push(Math.max(0, xn));
              }
              // Antinodes at x = (2m+1)λ/4
              for (let m = 0; (2 * m + 1) * lam / 4 <= length; m++) {
                antinodes.push((2 * m + 1) * lam / 4);
              }
            }
          } else if (solverType === "numerical" && !isDriven) {
            const activeH = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
            const lam_num = boundaryType === "Fixed-Free" ? (4 * length / activeH) : (2 * length / activeH);
            if (boundaryType === "Free-Free") {
              for (let m = 0; m <= activeH; m++) antinodes.push(m * lam_num / 2);
              for (let m = 0; m < activeH; m++) nodes.push((2 * m + 1) * lam_num / 4);
            } else if (boundaryType === "Fixed-Free") {
              for (let m = 0; m * lam_num / 2 <= length + 0.001; m++) nodes.push(m * lam_num / 2);
              for (let m = 0; (2 * m + 1) * lam_num / 4 <= length; m++) antinodes.push((2 * m + 1) * lam_num / 4);
            } else {
              for (let m = 0; m <= activeH; m++) nodes.push(m * lam_num / 2);
              for (let m = 0; m < activeH; m++) antinodes.push((2 * m + 1) * lam_num / 4);
            }
          } else if (isDriven && k_global > 0) {
            // Driven mode: approximate nodes from wave vector
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

          // Draw Nodes — always at equilibrium (height/2)
          if (showNodes) {
            nodes.forEach((xn) => {
              const px = 50 + (xn / length) * (width - 100);
              ctx.fillStyle = isScientific ? "#ffffff" : "#ef4444";
              ctx.beginPath();
              ctx.arc(px, height / 2, 6, 0, Math.PI * 2);
              ctx.fill();
              if (!isScientific) {
                ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
                ctx.beginPath();
                ctx.arc(px, height / 2, 14, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }

          // Draw Antinodes — at equilibrium height, with directional arrows
          if (showAntinodes) {
            antinodes.forEach((xa) => {
              const px = 50 + (xa / length) * (width - 100);

              // Marker at equilibrium
              ctx.fillStyle = isScientific ? "#ffffff" : "#10b981";
              ctx.beginPath();
              ctx.arc(px, height / 2, 6, 0, Math.PI * 2);
              ctx.fill();

              // Direction arrow based on current instantaneous displacement at antinode
              const curDisp = y_net(xa);
              const direction = curDisp > 2 ? 1 : curDisp < -2 ? -1 : 0;

              if (direction !== 0 && !isScientific) {
                const arrowColor = direction > 0 ? "#10b981" : "#f43f5e";
                ctx.strokeStyle = arrowColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(px, height / 2);
                ctx.lineTo(px, height / 2 - direction * 40);
                ctx.stroke();
                ctx.fillStyle = arrowColor;
                ctx.beginPath();
                ctx.moveTo(px - 5, height / 2 - direction * 33);
                ctx.lineTo(px + 5, height / 2 - direction * 33);
                ctx.lineTo(px, height / 2 - direction * 42);
                ctx.fill();
              }
            });
          }
        }

        // Boundary decorations
        ctx.fillStyle = "#ffffff";
        if (isDriven) {
          ctx.fillRect(44, height / 2 - 25, 6, 50);
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText(`DRIVER (f_d = ${drivingFrequency.toFixed(1)}Hz)`, 55, height / 2 - 28);
        } else {
          if (boundaryType.startsWith("Fixed")) {
            ctx.fillRect(44, height / 2 - 25, 6, 50);
            ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
            ctx.font = "bold 8.5px monospace";
            ctx.fillText("FIXED NODE (π SHIFT)", 55, height / 2 - 28);
          } else {
            ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(50, height / 2, 7, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
            ctx.font = "bold 8.5px monospace";
            ctx.fillText("FREE ANTINODE (0 SHIFT)", 60, height / 2 - 28);
          }
        }

        if (boundaryType === "Fixed-Fixed") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(width - 50, height / 2 - 25, 6, 50);
          ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText("FIXED NODE (π SHIFT)", width - 180, height / 2 - 28);
        } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
          ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(width - 50, height / 2, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText("FREE ANTINODE (0 SHIFT)", width - 210, height / 2 - 28);
        } else if (boundaryType === "Partially Reflective") {
          // Draw boundary with energy transmission coloring
          const R_frac = R * R;
          const T_frac = 1 - R_frac;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(width - 48, height / 2 - 25, 3, 50);

          // Transmitted energy leakage band
          if (T_frac > 0.01) {
            ctx.fillStyle = `rgba(245, 158, 11, ${Math.min(0.8, T_frac * 1.5)})`;
            ctx.fillRect(width - 44, height / 2 - 20, 12, 40);
            ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
            ctx.font = "bold 7px monospace";
            ctx.fillText("LEAK", width - 42, height / 2 - 24);
          }

          ctx.fillStyle = "rgba(217, 70, 239, 0.9)";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText(`R = ${R.toFixed(3)}  T = ${T_coeff.toFixed(3)}  |R|² = ${R_frac.toFixed(3)}  |T|² = ${T_frac.toFixed(3)}`, width - 380, height / 2 - 28);
        }

        // Phase indicator (current phase value)
        if (renderMode === "Phase") {
          const phaseRad = (omega * t_vis) % (2 * Math.PI);
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`ωt_vis = ${phaseRad.toFixed(2)} rad  cos(ωt) = ${Math.cos(phaseRad).toFixed(3)}`, width / 2 - 120, height - 14);
        }

      } else if (systemType === "air") {
        // --- 1D ACOUSTIC AIR COLUMN ---
        const pipeX = 100, pipeY = height / 2 - 60, pipeW = width - 200, pipeH = 120;
        const samples = 150;
        const dx_px = pipeW / samples;
        visualScale = 35;
        const A_px = amplitude * visualScale;

        let s_disp = (x: number) => 0;
        let p_press = (x: number) => 0;

        if (solverType === "analytical") {
          let k = 0;
          if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
            k = (harmonic * Math.PI) / length;
            omega = k * v;
            s_disp = (x: number) => A_px * Math.cos(k * x) * Math.cos(omega * t_vis);
            p_press = (x: number) => Math.sin(k * x) * Math.cos(omega * t_vis);
          } else if (boundaryType === "Fixed-Free") {
            const oddH = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
            k = (oddH * Math.PI) / (2 * length);
            omega = k * v;
            s_disp = (x: number) => A_px * Math.sin(k * x) * Math.cos(omega * t_vis);
            p_press = (x: number) => -Math.cos(k * x) * Math.cos(omega * t_vis);
          } else {
            k = (harmonic * Math.PI) / length;
            omega = k * v;
            s_disp = (x: number) => A_px * Math.cos(k * x) * Math.cos(omega * t_vis);
            p_press = (x: number) => Math.sin(k * x) * Math.cos(omega * t_vis);
          }
        } else {
          const y = yNumRef.current;
          const y_prev = yPrevRef.current;
          const M = numGridSize;
          s_disp = (x: number) => {
            const ir = (x / length) * (M - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
            return (y[il] * (1 - (ir - il)) + y[ih] * (ir - il)) * 35;
          };
          p_press = (x: number) => {
            const ir = (x / length) * (M - 1);
            const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
            const dx = length / (M - 1);
            return -(y[ih] - y[il]) / Math.max(1e-5, (ih - il) * dx) * 1.5;
          };
        }

        y_net = s_disp;
        dy_dt = (x: number) => -omega * A_px * (boundaryType === "Fixed-Free"
          ? Math.sin(k_global * x) : Math.cos(k_global * x)) * Math.sin(omega * t_vis);

        // Pressure shading
        for (let i = 0; i < samples; i++) {
          const px = pipeX + i * dx_px;
          const x = (i / samples) * length;
          const P = p_press(x);
          ctx.fillStyle = P > 0
            ? `rgba(239, 68, 68, ${Math.min(0.65, P * 0.7)})`
            : `rgba(56, 189, 248, ${Math.min(0.65, Math.abs(P) * 0.7)})`;
          ctx.fillRect(px, pipeY + 1, dx_px + 0.5, pipeH - 2);
        }

        // Air molecule particles
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (const p of airParticlesRef.current) {
          const s = s_disp(p.x0);
          const px = pipeX + (p.x0 / length) * pipeW + s;
          const py = pipeY + pipeH / 2 + p.y0;
          ctx.beginPath(); ctx.arc(px, py, 2.2, 0, Math.PI * 2); ctx.fill();
        }

        // Pipe boundaries
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(pipeX, pipeY); ctx.lineTo(pipeX + pipeW, pipeY);
        ctx.moveTo(pipeX, pipeY + pipeH); ctx.lineTo(pipeX + pipeW, pipeY + pipeH);
        ctx.stroke();

        if (boundaryType === "Fixed-Free") {
          ctx.beginPath(); ctx.moveTo(pipeX, pipeY); ctx.lineTo(pipeX, pipeY + pipeH); ctx.stroke();
          ctx.fillStyle = "rgba(239,68,68,0.5)"; ctx.font = "bold 9px monospace";
          ctx.fillText("CLOSED END (s=0, p=max)", pipeX + 10, pipeY - 8);
        } else {
          ctx.fillStyle = "rgba(56, 189, 248, 0.6)"; ctx.font = "bold 9px monospace";
          ctx.fillText("OPEN END (s=max, p=0)", pipeX + 10, pipeY - 8);
        }
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)"; ctx.font = "bold 9px monospace";
        ctx.fillText("OPEN END (s=max, p=0)", pipeX + pipeW - 160, pipeY - 8);

        // Displacement and pressure curves
        const curveY = height - 70;
        ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(pipeX, curveY); ctx.lineTo(pipeX + pipeW, curveY); ctx.stroke();
        ctx.setLineDash([]);

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = pipeX + (i / samples) * pipeW;
          const x = (i / samples) * length;
          const py = curveY - (s_disp(x) / A_px) * 35;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.strokeStyle = "#ef4444";
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = pipeX + (i / samples) * pipeW;
          const x = (i / samples) * length;
          const py = curveY - p_press(x) * 35;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.font = "9px monospace";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("—— Air Particle Displacement s(x,t)", pipeX, height - 20);
        ctx.fillStyle = "#ef4444";
        ctx.fillText("—— Acoustic Pressure p(x,t) = -B∂s/∂x", pipeX + 260, height - 20);

      } else if (systemType === "membrane") {
        // --- 2D MEMBRANE & CHLADNI ---
        const centerX = width / 2, centerY = height / 2;
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
                ? `rgba(239, 68, 68, ${Math.min(0.85, z * 0.85)})`
                : z < -0.01
                  ? `rgba(56, 189, 248, ${Math.min(0.85, Math.abs(z) * 0.85)})`
                  : "rgba(128,128,128,0.1)";
              ctx.fillRect(centerX + x - stepX / 2, centerY + y - stepY / 2, stepX, stepY);
            }
          }
        } else {
          // Chladni sand update
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

          ctx.fillStyle = "rgba(245, 158, 11, 0.75)";
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
        if (isRect) ctx.fillText(`RECTANGULAR MODE (m=${m2D}, n=${n2D})`, centerX - Lx / 2, centerY - Ly / 2 - 10);
        else ctx.fillText(`CIRCULAR DRUMHEAD MODE (m=${m2D}, n=${n2D})`, centerX - radius, centerY - radius - 10);
      }

      // -------------------------------------------------------
      // CORNER HUD OVERLAYS (Phase-Space & Fourier)
      // -------------------------------------------------------
      if (systemType !== "membrane") {
        const M = numGridSize;
        const currentY = new Float32Array(M);
        const prevY = new Float32Array(M);

        if (solverType === "numerical") {
          currentY.set(yNumRef.current);
          prevY.set(yPrevRef.current);
        } else {
          const dx = length / (M - 1);
          for (let i = 0; i < M; i++) {
            const x = i * dx;
            const y_val = y_net(x) / visualScale;
            currentY[i] = y_val;
            prevY[i] = y_val - (dy_dt(x) / visualScale) * 0.005;
          }
        }

        // Draggable probe line
        const probePx = 50 + (probeX / length) * (width - 100);
        ctx.strokeStyle = "rgba(217, 70, 239, 0.4)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(probePx, 20); ctx.lineTo(probePx, height - 20); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#d946ef";
        ctx.beginPath(); ctx.moveTo(probePx - 5, 20); ctx.lineTo(probePx + 5, 20); ctx.lineTo(probePx, 27); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(probePx - 5, height - 20); ctx.lineTo(probePx + 5, height - 20); ctx.lineTo(probePx, height - 27); ctx.closePath(); ctx.fill();

        // Phase-Space HUD
        if (showPhaseSpace) {
          const hudX = 24, hudY = height - 170, hudW = 160, hudH = 140;
          ctx.fillStyle = "rgba(10,10,12,0.88)"; ctx.strokeStyle = "rgba(217,70,239,0.3)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 14); ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#d946ef"; ctx.font = "bold 7.5px monospace";
          ctx.fillText("PHASE SPACE: y vs ẏ", hudX + 10, hudY + 16);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText(`PROBE x = ${probeX.toFixed(2)}m`, hudX + 10, hudY + 26);

          const axesX = hudX + hudW / 2, axesY = hudY + hudH / 2 + 10;
          ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(hudX + 10, axesY); ctx.lineTo(hudX + hudW - 10, axesY);
          ctx.moveTo(axesX, hudY + 36); ctx.lineTo(axesX, hudY + hudH - 10);
          ctx.stroke();

          const probeIdx = Math.max(0, Math.min(M - 1, Math.round((probeX / length) * (M - 1))));
          const y_probe = currentY[probeIdx];
          const v_probe = (currentY[probeIdx] - prevY[probeIdx]) / 0.005;

          if (isPlaying) {
            const history = phaseHistoryRef.current;
            history.push({ y: y_probe, v: v_probe });
            if (history.length > 160) history.shift();
          }

          const history = phaseHistoryRef.current;
          if (history.length > 1) {
            ctx.strokeStyle = "rgba(217,70,239,0.85)"; ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < history.length; i++) {
              const px = axesX + (history[i].y / amplitude) * 55;
              const py = axesY - (history[i].v / (amplitude * (omega || 20))) * 35;
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          const curPx = axesX + (y_probe / amplitude) * 55;
          const curPy = axesY - (v_probe / (amplitude * (omega || 20))) * 35;
          ctx.fillStyle = "#d946ef"; ctx.beginPath(); ctx.arc(curPx, curPy, 4, 0, Math.PI * 2); ctx.fill();
        }

        // Fourier HUD
        if (showFourier) {
          const hudX = width - 184, hudY = height - 170, hudW = 160, hudH = 140;
          ctx.fillStyle = "rgba(10,10,12,0.88)"; ctx.strokeStyle = "rgba(139,92,246,0.3)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 14); ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#a78bfa"; ctx.font = "bold 7.5px monospace";
          ctx.fillText("SPATIAL FOURIER MODES", hudX + 10, hudY + 16);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText("A_n = (2/L)∫y·φ_n dx", hudX + 10, hudY + 26);

          const weights: number[] = [];
          for (let n = 1; n <= 6; n++) {
            let sum = 0;
            for (let i = 0; i < M; i++) {
              const x_norm = i / (M - 1);
              let phi = 0;
              if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") phi = Math.sin(n * Math.PI * x_norm);
              else if (boundaryType === "Free-Free") phi = Math.cos(n * Math.PI * x_norm);
              else if (boundaryType === "Fixed-Free") phi = Math.sin((2 * n - 1) * Math.PI * x_norm / 2);
              sum += currentY[i] * phi;
            }
            weights.push(Math.abs(sum * 2 / M));
          }

          const startX = hudX + 12, startY = hudY + hudH - 24, barSpacing = 23, maxBarH = 75;
          let maxW = 0.05;
          for (const w of weights) if (w > maxW) maxW = w;

          for (let i = 0; i < 6; i++) {
            const h_val = (weights[i] / Math.max(amplitude, maxW)) * maxBarH;
            const barH = Math.max(2, Math.min(maxBarH, h_val));
            const barX = startX + i * barSpacing, barY = startY - barH;
            const grad = ctx.createLinearGradient(barX, startY, barX, barY);
            grad.addColorStop(0, "#8b5cf6"); grad.addColorStop(1, "#38bdf8");
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.roundRect(barX, barY, 13, barH, [2, 2, 0, 0]); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 7px monospace";
            ctx.fillText(`n${i + 1}`, barX + 2, startY + 11);
          }
        }

        // -------------------------------------------------------
        // PDE SOLVER DIAGNOSTICS HUD
        // -------------------------------------------------------
        if (showSolverDiagnostics && systemType === "string") {
          const hudX = width / 2 - 120, hudY = 20, hudW = 240, hudH = 80;
          ctx.fillStyle = "rgba(10,10,14,0.92)"; ctx.strokeStyle = "rgba(56,189,248,0.3)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 12); ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#38bdf8"; ctx.font = "bold 7.5px monospace";
          ctx.fillText("PDE SOLVER DIAGNOSTICS", hudX + 10, hudY + 16);

          const M_diag = numGridSize;
          const dx_diag = length / (M_diag - 1);
          const dt_stable_diag = 0.8 * dx_diag / v;
          const cfl = v * dt_stable_diag / dx_diag; // = 0.8 by construction

          ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "7px monospace";
          ctx.fillText(`M = ${M_diag} nodes    dx = ${dx_diag.toFixed(4)}m    dt_stable = ${dt_stable_diag.toFixed(5)}s`, hudX + 10, hudY + 32);
          ctx.fillText(`v = ${v.toFixed(1)} m/s    Sub-steps/frame ≈ ${Math.ceil(0.016 / dt_stable_diag)}`, hudX + 10, hudY + 44);

          // CFL indicator
          const cflColor = cfl <= 1.0 ? "#10b981" : "#ef4444";
          ctx.fillStyle = cflColor; ctx.font = "bold 8px monospace";
          ctx.fillText(`CFL  C = v·dt/dx = ${cfl.toFixed(3)}  ${cfl <= 1.0 ? "✓ STABLE" : "✗ UNSTABLE"}`, hudX + 10, hudY + 58);

          if (solverType === "numerical") {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.fillText(`L2 error vs analytical: ${l2ErrorRef.current.toExponential(2)}`, hudX + 10, hudY + 70);
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [
    systemType, solverType, discreteBeads, membraneGeometry, m2D, n2D, sandPattern, probeX, showPhaseSpace, showFourier,
    amplitude, harmonic, waveSpeed, boundaryType, renderMode, showComponents, showNodes, showAntinodes,
    isPlaying, time, length, tension, density, damping, reflection, simMode, drivingFrequency, boundaryImpedance, visualAmplitudeFactor,
    slowMotionFactor, showEnergyHeatmap, energyMode, showSolverDiagnostics, manualPhase,
  ]);

  // Mouse handlers
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

    // 1D hover data
    if (systemType === "membrane") {
      const cX = rect.width / 2, cY = rect.height / 2;
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
        setHoverData({ visible: true, x: e.clientX, y: e.clientY, px: membraneGeometry === "circular" ? r_m : mappedX, z: z_val * Math.cos(4.0 * time), energy: 0.5 * tension * z_val * z_val, nodeType: isNodal ? "Nodal Line (Zero amplitude)" : "Vibrating Membrane Point", definition: isNodal ? "Zero-displacement line. Sand accumulates here in Chladni patterns." : "Point oscillates transversely. Constructive/destructive interference in 2D." });
      } else { setHoverData((prev) => ({ ...prev, visible: false })); }
      return;
    }

    const clickX = u * length;
    const mu = density, T = tension, v_val = Math.sqrt(T / mu);
    let R_hover = -1, Z2_h = 0;
    if (boundaryType === "Fixed-Fixed") { R_hover = -1; Z2_h = 0; }
    else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") { R_hover = 1; Z2_h = 1e8; }
    else if (boundaryType === "Partially Reflective") { Z2_h = boundaryImpedance ?? 0; R_hover = (Z2_h - Math.sqrt(T * mu)) / (Z2_h + Math.sqrt(T * mu)); }

    let y_val = 0, dy_dt_val = 0, dy_dx_val = 0, k_h = 0, omega_h = 0;

    if (solverType === "analytical" && simMode !== "driven") {
      const n_eff = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
      k_h = boundaryType === "Fixed-Free" ? (n_eff * Math.PI) / (2 * length) : (n_eff * Math.PI) / length;
      omega_h = k_h * v_val;
      const beta = damping;
      const env = Math.exp(-beta * time);
      const t_v = time * slowMotionFactor;
      if (boundaryType === "Free-Free") {
        y_val = amplitude * env * Math.cos(k_h * clickX) * Math.cos(omega_h * t_v);
        dy_dt_val = (-beta * env * Math.cos(omega_h * t_v) - omega_h * env * Math.sin(omega_h * t_v)) * Math.cos(k_h * clickX) * amplitude;
        dy_dx_val = -k_h * amplitude * env * Math.sin(k_h * clickX) * Math.cos(omega_h * t_v);
      } else {
        y_val = amplitude * env * Math.sin(k_h * clickX) * Math.cos(omega_h * t_v);
        dy_dt_val = (-beta * env * Math.cos(omega_h * t_v) - omega_h * env * Math.sin(omega_h * t_v)) * Math.sin(k_h * clickX) * amplitude;
        dy_dx_val = k_h * amplitude * env * Math.cos(k_h * clickX) * Math.cos(omega_h * t_v);
      }
    } else {
      const y = yNumRef.current, y_prev = yPrevRef.current;
      const M = numGridSize;
      const ir = (clickX / length) * (M - 1);
      const il = Math.max(0, Math.floor(ir)), ih = Math.min(M - 1, Math.ceil(ir));
      const w = ir - il, dx = length / (M - 1);
      y_val = y[il] * (1 - w) + y[ih] * w;
      dy_dt_val = (y_val - (y_prev[il] * (1 - w) + y_prev[ih] * w)) / 0.005;
      dy_dx_val = (y[ih] - y[il]) / Math.max(1e-5, (ih - il) * dx);
    }

    const local_K = 0.5 * mu * dy_dt_val * dy_dt_val;
    const local_U = 0.5 * T * dy_dx_val * dy_dx_val;

    const n_eff2 = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
    const k_env = boundaryType === "Fixed-Free" ? (n_eff2 * Math.PI) / (2 * length) : (n_eff2 * Math.PI) / length;
    const envelope = Math.abs(boundaryType === "Free-Free" ? Math.cos(k_env * clickX) : Math.sin(k_env * clickX));
    let nodeType = "Intermediate Point";
    let definition = "Dynamic oscillation. Local superposition of propagating wavefronts.";
    if (envelope < 0.1) { nodeType = "Node (Zero Amplitude)"; definition = "Continuous destructive interference. Displacement perpetually zero."; }
    else if (envelope > 0.9) { nodeType = "Antinode (Maximum Amplitude)"; definition = "Continuous constructive interference. Maximum displacement excursion."; }

    setHoverData({ visible: true, x: e.clientX, y: e.clientY, px: clickX, z: y_val, energy: local_K + local_U, nodeType, definition });
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
        onMouseLeave={() => { isDraggingProbeRef.current = false; setHoverData((prev) => ({ ...prev, visible: false })); }}
      />

      <div className="absolute top-24 left-6 flex flex-col gap-2 pointer-events-none z-10 select-none">
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
          τ_vis = {slowMotionFactor.toFixed(3)}×  |  ωt_phase ∝ {slowMotionFactor.toFixed(3)} real-time
        </div>
      </div>

      <AnimatePresence>
        {hoverData.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.08 }}
            className="fixed pointer-events-none z-50 bg-black/95 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl max-w-[280px]"
            style={{
              left: hoverData.x + 20,
              top: hoverData.y + 20,
              transform: `translate(${hoverData.x > window.innerWidth - 300 ? "-120%" : "0"}, ${hoverData.y > window.innerHeight - 250 ? "-120%" : "0"})`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hoverData.nodeType.includes("Node") ? "bg-rose-500" : hoverData.nodeType.includes("Antinode") ? "bg-emerald-500" : "bg-cyan-500"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{hoverData.nodeType}</span>
            </div>
            <p className="text-[9px] text-white/50 leading-relaxed mb-3">{hoverData.definition}</p>
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Position (x)</span>
                <span className="text-xs font-mono font-bold text-white/80">{hoverData.px.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Displacement</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{(hoverData.z * 100).toFixed(2)} cm</span>
              </div>
              {systemType !== "air" && (
                <div className="flex justify-between gap-6">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Local u(x,t)</span>
                  <span className="text-xs font-mono font-bold text-fuchsia-400">{hoverData.energy.toExponential(3)} J/m</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

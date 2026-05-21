"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BoundaryType = "Fixed-Fixed" | "Free-Free" | "Fixed-Free";
export type RenderMode = "Displacement" | "Energy" | "Phase" | "Scientific";
export type SystemType = "string" | "air" | "membrane";

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
}

// Zeros of the Bessel functions of the first kind J_m(x)
// For m = 0, 1, 2, 3 and n = 1, 2, 3, 4
const BESSEL_ZEROS: { [m: number]: number[] } = {
  0: [2.4048, 5.5201, 8.6537, 11.7915],
  1: [3.8317, 7.0156, 10.1735, 13.3237],
  2: [5.1356, 8.4172, 11.6198, 14.7960],
  3: [6.3802, 9.7610, 13.0152, 16.2235]
};

// Factorial helper
const factorial = (n: number): number => {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

// Bessel function of the first kind J_m(x)
const besselJ = (m: number, x: number): number => {
  const absX = Math.abs(x);
  if (absX === 0) return m === 0 ? 1 : 0;
  if (absX < 20) {
    let sum = 0;
    // 12 terms are extremely accurate for x < 20
    for (let k = 0; k <= 12; k++) {
      const numerator = Math.pow(-1, k) * Math.pow(absX / 2, 2 * k + m);
      const denominator = factorial(k) * factorial(k + m);
      sum += numerator / denominator;
    }
    return x < 0 && m % 2 !== 0 ? -sum : sum;
  }
  // Asymptotic approximation for large x
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dragging probe state
  const isDraggingProbeRef = useRef(false);

  // Numerical 1D Wave Solver state
  const numGridSize = discreteBeads ? 15 : 60;
  const yNumRef = useRef<Float32Array>(new Float32Array(numGridSize));
  const yPrevRef = useRef<Float32Array>(new Float32Array(numGridSize));
  const timeNumRef = useRef(0);
  const prevParamsRef = useRef({ length, boundaryType, simMode, harmonic, drivingFrequency, discreteBeads });

  // Draggable Probe Phase Space History
  const phaseHistoryRef = useRef<{ y: number; v: number }[]>([]);

  // Air Column Particle system
  const airParticlesRef = useRef<{ x0: number; y0: number }[]>([]);

  // Chladni 2D sand particle system
  const sandParticlesRef = useRef<{ x: number; y: number }[]>([]);

  // Hover Probe overlay state
  const [hoverData, setHoverData] = useState({
    visible: false, x: 0, y: 0, px: 0, z: 0, energy: 0, nodeType: "", definition: ""
  });

  // Re-initialize air molecules
  const initializeAirParticles = () => {
    const pts = [];
    for (let i = 0; i < 300; i++) {
      pts.push({
        x0: Math.random() * length,
        y0: (Math.random() - 0.5) * 100 // pipe height is 120, keep away from boundaries
      });
    }
    airParticlesRef.current = pts;
  };

  // Re-initialize sand particles
  const initializeSandParticles = () => {
    const pts = [];
    const Lx = 440;
    const Ly = 360;
    const a = 220; // circular plate radius
    
    if (membraneGeometry === "rectangular") {
      for (let i = 0; i < 1500; i++) {
        pts.push({
          x: (Math.random() - 0.5) * Lx,
          y: (Math.random() - 0.5) * Ly
        });
      }
    } else {
      for (let i = 0; i < 1500; i++) {
        const r = Math.sqrt(Math.random()) * a;
        const theta = Math.random() * 2 * Math.PI;
        pts.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta)
        });
      }
    }
    sandParticlesRef.current = pts;
  };

  // Initialize numerical string wave state
  const initializeNumericalWave = () => {
    const M = numGridSize;
    const y = new Float32Array(M);
    const y_prev = new Float32Array(M);

    if (simMode === "harmonic") {
      // Initialize with analytical standing mode shape at t=0
      let k_val = 0;
      if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" || boundaryType === "Partially Reflective") {
        k_val = (harmonic * Math.PI) / length;
      } else if (boundaryType === "Fixed-Free") {
        const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
        k_val = (oddHarmonic * Math.PI) / (2 * length);
      }

      for (let i = 0; i < M; i++) {
        const x = (i / (M - 1)) * length;
        let y_init = 0;
        if (boundaryType === "Free-Free") {
          y_init = amplitude * Math.cos(k_val * x);
        } else {
          y_init = amplitude * Math.sin(k_val * x);
        }
        y[i] = y_init;
        y_prev[i] = y_init; // Zero velocity initially
      }
    } else {
      // Driven sweep starts flat
      for (let i = 0; i < M; i++) {
        y[i] = 0;
        y_prev[i] = 0;
      }
    }
    yNumRef.current = y;
    yPrevRef.current = y_prev;
    timeNumRef.current = 0;
    phaseHistoryRef.current = [];
  };

  // Re-initializations on mount or geometry/mode changes
  useEffect(() => {
    initializeAirParticles();
  }, [length]);

  useEffect(() => {
    initializeSandParticles();
  }, [membraneGeometry, m2D, n2D, amplitude]);

  useEffect(() => {
    initializeNumericalWave();
  }, [length, boundaryType, simMode, harmonic, discreteBeads, amplitude]);

  // Spring rendering helper
  const drawSpring = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, coils = 7) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      if (i === 0 || i === coils) {
        ctx.lineTo(px, py);
      } else {
        const offset = (i % 2 === 0 ? 1 : -1) * 7;
        ctx.lineTo(px + nx * offset, py + ny * offset);
      }
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };

  // Main canvas simulation and rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastFrameTime = performance.now();

    const render = (now: number) => {
      const dt_frame = Math.min(0.03, (now - lastFrameTime) / 1000); // Cap frame step at 30ms to prevent jumps
      lastFrameTime = now;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        ctx.moveTo(0, (height / 10) * i);
        ctx.lineTo(width, (height / 10) * i);
        ctx.moveTo((width / 10) * i, 0);
        ctx.lineTo((width / 10) * i, height);
      }
      ctx.stroke();

      const isDriven = simMode === "driven";
      const mu = density;
      const T = tension;
      const v = Math.min(400, Math.sqrt(T / mu)); // Cap wave speed at 400 m/s for stability
      const Z1 = Math.sqrt(T * mu);

      // Boundary R calculation
      let R = -1;
      let Z2 = 0;
      if (boundaryType === "Fixed-Fixed") {
        R = -1;
        Z2 = 0;
      } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
        R = 1;
        Z2 = 1e8;
      } else if (boundaryType === "Partially Reflective") {
        Z2 = boundaryImpedance !== undefined ? boundaryImpedance : 0;
        R = (Z2 - Z1) / (Z2 + Z1);
      }

      let y_net = (x: number) => 0;
      let dy_dt = (x: number) => 0;
      let omega = 0;
      let visualScale = 1;

      // ----------------------------------------------------
      // INTEGRATE NUMERICAL ENGINE
      // ----------------------------------------------------
      if (isPlaying && solverType === "numerical" && systemType !== "membrane") {
        const M = numGridSize;
        const dx = length / (M - 1);
        const y = yNumRef.current;
        const y_prev = yPrevRef.current;

        // Sub-stepping to maintain CFL stability
        const r_target = 0.8;
        const dt_stable = r_target * dx / v;
        const numSteps = Math.min(100, Math.ceil(dt_frame / dt_stable));
        const dt = dt_frame / numSteps;

        for (let step = 0; step < numSteps; step++) {
          timeNumRef.current += dt;
          const t_num = timeNumRef.current;
          const y_next = new Float32Array(M);
          const r = v * dt / dx;
          const beta = damping;

          // Inner nodes
          for (let i = 1; i < M - 1; i++) {
            const laplacian = y[i + 1] - 2 * y[i] + y[i - 1];
            y_next[i] = (2 * y[i] - y_prev[i] * (1 - beta * dt) + r * r * laplacian) / (1 + beta * dt);
          }

          // Left boundary (i = 0)
          if (isDriven) {
            y_next[0] = amplitude * Math.sin(2 * Math.PI * drivingFrequency * t_num);
          } else {
            if (boundaryType.startsWith("Fixed")) {
              y_next[0] = 0;
            } else {
              // Free boundary
              y_next[0] = (2 * y[0] - y_prev[0] * (1 - beta * dt) + 2 * r * r * (y[1] - y[0])) / (1 + beta * dt);
            }
          }

          // Right boundary (i = M - 1)
          if (boundaryType === "Fixed-Fixed") {
            y_next[M - 1] = 0;
          } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
            // Free boundary
            y_next[M - 1] = (2 * y[M - 1] - y_prev[M - 1] * (1 - beta * dt) + 2 * r * r * (y[M - 2] - y[M - 1])) / (1 + beta * dt);
          } else if (boundaryType === "Partially Reflective") {
            if (Z2 > 150) {
              y_next[M - 1] = 0;
            } else {
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
      }

      // ----------------------------------------------------
      // RENDER SYSTEM MODULES
      // ----------------------------------------------------
      if (systemType === "string") {
        // --- 1D STRING MODULE ---
        visualScale = ((height * 0.35) / 1.5) * (visualAmplitudeFactor / 5);
        const A_px = amplitude * visualScale;

        // Wave profile functions
        let y1 = (x: number) => 0;
        let y2 = (x: number) => 0;
        let dy_dx = (x: number) => 0;

        let lambda = 0;
        let k = 0;

        if (solverType === "analytical") {
          // --- ANALYTICAL FORMULATION ---
          if (!isDriven) {
            let n_eff = harmonic;
            if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" || boundaryType === "Partially Reflective") {
              lambda = (2 * length) / harmonic;
              k = (n_eff * Math.PI) / length;
            } else if (boundaryType === "Fixed-Free") {
              const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
              n_eff = oddHarmonic;
              lambda = (4 * length) / oddHarmonic;
              k = (oddHarmonic * Math.PI) / (2 * length);
            }

            const omega_0 = k * v;
            const beta = damping;
            omega = Math.sqrt(Math.max(0, omega_0 * omega_0 - beta * beta));
            const envelope = Math.exp(-beta * time);

            if (boundaryType === "Free-Free") {
              y_net = (x: number) => A_px * envelope * Math.cos(k * x) * Math.cos(omega * time);
              y1 = (x: number) => 0.5 * A_px * envelope * Math.cos(k * x - omega * time);
              y2 = (x: number) => 0.5 * A_px * envelope * Math.cos(k * x + omega * time);
              dy_dt = (x: number) => {
                const A_t = A_px * envelope;
                const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
                return dA_dt * Math.cos(k * x);
              };
              dy_dx = (x: number) => -k * A_px * envelope * Math.sin(k * x) * Math.cos(omega * time);
            } else {
              y_net = (x: number) => A_px * envelope * Math.sin(k * x) * Math.cos(omega * time);
              y1 = (x: number) => 0.5 * A_px * envelope * Math.sin(k * x - omega * time);
              y2 = (x: number) => 0.5 * A_px * envelope * Math.sin(k * x + omega * time);
              dy_dt = (x: number) => {
                const A_t = A_px * envelope;
                const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
                return dA_dt * Math.sin(k * x);
              };
              dy_dx = (x: number) => k * A_px * envelope * Math.cos(k * x) * Math.cos(omega * time);
            }
          } else {
            // Driven Mode
            const f_d = drivingFrequency;
            omega = 2 * Math.PI * f_d;
            const beta = damping;

            const w_v2 = (omega * omega) / (v * v);
            const b_w_v2 = (beta * omega) / (v * v);
            k = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
            const alpha = k > 0 ? (beta * omega) / (v * v * k) : 0;
            lambda = k > 0 ? (2 * Math.PI) / k : 0;

            const exp_2aL = Math.exp(-2 * alpha * length);
            const den_re = 1 + R * exp_2aL * Math.cos(2 * k * length);
            const den_im = -R * exp_2aL * Math.sin(2 * k * length);
            const den_mag2 = den_re * den_re + den_im * den_im;

            const getComplexY = (x: number) => {
              const exp_ax = Math.exp(-alpha * x);
              const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
              const num_re = exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
              const num_im = -exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));

              const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
              const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;
              return { re: Y_re, im: Y_im };
            };

            const getComplexY1 = (x: number) => {
              const exp_ax = Math.exp(-alpha * x);
              const num_re = exp_ax * Math.cos(k * x);
              const num_im = -exp_ax * Math.sin(k * x);
              return {
                re: (num_re * den_re + num_im * den_im) / den_mag2,
                im: (num_im * den_re - num_re * den_im) / den_mag2
              };
            };

            const getComplexY2 = (x: number) => {
              const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
              const num_re = R * exp_a2Lx * Math.cos(k * (2 * length - x));
              const num_im = -R * exp_a2Lx * Math.sin(k * (2 * length - x));
              return {
                re: (num_re * den_re + num_im * den_im) / den_mag2,
                im: (num_im * den_re - num_re * den_im) / den_mag2
              };
            };

            y_net = (x: number) => {
              const Y = getComplexY(x);
              return A_px * (Y.re * Math.cos(omega * time) - Y.im * Math.sin(omega * time));
            };
            y1 = (x: number) => {
              const Y1 = getComplexY1(x);
              return A_px * (Y1.re * Math.cos(omega * time) - Y1.im * Math.sin(omega * time));
            };
            y2 = (x: number) => {
              const Y2 = getComplexY2(x);
              return A_px * (Y2.re * Math.cos(omega * time) - Y2.im * Math.sin(omega * time));
            };
            dy_dt = (x: number) => {
              const Y = getComplexY(x);
              return -omega * A_px * (Y.re * Math.sin(omega * time) + Y.im * Math.cos(omega * time));
            };
            dy_dx = (x: number) => {
              const exp_ax = Math.exp(-alpha * x);
              const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
              const term_re = -exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
              const term_im = exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));
              const num_prime_re = alpha * term_re - k * term_im;
              const num_prime_im = alpha * term_im + k * term_re;
              const Yp_re = (num_prime_re * den_re + num_prime_im * den_im) / den_mag2;
              const Yp_im = (num_prime_im * den_re - num_prime_re * den_im) / den_mag2;
              return A_px * (Yp_re * Math.cos(omega * time) - Yp_im * Math.sin(omega * time));
            };
          }
        } else {
          // --- NUMERICAL INTERPOLATOR ---
          const y = yNumRef.current;
          const y_prev = yPrevRef.current;
          const M = numGridSize;

          y_net = (x: number) => {
            const idx_raw = (x / length) * (M - 1);
            const idx_l = Math.max(0, Math.floor(idx_raw));
            const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
            const w = idx_raw - idx_l;
            // Scale interpolation
            return (y[idx_l] * (1 - w) + y[idx_h] * w) * visualScale;
          };

          dy_dt = (x: number) => {
            const idx_raw = (x / length) * (M - 1);
            const idx_l = Math.max(0, Math.floor(idx_raw));
            const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
            const w = idx_raw - idx_l;
            // dy/dt ≈ (y - y_prev)/dt
            const dt = 0.005; // approximation for derivative scaling
            const v_l = (y[idx_l] - y_prev[idx_l]) / dt;
            const v_h = (y[idx_h] - y_prev[idx_h]) / dt;
            return (v_l * (1 - w) + v_h * w) * visualScale;
          };

          dy_dx = (x: number) => {
            const idx_raw = (x / length) * (M - 1);
            const idx_l = Math.max(0, Math.floor(idx_raw));
            const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
            const dx = length / (M - 1);
            // spatial derivative central difference
            const dy = (y[idx_h] - y[idx_l]) / Math.max(1e-5, (idx_h - idx_l) * dx);
            return dy * visualScale;
          };
        }

        const isScientific = renderMode === "Scientific";
        const isEnergyMode = renderMode === "Energy";

        // Center line reference
        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(50, height / 2);
        ctx.lineTo(width - 50, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isEnergyMode) {
          // --- REAL ENERGY DENSITY OVERLAY ---
          const E_ref = 0.5 * mu * Math.pow(amplitude * (omega || 20), 2) + 0.5 * T * Math.pow(amplitude * (k || 5), 2);
          const visualEnergyScale = (height * 0.28) / Math.max(1e-4, E_ref);

          // Kinetic Energy Density (dashed green)
          ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          for (let px = 50; px <= width - 50; px++) {
            const x = ((px - 50) / (width - 100)) * length;
            const dy_dt_real = dy_dt(x) / visualScale;
            const K = 0.5 * mu * dy_dt_real * dy_dt_real;
            const py = height / 2 - K * visualEnergyScale;
            if (px === 50) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // Elastic Potential Energy Density (dashed orange)
          ctx.strokeStyle = "rgba(249, 115, 22, 0.6)";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          for (let px = 50; px <= width - 50; px++) {
            const x = ((px - 50) / (width - 100)) * length;
            const dy_dx_real = dy_dx(x) / visualScale;
            const U = 0.5 * T * dy_dx_real * dy_dx_real;
            const py = height / 2 - U * visualEnergyScale;
            if (px === 50) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Total Energy Density (solid fuchsia with glowing fill)
          ctx.strokeStyle = "#d946ef";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "rgba(217, 70, 239, 0.4)";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          const energyPts: [number, number][] = [];
          for (let px = 50; px <= width - 50; px++) {
            const x = ((px - 50) / (width - 100)) * length;
            const dy_dt_real = dy_dt(x) / visualScale;
            const dy_dx_real = dy_dx(x) / visualScale;
            const K = 0.5 * mu * dy_dt_real * dy_dt_real;
            const U = 0.5 * T * dy_dx_real * dy_dx_real;
            const E = K + U;
            const py = height / 2 - E * visualEnergyScale;
            energyPts.push([px, py]);
            if (px === 50) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Fill under Total Energy curve
          ctx.fillStyle = "rgba(217, 70, 239, 0.05)";
          ctx.beginPath();
          ctx.moveTo(50, height / 2);
          for (let pt of energyPts) ctx.lineTo(pt[0], pt[1]);
          ctx.lineTo(width - 50, height / 2);
          ctx.closePath();
          ctx.fill();

          // Energy Legends
          ctx.font = "9px monospace";
          ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
          ctx.fillText("--- KE Density (J/m)", 60, 40);
          ctx.fillStyle = "rgba(249, 115, 22, 0.8)";
          ctx.fillText("--- PE Density (J/m)", 210, 40);
          ctx.fillStyle = "#d946ef";
          ctx.fillText("—— Total Energy Density (J/m)", 360, 40);
        } else {
          // --- STANDARD DISPLACEMENT MODE RENDER ---
          // Draw Component waves if enabled
          if (showComponents && solverType === "analytical") {
            // Forward traveling (Cyan)
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              ctx.lineTo(px, height / 2 - y1(x));
            }
            ctx.stroke();

            // Backward traveling (Rose)
            ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              ctx.lineTo(px, height / 2 - y2(x));
            }
            ctx.stroke();
          }

          if (discreteBeads) {
            // --- DISCRETE COUPLED OSCILLATOR (BEADS) ---
            const M = numGridSize;
            const beadCoords: [number, number][] = [];
            for (let i = 0; i < M; i++) {
              const x_m = (i / (M - 1)) * length;
              const px = 50 + (i / (M - 1)) * (width - 100);
              const py = height / 2 - y_net(x_m);
              beadCoords.push([px, py]);
            }

            // Draw Springs
            for (let i = 0; i < M - 1; i++) {
              drawSpring(ctx, beadCoords[i][0], beadCoords[i][1], beadCoords[i + 1][0], beadCoords[i + 1][1]);
            }

            // Draw Beads
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
            ctx.lineWidth = 1.5;
            for (let i = 0; i < M; i++) {
              ctx.beginPath();
              // Make boundary beads color coded if fixed/free
              if (i === 0 && isDriven) ctx.fillStyle = "#38bdf8";
              else if ((i === 0 || i === M - 1) && boundaryType.startsWith("Fixed")) ctx.fillStyle = "#ef4444";
              else ctx.fillStyle = "#ffffff";

              ctx.arc(beadCoords[i][0], beadCoords[i][1], 6.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          } else {
            // --- CONTINUOUS STRING WAVE ---
            ctx.beginPath();
            for (let px = 50; px <= width - 50; px++) {
              const x = ((px - 50) / (width - 100)) * length;
              const py = height / 2 - y_net(x);
              if (px === 50) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }

            ctx.lineWidth = isScientific ? 2.5 : 4.5;
            if (renderMode === "Displacement") {
              ctx.strokeStyle = "#ffffff";
              ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
              ctx.shadowBlur = 12;
            } else if (renderMode === "Phase") {
              const phaseVal = ((omega || 1) * time) % (2 * Math.PI);
              ctx.strokeStyle = `hsl(${(phaseVal / (2 * Math.PI)) * 360}, 95%, 65%)`;
              ctx.shadowColor = `hsla(${(phaseVal / (2 * Math.PI)) * 360}, 95%, 65%, 0.3)`;
              ctx.shadowBlur = 12;
            } else {
              ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // --- NODE / ANTINODE POSITION MARKERS ---
          const nodes: number[] = [];
          const antinodes: number[] = [];

          if (solverType === "analytical") {
            if (!isDriven) {
              if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
                for (let i = 0; i <= harmonic; i++) nodes.push((i * lambda) / 2);
                for (let i = 0; i < harmonic; i++) antinodes.push(((i + 0.5) * lambda) / 2);
              } else if (boundaryType === "Free-Free") {
                for (let i = 0; i < harmonic; i++) nodes.push(((i + 0.5) * lambda) / 2);
                for (let i = 0; i <= harmonic; i++) antinodes.push((i * lambda) / 2);
              } else if (boundaryType === "Fixed-Free") {
                const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
                for (let m = 0; (m * lambda) / 2 <= length + 0.01; m++) nodes.push((m * lambda) / 2);
                for (let m = 0; (m + 0.5) * lambda / 2 <= length + 0.01; m++) antinodes.push(((m + 0.5) * lambda) / 2);
              }
            } else {
              if (k > 0) {
                const phi_R = R < 0 ? Math.PI : 0;
                // Analytical node equations for driven wave matching impedance phase shift
                for (let m = 0; m < 12; m++) {
                  const x = length - ((2 * m + 1) * Math.PI + phi_R) / (2 * k);
                  if (x >= -0.01 && x <= length + 0.01) nodes.push(x);
                }
                for (let m = 0; m < 12; m++) {
                  const x = length - (2 * m * Math.PI + phi_R) / (2 * k);
                  if (x >= -0.01 && x <= length + 0.01) antinodes.push(x);
                }
              }
            }
          } else {
            // Numerical mode shapes - find local envelope mins/maxs
            const y = yNumRef.current;
            const M = numGridSize;
            // In numerical mode, look for zeros of displacement projection or static spatial profiles
            // We can approximate nodes using harmonic indices
            const activeH = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
            const lam_num = (boundaryType === "Fixed-Free") ? (4 * length / activeH) : (2 * length / activeH);
            
            if (boundaryType === "Free-Free") {
              for (let i = 0; i < activeH; i++) nodes.push(((i + 0.5) * lam_num) / 2);
              for (let i = 0; i <= activeH; i++) antinodes.push((i * lam_num) / 2);
            } else if (boundaryType === "Fixed-Free") {
              for (let m = 0; (m * lam_num) / 2 <= length + 0.01; m++) nodes.push((m * lam_num) / 2);
              for (let m = 0; (m + 0.5) * lam_num / 2 <= length + 0.01; m++) antinodes.push(((m + 0.5) * lam_num) / 2);
            } else {
              for (let i = 0; i <= activeH; i++) nodes.push((i * lam_num) / 2);
              for (let i = 0; i < activeH; i++) antinodes.push(((i + 0.5) * lam_num) / 2);
            }
          }

          // Draw Nodes (Red markers at equilibrium)
          if (showNodes) {
            ctx.fillStyle = isScientific ? "#ffffff" : "#ef4444";
            nodes.forEach((x) => {
              const px = 50 + (x / length) * (width - 100);
              ctx.beginPath();
              ctx.arc(px, height / 2, 6, 0, Math.PI * 2);
              ctx.fill();

              if (!isScientific) {
                ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
                ctx.beginPath();
                ctx.arc(px, height / 2, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ef4444";
              }
            });
          }

          // Draw Antinodes (Green markers + Phase direction indicator arrows)
          if (showAntinodes) {
            antinodes.forEach((x) => {
              const px = 50 + (x / length) * (width - 100);
              const displacement = y_net(x);
              const py = height / 2 - displacement;

              ctx.fillStyle = isScientific ? "#ffffff" : "#10b981";
              ctx.beginPath();
              ctx.arc(px, py, 6, 0, Math.PI * 2);
              ctx.fill();

              // Calculate arrow displacement direction
              let direction = y_net(x) > 0 ? 1 : -1;
              if (Math.abs(y_net(x)) < 1) direction = 0;

              if (direction !== 0 && !isScientific) {
                ctx.strokeStyle = direction > 0 ? "#10b981" : "#f43f5e";
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(px, height / 2);
                ctx.lineTo(px, height / 2 - direction * 35);
                ctx.stroke();

                ctx.fillStyle = direction > 0 ? "#10b981" : "#f43f5e";
                ctx.beginPath();
                ctx.moveTo(px - 4.5, height / 2 - direction * 29);
                ctx.lineTo(px + 4.5, height / 2 - direction * 29);
                ctx.lineTo(px, height / 2 - direction * 36);
                ctx.fill();
              }
            });
          }
        }

        // Draw boundaries
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
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(50, height / 2, 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
            ctx.font = "bold 8.5px monospace";
            ctx.fillText("FREE ANTINODE (0 SHIFT)", 60, height / 2 - 28);
          }
        }

        if (boundaryType === "Fixed-Fixed") {
          ctx.fillRect(width - 50, height / 2 - 25, 6, 50);
          ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText("FIXED NODE (π SHIFT)", width - 180, height / 2 - 28);
        } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(width - 50, height / 2, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText("FREE ANTINODE (0 SHIFT)", width - 200, height / 2 - 28);
        } else if (boundaryType === "Partially Reflective") {
          ctx.fillRect(width - 48, height / 2 - 25, 3, 50);
          ctx.fillStyle = "rgba(217, 70, 239, 0.9)";
          ctx.font = "bold 8.5px monospace";
          ctx.fillText(`LOAD IMPEDANCE (Z_2 = ${boundaryImpedance.toFixed(1)}, R = ${R.toFixed(2)})`, width - 290, height / 2 - 28);
        }

      } else if (systemType === "air") {
        // --- 1D ACOUSTIC AIR COLUMN PIPE MODULE ---
        const pipeX = 100;
        const pipeY = height / 2 - 60;
        const pipeW = width - 200;
        const pipeH = 120;

        // Draw Pressure Field Overlay ( Crimson Red [high pressure] to Deep Cyan [low pressure] )
        const samples = 150;
        const dx_px = pipeW / samples;
        visualScale = 35;
        const A_px = amplitude * visualScale; // particle displacement scale

        let s_disp = (x: number) => 0;
        let p_press = (x: number) => 0;
        let lambda = 0;
        let k = 0;

        if (solverType === "analytical") {
          if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
            // Equivalent to open-open pipe (pressure nodes at ends, displacement antinodes)
            // Wait, Fixed-Fixed boundaries for string = y(0)=y(L)=0 (nodes).
            // But for an air column:
            // "Fixed-Fixed" state in UI is mapped to Open-Open pipe (displacement antinodes at ends)
            // "Fixed-Free" state in UI is mapped to Closed-Open pipe (displacement node at closed left, displacement antinode at open right)
            // Let's implement this mapping:
            // "Fixed-Fixed" UI State -> Open-Open Pipe: s(x,t) = A cos(kx) cos(wt), p(x,t) = -B ds/dx = B k A sin(kx) cos(wt)
            // "Fixed-Free" UI State -> Closed-Open Pipe: s(x,t) = A sin(kx) cos(wt), p(x,t) = -B ds/dx = -B k A cos(kx) cos(wt)
            if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
              lambda = (2 * length) / harmonic;
              k = (harmonic * Math.PI) / length;
              omega = k * v;
              s_disp = (x: number) => A_px * Math.cos(k * x) * Math.cos(omega * time);
              p_press = (x: number) => Math.sin(k * x) * Math.cos(omega * time); // normalised pressure
            } else {
              // Closed-Open (Fixed-Free)
              const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
              lambda = (4 * length) / oddHarmonic;
              k = (oddHarmonic * Math.PI) / (2 * length);
              omega = k * v;
              s_disp = (x: number) => A_px * Math.sin(k * x) * Math.cos(omega * time);
              p_press = (x: number) => -Math.cos(k * x) * Math.cos(omega * time); // normalised pressure
            }
          } else {
            // "Free-Free" UI State -> Open-Open Pipe (with cos/sin shifts)
            lambda = (2 * length) / harmonic;
            k = (harmonic * Math.PI) / length;
            omega = k * v;
            s_disp = (x: number) => A_px * Math.cos(k * x) * Math.cos(omega * time);
            p_press = (x: number) => Math.sin(k * x) * Math.cos(omega * time);
          }

          y_net = s_disp;
          dy_dt = (x: number) => {
            if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective" || boundaryType === "Free-Free") {
              return -omega * A_px * Math.cos(k * x) * Math.sin(omega * time);
            } else {
              return -omega * A_px * Math.sin(k * x) * Math.sin(omega * time);
            }
          };
        } else {
          // Numerical Solver interpolation
          const y = yNumRef.current;
          const y_prev = yPrevRef.current;
          const M = numGridSize;
          s_disp = (x: number) => {
            const idx_raw = (x / length) * (M - 1);
            const idx_l = Math.max(0, Math.floor(idx_raw));
            const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
            const w = idx_raw - idx_l;
            return (y[idx_l] * (1 - w) + y[idx_h] * w) * 35;
          };

          p_press = (x: number) => {
            // pressure = -ds/dx (spatial gradient of displacement)
            const idx_raw = (x / length) * (M - 1);
            const idx_l = Math.max(0, Math.floor(idx_raw));
            const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
            const dx = length / (M - 1);
            const dy = (y[idx_h] - y[idx_l]) / Math.max(1e-5, (idx_h - idx_l) * dx);
            return -dy * 1.5; // scaling factor
          };

          y_net = s_disp;
          dy_dt = (x: number) => {
            const idx_raw = (x / length) * (M - 1);
            const idx_l = Math.max(0, Math.floor(idx_raw));
            const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
            const w = idx_raw - idx_l;
            const dt = 0.005; // approximation for derivative scaling
            const v_l = (y[idx_l] - y_prev[idx_l]) / dt;
            const v_h = (y[idx_h] - y_prev[idx_h]) / dt;
            return (v_l * (1 - w) + v_h * w) * 35;
          };
        }

        // Draw pressure gradients inside pipe
        for (let i = 0; i < samples; i++) {
          const px = pipeX + i * dx_px;
          const x = (i / samples) * length;
          const P = p_press(x);
          
          let color = "rgba(128,128,128,0.05)";
          if (P > 0) {
            // Crimson compression
            color = `rgba(239, 68, 68, ${Math.min(0.65, P * 0.7)})`;
          } else {
            // Cyan rarefaction
            color = `rgba(56, 189, 248, ${Math.min(0.65, Math.abs(P) * 0.7)})`;
          }

          ctx.fillStyle = color;
          ctx.fillRect(px, pipeY + 1, dx_px + 0.5, pipeH - 2);
        }

        // Draw Air Molecule particles
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        const particles = airParticlesRef.current;
        for (let p of particles) {
          const s = s_disp(p.x0);
          const px = pipeX + (p.x0 / length) * pipeW + s;
          const py = pipeY + pipeH / 2 + p.y0;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Pipe boundaries
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.5;
        
        ctx.beginPath();
        // Top boundary
        ctx.moveTo(pipeX, pipeY);
        ctx.lineTo(pipeX + pipeW, pipeY);
        // Bottom boundary
        ctx.moveTo(pipeX, pipeY + pipeH);
        ctx.lineTo(pipeX + pipeW, pipeY + pipeH);
        ctx.stroke();

        // End Caps (Solid if closed boundary, empty if open)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3.5;

        // Left End
        if (boundaryType === "Fixed-Free") {
          // Closed end (displacement node)
          ctx.beginPath();
          ctx.moveTo(pipeX, pipeY);
          ctx.lineTo(pipeX, pipeY + pipeH);
          ctx.stroke();
          ctx.fillStyle = "rgba(239,68,68,0.5)";
          ctx.font = "bold 9px monospace";
          ctx.fillText("CLOSED END (s = 0, p = max)", pipeX + 10, pipeY - 8);
        } else {
          // Open end
          ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
          ctx.font = "bold 9px monospace";
          ctx.fillText("OPEN END (s = max, p = 0)", pipeX + 10, pipeY - 8);
        }

        // Right End (always open for organ pipes in this selection)
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("OPEN END (s = max, p = 0)", pipeX + pipeW - 160, pipeY - 8);

        // Draw graph overlay underneath (displacement vs pressure curves)
        const curveY = height - 70;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pipeX, curveY);
        ctx.lineTo(pipeX + pipeW, curveY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot curves
        ctx.lineWidth = 2.2;
        // Displacement (Blue)
        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = pipeX + (i / samples) * pipeW;
          const x = (i / samples) * length;
          const py = curveY - (s_disp(x) / A_px) * 35;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Pressure (Crimson)
        ctx.strokeStyle = "#ef4444";
        ctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const px = pipeX + (i / samples) * pipeW;
          const x = (i / samples) * length;
          const py = curveY - p_press(x) * 35;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Legends
        ctx.font = "9px monospace";
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("—— Air Particle Displacement s(x)", pipeX, height - 20);
        ctx.fillStyle = "#ef4444";
        ctx.fillText("—— Acoustic Pressure deviation p(x)", pipeX + 260, height - 20);

      } else if (systemType === "membrane") {
        // --- 2D MEMBRANE MODES & CHLADNI LAB ---
        const centerX = width / 2;
        const centerY = height / 2;
        const Lx = 440;
        const Ly = 360;
        const radius = 220;
        const isRect = membraneGeometry === "rectangular";

        // Boundary zeros and wave constants
        const k_mn = isRect ? 0 : (BESSEL_ZEROS[m2D]?.[n2D - 1] || 2.4048) / radius;
        const omega_mem = 4.0; // temporal phase rate for visualization

        // Render Displacement Field mesh overlay
        if (!sandPattern) {
          const stepX = 12;
          const stepY = 12;

          for (let x = -Lx/2; x <= Lx/2; x += stepX) {
            for (let y = -Ly/2; y <= Ly/2; y += stepY) {
              // Boundary clamp filters
              if (!isRect && (x*x + y*y) > radius*radius) continue;

              let z = 0;
              if (isRect) {
                const x_norm = (x + Lx/2) / Lx;
                const y_norm = (y + Ly/2) / Ly;
                z = amplitude * Math.sin(m2D * Math.PI * x_norm) * Math.sin(n2D * Math.PI * y_norm) * Math.cos(omega_mem * time);
              } else {
                const r = Math.sqrt(x*x + y*y);
                const theta = Math.atan2(y, x);
                z = amplitude * besselJ(m2D, k_mn * r) * Math.cos(m2D * theta) * Math.cos(omega_mem * time);
              }

              // Normalised color displacement
              let color = "rgba(128,128,128,0.1)";
              if (z > 0.01) {
                color = `rgba(239, 68, 68, ${Math.min(0.85, z * 0.85)})`; // Crimson positive displacement
              } else if (z < -0.01) {
                color = `rgba(56, 189, 248, ${Math.min(0.85, Math.abs(z) * 0.85)})`; // Cyan negative displacement
              }

              ctx.fillStyle = color;
              ctx.fillRect(centerX + x - stepX/2, centerY + y - stepY/2, stepX, stepY);
            }
          }
        } else {
          // --- CHLADNI SAND PHYSICS SIMULATION UPDATE ---
          if (isPlaying) {
            const particles = sandParticlesRef.current;
            const eps = 2.0;

            const calcAmpVal = (px: number, py: number) => {
              if (isRect) {
                if (Math.abs(px) > Lx/2 || Math.abs(py) > Ly/2) return 0;
                const x_norm = (px + Lx/2) / Lx;
                const y_norm = (py + Ly/2) / Ly;
                return amplitude * Math.sin(m2D * Math.PI * x_norm) * Math.sin(n2D * Math.PI * y_norm);
              } else {
                const r = Math.sqrt(px*px + py*py);
                if (r > radius) return 0;
                const theta = Math.atan2(py, px);
                return amplitude * besselJ(m2D, k_mn * r) * Math.cos(m2D * theta);
              }
            };

            for (let p of particles) {
              const amp_center = Math.abs(calcAmpVal(p.x, p.y));

              // Spatial gradient derivation
              const amp_r = Math.abs(calcAmpVal(p.x + eps, p.y));
              const amp_l = Math.abs(calcAmpVal(p.x - eps, p.y));
              const amp_d = Math.abs(calcAmpVal(p.x, p.y + eps));
              const amp_u = Math.abs(calcAmpVal(p.x, p.y - eps));

              const gradX = (amp_r - amp_l) / (2 * eps);
              const gradY = (amp_d - amp_u) / (2 * eps);

              // Bouncing kick proportional to acceleration (amp_center)
              const kickStrength = amp_center * 5.2;
              if (amp_center > 0.03) {
                p.x += (Math.random() - 0.5) * kickStrength;
                p.y += (Math.random() - 0.5) * kickStrength;
              }

              // Slide sand particles down the amplitude slope (gradient drift)
              p.x -= gradX * 10.0;
              p.y -= gradY * 10.0;

              // Enforce bounds
              if (isRect) {
                if (p.x > Lx/2) p.x = Lx/2;
                else if (p.x < -Lx/2) p.x = -Lx/2;
                if (p.y > Ly/2) p.y = Ly/2;
                else if (p.y < -Ly/2) p.y = -Ly/2;
              } else {
                const r = Math.sqrt(p.x*p.x + p.y*p.y);
                if (r > radius) {
                  p.x = p.x * (radius / r) * 0.99;
                  p.y = p.y * (radius / r) * 0.99;
                }
              }
            }
          }

          // Draw Sand Particles
          ctx.fillStyle = "rgba(245, 158, 11, 0.75)"; // Gold/Amber sand particles
          const particles = sandParticlesRef.current;
          for (let p of particles) {
            ctx.beginPath();
            ctx.arc(centerX + p.x, centerY + p.y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw Clamping Plate Frame
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        if (isRect) {
          ctx.rect(centerX - Lx/2, centerY - Ly/2, Lx, Ly);
        } else {
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label Mode
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 10px monospace";
        if (isRect) {
          ctx.fillText(`RECTANGULAR MODE (m = ${m2D}, n = ${n2D})`, centerX - Lx/2, centerY - Ly/2 - 10);
        } else {
          ctx.fillText(`CIRCULAR DRUMHEAD MODE (m = ${m2D}, n = ${n2D})`, centerX - radius, centerY - radius - 10);
        }
      }

      // ----------------------------------------------------
      // DRAW CORNER HUD OVERLAYS
      // ----------------------------------------------------
      if (systemType !== "membrane") {
        const M = numGridSize;
        const currentY = new Float32Array(M);
        const prevY = new Float32Array(M);

        if (solverType === "numerical") {
          currentY.set(yNumRef.current);
          prevY.set(yPrevRef.current);
        } else {
          // Samples analytical function for overlays
          const dx = length / (M - 1);
          for (let i = 0; i < M; i++) {
            const x = i * dx;
            // analytical displacement and velocities
            const y_val = y_net(x) / visualScale;
            currentY[i] = y_val;
            prevY[i] = y_val - (dy_dt(x) / visualScale) * 0.005; // backward step approximation
          }
        }

        // Draggable vertical probe line drawing
        const probePx = 50 + (probeX / length) * (width - 100);
        ctx.strokeStyle = "rgba(217, 70, 239, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(probePx, 20);
        ctx.lineTo(probePx, height - 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Handle drawing
        ctx.fillStyle = "#d946ef";
        ctx.beginPath();
        ctx.moveTo(probePx - 5, 20);
        ctx.lineTo(probePx + 5, 20);
        ctx.lineTo(probePx, 27);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(probePx - 5, height - 20);
        ctx.lineTo(probePx + 5, height - 20);
        ctx.lineTo(probePx, height - 27);
        ctx.closePath();
        ctx.fill();

        // 1. PHASE SPACE HUD
        if (showPhaseSpace) {
          const hudX = 24;
          const hudY = height - 170;
          const hudW = 160;
          const hudH = 140;

          // Panel background
          ctx.fillStyle = "rgba(10, 10, 12, 0.88)";
          ctx.strokeStyle = "rgba(217, 70, 239, 0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(hudX, hudY, hudW, hudH, 14);
          ctx.fill();
          ctx.stroke();

          // Title
          ctx.fillStyle = "#d946ef";
          ctx.font = "bold 7.5px monospace";
          ctx.fillText("PHASE SPACE: y vs dy/dt", hudX + 10, hudY + 16);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText(`PROBE AT x = ${probeX.toFixed(2)}m`, hudX + 10, hudY + 26);

          // Grid axes
          const axesX = hudX + hudW / 2;
          const axesY = hudY + hudH / 2 + 10;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(hudX + 10, axesY);
          ctx.lineTo(hudX + hudW - 10, axesY);
          ctx.moveTo(axesX, hudY + 36);
          ctx.lineTo(axesX, hudY + hudH - 10);
          ctx.stroke();

          // Calculate probe states
          const probeIdx = Math.max(0, Math.min(M - 1, Math.round((probeX / length) * (M - 1))));
          const y_probe = currentY[probeIdx];
          const dt_derive = 0.005;
          const v_probe = (currentY[probeIdx] - prevY[probeIdx]) / dt_derive;

          if (isPlaying) {
            const history = phaseHistoryRef.current;
            history.push({ y: y_probe, v: v_probe });
            if (history.length > 140) history.shift();
          }

          // Plot orbit history
          const history = phaseHistoryRef.current;
          if (history.length > 1) {
            ctx.strokeStyle = "rgba(217, 70, 239, 0.85)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < history.length; i++) {
              // scale factors
              const px = axesX + (history[i].y / amplitude) * 55;
              const py = axesY - (history[i].v / (amplitude * (omega || 20))) * 35;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          // Dot at current state
          const curPx = axesX + (y_probe / amplitude) * 55;
          const curPy = axesY - (v_probe / (amplitude * (omega || 20))) * 35;
          ctx.fillStyle = "#d946ef";
          ctx.beginPath();
          ctx.arc(curPx, curPy, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. SPATIAL FOURIER HUD
        if (showFourier) {
          const hudX = width - 184;
          const hudY = height - 170;
          const hudW = 160;
          const hudH = 140;

          // Panel background
          ctx.fillStyle = "rgba(10, 10, 12, 0.88)";
          ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(hudX, hudY, hudW, hudH, 14);
          ctx.fill();
          ctx.stroke();

          // Title
          ctx.fillStyle = "#a78bfa";
          ctx.font = "bold 7.5px monospace";
          ctx.fillText("SPATIAL FOURIER SPECTRUM", hudX + 10, hudY + 16);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText("RELATIVE MODE ACTIVATION P(n)", hudX + 10, hudY + 26);

          // Compute real Fourier spatial overlap integrals
          const weights: number[] = [];
          for (let n = 1; n <= 6; n++) {
            let sum = 0;
            for (let i = 0; i < M; i++) {
              const x_norm = i / (M - 1);
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
            // Normalisation factor 2 / M
            weights.push(Math.abs(sum * 2 / M));
          }

          // Draw bars
          const startX = hudX + 12;
          const startY = hudY + hudH - 24;
          const barSpacing = 23;
          const maxBarH = 75;

          // Find max weight to normalize scale nicely
          let maxW = 0.05;
          for (let w of weights) if (w > maxW) maxW = w;

          for (let i = 0; i < 6; i++) {
            const h_val = (weights[i] / Math.max(amplitude, maxW)) * maxBarH;
            const barH = Math.max(2, Math.min(maxBarH, h_val));
            const barX = startX + i * barSpacing;
            const barY = startY - barH;

            // Gradient bar
            const grad = ctx.createLinearGradient(barX, startY, barX, barY);
            grad.addColorStop(0, "#8b5cf6");
            grad.addColorStop(1, "#38bdf8");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(barX, barY, 13, barH, [2, 2, 0, 0]);
            ctx.fill();

            // Label n
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.font = "bold 7px monospace";
            ctx.fillText(`n${i + 1}`, barX + 2, startY + 11);
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
    isPlaying, time, length, tension, density, damping, reflection, simMode, drivingFrequency, boundaryImpedance, visualAmplitudeFactor
  ]);

  // Handle click / drag probe selector
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || systemType === "membrane") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const clickX = u * length;

    // Check if click is near the probe line (within 6% of length)
    const tolerance = 0.06 * length;
    if (Math.abs(clickX - probeX) < tolerance) {
      isDraggingProbeRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const currentMouseX = u * length;

    // Show resize cursor when near the probe line
    const tolerance = 0.05 * length;
    if (Math.abs(currentMouseX - probeX) < tolerance && systemType !== "membrane") {
      canvasRef.current.style.cursor = "col-resize";
    } else {
      canvasRef.current.style.cursor = "crosshair";
    }

    if (isDraggingProbeRef.current) {
      const newProbeX = Math.max(0.01, Math.min(length - 0.01, currentMouseX));
      setProbeX(newProbeX);
    }

    // Update Hover inspectors
    if (systemType === "membrane") {
      const cX = rect.width / 2;
      const cY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // map canvas coordinates (1000x600 size)
      const mappedX = (mouseX / rect.width) * 1000 - 500;
      const mappedY = (mouseY / rect.height) * 600 - 300;

      const isRect = membraneGeometry === "rectangular";
      const Lx = 440;
      const Ly = 360;
      const radius = 220;

      let r_m = Math.sqrt(mappedX * mappedX + mappedY * mappedY);
      if ((isRect && (Math.abs(mappedX) <= Lx/2 && Math.abs(mappedY) <= Ly/2)) || (!isRect && r_m <= radius)) {
        // compute local Z amplitude
        const k_mn = isRect ? 0 : (BESSEL_ZEROS[m2D]?.[n2D - 1] || 2.4048) / radius;
        let z_val = 0;
        if (isRect) {
          const x_norm = (mappedX + Lx/2) / Lx;
          const y_norm = (mappedY + Ly/2) / Ly;
          z_val = amplitude * Math.sin(m2D * Math.PI * x_norm) * Math.sin(n2D * Math.PI * y_norm);
        } else {
          const theta = Math.atan2(mappedY, mappedX);
          z_val = amplitude * besselJ(m2D, k_mn * r_m) * Math.cos(m2D * theta);
        }

        const isNodal = Math.abs(z_val) < 0.06;
        setHoverData({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          px: isRect ? mappedX : r_m,
          z: z_val * Math.cos(4.0 * time),
          energy: 0.5 * tension * z_val * z_val, // qualitative energy
          nodeType: isNodal ? "Nodal Line (Zero amplitude)" : "Vibrating Membrane Point",
          definition: isNodal
            ? "A line on a 2D vibrating plate where displacement is continuously zero. Sand naturally accumulates here."
            : "Particles oscillate transversely. Standing waves interfere constructively and destructively in 2D."
        });
      } else {
        setHoverData((prev) => ({ ...prev, visible: false }));
      }
      return;
    }

    // 1D String/Air Hover calculations
    const clickX = u * length;
    const isDriven = simMode === "driven";
    const mu = density;
    const T = tension;
    const v = Math.sqrt(T / mu);

    let R = -1;
    let Z2 = 0;
    if (boundaryType === "Fixed-Fixed") {
      R = -1;
      Z2 = 0;
    } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
      R = 1;
      Z2 = 1e8;
    } else if (boundaryType === "Partially Reflective") {
      Z2 = boundaryImpedance !== undefined ? boundaryImpedance : 0;
      R = (Z2 - Math.sqrt(T * mu)) / (Z2 + Math.sqrt(T * mu));
    }

    const M = numGridSize;
    let y_val = 0;
    let dy_dt_val = 0;
    let dy_dx_val = 0;
    let lambda = 0;
    let k = 0;
    let omega = 0;

    if (solverType === "analytical") {
      if (!isDriven) {
        let n_eff = harmonic;
        if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free" || boundaryType === "Partially Reflective") {
          lambda = (2 * length) / harmonic;
          k = (n_eff * Math.PI) / length;
        } else if (boundaryType === "Fixed-Free") {
          const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
          n_eff = oddHarmonic;
          lambda = (4 * length) / oddHarmonic;
          k = (oddHarmonic * Math.PI) / (2 * length);
        }
        omega = k * v;
        const beta = damping;
        const envelope = Math.exp(-beta * time);

        if (boundaryType === "Free-Free") {
          y_val = amplitude * envelope * Math.cos(k * clickX) * Math.cos(omega * time);
          const A_t = amplitude * envelope;
          const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
          dy_dt_val = dA_dt * Math.cos(k * clickX);
          dy_dx_val = -k * amplitude * envelope * Math.sin(k * clickX) * Math.cos(omega * time);
        } else {
          y_val = amplitude * envelope * Math.sin(k * clickX) * Math.cos(omega * time);
          const A_t = amplitude * envelope;
          const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
          dy_dt_val = dA_dt * Math.sin(k * clickX);
          dy_dx_val = k * amplitude * envelope * Math.cos(k * clickX) * Math.cos(omega * time);
        }
      } else {
        const f_d = drivingFrequency;
        omega = 2 * Math.PI * f_d;
        const beta = damping;
        const w_v2 = (omega * omega) / (v * v);
        const b_w_v2 = (beta * omega) / (v * v);
        k = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
        const alpha = k > 0 ? (beta * omega) / (v * v * k) : 0;

        const exp_2aL = Math.exp(-2 * alpha * length);
        const den_re = 1 + R * exp_2aL * Math.cos(2 * k * length);
        const den_im = -R * exp_2aL * Math.sin(2 * k * length);
        const den_mag2 = den_re * den_re + den_im * den_im;

        const exp_ax = Math.exp(-alpha * clickX);
        const exp_a2Lx = Math.exp(-alpha * (2 * length - clickX));

        const num_re = exp_ax * Math.cos(k * clickX) + R * exp_a2Lx * Math.cos(k * (2 * length - clickX));
        const num_im = -exp_ax * Math.sin(k * clickX) - R * exp_a2Lx * Math.sin(k * (2 * length - clickX));

        const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
        const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;

        y_val = amplitude * (Y_re * Math.cos(omega * time) - Y_im * Math.sin(omega * time));
        dy_dt_val = -omega * amplitude * (Y_re * Math.sin(omega * time) + Y_im * Math.cos(omega * time));

        const term_re = -exp_ax * Math.cos(k * clickX) + R * exp_a2Lx * Math.cos(k * (2 * length - clickX));
        const term_im = exp_ax * Math.sin(k * clickX) - R * exp_a2Lx * Math.sin(k * (2 * length - clickX));
        const num_prime_re = alpha * term_re - k * term_im;
        const num_prime_im = alpha * term_im + k * term_re;

        const Yp_re = (num_prime_re * den_re + num_prime_im * den_im) / den_mag2;
        const Yp_im = (num_prime_im * den_re - num_prime_re * den_im) / den_mag2;

        dy_dx_val = amplitude * (Yp_re * Math.cos(omega * time) - Yp_im * Math.sin(omega * time));
      }
    } else {
      // Numerical interpolation values for hover data
      const y = yNumRef.current;
      const y_prev = yPrevRef.current;
      const idx_raw = (clickX / length) * (M - 1);
      const idx_l = Math.max(0, Math.floor(idx_raw));
      const idx_h = Math.min(M - 1, Math.ceil(idx_raw));
      const w = idx_raw - idx_l;
      const dx = length / (M - 1);

      y_val = y[idx_l] * (1 - w) + y[idx_h] * w;
      dy_dt_val = (y_val - (y_prev[idx_l] * (1 - w) + y_prev[idx_h] * w)) / 0.005;
      dy_dx_val = (y[idx_h] - y[idx_l]) / Math.max(1e-5, (idx_h - idx_l) * dx);
    }

    const local_K = 0.5 * mu * dy_dt_val * dy_dt_val;
    const local_U = 0.5 * T * dy_dx_val * dy_dx_val;
    const localEnergy = local_K + local_U;

    // Node classification envelope approximation
    let nodeType = "Intermediate Point";
    let definition = "Medium oscillates dynamically. Superposition of propagating wave fronts produces varying local displacement.";
    
    // envelope width
    let currentEnvelope = 0.5;
    if (solverType === "analytical" && !isDriven) {
      currentEnvelope = Math.abs(boundaryType === "Free-Free" ? Math.cos(k * clickX) : Math.sin(k * clickX));
    } else {
      // approximation for numerical nodes
      const activeH = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
      const k_num = boundaryType === "Fixed-Free" ? (activeH * Math.PI) / (2 * length) : (activeH * Math.PI) / length;
      currentEnvelope = Math.abs(boundaryType === "Free-Free" ? Math.cos(k_num * clickX) : Math.sin(k_num * clickX));
    }

    if (currentEnvelope < 0.1) {
      nodeType = "Node (Zero Amplitude)";
      definition = "A point along a standing wave with minimum (zero) displacement due to continuous destructive interference.";
    } else if (currentEnvelope > 0.9) {
      nodeType = "Antinode (Maximum Amplitude)";
      definition = "A point along a standing wave with maximum displacement due to continuous constructive interference.";
    }

    setHoverData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      px: clickX,
      z: y_val,
      energy: localEnergy,
      nodeType,
      definition
    });
  };

  const handleMouseUp = () => {
    isDraggingProbeRef.current = false;
  };

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
        onMouseLeave={() => {
          isDraggingProbeRef.current = false;
          setHoverData((prev) => ({ ...prev, visible: false }));
        }}
      />

      {/* Floating HUD status indicator */}
      <div className="absolute top-24 left-6 flex flex-col gap-2 pointer-events-none z-10 select-none">
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg w-fit">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"}`} />
          <span className="text-xs font-mono font-bold text-white/90 tracking-widest uppercase">
            {isPlaying ? "Simulation Active" : "Simulation Paused"}
          </span>
        </div>
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg uppercase w-fit">
          SYSTEM: {systemType === "string" ? "1D Transverse String" : systemType === "air" ? "Acoustic Air Pipe" : "2D Resonant Membrane"} | CORE: {solverType === "analytical" ? "Analytical Engine" : "Numerical Solver"}
        </div>
        {systemType === "string" && (
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg uppercase w-fit">
            REPRESENTATION: {discreteBeads ? "Discrete Coupled Beads (M=15)" : "Continuous String (M=60)"}
          </div>
        )}
      </div>

      {/* Draggable Inspector Tooltip */}
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
              <span className={`w-2.5 h-2.5 rounded-full ${hoverData.nodeType.includes("Node") ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : hoverData.nodeType.includes("Antinode") ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{hoverData.nodeType}</span>
            </div>

            <p className="text-[9px] text-white/50 leading-relaxed mb-3 font-medium">
              {hoverData.definition}
            </p>

            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Position ({systemType === "membrane" && membraneGeometry === "circular" ? "Radius r" : "x"})</span>
                <span className="text-xs font-mono font-bold text-white/80">{hoverData.px.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Displacement</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{(hoverData.z * 100).toFixed(2)} cm</span>
              </div>
              {systemType !== "air" && (
                <div className="flex justify-between items-center gap-6">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Local Energy</span>
                  <span className="text-xs font-mono font-bold text-fuchsia-400">{hoverData.energy.toFixed(5)} J/m</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

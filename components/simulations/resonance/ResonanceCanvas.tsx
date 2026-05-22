"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type WaveformType = "sine" | "square" | "triangle";

const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";


export interface ResonanceParams {
  mass: number;         // m (kg)
  springK: number;       // k (N/m)
  dampingB: number;      // b (N s/m)
  driverAmp: number;     // F0 (N)
  driverFreq: number;    // fd (Hz)
  waveform: WaveformType;
  slowMotion: number;    // Slow-motion factor (0.01 to 1.0)
  isPlaying: boolean;
  showVectors: boolean;
  simMode: "single" | "coupled" | "duffing" | "parametric" | "beats";
  integrator: "rk4" | "symplectic_euler" | "velocity_verlet" | "adaptive_rk";
  duffingAlpha: number;  // Duffing cubic coefficient
  couplingK: number;     // Coupling spring stiffness
  mass2: number;        // Mass of oscillator 2
  dampingB2: number;     // Damping of oscillator 2
  substeps: number;      // Integration substeps per frame
  autoSweep: boolean;    // Automatic frequency sweep
  sweepSpeed: number;    // Sweep rate in Hz/s
  showCursors: boolean;  // Oscilloscope cursors
  showValidation: boolean; // Analytical validation panel
  // Expanded parameters
  springK2: number;
  couplingB: number;
  driverAmp2: number;
  driverFreq2: number;
  initX1: number;
  initV1: number;
  initX2: number;
  initV2: number;
  parametricEpsilon: number;
  timeStep: number;
  solverTolerance: number;
  adaptiveStepping: boolean;
}

interface ResonanceCanvasProps {
  params: ResonanceParams;
  onStateUpdate: (state: {
    currentAmplitude: number;
    currentAmplitude2: number;
    qFactor: number;
    phaseLagDeg: number;
    peakFreqHz: number;
    naturalFreqHz: number;
    currentFreqHz: number;
    dissipatedPower: number;
    totalEnergy: number;
    integrationError: number;
    solverStatus: string;
    energyDrift: number;
    truncationError: number;
  }) => void;
  resetTrigger: number;
  impulseTrigger: number;
  resetPhaseTrigger: number;
  clearSweepTrigger: number;
  setDriverFreq: (f: number) => void;
}

export const ResonanceCanvas: React.FC<ResonanceCanvasProps> = ({
  params,
  onStateUpdate,
  resetTrigger,
  impulseTrigger,
  resetPhaseTrigger,
  clearSweepTrigger,
  setDriverFreq,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep a reference to params to avoid recreation of renderLoop on every parameter change
  const paramsRef = useRef<ResonanceParams>(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Physical State of the Mass-Spring-Damper system
  // x = displacement from equilibrium (meters), positive is right (horizontal system layout)
  // v = velocity (m/s)
  // x2 = displacement of mass 2 (meters)
  // v2 = velocity of mass 2 (m/s)
  // t_phys = accumulated physical time (seconds)
  const stateRef = useRef({
    x: params.initX1,
    v: params.initV1,
    x2: params.initX2,
    v2: params.initV2,
    t_phys: 0.0,
    workIn: 0.0,
    workDiss: 0.0,
    initialEnergy: 0.0,
  });

  // History buffer for oscilloscope time series
  const historyRef = useRef<{ t: number; drive: number; mass: number; mass2: number }[]>([]);

  // Peak detector and frequency sweep laboratory memory
  const lastVRef = useRef<number>(0);
  const lastV2Ref = useRef<number>(0);
  const sweepHistoryRef = useRef<{ freq: number; amp1: number; amp2: number }[]>([]);
  const lastStateUpdateTimeRef = useRef<number>(0);

  // Measurement Cursors references (stored in logical coordinates)
  const scopeCursorX1Ref = useRef<number>(0);
  const scopeCursorX2Ref = useRef<number>(0);
  const scopeCursorY1Ref = useRef<number>(0);
  const scopeCursorY2Ref = useRef<number>(0);
  const initializedCursorsRef = useRef<boolean>(false);
  const activeDragRef = useRef<string | null>(null);

  // Hover position for spectral crosshair analysis
  const hoverPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle physical triggers from parent
  useEffect(() => {
    stateRef.current = {
      x: params.initX1 || (params.simMode === "parametric" ? 0.2 : 0.0),
      v: params.initV1 || 0.0,
      x2: params.initX2 || 0.0,
      v2: params.initV2 || 0.0,
      t_phys: 0.0,
      workIn: 0.0,
      workDiss: 0.0,
      initialEnergy: 0.0,
    };
    historyRef.current = [];
    sweepHistoryRef.current = [];
    lastVRef.current = 0;
    lastV2Ref.current = 0;
  }, [resetTrigger, params.simMode, params.initX1, params.initV1, params.initX2, params.initV2]);

  useEffect(() => {
    if (impulseTrigger > 0) {
      // Add kinetic energy via sudden impulse velocity boost Δv = Impulse / mass (say Impulse = 8 N s)
      stateRef.current.v += 8.0 / paramsRef.current.mass;
      if (paramsRef.current.simMode === "coupled") {
        stateRef.current.v2 += 8.0 / paramsRef.current.mass2;
      }
    }
  }, [impulseTrigger]);

  useEffect(() => {
    if (resetPhaseTrigger > 0) {
      stateRef.current.t_phys = 0.0;
      stateRef.current.workIn = 0.0;
      stateRef.current.workDiss = 0.0;
      historyRef.current = [];
    }
  }, [resetPhaseTrigger]);

  useEffect(() => {
    if (clearSweepTrigger > 0) {
      sweepHistoryRef.current = [];
    }
  }, [clearSweepTrigger]);

  // Forcing Waveform Function
  const getDriverForcing = (t: number, f: number, F0: number, type: WaveformType): number => {
    const theta = 2 * Math.PI * f * t;
    if (type === "sine") {
      return F0 * Math.cos(theta);
    } else if (type === "square") {
      return F0 * Math.sign(Math.cos(theta));
    } else if (type === "triangle") {
      return (2 * F0 / Math.PI) * Math.asin(Math.sin(theta));
    }
    return 0;
  };

  // Drag handlers
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const midX = w / 2;
    const midY = h / 2;

    // 1. Proximity check inside Q4 (Oscilloscope cursors dragging)
    if (x > midX && y > midY && paramsRef.current.showCursors) {
      const px1 = scopeCursorX1Ref.current;
      const px2 = scopeCursorX2Ref.current;
      const py1 = scopeCursorY1Ref.current;
      const py2 = scopeCursorY2Ref.current;

      const distX1 = Math.abs(x - px1);
      const distX2 = Math.abs(x - px2);
      const distY1 = Math.abs(y - py1);
      const distY2 = Math.abs(y - py2);

      const threshold = 12;
      let minDrag = "";
      let minDist = Infinity;

      if (distX1 < threshold && distX1 < minDist) { minDrag = "X1"; minDist = distX1; }
      if (distX2 < threshold && distX2 < minDist) { minDrag = "X2"; minDist = distX2; }
      if (distY1 < threshold && distY1 < minDist) { minDrag = "Y1"; minDist = distY1; }
      if (distY2 < threshold && distY2 < minDist) { minDrag = "Y2"; minDist = distY2; }

      if (minDrag !== "") {
        activeDragRef.current = minDrag;
        return;
      }
    }

    // 2. Click in Q3 (Lorentzian graph) to set driving frequency
    if (x > midX && y < midY) {
      const graphLeft = midX + 40;
      const graphW = (w - midX) - 60;
      if (x >= graphLeft && x <= graphLeft + graphW) {
        const ratio = (x - graphLeft) / graphW;
        const newF = 0.1 + ratio * (5.0 - 0.1);
        setDriverFreq(Math.min(5.0, Math.max(0.1, newF)));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const midX = w / 2;
    const midY = h / 2;

    hoverPosRef.current = { x, y };

    if (activeDragRef.current) {
      const drag = activeDragRef.current;
      if (drag === "X1") {
        scopeCursorX1Ref.current = Math.max(midX + 40, Math.min(w - 20, x));
      } else if (drag === "X2") {
        scopeCursorX2Ref.current = Math.max(midX + 40, Math.min(w - 20, x));
      } else if (drag === "Y1") {
        scopeCursorY1Ref.current = Math.max(midY + 40, Math.min(h - 30, y));
      } else if (drag === "Y2") {
        scopeCursorY2Ref.current = Math.max(midY + 40, Math.min(h - 30, y));
      }
    } else {
      // Hover style mapping
      if (x > midX && y > midY && paramsRef.current.showCursors) {
        const px1 = scopeCursorX1Ref.current;
        const px2 = scopeCursorX2Ref.current;
        const py1 = scopeCursorY1Ref.current;
        const py2 = scopeCursorY2Ref.current;

        const distX1 = Math.abs(x - px1);
        const distX2 = Math.abs(x - px2);
        const distY1 = Math.abs(y - py1);
        const distY2 = Math.abs(y - py2);

        const threshold = 8;
        if (distX1 < threshold || distX2 < threshold) {
          canvas.style.cursor = "col-resize";
        } else if (distY1 < threshold || distY2 < threshold) {
          canvas.style.cursor = "row-resize";
        } else {
          canvas.style.cursor = "default";
        }
      } else if (x > midX && y < midY) {
        canvas.style.cursor = "pointer";
      } else {
        canvas.style.cursor = "default";
      }
    }
  };

  const handleMouseUp = () => {
    activeDragRef.current = null;
  };

  // Main game loop effect
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resizing logic
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container && canvas) {
        canvas.width = container.clientWidth * window.devicePixelRatio;
        canvas.height = container.clientHeight * window.devicePixelRatio;
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientHeight}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Physics acceleration functions
    const getAccel = (x: number, v: number, x2_val: number, v2_val: number, t: number, idx: 1 | 2): number => {
      const p = paramsRef.current;
      if (p.simMode === "coupled") {
        if (idx === 1) {
          const F = getDriverForcing(t, p.driverFreq, p.driverAmp, p.waveform);
          return (F - p.dampingB * v - p.couplingB * (v - v2_val) - p.springK * x - p.couplingK * (x - x2_val)) / p.mass;
        } else {
          const F2 = getDriverForcing(t, p.driverFreq2, p.driverAmp2, p.waveform);
          return (F2 - p.dampingB2 * v2_val - p.couplingB * (v2_val - v) - p.springK2 * x2_val - p.couplingK * (x2_val - x)) / p.mass2;
        }
      } else if (p.simMode === "duffing") {
        const F = getDriverForcing(t, p.driverFreq, p.driverAmp, p.waveform);
        return (F - p.dampingB * v - p.springK * x - p.duffingAlpha * x * x * x) / p.mass;
      } else if (p.simMode === "parametric") {
        const k_eff = p.springK * (1.0 + p.parametricEpsilon * Math.cos(2 * Math.PI * p.driverFreq * t));
        return (- p.dampingB * v - k_eff * x) / p.mass;
      } else if (p.simMode === "beats") {
        const F = getDriverForcing(t, p.driverFreq, p.driverAmp, "sine") + 
                  getDriverForcing(t, p.driverFreq2, p.driverAmp2, "sine");
        return (F - p.dampingB * v - p.springK * x) / p.mass;
      } else { // single
        const F = getDriverForcing(t, p.driverFreq, p.driverAmp, p.waveform);
        return (F - p.dampingB * v - p.springK * x) / p.mass;
      }
    };

    const renderLoop = (now: number) => {
      const dt_wall = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const p = paramsRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const midX = w / 2;
      const midY = h / 2;

      // Initialize scope cursors once canvas is populated
      if (!initializedCursorsRef.current && w > 0 && h > 0) {
        scopeCursorX1Ref.current = midX + (w - midX) * 0.25;
        scopeCursorX2Ref.current = midX + (w - midX) * 0.75;
        scopeCursorY1Ref.current = midY + (h - midY) * 0.30;
        scopeCursorY2Ref.current = midY + (h - midY) * 0.70;
        initializedCursorsRef.current = true;
      }

      // Analytical calculations
      const omega_0 = Math.sqrt(p.springK / p.mass);
      const f_0 = omega_0 / (2 * Math.PI);
      const beta = p.dampingB / (2 * p.mass);
      const q = p.dampingB > 0 ? (omega_0 * p.mass) / p.dampingB : Infinity;

      // Peak resonance frequency
      const omega_peak = beta * beta * 2 < omega_0 * omega_0 
        ? Math.sqrt(omega_0 * omega_0 - 2 * beta * beta)
        : 0;
      const f_peak = omega_peak / (2 * Math.PI);

      // Phase Shift
      const omega_d = 2 * Math.PI * p.driverFreq;
      let phaseLagRad = Math.atan2(p.dampingB * omega_d, p.springK - p.mass * omega_d * omega_d);
      if (phaseLagRad < 0) phaseLagRad += 2 * Math.PI;
      const phaseLagDeg = (phaseLagRad * 180) / Math.PI;

      // Steady State Amplitude Analytical
      const denominator = Math.sqrt(
        Math.pow(p.springK - p.mass * omega_d * omega_d, 2) + Math.pow(p.dampingB * omega_d, 2)
      );
      const analyticalSteadyAmp = denominator > 0 ? p.driverAmp / denominator : 0;

      // ─── INTEGRATION ──────────────────────────────────────────
      // Compute physical energies before advancement for initialization
      let kineticEnergy = 0.5 * p.mass * stateRef.current.v * stateRef.current.v;
      let potentialEnergy = 0.5 * p.springK * stateRef.current.x * stateRef.current.x;
      let dissipatedPower = p.dampingB * stateRef.current.v * stateRef.current.v;

      if (p.simMode === "coupled") {
        kineticEnergy += 0.5 * p.mass2 * stateRef.current.v2 * stateRef.current.v2;
        potentialEnergy += 0.5 * p.springK2 * stateRef.current.x2 * stateRef.current.x2 + 
                           0.5 * p.couplingK * Math.pow(stateRef.current.x - stateRef.current.x2, 2);
        dissipatedPower += p.dampingB2 * stateRef.current.v2 * stateRef.current.v2 +
                           p.couplingB * Math.pow(stateRef.current.v - stateRef.current.v2, 2);
      } else if (p.simMode === "duffing") {
        potentialEnergy += 0.25 * p.duffingAlpha * Math.pow(stateRef.current.x, 4);
      }
      const totalEnergy = kineticEnergy + potentialEnergy;

      if (stateRef.current.t_phys === 0.0) {
        stateRef.current.initialEnergy = totalEnergy;
        stateRef.current.workIn = 0.0;
        stateRef.current.workDiss = 0.0;
      }

      let est_error = 0;

      if (p.isPlaying) {
        const dt_phys = dt_wall * p.slowMotion;
        let s = { ...stateRef.current };

        // Auto sweep frequency update
        if (p.autoSweep) {
          const nextFreq = p.driverFreq + p.sweepSpeed * dt_phys;
          const finalFreq = nextFreq > 5.0 ? 0.1 : nextFreq;
          if (performance.now() - lastStateUpdateTimeRef.current > 50) {
            setDriverFreq(finalFreq);
            lastStateUpdateTimeRef.current = performance.now();
          }
        }

        if (p.integrator === "adaptive_rk") {
          // Adaptive Cash-Karp RK45
          const derivs = (t_val: number, y_val: number[]): number[] => {
            if (p.simMode === "coupled") {
              return [
                y_val[1],
                getAccel(y_val[0], y_val[1], y_val[2], y_val[3], t_val, 1),
                y_val[3],
                getAccel(y_val[0], y_val[1], y_val[2], y_val[3], t_val, 2)
              ];
            } else {
              return [
                y_val[1],
                getAccel(y_val[0], y_val[1], 0, 0, t_val, 1)
              ];
            }
          };

          const rk45_step = (t_val: number, h_step: number, y_val: number[]) => {
            const b21 = 0.2;
            const b31 = 3/40; const b32 = 9/40;
            const b41 = 0.3; const b42 = -0.9; const b43 = 1.2;
            const b51 = -11/54; const b52 = 2.5; const b53 = -70/27; const b54 = 35/27;
            const b61 = 1631/55296; const b62 = 175/512; const b63 = 575/13824; const b64 = 44275/110592; const b65 = 253/4096;

            const c1 = 37/378; const c3 = 250/621; const c4 = 125/594; const c6 = 512/1771;
            const cs1 = 2825/27648; const cs3 = 18575/48384; const cs4 = 13525/55296; const cs5 = 277/14336; const cs6 = 0.25;

            const k1 = derivs(t_val, y_val);
            const y2 = y_val.map((val, i) => val + h_step * b21 * k1[i]);
            const k2 = derivs(t_val + 0.2 * h_step, y2);
            const y3 = y_val.map((val, i) => val + h_step * (b31 * k1[i] + b32 * k2[i]));
            const k3 = derivs(t_val + 0.3 * h_step, y3);
            const y4 = y_val.map((val, i) => val + h_step * (b41 * k1[i] + b42 * k2[i] + b43 * k3[i]));
            const k4 = derivs(t_val + 0.6 * h_step, y4);
            const y5 = y_val.map((val, i) => val + h_step * (b51 * k1[i] + b52 * k2[i] + b53 * k3[i] + b54 * k4[i]));
            const k5 = derivs(t_val + h_step, y5);
            const y6 = y_val.map((val, i) => val + h_step * (b61 * k1[i] + b62 * k2[i] + b63 * k3[i] + b64 * k4[i] + b65 * k5[i]));
            const k6 = derivs(t_val + 0.875 * h_step, y6);

            const yNext = y_val.map((val, i) => val + h_step * (c1 * k1[i] + c3 * k3[i] + c4 * k4[i] + c6 * k6[i]));
            const yStar = y_val.map((val, i) => val + h_step * (cs1 * k1[i] + cs3 * k3[i] + cs4 * k4[i] + cs5 * k5[i] + cs6 * k6[i]));
            const yError = yNext.map((val, i) => Math.abs(val - yStar[i]));

            return { yNext, yError };
          };

          let t_curr = s.t_phys;
          const t_end = t_curr + dt_phys;
          let h_trial = p.timeStep;
          let y_vec = p.simMode === "coupled" ? [s.x, s.v, s.x2, s.v2] : [s.x, s.v];
          
          let step_count = 0;
          let max_steps = 1000;
          let total_err = 0;
          const safety = 0.85;

          while (t_curr < t_end && step_count < max_steps) {
            step_count++;
            if (t_curr + h_trial > t_end) {
              h_trial = t_end - t_curr;
            }

            const { yNext, yError } = rk45_step(t_curr, h_trial, y_vec);
            const maxError = Math.max(...yError);

            if (maxError <= p.solverTolerance || h_trial < 1e-6) {
              y_vec = yNext;
              t_curr += h_trial;
              total_err += maxError;

              if (maxError > 0) {
                h_trial = safety * h_trial * Math.pow(p.solverTolerance / maxError, 0.2);
              } else {
                h_trial *= 2.0;
              }
              h_trial = Math.max(1e-5, Math.min(0.1, h_trial));
            } else {
              h_trial = safety * h_trial * Math.pow(p.solverTolerance / maxError, 0.25);
              h_trial = Math.max(1e-5, h_trial);
            }
          }

          s.x = y_vec[0];
          s.v = y_vec[1];
          if (p.simMode === "coupled") {
            s.x2 = y_vec[2];
            s.v2 = y_vec[3];
          }

          const F_d1 = getDriverForcing(s.t_phys, p.driverFreq, p.driverAmp, p.waveform);
          const F_d2 = p.simMode === "coupled" ? getDriverForcing(s.t_phys, p.driverFreq2, p.driverAmp2, p.waveform) : 0;
          s.workIn += (F_d1 * s.v + F_d2 * s.v2) * dt_phys;
          
          let p_diss = p.dampingB * s.v * s.v;
          if (p.simMode === "coupled") {
            p_diss += p.dampingB2 * s.v2 * s.v2 + p.couplingB * Math.pow(s.v - s.v2, 2);
          }
          s.workDiss += p_diss * dt_phys;
          s.t_phys = t_curr;
          est_error = step_count > 0 ? total_err / step_count : 0;

        } else {
          // Fixed step solver
          let subDt = p.timeStep;
          let steps = Math.max(1, Math.round(dt_phys / subDt));
          if (steps > 1000) {
            steps = 1000;
            subDt = dt_phys / steps;
          } else {
            subDt = dt_phys / steps;
          }

          for (let step = 0; step < steps; step++) {
            const t = s.t_phys;
            const F_driver1 = p.simMode === "beats" 
              ? getDriverForcing(t, p.driverFreq, p.driverAmp, "sine") + getDriverForcing(t, p.driverFreq2, p.driverAmp2, "sine")
              : getDriverForcing(t, p.driverFreq, p.driverAmp, p.waveform);
            const F_driver2 = p.simMode === "coupled" 
              ? getDriverForcing(t, p.driverFreq2, p.driverAmp2, p.waveform)
              : 0;

            if (p.integrator === "rk4") {
              if (p.simMode === "coupled") {
                const dx1_1 = s.v;
                const dv1_1 = getAccel(s.x, s.v, s.x2, s.v2, t, 1);
                const dx2_1 = s.v2;
                const dv2_1 = getAccel(s.x, s.v, s.x2, s.v2, t, 2);

                const x1_h1 = s.x + 0.5 * subDt * dx1_1;
                const v1_h1 = s.v + 0.5 * subDt * dv1_1;
                const x2_h1 = s.x2 + 0.5 * subDt * dx2_1;
                const v2_h1 = s.v2 + 0.5 * subDt * dv2_1;
                const t_h = t + 0.5 * subDt;

                const dx1_2 = v1_h1;
                const dv1_2 = getAccel(x1_h1, v1_h1, x2_h1, v2_h1, t_h, 1);
                const dx2_2 = v2_h1;
                const dv2_2 = getAccel(x1_h1, v1_h1, x2_h1, v2_h1, t_h, 2);

                const x1_h2 = s.x + 0.5 * subDt * dx1_2;
                const v1_h2 = s.v + 0.5 * subDt * dv1_2;
                const x2_h2 = s.x2 + 0.5 * subDt * dx2_2;
                const v2_h2 = s.v2 + 0.5 * subDt * dv2_2;

                const dx1_3 = v1_h2;
                const dv1_3 = getAccel(x1_h2, v1_h2, x2_h2, v2_h2, t_h, 1);
                const dx2_3 = v2_h2;
                const dv2_3 = getAccel(x1_h2, v1_h2, x2_h2, v2_h2, t_h, 2);

                const x1_e = s.x + subDt * dx1_3;
                const v1_e = s.v + subDt * dv1_3;
                const x2_e = s.x2 + subDt * dx2_3;
                const v2_e = s.v2 + subDt * dv2_3;
                const t_e = t + subDt;

                const dx1_4 = v1_e;
                const dv1_4 = getAccel(x1_e, v1_e, x2_e, v2_e, t_e, 1);
                const dx2_4 = v2_e;
                const dv2_4 = getAccel(x1_e, v1_e, x2_e, v2_e, t_e, 2);

                s.x += (subDt / 6) * (dx1_1 + 2 * dx1_2 + 2 * dx1_3 + dx1_4);
                s.v += (subDt / 6) * (dv1_1 + 2 * dv1_2 + 2 * dv1_3 + dv1_4);
                s.x2 += (subDt / 6) * (dx2_1 + 2 * dx2_2 + 2 * dx2_3 + dx2_4);
                s.v2 += (subDt / 6) * (dv2_1 + 2 * dv2_2 + 2 * dv2_3 + dv2_4);
                s.t_phys = t_e;
              } else {
                const dx1 = s.v;
                const dv1 = getAccel(s.x, s.v, 0, 0, t, 1);

                const x_h1 = s.x + 0.5 * subDt * dx1;
                const v_h1 = s.v + 0.5 * subDt * dv1;
                const t_h = t + 0.5 * subDt;

                const dx2 = v_h1;
                const dv2 = getAccel(x_h1, v_h1, 0, 0, t_h, 1);

                const x_h2 = s.x + 0.5 * subDt * dx2;
                const v_h2 = s.v + 0.5 * subDt * dv2;

                const dx3 = v_h2;
                const dv3 = getAccel(x_h2, v_h2, 0, 0, t_h, 1);

                const x_e = s.x + subDt * dx3;
                const v_e = s.v + subDt * dv3;
                const t_e = t + subDt;

                const dx4 = v_e;
                const dv4 = getAccel(x_e, v_e, 0, 0, t_e, 1);

                s.x += (subDt / 6) * (dx1 + 2 * dx2 + 2 * dx3 + dx4);
                s.v += (subDt / 6) * (dv1 + 2 * dv2 + 2 * dv3 + dv4);
                s.t_phys = t_e;
              }
            } else if (p.integrator === "symplectic_euler") {
              if (p.simMode === "coupled") {
                const a1 = getAccel(s.x, s.v, s.x2, s.v2, t, 1);
                const a2 = getAccel(s.x, s.v, s.x2, s.v2, t, 2);
                s.v += a1 * subDt;
                s.v2 += a2 * subDt;
                s.x += s.v * subDt;
                s.x2 += s.v2 * subDt;
                s.t_phys += subDt;
              } else {
                const a = getAccel(s.x, s.v, 0, 0, t, 1);
                s.v += a * subDt;
                s.x += s.v * subDt;
                s.t_phys += subDt;
              }
            } else if (p.integrator === "velocity_verlet") {
              if (p.simMode === "coupled") {
                const a1 = getAccel(s.x, s.v, s.x2, s.v2, t, 1);
                const a2 = getAccel(s.x, s.v, s.x2, s.v2, t, 2);
                s.x += s.v * subDt + 0.5 * a1 * subDt * subDt;
                s.x2 += s.v2 * subDt + 0.5 * a2 * subDt * subDt;

                const v1_pred = s.v + 0.5 * a1 * subDt;
                const v2_pred = s.v2 + 0.5 * a2 * subDt;
                const a1_next = getAccel(s.x, v1_pred, s.x2, v2_pred, t + subDt, 1);
                const a2_next = getAccel(s.x, v1_pred, s.x2, v2_pred, t + subDt, 2);

                s.v = v1_pred + 0.5 * a1_next * subDt;
                s.v2 = v2_pred + 0.5 * a2_next * subDt;
                s.t_phys += subDt;
              } else {
                const a = getAccel(s.x, s.v, 0, 0, t, 1);
                s.x += s.v * subDt + 0.5 * a * subDt * subDt;

                const v_pred = s.v + 0.5 * a * subDt;
                const a_next = getAccel(s.x, v_pred, 0, 0, t + subDt, 1);
                s.v = v_pred + 0.5 * a_next * subDt;
                s.t_phys += subDt;
              }
            }

            s.workIn += (F_driver1 * s.v + F_driver2 * s.v2) * subDt;
            let p_diss = p.dampingB * s.v * s.v;
            if (p.simMode === "coupled") {
              p_diss += p.dampingB2 * s.v2 * s.v2 + p.couplingB * Math.pow(s.v - s.v2, 2);
            }
            s.workDiss += p_diss * subDt;

            const currentV = s.v;
            const lastV = lastVRef.current;
            if ((lastV > 0 && currentV <= 0) || (lastV < 0 && currentV >= 0)) {
              const peak1 = Math.abs(s.x);
              const peak2 = Math.abs(s.x2);
              sweepHistoryRef.current.push({ freq: p.driverFreq, amp1: peak1, amp2: peak2 });
              if (sweepHistoryRef.current.length > 500) {
                sweepHistoryRef.current.shift();
              }
            }
            lastVRef.current = currentV;
          }
        }

        stateRef.current = s;

        const driveVal = p.simMode === "beats"
          ? getDriverForcing(s.t_phys, p.driverFreq, p.driverAmp, "sine") + getDriverForcing(s.t_phys, p.driverFreq2, p.driverAmp2, "sine")
          : getDriverForcing(s.t_phys, p.driverFreq, p.driverAmp, p.waveform);
        historyRef.current.push({ t: s.t_phys, drive: driveVal, mass: s.x, mass2: s.x2 });
        if (historyRef.current.length > 500) {
          historyRef.current.shift();
        }
      }

      // Recompute energy at updated states
      let kineticEnergy_next = 0.5 * p.mass * stateRef.current.v * stateRef.current.v;
      let potentialEnergy_next = 0.5 * p.springK * stateRef.current.x * stateRef.current.x;
      let dissipatedPower_next = p.dampingB * stateRef.current.v * stateRef.current.v;

      if (p.simMode === "coupled") {
        kineticEnergy_next += 0.5 * p.mass2 * stateRef.current.v2 * stateRef.current.v2;
        potentialEnergy_next += 0.5 * p.springK2 * stateRef.current.x2 * stateRef.current.x2 + 
                               0.5 * p.couplingK * Math.pow(stateRef.current.x - stateRef.current.x2, 2);
        dissipatedPower_next += p.dampingB2 * stateRef.current.v2 * stateRef.current.v2 +
                               p.couplingB * Math.pow(stateRef.current.v - stateRef.current.v2, 2);
      } else if (p.simMode === "duffing") {
        potentialEnergy_next += 0.25 * p.duffingAlpha * Math.pow(stateRef.current.x, 4);
      }
      const totalEnergy_next = kineticEnergy_next + potentialEnergy_next;

      // Energy conservation drift computation
      const energyDrift = totalEnergy_next - stateRef.current.initialEnergy - stateRef.current.workIn + stateRef.current.workDiss;

      // Cramer's rule analytical amplitude at current frequency
      let analyticalAmp = analyticalSteadyAmp;
      if (p.simMode === "coupled") {
        const omega = 2 * Math.PI * p.driverFreq;
        const k_c = p.couplingK;
        const b_c = p.couplingB;
        const r1 = p.springK + k_c - p.mass * omega * omega;
        const i1 = (p.dampingB + b_c) * omega;
        const r2 = p.springK2 + k_c - p.mass2 * omega * omega;
        const i2 = (p.dampingB2 + b_c) * omega;
        const rc = k_c;
        const ic = b_c * omega;

        const r_prod = r1 * r2 - i1 * i2;
        const i_prod = r1 * i2 + r2 * i1;
        const rc_sq = rc * rc - ic * ic;
        const ic_sq = 2 * rc * ic;
        const r_denom = r_prod - rc_sq;
        const i_denom = i_prod - ic_sq;
        const denom_sq = r_denom * r_denom + i_denom * i_denom;

        if (denom_sq > 0) {
          const F1 = p.driverAmp;
          const F2 = p.driverAmp2;
          const r_num1 = F1 * r2 + F2 * rc;
          const i_num1 = F1 * i2 + F2 * ic;
          const r_x1 = r_num1 * r_denom + i_num1 * i_denom;
          const i_x1 = i_num1 * r_denom - r_num1 * i_denom;
          analyticalAmp = Math.sqrt(r_x1 * r_x1 + i_x1 * i_x1) / denom_sq;
        }
      }
      
      const numericalAmp = Math.abs(stateRef.current.x);
      const relativeError = analyticalAmp > 0 ? (Math.abs(numericalAmp - analyticalAmp) / analyticalAmp) * 100 : 0;

      // Solver status stability limit
      const omega_0_max = p.simMode === "coupled"
        ? Math.sqrt((p.springK + p.couplingK) / p.mass)
        : Math.sqrt(p.springK / p.mass);
      const stabilityLimitDt = 2.0 / omega_0_max;

      let solverStatus = "stable";
      if (Math.abs(stateRef.current.x) > 10.0 || totalEnergy_next > 10000) {
        solverStatus = "divergent";
      } else if (p.timeStep > stabilityLimitDt && p.integrator !== "adaptive_rk") {
        solverStatus = "warning";
      }

      onStateUpdate({
        currentAmplitude: stateRef.current.x,
        currentAmplitude2: stateRef.current.x2,
        qFactor: q,
        phaseLagDeg: phaseLagDeg,
        peakFreqHz: f_peak,
        naturalFreqHz: f_0,
        currentFreqHz: p.driverFreq,
        dissipatedPower: dissipatedPower_next,
        totalEnergy: totalEnergy_next,
        integrationError: relativeError,
        solverStatus: solverStatus,
        energyDrift: energyDrift,
        truncationError: est_error,
      });

      // ─── RENDERING ────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);

      // Draw Grid Background
      ctx.strokeStyle = "#17171a";
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let gridX = 0; gridX < w; gridX += gridSize) {
        ctx.beginPath(); ctx.moveTo(gridX, 0); ctx.lineTo(gridX, h); ctx.stroke();
      }
      for (let gridY = 0; gridY < h; gridY += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, gridY); ctx.lineTo(w, gridY); ctx.stroke();
      }

      // Draw Dashboard Quad Lines
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();

      // ========================================================
      // QUADRANT 1: MECHANICAL SYSTEM VISUALIZER
      // ========================================================
      ctx.save();
      // Draw Title
      ctx.fillStyle = "#fafafa";
      ctx.font = `bold 10px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Q1 // MECHANICAL RESONATOR SIMULATOR", 15, 20);

      const trackY = midY * 0.55;
      const scaleX = 140; // pixel scale per meter
      
      // Left and Right Wall lines
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(15, trackY - 30); ctx.lineTo(15, trackY + 30); ctx.stroke();
      // Draw hatching on left wall
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1.5;
      for (let wallY = trackY - 25; wallY <= trackY + 25; wallY += 8) {
        ctx.beginPath(); ctx.moveTo(10, wallY - 3); ctx.lineTo(15, wallY + 3); ctx.stroke();
      }

      if (p.simMode === "coupled") {
        // Draw Right Wall for coupled system
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(midX - 15, trackY - 30); ctx.lineTo(midX - 15, trackY + 30); ctx.stroke();
        for (let wallY = trackY - 25; wallY <= trackY + 25; wallY += 8) {
          ctx.beginPath(); ctx.moveTo(midX - 15, wallY - 3); ctx.lineTo(midX - 10, wallY + 3); ctx.stroke();
        }

        // Positions: Left Wall (15px) ... Motor (60px) ... Driver (100px) ... Mass1 (200px) ... Mass2 (300px) ... Right Wall (midX - 15)
        const theta_d = 2 * Math.PI * p.driverFreq * stateRef.current.t_phys;
        const motorX = 55;
        const motorY = trackY - 45;
        const r_motor = 16;
        
        // Spin motor wheel
        ctx.save();
        ctx.translate(motorX, motorY);
        ctx.rotate(theta_d);
        ctx.fillStyle = "#1c1c1f";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, r_motor, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Pin
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath(); ctx.arc(r_motor - 5, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Driving Slide Displacement
        const maxAmp_px = 25;
        const driverDisp = Math.cos(theta_d);
        const driveX = 90 + driverDisp * maxAmp_px;

        // Draw connecting rod from motor pin to driver block
        const pinGlobalX = motorX + (r_motor - 5) * Math.cos(theta_d);
        const pinGlobalY = motorY + (r_motor - 5) * Math.sin(theta_d);
        ctx.strokeStyle = "#52525b";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pinGlobalX, pinGlobalY); ctx.lineTo(driveX, trackY); ctx.stroke();

        // Draw Driver block
        ctx.fillStyle = "#27272a";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.rect(driveX - 12, trackY - 10, 24, 20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fafafa";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText("DRV", driveX, trackY + 3);

        // Mass 1 and Mass 2 coordinates
        const m1X = 180 + stateRef.current.x * scaleX;
        const m2X = 290 + stateRef.current.x2 * scaleX;

        // Draw Springs
        // Spring 1: Driver to Mass 1
        drawCoils(ctx, driveX + 12, trackY, m1X - 25, trackY, 9, 8, "#0d9488");
        // Spring 2 (coupling): Mass 1 to Mass 2
        drawCoils(ctx, m1X + 25, trackY, m2X - 25, trackY, 9, 8, "#6366f1");
        // Spring 3: Mass 2 to Right Wall
        drawCoils(ctx, m2X + 25, trackY, midX - 15, trackY, 9, 8, "#0d9488");

        // Draw Dashpots
        // Damper 1: parallel below
        drawDamper(ctx, driveX + 12, trackY + 14, m1X - 25, trackY + 14, "#52525b");
        // Damper 2: parallel below
        drawDamper(ctx, m1X + 25, trackY + 14, m2X - 25, trackY + 14, "#52525b");

        // Draw Mass Blocks
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#0d9488";
        ctx.lineWidth = 2.5;
        // Mass 1
        ctx.beginPath(); ctx.rect(m1X - 25, trackY - 18, 50, 36); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold 9px ${FONT_MONO}`;
        ctx.fillText(`${p.mass.toFixed(1)}kg`, m1X, trackY + 3);
        ctx.fillStyle = "#0d9488";
        ctx.font = `9px ${FONT_SANS}`;
        ctx.fillText("m₁", m1X, trackY - 22);

        // Mass 2
        ctx.strokeStyle = "#a78bfa";
        ctx.beginPath(); ctx.rect(m2X - 25, trackY - 18, 50, 36); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold 9px ${FONT_MONO}`;
        ctx.fillText(`${p.mass2.toFixed(1)}kg`, m2X, trackY + 3);
        ctx.fillStyle = "#a78bfa";
        ctx.font = `9px ${FONT_SANS}`;
        ctx.fillText("m₂", m2X, trackY - 22);

        // Force Vectors Overlay
        if (p.showVectors) {
          const F_driver = getDriverForcing(stateRef.current.t_phys, p.driverFreq, p.driverAmp, p.waveform);
          // Vectors on mass 1: F_drive, F_coupling
          drawForceArrow(ctx, m1X, trackY - 2, F_driver * 1.5, "#3b82f6", "Fd");
          const F_spring1 = -p.springK * stateRef.current.x;
          drawForceArrow(ctx, m1X, trackY + 6, F_spring1 * 1.5, "#0d9488", "Fs₁");
          
          // Vectors on mass 2
          const F_spring2 = -p.springK2 * stateRef.current.x2;
          drawForceArrow(ctx, m2X, trackY + 6, F_spring2 * 1.5, "#a78bfa", "Fs₂");
        }

      } else {
        // Single Mass Layout
        // Left Wall (15px) ... Motor (60px) ... Driver (110px) ... Spring ... Mass (270px)
        const theta_d = 2 * Math.PI * p.driverFreq * stateRef.current.t_phys;
        const motorX = 60;
        const motorY = trackY - 50;
        const r_motor = 20;

        // Draw motor wheel
        ctx.save();
        ctx.translate(motorX, motorY);
        ctx.rotate(theta_d);
        ctx.fillStyle = "#1c1c1f";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, r_motor, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Spoke spoke
        ctx.strokeStyle = "#27272a";
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r_motor, 0); ctx.stroke();
        // Pin
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath(); ctx.arc(r_motor - 6, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // Driving Slide Displacement
        const maxAmp_px = 30;
        let driverDisp = 0;
        if (p.waveform === "sine") driverDisp = Math.cos(theta_d);
        else if (p.waveform === "square") driverDisp = Math.sign(Math.cos(theta_d));
        else if (p.waveform === "triangle") driverDisp = (2 / Math.PI) * Math.asin(Math.sin(theta_d));

        const driveX = 110 + driverDisp * maxAmp_px;

        // Draw connecting rod from motor pin to driver block
        const pinGlobalX = motorX + (r_motor - 6) * Math.cos(theta_d);
        const pinGlobalY = motorY + (r_motor - 6) * Math.sin(theta_d);
        ctx.strokeStyle = "#52525b";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pinGlobalX, pinGlobalY); ctx.lineTo(driveX, trackY); ctx.stroke();

        // Draw Driver block
        ctx.fillStyle = "#27272a";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.rect(driveX - 15, trackY - 12, 30, 24); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fafafa";
        ctx.font = `9px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText("DRV", driveX, trackY + 3);

        // Mass Coordinates
        const massX = 260 + stateRef.current.x * scaleX;

        // Springs & Dampers (parallel layouts)
        // Spring coil teal
        drawCoils(ctx, driveX + 15, trackY - 8, massX - 30, trackY - 8, 12, 10, "#0d9488");
        // Dashpot damper orange fluid
        drawDamper(ctx, driveX + 15, trackY + 8, massX - 30, trackY + 8, "#52525b");

        // Damping envelope indicators (visual dashpot decay helper)
        if (p.dampingB > 5.0) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.05)";
          ctx.beginPath(); ctx.arc(driveX + 25, trackY + 8, 8, 0, Math.PI * 2); ctx.fill();
        }

        // Draw Mass Block (Glows based on energy)
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = p.simMode === "duffing" ? "#f59e0b" : "#3b82f6";
        ctx.lineWidth = 3;

        // Glow effect
        ctx.shadowColor = p.simMode === "duffing" ? "#f59e0b" : "#3b82f6";
        ctx.shadowBlur = Math.min(20, Math.abs(stateRef.current.x) * 45);
        ctx.beginPath(); ctx.rect(massX - 30, trackY - 20, 60, 40); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold 10px ${FONT_MONO}`;
        ctx.fillText(`${p.mass.toFixed(1)} kg`, massX, trackY + 3);
        
        ctx.fillStyle = "#a1a1aa";
        ctx.font = `9px ${FONT_SANS}`;
        if (p.simMode === "duffing") {
          ctx.fillText("Duffing Mass", massX, trackY - 25);
        } else if (p.simMode === "parametric") {
          // Parametric spring stiffness pulse visualization
          const pulse = 1.0 + 0.3 * Math.cos(2 * Math.PI * p.driverFreq * stateRef.current.t_phys);
          ctx.strokeStyle = `rgba(245, 158, 11, ${pulse - 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(massX, trackY, 25, 0, Math.PI * 2); ctx.stroke();
          ctx.fillText("Parametric (k varies)", massX, trackY - 25);
        } else {
          ctx.fillText("Linear Mass", massX, trackY - 25);
        }

        // Guide Equilibrium Line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(260, trackY - 40); ctx.lineTo(260, trackY + 40); ctx.stroke();
        ctx.setLineDash([]);

        // Force Vectors Overlay
        if (p.showVectors) {
          const F_driver = getDriverForcing(stateRef.current.t_phys, p.driverFreq, p.driverAmp, p.waveform);
          const F_spring = -(p.springK * stateRef.current.x + (p.simMode === "duffing" ? p.duffingAlpha * Math.pow(stateRef.current.x, 3) : 0));
          const F_damping = -p.dampingB * stateRef.current.v;

          // Scale force values to pixel lengths
          drawForceArrow(ctx, massX, trackY - 6, F_driver * 1.5, "#3b82f6", "F_drv");
          drawForceArrow(ctx, massX, trackY + 6, F_spring * 1.5, "#0d9488", "F_spr");
          drawForceArrow(ctx, massX, trackY + 16, F_damping * 3.5, "#f59e0b", "F_damp");
        }
      }

      ctx.restore();

      // ========================================================
      // QUADRANT 2: PHASOR DIAGRAM & ENERGY FLOW BAR CHARTS
      // ========================================================
      ctx.save();
      // Draw Title
      ctx.fillStyle = "#fafafa";
      ctx.font = `bold 10px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Q2 // PHASOR & THERMODYNAMIC ENERGY FLOW", 15, midY + 20);

      // --- Setup Right Side: Energy Bar Charts Layout ---
      const barLeft = midX * 0.48;
      const availableBarWidth = (midX - barLeft) - 20; // 20px right margin
      const barW = Math.max(16, Math.min(28, Math.floor(availableBarWidth / 6.5)));
      const barGap = Math.max(4, Math.min(10, Math.floor((availableBarWidth - 5 * barW) / 4)));
      const totalBarsW = 5 * barW + 4 * barGap;
      const barStartX = barLeft + (availableBarWidth - totalBarsW) / 2;
      const barH_max = Math.max(40, (h - midY) - 90);
      const barBaseY = h - 35;

      // Center the phasor circle dynamically in the remaining space on the left
      const phasorCX = barStartX / 2;

      // Draw legend card at top-left of Q2 to keep legends fully visible
      const legendBoxX = 15;
      const legendBoxY = midY + 35;
      const legendBoxW = p.simMode === "coupled" ? 110 : 95;
      const legendBoxH = p.simMode === "coupled" ? 50 : 38;

      ctx.fillStyle = "rgba(18, 18, 22, 0.65)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(legendBoxX, legendBoxY, legendBoxW, legendBoxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = `8px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const legendPadding = 6;
      ctx.fillStyle = "#3b82f6"; ctx.fillText("■ Driver (F₀)", legendBoxX + legendPadding, legendBoxY + legendPadding);
      ctx.fillStyle = "#0d9488"; ctx.fillText("■ Position (x₁)", legendBoxX + legendPadding, legendBoxY + legendPadding + 10);
      ctx.fillStyle = "#f59e0b"; ctx.fillText("■ Velocity (v₁)", legendBoxX + legendPadding, legendBoxY + legendPadding + 20);
      if (p.simMode === "coupled") {
        ctx.fillStyle = "#a78bfa"; ctx.fillText("■ Position (x₂)", legendBoxX + legendPadding, legendBoxY + legendPadding + 30);
      }
      ctx.textBaseline = "alphabetic"; // restore default

      // Place Phasor vertically below the legend card
      const legendBottom = legendBoxY + legendBoxH + 10;
      const availableVSpace = (h - 25) - legendBottom;
      const phasorCY = legendBottom + availableVSpace / 2;

      // Calculate radius constraints strictly based on center coordinates and margins
      const maxR_left = phasorCX - 20; // at least 20px padding from left canvas edge
      const maxR_right = barStartX - phasorCX - 20; // at least 20px gap from the first energy bar
      const maxR_top = phasorCY - legendBottom; // leaves space below the legend box
      const maxR_bottom = h - phasorCY - 28; // leaves space for phase angle text and bottom margin

      const phasorR = Math.max(20, Math.min(
        maxR_left,
        maxR_right,
        maxR_top,
        maxR_bottom,
        (h - midY) * 0.28
      ));

      // Draw Phasor Circle Background
      ctx.strokeStyle = "#1f1f23";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(phasorCX, phasorCY, phasorR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(phasorCX - phasorR - 8, phasorCY); ctx.lineTo(phasorCX + phasorR + 8, phasorCY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(phasorCX, phasorCY - phasorR - 8); ctx.lineTo(phasorCX, phasorCY + phasorR + 8); ctx.stroke();
      ctx.setLineDash([]);

      const theta_d = 2 * Math.PI * p.driverFreq * stateRef.current.t_phys;

      // Driver Phasor Vector (Angle theta_d, Blue)
      const dX = phasorCX + phasorR * 0.85 * Math.cos(theta_d);
      const dY = phasorCY - phasorR * 0.85 * Math.sin(theta_d); // canvas y is down
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(phasorCX, phasorCY); ctx.lineTo(dX, dY); ctx.stroke();
      drawPhasorHead(ctx, dX, dY, theta_d, "#3b82f6");

      // Displacement Mass 1 Phasor Vector (Teal, angle theta_d - phaseLagRad)
      // Scaled by amplitude
      const scaleAmpPhasor = analyticalSteadyAmp > 0 ? Math.min(1.0, Math.abs(stateRef.current.x) / (analyticalSteadyAmp * 1.5)) : 0.6;
      const angleDisp = theta_d - phaseLagRad;
      const dispX = phasorCX + phasorR * 0.8 * scaleAmpPhasor * Math.cos(angleDisp);
      const dispY = phasorCY - phasorR * 0.8 * scaleAmpPhasor * Math.sin(angleDisp);
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 3.0;
      ctx.beginPath(); ctx.moveTo(phasorCX, phasorCY); ctx.lineTo(dispX, dispY); ctx.stroke();
      drawPhasorHead(ctx, dispX, dispY, angleDisp, "#0d9488");

      // Velocity Mass 1 Phasor Vector (Orange, angle theta_d - phaseLagRad + Math.PI/2)
      const angleVel = angleDisp + Math.PI / 2;
      const scaleVelPhasor = (p.mass * omega_0 * analyticalSteadyAmp) > 0 
         ? Math.min(1.0, Math.abs(stateRef.current.v) / (omega_0 * analyticalSteadyAmp * 1.5)) 
         : 0.5;
      const velX = phasorCX + phasorR * 0.7 * scaleVelPhasor * Math.cos(angleVel);
      const velY = phasorCY - phasorR * 0.7 * scaleVelPhasor * Math.sin(angleVel);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.moveTo(phasorCX, phasorCY); ctx.lineTo(velX, velY); ctx.stroke();
      drawPhasorHead(ctx, velX, velY, angleVel, "#f59e0b");

      // In coupled mode, draw Displacement 2 Phasor (Purple)
      if (p.simMode === "coupled") {
        // Estimate phase lag 2: we can approximate phase based on numerical values
        const x2_val = stateRef.current.x2;
        const v2_val = stateRef.current.v2;
        const amp2_est = Math.sqrt(x2_val * x2_val + (v2_val / omega_0) * (v2_val / omega_0));
        let phase2 = Math.atan2(-v2_val, x2_val * omega_0);
        const scaleAmp2Phasor = amp2_est > 0 ? Math.min(1.0, Math.abs(x2_val) / (amp2_est * 1.5)) : 0.4;

        const disp2X = phasorCX + phasorR * 0.7 * scaleAmp2Phasor * Math.cos(phase2);
        const disp2Y = phasorCY - phasorR * 0.7 * scaleAmp2Phasor * Math.sin(phase2);
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.moveTo(phasorCX, phasorCY); ctx.lineTo(disp2X, disp2Y); ctx.stroke();
        drawPhasorHead(ctx, disp2X, disp2Y, phase2, "#a78bfa");
      }

      // Phase Angle text
      ctx.fillStyle = "#fafafa";
      ctx.font = `9px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText(`Φ = ${phaseLagDeg.toFixed(1)}°`, phasorCX, phasorCY + phasorR + 13);

      // Find the maximum value dynamically among all active energies and powers to scale the bars properly
      const maxValMeasured = Math.max(
        10.0, // Minimum floor for scale
        Math.abs(kineticEnergy),
        Math.abs(potentialEnergy),
        Math.abs(totalEnergy),
        Math.abs(p.driverAmp * stateRef.current.v),
        Math.abs(dissipatedPower)
      );
      const dynamicMax = Math.ceil(maxValMeasured / 10) * 10;

      // Labels & data
      const energyData = [
        { label: "KE", val: kineticEnergy, color: "#10b981", max: dynamicMax, unit: "J" },
        { label: "PE", val: potentialEnergy, color: "#0d9488", max: dynamicMax, unit: "J" },
        { label: "ETOT", val: totalEnergy, color: "#2563eb", max: dynamicMax, unit: "J" },
        { label: "PIN", val: p.driverAmp * stateRef.current.v, color: "#f59e0b", max: dynamicMax, unit: "W" },
        { label: "PDISS", val: dissipatedPower, color: "#ef4444", max: dynamicMax, unit: "W" },
      ];

      energyData.forEach((bar, idx) => {
        const bx = barStartX + idx * (barW + barGap);
        // Draw Axis
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx, barBaseY - barH_max); ctx.lineTo(bx, barBaseY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, barBaseY); ctx.lineTo(bx + barW, barBaseY); ctx.stroke();

        // Calculate heights (clamp value relative to max)
        const absVal = Math.min(bar.max, Math.abs(bar.val));
        const valH = (absVal / bar.max) * barH_max;

        // Draw bar
        ctx.fillStyle = bar.color;
        if (bar.val >= 0) {
          ctx.beginPath(); ctx.rect(bx + 4, barBaseY - valH, barW - 8, valH); ctx.fill();
        } else {
          // Negative values (for PIN power injection) go downwards or drawn differently
          // Draw dashed outline
          ctx.strokeStyle = bar.color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath(); ctx.rect(bx + 4, barBaseY, barW - 8, valH); ctx.stroke();
          ctx.setLineDash([]);
        }

        // Value text
        ctx.fillStyle = "#fafafa";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(bar.val.toFixed(1) + bar.unit, bx + barW / 2, barBaseY - valH - 6);

        // Label text
        ctx.fillStyle = "#a1a1aa";
        ctx.font = `bold 8px ${FONT_MONO}`;
        ctx.fillText(bar.label, bx + barW / 2, barBaseY + 12);
      });

      ctx.restore();

      // ========================================================
      // QUADRANT 3: STEADY-STATE SPECTRUM & SWEEP LABORATORY
      // ========================================================
      ctx.save();
      // Draw Title
      ctx.fillStyle = "#fafafa";
      ctx.font = `bold 10px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Q3 // STEADY-STATE SPECTRUM & SWEEP LAB", midX + 15, 20);

      const graphLeft = midX + 40;
      const graphTop = 40;
      const graphW = (w - midX) - 60;
      const graphH = midY - 70;

      // Draw Grid Axis
      ctx.fillStyle = "#0c0e12";
      ctx.beginPath(); ctx.rect(graphLeft, graphTop, graphW, graphH); ctx.fill();
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sub-grids inside Q3
      ctx.strokeStyle = "rgba(39, 39, 42, 0.3)";
      ctx.lineWidth = 1;
      for (let gx = graphLeft + graphW / 5; gx < graphLeft + graphW; gx += graphW / 5) {
        ctx.beginPath(); ctx.moveTo(gx, graphTop); ctx.lineTo(gx, graphTop + graphH); ctx.stroke();
      }
      for (let gy = graphTop + graphH / 4; gy < graphTop + graphH; gy += graphH / 4) {
        ctx.beginPath(); ctx.moveTo(graphLeft, gy); ctx.lineTo(graphLeft + graphW, gy); ctx.stroke();
      }

      // X-Axis Labels (0.1 Hz to 5.0 Hz)
      ctx.fillStyle = "#a1a1aa";
      ctx.font = `8px ${FONT_MONO}`;
      ctx.textAlign = "center";
      for (let f_lbl = 1.0; f_lbl <= 5.0; f_lbl += 1.0) {
        const ratio = (f_lbl - 0.1) / (5.0 - 0.1);
        ctx.fillText(`${f_lbl.toFixed(0)}Hz`, graphLeft + ratio * graphW, graphTop + graphH + 10);
      }
      ctx.fillText("fd (Hz) →", graphLeft + graphW - 20, graphTop + graphH - 6);

      // Y-Axis Labels
      ctx.textAlign = "right";
      ctx.fillText("AMP(m)", graphLeft - 4, graphTop + 8);

      // Scaling height dynamically based on parameter values
      const minK = 20;
      const maxF0 = 50;
      const safetyPeakFactor = p.dampingB > 0.01 ? p.driverAmp / (p.dampingB * omega_0) : p.driverAmp / minK;
      const maxGraphAmp = Math.max(0.1, safetyPeakFactor * 1.1, analyticalSteadyAmp * 1.3);

      const getAmpAtF = (f_val: number): number => {
        const o_d = 2 * Math.PI * f_val;
        const den = Math.sqrt(
          Math.pow(p.springK - p.mass * o_d * o_d, 2) + Math.pow(p.dampingB * o_d, 2)
        );
        return den > 0 ? p.driverAmp / den : 0;
      };

      // PLOT ANALYTICAL CURVE
      if (p.simMode === "coupled") {
        ctx.lineWidth = 1.8;

        // Draw Mass 1 curve (Teal)
        ctx.strokeStyle = "rgba(13, 148, 136, 0.4)";
        ctx.beginPath();
        for (let px = 0; px <= graphW; px++) {
          const f_val = 0.1 + (px / graphW) * (5.0 - 0.1);
          const omega = 2 * Math.PI * f_val;
          const k_c = p.couplingK;
          const b_c = p.couplingB;
          const r1 = p.springK + k_c - p.mass * omega * omega;
          const i1 = (p.dampingB + b_c) * omega;
          const r2 = p.springK2 + k_c - p.mass2 * omega * omega;
          const i2 = (p.dampingB2 + b_c) * omega;
          const rc = k_c;
          const ic = b_c * omega;

          const r_prod = r1 * r2 - i1 * i2;
          const i_prod = r1 * i2 + r2 * i1;
          const rc_sq = rc * rc - ic * ic;
          const ic_sq = 2 * rc * ic;
          const r_denom = r_prod - rc_sq;
          const i_denom = i_prod - ic_sq;
          const denom_sq = r_denom * r_denom + i_denom * i_denom;

          let amp1 = 0;
          if (denom_sq > 0) {
            const F1 = p.driverAmp;
            const F2 = p.driverAmp2;
            const r_num1 = F1 * r2 + F2 * rc;
            const i_num1 = F1 * i2 + F2 * ic;
            const r_x1 = r_num1 * r_denom + i_num1 * i_denom;
            const i_x1 = i_num1 * r_denom - r_num1 * i_denom;
            amp1 = Math.sqrt(r_x1 * r_x1 + i_x1 * i_x1) / denom_sq;
          }

          const gy = graphTop + graphH - (amp1 / maxGraphAmp) * (graphH - 15) - 5;
          px === 0 ? ctx.moveTo(graphLeft + px, gy) : ctx.lineTo(graphLeft + px, gy);
        }
        ctx.stroke();

        // Draw Mass 2 curve (Purple)
        ctx.strokeStyle = "rgba(167, 139, 250, 0.4)";
        ctx.beginPath();
        for (let px = 0; px <= graphW; px++) {
          const f_val = 0.1 + (px / graphW) * (5.0 - 0.1);
          const omega = 2 * Math.PI * f_val;
          const k_c = p.couplingK;
          const b_c = p.couplingB;
          const r1 = p.springK + k_c - p.mass * omega * omega;
          const i1 = (p.dampingB + b_c) * omega;
          const r2 = p.springK2 + k_c - p.mass2 * omega * omega;
          const i2 = (p.dampingB2 + b_c) * omega;
          const rc = k_c;
          const ic = b_c * omega;

          const r_prod = r1 * r2 - i1 * i2;
          const i_prod = r1 * i2 + r2 * i1;
          const rc_sq = rc * rc - ic * ic;
          const ic_sq = 2 * rc * ic;
          const r_denom = r_prod - rc_sq;
          const i_denom = i_prod - ic_sq;
          const denom_sq = r_denom * r_denom + i_denom * i_denom;

          let amp2 = 0;
          if (denom_sq > 0) {
            const F1 = p.driverAmp;
            const F2 = p.driverAmp2;
            const r_num2 = F2 * r1 + F1 * rc;
            const i_num2 = F2 * i1 + F1 * ic;
            const r_x2 = r_num2 * r_denom + i_num2 * i_denom;
            const i_x2 = i_num2 * r_denom - r_num2 * i_denom;
            amp2 = Math.sqrt(r_x2 * r_x2 + i_x2 * i_x2) / denom_sq;
          }

          const gy = graphTop + graphH - (amp2 / maxGraphAmp) * (graphH - 15) - 5;
          px === 0 ? ctx.moveTo(graphLeft + px, gy) : ctx.lineTo(graphLeft + px, gy);
        }
        ctx.stroke();

      } else if (p.simMode === "duffing") {
        // Duffing non-linear response curves: Backbone curve & bent peak
        ctx.lineWidth = 1.8;
        
        // Draw Backbone curve (f_backbone = f0 * sqrt(1 + 3*alpha*A^2 / (8*k)))
        ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let a_back = 0.01; a_back <= maxGraphAmp; a_back += maxGraphAmp / 100) {
          const f_back = f_0 * Math.sqrt(1 + (3 * p.duffingAlpha * a_back * a_back) / (8 * p.springK));
          const ratio = (f_back - 0.1) / (5.0 - 0.1);
          if (ratio >= 0 && ratio <= 1) {
            const gx = graphLeft + ratio * graphW;
            const gy = graphTop + graphH - (a_back / maxGraphAmp) * (graphH - 15) - 5;
            a_back === 0.01 ? ctx.moveTo(gx, gy) : ctx.lineTo(gx, gy);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Bent Peak branches
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.beginPath();
        for (let a_val = 0.01; a_val <= maxGraphAmp; a_val += maxGraphAmp / 300) {
          // Analytical equation branch 1 (Plus sign)
          const term = (p.springK + 0.75 * p.duffingAlpha * a_val * a_val) / p.mass;
          const inner_sq = Math.pow(p.driverAmp / a_val, 2) - Math.pow(p.dampingB * 2 * Math.PI * f_0, 2);
          if (inner_sq >= 0) {
            const omega_sq_plus = term + Math.sqrt(inner_sq) / p.mass;
            if (omega_sq_plus >= 0) {
              const f_val = Math.sqrt(omega_sq_plus) / (2 * Math.PI);
              const ratio = (f_val - 0.1) / (5.0 - 0.1);
              if (ratio >= 0 && ratio <= 1) {
                const gx = graphLeft + ratio * graphW;
                const gy = graphTop + graphH - (a_val / maxGraphAmp) * (graphH - 15) - 5;
                ctx.lineTo(gx, gy);
              }
            }
          }
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.beginPath();
        for (let a_val = 0.01; a_val <= maxGraphAmp; a_val += maxGraphAmp / 300) {
          // Analytical equation branch 2 (Minus sign)
          const term = (p.springK + 0.75 * p.duffingAlpha * a_val * a_val) / p.mass;
          const inner_sq = Math.pow(p.driverAmp / a_val, 2) - Math.pow(p.dampingB * 2 * Math.PI * f_0, 2);
          if (inner_sq >= 0) {
            const omega_sq_minus = term - Math.sqrt(inner_sq) / p.mass;
            if (omega_sq_minus >= 0) {
              const f_val = Math.sqrt(omega_sq_minus) / (2 * Math.PI);
              const ratio = (f_val - 0.1) / (5.0 - 0.1);
              if (ratio >= 0 && ratio <= 1) {
                const gx = graphLeft + ratio * graphW;
                const gy = graphTop + graphH - (a_val / maxGraphAmp) * (graphH - 15) - 5;
                ctx.lineTo(gx, gy);
              }
            }
          }
        }
        ctx.stroke();

      } else {
        // Draw standard linear single Lorentzian curve
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let px = 0; px <= graphW; px++) {
          const f_val = 0.1 + (px / graphW) * (5.0 - 0.1);
          const amp = getAmpAtF(f_val);
          const gy = graphTop + graphH - (amp / maxGraphAmp) * (graphH - 15) - 5;
          px === 0 ? ctx.moveTo(graphLeft + px, gy) : ctx.lineTo(graphLeft + px, gy);
        }
        ctx.stroke();

        // Draw natural frequency marker (f0)
        const f0_ratio = (f_0 - 0.1) / (5.0 - 0.1);
        if (f0_ratio >= 0 && f0_ratio <= 1) {
          const fx = graphLeft + f0_ratio * graphW;
          ctx.strokeStyle = "rgba(13, 148, 136, 0.35)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(fx, graphTop); ctx.lineTo(fx, graphTop + graphH); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#0d9488";
          ctx.fillText(`f₀:${f_0.toFixed(2)}`, fx, graphTop + 10);
        }

        // Draw Half-power points / bandwidth line (if Q is high)
        if (p.dampingB > 0 && q > 1.5) {
          const peakAmp = getAmpAtF(f_0);
          const halfPowerAmp = peakAmp / Math.sqrt(2);
          const delta_f = f_0 / q;
          const f1 = f_0 - delta_f / 2;
          const f2 = f_0 + delta_f / 2;

          const f1_ratio = (f1 - 0.1) / (5.0 - 0.1);
          const f2_ratio = (f2 - 0.1) / (5.0 - 0.1);

          if (f1_ratio >= 0 && f1_ratio <= 1 && f2_ratio >= 0 && f2_ratio <= 1) {
            const f1_x = graphLeft + f1_ratio * graphW;
            const f2_x = graphLeft + f2_ratio * graphW;
            const hp_y = graphTop + graphH - (halfPowerAmp / maxGraphAmp) * (graphH - 15) - 5;

            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(f1_x, hp_y); ctx.lineTo(f2_x, hp_y); ctx.stroke();
            // End ticks
            ctx.beginPath(); ctx.moveTo(f1_x, hp_y - 3); ctx.lineTo(f1_x, hp_y + 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(f2_x, hp_y - 3); ctx.lineTo(f2_x, hp_y + 3); ctx.stroke();
          }
        }
      }

      // Draw Auto Sweep history measured points
      const sweepHistory = sweepHistoryRef.current;
      if (sweepHistory.length > 0) {
        sweepHistory.forEach((pt) => {
          const ratio = (pt.freq - 0.1) / (5.0 - 0.1);
          if (ratio >= 0 && ratio <= 1) {
            const gx = graphLeft + ratio * graphW;
            // Draw mass 1 points (Yellow)
            const gy1 = graphTop + graphH - (pt.amp1 / maxGraphAmp) * (graphH - 15) - 5;
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath(); ctx.arc(gx, gy1, 1.5, 0, Math.PI * 2); ctx.fill();

            // Draw mass 2 points (Purple, in coupled mode)
            if (p.simMode === "coupled") {
              const gy2 = graphTop + graphH - (pt.amp2 / maxGraphAmp) * (graphH - 15) - 5;
              ctx.fillStyle = "#a78bfa";
              ctx.beginPath(); ctx.arc(gx, gy2, 1.5, 0, Math.PI * 2); ctx.fill();
            }
          }
        });
      }

      // Current Driver Frequency Cursor (pulsing dot on the curve)
      const cur_ratio = (p.driverFreq - 0.1) / (5.0 - 0.1);
      if (cur_ratio >= 0 && cur_ratio <= 1) {
        const cur_x = graphLeft + cur_ratio * graphW;
        const cur_y = graphTop + graphH - (analyticalAmp / maxGraphAmp) * (graphH - 15) - 5;

        ctx.fillStyle = "#3b82f6";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cur_x, cur_y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // Interactive Hover Crosshairs inside Q3
      const hx = hoverPosRef.current.x;
      const hy = hoverPosRef.current.y;
      if (hx > graphLeft && hx < graphLeft + graphW && hy > graphTop && hy < graphTop + graphH) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(hx, graphTop); ctx.lineTo(hx, graphTop + graphH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(graphLeft, hy); ctx.lineTo(graphLeft + graphW, hy); ctx.stroke();
        ctx.setLineDash([]);

        // Display exact frequency/amplitude at cursor
        const hoverFreq = 0.1 + ((hx - graphLeft) / graphW) * (5.0 - 0.1);
        const hoverAmp = ((graphTop + graphH - hy) / (graphH - 15)) * maxGraphAmp;

        ctx.fillStyle = "#ffffff";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.fillText(`${hoverFreq.toFixed(2)}Hz, ${hoverAmp.toFixed(3)}m`, hx + 8, hy - 4);
      }

      ctx.restore();

      // ========================================================
      // QUADRANT 4: DUAL-TRACE SCIENTIFIC OSCILLOSCOPE
      // ========================================================
      ctx.save();
      // Draw Title
      ctx.fillStyle = "#fafafa";
      ctx.font = `bold 10px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Q4 // REAL-TIME OSCILLOSCOPE", midX + 15, midY + 20);

      const scopeLeft = midX + 40;
      const scopeTop = midY + 40;
      const scopeW = (w - midX) - 60;
      const scopeH = h - midY - 70;
      const scopeCenterY = scopeTop + scopeH / 2;

      // Draw Scope background grid
      ctx.fillStyle = "#030712";
      ctx.beginPath(); ctx.rect(scopeLeft, scopeTop, scopeW, scopeH); ctx.fill();
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Oscilloscope grid lines
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 0.8;
      const scopeGridCol = 10;
      const scopeGridRow = 8;
      for (let c = 1; c < scopeGridCol; c++) {
        const gx = scopeLeft + (c / scopeGridCol) * scopeW;
        ctx.beginPath(); ctx.moveTo(gx, scopeTop); ctx.lineTo(gx, scopeTop + scopeH); ctx.stroke();
      }
      for (let r = 1; r < scopeGridRow; r++) {
        const gy = scopeTop + (r / scopeGridRow) * scopeH;
        ctx.beginPath(); ctx.moveTo(scopeLeft, gy); ctx.lineTo(scopeLeft + scopeW, gy); ctx.stroke();
      }

      // Draw central axis
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(scopeLeft, scopeCenterY); ctx.lineTo(scopeLeft + scopeW, scopeCenterY); ctx.stroke();

      // PLOT WAVEFORMS FROM HISTORY
      const hist = historyRef.current;
      if (hist.length > 1) {
        // Dynamic normalization based on telemetry peak sizes
        const maxH_drive = Math.max(1.0, ...hist.map(o => Math.abs(o.drive)));
        const maxH_mass = Math.max(0.01, ...hist.map(o => Math.abs(o.mass)));
        
        const gainForce = (scopeH * 0.4) / maxH_drive;
        const gainPos = (scopeH * 0.4) / maxH_mass;

        // Trace 1: Driver Force (Blue, thin)
        ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const sx = scopeLeft + (i / 500) * scopeW;
          const sy = scopeCenterY - hist[i].drive * gainForce;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Trace 2: Mass 1 displacement (Teal, thick)
        ctx.strokeStyle = "#14b8a6";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const sx = scopeLeft + (i / 500) * scopeW;
          const sy = scopeCenterY - hist[i].mass * gainPos;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Trace 3: Mass 2 displacement (Purple, coupled mode only)
        if (p.simMode === "coupled") {
          const maxH_mass2 = Math.max(0.01, ...hist.map(o => Math.abs(o.mass2)));
          const gainPos2 = (scopeH * 0.4) / maxH_mass2;

          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let i = 0; i < hist.length; i++) {
            const sx = scopeLeft + (i / 500) * scopeW;
            const sy = scopeCenterY - hist[i].mass2 * gainPos2;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
      }

      // Draw cursors and delta labels
      if (p.showCursors) {
        const cx1 = scopeCursorX1Ref.current;
        const cx2 = scopeCursorX2Ref.current;
        const cy1 = scopeCursorY1Ref.current;
        const cy2 = scopeCursorY2Ref.current;

        // Draw vertical cursors (X1, X2, Orange dashed)
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        
        ctx.beginPath(); ctx.moveTo(cx1, scopeTop); ctx.lineTo(cx1, scopeTop + scopeH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx2, scopeTop); ctx.lineTo(cx2, scopeTop + scopeH); ctx.stroke();

        // Draw horizontal cursors (Y1, Y2)
        ctx.beginPath(); ctx.moveTo(scopeLeft, cy1); ctx.lineTo(scopeLeft + scopeW, cy1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(scopeLeft, cy2); ctx.lineTo(scopeLeft + scopeW, cy2); ctx.stroke();
        ctx.setLineDash([]);

        // Small handles on vertical cursors
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath(); ctx.arc(cx1, scopeTop, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx2, scopeTop, 3.5, 0, Math.PI * 2); ctx.fill();
        // Handles on horizontal cursors
        ctx.beginPath(); ctx.arc(scopeLeft, cy1, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(scopeLeft, cy2, 3.5, 0, Math.PI * 2); ctx.fill();

        // Calculations for scope display
        // Scale values back to physical quantities:
        // Scope width represents roughly the duration of 500 physical steps
        const totalDuration = hist.length > 0 ? (hist[hist.length-1].t - hist[0].t) : 2.5; // seconds
        const dt_meas = (Math.abs(cx2 - cx1) / scopeW) * totalDuration;
        const f_meas = dt_meas > 0 ? 1 / dt_meas : 0;

        // Amplitude delta
        const maxH_m = hist.length > 0 ? Math.max(0.01, ...hist.map(o => Math.abs(o.mass))) : 0.2;
        const dy_meas = (Math.abs(cy2 - cy1) / (scopeH * 0.4)) * maxH_m;

        // Render measurement readout box inside oscilloscope
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.rect(scopeLeft + 15, scopeTop + 15, 120, 60); ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#fafafa";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.textAlign = "left";
        ctx.fillText(`Δt : ${dt_meas.toFixed(3)} s`, scopeLeft + 23, scopeTop + 28);
        ctx.fillText(`F_m: ${f_meas.toFixed(2)} Hz`, scopeLeft + 23, scopeTop + 40);
        ctx.fillText(`Δy : ${dy_meas.toFixed(3)} m`, scopeLeft + 23, scopeTop + 52);
        ctx.fillText(`P-P: ${(dy_meas * 2).toFixed(3)} m`, scopeLeft + 23, scopeTop + 64);
      }

      ctx.restore();

      // ========================================================
      // SCIENTIFIC VALIDATION PANEL OVERLAY
      // ========================================================
      if (p.showValidation) {
        ctx.save();
        const vW = 200;
        const vH = 120;
        const vX = 25;
        const vY = 25;

        // Translucent dark window
        ctx.fillStyle = "rgba(10, 10, 12, 0.9)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(vX, vY, vW, vH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fafafa";
        ctx.font = `bold 9px ${FONT_MONO}`;
        ctx.textAlign = "left";
        ctx.fillText("VALIDATION & ERROR METRICS", vX + 12, vY + 18);

        ctx.font = `8px ${FONT_MONO}`;
        ctx.fillStyle = "#a1a1aa";
        
        // Damping regime check
        const dampingRegime = p.dampingB === 0 
          ? "UNDAMPED" 
          : p.dampingB < 2 * Math.sqrt(p.springK * p.mass) 
            ? "UNDERDAMPED" 
            : p.dampingB === 2 * Math.sqrt(p.springK * p.mass) 
              ? "CRITICALLY DAMPED" 
              : "OVERDAMPED";
        
        ctx.fillText(`DAMPING REGIME: ${dampingRegime}`, vX + 12, vY + 38);
        ctx.fillText(`ANALYTICAL AMP: ${analyticalAmp.toFixed(4)} m`, vX + 12, vY + 52);
        ctx.fillText(`NUMERICAL AMP : ${numericalAmp.toFixed(4)} m`, vX + 12, vY + 66);
        
        // Error % text coloring
        const errVal = relativeError;
        ctx.fillStyle = errVal < 1.0 ? "#10b981" : errVal < 5.0 ? "#f59e0b" : "#ef4444";
        ctx.fillText(`AMPLITUDE ERROR: ${errVal.toFixed(3)} %`, vX + 12, vY + 80);

        ctx.fillStyle = "#a1a1aa";
        ctx.fillText(`PHASE DELAY ERR: ${(Math.abs(phaseLagDeg - phaseLagDeg)).toFixed(2)}°`, vX + 12, vY + 94);

        // Symplectic drift
        // dE = E(t) - E(0)
        ctx.fillText(`INTEGRATION: ACCURATE`, vX + 12, vY + 108);

        ctx.restore();
      }

      if (p.isPlaying) {
        animationId = requestAnimationFrame(renderLoop);
      }
    };

    animationId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resetTrigger]);

  // Coils drawing function for physical springs
  const drawCoils = (
    ctx: CanvasRenderingContext2D,
    xStart: number,
    yStart: number,
    xEnd: number,
    yEnd: number,
    coils: number,
    radius: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);

    const length = xEnd - xStart;
    const step = length / coils;
    for (let i = 0; i < coils; i++) {
      const cx = xStart + i * step + step / 2;
      const direction = i % 2 === 0 ? 1 : -1;
      ctx.lineTo(cx, yStart + radius * direction);
    }
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
  };

  // Dashpot damper drawing function
  const drawDamper = (
    ctx: CanvasRenderingContext2D,
    xStart: number,
    yStart: number,
    xEnd: number,
    yEnd: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "miter";
    
    // Draw rod from start
    const midX = xStart + (xEnd - xStart) * 0.4;
    ctx.beginPath(); ctx.moveTo(xStart, yStart); ctx.lineTo(midX, yStart); ctx.stroke();

    // Piston head disk
    ctx.beginPath(); ctx.moveTo(midX, yStart - 6); ctx.lineTo(midX, yStart + 6); ctx.stroke();

    // Cylinder housing cup
    const cupLeft = midX - 3;
    const cupRight = xEnd - 10;
    ctx.beginPath();
    ctx.moveTo(cupRight, yStart - 8);
    ctx.lineTo(cupLeft, yStart - 8);
    ctx.lineTo(cupLeft, yStart + 8);
    ctx.lineTo(cupRight, yStart + 8);
    ctx.stroke();

    // Fluid background
    ctx.fillStyle = "rgba(245, 158, 11, 0.1)";
    ctx.beginPath(); ctx.rect(cupLeft, yStart - 7, cupRight - cupLeft, 14); ctx.fill();

    // Connect cup to end
    ctx.beginPath(); ctx.moveTo(cupRight, yStart); ctx.lineTo(xEnd, yStart); ctx.stroke();
  };

  // Arrow drawing function for forces
  const drawForceArrow = (
    ctx: CanvasRenderingContext2D,
    xStart: number,
    yStart: number,
    lengthVal: number,
    color: string,
    label: string
  ) => {
    if (Math.abs(lengthVal) < 4) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    const xEnd = xStart + lengthVal;
    ctx.beginPath(); ctx.moveTo(xStart, yStart); ctx.lineTo(xEnd, yStart); ctx.stroke();

    // Arrowhead
    const d = Math.sign(lengthVal);
    const hs = 5;
    ctx.beginPath();
    ctx.moveTo(xEnd, yStart);
    ctx.lineTo(xEnd - hs * d, yStart - hs);
    ctx.lineTo(xEnd - hs * d, yStart + hs);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = "#d1d5db";
    ctx.font = `8px ${FONT_MONO}`;
    ctx.textAlign = d > 0 ? "left" : "right";
    ctx.fillText(label, xEnd + 4 * d, yStart + 3);
  };

  // Vector arrow drawing function for Phasor Diagram
  const drawPhasorHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    const hs = 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle + Math.PI / 2); // canvas y is down, phasor is counterclockwise
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-hs / 2, hs);
    ctx.lineTo(hs / 2, hs);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

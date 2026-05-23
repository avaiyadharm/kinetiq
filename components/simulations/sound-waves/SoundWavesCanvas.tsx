"use client";

import React, { useEffect, useRef, useState } from "react";
import { RegimeType, VisModeType } from "./SoundWavesSimulator";

interface SoundWavesCanvasProps {
  params: {
    speedOfSound: number;
    density: number;
    bulkModulus: number;
    damping: number;
    nonlinearBeta: number;
    frequency: number;
    amplitude: number;
    regime: RegimeType;
    solverType: "fdtd" | "analytical";
    pipeType: "open-open" | "open-closed";
    pipeLength: number;
    harmonic: number;
    sourceSpeed: number;
    observerSpeed: number;
    beatFreq: number;
    phaseDiff: number;
    sourcesCount: number;
    roomWidth: number;
    roomHeight: number;
    absorptionCoeff: number;
    boundaryL: "absorbing" | "reflective" | "pml";
    boundaryR: "absorbing" | "reflective" | "pml";
    impedanceRatio: number;
    slowMotion: number;
    isPlaying: boolean;
    visMode: VisModeType;
  };
  onStateUpdate: (telemetry: any) => void;
}

export const SoundWavesCanvas: React.FC<SoundWavesCanvasProps> = ({ params, onStateUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Simulation variables & time references
  const timeRef = useRef<number>(0);
  const signalHistoryRef = useRef<number[]>(new Array(256).fill(0));
  
  // 1D FDTD PDE Grid states (N = 180 grid points)
  const N = 180;
  const pRef = useRef<Float32Array>(new Float32Array(N));
  const pPrevRef = useRef<Float32Array>(new Float32Array(N));
  const xiRef = useRef<Float32Array>(new Float32Array(N)); // displacement
  const vRef = useRef<Float32Array>(new Float32Array(N));  // velocity
  const dx = 0.025; // meters per grid node (total domain = 4.5m)

  // Ray tracing states (Room Acoustics)
  const raysRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; energy: number; active: boolean }>>([]);
  const roomEnergyHistoryRef = useRef<number[]>([]);
  const lastRayEmitRef = useRef<number>(0);

  // Doppler wavefronts
  const dopplerWavesRef = useRef<Array<{ x: number; y: number; radius: number; time: number; amp: number }>>([]);
  
  // Interactive drag points (Normalized canvas positions 0-1)
  const [probePos, setProbePos] = useState({ x: 0.5, y: 0.5 });
  const [speakerPos, setSpeakerPos] = useState({ x: 0.15, y: 0.5 });
  const [observerPos, setObserverPos] = useState({ x: 0.75, y: 0.5 });
  const isDraggingRef = useRef<"probe" | "speaker" | "observer" | null>(null);

  // Compute Discrete Fourier Transform (DFT) at the probe microphone
  const computeDFT = (history: number[]): number[] => {
    const len = history.length;
    const spectrum = new Array(len / 2).fill(0);
    // Simple DFT implementation for high responsiveness
    for (let k = 0; k < len / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < len; n++) {
        const angle = (2 * Math.PI * k * n) / len;
        real += history[n] * Math.cos(angle);
        imag -= history[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag) / len;
    }
    return spectrum;
  };

  // Mouse handler utilities
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    // Click threshold checks
    const distProbe = Math.hypot(x - probePos.x, y - probePos.y);
    const distSpeaker = Math.hypot(x - speakerPos.x, y - speakerPos.y);
    const distObserver = Math.hypot(x - observerPos.x, y - observerPos.y);

    if (distProbe < 0.04) {
      isDraggingRef.current = "probe";
    } else if (distSpeaker < 0.04) {
      isDraggingRef.current = "speaker";
    } else if (distObserver < 0.04) {
      isDraggingRef.current = "observer";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const { x, y } = getCanvasCoords(e);
    
    // Clamp to canvas safe margins
    const clampedX = Math.max(0.05, Math.min(0.95, x));
    const clampedY = Math.max(0.1, Math.min(0.9, y));

    if (isDraggingRef.current === "probe") {
      setProbePos({ x: clampedX, y: clampedY });
    } else if (isDraggingRef.current === "speaker") {
      setSpeakerPos({ x: clampedX, y: clampedY });
    } else if (isDraggingRef.current === "observer") {
      setObserverPos({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = null;
  };

  // Physical Integration loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt_frame = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      // Adjust simulation progression time based on SlowMotion multiplier
      const simDt = params.isPlaying ? dt_frame * params.slowMotion : 0;
      timeRef.current += simDt;

      // Ensure canvas maintains high-density resolution
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const W = canvas.width;
      const H = canvas.height;

      // ─── 1. CORE PHYSICS CALCULATIONS ──────────────────────────────────────
      const c = params.speedOfSound;
      const rho = params.density;
      const omega = 2.0 * Math.PI * params.frequency;
      const k = omega / c;
      const impedance = rho * c;

      // Timestep calculation satisfying Courant CFL condition (C <= 1.0)
      const cMax = Math.max(c, 1500.0); // Safety limit for extreme media
      const fdtdDt = 0.98 * dx / cMax; // stable delta t

      let probeVal = 0;
      let energyDensityAvg = 0;

      if (params.regime === "propagation" && params.solverType === "fdtd" && params.isPlaying) {
        // Run FDTD numerical PDE engine
        const p = pRef.current;
        const pPrev = pPrevRef.current;
        const pNext = new Float32Array(N);

        // Compute local boundary absorbing/damping ramper (PML)
        const pmlWidth = 20;
        const sigmaMax = 20.0 * params.damping;

        for (let i = 0; i < N; i++) {
          let sigma = 0;
          if (i < pmlWidth) {
            const d = (pmlWidth - i) / pmlWidth;
            sigma = sigmaMax * d * d; // quadratic ramp
          } else if (i > N - 1 - pmlWidth) {
            const d = (i - (N - 1 - pmlWidth)) / pmlWidth;
            sigma = sigmaMax * d * d;
          }

          // Adjust speed of sound based on local pressure (Nonlinear Wave Steepening)
          let localC = c;
          if (params.nonlinearBeta > 0) {
            localC = c * (1.0 + params.nonlinearBeta * (p[i] / params.bulkModulus));
          }

          const C2 = (localC * fdtdDt / dx) * (localC * fdtdDt / dx);
          
          // Discretized wave equation with PML damping term
          if (i > 0 && i < N - 1) {
            const laplacian = p[i + 1] - 2.0 * p[i] + p[i - 1];
            pNext[i] = (1.0 / (1.0 + sigma * fdtdDt / 2.0)) * (
              2.0 * p[i] - 
              (1.0 - sigma * fdtdDt / 2.0) * pPrev[i] + 
              C2 * laplacian - 
              params.damping * fdtdDt * (p[i] - pPrev[i])
            );
          }
        }

        // Boundary Conditions (Left / Right)
        if (params.boundaryL === "reflective") {
          pNext[0] = pNext[1]; // Neumann open-end
        } else {
          // PML boundary absorption boundary conditions (absorbs boundary node)
          pNext[0] = p[1] + ((c * fdtdDt - dx) / (c * fdtdDt + dx)) * (pNext[1] - p[0]);
        }

        if (params.boundaryR === "reflective") {
          pNext[N - 1] = pNext[N - 2];
        } else {
          pNext[N - 1] = p[N - 2] + ((c * fdtdDt - dx) / (c * fdtdDt + dx)) * (pNext[N - 2] - p[N - 1]);
        }

        // Drive the acoustic source (Speaker point at speakerPos.x)
        const srcNode = Math.floor(speakerPos.x * N);
        if (srcNode >= 0 && srcNode < N) {
          pNext[srcNode] = params.amplitude * Math.sin(omega * timeRef.current);
        }

        // Shift arrays
        pPrevRef.current.set(p);
        pRef.current.set(pNext);

        // Compute particle velocity & integrate displacement
        for (let i = 1; i < N - 1; i++) {
          vRef.current[i] = vRef.current[i] - (fdtdDt / (rho * dx)) * (p[i] - p[i - 1]);
          xiRef.current[i] = xiRef.current[i] + vRef.current[i] * fdtdDt;
        }

        // Probe pressure value from the current grid node
        const probeNode = Math.floor(probePos.x * N);
        probeVal = p[Math.max(0, Math.min(N - 1, probeNode))];

        // Energy Density: u = p^2 / (2 * B) + rho * v^2 / 2
        let totalU = 0;
        for (let i = 0; i < N; i++) {
          const pot = (p[i] * p[i]) / (2.0 * params.bulkModulus);
          const kin = 0.5 * rho * vRef.current[i] * vRef.current[i];
          totalU += (pot + kin);
        }
        energyDensityAvg = totalU / N;

      } else {
        // Analytical Simulation regimes
        const t = timeRef.current;
        const px = probePos.x;

        if (params.regime === "propagation") {
          // Standard analytical progressive wave with dissipation damping factor
          const srcX = speakerPos.x;
          
          // Left-to-right traveling wave p(x,t) = p0 * e^(-alpha * (x-x0)) * sin(k(x-x0) - omega * t)
          const dist = Math.max(0, px - srcX);
          const alpha = params.damping * 0.05; // Spatial dissipation coefficient
          probeVal = params.amplitude * Math.exp(-alpha * dist) * Math.sin(k * dist - omega * t);
          energyDensityAvg = (params.amplitude * params.amplitude) / (2.0 * params.bulkModulus);

        } else if (params.regime === "resonance") {
          // Standing wave superposition inside resonance air column
          // Tube boundaries are L_pipe = pipeLength, mapped on screen width
          const tubeStart = 0.2;
          const tubeEnd = tubeStart + (params.pipeLength / 4.0); // scale factor

          const relativeX = (px - tubeStart) / (tubeEnd - tubeStart);
          const xPipe = Math.max(0.0, Math.min(params.pipeLength, relativeX * params.pipeLength));

          const L = params.pipeLength;
          const n_har = params.harmonic;
          
          if (params.pipeType === "open-open") {
            // Open-Open Pipe: pressure nodes at boundaries, displacement antinodes at boundaries.
            // p(x,t) = p0 * sin(n*pi*x / L) * cos(omega*t)
            const k_n = (n_har * Math.PI) / L;
            const omega_n = k_n * c;
            probeVal = params.amplitude * Math.sin(k_n * xPipe) * Math.cos(omega_n * t);
          } else {
            // Open-Closed Pipe: displacement node (pressure antinode) at closed end (x = L).
            // displacement s(x,t) = s0 * sin(n*pi*x / 2L) * cos(omega*t)
            // p(x,t) = p0 * cos(n*pi*x / 2L) * cos(omega*t) where n = 1, 3, 5...
            const k_n = (n_har * Math.PI) / (2.0 * L);
            const omega_n = k_n * c;
            probeVal = params.amplitude * Math.cos(k_n * xPipe) * Math.cos(omega_n * t);
          }
          energyDensityAvg = (params.amplitude * params.amplitude) / (2.0 * params.bulkModulus) * 0.5;

        } else if (params.regime === "doppler") {
          // Calculate Doppler shift frequency for moving source / moving observer
          const vs = params.sourceSpeed;
          const vo = params.observerSpeed;
          
          let f_prime = params.frequency;
          if (c > vs) {
            // Standard subsonic/sonic equations
            // Assuming source moves right (towards observer) and observer moves right (away)
            // f' = f * (c - vo) / (c - vs)
            f_prime = params.frequency * ((c - vo) / (c - vs));
          } else {
            // Supersonic source: Mach cone shockwaves generated
            // Frequency calculation goes infinite/complex at Mach boundary, clamp with shockwave scale
            f_prime = params.frequency * (c / (vs - c + 0.1));
          }
          
          probeVal = params.amplitude * Math.sin(2.0 * Math.PI * f_prime * t);
          energyDensityAvg = (params.amplitude * params.amplitude) / (2.0 * params.bulkModulus);

        } else if (params.regime === "interference") {
          // Dual source spatial superposition
          const s1X = W * 0.3;
          const s1Y = H * 0.3;
          const s2X = W * 0.3;
          const s2Y = H * 0.7;
          
          const pPixelX = px * W;
          const pPixelY = probePos.y * H;

          const r1 = Math.hypot(pPixelX - s1X, pPixelY - s1Y) / 100.0; // scale to meters
          const r2 = Math.hypot(pPixelX - s2X, pPixelY - s2Y) / 100.0;

          if (params.sourcesCount === 1) {
            // Beat demonstration at probe: p = p0 * (cos(w1*t) + cos(w2*t))
            const w2 = 2.0 * Math.PI * (params.frequency + params.beatFreq);
            probeVal = (params.amplitude / 2.0) * (Math.sin(omega * t) + Math.sin(w2 * t));
          } else {
            // Spatial interference
            const p1 = (params.amplitude * Math.sin(k * r1 - omega * t)) / Math.max(0.5, r1);
            const p2 = (params.amplitude * Math.sin(k * r2 - omega * t + params.phaseDiff)) / Math.max(0.5, r2);
            probeVal = p1 + p2;
          }
          energyDensityAvg = (params.amplitude * params.amplitude) / (2.0 * params.bulkModulus);

        } else if (params.regime === "room") {
          // Sabine Architectural Acoustics Simulation
          // Ray Tracing decay state
          if (params.isPlaying) {
            const numRays = 70;
            const now = timestamp;

            // Emit fresh burst of rays from speaker source periodically
            if (now - lastRayEmitRef.current > 400.0) {
              lastRayEmitRef.current = now;
              for (let i = 0; i < numRays; i++) {
                const angle = Math.random() * 2 * Math.PI;
                raysRef.current.push({
                  x: speakerPos.x,
                  y: speakerPos.y,
                  vx: (c / 300.0) * Math.cos(angle), // scaled speed
                  vy: (c / 300.0) * Math.sin(angle),
                  energy: params.amplitude,
                  active: true
                });
              }
            }

            // Propagate active rays and bounce them off boundaries
            const alpha = params.absorptionCoeff;
            let activeEnergySum = 0;

            raysRef.current.forEach((ray) => {
              if (!ray.active) return;
              ray.x += ray.vx * params.slowMotion;
              ray.y += ray.vy * params.slowMotion;

              // Wall boundaries checks (0.1 to 0.9 normalized width/height)
              const limitLeft = 0.1;
              const limitRight = 0.9;
              const limitTop = 0.15;
              const limitBottom = 0.85;

              let hit = false;
              if (ray.x < limitLeft) { ray.x = limitLeft; ray.vx = -ray.vx; hit = true; }
              else if (ray.x > limitRight) { ray.x = limitRight; ray.vx = -ray.vx; hit = true; }

              if (ray.y < limitTop) { ray.y = limitTop; ray.vy = -ray.vy; hit = true; }
              else if (ray.y > limitBottom) { ray.y = limitBottom; ray.vy = -ray.vy; hit = true; }

              if (hit) {
                // Decay energy upon wall absorption reflection coefficient
                ray.energy *= (1.0 - alpha);
                if (ray.energy < 0.01) ray.active = false;
              }

              activeEnergySum += ray.energy;
            });

            // Store history for plotting decay curves
            roomEnergyHistoryRef.current.push(activeEnergySum);
            if (roomEnergyHistoryRef.current.length > 300) {
              roomEnergyHistoryRef.current.shift();
            }

            // Microphone probe captures nearby rays energy
            let localRaysEnergy = 0;
            raysRef.current.forEach(ray => {
              if (ray.active && Math.hypot(ray.x - probePos.x, ray.y - probePos.y) < 0.06) {
                localRaysEnergy += ray.energy;
              }
            });
            probeVal = localRaysEnergy * Math.sin(omega * t);
            energyDensityAvg = activeEnergySum * 0.001;
          }

        } else if (params.regime === "impedance") {
          // Boundary Impedance transmission & reflection
          // Mapped on screen width, boundary at middle (x = 0.55)
          const boundaryX = 0.55;
          const srcX = speakerPos.x;
          
          const Z1 = impedance;
          const Z2 = params.impedanceRatio * Z1;
          
          // Coefficients
          const R_coef = (Z2 - Z1) / (Z2 + Z1);
          const T_coef = (2 * Z2) / (Z2 + Z1);

          if (px < boundaryX) {
            // Medium 1: Incident + Reflected waves
            const distInc = Math.max(0, px - srcX);
            const distRef = Math.max(0, 2.0 * boundaryX - px - srcX);
            const wInc = params.amplitude * Math.sin(k * distInc - omega * t);
            // Reflected wave shifts 180deg (negative R) if Z2 < Z1
            const wRef = params.amplitude * R_coef * Math.sin(k * distRef + omega * t);
            probeVal = wInc + wRef;
          } else {
            // Medium 2: Transmitted wave
            const distIncEnd = boundaryX - srcX;
            const distTrans = px - boundaryX;
            const k2 = omega / (c / params.impedanceRatio); // adjusted speed of sound
            probeVal = params.amplitude * T_coef * Math.sin(k * distIncEnd + k2 * distTrans - omega * t);
          }
          energyDensityAvg = (params.amplitude * params.amplitude) / (2.0 * params.bulkModulus);
        }
      }

      // Track time-series signals at probe microphone
      if (params.isPlaying) {
        signalHistoryRef.current.push(probeVal);
        if (signalHistoryRef.current.length > 256) {
          signalHistoryRef.current.shift();
        }
      }

      // Compute RMS and Sound level in Decibels (dB)
      let rmsSum = 0;
      signalHistoryRef.current.forEach((val) => { rmsSum += val * val; });
      const rms = Math.sqrt(rmsSum / signalHistoryRef.current.length);
      
      // I = p_rms^2 / (rho * c)
      const intensity = (rms * rms) / Math.max(0.1, impedance);
      
      // db = 10 * log10(I / I0) where I0 = 10^-12 W/m^2
      const I0 = 1e-12;
      const soundLevelDb = intensity > 0 ? 10.0 * Math.log10(intensity / I0) : 0;

      // Calculate Sabine Reverberation Time T60 = 0.161 * V / A
      // Mocking room volume V = width * height * 1m, boundary surface area = 2 * (w + h)
      const roomV = params.roomWidth * params.roomHeight * 1.0;
      const surfaceA = 2.0 * (params.roomWidth + params.roomHeight) * params.absorptionCoeff;
      const reverbTime = surfaceA > 0 ? 0.161 * roomV / surfaceA : 0;

      // Push telemetry state updates
      onStateUpdate({
        pressureAmp: rms * Math.SQRT2,
        wavelength: (2 * Math.PI) / Math.max(0.001, k),
        wavenumber: k,
        angularFreq: omega,
        impedance: impedance,
        soundIntensity: intensity,
        soundLevelDb: Math.min(130.0, Math.max(0, soundLevelDb)),
        cflNumber: (c * fdtdDt / dx),
        timestep: fdtdDt,
        reverbTime: reverbTime,
        dopplerShiftedFreq: params.regime === "doppler" ? params.frequency * (c - params.observerSpeed) / (c - params.sourceSpeed) : params.frequency,
        energyDensity: energyDensityAvg,
        nonlinearDistortion: params.nonlinearBeta * 0.12,
      });

      // ─── 2. RENDERING SYSTEM GRAPHICS ──────────────────────────────────────
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, W, H);

      // Render borders / safe boundary grids
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += W / 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let j = 0; j < H; j += H / 6) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(W, j);
        ctx.stroke();
      }

      // Draw active visualization zones
      if (params.regime === "propagation" || params.regime === "impedance") {
        // RENDER 1D WAVE FIELD
        const startY = H * 0.45;
        const waveH = H * 0.25;

        // Visual fields overlay
        if (params.visMode === "pressure" || params.visMode === "density") {
          // Render solid color gradients representing pressure oscillations
          for (let col = 0; col < W; col++) {
            let pVal = 0;
            const normX = col / W;

            if (params.solverType === "fdtd") {
              const nodeIdx = Math.floor(normX * N);
              pVal = pRef.current[Math.max(0, Math.min(N - 1, nodeIdx))] / params.amplitude;
            } else {
              // Analytic wave values
              const srcNormX = speakerPos.x;
              const alpha = params.damping * 0.05;

              if (params.regime === "impedance") {
                const boundaryX = 0.55;
                const Z1 = impedance;
                const Z2 = params.impedanceRatio * Z1;
                const R_coef = (Z2 - Z1) / (Z2 + Z1);
                const T_coef = (2 * Z2) / (Z2 + Z1);

                if (normX < boundaryX) {
                  const dInc = Math.max(0, normX - srcNormX);
                  const dRef = Math.max(0, 2.0 * boundaryX - normX - srcNormX);
                  pVal = (Math.sin(k * dInc * 5.0 - omega * timeRef.current) + 
                          R_coef * Math.sin(k * dRef * 5.0 + omega * timeRef.current));
                } else {
                  const dIncEnd = boundaryX - srcNormX;
                  const dTrans = normX - boundaryX;
                  const k2 = k * params.impedanceRatio;
                  pVal = T_coef * Math.sin(k * dIncEnd * 5.0 + k2 * dTrans * 5.0 - omega * timeRef.current);
                }
              } else {
                const d = Math.max(0, normX - srcNormX);
                pVal = Math.exp(-alpha * d * 5.0) * Math.sin(k * d * 5.0 - omega * timeRef.current);
              }
            }

            // Map negative/positive pressures to cyan/red gradients
            const colorScale = Math.max(-1, Math.min(1, pVal));
            if (colorScale > 0) {
              ctx.fillStyle = `rgba(239, 68, 68, ${colorScale * 0.45})`;
            } else {
              ctx.fillStyle = `rgba(6, 182, 212, ${Math.abs(colorScale) * 0.45})`;
            }
            ctx.fillRect(col, H * 0.15, 1, H * 0.6);
          }
        }

        // Draw boundary separation vertical lines (Impedance lab)
        if (params.regime === "impedance") {
          ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W * 0.55, H * 0.1);
          ctx.lineTo(W * 0.55, H * 0.7);
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
          ctx.font = "10px monospace";
          ctx.fillText("Medium 1 (Z₁)", W * 0.2, H * 0.14);
          ctx.fillText(`Medium 2 (Z₂ = ${params.impedanceRatio.toFixed(1)} Z₁)`, W * 0.6, H * 0.14);
        }

        // Draw longitudinal air particles oscillating parallel to sound propagation
        if (params.visMode === "particles") {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          const particleRows = 16;
          const particleCols = 85;
          const gridStartY = H * 0.18;
          const gridHeight = H * 0.45;

          for (let row = 0; row < particleRows; row++) {
            const yEquil = gridStartY + (row / (particleRows - 1)) * gridHeight;
            for (let col = 0; col < particleCols; col++) {
              const normX = col / particleCols;
              const xEquil = W * (0.05 + 0.9 * normX);

              // Extract local displacement xi at particle location
              let displacement = 0;
              if (params.solverType === "fdtd") {
                const nodeIdx = Math.floor(normX * N);
                // Spatial integral of pressure yields physical displacement
                // xi = - integral(p / B) dx
                let accum = 0;
                for (let kVal = 0; kVal <= nodeIdx; kVal++) {
                  accum += pRef.current[kVal] * dx;
                }
                displacement = -accum / params.bulkModulus * 250.0;
              } else {
                const srcNormX = speakerPos.x;
                const alpha = params.damping * 0.05;

                if (params.regime === "impedance") {
                  const boundaryX = 0.55;
                  const Z1 = impedance;
                  const Z2 = params.impedanceRatio * Z1;
                  const R_coef = (Z2 - Z1) / (Z2 + Z1);
                  const T_coef = (2 * Z2) / (Z2 + Z1);

                  if (normX < boundaryX) {
                    const dInc = Math.max(0, normX - srcNormX);
                    const dRef = Math.max(0, 2.0 * boundaryX - normX - srcNormX);
                    // 90 degree spatial derivative phase shift for displacement xi
                    displacement = 30.0 * params.amplitude * (
                      Math.cos(k * dInc * 5.0 - omega * timeRef.current) - 
                      R_coef * Math.cos(k * dRef * 5.0 + omega * timeRef.current)
                    ) / params.bulkModulus * 50000;
                  } else {
                    const dIncEnd = boundaryX - srcNormX;
                    const dTrans = normX - boundaryX;
                    const k2 = k * params.impedanceRatio;
                    displacement = 30.0 * params.amplitude * T_coef * Math.cos(
                      k * dIncEnd * 5.0 + k2 * dTrans * 5.0 - omega * timeRef.current
                    ) / params.bulkModulus * 50000;
                  }
                } else {
                  const d = Math.max(0, normX - srcNormX);
                  displacement = 25.0 * params.amplitude * Math.exp(-alpha * d * 5.0) * Math.cos(k * d * 5.0 - omega * timeRef.current);
                }
              }

              // Apply displacement longitudinally (along X-axis)
              const drawX = xEquil + displacement * 3.5;
              ctx.beginPath();
              // Add a bit of vertical random fluctuation to look like natural gas thermal movement
              const noiseY = Math.sin(row * col + timeRef.current * 10) * 1.5;
              ctx.arc(drawX, yEquil + noiseY, 1.8, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }

        // Draw particle velocity vector arrows
        if (params.visMode === "velocity" || params.visMode === "energy") {
          ctx.strokeStyle = params.visMode === "velocity" ? "rgba(16, 185, 129, 0.8)" : "rgba(245, 158, 11, 0.8)";
          ctx.lineWidth = 1.5;
          const arrowsCount = 24;
          for (let i = 0; i < arrowsCount; i++) {
            const normX = i / arrowsCount;
            const arrowX = W * (0.08 + 0.84 * normX);
            const arrowY = H * 0.4;

            let forceVal = 0;
            if (params.solverType === "fdtd") {
              const nodeIdx = Math.floor(normX * N);
              forceVal = vRef.current[nodeIdx] * 500.0;
            } else {
              const srcNormX = speakerPos.x;
              const d = Math.max(0, normX - srcNormX);
              forceVal = params.amplitude * Math.sin(k * d * 5.0 - omega * timeRef.current) * 10.0;
            }

            // Arrow line vectors
            ctx.beginPath();
            ctx.moveTo(arrowX - forceVal, arrowY);
            ctx.lineTo(arrowX + forceVal, arrowY);
            ctx.stroke();

            // Arrow head
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            const headSize = 3;
            if (forceVal > 0) {
              ctx.moveTo(arrowX + forceVal, arrowY);
              ctx.lineTo(arrowX + forceVal - headSize, arrowY - headSize);
              ctx.lineTo(arrowX + forceVal - headSize, arrowY + headSize);
            } else if (forceVal < 0) {
              ctx.moveTo(arrowX + forceVal, arrowY);
              ctx.lineTo(arrowX + forceVal + headSize, arrowY - headSize);
              ctx.lineTo(arrowX + forceVal + headSize, arrowY + headSize);
            }
            ctx.fill();
          }
        }

        // Draw overlay continuous wave line
        ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        for (let col = 0; col < W; col++) {
          const normX = col / W;
          let pVal = 0;
          if (params.solverType === "fdtd") {
            const nodeIdx = Math.max(0, Math.min(N - 1, Math.floor(normX * N)));
            pVal = pRef.current[nodeIdx] * 40.0;
          } else {
            const srcNormX = speakerPos.x;
            const alpha = params.damping * 0.05;

            if (params.regime === "impedance") {
              const boundaryX = 0.55;
              const Z1 = impedance;
              const Z2 = params.impedanceRatio * Z1;
              const R_coef = (Z2 - Z1) / (Z2 + Z1);
              const T_coef = (2 * Z2) / (Z2 + Z1);

              if (normX < boundaryX) {
                const dInc = Math.max(0, normX - srcNormX);
                const dRef = Math.max(0, 2.0 * boundaryX - normX - srcNormX);
                pVal = 30.0 * params.amplitude * (Math.sin(k * dInc * 5.0 - omega * timeRef.current) + 
                        R_coef * Math.sin(k * dRef * 5.0 + omega * timeRef.current));
              } else {
                const dIncEnd = boundaryX - srcNormX;
                const dTrans = normX - boundaryX;
                const k2 = k * params.impedanceRatio;
                pVal = 30.0 * params.amplitude * T_coef * Math.sin(k * dIncEnd * 5.0 + k2 * dTrans * 5.0 - omega * timeRef.current);
              }
            } else {
              const d = Math.max(0, normX - srcNormX);
              pVal = 40.0 * params.amplitude * Math.exp(-alpha * d * 5.0) * Math.sin(k * d * 5.0 - omega * timeRef.current);
            }
          }
          if (col === 0) ctx.moveTo(col, startY - pVal);
          else ctx.lineTo(col, startY - pVal);
        }
        ctx.stroke();

        // Draw centerline equilibrium axis
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        ctx.lineTo(W, startY);
        ctx.stroke();

      } else if (params.regime === "resonance") {
        // RENDER CAVITY AIR COLUMN RESONANCE
        const tubeX = W * 0.2;
        const tubeW = W * 0.6;
        const tubeY = H * 0.25;
        const tubeH = H * 0.35;

        // Draw physical glass air tube
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Top line
        ctx.moveTo(tubeX, tubeY);
        ctx.lineTo(tubeX + tubeW, tubeY);
        // Bottom line
        ctx.moveTo(tubeX, tubeY + tubeH);
        ctx.lineTo(tubeX + tubeW, tubeY + tubeH);
        
        if (params.pipeType === "open-closed") {
          // Closed end (Neumann) wall right side
          ctx.lineTo(tubeX + tubeW, tubeY);
        }
        ctx.stroke();

        // Label Boundaries
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "10px monospace";
        ctx.fillText("OPEN END", tubeX - 60, tubeY + tubeH / 2);
        if (params.pipeType === "open-closed") {
          ctx.fillText("CLOSED WALL", tubeX + tubeW + 10, tubeY + tubeH / 2);
        } else {
          ctx.fillText("OPEN END", tubeX + tubeW + 10, tubeY + tubeH / 2);
        }

        // Draw standing wave air particles inside tube
        ctx.fillStyle = "rgba(6, 182, 212, 0.6)";
        const partRows = 12;
        const partCols = 45;
        const L_pipe = params.pipeLength;
        const n_har = params.harmonic;

        for (let row = 0; row < partRows; row++) {
          const yEquil = tubeY + 8 + (row / (partRows - 1)) * (tubeH - 16);
          for (let col = 0; col < partCols; col++) {
            const normX = col / partCols;
            const xEquil = tubeX + normX * tubeW;
            const xPipe = normX * L_pipe;

            // Compute displacement xi
            let disp = 0;
            if (params.pipeType === "open-open") {
              const k_n = (n_har * Math.PI) / L_pipe;
              const omega_n = k_n * c;
              // displacement s(x,t) = s0 * cos(kx) * sin(omega*t)
              disp = 20.0 * params.amplitude * Math.cos(k_n * xPipe) * Math.sin(omega_n * timeRef.current);
            } else {
              const k_n = (n_har * Math.PI) / (2.0 * L_pipe);
              const omega_n = k_n * c;
              disp = 20.0 * params.amplitude * Math.sin(k_n * xPipe) * Math.sin(omega_n * timeRef.current);
            }

            ctx.beginPath();
            ctx.arc(xEquil + disp, yEquil, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        // Overlay pressure and displacement envelopes
        // Pressure envelope: neon cyan (solid)
        // Displacement envelope: neon purple (dashed)
        ctx.lineWidth = 2.5;

        // Pressure curve
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.beginPath();
        for (let col = 0; col <= tubeW; col++) {
          const normX = col / tubeW;
          const xPipe = normX * L_pipe;
          let pVal = 0;

          if (params.pipeType === "open-open") {
            const k_n = (n_har * Math.PI) / L_pipe;
            pVal = Math.sin(k_n * xPipe);
          } else {
            const k_n = (n_har * Math.PI) / (2.0 * L_pipe);
            pVal = Math.cos(k_n * xPipe);
          }

          // Scale and modulate over time
          const drawY = (tubeY + tubeH / 2) - pVal * (tubeH / 2.5) * Math.cos(omega * timeRef.current);
          if (col === 0) ctx.moveTo(tubeX + col, drawY);
          else ctx.lineTo(tubeX + col, drawY);
        }
        ctx.stroke();

        // Displacement curve (dashed)
        ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let col = 0; col <= tubeW; col++) {
          const normX = col / tubeW;
          const xPipe = normX * L_pipe;
          let dispVal = 0;

          if (params.pipeType === "open-open") {
            const k_n = (n_har * Math.PI) / L_pipe;
            dispVal = Math.cos(k_n * xPipe);
          } else {
            const k_n = (n_har * Math.PI) / (2.0 * L_pipe);
            dispVal = Math.sin(k_n * xPipe);
          }

          const drawY = (tubeY + tubeH / 2) - dispVal * (tubeH / 2.5) * Math.sin(omega * timeRef.current);
          if (col === 0) ctx.moveTo(tubeX + col, drawY);
          else ctx.lineTo(tubeX + col, drawY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

      } else if (params.regime === "doppler") {
        // RENDER 2D DOPPLER WAVEFRONTS & MACH CONE
        const vs = params.sourceSpeed;
        const timeVal = timeRef.current;

        // Emit new wave circles periodically
        if (params.isPlaying && Math.random() < 0.25) {
          // Source moves left-to-right starting at W * 0.1
          const srcX = W * 0.15 + (vs / 4.0) * timeVal * 150.0;
          if (srcX < W * 0.95) {
            dopplerWavesRef.current.push({
              x: srcX,
              y: H * 0.45,
              radius: 0,
              time: timeVal,
              amp: params.amplitude
            });
          }
        }

        // Draw and update emitted wavefront circles
        ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
        ctx.lineWidth = 1.5;

        dopplerWavesRef.current.forEach((wave) => {
          // Radius expands at speed of sound c
          wave.radius = (timeVal - wave.time) * c * 0.65;
          
          if (wave.radius < W * 1.5) {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
        });

        // Current moving source position
        const currentSrcX = W * 0.15 + (vs / 4.0) * timeVal * 150.0;
        const srcXClamped = Math.min(W * 0.92, currentSrcX);

        // Render V-shaped Mach Cone shockwave boundaries if supersonic (vs > c)
        if (vs > c) {
          const machAngle = Math.asin(c / vs);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          
          // Top Mach line
          ctx.moveTo(srcXClamped, H * 0.45);
          ctx.lineTo(srcXClamped - Math.cos(machAngle) * 500.0, H * 0.45 - Math.sin(machAngle) * 500.0);
          
          // Bottom Mach line
          ctx.moveTo(srcXClamped, H * 0.45);
          ctx.lineTo(srcXClamped - Math.cos(machAngle) * 500.0, H * 0.45 + Math.sin(machAngle) * 500.0);
          ctx.stroke();
          
          ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
          ctx.fill();
        }

        // Draw Doppler Speaker Icon (Source)
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(srcXClamped, H * 0.45, 9, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(srcXClamped, H * 0.45, 13, 0, 2 * Math.PI);
        ctx.stroke();

        // Reset Doppler source position when it runs off screen
        if (currentSrcX > W * 0.95) {
          timeRef.current = 0;
          dopplerWavesRef.current = [];
        }

      } else if (params.regime === "interference") {
        // RENDER 2D INTERFERENCE FIELD MAP
        const s1X = W * 0.35;
        const s1Y = H * 0.3;
        const s2X = W * 0.35;
        const s2Y = H * 0.6;

        if (params.sourcesCount === 2) {
          // Color map rendering using canvas pixel loops (sampled grid to keep high fps)
          const stepSize = 5;
          for (let y = 10; y < H * 0.75; y += stepSize) {
            for (let x = 10; x < W * 0.9; x += stepSize) {
              const r1 = Math.hypot(x - s1X, y - s1Y) * 0.05;
              const r2 = Math.hypot(x - s2X, y - s2Y) * 0.05;
              
              // Superposed fields
              const p1 = Math.sin(k * r1 - omega * timeRef.current) / Math.max(0.5, r1 * 0.2);
              const p2 = Math.sin(k * r2 - omega * timeRef.current + params.phaseDiff) / Math.max(0.5, r2 * 0.2);
              const val = (p1 + p2) * 0.35;

              const cVal = Math.max(-1, Math.min(1, val));
              if (cVal > 0) {
                ctx.fillStyle = `rgba(139, 92, 246, ${cVal * 0.35})`; // Purple constructive
              } else {
                ctx.fillStyle = `rgba(6, 182, 212, ${Math.abs(cVal) * 0.35})`; // Cyan destructive
              }
              ctx.fillRect(x, y, stepSize, stepSize);
            }
          }

          // Draw dual Source Speakers
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(s1X, s1Y, 6, 0, 2*Math.PI); ctx.fill();
          ctx.beginPath(); ctx.arc(s2X, s2Y, 6, 0, 2*Math.PI); ctx.fill();
        } else {
          // 1 Source with beats: Draw moving particles displaying amplitude modulations
          ctx.fillStyle = "rgba(139, 92, 246, 0.7)";
          const particleCols = 60;
          for (let i = 0; i < particleCols; i++) {
            const normX = i / particleCols;
            const xVal = W * (0.15 + 0.7 * normX);
            const w2 = 2.0 * Math.PI * (params.frequency + params.beatFreq);
            
            // Envelope superposition math
            const displacement = 35.0 * params.amplitude * (
              Math.sin(omega * timeRef.current - k * normX * 8) + 
              Math.sin(w2 * timeRef.current - k * normX * 8)
            ) / 2.0;

            for (let j = 0; j < 8; j++) {
              ctx.beginPath();
              ctx.arc(xVal + displacement, H * 0.25 + j * 20, 2.5, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }

      } else if (params.regime === "room") {
        // RENDER ROOM ACOUSTICS BOUNDARIES & RAYS
        const boxX = W * 0.1;
        const boxY = H * 0.15;
        const boxW = W * 0.8;
        const boxH = H * 0.55;

        // Draw Room Box
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Render moving sound rays inside room
        raysRef.current.forEach((ray) => {
          if (!ray.active) return;
          const pixelX = boxX + ray.x * boxW;
          const pixelY = boxY + ray.y * boxH;

          // Draw ray tail/path
          ctx.fillStyle = `rgba(249, 115, 22, ${ray.energy / params.amplitude})`;
          ctx.beginPath();
          ctx.arc(pixelX, pixelY, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // ─── 3. INTERACTIVE LAB METERS / HUD INDICATORS ────────────────────────
      
      // Draw Probe Microphone (Observer)
      const prX = probePos.x * W;
      const prY = probePos.y * H;
      
      ctx.fillStyle = "#10b981"; // neon green
      ctx.beginPath();
      ctx.arc(prX, prY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(prX, prY, 12, 0, 2 * Math.PI);
      ctx.stroke();

      // Probe label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("PROBE MIC", prX - 25, prY - 18);

      // Draw Speaker source handles (when not Doppler or standing waves)
      if (params.regime !== "doppler" && params.regime !== "resonance") {
        const spX = speakerPos.x * W;
        const spY = speakerPos.y * H;

        ctx.fillStyle = "#ec4899"; // Pink
        ctx.beginPath();
        ctx.arc(spX, spY, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(spX, spY, 12, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        ctx.fillText("SOURCE SPEAKER", spX - 35, spY - 18);
      }

      // ─── 4. BOTTOM TELEMETRY PLOTS & SPECTRUMS ──────────────────────────────
      const graphY = H * 0.76;
      const graphH = H * 0.2;
      const graphW1 = W * 0.44;
      const graphW2 = W * 0.44;

      // Draw Time Waveform Box (Left graph)
      ctx.fillStyle = "#141416";
      ctx.fillRect(W * 0.04, graphY, graphW1, graphH);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.strokeRect(W * 0.04, graphY, graphW1, graphH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "9px monospace";
      ctx.fillText("PROBE OSCILLOSCOPE SIGNAL (p vs. t)", W * 0.05, graphY + 12);

      // Plot signal trace
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      const histLen = signalHistoryRef.current.length;
      for (let i = 0; i < histLen; i++) {
        const plotX = W * 0.04 + (i / histLen) * graphW1;
        // Scale signal representation
        const plotY = (graphY + graphH / 2.0) - (signalHistoryRef.current[i] / params.amplitude) * (graphH * 0.4);
        if (i === 0) ctx.moveTo(plotX, plotY);
        else ctx.lineTo(plotX, plotY);
      }
      ctx.stroke();

      // Right Graph conditionally renders: Reverb energy decay vs. FFT spectral analysis
      ctx.fillStyle = "#141416";
      ctx.fillRect(W * 0.52, graphY, graphW2, graphH);
      ctx.strokeRect(W * 0.52, graphY, graphW2, graphH);

      if (params.regime === "room") {
        // Plot Room Energy Decay Curve
        ctx.fillStyle = "#ffffff";
        ctx.fillText("REVERBERATION ENERGY DECAY CURVE (Sabine Validation)", W * 0.53, graphY + 12);

        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        const energyLen = roomEnergyHistoryRef.current.length;
        for (let i = 0; i < energyLen; i++) {
          const plotX = W * 0.52 + (i / 300.0) * graphW2;
          const energyNorm = Math.min(1.0, roomEnergyHistoryRef.current[i] / (params.amplitude * 20.0));
          const plotY = (graphY + graphH) - energyNorm * (graphH * 0.85) - 5;
          if (i === 0) ctx.moveTo(plotX, plotY);
          else ctx.lineTo(plotX, plotY);
        }
        ctx.stroke();
      } else {
        // Plot live DFT / FFT Spectrum (Right graph)
        ctx.fillStyle = "#ffffff";
        ctx.fillText("FOURIER ACOUSTICAL SPECTRUM (Amplitude vs. Frequency)", W * 0.53, graphY + 12);

        const spectrum = computeDFT(signalHistoryRef.current);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.8;
        
        const binWidth = graphW2 / (spectrum.length * 0.8);
        for (let i = 0; i < spectrum.length * 0.8; i++) {
          const plotX = W * 0.52 + i * binWidth;
          const ampVal = Math.min(1.0, spectrum[i] * 18.0 / params.amplitude);
          const barH = ampVal * (graphH * 0.7);
          
          ctx.beginPath();
          ctx.moveTo(plotX, graphY + graphH - 4);
          ctx.lineTo(plotX, graphY + graphH - 4 - barH);
          ctx.stroke();
        }
      }

      // Request next frame
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [params, probePos, speakerPos, observerPos]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full cursor-crosshair select-none block"
    />
  );
};

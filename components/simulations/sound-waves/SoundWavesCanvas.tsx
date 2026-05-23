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
  const signalHistoryRef = useRef<number[]>(new Array(512).fill(0));
  
  // 1D FDTD PDE Grid states (N = 200 grid points)
  const N = 200;
  const pRef = useRef<Float64Array>(new Float64Array(N));
  const pPrevRef = useRef<Float64Array>(new Float64Array(N));
  const xiRef = useRef<Float64Array>(new Float64Array(N)); // displacement
  const vRef = useRef<Float64Array>(new Float64Array(N));  // particle velocity
  const dx = 0.02; // meters per grid node (total domain = 4.0m)

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

  // Compute Discrete Fourier Transform with Hanning window at the probe microphone
  const computeDFT = (history: number[]): { spectrum: number[]; freqs: number[]; sampleRate: number } => {
    const len = history.length;
    const spectrum = new Array(len / 2).fill(0);
    const freqs = new Array(len / 2).fill(0);
    
    // Effective sample rate: approximately 60 fps * slowMotion factor
    const effectiveSampleRate = 60.0 * Math.max(0.01, params.slowMotion);
    // Each bin represents effectiveSampleRate / len Hz
    const binWidth = effectiveSampleRate / len;
    
    // Apply Hanning window and compute DFT
    for (let k = 0; k < len / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < len; n++) {
        // Hanning window: w(n) = 0.5 * (1 - cos(2*pi*n / (N-1)))
        const window = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * n) / (len - 1)));
        const windowed = history[n] * window;
        const angle = (2 * Math.PI * k * n) / len;
        real += windowed * Math.cos(angle);
        imag -= windowed * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag) / len;
      freqs[k] = k * binWidth;
    }
    return { spectrum, freqs, sampleRate: effectiveSampleRate };
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

      const simDt = params.isPlaying ? dt_frame * params.slowMotion : 0;
      timeRef.current += simDt;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const W = canvas.width;
      const H = canvas.height;

      // ─── 1. CORE PHYSICS CALCULATIONS ──────────────────────────────────────
      // Derive speed of sound from thermodynamic state: c = sqrt(B / rho)
      const B = params.bulkModulus;
      const rho = params.density;
      const c = rho > 0 ? Math.sqrt(B / rho) : params.speedOfSound;
      const omega = 2.0 * Math.PI * params.frequency;
      const k = c > 0 ? omega / c : 0;
      const wavelength = c > 0 ? c / params.frequency : 0;
      const impedance = rho * c;

      // Timestep calculation satisfying Courant CFL condition (C <= 1.0)
      const cMax = Math.max(c, 1500.0);
      const fdtdDt = 0.95 * dx / cMax;
      const cflNumber = c * fdtdDt / dx;

      let probeVal = 0;
      let energyDensityAvg = 0;
      let peakPressure = 0;

      if (params.regime === "propagation" && params.solverType === "fdtd" && params.isPlaying) {
        // ─── FDTD NUMERICAL PDE ENGINE ─────────────────────────────────────
        const p = pRef.current;
        const pPrev = pPrevRef.current;
        const pNext = new Float64Array(N);

        // PML absorbing boundary layer
        const pmlWidth = 25;
        const sigmaMax = 25.0 * params.damping;

        for (let i = 0; i < N; i++) {
          let sigma = 0;
          if (i < pmlWidth) {
            const d = (pmlWidth - i) / pmlWidth;
            sigma = sigmaMax * d * d;
          } else if (i > N - 1 - pmlWidth) {
            const d = (i - (N - 1 - pmlWidth)) / pmlWidth;
            sigma = sigmaMax * d * d;
          }

          // Nonlinear pressure-dependent speed of sound
          let localC = c;
          if (params.nonlinearBeta > 0 && B > 0) {
            localC = c * (1.0 + params.nonlinearBeta * (p[i] / B));
          }

          const C2 = (localC * fdtdDt / dx) * (localC * fdtdDt / dx);
          
          // Discretized wave equation: p_i^(n+1)
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

        // Boundary Conditions
        if (params.boundaryL === "reflective") {
          pNext[0] = pNext[1]; // Neumann (rigid wall)
        } else {
          // Mur's first-order absorbing boundary
          pNext[0] = p[1] + ((c * fdtdDt - dx) / (c * fdtdDt + dx)) * (pNext[1] - p[0]);
        }

        if (params.boundaryR === "reflective") {
          pNext[N - 1] = pNext[N - 2];
        } else {
          pNext[N - 1] = p[N - 2] + ((c * fdtdDt - dx) / (c * fdtdDt + dx)) * (pNext[N - 2] - p[N - 1]);
        }

        // Drive acoustic source
        const srcNode = Math.floor(speakerPos.x * N);
        if (srcNode >= 0 && srcNode < N) {
          pNext[srcNode] += params.amplitude * Math.sin(omega * timeRef.current);
        }

        // Shift arrays
        pPrevRef.current.set(p);
        pRef.current.set(pNext);

        // Compute particle velocity from pressure gradient: v = -1/(rho) * integral(dp/dx) dt
        // Using staggered grid: v[i] at half-grid points between p[i-1] and p[i]
        for (let i = 1; i < N - 1; i++) {
          vRef.current[i] = vRef.current[i] - (fdtdDt / (rho * dx)) * (pNext[i] - pNext[i - 1]);
          xiRef.current[i] = xiRef.current[i] + vRef.current[i] * fdtdDt;
        }

        // Probe value
        const probeNode = Math.floor(probePos.x * N);
        probeVal = pNext[Math.max(0, Math.min(N - 1, probeNode))];

        // Energy density: u = p^2/(2B) + rho*v^2/2
        let totalU = 0;
        let maxP = 0;
        for (let i = 0; i < N; i++) {
          const pot = B > 0 ? (pNext[i] * pNext[i]) / (2.0 * B) : 0;
          const kin = 0.5 * rho * vRef.current[i] * vRef.current[i];
          totalU += (pot + kin);
          if (Math.abs(pNext[i]) > maxP) maxP = Math.abs(pNext[i]);
        }
        energyDensityAvg = totalU / N;
        peakPressure = maxP;

      } else {
        // ─── ANALYTICAL SIMULATION REGIMES ─────────────────────────────────
        const t = timeRef.current;
        const px = probePos.x;

        if (params.regime === "propagation") {
          const srcX = speakerPos.x;
          const alpha = params.damping * 0.05;
          const dist = Math.max(0, px - srcX);
          probeVal = params.amplitude * Math.exp(-alpha * dist) * Math.sin(k * dist - omega * t);
          energyDensityAvg = B > 0 ? (params.amplitude * params.amplitude) / (2.0 * B) : 0;
          peakPressure = params.amplitude;

        } else if (params.regime === "resonance") {
          const tubeStart = 0.2;
          const tubeEnd = tubeStart + (params.pipeLength / 4.0);
          const relativeX = (px - tubeStart) / (tubeEnd - tubeStart);
          const xPipe = Math.max(0.0, Math.min(params.pipeLength, relativeX * params.pipeLength));
          const L = params.pipeLength;
          const n_har = params.harmonic;
          
          if (params.pipeType === "open-open") {
            // Open-Open: pressure p(x,t) = p0 * sin(n*pi*x/L) * cos(omega_n*t)
            // Pressure nodes at x=0 and x=L (boundaries)
            // Displacement xi(x,t) = xi0 * cos(n*pi*x/L) * sin(omega_n*t)
            // Displacement antinodes at x=0 and x=L
            const k_n = (n_har * Math.PI) / L;
            const omega_n = k_n * c;
            probeVal = params.amplitude * Math.sin(k_n * xPipe) * Math.cos(omega_n * t);
          } else {
            // Open-Closed: pressure node at open end (x=0), antinode at closed end (x=L)
            // p(x,t) = p0 * cos(n*pi*x/(2L)) * cos(omega_n*t)  — but with sin for correct node at x=0
            // Actually for open-closed: p(x,t) = p0 * sin((2m-1)*pi*x/(2L)) where n = 2m-1
            // Displacement: xi(x,t) = xi0 * cos(n*pi*x/(2L)) * sin(omega_n*t)
            // At x=0 (open): pressure = sin(0) = 0 (node) ✓
            // At x=L (closed): pressure = sin(n*pi/2) = ±1 (antinode for n=1,3,5...) ✓
            const k_n = (n_har * Math.PI) / (2.0 * L);
            const omega_n = k_n * c;
            probeVal = params.amplitude * Math.sin(k_n * xPipe) * Math.cos(omega_n * t);
          }
          energyDensityAvg = B > 0 ? (params.amplitude * params.amplitude) / (2.0 * B) * 0.5 : 0;
          peakPressure = params.amplitude;

        } else if (params.regime === "doppler") {
          const vs = params.sourceSpeed;
          const vo = params.observerSpeed;
          
          let f_prime = params.frequency;
          if (c > vs) {
            // f' = f * (c + vo) / (c - vs) — observer moving towards source
            f_prime = params.frequency * ((c + vo) / (c - vs));
          } else {
            f_prime = params.frequency * (c / (Math.abs(vs - c) + 0.1));
          }
          
          probeVal = params.amplitude * Math.sin(2.0 * Math.PI * f_prime * t);
          energyDensityAvg = B > 0 ? (params.amplitude * params.amplitude) / (2.0 * B) : 0;
          peakPressure = params.amplitude;

        } else if (params.regime === "interference") {
          const s1X = W * 0.3;
          const s1Y = H * 0.3;
          const s2X = W * 0.3;
          const s2Y = H * 0.7;
          
          const pPixelX = px * W;
          const pPixelY = probePos.y * H;

          const r1 = Math.hypot(pPixelX - s1X, pPixelY - s1Y) / 100.0;
          const r2 = Math.hypot(pPixelX - s2X, pPixelY - s2Y) / 100.0;

          if (params.sourcesCount === 1) {
            const w2 = 2.0 * Math.PI * (params.frequency + params.beatFreq);
            probeVal = (params.amplitude / 2.0) * (Math.sin(omega * t) + Math.sin(w2 * t));
          } else {
            const p1 = (params.amplitude * Math.sin(k * r1 - omega * t)) / Math.max(0.5, r1);
            const p2 = (params.amplitude * Math.sin(k * r2 - omega * t + params.phaseDiff)) / Math.max(0.5, r2);
            probeVal = p1 + p2;
          }
          energyDensityAvg = B > 0 ? (params.amplitude * params.amplitude) / (2.0 * B) : 0;
          peakPressure = params.amplitude;

        } else if (params.regime === "room") {
          if (params.isPlaying) {
            const numRays = 70;
            const now = timestamp;

            if (now - lastRayEmitRef.current > 400.0) {
              lastRayEmitRef.current = now;
              for (let i = 0; i < numRays; i++) {
                const angle = Math.random() * 2 * Math.PI;
                raysRef.current.push({
                  x: speakerPos.x,
                  y: speakerPos.y,
                  vx: (c / 300.0) * Math.cos(angle),
                  vy: (c / 300.0) * Math.sin(angle),
                  energy: params.amplitude,
                  active: true
                });
              }
            }

            const alpha = params.absorptionCoeff;
            let activeEnergySum = 0;

            raysRef.current.forEach((ray) => {
              if (!ray.active) return;
              ray.x += ray.vx * params.slowMotion;
              ray.y += ray.vy * params.slowMotion;

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
                ray.energy *= (1.0 - alpha);
                if (ray.energy < 0.01) ray.active = false;
              }

              activeEnergySum += ray.energy;
            });

            roomEnergyHistoryRef.current.push(activeEnergySum);
            if (roomEnergyHistoryRef.current.length > 300) {
              roomEnergyHistoryRef.current.shift();
            }

            let localRaysEnergy = 0;
            raysRef.current.forEach(ray => {
              if (ray.active && Math.hypot(ray.x - probePos.x, ray.y - probePos.y) < 0.06) {
                localRaysEnergy += ray.energy;
              }
            });
            probeVal = localRaysEnergy * Math.sin(omega * t);
            energyDensityAvg = activeEnergySum * 0.001;
            peakPressure = localRaysEnergy;
          }

        } else if (params.regime === "impedance") {
          const boundaryX = 0.55;
          const srcX = speakerPos.x;
          
          const Z1 = impedance;
          const Z2 = params.impedanceRatio * Z1;
          
          // Reflection coefficient (pressure): R = (Z2 - Z1) / (Z2 + Z1)
          const R_coef = (Z2 - Z1) / (Z2 + Z1);
          // Transmission coefficient (pressure): T = 2*Z2 / (Z2 + Z1)
          // Note: For pressure, T = 1 + R
          const T_coef = (2 * Z2) / (Z2 + Z1);

          if (px < boundaryX) {
            const distInc = Math.max(0, px - srcX);
            const distRef = Math.max(0, 2.0 * boundaryX - px - srcX);
            const wInc = params.amplitude * Math.sin(k * distInc - omega * t);
            const wRef = params.amplitude * R_coef * Math.sin(k * distRef + omega * t);
            probeVal = wInc + wRef;
          } else {
            const distIncEnd = boundaryX - srcX;
            const distTrans = px - boundaryX;
            // Speed of sound in medium 2: c2 adjusts based on impedance
            const c2 = c * Math.sqrt(params.impedanceRatio);
            const k2 = omega / c2;
            probeVal = params.amplitude * T_coef * Math.sin(k * distIncEnd + k2 * distTrans - omega * t);
          }
          energyDensityAvg = B > 0 ? (params.amplitude * params.amplitude) / (2.0 * B) : 0;
          peakPressure = params.amplitude;
        }
      }

      // Track probe signal history
      if (params.isPlaying) {
        signalHistoryRef.current.push(probeVal);
        if (signalHistoryRef.current.length > 512) {
          signalHistoryRef.current.shift();
        }
      }

      // ─── COMPUTE RMS AND dB SPL ────────────────────────────────────────────
      // dB SPL = 20 * log10(p_rms / p_ref), where p_ref = 20 uPa = 2e-5 Pa
      let rmsSum = 0;
      signalHistoryRef.current.forEach((val) => { rmsSum += val * val; });
      const rms = Math.sqrt(rmsSum / signalHistoryRef.current.length);
      
      const p_ref = 2e-5; // 20 micropascals — threshold of hearing
      const soundLevelDbSPL = rms > 0 ? 20.0 * Math.log10(rms / p_ref) : 0;
      
      // Acoustic intensity: I = p_rms^2 / (rho * c) 
      const intensity = impedance > 0 ? (rms * rms) / impedance : 0;

      // Sabine Reverberation Time: T60 = 0.161 * V / A
      const roomV = params.roomWidth * params.roomHeight * 3.0; // assume 3m ceiling
      const totalSurfaceArea = 2.0 * (params.roomWidth * params.roomHeight + 
                                       params.roomWidth * 3.0 + 
                                       params.roomHeight * 3.0);
      const sabineA = totalSurfaceArea * params.absorptionCoeff;
      const reverbTime = sabineA > 0 ? 0.161 * roomV / sabineA : 0;

      // Doppler shifted frequency
      let dopplerFreq = params.frequency;
      if (params.regime === "doppler" && c > params.sourceSpeed) {
        dopplerFreq = params.frequency * ((c + params.observerSpeed) / (c - params.sourceSpeed));
      }

      // Push telemetry
      onStateUpdate({
        pressureAmp: rms * Math.SQRT2,
        wavelength: wavelength,
        wavenumber: k,
        angularFreq: omega,
        impedance: impedance,
        soundIntensity: intensity,
        soundLevelDb: Math.max(0, soundLevelDbSPL),
        cflNumber: cflNumber,
        timestep: fdtdDt,
        reverbTime: reverbTime,
        dopplerShiftedFreq: dopplerFreq,
        energyDensity: energyDensityAvg,
        nonlinearDistortion: params.nonlinearBeta * 0.12,
      });

      // ─── 2. RENDERING ──────────────────────────────────────────────────────
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, W, H);

      // Background grid
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

      // ─── REGIME-SPECIFIC RENDERING ──────────────────────────────────────────
      if (params.regime === "propagation" || params.regime === "impedance") {
        const startY = H * 0.45;

        // ─── COMPRESSION / RAREFACTION DENSITY BANDS ──────────────────────────
        if (params.visMode === "pressure" || params.visMode === "density") {
          for (let col = 0; col < W; col++) {
            let pVal = 0;
            const normX = col / W;

            if (params.solverType === "fdtd" && params.regime === "propagation") {
              const nodeIdx = Math.floor(normX * N);
              pVal = pRef.current[Math.max(0, Math.min(N - 1, nodeIdx))] / Math.max(0.01, params.amplitude);
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
                  pVal = (Math.sin(k * dInc * 5.0 - omega * timeRef.current) + 
                          R_coef * Math.sin(k * dRef * 5.0 + omega * timeRef.current));
                } else {
                  const dIncEnd = boundaryX - srcNormX;
                  const dTrans = normX - boundaryX;
                  const c2 = c * Math.sqrt(params.impedanceRatio);
                  const k2 = omega / c2;
                  pVal = T_coef * Math.sin(k * dIncEnd * 5.0 + k2 * dTrans * 5.0 - omega * timeRef.current);
                }
              } else {
                const d = Math.max(0, normX - srcNormX);
                pVal = Math.exp(-alpha * d * 5.0) * Math.sin(k * d * 5.0 - omega * timeRef.current);
              }
            }

            // Map pressure to density color:
            // Compression (positive p) -> warm red (high density)
            // Rarefaction (negative p) -> cool cyan (low density)
            const colorScale = Math.max(-1, Math.min(1, pVal));
            if (params.visMode === "density") {
              // Density variation: Δρ/ρ₀ = p/(ρ₀c²) = p/B
              if (colorScale > 0) {
                ctx.fillStyle = `rgba(239, 68, 68, ${colorScale * 0.5})`;
              } else {
                ctx.fillStyle = `rgba(6, 182, 212, ${Math.abs(colorScale) * 0.5})`;
              }
            } else {
              if (colorScale > 0) {
                ctx.fillStyle = `rgba(239, 68, 68, ${colorScale * 0.45})`;
              } else {
                ctx.fillStyle = `rgba(6, 182, 212, ${Math.abs(colorScale) * 0.45})`;
              }
            }
            ctx.fillRect(col, H * 0.15, 1, H * 0.6);
          }

          // Field label for pressure/density bands
          ctx.fillStyle = params.visMode === "density" ? "rgba(6, 182, 212, 0.7)" : "rgba(239, 68, 68, 0.7)";
          ctx.font = "bold 10px monospace";
          const fieldLabel = params.visMode === "density" 
            ? "DENSITY FIELD:  Red = Compression (+\u0394\u03C1)  |  Cyan = Rarefaction (-\u0394\u03C1)"
            : "PRESSURE FIELD:  Red = Overpressure (+p)  |  Cyan = Underpressure (-p)";
          ctx.fillText(fieldLabel, W * 0.05, H * 0.13);
        }

        // ─── IMPEDANCE BOUNDARY RENDERING ──────────────────────────────────────
        if (params.regime === "impedance") {
          ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
          ctx.setLineDash([6, 4]);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(W * 0.55, H * 0.1);
          ctx.lineTo(W * 0.55, H * 0.72);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Show R and T coefficient values
          const Z1 = impedance;
          const Z2 = params.impedanceRatio * Z1;
          const R_val = (Z2 - Z1) / (Z2 + Z1);
          const T_val = (2 * Z2) / (Z2 + Z1);
          
          ctx.fillStyle = "rgba(6, 182, 212, 0.85)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(`Medium 1 (Z\u2081 = ${impedance.toFixed(0)} Rayls)`, W * 0.08, H * 0.12);
          ctx.fillText(`Medium 2 (Z\u2082 = ${(params.impedanceRatio * impedance).toFixed(0)} Rayls)`, W * 0.6, H * 0.12);
          
          // Reflection and Transmission coefficients
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
          ctx.fillText(`R = ${R_val >= 0 ? "+" : ""}${R_val.toFixed(3)}`, W * 0.42, H * 0.12);
          ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
          ctx.fillText(`T = ${T_val.toFixed(3)}`, W * 0.42, H * 0.15);
          
          // Energy conservation check: R^2 + (Z1/Z2)*T^2 should = 1
          const energyCheck = R_val * R_val + (Z1 / Z2) * T_val * T_val;
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "9px monospace";
          ctx.fillText(`Energy check: R\u00B2 + (Z\u2081/Z\u2082)\u00B7T\u00B2 = ${energyCheck.toFixed(4)}`, W * 0.38, H * 0.18);
        }

        // ─── LONGITUDINAL PARTICLE GRID ────────────────────────────────────────
        if (params.visMode === "particles") {
          const particleRows = 14;
          const particleCols = 80;
          const gridStartY = H * 0.18;
          const gridHeight = H * 0.45;

          for (let row = 0; row < particleRows; row++) {
            const yEquil = gridStartY + (row / (particleRows - 1)) * gridHeight;
            for (let col = 0; col < particleCols; col++) {
              const normX = col / particleCols;
              const xEquil = W * (0.05 + 0.9 * normX);

              let displacement = 0;
              let localPressure = 0;
              if (params.solverType === "fdtd" && params.regime === "propagation") {
                const nodeIdx = Math.floor(normX * N);
                displacement = xiRef.current[Math.max(0, Math.min(N - 1, nodeIdx))] * 3000.0;
                localPressure = pRef.current[Math.max(0, Math.min(N - 1, nodeIdx))];
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
                    // Displacement is spatial derivative of pressure (90-degree phase shift)
                    displacement = 20.0 * params.amplitude * (
                      Math.cos(k * dInc * 5.0 - omega * timeRef.current) - 
                      R_coef * Math.cos(k * dRef * 5.0 + omega * timeRef.current)
                    );
                    localPressure = params.amplitude * (
                      Math.sin(k * dInc * 5.0 - omega * timeRef.current) + 
                      R_coef * Math.sin(k * dRef * 5.0 + omega * timeRef.current)
                    );
                  } else {
                    const dIncEnd = boundaryX - srcNormX;
                    const dTrans = normX - boundaryX;
                    const c2 = c * Math.sqrt(params.impedanceRatio);
                    const k2 = omega / c2;
                    displacement = 20.0 * params.amplitude * T_coef * Math.cos(
                      k * dIncEnd * 5.0 + k2 * dTrans * 5.0 - omega * timeRef.current
                    );
                    localPressure = params.amplitude * T_coef * Math.sin(
                      k * dIncEnd * 5.0 + k2 * dTrans * 5.0 - omega * timeRef.current
                    );
                  }
                } else {
                  const d = Math.max(0, normX - srcNormX);
                  // Displacement xi is proportional to cos(kx - wt) when p ~ sin(kx - wt)
                  // This correctly shows the 90-degree phase relationship
                  displacement = 25.0 * params.amplitude * Math.exp(-alpha * d * 5.0) * Math.cos(k * d * 5.0 - omega * timeRef.current);
                  localPressure = params.amplitude * Math.exp(-alpha * d * 5.0) * Math.sin(k * d * 5.0 - omega * timeRef.current);
                }
              }

              // Particle horizontal displacement (longitudinal motion)
              const drawX = xEquil + displacement * 3.0;
              
              // Color particles by local pressure: white at equilibrium, bright at extremes
              const pNorm = Math.max(-1, Math.min(1, localPressure / Math.max(0.01, params.amplitude)));
              let r = 200, g = 200, b = 200;
              if (pNorm > 0) {
                // Compression: orange-red tint
                r = 200 + Math.floor(55 * pNorm);
                g = 200 - Math.floor(120 * pNorm);
                b = 200 - Math.floor(150 * pNorm);
              } else {
                // Rarefaction: cyan-blue tint
                r = 200 + Math.floor(180 * pNorm);
                g = 200 + Math.floor(20 * Math.abs(pNorm));
                b = 200 + Math.floor(55 * Math.abs(pNorm));
              }
              
              ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
              ctx.beginPath();
              ctx.arc(drawX, yEquil, 2.0, 0, 2 * Math.PI);
              ctx.fill();
            }
          }

          // Field label for particle mode
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = "bold 10px monospace";
          ctx.fillText("LONGITUDINAL PARTICLE OSCILLATION  \u2014  Horizontal displacement \u03BE(x,t) parallel to propagation", W * 0.05, H * 0.15);
        }

        // ─── VELOCITY VECTOR ARROWS ────────────────────────────────────────────
        if (params.visMode === "velocity" || params.visMode === "energy") {
          const isEnergy = params.visMode === "energy";
          ctx.lineWidth = 1.8;
          const arrowsCount = 30;
          const arrowRows = 3;
          
          for (let row = 0; row < arrowRows; row++) {
            const arrowBaseY = H * (0.25 + row * 0.15);
            for (let i = 0; i < arrowsCount; i++) {
              const normX = i / arrowsCount;
              const arrowX = W * (0.08 + 0.84 * normX);

              let velVal = 0;
              let pressVal = 0;
              
              if (params.solverType === "fdtd" && params.regime === "propagation") {
                const nodeIdx = Math.floor(normX * N);
                velVal = vRef.current[nodeIdx] * 400.0;
                pressVal = pRef.current[nodeIdx];
              } else {
                const srcNormX = speakerPos.x;
                const d = Math.max(0, normX - srcNormX);
                // Velocity: v = p/(rho*c) for progressive wave, same phase as pressure
                velVal = params.amplitude * Math.sin(k * d * 5.0 - omega * timeRef.current) * 12.0;
                pressVal = params.amplitude * Math.sin(k * d * 5.0 - omega * timeRef.current);
              }

              if (isEnergy) {
                // Intensity vector I = p * v (always positive for progressive wave)
                const intensityMag = velVal * pressVal * 0.05;
                ctx.strokeStyle = `rgba(245, 158, 11, ${Math.min(1, Math.abs(intensityMag) * 0.3 + 0.2)})`;
                
                // Draw arrow pointing in propagation direction (rightward for positive I)
                const arrowLen = Math.min(15, Math.abs(intensityMag) * 2);
                const dir = intensityMag >= 0 ? 1 : -1;
                
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowBaseY);
                ctx.lineTo(arrowX + arrowLen * dir, arrowBaseY);
                ctx.stroke();
                
                // Arrow head
                if (Math.abs(arrowLen) > 2) {
                  ctx.fillStyle = ctx.strokeStyle;
                  ctx.beginPath();
                  ctx.moveTo(arrowX + arrowLen * dir, arrowBaseY);
                  ctx.lineTo(arrowX + (arrowLen - 3) * dir, arrowBaseY - 2.5);
                  ctx.lineTo(arrowX + (arrowLen - 3) * dir, arrowBaseY + 2.5);
                  ctx.fill();
                }
              } else {
                // Particle velocity arrows (horizontal)
                ctx.strokeStyle = `rgba(16, 185, 129, ${Math.min(1, Math.abs(velVal) * 0.06 + 0.3)})`;
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowBaseY);
                ctx.lineTo(arrowX + velVal, arrowBaseY);
                ctx.stroke();

                // Arrow head
                ctx.fillStyle = ctx.strokeStyle;
                ctx.beginPath();
                const headSize = 3;
                if (velVal > 2) {
                  ctx.moveTo(arrowX + velVal, arrowBaseY);
                  ctx.lineTo(arrowX + velVal - headSize, arrowBaseY - headSize);
                  ctx.lineTo(arrowX + velVal - headSize, arrowBaseY + headSize);
                } else if (velVal < -2) {
                  ctx.moveTo(arrowX + velVal, arrowBaseY);
                  ctx.lineTo(arrowX + velVal + headSize, arrowBaseY - headSize);
                  ctx.lineTo(arrowX + velVal + headSize, arrowBaseY + headSize);
                }
                ctx.fill();
              }
            }
          }

          // Field labels
          ctx.fillStyle = isEnergy ? "rgba(245, 158, 11, 0.7)" : "rgba(16, 185, 129, 0.7)";
          ctx.font = "bold 10px monospace";
          if (isEnergy) {
            ctx.fillText("ACOUSTIC INTENSITY VECTORS  I(x,t) = p(x,t) \u00B7 v(x,t)  [W/m\u00B2]", W * 0.05, H * 0.15);
          } else {
            ctx.fillText("PARTICLE VELOCITY FIELD  v(x,t) = -1/(\u03C1) \u222B (\u2202p/\u2202x) dt  [m/s]", W * 0.05, H * 0.15);
          }
        }

        // ─── CONTINUOUS WAVE OVERLAY LINE ──────────────────────────────────────
        // Draw pressure waveform as labeled cyan curve
        ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let col = 0; col < W; col++) {
          const normX = col / W;
          let pVal = 0;
          if (params.solverType === "fdtd" && params.regime === "propagation") {
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
                const c2 = c * Math.sqrt(params.impedanceRatio);
                const k2 = omega / c2;
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

        // Pressure curve label
        ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
        ctx.font = "bold 10px monospace";
        ctx.fillText("p(x,t) PRESSURE", W * 0.85, startY - 40);

        // Draw displacement waveform as labeled purple dashed curve
        ctx.strokeStyle = "rgba(168, 85, 247, 0.6)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        for (let col = 0; col < W; col++) {
          const normX = col / W;
          let xiVal = 0;
          if (params.solverType === "fdtd" && params.regime === "propagation") {
            const nodeIdx = Math.max(0, Math.min(N - 1, Math.floor(normX * N)));
            xiVal = xiRef.current[nodeIdx] * 3500.0;
          } else {
            const srcNormX = speakerPos.x;
            const alpha = params.damping * 0.05;
            const d = Math.max(0, normX - srcNormX);
            // Displacement: cos(kx - wt) — 90-degree ahead of pressure sin(kx - wt)
            xiVal = 35.0 * params.amplitude * Math.exp(-alpha * d * 5.0) * Math.cos(k * d * 5.0 - omega * timeRef.current);
          }
          if (col === 0) ctx.moveTo(col, startY - xiVal);
          else ctx.lineTo(col, startY - xiVal);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Displacement curve label
        ctx.fillStyle = "rgba(168, 85, 247, 0.7)";
        ctx.fillText("\u03BE(x,t) DISPLACEMENT", W * 0.85, startY + 50);
        ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
        ctx.font = "9px monospace";
        ctx.fillText("90\u00B0 phase lead vs p(x,t)", W * 0.85, startY + 62);

        // Draw centerline equilibrium
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        ctx.lineTo(W, startY);
        ctx.stroke();

        // ─── FDTD GRID NODE MARKERS ──────────────────────────────────────────
        if (params.solverType === "fdtd" && params.regime === "propagation") {
          ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
          // Show every 10th grid node as a faint tick mark
          for (let i = 0; i < N; i += 10) {
            const nodeX = (i / N) * W;
            ctx.fillRect(nodeX - 0.5, startY - 3, 1, 6);
          }
          
          // PML region shading
          const pmlPixels = (25 / N) * W;
          ctx.fillStyle = "rgba(239, 68, 68, 0.06)";
          ctx.fillRect(0, H * 0.15, pmlPixels, H * 0.6);
          ctx.fillRect(W - pmlPixels, H * 0.15, pmlPixels, H * 0.6);
          
          ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
          ctx.font = "8px monospace";
          ctx.fillText("PML", 5, H * 0.17);
          ctx.fillText("PML", W - 25, H * 0.17);
        }

      } else if (params.regime === "resonance") {
        // ─── AIR COLUMN RESONANCE ──────────────────────────────────────────────
        const tubeX = W * 0.2;
        const tubeW = W * 0.6;
        const tubeY = H * 0.22;
        const tubeH = H * 0.38;

        // Draw physical tube
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tubeX, tubeY);
        ctx.lineTo(tubeX + tubeW, tubeY);
        ctx.moveTo(tubeX, tubeY + tubeH);
        ctx.lineTo(tubeX + tubeW, tubeY + tubeH);
        
        if (params.pipeType === "open-closed") {
          ctx.lineTo(tubeX + tubeW, tubeY);
        }
        ctx.stroke();

        // Boundary labels
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 10px monospace";
        ctx.fillText("OPEN (x=0)", tubeX - 70, tubeY + tubeH / 2);
        ctx.fillText("p = 0 (node)", tubeX - 70, tubeY + tubeH / 2 + 14);
        
        if (params.pipeType === "open-closed") {
          ctx.fillText("CLOSED (x=L)", tubeX + tubeW + 10, tubeY + tubeH / 2);
          ctx.fillText("v = 0 (node)", tubeX + tubeW + 10, tubeY + tubeH / 2 + 14);
          ctx.fillText("p = max (antinode)", tubeX + tubeW + 10, tubeY + tubeH / 2 + 28);
        } else {
          ctx.fillText("OPEN (x=L)", tubeX + tubeW + 10, tubeY + tubeH / 2);
          ctx.fillText("p = 0 (node)", tubeX + tubeW + 10, tubeY + tubeH / 2 + 14);
        }

        // Draw particles inside tube
        ctx.fillStyle = "rgba(6, 182, 212, 0.6)";
        const partRows = 10;
        const partCols = 45;
        const L_pipe = params.pipeLength;
        const n_har = params.harmonic;

        for (let row = 0; row < partRows; row++) {
          const yEquil = tubeY + 10 + (row / (partRows - 1)) * (tubeH - 20);
          for (let col = 0; col < partCols; col++) {
            const normX = col / partCols;
            const xEquil = tubeX + normX * tubeW;
            const xPipe = normX * L_pipe;

            let disp = 0;
            if (params.pipeType === "open-open") {
              // Displacement: xi(x,t) = xi0 * cos(n*pi*x/L) * sin(omega_n*t)
              // Antinodes at x=0 and x=L (cos(0)=1, cos(n*pi)=+-1)
              const k_n = (n_har * Math.PI) / L_pipe;
              const omega_n = k_n * c;
              disp = 20.0 * params.amplitude * Math.cos(k_n * xPipe) * Math.sin(omega_n * timeRef.current);
            } else {
              // Open-closed displacement: xi(x,t) = xi0 * cos(n*pi*x/(2L)) * sin(omega_n*t)
              // Antinode at x=0 (cos(0)=1), node at x=L (cos(n*pi/2)=0 for n=1,3,5...)
              const k_n = (n_har * Math.PI) / (2.0 * L_pipe);
              const omega_n = k_n * c;
              disp = 20.0 * params.amplitude * Math.cos(k_n * xPipe) * Math.sin(omega_n * timeRef.current);
            }

            ctx.beginPath();
            ctx.arc(xEquil + disp, yEquil, 2, 0, 2 * Math.PI);
            ctx.fill();
          }
        }

        // ─── STANDING WAVE ENVELOPES WITH NODE/ANTINODE MARKERS ──────────────
        const tubeMidY = tubeY + tubeH / 2;

        // Pressure curve (cyan solid) — sin(nπx/L) for open-open, sin(nπx/2L) for open-closed
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.lineWidth = 2.5;
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
            pVal = Math.sin(k_n * xPipe);
          }

          const drawY = tubeMidY - pVal * (tubeH / 2.5) * Math.cos(omega * timeRef.current);
          if (col === 0) ctx.moveTo(tubeX + col, drawY);
          else ctx.lineTo(tubeX + col, drawY);
        }
        ctx.stroke();

        // Displacement curve (purple dashed) — cos(nπx/L) for open-open, cos(nπx/2L) for open-closed
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
            dispVal = Math.cos(k_n * xPipe);
          }

          const drawY = tubeMidY - dispVal * (tubeH / 2.5) * Math.sin(omega * timeRef.current);
          if (col === 0) ctx.moveTo(tubeX + col, drawY);
          else ctx.lineTo(tubeX + col, drawY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // ─── NODE / ANTINODE MARKERS ──────────────────────────────────────────
        ctx.font = "bold 9px monospace";
        const numMarkers = 20;
        for (let i = 0; i <= numMarkers; i++) {
          const normX = i / numMarkers;
          const xPipe = normX * L_pipe;
          const xCanvas = tubeX + normX * tubeW;

          let pEnvelope = 0;
          let xiEnvelope = 0;

          if (params.pipeType === "open-open") {
            const k_n = (n_har * Math.PI) / L_pipe;
            pEnvelope = Math.abs(Math.sin(k_n * xPipe));
            xiEnvelope = Math.abs(Math.cos(k_n * xPipe));
          } else {
            const k_n = (n_har * Math.PI) / (2.0 * L_pipe);
            pEnvelope = Math.abs(Math.sin(k_n * xPipe));
            xiEnvelope = Math.abs(Math.cos(k_n * xPipe));
          }

          // Mark pressure nodes (p ~ 0)
          if (pEnvelope < 0.05) {
            ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
            ctx.fillText("N", xCanvas - 3, tubeY - 6);
            // Draw small circle at node
            ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(xCanvas, tubeY - 14, 3, 0, 2 * Math.PI);
            ctx.stroke();
          }
          // Mark pressure antinodes (p ~ max)
          if (pEnvelope > 0.95) {
            ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
            ctx.fillText("AN", xCanvas - 5, tubeY - 6);
            // Filled circle at antinode
            ctx.beginPath();
            ctx.arc(xCanvas, tubeY - 14, 3, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Mark displacement nodes below tube
          if (xiEnvelope < 0.05) {
            ctx.fillStyle = "rgba(168, 85, 247, 0.7)";
            ctx.fillText("N", xCanvas - 3, tubeY + tubeH + 16);
          }
          if (xiEnvelope > 0.95) {
            ctx.fillStyle = "rgba(168, 85, 247, 0.7)";
            ctx.fillText("AN", xCanvas - 5, tubeY + tubeH + 16);
          }
        }

        // Envelope legend
        ctx.fillStyle = "rgba(6, 182, 212, 0.7)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("\u2500\u2500 p(x,t) PRESSURE (N = node, AN = antinode)", tubeX, tubeY - 25);
        ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
        ctx.fillText("- - \u03BE(x,t) DISPLACEMENT (N = node, AN = antinode)", tubeX, tubeY + tubeH + 30);

        // Resonance frequency annotation
        const k_n_display = params.pipeType === "open-open" 
          ? (n_har * Math.PI) / L_pipe 
          : (n_har * Math.PI) / (2.0 * L_pipe);
        const f_n = (k_n_display * c) / (2 * Math.PI);
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.font = "bold 11px monospace";
        const freqFormula = params.pipeType === "open-open" 
          ? `f_${n_har} = ${n_har}\u00B7c/(2L) = ${f_n.toFixed(1)} Hz`
          : `f_${n_har} = ${n_har}\u00B7c/(4L) = ${f_n.toFixed(1)} Hz`;
        ctx.fillText(freqFormula, tubeX + tubeW / 2 - 80, tubeY + tubeH + 50);

      } else if (params.regime === "doppler") {
        // ─── 2D DOPPLER WAVEFRONTS & MACH CONE ──────────────────────────────
        const vs = params.sourceSpeed;
        const timeVal = timeRef.current;

        if (params.isPlaying && Math.random() < 0.25) {
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

        ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
        ctx.lineWidth = 1.5;

        dopplerWavesRef.current.forEach((wave) => {
          wave.radius = (timeVal - wave.time) * c * 0.65;
          
          if (wave.radius < W * 1.5) {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
        });

        const currentSrcX = W * 0.15 + (vs / 4.0) * timeVal * 150.0;
        const srcXClamped = Math.min(W * 0.92, currentSrcX);

        // Mach cone for supersonic sources
        if (vs > c) {
          const machAngle = Math.asin(c / vs);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          
          ctx.moveTo(srcXClamped, H * 0.45);
          ctx.lineTo(srcXClamped - Math.cos(machAngle) * 500.0, H * 0.45 - Math.sin(machAngle) * 500.0);
          
          ctx.moveTo(srcXClamped, H * 0.45);
          ctx.lineTo(srcXClamped - Math.cos(machAngle) * 500.0, H * 0.45 + Math.sin(machAngle) * 500.0);
          ctx.stroke();
          
          // Mach angle annotation
          ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(`Mach = ${(vs / c).toFixed(2)}  \u03B8 = ${(machAngle * 180 / Math.PI).toFixed(1)}\u00B0`, srcXClamped - 100, H * 0.25);
          ctx.fillText(`sin\u207B\u00B9(c/v_s) = sin\u207B\u00B9(${c.toFixed(0)}/${vs.toFixed(0)})`, srcXClamped - 100, H * 0.28);
        }

        // Source icon
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(srcXClamped, H * 0.45, 9, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(srcXClamped, H * 0.45, 13, 0, 2 * Math.PI);
        ctx.stroke();

        // Doppler frequency annotations
        if (c > vs) {
          const f_approach = params.frequency * c / (c - vs);
          const f_recede = params.frequency * c / (c + vs);
          ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(`f_approach = ${f_approach.toFixed(1)} Hz`, srcXClamped + 25, H * 0.42);
          ctx.fillText(`f_recede = ${f_recede.toFixed(1)} Hz`, Math.max(10, srcXClamped - 180), H * 0.42);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "9px monospace";
          ctx.fillText(`f' = f\u00B7c/(c \u00B1 v_s)`, srcXClamped + 25, H * 0.46);
        }

        if (currentSrcX > W * 0.95) {
          timeRef.current = 0;
          dopplerWavesRef.current = [];
        }

      } else if (params.regime === "interference") {
        // ─── 2D INTERFERENCE ──────────────────────────────────────────────────
        const s1X = W * 0.35;
        const s1Y = H * 0.3;
        const s2X = W * 0.35;
        const s2Y = H * 0.6;

        if (params.sourcesCount === 2) {
          const stepSize = 5;
          for (let y = 10; y < H * 0.75; y += stepSize) {
            for (let x = 10; x < W * 0.9; x += stepSize) {
              const r1 = Math.hypot(x - s1X, y - s1Y) * 0.05;
              const r2 = Math.hypot(x - s2X, y - s2Y) * 0.05;
              
              const p1 = Math.sin(k * r1 - omega * timeRef.current) / Math.max(0.5, r1 * 0.2);
              const p2 = Math.sin(k * r2 - omega * timeRef.current + params.phaseDiff) / Math.max(0.5, r2 * 0.2);
              const val = (p1 + p2) * 0.35;

              const cVal = Math.max(-1, Math.min(1, val));
              if (cVal > 0) {
                ctx.fillStyle = `rgba(139, 92, 246, ${cVal * 0.35})`;
              } else {
                ctx.fillStyle = `rgba(6, 182, 212, ${Math.abs(cVal) * 0.35})`;
              }
              ctx.fillRect(x, y, stepSize, stepSize);
            }
          }

          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(s1X, s1Y, 6, 0, 2*Math.PI); ctx.fill();
          ctx.beginPath(); ctx.arc(s2X, s2Y, 6, 0, 2*Math.PI); ctx.fill();

          // Phase difference annotation
          ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(`\u0394\u03C6 = ${(params.phaseDiff / Math.PI).toFixed(2)}\u03C0 rad`, s2X + 15, s2Y);
          ctx.fillText("Purple = constructive  |  Cyan = destructive", W * 0.45, H * 0.08);
        } else {
          ctx.fillStyle = "rgba(139, 92, 246, 0.7)";
          const particleCols = 60;
          for (let i = 0; i < particleCols; i++) {
            const normX = i / particleCols;
            const xVal = W * (0.15 + 0.7 * normX);
            const w2 = 2.0 * Math.PI * (params.frequency + params.beatFreq);
            
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

          // Beat frequency annotation
          ctx.fillStyle = "rgba(139, 92, 246, 0.7)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(`f_beat = |f\u2081 - f\u2082| = ${params.beatFreq.toFixed(1)} Hz`, W * 0.15, H * 0.1);
          ctx.fillText(`Envelope period = 1/f_beat = ${(1/params.beatFreq).toFixed(3)} s`, W * 0.15, H * 0.13);
        }

      } else if (params.regime === "room") {
        // ─── ROOM ACOUSTICS ──────────────────────────────────────────────────
        const boxX = W * 0.1;
        const boxY = H * 0.15;
        const boxW = W * 0.8;
        const boxH = H * 0.55;

        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Absorption coefficient annotation on walls
        ctx.fillStyle = "rgba(249, 115, 22, 0.6)";
        ctx.font = "9px monospace";
        ctx.fillText(`\u03B1 = ${params.absorptionCoeff.toFixed(2)}`, boxX + boxW / 2, boxY - 5);
        ctx.fillText(`T\u2086\u2080 = ${reverbTime.toFixed(2)} s`, boxX + boxW - 80, boxY - 5);

        raysRef.current.forEach((ray) => {
          if (!ray.active) return;
          const pixelX = boxX + ray.x * boxW;
          const pixelY = boxY + ray.y * boxH;

          ctx.fillStyle = `rgba(249, 115, 22, ${ray.energy / params.amplitude})`;
          ctx.beginPath();
          ctx.arc(pixelX, pixelY, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // ─── 3. INTERACTIVE LAB ELEMENTS ────────────────────────────────────────
      
      // Probe Microphone
      const prX = probePos.x * W;
      const prY = probePos.y * H;
      
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(prX, prY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(prX, prY, 12, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("PROBE MIC", prX - 25, prY - 18);

      // Speaker source
      if (params.regime !== "doppler" && params.regime !== "resonance") {
        const spX = speakerPos.x * W;
        const spY = speakerPos.y * H;

        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(spX, spY, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(spX, spY, 12, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        ctx.fillText("SOURCE", spX - 18, spY - 18);
      }

      // ─── 4. BOTTOM TELEMETRY PLOTS & SPECTRUMS ──────────────────────────────
      const graphY = H * 0.76;
      const graphH = H * 0.2;
      const graphW1 = W * 0.44;
      const graphW2 = W * 0.44;

      // ─── LEFT: TIME-DOMAIN OSCILLOSCOPE ──────────────────────────────────────
      ctx.fillStyle = "#141416";
      ctx.fillRect(W * 0.04, graphY, graphW1, graphH);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.strokeRect(W * 0.04, graphY, graphW1, graphH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "9px monospace";
      ctx.fillText("PROBE OSCILLOSCOPE  p(t) [Pa]", W * 0.05, graphY + 12);

      // Plot signal
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      const histLen = signalHistoryRef.current.length;
      for (let i = 0; i < histLen; i++) {
        const plotX = W * 0.04 + (i / histLen) * graphW1;
        const plotY = (graphY + graphH / 2.0) - (signalHistoryRef.current[i] / Math.max(0.01, params.amplitude)) * (graphH * 0.4);
        if (i === 0) ctx.moveTo(plotX, plotY);
        else ctx.lineTo(plotX, plotY);
      }
      ctx.stroke();

      // ─── RIGHT: SPECTRUM / DECAY ─────────────────────────────────────────────
      ctx.fillStyle = "#141416";
      ctx.fillRect(W * 0.52, graphY, graphW2, graphH);
      ctx.strokeRect(W * 0.52, graphY, graphW2, graphH);

      if (params.regime === "room") {
        ctx.fillStyle = "#ffffff";
        ctx.fillText("REVERBERATION ENERGY DECAY (Sabine)", W * 0.53, graphY + 12);

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
        // ─── FFT SPECTRUM WITH HANNING WINDOW ──────────────────────────────
        ctx.fillStyle = "#ffffff";
        ctx.font = "9px monospace";
        ctx.fillText("FOURIER SPECTRUM |P(f)| (Hanning Window DFT)", W * 0.53, graphY + 12);

        const { spectrum } = computeDFT(signalHistoryRef.current);
        
        // Draw noise floor reference line
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        const noiseFloorY = graphY + graphH - 10;
        ctx.beginPath();
        ctx.moveTo(W * 0.52, noiseFloorY);
        ctx.lineTo(W * 0.52 + graphW2, noiseFloorY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
        ctx.fillText("noise floor", W * 0.52 + graphW2 - 60, noiseFloorY - 3);

        // Draw spectrum bars
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.8;
        
        const binsToShow = Math.floor(spectrum.length * 0.8);
        const binWidth = graphW2 / binsToShow;
        
        let maxAmp = 0;
        for (let i = 0; i < binsToShow; i++) {
          if (spectrum[i] > maxAmp) maxAmp = spectrum[i];
        }
        
        for (let i = 0; i < binsToShow; i++) {
          const plotX = W * 0.52 + i * binWidth;
          const ampVal = maxAmp > 0 ? Math.min(1.0, spectrum[i] / maxAmp) : 0;
          const barH = ampVal * (graphH * 0.7);
          
          // Color peak bins differently
          if (ampVal > 0.5) {
            ctx.strokeStyle = "#f59e0b"; // Highlight strong peaks in amber
          } else {
            ctx.strokeStyle = "#38bdf8";
          }
          
          ctx.beginPath();
          ctx.moveTo(plotX, graphY + graphH - 4);
          ctx.lineTo(plotX, graphY + graphH - 4 - barH);
          ctx.stroke();
        }

        // Mark fundamental frequency peak
        if (maxAmp > 0) {
          let peakBin = 0;
          for (let i = 1; i < binsToShow; i++) {
            if (spectrum[i] > spectrum[peakBin]) peakBin = i;
          }
          const peakX = W * 0.52 + peakBin * binWidth;
          ctx.fillStyle = "rgba(245, 158, 11, 0.8)";
          ctx.font = "bold 8px monospace";
          ctx.fillText("f\u2080", peakX - 3, graphY + 22);
        }
      }

      // ─── dB SPL REFERENCE ANNOTATIONS ────────────────────────────────────────
      // Show dB SPL with context on the left graph
      const dbVal = Math.max(0, soundLevelDbSPL);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px monospace";
      ctx.fillText(`dB SPL: ${dbVal.toFixed(1)} (ref: 20 \u00B5Pa)`, W * 0.05, graphY + graphH + 14);
      
      // SPL context
      let splContext = "";
      if (dbVal < 30) splContext = "~ Near silence";
      else if (dbVal < 50) splContext = "~ Whisper";
      else if (dbVal < 70) splContext = "~ Conversation";
      else if (dbVal < 90) splContext = "~ Traffic";
      else if (dbVal < 110) splContext = "~ Power tools";
      else if (dbVal < 130) splContext = "~ Pain threshold";
      else splContext = "~ Extreme (>130 dB)";
      
      ctx.fillStyle = "rgba(245, 158, 11, 0.5)";
      ctx.fillText(splContext, W * 0.25, graphY + graphH + 14);

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

"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface GasLawsTelemetry {
  measuredPressure: number;
  idealPressure: number;
  measuredTemp: number;
  measuredVolume: number;
  particlesEscaped: number;
  meanSpeed: number;
  vanDerWaalsPressure: number;
  speedHistogram: number[];
  temperatureTarget: number;
}

interface GasLawsCanvasProps {
  temperature: number;      // Target Temperature (K)
  volume: number;           // Target Volume fraction (0.3 to 1.0)
  particleCount: number;    // Particle count (N)
  regime: "free" | "boyle" | "charles" | "gay-lussac" | "avogadro";
  gasPreset: "ideal" | "helium" | "xenon" | "real";
  enableCollisions: boolean;
  attractiveForce: number;  // 0 to 10 scale
  isPlaying: boolean;
  slowMotion: number;
  onVolumeChange: (vol: number) => void;
  onStateUpdate: (telemetry: GasLawsTelemetry) => void;
  resetTrigger: number;
  addHeatTrigger: (amount: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

export const GasLawsCanvas: React.FC<GasLawsCanvasProps> = ({
  temperature,
  volume,
  particleCount,
  regime,
  gasPreset,
  enableCollisions,
  attractiveForce,
  isPlaying,
  slowMotion,
  onVolumeChange,
  onStateUpdate,
  resetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle list reference
  const particlesRef = useRef<Particle[]>([]);
  
  // Simulation parameters reference for real-time physics loop without restarts
  const paramsRef = useRef({
    temperature,
    volume,
    particleCount,
    regime,
    gasPreset,
    enableCollisions,
    attractiveForce,
    isPlaying,
    slowMotion,
  });

  useEffect(() => {
    paramsRef.current = {
      temperature,
      volume,
      particleCount,
      regime,
      gasPreset,
      enableCollisions,
      attractiveForce,
      isPlaying,
      slowMotion,
    };
  }, [temperature, volume, particleCount, regime, gasPreset, enableCollisions, attractiveForce, isPlaying, slowMotion]);

  // Chamber variables
  const chamberBounds = useRef({
    xMin: 40,
    xMax: 400, // variable based on volume
    yMin: 50,
    yMax: 350,
  });

  // Target width for isobaric/Charles/Avogadro calculations
  const targetWidthRef = useRef<number>(400);

  // Pressure integration variables
  const momentumAccumulatorRef = useRef<number>(0);
  const momentumTimerRef = useRef<number>(0);
  const pressureHistoryRef = useRef<{ t: number; p: number }[]>([]);
  const pvHistoryRef = useRef<{ v: number; p: number }[]>([]);
  const lastStateUpdateRef = useRef<number>(0);

  // Interactive dragging of piston
  const isDraggingPistonRef = useRef<boolean>(false);
  const hoverPistonRef = useRef<boolean>(false);

  // Helper to fetch current container size and scale coordinates dynamically
  const getLayoutDimensions = () => {
    const container = containerRef.current;
    const w = container ? container.clientWidth : 800;
    const h = container ? container.clientHeight : 500;
    const midX = w / 2;
    const xMin = 40;
    const maxX = midX - 60; // Leave padding before horizontal center split
    const yMin = 50;
    const yMax = h - 60; // Leave room at bottom of container
    return { w, h, midX, xMin, maxX, yMin, yMax };
  };

  // Reset particles
  const initParticles = () => {
    const p = paramsRef.current;
    const list: Particle[] = [];
    const { xMin, maxX, yMin, yMax } = getLayoutDimensions();
    
    // Set piston width based on volume input initially
    const targetXMax = xMin + (maxX - xMin) * p.volume;
    chamberBounds.current = {
      xMin,
      xMax: targetXMax,
      yMin,
      yMax
    };
    targetWidthRef.current = targetXMax;

    // Mass & Radius selection based on Preset
    let mass = 1.0;
    let radius = 4.0;
    if (p.gasPreset === "helium") {
      mass = 0.5;
      radius = 3.0;
    } else if (p.gasPreset === "xenon") {
      mass = 4.0;
      radius = 8.5;
    } else if (p.gasPreset === "real") {
      mass = 2.0;
      radius = 6.0;
    } else { // ideal
      mass = 1.0;
      radius = 4.0; // visual representation, but we can toggle collision off
    }

    const kb = 1.5; // custom Boltzmann scaling factor
    const speed = Math.sqrt((2 * kb * p.temperature) / mass);

    for (let i = 0; i < p.particleCount; i++) {
      // Avoid overlap initially
      let x = 0, y = 0, overlap = true, safety = 0;
      while (overlap && safety < 100) {
        x = xMin + radius + Math.random() * (targetXMax - xMin - 2 * radius);
        y = yMin + radius + Math.random() * (yMax - yMin - 2 * radius);
        
        // check overlap
        overlap = false;
        for (const other of list) {
          const dx = x - other.x;
          const dy = y - other.y;
          if (Math.sqrt(dx*dx + dy*dy) < radius + other.radius + 1) {
            overlap = true;
            break;
          }
        }
        safety++;
      }

      // Random direction
      const angle = Math.random() * 2 * Math.PI;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      list.push({
        x,
        y,
        vx,
        vy,
        mass,
        radius,
        color: "rgb(16, 185, 129)"
      });
    }

    particlesRef.current = list;
    pressureHistoryRef.current = [];
    momentumAccumulatorRef.current = 0;
    momentumTimerRef.current = 0;
  };

  // Initialize/reset simulation when trigger changes or particle count increases/decreases
  useEffect(() => {
    initParticles();
  }, [resetTrigger, particleCount, gasPreset]);

  // Handle Dragging
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
    const { x } = getMousePos(e);
    const bounds = chamberBounds.current;
    const p = paramsRef.current;

    // Can only drag if volume is not locked by regime
    const canDrag = p.regime === "free" || p.regime === "boyle";
    if (canDrag && Math.abs(x - bounds.xMax) < 15) {
      isDraggingPistonRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x } = getMousePos(e);
    const bounds = chamberBounds.current;
    const p = paramsRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { xMin, maxX } = getLayoutDimensions();
    const canDrag = p.regime === "free" || p.regime === "boyle";
    if (canDrag && Math.abs(x - bounds.xMax) < 15) {
      hoverPistonRef.current = true;
      canvas.style.cursor = "col-resize";
    } else {
      hoverPistonRef.current = false;
      canvas.style.cursor = "default";
    }

    if (isDraggingPistonRef.current) {
      // Constraint piston to bounds
      const minX = xMin + 80;
      const newXMax = Math.max(minX, Math.min(maxX, x));
      bounds.xMax = newXMax;
      targetWidthRef.current = newXMax;
      
      // Calculate corresponding volume fraction and report back to parent
      const volFraction = (newXMax - xMin) / (maxX - xMin);
      onVolumeChange(Math.max(0.1, Math.min(1.0, volFraction)));
    }
  };

  const handleMouseUp = () => {
    isDraggingPistonRef.current = false;
  };

  // Main Canvas Render Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    // Render loop function
    const tick = (now: number) => {
      const p = paramsRef.current;
      const dt_wall = Math.min(0.03, (now - lastTime) / 1000); // capped at 30fps simulation step
      lastTime = now;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const { midX, xMin, maxX, yMin, yMax } = getLayoutDimensions();
      const bounds = chamberBounds.current;
      const kb = 1.5; // custom scaling

      // Keep bounds updated relative to screen size dynamically
      bounds.xMin = xMin;
      bounds.yMin = yMin;
      bounds.yMax = yMax;

      // Handle window resize safety: clamp particles so they don't get trapped outside the chamber
      const list = particlesRef.current;
      for (const part of list) {
        part.x = Math.max(bounds.xMin + part.radius, Math.min(bounds.xMax - part.radius, part.x));
        part.y = Math.max(bounds.yMin + part.radius, Math.min(bounds.yMax - part.radius, part.y));
      }

      // Handle piston automatic resizing based on regime locks
      if (p.regime === "charles") {
        // V is proportional to T: V = V_base * (T / T_base)
        // Let's assume at T=300K, volume is 0.5.
        // target width:
        const baseWidth = maxX - xMin;
        const volumeFraction = 0.5 * (p.temperature / 300);
        const targetXMax = xMin + baseWidth * Math.max(0.2, Math.min(1.0, volumeFraction));
        targetWidthRef.current = targetXMax;
      } else if (p.regime === "avogadro") {
        // V is proportional to N: V = V_base * (N / N_base)
        const baseWidth = maxX - xMin;
        const volumeFraction = 0.5 * (p.particleCount / 100);
        const targetXMax = xMin + baseWidth * Math.max(0.2, Math.min(1.0, volumeFraction));
        targetWidthRef.current = targetXMax;
      } else if (p.regime === "gay-lussac" || p.regime === "free") {
        // V is locked or determined by slider
        const targetXMax = xMin + (maxX - xMin) * p.volume;
        targetWidthRef.current = targetXMax;
      }

      // Smooth piston motion
      if (!isDraggingPistonRef.current) {
        bounds.xMax += (targetWidthRef.current - bounds.xMax) * 0.08;
      }

      // ─── PHYSICS UPDATE ─────────────────────────────────────────
      if (p.isPlaying && particlesRef.current.length > 0) {
        const dt = dt_wall * p.slowMotion;

        // 1. Apply Intermolecular Attraction (Van der Waals attractive term 'a')
        if (p.gasPreset === "real" && p.attractiveForce > 0) {
          const attractionStrength = p.attractiveForce * 0.15;
          const attractionCutoff = 40; // pixels
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              const pi = list[i];
              const pj = list[j];
              const dx = pj.x - pi.x;
              const dy = pj.y - pi.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist > pi.radius + pj.radius && dist < attractionCutoff) {
                // simple attractive force pull
                const force = attractionStrength * (attractionCutoff - dist) / dist;
                const ax = force * dx;
                const ay = force * dy;
                // apply acceleration
                pi.vx += (ax / pi.mass) * dt;
                pi.vy += (ay / pi.mass) * dt;
                pj.vx -= (ax / pj.mass) * dt;
                pj.vy -= (ay / pj.mass) * dt;
              }
            }
          }
        }

        // 2. Move particles and check boundary collisions
        let wallCollisionsMomentum = 0;
        const pistonX = bounds.xMax;

        for (const part of list) {
          part.x += part.vx * dt * 60; // scale to keep visual motion reasonable
          part.y += part.vy * dt * 60;

          // Boundary checks
          // Left Wall
          if (part.x < bounds.xMin + part.radius) {
            part.x = bounds.xMin + part.radius;
            part.vx = Math.abs(part.vx);
            wallCollisionsMomentum += 2 * part.mass * part.vx;
          }
          // Right Wall (Piston)
          if (part.x > pistonX - part.radius) {
            part.x = pistonX - part.radius;
            part.vx = -Math.abs(part.vx);
            wallCollisionsMomentum += 2 * part.mass * Math.abs(part.vx);
          }
          // Top Wall
          if (part.y < bounds.yMin + part.radius) {
            part.y = bounds.yMin + part.radius;
            part.vy = Math.abs(part.vy);
            wallCollisionsMomentum += 2 * part.mass * part.vy;
          }
          // Bottom Wall (Heating/Cooling Plate)
          if (part.y > bounds.yMax - part.radius) {
            part.y = bounds.yMax - part.radius;
            part.vy = -Math.abs(part.vy);
            wallCollisionsMomentum += 2 * part.mass * Math.abs(part.vy);
          }
        }

        // Accumulate momentum transfers for pressure computation
        momentumAccumulatorRef.current += wallCollisionsMomentum;
        momentumTimerRef.current += dt;

        // 3. Resolve Particle-Particle collisions elastically (hard sphere exclusion 'b')
        const collisionsEnabled = p.enableCollisions || p.gasPreset === "real" || p.gasPreset === "xenon";
        if (collisionsEnabled) {
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              const pi = list[i];
              const pj = list[j];
              const dx = pj.x - pi.x;
              const dy = pj.y - pi.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const minDist = pi.radius + pj.radius;

              if (dist < minDist) {
                // collision!
                const nx = dx / dist;
                const ny = dy / dist;

                // Relative velocity
                const kx = pi.vx - pj.vx;
                const ky = pi.vy - pj.vy;
                const vn = kx * nx + ky * ny;

                // Collide only if approaching
                if (vn > 0) {
                  const impulse = (2 * vn) / (pi.mass + pj.mass);
                  pi.vx -= impulse * pj.mass * nx;
                  pi.vy -= impulse * pj.mass * ny;
                  pj.vx += impulse * pi.mass * nx;
                  pj.vy += impulse * pi.mass * ny;
                }

                // Push overlap apart to avoid sticking
                const overlap = minDist - dist;
                pi.x -= nx * overlap * 0.5;
                pi.y -= ny * overlap * 0.5;
                pj.x += nx * overlap * 0.5;
                pj.y += ny * overlap * 0.5;
              }
            }
          }
        }

        // 4. Thermostat scaling (Berendsen Thermostat style)
        // Computes average kinetic energy and scales towards the target temperature
        let totalKE = 0;
        for (const part of list) {
          totalKE += 0.5 * part.mass * (part.vx*part.vx + part.vy*part.vy);
        }
        const currentTemp = totalKE / (list.length * kb);

        // target KE
        const targetKE = list.length * kb * p.temperature;
        if (totalKE > 0) {
          const thermostatCoeff = 0.08; // smooth relaxation
          const scale = Math.sqrt(1 + (targetKE / totalKE - 1) * thermostatCoeff);
          for (const part of list) {
            part.vx *= scale;
            part.vy *= scale;
            
            // speed limit cap to prevent tunneling at high thermal states
            const speed = Math.sqrt(part.vx*part.vx + part.vy*part.vy);
            const speedCap = 250;
            if (speed > speedCap) {
              part.vx = (part.vx / speed) * speedCap;
              part.vy = (part.vy / speed) * speedCap;
            }
          }
        }
      }

      // ─── TELEMETRY & DATA ANALYSIS ─────────────────────────────
      // Normalized volume (ranges from 3.0 to 10.0 dm³ relative to current width)
      const currentWidth = bounds.xMax - bounds.xMin;
      const currentHeight = bounds.yMax - bounds.yMin;
      const measuredVolume = 3.0 + (currentWidth / (maxX - xMin)) * 7.0;

      // Live Temperature
      let currentKE = 0;
      let sumSpeed = 0;
      const speeds: number[] = [];
      for (const part of list) {
        const speed = Math.sqrt(part.vx*part.vx + part.vy*part.vy);
        currentKE += 0.5 * part.mass * speed * speed;
        sumSpeed += speed;
        speeds.push(speed);
      }
      const measuredTemp = list.length > 0 ? currentKE / (list.length * kb) : 0;
      const meanSpeed = list.length > 0 ? sumSpeed / list.length : 0;

      // Live Measured Pressure from wall collisions (scaled to fit typical kPa ranges)
      let measuredPressure = 0;
      if (momentumTimerRef.current > 0.08) {
        const perimeter = 2 * (currentWidth + currentHeight);
        const pMeasuredRaw = (momentumAccumulatorRef.current / momentumTimerRef.current) / perimeter;
        
        // Calibrate raw collision pressure to match standard kPa values (around 100-600 kPa)
        const pMeasuredScaled = pMeasuredRaw * 55.0;

        // Reset timers
        momentumAccumulatorRef.current = 0;
        momentumTimerRef.current = 0;

        // Smooth pressure
        const smoothFactor = 0.15;
        const lastPressure = pressureHistoryRef.current.length > 0 ? pressureHistoryRef.current[pressureHistoryRef.current.length - 1].p : pMeasuredScaled;
        const pSmoothed = lastPressure + (pMeasuredScaled - lastPressure) * smoothFactor;

        pressureHistoryRef.current.push({ t: now, p: pSmoothed });
        if (pressureHistoryRef.current.length > 200) {
          pressureHistoryRef.current.shift();
        }

        // Add to P-V history
        pvHistoryRef.current.push({ v: measuredVolume, p: pSmoothed });
        if (pvHistoryRef.current.length > 300) {
          pvHistoryRef.current.shift();
        }
      }
      
      if (pressureHistoryRef.current.length > 0) {
        measuredPressure = pressureHistoryRef.current[pressureHistoryRef.current.length - 1].p;
      } else {
        // Fallback to ideal pressure initially
        measuredPressure = (list.length * 0.05 * p.temperature) / measuredVolume;
      }

      // Theoretical Ideal Pressure
      const idealPressure = (list.length * 0.05 * p.temperature) / measuredVolume;

      // Van der Waals Theoretical Pressure
      // (P + a * n^2 / V^2) * (V - n * b) = n * R * T
      // -> P = nRT / (V - nb) - a * n^2 / V^2
      // Calibrated parameters to make real gas effects visually noticeable in the config stats:
      let a_coeff = 0;
      let b_coeff = 0;
      if (p.gasPreset === "real") {
        a_coeff = p.attractiveForce * 1.5;
        b_coeff = 0.015; // scaling co-volume factor per particle
      } else if (p.gasPreset === "xenon") {
        a_coeff = 0;
        b_coeff = 0.022; // larger co-volume per particle
      }
      const vdwDenominator = measuredVolume - list.length * b_coeff;
      const vanDerWaalsPressure = vdwDenominator > 0
        ? (list.length * 0.05 * p.temperature) / vdwDenominator - (a_coeff * list.length * list.length) / (measuredVolume * measuredVolume)
        : idealPressure;

      // Speed Distribution Histogram calculation for Maxwell-Boltzmann comparison
      const binCount = 15;
      const speedHistogram = new Array(binCount).fill(0);
      const maxSpeed = 160; // standard maximum speed range
      if (list.length > 0) {
        for (const speed of speeds) {
          const binIndex = Math.min(binCount - 1, Math.floor((speed / maxSpeed) * binCount));
          speedHistogram[binIndex]++;
        }
      }

      // Dispatch state updates to parent component periodicially to avoid lag
      if (now - lastStateUpdateRef.current > 60) {
        onStateUpdate({
          measuredPressure,
          idealPressure,
          measuredTemp,
          measuredVolume,
          particlesEscaped: 0,
          meanSpeed,
          vanDerWaalsPressure,
          speedHistogram,
          temperatureTarget: p.temperature
        });
        lastStateUpdateRef.current = now;
      }

      // ─── RENDERING ──────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);

      // Draw dashboard grid backdrop
      ctx.strokeStyle = "#161618";
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      for (let gx = 0; gx < w; gx += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      // Draw Layout Quadrant dividers
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

      // Draw Left Side: Particle Chamber
      // Background gradient for chamber
      const chamberW = bounds.xMax - bounds.xMin;
      const chamberH = bounds.yMax - bounds.yMin;
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(bounds.xMin, bounds.yMin, chamberW, chamberH);

      // Heating/cooling coil color
      // Orange/Red for hot, Blue for cold. Let's interpolate based on temperature target
      const heatFraction = Math.min(1.0, Math.max(0.0, (p.temperature - 100) / 700));
      const rCoil = Math.floor(60 + heatFraction * 195);
      const gCoil = Math.floor(80 + (1.0 - heatFraction) * 80 + heatFraction * 30);
      const bCoil = Math.floor(180 + (1.0 - heatFraction) * 75 - heatFraction * 180);

      // Draw Bottom plate (heating/cooling coil)
      ctx.fillStyle = `rgb(${rCoil}, ${gCoil}, ${bCoil})`;
      ctx.fillRect(bounds.xMin, bounds.yMax, chamberW, 6);
      
      // Draw Bottom glow
      const coilGlow = ctx.createLinearGradient(0, bounds.yMax, 0, bounds.yMax - 30);
      coilGlow.addColorStop(0, `rgba(${rCoil}, ${gCoil}, ${bCoil}, 0.25)`);
      coilGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coilGlow;
      ctx.fillRect(bounds.xMin, bounds.yMax - 30, chamberW, 30);

      // Draw Chamber borders (except right piston side)
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, bounds.yMin);
      ctx.lineTo(bounds.xMin, bounds.yMin);
      ctx.lineTo(bounds.xMin, bounds.yMax);
      ctx.stroke();

      // Draw Particles
      for (const part of list) {
        // Color based on kinetic energy/speed
        const speed = Math.sqrt(part.vx*part.vx + part.vy*part.vy);
        const targetSpeed = Math.sqrt((2 * kb * p.temperature) / part.mass);
        
        // speed relative to target
        const fraction = Math.min(1.5, speed / (targetSpeed * 1.5 || 1));
        const rPart = Math.floor(80 + fraction * 175);
        const gPart = Math.floor(220 * (1 - Math.abs(fraction - 0.7)) + 40);
        const bPart = Math.floor(240 * (1 - fraction) + 40);
        
        ctx.fillStyle = `rgb(${rPart}, ${gPart}, ${bPart})`;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, 2 * Math.PI);
        ctx.fill();

        // draw border
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Piston (draggable right wall)
      ctx.strokeStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "#10b981" : "#52525b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, bounds.yMin - 1);
      ctx.lineTo(bounds.xMax, bounds.yMax + 1);
      ctx.stroke();

      // Draw Piston Shaft & Handle
      ctx.strokeStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "rgba(16, 185, 129, 0.4)" : "#3f3f46";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, (bounds.yMin + bounds.yMax) / 2);
      ctx.lineTo(bounds.xMax + 20, (bounds.yMin + bounds.yMax) / 2);
      ctx.stroke();

      // Piston Handle block
      ctx.fillStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "#10b981" : "#52525b";
      ctx.fillRect(bounds.xMax + 20, (bounds.yMin + bounds.yMax) / 2 - 15, 6, 30);

      // Piston label
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `bold 9px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("PISTON", bounds.xMax + 10, bounds.yMin - 10);

      // Label Thermodynamic state
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 10px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("THERMAL COMPARTMENT", bounds.xMin, bounds.yMin - 15);

      // Thermometer state inside the chamber
      ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
      ctx.font = `9px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText(`T = ${measuredTemp.toFixed(1)} K`, bounds.xMin + 10, bounds.yMin + 20);
      ctx.fillText(`V = ${measuredVolume.toFixed(2)} dm³`, bounds.xMin + 10, bounds.yMin + 35);
      ctx.fillText(`P = ${measuredPressure.toFixed(1)} kPa`, bounds.xMin + 10, bounds.yMin + 50);

      // ─── Draw Top Right: P-V Indicator Graph ──────────────────────
      const graphX = midX + 45;
      const graphY = 35;
      const graphW = (w - midX) - 65;
      const graphH = h / 2 - 65;

      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(graphX, graphY, graphW, graphH);
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.strokeRect(graphX, graphY, graphW, graphH);

      // Axes labels
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `9px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("VOLUME V (dm³)", graphX + graphW / 2, graphY + graphH + 18);
      
      ctx.save();
      ctx.translate(graphX - 25, graphY + graphH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("PRESSURE P (kPa)", 0, 0);
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 10px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("INDICATOR DIAGRAM (P-V PATH)", midX + 20, 18);

      // Draw Ideal Gas isothermal hyperbola reference curves
      // P = nRT/V.
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1.5;
      const tempsRef = [200, 400, 600];
      const vMin = 3.0;
      const vMax = 10.0;
      const pMax = 800; // kPa Max height of graph

      for (const tRef of tempsRef) {
        ctx.beginPath();
        for (let vx = 0; vx <= graphW; vx += 5) {
          const volPct = vx / graphW; // 0 to 1 scale
          const volValue = vMin + volPct * (vMax - vMin);
          const idealPVal = (list.length * 0.05 * tRef) / volValue;
          
          // scale pressure to fit graphH
          const graphP = graphY + graphH - (idealPVal / pMax) * graphH;
          if (graphP >= graphY && graphP <= graphY + graphH) {
            if (vx === 0) ctx.moveTo(graphX + vx, graphP);
            else ctx.lineTo(graphX + vx, graphP);
          }
        }
        ctx.stroke();
      }

      // Draw actual path history
      if (pvHistoryRef.current.length > 1) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < pvHistoryRef.current.length; i++) {
          const item = pvHistoryRef.current[i];
          const vPct = (item.v - vMin) / (vMax - vMin);
          const pPct = item.p / pMax;

          const px = graphX + Math.max(0, Math.min(graphW, vPct * graphW));
          const py = graphY + graphH - Math.max(0, Math.min(graphH, pPct * graphH));

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Draw current state dot
        const last = pvHistoryRef.current[pvHistoryRef.current.length - 1];
        const vPct = (last.v - vMin) / (vMax - vMin);
        const pPct = last.p / pMax;
        const currentDotX = graphX + Math.max(0, Math.min(graphW, vPct * graphW));
        const currentDotY = graphY + graphH - Math.max(0, Math.min(graphH, pPct * graphH));

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(currentDotX, currentDotY, 4, 0, 2*Math.PI);
        ctx.fill();
      }

      // ─── Draw Bottom Right: Maxwell-Boltzmann distribution ──────
      const mbX = midX + 45;
      const mbY = h / 2 + 35;
      const mbW = (w - midX) - 65;
      const mbH = h / 2 - 65;

      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(mbX, mbY, mbW, mbH);
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.strokeRect(mbX, mbY, mbW, mbH);

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `9px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("PARTICLE SPEED (m/s)", mbX + mbW / 2, mbY + mbH + 18);
      
      ctx.save();
      ctx.translate(mbX - 25, mbY + mbH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("PARTICLE COUNT", 0, 0);
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 10px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("VELOCITY DISTRIBUTION (MAXWELL-BOLTZMANN)", midX + 20, h / 2 + 18);

      // Draw Histogram bars
      ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      const barW = mbW / binCount;
      const maxHistogramCount = Math.max(1, ...speedHistogram);
      
      for (let i = 0; i < binCount; i++) {
        const count = speedHistogram[i];
        const barH = (count / (maxHistogramCount * 1.2)) * mbH; // scale
        const bx = mbX + i * barW;
        const by = mbY + mbH - barH;

        ctx.fillRect(bx + 1, by, barW - 2, barH);
        ctx.strokeRect(bx + 1, by, barW - 2, barH);
      }

      // Draw theoretical Maxwell-Boltzmann curve overlay in 2D
      // f(v) = (m*v / (kb*T)) * exp(-m*v^2 / (2*kb*T))
      ctx.strokeStyle = "#ec4899"; // pink curve
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const massVal = list.length > 0 ? list[0].mass : 1.0;
      const targetSpeed = Math.sqrt((2 * kb * p.temperature) / massVal);

      for (let vx = 0; vx <= mbW; vx += 2) {
        const speed = (vx / mbW) * maxSpeed;
        
        // 2D MB distribution equation
        const exponent = -(massVal * speed * speed) / (2 * kb * p.temperature);
        const f_v = (massVal * speed / (kb * p.temperature)) * Math.exp(exponent);

        // Scale f_v to graph coordinates
        // We find peak of 2D MB which is at v_mp = sqrt(kb*T/m) -> speed = targetSpeed / sqrt(2)
        // Peak height f(v_mp) = sqrt(m / (e * kb * T))
        const peakHeight = Math.sqrt(massVal / (Math.E * kb * p.temperature));
        const yFraction = f_v / (peakHeight || 1);
        const py = mbY + mbH - yFraction * mbH * 0.75; // scale to fit comfortably

        if (vx === 0) ctx.moveTo(mbX + vx, py);
        else ctx.lineTo(mbX + vx, py);
      }
      ctx.stroke();

      // Legend
      ctx.fillStyle = "#ec4899";
      ctx.fillRect(mbX + mbW - 85, mbY + 10, 8, 4);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `8px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Theoretical 2D MB", mbX + mbW - 73, mbY + 14);

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onStateUpdate, onVolumeChange, isPlaying, slowMotion]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[480px]">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block bg-[#09090b]"
      />
    </div>
  );
};

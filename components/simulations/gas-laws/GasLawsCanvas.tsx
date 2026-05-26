"use client";

import React, { useRef, useEffect } from "react";
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
  entropy: number;
  entropyMax: number;
  diffusionMixing: number;
  meanFreePath: number;
  collisionCount: number;
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

  // New Physics Calibrations
  gravity: number;
  friction: number;
  elasticity: number;

  // New Particle Modes
  particleMode: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy";
  showTrails: boolean;
  showHeatMap: boolean;
  enableSound: boolean;
  showCollisionRings: boolean;
  barrierOpen: boolean;
  entropyConstraint: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  history: { x: number; y: number }[]; // For trails
}

interface CollisionRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
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
  gravity,
  friction,
  elasticity,
  particleMode,
  showTrails,
  showHeatMap,
  enableSound,
  showCollisionRings,
  barrierOpen,
  entropyConstraint
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle list reference
  const particlesRef = useRef<Particle[]>([]);

  // Callback refs to decouple render loop from simulator re-renders
  const onStateUpdateRef = useRef(onStateUpdate);
  const onVolumeChangeRef = useRef(onVolumeChange);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
    onVolumeChangeRef.current = onVolumeChange;
  }, [onStateUpdate, onVolumeChange]);
  
  // Simulation parameters reference for real-time physics loop
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
    gravity,
    friction,
    elasticity,
    particleMode,
    showTrails,
    showHeatMap,
    enableSound,
    showCollisionRings,
    barrierOpen,
    entropyConstraint
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
      gravity,
      friction,
      elasticity,
      particleMode,
      showTrails,
      showHeatMap,
      enableSound,
      showCollisionRings,
      barrierOpen,
      entropyConstraint
    };
  }, [
    temperature, volume, particleCount, regime, gasPreset, enableCollisions, 
    attractiveForce, isPlaying, slowMotion, gravity, friction, elasticity, 
    particleMode, showTrails, showHeatMap, enableSound, showCollisionRings,
    barrierOpen, entropyConstraint
  ]);

  // Chamber variables
  const chamberBounds = useRef({
    xMin: 40,
    xMax: 400, // variable based on volume
    yMin: 50,
    yMax: 350,
  });

  const targetWidthRef = useRef<number>(400);

  // Removable sliding barrier height animation
  const currentBarrierYRef = useRef<number>(50);

  // Collision tracking lists
  const collisionRingsRef = useRef<CollisionRing[]>([]);
  const brownianPathRef = useRef<{ x: number; y: number }[]>([]);
  const mfpPointsRef = useRef<{ x: number; y: number }[]>([]);
  
  // Position when brownian macroparticle is created to compute displacement
  const brownianStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sound generator throttle
  const lastSoundTimeRef = useRef<number>(0);

  // Pressure integration variables
  const momentumAccumulatorRef = useRef<number>(0);
  const momentumTimerRef = useRef<number>(0);
  const pressureHistoryRef = useRef<{ t: number; p: number }[]>([]);
  const pvHistoryRef = useRef<{ v: number; p: number }[]>([]);
  const lastStateUpdateRef = useRef<number>(0);

  // Collisions counter for rate measurement
  const collisionRateCounterRef = useRef<number>(0);
  const collisionRateTimerRef = useRef<number>(0);
  const collisionRateHistoryRef = useRef<number>(0);

  // Interactive dragging of piston
  const isDraggingPistonRef = useRef<boolean>(false);
  const hoverPistonRef = useRef<boolean>(false);

  const getLayoutDimensions = () => {
    const container = containerRef.current;
    const w = container ? container.clientWidth : 800;
    const h = container ? container.clientHeight : 500;
    const midX = w / 2;
    const xMin = 40;
    const maxX = midX - 60; 
    const yMin = 50;
    const yMax = h - 60; 
    return { w, h, midX, xMin, maxX, yMin, yMax };
  };

  // Synthesize a sci-fi click sound using the Web Audio API
  const playCollisionAudio = () => {
    if (!paramsRef.current.enableSound) return;
    const now = performance.now();
    if (now - lastSoundTimeRef.current < 50) return; // limit sound generation
    lastSoundTimeRef.current = now;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(160, ctx.currentTime); // 160Hz low frequency mechanical bump
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio blocked or failed
    }
  };

  // Reset particles
  const initParticles = () => {
    const p = paramsRef.current;
    const list: Particle[] = [];
    const { xMin, maxX, yMin, yMax } = getLayoutDimensions();
    
    const targetXMax = xMin + (maxX - xMin) * p.volume;
    chamberBounds.current = { xMin, xMax: targetXMax, yMin, yMax };
    targetWidthRef.current = targetXMax;

    // Reset paths and barriers
    brownianPathRef.current = [];
    mfpPointsRef.current = [];
    collisionRingsRef.current = [];
    currentBarrierYRef.current = yMin; // fully closed

    // Mass & Radius presets
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
    }

    const kb_micro = 1.5; 
    const speed = Math.sqrt((2 * kb_micro * p.temperature) / mass);

    // ─── 1. BROWNIAN MOTION REGIME ──────────────────────────────────────────
    if (p.particleMode === "brownian") {
      const macroX = xMin + (targetXMax - xMin) * 0.5;
      const macroY = yMin + (yMax - yMin) * 0.5;
      brownianStartRef.current = { x: macroX, y: macroY };

      // Spawn 1 Macro-particle
      list.push({
        x: macroX,
        y: macroY,
        vx: (Math.random() - 0.5) * (speed * 0.1),
        vy: (Math.random() - 0.5) * (speed * 0.1),
        mass: 30.0,
        radius: 24.0,
        color: "#eab308", // Yellow
        history: []
      });

      // Spawn N microparticles (smaller, lighter)
      const count = Math.max(30, Math.min(180, p.particleCount));
      for (let i = 0; i < count; i++) {
        let x = 0, y = 0, overlap = true, safety = 0;
        const microRadius = 2.5;
        const microMass = 0.4;
        const microSpeed = Math.sqrt((2 * kb_micro * p.temperature) / microMass);

        while (overlap && safety < 100) {
          x = xMin + microRadius + Math.random() * (targetXMax - xMin - 2 * microRadius);
          y = yMin + microRadius + Math.random() * (yMax - yMin - 2 * microRadius);
          overlap = false;

          // Check overlap with macro
          const dx = x - macroX;
          const dy = y - macroY;
          if (Math.sqrt(dx*dx + dy*dy) < 24.0 + microRadius + 5) {
            overlap = true;
          }
          safety++;
        }

        const angle = Math.random() * 2 * Math.PI;
        list.push({
          x,
          y,
          vx: Math.cos(angle) * microSpeed,
          vy: Math.sin(angle) * microSpeed,
          mass: microMass,
          radius: microRadius,
          color: "rgba(255, 255, 255, 0.45)",
          history: []
        });
      }
    } 
    // ─── 2. DIFFUSION REGIME ────────────────────────────────────────────────
    else if (p.particleMode === "diffusion") {
      const center = xMin + (targetXMax - xMin) * 0.5;
      
      for (let i = 0; i < p.particleCount; i++) {
        const isBlue = i < p.particleCount / 2;
        let x = 0, y = 0, overlap = true, safety = 0;

        while (overlap && safety < 100) {
          if (isBlue) {
            x = xMin + radius + Math.random() * (center - xMin - 2 * radius - 5);
          } else {
            x = center + 5 + radius + Math.random() * (targetXMax - center - 2 * radius - 5);
          }
          y = yMin + radius + Math.random() * (yMax - yMin - 2 * radius);
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

        const angle = Math.random() * 2 * Math.PI;
        list.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          mass,
          radius,
          color: isBlue ? "#3b82f6" : "#f97316", // Blue vs Orange
          history: []
        });
      }
    } 
    // ─── 3. MEAN FREE PATH / ENTROPY / NORMAL ───────────────────────────────
    else {
      // In Mean Free Path mode: particle[0] is marked neon pink
      for (let i = 0; i < p.particleCount; i++) {
        let x = 0, y = 0, overlap = true, safety = 0;

        // If entropy constraint is checked, restrict initial spawn to left 40%
        const spawnMaxX = p.entropyConstraint && p.particleMode === "entropy"
          ? xMin + (targetXMax - xMin) * 0.4
          : targetXMax;

        while (overlap && safety < 100) {
          x = xMin + radius + Math.random() * (spawnMaxX - xMin - 2 * radius);
          y = yMin + radius + Math.random() * (yMax - yMin - 2 * radius);
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

        const angle = Math.random() * 2 * Math.PI;
        const isMFPTestParticle = i === 0 && p.particleMode === "mean-free-path";

        list.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          mass: isMFPTestParticle ? 1.0 : mass,
          radius: isMFPTestParticle ? 7.5 : radius,
          color: isMFPTestParticle ? "#ec4899" : "rgb(16, 185, 129)",
          history: []
        });
      }
    }

    particlesRef.current = list;
    pressureHistoryRef.current = [];
    momentumAccumulatorRef.current = 0;
    momentumTimerRef.current = 0;
    collisionRateCounterRef.current = 0;
    collisionRateTimerRef.current = 0;
  };

  useEffect(() => {
    initParticles();
  }, [resetTrigger, particleCount, gasPreset, particleMode]);

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
      const minX = xMin + 80;
      const newXMax = Math.max(minX, Math.min(maxX, x));
      bounds.xMax = newXMax;
      targetWidthRef.current = newXMax;
      
      const volFraction = (newXMax - xMin) / (maxX - xMin);
      onVolumeChangeRef.current(Math.max(0.1, Math.min(1.0, volFraction)));
    }
  };

  const handleMouseUp = () => {
    isDraggingPistonRef.current = false;
  };

  // Main Canvas Render Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let tickCount = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (canvas && ctx && width > 0 && height > 0) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });

    const container = containerRef.current;
    if (container) {
      resizeObserver.observe(container);
    }

    // Render loop function
    const tick = (now: number) => {
      const p = paramsRef.current;
      const dt_wall = Math.min(0.03, (now - lastTime) / 1000); 
      lastTime = now;
      tickCount++;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) {
        animationId = requestAnimationFrame(tick);
        return;
      }

      const { midX, xMin, maxX, yMin, yMax } = getLayoutDimensions();
      const bounds = chamberBounds.current;
      const kb_micro = 1.5; 

      bounds.xMin = xMin;
      bounds.yMin = yMin;
      bounds.yMax = yMax;

      const list = particlesRef.current;

      // Handle sliding barrier for Diffusion Mode
      const targetBarrierY = p.barrierOpen ? yMin : yMax;
      currentBarrierYRef.current += (targetBarrierY - currentBarrierYRef.current) * 0.08;

      // Handle window resize safety: clamp particles inside bounds
      for (const part of list) {
        part.x = Math.max(bounds.xMin + part.radius, Math.min(bounds.xMax - part.radius, part.x));
        part.y = Math.max(bounds.yMin + part.radius, Math.min(bounds.yMax - part.radius, part.y));
      }

      // Handle piston automatic resizing based on regime locks
      if (p.regime === "charles") {
        const baseWidth = maxX - xMin;
        const volumeFraction = 0.5 * (p.temperature / 300);
        const targetXMax = xMin + baseWidth * Math.max(0.2, Math.min(1.0, volumeFraction));
        targetWidthRef.current = targetXMax;
      } else if (p.regime === "avogadro") {
        const baseWidth = maxX - xMin;
        const volumeFraction = 0.5 * (p.particleCount / 100);
        const targetXMax = xMin + baseWidth * Math.max(0.2, Math.min(1.0, volumeFraction));
        targetWidthRef.current = targetXMax;
      } else if (p.regime === "gay-lussac" || p.regime === "free") {
        const targetXMax = xMin + (maxX - xMin) * p.volume;
        targetWidthRef.current = targetXMax;
      }

      // Smooth piston motion
      if (!isDraggingPistonRef.current) {
        bounds.xMax += (targetWidthRef.current - bounds.xMax) * 0.08;
      }

      // ─── PHYSICS UPDATE ─────────────────────────────────────────
      if (p.isPlaying && list.length > 0) {
        const dt = dt_wall * p.slowMotion;

        // Add to collision rate timer
        collisionRateTimerRef.current += dt;

        // A. Apply gravity & air drag friction
        for (const part of list) {
          // Gravity acceleration
          if (p.gravity > 0) {
            part.vy += p.gravity * 0.25 * dt * 60;
          }

          // Friction/drag slowing factor
          if (p.friction > 0) {
            part.vx *= (1 - p.friction * 0.25 * dt * 60);
            part.vy *= (1 - p.friction * 0.25 * dt * 60);
          }
        }

        // B. Apply Intermolecular Attraction (Van der Waals attractive term 'a')
        if (p.gasPreset === "real" && p.attractiveForce > 0) {
          const attractionStrength = p.attractiveForce * 0.12;
          const attractionCutoff = 40; // px
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              const pi = list[i];
              const pj = list[j];
              const dx = pj.x - pi.x;
              const dy = pj.y - pi.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist > pi.radius + pj.radius && dist < attractionCutoff) {
                const force = attractionStrength * (attractionCutoff - dist) / dist;
                const ax = force * dx;
                const ay = force * dy;
                pi.vx += (ax / pi.mass) * dt;
                pi.vy += (ay / pi.mass) * dt;
                pj.vx -= (ax / pj.mass) * dt;
                pj.vy -= (ay / pj.mass) * dt;
              }
            }
          }
        }

        // C. Move particles and check boundary collisions
        let wallCollisionsMomentum = 0;
        const pistonX = bounds.xMax;
        const chamberW = bounds.xMax - bounds.xMin;

        for (const part of list) {
          part.x += part.vx * dt * 60; 
          part.y += part.vy * dt * 60;

          // 1. Left Wall
          if (part.x < bounds.xMin + part.radius) {
            part.x = bounds.xMin + part.radius;
            part.vx = Math.abs(part.vx) * p.elasticity;
            wallCollisionsMomentum += 2 * part.mass * Math.abs(part.vx);
            playCollisionAudio();
            collisionRateCounterRef.current++;
            if (p.showCollisionRings) {
              collisionRingsRef.current.push({ x: bounds.xMin, y: part.y, radius: 2, maxRadius: 12, opacity: 0.8 });
            }
            if (part.color === "#ec4899" && p.particleMode === "mean-free-path") {
              mfpPointsRef.current.push({ x: part.x, y: part.y });
              if (mfpPointsRef.current.length > 15) mfpPointsRef.current.shift();
            }
          }

          // 2. Right Wall (Piston)
          if (part.x > pistonX - part.radius) {
            part.x = pistonX - part.radius;
            part.vx = -Math.abs(part.vx) * p.elasticity;
            wallCollisionsMomentum += 2 * part.mass * Math.abs(part.vx);
            playCollisionAudio();
            collisionRateCounterRef.current++;
            if (p.showCollisionRings) {
              collisionRingsRef.current.push({ x: pistonX, y: part.y, radius: 2, maxRadius: 12, opacity: 0.8 });
            }
            if (part.color === "#ec4899" && p.particleMode === "mean-free-path") {
              mfpPointsRef.current.push({ x: part.x, y: part.y });
              if (mfpPointsRef.current.length > 15) mfpPointsRef.current.shift();
            }
          }

          // 3. Top Wall
          if (part.y < bounds.yMin + part.radius) {
            part.y = bounds.yMin + part.radius;
            part.vy = Math.abs(part.vy) * p.elasticity;
            wallCollisionsMomentum += 2 * part.mass * Math.abs(part.vy);
            playCollisionAudio();
            collisionRateCounterRef.current++;
            if (p.showCollisionRings) {
              collisionRingsRef.current.push({ x: part.x, y: bounds.yMin, radius: 2, maxRadius: 12, opacity: 0.8 });
            }
            if (part.color === "#ec4899" && p.particleMode === "mean-free-path") {
              mfpPointsRef.current.push({ x: part.x, y: part.y });
              if (mfpPointsRef.current.length > 15) mfpPointsRef.current.shift();
            }
          }

          // 4. Bottom Wall (Heating/Cooling Plate)
          if (part.y > bounds.yMax - part.radius) {
            part.y = bounds.yMax - part.radius;
            part.vy = -Math.abs(part.vy) * p.elasticity;
            wallCollisionsMomentum += 2 * part.mass * Math.abs(part.vy);
            playCollisionAudio();
            collisionRateCounterRef.current++;
            if (p.showCollisionRings) {
              collisionRingsRef.current.push({ x: part.x, y: bounds.yMax, radius: 2, maxRadius: 12, opacity: 0.8 });
            }
            if (part.color === "#ec4899" && p.particleMode === "mean-free-path") {
              mfpPointsRef.current.push({ x: part.x, y: part.y });
              if (mfpPointsRef.current.length > 15) mfpPointsRef.current.shift();
            }
          }

          // ─── 5. DIFFUSION SLIDING BARRIER REFLECTION ──────────────────────
          if (p.particleMode === "diffusion") {
            const center = bounds.xMin + chamberW * 0.5;
            // Particles only reflect if they are below the slider gate Y position
            if (part.y > currentBarrierYRef.current) {
              const boundaryBuffer = part.radius + 1.5;
              if (Math.abs(part.x - center) < boundaryBuffer) {
                // If moving left-to-right
                if (part.vx > 0 && part.x < center) {
                  part.x = center - boundaryBuffer;
                  part.vx = -Math.abs(part.vx) * p.elasticity;
                } else if (part.vx < 0 && part.x > center) {
                  part.x = center + boundaryBuffer;
                  part.vx = Math.abs(part.vx) * p.elasticity;
                }
                playCollisionAudio();
                collisionRateCounterRef.current++;
                if (p.showCollisionRings) {
                  collisionRingsRef.current.push({ x: center, y: part.y, radius: 2, maxRadius: 10, opacity: 0.8 });
                }
              }
            }
          }

          // ─── 6. ENTROPY LOW-ENTROPY CHAMBER CONSTRAINT ────────────────────
          if (p.particleMode === "entropy" && p.entropyConstraint) {
            const partitionX = bounds.xMin + chamberW * 0.4;
            if (part.x > partitionX - part.radius) {
              part.x = partitionX - part.radius;
              part.vx = -Math.abs(part.vx) * p.elasticity;
              playCollisionAudio();
              collisionRateCounterRef.current++;
              if (p.showCollisionRings) {
                collisionRingsRef.current.push({ x: partitionX, y: part.y, radius: 2, maxRadius: 10, opacity: 0.8 });
              }
            }
          }
        }

        // Accumulate momentum transfers for pressure computation
        momentumAccumulatorRef.current += wallCollisionsMomentum;
        momentumTimerRef.current += dt;

        // D. Resolve Particle-Particle collisions elastically (hard sphere exclusion 'b')
        const collisionsEnabled = p.enableCollisions || p.gasPreset === "real" || p.gasPreset === "xenon" || p.particleMode === "brownian";
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
                const nx = dx / dist;
                const ny = dy / dist;

                const kx = pi.vx - pj.vx;
                const ky = pi.vy - pj.vy;
                const vn = kx * nx + ky * ny;

                if (vn > 0) {
                  const impulse = (2 * vn) / (pi.mass + pj.mass);
                  
                  // Apply velocity swap elastically, factoring in restitution elasticity
                  pi.vx = (pi.vx - impulse * pj.mass * nx) * p.elasticity;
                  pi.vy = (pi.vy - impulse * pj.mass * ny) * p.elasticity;
                  pj.vx = (pj.vx + impulse * pi.mass * nx) * p.elasticity;
                  pj.vy = (pj.vy + impulse * pi.mass * ny) * p.elasticity;
                  
                  playCollisionAudio();
                  collisionRateCounterRef.current++;

                  if (p.showCollisionRings) {
                    const cx = pi.x + nx * pi.radius;
                    const cy = pi.y + ny * pi.radius;
                    collisionRingsRef.current.push({ x: cx, y: cy, radius: 2, maxRadius: 12, opacity: 0.8 });
                  }

                  // MFP highlight check
                  if ((pi.color === "#ec4899" || pj.color === "#ec4899") && p.particleMode === "mean-free-path") {
                    const pTest = pi.color === "#ec4899" ? pi : pj;
                    mfpPointsRef.current.push({ x: pTest.x, y: pTest.y });
                    if (mfpPointsRef.current.length > 15) mfpPointsRef.current.shift();
                  }
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

        // E. Thermostat scaling (Berendsen Thermostat style)
        // Adjusts speed coordinates to match the target temperature
        let totalKE = 0;
        for (const part of list) {
          totalKE += 0.5 * part.mass * (part.vx*part.vx + part.vy*part.vy);
        }
        
        const targetKE = list.length * kb_micro * p.temperature;
        if (totalKE > 0) {
          const thermostatCoeff = 0.08; 
          const scale = Math.sqrt(1 + (targetKE / totalKE - 1) * thermostatCoeff);
          for (const part of list) {
            part.vx *= scale;
            part.vy *= scale;
            
            // Speed limiter to prevent tunneling
            const speed = Math.sqrt(part.vx*part.vx + part.vy*part.vy);
            const speedCap = 250;
            if (speed > speedCap) {
              part.vx = (part.vx / speed) * speedCap;
              part.vy = (part.vy / speed) * speedCap;
            }
          }
        }

        // Accumulate visual particle trails if enabled
        if (p.showTrails) {
          for (const part of list) {
            part.history.push({ x: part.x, y: part.y });
            if (part.history.length > 8) {
              part.history.shift();
            }
          }
        } else {
          for (const part of list) {
            part.history = [];
          }
        }

        // F. Brownian macroparticle displacement updates
        if (p.particleMode === "brownian" && list.length > 0) {
          const macro = list[0]; // index 0 is always macro
          if (tickCount % 8 === 0) {
            brownianPathRef.current.push({ x: macro.x, y: macro.y });
            if (brownianPathRef.current.length > 180) {
              brownianPathRef.current.shift();
            }
          }
        }
      }

      // ─── TELEMETRY & DATA ANALYSIS ─────────────────────────────
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
      const measuredTemp = list.length > 0 ? currentKE / (list.length * kb_micro) : 0;
      const meanSpeed = list.length > 0 ? sumSpeed / list.length : 0;

      // Measured Pressure from wall collisions
      let measuredPressure = 0;
      if (momentumTimerRef.current > 0.08) {
        const perimeter = 2 * (currentWidth + currentHeight);
        const pMeasuredRaw = (momentumAccumulatorRef.current / momentumTimerRef.current) / perimeter;
        const pMeasuredScaled = pMeasuredRaw * 55.0;

        momentumAccumulatorRef.current = 0;
        momentumTimerRef.current = 0;

        const smoothFactor = 0.15;
        const lastPressure = pressureHistoryRef.current.length > 0 
          ? pressureHistoryRef.current[pressureHistoryRef.current.length - 1].p 
          : pMeasuredScaled;
        const pSmoothed = lastPressure + (pMeasuredScaled - lastPressure) * smoothFactor;

        pressureHistoryRef.current.push({ t: now, p: pSmoothed });
        if (pressureHistoryRef.current.length > 200) pressureHistoryRef.current.shift();

        pvHistoryRef.current.push({ v: measuredVolume, p: pSmoothed });
        if (pvHistoryRef.current.length > 300) pvHistoryRef.current.shift();
      }
      
      if (pressureHistoryRef.current.length > 0) {
        measuredPressure = pressureHistoryRef.current[pressureHistoryRef.current.length - 1].p;
      } else {
        measuredPressure = (list.length * 0.05 * p.temperature) / measuredVolume;
      }

      // Theoretical Ideal Pressure
      const idealPressure = (list.length * 0.05 * p.temperature) / measuredVolume;

      // Van der Waals Theoretical Pressure
      let a_coeff = 0;
      let b_coeff = 0;
      if (p.gasPreset === "real") {
        a_coeff = p.attractiveForce * 1.5;
        b_coeff = 0.015; 
      } else if (p.gasPreset === "xenon") {
        a_coeff = 0;
        b_coeff = 0.022; 
      }
      const vdwDenominator = measuredVolume - list.length * b_coeff;
      const vanDerWaalsPressure = vdwDenominator > 0
        ? (list.length * 0.05 * p.temperature) / vdwDenominator - (a_coeff * list.length * list.length) / (measuredVolume * measuredVolume)
        : idealPressure;

      // Speed Histogram
      const binCount = 15;
      const speedHistogram = new Array(binCount).fill(0);
      const maxSpeed = 160; 
      if (list.length > 0) {
        for (const speed of speeds) {
          const binIndex = Math.min(binCount - 1, Math.floor((speed / maxSpeed) * binCount));
          speedHistogram[binIndex]++;
        }
      }

      // ─── ENTROPY (SHANNON SPATIAL ENTROPY) ──────────────────────────
      const gridCellsCount = 6; // 6x6 grid
      const totalCells = gridCellsCount * gridCellsCount;
      const cellCounts = new Array(totalCells).fill(0);
      const cellW = currentWidth / gridCellsCount;
      const cellH = currentHeight / gridCellsCount;

      for (const part of list) {
        const cx = Math.max(0, Math.min(gridCellsCount - 1, Math.floor((part.x - bounds.xMin) / cellW)));
        const cy = Math.max(0, Math.min(gridCellsCount - 1, Math.floor((part.y - bounds.yMin) / cellH)));
        cellCounts[cy * gridCellsCount + cx]++;
      }

      let entropy = 0;
      const totalParticles = list.length || 1;
      for (const cnt of cellCounts) {
        if (cnt > 0) {
          const pVal = cnt / totalParticles;
          entropy -= pVal * Math.log(pVal);
        }
      }
      const entropyMax = Math.log(totalCells); // ln(36) ~ 3.58

      // ─── DIFFUSION MIXING RATE ──────────────────────────────────────
      let diffusionMixing = 0;
      if (p.particleMode === "diffusion") {
        const center = bounds.xMin + currentWidth * 0.5;
        let leftBlue = 0, leftOrange = 0;
        let rightBlue = 0, rightOrange = 0;

        for (const part of list) {
          const isLeft = part.x < center;
          const isBlue = part.color === "#3b82f6";
          if (isLeft) {
            if (isBlue) leftBlue++;
            else leftOrange++;
          } else {
            if (isBlue) rightBlue++;
            else rightOrange++;
          }
        }
        
        const totalBlue = leftBlue + rightBlue || 1;
        const totalOrange = leftOrange + rightOrange || 1;
        
        // 0% mixing is fully separated. 100% mixing is 50/50 ratio
        const leftBluePct = leftBlue / totalBlue;
        const leftOrangePct = leftOrange / totalOrange;
        const diffIndex = Math.abs(leftBluePct - 0.5) + Math.abs(leftOrangePct - 0.5);
        diffusionMixing = Math.max(0, Math.min(100, (1 - diffIndex) * 100));
      }

      // ─── MEAN FREE PATH CALCULATOR ──────────────────────────────────
      let meanFreePath = 0;
      if (p.particleMode === "mean-free-path" && mfpPointsRef.current.length > 1) {
        let sumDist = 0;
        const pts = mfpPointsRef.current;
        for (let i = 1; i < pts.length; i++) {
          const dx = pts[i].x - pts[i-1].x;
          const dy = pts[i].y - pts[i-1].y;
          sumDist += Math.sqrt(dx*dx + dy*dy);
        }
        meanFreePath = sumDist / (pts.length - 1);
      }

      // ─── COLLISION FREQUENCY ────────────────────────────────────────
      if (collisionRateTimerRef.current > 1.0) {
        collisionRateHistoryRef.current = Math.round(collisionRateCounterRef.current / collisionRateTimerRef.current);
        collisionRateCounterRef.current = 0;
        collisionRateTimerRef.current = 0;
      }
      const collisionCount = collisionRateHistoryRef.current;

      // Dispatch state updates to parent
      if (now - lastStateUpdateRef.current > 60) {
        onStateUpdateRef.current({
          measuredPressure,
          idealPressure,
          measuredTemp,
          measuredVolume,
          particlesEscaped: 0,
          meanSpeed,
          vanDerWaalsPressure,
          speedHistogram,
          temperatureTarget: p.temperature,
          entropy,
          entropyMax,
          diffusionMixing,
          meanFreePath,
          collisionCount
        });
        lastStateUpdateRef.current = now;
      }

      // ─── RENDERING ──────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);

      // 1. Draw dashboard grid backdrop
      ctx.strokeStyle = "#161618";
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      for (let gx = 0; gx < w; gx += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      // 2. Draw Quadrant dividers
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

      // 3. Draw Compartment background
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(bounds.xMin, bounds.yMin, currentWidth, currentHeight);

      // 4. Heat-Map density overlay
      if (p.showHeatMap && list.length > 0) {
        const hmGridX = 10;
        const hmGridY = 10;
        const hmCellW = currentWidth / hmGridX;
        const hmCellH = currentHeight / hmGridY;
        const hmCounts = new Array(hmGridX * hmGridY).fill(0);

        for (const part of list) {
          const cx = Math.max(0, Math.min(hmGridX - 1, Math.floor((part.x - bounds.xMin) / hmCellW)));
          const cy = Math.max(0, Math.min(hmGridY - 1, Math.floor((part.y - bounds.yMin) / hmCellH)));
          hmCounts[cy * hmGridX + cx]++;
        }

        const maxCount = Math.max(1, ...hmCounts);
        for (let cy = 0; cy < hmGridY; cy++) {
          for (let cx = 0; cx < hmGridX; cx++) {
            const idx = cy * hmGridX + cx;
            const cnt = hmCounts[idx];
            if (cnt > 0) {
              const intensity = cnt / (maxCount * 1.1);
              ctx.fillStyle = `rgba(6, 182, 212, ${intensity * 0.35})`; 
              ctx.fillRect(bounds.xMin + cx * hmCellW + 1, bounds.yMin + cy * hmCellH + 1, hmCellW - 2, hmCellH - 2);
            }
          }
        }
      }

      // 5. Heating/cooling coil bottom plate color
      const heatFraction = Math.min(1.0, Math.max(0.0, (p.temperature - 100) / 700));
      const rCoil = Math.floor(60 + heatFraction * 195);
      const gCoil = Math.floor(80 + (1.0 - heatFraction) * 80 + heatFraction * 30);
      const bCoil = Math.floor(180 + (1.0 - heatFraction) * 75 - heatFraction * 180);

      ctx.fillStyle = `rgb(${rCoil}, ${gCoil}, ${bCoil})`;
      ctx.fillRect(bounds.xMin, bounds.yMax, currentWidth, 6);
      
      const coilGlow = ctx.createLinearGradient(0, bounds.yMax, 0, bounds.yMax - 30);
      coilGlow.addColorStop(0, `rgba(${rCoil}, ${gCoil}, ${bCoil}, 0.25)`);
      coilGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coilGlow;
      ctx.fillRect(bounds.xMin, bounds.yMax - 30, currentWidth, 30);

      // 6. Draw Chamber borders (excluding sliding right wall)
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, bounds.yMin);
      ctx.lineTo(bounds.xMin, bounds.yMin);
      ctx.lineTo(bounds.xMin, bounds.yMax);
      ctx.stroke();

      // 7. Draw Entropy Boundary Constraint line
      if (p.particleMode === "entropy" && p.entropyConstraint) {
        const partitionX = bounds.xMin + currentWidth * 0.4;
        ctx.strokeStyle = "rgba(249, 115, 22, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(partitionX, bounds.yMin);
        ctx.lineTo(partitionX, bounds.yMax);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = "rgba(249, 115, 22, 0.6)";
        ctx.font = `9px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText("PARTITION CONSTRAINED", partitionX, bounds.yMin + 25);
      }

      // 8. Draw sliding barrier in Diffusion mode
      if (p.particleMode === "diffusion") {
        const center = bounds.xMin + currentWidth * 0.5;
        
        // Barrier line
        ctx.strokeStyle = p.barrierOpen ? "rgba(16, 185, 129, 0.2)" : "#10b981";
        ctx.lineWidth = 3;
        if (p.barrierOpen) {
          ctx.setLineDash([4, 6]);
        }
        ctx.beginPath();
        ctx.moveTo(center, currentBarrierYRef.current);
        ctx.lineTo(center, bounds.yMax);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sliding Gate handle at top of gate
        ctx.fillStyle = "#10b981";
        ctx.fillRect(center - 5, currentBarrierYRef.current - 4, 10, 8);

        ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(p.barrierOpen ? "GATE OPEN" : "GATE CLOSED", center, bounds.yMin + 20);
      }

      // 9. Draw Particle trails (motion blur)
      if (p.showTrails) {
        ctx.lineWidth = 1;
        for (const part of list) {
          if (part.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(part.history[0].x, part.history[0].y);
            for (let i = 1; i < part.history.length; i++) {
              ctx.lineTo(part.history[i].x, part.history[i].y);
            }
            ctx.strokeStyle = part.color.replace("rgb", "rgba").replace(")", ", 0.15)");
            ctx.stroke();
          }
        }
      }

      // 10. Draw Particles
      for (const part of list) {
        // Normal color mapping by kinetic energy
        let finalColor = part.color;
        if (p.particleMode !== "diffusion" && part.color !== "#ec4899" && part.color !== "#eab308") {
          const speed = Math.sqrt(part.vx*part.vx + part.vy*part.vy);
          const targetSpeed = Math.sqrt((2 * kb_micro * p.temperature) / part.mass);
          const fraction = Math.min(1.5, speed / (targetSpeed * 1.5 || 1));
          
          const rPart = Math.floor(80 + fraction * 175);
          const gPart = Math.floor(220 * (1 - Math.abs(fraction - 0.7)) + 40);
          const bPart = Math.floor(240 * (1 - fraction) + 40);
          finalColor = `rgb(${rPart}, ${gPart}, ${bPart})`;
        }
        
        ctx.fillStyle = finalColor;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 11. Draw Brownian Trajectory path
      if (p.particleMode === "brownian" && brownianPathRef.current.length > 1) {
        ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(brownianPathRef.current[0].x, brownianPathRef.current[0].y);
        for (let i = 1; i < brownianPathRef.current.length; i++) {
          ctx.lineTo(brownianPathRef.current[i].x, brownianPathRef.current[i].y);
        }
        ctx.stroke();

        // Draw start location indicator
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(brownianStartRef.current.x, brownianStartRef.current.y, 6, 0, 2*Math.PI);
        ctx.stroke();
      }

      // 12. Draw Mean Free Path collision links
      if (p.particleMode === "mean-free-path" && mfpPointsRef.current.length > 0) {
        ctx.strokeStyle = "rgba(236, 72, 153, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mfpPointsRef.current[0].x, mfpPointsRef.current[0].y);
        for (let i = 1; i < mfpPointsRef.current.length; i++) {
          ctx.lineTo(mfpPointsRef.current[i].x, mfpPointsRef.current[i].y);
        }
        ctx.stroke();

        // Draw circles at collision points
        ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
        for (const pt of mfpPointsRef.current) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, 2*Math.PI);
          ctx.fill();
        }

        // Highlight active particle indicator ring
        if (list.length > 0) {
          const p0 = list[0];
          ctx.strokeStyle = "#ec4899";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p0.x, p0.y, p0.radius + 6, 0, 2*Math.PI);
          ctx.stroke();
        }
      }

      // 13. Draw Collision Wavelet rings
      if (p.showCollisionRings) {
        collisionRingsRef.current = collisionRingsRef.current.filter(ring => {
          ring.radius += 1.5;
          ring.opacity -= 0.08;
          if (ring.opacity > 0) {
            ctx.strokeStyle = `rgba(236, 72, 153, ${ring.opacity})`; 
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.radius, 0, 2*Math.PI);
            ctx.stroke();
            return true;
          }
          return false;
        });
      }

      // 14. Draw Piston (draggable right wall)
      ctx.strokeStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "#10b981" : "#52525b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, bounds.yMin - 1);
      ctx.lineTo(bounds.xMax, bounds.yMax + 1);
      ctx.stroke();

      ctx.strokeStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "rgba(16, 185, 129, 0.4)" : "#3f3f46";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, (bounds.yMin + bounds.yMax) / 2);
      ctx.lineTo(bounds.xMax + 20, (bounds.yMin + bounds.yMax) / 2);
      ctx.stroke();

      ctx.fillStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "#10b981" : "#52525b";
      ctx.fillRect(bounds.xMax + 20, (bounds.yMin + bounds.yMax) / 2 - 15, 6, 30);

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

      if (p.particleMode === "entropy") {
        ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
        ctx.fillText(`Entropy S = ${entropy.toFixed(3)}`, bounds.xMin + 10, bounds.yMin + 70);
      } else if (p.particleMode === "diffusion") {
        ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
        ctx.fillText(`Mixing = ${diffusionMixing.toFixed(1)}%`, bounds.xMin + 10, bounds.yMin + 70);
      } else if (p.particleMode === "mean-free-path") {
        ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
        ctx.fillText(`Mean Free Path λ = ${meanFreePath.toFixed(1)} px`, bounds.xMin + 10, bounds.yMin + 70);
      } else if (p.particleMode === "brownian" && list.length > 0) {
        const macro = list[0];
        const dx = macro.x - brownianStartRef.current.x;
        const dy = macro.y - brownianStartRef.current.y;
        const msd = dx*dx + dy*dy;
        ctx.fillStyle = "rgba(234, 179, 8, 0.8)";
        ctx.fillText(`Displacement r² = ${Math.round(msd)} px²`, bounds.xMin + 10, bounds.yMin + 70);
      }

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

      // Draw Ideal Gas reference hyperbolas
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1.5;
      const tempsRef = [200, 400, 600];
      const vMin = 3.0;
      const vMax = 10.0;
      const pMax = 800; 

      for (const tRef of tempsRef) {
        ctx.beginPath();
        for (let vx = 0; vx <= graphW; vx += 5) {
          const volPct = vx / graphW; 
          const volValue = vMin + volPct * (vMax - vMin);
          const idealPVal = (list.length * 0.05 * tRef) / volValue;
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
        const barH = (count / (maxHistogramCount * 1.2)) * mbH; 
        const bx = mbX + i * barW;
        const by = mbY + mbH - barH;
        ctx.fillRect(bx + 1, by, barW - 2, barH);
        ctx.strokeRect(bx + 1, by, barW - 2, barH);
      }

      // Draw theoretical Maxwell-Boltzmann curve overlay
      ctx.strokeStyle = "#ec4899"; 
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const massVal = list.length > 0 ? list[0].mass : 1.0;

      for (let vx = 0; vx <= mbW; vx += 2) {
        const speed = (vx / mbW) * maxSpeed;
        const exponent = -(massVal * speed * speed) / (2 * kb_micro * p.temperature);
        const f_v = (massVal * speed / (kb_micro * p.temperature)) * Math.exp(exponent);
        
        const peakHeight = Math.sqrt(massVal / (Math.E * kb_micro * p.temperature));
        const yFraction = f_v / (peakHeight || 1);
        const py = mbY + mbH - yFraction * mbH * 0.75; 

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
      resizeObserver.disconnect();
    };
  }, [isPlaying, slowMotion]);

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

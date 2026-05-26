"use client";

import React, { useRef, useEffect } from "react";
import { GasEngine, Particle } from "@/lib/physics/engine";
import { ThermodynamicsAnalyzer } from "@/lib/physics/thermodynamics";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { PVGraph } from "./graphs/PVGraph";
import { MaxwellBoltzmannGraph } from "./graphs/MaxwellBoltzmannGraph";

const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

interface GasLawsCanvasProps {
  temperature: number;      
  volume: number;           
  particleCount: number;    
  regime: "free" | "boyle" | "charles" | "gay-lussac" | "avogadro";
  gasPreset: "ideal" | "helium" | "xenon" | "real";
  enableCollisions: boolean;
  attractiveForce: number;  
  isPlaying: boolean;
  slowMotion: number;
  onVolumeChange: (vol: number) => void;
  resetTrigger: number;
  
  gravity: number;
  friction: number;
  elasticity: number;

  particleMode: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy";
  showTrails: boolean;
  showHeatMap: boolean;
  enableSound: boolean;
  showCollisionRings: boolean;
  barrierOpen: boolean;
  entropyConstraint: boolean;
}

export const GasLawsCanvas: React.FC<GasLawsCanvasProps> = ({
  temperature, volume, particleCount, regime, gasPreset, 
  attractiveForce, isPlaying, slowMotion, onVolumeChange, 
  resetTrigger, gravity, friction, elasticity,
  particleMode, showTrails, showHeatMap,
  enableSound, showCollisionRings, barrierOpen, entropyConstraint
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const engineRef = useRef<GasEngine>(new GasEngine());
  const thermoRef = useRef<ThermodynamicsAnalyzer>(new ThermodynamicsAnalyzer());
  const currentBarrierYRef = useRef<number>(50);

  const setTelemetry = useGasLawsStore(state => state.setTelemetry);
  const setPvHistory = useGasLawsStore(state => state.setPvHistory);

  // Configuration References
  const paramsRef = useRef({
    temperature, volume, particleCount, regime, gasPreset, 
    attractiveForce, isPlaying, slowMotion, gravity, friction, 
    elasticity, particleMode, showTrails, showHeatMap,
    enableSound, showCollisionRings, barrierOpen, entropyConstraint
  });

  useEffect(() => {
    paramsRef.current = {
      temperature, volume, particleCount, regime, gasPreset, 
      attractiveForce, isPlaying, slowMotion, gravity, friction, 
      elasticity, particleMode, showTrails, showHeatMap,
      enableSound, showCollisionRings, barrierOpen, entropyConstraint
    };
  }, [
    temperature, volume, particleCount, regime, gasPreset, attractiveForce, 
    isPlaying, slowMotion, gravity, friction, elasticity, particleMode, 
    showTrails, showHeatMap, enableSound, showCollisionRings, barrierOpen, 
    entropyConstraint
  ]);

  const chamberBounds = useRef({ xMin: 40, xMax: 400, yMin: 50, yMax: 350 });
  const targetWidthRef = useRef<number>(400);
  const prevXMaxRef = useRef<number>(400);
  const isDraggingPistonRef = useRef<boolean>(false);
  const hoverPistonRef = useRef<boolean>(false);

  const getLayoutDimensions = () => {
    const container = containerRef.current;
    const w = container ? container.clientWidth : 800;
    const h = container ? container.clientHeight : 500;
    const midX = w * 0.62;
    const xMin = 40;
    const maxX = midX - 60; 
    const yMin = 50;
    const yMax = h - 60; 
    return { w, h, midX, xMin, maxX, yMin, yMax };
  };

  const initParticles = () => {
    const p = paramsRef.current;
    const { xMin, maxX, yMin, yMax } = getLayoutDimensions();
    const targetXMax = xMin + (maxX - xMin) * p.volume;
    chamberBounds.current = { xMin, xMax: targetXMax, yMin, yMax };
    targetWidthRef.current = targetXMax;
    prevXMaxRef.current = targetXMax;
    currentBarrierYRef.current = yMin; // fully closed barrier by default

    // Physical mass in kg (like Argon 6.63e-26 kg) and physical radius in meters
    let mass = 6.63e-26; 
    let radius = 4.0e-9; 
    if (p.gasPreset === "helium") { 
      mass = 6.64e-27; 
      radius = 3.0e-9; 
    } else if (p.gasPreset === "xenon") { 
      mass = 2.18e-25; 
      radius = 8.5e-9; 
    } else if (p.gasPreset === "real") { 
      mass = 6.63e-26; 
      radius = 6.0e-9; 
    }

    const sampleThermalVelocity = (m: number, temp: number) => {
      const stdDev = Math.sqrt((GasEngine.K_B * temp) / m);
      const randomNormal = () => {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };
      return {
        vx: randomNormal() * stdDev,
        vy: randomNormal() * stdDev,
        vz: randomNormal() * stdDev
      };
    };

    const list: Particle[] = [];

    if (p.particleMode === "brownian") {
      const macroX = xMin + (targetXMax - xMin) * 0.5;
      const macroY = yMin + (yMax - yMin) * 0.5;
      
      // Macro particle
      const macroVel = sampleThermalVelocity(1.99e-24, p.temperature);
      list.push({
        id: 0, x: macroX * 1e-9, y: macroY * 1e-9,
        vx: macroVel.vx * 0.2, vy: macroVel.vy * 0.2, vz: macroVel.vz * 0.2,
        mass: 1.99e-24, radius: 24.0e-9, color: "#eab308"
      });

      // Micro particles
      const microCount = Math.max(30, Math.min(180, p.particleCount));
      const microRadius = 2.5e-9;
      const microMass = 2.65e-26;
      for (let i = 1; i <= microCount; i++) {
        let x = 0, y = 0, overlap = true, safety = 0;
        while (overlap && safety < 100) {
          x = xMin + 2.5 + Math.random() * (targetXMax - xMin - 5);
          y = yMin + 2.5 + Math.random() * (yMax - yMin - 5);
          overlap = false;
          // Check overlap with macro in pixel coords
          const dx = x - macroX;
          const dy = y - macroY;
          if (dx*dx + dy*dy < (24.0 + 2.5 + 5)**2) { overlap = true; }
          // Check overlap with other micros
          if (!overlap) {
            for (const other of list) {
              const odx = x - (other.x / 1e-9); 
              const ody = y - (other.y / 1e-9);
              if (odx*odx + ody*ody < (2.5 + (other.radius / 1e-9) + 1)**2) { overlap = true; break; }
            }
          }
          safety++;
        }
        const microVel = sampleThermalVelocity(microMass, p.temperature);
        list.push({
          id: i, x: x * 1e-9, y: y * 1e-9,
          vx: microVel.vx, vy: microVel.vy, vz: microVel.vz,
          mass: microMass, radius: microRadius, color: "rgba(255, 255, 255, 0.45)"
        });
      }
    } else if (p.particleMode === "diffusion") {
      const center = xMin + (targetXMax - xMin) * 0.5;
      const radiusPx = radius / 1e-9;
      for (let i = 0; i < p.particleCount; i++) {
        const isBlue = i < p.particleCount / 2;
        let x = 0, y = 0, overlap = true, safety = 0;
        while (overlap && safety < 100) {
          if (isBlue) {
            x = xMin + radiusPx + Math.random() * (center - xMin - 2 * radiusPx - 5);
          } else {
            x = center + 5 + radiusPx + Math.random() * (targetXMax - center - 2 * radiusPx - 5);
          }
          y = yMin + radiusPx + Math.random() * (yMax - yMin - 2 * radiusPx);
          overlap = false;
          for (const other of list) {
            const dx = x - (other.x / 1e-9); 
            const dy = y - (other.y / 1e-9);
            if (dx*dx + dy*dy < (radiusPx + (other.radius / 1e-9) + 1)**2) { overlap = true; break; }
          }
          safety++;
        }
        const vel = sampleThermalVelocity(mass, p.temperature);
        list.push({
          id: i, x: x * 1e-9, y: y * 1e-9,
          vx: vel.vx, vy: vel.vy, vz: vel.vz,
          mass, radius, color: isBlue ? "rgb(59, 130, 246)" : "rgb(249, 115, 22)"
        });
      }
    } else {
      // Normal, mean-free-path, entropy
      const radiusPx = radius / 1e-9;
      for (let i = 0; i < p.particleCount; i++) {
        const isMFPTracer = p.particleMode === "mean-free-path" && i === 0;
        const pRadius = isMFPTracer ? 7.5e-9 : radius;
        const pRadiusPx = pRadius / 1e-9;
        const pMass = isMFPTracer ? 6.63e-26 : mass;
        const pColor = isMFPTracer ? "rgb(236, 72, 153)" : "rgb(16, 185, 129)";

        // If entropy constraint is checked, restrict initial spawn to left 40%
        const spawnMaxX = p.entropyConstraint && p.particleMode === "entropy"
          ? xMin + (targetXMax - xMin) * 0.4
          : targetXMax;

        let x = 0, y = 0, overlap = true, safety = 0;
        while (overlap && safety < 100) {
          x = xMin + pRadiusPx + Math.random() * (spawnMaxX - xMin - 2 * pRadiusPx);
          y = yMin + pRadiusPx + Math.random() * (yMax - yMin - 2 * pRadiusPx);
          overlap = false;
          for (const other of list) {
            const dx = x - (other.x / 1e-9); 
            const dy = y - (other.y / 1e-9);
            if (dx*dx + dy*dy < (pRadiusPx + (other.radius / 1e-9) + 1)**2) { overlap = true; break; }
          }
          safety++;
        }
        const vel = sampleThermalVelocity(pMass, p.temperature);
        list.push({
          id: i, x: x * 1e-9, y: y * 1e-9,
          vx: vel.vx, vy: vel.vy, vz: vel.vz,
          mass: pMass, radius: pRadius, color: pColor
        });
      }
    }

    engineRef.current.setParticles(list);
    thermoRef.current = new ThermodynamicsAnalyzer();
  };

  useEffect(() => {
    initParticles();
  }, [resetTrigger, particleCount, gasPreset, particleMode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const p = paramsRef.current;
    if ((p.regime === "free" || p.regime === "boyle") && Math.abs(x - chamberBounds.current.xMax) < 15) {
      isDraggingPistonRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const bounds = chamberBounds.current;
    const p = paramsRef.current;
    const { xMin, maxX } = getLayoutDimensions();
    
    if ((p.regime === "free" || p.regime === "boyle") && Math.abs(x - bounds.xMax) < 15) {
      hoverPistonRef.current = true;
      canvasRef.current.style.cursor = "col-resize";
    } else {
      hoverPistonRef.current = false;
      canvasRef.current.style.cursor = "default";
    }

    if (isDraggingPistonRef.current) {
      const minX = xMin + 80;
      bounds.xMax = Math.max(minX, Math.min(maxX, x));
      targetWidthRef.current = bounds.xMax;
      const volFraction = (bounds.xMax - xMin) / (maxX - xMin);
      onVolumeChange(Math.max(0.1, Math.min(1.0, volFraction)));
    }
  };

  const handleMouseUp = () => { isDraggingPistonRef.current = false; };

  // Main Render Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let lastTelemetryTime = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    const tick = (now: number) => {
      const p = paramsRef.current;
      const dt_wall = Math.min(0.03, (now - lastTime) / 1000); 
      lastTime = now;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) { animationId = requestAnimationFrame(tick); return; }

      const { midX, xMin, maxX, yMin, yMax } = getLayoutDimensions();
      const bounds = chamberBounds.current;
      
      // Update boundaries based on regime
      if (p.regime === "charles") {
        targetWidthRef.current = xMin + (maxX - xMin) * Math.max(0.2, Math.min(1.0, 0.5 * (p.temperature / 300)));
      } else if (p.regime === "avogadro") {
        targetWidthRef.current = xMin + (maxX - xMin) * Math.max(0.2, Math.min(1.0, 0.5 * (p.particleCount / 100)));
      } else if (p.regime === "gay-lussac" || p.regime === "free") {
        targetWidthRef.current = xMin + (maxX - xMin) * p.volume;
      }
      if (!isDraggingPistonRef.current) {
        bounds.xMax += (targetWidthRef.current - bounds.xMax) * 0.08;
      }

      // Animate slider gate in diffusion mode
      const targetBarrierY = p.barrierOpen ? yMin : yMax;
      currentBarrierYRef.current += (targetBarrierY - currentBarrierYRef.current) * 0.08;

      // PHYSICS STEP
      if (p.isPlaying) {
         const dt_phy = dt_wall * p.slowMotion * GasEngine.TIME_SCALE;
         const pistonVel = dt_phy > 0 ? (bounds.xMax - prevXMaxRef.current) * 1e-9 / dt_phy : 0;

         const config = {
             temperature: p.temperature,
             elasticity: p.elasticity,
             gravity: p.gravity,
             friction: p.friction,
             attractiveForce: p.gasPreset === "real" ? p.attractiveForce : 0,
             dt: dt_phy,
             particleMode: p.particleMode,
             barrierY: currentBarrierYRef.current * 1e-9, // in meters (SI)
             entropyConstraint: p.entropyConstraint,
             pistonVel: pistonVel
         };
         
         const { momentumTransferred, collisionCount } = engineRef.current.step(config, {
             xMin: bounds.xMin * 1e-9, 
             xMax: bounds.xMax * 1e-9, 
             yMin: bounds.yMin * 1e-9, 
             yMax: bounds.yMax * 1e-9
         });

         thermoRef.current.registerFrameCollisions(momentumTransferred, collisionCount, config.dt);
      }

      // TELEMETRY ANALYSIS
      const currentWidth = bounds.xMax - bounds.xMin;
      const currentHeight = bounds.yMax - bounds.yMin;
      const telemetry = thermoRef.current.analyze(
          engineRef.current.getParticles(), 
          p.temperature, 
          currentWidth * 1e-9, 
          currentHeight * 1e-9, 
          now,
          bounds.xMin * 1e-9,
          p.particleMode,
          p.gasPreset,
          p.attractiveForce,
          engineRef.current.getMeanFreePath()
      );

      if (now - lastTelemetryTime > 60) {
          setTelemetry(telemetry);
          setPvHistory(thermoRef.current.getPVHistory());
          lastTelemetryTime = now;
      }

      // RENDERING CHAMBER
      ctx.clearRect(0, 0, w, h);
      
      // Grid Backdrop
      ctx.strokeStyle = "#161618";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

      // Divider
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();

      // Compartment
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(bounds.xMin, bounds.yMin, currentWidth, currentHeight);

      // Heat Map overlay
      if (p.showHeatMap) {
        ctx.fillStyle = "rgba(6, 182, 212, 0.05)";
        ctx.fillRect(bounds.xMin, bounds.yMin, currentWidth, currentHeight);
      }

      // Heating Coil Plate glow
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

      // Boundaries outline
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, bounds.yMin);
      ctx.lineTo(bounds.xMin, bounds.yMin);
      ctx.lineTo(bounds.xMin, bounds.yMax);
      ctx.stroke();

      // Draw Low-Entropy constraint partition line
      if (p.particleMode === "entropy" && p.entropyConstraint) {
        const partitionX = bounds.xMin + currentWidth * 0.4;
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(partitionX, bounds.yMin);
        ctx.lineTo(partitionX, bounds.yMax);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
        ctx.font = `9px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText("PARTITION CONSTRAINED", partitionX, bounds.yMin + 25);
      }

      // Draw sliding barrier in Diffusion mode
      if (p.particleMode === "diffusion") {
        const center = bounds.xMin + currentWidth * 0.5;
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

        // Sliding Gate handle
        ctx.fillStyle = "#10b981";
        ctx.fillRect(center - 5, currentBarrierYRef.current - 4, 10, 8);

        ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(p.barrierOpen ? "GATE OPEN" : "GATE CLOSED", center, bounds.yMin + 20);
      }

      // Draw Mean Free Path tracer links
      if (p.particleMode === "mean-free-path") {
        const mfpPts = engineRef.current.getMfpPoints();
        if (mfpPts.length > 0) {
          ctx.strokeStyle = "rgba(236, 72, 153, 0.55)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mfpPts[0].x / 1e-9, mfpPts[0].y / 1e-9);
          for (let i = 1; i < mfpPts.length; i++) {
            ctx.lineTo(mfpPts[i].x / 1e-9, mfpPts[i].y / 1e-9);
          }
          ctx.stroke();

          // circles at collision points
          ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
          for (let i = 0; i < mfpPts.length; i++) {
            ctx.beginPath();
            ctx.arc(mfpPts[i].x / 1e-9, mfpPts[i].y / 1e-9, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      // Render Particles in pixel space
      const particles = engineRef.current.getParticles();
      for (let i = 0; i < particles.length; i++) {
        const part = particles[i];
        
        let pColor = part.color;
        // Thermal coloring for normal / entropy modes
        if (p.particleMode === "normal" || p.particleMode === "entropy") {
          const speed = Math.sqrt(part.vx*part.vx + part.vy*part.vy + part.vz*part.vz);
          const targetSpeed = Math.sqrt((2 * GasEngine.K_B * p.temperature) / part.mass);
          const fraction = Math.min(1.5, speed / (targetSpeed * 1.5 || 1));
          
          const rPart = Math.floor(80 + fraction * 175);
          const gPart = Math.floor(220 * (1 - Math.abs(fraction - 0.7)) + 40);
          const bPart = Math.floor(240 * (1 - fraction) + 40);
          pColor = `rgb(${rPart}, ${gPart}, ${bPart})`;
        }
        
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(part.x / 1e-9, part.y / 1e-9, part.radius / 1e-9, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Piston
      ctx.strokeStyle = hoverPistonRef.current || isDraggingPistonRef.current ? "#10b981" : "#52525b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bounds.xMax, bounds.yMin - 1);
      ctx.lineTo(bounds.xMax, bounds.yMax + 1);
      ctx.stroke();
      
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `bold 9px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("PISTON", bounds.xMax + 10, bounds.yMin - 10);

      // Display educational disclaimer
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = `8px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("Rendered particles represent statistical samples, not actual molecule counts.", bounds.xMin, bounds.yMax + 20);

      animationId = requestAnimationFrame(tick);
      prevXMaxRef.current = bounds.xMax;
    };

    animationId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animationId); resizeObserver.disconnect(); };
  }, [isPlaying, slowMotion]);

  // Mass reference for graphs
  const massVal = engineRef.current.getParticles().length > 0 ? engineRef.current.getParticles()[0].mass : 1.0;

  return (
    <div ref={containerRef} className="w-full h-full min-h-[480px] relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block bg-[#09090b] absolute inset-0 z-0"
      />
      {/* Decoupled Graphs overlaying the canvas directly on the right side */}
      <div className="absolute top-0 right-0 h-full w-[38%] p-8 flex flex-col gap-8 pointer-events-none z-10">
          <div className="flex-1 relative bg-black/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
             <PVGraph particleCount={paramsRef.current.particleCount} />
          </div>
          <div className="flex-1 relative bg-black/40 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden">
             <MaxwellBoltzmannGraph particleMass={massVal} />
          </div>
      </div>
    </div>
  );
};

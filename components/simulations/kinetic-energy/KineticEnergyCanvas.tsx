"use client";

import React, { useEffect, useRef, useState } from "react";

interface KineticEnergyCanvasProps {
  subMode: string;
  isPlaying: boolean;

  // Translational
  transMass: number;
  transVelocity: number;
  setTransVelocity: (v: number) => void;
  transFriction: number;
  impulseBoost: number;
  setImpulseBoost: (v: number) => void;

  // Rotational
  rotShape: "ring" | "disk" | "sphere" | "rod";
  rotMass: number;
  rotRadius: number;
  rotOmega: number;
  setRotOmega: (v: number) => void;

  // Relativistic
  relMass: number;
  relBeta: number;

  // Thermal
  thermalTemp: number;
  thermalGas: "He" | "Ar" | "Xe";
  particleCount: number;

  // Quantum
  quantumN: number;
  wellWidth: number;
  quantumParticle: "electron" | "proton";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const KineticEnergyCanvas: React.FC<Readonly<KineticEnergyCanvasProps>> = ({
  subMode,
  isPlaying,
  transMass,
  transVelocity,
  setTransVelocity,
  transFriction,
  impulseBoost,
  setImpulseBoost,
  rotShape,
  rotMass,
  rotRadius,
  rotOmega,
  setRotOmega,
  relMass,
  relBeta,
  thermalTemp,
  thermalGas,
  particleCount,
  quantumN,
  wellWidth,
  quantumParticle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({
    // Translational
    x: 100.0,
    v: transVelocity,
    mass: transMass,
    friction: transFriction,
    
    // Rotational
    angle: 0.0,
    omega: rotOmega,
    
    // Relativistic
    relX: 20.0,
    relT: 0.0,
    
    // Thermal
    particles: [] as Particle[],
    temp: thermalTemp,
    gas: thermalGas,
    count: particleCount,

    // Quantum
    qTime: 0.0
  });

  // Keep references updated
  useEffect(() => {
    stateRef.current.v = transVelocity;
    stateRef.current.mass = transMass;
    stateRef.current.friction = transFriction;
  }, [transVelocity, transMass, transFriction]);

  useEffect(() => {
    stateRef.current.omega = rotOmega;
  }, [rotOmega]);

  useEffect(() => {
    stateRef.current.temp = thermalTemp;
    stateRef.current.gas = thermalGas;
    stateRef.current.count = particleCount;
    // Re-initialize thermal particles when count, temperature, or gas species changes
    initThermalParticles();
  }, [thermalTemp, thermalGas, particleCount]);

  // Handle impulse pushes
  useEffect(() => {
    if (impulseBoost > 0) {
      // Delta v = Impulse / Mass
      const deltaV = 15.0 / transMass;
      const currentV = stateRef.current.v;
      const nextV = currentV >= 0 ? currentV + deltaV : currentV - deltaV;
      stateRef.current.v = nextV;
      setTransVelocity(nextV);
      setImpulseBoost(0);
    }
  }, [impulseBoost]);

  // Initialize Thermal Particles with Boltzmann-distributed speeds
  const initThermalParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width || 600;
    const h = canvas.height || 400;

    // Estimate particle speed based on Temperature and species mass
    // vRms = sqrt(3 kB T / mParticle)
    // Let's scale visual speeds to look nice:
    // He: light/fast, Ar: medium, Xe: heavy/slow
    const speedScale = stateRef.current.gas === "He" ? 2.5 : stateRef.current.gas === "Ar" ? 1.2 : 0.6;
    const speedMultiplier = Math.sqrt(stateRef.current.temp / 300.0) * speedScale;

    const list: Particle[] = [];
    const count = Math.min(stateRef.current.count, 200);
    const radius = stateRef.current.gas === "He" ? 3.5 : stateRef.current.gas === "Ar" ? 5.0 : 6.5;

    for (let i = 0; i < count; i++) {
      // Pick random direction and speed from Maxwell-Boltzmann approximation
      const angle = Math.random() * Math.PI * 2;
      // Box-Muller transform for normal speed distribution
      const u1 = Math.random() || 0.0001;
      const u2 = Math.random() || 0.0001;
      const normRand = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI * 2 * u2);
      const speed = Math.abs(1.0 + normRand * 0.4) * speedMultiplier * 1.5;

      list.push({
        x: radius + Math.random() * (w - radius * 2 - 20) + 10,
        y: radius + Math.random() * (h - radius * 2 - 20) + 10,
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        radius
      });
    }
    stateRef.current.particles = list;
  };

  // Main Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // Cap dt
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Ensure dimensions are correct
      if (canvas.width !== canvas.parentElement?.clientWidth || canvas.height !== canvas.parentElement?.clientHeight) {
        canvas.width = canvas.parentElement?.clientWidth || 600;
        canvas.height = canvas.parentElement?.clientHeight || 400;
      }

      ctx.clearRect(0, 0, w, h);

      // Render backgrounds or modes
      if (isPlaying) {
        // Evolve physics parameters
        if (subMode === "translational") {
          // Decelerate due to friction: a = μ * g
          const g = 9.81;
          const a = stateRef.current.friction * g;
          let currentV = stateRef.current.v;

          if (Math.abs(currentV) > 0.01) {
            const drag = a * dt * Math.sign(currentV);
            if (Math.abs(drag) >= Math.abs(currentV)) {
              currentV = 0;
            } else {
              currentV -= drag;
            }
            stateRef.current.v = currentV;
            // Sync with controls component throttling updates
            if (Math.random() < 0.1) {
              setTransVelocity(currentV);
            }
          }

          // Update position
          stateRef.current.x += currentV * dt * 40; // Scale speed for display
          // Wrap around edges
          const blockW = 80;
          if (stateRef.current.x > w) {
            stateRef.current.x = -blockW;
          } else if (stateRef.current.x < -blockW) {
            stateRef.current.x = w;
          }
        } else if (subMode === "rotational") {
          stateRef.current.angle += stateRef.current.omega * dt;
        } else if (subMode === "relativistic") {
          // Particle moving in accelerator tube.
          // Visual speed is based on relBeta
          const cPixelsPerSec = w * 0.9;
          stateRef.current.relX += relBeta * cPixelsPerSec * dt;
          if (stateRef.current.relX > w - 40) {
            stateRef.current.relX = 40;
          }
          stateRef.current.relT += dt;
        } else if (subMode === "thermal") {
          // Evolve particles bouncing inside box
          const pts = stateRef.current.particles;
          
          // Speed scale to adjust velocities dynamically if temperature slider changed
          const targetScale = stateRef.current.gas === "He" ? 2.5 : stateRef.current.gas === "Ar" ? 1.2 : 0.6;
          const targetMultiplier = Math.sqrt(stateRef.current.temp / 300.0) * targetScale * 1.5;

          // Simple wall collisions & molecular step
          pts.forEach((p) => {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;

            // Wall check
            if (p.x < p.radius) {
              p.x = p.radius;
              p.vx = -p.vx;
            } else if (p.x > w - p.radius) {
              p.x = w - p.radius;
              p.vx = -p.vx;
            }

            if (p.y < p.radius) {
              p.y = p.radius;
              p.vy = -p.vy;
            } else if (p.y > h - p.radius) {
              p.y = h - p.radius;
              p.vy = -p.vy;
            }
          });

          // Resolve particle-particle elastic collisions (simplified)
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              const p1 = pts[i];
              const p2 = pts[j];
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const minDist = p1.radius + p2.radius;

              if (dist < minDist && dist > 0) {
                // Separate particles to avoid overlap
                const overlap = minDist - dist;
                const sx = (dx / dist) * overlap * 0.5;
                const sy = (dy / dist) * overlap * 0.5;
                p1.x -= sx;
                p1.y -= sy;
                p2.x += sx;
                p2.y += sy;

                // Elastic collision physics (equal mass for simplified gas modeling)
                const nx = dx / dist;
                const ny = dy / dist;
                // Relative velocity
                const kx = p1.vx - p2.vx;
                const ky = p1.vy - p2.vy;
                const p = 2.0 * (kx * nx + ky * ny) / 2.0;

                p1.vx -= p * nx;
                p1.vy -= p * ny;
                p2.vx += p * nx;
                p2.vy += p * ny;
              }
            }
          }
        } else if (subMode === "quantum") {
          stateRef.current.qTime += dt * 4;
        }
      }

      // ── RENDERING PHASES ──

      if (subMode === "translational") {
        // Draw track
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, h * 0.65);
        ctx.lineTo(w - 10, h * 0.65);
        ctx.stroke();

        // Draw track ticks
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let tX = 20; tX < w; tX += 30) {
          ctx.beginPath();
          ctx.moveTo(tX, h * 0.65);
          ctx.lineTo(tX, h * 0.68);
          ctx.stroke();
        }

        // Draw Block
        const blockW = 70;
        const blockH = 45;
        const bx = stateRef.current.x;
        const by = h * 0.65 - blockH;

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(6, 182, 212, 0.4)";
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(bx, by, blockW, blockH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw Mass Label Inside Block
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${transMass.toFixed(1)}kg`, bx + blockW / 2, by + blockH / 2);

        // Draw Velocity Arrow
        const velVal = stateRef.current.v;
        if (Math.abs(velVal) > 0.1) {
          ctx.save();
          ctx.strokeStyle = "#10b981";
          ctx.fillStyle = "#10b981";
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(16,185,129,0.5)";

          const arrowLength = Math.min(Math.abs(velVal) * 5, w * 0.25);
          const arrowDir = Math.sign(velVal);
          const arrowStartX = arrowDir > 0 ? bx + blockW : bx;
          const arrowStartY = by + blockH / 2;
          const arrowEndX = arrowStartX + arrowLength * arrowDir;

          ctx.beginPath();
          ctx.moveTo(arrowStartX, arrowStartY);
          ctx.lineTo(arrowEndX, arrowStartY);
          ctx.stroke();

          // Arrow head
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowStartY);
          ctx.lineTo(arrowEndX - 6 * arrowDir, arrowStartY - 4);
          ctx.lineTo(arrowEndX - 6 * arrowDir, arrowStartY + 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Velocity value
          ctx.fillStyle = "#10b981";
          ctx.font = "black 9px monospace";
          ctx.fillText(`${velVal.toFixed(1)} m/s`, arrowStartX + (arrowLength / 2) * arrowDir, arrowStartY - 10);
        }

        // Draw Friction spark icons if sliding with friction
        if (transFriction > 0 && Math.abs(velVal) > 0.5) {
          ctx.fillStyle = "rgba(245,158,11,0.6)";
          for (let s = 0; s < 3; s++) {
            ctx.beginPath();
            ctx.arc(bx + (velVal > 0 ? 0 : blockW) + (Math.random() - 0.5) * 10, h * 0.65 + (Math.random() - 0.5) * 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (subMode === "rotational") {
        const cx = w / 2;
        const cy = h / 2;
        const radius = rotRadius * 70 + 30; // Scale radius visually

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(stateRef.current.angle);

        // Draw shapes
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(6,182,212,0.3)";

        if (rotShape === "ring") {
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Spokes to see rotation
          ctx.strokeStyle = "rgba(6,182,212,0.3)";
          ctx.lineWidth = 2;
          for (let s = 0; s < 4; s++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius, 0);
            ctx.stroke();
          }
        } else if (rotShape === "disk") {
          ctx.fillStyle = "rgba(6,182,212,0.1)";
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Lines to show rotation
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-radius, 0);
          ctx.lineTo(radius, 0);
          ctx.moveTo(0, -radius);
          ctx.lineTo(0, radius);
          ctx.stroke();
        } else if (rotShape === "sphere") {
          // Radial sphere rendering
          const gradient = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, radius * 0.1, 0, 0, radius);
          gradient.addColorStop(0, "rgba(34,211,238,0.6)");
          gradient.addColorStop(1, "rgba(8,145,178,0.1)");
          ctx.fillStyle = gradient;
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Horizontal lines showing spherical contour spinning
          ctx.strokeStyle = "rgba(6,182,212,0.4)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (rotShape === "rod") {
          // Pivot Center Rod
          ctx.fillStyle = "rgba(6,182,212,0.15)";
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(-radius, -8, radius * 2, 16, 6);
          ctx.fill();
          ctx.stroke();
        }

        // Central pivot pin
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Speed indicator curved markers
        if (Math.abs(stateRef.current.omega) > 0.1) {
          ctx.save();
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(16,185,129,0.5)";
          ctx.beginPath();
          // Draw arc indicator around shape
          const indRadius = radius + 20;
          ctx.arc(cx, cy, indRadius, stateRef.current.angle, stateRef.current.angle + Math.PI * 0.4);
          ctx.stroke();

          // Arrow tip for arc
          const tipX = cx + indRadius * Math.cos(stateRef.current.angle + Math.PI * 0.4);
          const tipY = cy + indRadius * Math.sin(stateRef.current.angle + Math.PI * 0.4);
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (subMode === "relativistic") {
        // Draw relativistic accelerator tube
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(30, h / 2 - 40, w - 60, 80);
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fillRect(30, h / 2 - 40, w - 60, 80);

        // Draw electromagnetic coils
        ctx.strokeStyle = "rgba(6,182,212,0.15)";
        ctx.lineWidth = 3;
        for (let cxX = 50; cxX < w - 60; cxX += 40) {
          ctx.strokeRect(cxX, h / 2 - 48, 12, 96);
        }

        // Visual Lorentz contraction scaling
        // Length shrinks by 1/gamma.
        const gamma = 1 / Math.sqrt(1 - relBeta * relBeta);
        const originalWidth = 40;
        const contractedWidth = originalWidth / gamma;

        // Particle coordinates
        const px = stateRef.current.relX;
        const py = h / 2;

        // Glowing fields representing Doppler color shifts (Redshift/Blueshift halo)
        // At high speed we show compression of field lines
        ctx.save();
        ctx.shadowBlur = 20;
        // Doppler blue shift at the front, red shift at the back
        const colorGrad = ctx.createLinearGradient(px - contractedWidth, py, px + contractedWidth, py);
        colorGrad.addColorStop(0, "rgba(239,68,68,0.8)"); // Red back
        colorGrad.addColorStop(0.5, "rgba(34,211,238,0.9)"); // Cyan center
        colorGrad.addColorStop(1, "rgba(59,130,246,0.9)"); // Blue front

        ctx.fillStyle = colorGrad;
        ctx.shadowColor = "rgba(6,182,212,0.6)";

        ctx.beginPath();
        // Ellipse showing the Lorentz-contracted circular particle
        ctx.ellipse(px, py, contractedWidth, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw relativistic velocity labels
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`v = ${relBeta.toFixed(3)}c`, px, py + 35);
        ctx.fillText(`γ = ${gamma.toFixed(3)}`, px, py - 30);
      } else if (subMode === "thermal") {
        // Draw Gas Chamber Box
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, w - 20, h - 20);

        // Draw Particles
        const pts = stateRef.current.particles;
        pts.forEach((p) => {
          ctx.save();
          // Color based on velocity (hot = pink/cyan, slow = blue)
          const velocityMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          // Normalize based on 300K speed
          const relativeSpeed = velocityMag / 3.0;

          const color = relativeSpeed > 1.5 
            ? "rgba(236,72,153,0.85)" // Pink (Fast)
            : relativeSpeed > 0.8
              ? "rgba(34,211,238,0.85)" // Cyan (Average)
              : "rgba(59,130,246,0.8)"; // Blue (Slow)

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Small directional tail vector
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 3, p.y + p.vy * 3);
          ctx.stroke();
          ctx.restore();
        });
      } else if (subMode === "quantum") {
        // Quantum Potential Box
        const leftBoundary = w * 0.15;
        const rightBoundary = w * 0.85;
        const boxL = rightBoundary - leftBoundary;

        // Draw potential walls
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftBoundary, h * 0.2);
        ctx.lineTo(leftBoundary, h * 0.8);
        ctx.lineTo(rightBoundary, h * 0.8);
        ctx.lineTo(rightBoundary, h * 0.2);
        ctx.stroke();

        // Wavefunction amplitude graph: psi(x) = sqrt(2/L) * sin(n * pi * x / L)
        // Real part oscillates at e^(-i E t / hbar)
        const qTime = stateRef.current.qTime;

        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;

        // 1. Draw Wavefunction Real Part (blue/cyan stroke)
        ctx.strokeStyle = "rgba(34,211,238,0.85)";
        ctx.shadowColor = "rgba(34,211,238,0.5)";
        ctx.beginPath();
        for (let sx = leftBoundary; sx <= rightBoundary; sx++) {
          const relativeX = (sx - leftBoundary) / boxL;
          const psiX = Math.sqrt(2.0) * Math.sin(quantumN * Math.PI * relativeX);
          // Wave oscillation term
          const osc = Math.cos(qTime + quantumN * 0.5);
          const drawY = h * 0.5 - psiX * 50 * osc;

          if (sx === leftBoundary) ctx.moveTo(sx, drawY);
          else ctx.lineTo(sx, drawY);
        }
        ctx.stroke();

        // 2. Draw Probability Density |psi(x)|^2 (green filled translucent area)
        ctx.fillStyle = "rgba(16,185,129,0.12)";
        ctx.strokeStyle = "rgba(16,185,129,0.6)";
        ctx.shadowColor = "rgba(16,185,129,0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(leftBoundary, h * 0.8);

        for (let sx = leftBoundary; sx <= rightBoundary; sx++) {
          const relativeX = (sx - leftBoundary) / boxL;
          const psiX = Math.sqrt(2.0) * Math.sin(quantumN * Math.PI * relativeX);
          const density = psiX * psiX; // |psi|^2
          const drawY = h * 0.8 - density * 60; // scale density visual height
          ctx.lineTo(sx, drawY);
        }
        ctx.lineTo(rightBoundary, h * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Labels for Well
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`x = 0`, leftBoundary - 10, h * 0.82);
        ctx.fillText(`x = L (${wellWidth.toFixed(1)} nm)`, rightBoundary - 20, h * 0.82);
        ctx.fillText(`Ψ_${quantumN}(x)`, w / 2, h * 0.28);
        ctx.fillText(`|Ψ_${quantumN}(x)|²`, w / 2, h * 0.72);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, subMode, transMass, transVelocity, transFriction, rotShape, rotMass, rotRadius, rotOmega, relMass, relBeta, thermalTemp, thermalGas, particleCount, quantumN, wellWidth, quantumParticle]);

  return (
    <div className="w-full h-full relative bg-transparent overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[50%] bg-cyan-500/5 rounded-full blur-[130px] -z-10" />
    </div>
  );
};

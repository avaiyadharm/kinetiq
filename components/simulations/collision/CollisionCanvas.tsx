"use client";
import React, { useEffect, useRef } from "react";

interface CollisionCanvasProps {
  mass1: number;
  mass2: number;
  v1: number;
  v2: number;
  v1Post: number;
  v2Post: number;
  pos1: number;        // normalised 0..1 position of object 1
  pos2: number;        // normalised 0..1 position of object 2
  isPlaying: boolean;
  hasCollided: boolean;
  collisionType: "elastic" | "inelastic";
  showVectors: { velocity: boolean; momentum: boolean };
  showTrail: boolean;
  time: number;
  keBefore: number;
  keAfter: number;
  coeffRestitution: number;
  
  // Advanced telemetry/educational layers
  showCoM?: boolean;
  showForceVectors?: boolean;
  showGridOverlays?: boolean;
}

const COLORS = {
  obj1: "#8b5cf6",       // Violet
  obj1Glow: "rgba(139, 92, 246, 0.4)",
  obj2: "#06b6d4",       // Cyan
  obj2Glow: "rgba(6, 182, 212, 0.4)",
  velocity: "#f59e0b",   // Amber
  momentum: "#ec4899",   // Magenta
  elastic: "#10b981",    // Emerald
  inelastic: "#f97316",  // Orange
  force: "#ef4444",      // Red
  com: "#eab308",        // Gold
  grid: "rgba(39, 39, 42, 0.3)",
  gridActive: "rgba(59, 130, 246, 0.15)"
};

export const CollisionCanvas: React.FC<CollisionCanvasProps> = ({
  mass1, mass2, v1, v2, v1Post, v2Post,
  pos1, pos2, isPlaying, hasCollided, collisionType,
  showVectors, showTrail, time,
  keBefore, keAfter, coeffRestitution,
  showCoM = true,
  showForceVectors = true,
  showGridOverlays = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Transition detection and animation state
  const lastHasCollidedRef = useRef(false);
  const collisionTimeRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  
  // Particle spark system
  const sparksRef = useRef<{ x: number; y: number; vx: number; vy: number; age: number; maxAge: number; color: string; size: number }[]>([]);
  // Expanding shockwave ring
  const shockwaveRef = useRef<{ active: boolean; x: number; y: number; radius: number; maxRadius: number; opacity: number } | null>(null);
  // Motion trails (storing history of exact screen coordinates)
  const trail1Ref = useRef<{ x: number; y: number; a: number }[]>([]);
  const trail2Ref = useRef<{ x: number; y: number; a: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    
    // ── High-DPI Retina Display Handling ──
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const W = rect.width;
    const H = rect.height;
    
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const trackY = H * 0.52;
    const renderWidth = W - 160;

    // ── Physical Radii (Visual differentiation matching mass) ──
    const r1 = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
    const r2 = Math.max(18, Math.min(42, 16 + mass2 * 2.5));

    // Map normalized coordinates 0..1 to screen coordinates
    const x1 = 80 + pos1 * renderWidth;
    const x2 = 80 + pos2 * renderWidth;

    // Detect moment of collision transition to spawn effects
    if (hasCollided && !lastHasCollidedRef.current) {
      collisionTimeRef.current = time;
      lastHasCollidedRef.current = true;

      const midX = (x1 + x2) / 2;

      // 1. Shockwave circle
      shockwaveRef.current = {
        active: true,
        x: midX,
        y: trackY,
        radius: 0,
        maxRadius: 120,
        opacity: 1.0
      };

      // 2. High-precision particle sparks
      const sparks = [];
      const sparkCount = 18;
      for (let i = 0; i < sparkCount; i++) {
        // Spray particles vertically outward like an elastic burst
        const angle = -Math.PI / 4 - Math.random() * (Math.PI / 2);
        const speed = 120 + Math.random() * 180;
        sparks.push({
          x: midX,
          y: trackY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          maxAge: 0.35 + Math.random() * 0.35,
          color: coeffRestitution > 0.4 ? COLORS.elastic : COLORS.inelastic,
          size: 1.5 + Math.random() * 2
        });
      }
      sparksRef.current = sparks;
    }

    if (!hasCollided) {
      lastHasCollidedRef.current = false;
      collisionTimeRef.current = null;
      sparksRef.current = [];
      shockwaveRef.current = null;
    }

    // ── Time Step Dilation for Particles & Easing ──
    let dt = time - lastTimeRef.current;
    if (dt < 0 || dt > 0.1) dt = 0; // Prevent jumps on reset
    lastTimeRef.current = time;

    // ── Particle updates ──
    if (isPlaying && dt > 0) {
      sparksRef.current = sparksRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + 400 * dt, // gravity influence
          age: p.age + dt
        }))
        .filter(p => p.age < p.maxAge);
    }

    // ── Squish & Mechanical Deformation Calculation ──
    let squish1 = 1.0;
    let squish2 = 1.0;
    let isDeforming = false;
    
    if (collisionTimeRef.current !== null) {
      const timeSinceCollision = time - collisionTimeRef.current;
      const deformationPeriod = 0.28; // duration of impact squish cycle
      if (timeSinceCollision >= 0 && timeSinceCollision < deformationPeriod) {
        isDeforming = true;
        const decay = Math.exp(-timeSinceCollision * 12);
        const osc = Math.sin(timeSinceCollision * (Math.PI * 2 / deformationPeriod));
        const relativeSpeed = Math.abs(v1 - v2);
        const intensity = Math.min(0.20, relativeSpeed * 0.035);
        const factor = intensity * decay * osc;
        
        // Coupled physical deformation (lighter mass deforms more)
        const massFactor = mass1 + mass2;
        squish1 = 1.0 - factor * (mass2 / massFactor) * coeffRestitution;
        squish2 = 1.0 + factor * (mass1 / massFactor) * coeffRestitution;
      }
    }

    ctx.clearRect(0, 0, W, H);

    // ── Render Scientific Coordinate Grid ──
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 40; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Fine calibrations and grid glow
    if (showGridOverlays) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      
      // Draw laboratory meter marks along track
      for (let i = 0; i <= 10; i++) {
        const mx = 80 + (i / 10) * renderWidth;
        ctx.fillRect(mx - 0.5, trackY - 8, 1, 16);
        ctx.fillText(`${(i * 1.0).toFixed(1)}m`, mx, trackY + 22);
      }
    }

    // ── Render Lab Air-Track Hardware Base ──
    // Solid metal track bar
    const gradTrack = ctx.createLinearGradient(0, trackY, 0, trackY + 8);
    gradTrack.addColorStop(0, "#27272a");
    gradTrack.addColorStop(0.5, "#3f3f46");
    gradTrack.addColorStop(1, "#18181b");
    ctx.fillStyle = gradTrack;
    ctx.fillRect(30, trackY - 2, W - 60, 4);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, trackY + 2);
    ctx.lineTo(W - 30, trackY + 2);
    ctx.stroke();

    // Chrome End-Bumpers
    [{ x: 40, side: "left" }, { x: W - 40, side: "right" }].forEach(b => {
      ctx.fillStyle = "rgba(63, 63, 70, 0.9)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      if (b.side === "left") {
        ctx.rect(b.x - 20, trackY - 24, 20, 36);
        ctx.fill(); ctx.stroke();
        // Spring coils
        ctx.strokeStyle = "#a1a1aa";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x, trackY - 6);
        ctx.lineTo(b.x + 8, trackY - 12);
        ctx.lineTo(b.x + 2, trackY - 4);
        ctx.lineTo(b.x + 10, trackY - 6);
        ctx.stroke();
      } else {
        ctx.rect(b.x, trackY - 24, 20, 36);
        ctx.fill(); ctx.stroke();
        // Spring coils
        ctx.strokeStyle = "#a1a1aa";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x, trackY - 6);
        ctx.lineTo(b.x - 8, trackY - 12);
        ctx.lineTo(b.x - 2, trackY - 4);
        ctx.lineTo(b.x - 10, trackY - 6);
        ctx.stroke();
      }
    });

    // ── Collision Anticipation System ──
    const relativeV = (hasCollided ? v1Post : v1) - (hasCollided ? v2Post : v2);
    if (!hasCollided && relativeV > 0) {
      // Calculate limit distance
      const normLimitDist = (r1 + r2) / renderWidth;
      const remainingDistNorm = pos2 - pos1 - normLimitDist;
      
      if (remainingDistNorm > 0) {
        const timeToCollision = remainingDistNorm / relativeV;
        const collisionPosNorm = pos1 + v1 * timeToCollision + (r1 / renderWidth);
        const xImpact = 80 + collisionPosNorm * renderWidth;

        // Radar sweep glow around anticipation line
        const radarGlow = Math.abs(Math.sin(time * 5)) * 0.15;
        ctx.fillStyle = `rgba(245, 158, 11, ${0.03 + radarGlow})`;
        ctx.fillRect(xImpact - 30, 0, 60, H);

        // Dashed visual vertical indicator
        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(xImpact, 25);
        ctx.lineTo(xImpact, H - 25);
        ctx.stroke();
        ctx.setLineDash([]);

        // Brackets
        ctx.fillStyle = COLORS.velocity;
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`PREDICTED IMPACT POINT`, xImpact, 40);
        ctx.fillText(`ETA: ${timeToCollision.toFixed(2)}s`, xImpact, 52);

        // Center cursor
        ctx.beginPath();
        ctx.arc(xImpact, trackY, 6, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.velocity;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // ── Motion Trails ──
    if (showTrail) {
      // Save coordinate history of object centers
      if (isPlaying) {
        trail1Ref.current.push({ x: x1, y: trackY, a: 1.0 });
        trail2Ref.current.push({ x: x2, y: trackY, a: 1.0 });
      }
      if (trail1Ref.current.length > 50) trail1Ref.current.shift();
      if (trail2Ref.current.length > 50) trail2Ref.current.shift();

      // Render decaying trajectory rings
      [{ trail: trail1Ref.current, color: COLORS.obj1 }, { trail: trail2Ref.current, color: COLORS.obj2 }].forEach(({ trail, color }) => {
        trail.forEach((p, idx) => {
          if (isPlaying) p.a -= 0.015; // fade rate
          if (p.a <= 0) return;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2 + p.a * 2, 0, Math.PI * 2);
          const [r, g, b] = hexToRgb(color);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.a * 0.25})`;
          ctx.fill();
        });
      });
    } else {
      trail1Ref.current = [];
      trail2Ref.current = [];
    }

    // ── Shockwave Ring Draw ──
    if (shockwaveRef.current && shockwaveRef.current.active) {
      const sw = shockwaveRef.current;
      if (isPlaying && dt > 0) {
        sw.radius += 240 * dt;
        sw.opacity = Math.max(0, 1.0 - sw.radius / sw.maxRadius);
        if (sw.radius >= sw.maxRadius) {
          sw.active = false;
        }
      }

      if (sw.active) {
        // Shockwave aura
        ctx.strokeStyle = coeffRestitution > 0.4 ? `rgba(16, 185, 129, ${sw.opacity * 0.7})` : `rgba(249, 115, 22, ${sw.opacity * 0.7})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = coeffRestitution > 0.4 ? COLORS.elastic : COLORS.inelastic;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // ── Particle Sparks Paint ──
    sparksRef.current.forEach(p => {
      const alpha = 1.0 - p.age / p.maxAge;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // ── Velocity and Momentum Vector Pipelines ──
    const vecScale = 30;
    const momScale = 12;

    if (showVectors.velocity) {
      const currV1 = hasCollided ? v1Post : v1;
      const currV2 = hasCollided ? v2Post : v2;
      
      // Proportional vector magnitude scaling
      if (Math.abs(currV1) > 0.01) {
        drawArrow(ctx, x1, trackY - r1 - 10, x1 + currV1 * vecScale, trackY - r1 - 10, `${currV1 > 0 ? "+" : ""}${currV1.toFixed(2)} m/s`, COLORS.velocity, 2 + Math.abs(currV1) * 0.5);
      }
      if (Math.abs(currV2) > 0.01) {
        drawArrow(ctx, x2, trackY - r2 - 10, x2 + currV2 * vecScale, trackY - r2 - 10, `${currV2 > 0 ? "+" : ""}${currV2.toFixed(2)} m/s`, COLORS.velocity, 2 + Math.abs(currV2) * 0.5);
      }
    }

    if (showVectors.momentum) {
      const currV1 = hasCollided ? v1Post : v1;
      const currV2 = hasCollided ? v2Post : v2;
      const p1 = mass1 * currV1;
      const p2 = mass2 * currV2;
      
      if (Math.abs(p1) > 0.01) {
        drawArrow(ctx, x1, trackY + r1 + 14, x1 + p1 * momScale, trackY + r1 + 14, `${p1 > 0 ? "+" : ""}${p1.toFixed(2)} kg·m/s`, COLORS.momentum, 2 + Math.abs(p1) * 0.25);
      }
      if (Math.abs(p2) > 0.01) {
        drawArrow(ctx, x2, trackY + r2 + 14, x2 + p2 * momScale, trackY + r2 + 14, `${p2 > 0 ? "+" : ""}${p2.toFixed(2)} kg·m/s`, COLORS.momentum, 2 + Math.abs(p2) * 0.25);
      }
    }

    // ── Newton's Third Law Force Vectors (Only during active impact compression) ──
    if (showForceVectors && isDeforming && collisionTimeRef.current !== null) {
      const timeSinceCollision = time - collisionTimeRef.current;
      const relativeSpeed = Math.abs(v1 - v2);
      // Force amplitude modeled as a spring compression formula
      const forceMag = relativeSpeed * 220 * Math.sin(timeSinceCollision * (Math.PI / 0.28));
      
      if (forceMag > 1) {
        // Reaction Force F_21 acting on Mass 1 (pointing left)
        drawArrow(ctx, x1, trackY, x1 - forceMag * 0.35, trackY, `F₂₁ = -${forceMag.toFixed(0)} N`, COLORS.force, 4.5);
        // Action Force F_12 acting on Mass 2 (pointing right)
        drawArrow(ctx, x2, trackY, x2 + forceMag * 0.35, trackY, `F₁₂ = +${forceMag.toFixed(0)} N`, COLORS.force, 4.5);

        // Center annotation label
        ctx.fillStyle = COLORS.force;
        ctx.font = "black 9px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ACTION = REACTION (F₁₂ = -F₂₁)", (x1 + x2) / 2, trackY - 50);
      }
    }

    // ── Advanced Object 1 Draw ──
    ctx.save();
    ctx.translate(x1, trackY);
    ctx.scale(squish1, 1.0 / squish1);

    // Active kinetic energy outer visual aura
    const ke1 = 0.5 * mass1 * (hasCollided ? v1Post : v1) * (hasCollided ? v1Post : v1);
    const activeGlow1 = r1 + 8 + Math.min(18, ke1 * 0.6);
    const radGlow1 = ctx.createRadialGradient(0, 0, r1 - 3, 0, 0, activeGlow1);
    radGlow1.addColorStop(0, COLORS.obj1Glow);
    radGlow1.addColorStop(0.5, "rgba(139, 92, 246, 0.1)");
    radGlow1.addColorStop(1, "transparent");
    ctx.fillStyle = radGlow1;
    ctx.beginPath();
    ctx.arc(0, 0, activeGlow1, 0, Math.PI * 2);
    ctx.fill();

    // Translucent dark glass sphere casing
    ctx.fillStyle = "rgba(18, 16, 26, 0.88)";
    ctx.strokeStyle = COLORS.obj1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Internal Dashboard Grid lines (Structural Complexity)
    ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r1 * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // Mass representation structural rings (Heavier masses get more rings!)
    if (mass1 > 4.0) {
      ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, r1 * 0.86, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r1 * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glass sheen arc reflection (Apple style aesthetic)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r1 - 4, -Math.PI / 3, -Math.PI * 2 / 3, true);
    ctx.stroke();

    // Nuclear energy core glow (Size matches Kinetic Energy!)
    const coreSize1 = Math.max(5, Math.min(r1 * 0.4, 3 + ke1 * 0.5));
    const gradCore1 = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize1);
    gradCore1.addColorStop(0, "#ffffff");
    gradCore1.addColorStop(0.3, "#c4b5fd");
    gradCore1.addColorStop(0.8, "rgba(139, 92, 246, 0.5)");
    gradCore1.addColorStop(1, "transparent");
    ctx.fillStyle = gradCore1;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize1, 0, Math.PI * 2);
    ctx.fill();

    // Central crosshair symbol for Center of Mass
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
    ctx.moveTo(0, -5); ctx.lineTo(0, 5);
    ctx.stroke();

    ctx.restore();

    // Dynamic label below Object 1
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("m₁ = " + mass1.toFixed(1) + "kg", x1, trackY + r1 + 38);
    ctx.fillText("KE = " + ke1.toFixed(1) + "J", x1, trackY + r1 + 48);

    // ── Advanced Object 2 Draw ──
    ctx.save();
    ctx.translate(x2, trackY);
    ctx.scale(squish2, 1.0 / squish2);

    // Active kinetic energy outer visual aura
    const ke2 = 0.5 * mass2 * (hasCollided ? v2Post : v2) * (hasCollided ? v2Post : v2);
    const activeGlow2 = r2 + 8 + Math.min(18, ke2 * 0.6);
    const radGlow2 = ctx.createRadialGradient(0, 0, r2 - 3, 0, 0, activeGlow2);
    radGlow2.addColorStop(0, COLORS.obj2Glow);
    radGlow2.addColorStop(0.5, "rgba(6, 182, 212, 0.1)");
    radGlow2.addColorStop(1, "transparent");
    ctx.fillStyle = radGlow2;
    ctx.beginPath();
    ctx.arc(0, 0, activeGlow2, 0, Math.PI * 2);
    ctx.fill();

    // Translucent dark glass sphere casing
    ctx.fillStyle = "rgba(10, 18, 22, 0.88)";
    ctx.strokeStyle = COLORS.obj2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Internal Dashboard Grid lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r2 * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // Mass rings
    if (mass2 > 4.0) {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, r2 * 0.86, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, r2 * 0.44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glass sheen arc reflection
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r2 - 4, -Math.PI / 3, -Math.PI * 2 / 3, true);
    ctx.stroke();

    // Glowing core
    const coreSize2 = Math.max(5, Math.min(r2 * 0.4, 3 + ke2 * 0.5));
    const gradCore2 = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize2);
    gradCore2.addColorStop(0, "#ffffff");
    gradCore2.addColorStop(0.3, "#99f6e4");
    gradCore2.addColorStop(0.8, "rgba(6, 182, 212, 0.5)");
    gradCore2.addColorStop(1, "transparent");
    ctx.fillStyle = gradCore2;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize2, 0, Math.PI * 2);
    ctx.fill();

    // Central crosshair symbol for Center of Mass
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
    ctx.moveTo(0, -5); ctx.lineTo(0, 5);
    ctx.stroke();

    ctx.restore();

    // Dynamic label below Object 2
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("m₂ = " + mass2.toFixed(1) + "kg", x2, trackY + r2 + 38);
    ctx.fillText("KE = " + ke2.toFixed(1) + "J", x2, trackY + r2 + 48);

    // ── System Center of Mass (CoM) Tracker (Conserved Vector) ──
    if (showCoM) {
      const posCoM = (mass1 * pos1 + mass2 * pos2) / (mass1 + mass2);
      const xCoM = 80 + posCoM * renderWidth;

      // Vertical marker line
      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xCoM, trackY - 50);
      ctx.lineTo(xCoM, trackY + 50);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw CoM Dial
      ctx.save();
      ctx.translate(xCoM, trackY);
      
      // Quadrant filling
      ctx.fillStyle = COLORS.com;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI / 2);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI, Math.PI * 3 / 2);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI / 2, Math.PI);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI * 3 / 2, Math.PI * 2);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = COLORS.com;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();

      // CoM label
      ctx.fillStyle = COLORS.com;
      ctx.font = "bold 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("SYSTEM CoM", xCoM, trackY - 14);

      // Constant System Velocity Vector (Proof of conservation!)
      const currV1 = hasCollided ? v1Post : v1;
      const currV2 = hasCollided ? v2Post : v2;
      const vCM = (mass1 * currV1 + mass2 * currV2) / (mass1 + mass2);
      
      if (Math.abs(vCM) > 0.01) {
        // Drawn higher above CoM
        drawArrow(ctx, xCoM, trackY - 32, xCoM + vCM * vecScale, trackY - 32, `v_cm = ${vCM.toFixed(2)} m/s`, COLORS.com, 2.5);
      }
    }

  }, [
    mass1, mass2, v1, v2, v1Post, v2Post, 
    pos1, pos2, isPlaying, hasCollided, collisionType, 
    showVectors, showTrail, time, keBefore, keAfter, coeffRestitution,
    showCoM, showForceVectors, showGridOverlays
  ]);

  return (
    <div className="relative w-full h-full min-h-[460px] md:min-h-[520px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      {/* Dynamic radial gradient ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 via-transparent to-[#06b6d4]/5 pointer-events-none" />
      
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Interactive telemetry status label */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none z-20">
        <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black">Collision Engine Live Telemetry</div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "bg-rose-500"} animate-pulse`} />
          <div className="text-white/80 font-mono text-[11px] font-bold tracking-wider">
            {isPlaying ? (hasCollided ? "POST-IMPACT VELOCITIES" : "APPROACH STATE PHASES") : "SYSTEM INTERFACE ARMED"}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Precise Helper Functions ──
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  label: string, color: string, thickness: number = 2.5
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.max(8, thickness * 2.8);
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = thickness;
  
  // Render Arrow Shaft with neon glow
  ctx.shadowBlur = 4;
  ctx.shadowColor = color;
  ctx.beginPath(); 
  ctx.moveTo(x1, y1); 
  ctx.lineTo(x2, y2); 
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Render Arrow Head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  
  // Vector Label Container Box (Futuristic floating pill)
  const lx = x2 + 10 * Math.cos(angle);
  const ly = y2 + 10 * Math.sin(angle);
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  const textWidth = ctx.measureText(label).width;
  
  ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  
  // Draw small pill background behind text
  roundRect(ctx, lx - textWidth / 2 - 4, ly - 8, textWidth + 8, 14, 4);
  ctx.fill();
  ctx.stroke();
  
  // Draw text label
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(label, lx, ly + 2);
  
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Vector {
  x: number;
  y: number;
  label: string;
  color: string;
  visible: boolean;
}

interface CircularMotionCanvasProps {
  radius: number; // in meters (scaled for display)
  mass: number; // in kg
  omega: number; // angular velocity rad/s
  alpha: number; // angular acceleration rad/s^2
  theta: number; // current angle in radians
  isPlaying: boolean;
  showVectors: {
    velocity: boolean;
    centripetal: boolean;
    tangential: boolean;
    resultant: boolean;
    radius: boolean;
  };
  showTrail: boolean;
  isUCM: boolean;
}

export const CircularMotionCanvas: React.FC<CircularMotionCanvasProps> = ({
  radius,
  mass,
  omega,
  alpha,
  theta,
  isPlaying,
  showVectors,
  showTrail,
  isUCM,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const lastThetaRef = useRef(theta);

  // Constants for scaling
  const SCALE = 150; // pixels per meter
  const CENTER_X = 400;
  const CENTER_Y = 300;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- 1. COORDINATE SYSTEM MAPPING (Physics CCW) ---
      // Standard Physics: y up, screen: y down.
      // x_s = CENTER_X + x_p
      // y_s = CENTER_Y - y_p
      const rPixels = radius * SCALE;
      const x_phys = radius * Math.cos(theta);
      const y_phys = radius * Math.sin(theta);
      
      const x = CENTER_X + x_phys * SCALE;
      const y = CENTER_Y - y_phys * SCALE;

      // Draw Grid
      drawGrid(ctx, canvas.width, canvas.height);

      // --- 2. RADIALLY SYMMETRIC AXES ---
      // Radial Axis Line
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.2)";
      ctx.moveTo(CENTER_X, CENTER_Y);
      // Extend radial line through particle
      const radialLineX = CENTER_X + (radius * 1.5) * Math.cos(theta) * SCALE;
      const radialLineY = CENTER_Y - (radius * 1.5) * Math.sin(theta) * SCALE;
      ctx.lineTo(radialLineX, radialLineY);
      ctx.stroke();

      // Tangential Axis Line
      ctx.beginPath();
      const tangX1 = x + 100 * Math.sin(theta);
      const tangY1 = y + 100 * Math.cos(theta);
      const tangX2 = x - 100 * Math.sin(theta);
      const tangY2 = y - 100 * Math.cos(theta);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.1)";
      ctx.moveTo(tangX1, tangY1);
      ctx.lineTo(tangX2, tangY2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Circular Path
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, rPixels, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Trail
      if (showTrail) {
        if (isPlaying && Math.abs(theta - lastThetaRef.current) > 0.01) {
          trailRef.current.push({ x, y, alpha: 1.0 });
          lastThetaRef.current = theta;
        }
        if (trailRef.current.length > 100) trailRef.current.shift();

        ctx.beginPath();
        trailRef.current.forEach((p, i) => {
          p.alpha -= 0.005;
          if (p.alpha <= 0) return;
          ctx.strokeStyle = `rgba(0, 255, 255, ${p.alpha * 0.3})`;
          ctx.lineWidth = 2;
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else {
        trailRef.current = [];
      }

      // Draw Center Pivot
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      // Draw Radius Vector (Connects center to bob)
      if (showVectors.radius) {
        drawVector(ctx, CENTER_X, CENTER_Y, x, y, "r", "#6366f1", true);
      }

      // --- 3. VECTOR PHYSICS & SCALING ---
      const v = radius * omega;
      const a_c = radius * Math.pow(omega, 2);
      const a_t = radius * alpha;

      // Dynamic Scaling Strategy (Enforced Proportionality for same-dimension vectors)
      const maxVectorLength = rPixels * 0.75;
      const vScale = maxVectorLength / Math.max(v, 4);
      const aScale = maxVectorLength / Math.max(a_c, 10);

      // --- 4. TANGENT LINE & BASIS VISUALIZATION ---
      if (showVectors.velocity) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
          ctx.setLineDash([10, 5]);
          const lineHalfLen = 150;
          const lx1 = x + lineHalfLen * Math.sin(theta);
          const ly1 = y + lineHalfLen * Math.cos(theta);
          const lx2 = x - lineHalfLen * Math.sin(theta);
          const ly2 = y - lineHalfLen * Math.cos(theta);
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.stroke();
          ctx.setLineDash([]);
      }

      // Perpendicularity Indicator (Right Angle Symbol)
      if (showVectors.velocity && showVectors.centripetal) {
          drawRightAngle(ctx, x, y, theta);
      }

      // 1. Velocity Vector (Mathematically Exact Tangent)
      // v_phys = (-rω sinθ, rω cosθ)
      // v_screen_y is inverted -> vy_s = -rω cosθ
      if (showVectors.velocity) {
        const vx_s = -v * Math.sin(theta) * vScale;
        const vy_s = -v * Math.cos(theta) * vScale;
        drawVector(ctx, x, y, x + vx_s, y + vy_s, "v", "#06b6d4");
      }

      // 2. Centripetal Acceleration (Radial Inward)
      if (showVectors.centripetal) {
        // a_c = ω²r (-cosθ, -sinθ) -> screen y is inverted -> acy_s = ω²r sinθ
        // Points FROM object TO center
        const acx_s = -a_c * Math.cos(theta) * aScale;
        const acy_s = a_c * Math.sin(theta) * aScale;
        // Enforce exact origin at particle center
        drawVector(ctx, x, y, x + acx_s, y + acy_s, "a꜀", "#ec4899");
      }

      // 3. Tangential Acceleration (Tangential)
      if (showVectors.tangential && Math.abs(alpha) > 0.001) {
        const atx_s = -a_t * Math.sin(theta) * aScale;
        const aty_s = -a_t * Math.cos(theta) * aScale;
        drawVector(ctx, x, y, x + atx_s, y + aty_s, "aₜ", "#f59e0b");
      }

      // 4. Resultant Acceleration (a = a_c + a_t)
      if (showVectors.resultant && !isUCM) {
          const arx_s = (-a_c * Math.cos(theta) - a_t * Math.sin(theta)) * aScale;
          const ary_s = (a_c * Math.sin(theta) - a_t * Math.cos(theta)) * aScale;
          drawVector(ctx, x, y, x + arx_s, y + ary_s, "a", "#10b981");
      }

      // Draw Object (Bob)
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      const bobGradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
      bobGradient.addColorStop(0, "#06b6d4");
      bobGradient.addColorStop(1, "#0891b2");
      ctx.fillStyle = bobGradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#06b6d4";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Formula Insight Overlay
      if (isPlaying) {
          drawFormulaInsight(ctx, x, y, v, a_c, radius);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [radius, theta, omega, alpha, showVectors, showTrail, isPlaying, isUCM]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let i = 0; i < w; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += step) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  };

  const drawVector = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    color: string,
    isRadius: boolean = false
  ) => {
    const headLength = 10;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 2) return;

    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isRadius ? 2 : 3;

    if (isRadius) {
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow Head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // Label with background for readability
    const labelX = x2 + 15 * Math.cos(angle);
    const labelY = y2 + 15 * Math.sin(angle);
    
    ctx.font = "bold 12px JetBrains Mono, monospace";
    const metrics = ctx.measureText(label);
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(labelX - 4, labelY - 12, metrics.width + 8, 16);
    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);
  };

  const drawRightAngle = (ctx: CanvasRenderingContext2D, x: number, y: number, theta: number) => {
      const size = 15;
      // Radial direction (from bob to center)
      const rx = -Math.cos(theta);
      const ry = Math.sin(theta);
      // Tangential direction
      const tx = -Math.sin(theta);
      const ty = -Math.cos(theta);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      
      const p1x = x + rx * size;
      const p1y = y + ry * size;
      const p2x = p1x + tx * size;
      const p2y = p1y + ty * size;
      const p3x = x + tx * size;
      const p3y = y + ty * size;

      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.stroke();
  };

  const drawFormulaInsight = (ctx: CanvasRenderingContext2D, x: number, y: number, v: number, ac: number, r: number) => {
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      const info = [
          `v = ωr = ${v.toFixed(1)} m/s`,
          `a꜀ = v²/r = ${ac.toFixed(1)} m/s²`
      ];
      info.forEach((text, i) => {
          ctx.fillText(text, x + 20, y - 20 + i * 12);
      });
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full object-contain"
      />
      
      {/* HUD Info Overlay */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
          <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">System Manifold</div>
          <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'bg-rose-500'} animate-pulse`} />
              <div className="text-white/80 font-mono text-xs tracking-wider">{isPlaying ? 'CORE_ACTIVE' : 'IDLE_STATE'}</div>
          </div>
      </div>

      {/* Vector Key Indicators */}
      <div className="absolute top-8 right-8 flex flex-col gap-3 pointer-events-none">
          <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
             <div className="flex items-center gap-3">
                 <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                 <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Tangent Space: v ⟂ r</span>
             </div>
             <div className="flex items-center gap-3">
                 <div className="w-1 h-3 bg-pink-500 rounded-full" />
                 <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Radial Space: a꜀ ∥ -r</span>
             </div>
          </div>
      </div>

      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1 pointer-events-none opacity-40">
          <div className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">Geometric Basis</div>
          <div className="text-white/40 font-mono text-[10px]">Basis: {`{ê_r, ê_θ}`} | Polar Plane</div>
          <div className="text-white/20 font-mono text-[8px] italic">Note: Vectors normalized for visualization</div>
      </div>
    </div>
  );
};

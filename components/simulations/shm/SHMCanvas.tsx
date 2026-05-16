"use client";

import React, { useEffect, useRef } from "react";

interface SHMCanvasProps {
  amplitude: number;      // meters
  angularFreq: number;    // ω rad/s
  phase: number;          // φ radians
  time: number;           // current sim time (seconds)
  isPlaying: boolean;
  mode: "spring" | "pendulum";
  mass: number;           // kg
  showVectors: {
    displacement: boolean;
    velocity: boolean;
    acceleration: boolean;
    force: boolean;
  };
  showTrail: boolean;
}

export const SHMCanvas: React.FC<SHMCanvasProps> = ({
  amplitude,
  angularFreq,
  phase,
  time,
  isPlaying,
  mode,
  mass,
  showVectors,
  showTrail,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const lastPosRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const W = canvas.width;   // 800
      const H = canvas.height;  // 600

      ctx.clearRect(0, 0, W, H);

      // Background grid
      drawGrid(ctx, W, H);

      const SCALE = 140; // px per meter
      const MAX_A = amplitude * SCALE;

      // x(t) = A·cos(ωt + φ)
      const x_phys = amplitude * Math.cos(angularFreq * time + phase);
      const v_phys = -amplitude * angularFreq * Math.sin(angularFreq * time + phase);
      const a_phys = -amplitude * angularFreq * angularFreq * Math.cos(angularFreq * time + phase);
      const F_phys = mass * a_phys;

      if (mode === "spring") {
        renderSpring(ctx, W, H, SCALE, x_phys, v_phys, a_phys, F_phys, MAX_A, amplitude);
      } else {
        renderPendulum(ctx, W, H, SCALE, x_phys, v_phys, a_phys, F_phys, MAX_A, amplitude);
      }

      animId = requestAnimationFrame(render);
    };

    const renderSpring = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      SCALE: number,
      x: number,
      v: number,
      a: number,
      F: number,
      maxA: number,
      A: number
    ) => {
      const centerX = W / 2;
      const centerY = H / 2;

      // Equilibrium line
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.moveTo(centerX, 80);
      ctx.lineTo(centerX, H - 80);
      ctx.stroke();
      ctx.setLineDash([]);

      // Amplitude markers
      [-1, 1].forEach(sign => {
        const ay = centerY - sign * maxA;
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.2)";
        ctx.moveTo(centerX - 60, ay);
        ctx.lineTo(centerX + 60, ay);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(139, 92, 246, 0.4)";
        ctx.font = "bold 9px Inter";
        ctx.textAlign = "right";
        ctx.fillText(`${sign > 0 ? "+" : "-"}A`, centerX - 66, ay + 3);
      });

      // Equilibrium label
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "bold 9px Inter";
      ctx.textAlign = "right";
      ctx.fillText("O (eq)", centerX - 66, centerY + 3);

      // Mass position
      const bobY = centerY - x * SCALE;

      // Spring top anchor
      const springTop = 60;
      const springBottom = bobY - 20;
      drawSpringCoil(ctx, centerX, springTop, springBottom);

      // Trail
      if (showTrail) {
        if (Math.abs(x - (lastPosRef.current ?? x)) > 0.005) {
          trailRef.current.push({ x: centerX, y: bobY, alpha: 1.0 });
          lastPosRef.current = x;
        }
        if (trailRef.current.length > 80) trailRef.current.shift();
        trailRef.current.forEach(p => {
          p.alpha -= 0.008;
          if (p.alpha <= 0) return;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha * 0.3})`;
          ctx.fill();
        });
      } else {
        trailRef.current = [];
        lastPosRef.current = null;
      }

      // Vectors
      const vecScale = maxA / Math.max(Math.abs(v), 0.1);
      const accVecScale = maxA / Math.max(Math.abs(a), 0.5);

      if (showVectors.displacement && Math.abs(x) > 0.01) {
        const dy = -x * SCALE;
        drawArrow(ctx, centerX + 30, centerY, centerX + 30, centerY + dy, "x", "#8b5cf6", false);
      }
      if (showVectors.velocity && Math.abs(v) > 0.01) {
        const vy = -v * Math.min(vecScale, 100);
        drawArrow(ctx, centerX + 55, bobY, centerX + 55, bobY + vy, "v", "#06b6d4", false);
      }
      if (showVectors.acceleration && Math.abs(a) > 0.01) {
        const ay2 = -a * Math.min(accVecScale, 80);
        drawArrow(ctx, centerX + 80, bobY, centerX + 80, bobY + ay2, "a", "#f59e0b", false);
      }
      if (showVectors.force && Math.abs(F) > 0.01) {
        const fy = -F * Math.min(accVecScale / mass, 80);
        drawArrow(ctx, centerX - 40, bobY, centerX - 40, bobY + fy, "F", "#ec4899", false);
      }

      // Mass block
      const bW = 60, bH = 40;
      ctx.fillStyle = "#1e1b4b";
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 2;
      roundRect(ctx, centerX - bW / 2, bobY - bH / 2, bW, bH, 8);
      ctx.fill();
      ctx.stroke();

      // Mass glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#8b5cf6";
      ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 1;
      roundRect(ctx, centerX - bW / 2 - 2, bobY - bH / 2 - 2, bW + 4, bH + 4, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 11px Inter";
      ctx.textAlign = "center";
      ctx.fillText(`${mass.toFixed(1)}kg`, centerX, bobY + 4);

      // Ceiling
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(centerX - 80, 40, 160, 20);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 80, 40, 160, 20);

      // HUD
      drawSpringHUD(ctx, x, v, a, F, A);
    };

    const renderPendulum = (
      ctx: CanvasRenderingContext2D,
      W: number,
      H: number,
      SCALE: number,
      x: number,
      v: number,
      a: number,
      F: number,
      maxA: number,
      A: number
    ) => {
      const pivotX = W / 2;
      const pivotY = 100;
      const L_pix = 220; // display length

      // θ = x / L_pix (small angle approx — x is displacement along arc)
      const theta = x * (maxA / L_pix) / (maxA / Math.PI * 0.7);
      const bobX = pivotX + L_pix * Math.sin(theta);
      const bobY = pivotY + L_pix * Math.cos(theta);

      // Equilibrium reference
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + L_pix + 40);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arc amplitude sweep
      ctx.beginPath();
      const sweepAngle = A * (maxA / L_pix) / (maxA / Math.PI * 0.7);
      ctx.arc(pivotX, pivotY, L_pix, Math.PI / 2 - sweepAngle, Math.PI / 2 + sweepAngle);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.12)";
      ctx.lineWidth = 40;
      ctx.stroke();
      ctx.lineWidth = 1;

      // Trail
      if (showTrail) {
        if (Math.abs(x - (lastPosRef.current ?? x)) > 0.005) {
          trailRef.current.push({ x: bobX, y: bobY, alpha: 1.0 });
          lastPosRef.current = x;
        }
        if (trailRef.current.length > 80) trailRef.current.shift();
        trailRef.current.forEach(p => {
          p.alpha -= 0.007;
          if (p.alpha <= 0) return;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha * 0.35})`;
          ctx.fill();
        });
      } else {
        trailRef.current = [];
        lastPosRef.current = null;
      }

      // String
      const gradient = ctx.createLinearGradient(pivotX, pivotY, bobX, bobY);
      gradient.addColorStop(0, "rgba(255,255,255,0.4)");
      gradient.addColorStop(1, "rgba(139, 92, 246, 0.8)");
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vectors on bob
      const vMag = Math.abs(v) * 15;
      const aMag = Math.abs(a) * 10;

      if (showVectors.velocity && vMag > 2) {
        const vDir = -Math.sign(v);
        drawArrow(ctx, bobX, bobY, bobX + vMag * Math.cos(theta) * vDir, bobY + vMag * Math.sin(theta) * vDir, "v", "#06b6d4", false);
      }
      if (showVectors.acceleration && aMag > 1) {
        // restoring force points toward center
        const aDir = -Math.sign(a);
        drawArrow(ctx, bobX, bobY, bobX + aMag * Math.sin(theta) * aDir, bobY - aMag * Math.cos(theta) * aDir, "a", "#f59e0b", false);
      }
      if (showVectors.force && aMag > 1) {
        const fMag = Math.abs(F) * 8;
        const fDir = -Math.sign(F);
        drawArrow(ctx, bobX, bobY, bobX + fMag * Math.sin(theta) * fDir, bobY - fMag * Math.cos(theta) * fDir, "F", "#ec4899", false);
      }

      // Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
      const bobGrad = ctx.createRadialGradient(bobX - 5, bobY - 5, 0, bobX, bobY, 18);
      bobGrad.addColorStop(0, "#a78bfa");
      bobGrad.addColorStop(1, "#7c3aed");
      ctx.fillStyle = bobGrad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#8b5cf6";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pivot pin
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fill();

      // Pivot bracket
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(pivotX - 60, 55, 120, 20);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pivotX - 60, 55, 120, 20);

      drawSpringHUD(ctx, x, v, a, F, A);
    };

    const drawSpringHUD = (
      ctx: CanvasRenderingContext2D,
      x: number, v: number, a: number, F: number, A: number
    ) => {
      const items = [
        { label: "x(t)", value: `${x.toFixed(3)} m`, color: "#8b5cf6" },
        { label: "v(t)", value: `${v.toFixed(3)} m/s`, color: "#06b6d4" },
        { label: "a(t)", value: `${a.toFixed(3)} m/s²`, color: "#f59e0b" },
        { label: "F(t)", value: `${F.toFixed(3)} N`, color: "#ec4899" },
      ];
      const startX = 20;
      const startY = 520;
      items.forEach((item, i) => {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        roundRect(ctx, startX + i * 145, startY, 135, 44, 6);
        ctx.fill();
        ctx.fillStyle = item.color;
        ctx.font = "bold 10px Inter";
        ctx.textAlign = "left";
        ctx.fillText(item.label, startX + i * 145 + 10, startY + 16);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        ctx.fillText(item.value, startX + i * 145 + 10, startY + 34);
      });
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [amplitude, angularFreq, phase, time, isPlaying, mode, mass, showVectors, showTrail]);

  // --- Drawing Helpers ---
  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let i = 0; i < w; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 0; i < h; i += step) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />

      {/* HUD overlay */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">SHM Engine</div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]" : "bg-rose-500"} animate-pulse`} />
          <div className="text-white/80 font-mono text-xs tracking-wider">{isPlaying ? "OSCILLATING" : "IDLE_STATE"}</div>
        </div>
      </div>

      {/* Mode badge */}
      <div className="absolute top-8 right-8 pointer-events-none">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/5 px-4 py-2 rounded-2xl">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
            {mode === "spring" ? "🔧 Spring-Mass" : "🔵 Pendulum"}
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1 pointer-events-none opacity-40">
        <div className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">SHM Basis</div>
        <div className="text-white/40 font-mono text-[10px]">x(t) = A·cos(ωt + φ)</div>
        <div className="text-white/20 font-mono text-[8px] italic">Small-angle approximation applied</div>
      </div>
    </div>
  );
};

// ---- Utility Drawing Functions (module-level) ----

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  label: string,
  color: string,
  _dashed: boolean
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 3) return;
  const angle = Math.atan2(dy, dx);
  const head = 10;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  const lx = x2 + 14 * Math.cos(angle);
  const ly = y2 + 14 * Math.sin(angle);
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  const m = ctx.measureText(label);
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(lx - 3, ly - 11, m.width + 6, 14);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(label, lx, ly);
}

function drawSpringCoil(ctx: CanvasRenderingContext2D, cx: number, yTop: number, yBottom: number) {
  const coils = 10;
  const amplitude = 18;
  const totalH = yBottom - yTop;
  const segH = totalH / (coils * 2);

  ctx.beginPath();
  ctx.moveTo(cx, yTop);
  for (let i = 0; i < coils * 2; i++) {
    const yMid = yTop + i * segH + segH / 2;
    const yEnd = yTop + (i + 1) * segH;
    const xControl = cx + (i % 2 === 0 ? amplitude : -amplitude);
    ctx.quadraticCurveTo(xControl, yMid, cx, yEnd);
  }
  const gradient = ctx.createLinearGradient(cx - amplitude, yTop, cx + amplitude, yBottom);
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.9)");
  gradient.addColorStop(0.5, "rgba(167, 139, 250, 1)");
  gradient.addColorStop(1, "rgba(109, 40, 217, 0.9)");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Spring shadow glow
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#8b5cf6";
  ctx.stroke();
  ctx.shadowBlur = 0;
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

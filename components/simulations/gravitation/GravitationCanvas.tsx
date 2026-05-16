"use client";
import React, { useEffect, useRef } from "react";

interface GravitationCanvasProps {
  centralMass: number;       // kg (scaled, e.g. 5.97e24)
  orbiterMass: number;       // kg
  orbitalRadius: number;     // m (scaled, e.g. 6.7e6)
  time: number;
  isPlaying: boolean;
  showVectors: { gravity: boolean; velocity: boolean; centripetal: boolean };
  showTrail: boolean;
  showFieldLines: boolean;
  G: number;
}

const COLORS = {
  gravity: "#ec4899",
  velocity: "#06b6d4",
  centripetal: "#f59e0b",
  orbit: "#8b5cf6",
  field: "#34d399",
  central: "#f97316",
};

export const GravitationCanvas: React.FC<GravitationCanvasProps> = ({
  centralMass, orbiterMass, orbitalRadius, time, isPlaying,
  showVectors, showTrail, showFieldLines, G,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{ x: number; y: number; a: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const CX = W * 0.42, CY = H * 0.48;

    // Physics (derived)
    const omega = Math.sqrt(G * centralMass / (orbitalRadius * orbitalRadius * orbitalRadius));
    const orbitalVelocity = omega * orbitalRadius;
    const Fg = G * centralMass * orbiterMass / (orbitalRadius * orbitalRadius);
    const period = (2 * Math.PI) / omega;
    const KE = 0.5 * orbiterMass * orbitalVelocity * orbitalVelocity;
    const PE = -G * centralMass * orbiterMass / orbitalRadius;
    const totalE = KE + PE;

    // Scale: map orbitalRadius to ~160px
    const SCALE = 160;
    const theta = omega * time;
    const orbX = CX + SCALE * Math.cos(theta);
    const orbY = CY - SCALE * Math.sin(theta);

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    // Gravitational field lines
    if (showFieldLines) {
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(CX + 35 * Math.cos(ang), CY - 35 * Math.sin(ang));
        ctx.lineTo(CX + 260 * Math.cos(ang), CY - 260 * Math.sin(ang));
        ctx.strokeStyle = "rgba(52,211,153,0.06)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Arrow inward at r=180
        const arwR = 130;
        const arwX = CX + arwR * Math.cos(ang);
        const arwY = CY - arwR * Math.sin(ang);
        const inAng = ang + Math.PI; // points inward
        ctx.beginPath();
        ctx.moveTo(arwX, arwY);
        ctx.lineTo(arwX + 7 * Math.cos(inAng - 0.4), arwY - 7 * Math.sin(inAng - 0.4));
        ctx.moveTo(arwX, arwY);
        ctx.lineTo(arwX + 7 * Math.cos(inAng + 0.4), arwY - 7 * Math.sin(inAng + 0.4));
        ctx.strokeStyle = "rgba(52,211,153,0.12)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // Equipotential rings
      [80, 130, 200].forEach(r => {
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(52,211,153,0.04)";
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Orbital path
    ctx.beginPath();
    ctx.arc(CX, CY, SCALE, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.orbit + "30";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Glow ring
    ctx.beginPath();
    ctx.arc(CX, CY, SCALE, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.orbit + "08";
    ctx.lineWidth = 20;
    ctx.stroke();

    // Trail
    if (showTrail) {
      trailRef.current.push({ x: orbX, y: orbY, a: 1 });
      if (trailRef.current.length > 120) trailRef.current.shift();
      trailRef.current.forEach(p => {
        p.a -= 0.005;
        if (p.a <= 0) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.a * 0.4})`;
        ctx.fill();
      });
    } else {
      trailRef.current = [];
    }

    // Vectors
    const vecLen = 55;
    // Gravity (toward central body)
    if (showVectors.gravity) {
      const gAngle = Math.atan2(CY - orbY, CX - orbX);
      drawArrow(ctx, orbX, orbY,
        orbX + vecLen * Math.cos(gAngle),
        orbY + vecLen * Math.sin(gAngle),
        "Fg", COLORS.gravity);
    }
    // Velocity (tangent, perpendicular to radius, in direction of motion)
    if (showVectors.velocity) {
      const vAngle = theta + Math.PI / 2;
      drawArrow(ctx, orbX, orbY,
        orbX + vecLen * Math.cos(vAngle),
        orbY - vecLen * Math.sin(vAngle),
        "v", COLORS.velocity);
    }
    // Centripetal accel (toward center)
    if (showVectors.centripetal) {
      const cAngle = Math.atan2(CY - orbY, CX - orbX);
      drawArrow(ctx, orbX, orbY,
        orbX + (vecLen * 0.7) * Math.cos(cAngle),
        orbY + (vecLen * 0.7) * Math.sin(cAngle),
        "ac", COLORS.centripetal);
    }

    // Central body (planet/star)
    const centralR = 28;
    const cGrad = ctx.createRadialGradient(CX - 4, CY - 4, 0, CX, CY, centralR);
    cGrad.addColorStop(0, "#fbbf24");
    cGrad.addColorStop(0.5, "#f97316");
    cGrad.addColorStop(1, "#ea580c");
    ctx.beginPath();
    ctx.arc(CX, CY, centralR, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;
    ctx.shadowBlur = 40;
    ctx.shadowColor = "#f97316";
    ctx.fill();
    ctx.shadowBlur = 0;
    // Atmosphere glow
    ctx.beginPath();
    ctx.arc(CX, CY, centralR + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(249,115,22,0.15)";
    ctx.lineWidth = 6;
    ctx.stroke();
    // Label
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 9px Inter";
    ctx.textAlign = "center";
    ctx.fillText("M", CX, CY + 3);

    // Orbiter
    const orbR = 12;
    const oGrad = ctx.createRadialGradient(orbX - 2, orbY - 2, 0, orbX, orbY, orbR);
    oGrad.addColorStop(0, "#a78bfa");
    oGrad.addColorStop(1, "#7c3aed");
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fillStyle = oGrad;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.orbit;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 7px Inter";
    ctx.fillText("m", orbX, orbY + 3);

    // Radius line
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(orbX, orbY);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // R label at midpoint
    const midX = (CX + orbX) / 2, midY = (CY + orbY) / 2;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("r", midX + 10, midY - 6);

    // ── Legend (top-right) ──
    const lx = W - 185, ly = 35;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, lx - 10, ly - 18, 180, 90, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = "bold 9px Inter";
    ctx.textAlign = "left";
    [
      { c: COLORS.gravity, l: "Fg – Gravitational Force" },
      { c: COLORS.velocity, l: "v  – Orbital Velocity" },
      { c: COLORS.centripetal, l: "ac – Centripetal Accel" },
    ].forEach((it, i) => {
      ctx.fillStyle = it.c;
      ctx.fillText("■", lx, ly + i * 22);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(it.l, lx + 14, ly + i * 22);
    });

    // ── HUD (bottom) ──
    const hudItems = [
      { l: "Fg", val: Fg.toExponential(2) + " N", c: COLORS.gravity },
      { l: "v_orb", val: orbitalVelocity.toExponential(2) + " m/s", c: COLORS.velocity },
      { l: "T", val: period.toFixed(0) + " s", c: COLORS.orbit },
      { l: "ω", val: omega.toExponential(3) + " rad/s", c: COLORS.centripetal },
    ];
    const hudY = H - 62;
    hudItems.forEach((it, i) => {
      const hx = 18 + i * 145;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      roundRect(ctx, hx, hudY, 136, 48, 8);
      ctx.fill();
      ctx.fillStyle = it.c;
      ctx.font = "bold 9px Inter";
      ctx.textAlign = "left";
      ctx.fillText(it.l, hx + 10, hudY + 16);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(it.val, hx + 10, hudY + 34);
    });

    // ── Energy panel (bottom-right) ──
    const ex = W - 180, ey = H - 145;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, ex - 8, ey - 16, 170, 130, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 9px Inter";
    ctx.textAlign = "left";
    ctx.fillText("Orbital Energy", ex, ey);
    const barW = 120;
    const safeMax = Math.max(Math.abs(KE), Math.abs(PE), 0.001);
    [
      [KE, "#10b981", "KE = ½mv²"],
      [Math.abs(PE), "#f97316", "|PE| = GMm/r"],
    ].forEach(([val, col, lbl], i) => {
      const y2 = ey + 22 + i * 46;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, ex, y2 + 14, barW, 10, 4);
      ctx.fill();
      ctx.fillStyle = col as string;
      const w = Math.max(((val as number) / safeMax) * barW, 2);
      roundRect(ctx, ex, y2 + 14, w, 10, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "bold 8px Inter";
      ctx.fillText(`${lbl}: ${(val as number).toExponential(2)}`, ex, y2 + 12);
    });
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "bold 9px Inter";
    ctx.fillText(`Total E: ${totalE.toExponential(2)} J`, ex, ey + 116);
  }, [centralMass, orbiterMass, orbitalRadius, time, isPlaying, showVectors, showTrail, showFieldLines, G]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">Gravitation Engine</div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]" : "bg-rose-500"} animate-pulse`} />
          <div className="text-white/80 font-mono text-xs">{isPlaying ? "ORBITING" : "IDLE"}</div>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ──
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  label: string, color: string
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = 9;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  const lx = x2 + 14 * Math.cos(angle), ly = y2 + 14 * Math.sin(angle);
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  const m = ctx.measureText(label);
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(lx - 3, ly - 10, m.width + 6, 14);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(label, lx, ly);
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

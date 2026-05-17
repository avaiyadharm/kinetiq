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
}

const COLORS = {
  obj1: "#8b5cf6",
  obj2: "#06b6d4",
  velocity: "#f59e0b",
  momentum: "#ec4899",
  elastic: "#10b981",
  inelastic: "#f97316",
  flash: "#ffffff",
};

export const CollisionCanvas: React.FC<CollisionCanvasProps> = ({
  mass1, mass2, v1, v2, v1Post, v2Post,
  pos1, pos2, isPlaying, hasCollided, collisionType,
  showVectors, showTrail, time,
  keBefore, keAfter, coeffRestitution,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trail1Ref = useRef<{ x: number; y: number; a: number }[]>([]);
  const trail2Ref = useRef<{ x: number; y: number; a: number }[]>([]);
  const flashRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const trackY = H * 0.48;

    // Radii proportional to mass (visually capped)
    const r1 = Math.max(16, Math.min(40, 14 + mass1 * 2.5));
    const r2 = Math.max(16, Math.min(40, 14 + mass2 * 2.5));

    // Map normalised positions to canvas X
    const x1 = 80 + pos1 * (W - 160);
    const x2 = 80 + pos2 * (W - 160);

    ctx.clearRect(0, 0, W, H);

    // ── Background Grid ──
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    // ── Track line ──
    ctx.beginPath();
    ctx.moveTo(40, trackY);
    ctx.lineTo(W - 40, trackY);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ground / surface
    ctx.fillStyle = "rgba(255,255,255,0.015)";
    ctx.fillRect(40, trackY, W - 80, 4);

    // ── Collision flash ──
    if (hasCollided && flashRef.current < 1) {
      flashRef.current = 1;
    }
    if (flashRef.current > 0) {
      const midX = (x1 + x2) / 2;
      const flashR = 80 * flashRef.current;
      const grad = ctx.createRadialGradient(midX, trackY, 0, midX, trackY, flashR);
      grad.addColorStop(0, `rgba(255,255,255,${0.25 * flashRef.current})`);
      grad.addColorStop(0.5, `rgba(139,92,246,${0.1 * flashRef.current})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(midX - flashR, trackY - flashR, flashR * 2, flashR * 2);
      flashRef.current -= 0.02;
    }

    // ── Trails ──
    if (showTrail) {
      trail1Ref.current.push({ x: x1, y: trackY, a: 1 });
      trail2Ref.current.push({ x: x2, y: trackY, a: 1 });
      if (trail1Ref.current.length > 80) trail1Ref.current.shift();
      if (trail2Ref.current.length > 80) trail2Ref.current.shift();
      [{ trail: trail1Ref.current, color: COLORS.obj1 }, { trail: trail2Ref.current, color: COLORS.obj2 }].forEach(({ trail, color }) => {
        trail.forEach(p => {
          p.a -= 0.008;
          if (p.a <= 0) return;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          const [r, g, b] = hexToRgb(color);
          ctx.fillStyle = `rgba(${r},${g},${b},${p.a * 0.35})`;
          ctx.fill();
        });
      });
    } else {
      trail1Ref.current = [];
      trail2Ref.current = [];
    }

    // ── Velocity Vectors ──
    const vecScale = 30;
    if (showVectors.velocity) {
      const currV1 = hasCollided ? v1Post : v1;
      const currV2 = hasCollided ? v2Post : v2;
      if (Math.abs(currV1) > 0.01) drawArrow(ctx, x1, trackY - r1 - 8, x1 + currV1 * vecScale, trackY - r1 - 8, "v₁", COLORS.velocity);
      if (Math.abs(currV2) > 0.01) drawArrow(ctx, x2, trackY - r2 - 8, x2 + currV2 * vecScale, trackY - r2 - 8, "v₂", COLORS.velocity);
    }
    if (showVectors.momentum) {
      const currV1 = hasCollided ? v1Post : v1;
      const currV2 = hasCollided ? v2Post : v2;
      const p1 = mass1 * currV1;
      const p2 = mass2 * currV2;
      const momScale = 15;
      if (Math.abs(p1) > 0.01) drawArrow(ctx, x1, trackY + r1 + 12, x1 + p1 * momScale, trackY + r1 + 12, "p₁", COLORS.momentum);
      if (Math.abs(p2) > 0.01) drawArrow(ctx, x2, trackY + r2 + 12, x2 + p2 * momScale, trackY + r2 + 12, "p₂", COLORS.momentum);
    }

    // ── Object 1 ──
    const g1 = ctx.createRadialGradient(x1 - 4, trackY - 4, 0, x1, trackY, r1);
    g1.addColorStop(0, "#c4b5fd");
    g1.addColorStop(0.5, COLORS.obj1);
    g1.addColorStop(1, "#5b21b6");
    ctx.beginPath();
    ctx.arc(x1, trackY, r1, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLORS.obj1;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Label
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("m₁", x1, trackY + 4);
    // Mass label below
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 9px Inter";
    ctx.fillText(`${mass1.toFixed(1)} kg`, x1, trackY + r1 + 42);

    // ── Object 2 ──
    const g2 = ctx.createRadialGradient(x2 - 4, trackY - 4, 0, x2, trackY, r2);
    g2.addColorStop(0, "#67e8f9");
    g2.addColorStop(0.5, COLORS.obj2);
    g2.addColorStop(1, "#0e7490");
    ctx.beginPath();
    ctx.arc(x2, trackY, r2, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.shadowBlur = 25;
    ctx.shadowColor = COLORS.obj2;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("m₂", x2, trackY + 4);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 9px Inter";
    ctx.fillText(`${mass2.toFixed(1)} kg`, x2, trackY + r2 + 42);

    // ── Collision Type Badge ──
    const badgeX = W / 2;
    const badgeY = 46;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, badgeX - 80, badgeY - 14, 160, 28, 14);
    ctx.fill();
    ctx.strokeStyle = collisionType === "elastic" ? "rgba(16,185,129,0.3)" : "rgba(249,115,22,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = collisionType === "elastic" ? COLORS.elastic : COLORS.inelastic;
    ctx.font = "bold 10px Inter";
    ctx.textAlign = "center";
    ctx.fillText(collisionType === "elastic" ? "● ELASTIC COLLISION" : "● INELASTIC COLLISION", badgeX, badgeY + 1);

    // ── Conservation Panel (bottom-right) ──
    const cpX = W - 220, cpY = H - 130;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, cpX, cpY, 205, 115, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 9px Inter";
    ctx.textAlign = "left";
    ctx.fillText("CONSERVATION CHECK", cpX + 12, cpY + 18);

    const pBefore = (mass1 * v1 + mass2 * v2);
    const pAfter = hasCollided ? (mass1 * v1Post + mass2 * v2Post) : pBefore;

    // Momentum
    ctx.fillStyle = COLORS.momentum;
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.fillText(`p_before = ${pBefore.toFixed(2)} kg·m/s`, cpX + 12, cpY + 38);
    ctx.fillText(`p_after  = ${pAfter.toFixed(2)} kg·m/s`, cpX + 12, cpY + 54);

    // Check mark
    const pConserved = Math.abs(pBefore - pAfter) < 0.01;
    ctx.fillStyle = pConserved ? "#34d399" : "#f87171";
    ctx.font = "bold 9px Inter";
    ctx.fillText(pConserved ? "✓ Momentum conserved" : "✗ Calculating...", cpX + 12, cpY + 72);

    // KE
    ctx.fillStyle = COLORS.velocity;
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.fillText(`KE_before = ${keBefore.toFixed(2)} J`, cpX + 12, cpY + 90);
    ctx.fillText(`KE_after  = ${keAfter.toFixed(2)} J`, cpX + 12, cpY + 106);

    // ── HUD (bottom) ──
    const hudItems = [
      { l: "v₁", val: `${(hasCollided ? v1Post : v1).toFixed(2)} m/s`, c: COLORS.obj1 },
      { l: "v₂", val: `${(hasCollided ? v2Post : v2).toFixed(2)} m/s`, c: COLORS.obj2 },
      { l: "e", val: coeffRestitution.toFixed(2), c: collisionType === "elastic" ? COLORS.elastic : COLORS.inelastic },
      { l: "t", val: `${time.toFixed(2)} s`, c: "rgba(255,255,255,0.6)" },
    ];
    const hudY = H - 52;
    hudItems.forEach((it, i) => {
      const hx = 18 + i * 130;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      roundRect(ctx, hx, hudY, 120, 42, 8);
      ctx.fill();
      ctx.fillStyle = it.c;
      ctx.font = "bold 9px Inter";
      ctx.textAlign = "left";
      ctx.fillText(it.l, hx + 10, hudY + 14);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(it.val, hx + 10, hudY + 30);
    });

    // ── Legend (top-right) ──
    const lx = W - 185, ly = 35;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, lx - 10, ly - 18, 180, 68, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = "bold 9px Inter";
    ctx.textAlign = "left";
    [
      { c: COLORS.velocity, l: "v – Velocity Vector" },
      { c: COLORS.momentum, l: "p – Momentum Vector" },
    ].forEach((it, i) => {
      ctx.fillStyle = it.c;
      ctx.fillText("■", lx, ly + i * 22);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(it.l, lx + 14, ly + i * 22);
    });

  }, [mass1, mass2, v1, v2, v1Post, v2Post, pos1, pos2, isPlaying, hasCollided, collisionType, showVectors, showTrail, time, keBefore, keAfter, coeffRestitution]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">Collision Engine</div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]" : "bg-rose-500"} animate-pulse`} />
          <div className="text-white/80 font-mono text-xs">
            {isPlaying ? (hasCollided ? "POST-COLLISION" : "APPROACHING") : "IDLE"}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ──
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [255, 255, 255];
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  label: string, color: string
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = 8;
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

"use client";
import React, { useEffect, useRef } from "react";

interface CollisionCanvasProps {
  mass1: number; mass2: number;
  v1: number; v2: number;
  v1Post: number; v2Post: number;
  pos1: number; pos2: number;
  isPlaying: boolean; hasCollided: boolean;
  collisionType: "elastic" | "inelastic";
  showVectors: { velocity: boolean; momentum: boolean };
  showTrail: boolean; time: number;
  keBefore: number; keAfter: number;
  coeffRestitution: number;
  showCoM?: boolean; showForceVectors?: boolean; showGridOverlays?: boolean;
}

const C = {
  obj1: "#8b5cf6", obj1g: "rgba(139,92,246,0.35)",
  obj2: "#06b6d4", obj2g: "rgba(6,182,212,0.35)",
  vel: "#f59e0b", mom: "#ec4899",
  elastic: "#10b981", inelastic: "#f97316",
  force: "#ef4444", com: "#eab308",
  grid: "rgba(39,39,42,0.25)",
};

export const CollisionCanvas: React.FC<CollisionCanvasProps> = (props) => {
  const {
    mass1, mass2, v1, v2, v1Post, v2Post, pos1, pos2,
    isPlaying, hasCollided, coeffRestitution,
    showVectors, showTrail, time, keBefore, keAfter,
    showCoM = true, showForceVectors = true, showGridOverlays = true,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastCollidedRef = useRef(false);
  const collisionTimeRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const sparksRef = useRef<{ x: number; y: number; vx: number; vy: number; age: number; max: number; col: string }[]>([]);
  const swRef = useRef<{ x: number; y: number; r: number; maxR: number; op: number; active: boolean } | null>(null);
  const trail1Ref = useRef<{ x: number; y: number; a: number }[]>([]);
  const trail2Ref = useRef<{ x: number; y: number; a: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const W = rect.width, H = rect.height;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr;
    }
    ctx.resetTransform(); ctx.scale(dpr, dpr);

    const TY = H * 0.52;
    const RW = W - 160;
    const r1 = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
    const r2 = Math.max(18, Math.min(42, 16 + mass2 * 2.5));
    const x1 = 80 + pos1 * RW;
    const x2 = 80 + pos2 * RW;

    // --- spawn effects on collision ---
    if (hasCollided && !lastCollidedRef.current) {
      collisionTimeRef.current = time;
      lastCollidedRef.current = true;
      const mid = (x1 + x2) / 2;
      swRef.current = { x: mid, y: TY, r: 0, maxR: 130, op: 1, active: true };
      const col = coeffRestitution > 0.5 ? C.elastic : C.inelastic;
      sparksRef.current = Array.from({ length: 20 }, () => {
        const a = -Math.PI / 4 - Math.random() * (Math.PI / 2);
        const sp = 110 + Math.random() * 170;
        return { x: mid, y: TY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, max: 0.3 + Math.random() * 0.3, col };
      });
    }
    if (!hasCollided) {
      lastCollidedRef.current = false;
      collisionTimeRef.current = null;
      sparksRef.current = []; swRef.current = null;
    }

    let dt = time - lastTimeRef.current;
    if (dt < 0 || dt > 0.1) dt = 0;
    lastTimeRef.current = time;

    if (isPlaying && dt > 0) {
      sparksRef.current = sparksRef.current
        .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 380 * dt, age: p.age + dt }))
        .filter(p => p.age < p.max);
    }

    // squish
    let sq1 = 1, sq2 = 1;
    let deforming = false;
    if (collisionTimeRef.current !== null) {
      const ts = time - collisionTimeRef.current;
      if (ts >= 0 && ts < 0.3) {
        deforming = true;
        const f = Math.min(0.18, Math.abs(v1 - v2) * 0.032) * Math.exp(-ts * 11) * Math.sin(ts * Math.PI * 2 / 0.3);
        const M = mass1 + mass2;
        sq1 = 1 - f * (mass2 / M) * coeffRestitution;
        sq2 = 1 + f * (mass1 / M) * coeffRestitution;
      }
    }

    ctx.clearRect(0, 0, W, H);

    // --- grid ---
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (showGridOverlays) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.font = "8px 'JetBrains Mono',monospace";
      ctx.textAlign = "center";
      for (let i = 0; i <= 10; i++) {
        const mx = 80 + (i / 10) * RW;
        ctx.fillRect(mx - 0.5, TY - 6, 1, 12);
        ctx.fillText(`${i.toFixed(0)}m`, mx, TY + 20);
      }
    }

    // --- track ---
    const gt = ctx.createLinearGradient(0, TY - 2, 0, TY + 6);
    gt.addColorStop(0, "#27272a"); gt.addColorStop(0.5, "#3f3f46"); gt.addColorStop(1, "#18181b");
    ctx.fillStyle = gt;
    ctx.fillRect(40, TY - 2, W - 80, 4);

    // bumpers
    [[48, "L"], [W - 48, "R"]].forEach(([bx, side]) => {
      const bxn = bx as number;
      ctx.fillStyle = "rgba(63,63,70,0.9)"; ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (side === "L") ctx.rect(bxn - 18, TY - 22, 18, 32); else ctx.rect(bxn, TY - 22, 18, 32);
      ctx.fill(); ctx.stroke();
    });

    // --- anticipation predictor ---
    const cV1 = hasCollided ? v1Post : v1;
    const cV2 = hasCollided ? v2Post : v2;
    const relV = cV1 - cV2;
    if (!hasCollided && relV > 0) {
      const lDist = (r1 + r2) / RW;
      const remN = pos2 - pos1 - lDist;
      if (remN > 0) {
        const ttc = remN / relV;
        const xi = 80 + (pos1 + cV1 * ttc + r1 / RW) * RW;
        ctx.fillStyle = `rgba(245,158,11,${0.025 + Math.abs(Math.sin(time * 4)) * 0.04})`;
        ctx.fillRect(xi - 25, 0, 50, H);
        ctx.strokeStyle = "rgba(245,158,11,0.35)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(xi, 30); ctx.lineTo(xi, H - 30); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.vel; ctx.font = "bold 8px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
        ctx.fillText(`ETA ${ttc.toFixed(2)}s`, xi, 44);
        ctx.beginPath(); ctx.arc(xi, TY, 5, 0, Math.PI * 2); ctx.strokeStyle = C.vel; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // --- trails ---
    if (showTrail) {
      if (isPlaying) {
        trail1Ref.current.push({ x: x1, y: TY, a: 1 });
        trail2Ref.current.push({ x: x2, y: TY, a: 1 });
      }
      if (trail1Ref.current.length > 60) trail1Ref.current.shift();
      if (trail2Ref.current.length > 60) trail2Ref.current.shift();
      [[trail1Ref.current, C.obj1], [trail2Ref.current, C.obj2]].forEach(([trail, col]) => {
        (trail as { x: number; y: number; a: number }[]).forEach(p => {
          if (isPlaying) p.a -= 0.012;
          if (p.a <= 0) return;
          const [r, g, b] = hexRGB(col as string);
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.a * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${p.a * 0.22})`; ctx.fill();
        });
      });
    } else { trail1Ref.current = []; trail2Ref.current = []; }

    // --- shockwave ---
    if (swRef.current?.active) {
      const sw = swRef.current;
      if (isPlaying && dt > 0) { sw.r += 220 * dt; sw.op = Math.max(0, 1 - sw.r / sw.maxR); if (sw.r >= sw.maxR) sw.active = false; }
      if (sw.active) {
        ctx.strokeStyle = coeffRestitution > 0.5 ? `rgba(16,185,129,${sw.op * 0.6})` : `rgba(249,115,22,${sw.op * 0.6})`;
        ctx.lineWidth = 2.5; ctx.shadowBlur = 16; ctx.shadowColor = coeffRestitution > 0.5 ? C.elastic : C.inelastic;
        ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
        // inner ring
        if (sw.r > 20) {
          ctx.strokeStyle = coeffRestitution > 0.5 ? `rgba(16,185,129,${sw.op * 0.3})` : `rgba(249,115,22,${sw.op * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r * 0.55, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }

    // --- sparks ---
    sparksRef.current.forEach(p => {
      const a = 1 - p.age / p.max;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = p.col; ctx.shadowBlur = 6; ctx.shadowColor = p.col; ctx.globalAlpha = a;
      ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    // --- velocity vectors ---
    const VS = 28, MS = 10;
    if (showVectors.velocity) {
      if (Math.abs(cV1) > 0.01) arrow(ctx, x1, TY - r1 - 10, x1 + cV1 * VS, TY - r1 - 10, `${cV1 > 0 ? "+" : ""}${cV1.toFixed(2)} m/s`, C.vel, 2);
      if (Math.abs(cV2) > 0.01) arrow(ctx, x2, TY - r2 - 10, x2 + cV2 * VS, TY - r2 - 10, `${cV2 > 0 ? "+" : ""}${cV2.toFixed(2)} m/s`, C.vel, 2);
    }
    if (showVectors.momentum) {
      const p1 = mass1 * cV1, p2 = mass2 * cV2;
      if (Math.abs(p1) > 0.01) arrow(ctx, x1, TY + r1 + 12, x1 + p1 * MS, TY + r1 + 12, `${p1 > 0 ? "+" : ""}${p1.toFixed(2)} kg·m/s`, C.mom, 2);
      if (Math.abs(p2) > 0.01) arrow(ctx, x2, TY + r2 + 12, x2 + p2 * MS, TY + r2 + 12, `${p2 > 0 ? "+" : ""}${p2.toFixed(2)} kg·m/s`, C.mom, 2);
    }

    // --- Newton 3rd Law forces ---
    if (showForceVectors && deforming && collisionTimeRef.current !== null) {
      const ts = time - collisionTimeRef.current;
      const fMag = Math.abs(v1 - v2) * 200 * Math.sin(ts * Math.PI / 0.3);
      if (fMag > 2) {
        arrow(ctx, x1, TY, x1 - fMag * 0.3, TY, `F₂₁`, C.force, 4);
        arrow(ctx, x2, TY, x2 + fMag * 0.3, TY, `F₁₂`, C.force, 4);
        ctx.fillStyle = C.force; ctx.font = "bold 8px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
        ctx.fillText("F₁₂ = −F₂₁  (Newton 3rd)", (x1 + x2) / 2, TY - 52);
      }
    }

    // --- object 1 ---
    drawSphere(ctx, x1, TY, r1, sq1, 1 / sq1, mass1, cV1, C.obj1, C.obj1g, "#c4b5fd", 1);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "8px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText(`m₁=${mass1.toFixed(1)}kg`, x1, TY + r1 + 34);
    const ke1 = 0.5 * mass1 * cV1 * cV1;
    ctx.fillText(`KE=${ke1.toFixed(1)}J`, x1, TY + r1 + 44);

    // --- object 2 ---
    drawSphere(ctx, x2, TY, r2, sq2, 1 / sq2, mass2, cV2, C.obj2, C.obj2g, "#99f6e4", 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.textAlign = "center";
    ctx.fillText(`m₂=${mass2.toFixed(1)}kg`, x2, TY + r2 + 34);
    const ke2 = 0.5 * mass2 * cV2 * cV2;
    ctx.fillText(`KE=${ke2.toFixed(1)}J`, x2, TY + r2 + 44);

    // --- CoM ---
    if (showCoM) {
      const posC = (mass1 * pos1 + mass2 * pos2) / (mass1 + mass2);
      const xC = 80 + posC * RW;
      const vCM = (mass1 * cV1 + mass2 * cV2) / (mass1 + mass2);
      ctx.strokeStyle = "rgba(234,179,8,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(xC, TY - 55); ctx.lineTo(xC, TY + 55); ctx.stroke(); ctx.setLineDash([]);
      // dial
      ctx.save(); ctx.translate(xC, TY);
      ctx.fillStyle = C.com;
      for (const [s, e] of [[0, Math.PI / 2], [Math.PI, Math.PI * 1.5]]) {
        ctx.beginPath(); ctx.arc(0, 0, 7, s, e); ctx.lineTo(0, 0); ctx.fill();
      }
      ctx.strokeStyle = C.com; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = C.com; ctx.font = "bold 7px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
      ctx.fillText("CoM", xC, TY - 12);
      if (Math.abs(vCM) > 0.01) arrow(ctx, xC, TY - 34, xC + vCM * VS, TY - 34, `v_cm=${vCM.toFixed(2)}`, C.com, 2);
    }

    // --- relative velocity meter (top-right HUD) ---
    const relSpeed = Math.abs(cV1 - cV2);
    const maxRelSpeed = 12;
    const meterW = 110, meterH = 10;
    const meterX = W - meterW - 20, meterY = 24;
    ctx.fillStyle = "rgba(9,9,11,0.75)"; roundRect(ctx, meterX - 8, meterY - 14, meterW + 16, meterH + 26, 6); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; roundRect(ctx, meterX - 8, meterY - 14, meterW + 16, meterH + 26, 6); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.08)"; roundRect(ctx, meterX, meterY, meterW, meterH, 3); ctx.fill();
    const fillW = Math.min(meterW, (relSpeed / maxRelSpeed) * meterW);
    const meterCol = relSpeed > 6 ? C.force : relSpeed > 3 ? C.vel : C.elastic;
    const mg = ctx.createLinearGradient(meterX, 0, meterX + fillW, 0);
    mg.addColorStop(0, meterCol); mg.addColorStop(1, meterCol + "99");
    ctx.fillStyle = mg; roundRect(ctx, meterX, meterY, fillW, meterH, 3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "7px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
    ctx.fillText("REL-VEL", meterX, meterY - 4);
    ctx.textAlign = "right";
    ctx.fillStyle = meterCol; ctx.font = "bold 8px 'JetBrains Mono',monospace";
    ctx.fillText(`${relSpeed.toFixed(2)} m/s`, meterX + meterW, meterY + meterH + 10);

    // --- conservation lock indicator ---
    const keIcon = hasCollided ? (Math.abs(keAfter - keBefore) / (keBefore || 1) < 0.005 ? "✓ KE CONSERVED" : `ΔKE = ${(keBefore - keAfter).toFixed(1)} J LOST`) : "";
    if (keIcon) {
      const isConserved = keIcon.startsWith("✓");
      ctx.fillStyle = isConserved ? "rgba(16,185,129,0.12)" : "rgba(249,115,22,0.1)";
      roundRect(ctx, 20, 22, 140, 18, 4); ctx.fill();
      ctx.fillStyle = isConserved ? "#10b981" : "#f97316";
      ctx.font = "bold 8px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
      ctx.fillText(keIcon, 90, 34);
    }

  }, [mass1, mass2, v1, v2, v1Post, v2Post, pos1, pos2, isPlaying, hasCollided,
    showVectors, showTrail, time, keBefore, keAfter, coeffRestitution,
    showCoM, showForceVectors, showGridOverlays]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(59,130,246,0.05),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/[0.03] via-transparent to-[#06b6d4]/[0.03] pointer-events-none" />
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none z-20">
        <div className="text-[9px] text-white/25 uppercase tracking-[0.3em] font-black">Collision Engine</div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-600"} animate-pulse`} />
          <span className="text-white/60 font-mono text-[10px] font-bold">
            {isPlaying ? (hasCollided ? "POST-IMPACT" : "APPROACHING") : "ARMED"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawSphere(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  sx: number, sy: number,
  mass: number, vel: number,
  stroke: string, glow: string, coreCol: string,
  _id: number
) {
  const ke = 0.5 * mass * vel * vel;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy);
  // aura
  const ga = ctx.createRadialGradient(0, 0, r - 2, 0, 0, r + 8 + Math.min(16, ke * 0.5));
  ga.addColorStop(0, glow); ga.addColorStop(1, "transparent");
  ctx.fillStyle = ga; ctx.beginPath(); ctx.arc(0, 0, r + 8 + Math.min(16, ke * 0.5), 0, Math.PI * 2); ctx.fill();
  // body
  ctx.fillStyle = "rgba(14,14,18,0.9)"; ctx.strokeStyle = stroke; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // inner ring
  ctx.strokeStyle = stroke + "55"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.stroke();
  if (mass > 4) { ctx.strokeStyle = stroke + "30"; ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.stroke(); }
  // sheen
  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r - 3, -Math.PI / 3.2, -Math.PI * 2 / 3.2, true); ctx.stroke();
  // core
  const cs = Math.max(4, Math.min(r * 0.38, 2.5 + ke * 0.45));
  const gc = ctx.createRadialGradient(0, 0, 0, 0, 0, cs);
  gc.addColorStop(0, "#fff"); gc.addColorStop(0.35, coreCol); gc.addColorStop(1, "transparent");
  ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(0, 0, cs, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, color: string, w: number) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;
  const angle = Math.atan2(dy, dx), head = Math.max(7, w * 2.5);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.shadowBlur = 4; ctx.shadowColor = color;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath(); ctx.fill();
  const lx = x2 + 8 * Math.cos(angle), ly = y2 + 8 * Math.sin(angle);
  ctx.font = "bold 8px 'JetBrains Mono',monospace";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(9,9,11,0.8)";
  roundRect(ctx, lx - tw / 2 - 3, ly - 7, tw + 6, 13, 3); ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(label, lx, ly + 3);
  ctx.restore();
}

function hexRGB(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 255, 255];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

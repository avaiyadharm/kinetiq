"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { useKEStore } from "@/store/kineticEnergyStore";
import {
  kineticEnergy, gravitationalPE, rotationalKE, momentOfInertia,
  VEHICLES, getTrackY,
} from "@/lib/physics/kineticEnergy";

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  ke: "#3b82f6",
  pe: "#10b981",
  thermal: "#f97316",
  vel: "#f59e0b",
  force: "#ef4444",
  mom: "#ec4899",
  rot: "#8b5cf6",
  grid: "rgba(39,39,42,0.3)",
  surface: "#27272a",
  text: "rgba(255,255,255,0.7)",
  dim: "rgba(255,255,255,0.2)",
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  label: string, color: string, w = 2
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.max(7, w * 3);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.shadowBlur = 6; ctx.shadowColor = color;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath(); ctx.fill();
  if (label) {
    ctx.font = "bold 10px 'JetBrains Mono',monospace";
    const tw = ctx.measureText(label).width;
    const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2 - 10;
    ctx.fillStyle = "rgba(9,9,11,0.85)";
    rr(ctx, lx - tw / 2 - 4, ly - 9, tw + 8, 15, 3); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = "center";
    ctx.fillText(label, lx, ly + 3);
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawEnergyBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  ke: number, pe: number, thermal = 0
) {
  const total = ke + pe + thermal;
  if (total <= 0) return;
  const bw = total > 0 ? ke / total * w : 0;
  const pw = total > 0 ? pe / total * w : 0;
  const tw = w - bw - pw;

  // Background
  ctx.fillStyle = "rgba(9,9,11,0.7)";
  rr(ctx, x - 2, y - 2, w + 4, h + 4, 4); ctx.fill();

  // KE bar
  if (bw > 0) {
    const g = ctx.createLinearGradient(x, 0, x + bw, 0);
    g.addColorStop(0, C.ke); g.addColorStop(1, C.ke + "aa");
    ctx.fillStyle = g; rr(ctx, x, y, Math.max(0, bw), h, 3); ctx.fill();
  }
  // PE bar
  if (pw > 0) {
    const g2 = ctx.createLinearGradient(x + bw, 0, x + bw + pw, 0);
    g2.addColorStop(0, C.pe); g2.addColorStop(1, C.pe + "aa");
    ctx.fillStyle = g2; rr(ctx, x + bw, y, Math.max(0, pw), h, 3); ctx.fill();
  }
  // Thermal bar
  if (tw > 0) {
    ctx.fillStyle = C.thermal; rr(ctx, x + bw + pw, y, Math.max(0, tw), h, 3); ctx.fill();
  }

  // Labels
  ctx.font = "bold 9px 'JetBrains Mono',monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = C.ke; ctx.fillText(`KE ${ke.toFixed(1)}J`, x + 4, y + h - 4);
  if (pe > 0.5) {
    ctx.fillStyle = C.pe; ctx.fillText(`PE ${pe.toFixed(1)}J`, x + bw + 4, y + h - 4);
  }
  if (thermal > 0.5) {
    ctx.fillStyle = C.thermal; ctx.fillText(`Q ${thermal.toFixed(1)}J`, x + bw + pw + 4, y + h - 4);
  }
}

function chipHUD(
  ctx: CanvasRenderingContext2D,
  items: Array<{ label: string; value: string; color: string }>,
  x: number, y: number
) {
  const cw = 140, ch = 32, gap = 8;
  items.forEach((item, i) => {
    const cx = x + i * (cw + gap);
    ctx.fillStyle = "rgba(9,9,11,0.8)";
    rr(ctx, cx, y, cw, ch, 6); ctx.fill();
    ctx.strokeStyle = item.color + "55"; ctx.lineWidth = 1;
    rr(ctx, cx, y, cw, ch, 6); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "8px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
    ctx.fillText(item.label, cx + 8, y + 12);
    ctx.fillStyle = item.color;
    ctx.font = "bold 11px 'JetBrains Mono',monospace";
    ctx.fillText(item.value, cx + 8, y + 26);
  });
}

// ─── Mode Renderers ───────────────────────────────────────────────────────────

function renderFreeParticle(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { fp, showVelocityVectors, showForceVectors, showEnergyBar, showGrid } = store;
  if (showGrid) drawGrid(ctx, W, H);

  const TY = H * 0.62;
  const SCALE = W - 160;
  const OX = 80;

  // Surface
  const sg = ctx.createLinearGradient(0, TY, 0, TY + 6);
  sg.addColorStop(0, "#3f3f46"); sg.addColorStop(1, "#18181b");
  ctx.fillStyle = sg; ctx.fillRect(OX, TY, SCALE, 5);

  // Left/right wall
  ctx.fillStyle = "rgba(63,63,70,0.9)"; ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
  ctx.fillRect(OX - 20, TY - 40, 20, 60); ctx.strokeRect(OX - 20, TY - 40, 20, 60);
  ctx.fillRect(OX + SCALE, TY - 40, 20, 60); ctx.strokeRect(OX + SCALE, TY - 40, 20, 60);

  // Particle
  const norm = (fp.x % 10) / 10;
  const px = OX + norm * SCALE;
  const R = Math.max(18, Math.min(36, 12 + fp.mass * 2.5));
  const ke = kineticEnergy(fp.mass, fp.v);

  // Glow
  const glow = ctx.createRadialGradient(px, TY - R, 0, px, TY - R, R + 20 + ke * 0.15);
  glow.addColorStop(0, C.ke + "88"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, TY - R, R + 20 + ke * 0.15, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = "#0a0a0f"; ctx.strokeStyle = C.ke; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 16 + ke * 0.1; ctx.shadowColor = C.ke;
  ctx.beginPath(); ctx.arc(px, TY - R, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Highlight
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(px, TY - R, R - 3, -Math.PI / 3, -Math.PI * 2 / 3, true); ctx.stroke();

  // Labels
  ctx.fillStyle = C.text; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`m=${fp.mass.toFixed(1)}kg`, px, TY + 20);

  // Vectors
  if (showVelocityVectors && Math.abs(fp.v) > 0.1) {
    const vLen = fp.v * 8;
    arrow(ctx, px, TY - R * 2 - 8, px + vLen, TY - R * 2 - 8, `v=${fp.v.toFixed(2)} m/s`, C.vel, 2);
  }
  if (showForceVectors && Math.abs(fp.appliedForce) > 0.1) {
    arrow(ctx, px, TY - R, px + fp.appliedForce * 2, TY - R, `F=${fp.appliedForce.toFixed(1)}N`, C.force, 2);
  }

  if (showEnergyBar) {
    drawEnergyBar(ctx, OX, H - 70, SCALE, 18, ke, 0);
  }

  chipHUD(ctx, [
    { label: "KE", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "VELOCITY", value: `${fp.v.toFixed(3)} m/s`, color: C.vel },
    { label: "MOMENTUM", value: `${(fp.mass * fp.v).toFixed(3)} kg·m/s`, color: C.mom },
    { label: "FORCE", value: `${fp.appliedForce.toFixed(1)} N`, color: C.force },
  ], OX, 20);
}

function renderInclinedPlane(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { ip, showVelocityVectors, showEnergyBar, showGrid } = store;
  if (showGrid) drawGrid(ctx, W, H);

  const angle = ip.angle;
  const OX = 60, OY = H - 80;
  const rampLen = Math.min(W - 120, 520);
  const rx = OX + rampLen * Math.cos(angle);
  const ry = OY - rampLen * Math.sin(angle);

  // Ramp surface
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(OX, OY); ctx.lineTo(rx, ry); ctx.stroke();
  ctx.fillStyle = "rgba(63,63,70,0.4)";
  ctx.beginPath(); ctx.moveTo(OX, OY); ctx.lineTo(rx, ry); ctx.lineTo(rx, OY); ctx.closePath(); ctx.fill();

  // Angle arc
  ctx.strokeStyle = "rgba(245,158,11,0.6)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(OX, OY, 40, -angle, 0); ctx.stroke();
  ctx.fillStyle = C.vel; ctx.font = "12px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
  ctx.fillText(`θ=${(angle * 180 / Math.PI).toFixed(1)}°`, OX + 44, OY - 10);

  // Block on ramp
  const norm = ip.x / ip.trackLength;
  const bx = OX + norm * rampLen * Math.cos(angle);
  const by = OY - norm * rampLen * Math.sin(angle);
  const BS = 28;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(-angle);
  ctx.fillStyle = "#18181b"; ctx.strokeStyle = C.ke; ctx.lineWidth = 2;
  ctx.shadowBlur = 12; ctx.shadowColor = C.ke;
  rr(ctx, -BS / 2, -BS, BS, BS, 4); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.text; ctx.font = "bold 10px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`${ip.mass.toFixed(0)}kg`, 0, -BS / 2 + 4);
  ctx.restore();

  // Vectors on block
  if (showVelocityVectors && Math.abs(ip.v) > 0.05) {
    const vScale = ip.v * 12;
    arrow(ctx, bx, by, bx + vScale * Math.cos(angle), by - vScale * Math.sin(angle), `v=${ip.v.toFixed(2)}m/s`, C.vel, 2);
  }

  // Gravity component arrows
  const gravAlong = ip.mass * 9.81 * Math.sin(angle);
  const gravNorm = ip.mass * 9.81 * Math.cos(angle);
  const FS = 2.5;
  arrow(ctx, bx, by, bx + gravAlong * FS * Math.cos(angle), by - gravAlong * FS * Math.sin(angle), `${gravAlong.toFixed(1)}N`, C.force, 1.5);
  arrow(ctx, bx, by, bx + gravNorm * FS * Math.sin(angle), by + gravNorm * FS * Math.cos(angle), `N=${gravNorm.toFixed(1)}N`, C.pe, 1.5);

  // Height indicator
  const h = ip.height;
  ctx.strokeStyle = "rgba(16,185,129,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, OY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.pe; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`h=${h.toFixed(2)}m`, bx + 20, (by + OY) / 2);

  const ke = kineticEnergy(ip.mass, ip.v);
  const pe = gravitationalPE(ip.mass, h);

  if (showEnergyBar) {
    drawEnergyBar(ctx, 60, H - 70, W - 120, 18, ke, pe);
  }

  chipHUD(ctx, [
    { label: "KE", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "PE", value: `${pe.toFixed(2)} J`, color: C.pe },
    { label: "TOTAL E", value: `${(ke + pe).toFixed(2)} J`, color: "#a78bfa" },
    { label: "v", value: `${ip.v.toFixed(3)} m/s`, color: C.vel },
  ], 60, 20);
}

function renderProjectile(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { proj, showGrid, showEnergyBar } = store;
  if (showGrid) drawGrid(ctx, W, H);

  const OX = 60, OY = H - 80;
  const XSCALE = (W - 120) / Math.max(1, proj.landed ? proj.range : Math.max(proj.x, 1) * 1.2);
  const YSCALE = (H - 140) / Math.max(1, proj.maxHeight > 0 ? proj.maxHeight * 1.15 : 10);

  // Ground
  ctx.fillStyle = "#27272a"; ctx.fillRect(OX, OY, W - 120, 4);

  if (!proj.launched) {
    ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "14px 'JetBrains Mono',monospace";
    ctx.textAlign = "center";
    ctx.fillText("Set angle & speed, then press LAUNCH →", W / 2, H / 2);
    return;
  }

  // Trajectory arc (analytical ideal path shown in dim)
  if (proj.vx > 0) {
    const v0x = proj.launched ? proj.vx : 0;
    const v0y = proj.launched ? proj.vy : 0;
    ctx.strokeStyle = "rgba(59,130,246,0.15)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
    ctx.beginPath();
    for (let tx = 0; tx < (W - 120) / XSCALE; tx += 0.1) {
      const ty = v0y / v0x * tx - 9.81 / (2 * v0x * v0x) * tx * tx;
      if (ty < 0) break;
      const px = OX + tx * XSCALE, py = OY - ty * YSCALE;
      if (tx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  // Ball
  const bx = OX + proj.x * XSCALE;
  const by = OY - proj.y * YSCALE;
  const speed = Math.sqrt(proj.vx ** 2 + proj.vy ** 2);
  const ke = kineticEnergy(proj.mass, speed);
  const pe = gravitationalPE(proj.mass, proj.y);

  // Trail
  ctx.fillStyle = C.ke + "33";
  ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();

  // Glow
  const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 24 + ke * 0.02);
  glow.addColorStop(0, C.ke + "66"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bx, by, 24 + ke * 0.02, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#0a0a0f"; ctx.strokeStyle = C.ke; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 14; ctx.shadowColor = C.ke;
  ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Velocity vector components
  if (Math.abs(proj.vx) > 0.1) {
    arrow(ctx, bx, by, bx + proj.vx * XSCALE * 0.4, by, `vx=${proj.vx.toFixed(1)}`, C.vel, 1.5);
  }
  if (Math.abs(proj.vy) > 0.1) {
    arrow(ctx, bx, by, bx, by - proj.vy * YSCALE * 0.4, `vy=${proj.vy.toFixed(1)}`, C.pe, 1.5);
  }

  // Height dotted line
  ctx.strokeStyle = "rgba(16,185,129,0.35)"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(OX, by); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.pe; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "right";
  ctx.fillText(`h=${proj.y.toFixed(1)}m`, OX - 4, by + 4);

  if (showEnergyBar) {
    drawEnergyBar(ctx, 60, H - 70, W - 120, 18, ke, pe);
  }

  chipHUD(ctx, [
    { label: "KE", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "PE", value: `${pe.toFixed(2)} J`, color: C.pe },
    { label: "SPEED", value: `${speed.toFixed(2)} m/s`, color: C.vel },
    { label: "RANGE", value: `${proj.range.toFixed(1)} m`, color: C.dim },
  ], 60, 20);
}

function renderCollision(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { coll, showVelocityVectors, showEnergyBar, showGrid } = store;
  if (showGrid) drawGrid(ctx, W, H);

  const TY = H * 0.5;
  const OX = 60, SCALE = W - 120;
  const xScale = SCALE / coll.trackWidth;

  // Track
  const tg = ctx.createLinearGradient(0, TY - 2, 0, TY + 6);
  tg.addColorStop(0, "#3f3f46"); tg.addColorStop(1, "#18181b");
  ctx.fillStyle = tg; ctx.fillRect(OX, TY - 2, SCALE, 5);

  // Walls
  ctx.fillStyle = "rgba(63,63,70,0.9)"; ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(OX - 24, TY - 30, 24, 60); ctx.strokeRect(OX - 24, TY - 30, 24, 60);
  ctx.fillRect(OX + SCALE, TY - 30, 24, 60); ctx.strokeRect(OX + SCALE, TY - 30, 24, 60);

  const x1 = OX + coll.b1.x * xScale;
  const x2 = OX + coll.b2.x * xScale;
  const r1 = Math.max(16, Math.min(38, 12 + coll.b1.mass * 3)) * (xScale / 40);
  const r2 = Math.max(16, Math.min(38, 12 + coll.b2.mass * 3)) * (xScale / 40);

  // Collision flash
  if (coll.hasCollided && Math.abs(coll.b1.x - coll.b2.x) < coll.b1.radius + coll.b2.radius + 0.5) {
    ctx.fillStyle = `rgba(245,158,11,${0.05 + 0.08 * Math.sin(coll.t * 20)})`;
    ctx.fillRect(OX, 0, SCALE, H);
  }

  // Bodies
  [
    { x: x1, r: r1, v: coll.b1.v, m: coll.b1.mass, col: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
    { x: x2, r: r2, v: coll.b2.v, m: coll.b2.mass, col: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  ].forEach(({ x, r, v, m, col, glow }) => {
    const ke = kineticEnergy(m, v);
    const g = ctx.createRadialGradient(x, TY, r - 2, x, TY, r + 12 + ke * 0.03);
    g.addColorStop(0, glow); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, TY, r + 12 + ke * 0.03, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#0a0a0f"; ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    ctx.shadowBlur = 14; ctx.shadowColor = col;
    ctx.beginPath(); ctx.arc(x, TY, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = C.text; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText(`${m.toFixed(1)}kg`, x, TY + r + 18);
    ctx.fillStyle = col; ctx.font = "bold 10px 'JetBrains Mono',monospace";
    ctx.fillText(`KE=${ke.toFixed(1)}J`, x, TY + r + 32);

    if (showVelocityVectors && Math.abs(v) > 0.05) {
      arrow(ctx, x, TY - r - 12, x + v * 14, TY - r - 12, `${v.toFixed(2)} m/s`, C.vel, 2);
    }
  });

  // Conservation display
  const totalKE = kineticEnergy(coll.b1.mass, coll.b1.v) + kineticEnergy(coll.b2.mass, coll.b2.v);
  const totalMom = coll.b1.mass * coll.b1.v + coll.b2.mass * coll.b2.v;
  const keLost = coll.hasCollided ? Math.max(0, coll.KEBefore - coll.KEAfter) : 0;

  if (showEnergyBar) {
    drawEnergyBar(ctx, 60, H - 70, W - 120, 18, totalKE, 0, keLost);
  }

  chipHUD(ctx, [
    { label: "TOTAL KE", value: `${totalKE.toFixed(2)} J`, color: C.ke },
    { label: "MOMENTUM", value: `${totalMom.toFixed(3)} kg·m/s`, color: C.mom },
    { label: "e", value: `${coll.e.toFixed(2)}`, color: C.vel },
    { label: "ΔKE LOST", value: `${keLost.toFixed(2)} J`, color: C.thermal },
  ], 60, 20);
}

function renderRotational(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { rot, showGrid, showEnergyBar, showForceVectors } = store;
  if (showGrid) drawGrid(ctx, W, H);

  const cx = W / 2, cy = H / 2;
  const R = Math.min(120, Math.max(50, rot.radius * 260));
  const ke = rotationalKE(rot.I, rot.omega);

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R + 30 + ke * 0.05);
  glow.addColorStop(0, C.rot + "44"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R + 30 + ke * 0.05, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot.theta);

  // Shape rendering
  ctx.strokeStyle = C.rot; ctx.fillStyle = "#0d0d14"; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 16 + ke * 0.1; ctx.shadowColor = C.rot;

  switch (rot.shape) {
    case "disk": {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Spoke marks
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.strokeStyle = C.rot + "55"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * Math.cos(a), R * Math.sin(a)); ctx.stroke();
      }
      break;
    }
    case "ring": {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#09090b";
      ctx.beginPath(); ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.rot + "88"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case "sphere": {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.rot + "44"; ctx.lineWidth = 1;
      for (let e = -60; e <= 60; e += 30) {
        const ey = R * Math.sin(e * Math.PI / 180);
        const ex = R * Math.cos(e * Math.PI / 180);
        ctx.beginPath(); ctx.arc(0, 0, ex, 0, Math.PI * 2); ctx.stroke();
        // latitude
        ctx.beginPath(); ctx.moveTo(-ex, ey); ctx.lineTo(ex, ey); ctx.stroke();
      }
      break;
    }
    case "rod": {
      const rlen = R * 2;
      rr(ctx, -rlen / 2, -10, rlen, 20, 4); ctx.fill(); ctx.stroke();
      for (let i = -rlen / 2; i <= rlen / 2; i += 20) {
        ctx.strokeStyle = C.rot + "44"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(i, -10); ctx.lineTo(i, 10); ctx.stroke();
      }
      break;
    }
    default: {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Rotation direction indicator
  ctx.strokeStyle = C.vel + "aa"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, R + 14, 0, rot.omega > 0 ? Math.PI * 1.5 : -Math.PI * 1.5, rot.omega < 0);
  ctx.stroke();
  const arrowEnd = rot.omega > 0 ? { x: 0, y: -(R + 14) } : { x: 0, y: R + 14 };
  ctx.fillStyle = C.vel;
  ctx.beginPath(); ctx.arc(arrowEnd.x, arrowEnd.y, 4, 0, Math.PI * 2); ctx.fill();

  // Axle
  ctx.fillStyle = "#27272a"; ctx.strokeStyle = "#52525b"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.restore();

  // Torque arrow (tangential)
  if (showForceVectors && Math.abs(rot.torque) > 0.01) {
    const ta = rot.theta + Math.PI / 2;
    const tx1 = cx + R * Math.cos(rot.theta);
    const ty1 = cy + R * Math.sin(rot.theta);
    const tx2 = tx1 + rot.torque * 5 * Math.cos(ta);
    const ty2 = ty1 + rot.torque * 5 * Math.sin(ta);
    arrow(ctx, tx1, ty1, tx2, ty2, `τ=${rot.torque.toFixed(2)} N·m`, C.force, 2);
  }

  // ω label
  ctx.fillStyle = C.vel; ctx.font = "bold 14px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`ω = ${rot.omega.toFixed(3)} rad/s`, cx, cy + R + 55);
  ctx.fillStyle = C.rot; ctx.font = "12px 'JetBrains Mono',monospace";
  ctx.fillText(`I = ${rot.I.toFixed(4)} kg·m²`, cx, cy + R + 72);

  if (showEnergyBar) {
    drawEnergyBar(ctx, 60, H - 70, W - 120, 18, ke, 0);
  }

  chipHUD(ctx, [
    { label: "KE_rot", value: `${ke.toFixed(3)} J`, color: C.rot },
    { label: "ω", value: `${rot.omega.toFixed(3)} rad/s`, color: C.vel },
    { label: "α", value: `${rot.alpha.toFixed(3)} rad/s²`, color: C.force },
    { label: "I", value: `${rot.I.toFixed(4)} kg·m²`, color: C.dim },
  ], 60, 20);
}

function renderRollerCoaster(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { rc, rcTrack, showGrid, showEnergyBar } = store;
  if (showGrid) drawGrid(ctx, W, H);
  if (!rcTrack.length) return;

  const OX = 40, OY = H - 80;
  const XS = (W - 80) / rc.totalLength;
  const maxY = Math.max(...rcTrack.map(p => p.y));
  const YS = (H - 160) / Math.max(maxY, 1);

  // Track path
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 3;
  ctx.beginPath();
  rcTrack.forEach((p, i) => {
    const px = OX + p.x * XS, py = OY - p.y * YS;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // Track gradient fill under track
  ctx.strokeStyle = "#27272a"; ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(39,39,42,0.3)";
  ctx.beginPath();
  rcTrack.forEach((p, i) => {
    const px = OX + p.x * XS, py = OY - p.y * YS;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.lineTo(OX + rc.totalLength * XS, OY);
  ctx.lineTo(OX, OY);
  ctx.closePath(); ctx.fill();

  // Cart
  const norm = rc.s / rc.totalLength;
  const tIdx = Math.round(norm * (rcTrack.length - 1));
  const tp = rcTrack[Math.max(0, Math.min(tIdx, rcTrack.length - 1))];
  const cartX = OX + tp.x * XS;
  const cartY = OY - tp.y * YS;

  const ke = kineticEnergy(rc.mass, rc.v);
  const pe = gravitationalPE(rc.mass, tp.y);
  const total = ke + pe;

  // Cart glow
  const glowR = 16 + ke * 0.02;
  const glow = ctx.createRadialGradient(cartX, cartY, 0, cartX, cartY, glowR);
  glow.addColorStop(0, C.ke + "77"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cartX, cartY, glowR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#0a0a0f"; ctx.strokeStyle = C.ke; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 16; ctx.shadowColor = C.ke;
  rr(ctx, cartX - 14, cartY - 10, 28, 16, 4); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Wheels
  [cartX - 8, cartX + 8].forEach(wx => {
    ctx.fillStyle = "#27272a"; ctx.strokeStyle = "#52525b"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(wx, cartY + 10, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });

  // Height line
  ctx.strokeStyle = "rgba(16,185,129,0.35)"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(cartX, cartY); ctx.lineTo(cartX, OY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.pe; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`h=${tp.y.toFixed(1)}m`, cartX, (cartY + OY) / 2);

  if (showEnergyBar) {
    drawEnergyBar(ctx, 40, H - 70, W - 80, 18, ke, pe);
  }

  chipHUD(ctx, [
    { label: "KE", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "PE", value: `${pe.toFixed(2)} J`, color: C.pe },
    { label: "TOTAL E", value: `${total.toFixed(2)} J`, color: "#a78bfa" },
    { label: "SPEED", value: `${rc.v.toFixed(2)} m/s`, color: C.vel },
  ], 40, 20);
}

function renderVehicle(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>
) {
  const { selectedVehicles, vehicles, showGrid } = store;
  if (showGrid) drawGrid(ctx, W, H);

  const selected = vehicles.filter(v => selectedVehicles.includes(v.name));
  if (selected.length === 0) {
    ctx.fillStyle = C.dim; ctx.font = "14px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText("Select vehicles in controls →", W / 2, H / 2);
    return;
  }

  const keValues = selected.map(v => kineticEnergy(v.mass, v.speed));
  const maxKE = Math.max(...keValues, 1);

  const barH = Math.min(60, (H - 140) / selected.length - 16);
  const OX = 80, barW = W - 200;
  const OY = 60;

  selected.forEach((v, i) => {
    const ke = keValues[i];
    const norm = ke / maxKE;
    const y = OY + i * (barH + 16);

    // Label
    ctx.fillStyle = C.text; ctx.font = "13px 'JetBrains Mono',monospace"; ctx.textAlign = "right";
    ctx.fillText(`${v.icon} ${v.name}`, OX - 8, y + barH / 2 + 5);

    // Bar background
    ctx.fillStyle = "rgba(39,39,42,0.5)";
    rr(ctx, OX, y, barW, barH, 4); ctx.fill();

    // Bar fill
    const barFill = Math.max(2, norm * barW);
    const bg = ctx.createLinearGradient(OX, 0, OX + barFill, 0);
    bg.addColorStop(0, v.color + "cc"); bg.addColorStop(1, v.color + "44");
    ctx.fillStyle = bg;
    ctx.shadowBlur = 10; ctx.shadowColor = v.color;
    rr(ctx, OX, y, barFill, barH, 4); ctx.fill();
    ctx.shadowBlur = 0;

    // Value
    ctx.fillStyle = v.color; ctx.font = "bold 11px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
    const keStr = ke >= 1e12 ? `${(ke / 1e12).toFixed(2)} TJ`
      : ke >= 1e9 ? `${(ke / 1e9).toFixed(2)} GJ`
      : ke >= 1e6 ? `${(ke / 1e6).toFixed(2)} MJ`
      : ke >= 1e3 ? `${(ke / 1e3).toFixed(2)} kJ`
      : `${ke.toFixed(2)} J`;
    ctx.fillText(`${keStr}  |  m=${v.mass >= 1e6 ? (v.mass / 1e6).toFixed(1) + 'Mg' : v.mass + 'kg'}  v=${v.speed}m/s`, OX + barFill + 8, y + barH / 2 + 5);
  });

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText("KINETIC ENERGY SCALE COMPARISON  ·  KE = ½mv²", W / 2, H - 30);
}

// ─── Main Canvas Component ────────────────────────────────────────────────────
export const KineticEnergyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastT = useRef<number>(0);
  const store = useKEStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const render = useCallback(() => {
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
    ctx.clearRect(0, 0, W, H);

    const s = storeRef.current;
    switch (s.mode) {
      case "freeparticle":  renderFreeParticle(ctx, W, H, s); break;
      case "inclinedplane": renderInclinedPlane(ctx, W, H, s); break;
      case "projectile":    renderProjectile(ctx, W, H, s); break;
      case "collision":     renderCollision(ctx, W, H, s); break;
      case "rotational":    renderRotational(ctx, W, H, s); break;
      case "rollercoaster": renderRollerCoaster(ctx, W, H, s); break;
      case "vehicle":       renderVehicle(ctx, W, H, s); break;
    }
  }, []);

  // Physics loop
  useEffect(() => {
    let alive = true;
    const loop = (ts: number) => {
      if (!alive) return;
      const dt = lastT.current > 0 ? Math.min((ts - lastT.current) / 1000, 0.05) : 0.016;
      lastT.current = ts;
      storeRef.current.tick(dt);
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [render]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(59,130,246,0.04),transparent_60%)] pointer-events-none" />
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Mode badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
        <div className={`w-2 h-2 rounded-full ${storeRef.current.isPlaying ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" : "bg-zinc-600"}`} />
        <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] font-mono">
          Physics Engine
        </span>
      </div>
    </div>
  );
};

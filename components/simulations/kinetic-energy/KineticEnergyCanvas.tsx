"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useKEStore } from "@/store/kineticEnergyStore";
import {
  kineticEnergy, gravitationalPE, rotationalKE,
  VEHICLES, getTrackY, keGlowRadius, keGlowAlpha, toTNT,
} from "@/lib/physics/kineticEnergy";

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  ke: "#3b82f6",     keB: "#60a5fa",
  pe: "#10b981",     peB: "#34d399",
  thermal: "#f97316",
  vel: "#f59e0b",    velB: "#fcd34d",
  force: "#ef4444",
  mom: "#ec4899",
  rot: "#8b5cf6",
  grid: "rgba(39,39,42,0.22)",
  text: "rgba(255,255,255,0.75)",
  dim: "rgba(255,255,255,0.2)",
};

// ─── KE heat color: blue(low)→cyan→yellow→red(high) ─────────────────────────
function keColor(norm: number): string {
  // norm: 0–1
  const r = Math.round(norm < 0.5 ? norm * 2 * 200 : 200 + (norm - 0.5) * 2 * 55);
  const g = Math.round(norm < 0.25 ? 0 : norm < 0.75 ? (norm - 0.25) / 0.5 * 200 : 200 - (norm - 0.75) / 0.25 * 200);
  const b = Math.round(norm < 0.5 ? 255 - norm * 2 * 200 : 0);
  const toHex = (c: number) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────
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
  label: string, color: string, w = 2, pulseFactor = 1
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;
  const angle = Math.atan2(dy, dx);
  const head = Math.max(8, w * 3.5);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w * pulseFactor;
  ctx.shadowBlur = 8 * pulseFactor; ctx.shadowColor = color;
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
    const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2 - 12;
    ctx.fillStyle = "rgba(9,9,11,0.88)";
    rr(ctx, lx - tw / 2 - 5, ly - 9, tw + 10, 16, 3); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = "center";
    ctx.fillText(label, lx, ly + 4);
  }
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, t = 0) {
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
  const offset = (t * 20) % 50;
  for (let x = -offset; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawScanlines(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "rgba(0,0,0,0.025)";
  for (let y = 0; y < H; y += 4) { ctx.fillRect(0, y, W, 1); }
}

// ─── Cinematic glow sphere ────────────────────────────────────────────────────
function drawGlowSphere(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  ke: number, strokeColor: string, refKE = 200
) {
  const glowR = keGlowRadius(ke, r, 55);
  const glowA = keGlowAlpha(ke, refKE);

  // Outer energy halo — v²-scaled
  const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowR * 1.4);
  outerGlow.addColorStop(0, strokeColor + Math.round(glowA * 120).toString(16).padStart(2, "0"));
  outerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = outerGlow;
  ctx.beginPath(); ctx.arc(cx, cy, glowR * 1.4, 0, Math.PI * 2); ctx.fill();

  // Inner glow ring
  const innerGlow = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, glowR);
  innerGlow.addColorStop(0, strokeColor + "aa");
  innerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = innerGlow;
  ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  bodyGrad.addColorStop(0, "#1e2030"); bodyGrad.addColorStop(1, "#0a0a0f");
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = strokeColor; ctx.lineWidth = 2;
  ctx.shadowBlur = 20 + glowA * 20; ctx.shadowColor = strokeColor;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Specular highlight
  ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.55, -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke();

  // Core energy dot
  const coreR = Math.max(3, Math.min(r * 0.4, 3 + glowA * 10));
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  coreGrad.addColorStop(0, "#ffffff");
  coreGrad.addColorStop(0.3, strokeColor);
  coreGrad.addColorStop(1, "transparent");
  ctx.fillStyle = coreGrad;
  ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();
}

// ─── Motion blur streak ───────────────────────────────────────────────────────
function drawMotionBlur(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  vx: number, vy: number, ke: number
) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < 5) return;
  const streakLen = Math.min(120, speed * 1.2);
  const nx = -vx / speed, ny = -vy / speed;
  const grad = ctx.createLinearGradient(cx, cy, cx + nx * streakLen, cy + ny * streakLen);
  const col = keColor(Math.min(1, ke / 500));
  grad.addColorStop(0, col + "88");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(vy, vx));
  ctx.beginPath();
  ctx.ellipse(-(streakLen / 2), 0, streakLen / 2, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Particle trail ───────────────────────────────────────────────────────────
function drawParticleTrail(
  ctx: CanvasRenderingContext2D,
  trailX: number[], trailY: number[], trailKE: number[],
  maxAge: number
) {
  if (trailX.length < 2) return;
  for (let i = 1; i < trailX.length; i++) {
    const age = i / trailX.length;
    const ke = trailKE[i] || 0;
    const norm = Math.min(1, ke / 400);
    const col = keColor(norm);
    const alpha = age * 0.6 * (0.2 + 0.8 * norm);
    const r = Math.max(1.5, norm * 7);
    ctx.beginPath();
    ctx.arc(trailX[i], trailY[i], r, 0, Math.PI * 2);
    ctx.fillStyle = col + Math.round(alpha * 255).toString(16).padStart(2, "0");
    ctx.shadowBlur = 4; ctx.shadowColor = col;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── Shockwave ring ───────────────────────────────────────────────────────────
function drawShockwave(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, opacity: number, color: string
) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.shadowBlur = 20; ctx.shadowColor = color;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1; ctx.shadowBlur = 0;
  ctx.strokeStyle = color + "55";
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// ─── Energy bar ───────────────────────────────────────────────────────────────
function drawEnergyBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  ke: number, pe: number, thermal = 0
) {
  const total = ke + pe + thermal;
  if (total <= 0) return;
  const bw = ke / total * w;
  const pw = pe / total * w;
  const tw = Math.max(0, w - bw - pw);

  ctx.fillStyle = "rgba(9,9,11,0.7)";
  rr(ctx, x - 2, y - 2, w + 4, h + 4, 5); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
  rr(ctx, x - 2, y - 2, w + 4, h + 4, 5); ctx.stroke();

  if (bw > 0) {
    const g = ctx.createLinearGradient(x, 0, x + bw, 0);
    g.addColorStop(0, "#3b82f6"); g.addColorStop(1, "#60a5fa");
    ctx.fillStyle = g; ctx.shadowBlur = 8; ctx.shadowColor = C.ke;
    rr(ctx, x, y, Math.max(1, bw), h, 3); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (pw > 0) {
    const g2 = ctx.createLinearGradient(x + bw, 0, x + bw + pw, 0);
    g2.addColorStop(0, "#10b981"); g2.addColorStop(1, "#34d399");
    ctx.fillStyle = g2; rr(ctx, x + bw, y, Math.max(1, pw), h, 3); ctx.fill();
  }
  if (tw > 0) {
    ctx.fillStyle = C.thermal; rr(ctx, x + bw + pw, y, Math.max(1, tw), h, 3); ctx.fill();
  }

  ctx.font = "bold 9px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
  ctx.fillStyle = "#93c5fd"; ctx.fillText(`KE ${ke.toFixed(1)}J`, x + 4, y + h - 3);
  if (pe > 0.5) { ctx.fillStyle = "#6ee7b7"; ctx.fillText(`PE ${pe.toFixed(1)}J`, x + bw + 4, y + h - 3); }
  if (thermal > 0.5) { ctx.fillStyle = "#fb923c"; ctx.fillText(`Q ${thermal.toFixed(1)}J`, x + bw + pw + 4, y + h - 3); }
}

// ─── HUD chips ────────────────────────────────────────────────────────────────
function chipHUD(
  ctx: CanvasRenderingContext2D,
  items: { label: string; value: string; color: string }[],
  x: number, y: number, t = 0
) {
  const cw = 148, ch = 34, gap = 6;
  items.forEach((item, i) => {
    const cx = x + i * (cw + gap);
    const pulse = 0.95 + 0.05 * Math.sin(t * 3 + i);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "rgba(9,9,11,0.82)";
    rr(ctx, cx, y, cw, ch, 6); ctx.fill();
    ctx.strokeStyle = item.color + "44"; ctx.lineWidth = 1;
    rr(ctx, cx, y, cw, ch, 6); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "8px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
    ctx.fillText(item.label, cx + 8, y + 13);
    ctx.fillStyle = item.color;
    ctx.font = "bold 12px 'JetBrains Mono',monospace";
    ctx.fillText(item.value, cx + 8, y + 28);
    ctx.restore();
  });
}

// ─── Background energy field ──────────────────────────────────────────────────
function drawEnergyField(ctx: CanvasRenderingContext2D, W: number, H: number, ke: number, t: number) {
  const norm = Math.min(1, ke / 800);
  if (norm < 0.02) return;
  // Pulsing radial aura at center-bottom
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  const grad = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, Math.max(1, W * 0.6 * norm));
  grad.addColorStop(0, `rgba(59,130,246,${0.06 * norm * (1 + 0.3 * pulse)})`);
  grad.addColorStop(0.5, `rgba(59,130,246,${0.02 * norm})`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ─── Mode Renderers ───────────────────────────────────────────────────────────

function renderFreeParticle(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  trailXRef: number[], trailYRef: number[], trailKERef: number[], t: number
) {
  const { fp, showVelocityVectors, showForceVectors, showEnergyBar, showGrid, shakeIntensity } = store;
  if (showGrid) drawGrid(ctx, W, H, t);

  const TY = H * 0.62;
  const SCALE = W - 160;
  const OX = 80;
  const ke = kineticEnergy(fp.mass, fp.v);

  drawEnergyField(ctx, W, H, ke, t);

  // Camera shake
  if (shakeIntensity > 0.1) {
    const sx = (Math.random() - 0.5) * shakeIntensity;
    const sy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(sx, sy);
  }

  // Surface with texture
  const sg = ctx.createLinearGradient(0, TY, 0, TY + 8);
  sg.addColorStop(0, "#4b5563"); sg.addColorStop(1, "#1f2937");
  ctx.fillStyle = sg; ctx.fillRect(OX, TY, SCALE, 7);
  // Surface hatching
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
  for (let hx = OX; hx < OX + SCALE; hx += 16) {
    ctx.beginPath(); ctx.moveTo(hx, TY + 7); ctx.lineTo(hx - 8, TY + 14); ctx.stroke();
  }

  // Left/right bumper walls
  [[OX - 22, OX - 2], [OX + SCALE, OX + SCALE + 20]].forEach(([x1, x2]) => {
    const wg = ctx.createLinearGradient(x1, 0, x2, 0);
    wg.addColorStop(0, "#374151"); wg.addColorStop(1, "#1f2937");
    ctx.fillStyle = wg;
    rr(ctx, x1, TY - 50, 22, 70, 4); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    rr(ctx, x1, TY - 50, 22, 70, 4); ctx.stroke();
    // Bumper highlight strip
    ctx.fillStyle = C.ke + "66";
    ctx.fillRect(x2 < OX + SCALE ? x2 - 3 : x1, TY - 50, 3, 70);
  });

  // Particle position
  const norm = (((fp.x % 10) + 10) % 10) / 10;
  const px = OX + norm * SCALE;
  const R = Math.max(20, Math.min(38, 14 + fp.mass * 2.8));

  // Trail
  if (store.showTrail && trailXRef.length > 1) {
    drawParticleTrail(ctx, trailXRef, trailYRef, trailKERef, 120);
  }

  // Motion blur
  drawMotionBlur(ctx, px, TY - R, R, fp.v * 15, 0, ke);

  // Glowing sphere
  drawGlowSphere(ctx, px, TY - R, R, ke, C.ke, 300);

  // Speed lines at high velocity
  const absV = Math.abs(fp.v);
  if (absV > 15) {
    const lineCount = Math.floor(absV / 5);
    const dir = fp.v > 0 ? 1 : -1;
    ctx.save();
    ctx.globalAlpha = Math.min(0.35, absV / 80);
    for (let li = 0; li < lineCount; li++) {
      const ly = TY - R + (Math.random() - 0.5) * R * 2;
      const llen = 20 + Math.random() * absV * 1.5;
      const grad = ctx.createLinearGradient(px - dir * llen, ly, px, ly);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, C.velB + "aa");
      ctx.fillStyle = grad;
      ctx.fillRect(px - dir * llen, ly - 0.5, llen, 1);
    }
    ctx.restore();
  }

  // Mass label
  ctx.fillStyle = C.text; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`m=${fp.mass.toFixed(1)}kg`, px, TY + 22);

  // Vectors
  if (showVelocityVectors && absV > 0.1) {
    const vLen = fp.v * 10;
    const pulse = 1 + 0.2 * Math.sin(t * 8);
    arrow(ctx, px, TY - R * 2.2, px + vLen, TY - R * 2.2, `v=${fp.v.toFixed(2)} m/s`, C.vel, 2, pulse);
  }
  if (showForceVectors && Math.abs(fp.appliedForce) > 0.1) {
    arrow(ctx, px, TY - R, px + fp.appliedForce * 2.5, TY - R, `F=${fp.appliedForce.toFixed(1)}N`, C.force, 2);
  }

  if (showEnergyBar) drawEnergyBar(ctx, OX, H - 72, SCALE, 20, ke, 0);

  chipHUD(ctx, [
    { label: "KINETIC ENERGY", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "VELOCITY", value: `${fp.v.toFixed(3)} m/s`, color: C.vel },
    { label: "MOMENTUM", value: `${(fp.mass * fp.v).toFixed(3)} kg·m/s`, color: C.mom },
    { label: "APPLIED FORCE", value: `${fp.appliedForce.toFixed(1)} N`, color: C.force },
  ], OX, 18, t);
}

function renderInclinedPlane(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  trailXRef: number[], trailYRef: number[], trailKERef: number[], t: number
) {
  const { ip, showVelocityVectors, showEnergyBar, showGrid, showForceVectors } = store;
  if (showGrid) drawGrid(ctx, W, H, t);

  const angle = ip.angle;
  const OX = 60, OY = H - 80;
  const rampLen = Math.min(W - 120, 540);
  const rx = OX + rampLen * Math.cos(angle);
  const ry = OY - rampLen * Math.sin(angle);

  const ke = kineticEnergy(ip.mass, ip.v);
  const pe = gravitationalPE(ip.mass, ip.height);
  drawEnergyField(ctx, W, H, ke, t);

  // Ramp with gradient fill
  const rampGrad = ctx.createLinearGradient(OX, OY, rx, ry);
  rampGrad.addColorStop(0, "#374151"); rampGrad.addColorStop(1, "#1f2937");
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 5;
  ctx.shadowBlur = 4; ctx.shadowColor = "rgba(59,130,246,0.2)";
  ctx.beginPath(); ctx.moveTo(OX, OY); ctx.lineTo(rx, ry); ctx.stroke();
  ctx.shadowBlur = 0;

  // Ramp fill
  ctx.fillStyle = "rgba(55,65,81,0.3)";
  ctx.beginPath(); ctx.moveTo(OX, OY); ctx.lineTo(rx, ry); ctx.lineTo(rx, OY); ctx.closePath(); ctx.fill();

  // Ground line
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(OX, OY); ctx.lineTo(W - 60, OY); ctx.stroke();

  // Angle arc & label
  ctx.strokeStyle = "rgba(245,158,11,0.7)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(OX, OY, 48, -angle, 0); ctx.stroke();
  ctx.fillStyle = C.vel; ctx.font = "bold 12px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
  ctx.fillText(`θ=${(angle * 180 / Math.PI).toFixed(1)}°`, OX + 52, OY - 12);

  // Block position
  const normB = ip.x / ip.trackLength;
  const bx = OX + normB * rampLen * Math.cos(angle);
  const by = OY - normB * rampLen * Math.sin(angle);
  const BS = 30;

  // Friction heat trail on ramp surface
  if (store.showTrail && ip.mu > 0 && ip.v > 0.5) {
    const trailLen = Math.min(normB, 0.8);
    const trailGrad = ctx.createLinearGradient(
      OX + (normB - trailLen) * rampLen * Math.cos(angle), OY - (normB - trailLen) * rampLen * Math.sin(angle),
      bx, by
    );
    trailGrad.addColorStop(0, "transparent");
    trailGrad.addColorStop(1, C.thermal + "44");
    ctx.strokeStyle = trailGrad; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(OX + (normB - trailLen) * rampLen * Math.cos(angle), OY - (normB - trailLen) * rampLen * Math.sin(angle));
    ctx.lineTo(bx, by); ctx.stroke();
  }

  // Block (tilted)
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(-angle);

  // Block glow based on KE
  const glowAlpha = keGlowAlpha(ke, 200);
  ctx.shadowBlur = 12 + glowAlpha * 20; ctx.shadowColor = C.ke;

  const blockGrad = ctx.createLinearGradient(-BS / 2, -BS, BS / 2, 0);
  blockGrad.addColorStop(0, "#1e293b"); blockGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = blockGrad; ctx.strokeStyle = C.ke; ctx.lineWidth = 2;
  rr(ctx, -BS / 2, -BS, BS, BS, 4); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Block label
  ctx.fillStyle = C.text; ctx.font = "bold 11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`${ip.mass.toFixed(0)}kg`, 0, -BS / 2 + 5);

  ctx.restore();

  // Velocity vector along ramp
  if (showVelocityVectors && Math.abs(ip.v) > 0.05) {
    const vScale = ip.v * 14;
    const pulse = 1 + 0.15 * Math.sin(t * 6);
    arrow(ctx, bx, by, bx + vScale * Math.cos(angle), by - vScale * Math.sin(angle),
      `v=${ip.v.toFixed(2)} m/s`, C.vel, 2, pulse);
  }

  // Force vectors
  if (showForceVectors) {
    const gravAlong = ip.mass * 9.81 * Math.sin(angle);
    const gravNorm = ip.mass * 9.81 * Math.cos(angle);
    const FS = 2.8;
    arrow(ctx, bx, by, bx + gravAlong * FS * Math.cos(angle), by - gravAlong * FS * Math.sin(angle),
      `mg sinθ=${gravAlong.toFixed(1)}N`, C.force, 1.8);
    arrow(ctx, bx, by, bx + gravNorm * FS * Math.sin(angle), by + gravNorm * FS * Math.cos(angle),
      `N=${gravNorm.toFixed(1)}N`, C.pe, 1.8);
  }

  // Height dotted line
  const h = ip.height;
  ctx.strokeStyle = "rgba(16,185,129,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, OY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.pe; ctx.font = "bold 11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`h=${h.toFixed(2)}m`, bx + 24, (by + OY) / 2);

  if (showEnergyBar) drawEnergyBar(ctx, 60, H - 72, W - 120, 20, ke, pe);

  chipHUD(ctx, [
    { label: "KINETIC ENERGY", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "POTENTIAL ENERGY", value: `${pe.toFixed(2)} J`, color: C.pe },
    { label: "TOTAL ENERGY", value: `${(ke + pe).toFixed(2)} J`, color: "#a78bfa" },
    { label: "VELOCITY", value: `${ip.v.toFixed(3)} m/s`, color: C.vel },
  ], 60, 18, t);
}

function renderProjectile(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  trailXRef: number[], trailYRef: number[], trailKERef: number[], t: number
) {
  const { proj, showGrid, showEnergyBar, shakeIntensity } = store;
  if (showGrid) drawGrid(ctx, W, H, t);

  const OX = 60, OY = H - 80;
  const XSCALE = (W - 120) / Math.max(1, proj.landed ? proj.range * 1.1 : Math.max(proj.x * 1.3, 10));
  const YSCALE = (H - 150) / Math.max(1, proj.maxHeight > 0 ? proj.maxHeight * 1.2 : 15);

  // Camera shake on impact
  if (shakeIntensity > 0.1) {
    ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity * 0.5);
  }

  // Ground with texture
  const gg = ctx.createLinearGradient(0, OY, 0, OY + 20);
  gg.addColorStop(0, "#374151"); gg.addColorStop(1, "#111827");
  ctx.fillStyle = gg; ctx.fillRect(OX, OY, W - 120, 20);

  if (!proj.launched) {
    // Pre-launch state
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "15px 'JetBrains Mono',monospace";
    ctx.textAlign = "center";
    ctx.fillText("Set angle & speed  →  Press LAUNCH", W / 2, H / 2 - 12);
    ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.font = "11px 'JetBrains Mono',monospace";
    ctx.fillText("KE = ½mv²  |  PE = mgh  |  Total E conserved (no drag)", W / 2, H / 2 + 12);
    return;
  }

  const speed = Math.sqrt(proj.vx ** 2 + proj.vy ** 2);
  const ke = kineticEnergy(proj.mass, speed);
  const pe = gravitationalPE(proj.mass, proj.y);
  drawEnergyField(ctx, W, H, ke, t);

  // Ideal trajectory (dim overlay)
  const v0x = proj.vx + (proj.dragEnabled ? 0 : 0);
  if (!proj.dragEnabled && v0x > 0) {
    // Only show for no-drag mode (otherwise actual trajectory IS the reference)
  }
  // Actual trajectory trail (KE-colored)
  if (store.showTrail && trailXRef.length > 1) {
    const screenX = trailXRef.map(x => OX + x * XSCALE);
    const screenY = trailYRef.map(y => OY - y * YSCALE);
    drawParticleTrail(ctx, screenX, screenY, trailKERef, 120);
  }

  // Ball
  const bx = OX + proj.x * XSCALE;
  const by = OY - proj.y * YSCALE;
  const R = 13;

  drawMotionBlur(ctx, bx, by, R, proj.vx * XSCALE, -proj.vy * YSCALE, ke);
  drawGlowSphere(ctx, bx, by, R, ke, C.ke, 150);

  // Velocity component arrows
  if (Math.abs(proj.vx) > 0.1) {
    arrow(ctx, bx, by, bx + proj.vx * XSCALE * 0.45, by, `vₓ=${proj.vx.toFixed(1)}m/s`, C.vel, 1.5);
  }
  if (Math.abs(proj.vy) > 0.1) {
    arrow(ctx, bx, by, bx, by - proj.vy * YSCALE * 0.45, `vᵧ=${proj.vy.toFixed(1)}m/s`, C.pe, 1.5);
  }

  // Apex marker
  if (proj.maxHeight > 0.5 && proj.vy < 0.5 && !proj.landed) {
    const apexX = OX + proj.x * XSCALE;
    const apexY = OY - proj.maxHeight * YSCALE;
    ctx.strokeStyle = "rgba(245,158,11,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(apexX, apexY); ctx.lineTo(apexX, OY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.vel; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText(`▲ ${proj.maxHeight.toFixed(1)}m`, apexX, apexY - 8);
  }

  // Height reference line
  ctx.strokeStyle = "rgba(16,185,129,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(OX, by); ctx.lineTo(bx, by); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.pe; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "right";
  ctx.fillText(`h=${proj.y.toFixed(1)}m`, OX - 4, by + 4);

  if (showEnergyBar) drawEnergyBar(ctx, 60, H - 72, W - 120, 20, ke, pe);

  chipHUD(ctx, [
    { label: "KINETIC ENERGY", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "POTENTIAL ENERGY", value: `${pe.toFixed(2)} J`, color: C.pe },
    { label: "SPEED", value: `${speed.toFixed(2)} m/s`, color: C.vel },
    { label: "RANGE", value: `${proj.range.toFixed(1)} m`, color: C.dim },
  ], 60, 18, t);
}

function renderCollision(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  t: number
) {
  const { coll, showVelocityVectors, showEnergyBar, showGrid, shakeIntensity, shockwaves, isReplayMode } = store;
  if (showGrid) drawGrid(ctx, W, H, t);

  // Camera shake
  if (shakeIntensity > 0.1) {
    ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity * 0.5);
  }

  const TY = H * 0.52;
  const OX = 60, SCALE = W - 120;
  const xScale = SCALE / coll.trackWidth;

  // Replay badge
  if (isReplayMode) {
    ctx.fillStyle = "rgba(245,158,11,0.15)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.vel; ctx.font = "bold 11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText("⏪ SLOW MOTION REPLAY", W / 2, 22);
  }

  // Track
  const tg = ctx.createLinearGradient(0, TY - 3, 0, TY + 8);
  tg.addColorStop(0, "#4b5563"); tg.addColorStop(1, "#1f2937");
  ctx.fillStyle = tg; ctx.fillRect(OX, TY - 3, SCALE, 8);

  // Bumper walls with glow
  [[OX - 25, true], [OX + SCALE, false]].forEach(([wx, left]) => {
    const x = left ? wx : wx as number;
    const wgrd = ctx.createLinearGradient(x as number, 0, (x as number) + 25, 0);
    wgrd.addColorStop(0, left ? "#374151" : "#1f2937");
    wgrd.addColorStop(1, left ? "#1f2937" : "#374151");
    ctx.fillStyle = wgrd;
    rr(ctx, x as number, TY - 35, 25, 70, 4); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    rr(ctx, x as number, TY - 35, 25, 70, 4); ctx.stroke();
    ctx.fillStyle = C.ke + "55";
    ctx.fillRect(left ? (x as number) + 22 : x as number, TY - 35, 3, 70);
  });

  const x1 = OX + coll.b1.x * xScale;
  const x2 = OX + coll.b2.x * xScale;
  const r1 = Math.max(18, Math.min(44, 13 + coll.b1.mass * 3.5)) * Math.min(1, xScale / 38);
  const r2 = Math.max(18, Math.min(44, 13 + coll.b2.mass * 3.5)) * Math.min(1, xScale / 38);

  // Shockwaves (canvas-space)
  shockwaves.forEach(sw => {
    const swX = OX + sw.x * SCALE;
    const swY = TY;
    drawShockwave(ctx, swX, swY, sw.r, sw.opacity, sw.color);
  });

  // Bodies
  [
    { x: x1, r: r1, v: coll.b1.v, m: coll.b1.mass, col: "#8b5cf6", id: 1 },
    { x: x2, r: r2, v: coll.b2.v, m: coll.b2.mass, col: "#06b6d4", id: 2 },
  ].forEach(({ x, r, v, m, col }) => {
    const ke = kineticEnergy(m, v);
    // Compression squish (visual deformation near contact)
    const dist = Math.abs(x2 - x1);
    const overlap = Math.max(0, r1 + r2 - dist);
    const squishX = overlap > 0 ? 1 - overlap / (r * 2) * 0.3 : 1;
    const squishY = overlap > 0 ? 1 + overlap / (r * 2) * 0.3 : 1;

    drawMotionBlur(ctx, x, TY, r, v * 10, 0, ke);
    ctx.save();
    ctx.translate(x, TY);
    ctx.scale(squishX, squishY);
    ctx.translate(-x, -TY);
    drawGlowSphere(ctx, x, TY, r, ke, col, 150);
    ctx.restore();

    ctx.fillStyle = C.text; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText(`${m.toFixed(1)}kg`, x, TY + r + 20);
    ctx.fillStyle = col; ctx.font = "bold 10px 'JetBrains Mono',monospace";
    ctx.fillText(`KE=${ke.toFixed(1)}J`, x, TY + r + 34);

    if (showVelocityVectors && Math.abs(v) > 0.05) {
      const pulse = 1 + 0.15 * Math.sin(t * 5);
      arrow(ctx, x, TY - r - 14, x + v * 16, TY - r - 14, `${v.toFixed(2)} m/s`, C.vel, 2, pulse);
    }
  });

  const totalKE = kineticEnergy(coll.b1.mass, coll.b1.v) + kineticEnergy(coll.b2.mass, coll.b2.v);
  const totalMom = coll.b1.mass * coll.b1.v + coll.b2.mass * coll.b2.v;
  const keLost = coll.hasCollided ? Math.max(0, coll.KEBefore - coll.KEAfter) : 0;

  // ΔKE lost indicator
  if (keLost > 1) {
    ctx.fillStyle = C.thermal + "22"; ctx.fillRect(OX, TY + r2 + 45, SCALE * Math.min(1, keLost / coll.KEBefore), 6);
    ctx.fillStyle = C.thermal; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
    ctx.fillText(`ΔKE lost: ${keLost.toFixed(2)} J → heat & deformation`, OX, TY + r2 + 65);
  }

  if (showEnergyBar) drawEnergyBar(ctx, 60, H - 72, W - 120, 20, totalKE, 0, keLost);

  chipHUD(ctx, [
    { label: "TOTAL KE", value: `${totalKE.toFixed(2)} J`, color: C.ke },
    { label: "MOMENTUM Σp", value: `${totalMom.toFixed(3)} kg·m/s`, color: C.mom },
    { label: "RESTITUTION e", value: `${coll.e.toFixed(2)}`, color: C.vel },
    { label: "ΔKE LOST", value: `${keLost.toFixed(2)} J`, color: C.thermal },
  ], 60, 18, t);
}

function renderRotational(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  t: number
) {
  const { rot, showGrid, showEnergyBar, showForceVectors } = store;
  if (showGrid) drawGrid(ctx, W, H, t);

  const cx = W / 2, cy = H * 0.48;
  const R = Math.min(130, Math.max(55, rot.radius * 280));
  const ke = rotationalKE(rot.I, rot.omega);
  const omegaNorm = Math.min(1, Math.abs(rot.omega) / 20);

  drawEnergyField(ctx, W, H, ke, t);

  // Centrifugal particle emission at rim
  if (store.isPlaying && omegaNorm > 0.15) {
    const particleCount = Math.floor(omegaNorm * 6);
    for (let pi = 0; pi < particleCount; pi++) {
      const pa = rot.theta + (pi / particleCount) * Math.PI * 2 + t * rot.omega;
      const pr = R + 5 + Math.random() * 20 * omegaNorm;
      const px = cx + Math.cos(pa) * pr;
      const py = cy + Math.sin(pa) * pr;
      const pSize = 1 + Math.random() * 2 * omegaNorm;
      ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = C.rot + Math.round(0.5 * omegaNorm * 255).toString(16).padStart(2, "0");
      ctx.shadowBlur = 4; ctx.shadowColor = C.rot;
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  // Outer energy ring (ω²-scaled)
  const outerR = R + 18 + omegaNorm * 30;
  const outerGrad = ctx.createRadialGradient(cx, cy, R, cx, cy, outerR);
  outerGrad.addColorStop(0, C.rot + Math.round(0.35 * omegaNorm * 255).toString(16).padStart(2, "0"));
  outerGrad.addColorStop(1, "transparent");
  ctx.fillStyle = outerGrad;
  ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot.theta);

  const glowBlur = 14 + omegaNorm * 30;
  ctx.shadowBlur = glowBlur; ctx.shadowColor = C.rot;
  ctx.strokeStyle = C.rot; ctx.fillStyle = "#0d0d18"; ctx.lineWidth = 2.5;

  switch (rot.shape) {
    case "disk": {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Spokes
      for (let si = 0; si < 8; si++) {
        const sa = (si / 8) * Math.PI * 2;
        ctx.strokeStyle = C.rot + "55"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(R * 0.15 * Math.cos(sa), R * 0.15 * Math.sin(sa));
        ctx.lineTo(R * Math.cos(sa), R * Math.sin(sa)); ctx.stroke();
      }
      // Rim markings
      ctx.strokeStyle = C.rot + "33"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case "ring": {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#09090b";
      ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.rot + "aa"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.stroke();
      // Cross braces
      for (let ci = 0; ci < 4; ci++) {
        const ca = (ci / 4) * Math.PI * 2;
        ctx.strokeStyle = C.rot + "44"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(R * 0.62 * Math.cos(ca), R * 0.62 * Math.sin(ca));
        ctx.lineTo(R * Math.cos(ca), R * Math.sin(ca)); ctx.stroke();
      }
      break;
    }
    case "sphere": {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.rot + "55"; ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const ey = R * Math.sin(lat * Math.PI / 180);
        const ex = R * Math.cos(lat * Math.PI / 180);
        ctx.beginPath(); ctx.arc(0, 0, ex, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-ex, ey); ctx.lineTo(ex, ey); ctx.stroke();
      }
      break;
    }
    case "rod": {
      const rlen = R * 2.2;
      ctx.beginPath(); ctx.roundRect(-rlen / 2, -12, rlen, 24, 5); ctx.fill(); ctx.stroke();
      for (let ri = -rlen / 2 + 15; ri < rlen / 2; ri += 20) {
        ctx.strokeStyle = C.rot + "44"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ri, -12); ctx.lineTo(ri, 12); ctx.stroke();
      }
      break;
    }
    default: {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Axle
  ctx.fillStyle = "#374151"; ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.restore();

  // Rotation direction arrow
  ctx.strokeStyle = C.vel + "aa"; ctx.lineWidth = 2.5;
  const arcStart = rot.omega > 0 ? 0 : Math.PI;
  const arcEnd = rot.omega > 0 ? Math.PI * 1.5 : Math.PI * 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R + 20, arcStart, arcEnd, rot.omega < 0); ctx.stroke();
  const aEnd = { x: cx + (R + 20) * Math.cos(arcEnd), y: cy + (R + 20) * Math.sin(arcEnd) };
  ctx.fillStyle = C.vel;
  ctx.beginPath(); ctx.arc(aEnd.x, aEnd.y, 5, 0, Math.PI * 2); ctx.fill();

  // Tangential velocity at rim (visual)
  const rimSpeed = Math.abs(rot.omega) * rot.radius;
  ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`v_rim = ωr = ${rimSpeed.toFixed(2)} m/s`, cx, cy + R + 50);
  ctx.fillStyle = C.rot; ctx.font = "12px 'JetBrains Mono',monospace";
  ctx.fillText(`I = ${rot.I.toFixed(4)} kg·m²   ω = ${rot.omega.toFixed(3)} rad/s`, cx, cy + R + 68);

  if (showForceVectors && Math.abs(rot.torque) > 0.01) {
    const ta = rot.theta + (rot.torque > 0 ? Math.PI / 2 : -Math.PI / 2);
    const tx1 = cx + R * Math.cos(rot.theta);
    const ty1 = cy + R * Math.sin(rot.theta);
    const tx2 = tx1 + Math.abs(rot.torque) * 6 * Math.cos(ta) * Math.sign(rot.torque);
    const ty2 = ty1 + Math.abs(rot.torque) * 6 * Math.sin(ta) * Math.sign(rot.torque);
    arrow(ctx, tx1, ty1, tx2, ty2, `τ=${rot.torque.toFixed(2)} N·m`, C.force, 2.5);
  }

  if (showEnergyBar) drawEnergyBar(ctx, 60, H - 72, W - 120, 20, ke, 0);

  chipHUD(ctx, [
    { label: "ROTATIONAL KE", value: `${ke.toFixed(3)} J`, color: C.rot },
    { label: "ω (ang. vel.)", value: `${rot.omega.toFixed(3)} rad/s`, color: C.vel },
    { label: "α (ang. accel.)", value: `${rot.alpha.toFixed(3)} rad/s²`, color: C.force },
    { label: "INERTIA I", value: `${rot.I.toFixed(4)} kg·m²`, color: C.dim },
  ], 60, 18, t);
}

function renderRollerCoaster(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  trailXRef: number[], trailYRef: number[], trailKERef: number[], t: number
) {
  const { rc, rcTrack, showGrid, showEnergyBar, shakeIntensity } = store;
  if (showGrid) drawGrid(ctx, W, H, t);
  if (!rcTrack.length) return;

  if (shakeIntensity > 0.1) {
    ctx.translate((Math.random() - 0.5) * shakeIntensity * 0.5, (Math.random() - 0.5) * shakeIntensity * 0.3);
  }

  const OX = 40, OY = H - 80;
  const XS = (W - 80) / rc.totalLength;
  const maxY = Math.max(...rcTrack.map(p => p.y));
  const YS = (H - 160) / Math.max(maxY, 1);

  const norm = rc.s / rc.totalLength;
  const tIdx = Math.round(norm * (rcTrack.length - 1));
  const tp = rcTrack[Math.max(0, Math.min(tIdx, rcTrack.length - 1))];
  const cartX = OX + tp.x * XS;
  const cartY = OY - tp.y * YS;
  const ke = kineticEnergy(rc.mass, rc.v);
  const pe = gravitationalPE(rc.mass, tp.y);

  drawEnergyField(ctx, W, H, ke, t);

  // Energy flow visualization: color track by PE→KE gradient
  ctx.lineWidth = 4;
  for (let i = 1; i < rcTrack.length - 1; i++) {
    const p = rcTrack[i];
    const pNext = rcTrack[i + 1];
    const heightNorm = maxY > 0 ? p.y / maxY : 0;
    // High PE = green, Low PE = blue (kinetic)
    const r = Math.round(heightNorm * 16 + (1 - heightNorm) * 59);
    const g = Math.round(heightNorm * 185 + (1 - heightNorm) * 130);
    const b = Math.round(heightNorm * 129 + (1 - heightNorm) * 246);
    ctx.strokeStyle = `rgb(${r},${g},${b})44`;
    ctx.beginPath();
    ctx.moveTo(OX + p.x * XS, OY - p.y * YS);
    ctx.lineTo(OX + pNext.x * XS, OY - pNext.y * YS);
    ctx.stroke();
  }

  // Track (main)
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 3;
  ctx.beginPath();
  rcTrack.forEach((p, i) => {
    const px = OX + p.x * XS, py = OY - p.y * YS;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // Fill under track
  ctx.fillStyle = "rgba(39,39,42,0.25)";
  ctx.beginPath();
  rcTrack.forEach((p, i) => {
    const px = OX + p.x * XS, py = OY - p.y * YS;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.lineTo(OX + rc.totalLength * XS, OY);
  ctx.lineTo(OX, OY); ctx.closePath(); ctx.fill();

  // Ground
  ctx.fillStyle = "#27272a"; ctx.fillRect(OX, OY, rc.totalLength * XS, 4);

  // Cart trail (KE-colored)
  if (store.showTrail && trailXRef.length > 1) {
    const scX = trailXRef.map(x => OX + x * rc.totalLength * XS);
    const scY = trailYRef.map(y => OY - y * YS);
    drawParticleTrail(ctx, scX, scY, trailKERef, 120);
  }

  // Speed-based dust/spark at bottom of valley
  if (rc.v > 8 && tp.y < maxY * 0.2 && store.isPlaying) {
    for (let di = 0; di < 3; di++) {
      const dx = cartX + (Math.random() - 0.5) * 20;
      const dy = cartY + 12 + Math.random() * 8;
      ctx.beginPath(); ctx.arc(dx, dy, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle = C.ke + "88"; ctx.shadowBlur = 4; ctx.shadowColor = C.ke;
      ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  // Cart
  const keNorm = Math.min(1, ke / 1000);
  ctx.fillStyle = "#0f172a"; ctx.strokeStyle = C.ke; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 14 + keNorm * 20; ctx.shadowColor = C.ke;
  rr(ctx, cartX - 16, cartY - 12, 32, 18, 5); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  // Wheels
  [cartX - 9, cartX + 9].forEach(wx => {
    ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(wx, cartY + 10, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#64748b"; ctx.beginPath(); ctx.arc(wx, cartY + 10, 2, 0, Math.PI * 2); ctx.fill();
  });

  // Height reference line
  ctx.strokeStyle = "rgba(16,185,129,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(cartX, cartY); ctx.lineTo(cartX, OY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.pe; ctx.font = "bold 10px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(`h=${tp.y.toFixed(1)}m`, cartX + 25, (cartY + OY) / 2);

  if (showEnergyBar) drawEnergyBar(ctx, 40, H - 72, W - 80, 20, ke, pe);

  chipHUD(ctx, [
    { label: "KINETIC ENERGY", value: `${ke.toFixed(2)} J`, color: C.ke },
    { label: "POTENTIAL ENERGY", value: `${pe.toFixed(2)} J`, color: C.pe },
    { label: "TOTAL ENERGY", value: `${(ke + pe).toFixed(2)} J`, color: "#a78bfa" },
    { label: "SPEED", value: `${rc.v.toFixed(2)} m/s`, color: C.vel },
  ], 40, 18, t);
}

function renderVehicle(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  store: ReturnType<typeof useKEStore.getState>,
  t: number
) {
  const { selectedVehicles, vehicles, showGrid, vehicleLogScale } = store;
  if (showGrid) drawGrid(ctx, W, H, t);

  const selected = vehicles.filter(v => selectedVehicles.includes(v.name));
  if (selected.length === 0) {
    ctx.fillStyle = C.dim; ctx.font = "14px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText("Select vehicles in controls →", W / 2, H / 2);
    return;
  }

  const keValues = selected.map(v => kineticEnergy(v.mass, v.speed));
  const maxKE = Math.max(...keValues, 1);
  const minKE = Math.min(...keValues, 1);

  const barH = Math.min(54, Math.floor((H - 160) / selected.length) - 12);
  const OX = 100, barW = W - 240;
  const OY = 55;

  // Scale label
  ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText(vehicleLogScale ? "LOG SCALE  (each step = 10×)" : "LINEAR SCALE", OX + barW / 2, OY - 8);

  selected.forEach((v, i) => {
    const ke = keValues[i];
    const norm = vehicleLogScale
      ? (Math.log10(ke) - Math.log10(minKE)) / Math.max(1, Math.log10(maxKE) - Math.log10(minKE))
      : ke / maxKE;
    const y = OY + i * (barH + 12);

    // Vehicle label
    ctx.fillStyle = C.text; ctx.font = "13px 'JetBrains Mono',monospace"; ctx.textAlign = "right";
    ctx.fillText(`${v.icon} ${v.name}`, OX - 8, y + barH / 2 + 5);
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "9px 'JetBrains Mono',monospace";
    ctx.fillText(v.desc || "", OX - 8, y + barH / 2 + 18);

    // Bar background
    ctx.fillStyle = "rgba(39,39,42,0.45)"; rr(ctx, OX, y, barW, barH, 4); ctx.fill();

    // Animated bar fill
    const barFill = Math.max(4, norm * barW);
    const bg = ctx.createLinearGradient(OX, 0, OX + barFill, 0);
    bg.addColorStop(0, v.color + "cc"); bg.addColorStop(1, v.color + "55");
    ctx.fillStyle = bg; ctx.shadowBlur = 12; ctx.shadowColor = v.color;
    rr(ctx, OX, y, barFill, barH, 4); ctx.fill(); ctx.shadowBlur = 0;

    // Glowing right edge
    const edgeGrad = ctx.createLinearGradient(OX + barFill - 12, 0, OX + barFill, 0);
    edgeGrad.addColorStop(0, "transparent"); edgeGrad.addColorStop(1, "#ffffff44");
    ctx.fillStyle = edgeGrad; rr(ctx, OX, y, barFill, barH, 4); ctx.fill();

    // KE value + TNT equivalent
    const keStr = ke >= 1e12 ? `${(ke / 1e12).toFixed(2)} TJ`
      : ke >= 1e9  ? `${(ke / 1e9).toFixed(2)} GJ`
      : ke >= 1e6  ? `${(ke / 1e6).toFixed(2)} MJ`
      : ke >= 1e3  ? `${(ke / 1e3).toFixed(2)} kJ`
      : `${ke.toFixed(2)} J`;
    const tnt = toTNT(ke);
    ctx.fillStyle = v.color; ctx.font = "bold 11px 'JetBrains Mono',monospace"; ctx.textAlign = "left";
    ctx.fillText(`${keStr}  ≈  ${tnt}`, OX + barFill + 10, y + barH / 2 + 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "9px 'JetBrains Mono',monospace";
    ctx.fillText(`m=${v.mass >= 1e6 ? `${(v.mass / 1e6).toFixed(1)}Mg` : `${v.mass}kg`}  v=${v.speed}m/s`, OX + barFill + 10, y + barH / 2 + 14);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = "center";
  ctx.fillText("KE = ½mv²  ·  1 ton TNT = 4.184 GJ  ·  Click 'Log Scale' to compare orders of magnitude", W / 2, H - 28);
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────
export const KineticEnergyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastT = useRef<number>(0);
  const store = useKEStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  // Trail state (per-frame, kept in ref for perf)
  const trailX = useRef<number[]>([]);
  const trailY = useRef<number[]>([]);
  const trailKE = useRef<number[]>([]);
  const tGlobal = useRef<number>(0);

  const render = useCallback((ts: number) => {
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

    const t = tGlobal.current;
    const s = storeRef.current;

    // Update trail from store history
    const hist = s.history;
    if (hist.length > 0) {
      const recent = hist.slice(-120);
      switch (s.mode) {
        case "freeparticle":
          trailX.current = recent.map((_, i) => (i / recent.length) * (W - 160) + 80);
          trailY.current = recent.map(() => H * 0.62 - 28);
          trailKE.current = recent.map(h => h.ke);
          break;
        case "inclinedplane": {
          const ip = s.ip;
          const rampLen = Math.min(W - 120, 540);
          trailX.current = recent.map(h => 60 + (h.v > 0 ? 0.5 : 0.1) * rampLen * Math.cos(ip.angle));
          trailY.current = recent.map(() => (H - 80));
          trailKE.current = recent.map(h => h.ke);
          break;
        }
        case "projectile":
          trailX.current = recent.map(h => h.v);
          trailY.current = recent.map(h => h.pe / (s.proj.mass * 9.81));
          trailKE.current = recent.map(h => h.ke);
          break;
        case "rollercoaster":
          trailX.current = recent.map(h => h.t / s.rc.totalLength);
          trailY.current = recent.map(h => h.pe / (s.rc.mass * 9.81));
          trailKE.current = recent.map(h => h.ke);
          break;
      }
    }

    switch (s.mode) {
      case "freeparticle":
        renderFreeParticle(ctx, W, H, s, trailX.current, trailY.current, trailKE.current, t);
        break;
      case "inclinedplane":
        renderInclinedPlane(ctx, W, H, s, trailX.current, trailY.current, trailKE.current, t);
        break;
      case "projectile":
        renderProjectile(ctx, W, H, s, trailX.current, trailY.current, trailKE.current, t);
        break;
      case "collision":
        renderCollision(ctx, W, H, s, t);
        break;
      case "rotational":
        renderRotational(ctx, W, H, s, t);
        break;
      case "rollercoaster":
        renderRollerCoaster(ctx, W, H, s, trailX.current, trailY.current, trailKE.current, t);
        break;
      case "vehicle":
        renderVehicle(ctx, W, H, s, t);
        break;
    }

    drawScanlines(ctx, W, H);
  }, []);

  useEffect(() => {
    let alive = true;
    const loop = (ts: number) => {
      if (!alive) return;
      const dt = lastT.current > 0 ? Math.min((ts - lastT.current) / 1000, 0.05) : 0.016;
      lastT.current = ts;
      tGlobal.current += dt;
      storeRef.current.tick(dt);
      render(ts);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [render]);

  const isPlaying = useKEStore(s => s.isPlaying);
  const mode = useKEStore(s => s.mode);
  const isReplay = useKEStore(s => s.isReplayMode);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl bg-[#07070c] border border-white/5 overflow-hidden shadow-2xl">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.04),transparent_50%)] pointer-events-none" />
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Status bar */}
      <div className="absolute top-3.5 right-4 flex items-center gap-2.5 pointer-events-none">
        {isReplay && (
          <div className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] text-amber-400 font-black uppercase tracking-widest animate-pulse">
            SLOW-MO REPLAY
          </div>
        )}
        <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)] animate-pulse" : "bg-zinc-600"}`} />
        <span className="text-[9px] text-white/25 font-black uppercase tracking-[0.3em] font-mono">
          Physics Engine · {mode}
        </span>
      </div>
    </div>
  );
};

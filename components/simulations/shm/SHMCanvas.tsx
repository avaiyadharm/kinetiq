"use client";
import React, { useEffect, useRef } from "react";

interface SHMCanvasProps {
  amplitude: number;
  angularFreq: number;
  phase: number;
  time: number;
  isPlaying: boolean;
  mode: "spring" | "pendulum";
  mass: number;
  kConstant: number;
  showVectors: { displacement: boolean; velocity: boolean; acceleration: boolean; force: boolean };
  showTrail: boolean;
}

const C = {
  disp: "#8b5cf6",
  vel:  "#06b6d4",
  acc:  "#f59e0b",
  force:"#ec4899",
  eq:   "#34d399",
};

export const SHMCanvas: React.FC<SHMCanvasProps> = ({
  amplitude, angularFreq, phase, time, isPlaying, mode, mass, kConstant, showVectors, showTrail,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef  = useRef<{ x: number; y: number; a: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Physics ──────────────────────────────────────────────
      const theta = angularFreq * time + phase;
      const x  =  amplitude * Math.cos(theta);                    // downward +
      const v  = -amplitude * angularFreq * Math.sin(theta);
      const a  = -angularFreq * angularFreq * x;                  // = -ω²x
      const F  =  mass * a;                                       // = -kx
      const KE =  0.5 * mass * v * v;
      const PE =  0.5 * kConstant * x * x;
      const Etot = 0.5 * kConstant * amplitude * amplitude;

      // ── Layout ───────────────────────────────────────────────
      const CX     = 300;
      const Y_ANC  = 70;
      const Y_EQ   = 310;
      const SCALE  = 120;   // px / m
      const bobY   = Y_EQ + x * SCALE;
      const BW = 60, BH = 40;

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
      for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }

      if (mode === "spring") {
        drawSpring(ctx, CX, Y_ANC, Y_EQ, SCALE, amplitude, bobY, x, v, a, F, KE, PE, Etot, BW, BH, W, H);
      } else {
        drawPendulum(ctx, W, H, x, v, a, F, KE, PE, Etot, amplitude, angularFreq, SCALE);
      }

      drawPhaseWheel(ctx, theta, W);
      drawHUD(ctx, x, v, a, F, W, H);
      drawEnergyPanel(ctx, KE, PE, Etot, W);

      animId = requestAnimationFrame(draw);
    };

    // ── Spring drawing ────────────────────────────────────────
    function drawSpring(
      ctx: CanvasRenderingContext2D,
      CX: number, Y_ANC: number, Y_EQ: number, SCALE: number, A: number,
      bobY: number, x: number, v: number, a: number, F: number,
      KE: number, PE: number, Etot: number, BW: number, BH: number,
      W: number, H: number
    ) {
      // ── Amplitude markers ──
      const Apx = A * SCALE;
      [-1, 1].forEach(s => {
        const ay = Y_EQ + s * Apx;
        ctx.beginPath(); ctx.setLineDash([4,4]);
        ctx.strokeStyle = "rgba(139,92,246,0.25)"; ctx.lineWidth = 1;
        ctx.moveTo(CX - 70, ay); ctx.lineTo(CX + 70, ay); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(139,92,246,0.5)";
        ctx.font = "bold 9px Inter"; ctx.textAlign = "right";
        ctx.fillText(s > 0 ? "+A" : "-A", CX - 74, ay + 3);
      });

      // ── Equilibrium line (BRIGHT & LABELED) ──
      ctx.save();
      ctx.shadowBlur = 12; ctx.shadowColor = C.eq;
      ctx.beginPath();
      ctx.moveTo(30, Y_EQ); ctx.lineTo(530, Y_EQ);
      ctx.strokeStyle = C.eq + "55"; ctx.lineWidth = 8; ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.setLineDash([8,5]);
      ctx.strokeStyle = C.eq + "cc"; ctx.lineWidth = 1.5;
      ctx.moveTo(30, Y_EQ); ctx.lineTo(530, Y_EQ); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.eq; ctx.font = "bold 10px Inter"; ctx.textAlign = "left";
      ctx.fillText("Equilibrium Position  (x = 0)", 535, Y_EQ + 4);

      // ── Coord axis (left margin) ──
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "bold 9px Inter"; ctx.textAlign = "center";
      ctx.fillText("x<0", 22, Y_EQ - Apx * 0.5 - 4);
      ctx.fillText("▲", 22, Y_EQ - Apx * 0.5 + 8);
      ctx.fillText("—", 22, Y_EQ);
      ctx.fillText("▼", 22, Y_EQ + Apx * 0.5 - 8);
      ctx.fillText("x>0", 22, Y_EQ + Apx * 0.5 + 10);
      ctx.font = "bold 8px Inter"; ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillText("↓ pos", 22, Y_EQ + 24);

      // ── Ceiling ──
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(CX - 50, Y_ANC - 18, 100, 18);
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
      ctx.strokeRect(CX - 50, Y_ANC - 18, 100, 18);

      // ── Spring coil ──
      drawCoil(ctx, CX, Y_ANC, bobY - BH / 2);

      // ── Trail ──
      if (showTrail) {
        if (trailRef.current.length === 0 || Math.abs(x - (trailRef.current[trailRef.current.length-1]?.y ?? 999)) > 0.005) {
          trailRef.current.push({ x: CX, y: bobY, a: 1 });
        }
        if (trailRef.current.length > 80) trailRef.current.shift();
        trailRef.current.forEach(p => {
          p.a -= 0.007;
          if (p.a <= 0) return;
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139,92,246,${p.a * 0.3})`; ctx.fill();
        });
      } else { trailRef.current = []; }

      // ── Vectors ──
      const maxVec = Math.max(Apx * 0.7, 30);
      const vMax = A * angularFreq;
      const aMax = A * angularFreq * angularFreq;

      // Displacement: from equilibrium to bob (left of center)
      if (showVectors.displacement && Math.abs(x) > 0.005) {
        const ox = CX - 48;
        arrow(ctx, ox, Y_EQ, ox, bobY, "x", C.disp);
      }
      // Velocity: from bob center
      if (showVectors.velocity && Math.abs(v) > 0.005) {
        const len = (v / vMax) * maxVec;
        const ox = CX - 22;
        arrow(ctx, ox, bobY, ox, bobY + len, "v", C.vel);
      }
      // Acceleration: from bob (always toward eq)
      if (showVectors.acceleration && Math.abs(a) > 0.005) {
        const len = (a / aMax) * maxVec;
        const ox = CX + 22;
        arrow(ctx, ox, bobY, ox, bobY + len, "a", C.acc);
      }
      // Force: from bob (same dir as a)
      if (showVectors.force && Math.abs(F) > 0.005) {
        const len = (a / aMax) * maxVec;
        const ox = CX + 48;
        arrow(ctx, ox, bobY, ox, bobY + len, "F", C.force);
      }

      // ── Mass block ──
      ctx.fillStyle = "#1e1b4b"; ctx.strokeStyle = C.disp; ctx.lineWidth = 2;
      rr(ctx, CX - BW/2, bobY - BH/2, BW, BH, 8);
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 16; ctx.shadowColor = C.disp;
      ctx.strokeStyle = C.disp + "55"; ctx.lineWidth = 1;
      rr(ctx, CX - BW/2 - 2, bobY - BH/2 - 2, BW+4, BH+4, 10);
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "bold 11px Inter"; ctx.textAlign = "center";
      ctx.fillText(`${mass.toFixed(1)} kg`, CX, bobY + 4);

      // ── Legend (Top Right) ──
      const lx = W - 185, ly = 40;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; rr(ctx, lx-8, ly-16, 175, 100, 12); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = "bold 9px Inter"; ctx.textAlign = "left";
      [
        { c: C.disp,  l: "x  – Displacement" },
        { c: C.vel,   l: "v  – Velocity" },
        { c: C.acc,   l: "a  – Acceleration (–ω²x)" },
        { c: C.force, l: "F  – Restoring Force (–kx)" },
      ].forEach((it, i) => {
        ctx.fillStyle = it.c; ctx.fillText("■", lx, ly + i * 20);
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText(it.l, lx + 14, ly + i * 20);
      });
    }

    // ── Pendulum drawing ──────────────────────────────────────
    function drawPendulum(
      ctx: CanvasRenderingContext2D,
      W: number, H: number,
      x: number, v: number, a: number, F: number,
      KE: number, PE: number, Etot: number,
      A: number, omega: number, SCALE: number,
    ) {
      const pivX = W / 2, pivY = 100;
      const L_px = 220;
      const maxHoriz = A * SCALE;
      const theta_rad = x / (L_px / SCALE); // small angle
      const bobX = pivX + Math.sin(theta_rad) * L_px;
      const bobY = pivY + Math.cos(theta_rad) * L_px;

      // Equilibrium line (vertical dashed)
      ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = C.eq;
      ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(pivX, pivY + L_px + 40);
      ctx.strokeStyle = C.eq + "88"; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.setLineDash([8,4]);
      ctx.strokeStyle = C.eq + "bb"; ctx.lineWidth = 1.5;
      ctx.moveTo(pivX, pivY); ctx.lineTo(pivX, pivY + L_px + 40); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.eq; ctx.font = "bold 10px Inter"; ctx.textAlign = "left";
      ctx.fillText("Eq (x=0)", pivX + 6, pivY + L_px + 38);

      // Amplitude arc
      ctx.beginPath();
      const angA = Math.asin(maxHoriz / L_px);
      ctx.arc(pivX, pivY, L_px, Math.PI/2 - angA, Math.PI/2 + angA);
      ctx.strokeStyle = "rgba(139,92,246,0.1)"; ctx.lineWidth = 30; ctx.stroke(); ctx.lineWidth = 1;

      // Trail
      if (showTrail) {
        trailRef.current.push({ x: bobX, y: bobY, a: 1 });
        if (trailRef.current.length > 80) trailRef.current.shift();
        trailRef.current.forEach(p => {
          p.a -= 0.007; if (p.a <= 0) return;
          ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
          ctx.fillStyle = `rgba(139,92,246,${p.a * 0.3})`; ctx.fill();
        });
      } else { trailRef.current = []; }

      // String
      const g2 = ctx.createLinearGradient(pivX, pivY, bobX, bobY);
      g2.addColorStop(0, "rgba(255,255,255,0.4)"); g2.addColorStop(1, C.disp + "cc");
      ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = g2; ctx.lineWidth = 2; ctx.stroke();

      // Vectors
      const maxVec = 80, vMax = A * omega, aMax = A * omega * omega;
      if (showVectors.velocity && Math.abs(v) > 0.005) {
        const len = (v / vMax) * maxVec;
        const dir = Math.cos(theta_rad);
        arrow(ctx, bobX, bobY, bobX + len * dir, bobY, "v", C.vel);
      }
      if (showVectors.acceleration && Math.abs(a) > 0.005) {
        const len = (a / aMax) * maxVec;
        // restoring: toward equilibrium (horizontal for pendulum)
        arrow(ctx, bobX, bobY, bobX - len * Math.sin(theta_rad) * 3, bobY, "a", C.acc);
      }
      if (showVectors.displacement && Math.abs(x) > 0.005) {
        arrow(ctx, pivX, pivY + L_px, bobX, pivY + L_px, "x", C.disp);
      }

      // Bob
      ctx.beginPath(); ctx.arc(bobX, bobY, 18, 0, Math.PI*2);
      const bg = ctx.createRadialGradient(bobX-4, bobY-4, 0, bobX, bobY, 18);
      bg.addColorStop(0, "#a78bfa"); bg.addColorStop(1, "#7c3aed");
      ctx.fillStyle = bg; ctx.shadowBlur = 20; ctx.shadowColor = C.disp;
      ctx.fill(); ctx.shadowBlur = 0;

      // Pivot
      ctx.beginPath(); ctx.arc(pivX, pivY, 6, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(pivX-60, pivY-18, 120, 18);
    }

    // ── Phase Wheel ───────────────────────────────────────────
    function drawPhaseWheel(ctx: CanvasRenderingContext2D, theta: number, W: number) {
      const cx = 90, cy = 180, R = 52;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.arc(cx, cy, R + 14, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();
      // axes
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx-R,cy); ctx.lineTo(cx+R,cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke();
      // phasor
      const px = cx + R * Math.cos(theta);
      const py = cy + R * Math.sin(theta);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py);
      ctx.strokeStyle = C.disp; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2);
      ctx.fillStyle = C.disp; ctx.shadowBlur = 8; ctx.shadowColor = C.disp;
      ctx.fill(); ctx.shadowBlur = 0;
      // labels
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "bold 8px Inter"; ctx.textAlign = "center";
      ctx.fillText("Phase Wheel", cx, cy + R + 12);
      ctx.fillText("x→", cx + R + 6, cy + 3);
      ctx.fillText("↑v", cx, cy - R - 5);
    }

    // ── HUD strip ─────────────────────────────────────────────
    function drawHUD(
      ctx: CanvasRenderingContext2D,
      x: number, v: number, a: number, F: number, W: number, H: number
    ) {
      const items = [
        { l: "x(t)", val: `${x >= 0 ? "+" : ""}${x.toFixed(3)} m`, c: C.disp },
        { l: "v(t)", val: `${v >= 0 ? "+" : ""}${v.toFixed(3)} m/s`, c: C.vel },
        { l: "a(t)", val: `${a >= 0 ? "+" : ""}${a.toFixed(3)} m/s²`, c: C.acc },
        { l: "F(t)", val: `${F >= 0 ? "+" : ""}${F.toFixed(3)} N`, c: C.force },
      ];
      const startX = 20, startY = H - 68;
      items.forEach((it, i) => {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        rr(ctx, startX + i * 150, startY, 140, 50, 6); ctx.fill();
        ctx.fillStyle = it.c; ctx.font = "bold 9px Inter"; ctx.textAlign = "left";
        ctx.fillText(it.l, startX + i*150 + 10, startY + 16);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(it.val, startX + i*150 + 10, startY + 36);
      });
      // coord convention label
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "bold 8px Inter";
      ctx.textAlign = "left"; ctx.fillText("Coord: Downward = +x", startX, startY - 8);
    }

    function drawEnergyPanel(
      ctx: CanvasRenderingContext2D,
      KE: number, PE: number, Etot: number, W: number
    ) {
      const ex = W - 175, ey = 420, ew = 155, barW = 110;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; rr(ctx, ex-8, ey-16, ew+16, 130, 12); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "bold 9px Inter"; ctx.textAlign = "left";
      ctx.fillText("Energy (J)", ex, ey);
      const safeEtot = Math.max(Etot, 0.001);
      [[KE, "#10b981", "KE = ½mv²"], [PE, "#f97316", "PE = ½kx²"]].forEach(([val, col, lbl], i) => {
        const y2 = ey + 20 + i * 48;
        ctx.fillStyle = "rgba(255,255,255,0.1)"; rr(ctx, ex, y2+14, barW, 10, 4); ctx.fill();
        ctx.fillStyle = col as string;
        const w = Math.max((val as number) / safeEtot * barW, 1);
        rr(ctx, ex, y2+14, w, 10, 4); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 8px Inter";
        ctx.fillText(`${lbl}: ${(val as number).toFixed(2)}`, ex, y2+12);
      });
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "bold 9px Inter";
      ctx.fillText(`Total E: ${Etot.toFixed(2)} J`, ex, ey + 118);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [amplitude, angularFreq, phase, time, isPlaying, mode, mass, kConstant, showVectors, showTrail]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden shadow-2xl">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">SHM Engine</div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]" : "bg-rose-500"} animate-pulse`} />
          <div className="text-white/80 font-mono text-xs">{isPlaying ? "OSCILLATING" : "IDLE"}</div>
        </div>
      </div>
    </div>
  );
};

// ── Module-level helpers ──────────────────────────────────────

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  label: string, color: string
) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const head = 9;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head*Math.cos(angle-Math.PI/6), y2 - head*Math.sin(angle-Math.PI/6));
  ctx.lineTo(x2 - head*Math.cos(angle+Math.PI/6), y2 - head*Math.sin(angle+Math.PI/6));
  ctx.closePath(); ctx.fill();
  const lx = x2 + 14*Math.cos(angle), ly = y2 + 14*Math.sin(angle);
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  const m = ctx.measureText(label);
  ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(lx-3, ly-11, m.width+6, 14);
  ctx.fillStyle = color; ctx.textAlign = "left"; ctx.fillText(label, lx, ly);
}

function drawCoil(ctx: CanvasRenderingContext2D, cx: number, yTop: number, yBot: number) {
  const coils = 10, amp = 18;
  const total = yBot - yTop;
  if (total < 10) return;
  const seg = total / (coils * 2);
  ctx.beginPath(); ctx.moveTo(cx, yTop);
  for (let i = 0; i < coils * 2; i++) {
    const yM = yTop + i * seg + seg / 2;
    const yE = yTop + (i + 1) * seg;
    const xc = cx + (i % 2 === 0 ? amp : -amp);
    ctx.quadraticCurveTo(xc, yM, cx, yE);
  }
  const g = ctx.createLinearGradient(cx-amp, yTop, cx+amp, yBot);
  g.addColorStop(0, "rgba(139,92,246,0.9)");
  g.addColorStop(0.5, "rgba(167,139,250,1)");
  g.addColorStop(1, "rgba(109,40,217,0.9)");
  ctx.strokeStyle = g; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6; ctx.shadowColor = "#8b5cf6";
  ctx.stroke(); ctx.shadowBlur = 0;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

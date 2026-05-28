"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { CarnotEngineCore } from "@/lib/physics/carnot";
import { useCarnotStore } from "@/store/carnotStore";

interface CarnotPVGraphProps {
  engine: CarnotEngineCore;
}

export const CarnotPVGraph: React.FC<CarnotPVGraphProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Use refs for the animation loop so it always reads fresh values
  const storeRef = useRef({ stage: useCarnotStore.getState().currentStage, progress: useCarnotStore.getState().stageProgress });

  // Subscribe to store changes and keep ref current
  useEffect(() => {
    const unsub = useCarnotStore.subscribe(state => {
      storeRef.current.stage = state.currentStage;
      storeRef.current.progress = state.stageProgress;
    });
    return unsub;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    if (w === 0 || h === 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    // ── Layout ────────────────────────────────────────────────────────────────
    const ml = 44, mb = 28, mt = 16, mr = 16;
    const graphW = w - ml - mr;
    const graphH = h - mt - mb;

    // ── Background ────────────────────────────────────────────────────────────
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, w, h);

    // Engineering grid
    ctx.strokeStyle = "rgba(6, 182, 212, 0.04)";
    ctx.lineWidth = 1;
    const gridStep = 32;
    for (let x = ml; x < w - mr; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, h - mb); ctx.stroke();
    }
    for (let y = mt; y < h - mb; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
    }

    // Graph area border
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ml, mt, graphW, graphH);

    // ── PV Path Data ──────────────────────────────────────────────────────────
    const path = engine.getCyclePath(60);
    if (path.length < 2) return;

    const allV = path.map(p => p.v);
    const allP = path.map(p => p.p);
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV) * 1.08;
    const minP = 0;
    const maxP = Math.max(...allP) * 1.12;

    const toX = (v: number) => ml + ((v - minV) / (maxV - minV + 1e-9)) * graphW;
    const toY = (p: number) => mt + graphH - ((p - minP) / (maxP - minP + 1e-9)) * graphH;

    // ── Fill enclosed area (net work) ─────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(toX(path[0].v), toY(path[0].p));
    for (let i = 1; i < path.length; i++) ctx.lineTo(toX(path[i].v), toY(path[i].p));
    ctx.closePath();
    const grad = ctx.createLinearGradient(ml, mt, ml, mt + graphH);
    grad.addColorStop(0, "rgba(16,185,129,0.18)");
    grad.addColorStop(1, "rgba(16,185,129,0.04)");
    ctx.fillStyle = grad;
    ctx.fill();

    // ── Draw 4 cycle segments ─────────────────────────────────────────────────
    const segments: [number, number, string, string][] = [
      [0, 60, "#ef4444", "Isothermal Exp."],   // Hot → red
      [60, 120, "#f97316", "Adiabatic Exp."],    // → orange
      [120, 180, "#3b82f6", "Isothermal Comp."],  // Cold → blue
      [180, 240, "#94a3b8", "Adiabatic Comp."],   // → grey
    ];

    segments.forEach(([start, end, color]) => {
      const clampedEnd = Math.min(end, path.length - 1);
      ctx.beginPath();
      ctx.moveTo(toX(path[start].v), toY(path[start].p));
      for (let i = start + 1; i <= clampedEnd; i++) {
        ctx.lineTo(toX(path[i].v), toY(path[i].p));
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();
    });

    // ── Isothermal labels ─────────────────────────────────────────────────────
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(239,68,68,0.7)";
    ctx.fillText("T_H", toX(path[10].v) + 4, toY(path[10].p) - 4);
    ctx.fillStyle = "rgba(59,130,246,0.7)";
    ctx.fillText("T_C", toX(path[150].v) + 4, toY(path[150].p) + 12);

    // ── Arrow tip at end of each segment (direction indicator) ───────────────
    const drawArrow = (x: number, y: number, dx: number, dy: number, color: string) => {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len, ny = dy / len;
      const size = 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - nx * size - ny * size * 0.5, y - ny * size + nx * size * 0.5);
      ctx.lineTo(x - nx * size + ny * size * 0.5, y - ny * size - nx * size * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    // Midpoint arrows
    [[30, "#ef4444"], [90, "#f97316"], [150, "#3b82f6"], [210, "#94a3b8"]].forEach(([mid, color]) => {
      const idx = mid as number;
      if (idx > 0 && idx < path.length - 1) {
        const dx = toX(path[idx].v) - toX(path[idx - 1].v);
        const dy = toY(path[idx].p) - toY(path[idx - 1].p);
        drawArrow(toX(path[idx].v), toY(path[idx].p), dx, dy, color as string);
      }
    });

    // ── Live state dot ────────────────────────────────────────────────────────
    const liveState = engine.getStateAt(storeRef.current.stage, storeRef.current.progress);
    const dotX = toX(liveState.V);
    const dotY = toY(liveState.P);

    // Guard against NaN coordinates before drawing
    if (isFinite(dotX) && isFinite(dotY)) {
      // Outer glow using shadowBlur (no CanvasGradient type issues)
      ctx.save();
      ctx.shadowColor = "rgba(6,182,212,0.7)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
      ctx.restore();

      // White dot core
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.stroke();

      // State label
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#06b6d4";
      ctx.fillText(`${(liveState.V).toFixed(1)}L`, dotX, dotY - 12);
    }

    // ── Axis tick marks and labels ────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "8px monospace";

    // X axis — 4 ticks
    for (let i = 0; i <= 4; i++) {
      const v = minV + (maxV - minV) * (i / 4);
      const x = toX(v);
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.textAlign = "center";
      ctx.fillText(v.toFixed(1), x, h - mb + 14);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, h - mb);
      ctx.lineTo(x, h - mb + 4);
      ctx.stroke();
    }

    // Y axis — 4 ticks
    for (let i = 0; i <= 4; i++) {
      const p = maxP * (i / 4);
      const y = toY(p);
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.textAlign = "right";
      const label = p >= 1000 ? `${(p / 1000).toFixed(1)}k` : p.toFixed(0);
      ctx.fillText(label, ml - 5, y + 3);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ml, y);
      ctx.lineTo(ml - 4, y);
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Volume V (L)", ml + graphW / 2, h - 2);

    ctx.save();
    ctx.translate(9, mt + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Pressure P", 0, 0);
    ctx.restore();
  }, [engine]);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      draw();
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  // ── ResizeObserver for dynamic layout ────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      // Reset canvas size on resize so it redraws at new dimensions
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] p-4 select-none">
      {/* Header with Title and Legend */}
      <div className="flex items-center justify-between mb-3 shrink-0 border-b border-white/5 pb-2">
        <span className="text-[9px] font-black text-white/55 uppercase tracking-widest">
          P-V Diagram
        </span>
        <div className="flex gap-2.5 flex-wrap justify-end">
          {[
            { color: "#ef4444", label: "Isothermal Exp" },
            { color: "#f97316", label: "Adiabatic Exp" },
            { color: "#3b82f6", label: "Isothermal Comp" },
            { color: "#94a3b8", label: "Adiabatic Comp" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[7.5px] font-mono text-white/60 font-bold whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};

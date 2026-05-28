"use client";

import React, { useRef, useEffect } from "react";
import { CarnotEngineCore } from "@/lib/physics/carnot";
import { useCarnotStore } from "@/store/carnotStore";

interface CarnotPVGraphProps {
  engine: CarnotEngineCore;
}

export const CarnotPVGraph: React.FC<CarnotPVGraphProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentStage = useCarnotStore(state => state.currentStage);
  const stageProgress = useCarnotStore(state => state.stageProgress);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Setup axes
      const ml = 40, mb = 30, mt = 20, mr = 20;
      const graphW = w - ml - mr;
      const graphH = h - mt - mb;

      // Draw background
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(ml, mt, graphW, graphH);
      ctx.strokeStyle = "#27272a";
      ctx.strokeRect(ml, mt, graphW, graphH);

      // Calculate bounds for PV
      const path = engine.getCyclePath(50);
      const minV = 0; // Start at 0 for V
      const maxV = Math.max(...path.map(p => p.v)) * 1.1;
      const minP = 0; // Start at 0 for P
      const maxP = Math.max(...path.map(p => p.p)) * 1.1;

      const toPxX = (v: number) => ml + ((v - minV) / (maxV - minV)) * graphW;
      const toPxY = (p: number) => mt + graphH - ((p - minP) / (maxP - minP)) * graphH;

      // Fill area under curve (Net Work)
      ctx.beginPath();
      ctx.moveTo(toPxX(path[0].v), toPxY(path[0].p));
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(toPxX(path[i].v), toPxY(path[i].p));
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fill();

      // Draw path segments with different colors
      const drawSegment = (startIdx: number, endIdx: number, color: string) => {
        ctx.beginPath();
        ctx.moveTo(toPxX(path[startIdx].v), toPxY(path[startIdx].p));
        for (let i = startIdx + 1; i <= endIdx; i++) {
          ctx.lineTo(toPxX(path[i].v), toPxY(path[i].p));
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      // path has 4 segments, 50 points each (0-50, 50-100, 100-150, 150-200)
      drawSegment(0, 50, "#ef4444"); // Isothermal Exp (Hot)
      drawSegment(50, 100, "#a1a1aa"); // Adiabatic Exp
      drawSegment(100, 150, "#3b82f6"); // Isothermal Comp (Cold)
      drawSegment(150, 200, "#a1a1aa"); // Adiabatic Comp

      // Draw current state dot
      const currentState = engine.getStateAt(currentStage, stageProgress);
      const dotX = toPxX(currentState.V);
      const dotY = toPxY(currentState.P);

      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Axes Labels
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Volume V", ml + graphW / 2, h - 10);
      
      ctx.save();
      ctx.translate(15, mt + graphH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Pressure P", 0, 0);
      ctx.restore();

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine, currentStage, stageProgress]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

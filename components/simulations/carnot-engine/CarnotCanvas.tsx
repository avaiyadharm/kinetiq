"use client";

import React, { useRef, useEffect } from "react";
import { useCarnotStore } from "@/store/carnotStore";
import { CarnotEngineCore } from "@/lib/physics/carnot";

interface CarnotCanvasProps {
  engine: CarnotEngineCore;
}

export const CarnotCanvas: React.FC<CarnotCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const tick = useCarnotStore(state => state.tick);
  const currentStage = useCarnotStore(state => state.currentStage);
  const stageProgress = useCarnotStore(state => state.stageProgress);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Update store state
      tick(dt);

      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(render);
        return;
      }
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Handle resolution scaling
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

      // Current physics state
      const state = engine.getStateAt(currentStage, stageProgress);
      
      // Geometry mapping
      const cx = w / 2;
      const cy = h / 2 - 20; // center of cylinder
      const cylW = 120;
      
      // Map Volume to piston height. Let's say V1=2 maps to h=40, V3=approx 15 maps to h=180
      const minV = engine.getStateAt("ISOTHERMAL_EXPANSION", 0).V; // V1
      const maxV = engine.getStateAt("ADIABATIC_EXPANSION", 1).V; // V3
      
      const minH = 40;
      const maxH = 180;
      const currentH = minH + ((state.V - minV) / (maxV - minV)) * (maxH - minH);
      
      // Draw cylinder walls
      ctx.strokeStyle = "#52525b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - cylW/2, cy - 100);
      ctx.lineTo(cx - cylW/2, cy + maxH/2);
      ctx.lineTo(cx + cylW/2, cy + maxH/2);
      ctx.lineTo(cx + cylW/2, cy - 100);
      ctx.stroke();

      // Gas interior color based on temperature
      const tempPct = (state.T - engine.TC) / (engine.TH - engine.TC || 1);
      const r = Math.floor(59 + tempPct * (239 - 59));
      const g = Math.floor(130 + tempPct * (68 - 130));
      const b = Math.floor(246 + tempPct * (68 - 246));
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      const pistonY = (cy + maxH/2) - currentH;
      ctx.fillRect(cx - cylW/2 + 2, pistonY, cylW - 4, currentH);
      
      // Particles (simple random visualization)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      for (let i=0; i<30; i++) {
        // pseudo-random based on time and index, constrained to box
        const px = (cx - cylW/2 + 10) + ((i * 137 + now*0.05) % (cylW - 20));
        const py = pistonY + 10 + ((i * 251 + now*0.07) % (currentH - 20));
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI*2);
        ctx.fill();
      }

      // Draw piston
      ctx.fillStyle = "#a1a1aa";
      ctx.fillRect(cx - cylW/2 + 2, pistonY - 10, cylW - 4, 10);
      
      // Piston rod
      ctx.fillStyle = "#71717a";
      ctx.fillRect(cx - 5, pistonY - 100, 10, 90);

      // Draw Reservoir / Stand underneath
      const blockY = cy + maxH/2 + 2;
      const blockW = 160;
      const blockH = 40;
      
      let blockLabel = "";
      let blockColor = "";
      
      switch (currentStage) {
        case "ISOTHERMAL_EXPANSION":
          blockLabel = `HOT RESERVOIR (T = ${engine.TH}K)`;
          blockColor = "rgba(239, 68, 68, 0.8)";
          break;
        case "ISOTHERMAL_COMPRESSION":
          blockLabel = `COLD RESERVOIR (T = ${engine.TC}K)`;
          blockColor = "rgba(59, 130, 246, 0.8)";
          break;
        case "ADIABATIC_EXPANSION":
        case "ADIABATIC_COMPRESSION":
          blockLabel = "INSULATING STAND";
          blockColor = "rgba(161, 161, 170, 0.8)";
          break;
      }
      
      ctx.fillStyle = blockColor;
      ctx.fillRect(cx - blockW/2, blockY, blockW, blockH);
      
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(blockLabel, cx, blockY + 24);
      
      // Heat transfer arrows
      if (currentStage === "ISOTHERMAL_EXPANSION") {
        ctx.fillStyle = "#ef4444";
        ctx.font = "16px sans-serif";
        ctx.fillText("↑ ↑ ↑", cx, blockY - 5 + Math.sin(now*0.01)*3);
        ctx.font = "12px sans-serif";
        ctx.fillText("Q_H", cx, blockY - 20);
      } else if (currentStage === "ISOTHERMAL_COMPRESSION") {
        ctx.fillStyle = "#3b82f6";
        ctx.font = "16px sans-serif";
        ctx.fillText("↓ ↓ ↓", cx, blockY - 5 + Math.sin(now*0.01)*3);
        ctx.font = "12px sans-serif";
        ctx.fillText("Q_C", cx, blockY - 20);
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [engine, currentStage, stageProgress, tick]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

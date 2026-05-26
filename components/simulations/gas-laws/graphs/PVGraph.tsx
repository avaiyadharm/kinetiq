"use client";

import React, { useRef, useEffect } from "react";
import { useGasLawsStore } from "@/store/gasLawsStore";

const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const PVGraph: React.FC<{ particleCount: number }> = ({ particleCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(particleCount);

  // Sync prop changes to ref to avoid triggering useEffect restarts
  useEffect(() => {
    countRef.current = particleCount;
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        const dpr = window.devicePixelRatio || 1;
        const newW = Math.round(width * dpr);
        const newH = Math.round(height * dpr);
        // Only set canvas dimensions if they actually changed to prevent automatic clears
        if (canvas.width !== newW || canvas.height !== newH) {
          canvas.width = newW;
          canvas.height = newH;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          ctx.scale(dpr, dpr);
        }
      }
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);

    let animationId: number;

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Margins
      const ml = 40, mb = 30, mt = 20, mr = 20;
      const graphW = w - ml - mr;
      const graphH = h - mt - mb;

      // Draw background
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(ml, mt, graphW, graphH);
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.strokeRect(ml, mt, graphW, graphH);

      // Axes Labels
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `9px ${FONT_MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("VOLUME V (dm³)", ml + graphW / 2, h - 8);
      
      ctx.save();
      ctx.translate(15, mt + graphH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("PRESSURE P (kPa)", 0, 0);
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 10px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("INDICATOR DIAGRAM (P-V PATH)", ml, 12);

      const vMin = 3.0;
      const vMax = 10.0;
      // Scale pMax dynamically based on particleCount to keep curves in physical scale
      const pMax = Math.max(100, (particleCount * 1.15054e-2 * 800) / 3.0);

      // Draw Ideal Gas reference hyperbolas
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1.5;
      const tempsRef = [200, 400, 600];
      const pCount = countRef.current;
      
      for (const tRef of tempsRef) {
        ctx.beginPath();
        for (let vx = 0; vx <= graphW; vx += 5) {
          const volPct = vx / graphW; 
          const volValue = vMin + volPct * (vMax - vMin);
          const idealPVal = (pCount * 1.15054e-2 * tRef) / volValue; 
          const graphP = mt + graphH - (idealPVal / pMax) * graphH;
          if (graphP >= mt && graphP <= mt + graphH) {
            if (vx === 0) ctx.moveTo(ml + vx, graphP);
            else ctx.lineTo(ml + vx, graphP);
          }
        }
        ctx.stroke();
      }

      // Read values dynamically from Zustand store to prevent React re-renders
      const storeState = useGasLawsStore.getState();
      const pvHistory = storeState.pvHistory;

      // Draw actual path history
      if (pvHistory && pvHistory.length > 1) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < pvHistory.length; i++) {
          const item = pvHistory[i];
          const vPct = (item.v - vMin) / (vMax - vMin);
          const pPct = item.p / pMax;
          const px = ml + Math.max(0, Math.min(graphW, vPct * graphW));
          const py = mt + graphH - Math.max(0, Math.min(graphH, pPct * graphH));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        const last = pvHistory[pvHistory.length - 1];
        const vPct = (last.v - vMin) / (vMax - vMin);
        const pPct = last.p / pMax;
        const currentDotX = ml + Math.max(0, Math.min(graphW, vPct * graphW));
        const currentDotY = mt + graphH - Math.max(0, Math.min(graphH, pPct * graphH));

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(currentDotX, currentDotY, 4, 0, 2*Math.PI);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

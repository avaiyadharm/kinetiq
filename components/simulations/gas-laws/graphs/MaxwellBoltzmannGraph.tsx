"use client";

import React, { useRef, useEffect } from "react";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { getTheoreticalMaxwellBoltzmann3D } from "@/lib/physics/thermodynamics";

const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const MaxwellBoltzmannGraph: React.FC<{ particleMass: number }> = ({ particleMass }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const massRef = useRef(particleMass);

  // Sync prop changes to ref to avoid triggering useEffect restarts
  useEffect(() => {
    massRef.current = particleMass;
  }, [particleMass]);

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
      const ml = 45, mb = 30, mt = 20, mr = 20;
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
      ctx.fillText("SPEED v (m/s)", ml + graphW / 2, h - 8);
      
      ctx.save();
      ctx.translate(15, mt + graphH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("PROBABILITY DENSITY", 0, 0);
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 10px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("VELOCITY DISTRIBUTION (3D MAXWELL-BOLTZMANN)", ml, 12);

      // Read values dynamically from Zustand store to prevent React re-renders
      const storeState = useGasLawsStore.getState();
      const speedHistogram = storeState.speedHistogram || [];
      const measuredTemp = storeState.measuredTemp;
      const v_rms = storeState.v_rms;
      const meanSpeed = storeState.meanSpeed;
      const v_mostProbable = storeState.v_mostProbable;
      const particleMassVal = massRef.current;

      const binCount = speedHistogram.length || 60;
      const maxSpeedCap = (storeState.binWidth || 5) * binCount;
      
      // Determine max density for Y-axis scaling (theoretical peak)
      const peakHeight = getTheoreticalMaxwellBoltzmann3D(v_mostProbable, particleMassVal, measuredTemp);
      const maxY = Math.max(peakHeight * 1.3, 0.01);

      // 1. Draw Histogram
      ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      const barW = graphW / (binCount || 1);
      
      for (let i = 0; i < binCount; i++) {
        const density = speedHistogram[i];
        if (density > 0) {
           const barH = (density / maxY) * graphH;
           const bx = ml + i * barW;
           const by = mt + graphH - barH;
           ctx.fillRect(bx + 1, by, barW - 2, barH);
           ctx.strokeRect(bx + 1, by, barW - 2, barH);
        }
      }

      // 2. Draw theoretical 3D curve overlay
      if (measuredTemp > 0) {
        ctx.strokeStyle = "#ec4899"; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let vx = 0; vx <= graphW; vx += 2) {
          const speed = (vx / graphW) * maxSpeedCap;
          const f_v = getTheoreticalMaxwellBoltzmann3D(speed, particleMassVal, measuredTemp);
          const yFraction = f_v / maxY;
          const py = mt + graphH - yFraction * graphH; 

          if (vx === 0) ctx.moveTo(ml + vx, py);
          else ctx.lineTo(ml + vx, py);
        }
        ctx.stroke();
      }

      // 3. Draw Indicators (v_p, v_avg, v_rms)
      const drawMarker = (v: number, color: string, label: string, yOffset: number) => {
         const x = ml + (v / maxSpeedCap) * graphW;
         if (x < ml || x > ml + graphW) return;
         
         ctx.strokeStyle = color;
         ctx.lineWidth = 1;
         ctx.setLineDash([4, 4]);
         ctx.beginPath();
         ctx.moveTo(x, mt);
         ctx.lineTo(x, mt + graphH);
         ctx.stroke();
         ctx.setLineDash([]);
         
         ctx.fillStyle = color;
         ctx.font = `8px ${FONT_MONO}`;
         ctx.textAlign = "left";
         ctx.fillText(`${label}`, x + 4, mt + yOffset);
      };

      if (v_rms > 0) {
        drawMarker(v_mostProbable, "#f43f5e", "v_p", 15);
        drawMarker(meanSpeed, "#8b5cf6", "v_avg", 30);
        drawMarker(v_rms, "#3b82f6", "v_rms", 45);
      }

      // Legend
      ctx.fillStyle = "#ec4899";
      ctx.fillRect(w - mr - 95, mt + 10, 8, 4);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `8px ${FONT_MONO}`;
      ctx.textAlign = "left";
      ctx.fillText("Theoretical 3D MB", w - mr - 83, mt + 14);

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

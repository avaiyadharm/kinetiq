"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface WaveInterferenceCanvasProps {
  frequency: number; // Hz
  separation: number; // Distance between sources
  numSources: number; // 1 or 2
  waveSpeed: number; // pixels / second or scaled units
  time: number; // current time in seconds
  isPlaying: boolean;
}

export const WaveInterferenceCanvas: React.FC<WaveInterferenceCanvasProps> = ({
  frequency,
  separation,
  numSources,
  waveSpeed,
  time,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Resolution of the simulation grid
  const GRID_SIZE = 256;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // We create an ImageData object to manipulate pixels directly
    const imgData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
    const data = imgData.data;

    // Physical parameters
    // We scale physical space so the canvas represents 10x10 meters.
    const metersPerPixel = 10 / GRID_SIZE;
    
    // Wave parameters
    const lambda = waveSpeed / frequency;
    const k = (2 * Math.PI) / lambda; // Wavenumber
    const omega = 2 * Math.PI * frequency; // Angular frequency

    // Source positions (center is 5m, 5m)
    const centerX = 5;
    const centerY = 5;
    const s1x = centerX - separation / 2;
    const s2x = centerX + separation / 2;
    const s1y = centerY;
    const s2y = centerY;

    // Render function
    const render = () => {
      // Background color: #09090b (9, 9, 11)
      // Positive peak color: Cyan (34, 211, 238)
      // Negative peak color: Violet (139, 92, 246)
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const px = x * metersPerPixel;
          const py = y * metersPerPixel;

          // Distance to sources
          const d1 = Math.sqrt((px - s1x)**2 + (py - s1y)**2);
          const d2 = Math.sqrt((px - s2x)**2 + (py - s2y)**2);

          // Calculate wave height z
          // z = A * sin(k*d - omega*t)
          // We apply slight distance attenuation: 1 / sqrt(d) (using max to avoid infinity)
          const atten1 = 1 / Math.sqrt(Math.max(d1, 0.1));
          const z1 = atten1 * Math.sin(k * d1 - omega * time);
          
          let z = z1;
          
          if (numSources === 2) {
            const atten2 = 1 / Math.sqrt(Math.max(d2, 0.1));
            const z2 = atten2 * Math.sin(k * d2 - omega * time);
            z = z1 + z2;
          }

          // Normalize z for coloring. Max theoretical z varies based on attenuation,
          // but we can scale it to a reasonable visual range [-1, 1].
          // Using a softening factor
          let zNorm = z * 0.8;
          zNorm = Math.max(-1, Math.min(1, zNorm)); // Clamp

          let r, g, b;
          if (zNorm >= 0) {
            // Mix between BG and Cyan
            r = 9 + (34 - 9) * zNorm;
            g = 9 + (211 - 9) * zNorm;
            b = 11 + (238 - 11) * zNorm;
          } else {
            // Mix between BG and Violet
            const absZ = Math.abs(zNorm);
            r = 9 + (139 - 9) * absZ;
            g = 9 + (92 - 9) * absZ;
            b = 11 + (246 - 11) * absZ;
          }

          // Index in the pixel array
          const idx = (y * GRID_SIZE + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255; // Alpha
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Draw source markers
      ctx.fillStyle = "white";
      
      const s1px = (s1x / metersPerPixel);
      const s1py = (s1y / metersPerPixel);
      ctx.beginPath();
      ctx.arc(s1px, s1py, 3, 0, 2 * Math.PI);
      ctx.fill();

      if (numSources === 2) {
        const s2px = (s2x / metersPerPixel);
        const s2py = (s2y / metersPerPixel);
        ctx.beginPath();
        ctx.arc(s2px, s2py, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    render();

  }, [frequency, separation, numSources, waveSpeed, time]); // re-render when these change

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#09090b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
      <motion.canvas
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        ref={canvasRef}
        width={GRID_SIZE}
        height={GRID_SIZE}
        className="w-full h-full max-w-[800px] max-h-[800px] object-contain rounded-2xl p-4 mix-blend-screen"
        style={{ imageRendering: "pixelated" }} // keep grid sharp or use 'auto' for blurred interpolation
      />
      
      {/* HUD Overlays */}
      <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-xs font-mono font-bold text-white/80 tracking-widest uppercase">
            {isPlaying ? 'Simulation Running' : 'Simulation Paused'}
          </span>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60">
          GRID: {GRID_SIZE}x{GRID_SIZE} | T: {time.toFixed(2)}s
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 flex gap-2 pointer-events-none">
         <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center">
            <span className="w-4 h-4 rounded-full bg-[#22d3ee] mb-1 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            <span className="text-[9px] uppercase font-bold text-white/50">Crest</span>
         </div>
         <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center">
            <span className="w-4 h-4 rounded-full bg-[#8b5cf6] mb-1 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            <span className="text-[9px] uppercase font-bold text-white/50">Trough</span>
         </div>
         <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center">
            <span className="w-4 h-4 rounded-full bg-[#09090b] border border-white/20 mb-1" />
            <span className="text-[9px] uppercase font-bold text-white/50">Node</span>
         </div>
      </div>
    </div>
  );
};

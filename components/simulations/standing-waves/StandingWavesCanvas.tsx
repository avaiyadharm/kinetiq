"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BoundaryType = "Fixed-Fixed" | "Free-Free" | "Fixed-Free";
export type RenderMode = "Displacement" | "Energy" | "Phase" | "Scientific";

interface StandingWavesCanvasProps {
  amplitude: number;
  harmonic: number;
  waveSpeed: number; // v
  boundaryType: BoundaryType;
  renderMode: RenderMode;
  showComponents: boolean;
  showNodes: boolean;
  showAntinodes: boolean;
  isPlaying: boolean;
  time: number;
  length: number; // L
}

export const StandingWavesCanvas: React.FC<StandingWavesCanvasProps> = ({
  amplitude,
  harmonic,
  waveSpeed,
  boundaryType,
  renderMode,
  showComponents,
  showNodes,
  showAntinodes,
  isPlaying,
  time,
  length,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mouse inspector
  const [hoverData, setHoverData] = useState({
    visible: false, x: 0, y: 0, px: 0, z: 0, nodeType: ""
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Math Setup
      let k = 0;
      let lambda = 0;
      let phaseShift = 0; // for free boundary at x=0
      let baseFunc = Math.sin;

      if (boundaryType === "Fixed-Fixed") {
        lambda = (2 * length) / harmonic;
        k = (2 * Math.PI) / lambda;
        baseFunc = Math.sin;
      } else if (boundaryType === "Free-Free") {
        lambda = (2 * length) / harmonic;
        k = (2 * Math.PI) / lambda;
        baseFunc = Math.cos;
      } else if (boundaryType === "Fixed-Free") {
        lambda = (4 * length) / (2 * harmonic - 1);
        k = (2 * Math.PI) / lambda;
        baseFunc = Math.sin;
      }

      const omega = k * waveSpeed;
      const A = amplitude * 100; // Visual scaling

      // Define equations
      const y1 = (x: number) => (A / 2) * baseFunc(k * x - omega * time);
      const y2 = (x: number) => (A / 2) * baseFunc(k * x + omega * time);
      const y_net = (x: number) => A * baseFunc(k * x) * Math.cos(omega * time);

      // Rendering Style
      const isScientific = renderMode === "Scientific";
      
      if (!isScientific) {
        // Draw grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          ctx.moveTo(0, (height / 10) * i);
          ctx.lineTo(width, (height / 10) * i);
          ctx.moveTo((width / 10) * i, 0);
          ctx.lineTo((width / 10) * i, height);
        }
        ctx.stroke();
      }

      // Draw components if enabled
      if (showComponents) {
        ctx.lineWidth = 2;
        // Right-traveling wave (Cyan)
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const py = height / 2 - y1(x);
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
        if (!isScientific) ctx.shadowColor = "rgba(34, 211, 238, 0.8)";
        if (!isScientific) ctx.shadowBlur = 10;
        ctx.stroke();

        // Left-traveling wave (Rose)
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const py = height / 2 - y2(x);
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
        if (!isScientific) ctx.shadowColor = "rgba(244, 63, 94, 0.8)";
        if (!isScientific) ctx.shadowBlur = 10;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      }

      // Draw Resultant Standing Wave
      ctx.beginPath();
      for (let px = 0; px <= width; px++) {
        const x = (px / width) * length;
        const py = height / 2 - y_net(x);
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.lineWidth = isScientific ? 2 : 4;
      
      if (renderMode === "Displacement") {
        ctx.strokeStyle = "#fff";
        ctx.shadowColor = "rgba(255,255,255,0.5)";
        ctx.shadowBlur = 15;
      } else if (renderMode === "Energy") {
        // Energy is proportional to square of amplitude + square of velocity
        // We can color code based on local kinetic energy (velocity^2)
        const v_env = Math.abs(Math.sin(omega * time)); // overall velocity magnitude
        const r = Math.floor(255 * v_env);
        const b = Math.floor(255 * (1 - v_env));
        ctx.strokeStyle = `rgb(${r}, 100, ${b})`;
        ctx.shadowColor = `rgb(${r}, 100, ${b})`;
        ctx.shadowBlur = 20;
      } else if (renderMode === "Phase") {
        const p = Math.abs(Math.cos(omega * time));
        ctx.strokeStyle = `hsl(${p * 360}, 100%, 70%)`;
      } else {
        ctx.strokeStyle = "#aaa";
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Calculate Nodes and Antinodes
      const numNodes = boundaryType === "Fixed-Fixed" ? harmonic + 1 : boundaryType === "Free-Free" ? harmonic : harmonic;
      const numAntinodes = boundaryType === "Fixed-Fixed" ? harmonic : boundaryType === "Free-Free" ? harmonic + 1 : harmonic;
      
      const drawMarkers = () => {
        // Find positions by scanning or math
        // For Fixed-Fixed: nodes at x = n*lambda/2
        let nodes: number[] = [];
        let antinodes: number[] = [];

        if (boundaryType === "Fixed-Fixed") {
          for(let i=0; i<=harmonic; i++) nodes.push(i * lambda / 2);
          for(let i=0; i<harmonic; i++) antinodes.push((i + 0.5) * lambda / 2);
        } else if (boundaryType === "Free-Free") {
          for(let i=0; i<harmonic; i++) nodes.push((i + 0.5) * lambda / 2);
          for(let i=0; i<=harmonic; i++) antinodes.push(i * lambda / 2);
        } else if (boundaryType === "Fixed-Free") {
          for(let i=0; i<harmonic; i++) nodes.push(i * lambda / 2);
          for(let i=0; i<harmonic; i++) antinodes.push((i + 0.5) * lambda / 2);
        }

        if (showNodes) {
          ctx.fillStyle = isScientific ? "#fff" : "#ef4444";
          nodes.forEach(x => {
            const px = (x / length) * width;
            ctx.beginPath();
            ctx.arc(px, height / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            if (!isScientific) {
              ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
              ctx.beginPath();
              ctx.arc(px, height / 2, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ef4444";
            }
          });
        }

        if (showAntinodes) {
          ctx.fillStyle = isScientific ? "#fff" : "#10b981";
          antinodes.forEach(x => {
            const px = (x / length) * width;
            const py = height / 2 - y_net(x);
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            if (!isScientific) {
              // Antinode bounding envelope
              ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(px, height / 2 - A * baseFunc(k*x));
              ctx.lineTo(px, height / 2 + A * baseFunc(k*x));
              ctx.stroke();
              ctx.setLineDash([]);
            }
          });
        }
      };

      drawMarkers();

      // Boundaries
      ctx.fillStyle = "#fff";
      if (boundaryType.startsWith("Fixed")) {
        ctx.fillRect(0, height / 2 - 20, 8, 40);
      }
      if (boundaryType.endsWith("Fixed")) {
        ctx.fillRect(width - 8, height / 2 - 20, 8, 40);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [amplitude, harmonic, waveSpeed, boundaryType, renderMode, showComponents, showNodes, showAntinodes, time, length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const x = u * length;

    let k = 0;
    let lambda = 0;
    let baseFunc = Math.sin;
    if (boundaryType === "Fixed-Fixed") {
      lambda = (2 * length) / harmonic;
      k = (2 * Math.PI) / lambda;
      baseFunc = Math.sin;
    } else if (boundaryType === "Free-Free") {
      lambda = (2 * length) / harmonic;
      k = (2 * Math.PI) / lambda;
      baseFunc = Math.cos;
    } else if (boundaryType === "Fixed-Free") {
      lambda = (4 * length) / (2 * harmonic - 1);
      k = (2 * Math.PI) / lambda;
      baseFunc = Math.sin;
    }
    const omega = k * waveSpeed;
    const z = amplitude * baseFunc(k * x) * Math.cos(omega * time);
    
    // Classify node/antinode
    const envelope = Math.abs(baseFunc(k * x));
    let nodeType = "Intermediate";
    if (envelope < 0.1) nodeType = "Node (Zero Amplitude)";
    else if (envelope > 0.9) nodeType = "Antinode (Max Amplitude)";

    setHoverData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      px: x,
      z,
      nodeType
    });
  };

  const handleMouseLeave = () => setHoverData(prev => ({ ...prev, visible: false }));

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#09090b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl cursor-crosshair">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="w-full h-full object-contain"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* HUD Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
          <span className="text-xs font-mono font-bold text-white/90 tracking-widest uppercase">
            {isPlaying ? 'Simulation Active' : 'Simulation Paused'}
          </span>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg uppercase">
          RENDER: {renderMode} | BOUNDARY: {boundaryType} | L: {length.toFixed(1)}m
        </div>
      </div>

      {/* Interactive Probing Tooltip */}
      <AnimatePresence>
        {hoverData.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed pointer-events-none z-50 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px]"
            style={{ 
              left: hoverData.x + 20, 
              top: hoverData.y + 20,
              transform: `translate(${hoverData.x > window.innerWidth - 250 ? '-120%' : '0'}, ${hoverData.y > window.innerHeight - 200 ? '-120%' : '0'})` 
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${hoverData.nodeType.includes('Node') ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : hoverData.nodeType.includes('Antinode') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{hoverData.nodeType}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-6 border-b border-white/5 pb-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40">Position (x)</span>
                <span className="text-xs font-mono font-bold text-white/80">{hoverData.px.toFixed(2)}m</span>
              </div>
              <div className="flex justify-between items-center gap-6 border-b border-white/5 pb-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40">Displacement (z)</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{hoverData.z.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

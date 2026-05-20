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
  tension: number;
  density: number;
  damping: number;
  reflection: number;
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
  tension,
  density,
  damping,
  reflection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mouse inspector
  const [hoverData, setHoverData] = useState({
    visible: false, x: 0, y: 0, px: 0, z: 0, energy: 0, nodeType: "", definition: ""
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
      let lambda = 0;
      let k = 0;

      if (boundaryType === "Fixed-Fixed") {
        lambda = (2 * length) / harmonic;
        k = (2 * Math.PI) / lambda;
      } else if (boundaryType === "Free-Free") {
        lambda = (2 * length) / harmonic;
        k = (2 * Math.PI) / lambda;
      } else if (boundaryType === "Fixed-Free") {
        // Enforce odd harmonic
        const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
        lambda = (4 * length) / oddHarmonic;
        k = (2 * Math.PI) / lambda;
      }

      const omega = k * waveSpeed;
      const A_px = amplitude * 40; // Visual scaling factor
      const beta = damping; // Temporal damping factor
      const temporalDecay = Math.exp(-beta * time);
      const baseWaveFunc = boundaryType.startsWith("Free") ? Math.cos : Math.sin;

      // Travelling wave components
      // y1: Forward wave traveling to the right
      const y1 = (x: number) => A_px * temporalDecay * baseWaveFunc(k * x - omega * time);

      // y2: Backward wave traveling to the left
      const y2 = (x: number) => A_px * temporalDecay * baseWaveFunc(k * x + omega * time);

      // Net displacement from superposition
      const y_net = (x: number) => y1(x) + y2(x);

      // Helper to compute derivatives accurately for energy calculations
      const getDerivatives = (x: number, A_val: number) => {
        let dt1, dt2, dx1, dx2;
        if (baseWaveFunc === Math.sin) {
          dt1 = A_val * temporalDecay * (-omega * Math.cos(k * x - omega * time) - beta * Math.sin(k * x - omega * time));
          dt2 = A_val * temporalDecay * ( omega * Math.cos(k * x + omega * time) - beta * Math.sin(k * x + omega * time));
          dx1 = A_val * temporalDecay * k * Math.cos(k * x - omega * time);
          dx2 = A_val * temporalDecay * k * Math.cos(k * x + omega * time);
        } else {
          dt1 = A_val * temporalDecay * ( omega * Math.sin(k * x - omega * time) - beta * Math.cos(k * x - omega * time));
          dt2 = A_val * temporalDecay * (-omega * Math.sin(k * x + omega * time) - beta * Math.cos(k * x + omega * time));
          dx1 = A_val * temporalDecay * (-k * Math.sin(k * x - omega * time));
          dx2 = A_val * temporalDecay * (-k * Math.sin(k * x + omega * time));
        }
        return { dy_dt: dt1 + dt2, dy_dx: dx1 + dx2 };
      };

      const dy_dt = (x: number) => getDerivatives(x, A_px).dy_dt;
      const dy_dx = (x: number) => getDerivatives(x, A_px).dy_dx;

      const isScientific = renderMode === "Scientific";
      const isEnergyMode = renderMode === "Energy";

      // Draw Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        ctx.moveTo(0, (height / 10) * i);
        ctx.lineTo(width, (height / 10) * i);
        ctx.moveTo((width / 10) * i, 0);
        ctx.lineTo((width / 10) * i, height);
      }
      ctx.stroke();

      // Reference Center-Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isEnergyMode) {
        // Energy visualization mode
        // Plot K, U, and Total Energy E
        const scale = 0.08 / (tension * 0.01 + 1); // scaling factor to keep curves on screen
        
        ctx.lineWidth = 2;
        
        // Draw Kinetic Energy Density (Green/Cyan)
        ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const K = 0.5 * density * Math.pow(dy_dt(x), 2) * scale;
          const py = height / 2 - K;
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Potential Energy Density (Orange)
        ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const U = 0.5 * tension * Math.pow(dy_dx(x), 2) * scale;
          const py = height / 2 - U;
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Total Energy Density (Vibrant Purple/Pink)
        ctx.strokeStyle = "#d946ef";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(217, 70, 239, 0.4)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const K = 0.5 * density * Math.pow(dy_dt(x), 2) * scale;
          const U = 0.5 * tension * Math.pow(dy_dx(x), 2) * scale;
          const E = K + U;
          const py = height / 2 - E;
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Draw traveling components if enabled
        if (showComponents) {
          ctx.lineWidth = 1.5;
          
          // Right-traveling wave (Cyan)
          ctx.beginPath();
          for (let px = 0; px <= width; px++) {
            const x = (px / width) * length;
            const py = height / 2 - y1(x);
            if (px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
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
          ctx.stroke();
        }

        // Draw Net Standing Wave
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const py = height / 2 - y_net(x);
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.lineWidth = isScientific ? 2 : 4;
        if (renderMode === "Displacement") {
          ctx.strokeStyle = "#ffffff";
          ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
          ctx.shadowBlur = 10;
        } else if (renderMode === "Phase") {
          // Color code by phase angle
          const phaseVal = (omega * time) % (2 * Math.PI);
          ctx.strokeStyle = `hsl(${(phaseVal / (2 * Math.PI)) * 360}, 90%, 65%)`;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw phase arrows & envelope at antinodes to show phase inversion between adjacent antinodes
        let nodes: number[] = [];
        let antinodes: number[] = [];

        if (boundaryType === "Fixed-Fixed") {
          for (let i = 0; i <= harmonic; i++) nodes.push((i * lambda) / 2);
          for (let i = 0; i < harmonic; i++) antinodes.push(((i + 0.5) * lambda) / 2);
        } else if (boundaryType === "Free-Free") {
          for (let i = 0; i < harmonic; i++) nodes.push(((i + 0.5) * lambda) / 2);
          for (let i = 0; i <= harmonic; i++) antinodes.push((i * lambda) / 2);
        } else if (boundaryType === "Fixed-Free") {
          const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
          for (let m = 0; (m * lambda) / 2 <= length + 0.01; m++) {
            nodes.push((m * lambda) / 2);
          }
          for (let m = 0; (m + 0.5) * lambda / 2 <= length + 0.01; m++) {
            antinodes.push(((m + 0.5) * lambda) / 2);
          }
        }

        // Draw node markers
        if (showNodes) {
          ctx.fillStyle = isScientific ? "#ffffff" : "#ef4444";
          nodes.forEach((x) => {
            const px = (x / length) * width;
            ctx.beginPath();
            ctx.arc(px, height / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Halo
            if (!isScientific) {
              ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
              ctx.beginPath();
              ctx.arc(px, height / 2, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ef4444";
            }
          });
        }

        // Draw antinode markers & phase indicators
        if (showAntinodes) {
          antinodes.forEach((x) => {
            const px = (x / length) * width;
            const displacement = y_net(x);
            const py = height / 2 - displacement;

            // Draw point marker
            ctx.fillStyle = isScientific ? "#ffffff" : "#10b981";
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draw phase indicator arrow at each antinode
            // Adjacent antinodes are 180 degrees out of phase, which is visually demonstrated by arrows pointing in opposite directions
            const spatialFactor = baseWaveFunc(k * x);
            const direction = spatialFactor * Math.cos(omega * time) > 0 ? 1 : -1;
            
            // Draw arrow
            ctx.strokeStyle = direction > 0 ? "#10b981" : "#f43f5e";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, height / 2);
            ctx.lineTo(px, height / 2 - direction * 35);
            ctx.stroke();

            // Arrow tip
            ctx.fillStyle = direction > 0 ? "#10b981" : "#f43f5e";
            ctx.beginPath();
            ctx.moveTo(px - 4, height / 2 - direction * 30);
            ctx.lineTo(px + 4, height / 2 - direction * 30);
            ctx.lineTo(px, height / 2 - direction * 37);
            ctx.fill();
          });
        }
      }

      // Render boundary condition visuals with annotations
      ctx.fillStyle = "#ffffff";
      if (boundaryType.startsWith("Fixed")) {
        ctx.fillRect(0, height / 2 - 25, 8, 50);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FIXED NODE (π SHIFT)", 12, height / 2 + 3);
      } else {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, height / 2, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FREE ANTINODE (0 SHIFT)", 12, height / 2 + 3);
      }

      ctx.fillStyle = "#ffffff";
      if (boundaryType.endsWith("Fixed")) {
        ctx.fillRect(width - 8, height / 2 - 25, 8, 50);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FIXED NODE (π SHIFT)", width - 140, height / 2 + 3);
      } else {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width, height / 2, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FREE ANTINODE (0 SHIFT)", width - 150, height / 2 + 3);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [amplitude, harmonic, waveSpeed, boundaryType, renderMode, showComponents, showNodes, showAntinodes, time, length, tension, density, damping, reflection]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const x = u * length;

    let lambda = 0;
    let k = 0;

    if (boundaryType === "Fixed-Fixed") {
      lambda = (2 * length) / harmonic;
      k = (2 * Math.PI) / lambda;
    } else if (boundaryType === "Free-Free") {
      lambda = (2 * length) / harmonic;
      k = (2 * Math.PI) / lambda;
    } else if (boundaryType === "Fixed-Free") {
      const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
      lambda = (4 * length) / oddHarmonic;
      k = (2 * Math.PI) / lambda;
    }

    const omega = k * waveSpeed;
    const beta = damping;
    const temporalDecay = Math.exp(-beta * time);
    const baseWaveFunc = boundaryType.startsWith("Free") ? Math.cos : Math.sin;

    // Use actual physical amplitude for telemetry readings
    const A_real = amplitude;
    
    let y1_real = A_real * temporalDecay * baseWaveFunc(k * x - omega * time);
    let y2_real = A_real * temporalDecay * baseWaveFunc(k * x + omega * time);
    let z = y1_real + y2_real;

    let dt1, dt2, dx1, dx2;
    if (baseWaveFunc === Math.sin) {
      dt1 = A_real * temporalDecay * (-omega * Math.cos(k * x - omega * time) - beta * Math.sin(k * x - omega * time));
      dt2 = A_real * temporalDecay * ( omega * Math.cos(k * x + omega * time) - beta * Math.sin(k * x + omega * time));
      dx1 = A_real * temporalDecay * k * Math.cos(k * x - omega * time);
      dx2 = A_real * temporalDecay * k * Math.cos(k * x + omega * time);
    } else {
      dt1 = A_real * temporalDecay * ( omega * Math.sin(k * x - omega * time) - beta * Math.cos(k * x - omega * time));
      dt2 = A_real * temporalDecay * (-omega * Math.sin(k * x + omega * time) - beta * Math.cos(k * x + omega * time));
      dx1 = A_real * temporalDecay * (-k * Math.sin(k * x - omega * time));
      dx2 = A_real * temporalDecay * (-k * Math.sin(k * x + omega * time));
    }
    
    const dy_dt_real = dt1 + dt2;
    const dy_dx_real = dx1 + dx2;

    const real_K = 0.5 * density * Math.pow(dy_dt_real, 2);
    const real_U = 0.5 * tension * Math.pow(dy_dx_real, 2);
    const localEnergy = real_K + real_U;

    // Node / Antinode classification based on exact analytical envelope
    const envelope = Math.abs(baseWaveFunc(k * x));
    let nodeType = "Intermediate Node";
    let definition = "Medium oscillates between minimum and maximum limits. Superposition of traveling waves creates varying local displacement.";
    
    if (envelope < 0.1) {
      nodeType = "Node (Zero Amplitude)";
      definition = "A point along a standing wave where the wave has minimum (zero) amplitude at all times due to destructive interference.";
    } else if (envelope > 0.9) {
      nodeType = "Antinode (Maximum Amplitude)";
      definition = "A point at which the displacement of the standing wave is at its maximum at all times due to constructive interference.";
    }

    setHoverData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      px: x,
      z,
      energy: localEnergy,
      nodeType,
      definition
    });
  };

  const handleMouseLeave = () => setHoverData((prev) => ({ ...prev, visible: false }));

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
          RENDER: {renderMode} | BOUNDARY: {boundaryType} | L: {length.toFixed(1)}m | Time scale: 1.0x (Real-time)
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
            className="fixed pointer-events-none z-50 bg-black/90 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl max-w-[280px]"
            style={{ 
              left: hoverData.x + 20, 
              top: hoverData.y + 20,
              transform: `translate(${hoverData.x > window.innerWidth - 300 ? '-120%' : '0'}, ${hoverData.y > window.innerHeight - 250 ? '-120%' : '0'})` 
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hoverData.nodeType.includes('Node (Zero') ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : hoverData.nodeType.includes('Antinode') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{hoverData.nodeType}</span>
            </div>

            <p className="text-[9px] text-white/50 leading-relaxed mb-3 font-medium">
              {hoverData.definition}
            </p>
            
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Position (x)</span>
                <span className="text-xs font-mono font-bold text-white/80">{hoverData.px.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Displacement (z)</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{(hoverData.z * 100).toFixed(1)} cm</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Local Energy</span>
                <span className="text-xs font-mono font-bold text-fuchsia-400">{hoverData.energy.toFixed(3)} J/m</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface TrajectoryGraphProps {
  angle: number;
  velocity: number;
  gravity: number;
}

export const TrajectoryGraph: React.FC<Readonly<TrajectoryGraphProps>> = ({ angle, velocity, gravity }) => {
  const rad = (angle * Math.PI) / 180;

  const data = useMemo(() => {
    const vx = velocity * Math.cos(rad);
    const vy = velocity * Math.sin(rad);
    
    // Theoretical symmetric formulas
    const tFlight = Math.max(0.01, (2 * vy) / gravity);
    const totalRange = vx * tFlight;
    const maxHeight = (vy * vy) / (2 * gravity);

    const points = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (tFlight * i) / steps;
      const x = vx * t;
      const y = (vy * t) - (0.5 * gravity * t * t);
      points.push({ x, y });
    }

    // UNIFIED SCALING (Aspect Ratio 1:1)
    // We want to fit the entire trajectory in a way that x and y share the same scale
    const targetWidth = 80; // 80% of viewbox width
    const targetHeight = 60; // 60% of viewbox height
    
    const scaleX = targetWidth / Math.max(1, totalRange);
    const scaleY = targetHeight / Math.max(1, maxHeight);
    
    // Use the MINIMUM scale to ensure both fit while preserving aspect ratio
    const unifiedScale = Math.min(scaleX, scaleY);

    // Centering offsets
    const graphWidth = totalRange * unifiedScale;
    const offsetX = (100 - graphWidth) / 2;
    const offsetY = 15; // Bottom padding

    const path = points.reduce((acc, p, i) => {
      const scaledX = offsetX + p.x * unifiedScale;
      const scaledY = (100 - offsetY) - p.y * unifiedScale;
      return acc + (i === 0 ? `M ${scaledX} ${scaledY}` : ` L ${scaledX} ${scaledY}`);
    }, "");

    return { 
      path, 
      peakX: offsetX + (totalRange / 2) * unifiedScale, 
      peakY: (100 - offsetY) - maxHeight * unifiedScale, 
      endX: offsetX + totalRange * unifiedScale,
      startX: offsetX,
      groundY: (100 - offsetY),
      height: maxHeight, 
      range: totalRange
    };
  }, [angle, velocity, gravity]);

  return (
    <div className="h-full flex flex-col gap-4 relative overflow-hidden">
      <div className="flex-1 bg-[#09090b] rounded-xl border border-white/5 relative overflow-hidden p-4">
        {/* Graph Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-12 opacity-[0.03] pointer-events-none">
          {[0, 1, 2, 3].map(i => <div key={i} className="w-full h-[1px] bg-white" />)}
        </div>
        
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Ground Line */}
          <line 
            x1="5" 
            y1={data.groundY + 2} 
            x2="95" 
            y2={data.groundY + 2} 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="0.5" 
            strokeDasharray="2,2"
          />

          {/* Path */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            key={`${angle}-${velocity}-${gravity}`}
            transition={{ duration: 0.8, ease: "circOut" }}
            d={data.path} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          
          {/* Peak Indicator */}
          {velocity > 0 && angle > 0 && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={`peak-${angle}-${velocity}-${gravity}`}
              transition={{ delay: 0.8 }}
            >
              <circle cx={data.peakX} cy={data.peakY} r="1" fill="#10b981" />
              <text 
                x={data.peakX} 
                y={data.peakY - 5} 
                textAnchor="middle" 
                className="text-[5px] fill-success font-bold"
              >
                Peak: {data.height.toFixed(1)}m
              </text>
              {/* Vertical line to peak */}
              <line x1={data.peakX} y1={data.peakY} x2={data.peakX} y2={data.groundY} stroke="#10b981" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.5" />
            </motion.g>
          )}

          {/* Range Indicator */}
          {velocity > 0 && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={`range-${angle}-${velocity}-${gravity}`}
              transition={{ delay: 1 }}
            >
              <circle cx={data.endX} cy={data.groundY} r="1" fill="#f59e0b" />
              <text 
                x={data.endX} 
                y={data.groundY + 8} 
                textAnchor="middle" 
                className="text-[5px] fill-amber-500 font-bold"
              >
                Range: {data.range.toFixed(1)}m
              </text>
            </motion.g>
          )}

          {/* Start Point */}
          <circle cx={data.startX} cy={data.groundY} r="1" fill="#3b82f6" />
        </svg>

        {/* Axis Labels */}
        <div className="absolute bottom-1 right-4 text-[6px] font-bold text-white/10 uppercase tracking-[0.2em]">Scale: 1:1 Physical</div>
      </div>
      
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
           <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Symmetric Kinematic Analysis</span>
        </div>
      </div>
    </div>
  );
};

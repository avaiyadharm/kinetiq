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

    const viewMaxRange = Math.max(1, totalRange);
    const viewMaxHeight = Math.max(1, maxHeight);
    
    // Balanced safety margins (75% width usage)
    const scaleX = 75 / viewMaxRange;
    const scaleY = 70 / viewMaxHeight; 

    // padding for labels
    const offsetX = 12;
    const offsetY = 12;

    const path = points.reduce((acc, p, i) => {
      const scaledX = offsetX + p.x * scaleX;
      const scaledY = (100 - offsetY) - p.y * scaleY;
      return acc + (i === 0 ? `M ${scaledX} ${scaledY}` : ` L ${scaledX} ${scaledY}`);
    }, "");

    return { 
      path, 
      peakX: offsetX + (vx * (tFlight / 2)) * scaleX, 
      peakY: (100 - offsetY) - maxHeight * scaleY, 
      endX: offsetX + totalRange * scaleX,
      startY: (100 - offsetY),
      height: maxHeight, 
      range: totalRange
    };
  }, [angle, velocity, gravity]); // ADDED GRAVITY TO DEPENDENCY ARRAY

  return (
    <div className="h-full flex flex-col gap-4 relative overflow-hidden">
      <div className="flex-1 bg-[#09090b] rounded-xl border border-white/5 relative overflow-hidden p-4">
        {/* Graph Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-12 opacity-[0.03] pointer-events-none">
          {[0, 1, 2].map(i => <div key={i} className="w-full h-[1px] bg-white" />)}
        </div>
        
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Ground Line */}
          <line x1="5" y1="88" x2="95" y2="88" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

          {/* Path */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            key={`${angle}-${velocity}-${gravity}`}
            transition={{ duration: 0.8, ease: "easeOut" }}
            d={data.path} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2" 
          />
          
          {/* Peak Indicator */}
          {velocity > 0 && angle > 0 && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={`peak-${angle}-${velocity}-${gravity}`}
              transition={{ delay: 0.8 }}
            >
              <circle cx={data.peakX} cy={data.peakY} r="1.5" fill="#10b981" />
              <text 
                x={data.peakX} 
                y={data.peakY - 6} 
                textAnchor="middle" 
                className="text-[6px] fill-success font-bold"
              >
                Hmax: {data.height.toFixed(1)}m
              </text>
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
              <circle cx={data.endX} cy="88" r="1.5" fill="#f59e0b" />
              <text 
                x={data.endX} 
                y={82} 
                textAnchor="end" 
                dx="15"
                className="text-[6px] fill-amber-500 font-bold"
              >
                Range: {data.range.toFixed(1)}m
              </text>
            </motion.g>
          )}
        </svg>

        {/* Labels */}
        <div className="absolute bottom-1 right-4 text-[7px] font-bold text-white/20 uppercase tracking-[0.2em]">Horizontal Range</div>
        <div className="absolute top-8 left-2 text-[7px] font-bold text-white/20 uppercase tracking-[0.2em] rotate-[-90deg] origin-left">Vertical Height</div>
      </div>
      
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-primary" />
           <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Gravity-Aware Analysis</span>
        </div>
        <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">Vector Path v2.0</span>
      </div>
    </div>
  );
};

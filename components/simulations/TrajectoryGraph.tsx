"use client";

import React from "react";
import { motion } from "framer-motion";

interface TrajectoryGraphProps {
  angle: number;
  velocity: number;
}

export const TrajectoryGraph: React.FC<Readonly<TrajectoryGraphProps>> = ({ angle, velocity }) => {
  return (
    <div className="h-full flex flex-col gap-4 relative overflow-hidden">
      <div className="flex-1 bg-[#09090b] rounded-xl border border-white/5 relative overflow-hidden">
        {/* Graph Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-10">
          <div className="w-full h-[1px] bg-primary" />
          <div className="w-full h-[1px] bg-primary" />
          <div className="w-full h-[1px] bg-primary" />
          <div className="w-full h-[1px] bg-primary" />
        </div>

        {/* The Graph Path */}
        <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            key={`${angle}-${velocity}`}
            transition={{ duration: 1, ease: "easeOut" }}
            d="M 0,100 Q 50,0 100,100" 
            fill="none" 
            stroke="var(--color-primary)" 
            strokeWidth="2" 
            strokeDasharray="4 2"
          />
          <circle cx="50" cy="25" r="3" fill="var(--color-success)" />
        </svg>

        {/* Labels */}
        <div className="absolute bottom-2 right-4 text-[8px] font-bold text-white/40 uppercase tracking-widest">Distance (m)</div>
        <div className="absolute top-8 left-2 text-[8px] font-bold text-white/40 uppercase tracking-widest rotate-[-90deg] origin-left">Height (m)</div>
      </div>
    </div>
  );
};

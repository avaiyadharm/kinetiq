"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProjectileMotionCanvasProps {
  angle: number;
  velocity: number;
  isPlaying: boolean;
  showPath: boolean;
}

export const ProjectileMotionCanvas: React.FC<Readonly<ProjectileMotionCanvasProps>> = ({ angle, velocity, isPlaying, showPath }) => {
  return (
    <div className="w-full h-full relative bg-transparent">
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-[15%] border-t border-[#434655] bg-[#16202e]/50">
        <div className="absolute top-2 w-full px-12 flex justify-between text-[10px] font-bold text-[#8d90a0] uppercase tracking-widest opacity-40">
           <span>0m</span>
           <span>10m</span>
           <span>20m</span>
           <span>30m</span>
           <span>40m</span>
           <span>50m</span>
        </div>
      </div>

      {/* Trajectory and Projectile Group */}
      <div className="absolute bottom-[15%] left-[10%] w-[calc(100%-20%)] h-[80%]">
        {/* Cannon */}
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#091421] rounded-full border-2 border-[#434655] flex items-center justify-center z-20 shadow-2xl">
           <div className="w-6 h-6 bg-[#2563eb]/20 rounded-full flex items-center justify-center border border-[#2563eb]/40">
             <div className="w-2 h-2 bg-[#2563eb] rounded-full" />
           </div>
           {/* Barrel */}
           <motion.div 
             animate={{ rotate: -angle }}
             className="absolute w-20 h-5 bg-[#2563eb] rounded-r-xl border border-white/20 origin-left shadow-[0_0_20px_rgba(37,99,235,0.4)]"
             style={{ left: "50%", top: "50%", marginTop: "-10px" }}
           />
        </div>

        {/* Trajectory Path (Dashed) */}
        {showPath && (
           <svg className="absolute inset-0 overflow-visible -z-10" width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none">
             <motion.path 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 1, ease: "easeOut" }}
               d="M 32,400 Q 200,50 600,400" 
               fill="none" 
               stroke="#2563eb" 
               strokeWidth="3" 
               strokeDasharray="12 12"
               className="opacity-20"
             />
             
             {/* The Projectile Dot */}
             {isPlaying && (
               <motion.circle 
                 animate={{ 
                   x: [32, 200, 600], 
                   y: [400, 50, 400] 
                 }}
                 transition={{ 
                   duration: 2, 
                   repeat: Infinity, 
                   ease: "linear" 
                 }}
                 r="8" 
                 fill="#2563eb"
                 className="shadow-[0_0_30px_rgba(37,99,235,1)]"
               />
             )}
           </svg>
        )}
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-[#2563eb]/5 rounded-full blur-[150px] -z-10" />
    </div>
  );
};

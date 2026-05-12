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
    <div className="w-full h-full relative bg-[#050507]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjc21hbGxHcmlkKSIvPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
      
      {/* Ground */}
      <div className="absolute bottom-0 w-full h-[15%] border-t border-white/10 bg-white/[0.02]">
        <div className="absolute top-2 w-full px-12 flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest">
           <span>0m</span>
           <span>10m</span>
           <span>20m</span>
           <span>30m</span>
           <span>40m</span>
           <span>50m</span>
        </div>
      </div>

      {/* Trajectory and Projectile Group */}
      <div className="absolute bottom-[15%] left-[10%]">
        {/* Cannon */}
        <div className="relative w-12 h-12 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center z-20 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
           <div className="w-4 h-4 bg-white/40 rounded-full" />
           {/* Barrel */}
           <motion.div 
             animate={{ rotate: -angle }}
             className="absolute w-16 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-r-full border border-white/20 origin-left"
             style={{ left: "50%", top: "50%", marginTop: "-8px" }}
           />
        </div>

        {/* Trajectory Path (Dashed) */}
        {showPath && (
           <svg className="absolute bottom-0 left-0 overflow-visible -z-10" width="800" height="400" viewBox="0 0 800 400">
             <motion.path 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 1, ease: "easeOut" }}
               d="M 24,376 Q 200,100 600,376" 
               fill="none" 
               stroke="url(#grad)" 
               strokeWidth="3" 
               strokeDasharray="8 8"
               className="opacity-40"
             />
             <defs>
               <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#3b82f6" />
                 <stop offset="100%" stopColor="#a855f7" />
               </linearGradient>
             </defs>
             
             {/* The Projectile Dot */}
             {isPlaying && (
               <motion.circle 
                 animate={{ 
                   x: [24, 200, 600], 
                   y: [376, 100, 376] 
                 }}
                 transition={{ 
                   duration: 2, 
                   repeat: Infinity, 
                   ease: "linear" 
                 }}
                 r="6" 
                 fill="#3b82f6"
                 className="shadow-[0_0_10px_rgba(59,130,246,0.8)]"
               />
             )}
           </svg>
        )}
      </div>

      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-blue-500/5 rounded-full blur-[150px] -z-10" />
    </div>
  );
};

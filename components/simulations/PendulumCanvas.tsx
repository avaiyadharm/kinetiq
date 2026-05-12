"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface PendulumCanvasProps {
  length: number;
  mass: number;
  gravity: number;
  friction: number;
  isPlaying: boolean;
  onAngleChange?: (angle: number) => void;
}

export const PendulumCanvas: React.FC<Readonly<PendulumCanvasProps>> = ({ 
  length, 
  mass, 
  gravity, 
  friction, 
  isPlaying,
  onAngleChange
}) => {
  const [angle, setAngle] = useState(Math.PI / 4); // Initial angle 45 degrees
  const velocityRef = useRef(0);
  const angleRef = useRef(Math.PI / 4);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const dt = (time - lastTimeRef.current) / 1000; // time in seconds
      lastTimeRef.current = time;

      // Physics: a = -(g/L) * sin(theta) - friction * v
      // Scaling factor for visualization: length is 0.1 to 1.0, map to canvas pixels
      const effectiveLength = length * 300; 
      const acceleration = -(gravity / length) * Math.sin(angleRef.current) - (friction * velocityRef.current);
      
      velocityRef.current += acceleration * dt;
      angleRef.current += velocityRef.current * dt;

      setAngle(angleRef.current);
      if (onAngleChange) {
        onAngleChange((angleRef.current * 180) / Math.PI);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, length, gravity, friction, onAngleChange]);

  const centerX = "50%";
  const centerY = "20%";
  const pendulumLength = length * 400; // Visualization length

  return (
    <div className="w-full h-full relative bg-transparent overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #434655 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Pivot Point */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#091421] rounded-full border-2 border-[#434655] z-20 shadow-2xl flex items-center justify-center">
        <div className="w-2 h-2 bg-[#2563eb] rounded-full shadow-[0_0_10px_rgba(37,99,235,1)]" />
      </div>

      {/* Pendulum String and Bob */}
      <div className="absolute left-1/2 top-[20%] w-full h-full pointer-events-none">
        <motion.div 
          style={{ 
            rotate: `${(angle * 180) / Math.PI}deg`,
            height: `${pendulumLength}px`,
            width: '2px',
            originX: 'center',
            originY: 'top',
          }}
          className="relative bg-gradient-to-b from-[#434655] via-[#2563eb]/40 to-[#2563eb]"
        >
          {/* Bob */}
          <div 
            style={{ 
              width: `${20 + mass * 20}px`, 
              height: `${20 + mass * 20}px`,
              bottom: `-${(20 + mass * 20) / 2}px`
            }}
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#2563eb] border-2 border-white/20 shadow-[0_0_40px_rgba(37,99,235,0.6)] flex items-center justify-center"
          >
             {/* Inner Glow */}
             <div className="w-[60%] h-[60%] rounded-full bg-white/20 blur-sm" />
          </div>
        </motion.div>
      </div>

      {/* Trajectory Arc (Ghost) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5">
         <circle 
           cx="50%" 
           cy="20%" 
           r={pendulumLength} 
           fill="none" 
           stroke="#2563eb" 
           strokeWidth="1" 
           strokeDasharray="4 4" 
         />
      </svg>

      {/* Telemetry Displacement Line */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
         <div className="flex items-center gap-12 w-[400px] justify-between text-[10px] font-bold text-[#8d90a0] uppercase tracking-widest">
            <span>-90°</span>
            <span className="text-[#2563eb]">0°</span>
            <span>+90°</span>
         </div>
         <div className="w-[400px] h-1.5 bg-[#16202e] rounded-full border border-white/5 relative overflow-hidden">
            <motion.div 
              animate={{ left: `${50 + ((angle * 180) / Math.PI / 180) * 100}%` }}
              className="absolute top-0 w-1 h-full bg-[#2563eb] shadow-[0_0_10px_rgba(37,99,235,1)]"
            />
         </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-[#2563eb]/5 rounded-full blur-[150px] -z-10" />
    </div>
  );
};

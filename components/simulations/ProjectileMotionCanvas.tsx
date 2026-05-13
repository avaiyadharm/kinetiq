"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

interface ProjectileMotionCanvasProps {
  angle: number;
  velocity: number;
  mass: number;
  airResistance: boolean;
  isPlaying: boolean;
  showPath: boolean;
  onUpdateStats?: (stats: { time: number; range: number; maxHeight: number }) => void;
  onSimulationEnd?: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  path: Point[];
}

export const ProjectileMotionCanvas: React.FC<Readonly<ProjectileMotionCanvasProps>> = ({ 
  angle, 
  velocity, 
  mass, 
  airResistance, 
  isPlaying, 
  showPath,
  onUpdateStats,
  onSimulationEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [simTime, setSimTime] = useState(0);
  const [maxH, setMaxH] = useState(0);

  // Simulation Constants
  const gravity = 9.81;
  const k = 0.1; // Drag constant
  const scale = 20; // meters to pixels
  const barrelLengthMeters = 2.5; 
  const startXMeters = 3; 

  const muzzleOffset = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: barrelLengthMeters * Math.cos(rad),
      y: barrelLengthMeters * Math.sin(rad)
    };
  }, [angle]);

  const launch = () => {
    const rad = (angle * Math.PI) / 180;
    setProjectile({
      x: muzzleOffset.x,
      y: muzzleOffset.y,
      vx: velocity * Math.cos(rad),
      vy: velocity * Math.sin(rad),
      path: [{ x: muzzleOffset.x, y: muzzleOffset.y }]
    });
    setSimTime(0);
    setMaxH(muzzleOffset.y);
  };

  useEffect(() => {
    if (isPlaying) {
      launch();
    } else {
      setProjectile({
        x: muzzleOffset.x,
        y: muzzleOffset.y,
        vx: 0,
        vy: 0,
        path: []
      });
      setSimTime(0);
      setMaxH(muzzleOffset.y);
    }
  }, [isPlaying, muzzleOffset]);

  const updatePhysics = (dt: number) => {
    if (!projectile || !isPlaying) return false;

    let ax = 0;
    let ay = -gravity;

    if (airResistance) {
      ax -= (k * projectile.vx) / mass;
      ay -= (k * projectile.vy) / mass;
    }

    const nextVx = projectile.vx + ax * dt;
    const nextVy = projectile.vy + ay * dt;
    const nextX = projectile.x + nextVx * dt;
    const nextY = projectile.y + nextVy * dt;

    const nextPath = [...projectile.path, { x: nextX, y: nextY }];
    
    const currentMaxH = Math.max(maxH, nextY);
    setMaxH(currentMaxH);
    setSimTime(prev => prev + dt);

    if (onUpdateStats) {
      onUpdateStats({
        time: simTime + dt,
        range: nextX,
        maxHeight: currentMaxH
      });
    }

    if (nextY <= 0 && nextVy < 0) {
      setProjectile({
        ...projectile,
        x: nextX,
        y: 0,
        vx: 0,
        vy: 0,
        path: nextPath
      });
      if (onSimulationEnd) onSimulationEnd();
      return false;
    }

    setProjectile({
      x: nextX,
      y: nextY,
      vx: nextVx,
      vy: nextVy,
      path: nextPath
    });
    
    return true;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const groundY = canvas.height * 0.85; 
    const pivotX = startXMeters * scale;
    const pivotY = groundY;

    // 1. Draw Cannon Barrel
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(-(angle * Math.PI) / 180);
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
    ctx.fillStyle = "#3b82f6";
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    const bWidth = barrelLengthMeters * scale;
    const bHeight = 16;
    ctx.beginPath();
    ctx.roundRect(0, -bHeight/2, bWidth, bHeight, [0, 4, 4, 0]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Draw Cannon Base
    ctx.fillStyle = "#18181b";
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Path
    if (showPath && projectile && projectile.path.length > 1) {
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      projectile.path.forEach((p, i) => {
        const px = pivotX + p.x * scale;
        const py = groundY - p.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Projectile
    if (projectile) {
      const px = pivotX + projectile.x * scale;
      const py = groundY - projectile.y * scale;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#10b981";
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  };

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const dt = (time - lastTimeRef.current) / 1000;
      const cappedDt = Math.min(dt, 0.032); 
      const continuing = updatePhysics(cappedDt);
      if (!continuing) {
        lastTimeRef.current = 0;
        return;
      }
    }
    lastTimeRef.current = time;
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying && projectile && projectile.vx !== 0) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = 0;
      draw();
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, projectile]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
          draw();
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full h-full relative bg-transparent overflow-hidden">
      <div className="absolute bottom-0 w-full h-[15%] border-t border-white/5 bg-[#18181b]/60 backdrop-blur-md z-10">
        <div className="absolute top-2 w-full px-12 flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] pointer-events-none">
           {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(m => <span key={m}>{m}m</span>)}
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-20"
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-blue-500/5 rounded-full blur-[150px] -z-10" />
    </div>
  );
};

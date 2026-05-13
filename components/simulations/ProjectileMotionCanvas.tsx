"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

interface ProjectileMotionCanvasProps {
  angle: number;
  velocity: number;
  mass: number;
  airResistance: boolean;
  gravity: number;
  isPlaying: boolean;
  showPath: boolean;
  onUpdateStats?: (stats: { time: number; range: number; maxHeight: number }) => void;
  onSimulationEnd?: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface PhysicsState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  maxH: number;
  path: Point[];
  isFinished: boolean;
}

export const ProjectileMotionCanvas: React.FC<Readonly<ProjectileMotionCanvasProps>> = ({ 
  angle, 
  velocity, 
  mass, 
  airResistance, 
  gravity,
  isPlaying, 
  showPath,
  onUpdateStats,
  onSimulationEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  const [renderState, setRenderState] = useState<PhysicsState | null>(null);

  const physicsRef = useRef<PhysicsState>({
    t: 0, x: 0, y: 0, vx: 0, vy: 0, maxH: 0, path: [], isFinished: false
  });

  // Constants
  const scale = 20; 
  const barrelLengthMeters = 2.5; 
  const startXMeters = 3; 
  const PHYSICS_DT = 0.001; 

  // To match the theoretical formulas exactly, the launch point (Origin) 
  // must be (0,0). The cannon pivot is our Origin.
  const initPhysics = () => {
    const rad = (angle * Math.PI) / 180;
    const vx0 = velocity * Math.cos(rad);
    const vy0 = velocity * Math.sin(rad);
    
    physicsRef.current = {
      t: 0,
      x: 0, // Start at absolute zero to match formulas
      y: 0, // Start at absolute zero to match formulas
      vx: vx0,
      vy: vy0,
      maxH: 0,
      path: [{ x: 0, y: 0 }],
      isFinished: false
    };
    setRenderState({ ...physicsRef.current });
    accumulatorRef.current = 0;
  };

  useEffect(() => {
    if (isPlaying) {
      initPhysics();
    } else {
      physicsRef.current = {
        t: 0, x: 0, y: 0, vx: 0, vy: 0, maxH: 0, path: [], isFinished: false
      };
      setRenderState({ ...physicsRef.current });
    }
  }, [isPlaying, velocity, gravity, angle]);

  const stepPhysics = () => {
    const s = physicsRef.current;
    if (s.isFinished) return false;

    if (!airResistance) {
      const nextT = s.t + PHYSICS_DT;
      const rad = (angle * Math.PI) / 180;
      const vx0 = velocity * Math.cos(rad);
      const vy0 = velocity * Math.sin(rad);

      // x(t) = v_x0 * t
      const nextX = vx0 * nextT;
      // y(t) = v_y0 * t - 0.5 * g * t^2
      let nextY = vy0 * nextT - 0.5 * gravity * Math.pow(nextT, 2);
      
      const currentVy = vy0 - gravity * nextT;

      // Ground is exactly at y=0 relative to the launch point
      if (nextY <= 0 && currentVy < 0) {
        // T_total = 2 * v_y0 / g
        const tHit = (2 * vy0) / gravity;
        const xHit = vx0 * tHit;
        
        physicsRef.current = {
          ...s,
          t: tHit,
          x: xHit,
          y: 0,
          vx: 0,
          vy: 0,
          isFinished: true,
          path: [...s.path, { x: xHit, y: 0 }]
        };
        return false;
      }

      physicsRef.current = {
        ...s,
        t: nextT,
        x: nextX,
        y: nextY,
        vx: vx0,
        vy: currentVy,
        maxH: Math.max(s.maxH, nextY),
        path: [...s.path, { x: nextX, y: nextY }]
      };
    } else {
      const k = 0.1; 
      const ax = -(k * s.vx) / mass;
      const ay = -gravity - (k * s.vy) / mass;

      const nextVx = s.vx + ax * PHYSICS_DT;
      const nextVy = s.vy + ay * PHYSICS_DT;
      const nextX = s.x + nextVx * PHYSICS_DT;
      const nextY = s.y + nextVy * PHYSICS_DT;
      const nextT = s.t + PHYSICS_DT;

      if (nextY <= 0 && nextVy < 0) {
        const dy = nextY - s.y;
        const alpha = Math.abs(dy) > 0.000001 ? -s.y / dy : 0;
        const hitX = s.x + (nextX - s.x) * alpha;
        
        physicsRef.current = {
          ...s,
          t: nextT + (PHYSICS_DT * alpha),
          x: hitX,
          y: 0,
          vx: 0,
          vy: 0,
          isFinished: true,
          path: [...s.path, { x: hitX, y: 0 }]
        };
        return false;
      }

      physicsRef.current = {
        ...s,
        t: nextT,
        x: nextX,
        y: nextY,
        vx: nextVx,
        vy: nextVy,
        maxH: Math.max(s.maxH, nextY),
        path: [...s.path, { x: nextX, y: nextY }]
      };
    }
    
    return true;
  };

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const frameDt = (time - lastTimeRef.current) / 1000;
      accumulatorRef.current += Math.min(frameDt, 0.1);

      let isStillFlying = true;
      while (accumulatorRef.current >= PHYSICS_DT) {
        isStillFlying = stepPhysics();
        accumulatorRef.current -= PHYSICS_DT;
        if (!isStillFlying) break;
      }

      const current = physicsRef.current;
      setRenderState({ ...current });
      
      if (onUpdateStats) {
        onUpdateStats({
          time: current.t,
          range: current.x, // Origin is 0, so range is just X
          maxHeight: current.maxH
        });
      }

      if (!isStillFlying) {
        if (onSimulationEnd) onSimulationEnd();
        lastTimeRef.current = 0;
        return;
      }
    }
    
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying && !physicsRef.current.isFinished) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = 0;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !renderState) return;
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
    if (showPath && renderState.path.length > 1) {
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 2;
      renderState.path.forEach((p, i) => {
        const px = pivotX + p.x * scale;
        const py = pivotY - p.y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Projectile
    const px = pivotX + renderState.x * scale;
    const py = pivotY - renderState.y * scale;
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
  };

  useEffect(() => {
    draw();
  }, [renderState, angle]);

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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-blue-500/5 rounded-full blur-[150px] -z-10" />
    </div>
  );
};

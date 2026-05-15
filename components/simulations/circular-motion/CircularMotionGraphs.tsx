"use client";

import React, { useEffect, useRef } from "react";

interface GraphData {
  time: number;
  value: number;
}

interface MiniGraphProps {
  label: string;
  data: GraphData[];
  color: string;
  min: number;
  max: number;
  unit: string;
}

const MiniGraph: React.FC<MiniGraphProps> = ({ label, data, color, min, max, unit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length < 2) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 10;

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw path
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = color;
    ctx.beginPath();

    const range = max - min || 1;
    
    data.forEach((p, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((p.value - min) / range) * (height - 2 * padding);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label and Current Value
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 9px Inter";
    ctx.fillText(label.toUpperCase(), 5, 12);
    
    const lastValue = data[data.length - 1].value;
    ctx.fillStyle = color;
    ctx.textAlign = "right";
    ctx.fillText(`${lastValue.toFixed(2)}${unit}`, width - 5, 12);

  }, [data, color, min, max, label, unit]);

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-1 h-[80px] w-full">
      <canvas ref={canvasRef} width={200} height={70} className="w-full h-full" />
    </div>
  );
};

interface CircularMotionGraphsProps {
  omegaData: GraphData[];
  thetaData: GraphData[];
  acData: GraphData[];
  atData: GraphData[];
  vData: GraphData[];
  aTotalData: GraphData[];
}

export const CircularMotionGraphs: React.FC<CircularMotionGraphsProps> = ({
  omegaData,
  thetaData,
  acData,
  atData,
  vData,
  aTotalData,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Real-time Telemetry Graphs</div>
      
      <div className="grid grid-cols-2 gap-2">
        <MiniGraph 
          label="Ang Position (θ)" 
          data={thetaData} 
          color="#6366f1" 
          min={-Math.PI * 2} 
          max={Math.PI * 2} 
          unit=" rad" 
        />
        <MiniGraph 
          label="Ang Velocity (ω)" 
          data={omegaData} 
          color="#06b6d4" 
          min={-15} 
          max={15} 
          unit=" rad/s" 
        />
        <MiniGraph 
          label="Linear Velocity (v)" 
          data={vData} 
          color="#06b6d4" 
          min={0} 
          max={20} 
          unit=" m/s" 
        />
        <MiniGraph 
          label="Centripetal (a꜀)" 
          data={acData} 
          color="#ec4899" 
          min={0} 
          max={100} 
          unit=" m/s²" 
        />
        <MiniGraph 
          label="Tangential (aₜ)" 
          data={atData} 
          color="#f59e0b" 
          min={-10} 
          max={10} 
          unit=" m/s²" 
        />
        <MiniGraph 
          label="Total Acc (a)" 
          data={aTotalData} 
          color="#10b981" 
          min={0} 
          max={110} 
          unit=" m/s²" 
        />
      </div>
    </div>
  );
};

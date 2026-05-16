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

    // Grid midline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Glow path
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
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

    const lastValue = data[data.length - 1].value;

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, width, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 10px Inter";
    ctx.textAlign = "left";
    ctx.fillText(label.split(" (")[1]?.replace(")", "") || label, 8, 14);
    ctx.fillStyle = color;
    ctx.font = "bold 10px Inter";
    ctx.textAlign = "right";
    const name = label.split(" (")[0];
    ctx.fillText(`${name} = ${lastValue.toFixed(2)}${unit}`, width - 8, 14);
  }, [data, color, min, max, label, unit]);

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-1 h-[80px] w-full">
      <canvas ref={canvasRef} width={200} height={70} className="w-full h-full" />
    </div>
  );
};

interface SHMGraphsProps {
  xData: GraphData[];
  vData: GraphData[];
  aData: GraphData[];
  FData: GraphData[];
  KEData: GraphData[];
  PEData: GraphData[];
  amplitude: number;
  angularFreq: number;
  mass: number;
}

export const SHMGraphs: React.FC<SHMGraphsProps> = ({
  xData, vData, aData, FData, KEData, PEData, amplitude, angularFreq, mass,
}) => {
  const maxV = amplitude * angularFreq;
  const maxA = amplitude * angularFreq * angularFreq;
  const maxF = mass * maxA;
  const maxE = 0.5 * mass * maxV * maxV;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
      <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Real-time Telemetry Graphs</div>
      <div className="grid grid-cols-2 gap-2">
        <MiniGraph label="Displacement (x)" data={xData} color="#8b5cf6" min={-amplitude} max={amplitude} unit=" m" />
        <MiniGraph label="Velocity (v)" data={vData} color="#06b6d4" min={-maxV} max={maxV} unit=" m/s" />
        <MiniGraph label="Acceleration (a)" data={aData} color="#f59e0b" min={-maxA} max={maxA} unit=" m/s²" />
        <MiniGraph label="Net Force (F)" data={FData} color="#ec4899" min={-maxF} max={maxF} unit=" N" />
        <MiniGraph label="Kinetic Energy (KE)" data={KEData} color="#10b981" min={0} max={maxE * 1.1} unit=" J" />
        <MiniGraph label="Potential Energy (PE)" data={PEData} color="#f97316" min={0} max={maxE * 1.1} unit=" J" />
      </div>
    </div>
  );
};

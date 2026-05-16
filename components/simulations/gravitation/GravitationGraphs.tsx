"use client";
import React from "react";

interface GravitationGraphsProps {
  FgData: { time: number; value: number }[];
  vData: { time: number; value: number }[];
  KEData: { time: number; value: number }[];
  PEData: { time: number; value: number }[];
  rData: { time: number; value: number }[];
  thetaData: { time: number; value: number }[];
}

const MiniGraph = ({
  data,
  label,
  color,
  unit,
}: {
  data: { time: number; value: number }[];
  label: string;
  color: string;
  unit: string;
}) => {
  const W = 280, H = 80;
  if (data.length < 2) {
    return (
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
            {label}
          </span>
          <span className="text-[9px] text-white/20 font-mono">{unit}</span>
        </div>
        <div className="h-[80px] flex items-center justify-center text-[10px] text-white/10">
          Awaiting data...
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const latest = values[values.length - 1];

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((d.value - min) / range) * (H - 10) - 5;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        <span className="text-xs font-mono font-bold text-white">
          {latest.toExponential(2)}{" "}
          <span className="text-[9px] text-white/20">{unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px]" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line
            key={f}
            x1={0} y1={f * H} x2={W} y2={f * H}
            stroke="rgba(255,255,255,0.03)" strokeWidth={1}
          />
        ))}
        {/* Fill */}
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${points} ${W},${H}`}
          fill={`url(#grad-${label})`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const GravitationGraphs: React.FC<GravitationGraphsProps> = ({
  FgData, vData, KEData, PEData, rData, thetaData,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
          Real-Time Telemetry Graphs
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <MiniGraph data={FgData} label="Gravitational Force (Fg)" color="#ec4899" unit="N" />
        <MiniGraph data={vData} label="Orbital Velocity (v)" color="#06b6d4" unit="m/s" />
        <MiniGraph data={KEData} label="Kinetic Energy (KE)" color="#10b981" unit="J" />
        <MiniGraph data={PEData} label="Potential Energy (PE)" color="#f97316" unit="J" />
        <MiniGraph data={rData} label="Orbital Radius (r)" color="#8b5cf6" unit="m" />
        <MiniGraph data={thetaData} label="Angular Position (θ)" color="#a78bfa" unit="rad" />
      </div>
    </div>
  );
};

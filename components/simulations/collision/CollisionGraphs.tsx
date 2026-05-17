"use client";
import React from "react";

interface CollisionGraphsProps {
  v1Data: { time: number; value: number }[];
  v2Data: { time: number; value: number }[];
  pTotalData: { time: number; value: number }[];
  keTotalData: { time: number; value: number }[];
  ke1Data: { time: number; value: number }[];
  ke2Data: { time: number; value: number }[];
}

const MiniGraph = ({ data, label, color, unit }: {
  data: { time: number; value: number }[]; label: string; color: string; unit: string;
}) => {
  const W = 280, H = 80;
  if (data.length < 2) {
    return (
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
          <span className="text-[9px] text-white/20 font-mono">{unit}</span>
        </div>
        <div className="h-[80px] flex items-center justify-center text-[10px] text-white/10">Awaiting data...</div>
      </div>
    );
  }
  const values = data.map(d => d.value);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const latest = values[values.length - 1];
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  }).join(" ");
  const gid = `grad-${label.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
        <span className="text-xs font-mono font-bold text-white">{latest.toFixed(2)} <span className="text-[9px] text-white/20">{unit}</span></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px]" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(f => (<line key={f} x1={0} y1={f * H} x2={W} y2={f * H} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />))}
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#${gid})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const CollisionGraphs: React.FC<CollisionGraphsProps> = ({ v1Data, v2Data, pTotalData, keTotalData, ke1Data, ke2Data }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between px-1 mb-2">
      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Real-Time Telemetry Graphs</span>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <MiniGraph data={v1Data} label="Velocity m₁" color="#8b5cf6" unit="m/s" />
      <MiniGraph data={v2Data} label="Velocity m₂" color="#06b6d4" unit="m/s" />
      <MiniGraph data={pTotalData} label="Total Momentum" color="#ec4899" unit="kg·m/s" />
      <MiniGraph data={keTotalData} label="Total KE" color="#10b981" unit="J" />
      <MiniGraph data={ke1Data} label="KE₁" color="#a78bfa" unit="J" />
      <MiniGraph data={ke2Data} label="KE₂" color="#22d3ee" unit="J" />
    </div>
  </div>
);

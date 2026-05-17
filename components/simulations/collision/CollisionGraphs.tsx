"use client";
import React, { useState } from "react";
import { Activity, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CollisionGraphsProps {
  v1Data: { time: number; value: number }[];
  v2Data: { time: number; value: number }[];
  pTotalData: { time: number; value: number }[];
  keTotalData: { time: number; value: number }[];
  ke1Data: { time: number; value: number }[];
  ke2Data: { time: number; value: number }[];
  collisionTime?: number | null;
}

const COLORS = {
  v1: "#8b5cf6",
  v2: "#06b6d4",
  pTotal: "#ec4899",
  keTotal: "#10b981",
  ke1: "#a78bfa",
  ke2: "#22d3ee"
};

const MiniGraph = ({ 
  data, label, color, unit, hoverIndex, setHoverIndex, collisionTime 
}: {
  data: { time: number; value: number }[]; 
  label: string; 
  color: string; 
  unit: string;
  hoverIndex: number | null;
  setHoverIndex: (idx: number | null) => void;
  collisionTime?: number | null;
}) => {
  const W = 320;
  const H = 90;
  
  if (data.length < 2) {
    return (
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between z-10 relative">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
          <span className="text-[9px] text-white/20 font-mono font-bold">{unit}</span>
        </div>
        <div className="h-[90px] flex flex-col items-center justify-center text-[10px] text-white/20 gap-1.5 font-mono z-10 relative">
          <Activity className="w-4 h-4 text-white/10 animate-pulse" />
          <span>AWAITING TELEMETRY DATA...</span>
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  
  // Pad bounds slightly to avoid visual clipping
  if (min === max) {
    min -= 1.0;
    max += 1.0;
  } else {
    const pad = (max - min) * 0.15;
    min -= pad;
    max += pad;
  }
  
  const range = max - min || 1;
  const latest = values[values.length - 1];

  // Map values to fits inside Canvas bounds with 12px margin top and bottom
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 12 - ((d.value - min) / range) * (H - 24);
    return `${x},${y}`;
  }).join(" ");

  const gid = `grad-${label.replace(/[^a-z0-9]/gi, '')}`;

  // Find hover coordinates
  let hoverData = null;
  let hoverX = 0;
  let hoverY = 0;
  if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length) {
    hoverData = data[hoverIndex];
    hoverX = (hoverIndex / (data.length - 1)) * W;
    hoverY = H - 12 - ((hoverData.value - min) / range) * (H - 24);
  }

  // Find impact coordinate
  let xImpact: number | null = null;
  if (collisionTime !== undefined && collisionTime !== null) {
    const colIndex = data.findIndex(d => d.time >= collisionTime);
    if (colIndex !== -1) {
      xImpact = (colIndex / (data.length - 1)) * W;
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const idx = Math.round(pct * (data.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/10 hover:bg-white/[0.03] transition-all relative overflow-hidden group">
      {/* Dynamic card gradient overlay */}
      <div 
        className="absolute inset-0 opacity-[0.01] group-hover:opacity-[0.03] pointer-events-none transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)` }}
      />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-sm font-black text-white">{latest.toFixed(2)}</span>
          <span className="text-[9px] text-white/30 font-bold uppercase">{unit}</span>
        </div>
      </div>

      <div className="relative w-full h-[90px] mt-1 select-none">
        {/* SVG Chart Rendering */}
        <svg 
          viewBox={`0 0 ${W} ${H}`} 
          className="w-full h-full cursor-crosshair overflow-visible" 
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle grid lanes */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={0} y1={f * H} x2={W} y2={f * H} stroke="rgba(255,255,255,0.035)" strokeWidth={1} strokeDasharray="3 3" />
          ))}

          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#${gid})`} />

          {/* Main line curve */}
          <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Theoretical constant baseline for conservation check (Momentum only) */}
          {label.includes("Momentum") && (
            <line x1={0} y1={H - 12 - ((latest - min) / range) * (H - 24)} x2={W} y2={H - 12 - ((latest - min) / range) * (H - 24)} stroke="rgba(236, 72, 153, 0.2)" strokeWidth={1} strokeDasharray="4 4" />
          )}

          {/* Vertical Collision Impact Marker line */}
          {xImpact !== null && (
            <g>
              <line x1={xImpact} y1={0} x2={xImpact} y2={H} stroke="#ef4444" strokeWidth={1.2} strokeDasharray="3 3" />
              <circle cx={xImpact} cy={H/2} r="3" fill="#ef4444" />
            </g>
          )}

          {/* Synchronized Hover cursor line and active dot */}
          {hoverData && (
            <g>
              {/* Vertical line */}
              <line x1={hoverX} y1={0} x2={hoverX} y2={H} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
              
              {/* Glowing anchor point */}
              <circle cx={hoverX} cy={hoverY} r="5" fill="#ffffff" stroke={color} strokeWidth={2} className="shadow-lg" />
              <circle cx={hoverX} cy={hoverY} r="2.5" fill={color} />
            </g>
          )}
        </svg>

        {/* Dynamic event tag for collision moment */}
        {xImpact !== null && (
          <div 
            className="absolute top-0 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-[7px] text-red-400 font-bold uppercase tracking-wider rounded pointer-events-none transform -translate-x-1/2 mt-1"
            style={{ left: `${(xImpact / W) * 100}%` }}
          >
            Impact
          </div>
        )}

        {/* Hover data HUD readout inside graph card */}
        {hoverData && (
          <div className="absolute top-0 left-0 right-0 flex justify-between bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5 text-[9px] text-white/50 font-mono pointer-events-none animate-in fade-in duration-100 z-20">
            <span>TIME: <strong className="text-white">{hoverData.time.toFixed(2)}s</strong></span>
            <span>VALUE: <strong style={{ color }}>{hoverData.value.toFixed(2)} {unit}</strong></span>
          </div>
        )}
      </div>

      {/* Visual boundaries Y-axis indicators */}
      <div className="flex justify-between text-[8px] font-mono text-white/10 uppercase tracking-widest pt-1 border-t border-white/5">
        <span>MAX: {max.toFixed(1)}</span>
        <span>MIN: {min.toFixed(1)}</span>
      </div>
    </div>
  );
};

export const CollisionGraphs: React.FC<CollisionGraphsProps> = ({ 
  v1Data, v2Data, pTotalData, keTotalData, ke1Data, ke2Data, collisionTime 
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Telemetry Analysis</span>
          <span className="text-xs font-bold text-white/60">Multi-Channel Telemetry Grid</span>
        </div>
        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-400 bg-emerald-500/5 h-5 flex gap-1 items-center px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Synchronized
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
        <MiniGraph data={v1Data} label="Velocity m₁" color={COLORS.v1} unit="m/s" hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
        <MiniGraph data={v2Data} label="Velocity m₂" color={COLORS.v2} unit="m/s" hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
        
        <MiniGraph data={pTotalData} label="Total Momentum (Σp)" color={COLORS.pTotal} unit="kg·m/s" hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
        <MiniGraph data={keTotalData} label="Total Kinetic Energy" color={COLORS.keTotal} unit="J" hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
        
        <MiniGraph data={ke1Data} label="Kinetic Energy KE₁" color={COLORS.ke1} unit="J" hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
        <MiniGraph data={ke2Data} label="Kinetic Energy KE₂" color={COLORS.ke2} unit="J" hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
      </div>

      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-2.5">
        <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-[10px] text-white/40 leading-relaxed">
          Hover over any channel card to scrub through time-series frames and inspect exact instantaneous kinematics. Notice that while velocity curves break sharply at the <strong>Impact event</strong>, the <strong>Total Momentum</strong> remains perfectly linear, illustrating conservation.
        </p>
      </div>
    </div>
  );
};

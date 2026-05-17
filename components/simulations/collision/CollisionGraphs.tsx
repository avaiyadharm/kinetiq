"use client";

import React, { useState } from "react";
import { Activity, Info, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollisionGraphsProps {
  v1Data: { time: number; value: number }[];
  v2Data: { time: number; value: number }[];
  pTotalData: { time: number; value: number }[];
  keTotalData: { time: number; value: number }[];
  ke1Data: { time: number; value: number }[];
  ke2Data: { time: number; value: number }[];
  impulseData?: { time: number; value: number }[];
  relVelData?: { time: number; value: number }[];
  collisionTime?: number | null;
  conservationError?: number; // % deviation from initial momentum
}

const COLORS = {
  v1: "#8b5cf6",
  v2: "#06b6d4",
  pTotal: "#ec4899",
  keTotal: "#10b981",
  ke1: "#a78bfa",
  ke2: "#22d3ee",
  impulse: "#ef4444",
  relVel: "#f59e0b",
};

// ─── Single channel graph card ───────────────────────────────────────────────
const MiniGraph = ({
  data, label, color, unit, hoverIndex, setHoverIndex, collisionTime, showZeroLine = false,
}: {
  data: { time: number; value: number }[];
  label: string;
  color: string;
  unit: string;
  hoverIndex: number | null;
  setHoverIndex: (idx: number | null) => void;
  collisionTime?: number | null;
  showZeroLine?: boolean;
}) => {
  const W = 320;
  const H = 96;
  const PAD_V = 14;

  if (data.length < 2) {
    return (
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
          <span className="text-[9px] text-white/20 font-mono font-bold">{unit}</span>
        </div>
        <div className="h-24 flex flex-col items-center justify-center text-[10px] text-white/20 gap-1.5 font-mono">
          <Activity className="w-4 h-4 text-white/10 animate-pulse" />
          <span>AWAITING SIGNAL…</span>
        </div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  else { const pad = (max - min) * 0.18; min -= pad; max += pad; }
  const range = max - min;

  const toY = (v: number) => H - PAD_V - ((v - min) / range) * (H - PAD_V * 2);
  const latest = values[values.length - 1];
  const points = data.map((d, i) => `${(i / (data.length - 1)) * W},${toY(d.value)}`).join(" ");
  const gid = `g-${label.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;

  // Hover
  let hd: { time: number; value: number } | null = null;
  let hx = 0, hy = 0;
  if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length) {
    hd = data[hoverIndex];
    hx = (hoverIndex / (data.length - 1)) * W;
    hy = toY(hd.value);
  }

  // Impact marker
  let xImpact: number | null = null;
  if (collisionTime != null) {
    const ci = data.findIndex((d) => d.time >= collisionTime);
    if (ci !== -1) xImpact = (ci / (data.length - 1)) * W;
  }

  // Zero line
  const yZero = min <= 0 && max >= 0 ? toY(0) : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(pct * (data.length - 1)));
  };

  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.025] transition-all relative overflow-hidden group">
      {/* ambient glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] pointer-events-none transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at 50% 60%, ${color}, transparent 70%)` }}
      />

      {/* header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-sm font-black" style={{ color }}>{latest.toFixed(2)}</span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>

      {/* chart */}
      <div className="relative w-full select-none" style={{ height: H }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none z-10">
          <span className="text-[7px] font-mono text-white/15">{max.toFixed(1)}</span>
          <span className="text-[7px] font-mono text-white/15">{min.toFixed(1)}</span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid lanes */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} y1={f * H} x2={W} y2={f * H} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
          ))}

          {/* zero reference line */}
          {showZeroLine && yZero !== null && (
            <line x1={0} y1={yZero} x2={W} y2={yZero} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4" />
          )}

          {/* area fill */}
          <polygon points={`0,${H} ${points} ${W},${H}`} fill={`url(#${gid})`} />

          {/* main curve */}
          <polyline points={points} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />

          {/* impact marker */}
          {xImpact !== null && (
            <g>
              <line x1={xImpact} y1={0} x2={xImpact} y2={H} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" strokeOpacity="0.7" />
              <circle cx={xImpact} cy={H * 0.5} r="2.5" fill="#ef4444" fillOpacity="0.8" />
            </g>
          )}

          {/* hover cursor */}
          {hd && (
            <g>
              <line x1={hx} y1={0} x2={hx} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={hx} cy={hy} r="4.5" fill="white" stroke={color} strokeWidth={2} />
              <circle cx={hx} cy={hy} r="2" fill={color} />
            </g>
          )}
        </svg>

        {/* Impact tag */}
        {xImpact !== null && (
          <div
            className="absolute top-0 px-1 py-px bg-red-500/10 border border-red-500/25 text-[7px] text-red-400 font-bold uppercase rounded pointer-events-none -translate-x-1/2"
            style={{ left: `${(xImpact / W) * 100}%` }}
          >
            Impact
          </div>
        )}

        {/* Hover HUD */}
        {hd && (
          <div className="absolute inset-x-0 top-0 flex justify-between bg-black/70 backdrop-blur-md px-2.5 py-1 text-[9px] font-mono text-white/50 pointer-events-none z-20 rounded">
            <span>t = <strong className="text-white">{hd.time.toFixed(3)}s</strong></span>
            <strong style={{ color }}>{hd.value.toFixed(3)} {unit}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Conservation Score Meter ──────────────────────────────────────────────
const ConservationMeter = ({ error }: { error: number }) => {
  const pct = Math.max(0, Math.min(100, 100 - error * 100));
  const color = pct > 99.5 ? "#10b981" : pct > 98 ? "#f59e0b" : "#ef4444";
  const label = pct > 99.5 ? "CONSERVED" : pct > 98 ? "NEAR-CONSERVED" : "VIOLATION";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Momentum Conservation</span>
          <span className="text-[9px] font-bold font-mono" style={{ color }}>{label}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="text-[8px] font-mono text-white/20 text-right">{pct.toFixed(2)}% intact</div>
      </div>
    </div>
  );
};

// ─── Main export ─────────────────────────────────────────────────────────────
export const CollisionGraphs: React.FC<CollisionGraphsProps> = ({
  v1Data, v2Data, pTotalData, keTotalData, ke1Data, ke2Data,
  impulseData, relVelData, collisionTime, conservationError = 0,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em]">Live Telemetry</p>
          <p className="text-xs font-bold text-white/60">Multi-Channel Kinematic Analysis</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Sync</span>
        </div>
      </div>

      {/* Conservation meter */}
      <ConservationMeter error={conservationError} />

      {/* Velocity channels */}
      <div className="grid grid-cols-2 gap-2.5">
        <MiniGraph data={v1Data} label="v₁ velocity" color={COLORS.v1} unit="m/s"
          hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} showZeroLine />
        <MiniGraph data={v2Data} label="v₂ velocity" color={COLORS.v2} unit="m/s"
          hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} showZeroLine />
      </div>

      {/* Momentum + KE total */}
      <div className="grid grid-cols-2 gap-2.5">
        <MiniGraph data={pTotalData} label="Σp momentum" color={COLORS.pTotal} unit="kg·m/s"
          hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} showZeroLine />
        <MiniGraph data={keTotalData} label="ΣKE energy" color={COLORS.keTotal} unit="J"
          hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
      </div>

      {/* Individual KE */}
      <div className="grid grid-cols-2 gap-2.5">
        <MiniGraph data={ke1Data} label="KE₁ energy" color={COLORS.ke1} unit="J"
          hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
        <MiniGraph data={ke2Data} label="KE₂ energy" color={COLORS.ke2} unit="J"
          hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
      </div>

      {/* Impulse + Relative velocity */}
      {(impulseData && impulseData.length >= 2) || (relVelData && relVelData.length >= 2) ? (
        <div className="grid grid-cols-2 gap-2.5">
          {impulseData && (
            <MiniGraph data={impulseData} label="Impulse J = Δp" color={COLORS.impulse} unit="N·s"
              hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} showZeroLine />
          )}
          {relVelData && (
            <MiniGraph data={relVelData} label="|v₁ − v₂| rel-vel" color={COLORS.relVel} unit="m/s"
              hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} collisionTime={collisionTime} />
          )}
        </div>
      ) : null}

      {/* Guidance note */}
      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-2">
        <Info className="w-3 h-3 text-primary mt-0.5 shrink-0" />
        <p className="text-[9px] text-white/35 leading-relaxed">
          Hover any chart to scrub all channels in sync. The <strong className="text-white/50">Σp</strong> line stays flat — conservation of momentum. The <strong className="text-white/50">ΣKE</strong> line drops at impact in inelastic collisions. <strong className="text-white/50">Red dash</strong> = impact event.
        </p>
      </div>
    </div>
  );
};

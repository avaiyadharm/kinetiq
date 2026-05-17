"use client";

import React, { useState } from "react";
import { Activity, Info, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SamplePoint {
  time: number;
  v1: number;
  v2: number;
  vCom: number;
  p1: number;
  p2: number;
  pTotal: number;
  ke1: number;
  ke2: number;
  keTotal: number;
  force1: number;
  force2: number;
  impulse1: number;
  impulse2: number;
  netImpulse: number;
  xCom: number;
}

interface CollisionGraphsProps {
  samples: SamplePoint[];
  collisionTime: number | null;
  conservationError: number;
  time: number;
  scientificMode?: boolean;
}

interface Series {
  key: keyof SamplePoint;
  label: string;
  color: string;
}

// Helper to draw smooth curves (Cubic Bezier)
const getBezierPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    path += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return path;
};

// Helper to draw straight line segments (Scientific accuracy mode)
const getStraightPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return "";
  return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
};

const MiniGraph = ({
  samples,
  series,
  label,
  unit,
  hoverIndex,
  setHoverIndex,
  collisionTime,
  time,
  showZeroLine = false,
  scientificMode = false,
}: {
  samples: SamplePoint[];
  series: Series[];
  label: string;
  unit: string;
  hoverIndex: number | null;
  setHoverIndex: (idx: number | null) => void;
  collisionTime?: number | null;
  time: number;
  showZeroLine?: boolean;
  scientificMode?: boolean;
}) => {
  const W = 320;
  const H = 104;
  const PAD_V = 14;

  if (samples.length < 2) {
    return (
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
            {label}
          </span>
          <span className="text-[9px] text-white/20 font-mono font-bold">{unit}</span>
        </div>
        <div className="h-24 flex flex-col items-center justify-center text-[10px] text-white/20 gap-1.5 font-mono">
          <Activity className="w-4 h-4 text-white/10 animate-pulse" />
          <span>AWAITING EXPERIMENTAL SIGNAL…</span>
        </div>
      </div>
    );
  }

  // Calculate dynamic range encompassing all series keys
  let min = Infinity;
  let max = -Infinity;
  samples.forEach((s) => {
    series.forEach((ser) => {
      const v = s[ser.key];
      if (v < min) min = v;
      if (v > max) max = v;
    });
  });

  if (min === Infinity) {
    min = -1;
    max = 1;
  }
  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const pad = (max - min) * 0.15;
    min -= pad;
    max += pad;
  }
  const range = max - min;

  const toY = (v: number) => H - PAD_V - ((v - min) / range) * (H - PAD_V * 2);

  // Hover data
  let hd: SamplePoint | null = null;
  let hx = 0;
  if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < samples.length) {
    hd = samples[hoverIndex];
    hx = (hoverIndex / (samples.length - 1)) * W;
  }

  // Live time progression cursor
  let xTime: number | null = null;
  if (time != null && samples.length > 0) {
    const tStart = samples[0].time;
    const tEnd = samples[samples.length - 1].time;
    const totalDuration = tEnd - tStart;
    if (totalDuration > 0) {
      const pct = (time - tStart) / totalDuration;
      xTime = Math.max(0, Math.min(1, pct)) * W;
    }
  }

  // Impact marker
  let xImpact: number | null = null;
  if (collisionTime != null) {
    const ci = samples.findIndex((d) => d.time >= collisionTime);
    if (ci !== -1) xImpact = (ci / (samples.length - 1)) * W;
  }

  // Zero line
  const yZero = min <= 0 && max >= 0 ? toY(0) : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(pct * (samples.length - 1)));
  };

  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.025] transition-all relative overflow-hidden group">
      {/* ambient glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${series[0].color}, transparent 70%)`,
        }}
      />

      {/* header */}
      <div className="flex flex-col gap-1 mb-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">
            {label}
          </span>
          <span className="text-[8px] text-white/35 font-mono uppercase">{unit}</span>
        </div>
        {/* series legends with current values */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[8px] font-mono text-white/30 uppercase select-none">
          {series.map((ser) => {
            const curVal = samples[samples.length - 1][ser.key];
            return (
              <span key={ser.key} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ser.color }} />
                <span className="text-white/45">{ser.label}:</span>
                <span className="text-white/85 font-black">{curVal.toFixed(2)}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* chart */}
      <div className="relative w-full select-none" style={{ height: H }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-4 flex flex-col justify-between pointer-events-none z-10">
          <span className="text-[7px] font-mono text-white/25 bg-black/60 px-0.5 rounded">
            {max.toFixed(2)}
          </span>
          <span className="text-[7px] font-mono text-white/25 bg-black/60 px-0.5 rounded">
            {min.toFixed(2)}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full cursor-crosshair animate-fade-in"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* grid lanes */}
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <line
              key={f}
              x1={0}
              y1={f * (H - PAD_V)}
              x2={W}
              y2={f * (H - PAD_V)}
              stroke="rgba(255,255,255,0.02)"
              strokeWidth={1}
            />
          ))}

          {/* labeled axes */}
          <line
            x1={0}
            y1={H - PAD_V}
            x2={W}
            y2={H - PAD_V}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
          <line x1={0} y1={0} x2={0} y2={H - PAD_V} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

          {/* zero reference line */}
          {showZeroLine && yZero !== null && (
            <line
              x1={0}
              y1={yZero}
              x2={W}
              y2={yZero}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* Render lines for each series */}
          {series.map((ser) => {
            const pts = samples.map((s, i) => ({
              x: (i / (samples.length - 1)) * W,
              y: toY(s[ser.key]),
            }));
            const path = scientificMode ? getStraightPath(pts) : getBezierPath(pts);

            return (
              <path
                key={ser.key}
                d={path}
                fill="none"
                stroke={ser.color}
                strokeWidth={scientificMode ? 1.3 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            );
          })}

          {/* impact marker */}
          {xImpact !== null && (
            <g>
              <line
                x1={xImpact}
                y1={0}
                x2={xImpact}
                y2={H - PAD_V}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                strokeOpacity="0.75"
              />
              <circle
                cx={xImpact}
                cy={H * 0.4}
                r="3"
                fill="#ef4444"
                fillOpacity="0.9"
                className="animate-ping"
              />
              <circle cx={xImpact} cy={H * 0.4} r="2.5" fill="#ef4444" fillOpacity="1" />
            </g>
          )}

          {/* live clock time marker */}
          {xTime !== null && (
            <line
              x1={xTime}
              y1={0}
              x2={xTime}
              y2={H - PAD_V}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.2}
              strokeDasharray="2 2"
            />
          )}

          {/* hover cursor vertical scrub bar */}
          {hd && (
            <g>
              <line
                x1={hx}
                y1={0}
                x2={hx}
                y2={H - PAD_V}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
              />
              {series.map((ser) => {
                const yVal = toY(hd![ser.key]);
                return (
                  <g key={ser.key}>
                    <circle cx={hx} cy={yVal} r="4" fill="white" stroke={ser.color} strokeWidth={1.5} />
                    <circle cx={hx} cy={yVal} r="1.5" fill={ser.color} />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* X axis end label */}
        <div className="absolute right-0 bottom-0 text-[7px] font-mono text-white/30 uppercase select-none">
          Time (s)
        </div>

        {/* Impact tag */}
        {xImpact !== null && (
          <div
            className="absolute top-0 px-1.5 py-px bg-red-500/10 border border-red-500/35 text-[7px] text-red-400 font-bold uppercase rounded pointer-events-none -translate-x-1/2"
            style={{ left: `${(xImpact / W) * 100}%` }}
          >
            COLLISION
          </div>
        )}

        {/* Hover HUD */}
        {hd && (
          <div className="absolute inset-x-0 top-0 flex flex-wrap justify-between items-center bg-black/90 border border-white/10 backdrop-blur-md px-2.5 py-1 text-[8px] font-mono text-white/50 pointer-events-none z-20 rounded shadow-lg gap-x-2">
            <span>
              t = <strong className="text-white">{hd.time.toFixed(3)}s</strong>
            </span>
            <div className="flex gap-2">
              {series.map((ser) => (
                <span key={ser.key} style={{ color: ser.color }}>
                  {ser.label}: <strong>{hd![ser.key].toFixed(2)}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Conservation Score Meter ──────────────────────────────────────────────
const ConservationMeter = ({ error }: { error: number }) => {
  const pct = Math.max(0, Math.min(100, 100 - error * 100));
  const isPerfect = error < 1e-4;
  const color = isPerfect ? "#10b981" : pct > 98 ? "#f59e0b" : "#ef4444";
  const label = isPerfect ? "CONSERVED (EXACT)" : pct > 98 ? "NEAR-CONSERVED" : "MOMENTUM VIOLATION";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
      <TrendingUp className="w-3.5 h-3.5 shrink-0 animate-pulse" style={{ color }} />
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
            System Momentum Conservation
          </span>
          <span className="text-[9px] font-bold font-mono" style={{ color }}>
            {label}
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="text-[8px] font-mono text-white/20 text-right">
          {pct.toFixed(5)}% conserved (tol = 10⁻⁵)
        </div>
      </div>
    </div>
  );
};

// ─── Main export ─────────────────────────────────────────────────────────────
export const CollisionGraphs: React.FC<CollisionGraphsProps> = ({
  samples,
  collisionTime,
  conservationError = 0,
  time,
  scientificMode = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Velocity vs Time series
  const velocitySeries: Series[] = [
    { key: "v1", label: "v₁", color: "#8b5cf6" },
    { key: "v2", label: "v₂", color: "#06b6d4" },
    { key: "vCom", label: "v_com", color: "#eab308" },
  ];

  // Momentum vs Time series
  const momentumSeries: Series[] = [
    { key: "p1", label: "p₁", color: "#8b5cf6" },
    { key: "p2", label: "p₂", color: "#06b6d4" },
    { key: "pTotal", label: "Σp (Total)", color: "#ec4899" },
  ];

  // Kinetic Energy vs Time series
  const keSeries: Series[] = [
    { key: "ke1", label: "KE₁", color: "#8b5cf6" },
    { key: "ke2", label: "KE₂", color: "#06b6d4" },
    { key: "keTotal", label: "ΣKE (Total)", color: "#10b981" },
  ];

  // Newton's Third Law Force vs Time series
  const forceSeries: Series[] = [
    { key: "force1", label: "F₂₁ (on Ball 1)", color: "#ef4444" },
    { key: "force2", label: "F₁₂ (on Ball 2)", color: "#10b981" },
  ];

  // Impulse vs Time series
  const impulseSeries: Series[] = [
    { key: "impulse1", label: "J₁", color: "#ef4444" },
    { key: "impulse2", label: "J₂", color: "#14b8a6" },
    { key: "netImpulse", label: "J_net (J₁+J₂)", color: "#94a3b8" },
  ];

  // COM Position vs Time series
  const comPositionSeries: Series[] = [{ key: "xCom", label: "x_com", color: "#eab308" }];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em]">
            Deterministic Telemetry
          </p>
          <p className="text-xs font-bold text-white/60">
            Multi-Series Continuous Physics Charts
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">
            Deterministic Sync
          </span>
        </div>
      </div>

      {/* Conservation meter */}
      <ConservationMeter error={conservationError} />

      {/* Grid of 6 interactive multi-series charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph 1: Velocity */}
        <MiniGraph
          samples={samples}
          series={velocitySeries}
          label="Velocity vs Time"
          unit="m/s"
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          collisionTime={collisionTime}
          time={time}
          showZeroLine
          scientificMode={scientificMode}
        />

        {/* Graph 2: Momentum */}
        <MiniGraph
          samples={samples}
          series={momentumSeries}
          label="Momentum vs Time"
          unit="kg·m/s"
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          collisionTime={collisionTime}
          time={time}
          showZeroLine
          scientificMode={scientificMode}
        />

        {/* Graph 3: Kinetic Energy */}
        <MiniGraph
          samples={samples}
          series={keSeries}
          label="Kinetic Energy vs Time"
          unit="J"
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          collisionTime={collisionTime}
          time={time}
          scientificMode={scientificMode}
        />

        {/* Graph 4: Newton's Third Law Force */}
        <MiniGraph
          samples={samples}
          series={forceSeries}
          label="Newton's 3rd Law Force vs Time"
          unit="N"
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          collisionTime={collisionTime}
          time={time}
          showZeroLine
          scientificMode={scientificMode}
        />

        {/* Graph 5: Internal & Net Impulse */}
        <MiniGraph
          samples={samples}
          series={impulseSeries}
          label="Impulse vs Time"
          unit="N·s"
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          collisionTime={collisionTime}
          time={time}
          showZeroLine
          scientificMode={scientificMode}
        />

        {/* Graph 6: COM Position */}
        <MiniGraph
          samples={samples}
          series={comPositionSeries}
          label="Center of Mass Position vs Time"
          unit="m"
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          collisionTime={collisionTime}
          time={time}
          scientificMode={scientificMode}
        />
      </div>

      {/* Guidance note */}
      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-2">
        <Info className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[9px] text-white/35 leading-relaxed">
          Hover any chart to scrub all 6 channels in sync. In an isolated system (no wall interactions),{" "}
          <strong className="text-white/50">Σp (pink line)</strong> and{" "}
          <strong className="text-white/50">v_com (yellow velocity)</strong> are perfectly flat constants,
          while the <strong className="text-white/50">Center of Mass trajectory</strong> stays fully linear,
          independent of the collision category.
        </p>
      </div>
    </div>
  );
};

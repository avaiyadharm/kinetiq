"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BarChart2, Activity, Heart, Info, TrendingUp, HelpCircle } from "lucide-react";

interface HistoryData {
  pv: { p: number; v: number }[];
  pt: { p: number; t: number }[];
  vt: { v: number; t: number }[];
  entropy: number[];
  collisions: number[];
  times: number[];
}

interface GasLawsAnalyticsProps {
  history: HistoryData;
  particleCount: number;
  currentTemp: number;
  currentVolume: number;
  currentPressure: number;
}

// ─── Simple SVG Line Chart Component ─────────────────────────────────────────
interface MiniChartProps {
  title: string;
  data: { x: number; y: number }[];
  xLabel: string;
  yLabel: string;
  color: string;
  yMinVal?: number;
  yMaxVal?: number;
  xMinVal?: number;
  xMaxVal?: number;
  referenceLines?: { key: string; draw: (w: number, h: number) => React.ReactNode }[];
}

const MiniChart: React.FC<MiniChartProps> = ({
  title,
  data,
  xLabel,
  yLabel,
  color,
  yMinVal,
  yMaxVal,
  xMinVal,
  xMaxVal,
  referenceLines
}) => {
  const width = 380;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Determine bounds
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);

  const minX = xMinVal !== undefined ? xMinVal : (xValues.length > 0 ? Math.min(...xValues) : 0);
  const maxX = xMaxVal !== undefined ? xMaxVal : (xValues.length > 0 ? Math.max(...xValues) : 1);
  const minY = yMinVal !== undefined ? yMinVal : (yValues.length > 0 ? Math.min(...yValues) : 0);
  const maxY = yMaxVal !== undefined ? yMaxVal : (yValues.length > 0 ? Math.max(...yValues) : 1);

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  // Convert points to pixel coordinates
  const points = data.map((d) => {
    const px = paddingLeft + ((d.x - minX) / dx) * chartW;
    const py = paddingTop + chartH - ((d.y - minY) / dy) * chartH;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(" L ")}` : "";

  // Grid lines
  const gridRows = 4;
  const gridCols = 5;

  return (
    <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between group relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
          {title}
        </h4>
        {data.length > 0 && (
          <span className="text-[9px] font-mono text-white/30">
            Last: {data[data.length - 1].y.toFixed(1)}
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-[180px] w-full mt-2">
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/5 bg-black/20 rounded-xl">
            <div className="text-center space-y-1">
              <Activity className="w-5 h-5 mx-auto text-white/20 animate-pulse" />
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/30">Waiting for data telemetry...</div>
            </div>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Grids */}
            {Array.from({ length: gridRows + 1 }).map((_, i) => {
              const yVal = paddingTop + (i / gridRows) * chartH;
              return (
                <line
                  key={`r-${i}`}
                  x1={paddingLeft}
                  y1={yVal}
                  x2={width - paddingRight}
                  y2={yVal}
                  stroke="#ffffff"
                  strokeOpacity={0.03}
                  strokeWidth={1}
                />
              );
            })}
            {Array.from({ length: gridCols + 1 }).map((_, i) => {
              const xVal = paddingLeft + (i / gridCols) * chartW;
              return (
                <line
                  key={`c-${i}`}
                  x1={xVal}
                  y1={paddingTop}
                  x2={xVal}
                  y2={height - paddingBottom}
                  stroke="#ffffff"
                  strokeOpacity={0.03}
                  strokeWidth={1}
                />
              );
            })}

            {/* Custom Reference Lines */}
            {referenceLines && referenceLines.map((ref, idx) => (
              <g key={`ref-${idx}`}>
                {ref.draw(chartW, chartH)}
              </g>
            ))}

            {/* Path */}
            {pathD && (
              <>
                {/* Neon shadow path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  strokeOpacity={0.2}
                />
                {/* Active path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                />
              </>
            )}

            {/* Active Indicator point */}
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].split(",")[0]}
                cy={points[points.length - 1].split(",")[1]}
                r={3}
                fill={color}
                className="animate-pulse"
              />
            )}

            {/* Axes */}
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={height - paddingBottom}
              stroke="#27272a"
              strokeWidth={1}
            />
            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="#27272a"
              strokeWidth={1}
            />

            {/* Axis Tick Text */}
            {/* Y bounds */}
            <text
              x={paddingLeft - 6}
              y={paddingTop + 4}
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily="monospace"
              textAnchor="end"
            >
              {maxY.toFixed(0)}
            </text>
            <text
              x={paddingLeft - 6}
              y={height - paddingBottom + 2}
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily="monospace"
              textAnchor="end"
            >
              {minY.toFixed(0)}
            </text>

            {/* X bounds */}
            <text
              x={paddingLeft}
              y={height - paddingBottom + 10}
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {minX.toFixed(0)}
            </text>
            <text
              x={width - paddingRight}
              y={height - paddingBottom + 10}
              fill="rgba(255,255,255,0.3)"
              fontSize={7}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {maxX.toFixed(0)}
            </text>

            {/* Labels */}
            <text
              x={paddingLeft + chartW / 2}
              y={height - 4}
              fill="rgba(255,255,255,0.4)"
              fontSize={8}
              fontFamily="monospace"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              {xLabel}
            </text>
            <text
              x={10}
              y={paddingTop + chartH / 2}
              fill="rgba(255,255,255,0.4)"
              fontSize={8}
              fontFamily="monospace"
              textAnchor="middle"
              transform={`rotate(-90 10 ${paddingTop + chartH / 2})`}
              letterSpacing="0.1em"
            >
              {yLabel}
            </text>
          </svg>
        )}
      </div>
    </div>
  );
};

export const GasLawsAnalytics: React.FC<GasLawsAnalyticsProps> = ({
  history,
  particleCount,
  currentTemp,
  currentVolume,
  currentPressure
}) => {
  const [activeTab, setActiveTab] = useState<"thermo" | "statistical">("thermo");

  // Format histories into chart-compatible coordinate maps
  const pvPoints = history.pv.map((p) => ({ x: p.v, y: p.p * 100 })); // convert pressure unit to match kPa
  
  // Sort pvPoints by Volume so the line renders from left to right correctly
  const pvPointsSorted = [...pvPoints].sort((a, b) => a.x - b.x);

  const ptPoints = history.times.map((t, idx) => ({
    x: (t - history.times[0]) / 1000,
    y: history.pt[idx]?.p * 100 || 0
  }));

  const vtPoints = history.times.map((t, idx) => ({
    x: (t - history.times[0]) / 1000,
    y: history.vt[idx]?.v || 0
  }));

  const entropyPoints = history.times.map((t, idx) => ({
    x: (t - history.times[0]) / 1000,
    y: history.entropy[idx] || 0
  }));

  const collisionPoints = history.times.map((t, idx) => ({
    x: (t - history.times[0]) / 1000,
    y: history.collisions[idx] || 0
  }));

  const currentEntropy = history.entropy.length > 0 ? history.entropy[history.entropy.length - 1] : 0;
  const currentCollisions = history.collisions.length > 0 ? history.collisions[history.collisions.length - 1] : 0;

  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.25em] mb-1">Thermodynamic Analysis Panel</div>
            <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-widest text-white">
              Real-Time Chart Analytics
            </h2>
            <p className="text-[11px] text-white/40 mt-1.5 max-w-xl leading-relaxed">
              Observe pressure-volume curves, Shannon Entropy progression, and kinetic collision frequency plots updating live.
            </p>
          </div>

          <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab("thermo")}
              className={cn(
                "py-1.5 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === "thermo" ? "bg-primary text-white shadow-md" : "text-white/40 hover:text-white"
              )}
            >
              Macroscopic Charts
            </button>
            <button
              onClick={() => setActiveTab("statistical")}
              className={cn(
                "py-1.5 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === "statistical" ? "bg-primary text-white shadow-md" : "text-white/40 hover:text-white"
              )}
            >
              Statistical Mechanics
            </button>
          </div>
        </div>

        {/* Real-time stats summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141416] p-4 rounded-2xl border border-white/[0.04]">
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Live Pressure P</div>
            <div className="text-xl font-mono font-bold text-rose-400 mt-1">{(currentPressure * 100).toFixed(1)} kPa</div>
            <div className="text-[8.5px] text-white/20 mt-1.5 uppercase font-mono">From boundary impacts</div>
          </div>
          <div className="bg-[#141416] p-4 rounded-2xl border border-white/[0.04]">
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Chamber Volume V</div>
            <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{currentVolume.toFixed(2)} dm³</div>
            <div className="text-[8.5px] text-white/20 mt-1.5 uppercase font-mono">Piston fraction boundary</div>
          </div>
          <div className="bg-[#141416] p-4 rounded-2xl border border-white/[0.04]">
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Shannon Entropy S</div>
            <div className="text-xl font-mono font-bold text-indigo-400 mt-1">{currentEntropy.toFixed(3)}</div>
            <div className="text-[8.5px] text-white/20 mt-1.5 uppercase font-mono">Max possible S = 3.58</div>
          </div>
          <div className="bg-[#141416] p-4 rounded-2xl border border-white/[0.04]">
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Collision Frequency f</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{currentCollisions} Hz</div>
            <div className="text-[8.5px] text-white/20 mt-1.5 uppercase font-mono">Collisions per second</div>
          </div>
        </div>

        {/* Charts Grid */}
        {activeTab === "thermo" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MiniChart
              title="Pressure vs Volume Path (P-V Indicator)"
              data={pvPointsSorted}
              xLabel="VOLUME V (dm³)"
              yLabel="PRESSURE P (kPa)"
              color="#10b981"
              xMinVal={3.0}
              xMaxVal={10.0}
              yMinVal={0}
              yMaxVal={800}
            />

            <MiniChart
              title="Pressure vs Time (P-t Trend)"
              data={ptPoints}
              xLabel="TIME ELAPSED (s)"
              yLabel="PRESSURE P (kPa)"
              color="#ec4899"
              yMinVal={0}
              yMaxVal={800}
            />

            <MiniChart
              title="Volume vs Time (V-t Trend)"
              data={vtPoints}
              xLabel="TIME ELAPSED (s)"
              yLabel="VOLUME V (dm³)"
              color="#06b6d4"
              yMinVal={3.0}
              yMaxVal={10.0}
            />

            <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/70">
                  Ideal Thermodynamic Reference Lines
                </h4>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                The P-V Indicator Chart plots the current state coordinates ($V, P$). In isothermal expansion (Boyle's regime), the coordinates follow an inverse proportionality curve ($P \propto 1/V$), carving a smooth hyperbola. 
                <br /><br />
                Under isobaric expansion (Charles's regime), the pressure remains stationary while volume rises linearly with temperature. Under Gay-Lussac's isochoric regime, pressure jumps linearly with heat addition while volume stays locked.
              </p>
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-white/35 font-bold">Calibration Factor</div>
                <div className="text-[12px] font-mono font-bold text-emerald-400">PV = N · kb · T</div>
                <div className="text-[9px] text-white/40">N = {particleCount} | T = {Math.round(currentTemp)} K | V = {currentVolume.toFixed(2)} dm³</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MiniChart
              title="Shannon Entropy vs Time (S-t Curve)"
              data={entropyPoints}
              xLabel="TIME ELAPSED (s)"
              yLabel="ENTROPY S"
              color="#8b5cf6"
              yMinVal={0}
              yMaxVal={3.8}
            />

            <MiniChart
              title="Collision Frequency vs Time (f-t Curve)"
              data={collisionPoints}
              xLabel="TIME ELAPSED (s)"
              yLabel="COLLISIONS / SEC (Hz)"
              color="#10b981"
              yMinVal={0}
              yMaxVal={400}
            />

            <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-3">
                Shannon Entropy & Second Law
              </h4>
              <p className="text-[11px] text-white/40 leading-relaxed mb-4">
                Shannon Entropy is calculated by dividing the physical compartment into a grid, calculating the probability $P_i = N_i / N$ of finding a particle in cell $i$, and integrating:
              </p>
              <div className="bg-black/50 border border-white/5 p-3 rounded-xl font-mono text-[12px] font-bold text-center text-purple-400 my-2">
                S = - Σ P_i ln(P_i)
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                If all particles are constrained in a corner (a localized configuration), entropy is low. As particles disperse and thermalize evenly, the Shannon Entropy climbs toward the maximum possible value of ln(36) ≈ 3.58, visualizing the Second Law of Thermodynamics.
              </p>
            </div>

            <div className="bg-[#141416] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3">
                Collision Frequency & Mean Free Path
              </h4>
              <p className="text-[11px] text-white/40 leading-relaxed mb-4">
                The collision frequency represents the rate of atomic impacts. According to kinetic theory, collision frequency $f$ increases with:
              </p>
              <ul className="list-disc pl-5 text-[11px] text-white/50 space-y-1.5">
                <li>Higher Particle Density ($N/V$): more particles in less space increases likelihood of collision.</li>
                <li>Higher Temperatures ($T$): particles move faster, crossing paths more frequently.</li>
                <li>Larger Particle Sizes (Xenon vs Helium): larger collision cross-sections increase probability.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

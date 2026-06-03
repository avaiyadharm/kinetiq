"use client";
import React, { useEffect, useRef } from "react";
import { useKEStore } from "@/store/kineticEnergyStore";
import { HistoryPoint } from "@/lib/physics/kineticEnergy";

// ─── SVG mini-chart ───────────────────────────────────────────────────────────
interface ChartProps {
  data: number[];
  color: string;
  label: string;
  unit: string;
  yMin?: number;
  yMax?: number;
  dotColor?: string;
}

function MiniChart({ data, color, label, unit, yMin, dotColor }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 300, H = 80;
  const PAD = { l: 8, r: 8, t: 6, b: 6 };

  if (data.length < 2) {
    return (
      <div className="h-[80px] flex items-center justify-center">
        <span className="text-[10px] text-white/20 font-mono">Waiting for data…</span>
      </div>
    );
  }

  const minV = yMin !== undefined ? yMin : Math.min(...data);
  const maxV = Math.max(...data);
  const range = maxV - minV || 1;

  const xs = data.map((_, i) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r));
  const ys = data.map(v => H - PAD.b - ((v - minV) / range) * (H - PAD.t - PAD.b));

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const fill = `${path} L${xs[xs.length - 1].toFixed(1)},${H - PAD.b} L${xs[0].toFixed(1)},${H - PAD.b} Z`;

  const lastX = xs[xs.length - 1], lastY = ys[ys.length - 1];
  const lastVal = data[data.length - 1];

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      {/* Fill */}
      <path d={fill} fill={color + "18"} />
      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Y baseline */}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Live dot */}
      <circle cx={lastX} cy={lastY} r="3" fill={dotColor || color} />
      <circle cx={lastX} cy={lastY} r="6" fill={color + "33"} />
      {/* Live value */}
      <text x={lastX - 2} y={Math.max(PAD.t + 10, lastY - 8)} textAnchor="end"
        fill={color} fontSize="9" fontFamily="'JetBrains Mono',monospace" fontWeight="bold">
        {Math.abs(lastVal) >= 1e6 ? `${(lastVal / 1e6).toFixed(2)}M`
          : Math.abs(lastVal) >= 1e3 ? `${(lastVal / 1e3).toFixed(2)}k`
          : lastVal.toFixed(2)}{unit}
      </text>
    </svg>
  );
}

function ChartCard({
  title, data, color, unit, subtitle = "", yMin, dotColor,
}: {
  title: string; data: number[]; color: string; unit: string;
  subtitle?: string; yMin?: number; dotColor?: string;
}) {
  const last = data[data.length - 1];
  const max = Math.max(...data, 0);
  const fmtV = (v: number) =>
    Math.abs(v) >= 1e9 ? `${(v / 1e9).toFixed(3)} G${unit}`
    : Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(3)} M${unit}`
    : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(3)} k${unit}`
    : `${v.toFixed(4)} ${unit}`;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col gap-2 hover:border-white/12 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-white/40">{title}</div>
          {subtitle && <div className="text-[10px] text-white/25 font-mono mt-0.5">{subtitle}</div>}
        </div>
        <div className="text-right">
          <div className="text-[13px] font-black font-mono" style={{ color }}>{last !== undefined ? fmtV(last) : "—"}</div>
          <div className="text-[9px] text-white/25 font-mono">max: {fmtV(max)}</div>
        </div>
      </div>
      <MiniChart data={data} color={color} label={title} unit={unit} yMin={yMin} dotColor={dotColor} />
    </div>
  );
}

// ─── Energy Balance bar ───────────────────────────────────────────────────────
function EnergyBalance({ history }: { history: HistoryPoint[] }) {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const total = Math.max(last.ke + last.pe + last.thermalLoss, 1);
  const keW = (last.ke / total) * 100;
  const peW = (last.pe / total) * 100;
  const thW = (last.thermalLoss / total) * 100;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-white/40">Energy Budget</div>
      <div className="w-full h-5 rounded-full overflow-hidden flex" style={{ background: "rgba(39,39,42,0.6)" }}>
        <div style={{ width: `${keW}%`, background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }} className="h-full transition-all duration-100" />
        <div style={{ width: `${peW}%`, background: "linear-gradient(90deg, #10b981, #34d399)" }} className="h-full transition-all duration-100" />
        <div style={{ width: `${thW}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }} className="h-full transition-all duration-100" />
      </div>
      <div className="flex gap-4 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-white/50">KE <span className="text-blue-400 font-bold">{last.ke.toFixed(2)}J ({keW.toFixed(0)}%)</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-white/50">PE <span className="text-emerald-400 font-bold">{last.pe.toFixed(2)}J ({peW.toFixed(0)}%)</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-white/50">Thermal <span className="text-orange-400 font-bold">{last.thermalLoss.toFixed(2)}J ({thW.toFixed(0)}%)</span></span>
        </div>
      </div>
    </div>
  );
}

// ─── Statistics Panel ─────────────────────────────────────────────────────────
function StatGrid({ history }: { history: HistoryPoint[] }) {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const keArr = history.map(h => h.ke);
  const vArr = history.map(h => h.v);
  const maxKE = Math.max(...keArr);
  const avgKE = keArr.reduce((a, b) => a + b, 0) / keArr.length;
  const maxV = Math.max(...vArr);

  const stats = [
    { label: "Current KE", value: `${last.ke.toFixed(4)} J`, color: "#3b82f6" },
    { label: "Max KE", value: `${maxKE.toFixed(4)} J`, color: "#60a5fa" },
    { label: "Avg KE", value: `${avgKE.toFixed(4)} J`, color: "#93c5fd" },
    { label: "Current v", value: `${Math.abs(last.v).toFixed(4)} m/s`, color: "#f59e0b" },
    { label: "Max v", value: `${maxV.toFixed(4)} m/s`, color: "#fcd34d" },
    { label: "Momentum p", value: `${last.momentum.toFixed(4)} kg·m/s`, color: "#ec4899" },
    { label: "Power P", value: `${last.power.toFixed(4)} W`, color: "#f97316" },
    { label: "Total E", value: `${last.totalE.toFixed(4)} J`, color: "#a78bfa" },
    { label: "Thermal Q", value: `${last.thermalLoss.toFixed(4)} J`, color: "#fb923c" },
    { label: "Time t", value: `${last.t.toFixed(3)} s`, color: "#ffffff66" },
    { label: "Data Points", value: `${history.length}`, color: "#ffffff44" },
    { label: "Rate", value: `${(history.length / Math.max(last.t, 0.01)).toFixed(1)} Hz`, color: "#ffffff33" },
  ];

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="text-[11px] font-black uppercase tracking-wider text-white/40 mb-3">Live Statistics</div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{s.label}</div>
            <div className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Analytics Component ─────────────────────────────────────────────────
export const KineticEnergyAnalytics: React.FC = () => {
  const { history } = useKEStore();

  const sample = history.length > 300
    ? history.filter((_, i) => i % Math.ceil(history.length / 300) === 0)
    : history;

  const ke   = sample.map(h => h.ke);
  const pe   = sample.map(h => h.pe);
  const v    = sample.map(h => Math.abs(h.v));
  const mom  = sample.map(h => h.momentum);
  const pow  = sample.map(h => h.power);
  const totE = sample.map(h => h.totalE);
  const therm = sample.map(h => h.thermalLoss);

  // KE vs v (parametric — x-axis = v sorted, y = ke)
  const vKePairs = sample.map(h => ({ v: Math.abs(h.v), ke: h.ke })).sort((a, b) => a.v - b.v);
  const vAxis = vKePairs.map(p => p.v);
  const keByV = vKePairs.map(p => p.ke);

  if (history.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="text-3xl opacity-30">📈</div>
        <div className="text-[13px] text-white/30 font-mono">
          Start the simulation to see live analytics
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black text-white tracking-tight">Real-Time Analytics</h2>
        <p className="text-white/40 text-xs font-mono">{history.length} data points recorded — updating at simulation rate</p>
      </div>

      <EnergyBalance history={history} />
      <StatGrid history={history} />

      <div className="grid grid-cols-1 gap-4">
        <ChartCard
          title="KE vs Velocity (parametric)"
          data={keByV} color="#3b82f6" unit="J" yMin={0}
          subtitle="KE = ½mv² — parabolic relationship"
        />
        <ChartCard
          title="Kinetic Energy vs Time"
          data={ke} color="#3b82f6" unit="J" yMin={0}
        />
        <ChartCard
          title="Potential Energy vs Time"
          data={pe} color="#10b981" unit="J" yMin={0}
        />
        <ChartCard
          title="Total Mechanical Energy"
          data={totE} color="#a78bfa" unit="J" yMin={0}
          subtitle="Should be constant (no friction) or decreasing"
        />
        <ChartCard
          title="Speed vs Time"
          data={v} color="#f59e0b" unit="m/s" yMin={0}
        />
        <ChartCard
          title="Momentum vs Time"
          data={mom} color="#ec4899" unit="kg·m/s"
          subtitle="p = mv"
        />
        <ChartCard
          title="Power vs Time"
          data={pow} color="#f97316" unit="W"
          subtitle="P = F·v = dKE/dt"
        />
        <ChartCard
          title="Cumulative Thermal Loss"
          data={therm} color="#6b7280" unit="J" yMin={0}
          subtitle="Energy converted to heat by friction"
        />
      </div>
    </div>
  );
};

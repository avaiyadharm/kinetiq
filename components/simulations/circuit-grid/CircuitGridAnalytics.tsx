"use client";
import React from "react";
import { useCircuitStore, AnalyticsPoint, verifyKCL, computeEquivalentR } from "@/store/circuitStore";

// ─── Mini SVG chart ───────────────────────────────────────────────────────────
function MiniChart({
  data, color, unit, yMin,
}: { data: number[]; color: string; unit: string; yMin?: number }) {
  const W = 300, H = 72;
  const PAD = { l: 6, r: 6, t: 4, b: 4 };

  if (data.length < 2) {
    return (
      <div className="h-[72px] flex items-center justify-center">
        <span className="text-[10px] text-white/20 font-mono">Waiting for data…</span>
      </div>
    );
  }

  const minV = yMin !== undefined ? yMin : Math.min(...data);
  const maxV = Math.max(...data);
  const range = maxV - minV || 1;

  const xs = data.map((_, i) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r));
  const ys = data.map((v) => H - PAD.b - ((v - minV) / range) * (H - PAD.t - PAD.b));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const fill = `${path} L${xs[xs.length - 1].toFixed(1)},${H - PAD.b} L${xs[0].toFixed(1)},${H - PAD.b} Z`;

  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  const lastVal = data[data.length - 1];

  const fmtVal = (v: number) =>
    Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(2)}M`
    : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(2)}k`
    : v.toFixed(4);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      <path d={fill} fill={color + "18"} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
      <circle cx={lastX} cy={lastY} r="6" fill={color + "33"} />
      <text x={lastX - 2} y={Math.max(PAD.t + 10, lastY - 8)} textAnchor="end"
        fill={color} fontSize="9" fontFamily="monospace" fontWeight="bold">
        {fmtVal(lastVal)}{unit}
      </text>
    </svg>
  );
}

function ChartCard({
  title, subtitle, data, color, unit, yMin,
}: { title: string; subtitle?: string; data: number[]; color: string; unit: string; yMin?: number }) {
  const last = data[data.length - 1];
  const max = Math.max(...data, 0);
  const fmtV = (v: number) =>
    Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(3)} M${unit}`
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
      <MiniChart data={data} color={color} unit={unit} yMin={yMin} />
    </div>
  );
}

// ─── Component Breakdown ──────────────────────────────────────────────────────
function ComponentBreakdown() {
  const { components } = useCircuitStore();
  if (components.length === 0) return null;

  const byType = components.reduce<Record<string, { count: number; totalPower: number; maxCurrent: number }>>((acc, c) => {
    const k = c.type;
    if (!acc[k]) acc[k] = { count: 0, totalPower: 0, maxCurrent: 0 };
    acc[k].count++;
    acc[k].totalPower += c.power ?? 0;
    acc[k].maxCurrent = Math.max(acc[k].maxCurrent, c.current ?? 0);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-white/40">Component Breakdown</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="bg-white/5">
              <th className="py-1.5 px-3 text-left text-white/40 font-bold uppercase tracking-wider">Type</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold uppercase tracking-wider">Count</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold uppercase tracking-wider">Total Power</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold uppercase tracking-wider">Max Current</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byType).map(([type, stats], i) => (
              <tr key={type} className={i % 2 === 0 ? "bg-white/2" : ""}>
                <td className="py-1.5 px-3 text-white/70 capitalize">{type}</td>
                <td className="py-1.5 px-3 text-white/70 text-right">{stats.count}</td>
                <td className="py-1.5 px-3 text-yellow-400 text-right">{stats.totalPower.toFixed(4)} W</td>
                <td className="py-1.5 px-3 text-blue-400 text-right">{(stats.maxCurrent * 1000).toFixed(2)} mA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Power Distribution Bar ───────────────────────────────────────────────────
function PowerDistribution() {
  const { components } = useCircuitStore();
  const loads = components.filter((c) => ["resistor", "bulb", "led"].includes(c.type) && (c.power ?? 0) > 0.0001);
  if (loads.length === 0) return null;

  const total = loads.reduce((s, c) => s + (c.power ?? 0), 0);

  const colors: Record<string, string> = {
    resistor: "#f59e0b",
    bulb: "#fbbf24",
    led: "#22d3ee",
  };

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-white/40">Power Distribution</div>
      <div className="w-full h-5 rounded-full overflow-hidden flex">
        {loads.map((c) => (
          <div
            key={c.id}
            style={{
              width: `${((c.power ?? 0) / Math.max(total, 1e-9)) * 100}%`,
              background: colors[c.type] ?? "#3b82f6",
            }}
            className="h-full transition-all duration-200"
            title={`${c.type} (${c.row},${c.col}): ${(c.power ?? 0).toFixed(4)}W`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] font-mono">
        {loads.map((c) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: colors[c.type] ?? "#3b82f6" }} />
            <span className="text-white/50 capitalize">{c.type} ({c.row},{c.col}):</span>
            <span style={{ color: colors[c.type] ?? "#3b82f6" }} className="font-bold">
              {(((c.power ?? 0) / Math.max(total, 1e-9)) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live Stats Grid ──────────────────────────────────────────────────────────
function LiveStatsGrid({ history }: { history: AnalyticsPoint[] }) {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const { components } = useCircuitStore();
  const battery = components.find((c) => c.type === "battery");
  const totalPower = components.reduce((s, c) => s + (c.power ?? 0), 0);
  const I_bat = battery ? Math.abs(battery.signedCurrent ?? 0) : 0;
  const R_eq = computeEquivalentR(components);
  const r_int = battery?.internalR ?? 0;
  const V_terminal = (battery?.value ?? 0) - I_bat * r_int;

  const stats = [
    { label: "EMF", value: battery ? `${battery.value.toFixed(2)} V` : "—", color: "#10b981" },
    { label: "Terminal V", value: battery ? `${V_terminal.toFixed(3)} V` : "—", color: "#34d399" },
    { label: "I_supply", value: `${(I_bat * 1000).toFixed(3)} mA`, color: "#3b82f6" },
    { label: "R_equivalent", value: isFinite(R_eq) ? `${R_eq.toFixed(2)} Ω` : "∞ (open)", color: "#f59e0b" },
    { label: "Total Power", value: `${totalPower.toFixed(4)} W`, color: "#f97316" },
    { label: "Time Elapsed", value: `${last.t.toFixed(2)} s`, color: "#ffffff60" },
  ];

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="text-[11px] font-black uppercase tracking-wider text-white/40 mb-3">Live Statistics</div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <div className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{s.label}</div>
            <div className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KCL Verification Table ───────────────────────────────────────────────────
function KCLVerificationTable() {
  const { components } = useCircuitStore();
  const kclResults = verifyKCL(components);
  if (kclResults.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-white/40">KCL Node Verification</div>
      <p className="text-[10px] font-mono text-white/30">
        At every node: Σ currents in = Σ currents out (charge conservation)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="bg-white/5">
              <th className="py-1.5 px-3 text-left text-white/40 font-bold">Node</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold">Σ I_in</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold">Σ I_out</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold">Error</th>
              <th className="py-1.5 px-3 text-right text-white/40 font-bold">KCL</th>
            </tr>
          </thead>
          <tbody>
            {kclResults.slice(0, 8).map((node, i) => {
              const sumIn = node.currentsIn.reduce((s, c) => s + c.current, 0);
              const sumOut = node.currentsOut.reduce((s, c) => s + c.current, 0);
              return (
                <tr key={i} className={i % 2 === 0 ? "bg-white/2" : ""}>
                  <td className="py-1.5 px-3 text-white/60">N{node.nodeId}</td>
                  <td className="py-1.5 px-3 text-blue-400 text-right">{(sumIn * 1000).toFixed(3)} mA</td>
                  <td className="py-1.5 px-3 text-orange-400 text-right">{(sumOut * 1000).toFixed(3)} mA</td>
                  <td className="py-1.5 px-3 text-white/50 text-right">{(node.error * 1e6).toFixed(2)} μA</td>
                  <td className={`py-1.5 px-3 text-right font-bold ${node.ok ? "text-emerald-400" : "text-rose-400"}`}>
                    {node.ok ? "✓" : "✗"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Analytics ───────────────────────────────────────────────────────────
export const CircuitGridAnalytics: React.FC = () => {
  const { history, isRunning, components } = useCircuitStore();

  const sample = history.length > 300
    ? history.filter((_, i) => i % Math.ceil(history.length / 300) === 0)
    : history;

  const powerData    = sample.map((h) => h.totalPower);
  const currData     = sample.map((h) => h.batteryCurrent * 1000);  // battery supply current in mA
  const termVData    = sample.map((h) => h.terminalVoltage);
  const reqData      = sample.map((h) => isFinite(h.equivalentR) ? h.equivalentR : 0);
  const energyData   = sample.map((h) => h.storedEnergy * 1000);    // in mJ
  const vsrcData     = sample.map((h) => h.voltageSource);

  if (!isRunning && history.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-black text-white tracking-tight">Circuit Analytics</h2>
          <p className="text-white/40 text-xs font-mono">Real-time power, current, and node verification</p>
        </div>
        <ComponentBreakdown />
        <PowerDistribution />
        <KCLVerificationTable />
        {components.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="text-4xl opacity-25">⚡</div>
            <div className="text-[13px] text-white/30 font-mono text-center">
              Build a circuit and click<br />"Run Simulation" to see live charts
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasCaps = components.some((c) => c.type === "capacitor");

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black text-white tracking-tight">Circuit Analytics</h2>
        <p className="text-white/40 text-xs font-mono">
          {history.length} data points · physics-accurate solver
        </p>
      </div>

      <LiveStatsGrid history={history} />
      <ComponentBreakdown />
      <PowerDistribution />
      <KCLVerificationTable />

      {history.length >= 2 && (
        <div className="grid grid-cols-1 gap-4">
          <ChartCard
            title="Total Power Dissipation"
            subtitle="P = I²R — summed across all resistive loads"
            data={powerData} color="#f59e0b" unit="W" yMin={0}
          />
          <ChartCard
            title="Battery Supply Current"
            subtitle="I_battery — actual current delivered by voltage source"
            data={currData} color="#3b82f6" unit="mA" yMin={0}
          />
          <ChartCard
            title="Terminal Voltage"
            subtitle="V_terminal = EMF − I·r (drops under load with internal R)"
            data={termVData} color="#10b981" unit="V" yMin={0}
          />
          <ChartCard
            title="Equivalent Resistance"
            subtitle="R_eq = V / I — valid for any circuit topology"
            data={reqData} color="#f59e0b" unit="Ω" yMin={0}
          />
          {hasCaps && (
            <ChartCard
              title="Capacitor Stored Energy"
              subtitle="E = ½CV² — rises exponentially during RC charging"
              data={energyData} color="#a78bfa" unit="mJ" yMin={0}
            />
          )}
        </div>
      )}
    </div>
  );
};

"use client";
import React, { useMemo } from "react";
import {
  useCircuitStore,
  GridComponent,
  computeEquivalentR,
} from "@/store/circuitStore";

// ─── Styled equation blocks ────────────────────────────────────────────────────

function EqBlock({
  label,
  eq,
  result,
  verified,
  highlight = false,
}: {
  label: string;
  eq: string;
  result: string;
  verified?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-3 transition-colors ${
        highlight
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-white/8 bg-white/[0.02]"
      }`}
    >
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
        {label}
      </div>
      <code className="text-[11px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap">
        {eq}
      </code>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[13px] font-black font-mono text-blue-300">
          {result}
        </span>
        {verified !== undefined && (
          <span
            className={`text-[10px] font-mono font-bold ${
              verified ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {verified ? "✓ KVL/KCL verified" : "✗ Check wiring"}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, color = "#3b82f6" }: { title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="w-1 h-5 rounded-full" style={{ background: color }} />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
        {title}
      </span>
    </div>
  );
}

// ─── Topology classifier ───────────────────────────────────────────────────────

type Topology = "series" | "parallel" | "mixed" | "rc" | "empty" | "open";

function classifyTopology(components: GridComponent[]): Topology {
  const battery = components.find((c) => c.type === "battery");
  if (!battery) return "empty";

  const resistors = components.filter((c) =>
    ["resistor", "bulb", "led"].includes(c.type)
  );
  const caps = components.filter((c) => c.type === "capacitor");
  const I_bat = Math.abs(battery.signedCurrent ?? 0);

  if (I_bat < 1e-9 && resistors.length > 0) return "open";
  if (caps.length > 0 && resistors.length > 0) return "rc";

  if (resistors.length < 2) return "series";

  // If all resistors carry the same current → series
  const currents = resistors.map((r) => Math.abs(r.current ?? 0));
  const maxI = Math.max(...currents);
  const minI = Math.min(...currents);
  if (maxI > 1e-9 && (maxI - minI) / maxI < 0.05) return "series";

  // If all resistors have the same voltage → parallel
  const voltages = resistors.map((r) => Math.abs(r.voltage ?? 0));
  const maxV2 = Math.max(...voltages);
  const minV2 = Math.min(...voltages);
  if (maxV2 > 1e-9 && (maxV2 - minV2) / maxV2 < 0.05) return "parallel";

  return "mixed";
}

// ─── Step generator ───────────────────────────────────────────────────────────

interface DeriveStep {
  label: string;
  eq: string;
  result: string;
  highlight?: boolean;
  verified?: boolean;
}

function generateDerivation(components: GridComponent[]): DeriveStep[] {
  const battery = components.find((c) => c.type === "battery");
  if (!battery) return [];

  const resistors = components.filter((c) => c.type === "resistor");
  const bulbs = components.filter((c) => c.type === "bulb");
  const leds = components.filter((c) => c.type === "led");
  const caps = components.filter((c) => c.type === "capacitor");
  const passives = [...resistors, ...bulbs, ...leds];

  const V = battery.value;
  const r_int = battery.internalR ?? 0;
  const I_bat = Math.abs(battery.signedCurrent ?? 0);
  const V_terminal = V - I_bat * r_int;
  const R_eq = computeEquivalentR(components);
  const P_total = components.reduce((s, c) => s + (c.power ?? 0), 0);

  const topology = classifyTopology(components);
  const steps: DeriveStep[] = [];

  // ── Step 0: Battery ─────────────────────────────────────────────────────
  steps.push({
    label: "Step 1 — Power Source",
    eq: r_int > 0
      ? `EMF = ${V}V\nr_internal = ${r_int.toFixed(2)}Ω\nV_terminal = EMF − I·r = ${V_terminal.toFixed(3)}V`
      : `EMF = ${V}V  (ideal battery, r = 0)`,
    result: `V_supply = ${V_terminal.toFixed(3)} V`,
    highlight: true,
  });

  // ── Step 1: Topology-specific resistance ────────────────────────────────
  if (topology === "series" && passives.length > 0) {
    const rTerms = passives
      .map((r) => {
        const label = r.type === "resistor" ? "R" : r.type === "bulb" ? "R_bulb" : "R_led";
        return `${label}=${r.value.toFixed(0)}Ω`;
      })
      .join(" + ");
    const rSum = passives.reduce((s, r) => s + r.value, 0);

    steps.push({
      label: "Step 2 — Series Equivalent Resistance",
      eq: `R_total = ${passives.map((r) => r.value.toFixed(0) + "Ω").join(" + ")}\nR_total = ${rSum.toFixed(2)}Ω`,
      result: `R_total = ${rSum.toFixed(2)} Ω`,
      verified: Math.abs(R_eq - rSum) / Math.max(rSum, 1) < 0.05,
    });

    steps.push({
      label: "Step 3 — Ohm's Law (Loop Current)",
      eq: `I = V / R_total\nI = ${V_terminal.toFixed(2)} / ${rSum.toFixed(2)}\nI = ${(V_terminal / rSum * 1000).toFixed(2)} mA`,
      result: `I = ${(I_bat * 1000).toFixed(3)} mA`,
      verified: Math.abs(V_terminal / rSum - I_bat) / Math.max(I_bat, 1e-12) < 0.05,
    });

    // Voltage drops (KVL)
    const dropTerms = passives
      .map((r) => {
        const V_r = (r.current ?? 0) * r.value;
        return `V_${r.type}(${r.row},${r.col}) = ${(r.current ?? 0).toFixed(4)}×${r.value}Ω = ${V_r.toFixed(3)}V`;
      })
      .join("\n");
    const dropSum = passives.reduce((s, r) => s + (r.voltage ?? 0), 0);

    steps.push({
      label: "Step 4 — Voltage Drops (KVL verification)",
      eq: `${dropTerms}\n──────────────\nΣV_drops = ${dropSum.toFixed(3)}V\nV_battery = ${V_terminal.toFixed(3)}V`,
      result: `ΣV = ${dropSum.toFixed(3)} V`,
      verified: Math.abs(dropSum - V_terminal) < 0.01,
    });
  } else if (topology === "parallel" && passives.length > 0) {
    const invRSum = passives.reduce((s, r) => s + 1 / Math.max(r.value, 1e-9), 0);
    const R_par = 1 / invRSum;
    const invTerms = passives
      .map((r) => `1/${r.value.toFixed(0)}`)
      .join(" + ");

    steps.push({
      label: "Step 2 — Parallel Equivalent Resistance",
      eq: `1/R_eq = ${invTerms}\n1/R_eq = ${invRSum.toFixed(5)}\nR_eq = ${R_par.toFixed(3)}Ω`,
      result: `R_eq = ${R_par.toFixed(3)} Ω`,
      verified: Math.abs(R_eq - R_par) / Math.max(R_par, 1) < 0.05,
    });

    steps.push({
      label: "Step 3 — Total Current (Ohm's Law)",
      eq: `I_total = V / R_eq\nI_total = ${V_terminal.toFixed(2)} / ${R_par.toFixed(3)}\nI_total = ${(V_terminal / R_par * 1000).toFixed(2)} mA`,
      result: `I_total = ${(I_bat * 1000).toFixed(3)} mA`,
      verified: Math.abs(V_terminal / R_par - I_bat) / Math.max(I_bat, 1e-12) < 0.05,
    });

    const branchTerms = passives
      .map((r) => {
        const I_r = (r.voltage ?? 0) / Math.max(r.value, 1e-9);
        return `I_${r.type}(${r.row},${r.col}) = ${V_terminal.toFixed(2)}/${r.value.toFixed(0)} = ${(I_r * 1000).toFixed(2)}mA`;
      })
      .join("\n");
    const branchSum = passives.reduce((s, r) => s + (r.current ?? 0), 0);

    steps.push({
      label: "Step 4 — Branch Currents (KCL verification)",
      eq: `${branchTerms}\n──────────────\nΣI_branches = ${(branchSum * 1000).toFixed(3)}mA\nI_battery = ${(I_bat * 1000).toFixed(3)}mA`,
      result: `ΣI = ${(branchSum * 1000).toFixed(3)} mA`,
      verified: Math.abs(branchSum - I_bat) / Math.max(I_bat, 1e-12) < 0.05,
    });
  } else if (topology === "rc" && caps.length > 0 && passives.length > 0) {
    const R_rc = passives.reduce((s, r) => s + r.value, 0);
    const C = caps[0].value;
    const tau = R_rc * C;
    const V_c = caps[0].capacitorVoltage ?? 0;
    const chargePercent = (V_c / Math.max(V_terminal, 0.001)) * 100;

    steps.push({
      label: "Step 2 — RC Time Constant",
      eq: `τ = R × C\nτ = ${R_rc.toFixed(0)}Ω × ${(C * 1000).toFixed(1)}mF\nτ = ${tau.toFixed(4)} s`,
      result: `τ = ${tau.toFixed(4)} s`,
    });

    steps.push({
      label: "Step 3 — Charging Equation",
      eq: `V_C(t) = V₀(1 − e^(−t/τ))\nV_C(∞) = ${V_terminal.toFixed(2)}V (fully charged)\nCurrent V_C = ${V_c.toFixed(3)}V (${chargePercent.toFixed(1)}%)`,
      result: `V_C = ${V_c.toFixed(3)} V`,
      highlight: true,
    });

    const E_stored = 0.5 * C * V_c * V_c;
    steps.push({
      label: "Step 4 — Stored Energy",
      eq: `E = ½CV²\nE = ½ × ${(C * 1000).toFixed(1)}mF × (${V_c.toFixed(3)})²\nE = ${(E_stored * 1000).toFixed(4)} mJ`,
      result: `E = ${(E_stored * 1000).toFixed(4)} mJ`,
    });
  } else {
    // Generic
    steps.push({
      label: "Step 2 — Equivalent Resistance",
      eq: `R_eq = V_battery / I_battery\nR_eq = ${V_terminal.toFixed(2)}V / ${(I_bat * 1000).toFixed(2)}mA\nR_eq = ${isFinite(R_eq) ? R_eq.toFixed(2) + "Ω" : "∞ (open circuit)"}`,
      result: `R_eq = ${isFinite(R_eq) ? R_eq.toFixed(2) + " Ω" : "∞"}`,
    });
  }

  // ── Universal: Power summary ─────────────────────────────────────────────
  steps.push({
    label: `Step ${steps.length + 1} — Power Balance`,
    eq: passives
      .slice(0, 6)
      .map(
        (r) =>
          `P_${r.type}(${r.row},${r.col}) = I²R = ${((r.current ?? 0) * 1000).toFixed(2)}mA² × ${r.value.toFixed(0)}Ω = ${(r.power ?? 0).toFixed(4)}W`
      )
      .join("\n") +
      `\n──────────────\nP_total = ${P_total.toFixed(4)}W\nP_battery = V×I = ${(V * I_bat).toFixed(4)}W`,
    result: `P_dissipated = ${P_total.toFixed(4)} W`,
    verified: Math.abs(P_total - V * I_bat) / Math.max(V * I_bat, 1e-12) < 0.05,
    highlight: true,
  });

  return steps;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const CircuitGridEquations: React.FC = () => {
  const { components, diagnostics } = useCircuitStore();

  const battery = components.find((c) => c.type === "battery");
  const topology = classifyTopology(components);
  const steps = useMemo(
    () => generateDerivation(components),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [components.map((c) => `${c.id}:${c.voltage}:${c.current}:${c.capacitorVoltage}`).join(",")]
  );

  const topologyLabels: Record<string, { label: string; color: string }> = {
    series: { label: "Series Circuit", color: "#8b5cf6" },
    parallel: { label: "Parallel Circuit", color: "#3b82f6" },
    mixed: { label: "Mixed Topology", color: "#f59e0b" },
    rc: { label: "RC Transient Circuit", color: "#a78bfa" },
    empty: { label: "No Circuit", color: "#6b7280" },
    open: { label: "Open Circuit — No Current", color: "#ef4444" },
  };

  const topo = topologyLabels[topology] ?? { label: topology, color: "#fff" };

  if (!battery) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <div className="text-3xl opacity-30">⚡</div>
        <p className="text-[13px] text-white/30 font-mono">
          Place a battery to see live equations
        </p>
      </div>
    );
  }

  const errorDiags = diagnostics.filter((d) => d.severity === "error");
  const warnDiags = diagnostics.filter((d) => d.severity === "warning");

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white tracking-tight">
            Live Derivation
          </h3>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            Step-by-step circuit analysis • updates in real time
          </p>
        </div>
        <span
          className="text-[10px] font-black px-2.5 py-1 rounded-full border font-mono uppercase tracking-wider"
          style={{ color: topo.color, borderColor: topo.color + "50", background: topo.color + "15" }}
        >
          {topo.label}
        </span>
      </div>

      {/* Diagnostics inline */}
      {errorDiags.map((d, i) => (
        <div
          key={i}
          className="flex gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/8 text-[11px] font-mono text-rose-300 leading-relaxed"
        >
          <span className="shrink-0 text-rose-400">⚠</span>
          {d.message}
        </div>
      ))}
      {warnDiags.map((d, i) => (
        <div
          key={i}
          className="flex gap-2 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/8 text-[11px] font-mono text-yellow-300 leading-relaxed"
        >
          <span className="shrink-0 text-yellow-400">ℹ</span>
          {d.message}
        </div>
      ))}

      {/* Derivation steps */}
      {steps.length > 0 ? (
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <EqBlock
              key={i}
              label={step.label}
              eq={step.eq}
              result={step.result}
              verified={step.verified}
              highlight={step.highlight}
            />
          ))}
        </div>
      ) : topology === "open" ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 p-4 text-[12px] font-mono text-rose-300">
          <p className="font-bold mb-1">Open Circuit Detected</p>
          <p className="text-white/50">
            No current flows. The circuit path from battery (+) to battery (−)
            is not complete. Check that all components are wired in a closed loop.
          </p>
        </div>
      ) : null}

      {/* Formula Reference */}
      <div className="mt-2 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-2">
          Formula Reference
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          {[
            ["Ohm's Law", "V = IR"],
            ["Series R", "R_t = R₁+R₂+…"],
            ["Parallel R", "1/R_t = Σ1/Rᵢ"],
            ["Power", "P = IV = I²R = V²/R"],
            ["KCL", "ΣI_in = ΣI_out"],
            ["KVL", "ΣV_loop = 0"],
            ["RC charge", "Vc = V₀(1−e^(−t/τ))"],
            ["RC τ", "τ = RC"],
          ].map(([label, formula]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-white/25 text-[8px] uppercase tracking-wider">
                {label}
              </span>
              <code className="text-blue-300">{formula}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

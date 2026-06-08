"use client";
import React from "react";

function Formula({ tex, block = false }: { tex: string; block?: boolean }) {
  return block
    ? <div className="my-4 py-3 px-4 rounded-xl bg-white/3 border border-white/5 text-center font-mono text-sm text-blue-200 tracking-wide overflow-x-auto">{tex}</div>
    : <code className="px-1.5 py-0.5 rounded bg-white/5 text-blue-300 font-mono text-sm">{tex}</code>;
}

function Section({ title, color = "#3b82f6", children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ background: color }} />
        <h3 className="text-base font-bold text-white/90 tracking-tight">{title}</h3>
      </div>
      <div className="pl-4 flex flex-col gap-3 text-sm text-white/60 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Derive({ steps }: { steps: { eq: string; note: string }[] }) {
  return (
    <div className="flex flex-col gap-0 border border-white/8 rounded-xl overflow-hidden">
      {steps.map((s, i) => (
        <div key={i} className={`flex items-start gap-4 p-3 ${i % 2 === 0 ? "bg-white/2" : "bg-white/1"}`}>
          <code className="text-blue-300 font-mono text-xs min-w-0 flex-1 whitespace-pre-wrap break-all">{s.eq}</code>
          <span className="text-white/30 text-[11px] min-w-[140px] text-right shrink-0">{s.note}</span>
        </div>
      ))}
    </div>
  );
}

function Table({ rows, headers }: { rows: (string | number)[][]; headers: string[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8">
      <table className="w-full text-[12px] font-mono">
        <thead>
          <tr className="bg-white/5">
            {headers.map((h) => (
              <th key={h} className="py-2 px-3 text-left text-white/50 font-bold uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white/2" : ""}>
              {row.map((cell, j) => <td key={j} className="py-1.5 px-3 text-white/70">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoBox({ type, children }: { type: "info" | "warning" | "key"; children: React.ReactNode }) {
  const styles = {
    info:    { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  icon: "ℹ", color: "#93c5fd" },
    warning: { bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  icon: "⚠", color: "#fcd34d" },
    key:     { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  icon: "🔑", color: "#6ee7b7" },
  };
  const s = styles[type];
  return (
    <div className="flex gap-3 p-3 rounded-xl text-[13px] leading-relaxed" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-base shrink-0">{s.icon}</span>
      <div style={{ color: s.color }}>{children}</div>
    </div>
  );
}

export const CircuitGridTheory: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 pb-10 max-w-3xl">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-white tracking-tight">Electric Circuits — Complete Theory</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          A comprehensive derivation of circuit analysis: Ohm's Law, Kirchhoff's Laws, series and parallel networks,
          power dissipation, RC transients, and the Modified Nodal Analysis (MNA) solver used by this simulation.
        </p>
      </div>

      {/* 1. Electric Potential & Voltage */}
      <Section title="1. Electric Potential & Voltage" color="#10b981">
        <p>
          Voltage is the difference in electric potential energy per unit charge between two points in a circuit.
          It acts as the "pressure" that drives charge through conductors.
        </p>
        <Formula tex="V = ΔU_e / q     [Unit: Volt = J/C]" block />
        <Table
          headers={["Concept", "Analogy", "Equation"]}
          rows={[
            ["Voltage (V)", "Water pressure (Pa)", "V = W/q"],
            ["Current (I)", "Flow rate (L/s)", "I = dq/dt"],
            ["Resistance (R)", "Pipe narrowing", "R = V/I"],
            ["Power (P)", "Pump power (W)", "P = IV"],
          ]}
        />
        <InfoBox type="info">
          The SI unit of voltage is the <strong>Volt (V = J/C)</strong>. A battery maintains a constant potential
          difference between its terminals by converting chemical energy to electrical energy.
        </InfoBox>
      </Section>

      {/* 2. Ohm's Law */}
      <Section title="2. Ohm's Law & Resistance" color="#f59e0b">
        <p>
          Ohm's Law states that the current through a conductor is directly proportional to the voltage across it,
          provided temperature remains constant:
        </p>
        <Formula tex="V = I R     ↔     I = V/R     ↔     R = V/I" block />
        <p>
          At the microscopic level (Drude model), conduction electrons are accelerated by the electric field
          and scattered by lattice ions, giving rise to resistivity:
        </p>
        <Derive steps={[
          { eq: "E-field accelerates electrons:  a = eE/mₑ",           note: "Drude model" },
          { eq: "Average drift velocity:         v_d = aτ = eEτ/mₑ",   note: "τ = relaxation time" },
          { eq: "Current density:               J = nev_d = (ne²τ/mₑ)E", note: "J = σE" },
          { eq: "Conductivity:                   σ = ne²τ/mₑ",          note: "→ R = ρL/A" },
        ]} />
        <Table
          headers={["Material", "Resistivity ρ (Ω·m)", "Type"]}
          rows={[
            ["Silver", "1.59×10⁻⁸", "Conductor"],
            ["Copper", "1.72×10⁻⁸", "Conductor"],
            ["Silicon", "6.4×10²", "Semiconductor"],
            ["Glass", "10¹⁰–10¹⁴", "Insulator"],
            ["Nichrome", "1.10×10⁻⁶", "Resistor alloy"],
          ]}
        />
        <InfoBox type="warning">
          Ohm's Law is a <em>material property</em>, not a universal law. Diodes, transistors, and light bulbs
          with temperature-dependent resistance are <strong>non-ohmic</strong> — their I-V curve is nonlinear.
        </InfoBox>
      </Section>

      {/* 3. Kirchhoff's Laws */}
      <Section title="3. Kirchhoff's Laws (KCL & KVL)" color="#ef4444">
        <p>
          Kirchhoff's laws are consequences of charge conservation (KCL) and energy conservation (KVL).
          Together they allow analysis of any arbitrary circuit network.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2">KCL — Current Law</div>
            <Formula tex="Σ I_in = Σ I_out" />
            <p className="text-[12px] text-white/50 mt-2">
              At any node, the algebraic sum of currents is zero. Charge is conserved — it cannot accumulate
              at a junction.
            </p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2">KVL — Voltage Law</div>
            <Formula tex="Σ V_k = 0 (around loop)" />
            <p className="text-[12px] text-white/50 mt-2">
              Around any closed loop, the sum of potential drops equals the sum of EMFs. The electric field
              is conservative.
            </p>
          </div>
        </div>
        <InfoBox type="key">
          A circuit with <strong>n nodes and b branches</strong> has exactly <strong>n−1 independent KCL equations</strong> and
          <strong> b−n+1 independent KVL equations</strong>. Together these fully determine all unknowns.
        </InfoBox>
      </Section>

      {/* 4. Series & Parallel */}
      <Section title="4. Series & Parallel Resistor Networks" color="#8b5cf6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Series</div>
            <Formula tex="R_total = R₁ + R₂ + … + Rₙ" />
            <Formula tex="I_same = V_total / R_total" />
            <p className="text-[12px] text-white/50">Same current, voltages add. R_total always larger than any single R.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Parallel</div>
            <Formula tex="1/R_total = 1/R₁ + 1/R₂ + … + 1/Rₙ" />
            <Formula tex="V_same = I_total × R_total" />
            <p className="text-[12px] text-white/50">Same voltage, currents add. R_total always smaller than any single R.</p>
          </div>
        </div>
        <Table
          headers={["Config", "R_eq formula", "Example (100Ω, 200Ω)", "R_eq"]}
          rows={[
            ["Series",   "R₁ + R₂",           "100 + 200",       "300 Ω"],
            ["Parallel", "R₁R₂/(R₁+R₂)",      "100×200/300",     "66.7 Ω"],
            ["3 equal (series)",  "3R",         "3×100",           "300 Ω"],
            ["3 equal (parallel)", "R/3",       "100/3",           "33.3 Ω"],
          ]}
        />
      </Section>

      {/* 5. Power & Joule Heating */}
      <Section title="5. Power & Joule Heating" color="#f97316">
        <p>
          When current flows through a resistor, electrical energy is converted to heat (Joule heating).
          The power dissipated is:
        </p>
        <Formula tex="P = IV = I²R = V²/R     [Unit: Watt = J/s]" block />
        <Derive steps={[
          { eq: "Work done moving charge dq through voltage V:  dW = V dq", note: "definition" },
          { eq: "Power = dW/dt = V × dq/dt = V × I",             note: "P = IV" },
          { eq: "Substitute V = IR:  P = I²R",                    note: "Joule heating" },
          { eq: "Substitute I = V/R:  P = V²/R",                 note: "alternative" },
        ]} />
        <Table
          headers={["Component", "Power Formula", "Energy Form"]}
          rows={[
            ["Resistor",   "P = I²R",   "Heat (Joule)"],
            ["Battery",    "P = IV_emf","Chemical → Electrical"],
            ["Bulb",       "P = I²R",   "Heat + Light (radiation)"],
            ["Motor",      "P = IV",    "Electrical → Mechanical"],
            ["Capacitor",  "P = 0 (DC)","Energy stored in E-field"],
          ]}
        />
        <InfoBox type="warning">
          Joule heating is the basis of incandescent bulbs, electric stoves, and fuses. A fuse melts (opens the
          circuit) when the current exceeds the rated value, protecting downstream components.
        </InfoBox>
      </Section>

      {/* 6. Capacitors & RC */}
      <Section title="6. Capacitors & RC Transients" color="#a78bfa">
        <p>
          A capacitor stores energy in an electric field between two conducting plates.
          Capacitance C relates stored charge Q to voltage V:
        </p>
        <Formula tex="Q = CV     →     C = ε₀εᵣA/d     [Unit: Farad = C/V]" block />
        <p>
          In an RC circuit, charging and discharging follow exponential transients governed by the <em>time constant τ = RC</em>:
        </p>
        <Derive steps={[
          { eq: "KVL:  V₀ - IR - Q/C = 0  →  V₀ - R(dq/dt) - q/C = 0", note: "circuit equation" },
          { eq: "Charging: Q(t) = CV₀(1 - e^(-t/RC))",                    note: "initial Q=0" },
          { eq: "Vc(t) = V₀(1 - e^(-t/τ)),  I(t) = (V₀/R)e^(-t/τ)",     note: "τ = RC" },
          { eq: "Discharging: Vc(t) = V₀e^(-t/τ)",                        note: "source removed" },
        ]} />
        <Table
          headers={["t/τ", "Vc (charging)", "Vc (discharging)"]}
          rows={[
            ["0",   "0%",   "100%"],
            ["0.5", "39.3%","60.7%"],
            ["1",   "63.2%","36.8%"],
            ["2",   "86.5%","13.5%"],
            ["3",   "95.0%","5.0%"],
            ["5",   "99.3%","0.7%"],
          ]}
        />
        <InfoBox type="info">
          After <strong>5τ</strong>, a capacitor is considered fully charged (99.3%). RC circuits are used in
          timer circuits, audio filters, and signal coupling.
        </InfoBox>
      </Section>

      {/* 7. Modified Nodal Analysis */}
      <Section title="7. Modified Nodal Analysis (MNA)" color="#22d3ee">
        <p>
          This simulation uses <strong>Modified Nodal Analysis (MNA)</strong> to solve arbitrary circuits in real time.
          The method formulates a linear system of equations using KCL at every non-reference node.
        </p>
        <Formula tex="[G  B] [v]   [j]" block />
        <Formula tex="[Bᵀ D] [i] = [e]" block />
        <Derive steps={[
          { eq: "1. Choose reference (ground) node → set V_ground = 0",       note: "removes one DOF" },
          { eq: "2. Apply KCL at each remaining node: Σ(V_n - V_k)/R_nk = 0", note: "conductance stamp" },
          { eq: "3. Stamp battery: V_+ - V_- = V_emf  (constraint eq.)",      note: "voltage source" },
          { eq: "4. Build G matrix: G_ii = Σ conductances at node i",          note: "diagonal" },
          { eq: "5. Solve Ax = b with Gaussian elimination",                   note: "LU decomposition" },
          { eq: "6. Extract I_branch = (V_n1 - V_n2) / R_branch",             note: "Ohm's Law" },
        ]} />
        <InfoBox type="key">
          MNA is used in industrial SPICE circuit simulators. It handles any topology including voltage sources,
          dependent sources, and nonlinear elements via Newton-Raphson iteration.
        </InfoBox>
      </Section>

      {/* 8. Bulb & LED Physics */}
      <Section title="8. Light Bulb & LED Physics" color="#fbbf24">
        <p>
          <strong>Incandescent bulbs</strong> emit light via blackbody radiation when the tungsten filament
          is heated to ~2700K by Joule heating. Efficiency is very low (~5% visible light).
        </p>
        <p>
          <strong>LEDs</strong> (Light-Emitting Diodes) emit photons via electroluminescence — electrons
          recombine with holes across a p-n junction, releasing energy as photons with energy:
        </p>
        <Formula tex="E_photon = hf = hc/λ     (λ determines color)" block />
        <Table
          headers={["LED Color", "Wavelength (nm)", "Vf (forward voltage)", "Energy Gap"]}
          rows={[
            ["Red",    "625–740", "1.8–2.1 V", "1.8–2.0 eV"],
            ["Green",  "520–560", "2.0–2.2 V", "2.1–2.4 eV"],
            ["Blue",   "450–490", "2.7–3.5 V", "2.7–3.5 eV"],
            ["White",  "broad",   "3.0–3.5 V", "~3.0 eV (YAG phosphor)"],
          ]}
        />
        <InfoBox type="key">
          LEDs are ~20× more efficient than incandescent bulbs. A 10W LED produces the same luminous flux as a
          ~150W incandescent. This is why LEDs have replaced traditional lighting.
        </InfoBox>
      </Section>

      {/* 9. Wheatstone Bridge */}
      <Section title="9. Wheatstone Bridge" color="#ec4899">
        <p>
          The Wheatstone bridge is a circuit for precisely measuring unknown resistances by balancing two
          parallel branches of a voltage divider:
        </p>
        <Formula tex="Balance condition: R₁/R₂ = R₃/R₄  →  V_meter = 0" block />
        <p>
          When balanced, no current flows through the meter, and the unknown resistance R₄ can be determined from:
        </p>
        <Formula tex="R₄ = R₃ × (R₂/R₁)" block />
        <InfoBox type="info">
          Wheatstone bridges are used in strain gauges, temperature sensors (RTDs), and pressure sensors.
          Modern digital multimeters use bridge circuits internally for precision measurements.
        </InfoBox>
      </Section>

    </div>
  );
};

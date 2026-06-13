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

function Table({ rows, headers }: { rows: (string | React.ReactNode)[][]; headers: string[] }) {
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
        <h2 className="text-2xl font-black text-white tracking-tight">Electric Circuits — Engineering Theory</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          A rigorous derivation of circuit analysis bridging physics and electrical engineering. Covers fundamental laws, real-world component imperfections, and the Modified Nodal Analysis (MNA) solver that powers this simulation.
        </p>
      </div>

      {/* 1. Electric Potential & Voltage */}
      <Section title="1. Electric Potential, EMF, & Voltage" color="#10b981">
        <p>
          <strong>Electric Potential ($V$)</strong> is the electric potential energy ($U$) per unit charge at a specific location in space.
        </p>
        <Formula tex="V = U / q     [Unit: Volt = J/C]" block />
        <p>
          It is critical to distinguish between two closely related concepts:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Electromotive Force (EMF, {"$\\mathcal{E}$"}):</strong> The work done per unit charge by a non-electrical source (like chemical reactions in a battery) to move charge from low to high potential.</li>
          <li><strong>Potential Difference ({"$\\Delta V$"}):</strong> The change in potential energy per unit charge as it moves through an electric field. Often casually called "Voltage Drop" across a component.</li>
        </ul>
        <InfoBox type="key">
          A 9V battery has an EMF of 9V. It converts 9 Joules of chemical energy into electrical energy for every 1 Coulomb of charge it pumps to the positive terminal.
        </InfoBox>
      </Section>

      {/* 2. Electric Current */}
      <Section title="2. Electric Current & Charge Transport" color="#3b82f6">
        <p>
          <strong>Electric Current ($I$)</strong> is the macroscopic rate of charge flow through a cross-section.
        </p>
        <Formula tex="I = dq / dt     [Unit: Ampere = C/s]" block />
        <p>
          By convention, established by Benjamin Franklin before the discovery of the electron, <strong>Conventional Current</strong> is defined as the flow of <em>positive</em> charge (moving from + to -). In metallic conductors, the actual physical charge carriers are electrons, which move in the opposite direction (<strong>Electron Flow</strong>). Circuit analysis exclusively uses Conventional Current.
        </p>
        <InfoBox type="warning">
          <strong>MISCONCEPTION ALERT: Drift Velocity vs Signal Speed</strong><br/><br/>
          Students often believe electrons zip around a circuit instantly. In reality, electrons collide constantly with lattice ions. Their average macroscopic speed (<strong>Drift Velocity</strong>, $v_d$) is extremely slow:
          <br/><br/>
          <Formula tex="v_d = I / (n A q) ≈ 0.1 \text{ mm/s}" />
          <br/><br/>
          It would take an electron roughly an hour to travel 1 meter down a wire! However, the <strong>electric field</strong> (the signal) propagates through the wire at nearly the speed of light ($c$). This is why a lightbulb turns on instantly.
        </InfoBox>
      </Section>

      {/* 3. Ohm's Law & Real Resistance */}
      <Section title="3. Ohm's Law & Temperature Dependence" color="#f59e0b">
        <p>
          Ohm's Law states that current is proportional to voltage across an <em>Ohmic</em> material.
        </p>
        <Formula tex="\Delta V = I R     ↔     I = \Delta V/R     ↔     R = \Delta V/I" block />
        <p>
          At the microscopic level (Drude model), electrons are accelerated by the electric field and scattered by lattice ions:
        </p>
        <Derive steps={[
          { eq: "E-field accelerates electrons:  a = eE/mₑ",           note: "Drude model" },
          { eq: "Average drift velocity:         v_d = eEτ/mₑ",   note: "τ = mean collision time" },
          { eq: "Current density:               J = nev_d = (ne²τ/mₑ)E", note: "J = σE (Microscopic Ohm's Law)" },
        ]} />
        <p className="mt-4 border-t border-white/10 pt-4">
          <strong>Non-Ideal Behavior: Temperature Coefficient</strong><br/>
          Ohm's Law is a material approximation, not a universal law like gravity. As a conductor heats up, lattice vibrations increase, causing more frequent electron collisions ($\tau$ decreases). The resistance changes according to:
        </p>
        <Formula tex="R(T) = R₀ [1 + \alpha (T - T₀)]" block />
        <InfoBox type="key">
          Incandescent bulbs are highly <strong>non-ohmic</strong>. A tungsten bulb ({"$\\alpha \\approx 0.0045 \\text{ K}^{-1}$"}) might have {"$10\\Omega$"} resistance at room temperature, but {"$150\\Omega$"} when glowing at {"$2700\\text{ K}$"}. This simulator actively models this nonlinear thermal dynamic.
        </InfoBox>
      </Section>

      {/* 4. Real Batteries & Internal Resistance */}
      <Section title="4. Real Batteries & Internal Resistance" color="#ef4444">
        <p>
          An ideal voltage source supplies constant voltage regardless of current. Real batteries are fundamentally limited by the chemical reaction rate and internal structure, modeled as an <strong>Internal Resistance ({"$r_{int}$"})</strong> in series with an ideal EMF ({"$\\mathcal{E}$"}).
        </p>
        <Formula tex="V_{terminal} = \mathcal{E} - I \cdot r_{int}" block />
        <p>
          As the current demand ($I$) increases, the voltage drop across the internal resistance increases, causing the terminal voltage available to the circuit to "sag".
        </p>
        <InfoBox type="warning">
          <strong>MISCONCEPTION ALERT: Short Circuits</strong><br/>
          If you short-circuit an ideal battery ({"$R_{load} \\to 0$"}), Ohm's Law predicts infinite current ({"$I = V/0$"}). In reality, a short circuit current is safely capped by the internal resistance: {"$I_{short} = \\mathcal{E} / r_{int}$"}. However, this generates massive internal Joule heating ({"$P = I^2 r_{int}$"}), which can cause the battery to catastrophically fail or catch fire.
        </InfoBox>
      </Section>

      {/* 5. Kirchhoff's Laws (KCL & KVL) */}
      <Section title="5. Kirchhoff's Laws (KCL & KVL)" color="#8b5cf6">
        <p>
          Kirchhoff's laws are direct consequences of fundamental physics conservation laws. They are the absolute foundation of all circuit analysis algorithms.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2">KCL — Charge Conservation</div>
            <Formula tex="\sum I_{in} = \sum I_{out}" />
            <p className="text-[12px] text-white/50 mt-2">
              At any node, the algebraic sum of currents is zero. Charge cannot be created or destroyed, nor can it accumulate at a junction ($\partial \rho / \partial t = 0$).
            </p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2">KVL — Energy Conservation</div>
            <Formula tex="\sum \Delta V_k = 0 \text{ (around closed loop)}" />
            <p className="text-[12px] text-white/50 mt-2">
              Around any closed loop, the sum of potential drops equals the sum of EMFs. The electrostatic field is conservative ({"$\\oint \\vec{E} \\cdot d\\vec{l} = 0$"}).
            </p>
          </div>
        </div>
        <InfoBox type="warning">
          <strong>MISCONCEPTION ALERT: "Used Up" Current</strong><br/>
          Students often believe a resistor "consumes" current, so less current comes out than goes in. <strong>KCL mathematically proves this is false.</strong> Current is exactly the same on both sides of a resistor. The resistor consumes <em>energy</em> (voltage drops), not charge (current).
        </InfoBox>
      </Section>

      {/* 6. Series, Parallel & Divider Rules */}
      <Section title="6. Topology & Divider Rules" color="#ec4899">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-black text-pink-400 uppercase tracking-widest">Series (Same Current)</div>
            <Formula tex="R_{eq} = R_1 + R_2 + … + R_n" />
            <div className="text-[10px] font-bold text-white/30 uppercase mt-2">Voltage Divider Rule:</div>
            <Formula tex="V_x = V_{total} \left( \frac{R_x}{R_{eq}} \right)" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-black text-pink-400 uppercase tracking-widest">Parallel (Same Voltage)</div>
            <Formula tex="\frac{1}{R_{eq}} = \frac{1}{R_1} + \frac{1}{R_2} + …" />
            <div className="text-[10px] font-bold text-white/30 uppercase mt-2">Current Divider Rule (2 paths):</div>
            <Formula tex="I_1 = I_{total} \left( \frac{R_2}{R_1 + R_2} \right)" />
          </div>
        </div>
      </Section>

      {/* 7. Power & Joule Heating */}
      <Section title="7. Power & Joule Heating" color="#f97316">
        <p>
          When current flows through a resistance, electrical potential energy is converted into thermal energy (Joule Heating).
        </p>
        <Formula tex="P = I \Delta V = I^2 R = \frac{\Delta V^2}{R}     [Unit: Watt = J/s]" block />
        <Derive steps={[
          { eq: "Work done moving charge dq through voltage V:  dW = V dq", note: "definition" },
          { eq: "Power = dW/dt = V \cdot (dq/dt) = V I",             note: "P = IV" },
          { eq: "Substitute V = IR (Ohm's Law):  P = I²R",                    note: "Joule heating" },
        ]} />
        <InfoBox type="key">
          <strong>Power vs Energy:</strong> Power is a <em>rate</em> (Joules per second). Energy is an <em>amount</em>. Total energy dissipated over time is $E = P \cdot t$, measured in Joules (or kWh on your electrical bill).
        </InfoBox>
      </Section>

      {/* 8. Non-Ideal Meters */}
      <Section title="8. Measurement & Non-Ideal Meters" color="#14b8a6">
        <p>
          Measuring a circuit inherently alters it. Real-world measurement devices are not perfectly "invisible".
        </p>
        <Table
          headers={["Device", "Ideal", "Real World", "Connection", "Consequence if misused"]}
          rows={[
            ["Ammeter", "$R = 0\Omega$", "$R \approx 0.1\Omega$ to $1\Omega$", "Series", "If placed in parallel, acts as a short circuit and blows the meter's fuse."],
            ["Voltmeter", "$R \to \infty$", "$R \approx 1\text{ M}\Omega$ to $10\text{ M}\Omega$", "Parallel", "If placed in series, acts as a near-open circuit, stopping all current."],
          ]}
        />
      </Section>

      {/* 9. Capacitors & RC */}
      <Section title="9. Capacitors & RC Transients" color="#a78bfa">
        <p>
          A capacitor stores energy in an electric field between two conducting plates separated by a dielectric.
        </p>
        <Formula tex="Q = C V     \text{ and }     E_{stored} = \frac{1}{2}CV^2     [Unit: Farad = C/V]" block />
        <p>
          In an RC circuit, voltages and currents do not change instantly. They follow exponential transients governed by the time constant $\tau = RC$.
        </p>
        <Derive steps={[
          { eq: "KVL:  V_0 - I R - V_c = 0  →  V_0 - R(dq/dt) - q/C = 0", note: "differential equation" },
          { eq: "Charging: V_c(t) = V_0(1 - e^{-t/\tau})",                    note: "voltage rises" },
          { eq: "Discharging: V_c(t) = V_0 e^{-t/\tau}",                        note: "source removed" },
          { eq: "Discharging Current: I(t) = -(V_0/R) e^{-t/\tau}",                        note: "negative = reverse flow" },
        ]} />
      </Section>

      {/* 10. Modified Nodal Analysis */}
      <Section title="10. Computational Solver: MNA" color="#64748b">
        <p>
          This simulator uses <strong>Modified Nodal Analysis (MNA)</strong>, the algorithm behind professional SPICE simulators, to solve the circuit in real-time.
        </p>
        <p className="mb-2">MNA constructs a system of linear equations from KCL at every node, expanding the standard conductance matrix to include voltage constraints (like batteries).</p>
        <Formula tex="\begin{bmatrix} G & B \\ B^T & D \end{bmatrix} \begin{bmatrix} v \\ i \end{bmatrix} = \begin{bmatrix} j \\ e \end{bmatrix}" block />
        <ul className="list-disc pl-5 space-y-1 text-sm text-white/60 mb-4">
          <li><strong>G</strong>: Conductance matrix (from $1/R$)</li>
          <li><strong>B</strong>: Voltage source connection incidence matrix</li>
          <li><strong>v</strong>: Unknown node voltage vector</li>
          <li><strong>i</strong>: Unknown branch current vector (through batteries)</li>
        </ul>
        <p>The simulator performs an <strong>LU Decomposition</strong> with partial pivoting on this matrix every frame to calculate precisely accurate currents and voltages for any arbitrary circuit graph.</p>
      </Section>

    </div>
  );
};

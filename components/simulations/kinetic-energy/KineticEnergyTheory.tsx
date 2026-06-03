"use client";
import React from "react";

// KaTeX-style inline formula renderer using SVG/Unicode math
function Formula({ tex, block = false }: { tex: string; block?: boolean }) {
  return block
    ? <div className="my-4 py-3 px-4 rounded-xl bg-white/3 border border-white/5 text-center font-mono text-base text-blue-200 tracking-wide overflow-x-auto">{tex}</div>
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
            {headers.map(h => (
              <th key={h} className="py-2 px-3 text-left text-white/50 font-bold uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white/2" : ""}>
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 px-3 text-white/70">{cell}</td>
              ))}
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

export const KineticEnergyTheory: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 pb-10 max-w-3xl">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-white tracking-tight">Kinetic Energy — Full Theory</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          A complete derivation of kinetic energy from Newton's second law through relativistic mechanics, rotational dynamics, and energy conservation.
        </p>
      </div>

      {/* 1. Work-Energy Theorem */}
      <Section title="1. Work-Energy Theorem" color="#3b82f6">
        <p>
          The work-energy theorem is the foundation. It states that the net work done on an object equals the change in its kinetic energy.
        </p>
        <Derive steps={[
          { eq: "F = ma                         (Newton's 2nd Law)", note: "starting point" },
          { eq: "F = m · dv/dt                  (a = dv/dt)", note: "chain rule" },
          { eq: "F = m · (dv/dx)(dx/dt) = m · v · dv/dx", note: "v = dx/dt" },
          { eq: "F dx = m v dv                  (multiply by dx)", note: "separating" },
          { eq: "W = ∫F dx = m∫v dv = ½mv²|v₀ᵛ", note: "integrate both sides" },
          { eq: "W = ½mv² - ½mv₀² = ΔKE        ✓", note: "Work-Energy Theorem" },
        ]} />
        <Formula tex="W_net = ΔKE = ½mv² - ½mv₀²" block />
        <InfoBox type="key">
          Work is defined as the dot product of force and displacement: <strong>W = F·d·cosθ</strong>. 
          When the net force is zero, work is zero and kinetic energy is conserved.
        </InfoBox>
      </Section>

      {/* 2. Why v² — The Quadratic Relationship */}
      <Section title="2. Why KE Depends on v² (Not v)" color="#f59e0b">
        <p>
          The quadratic relationship between velocity and kinetic energy is one of the most important and counterintuitive results in classical mechanics.
        </p>
        <InfoBox type="warning">
          Doubling the velocity <strong>quadruples</strong> the kinetic energy. This is why highway speeds are so much more dangerous than city speeds.
        </InfoBox>
        <Table
          headers={["v (m/s)", "KE (m=1 kg)", "Ratio vs v=1", "Notes"]}
          rows={[
            ["1",  "0.5 J",    "1×",    "baseline"],
            ["2",  "2 J",      "4×",    "2× speed → 4× KE"],
            ["3",  "4.5 J",    "9×",    "3× speed → 9× KE"],
            ["5",  "12.5 J",   "25×",   "car city speed"],
            ["10", "50 J",     "100×",  "highway speed"],
            ["20", "200 J",    "400×",  "race car"],
            ["30", "450 J",    "900×",  "bullet train"],
          ]}
        />
        <p>
          The parabolic KE–v curve means stopping distance <em>also</em> scales with v²: braking force × distance = ½mv².
          At double the speed, you need <strong>4× the distance</strong> to stop.
        </p>
        <Formula tex="d_stop = mv² / (2μmg) = v² / (2μg)" block />
      </Section>

      {/* 3. Conservation of Energy */}
      <Section title="3. Conservation of Mechanical Energy" color="#10b981">
        <p>
          In a closed system with only conservative forces (gravity, springs), total mechanical energy is constant:
        </p>
        <Formula tex="E_total = KE + PE = ½mv² + mgh = constant" block />
        <Derive steps={[
          { eq: "At top of ramp:     KE₁=0, PE₁=mgh", note: "all potential" },
          { eq: "At bottom of ramp:  KE₂=½mv², PE₂=0", note: "all kinetic" },
          { eq: "E_total: mgh = ½mv²", note: "conservation" },
          { eq: "v = √(2gh)", note: "ramp exit speed" },
        ]} />
        <Table
          headers={["Height h (m)", "Speed at bottom (m/s)", "KE (m=1 kg)"]}
          rows={[
            ["1",   "4.43",  "9.8 J"],
            ["5",   "9.90",  "49 J"],
            ["10",  "14.00", "98 J"],
            ["20",  "19.80", "196 J"],
            ["100", "44.30", "981 J"],
          ]}
        />
        <InfoBox type="info">
          Non-conservative forces like friction convert mechanical energy into <strong>thermal energy</strong> (heat). 
          Total energy including heat is still conserved — just not recoverable as mechanical work.
        </InfoBox>
      </Section>

      {/* 4. Momentum vs KE */}
      <Section title="4. Momentum vs Kinetic Energy" color="#ec4899">
        <p>
          Momentum and kinetic energy are related but measure different things. Momentum <Formula tex="p = mv" /> is a vector; KE is a scalar.
        </p>
        <Formula tex="KE = p² / (2m) = ½mv²" block />
        <Table
          headers={["Quantity", "Formula", "Vector?", "Conserved in collision?"]}
          rows={[
            ["Momentum p",    "mv",   "Yes", "Always (Newton's 3rd Law)"],
            ["KE",            "½mv²", "No",  "Only in elastic collisions"],
            ["Total Energy",  "KE+PE", "No", "Always (1st Law of Thermo)"],
          ]}
        />
        <p>
          In an elastic collision: both momentum and KE are conserved. 
          In a perfectly inelastic collision: only momentum is conserved; maximum KE is lost (objects stick together).
        </p>
        <Derive steps={[
          { eq: "m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'", note: "momentum conservation" },
          { eq: "½m₁v₁² + ½m₂v₂² = ½m₁v₁'² + ½m₂v₂'²", note: "KE conservation (elastic)" },
          { eq: "v₁' = ((m₁-m₂)v₁ + 2m₂v₂)/(m₁+m₂)", note: "elastic solution" },
          { eq: "v₂' = ((m₂-m₁)v₂ + 2m₁v₁)/(m₁+m₂)", note: "" },
        ]} />
      </Section>

      {/* 5. Rotational KE */}
      <Section title="5. Rotational Kinetic Energy" color="#8b5cf6">
        <p>
          Rotating objects store kinetic energy in their rotation. The rotational analog of mass is the <strong>moment of inertia</strong> I, and of velocity is <strong>angular velocity ω</strong> (rad/s).
        </p>
        <Formula tex="KE_rot = ½Iω²" block />
        <p>
          The moment of inertia depends on how mass is distributed relative to the rotation axis. Mass farther from the axis contributes more (scales with r²):
        </p>
        <Table
          headers={["Shape", "Moment of Inertia I", "Physical Example"]}
          rows={[
            ["Point mass",      "mr²",          "Ball on a string"],
            ["Solid disk",      "½mr²",         "Coin, wheel"],
            ["Ring/hoop",       "mr²",          "Bicycle rim"],
            ["Solid sphere",    "²⁄₅mr²",       "Pool ball"],
            ["Hollow sphere",   "²⁄₃mr²",       "Hollow globe"],
            ["Thin rod (end)",  "¹⁄₃ml²",       "Clock hand"],
            ["Thin rod (center)","¹⁄₁₂ml²",    "Propeller blade"],
          ]}
        />
        <InfoBox type="key">
          A rolling object has <em>both</em> translational and rotational KE:
          <br /><strong>KE_total = ½mv² + ½Iω²</strong>
          <br />For a solid sphere rolling without slipping: KE_total = ⁷⁄₁₀mv²
        </InfoBox>
      </Section>

      {/* 6. Relativistic KE */}
      <Section title="6. Relativistic Kinetic Energy" color="#ef4444">
        <p>
          At speeds approaching the speed of light <Formula tex="c = 3×10⁸ m/s" />, the classical formula fails. Einstein's special relativity gives:
        </p>
        <Formula tex="KE_rel = (γ - 1)mc²    where  γ = 1/√(1 - v²/c²)" block />
        <Table
          headers={["v/c", "γ (Lorentz factor)", "KE_rel / KE_classical"]}
          rows={[
            ["0.01", "1.00005", "1.000050   (nearly equal)"],
            ["0.10", "1.005",   "1.005      (+0.5%)"],
            ["0.50", "1.155",   "1.155      (+15.5%)"],
            ["0.90", "2.294",   "2.294      (2.3× classical)"],
            ["0.99", "7.089",   "7.089      (7× classical)"],
            ["0.999","22.37",   "22.37      (22× classical)"],
            ["1.000","∞",       "∞          (impossible)"],
          ]}
        />
        <Derive steps={[
          { eq: "As v → 0:  γ → 1 + v²/(2c²) + ...", note: "Taylor expansion" },
          { eq: "KE = (γ-1)mc² → mc²·v²/(2c²) = ½mv²", note: "classical limit recovered ✓" },
        ]} />
        <InfoBox type="warning">
          No object with mass can reach <em>c</em>. As v → c, the energy required → ∞. 
          This is why particle accelerators are so expensive!
        </InfoBox>
      </Section>

      {/* 7. Power */}
      <Section title="7. Power and Energy Dissipation" color="#f97316">
        <p>
          Power is the rate of energy transfer:
        </p>
        <Formula tex="P = dW/dt = F·v  (W = J/s)" block />
        <Table
          headers={["Power", "Example", "Energy in 1 hour"]}
          rows={[
            ["1 W",   "Smartphone charging",    "3,600 J"],
            ["100 W", "Incandescent light bulb", "360 kJ"],
            ["1 kW",  "Small electric motor",   "3.6 MJ"],
            ["100 kW","Electric car motor",      "360 MJ"],
            ["1 MW",  "Jet engine",              "3.6 GJ"],
            ["1 GW",  "Nuclear power plant",    "3.6 TJ"],
          ]}
        />
        <InfoBox type="info">
          <strong>Energy dissipation</strong> via friction converts KE to heat at rate P = f·v, where f is the friction force. 
          This is why engines need cooling systems.
        </InfoBox>
      </Section>

    </div>
  );
};

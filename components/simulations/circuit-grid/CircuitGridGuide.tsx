"use client";
import React from "react";

function GuideStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
        <span className="text-[12px] font-black text-blue-400">{n}</span>
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="text-[13px] font-bold text-white/90">{title}</div>
        <div className="text-[12px] text-white/50 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function TipCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-white/8 bg-white/2">
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <div className="text-[12px] font-bold text-white/80 mb-1">{title}</div>
        <div className="text-[11px] text-white/45 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ShortcutRow({ key: k, desc }: { key: string; desc: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-[11px] font-mono text-white/50">{desc}</span>
      <kbd className="px-2 py-1 rounded bg-white/8 border border-white/10 text-[10px] font-mono text-white/60">{k}</kbd>
    </div>
  );
}

export const CircuitGridGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 pb-10 max-w-2xl">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Circuit Grid — User Guide</h2>
        <p className="text-white/50 text-sm mt-2 leading-relaxed">
          Build and analyze DC circuits on an interactive grid. Wire up components, toggle switches, and watch
          voltage, current, and power update in real time using the built-in MNA solver.
        </p>
      </div>

      {/* Getting Started */}
      <div className="flex flex-col gap-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Getting Started</h3>
        <GuideStep n={1} title="Choose a Preset Circuit">
          In the Controls panel, scroll to <strong>Preset Circuits</strong> and click one (e.g., "Series" or "Parallel").
          The grid will be populated with a working circuit ready to inspect.
        </GuideStep>
        <GuideStep n={2} title="Select a Component from the Palette">
          Click any component in the <strong>Component Palette</strong> — Wire, Resistor, Battery, Bulb, LED, Switch,
          Capacitor, Voltmeter, Ammeter, or Ground.
        </GuideStep>
        <GuideStep n={3} title="Pick an Orientation">
          Use <strong>Horiz.</strong> or <strong>Vert.</strong> buttons to choose the direction the component will span.
          Wires can be dragged continuously to draw long paths.
        </GuideStep>
        <GuideStep n={4} title="Place Components on the Grid">
          Click any grid dot to place the selected component. For wires, hold and drag to draw a path.
          Right-click any component to <strong>delete it</strong> instantly.
        </GuideStep>
        <GuideStep n={5} title="Inspect & Modify Values">
          Click any placed component to open the <strong>Inspector</strong> in the Controls panel.
          Use sliders to adjust resistance, voltage, or capacitance. The solver re-runs instantly.
        </GuideStep>
        <GuideStep n={6} title="Toggle Switches">
          Click directly on a switch component on the canvas to open or close it.
          Watch bulbs and LEDs react immediately as the circuit path changes.
        </GuideStep>
        <GuideStep n={7} title="Start Analytics">
          Click <strong>Start Analytics</strong> in the Circuit Summary section, then switch to the
          Analytics tab to see live time-series charts of power, current, and voltage.
        </GuideStep>
      </div>

      {/* Components Guide */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Component Reference</h3>
        {[
          { icon: "⟵",  name: "Wire",       color: "#94a3b8", desc: "Ideal conductor with zero resistance. Drag to draw long paths. Merges nodes it connects." },
          { icon: "⟿",  name: "Resistor",   color: "#f59e0b", desc: "Opposes current flow. Adjust from 1Ω to 10kΩ. Shows actual current (mA) and voltage drop." },
          { icon: "⚡",  name: "Battery",    color: "#10b981", desc: "Ideal voltage source. Sets the EMF. Shows '+' (higher potential) and '−' (ground) terminals." },
          { icon: "⊘",  name: "Switch",     color: "#22d3ee", desc: "Opens or closes the circuit path. Click it on the canvas to toggle. OPEN = no current flows." },
          { icon: "💡", name: "Bulb",       color: "#fbbf24", desc: "Incandescent lamp. Brightness scales with power (P = I²R). Glows warm white at high power." },
          { icon: "⯈",  name: "LED",        color: "#22d3ee", desc: "Light-emitting diode. Glows cyan with power. Very low forward voltage model for simplicity." },
          { icon: "⊣⊢", name: "Capacitor",  color: "#a78bfa", desc: "DC open circuit (infinite impedance). Shows capacitance value. Use in RC transient analysis." },
          { icon: "V",  name: "Voltmeter",  color: "#f472b6", desc: "High impedance (1MΩ). Measures voltage across a component. Reads actual node potential difference." },
          { icon: "A",  name: "Ammeter",    color: "#fb923c", desc: "Very low impedance (1mΩ). Measures current through a branch. Shows value in mA." },
          { icon: "⏚",  name: "Ground",     color: "#6b7280", desc: "Reference node (0V). Connect to battery negative for complete circuit. Only vertical placement." },
        ].map((c) => (
          <div key={c.name} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 border" style={{ background: c.color + "18", borderColor: c.color + "30", color: c.color }}>{c.icon}</div>
            <div>
              <div className="text-[12px] font-bold" style={{ color: c.color }}>{c.name}</div>
              <div className="text-[11px] text-white/45 leading-relaxed">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Preset Descriptions */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Preset Circuits</h3>
        {[
          { name: "Series", desc: "Battery → Resistor (220Ω) → Bulb in a single loop. All components share the same current. Voltage divides proportionally to resistance." },
          { name: "Parallel", desc: "Two resistors (100Ω and 220Ω) connected directly across the battery. Each sees the full battery voltage. Total current is the sum." },
          { name: "RC Circuit", desc: "Resistor and capacitor with a switch. Close the switch to begin charging. In DC steady-state, no current flows through the capacitor." },
          { name: "Wheatstone Bridge", desc: "Four resistors arranged in a diamond. Adjust values to balance the bridge (no current through the meter diagonal path)." },
          { name: "Mixed", desc: "Complex circuit with switches, LEDs, bulbs, and multiple resistors. Great for exploring KCL/KVL in multi-loop networks." },
        ].map((p) => (
          <TipCard key={p.name} icon="🔗" title={p.name}>{p.desc}</TipCard>
        ))}
      </div>

      {/* Pro Tips */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Pro Tips</h3>
        <TipCard icon="🌡️" title="Power Heat Map">
          Enable <strong>Power Heat Map</strong> in Visualization to see which components are dissipating the most
          energy. A warm orange glow indicates high power — useful for identifying overloaded resistors.
        </TipCard>
        <TipCard icon="🎨" title="Voltage Color Coding">
          With <strong>Voltage Colors</strong> enabled, component colors shift from blue (low voltage) to red (high voltage),
          letting you visually trace the potential distribution across the circuit.
        </TipCard>
        <TipCard icon="〜" title="Animated Current Flow">
          Enable <strong>Current Flow Animation</strong> to see dashed lines moving along wires — the speed and direction
          indicate current magnitude and direction, making it easy to spot open circuits.
        </TipCard>
        <TipCard icon="📊" title="Live Analytics">
          Switch to the <strong>Analytics tab</strong> while the simulation is running to see time-series charts
          of total power, current, and component counts updated in real time.
        </TipCard>
        <TipCard icon="🔍" title="Inspector Panel">
          Always click a component to open the inspector — it shows exact voltage, current (in mA), and power (in W)
          with four decimal places of precision for accurate verification of hand calculations.
        </TipCard>
      </div>

      {/* Common Mistakes */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Common Mistakes to Avoid</h3>
        {[
          { icon: "⚠️", title: "Open Circuit",          desc: "If bulbs don't light up, check that all connections form a closed loop back to the battery. Every node must be reachable." },
          { icon: "⚠️", title: "No Ground Reference",   desc: "The MNA solver needs a ground node to define absolute voltages. The battery negative terminal acts as ground." },
          { icon: "⚠️", title: "Short Circuit",         desc: "Wiring directly across a battery with no resistance gives infinite current in theory. The solver clamps values for stability." },
          { icon: "⚠️", title: "Switch Polarity",       desc: "Switches open the circuit path — make sure they are in series with the load, not parallel (which would bypass the load)." },
          { icon: "ℹ️", title: "Capacitors in DC",     desc: "Capacitors block DC current in steady state. They appear as open circuits in the MNA solution (infinite impedance)." },
        ].map((t) => (
          <TipCard key={t.title} icon={t.icon} title={t.title}>{t.desc}</TipCard>
        ))}
      </div>

    </div>
  );
};

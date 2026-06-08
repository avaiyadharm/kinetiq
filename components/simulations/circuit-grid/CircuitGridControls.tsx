"use client";
import React from "react";
import { useCircuitStore, ComponentType, Orientation, GridComponent } from "@/store/circuitStore";

// ─── Reusable sub-components ──────────────────────────────────────────────────
function Slider({
  label, value, min, max, step = 0.01, unit = "", onChange, color = "#3b82f6", fmt,
}: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; color?: string;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = fmt ? fmt(value) : value.toFixed(2);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-white/50 font-mono uppercase tracking-wider">{label}</span>
        <span className="text-[12px] font-mono font-bold" style={{ color }}>{display}{unit}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/5">
        <div
          className="absolute h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}80,${color})` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, color = "#3b82f6" }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; color?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <span className="text-[11px] text-white/50 font-mono uppercase tracking-wider group-hover:text-white/70 transition-colors">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${checked ? "" : "bg-white/10"}`}
        style={checked ? { backgroundColor: color } : {}}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-[18px]" : "left-0.5"}`}
          style={{ boxShadow: checked ? `0 0 6px ${color}` : undefined }}
        />
      </div>
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 border-b border-white/5 pb-1.5">
      {title}
    </div>
  );
}

// ─── Component Icon ───────────────────────────────────────────────────────────
const COMP_ICONS: Record<ComponentType, string> = {
  wire: "⟵",
  resistor: "⟿",
  battery: "⚡",
  switch: "⊘",
  bulb: "💡",
  capacitor: "⊣⊢",
  led: "⯈",
  voltmeter: "V",
  ammeter: "A",
  ground: "⏚",
};

const COMP_COLORS: Record<ComponentType, string> = {
  wire: "#94a3b8",
  resistor: "#f59e0b",
  battery: "#10b981",
  switch: "#22d3ee",
  bulb: "#fbbf24",
  capacitor: "#a78bfa",
  led: "#22d3ee",
  voltmeter: "#f472b6",
  ammeter: "#fb923c",
  ground: "#6b7280",
};

const COMP_ORDER: ComponentType[] = [
  "wire", "resistor", "battery", "switch",
  "bulb", "led", "capacitor",
  "voltmeter", "ammeter", "ground",
];

// ─── Palette ──────────────────────────────────────────────────────────────────
function ComponentPalette() {
  const { activePalette, setActivePalette } = useCircuitStore();
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {COMP_ORDER.map((type) => (
        <button
          key={type}
          onClick={() => setActivePalette(type)}
          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-bold font-mono transition-all border ${
            activePalette === type
              ? "border-opacity-40 text-white"
              : "bg-white/3 border-white/6 text-white/40 hover:text-white/70 hover:border-white/12"
          }`}
          style={
            activePalette === type
              ? { borderColor: COMP_COLORS[type] + "60", background: COMP_COLORS[type] + "18" }
              : {}
          }
        >
          <span className="text-[15px]" style={{ color: activePalette === type ? COMP_COLORS[type] : undefined }}>
            {COMP_ICONS[type]}
          </span>
          <span className="capitalize">{type}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Orientation ──────────────────────────────────────────────────────────────
function OrientationPicker() {
  const { activeOrientation, setActiveOrientation, activePalette } = useCircuitStore();
  if (activePalette === "ground") return null;
  return (
    <div className="flex gap-2">
      {(["H", "V"] as Orientation[]).map((o) => (
        <button
          key={o}
          onClick={() => setActiveOrientation(o)}
          className={`flex-1 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border transition-all ${
            activeOrientation === o
              ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
              : "bg-white/3 border-white/6 text-white/40 hover:text-white/60"
          }`}
        >
          {o === "H" ? "⟵ Horiz." : "↕ Vert."}
        </button>
      ))}
    </div>
  );
}

// ─── Presets ──────────────────────────────────────────────────────────────────
function PresetButtons() {
  const { loadPreset, clearGrid } = useCircuitStore();
  const presets: { id: "series" | "parallel" | "bridge" | "rc" | "mixed"; label: string; desc: string }[] = [
    { id: "series",   label: "Series",   desc: "R1→R2→Bulb" },
    { id: "parallel", label: "Parallel", desc: "R1 ‖ R2" },
    { id: "rc",       label: "RC",       desc: "RC charging" },
    { id: "bridge",   label: "Wheatstone", desc: "Bridge" },
    { id: "mixed",    label: "Mixed",    desc: "Multi-component" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => loadPreset(p.id)}
            className="flex flex-col gap-0.5 py-2 px-2 rounded-lg text-[10px] font-mono transition-all bg-white/3 border border-white/6 hover:bg-white/7 hover:border-white/12 text-left"
          >
            <span className="font-black text-white/70">{p.label}</span>
            <span className="text-white/30">{p.desc}</span>
          </button>
        ))}
      </div>
      <button
        onClick={clearGrid}
        className="w-full py-2 rounded-lg text-[11px] font-mono font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
      >
        🗑 Clear Grid
      </button>
    </div>
  );
}

// ─── Selected Component Inspector ─────────────────────────────────────────────
function ComponentInspector() {
  const { components, selectedId, updateValue, removeComponent, toggleSwitch } = useCircuitStore();
  const comp = components.find((c) => c.id === selectedId);
  if (!comp) return null;

  const color = COMP_COLORS[comp.type];

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3" style={{ borderColor: color + "30", background: color + "08" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{COMP_ICONS[comp.type]}</span>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider" style={{ color }}>
              {comp.type}
            </div>
            <div className="text-[9px] font-mono text-white/30">
              ({comp.row}, {comp.col}) — {comp.orientation === "H" ? "Horizontal" : "Vertical"}
            </div>
          </div>
        </div>
        <button
          onClick={() => removeComponent(comp.id)}
          className="text-[10px] text-rose-400/60 hover:text-rose-400 font-mono transition-colors"
        >
          ✕ Remove
        </button>
      </div>

      {/* Value sliders */}
      {comp.type === "resistor" && (
        <Slider label="Resistance" value={comp.value} min={1} max={10000} step={1} unit="" color={color}
          onChange={(v) => updateValue(comp.id, v)}
          fmt={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}kΩ` : `${v}Ω`}
        />
      )}
      {comp.type === "battery" && (
        <Slider label="Voltage" value={comp.value} min={1} max={50} step={0.5} unit="V" color={color}
          onChange={(v) => updateValue(comp.id, v)}
          fmt={(v) => `${v.toFixed(1)}`}
        />
      )}
      {comp.type === "bulb" && (
        <Slider label="Resistance" value={comp.value} min={10} max={500} step={5} unit="Ω" color={color}
          onChange={(v) => updateValue(comp.id, v)}
          fmt={(v) => `${v.toFixed(0)}`}
        />
      )}
      {comp.type === "led" && (
        <Slider label="Resistance" value={comp.value} min={50} max={1000} step={10} unit="Ω" color={color}
          onChange={(v) => updateValue(comp.id, v)}
          fmt={(v) => `${v.toFixed(0)}`}
        />
      )}
      {comp.type === "capacitor" && (
        <Slider label="Capacitance" value={comp.value} min={0.0001} max={0.1} step={0.0001} unit="" color={color}
          onChange={(v) => updateValue(comp.id, v)}
          fmt={(v) => v >= 0.001 ? `${(v * 1000).toFixed(1)}mF` : `${(v * 1e6).toFixed(0)}μF`}
        />
      )}
      {comp.type === "switch" && (
        <button
          onClick={() => toggleSwitch(comp.id)}
          className="py-2 rounded-lg text-[11px] font-mono font-black uppercase tracking-wider border transition-all"
          style={
            comp.closed
              ? { background: "#22d3ee18", borderColor: "#22d3ee40", color: "#22d3ee" }
              : { background: "#ef444418", borderColor: "#ef444440", color: "#ef4444" }
          }
        >
          {comp.closed ? "CLOSED — Click to Open" : "OPEN — Click to Close"}
        </button>
      )}

      {/* Live readings */}
      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {[
          { label: "Voltage", value: `${(comp.voltage ?? 0).toFixed(3)}V`, color: "#3b82f6" },
          { label: "Current", value: `${((comp.current ?? 0) * 1000).toFixed(2)}mA`, color: "#f59e0b" },
          { label: "Power", value: `${(comp.power ?? 0).toFixed(4)}W`, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-white/3 rounded-lg p-2">
            <div className="text-[8px] font-mono text-white/30 uppercase">{s.label}</div>
            <div className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Default Value Controls ───────────────────────────────────────────────────
function DefaultValueControls() {
  const {
    defaultResistance, defaultVoltage, defaultCapacitance, defaultBulbR, defaultLedR,
    activePalette, setDefault,
  } = useCircuitStore();

  if (!["resistor", "battery", "capacitor", "bulb", "led"].includes(activePalette)) return null;

  return (
    <div className="flex flex-col gap-3">
      {activePalette === "resistor" && (
        <Slider label="Default Resistance" value={defaultResistance} min={1} max={10000} step={1}
          color="#f59e0b" onChange={(v) => setDefault("defaultResistance", v)}
          fmt={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}kΩ` : `${v}Ω`}
        />
      )}
      {activePalette === "battery" && (
        <Slider label="Default Voltage" value={defaultVoltage} min={1} max={50} step={0.5} unit="V"
          color="#10b981" onChange={(v) => setDefault("defaultVoltage", v)}
          fmt={(v) => `${v.toFixed(1)}`}
        />
      )}
      {activePalette === "capacitor" && (
        <Slider label="Default Capacitance" value={defaultCapacitance} min={0.0001} max={0.1} step={0.0001}
          color="#a78bfa" onChange={(v) => setDefault("defaultCapacitance", v)}
          fmt={(v) => v >= 0.001 ? `${(v * 1000).toFixed(1)}mF` : `${(v * 1e6).toFixed(0)}μF`}
        />
      )}
      {activePalette === "bulb" && (
        <Slider label="Default Bulb R" value={defaultBulbR} min={10} max={500} step={5} unit="Ω"
          color="#fbbf24" onChange={(v) => setDefault("defaultBulbR", v)}
          fmt={(v) => `${v.toFixed(0)}`}
        />
      )}
      {activePalette === "led" && (
        <Slider label="Default LED R" value={defaultLedR} min={50} max={1000} step={10} unit="Ω"
          color="#22d3ee" onChange={(v) => setDefault("defaultLedR", v)}
          fmt={(v) => `${v.toFixed(0)}`}
        />
      )}
    </div>
  );
}

// ─── Circuit Summary ──────────────────────────────────────────────────────────
function CircuitSummary() {
  const { components, isRunning, setRunning } = useCircuitStore();

  const battery = components.find((c) => c.type === "battery");
  const totalPower = components.reduce((s, c) => s + (c.power ?? 0), 0);
  const resistors = components.filter((c) => c.type === "resistor");
  const bulbs = components.filter((c) => c.type === "bulb");
  const leds = components.filter((c) => c.type === "led");

  const totalResistance = resistors.reduce((s, r) => s + r.value, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "Supply", value: battery ? `${battery.value}V` : "—", color: "#10b981" },
          { label: "Total Power", value: `${totalPower.toFixed(3)}W`, color: "#f59e0b" },
          { label: "Components", value: `${components.length}`, color: "#94a3b8" },
          { label: "Total R", value: totalResistance >= 1000 ? `${(totalResistance / 1000).toFixed(1)}kΩ` : `${totalResistance.toFixed(0)}Ω`, color: "#f59e0b" },
          { label: "Bulbs", value: `${bulbs.length}`, color: "#fbbf24" },
          { label: "LEDs", value: `${leds.length}`, color: "#22d3ee" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-white/2 rounded-lg p-2 border border-white/5">
            <div className="text-[8px] font-mono text-white/30 uppercase">{s.label}</div>
            <div className="text-[12px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setRunning(!isRunning)}
        className={`w-full py-2.5 rounded-lg text-[12px] font-mono font-black uppercase tracking-wider border transition-all ${
          isRunning
            ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
        }`}
      >
        {isRunning ? "⏸ Pause Analytics" : "▶ Start Analytics"}
      </button>
    </div>
  );
}

// ─── Visualization Toggles ─────────────────────────────────────────────────────
function VizToggles() {
  const { showGrid, showVoltageColors, showCurrentFlow, showPowerHeat, setToggle } = useCircuitStore();
  return (
    <div className="flex flex-col gap-3">
      <Toggle label="Grid Points" checked={showGrid} onChange={(v) => setToggle("showGrid", v)} color="#94a3b8" />
      <Toggle label="Voltage Colors" checked={showVoltageColors} onChange={(v) => setToggle("showVoltageColors", v)} color="#3b82f6" />
      <Toggle label="Current Flow Anim." checked={showCurrentFlow} onChange={(v) => setToggle("showCurrentFlow", v)} color="#22d3ee" />
      <Toggle label="Power Heat Map" checked={showPowerHeat} onChange={(v) => setToggle("showPowerHeat", v)} color="#f97316" />
    </div>
  );
}

// ─── Instructions ─────────────────────────────────────────────────────────────
function Instructions() {
  return (
    <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 flex flex-col gap-1.5">
      <div className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-400/70">How to Build</div>
      {[
        "Select a component from the palette",
        "Click grid to place (drag for wires)",
        "Right-click a component to delete it",
        "Click a switch to toggle it",
        "Click any component to inspect",
      ].map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-[10px] text-white/40 font-mono">
          <span className="text-blue-400/50 shrink-0">{i + 1}.</span>
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Controls ─────────────────────────────────────────────────────────────
export const CircuitGridControls: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto no-scrollbar pb-4 px-4 py-4">
      <div className="flex flex-col gap-3">
        <SectionHeader title="Component Palette" />
        <ComponentPalette />
        <OrientationPicker />
        <DefaultValueControls />
      </div>

      <div className="border-t border-white/5" />

      <div className="flex flex-col gap-3">
        <SectionHeader title="Inspector" />
        <ComponentInspector />
      </div>

      <div className="border-t border-white/5" />

      <div className="flex flex-col gap-3">
        <SectionHeader title="Preset Circuits" />
        <PresetButtons />
      </div>

      <div className="border-t border-white/5" />

      <div className="flex flex-col gap-3">
        <SectionHeader title="Circuit Summary" />
        <CircuitSummary />
      </div>

      <div className="border-t border-white/5" />

      <div className="flex flex-col gap-3">
        <SectionHeader title="Visualization" />
        <VizToggles />
      </div>

      <div className="border-t border-white/5" />

      <Instructions />
    </div>
  );
};

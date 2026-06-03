"use client";
import React from "react";
import { useKEStore, KEMode } from "@/store/kineticEnergyStore";
import { momentOfInertia, CollisionPreset } from "@/lib/physics/kineticEnergy";

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({
  label, value, min, max, step = 0.01, unit = "",
  onChange, color = "#3b82f6", fmt,
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
        <span className="text-[12px] font-mono font-bold" style={{ color }}>
          {display}{unit}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/5">
        <div
          className="absolute h-full rounded-full transition-none"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange, color = "#3b82f6" }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; color?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <span className="text-[11px] text-white/50 font-mono uppercase tracking-wider group-hover:text-white/70 transition-colors">
        {label}
      </span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${checked ? "bg-[#3b82f6]" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-[18px]" : "left-0.5"}`}
          style={{ boxShadow: checked ? `0 0 6px ${color}` : undefined }}
        />
      </div>
    </label>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 border-b border-white/5 pb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Mode-specific control panels ─────────────────────────────────────────────

function FreeParticleControls() {
  const { fp, setFP } = useKEStore();
  return (
    <>
      <Section title="Object">
        <Slider label="Mass" value={fp.mass} min={0.5} max={20} step={0.1} unit=" kg" color="#3b82f6" onChange={v => setFP({ mass: v })} />
        <Slider label="Init. Velocity" value={fp.v} min={-30} max={30} step={0.5} unit=" m/s" color="#f59e0b" onChange={v => setFP({ v })} />
      </Section>
      <Section title="Forces">
        <Slider label="Applied Force" value={fp.appliedForce} min={-100} max={100} step={1} unit=" N" color="#ef4444" onChange={v => setFP({ appliedForce: v })} />
        <Slider label="Friction μk" value={fp.friction} min={0} max={1} step={0.01} unit="" color="#f97316" onChange={v => setFP({ friction: v })} />
        <Toggle label="Surface Contact" checked={fp.surface} onChange={v => setFP({ surface: v })} />
      </Section>
    </>
  );
}

function InclinedPlaneControls() {
  const { ip, setIP, isPlaying, setPlaying } = useKEStore();
  const degAngle = (ip.angle * 180 / Math.PI);
  return (
    <>
      <Section title="Ramp">
        <Slider label="Angle θ" value={degAngle} min={5} max={75} step={1} unit="°" color="#f59e0b"
          onChange={v => { setIP({ angle: v * Math.PI / 180 }); }} />
        <Slider label="Ramp Length" value={ip.trackLength} min={2} max={20} step={0.5} unit=" m" color="#8b5cf6"
          onChange={v => setIP({ trackLength: v })} />
      </Section>
      <Section title="Block">
        <Slider label="Mass" value={ip.mass} min={0.5} max={20} step={0.1} unit=" kg" color="#3b82f6" onChange={v => setIP({ mass: v })} />
        <Slider label="Friction μk" value={ip.mu} min={0} max={0.9} step={0.01} unit="" color="#f97316" onChange={v => setIP({ mu: v })} />
      </Section>
      <button
        onClick={() => { setIP({ x: ip.trackLength, v: 0 }); setPlaying(true); }}
        className="w-full py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 transition-all"
      >
        Place at Top & Release
      </button>
    </>
  );
}

function ProjectileControls() {
  const { launchAngle, launchSpeed, proj, setLaunchParams, launchProjectile, setProj } = useKEStore();
  return (
    <>
      <Section title="Launch Parameters">
        <Slider label="Angle" value={launchAngle} min={5} max={85} step={1} unit="°" color="#f59e0b"
          onChange={v => setLaunchParams(v, launchSpeed)} />
        <Slider label="Speed" value={launchSpeed} min={5} max={80} step={1} unit=" m/s" color="#3b82f6"
          onChange={v => setLaunchParams(launchAngle, v)} />
        <Slider label="Mass" value={proj.mass} min={0.05} max={10} step={0.05} unit=" kg" color="#8b5cf6"
          onChange={v => setProj({ mass: v })} />
      </Section>
      <Section title="Physics">
        <Toggle label="Air Resistance" checked={proj.dragEnabled} onChange={v => setProj({ dragEnabled: v })} />
      </Section>
      <button
        onClick={launchProjectile}
        className="w-full py-2.5 rounded-lg text-[12px] font-mono font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
      >
        🚀 Launch
      </button>
    </>
  );
}

function CollisionControls() {
  const { coll, setColl, applyCollisionPreset, startReplay, isReplayMode, collisionReplayBuffer } = useKEStore();
  
  const presets: { id: CollisionPreset; label: string }[] = [
    { id: "elastic", label: "Elastic" },
    { id: "inelastic", label: "Inelastic" },
    { id: "headon", label: "Head-on" },
    { id: "truckbike", label: "Truck v Bike" },
    { id: "bulletwall", label: "Bullet v Wall" },
  ];

  return (
    <>
      <Section title="Presets & Replay">
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => applyCollisionPreset(p.id)}
              className="py-1.5 px-2 rounded-lg text-[9px] font-mono text-center transition-all bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={startReplay}
          disabled={collisionReplayBuffer.length === 0 || isReplayMode}
          className="w-full py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
          {isReplayMode ? "Replaying..." : "⏪ Slow-Mo Replay"}
        </button>
      </Section>
      <Section title="Body 1 (Purple)">
        <Slider label="Mass m₁" value={coll.b1.mass} min={0.5} max={15} step={0.1} unit=" kg" color="#8b5cf6"
          onChange={v => setColl({ b1: { ...coll.b1, mass: v } })} />
        <Slider label="Velocity v₁" value={coll.b1.v} min={-20} max={20} step={0.5} unit=" m/s" color="#f59e0b"
          onChange={v => setColl({ b1: { ...coll.b1, v } })} />
      </Section>
      <Section title="Body 2 (Cyan)">
        <Slider label="Mass m₂" value={coll.b2.mass} min={0.5} max={15} step={0.1} unit=" kg" color="#06b6d4"
          onChange={v => setColl({ b2: { ...coll.b2, mass: v } })} />
        <Slider label="Velocity v₂" value={coll.b2.v} min={-20} max={20} step={0.5} unit=" m/s" color="#f59e0b"
          onChange={v => setColl({ b2: { ...coll.b2, v } })} />
      </Section>
      <Section title="Collision Type">
        <Slider label="Restitution e" value={coll.e} min={0} max={1} step={0.01} unit="" color="#10b981"
          fmt={v => v === 0 ? "0.00 (perfectly inelastic)" : v === 1 ? "1.00 (perfectly elastic)" : v.toFixed(2)}
          onChange={v => setColl({ e: v })} />
      </Section>
    </>
  );
}

function RotationalControls() {
  const { rot, setRot } = useKEStore();
  const shapes = [
    { id: "disk",        label: "Disk",           formula: "½mr²" },
    { id: "ring",        label: "Ring",           formula: "mr²" },
    { id: "sphere",      label: "Solid Sphere",   formula: "²⁄₅mr²" },
    { id: "hollowSphere",label: "Hollow Sphere",  formula: "²⁄₃mr²" },
    { id: "rod",         label: "Thin Rod",       formula: "¹⁄₁₂ml²" },
    { id: "cylinder",    label: "Cylinder",       formula: "½mr²" },
  ] as const;
  return (
    <>
      <Section title="Shape">
        <div className="grid grid-cols-2 gap-1.5">
          {shapes.map(s => (
            <button
              key={s.id}
              onClick={() => setRot({ shape: s.id })}
              className={`py-2 px-2 rounded-lg text-[10px] font-mono text-left transition-all border ${
                rot.shape === s.id
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/3 border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"
              }`}
            >
              <div className="font-bold">{s.label}</div>
              <div className="text-[9px] opacity-60">I = {s.formula}</div>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Parameters">
        <Slider label="Mass" value={rot.mass} min={0.5} max={20} step={0.1} unit=" kg" color="#8b5cf6"
          onChange={v => setRot({ mass: v })} />
        <Slider label="Radius" value={rot.radius} min={0.05} max={1} step={0.01} unit=" m" color="#a78bfa"
          onChange={v => setRot({ radius: v })} />
        <Slider label="Torque" value={rot.torque} min={-10} max={10} step={0.1} unit=" N·m" color="#ef4444"
          onChange={v => setRot({ torque: v })} />
        <Slider label="Friction" value={rot.friction} min={0} max={2} step={0.01} unit=" N·m" color="#f97316"
          onChange={v => setRot({ friction: v })} />
      </Section>
      <div className="text-[10px] font-mono text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
        I = {rot.I.toFixed(5)} kg·m²
        <br />
        KE = ½Iω² = {(0.5 * rot.I * rot.omega * rot.omega).toFixed(3)} J
      </div>
    </>
  );
}

function RollerCoasterControls() {
  const { rc, setRC, setPlaying } = useKEStore();
  return (
    <>
      <Section title="Cart">
        <Slider label="Mass" value={rc.mass} min={1} max={50} step={0.5} unit=" kg" color="#3b82f6"
          onChange={v => setRC({ mass: v })} />
        <Slider label="Rolling Friction μ" value={rc.mu} min={0} max={0.2} step={0.005} unit="" color="#f97316"
          onChange={v => setRC({ mu: v })} />
      </Section>
      <Section title="Launch">
        <Slider label="Initial Speed" value={rc.v} min={0} max={20} step={0.5} unit=" m/s" color="#f59e0b"
          onChange={v => setRC({ v, s: 0 })} />
      </Section>
      <button
        onClick={() => { setRC({ s: 0 }); setPlaying(true); }}
        className="w-full py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 transition-all"
      >
        Release from Start
      </button>
    </>
  );
}

function VehicleControls() {
  const { vehicles, selectedVehicles, toggleVehicle } = useKEStore();
  const ke = (m: number, v: number) => 0.5 * m * v * v;
  const fmt = (j: number) =>
    j >= 1e12 ? `${(j / 1e12).toFixed(1)} TJ`
    : j >= 1e9  ? `${(j / 1e9).toFixed(1)} GJ`
    : j >= 1e6  ? `${(j / 1e6).toFixed(1)} MJ`
    : j >= 1e3  ? `${(j / 1e3).toFixed(1)} kJ`
    : `${j.toFixed(1)} J`;

  return (
    <Section title="Select Vehicles">
      <div className="flex flex-col gap-2">
        {vehicles.map(v => {
          const selected = selectedVehicles.includes(v.name);
          return (
            <button
              key={v.name}
              onClick={() => toggleVehicle(v.name)}
              className={`flex items-center justify-between py-2 px-3 rounded-lg text-[11px] font-mono transition-all border ${
                selected
                  ? "border-opacity-40 text-white/80"
                  : "bg-white/3 border-white/5 text-white/30 hover:text-white/50"
              }`}
              style={selected ? { borderColor: v.color + "66", background: v.color + "11" } : {}}
            >
              <span>{v.icon} {v.name}</span>
              <span className="text-[10px]" style={{ color: selected ? v.color : undefined }}>
                {fmt(ke(v.mass, v.speed))}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Visualization Toggles ────────────────────────────────────────────────────
function VizToggles() {
  const {
    showVelocityVectors, showForceVectors, showEnergyBar, showGrid, showTrail, scientificMode,
    setToggle,
  } = useKEStore();
  return (
    <Section title="Visualization">
      <Toggle label="Velocity Vectors" checked={showVelocityVectors} onChange={v => setToggle("showVelocityVectors", v)} />
      <Toggle label="Force Vectors" checked={showForceVectors} onChange={v => setToggle("showForceVectors", v)} />
      <Toggle label="Energy Bar" checked={showEnergyBar} onChange={v => setToggle("showEnergyBar", v)} />
      <Toggle label="Grid" checked={showGrid} onChange={v => setToggle("showGrid", v)} />
      <Toggle label="Trail" checked={showTrail} onChange={v => setToggle("showTrail", v)} />
      <Toggle label="Scientific Mode" checked={scientificMode} onChange={v => setToggle("scientificMode", v)} color="#f59e0b" />
    </Section>
  );
}

// ─── Mode Tabs ────────────────────────────────────────────────────────────────
const MODES: { id: KEMode; label: string; icon: string }[] = [
  { id: "freeparticle",  label: "Free Particle",   icon: "●" },
  { id: "inclinedplane", label: "Inclined Plane",  icon: "◸" },
  { id: "projectile",    label: "Projectile",      icon: "⌒" },
  { id: "collision",     label: "Collision",       icon: "◌" },
  { id: "rotational",    label: "Rotational",      icon: "⟳" },
  { id: "rollercoaster", label: "Roller Coaster",  icon: "~" },
  { id: "vehicle",       label: "Vehicle Scale",   icon: "▬" },
];

// ─── Main Controls Component ──────────────────────────────────────────────────
export const KineticEnergyControls: React.FC = () => {
  const { mode, isPlaying, setPlaying, reset, playbackSpeed, setPlaybackSpeed } = useKEStore();

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">

      {/* Playback */}
      <div className="flex gap-2">
        <button
          onClick={() => setPlaying(!isPlaying)}
          className={`flex-1 py-2 rounded-lg text-[11px] font-mono font-black uppercase tracking-wider transition-all ${
            isPlaying
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
          }`}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-white/5 text-white/40 hover:bg-white/8 border border-white/5 transition-all"
        >
          ↺ Reset
        </button>
      </div>

      {/* Speed */}
      <Slider
        label="Playback Speed" value={playbackSpeed} min={0.1} max={5} step={0.1} unit="×"
        color="#f59e0b" onChange={setPlaybackSpeed}
        fmt={v => `${v.toFixed(1)}`}
      />

      <div className="border-t border-white/5" />

      {/* Mode-specific controls */}
      {mode === "freeparticle"  && <FreeParticleControls />}
      {mode === "inclinedplane" && <InclinedPlaneControls />}
      {mode === "projectile"    && <ProjectileControls />}
      {mode === "collision"     && <CollisionControls />}
      {mode === "rotational"    && <RotationalControls />}
      {mode === "rollercoaster" && <RollerCoasterControls />}
      {mode === "vehicle"       && <VehicleControls />}

      <div className="border-t border-white/5" />
      <VizToggles />
    </div>
  );
};

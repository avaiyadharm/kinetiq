"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GravitationCanvas } from "./GravitationCanvas";
import { GravitationGraphs } from "./GravitationGraphs";
import { GravitationTheory } from "./GravitationTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Info, BookOpen, Play, Pause, RotateCcw, Calculator, Layers, Target, Zap, Maximize2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- ClickableValue (reusable) ---
const ClickableValue = ({ value, label, unit, min, max, step = 0.01, onChange, colorClass = "text-white", formatter }: {
  value: number; label: React.ReactNode; unit: string; min: number; max: number; step?: number;
  onChange: (v: number) => void; colorClass?: string; formatter?: (v: number) => string;
}) => {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value.toString());
  useEffect(() => { setInput(value.toString()); }, [value]);
  const commit = () => { setEditing(false); let v = parseFloat(input); if (isNaN(v)) v = value; onChange(Math.max(min, Math.min(max, v))); };
  const display = formatter ? formatter(value) : value.toFixed(2);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</label>
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setEditing(true)}
        className={cn("group relative flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20 shadow-lg", editing && "ring-2 ring-primary/50 bg-white/10 border-primary/50")}>
        {editing ? (
          <input type="number" value={input} onChange={e => setInput(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setInput(value.toString()); } }}
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-mono font-black text-white p-0" autoFocus />
        ) : (
          <><div className="flex items-baseline gap-1">
            <span className={cn("text-2xl font-mono font-black tracking-tight transition-colors", colorClass)}>{display}</span>
            <span className="text-xs font-bold text-white/20">{unit}</span>
          </div><div className="p-1.5 rounded-lg bg-white/5 text-white/20 group-hover:text-primary transition-colors"><Calculator className="w-3.5 h-3.5" /></div></>
        )}
      </motion.div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
        className={cn("w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer",
          colorClass.includes("orange") ? "accent-orange-500" : colorClass.includes("violet") ? "accent-violet-500" :
          colorClass.includes("cyan") ? "accent-cyan-500" : colorClass.includes("emerald") ? "accent-emerald-500" : "accent-primary")} />
    </div>
  );
};

const RelationBox = ({ formula, calc, result }: { formula: string; calc: string; result: string }) => (
  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 group hover:border-primary/30 transition-all">
    <div className="flex justify-between items-baseline">
      <span className="text-xs font-mono font-bold text-primary">{formula}</span>
      <span className="text-sm font-mono font-black text-white">{result}</span>
    </div>
    <p className="text-[9px] font-mono text-white/20 group-hover:text-white/40 transition-colors">{calc}</p>
  </div>
);

export default function GravitationSimulator() {
  const G = 6.674e-11;
  const [centralMass, setCentralMass] = useState(5.97e24);  // Earth mass
  const [orbiterMass, setOrbiterMass] = useState(1000);     // 1000 kg satellite
  const [orbitalRadius, setOrbitalRadius] = useState(6.771e6); // ~400km above Earth
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [time, setTime] = useState(0);
  const [showVectors, setShowVectors] = useState({ gravity: true, velocity: true, centripetal: false });
  const [showTrail, setShowTrail] = useState(true);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [graphs, setGraphs] = useState({ Fg: [] as any[], v: [] as any[], KE: [] as any[], PE: [] as any[], r: [] as any[], theta: [] as any[] });

  const lastTimeRef = useRef<number | null>(null);
  const stateRef = useRef({ time: 0 });

  // Derived
  const omega = Math.sqrt(G * centralMass / (orbitalRadius ** 3));
  const vOrb = omega * orbitalRadius;
  const Fg = G * centralMass * orbiterMass / (orbitalRadius ** 2);
  const period = (2 * Math.PI) / omega;
  const KE = 0.5 * orbiterMass * vOrb * vOrb;
  const PE = -G * centralMass * orbiterMass / orbitalRadius;
  const totalE = KE + PE;
  const escapeV = Math.sqrt(2 * G * centralMass / orbitalRadius);

  // Physics loop
  useEffect(() => {
    if (!isPlaying) { lastTimeRef.current = null; return; }
    let animId: number;
    const update = (ts: number) => {
      if (lastTimeRef.current === null) { lastTimeRef.current = ts; animId = requestAnimationFrame(update); return; }
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = ts;
      stateRef.current.time += dt * 200; // speed up for visual effect
      setTime(stateRef.current.time);
      const t = stateRef.current.time;
      const theta = omega * t;
      setGraphs(prev => ({
        Fg: [...prev.Fg, { time: t, value: Fg }].slice(-100),
        v: [...prev.v, { time: t, value: vOrb }].slice(-100),
        KE: [...prev.KE, { time: t, value: KE }].slice(-100),
        PE: [...prev.PE, { time: t, value: PE }].slice(-100),
        r: [...prev.r, { time: t, value: orbitalRadius }].slice(-100),
        theta: [...prev.theta, { time: t, value: theta % (2 * Math.PI) }].slice(-100),
      }));
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, centralMass, orbiterMass, orbitalRadius, omega, vOrb, Fg, KE, PE]);

  const handleReset = useCallback(() => {
    setIsPlaying(false); setTime(0); stateRef.current.time = 0;
    setGraphs({ Fg: [], v: [], KE: [], PE: [], r: [], theta: [] });
  }, []);

  const sci = (n: number, d = 2) => n.toExponential(d);

  const renderCanvas = () => (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/5 via-transparent to-[#8b5cf6]/5 pointer-events-none" />
      <div className="flex-1 p-6 relative flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="flex-1 z-10 flex flex-col gap-6">
          <div className="flex-1 relative min-h-0">
            <GravitationCanvas centralMass={centralMass} orbiterMass={orbiterMass} orbitalRadius={orbitalRadius}
              time={time} isPlaying={isPlaying} showVectors={showVectors} showTrail={showTrail} showFieldLines={showFieldLines} G={G} />
          </div>
          <div className="bg-[#18181b] border border-white/5 rounded-[24px] p-4 flex items-center justify-center gap-8 overflow-x-auto no-scrollbar shrink-0">
            {[{ id: "gravity", label: "Gravity (Fg)", color: "bg-pink-500" }, { id: "velocity", label: "Velocity (v)", color: "bg-cyan-500" },
              { id: "centripetal", label: "Centripetal (ac)", color: "bg-amber-500" }].map(v => (
              <div key={v.id} className={cn("flex items-center gap-2 transition-opacity", showVectors[v.id as keyof typeof showVectors] ? "opacity-100" : "opacity-20")}>
                <div className={cn("w-3 h-3 rounded-full shadow-sm", v.color)} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{v.label}</span>
              </div>))}
          </div>
          <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-8 shadow-2xl shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsPlaying(!isPlaying)}
                className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-lg active:scale-95",
                  isPlaying ? "bg-red-500 shadow-red-500/20" : "bg-primary shadow-primary/20")}>
                {isPlaying ? <Pause className="w-6 h-6 text-white fill-current" /> : <Play className="w-6 h-6 text-white fill-current ml-1" />}
              </button>
              <button onClick={handleReset} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-[20px] transition-all border border-white/5 flex items-center justify-center active:scale-95">
                <RotateCcw className="w-5 h-5 text-white/40" />
              </button>
            </div>
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
              <ClickableValue label="Central Mass (M)" value={centralMass} unit="kg" min={1e22} max={2e30} step={1e23}
                onChange={setCentralMass} colorClass="text-orange-400" formatter={v => v.toExponential(2)} />
              <ClickableValue label="Orbital Radius (r)" value={orbitalRadius} unit="m" min={1e6} max={1e9} step={1e5}
                onChange={setOrbitalRadius} colorClass="text-violet-400" formatter={v => v.toExponential(2)} />
              <ClickableValue label="Orbiter Mass (m)" value={orbiterMass} unit="kg" min={1} max={1e6} step={100}
                onChange={setOrbiterMass} colorClass="text-cyan-400" formatter={v => v.toFixed(0)} />
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6 z-10 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"><Globe className="w-24 h-24 text-primary" /></div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Info className="w-5 h-5" /></div>
              <h3 className="text-xl font-bold uppercase tracking-tight">Orbital Pulse</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed italic relative z-10">
              Gravitational force provides the centripetal acceleration for stable circular orbits. The orbit velocity is independent of the orbiter mass.
            </p>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-4 rounded-2xl bg-black/40 border border-orange-500/10">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">Period</span>
                <p className="text-xl font-mono font-bold text-white">{period.toFixed(0)} <span className="text-[10px] text-white/20">s</span></p>
              </div>
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/10">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Escape Vel</span>
                <p className="text-xl font-mono font-bold text-white">{sci(escapeV)} <span className="text-[10px] text-white/20">m/s</span></p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Telemetry Pipeline</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active 60Hz</span>
              </div>
            </div>
            <GravitationGraphs FgData={graphs.Fg} vData={graphs.v} KEData={graphs.KE} PEData={graphs.PE} rData={graphs.r} thetaData={graphs.theta} />
          </div>
          <div className="mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white tracking-tight">Gravitation Lab</p>
              <p className="text-[10px] text-white/40">Adjust parameters in Config</p>
            </div>
            <button onClick={() => setActiveTab("config")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
              <Maximize2 className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ControlCard = ({ title, icon: Icon, children, color }: any) => (
    <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"><Icon className="w-24 h-24" style={{ color }} /></div>
      <div className="flex items-center gap-3 relative z-10">
        <div className="p-2 rounded-lg bg-white/5" style={{ color }}><Icon className="w-5 h-5" /></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-white/90">{title}</h3>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );

  const renderConfig = () => (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
      <div className="flex-1 space-y-8 max-w-5xl">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
            Environment <span className="text-primary">Config</span>
            <Badge variant="outline" className="text-[10px] tracking-widest border-primary/20 text-primary bg-primary/5 uppercase h-6">Gravitational</Badge>
          </h2>
          <p className="text-white/40 text-sm font-medium">Configure the central body, orbiter, and orbital parameters.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ControlCard title="Central Body" icon={Target} color="#f97316">
              <div className="space-y-6">
                <ClickableValue label="Central Mass (M)" value={centralMass} unit="kg" min={1e22} max={2e30} step={1e23}
                  onChange={setCentralMass} colorClass="text-orange-400" formatter={v => v.toExponential(2)} />
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: "Earth", v: 5.97e24 }, { l: "Mars", v: 6.42e23 }, { l: "Sun", v: 1.989e30 }].map(p => (
                    <button key={p.l} onClick={() => setCentralMass(p.v)}
                      className={cn("py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                        Math.abs(centralMass - p.v) < 1e20 ? "bg-orange-500 border-orange-400 text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20")}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
            </ControlCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ControlCard title="Orbital Parameters" icon={Zap} color="#8b5cf6">
              <div className="space-y-6">
                <ClickableValue label="Orbital Radius (r)" value={orbitalRadius} unit="m" min={1e6} max={1e9} step={1e5}
                  onChange={setOrbitalRadius} colorClass="text-violet-400" formatter={v => v.toExponential(2)} />
                <ClickableValue label="Orbiter Mass (m)" value={orbiterMass} unit="kg" min={1} max={1e6} step={100}
                  onChange={setOrbiterMass} colorClass="text-cyan-400" formatter={v => v.toFixed(0)} />
              </div>
            </ControlCard>
          </motion.div>
          <ControlCard title="Visual Layers" icon={Layers} color="#ec4899">
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Object.keys(showVectors).map(key => (
                <button key={key} onClick={() => setShowVectors({ ...showVectors, [key]: !showVectors[key as keyof typeof showVectors] })}
                  className={cn("px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                    showVectors[key as keyof typeof showVectors] ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/20 border-white/5 hover:border-white/10")}>
                  {key}
                </button>
              ))}
              <button onClick={() => setShowTrail(!showTrail)}
                className={cn("px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                  showTrail ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/20 border-white/5")}>
                Trail
              </button>
              <button onClick={() => setShowFieldLines(!showFieldLines)}
                className={cn("px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                  showFieldLines ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/20 border-white/5")}>
                Field Lines
              </button>
            </div>
          </ControlCard>
        </div>
      </div>
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden h-full">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Dynamic Analysis</h3>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Orbital Stability</p>
          </div>
          <div className="space-y-6">
            {[{ label: "Grav Force", val: sci(Fg), unit: "N" }, { label: "Orbital Vel", val: sci(vOrb), unit: "m/s" },
              { label: "Kinetic E", val: sci(KE), unit: "J" }, { label: "Potential E", val: sci(PE), unit: "J" },
              { label: "Total E", val: sci(totalE), unit: "J" }].map(s => (
              <div key={s.label} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{s.label}</span>
                  <span className="text-xs font-mono font-bold text-white">{s.val} <span className="text-[10px] text-white/20">{s.unit}</span></span>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Orbital Relations</h4>
              <Calculator className="w-3 h-3 text-primary/40" />
            </div>
            <div className="space-y-3">
              <RelationBox formula="v = √(GM/r)" calc={`√(${sci(G)}×${sci(centralMass)}/${sci(orbitalRadius)})`} result={`${sci(vOrb)} m/s`} />
              <RelationBox formula="T = 2π/ω" calc={`2π/${sci(omega)}`} result={`${period.toFixed(0)} s`} />
              <RelationBox formula="E = −GMm/2r" calc={`−${sci(G)}×${sci(centralMass)}×${orbiterMass}/(2×${sci(orbitalRadius)})`} result={`${sci(totalE)} J`} />
            </div>
          </div>
          <div className="pt-6 border-t border-white/5">
            <button onClick={handleReset} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Orbit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SimulationPageLayout title="Universal Gravitation" activeTab={activeTab} onTabChange={setActiveTab} onReset={handleReset}>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }} className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "canvas" && renderCanvas()}
          {activeTab === "config" && renderConfig()}
          {activeTab === "theory" && (
            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#09090b]">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Theoretical <span className="text-primary">Basis</span></h2>
                  <p className="text-white/40 text-sm font-medium">Newton&apos;s Law of Universal Gravitation, Kepler&apos;s Laws, and orbital energy mechanics.</p>
                </div>
                <GravitationTheory />
              </div>
            </div>
          )}
          {activeTab === "guide" && (
            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#09090b] flex items-center justify-center">
              <div className="text-center space-y-6 max-w-lg">
                <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto border border-primary/20">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Laboratory Guide</h2>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Welcome to the Gravitation Laboratory. Explore how gravity governs planetary orbits by adjusting the central mass, orbital radius, and orbiter mass. Watch how force vectors, velocity, and energy change in real-time.
                  </p>
                </div>
                <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 text-left">
                  <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Quick Tips</h4>
                  <ul className="space-y-3 text-xs text-white/60 font-medium">
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Switch between Earth, Mars, and Sun presets</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Toggle field lines to see gravitational field</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Observe KE + PE conservation in orbital energy</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Increase radius to see orbital velocity decrease</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </SimulationPageLayout>
  );
}

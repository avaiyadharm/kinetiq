"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { KineticEnergyCanvas } from "./KineticEnergyCanvas";
import { KineticEnergyControls } from "./KineticEnergyControls";
import { KineticEnergyTheory } from "./KineticEnergyTheory";
import { KineticEnergyGuide } from "./KineticEnergyGuide";
import { KineticEnergyAnalytics } from "./KineticEnergyAnalytics";
import { useKEStore } from "@/store/kineticEnergyStore";

const TAB_ANIM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18 },
} as const;

// ─── Live Equation Panel ──────────────────────────────────────────────────────
const LiveEquationPanel: React.FC = () => {
  const { liveEquation, showEquationPanel } = useKEStore();
  if (!showEquationPanel) return null;
  return (
    <motion.div
      layout
      className="absolute bottom-[100px] right-5 z-20 pointer-events-none select-none"
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="rounded-xl border border-blue-500/20 bg-black/70 backdrop-blur-md px-4 py-3 flex flex-col gap-0.5 min-w-[230px] shadow-xl">
        <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25 mb-1.5">Live Equation</div>
        <div className="text-[12px] font-mono text-white/35">{liveEquation.formula}</div>
        <div className="text-[12px] font-mono text-blue-300/80">{liveEquation.substituted}</div>
        <div className="text-[14px] font-mono font-black text-blue-400 mt-0.5">{liveEquation.result}</div>
        <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
            animate={{ width: `${Math.min(100, (liveEquation.value / 1000) * 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Callout Overlay ──────────────────────────────────────────────────────────
const CalloutOverlay: React.FC = () => {
  const { callouts, dismissCallout, showCallouts } = useKEStore();
  if (!showCallouts) return null;
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 pointer-events-none w-[360px]">
      <AnimatePresence mode="popLayout">
        {callouts.map(c => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, scale: 0.8, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="rounded-xl border px-4 py-3 flex items-start gap-3 shadow-2xl backdrop-blur-sm"
            style={{
              background: c.color + "14",
              borderColor: c.color + "40",
              boxShadow: `0 0 24px ${c.color}22`,
            }}
          >
            <span className="text-lg shrink-0">{c.icon}</span>
            <div>
              <div className="text-[13px] font-black" style={{ color: c.color }}>{c.text}</div>
              {c.subtext && <div className="text-[11px] font-mono text-white/45 mt-0.5">{c.subtext}</div>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ─── Velocity Squaring Demo Strip ─────────────────────────────────────────────
const VelocitySquaringDemo: React.FC = () => {
  const [v, setV] = useState(5);
  const mass = 5;
  const ke = 0.5 * mass * v * v;
  const keDouble = 0.5 * mass * (v * 2) * (v * 2);
  const ratio = keDouble / ke;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3">
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">v² Demo — Feel the Difference</div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-white/50 font-mono shrink-0">v =</span>
        <input
          type="range" min={1} max={30} step={0.5} value={v}
          onChange={e => setV(parseFloat(e.target.value))}
          className="flex-1 h-1.5 rounded-full accent-amber-400"
        />
        <span className="text-[12px] font-mono font-black text-amber-300 w-14 text-right">{v.toFixed(1)} m/s</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/3 p-2.5 border border-white/5">
          <div className="text-[9px] text-white/30 font-mono">At v = {v.toFixed(1)} m/s</div>
          <div className="text-[13px] font-black font-mono text-blue-400 mt-1">{ke.toFixed(1)} J</div>
        </div>
        <div className="rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20">
          <div className="text-[9px] text-amber-400/60 font-mono">At 2× speed ({(v * 2).toFixed(1)} m/s)</div>
          <div className="text-[13px] font-black font-mono text-amber-300 mt-1">{keDouble.toFixed(1)} J</div>
        </div>
      </div>
      <div className="text-center py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <span className="text-[12px] font-black text-amber-300">⚡ {ratio.toFixed(0)}× the energy — because v is squared!</span>
      </div>
    </div>
  );
};

// ─── Mode Mode Selector Strip ─────────────────────────────────────────────────
const MODES = [
  { id: "freeparticle" as const, icon: "●", label: "Free Particle" },
  { id: "inclinedplane" as const, icon: "◸", label: "Inclined Plane" },
  { id: "projectile" as const, icon: "⌒", label: "Projectile" },
  { id: "collision" as const, icon: "◌", label: "Collision" },
  { id: "rotational" as const, icon: "⟳", label: "Rotational" },
  { id: "rollercoaster" as const, icon: "∿", label: "Roller Coaster" },
  { id: "vehicle" as const, icon: "▬", label: "Vehicle Scale" },
];

// ─── Canvas Tab (main) ────────────────────────────────────────────────────────
const CanvasTab: React.FC = () => {
  const { mode, setMode, reset, isPlaying, setPlaying } = useKEStore();

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Canvas column */}
      <div className="flex-1 min-w-0 p-5 flex flex-col gap-3">
        {/* Mode strip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); reset(); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-black transition-all ${
                mode === m.id
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                  : "bg-white/3 border border-white/6 text-white/35 hover:text-white/60 hover:border-white/10"
              }`}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
          {/* Play/Pause quick button */}
          <div className="ml-auto">
            <button
              onClick={() => setPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                isPlaying
                  ? "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                  : "bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30"
              }`}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>
        </div>

        {/* Canvas + overlays */}
        <div className="flex-1 min-h-0 relative">
          <KineticEnergyCanvas />
          <LiveEquationPanel />
          <CalloutOverlay />
        </div>
      </div>

      {/* Controls sidebar */}
      <aside className="w-[300px] shrink-0 border-l border-white/5 bg-[#0e0e14] overflow-y-auto no-scrollbar">
        <div className="p-4 flex flex-col gap-4">
          <VelocitySquaringDemo />
          <KineticEnergyControls />
        </div>
      </aside>
    </div>
  );
};

// ─── Root Simulator ───────────────────────────────────────────────────────────
export const KineticEnergySimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const { reset } = useKEStore();

  const handleReset = () => {
    reset();
    setActiveTab("canvas");
  };

  return (
    <SimulationPageLayout
      title="Kinetic Energy Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showAnalyticsTab
    >
      <AnimatePresence mode="wait">
        {activeTab === "canvas" && (
          <motion.div key="canvas" {...TAB_ANIM} className="flex flex-1 min-h-0 overflow-hidden">
            <CanvasTab />
          </motion.div>
        )}
        {activeTab === "config" && (
          <motion.div key="config" {...TAB_ANIM} className="flex flex-1 min-h-0 overflow-hidden">
            <CanvasTab />
          </motion.div>
        )}
        {activeTab === "theory" && (
          <motion.div key="theory" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <KineticEnergyTheory />
            </div>
          </motion.div>
        )}
        {activeTab === "guide" && (
          <motion.div key="guide" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8">
              <KineticEnergyGuide />
            </div>
          </motion.div>
        )}
        {activeTab === "analytics" && (
          <motion.div key="analytics" {...TAB_ANIM} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-8">
              <KineticEnergyAnalytics />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CollisionCanvas } from "./CollisionCanvas";
import { CollisionGraphs } from "./CollisionGraphs";
import { CollisionTheory } from "./CollisionTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Info, BookOpen, Play, Pause, RotateCcw, Calculator, 
  Layers, Target, Zap, Maximize2, Sparkles, SlidersHorizontal, 
  Activity, HelpCircle, ChevronRight, Gauge, Eye, Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- ClickableValue: Premium Tactile Slider + Parameter Field ---
interface ClickableValueProps {
  value: number;
  label: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  colorClass?: string;
  formatter?: (val: number) => string;
}

const ClickableValue: React.FC<ClickableValueProps> = ({ 
  value, label, unit, min, max, step = 0.1, onChange, colorClass = "text-white", formatter
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    let val = parseFloat(inputValue);
    if (isNaN(val)) val = value;
    val = Math.max(min, Math.min(max, val));
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  // Precise increment/decrement buttons
  const increment = () => {
    const next = Math.min(max, value + step);
    onChange(parseFloat(next.toFixed(2)));
  };

  const decrement = () => {
    const prev = Math.max(min, value - step);
    onChange(parseFloat(prev.toFixed(2)));
  };

  const display = formatter ? formatter(value) : value.toFixed(2);

  return (
    <div className="flex flex-col gap-2.5 w-full bg-[#18181b]/35 border border-white/[0.03] p-4 rounded-2xl">
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">{label}</label>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={decrement}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors active:scale-90 font-mono text-sm"
        >
          -
        </button>

        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsEditing(true)}
          className={cn(
            "flex-1 group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer transition-all hover:bg-white/[0.06] hover:border-white/10",
            isEditing && "ring-1 ring-primary/50 bg-white/5 border-primary/45"
          )}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:ring-0 text-base font-mono font-black text-white p-0 text-center"
              autoFocus
            />
          ) : (
            <div className="flex items-baseline gap-1.5 mx-auto">
              <span className={cn("text-lg font-mono font-black tracking-tight transition-colors", colorClass)}>
                {display}
              </span>
              <span className="text-[9px] font-black text-white/35 uppercase">{unit}</span>
            </div>
          )}
        </motion.div>

        <button 
          onClick={increment}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors active:scale-90 font-mono text-sm"
        >
          +
        </button>
      </div>

      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer mt-1",
          colorClass.includes("violet") ? "accent-violet-500" : 
          colorClass.includes("emerald") ? "accent-emerald-500" :
          colorClass.includes("cyan") ? "accent-cyan-500" :
          colorClass.includes("orange") ? "accent-orange-500" : "accent-primary"
        )}
      />
    </div>
  );
};

// --- Dynamic Equation Substituting Component ---
const ScientificPipeline = ({ 
  m1, m2, v1Pre, v2Pre, v1Post, v2Post, hasCollided 
}: {
  m1: number; m2: number; v1Pre: number; v2Pre: number; v1Post: number; v2Post: number; hasCollided: boolean;
}) => {
  const pPre1 = m1 * v1Pre;
  const pPre2 = m2 * v2Pre;
  const pPreTotal = pPre1 + pPre2;

  const pPost1 = m1 * v1Post;
  const pPost2 = m2 * v2Post;
  const pPostTotal = hasCollided ? (pPost1 + pPost2) : pPreTotal;

  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Linear Momentum Pipeline</span>
        <Badge variant="outline" className="text-[8px] font-bold border-pink-500/25 text-pink-400 bg-pink-500/5 h-4 px-1.5 uppercase">Σp = Const</Badge>
      </div>

      {/* Formula substitution structure */}
      <div className="space-y-2.5 text-xs text-white/70">
        <div>
          <span className="text-white/30 text-[9px] uppercase block mb-1">Theoretical Conservation Formula</span>
          <span className="text-pink-400 font-bold">m₁v₁ + m₂v₂ = m₁v₁&apos; + m₂v₂&apos;</span>
        </div>

        <div className="space-y-1">
          <span className="text-white/30 text-[9px] uppercase block">Current Values Substitute</span>
          
          {/* Pre-collision side */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-violet-400">{m1.toFixed(1)}</span>
            <span className="text-white/30">·</span>
            <span className="text-amber-400">({v1Pre.toFixed(1)})</span>
            <span className="text-white/40 font-bold">+</span>
            <span className="text-cyan-400">{m2.toFixed(1)}</span>
            <span className="text-white/30">·</span>
            <span className="text-emerald-400">({v2Pre.toFixed(1)})</span>
            
            <span className="text-white/30 px-1 font-bold">=</span>
            
            {/* Post-collision side */}
            <span className="text-violet-400">{m1.toFixed(1)}</span>
            <span className="text-white/30">·</span>
            <span className="text-violet-300">({hasCollided ? v1Post.toFixed(1) : "?"})</span>
            <span className="text-white/40 font-bold">+</span>
            <span className="text-cyan-400">{m2.toFixed(1)}</span>
            <span className="text-white/30">·</span>
            <span className="text-cyan-300">({hasCollided ? v2Post.toFixed(1) : "?"})</span>
          </div>
          
          {/* Solved pipeline values */}
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/[0.03]">
            <span className="text-white/50">{pPre1.toFixed(1)} + ({pPre2.toFixed(1)}) = <strong className="text-white">{pPreTotal.toFixed(2)}</strong> <span className="text-[9px] text-white/20">N·s</span></span>
            <span className="text-white/30">↔</span>
            <span className="text-white/50">{hasCollided ? `${pPost1.toFixed(1)} + (${pPost2.toFixed(1)}) = ` : ""}<strong className="text-white">{pPostTotal.toFixed(2)}</strong> <span className="text-[9px] text-white/20">N·s</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Energy Dissipation Visualizer Widget ---
const EnergyWidget = ({ 
  m1, m2, v1, v2, v1Post, v2Post, hasCollided, coeffRestitution 
}: {
  m1: number; m2: number; v1: number; v2: number; v1Post: number; v2Post: number; hasCollided: boolean; coeffRestitution: number;
}) => {
  const ke1Before = 0.5 * m1 * v1 * v1;
  const ke2Before = 0.5 * m2 * v2 * v2;
  const keBeforeTotal = ke1Before + ke2Before;

  const ke1After = 0.5 * m1 * v1Post * v1Post;
  const ke2After = 0.5 * m2 * v2Post * v2Post;
  const keAfterTotal = hasCollided ? (ke1After + ke2After) : keBeforeTotal;

  const lostKE = Math.max(0, keBeforeTotal - keAfterTotal);
  const lostPercentage = keBeforeTotal > 0 ? (lostKE / keBeforeTotal) * 100 : 0;

  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 font-mono">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Energy Allocation</span>
        <Badge variant="outline" className={cn(
          "text-[8px] font-bold h-4 px-1.5 uppercase",
          coeffRestitution === 1.0 ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/5" : "border-rose-500/25 text-rose-400 bg-rose-500/5"
        )}>
          {coeffRestitution === 1.0 ? "Conserved" : `Lost: ${lostPercentage.toFixed(0)}%`}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-[10px] text-white/50">
          <span>Initial: <strong className="text-white">{keBeforeTotal.toFixed(1)} J</strong></span>
          <span>Post-Impact: <strong className="text-white">{keAfterTotal.toFixed(1)} J</strong></span>
        </div>

        {/* Combined relative allocation bar */}
        <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden flex">
          {keBeforeTotal > 0 ? (
            <>
              {/* Object 1 Energy */}
              <div 
                className="bg-violet-500/80 transition-all duration-300"
                style={{ width: `${((hasCollided ? ke1After : ke1Before) / keBeforeTotal) * (100 - lostPercentage)}%` }}
                title={`KE1: ${(hasCollided ? ke1After : ke1Before).toFixed(1)} J`}
              />
              {/* Object 2 Energy */}
              <div 
                className="bg-cyan-500/80 transition-all duration-300"
                style={{ width: `${((hasCollided ? ke2After : ke2Before) / keBeforeTotal) * (100 - lostPercentage)}%` }}
                title={`KE2: ${(hasCollided ? ke2After : ke2Before).toFixed(1)} J`}
              />
              {/* Dissipated Energy */}
              {hasCollided && lostKE > 0.01 && (
                <div 
                  className="bg-rose-500/80 transition-all duration-300 animate-pulse"
                  style={{ width: `${lostPercentage}%` }}
                  title={`Dissipated Thermal: ${lostKE.toFixed(1)} J`}
                />
              )}
            </>
          ) : (
            <div className="w-full bg-white/5" />
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-between text-[8px] text-white/30 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> KE₁</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> KE₂</span>
          {lostPercentage > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Lost / Friction</span>}
        </div>
      </div>
    </div>
  );
};

// --- EnvironmentConfig Card wrapper ---
const ControlCard = ({ title, icon: Icon, children, color }: any) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 md:p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
       <Icon className="w-24 h-24" style={{ color }} />
    </div>
    <div className="flex items-center gap-3 relative z-10">
       <div className="p-2 rounded-lg bg-white/5" style={{ color }}>
          <Icon className="w-5 h-5" />
       </div>
       <h3 className="text-sm font-black uppercase tracking-widest text-white/90">{title}</h3>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export default function CollisionSimulator() {
  // --- Standard Physics parameters ---
  const [mass1, setMass1] = useState(2.0); // kg
  const [mass2, setMass2] = useState(5.0); // kg
  const [v1, setV1] = useState(4.0);       // m/s (Initial velocity slider)
  const [v2, setV2] = useState(-2.0);      // m/s (Initial velocity slider)
  const [coeffRestitution, setCoeffRestitution] = useState(1.0); // e = 1 for elastic
  const [collisionType, setCollisionType] = useState<"elastic" | "inelastic">("elastic");

  // --- Advanced Playback & Controls state ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [timeScale, setTimeScale] = useState(1.0);     // 1.0, 0.5, 0.2, 0.05
  const [autoSlowMo, setAutoSlowMo] = useState(false); // cinematic slow-mo near impact
  const [freezeAtImpact, setFreezeAtImpact] = useState(false); // stop sim frame-by-frame on hit
  
  // --- Calibration overlays ---
  const [showCoM, setShowCoM] = useState(true);
  const [showForceVectors, setShowForceVectors] = useState(true);
  const [showGridOverlays, setShowGridOverlays] = useState(true);
  
  const [time, setTime] = useState(0);
  const [pos1, setPos1] = useState(0.2); // normalised pos of ball 1
  const [pos2, setPos2] = useState(0.6); // normalised pos of ball 2
  const [hasCollided, setHasCollided] = useState(false);
  const [collisionTime, setCollisionTime] = useState<number | null>(null);

  const [showVectors, setShowVectors] = useState({
    velocity: true,
    momentum: true,
  });
  const [showTrail, setShowTrail] = useState(true);

  // Analytical record of velocities at impact moment
  const [collisionData, setCollisionData] = useState<{
    v1Pre: number;
    v2Pre: number;
    v1Post: number;
    v2Post: number;
  }>({
    v1Pre: 4.0,
    v2Pre: -2.0,
    v1Post: 0,
    v2Post: 0,
  });

  const [graphs, setGraphs] = useState({
    v1: [] as any[],
    v2: [] as any[],
    pTotal: [] as any[],
    keTotal: [] as any[],
    ke1: [] as any[],
    ke2: [] as any[],
  });

  const lastTimeRef = useRef<number | null>(null);
  const pos1Ref = useRef(0.2);
  const pos2Ref = useRef(0.6);
  const v1Ref = useRef(4.0);
  const v2Ref = useRef(-2.0);
  const collidedRef = useRef(false);
  const timeRef = useRef(0);
  
  const graphsRef = useRef({
    v1: [] as any[],
    v2: [] as any[],
    pTotal: [] as any[],
    keTotal: [] as any[],
    ke1: [] as any[],
    ke2: [] as any[],
  });

  const handleCollisionTypeChange = (type: "elastic" | "inelastic") => {
    setCollisionType(type);
    if (type === "elastic") {
      setCoeffRestitution(1.0);
    } else {
      setCoeffRestitution(0.0);
    }
  };

  // --- Derived Kinetic values ---
  const e = collisionType === "elastic" ? 1.0 : coeffRestitution;
  const v1PostCalculated = ((mass1 - e * mass2) * v1 + (1 + e) * mass2 * v2) / (mass1 + mass2);
  const v2PostCalculated = ((mass2 - e * mass1) * v2 + (1 + e) * mass1 * v1) / (mass1 + mass2);

  const ke1Before = 0.5 * mass1 * v1 * v1;
  const ke2Before = 0.5 * mass2 * v2 * v2;
  const keBeforeTotal = ke1Before + ke2Before;

  const ke1After = 0.5 * mass1 * v1PostCalculated * v1PostCalculated;
  const ke2After = 0.5 * mass2 * v2PostCalculated * v2PostCalculated;
  const keAfterTotal = ke1After + ke2After;

  // --- Main Physics Loop (Real-Time Run) ---
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;
    const update = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        animationFrameId = requestAnimationFrame(update);
        return;
      }

      const frameDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // ── Physical Dilation & Time Scale Multiplier ──
      let activeTimeScale = timeScale;
      
      // Cinematic slow-mo around impact
      if (autoSlowMo && !collidedRef.current) {
        const r1 = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
        const r2 = Math.max(18, Math.min(42, 16 + mass2 * 2.5));
        const limitCollisionDist = (r1 + r2) / 640;
        
        const dist = pos2Ref.current - pos1Ref.current;
        const criticalDist = limitCollisionDist * 2.2;
        
        if (dist < criticalDist) {
          const factor = Math.max(0, dist / criticalDist);
          activeTimeScale = 0.15 + 0.85 * factor; // drops smoothly to 15% speed!
        }
      }

      const dt = Math.min(frameDt, 0.03) * activeTimeScale;

      // Update simulation clock
      timeRef.current += dt;
      const currentTime = timeRef.current;

      const r1 = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
      const r2 = Math.max(18, Math.min(42, 16 + mass2 * 2.5));
      const limitCollisionDist = (r1 + r2) / 640;
      const rn1 = r1 / 640;
      const rn2 = r2 / 640;

      let nextPos1 = pos1Ref.current + v1Ref.current * dt;
      let nextPos2 = pos2Ref.current + v2Ref.current * dt;

      // Detect and resolve collision
      if (!collidedRef.current && (nextPos2 - nextPos1 <= limitCollisionDist)) {
        // Resolve overlap
        const overlap = limitCollisionDist - (nextPos2 - nextPos1);
        nextPos1 -= overlap / 2;
        nextPos2 += overlap / 2;

        const preV1 = v1Ref.current;
        const preV2 = v2Ref.current;

        // Apply dynamic formulas
        const finalV1 = ((mass1 - e * mass2) * preV1 + (1 + e) * mass2 * preV2) / (mass1 + mass2);
        const finalV2 = ((mass2 - e * mass1) * preV2 + (1 + e) * mass1 * preV1) / (mass1 + mass2);

        v1Ref.current = finalV1;
        v2Ref.current = finalV2;
        collidedRef.current = true;
        setHasCollided(true);
        setCollisionTime(currentTime);

        setCollisionData({
          v1Pre: preV1,
          v2Pre: preV2,
          v1Post: finalV1,
          v2Post: finalV2,
        });

        // Freeze simulation at impact trigger
        if (freezeAtImpact) {
          setIsPlaying(false);
          lastTimeRef.current = null;
        }
      }

      // Wall bumper rebound collision (elastic walls)
      if (nextPos1 < rn1) {
        nextPos1 = rn1;
        v1Ref.current = -v1Ref.current;
      }
      if (nextPos2 > 1.0 - rn2) {
        nextPos2 = 1.0 - rn2;
        v2Ref.current = -v2Ref.current;
      }

      pos1Ref.current = nextPos1;
      pos2Ref.current = nextPos2;

      setTime(currentTime);
      setPos1(nextPos1);
      setPos2(nextPos2);

      // Record telemetry graphs
      const currentV1 = v1Ref.current;
      const currentV2 = v2Ref.current;
      const pTotalVal = mass1 * currentV1 + mass2 * currentV2;
      const ke1Val = 0.5 * mass1 * currentV1 * currentV1;
      const ke2Val = 0.5 * mass2 * currentV2 * currentV2;
      const keTotalVal = ke1Val + ke2Val;

      graphsRef.current = {
        v1: [...graphsRef.current.v1, { time: currentTime, value: currentV1 }].slice(-100),
        v2: [...graphsRef.current.v2, { time: currentTime, value: currentV2 }].slice(-100),
        pTotal: [...graphsRef.current.pTotal, { time: currentTime, value: pTotalVal }].slice(-100),
        keTotal: [...graphsRef.current.keTotal, { time: currentTime, value: keTotalVal }].slice(-100),
        ke1: [...graphsRef.current.ke1, { time: currentTime, value: ke1Val }].slice(-100),
        ke2: [...graphsRef.current.ke2, { time: currentTime, value: ke2Val }].slice(-100),
      };
      setGraphs(graphsRef.current);

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, mass1, mass2, e, v1, v2, timeScale, autoSlowMo, freezeAtImpact]);

  // Synchronise state parameters
  useEffect(() => {
    if (!isPlaying) {
      v1Ref.current = v1;
      v2Ref.current = v2;
      pos1Ref.current = 0.2;
      pos2Ref.current = 0.6;
      timeRef.current = 0;
      collidedRef.current = false;

      setPos1(0.2);
      setPos2(0.6);
      setTime(0);
      setHasCollided(false);
      setCollisionTime(null);
      setCollisionData({
        v1Pre: v1,
        v2Pre: v2,
        v1Post: 0,
        v2Post: 0,
      });
      graphsRef.current = {
        v1: [], v2: [], pTotal: [], keTotal: [], ke1: [], ke2: []
      };
      setGraphs({
        v1: [], v2: [], pTotal: [], keTotal: [], ke1: [], ke2: []
      });
    }
  }, [v1, v2, mass1, mass2, e, isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setTime(0);
    setPos1(0.2);
    setPos2(0.6);
    pos1Ref.current = 0.2;
    pos2Ref.current = 0.6;
    timeRef.current = 0;
    v1Ref.current = v1;
    v2Ref.current = v2;
    collidedRef.current = false;
    setHasCollided(false);
    setCollisionTime(null);
    setCollisionData({
      v1Pre: v1,
      v2Pre: v2,
      v1Post: 0,
      v2Post: 0,
    });
    graphsRef.current = {
      v1: [], v2: [], pTotal: [], keTotal: [], ke1: [], ke2: []
    };
    setGraphs({
      v1: [], v2: [], pTotal: [], keTotal: [], ke1: [], ke2: []
    });
  }, [v1, v2]);

  // Frame Step action (frame-by-frame analysis)
  const handleStep = () => {
    if (isPlaying) return;
    
    const dt = 0.008; // 8ms analysis steps
    timeRef.current += dt;
    const currentTime = timeRef.current;

    const r1 = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
    const r2 = Math.max(18, Math.min(42, 16 + mass2 * 2.5));
    const limitCollisionDist = (r1 + r2) / 640;
    const rn1 = r1 / 640;
    const rn2 = r2 / 640;

    let nextPos1 = pos1Ref.current + v1Ref.current * dt;
    let nextPos2 = pos2Ref.current + v2Ref.current * dt;

    if (!collidedRef.current && (nextPos2 - nextPos1 <= limitCollisionDist)) {
      const overlap = limitCollisionDist - (nextPos2 - nextPos1);
      nextPos1 -= overlap / 2;
      nextPos2 += overlap / 2;

      const preV1 = v1Ref.current;
      const preV2 = v2Ref.current;

      const finalV1 = ((mass1 - e * mass2) * preV1 + (1 + e) * mass2 * preV2) / (mass1 + mass2);
      const finalV2 = ((mass2 - e * mass1) * preV2 + (1 + e) * mass1 * preV1) / (mass1 + mass2);

      v1Ref.current = finalV1;
      v2Ref.current = finalV2;
      collidedRef.current = true;
      setHasCollided(true);
      setCollisionTime(currentTime);

      setCollisionData({
        v1Pre: preV1,
        v2Pre: preV2,
        v1Post: finalV1,
        v2Post: finalV2,
      });
    }

    if (nextPos1 < rn1) {
      nextPos1 = rn1;
      v1Ref.current = -v1Ref.current;
    }
    if (nextPos2 > 1.0 - rn2) {
      nextPos2 = 1.0 - rn2;
      v2Ref.current = -v2Ref.current;
    }

    pos1Ref.current = nextPos1;
    pos2Ref.current = nextPos2;

    setTime(currentTime);
    setPos1(nextPos1);
    setPos2(nextPos2);

    const currentV1 = v1Ref.current;
    const currentV2 = v2Ref.current;
    const pTotalVal = mass1 * currentV1 + mass2 * currentV2;
    const ke1Val = 0.5 * mass1 * currentV1 * currentV1;
    const ke2Val = 0.5 * mass2 * currentV2 * currentV2;
    const keTotalVal = ke1Val + ke2Val;

    graphsRef.current = {
      v1: [...graphsRef.current.v1, { time: currentTime, value: currentV1 }].slice(-100),
      v2: [...graphsRef.current.v2, { time: currentTime, value: currentV2 }].slice(-100),
      pTotal: [...graphsRef.current.pTotal, { time: currentTime, value: pTotalVal }].slice(-100),
      keTotal: [...graphsRef.current.keTotal, { time: currentTime, value: keTotalVal }].slice(-100),
      ke1: [...graphsRef.current.ke1, { time: currentTime, value: ke1Val }].slice(-100),
      ke2: [...graphsRef.current.ke2, { time: currentTime, value: ke2Val }].slice(-100),
    };
    setGraphs(graphsRef.current);
  };

  // --- Dynamic state text analyzer ---
  const getPhysicsInsights = () => {
    const relSpeed = Math.abs(v1 - v2);
    
    if (!hasCollided) {
      let txt = `System loaded. Projectiles are approaching with a relative velocity of ${relSpeed.toFixed(1)} m/s. `;
      if (v1 > 0 && v2 < 0) {
        txt += "A high-velocity head-on collision is expected. ";
      } else if (v1 > v2) {
        txt += "Object 1 is overtaking Object 2 from behind. ";
      } else {
        txt += "Warning: Objects are separating. Adjust initial velocity configuration to establish collision trajectory. ";
      }
      
      if (Math.abs(mass1 - mass2) < 0.1) {
        txt += `Equal mass configuration (${mass1.toFixed(1)} kg) will trigger total speed-swapping.`;
      } else if (mass1 > mass2 * 3.5) {
        txt += `Heavy projectile (m₁ = ${mass1.toFixed(1)} kg) will heavily accelerate the light target (m₂ = ${mass2.toFixed(1)} kg).`;
      } else if (mass2 > mass1 * 3.5) {
        txt += `Light projectile will reflect backwards off the heavy mass obstacle.`;
      }
      return txt;
    } else {
      let txt = `Impact resolved. `;
      if (e === 1.0) {
        txt += "Perfect elastic collision (restitution e = 1.0). Total kinetic energy is perfectly conserved across the bounce. ";
        if (Math.abs(mass1 - mass2) < 0.1) {
          txt += "Velocities have cleanly swapped between objects! Object 1 completely halted its motion if Object 2 was at rest.";
        } else if (mass1 > mass2 * 3.5) {
          txt += "Heavy projectile continued almost uninterrupted, whereas the light target was projected at nearly twice the initial velocity.";
        } else if (mass2 > mass1 * 3.5) {
          txt += "Lighter target bounced backwards at high velocity, leaving the heavy obstacle virtually unaffected.";
        }
      } else if (e === 0.0) {
        const dissipated = Math.max(0, keBeforeTotal - keAfterTotal);
        txt += `Perfect inelastic collision (e = 0.0). System stuck together at a single unified velocity. A total of ${dissipated.toFixed(1)} J of kinetic energy was dissipated into thermal heat and internal work.`;
      } else {
        const dissipated = Math.max(0, keBeforeTotal - keAfterTotal);
        txt += `Partially inelastic collision (e = ${e.toFixed(2)}). Relative speed reduced to ${Math.abs(collisionData.v1Post - collisionData.v2Post).toFixed(1)} m/s. Kinetic energy loss of ${dissipated.toFixed(1)} J detected.`;
      }
      return txt;
    }
  };

  // State monitoring variables
  const getActivePhase = () => {
    if (!isPlaying && time === 0) return { label: "Engine Offline", color: "text-zinc-400 border-zinc-500/20 bg-zinc-500/5" };
    if (!isPlaying) return { label: "Simulation Frozen", color: "text-amber-400 border-amber-500/20 bg-amber-500/5 animate-pulse" };
    
    if (!hasCollided) {
      return { label: "Phase I: Approaching", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" };
    }
    
    const timeSinceCollision = time - collisionTime!;
    if (timeSinceCollision < 0.12) {
      return { label: "Phase II: Force Compression", color: "text-red-400 border-red-500/20 bg-red-500/5 animate-pulse" };
    } else if (timeSinceCollision < 0.28) {
      return { label: "Phase III: Material Expansion", color: "text-violet-400 border-violet-500/20 bg-violet-500/5" };
    } else {
      const r1 = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
      const r2 = Math.max(18, Math.min(42, 16 + mass2 * 2.5));
      const rn1 = r1 / 640;
      const rn2 = r2 / 640;
      if (pos1 <= rn1 + 0.015 || pos2 >= 1.0 - rn2 - 0.015) {
        return { label: "Phase V: Terminal Spring bumper", color: "text-rose-400 border-rose-500/20 bg-rose-500/5 animate-pulse" };
      }
      return { label: "Phase IV: Separation Flow", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
    }
  };

  const activePhase = getActivePhase();

  const renderCanvasTab = () => (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      <div className="flex-1 p-4 md:p-6 relative flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Dominant Visual Columns */}
        <div className="flex-1 z-10 flex flex-col gap-5 min-w-0">
          
          {/* Main Telemetry Canvas */}
          <div className="flex-1 relative min-h-[360px]">
             <CollisionCanvas 
                 mass1={mass1}
                 mass2={mass2}
                 v1={v1}
                 v2={v2}
                 v1Post={collisionData.v1Post}
                 v2Post={collisionData.v2Post}
                 pos1={pos1}
                 pos2={pos2}
                 isPlaying={isPlaying}
                 hasCollided={hasCollided}
                 collisionType={collisionType}
                 showVectors={showVectors}
                 showTrail={showTrail}
                 time={time}
                 keBefore={keBeforeTotal}
                 keAfter={keAfterTotal}
                 coeffRestitution={e}
                 
                 showCoM={showCoM}
                 showForceVectors={showForceVectors}
                 showGridOverlays={showGridOverlays}
             />
          </div>
          
          {/* Calibration sensor layers toggles */}
          <div className="bg-[#18181b] border border-white/5 rounded-[24px] p-4 flex flex-wrap items-center justify-center gap-6 md:gap-8 overflow-x-auto no-scrollbar shrink-0 shadow-lg">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Sensor Layers</span>
            
            {[
                { id: 'velocity', label: 'Velocity Vector (v)', color: 'bg-amber-500', active: showVectors.velocity, toggle: () => setShowVectors({...showVectors, velocity: !showVectors.velocity}) },
                { id: 'momentum', label: 'Momentum Vector (p)', color: 'bg-pink-500', active: showVectors.momentum, toggle: () => setShowVectors({...showVectors, momentum: !showVectors.momentum}) },
                { id: 'forces', label: 'Reaction Force (F)', color: 'bg-red-500', active: showForceVectors, toggle: () => setShowForceVectors(!showForceVectors) },
                { id: 'com', label: 'Center of Mass (CoM)', color: 'bg-yellow-500', active: showCoM, toggle: () => setShowCoM(!showCoM) },
                { id: 'grid', label: 'Metric Grid', color: 'bg-blue-400', active: showGridOverlays, toggle: () => setShowGridOverlays(!showGridOverlays) }
            ].map(v => (
                <button 
                  key={v.id} 
                  onClick={v.toggle}
                  className={cn(
                    "flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider hover:border-white/10 active:scale-95",
                    v.active ? "bg-white/[0.04] border-white/10 text-white/90" : "bg-transparent border-transparent text-white/20 hover:text-white/40"
                  )}
                >
                    <div className={cn("w-2 h-2 rounded-full", v.color, v.active ? "opacity-100" : "opacity-35")} />
                    <span>{v.label}</span>
                </button>
            ))}
          </div>

          {/* Time Dilation & Replay Overlays */}
          <div className="bg-[#18181b]/45 border border-white/5 rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5" /> Time Dilation</span>
              <div className="flex items-center gap-2">
                {[
                  { label: "1.0x (Normal)", scale: 1.0 },
                  { label: "0.5x (Slow)", scale: 0.5 },
                  { label: "0.2x (Camera)", scale: 0.2 },
                  { label: "0.05x (Detail)", scale: 0.05 },
                ].map(opt => (
                  <button
                    key={opt.scale}
                    onClick={() => setTimeScale(opt.scale)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border",
                      timeScale === opt.scale ? "bg-primary border-primary/50 text-white shadow-sm" : "bg-white/5 border-transparent text-white/40 hover:text-white/60 hover:bg-white/10"
                    )}
                  >
                    {opt.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer group text-[9px] font-black uppercase tracking-widest text-white/40 select-none">
                <input 
                  type="checkbox" checked={autoSlowMo} onChange={(e) => setAutoSlowMo(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0" 
                />
                <span className="group-hover:text-white/60 transition-colors">Auto Slow-Mo at Impact</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group text-[9px] font-black uppercase tracking-widest text-white/40 select-none">
                <input 
                  type="checkbox" checked={freezeAtImpact} onChange={(e) => setFreezeAtImpact(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0" 
                />
                <span className="group-hover:text-white/60 transition-colors">Freeze at Impact</span>
              </label>
            </div>
          </div>

          {/* Master Tactile Laboratory Console */}
          <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl shrink-0">
              
              {/* Play / Step / Reset core controls */}
              <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95",
                        isPlaying ? "bg-red-500 shadow-red-500/20" : "bg-primary shadow-primary/20"
                    )}
                    title={isPlaying ? "Pause Simulation" : "Play Simulation"}
                  >
                      {isPlaying ? <Pause className="w-5 h-5 text-white fill-current" /> : <Play className="w-5 h-5 text-white fill-current ml-0.5" />}
                  </button>
                  
                  <button 
                    onClick={handleStep}
                    disabled={isPlaying}
                    className={cn(
                      "w-11 h-11 rounded-xl transition-all border flex items-center justify-center active:scale-95",
                      isPlaying ? "opacity-25 bg-white/5 border-transparent cursor-not-allowed" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-primary"
                    )}
                    title="Advance Single Frame (0.008s)"
                  >
                      <ChevronRight className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={handleReset}
                    className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 flex items-center justify-center active:scale-95"
                    title="Reset Simulation State"
                  >
                      <RotateCcw className="w-4 h-4 text-white/40" />
                  </button>
              </div>

              <div className="h-8 w-px bg-white/10 hidden md:block" />

              {/* Time and Blinking State Badge */}
              <div className="flex flex-col gap-1 shrink-0 select-none">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.25em]">Laboratory Clock</span>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-mono font-black text-white">{time.toFixed(3)}s</span>
                  <div className={cn("px-2 py-0.5 border text-[8px] font-black uppercase tracking-wider rounded-md transition-all duration-300", activePhase.color)}>
                    {activePhase.label}
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden md:block" />

              {/* Instant HUD Param sliders */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-xs">
                {[
                  { l: "m₁", val: mass1, unit: "kg", onChange: setMass1, color: "text-violet-400", min: 0.5, max: 10.0, step: 0.5 },
                  { l: "m₂", val: mass2, unit: "kg", onChange: setMass2, color: "text-cyan-400", min: 0.5, max: 10.0, step: 0.5 },
                  { l: "v₁", val: v1, unit: "m/s", onChange: setV1, color: "text-amber-400", min: -6.0, max: 6.0, step: 0.5 },
                  { l: "v₂", val: v2, unit: "m/s", onChange: setV2, color: "text-emerald-400", min: -6.0, max: 6.0, step: 0.5 },
                ].map(param => (
                  <div key={param.l} className="flex flex-col gap-1 bg-white/[0.02] border border-white/[0.03] px-3 py-2 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-white/30 uppercase">{param.l}</span>
                      <span className={cn("font-mono font-bold", param.color)}>{param.val.toFixed(1)} <span className="text-[8px] text-white/20 uppercase">{param.unit}</span></span>
                    </div>
                    <input 
                      type="range" min={param.min} max={param.max} step={param.step} value={param.val}
                      onChange={(e) => param.onChange(parseFloat(e.target.value))}
                      disabled={isPlaying}
                      className={cn("w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer disabled:opacity-20", param.color.includes("violet") ? "accent-violet-500" : param.color.includes("cyan") ? "accent-cyan-500" : param.color.includes("amber") ? "accent-amber-500" : "accent-emerald-500")}
                    />
                  </div>
                ))}
              </div>
          </div>
        </div>

        {/* Master Right-Side Telemetry Channel */}
        <div className="w-full lg:w-[420px] flex flex-col gap-5 z-10 overflow-y-auto custom-scrollbar pr-1 select-none shrink-0">
          
          {/* Phase Pulse: Interactive Science Telemetry monitor */}
          <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
               <BookOpen className="w-24 h-24 text-primary" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                 <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Activity className="w-4 h-4" />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Phase Pulse Tracker</h3>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[8px] font-black text-white/35 uppercase tracking-widest">Active Sensor</span>
              </div>
            </div>

            {/* Dynamic Interactive Science Readout */}
            <p className="text-white/60 text-xs leading-relaxed italic relative z-10 min-h-[46px] border-l-2 border-primary/25 pl-3">
              {getPhysicsInsights()}
            </p>

            {/* Live mathematical conservation Substitution grid */}
            <ScientificPipeline 
              m1={mass1}
              m2={mass2}
              v1Pre={collisionData.v1Pre}
              v2Pre={collisionData.v2Pre}
              v1Post={collisionData.v1Post}
              v2Post={collisionData.v2Post}
              hasCollided={hasCollided}
            />

            {/* Live Combined Energy Allocation Widget */}
            <EnergyWidget 
              m1={mass1}
              m2={mass2}
              v1={v1}
              v2={v2}
              v1Post={collisionData.v1Post}
              v2Post={collisionData.v2Post}
              hasCollided={hasCollided}
              coeffRestitution={e}
            />
          </div>

          {/* Real-time Telemetry Graphs grid */}
          <div className="space-y-4">
              <CollisionGraphs 
                v1Data={graphs.v1}
                v2Data={graphs.v2}
                pTotalData={graphs.pTotal}
                keTotalData={graphs.keTotal}
                ke1Data={graphs.ke1}
                ke2Data={graphs.ke2}
                collisionTime={collisionTime}
              />
          </div>
          
          <div className="mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                  <p className="text-xs font-bold text-white tracking-tight">System Environment Suite</p>
                  <p className="text-[10px] text-white/40">Adjust material properties in Config</p>
              </div>
              <button 
                onClick={() => setActiveTab("config")}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 text-primary"
                title="Configure Environment"
              >
                  <SlidersHorizontal className="w-4 h-4" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfigTab = () => (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
      <div className="flex-1 space-y-8 max-w-5xl">
        <div className="space-y-2">
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3.5">
              Laboratory <span className="text-primary">Calibration</span>
              <Badge variant="outline" className="text-[8px] tracking-[0.2em] border-primary/20 text-primary bg-primary/5 uppercase h-5 font-black">Environmental</Badge>
           </h2>
           <p className="text-white/40 text-xs font-medium">Fine-tune physical friction buffers, material restitution indices, and mechanical object parameters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <ControlCard title="Material Restitution Mode" icon={Target} color="#8b5cf6">
               <div className="space-y-6">
                  <div className="flex gap-2.5">
                      <button 
                        onClick={() => handleCollisionTypeChange("elastic")}
                        className={cn(
                            "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            collisionType === "elastic" ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                          Elastic (e = 1.0)
                      </button>
                      <button 
                        onClick={() => handleCollisionTypeChange("inelastic")}
                        className={cn(
                            "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            collisionType === "inelastic" ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                          Inelastic (e &lt; 1.0)
                      </button>
                  </div>
                  {collisionType === "inelastic" && (
                    <ClickableValue 
                      label="Coefficient of Restitution (e)"
                      value={coeffRestitution}
                      unit=""
                      min={0.0}
                      max={0.99}
                      step={0.05}
                      onChange={setCoeffRestitution}
                      colorClass="text-rose-400"
                    />
                  )}
               </div>
            </ControlCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ControlCard title="Object Mass Specification" icon={Zap} color="#10b981">
               <div className="space-y-5">
                  <ClickableValue 
                    label="Mass of m₁"
                    value={mass1}
                    unit="kg"
                    min={0.5}
                    max={10.0}
                    step={0.5}
                    onChange={setMass1}
                    colorClass="text-emerald-400"
                  />
                  <ClickableValue 
                    label="Mass of m₂"
                    value={mass2}
                    unit="kg"
                    min={0.5}
                    max={10.0}
                    step={0.5}
                    onChange={setMass2}
                    colorClass="text-cyan-400"
                  />
               </div>
            </ControlCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <ControlCard title="Initial Launch Kinematics" icon={RotateCcw} color="#06b6d4">
               <div className="space-y-5">
                  <ClickableValue 
                    label="Velocity Vector v₁"
                    value={v1}
                    unit="m/s"
                    min={-6.0}
                    max={6.0}
                    step={0.5}
                    onChange={setV1}
                    colorClass="text-cyan-400"
                  />
                  <ClickableValue 
                    label="Velocity Vector v₂"
                    value={v2}
                    unit="m/s"
                    min={-6.0}
                    max={6.0}
                    step={0.5}
                    onChange={setV2}
                    colorClass="text-cyan-400"
                  />
               </div>
            </ControlCard>
          </motion.div>

          <ControlCard title="Visual Layer Calibration" icon={Layers} color="#ec4899">
             <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                {[
                  { label: "Velocity Vectors", active: showVectors.velocity, toggle: () => setShowVectors({...showVectors, velocity: !showVectors.velocity}) },
                  { label: "Momentum Vectors", active: showVectors.momentum, toggle: () => setShowVectors({...showVectors, momentum: !showVectors.momentum}) },
                  { label: "Friction Trails", active: showTrail, toggle: () => setShowTrail(!showTrail) },
                  { label: "Newton Force (F)", active: showForceVectors, toggle: () => setShowForceVectors(!showForceVectors) },
                  { label: "Center of Mass", active: showCoM, toggle: () => setShowCoM(!showCoM) },
                  { label: "Fine Metric Grid", active: showGridOverlays, toggle: () => setShowGridOverlays(!showGridOverlays) }
                ].map((item) => (
                    <button
                        key={item.label}
                        onClick={item.toggle}
                        className={cn(
                            "px-3.5 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95",
                            item.active 
                                ? "bg-white/10 text-white border-white/20 shadow-md" 
                                : "bg-transparent text-white/20 border-white/5 hover:border-white/10 hover:text-white/30"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
             </div>
          </ControlCard>
        </div>
      </div>

      {/* Configuration analysis sidebar */}
      <div className="w-full lg:w-80 space-y-6 shrink-0 select-none">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden h-full">
           <div className="space-y-1">
             <h3 className="text-base font-black uppercase tracking-tight text-white">Dynamic Matrix</h3>
             <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.25em] leading-none">Pre-Calculated Conservation Matrix</p>
           </div>
           
           <div className="space-y-5">
               {[
                   { label: "Total System Momentum", val: (mass1 * v1 + mass2 * v2).toFixed(2), unit: "kg·m/s", c: "text-pink-400" },
                   { label: "Kinetic Energy Before", val: keBeforeTotal.toFixed(2), unit: "J", c: "text-amber-400" },
                   { label: "Kinetic Energy After", val: keAfterTotal.toFixed(2), unit: "J", c: "text-emerald-400" },
                   { label: "Calculated Dissipation", val: Math.max(0, keBeforeTotal - keAfterTotal).toFixed(2), unit: "J", c: "text-rose-400" },
               ].map(stat => (
                   <div key={stat.label} className="flex justify-between items-end border-b border-white/[0.03] pb-2 group">
                       <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{stat.label}</span>
                       <span className={cn("text-xs font-mono font-bold", stat.c)}>{stat.val} <span className="text-[8px] text-white/35 font-normal">{stat.unit}</span></span>
                   </div>
               ))}
           </div>

           <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Scientific Relations</h4>
                    <Calculator className="w-3.5 h-3.5 text-primary/40" />
                </div>
                
                <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 group hover:border-primary/25 transition-all">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-mono font-bold text-primary">Σp = m₁v₁ + m₂v₂</span>
                        <span className="text-xs font-mono font-black text-white">{(mass1 * v1 + mass2 * v2).toFixed(2)} N·s</span>
                      </div>
                      <p className="text-[8px] font-mono text-white/20">Substitute: ({mass1}×{v1}) + ({mass2}×{v2})</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 group hover:border-primary/25 transition-all">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-mono font-bold text-primary">KE_tot = ½m₁v₁² + ½m₂v₂²</span>
                        <span className="text-xs font-mono font-black text-white">{keBeforeTotal.toFixed(1)} J</span>
                      </div>
                      <p className="text-[8px] font-mono text-white/20">Substitute: 0.5×{mass1}×{v1}² + 0.5×{mass2}×{v2}²</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 space-y-1 group hover:border-primary/25 transition-all">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-mono font-bold text-primary">e = |v₂&apos;-v₁&apos;| / |v₁-v₂|</span>
                        <span className="text-xs font-mono font-black text-white">{e.toFixed(2)}</span>
                      </div>
                      <p className="text-[8px] font-mono text-white/20">Substitute: |{v2PostCalculated.toFixed(1)}-{v1PostCalculated.toFixed(1)}| / |{v1}-{v2}|</p>
                    </div>
                </div>
           </div>

           <div className="pt-6 border-t border-white/5">
                <button 
                    onClick={handleReset}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-Calibrate Matrix
                </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <SimulationPageLayout 
      title="Collision & Momentum"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeTab === "canvas" && renderCanvasTab()}
            {activeTab === "config" && renderConfigTab()}
            {activeTab === "theory" && (
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-[#09090b]">
                   <div className="max-w-4xl mx-auto space-y-8">
                      <div className="space-y-2">
                         <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                            Theoretical <span className="text-primary">Basis</span>
                         </h2>
                         <p className="text-white/40 text-xs font-medium">Deep-dive into linear momentum vectors, coefficient of restitution matrices, and kinetic energy dissipation thermodynamics.</p>
                      </div>
                      <CollisionTheory />
                   </div>
                </div>
            )}
            {activeTab === "guide" && (
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-[#09090b] flex items-center justify-center">
                   <div className="text-center space-y-6 max-w-lg">
                      <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mx-auto border border-primary/20">
                         <BookOpen className="w-8 h-8 text-primary" />
                      </div>
                      
                      <div className="space-y-2">
                         <h2 className="text-xl font-bold uppercase tracking-widest text-white">Collision Lab Guide</h2>
                         <p className="text-white/40 text-xs leading-relaxed">
                            Welcome to the high-precision Collision Laboratory. Access the <strong>Simulation Canvas</strong> to visualize real-time reaction forces, center of mass conservation, and momentum trails. Click on <strong>Environment Config</strong> to fine-tune elasticity indices or input precise direct parameter quantities.
                         </p>
                      </div>

                      <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 text-left space-y-3.5">
                         <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Quick Calibration Guides</h4>
                         <ul className="space-y-3 text-xs text-white/60 font-medium">
                            <li className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <span>Toggle <strong>Freeze at Impact</strong> to catch the precise deformation frame and Newton contact forces F₁₂, F₂₁.</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <span>Use the <strong>Frame Step</strong> button to analyze vectors frame-by-frame after freezing.</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <span>Adjust the <strong>Mass Specification</strong> sliders to see how velocity vectors scale and transfer.</span>
                            </li>
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

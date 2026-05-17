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

const VISUAL_SPEED_SCALE = 0.08;

interface InlineEditableValueProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  disabled?: boolean;
  onChange: (val: number) => void;
}

const InlineEditableValue: React.FC<InlineEditableValueProps> = ({
  value, min, max, unit, color, disabled, onChange
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

  if (disabled) {
    return (
      <span className={cn("font-mono font-bold select-none", color)}>
        {value.toFixed(1)} <span className="text-[8px] text-white/20 uppercase">{unit}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-16 bg-white/10 border border-white/20 focus:ring-1 focus:ring-primary focus:outline-none rounded px-1 text-center font-mono font-bold text-white text-[11px]"
          autoFocus
          step="any"
        />
      ) : (
        <span 
          onClick={() => setIsEditing(true)}
          className={cn("font-mono font-bold cursor-pointer hover:bg-white/5 px-1.5 py-0.5 rounded transition-all select-none border border-transparent hover:border-white/10", color)}
          title="Click to type"
        >
          {value.toFixed(1)} <span className="text-[8px] text-white/20 uppercase">{unit}</span>
        </span>
      )}
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

// --- Real-Time Equations & Derivations Panel ---
const EquationsDerivationsPanel = ({ 
  m1, m2, v1, v2, u1, u2, pos1, pos2, e, inContact, contactForce 
}: {
  m1: number; m2: number; v1: number; v2: number; u1: number; u2: number; pos1: number; pos2: number; e: number; inContact: boolean; contactForce: number;
}) => {
  const p1 = m1 * v1;
  const p2 = m2 * v2;
  const pTotal = p1 + p2;

  const ke1 = 0.5 * m1 * v1 * v1;
  const ke2 = 0.5 * m2 * v2 * v2;
  const keTotal = ke1 + ke2;

  const pBefore = m1 * u1 + m2 * u2;
  const deltaP = pTotal - pBefore;

  const J1 = m1 * (v1 - u1);
  const J2 = m2 * (v2 - u2);

  const track1 = pos1 * 10;
  const track2 = pos2 * 10;
  const xCom = (m1 * track1 + m2 * track2) / (m1 + m2);
  const vCom = (m1 * v1 + m2 * v2) / (m1 + m2);

  const relVelocityPre = Math.abs(u1 - u2);
  const relVelocityPost = Math.abs(v1 - v2);
  const eMeasured = relVelocityPre > 0.01 ? relVelocityPost / relVelocityPre : 0;

  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3.5 font-mono">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">Real-Time Derivations</span>
        </div>
        <Badge variant="outline" className="text-[8px] font-bold border-amber-500/25 text-amber-400 bg-amber-500/5 h-4 px-1.5 uppercase">
          Live Equations
        </Badge>
      </div>

      <div className="space-y-3 text-[10px] leading-relaxed">
        {/* Momentum Section */}
        <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl hover:border-violet-500/25 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] font-black text-violet-400 uppercase tracking-wider">1. Momentum (p = mv)</span>
            <span className="text-white/30 text-[8px] font-bold">p_total = p₁ + p₂</span>
          </div>
          <div className="text-white/60 space-y-0.5">
            <div>
              p₁ = ({m1.toFixed(2)} kg)·({v1 >= 0 ? "+" : ""}{v1.toFixed(2)} m/s) = <strong className="text-white font-bold">{p1.toFixed(3)}</strong> kg·m/s
            </div>
            <div>
              p₂ = ({m2.toFixed(2)} kg)·({v2 >= 0 ? "+" : ""}{v2.toFixed(2)} m/s) = <strong className="text-white font-bold">{p2.toFixed(3)}</strong> kg·m/s
            </div>
            <div className="pt-1.5 border-t border-white/[0.05] text-violet-300 font-bold flex justify-between">
              <span>Σp = {p1.toFixed(2)} + ({p2 >= 0 ? "+" : ""}{p2.toFixed(2)}) =</span>
              <span className="text-white">{pTotal.toFixed(3)} kg·m/s</span>
            </div>
          </div>
        </div>

        {/* Kinetic Energy Section */}
        <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl hover:border-cyan-500/25 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider">2. Kinetic Energy (KE = ½mv²)</span>
            <span className="text-white/30 text-[8px] font-bold">KE_total = KE₁ + KE₂</span>
          </div>
          <div className="text-white/60 space-y-0.5">
            <div>
              KE₁ = 0.5·({m1.toFixed(2)} kg)·({v1.toFixed(2)} m/s)² = <strong className="text-white font-bold">{ke1.toFixed(3)}</strong> J
            </div>
            <div>
              KE₂ = 0.5·({m2.toFixed(2)} kg)·({v2.toFixed(2)} m/s)² = <strong className="text-white font-bold">{ke2.toFixed(3)}</strong> J
            </div>
            <div className="pt-1.5 border-t border-white/[0.05] text-cyan-300 font-bold flex justify-between">
              <span>ΣKE = {ke1.toFixed(2)} + {ke2.toFixed(2)} =</span>
              <span className="text-white">{keTotal.toFixed(3)} J</span>
            </div>
          </div>
        </div>

        {/* Conservation & Restitution Section */}
        <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl hover:border-emerald-500/25 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">3. Conservation & Elasticity</span>
            <span className="text-white/30 text-[8px] font-bold">e = |v₂&apos;-v₁&apos;| / |u₁-u₂|</span>
          </div>
          <div className="text-white/60 space-y-1">
            <div className="flex justify-between">
              <span>Momentum Error (Δp):</span>
              <span className={Math.abs(deltaP) < 0.001 ? "text-emerald-400" : "text-amber-400 font-bold"}>
                {deltaP >= 0 ? "+" : ""}{deltaP.toFixed(5)} kg·m/s
              </span>
            </div>
            <div className="flex justify-between">
              <span>Restitution (Config / Live):</span>
              <span className="text-emerald-300 font-bold">
                e_cfg = {e.toFixed(2)} | e_live = {eMeasured.toFixed(3)}
              </span>
            </div>
            {inContact && (
              <div className="flex justify-between pt-1 border-t border-white/[0.05] text-red-400 font-bold">
                <span>Reaction Force (F_c):</span>
                <span>{contactForce.toFixed(2)} N</span>
              </div>
            )}
          </div>
        </div>

        {/* Center of Mass Section */}
        <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl hover:border-yellow-500/25 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] font-black text-yellow-500 uppercase tracking-wider">4. Center of Mass Dynamics</span>
            <span className="text-white/30 text-[8px] font-bold">x_com = Σmx / Σm</span>
          </div>
          <div className="text-white/60 space-y-0.5">
            <div>
              x_com = [({m1.toFixed(1)}·{track1.toFixed(2)}) + ({m2.toFixed(1)}·{track2.toFixed(2)})] / {(m1 + m2).toFixed(1)} = <strong className="text-white font-bold">{xCom.toFixed(3)}</strong> m
            </div>
            <div className="pt-1.5 border-t border-white/[0.05] text-yellow-300 font-bold flex justify-between">
              <span>V_com = [({m1.toFixed(1)}·{v1.toFixed(1)}) + ({m2.toFixed(1)}·{v2.toFixed(1)})] / {(m1 + m2).toFixed(1)} =</span>
              <span className="text-white">{vCom.toFixed(3)} m/s</span>
            </div>
          </div>
        </div>

        {/* Impulse and Action-Reaction */}
        <div className="space-y-1 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl hover:border-pink-500/25 transition-all">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] font-black text-pink-400 uppercase tracking-wider">5. Impulse & Action-Reaction</span>
            <span className="text-white/30 text-[8px] font-bold">J = Δp = m(v - u)</span>
          </div>
          <div className="text-white/60 space-y-0.5">
            <div>
              J₁ = ({m1.toFixed(2)} kg)·[({v1.toFixed(2)}) - ({u1.toFixed(2)})] = <strong className="text-white font-bold">{J1 >= 0 ? "+" : ""}{J1.toFixed(3)}</strong> N·s
            </div>
            <div>
              J₂ = ({m2.toFixed(2)} kg)·[({v2.toFixed(2)}) - ({u2.toFixed(2)})] = <strong className="text-white font-bold">{J2 >= 0 ? "+" : ""}{J2.toFixed(3)}</strong> N·s
            </div>
            <div className="pt-1.5 border-t border-white/[0.05] text-pink-300 font-bold flex justify-between">
              <span>Net Impulse (ΣJ = J₁ + J₂):</span>
              <span className="text-white">{(J1 + J2).toFixed(3)} N·s</span>
            </div>
          </div>
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
  const [scientificMode, setScientificMode] = useState(true);

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
  const [comReferenceFrame, setComReferenceFrame] = useState(false);
  
  const [time, setTime] = useState(0);
  const [pos1, setPos1] = useState(0.2); // normalised pos of ball 1
  const [pos2, setPos2] = useState(0.6); // normalised pos of ball 2
  const [dynV1, setDynV1] = useState(v1);
  const [dynV2, setDynV2] = useState(v2);
  const [hasCollided, setHasCollided] = useState(false);
  const [collisionTime, setCollisionTime] = useState<number | null>(null);

  const [showVectors, setShowVectors] = useState({
    velocity: true,
    momentum: true,
  });
  const [showTrail, setShowTrail] = useState(true);

  // --- Contact lifecycle state and refs ---
  const [inContact, setInContact] = useState(false);
  const [contactForce, setContactForce] = useState(0);
  const [sq1, setSq1] = useState(1);
  const [sq2, setSq2] = useState(1);

  const inContactRef = useRef(false);
  const contactStartTimeRef = useRef(0);
  const contactPreV1Ref = useRef(0);
  const contactPreV2Ref = useRef(0);
  const contactXcmStartRef = useRef(0);

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
    v1: [] as any[], v2: [] as any[], pTotal: [] as any[],
    keTotal: [] as any[], ke1: [] as any[], ke2: [] as any[],
    impulse: [] as any[], relVel: [] as any[],
    force1: [] as any[], force2: [] as any[],
    impulse1: [] as any[], impulse2: [] as any[], netImpulse: [] as any[],
    xCom: [] as any[], vCom: [] as any[], keDissipated: [] as any[]
  });

  const samples = (graphs.v1 || []).map((item, index) => {
    const t = item.time;
    const v1Val = item.value;
    const v2Val = graphs.v2[index]?.value ?? 0;
    const vComVal = graphs.vCom[index]?.value ?? 0;
    const pTotalVal = graphs.pTotal[index]?.value ?? 0;
    const keTotalVal = graphs.keTotal[index]?.value ?? 0;
    const ke1Val = graphs.ke1[index]?.value ?? 0;
    const ke2Val = graphs.ke2[index]?.value ?? 0;
    const force1Val = graphs.force1[index]?.value ?? 0;
    const force2Val = graphs.force2[index]?.value ?? 0;
    const impulse1Val = graphs.impulse1[index]?.value ?? 0;
    const impulse2Val = graphs.impulse2[index]?.value ?? 0;
    const netImpulseVal = graphs.netImpulse[index]?.value ?? 0;
    const xComVal = graphs.xCom[index]?.value ?? 0;
    const keDissipatedVal = graphs.keDissipated[index]?.value ?? 0;

    return {
      time: t,
      v1: v1Val,
      v2: v2Val,
      vCom: vComVal,
      p1: mass1 * v1Val,
      p2: mass2 * v2Val,
      pTotal: pTotalVal,
      ke1: ke1Val,
      ke2: ke2Val,
      keTotal: keTotalVal,
      force1: force1Val,
      force2: force2Val,
      impulse1: impulse1Val,
      impulse2: impulse2Val,
      netImpulse: netImpulseVal,
      xCom: xComVal,
      keDissipated: keDissipatedVal,
    };
  });

  // Conservation error: |Δp| / |p0|
  const initialMomentumRef = useRef<number | null>(null);
  const [conservationError, setConservationError] = useState(0);

  const lastTimeRef = useRef<number | null>(null);
  const pos1Ref = useRef(0.2);
  const pos2Ref = useRef(0.6);
  const v1Ref = useRef(4.0);
  const v2Ref = useRef(-2.0);
  // lastBallCollisionTimeRef: stores sim-time of the most recent ball-ball collision.
  // A cooldown period prevents the same collision from firing multiple frames in a row.
  const lastBallCollisionTimeRef = useRef(-999);
  const [collisionCount, setCollisionCount] = useState(0);
  const timeRef = useRef(0);
  const prevP1Ref = useRef(mass1 * v1); // for impulse = Δp
  
  const graphsRef = useRef({
    v1: [] as any[], v2: [] as any[], pTotal: [] as any[],
    keTotal: [] as any[], ke1: [] as any[], ke2: [] as any[],
    impulse: [] as any[], relVel: [] as any[],
    force1: [] as any[], force2: [] as any[],
    impulse1: [] as any[], impulse2: [] as any[], netImpulse: [] as any[],
    xCom: [] as any[], vCom: [] as any[], keDissipated: [] as any[]
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

      // Cinematic slow-mo: activate when balls are close and approaching
      if (autoSlowMo) {
        const r1s = Math.max(18, Math.min(42, 16 + mass1 * 2.5));
        const r2s = Math.max(18, Math.min(42, 16 + mass2 * 2.5));
        const limitS = (r1s + r2s) / 640;
        const dist = pos2Ref.current - pos1Ref.current;
        const criticalDist = limitS * 2.5;
        const approaching = v1Ref.current > v2Ref.current; // closing gap
        if (dist < criticalDist && approaching) {
          const factor = Math.max(0, dist / criticalDist);
          activeTimeScale = 0.15 + 0.85 * factor;
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

      let nextPos1 = pos1Ref.current;
      let nextPos2 = pos2Ref.current;

      // ── Ball-ball continuous contact lifecycle ────────────────────────────
      if (inContactRef.current) {
        const contactElapsed = currentTime - contactStartTimeRef.current;
        const Tc = 0.20; // 200ms duration for perfect visual capture
        
        if (contactElapsed < Tc) {
          const theta = (contactElapsed / Tc) * Math.PI;
          const u1 = contactPreV1Ref.current;
          const u2 = contactPreV2Ref.current;
          const uRel = u1 - u2;
          
          // d(t) = R_sum - uRel * [ (1+e)/2 * (Tc/pi) * sin(theta) ]
          // This ensures dVal perfectly returns to limitCollisionDist at t = Tc with no overlap or pop.
          const dVal = limitCollisionDist - (uRel * VISUAL_SPEED_SCALE) * (
            ((1 + e) / 2) * (Tc / Math.PI) * Math.sin(theta)
          );
          
          const vCM = (mass1 * u1 + mass2 * u2) / (mass1 + mass2);
          const xCM = contactXcmStartRef.current + (vCM * VISUAL_SPEED_SCALE) * contactElapsed;
          
          nextPos1 = xCM - (mass2 / (mass1 + mass2)) * dVal;
          nextPos2 = xCM + (mass1 / (mass1 + mass2)) * dVal;
          
          const dDot = uRel * (((1 - e) / 2) + ((1 + e) / 2) * Math.cos(theta));
          v1Ref.current = vCM + (mass2 / (mass1 + mass2)) * dDot;
          v2Ref.current = vCM - (mass1 / (mass1 + mass2)) * dDot;
          
          // Action-reaction force
          const mu = (mass1 * mass2) / (mass1 + mass2);
          const J = mu * uRel * (1 + e);
          const Fmax = (Math.PI / 2) * (J / Tc);
          const fVal = Fmax * Math.sin(theta);
          setContactForce(fVal);
          
          // Squish coefficients
          const fc = Math.max(0, (limitCollisionDist - dVal) / limitCollisionDist);
          setSq1(Math.max(0.72, 1 - 0.28 * (mass2 / (mass1 + mass2)) * fc));
          setSq2(Math.max(0.72, 1 - 0.28 * (mass1 / (mass1 + mass2)) * fc));
        } else {
          // Separation complete
          inContactRef.current = false;
          setInContact(false);
          setContactForce(0);
          setSq1(1);
          setSq2(1);
          
          const u1 = contactPreV1Ref.current;
          const u2 = contactPreV2Ref.current;
          const uRel = u1 - u2;
          
          const vCM = (mass1 * u1 + mass2 * u2) / (mass1 + mass2);
          v1Ref.current = vCM - e * (mass2 / (mass1 + mass2)) * uRel;
          v2Ref.current = vCM + e * (mass1 / (mass1 + mass2)) * uRel;
          
          const dVal = limitCollisionDist;
          const xCM = contactXcmStartRef.current + (vCM * VISUAL_SPEED_SCALE) * Tc;
          nextPos1 = xCM - (mass2 / (mass1 + mass2)) * dVal;
          nextPos2 = xCM + (mass1 / (mass1 + mass2)) * dVal;
        }
      } else {
        nextPos1 = pos1Ref.current + (v1Ref.current * VISUAL_SPEED_SCALE) * dt;
        nextPos2 = pos2Ref.current + (v2Ref.current * VISUAL_SPEED_SCALE) * dt;
        
        const dist = nextPos2 - nextPos1;
        const approaching = v1Ref.current > v2Ref.current;
        
        if (dist <= limitCollisionDist && approaching) {
          // Initialize contact phase
          inContactRef.current = true;
          setInContact(true);
          contactStartTimeRef.current = currentTime;
          contactPreV1Ref.current = v1Ref.current;
          contactPreV2Ref.current = v2Ref.current;
          contactXcmStartRef.current = (mass1 * pos1Ref.current + mass2 * pos2Ref.current) / (mass1 + mass2);
          
          const u1 = v1Ref.current;
          const u2 = v2Ref.current;
          const uRel = u1 - u2;
          
          lastBallCollisionTimeRef.current = currentTime;
          setHasCollided(true);
          setCollisionTime(currentTime);
          setCollisionCount(c => c + 1);
          
          const finalV1 = ((mass1 - e * mass2) * u1 + (1 + e) * mass2 * u2) / (mass1 + mass2);
          const finalV2 = ((mass2 - e * mass1) * u2 + (1 + e) * mass1 * u1) / (mass1 + mass2);
          setCollisionData({ v1Pre: u1, v2Pre: u2, v1Post: finalV1, v2Post: finalV2 });
          
          // Instant contact dynamics
          const vCM = (mass1 * u1 + mass2 * u2) / (mass1 + mass2);
          v1Ref.current = vCM + (mass2 / (mass1 + mass2)) * uRel;
          v2Ref.current = vCM - (mass1 / (mass1 + mass2)) * uRel;
          
          setContactForce(0);
          setSq1(1);
          setSq2(1);
          
          if (freezeAtImpact) {
            setIsPlaying(false);
            lastTimeRef.current = null;
          }
        }
      }

      // ── Elastic wall bounces — all 4 cases ─────────────────────────────────
      let wallBounce = false;
      // Left wall → ball 1
      if (nextPos1 < rn1) { nextPos1 = rn1; v1Ref.current = Math.abs(v1Ref.current); wallBounce = true; }
      // Right wall → ball 1
      if (nextPos1 > 1.0 - rn1) { nextPos1 = 1.0 - rn1; v1Ref.current = -Math.abs(v1Ref.current); wallBounce = true; }
      // Left wall → ball 2
      if (nextPos2 < rn2) { nextPos2 = rn2; v2Ref.current = Math.abs(v2Ref.current); wallBounce = true; }
      // Right wall → ball 2
      if (nextPos2 > 1.0 - rn2) { nextPos2 = 1.0 - rn2; v2Ref.current = -Math.abs(v2Ref.current); wallBounce = true; }

      if (wallBounce) {
        initialMomentumRef.current = null;
      }

      pos1Ref.current = nextPos1;
      pos2Ref.current = nextPos2;

      setTime(currentTime);
      setPos1(nextPos1);
      setPos2(nextPos2);
      setDynV1(v1Ref.current);
      setDynV2(v2Ref.current);

      // Record telemetry graphs
      const currentV1 = v1Ref.current;
      const currentV2 = v2Ref.current;
      const pTotalVal = mass1 * currentV1 + mass2 * currentV2;
      const ke1Val = 0.5 * mass1 * currentV1 * currentV1;
      const ke2Val = 0.5 * mass2 * currentV2 * currentV2;
      const keTotalVal = ke1Val + ke2Val;
      const relVelVal = Math.abs(currentV1 - currentV2);

      // Impulse on object 1 = Δp1
      const currentP1 = mass1 * currentV1;
      const impulseVal = currentP1 - prevP1Ref.current;
      prevP1Ref.current = currentP1;

      // Force calculations for both balls
      let force1Val = 0;
      let force2Val = 0;
      const Tc = 0.20;
      if (inContactRef.current) {
        const contactElapsed = currentTime - contactStartTimeRef.current;
        if (contactElapsed < Tc) {
          const theta = (contactElapsed / Tc) * Math.PI;
          const u1 = contactPreV1Ref.current;
          const u2 = contactPreV2Ref.current;
          const uRel = u1 - u2;
          const mu = (mass1 * mass2) / (mass1 + mass2);
          const J = mu * uRel * (1 + e);
          const Fmax = (Math.PI / 2) * (J / Tc);
          const fVal = Fmax * Math.sin(theta);
          force1Val = -fVal;
          force2Val = fVal;
        }
      }

      // Individual impulses
      let impulse1Val = 0;
      let impulse2Val = 0;
      if (hasCollided) {
        impulse1Val = mass1 * (currentV1 - contactPreV1Ref.current);
        impulse2Val = mass2 * (currentV2 - contactPreV2Ref.current);
      }
      const netImpulseVal = impulse1Val + impulse2Val;

      // COM position & velocity
      const xComVal = (mass1 * nextPos1 + mass2 * nextPos2) / (mass1 + mass2);
      const vComVal = (mass1 * currentV1 + mass2 * currentV2) / (mass1 + mass2);

      // Energy dissipated relative to initial total mechanical energy
      const initialKE = 0.5 * mass1 * v1 * v1 + 0.5 * mass2 * v2 * v2;
      const keDissipatedVal = Math.max(0, initialKE - keTotalVal);

      // Conservation error
      if (initialMomentumRef.current === null) initialMomentumRef.current = pTotalVal;
      const p0 = initialMomentumRef.current;
      const err = p0 !== 0 ? Math.abs((pTotalVal - p0) / p0) : 0;
      setConservationError(err);

      graphsRef.current = {
        v1: [...graphsRef.current.v1, { time: currentTime, value: currentV1 }].slice(-100),
        v2: [...graphsRef.current.v2, { time: currentTime, value: currentV2 }].slice(-100),
        pTotal: [...graphsRef.current.pTotal, { time: currentTime, value: pTotalVal }].slice(-100),
        keTotal: [...graphsRef.current.keTotal, { time: currentTime, value: keTotalVal }].slice(-100),
        ke1: [...graphsRef.current.ke1, { time: currentTime, value: ke1Val }].slice(-100),
        ke2: [...graphsRef.current.ke2, { time: currentTime, value: ke2Val }].slice(-100),
        impulse: [...graphsRef.current.impulse, { time: currentTime, value: impulseVal }].slice(-100),
        relVel: [...graphsRef.current.relVel, { time: currentTime, value: relVelVal }].slice(-100),
        force1: [...graphsRef.current.force1, { time: currentTime, value: force1Val }].slice(-100),
        force2: [...graphsRef.current.force2, { time: currentTime, value: force2Val }].slice(-100),
        impulse1: [...graphsRef.current.impulse1, { time: currentTime, value: impulse1Val }].slice(-100),
        impulse2: [...graphsRef.current.impulse2, { time: currentTime, value: impulse2Val }].slice(-100),
        netImpulse: [...graphsRef.current.netImpulse, { time: currentTime, value: netImpulseVal }].slice(-100),
        xCom: [...graphsRef.current.xCom, { time: currentTime, value: xComVal }].slice(-100),
        vCom: [...graphsRef.current.vCom, { time: currentTime, value: vComVal }].slice(-100),
        keDissipated: [...graphsRef.current.keDissipated, { time: currentTime, value: keDissipatedVal }].slice(-100),
      };
      setGraphs(graphsRef.current);

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, mass1, mass2, e, v1, v2, timeScale, autoSlowMo, freezeAtImpact]);

  const prevParamsRef = useRef({ v1, v2, mass1, mass2, e });

  // Synchronise state parameters when not playing
  useEffect(() => {
    const paramsChanged = prevParamsRef.current.v1 !== v1 ||
                          prevParamsRef.current.v2 !== v2 ||
                          prevParamsRef.current.mass1 !== mass1 ||
                          prevParamsRef.current.mass2 !== mass2 ||
                          prevParamsRef.current.e !== e;
                          
    prevParamsRef.current = { v1, v2, mass1, mass2, e };

    if (!isPlaying) {
      // If paused mid-flight (time > 0) and initial configuration parameters have not changed,
      // FREEZE the visual state completely so the user can take notes of values!
      if (timeRef.current > 0 && !paramsChanged) {
        return;
      }

      v1Ref.current = v1;
      v2Ref.current = v2;
      setDynV1(v1);
      setDynV2(v2);
      pos1Ref.current = 0.2;
      pos2Ref.current = 0.6;
      timeRef.current = 0;
      lastBallCollisionTimeRef.current = -999;
      prevP1Ref.current = mass1 * v1;
      initialMomentumRef.current = null;

      setInContact(false);
      inContactRef.current = false;
      setContactForce(0);
      setSq1(1);
      setSq2(1);

      setPos1(0.2); setPos2(0.6); setTime(0);
      setHasCollided(false); setCollisionTime(null);
      setConservationError(0); setCollisionCount(0);
      setCollisionData({ v1Pre: v1, v2Pre: v2, v1Post: 0, v2Post: 0 });
      const empty = {
        v1: [], v2: [], pTotal: [], keTotal: [], ke1: [], ke2: [], impulse: [], relVel: [],
        force1: [], force2: [], impulse1: [], impulse2: [], netImpulse: [],
        xCom: [], vCom: [], keDissipated: []
      };
      graphsRef.current = empty;
      setGraphs(empty);
    }
  }, [v1, v2, mass1, mass2, e, isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setTime(0); setPos1(0.2); setPos2(0.6);
    pos1Ref.current = 0.2; pos2Ref.current = 0.6;
    timeRef.current = 0;
    v1Ref.current = v1; v2Ref.current = v2;
    setDynV1(v1); setDynV2(v2);
    lastBallCollisionTimeRef.current = -999;
    prevP1Ref.current = mass1 * v1;
    initialMomentumRef.current = null;
    setHasCollided(false); setCollisionTime(null);
    setConservationError(0); setCollisionCount(0);
    setCollisionData({ v1Pre: v1, v2Pre: v2, v1Post: 0, v2Post: 0 });
    setInContact(false);
    inContactRef.current = false;
    setContactForce(0);
    setSq1(1);
    setSq2(1);
    const empty = {
      v1: [], v2: [], pTotal: [], keTotal: [], ke1: [], ke2: [], impulse: [], relVel: [],
      force1: [], force2: [], impulse1: [], impulse2: [], netImpulse: [],
      xCom: [], vCom: [], keDissipated: []
    };
    graphsRef.current = empty;
    setGraphs(empty);
  }, [v1, v2, mass1]);

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

    let nextPos1 = pos1Ref.current;
    let nextPos2 = pos2Ref.current;

    // ── Ball-ball continuous contact lifecycle (Stepper Sync) ─────────────
    if (inContactRef.current) {
      const contactElapsed = currentTime - contactStartTimeRef.current;
      const Tc = 0.20;
      
      if (contactElapsed < Tc) {
        const theta = (contactElapsed / Tc) * Math.PI;
        const u1 = contactPreV1Ref.current;
        const u2 = contactPreV2Ref.current;
        const uRel = u1 - u2;
        
        // d(t) = R_sum - uRel * [ (1+e)/2 * (Tc/pi) * sin(theta) ]
        // This ensures dVal perfectly returns to limitCollisionDist at t = Tc with no overlap or pop.
        const dVal = limitCollisionDist - (uRel * VISUAL_SPEED_SCALE) * (
          ((1 + e) / 2) * (Tc / Math.PI) * Math.sin(theta)
        );
        
        const vCM = (mass1 * u1 + mass2 * u2) / (mass1 + mass2);
        const xCM = contactXcmStartRef.current + (vCM * VISUAL_SPEED_SCALE) * contactElapsed;
        
        nextPos1 = xCM - (mass2 / (mass1 + mass2)) * dVal;
        nextPos2 = xCM + (mass1 / (mass1 + mass2)) * dVal;
        
        const dDot = uRel * (((1 - e) / 2) + ((1 + e) / 2) * Math.cos(theta));
        v1Ref.current = vCM + (mass2 / (mass1 + mass2)) * dDot;
        v2Ref.current = vCM - (mass1 / (mass1 + mass2)) * dDot;
        
        const mu = (mass1 * mass2) / (mass1 + mass2);
        const J = mu * uRel * (1 + e);
        const Fmax = (Math.PI / 2) * (J / Tc);
        const fVal = Fmax * Math.sin(theta);
        setContactForce(fVal);
        
        const fc = Math.max(0, (limitCollisionDist - dVal) / limitCollisionDist);
        setSq1(Math.max(0.72, 1 - 0.28 * (mass2 / (mass1 + mass2)) * fc));
        setSq2(Math.max(0.72, 1 - 0.28 * (mass1 / (mass1 + mass2)) * fc));
      } else {
        inContactRef.current = false;
        setInContact(false);
        setContactForce(0);
        setSq1(1);
        setSq2(1);
        
        const u1 = contactPreV1Ref.current;
        const u2 = contactPreV2Ref.current;
        const uRel = u1 - u2;
        
        const vCM = (mass1 * u1 + mass2 * u2) / (mass1 + mass2);
        v1Ref.current = vCM - e * (mass2 / (mass1 + mass2)) * uRel;
        v2Ref.current = vCM + e * (mass1 / (mass1 + mass2)) * uRel;
        
        const dVal = limitCollisionDist;
        const xCM = contactXcmStartRef.current + (vCM * VISUAL_SPEED_SCALE) * Tc;
        nextPos1 = xCM - (mass2 / (mass1 + mass2)) * dVal;
        nextPos2 = xCM + (mass1 / (mass1 + mass2)) * dVal;
      }
    } else {
      nextPos1 = pos1Ref.current + (v1Ref.current * VISUAL_SPEED_SCALE) * dt;
      nextPos2 = pos2Ref.current + (v2Ref.current * VISUAL_SPEED_SCALE) * dt;
      
      const dist = nextPos2 - nextPos1;
      const approaching = v1Ref.current > v2Ref.current;
      
      if (dist <= limitCollisionDist && approaching) {
        inContactRef.current = true;
        setInContact(true);
        contactStartTimeRef.current = currentTime;
        contactPreV1Ref.current = v1Ref.current;
        contactPreV2Ref.current = v2Ref.current;
        contactXcmStartRef.current = (mass1 * pos1Ref.current + mass2 * pos2Ref.current) / (mass1 + mass2);
        
        const u1 = v1Ref.current;
        const u2 = v2Ref.current;
        const uRel = u1 - u2;
        
        lastBallCollisionTimeRef.current = currentTime;
        setHasCollided(true);
        setCollisionTime(currentTime);
        setCollisionCount(c => c + 1);
        
        const finalV1 = ((mass1 - e * mass2) * u1 + (1 + e) * mass2 * u2) / (mass1 + mass2);
        const finalV2 = ((mass2 - e * mass1) * u2 + (1 + e) * mass1 * u1) / (mass1 + mass2);
        setCollisionData({ v1Pre: u1, v2Pre: u2, v1Post: finalV1, v2Post: finalV2 });
        
        const vCM = (mass1 * u1 + mass2 * u2) / (mass1 + mass2);
        v1Ref.current = vCM + (mass2 / (mass1 + mass2)) * uRel;
        v2Ref.current = vCM - (mass1 / (mass1 + mass2)) * uRel;
        
        setContactForce(0);
        setSq1(1);
        setSq2(1);
      }
    }

    // All 4 wall bounces
    let wallBounce = false;
    if (nextPos1 < rn1) { nextPos1 = rn1; v1Ref.current = Math.abs(v1Ref.current); wallBounce = true; }
    if (nextPos1 > 1.0 - rn1) { nextPos1 = 1.0 - rn1; v1Ref.current = -Math.abs(v1Ref.current); wallBounce = true; }
    if (nextPos2 < rn2) { nextPos2 = rn2; v2Ref.current = Math.abs(v2Ref.current); wallBounce = true; }
    if (nextPos2 > 1.0 - rn2) { nextPos2 = 1.0 - rn2; v2Ref.current = -Math.abs(v2Ref.current); wallBounce = true; }

    if (wallBounce) {
      initialMomentumRef.current = null;
    }

    pos1Ref.current = nextPos1;
    pos2Ref.current = nextPos2;

    setTime(currentTime);
    setPos1(nextPos1);
    setPos2(nextPos2);
    setDynV1(v1Ref.current);
    setDynV2(v2Ref.current);

    const currentV1 = v1Ref.current;
    const currentV2 = v2Ref.current;
    const pTotalVal = mass1 * currentV1 + mass2 * currentV2;
    const ke1Val = 0.5 * mass1 * currentV1 * currentV1;
    const ke2Val = 0.5 * mass2 * currentV2 * currentV2;
    const keTotalVal = ke1Val + ke2Val;
    const relVelVal = Math.abs(currentV1 - currentV2);
    const currentP1 = mass1 * currentV1;
    const impulseVal = currentP1 - prevP1Ref.current;
    prevP1Ref.current = currentP1;

    // Force calculations for both balls
    let force1Val = 0;
    let force2Val = 0;
    const Tc = 0.20;
    if (inContactRef.current) {
      const contactElapsed = currentTime - contactStartTimeRef.current;
      if (contactElapsed < Tc) {
        const theta = (contactElapsed / Tc) * Math.PI;
        const u1 = contactPreV1Ref.current;
        const u2 = contactPreV2Ref.current;
        const uRel = u1 - u2;
        const mu = (mass1 * mass2) / (mass1 + mass2);
        const J = mu * uRel * (1 + e);
        const Fmax = (Math.PI / 2) * (J / Tc);
        const fVal = Fmax * Math.sin(theta);
        force1Val = -fVal;
        force2Val = fVal;
      }
    }

    // Individual impulses
    let impulse1Val = 0;
    let impulse2Val = 0;
    if (hasCollided) {
      impulse1Val = mass1 * (currentV1 - contactPreV1Ref.current);
      impulse2Val = mass2 * (currentV2 - contactPreV2Ref.current);
    }
    const netImpulseVal = impulse1Val + impulse2Val;

    // COM position & velocity
    const xComVal = (mass1 * nextPos1 + mass2 * nextPos2) / (mass1 + mass2);
    const vComVal = (mass1 * currentV1 + mass2 * currentV2) / (mass1 + mass2);

    // Energy dissipated relative to initial total mechanical energy
    const initialKE = 0.5 * mass1 * v1 * v1 + 0.5 * mass2 * v2 * v2;
    const keDissipatedVal = Math.max(0, initialKE - keTotalVal);

    // Conservation error
    if (initialMomentumRef.current === null) initialMomentumRef.current = pTotalVal;
    const p0 = initialMomentumRef.current;
    const err = p0 !== 0 ? Math.abs((pTotalVal - p0) / p0) : 0;
    setConservationError(err);

    graphsRef.current = {
      v1: [...graphsRef.current.v1, { time: currentTime, value: currentV1 }].slice(-100),
      v2: [...graphsRef.current.v2, { time: currentTime, value: currentV2 }].slice(-100),
      pTotal: [...graphsRef.current.pTotal, { time: currentTime, value: pTotalVal }].slice(-100),
      keTotal: [...graphsRef.current.keTotal, { time: currentTime, value: keTotalVal }].slice(-100),
      ke1: [...graphsRef.current.ke1, { time: currentTime, value: ke1Val }].slice(-100),
      ke2: [...graphsRef.current.ke2, { time: currentTime, value: ke2Val }].slice(-100),
      impulse: [...graphsRef.current.impulse, { time: currentTime, value: impulseVal }].slice(-100),
      relVel: [...graphsRef.current.relVel, { time: currentTime, value: relVelVal }].slice(-100),
      force1: [...graphsRef.current.force1, { time: currentTime, value: force1Val }].slice(-100),
      force2: [...graphsRef.current.force2, { time: currentTime, value: force2Val }].slice(-100),
      impulse1: [...graphsRef.current.impulse1, { time: currentTime, value: impulse1Val }].slice(-100),
      impulse2: [...graphsRef.current.impulse2, { time: currentTime, value: impulse2Val }].slice(-100),
      netImpulse: [...graphsRef.current.netImpulse, { time: currentTime, value: netImpulseVal }].slice(-100),
      xCom: [...graphsRef.current.xCom, { time: currentTime, value: xComVal }].slice(-100),
      vCom: [...graphsRef.current.vCom, { time: currentTime, value: vComVal }].slice(-100),
      keDissipated: [...graphsRef.current.keDissipated, { time: currentTime, value: keDissipatedVal }].slice(-100),
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

  // Preset scenarios
  const presets = [
    { name: "Equal Mass", m1: 3, m2: 3, u1: 4, u2: -2, e: 1, label: "Velocity Swap" },
    { name: "Heavy→Light", m1: 8, m2: 1, u1: 3, u2: 0, e: 1, label: "Light flies 2×" },
    { name: "Light→Heavy", m1: 1, m2: 8, u1: 5, u2: 0, e: 1, label: "Bounce back" },
    { name: "Perfectly Inelastic", m1: 3, m2: 3, u1: 4, u2: -2, e: 0, label: "Stick together" },
    { name: "Head-On", m1: 2, m2: 5, u1: 5, u2: -3, e: 0.7, label: "Partial bounce" },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setIsPlaying(false);
    setMass1(p.m1); setMass2(p.m2);
    setV1(p.u1); setV2(p.u2);
    setCoeffRestitution(p.e);
    setCollisionType(p.e === 1 ? "elastic" : "inelastic");
  };

  const renderCanvasTab = () => (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      {/* Preset scenarios bar */}
      <div className="px-4 pt-3 pb-0 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em] shrink-0 mr-1">Presets</span>
        {presets.map(p => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            disabled={isPlaying}
            className="shrink-0 flex flex-col items-start px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all disabled:opacity-30 text-left"
          >
            <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">{p.name}</span>
            <span className="text-[8px] text-white/30 font-mono">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 p-4 md:p-6 relative flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Dominant Visual Columns */}
        <div className="flex-1 z-10 flex flex-col gap-5 min-w-0">
          
          {/* Main Telemetry Canvas */}
          <div className="flex-1 relative min-h-[360px]">
             <CollisionCanvas
                 mass1={mass1}
                 mass2={mass2}
                 v1={dynV1}
                 v2={dynV2}
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
                 collisionCount={collisionCount}
                 showCoM={showCoM}
                 showForceVectors={showForceVectors}
                 showGridOverlays={showGridOverlays}
                 inContact={inContact}
                 contactForce={contactForce}
                 sq1={sq1}
                 sq2={sq2}
                 comReferenceFrame={comReferenceFrame}
                  scientificMode={scientificMode}
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
                { id: 'comFrame', label: 'CoM Reference Frame', color: 'bg-indigo-500', active: comReferenceFrame, toggle: () => setComReferenceFrame(!comReferenceFrame) },
                { id: 'grid', label: 'Metric Grid', color: 'bg-blue-400', active: showGridOverlays, toggle: () => setShowGridOverlays(!showGridOverlays) },
                { id: 'scientific', label: 'Scientific Mode', color: 'bg-amber-400', active: scientificMode, toggle: () => setScientificMode(!scientificMode) }
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
                  { l: "u₁", val: v1, unit: "m/s", onChange: setV1, color: "text-amber-400", min: -6.0, max: 6.0, step: 0.5 },
                  { l: "u₂", val: v2, unit: "m/s", onChange: setV2, color: "text-emerald-400", min: -6.0, max: 6.0, step: 0.5 },
                ].map(param => (
                  <div key={param.l} className="flex flex-col gap-1 bg-white/[0.02] border border-white/[0.03] px-3 py-2 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-white/30 uppercase">{param.l}</span>
                      <InlineEditableValue
                        value={param.val}
                        min={param.min}
                        max={param.max}
                        unit={param.unit}
                        color={param.color}
                        disabled={isPlaying}
                        onChange={param.onChange}
                      />
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
            {scientificMode ? (
              <EquationsDerivationsPanel
                m1={mass1}
                m2={mass2}
                v1={dynV1}
                v2={dynV2}
                u1={v1}
                u2={v2}
                pos1={pos1}
                pos2={pos2}
                e={e}
                inContact={inContact}
                contactForce={contactForce}
              />
            ) : (
              <ScientificPipeline 
                m1={mass1}
                m2={mass2}
                v1Pre={collisionData.v1Pre}
                v2Pre={collisionData.v2Pre}
                v1Post={collisionData.v1Post}
                v2Post={collisionData.v2Post}
                hasCollided={hasCollided}
              />
            )}

            {/* Live Combined Energy Allocation Widget */}
            <EnergyWidget 
              m1={mass1}
              m2={mass2}
              v1={dynV1}
              v2={dynV2}
              v1Post={collisionData.v1Post}
              v2Post={collisionData.v2Post}
              hasCollided={hasCollided}
              coeffRestitution={e}
            />
          </div>

          {/* Real-time Telemetry Graphs grid */}
          <div className="space-y-4">
              <CollisionGraphs
                samples={samples}
                collisionTime={collisionTime}
                conservationError={conservationError}
                time={time}
                scientificMode={scientificMode}
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
                  { label: "CoM Ref Frame", active: comReferenceFrame, toggle: () => setComReferenceFrame(!comReferenceFrame) },
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

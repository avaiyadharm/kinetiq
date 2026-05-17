"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CollisionCanvas } from "./CollisionCanvas";
import { CollisionGraphs } from "./CollisionGraphs";
import { CollisionTheory } from "./CollisionTheory";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Info, BookOpen, Play, Pause, RotateCcw, Calculator, Layers, Target, Zap, Maximize2, Sparkles, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- ClickableValue (reusable sub-component, styled exactly like other pages) ---
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

  const display = formatter ? formatter(value) : value.toFixed(2);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</label>
      </div>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsEditing(true)}
        className={cn(
          "group relative flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20 shadow-lg",
          isEditing && "ring-2 ring-primary/50 bg-white/10 border-primary/50"
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
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-mono font-black text-white p-0"
            autoFocus
          />
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-2xl font-mono font-black tracking-tight transition-colors", colorClass)}>
                {display}
              </span>
              <span className="text-xs font-bold text-white/20">{unit}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 text-white/20 group-hover:text-primary transition-colors">
               <Calculator className="w-3.5 h-3.5" />
            </div>
          </>
        )}
      </motion.div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer",
          colorClass.includes("violet") ? "accent-violet-500" : 
          colorClass.includes("emerald") ? "accent-emerald-500" :
          colorClass.includes("cyan") ? "accent-cyan-500" :
          colorClass.includes("orange") ? "accent-orange-500" : "accent-primary"
        )}
      />
    </div>
  );
};

// --- RelationBox sub-component ---
const RelationBox = ({ formula, calc, result }: { formula: string; calc: string; result: string }) => (
  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 group hover:border-primary/30 transition-all">
    <div className="flex justify-between items-baseline">
      <span className="text-xs font-mono font-bold text-primary">{formula}</span>
      <span className="text-sm font-mono font-black text-white">{result}</span>
    </div>
    <p className="text-[9px] font-mono text-white/20 group-hover:text-white/40 transition-colors">Substitution: {calc}</p>
  </div>
);

// --- ControlCard sub-component ---
const ControlCard = ({ title, icon: Icon, children, color }: any) => (
  <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
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
  // --- Master State ---
  const [mass1, setMass1] = useState(2.0); // kg
  const [mass2, setMass2] = useState(5.0); // kg
  const [v1, setV1] = useState(4.0);       // m/s
  const [v2, setV2] = useState(-2.0);      // m/s
  const [coeffRestitution, setCoeffRestitution] = useState(1.0); // e = 1 for elastic

  const [collisionType, setCollisionType] = useState<"elastic" | "inelastic">("elastic");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("canvas");

  const [time, setTime] = useState(0);
  const [pos1, setPos1] = useState(0.2); // normalised pos of ball 1
  const [pos2, setPos2] = useState(0.6); // normalised pos of ball 2
  const [hasCollided, setHasCollided] = useState(false);

  const [showVectors, setShowVectors] = useState({
    velocity: true,
    momentum: true,
  });
  const [showTrail, setShowTrail] = useState(true);

  // Keep a record of velocities at the moment of collision for analytic conservation panels
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

  // Handle setting collision preset types
  const handleCollisionTypeChange = (type: "elastic" | "inelastic") => {
    setCollisionType(type);
    if (type === "elastic") {
      setCoeffRestitution(1.0);
    } else {
      setCoeffRestitution(0.0); // Default perfectly inelastic, user can adjust
    }
  };

  // --- Derived Physics Object (Analytical / Theoretical Calculations) ---
  const e = collisionType === "elastic" ? 1.0 : coeffRestitution;
  const v1PostCalculated = ((mass1 - e * mass2) * v1 + (1 + e) * mass2 * v2) / (mass1 + mass2);
  const v2PostCalculated = ((mass2 - e * mass1) * v2 + (1 + e) * mass1 * v1) / (mass1 + mass2);

  const ke1Before = 0.5 * mass1 * v1 * v1;
  const ke2Before = 0.5 * mass2 * v2 * v2;
  const keBeforeTotal = ke1Before + ke2Before;

  const ke1After = 0.5 * mass1 * v1PostCalculated * v1PostCalculated;
  const ke2After = 0.5 * mass2 * v2PostCalculated * v2PostCalculated;
  const keAfterTotal = ke1After + ke2After;

  // --- Physics loop implementation ---
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

      // Time step
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.03);
      lastTimeRef.current = timestamp;

      setTime(prev => {
        const newTime = prev + dt;

        // Radii calculations for checking bounds
        const r1 = Math.max(16, Math.min(40, 14 + mass1 * 2.5));
        const r2 = Math.max(16, Math.min(40, 14 + mass2 * 2.5));
        const limitCollisionDist = (r1 + r2) / 640;

        // Radii in normalized form for walls
        const rn1 = r1 / 640;
        const rn2 = r2 / 640;

        // Update positions step-by-step
        let nextPos1 = pos1Ref.current + v1Ref.current * dt;
        let nextPos2 = pos2Ref.current + v2Ref.current * dt;

        // Detect collision between objects
        if (!collidedRef.current && (nextPos2 - nextPos1 <= limitCollisionDist)) {
          // Resolve overlap
          const overlap = limitCollisionDist - (nextPos2 - nextPos1);
          nextPos1 -= overlap / 2;
          nextPos2 += overlap / 2;

          // Apply collision formulas
          const finalV1 = ((mass1 - e * mass2) * v1Ref.current + (1 + e) * mass2 * v2Ref.current) / (mass1 + mass2);
          const finalV2 = ((mass2 - e * mass1) * v2Ref.current + (1 + e) * mass1 * v1Ref.current) / (mass1 + mass2);

          v1Ref.current = finalV1;
          v2Ref.current = finalV2;
          collidedRef.current = true;
          setHasCollided(true);

          setCollisionData({
            v1Pre: v1,
            v2Pre: v2,
            v1Post: finalV1,
            v2Post: finalV2,
          });
        }

        // Wall collisions / boundary constraints
        if (nextPos1 < rn1) {
          nextPos1 = rn1;
          v1Ref.current = -v1Ref.current;
        }
        if (nextPos2 > 1.0 - rn2) {
          nextPos2 = 1.0 - rn2;
          v2Ref.current = -v2Ref.current;
        }

        // Update refs
        pos1Ref.current = nextPos1;
        pos2Ref.current = nextPos2;

        // Update react state
        setPos1(nextPos1);
        setPos2(nextPos2);

        // Record Telemetry
        const currentV1 = v1Ref.current;
        const currentV2 = v2Ref.current;
        const pTotalVal = mass1 * currentV1 + mass2 * currentV2;
        const ke1Val = 0.5 * mass1 * currentV1 * currentV1;
        const ke2Val = 0.5 * mass2 * currentV2 * currentV2;
        const keTotalVal = ke1Val + ke2Val;

        setGraphs(prevGraphs => ({
          v1: [...prevGraphs.v1, { time: newTime, value: currentV1 }].slice(-100),
          v2: [...prevGraphs.v2, { time: newTime, value: currentV2 }].slice(-100),
          pTotal: [...prevGraphs.pTotal, { time: newTime, value: pTotalVal }].slice(-100),
          keTotal: [...prevGraphs.keTotal, { time: newTime, value: keTotalVal }].slice(-100),
          ke1: [...prevGraphs.ke1, { time: newTime, value: ke1Val }].slice(-100),
          ke2: [...prevGraphs.ke2, { time: newTime, value: ke2Val }].slice(-100),
        }));

        return newTime;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, mass1, mass2, e, v1, v2]);

  // Synchronise state when values are updated pre-collision
  useEffect(() => {
    if (!isPlaying && !hasCollided) {
      v1Ref.current = v1;
      v2Ref.current = v2;
      pos1Ref.current = 0.2;
      pos2Ref.current = 0.6;
      setPos1(0.2);
      setPos2(0.6);
      collidedRef.current = false;
      setHasCollided(false);
    }
  }, [v1, v2, isPlaying, hasCollided]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setTime(0);
    setPos1(0.2);
    setPos2(0.6);
    pos1Ref.current = 0.2;
    pos2Ref.current = 0.6;
    v1Ref.current = v1;
    v2Ref.current = v2;
    collidedRef.current = false;
    setHasCollided(false);
    setGraphs({
      v1: [],
      v2: [],
      pTotal: [],
      keTotal: [],
      ke1: [],
      ke2: [],
    });
  }, [v1, v2]);

  const renderCanvas = () => (
    <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 via-transparent to-[#06b6d4]/5 pointer-events-none" />
      
      <div className="flex-1 p-6 relative flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="flex-1 z-10 flex flex-col gap-6">
          <div className="flex-1 relative min-h-0">
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
             />
          </div>
          
          <div className="bg-[#18181b] border border-white/5 rounded-[24px] p-4 flex items-center justify-center gap-8 overflow-x-auto no-scrollbar shrink-0">
            {[
                { id: 'velocity', label: 'Velocity Vectors (v)', color: 'bg-amber-500' },
                { id: 'momentum', label: 'Momentum Vectors (p)', color: 'bg-pink-500' },
            ].map(v => (
                <div key={v.id} className={cn("flex items-center gap-2 transition-opacity", showVectors[v.id as keyof typeof showVectors] ? "opacity-100" : "opacity-20")}>
                    <div className={cn("w-3 h-3 rounded-full shadow-sm", v.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{v.label}</span>
                </div>
            ))}
          </div>

          <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-8 shadow-2xl shrink-0">
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                        "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-lg active:scale-95",
                        isPlaying ? "bg-red-500 shadow-red-500/20" : "bg-primary shadow-primary/20"
                    )}
                  >
                      {isPlaying ? <Pause className="w-6 h-6 text-white fill-current" /> : <Play className="w-6 h-6 text-white fill-current ml-1" />}
                  </button>
                  <button 
                    onClick={handleReset}
                    className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-[20px] transition-all border border-white/5 flex items-center justify-center active:scale-95"
                  >
                      <RotateCcw className="w-5 h-5 text-white/40" />
                  </button>
              </div>

              <div className="h-10 w-px bg-white/5 hidden md:block" />

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-6 w-full">
                  <ClickableValue 
                    label="Mass 1 (m₁)"
                    value={mass1}
                    unit="kg"
                    min={0.5}
                    max={10.0}
                    step={0.5}
                    onChange={setMass1}
                    colorClass="text-violet-400"
                  />
                  <ClickableValue 
                    label="Mass 2 (m₂)"
                    value={mass2}
                    unit="kg"
                    min={0.5}
                    max={10.0}
                    step={0.5}
                    onChange={setMass2}
                    colorClass="text-cyan-400"
                  />
                  <ClickableValue 
                    label="Velocity 1 (v₁)"
                    value={v1}
                    unit="m/s"
                    min={-6.0}
                    max={6.0}
                    step={0.5}
                    onChange={setV1}
                    colorClass="text-amber-400"
                  />
                  <ClickableValue 
                    label="Velocity 2 (v₂)"
                    value={v2}
                    unit="m/s"
                    min={-6.0}
                    max={6.0}
                    step={0.5}
                    onChange={setV2}
                    colorClass="text-emerald-400"
                  />
              </div>
          </div>
        </div>

        <div className="w-full lg:w-[420px] flex flex-col gap-6 z-10 overflow-y-auto custom-scrollbar pr-1">
          <div className="bg-[#18181b] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
               <BookOpen className="w-24 h-24 text-primary" />
            </div>
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Info className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-bold uppercase tracking-tight">Phase Pulse</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed italic relative z-10">
              {collisionType === "elastic" 
                ? "Elastic Collision: Kinetic energy and momentum are both perfectly conserved. Objects bounce with coefficient e = 1." 
                : "Inelastic Collision: Momentum is conserved, but kinetic energy is lost. Restitution can be fine-tuned."
              }
            </p>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-2xl bg-black/40 border border-violet-500/10">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">Momentum (Σp)</span>
                    <p className="text-xl font-mono font-bold text-white">{(mass1 * v1 + mass2 * v2).toFixed(1)} <span className="text-[10px] text-white/20">kg·m/s</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/10">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">KE Before</span>
                    <p className="text-xl font-mono font-bold text-white">{keBeforeTotal.toFixed(1)} <span className="text-[10px] text-white/20">J</span></p>
                </div>
            </div>
          </div>

          <div className="space-y-4">
              <CollisionGraphs 
                v1Data={graphs.v1}
                v2Data={graphs.v2}
                pTotalData={graphs.pTotal}
                keTotalData={graphs.keTotal}
                ke1Data={graphs.ke1}
                ke2Data={graphs.ke2}
              />
          </div>
          
          <div className="mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                  <p className="text-xs font-bold text-white tracking-tight">Collision Parameter Suite</p>
                  <p className="text-[10px] text-white/40">Adjust parameters in Config</p>
              </div>
              <button 
                onClick={() => setActiveTab("config")}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
              >
                  <Maximize2 className="w-4 h-4 text-primary" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar bg-[#09090b]">
      <div className="flex-1 space-y-8 max-w-5xl">
        <div className="space-y-2">
           <h2 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
              Environment <span className="text-primary">Config</span>
              <Badge variant="outline" className="text-[10px] tracking-widest border-primary/20 text-primary bg-primary/5 uppercase h-6">Dynamic</Badge>
           </h2>
           <p className="text-white/40 text-sm font-medium">Fine-tune the physical constraints, coefficient of restitution, and mass relationships.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ControlCard title="Collision Preset Mode" icon={Target} color="#8b5cf6">
               <div className="space-y-6">
                  <div className="flex gap-2">
                      <button 
                        onClick={() => handleCollisionTypeChange("elastic")}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            collisionType === "elastic" ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                          Elastic (e = 1)
                      </button>
                      <button 
                        onClick={() => handleCollisionTypeChange("inelastic")}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            collisionType === "inelastic" ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                          Inelastic (e &lt; 1)
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ControlCard title="Mass Parameters" icon={Zap} color="#10b981">
               <div className="space-y-6">
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ControlCard title="Initial Kinematics" icon={RotateCcw} color="#06b6d4">
               <div className="space-y-6">
                  <ClickableValue 
                    label="Velocity v₁"
                    value={v1}
                    unit="m/s"
                    min={-6.0}
                    max={6.0}
                    step={0.5}
                    onChange={setV1}
                    colorClass="text-cyan-400"
                  />
                  <ClickableValue 
                    label="Velocity v₂"
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

          <ControlCard title="Visual Layers" icon={Layers} color="#ec4899">
             <div className="grid grid-cols-2 gap-3 pt-2">
                {Object.keys(showVectors).map((key) => (
                    <button
                        key={key}
                        onClick={() => setShowVectors({...showVectors, [key]: !showVectors[key as keyof typeof showVectors]})}
                        className={cn(
                            "px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            showVectors[key as keyof typeof showVectors] 
                                ? "bg-white/10 text-white border-white/20" 
                                : "bg-transparent text-white/20 border-white/5 hover:border-white/10"
                        )}
                    >
                        {key} Vectors
                    </button>
                ))}
                <button
                    onClick={() => setShowTrail(!showTrail)}
                    className={cn(
                        "px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all col-span-2",
                        showTrail ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/20 border-white/5"
                    )}
                >
                    Motion Trail Path
                </button>
             </div>
          </ControlCard>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden h-full">
           <div className="space-y-1">
             <h3 className="text-lg font-black uppercase tracking-tight text-white">Dynamic Analysis</h3>
             <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">Momentum Stability</p>
           </div>
           
           <div className="space-y-6">
               {[
                   { label: "Total Momentum", val: (mass1 * v1 + mass2 * v2).toFixed(2), unit: "kg·m/s" },
                   { label: "Energy Before", val: keBeforeTotal.toFixed(2), unit: "J" },
                   { label: "Energy After", val: keAfterTotal.toFixed(2), unit: "J" },
                   { label: "Energy Dissipated", val: Math.max(0, keBeforeTotal - keAfterTotal).toFixed(2), unit: "J" },
               ].map(stat => (
                   <div key={stat.label} className="space-y-2 group">
                       <div className="flex justify-between items-end">
                           <div className="space-y-0.5">
                               <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{stat.label}</span>
                           </div>
                           <span className="text-xs font-mono font-bold text-white">{stat.val} <span className="text-[10px] text-white/20">{stat.unit}</span></span>
                       </div>
                   </div>
               ))}
           </div>

           <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Collision Relations</h4>
                    <Calculator className="w-3 h-3 text-primary/40" />
                </div>
                <div className="space-y-3">
                    <RelationBox 
                        formula="Σp = m₁v₁ + m₂v₂" 
                        calc={`(${mass1}×${v1}) + (${mass2}×${v2})`}
                        result={`${(mass1 * v1 + mass2 * v2).toFixed(2)} N·s`} 
                    />
                    <RelationBox 
                        formula="KE = ½mv²" 
                        calc={`0.5×${mass1}×${v1}²`}
                        result={`${(0.5 * mass1 * v1 * v1).toFixed(1)} J`} 
                    />
                    <RelationBox 
                        formula="e = |v₂'-v₁'|/|v₁-v₂|" 
                        calc={`|${v2PostCalculated.toFixed(1)}-${v1PostCalculated.toFixed(1)}| / |${v1}-${v2}|`}
                        result={`${e.toFixed(2)}`} 
                    />
                </div>
           </div>

           <div className="pt-6 border-t border-white/5">
                <button 
                    onClick={handleReset}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Collision
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeTab === "canvas" && renderCanvas()}
            {activeTab === "config" && renderConfig()}
            {activeTab === "theory" && (
                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#09090b]">
                   <div className="max-w-4xl mx-auto space-y-8">
                      <div className="space-y-2">
                         <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                            Theoretical <span className="text-primary">Basis</span>
                         </h2>
                         <p className="text-white/40 text-sm font-medium">Deep-dive into linear momentum, bounciness indices, and thermodynamic dissipation equations.</p>
                      </div>
                      <CollisionTheory />
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
                            Welcome to the Collision Laboratory. Use the <strong>Simulation Canvas</strong> to observe impact vectors and conservation pipelines. Navigate to <strong>Environment Config</strong> to switch between Elastic and Inelastic modes.
                         </p>
                      </div>
                      <div className="p-6 rounded-[24px] bg-white/5 border border-white/10 text-left">
                         <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Quick Shortcuts</h4>
                         <ul className="space-y-3 text-xs text-white/60 font-medium">
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Trigger collision via Play/Pause HUD</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Change masses to see velocity scaling</li>
                            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Toggle velocity/momentum vectors to visualize conservation</li>
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

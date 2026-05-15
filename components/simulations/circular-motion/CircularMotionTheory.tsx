"use client";

import React from "react";
import { motion } from "framer-motion";
import { Info, BookOpen, Calculator, Globe, HelpCircle, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CircularMotionTheory: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Introduction */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">The Nature of Circular Motion</h2>
        </div>
        <p className="text-white/60 leading-relaxed">
            Circular motion is a movement of an object along the circumference of a circle or rotation along a circular path. 
            It can be <span className="text-primary font-bold">Uniform</span> (constant angular rate of rotation and constant speed) 
            or <span className="text-primary font-bold">Non-Uniform</span> (changing rate of rotation).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Uniform Circular Motion (UCM)</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-white/40 leading-relaxed">
                    In UCM, the speed is constant, but the velocity is constantly changing direction. This requires a 
                    centripetal acceleration pointing toward the center.
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-orange-400">Non-Uniform Circular Motion</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-white/40 leading-relaxed">
                    In this mode, both the speed and the direction of velocity change. This results in two types of acceleration: 
                    centripetal (radial) and tangential.
                </CardContent>
            </Card>
        </div>
      </section>

      {/* Mathematical Framework */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Mathematical Framework</h2>
        </div>

        <div className="space-y-4">
            {/* Core Equations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Angular Kinematics</h3>
                    <div className="space-y-3">
                        <FormulaBox 
                            formula="s = rθ" 
                            label="Arc Length" 
                            desc="The distance traveled along the circular path." 
                        />
                        <FormulaBox 
                            formula="ω = dθ / dt" 
                            label="Angular Velocity" 
                            desc="The rate of change of angular displacement (rad/s)." 
                        />
                        <FormulaBox 
                            formula="α = dω / dt" 
                            label="Angular Acceleration" 
                            desc="The rate of change of angular velocity (rad/s²)." 
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Linear-Angular Relation</h3>
                    <div className="space-y-3">
                        <FormulaBox 
                            formula="v = rω" 
                            label="Tangential Velocity" 
                            desc="Linear speed of the object tangent to the path." 
                        />
                        <FormulaBox 
                            formula="aₜ = rα" 
                            label="Tangential Acceleration" 
                            desc="Acceleration along the tangent line (changes speed)." 
                        />
                        <FormulaBox 
                            formula="a꜀ = v² / r = rω²" 
                            label="Centripetal Acceleration" 
                            desc="Acceleration toward the center (changes direction)." 
                        />
                    </div>
                </div>
            </div>

            {/* Resultant Acceleration */}
            <Card className="bg-primary/5 border-primary/20 text-white">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-primary">Total Acceleration Vector</h4>
                            <p className="text-xs text-white/60 leading-relaxed">
                                In Non-Uniform Circular Motion, the net acceleration is the vector sum of centripetal and tangential components. 
                                Since they are always perpendicular:
                            </p>
                        </div>
                        <div className="p-4 bg-black/40 rounded-xl border border-primary/20 font-mono text-xl text-primary shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            a = √(a꜀² + aₜ²)
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      {/* Key Concepts */}
      <section className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Core Principles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard 
                title="Inertia" 
                desc="Objects possess a natural tendency to move in a straight line. Circular motion only occurs because a net force pulls the object inward." 
            />
            <FeatureCard 
                title="Centripetal Force" 
                desc="F꜀ = mv²/r. This is NOT a 'new' force, but a label for the NET inward force (gravity, tension, friction) that causes the motion." 
            />
            <FeatureCard 
                title="Vector Direction" 
                desc="Velocity is always tangent. Acceleration is inward (centripetal) and optionally tangent. Direction changes mean acceleration exists even at constant speed." 
            />
        </div>
      </section>

      {/* Deep Dive: Derivations */}
      <section className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <Maximize2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Theoretical Derivations</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white/[0.02] border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-lg">Centripetal Acceleration ($a_c$)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/60">
                    <p>
                        Consider an object moving from point A to B in a small time interval $dt$. The velocity vector $\vec{}$ changes direction by an angle $d\theta$.
                        By similar triangles between the position vector triangle and the velocity vector triangle:
                    </p>
                    <div className="p-4 bg-black/40 rounded-lg font-mono text-center text-primary italic">
                        |Δv| / v = |Δr| / r  {"=>"}  Δv = (v/r) * Δr
                    </div>
                    <p>
                        Dividing by $dt$ and taking the limit as $dt \to 0$:
                    </p>
                    <div className="p-4 bg-black/40 rounded-lg font-mono text-center text-primary italic">
                        a꜀ = lim(Δv/Δt) = (v/r) * lim(Δr/Δt) = v²/r
                    </div>
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] uppercase font-bold text-white/40">Assumptions</p>
                        <ul className="list-disc list-inside text-[10px] space-y-1">
                            <li>Rigid body motion (constant radius).</li>
                            <li>Instantaneous measurement in the limit of small $dt$.</li>
                            <li>Force is strictly directed toward the center (no radial work).</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-lg">Work and Energy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-white/60">
                    <p>
                        In Uniform Circular Motion, the centripetal force is always perpendicular to the displacement ($F \perp ds$). 
                        Therefore, the work done by centripetal force is:
                    </p>
                    <div className="p-4 bg-black/40 rounded-lg font-mono text-center text-orange-400 italic">
                        W = ∫ F꜀ · ds = ∫ F꜀ ds cos(90°) = 0
                    </div>
                    <p>
                        This explains why speed remains constant in UCM despite a constant force being applied.
                    </p>
                </CardContent>
            </Card>
        </div>
      </section>

      {/* Real World Applications */}
      <section className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Applications in Context</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <h4 className="text-xs font-bold uppercase text-white/40 tracking-widest">Satellite Orbits</h4>
                <p className="text-[11px] text-white/60">
                    Gravity provides the centripetal force. The satellite is essentially "falling" around the Earth at exactly the right speed to maintain a circular path.
                </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                <h4 className="text-xs font-bold uppercase text-white/40 tracking-widest">Cars Turning</h4>
                <p className="text-[11px] text-white/60">
                    Static friction between the tires and the road provides the centripetal force. If friction vanishes (ice), the car follows Newton's First Law and moves tangentially.
                </p>
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {["Roller Coasters", "Ferris Wheels", "Laundry Spinners", "Spinning Hammer Throw"].map(item => (
                <Badge key={item} variant="outline" className="bg-white/5 border-white/10 px-3 py-1 text-white/60 hover:text-primary transition-colors">
                    {item}
                </Badge>
            ))}
        </div>
      </section>
    </div>
  );
};

const FormulaBox = ({ formula, label, desc }: { formula: string; label: string; desc: string }) => (
    <div className="group p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{label}</span>
            <div className="p-1 rounded bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="w-3 h-3" />
            </div>
        </div>
        <div className="font-mono text-lg text-white mb-1">{formula}</div>
        <p className="text-[10px] text-white/40">{desc}</p>
    </div>
);

const FeatureCard = ({ title, desc }: { title: string; desc: string }) => (
    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
        <h4 className="font-bold text-white text-sm tracking-tight">{title}</h4>
        <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
);

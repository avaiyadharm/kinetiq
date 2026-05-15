"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Info, BookOpen, Calculator, Globe, Maximize2, Compass, MoveUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 120 }
  }
};

const VectorDiagram = () => (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-black/20 rounded-[40px] border border-white/5 p-8 overflow-hidden group">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            {/* Grid Lines */}
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                </pattern>
                <marker id="arrow-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                </marker>
                <marker id="arrow-pink" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ec4899" />
                </marker>
                <marker id="arrow-indigo" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Path */}
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Center */}
            <circle cx="100" cy="100" r="2" fill="white" opacity="0.3" />

            {/* Object Position (at 45 degrees) */}
            {/* x = 100 + 60*cos(45), y = 100 - 60*sin(45) */}
            <circle cx="142.4" cy="57.6" r="4" fill="white" className="animate-pulse" />

            {/* Radius Vector (r) */}
            <line x1="100" y1="100" x2="140" y2="60" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrow-indigo)" opacity="0.6" />
            <text x="115" y="75" fill="#6366f1" fontSize="8" className="font-mono font-bold italic">r</text>

            {/* Centripetal Acceleration (ac) */}
            <line x1="142.4" y1="57.6" x2="115" y2="85" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrow-pink)" />
            <text x="122" y="98" fill="#ec4899" fontSize="8" className="font-mono font-bold italic">a_c</text>

            {/* Tangential Velocity (v) */}
            <line x1="142.4" y1="57.6" x2="175" y2="25" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrow-cyan)" />
            <text x="165" y="45" fill="#06b6d4" fontSize="8" className="font-mono font-bold italic">v</text>
        </svg>
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Kinematic Atlas v2.0</span>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /><span className="text-[8px] text-white/40 uppercase font-bold">Velocity</span></div>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-pink-500" /><span className="text-[8px] text-white/40 uppercase font-bold">Acceleration</span></div>
            </div>
        </div>
    </div>
);

export const CircularMotionTheory: React.FC = () => {
  return (
    <motion.div 
      className="flex flex-col gap-12 pb-24 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Introduction */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight text-white uppercase">The Radial <span className="text-primary">Manifold</span></h2>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Fundamental Dynamics</p>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <p className="text-white/60 leading-relaxed text-lg font-medium">
                    Circular motion describes the movement of an object along a curved path of fixed or varying radius. 
                    This trajectory is fundamentally defined by the interplay between the object's <span className="text-primary font-bold italic">inertia</span> and a net inward <span className="text-pink-500 font-bold italic">centripetal force</span>.
                </p>
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase tracking-widest bg-primary/5">UCM Mode</Badge>
                        <p className="text-sm text-white/40 leading-relaxed italic">
                            In <span className="text-white">Uniform Circular Motion (UCM)</span>, an object moves with <strong>constant angular velocity (ω)</strong> along a fixed-radius circular path, resulting in constant linear speed but continuously changing velocity direction.
                        </p>
                    </div>
                </div>
            </div>
            <VectorDiagram />
        </div>
      </motion.div>

      {/* Velocity and Acceleration Directions */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
                <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Velocity and Acceleration Directions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-3">
                <h4 className="text-sm font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Velocity (v⃗)
                </h4>
                <p className="text-xs text-white/40 leading-relaxed">
                    The instantaneous velocity vector is always <strong>tangent</strong> to the circular path at any point. Its magnitude (speed) is constant in UCM, but its vector direction is never static.
                </p>
            </div>
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-3">
                <h4 className="text-sm font-black uppercase text-pink-400 tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Centripetal (a⃗꜀)
                </h4>
                <p className="text-xs text-white/40 leading-relaxed">
                    Centripetal acceleration points <strong>radially inward</strong> toward the center of rotation. It is responsible for changing the direction of the velocity vector, not its magnitude.
                </p>
            </div>
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-3">
                <h4 className="text-sm font-black uppercase text-orange-400 tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Tangential (a⃗ₜ)
                </h4>
                <p className="text-xs text-white/40 leading-relaxed">
                    Acting along the tangent of the path, this component exists only in <strong>Non-Uniform</strong> motion. It is responsible for changing the linear speed of the object.
                </p>
            </div>
        </div>
      </motion.section>

      {/* Mathematical Framework */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Mathematical Framework</h2>
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Angular Kinematics (θ in radians)</h3>
                    <div className="space-y-3">
                        <FormulaBox 
                            formula="s = rθ" 
                            label="Arc Length" 
                            desc="The distance traveled along the circular path (path length)." 
                        />
                        <FormulaBox 
                            formula="ω = dθ / dt" 
                            label="Angular Velocity" 
                            desc="Rate of change of angular displacement (rad/s)." 
                        />
                        <FormulaBox 
                            formula="α = dω / dt" 
                            label="Angular Acceleration" 
                            desc="Rate of change of angular velocity (rad/s²)." 
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Linear-Angular Relation</h3>
                    <div className="space-y-3">
                        <FormulaBox 
                            formula="v = rω" 
                            label="Tangential Velocity" 
                            desc="Linear speed magnitude at a point tangent to path." 
                        />
                        <FormulaBox 
                            formula="aₜ = rα" 
                            label="Tangential Acceleration" 
                            desc="Magnitude of the component changing the linear speed." 
                        />
                        <FormulaBox 
                            formula="a꜀ = v² / r = rω²" 
                            label="Centripetal Acceleration" 
                            desc="Magnitude of the radial component changing direction." 
                        />
                    </div>
                </div>
            </div>

            <Card className="bg-primary/5 border-primary/20 text-white rounded-[32px] overflow-hidden">
                <CardContent className="pt-8 pb-8 px-10">
                    <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                                <MoveUpRight className="w-4 h-4" /> Net Acceleration
                            </div>
                            <h4 className="text-2xl font-bold tracking-tight">Total Acceleration Vector Sum</h4>
                            <p className="text-sm text-white/40 leading-relaxed italic">
                                In Non-Uniform Circular Motion, the net acceleration vector <strong>a⃗</strong> is the sum of radial and tangential components. Since <strong>a⃗꜀ ⊥ a⃗ₜ</strong>:
                            </p>
                        </div>
                        <div className="p-8 bg-black/60 rounded-[24px] border border-white/10 font-mono text-3xl text-primary shadow-2xl relative group">
                            <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative">|a⃗| = √(a꜀² + aₜ²)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </motion.section>

      {/* Theoretical Derivations */}
      <motion.section variants={itemVariants} className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <Maximize2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Theoretical Derivations</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white/[0.02] border-white/10 text-white rounded-[32px]">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-white/60">Centripetal Acceleration (a⃗꜀) Derivation</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6 text-sm text-white/60 leading-relaxed">
                    <p>
                        Consider an object moving from point A to B. The position vector changes from <strong>r⃗₁</strong> to <strong>r⃗₂</strong>, and velocity from <strong>v⃗₁</strong> to <strong>v⃗₂</strong>. Using the geometry of small arcs and <strong>triangle similarity</strong> between the position triangle and the velocity triangle:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-4">
                             <div className="text-[10px] uppercase tracking-widest font-bold text-primary/60">Geometric Relation</div>
                             <div className="font-mono text-xl text-primary italic">
                                (|Δv⃗|) / v = (|Δr⃗|) / r
                             </div>
                        </div>
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-4">
                             <div className="text-[10px] uppercase tracking-widest font-bold text-primary/60">Limit of Magnitude</div>
                             <div className="font-mono text-xl text-primary italic">
                                |Δv⃗| = (v/r) |Δr⃗|
                             </div>
                        </div>
                    </div>
                    <p>
                        Since instantaneous linear speed is defined as <strong>v = lim(Δt→0) |Δr⃗| / Δt</strong>, we can derive the radial acceleration by dividing by the time interval:
                    </p>
                    <div className="p-8 bg-black/60 rounded-[24px] border border-primary/20 font-mono text-2xl text-center text-primary shadow-lg italic">
                        a꜀ = lim(Δt→0) |Δv⃗| / Δt = (v/r) lim(Δt→0) (|Δr⃗| / Δt) = v²/r
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/10 text-white rounded-[32px]">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-white/60">Work-Energy Theorem Application</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6 text-sm text-white/60 leading-relaxed">
                    <p>
                        In Uniform Circular Motion, the centripetal force vector <strong>F⃗꜀</strong> is always strictly <strong>orthogonal</strong> to the infinitesimal displacement vector <strong>ds⃗</strong>. Applying the definition of work as a line integral:
                    </p>
                    <div className="p-8 bg-black/60 rounded-[24px] border border-orange-500/20 font-mono text-2xl text-center text-orange-400 shadow-lg italic">
                        W = ∫ F⃗꜀ · ds⃗ = ∫ F꜀ ds cos(90°) = 0
                    </div>
                    <p>
                        "Centripetal force is always perpendicular to displacement, therefore the dot product is zero and no work is done." This mathematical result confirms that the kinetic energy (and thus speed) remains invariant during UCM.
                    </p>
                </CardContent>
            </Card>
        </div>
      </motion.section>

      {/* Real World Applications */}
      <motion.section variants={itemVariants} className="space-y-6 pb-12">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
                <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Empirical Applications</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/10 space-y-3 group hover:border-primary/20 transition-all">
                <h4 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-hover:text-primary transition-colors">Satellite Orbits</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                    In a low-Earth orbit, gravitational attraction acts as the sole centripetal force. The satellite exists in a state of continuous "free fall" around the curvature of the Earth, where <strong>F⃗_g = m v²/r</strong>.
                </p>
            </div>
            <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/10 space-y-3 group hover:border-orange-500/20 transition-all">
                <h4 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] group-hover:text-orange-500 transition-colors">Banked Turns</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                    High-speed tracks use banking to utilize a component of the Normal Force (N⃗) to provide centripetal acceleration, reducing the reliance on tire-road friction to maintain the circular manifold.
                </p>
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {["Cyclotrons", "Centrifuges", "Planetary Motion", "Particle Accelerators"].map(item => (
                <Badge key={item} variant="outline" className="bg-white/5 border-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-primary hover:border-primary/30 transition-all cursor-default">
                    {item}
                </Badge>
            ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

const FormulaBox = ({ formula, label, desc }: { formula: string; label: string; desc: string }) => (
    <div className="group p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all shadow-lg">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{label}</span>
            <div className="p-1 rounded bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="w-3.5 h-3.5" />
            </div>
        </div>
        <div className="font-mono text-xl text-white mb-2 tracking-tight">{formula}</div>
        <p className="text-[10px] text-white/40 leading-relaxed italic">{desc}</p>
    </div>
);

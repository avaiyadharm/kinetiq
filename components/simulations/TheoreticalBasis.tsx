"use client";

import React from "react";
import { Info, BookOpen, Calculator, Globe2 } from "lucide-react";

export const TheoreticalBasis: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[#09090b]">
      <div className="max-w-4xl mx-auto space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Kinematic Principles</h2>
          </div>
          <p className="text-white/60 leading-relaxed text-lg">
            Projectile motion is a form of motion experienced by an object or particle (a projectile) that is thrown near the Earth's surface and moves along a curved path under the action of gravity only. In particular, the effects of air resistance are assumed to be negligible for ideal analysis.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="p-8 rounded-3xl bg-[#18181b] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-success" />
              <h3 className="text-xl font-bold">Key Formulas</h3>
            </div>
            <div className="space-y-4 font-mono text-sm">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center group hover:border-success/30 transition-colors">
                <span className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Horizontal Range (R)</span>
                <span className="text-success text-lg">u² sin 2θ / g</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-colors">
                <span className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Max Height (H)</span>
                <span className="text-primary text-lg">u² sin² θ / 2g</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center group hover:border-accent/30 transition-colors">
                <span className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Time of Flight (T)</span>
                <span className="text-accent text-lg">2u sin θ / g</span>
              </div>
            </div>
          </section>

          <section className="p-8 rounded-3xl bg-[#18181b] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <Globe2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold">Assumptions</h3>
            </div>
            <ul className="space-y-4 text-white/40 text-sm">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <p><span className="text-white/70 font-bold">Constant Gravity:</span> The acceleration due to gravity is constant throughout the flight.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <p><span className="text-white/70 font-bold">Flat Surface:</span> The Earth's surface is considered flat over the range of the projectile.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <p><span className="text-white/70 font-bold">No Rotation:</span> Effects of the Earth's rotation (Coriolis force) are ignored.</p>
              </li>
            </ul>
          </section>
        </div>

        <section className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div className="space-y-2">
              <h4 className="font-bold text-white">Advanced Analysis</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                When air resistance is enabled, the path is no longer a perfect parabola. The projectile experiences a drag force proportional to its velocity, which reduces both the maximum height and the horizontal range, creating an asymmetrical trajectory.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

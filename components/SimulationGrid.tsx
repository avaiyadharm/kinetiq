"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { SIMULATIONS } from "@/lib/data";
import { Play, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export const SimulationGrid = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight font-display">Featured Simulations</h2>
            <p className="text-gray-400 text-lg max-w-xl">
              High-precision computational models designed for intuitive exploration of complex physical phenomena.
            </p>
          </div>
          <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
            View All <div className="w-8 h-[1px] bg-white/20" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SIMULATIONS.map((sim, index) => (
            <motion.div
              key={sim.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-white/[0.08] transition-all duration-500 overflow-hidden"
            >
              {/* Glow Effect on Hover */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-zinc-900 border border-white/5 relative shadow-2xl">
                <Image
                  src={sim.image}
                  alt={sim.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className={cn(
                  "absolute top-4 left-4 py-1 px-3 rounded-full text-[10px] font-bold tracking-widest uppercase border backdrop-blur-md",
                  sim.difficulty === "Beginner" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                  sim.difficulty === "Intermediate" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                  "text-red-400 border-red-400/30 bg-red-400/10"
                )}>
                  {sim.difficulty}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{sim.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                  {sim.description}
                </p>
                
                <div className="pt-4 flex items-center justify-between">
                  <button className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest group/btn">
                    <Play className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" /> 
                    Launch Simulation
                  </button>
                  <Rocket className="w-5 h-5 text-white/10 group-hover:text-blue-500/50 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

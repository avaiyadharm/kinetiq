"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen pt-40 pb-20 overflow-hidden flex flex-col items-center justify-center text-center px-6 hero-gradient">
      {/* Background Grid & Laboratory Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      
      <div className="max-w-5xl mx-auto space-y-10 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-[0.2em] uppercase"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Next Generation Physics Lab
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[0.95] font-display"
        >
          Master Physics with <br />
          <span className="text-primary">Precise Simulations</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-medium leading-relaxed"
        >
          A high-performance laboratory platform designed for the spark of discovery. Explore gravity, waves, and quantum mechanics with mathematical accuracy.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
        >
          <Link href="/simulations">
            <button className="group relative bg-primary text-white px-10 py-4 rounded-lg text-lg font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-3">
              Explore Simulations <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/login">
            <button className="group px-10 py-4 rounded-lg text-lg font-bold text-white/80 border border-border hover:bg-white/5 transition-all flex items-center gap-3">
              <Play className="w-5 h-5 fill-primary text-primary" /> Faculty Access
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Hero Visual Elements */}
      <div className="mt-20 relative w-full max-w-[1200px] aspect-[21/9] perspective-[1000px] overflow-hidden">
        <motion.div 
          initial={{ rotateX: 10, y: 100, opacity: 0 }}
          animate={{ rotateX: 0, y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
          className="w-full h-full bg-[#18181b] border border-border rounded-2xl p-6 shadow-2xl shadow-black/50 relative"
        >
          {/* Laboratory Visualization */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
             <div className="w-[70%] h-[70%] border border-primary/20 rounded-full animate-orbit flex items-center justify-center" />
             <div className="absolute w-[50%] h-[50%] border border-success/20 rounded-full animate-[orbit_40s_linear_infinite_reverse] flex items-center justify-center" />
             <div className="absolute w-[30%] h-[30%] border border-accent/20 rounded-full animate-[orbit_20s_linear_infinite] flex items-center justify-center" />
          </div>
          <div className="grid grid-cols-12 gap-6 h-full relative z-10">
            <div className="col-span-8 bg-black/40 rounded-xl border border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.05)_100%)]" />
              {/* Mock simulation canvas */}
              <div className="absolute top-8 left-8 space-y-2">
                <div className="w-32 h-2 bg-primary/20 rounded-full" />
                <div className="w-24 h-2 bg-primary/10 rounded-full" />
              </div>
              <div className="absolute bottom-8 right-8 flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-border shadow-sm flex items-center justify-center">
                  <div className="w-4 h-4 bg-success rounded-full" />
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-border shadow-sm flex items-center justify-center">
                  <div className="w-4 h-4 bg-accent rounded-full" />
                </div>
              </div>
            </div>
            <div className="col-span-4 space-y-6">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-[28%] bg-black/20 rounded-xl border border-border p-4 space-y-3">
                   <div className="w-1/2 h-2 bg-white/5 rounded-full" />
                   <div className="flex gap-2">
                     <div className="flex-1 h-8 bg-white/5 rounded-md" />
                     <div className="w-12 h-8 bg-primary/10 rounded-md" />
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen pt-40 pb-20 overflow-hidden flex flex-col items-center justify-center text-center px-6">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent_50%)] -z-10" />
      <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-[40%] right-[10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[150px] -z-10 animate-float" />

      <div className="max-w-5xl mx-auto space-y-10 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Version 2.0 Live
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[0.95] font-display"
        >
          Learn Physics Through <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">Interactive Simulations</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium"
        >
          Experiment with motion, gravity, waves, electricity, and more through immersive visual learning experiences.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
        >
          <button className="group relative bg-blue-600 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-3">
            Explore Simulations <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="group px-10 py-4 rounded-xl text-lg font-bold text-white border border-white/10 hover:bg-white/5 transition-all flex items-center gap-3">
            <Play className="w-5 h-5 fill-current" /> Watch Demo
          </button>
        </motion.div>
      </div>

      {/* Hero Visual Elements */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0a0a0c] to-transparent z-10" />
      
      <div className="mt-20 relative w-full max-w-[1400px] aspect-[21/9] perspective-[1000px] overflow-hidden">
        <motion.div 
          initial={{ rotateX: 20, y: 100, opacity: 0 }}
          animate={{ rotateX: 0, y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
          className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent)] border border-white/10 rounded-3xl p-4 shadow-[0_0_100px_rgba(59,130,246,0.1)] relative"
        >
          {/* Mock UI/Visual elements inside the hero visual */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-[80%] h-[80%] border border-blue-500/20 rounded-full animate-orbit flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full blur-sm" />
             </div>
             <div className="absolute w-[60%] h-[60%] border border-purple-500/20 rounded-full animate-[orbit_40s_linear_infinite_reverse] flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-500 rounded-full blur-sm" />
             </div>
             <div className="absolute w-[40%] h-[40%] border border-cyan-500/20 rounded-full animate-[orbit_20s_linear_infinite] flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-500 rounded-full blur-sm" />
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

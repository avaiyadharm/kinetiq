"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  ChevronDown, 
  Cpu, 
  Lightbulb, 
  Atom, 
  Zap,
  LineChart,
  Box
} from "lucide-react";
import { cn } from "@/lib/utils";

const TheoryCard = ({ title, law, explanation, equation, icon: Icon, color, isOpen, onToggle }: any) => (
  <div className="bg-[#18181b] border border-white/5 rounded-[32px] overflow-hidden transition-all duration-500 shadow-xl group">
    <button 
      onClick={onToggle}
      className="w-full p-8 flex items-center justify-between text-left group-hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center gap-6">
        <div className="p-4 rounded-2xl bg-white/5 shadow-inner" style={{ color }}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color }}>{law}</span>
          <h3 className="text-xl font-black uppercase tracking-tight text-white">{title}</h3>
        </div>
      </div>
      <div className={cn("p-2 rounded-full bg-white/5 transition-transform duration-500", isOpen && "rotate-180")}>
        <ChevronDown className="w-5 h-5 text-white/20" />
      </div>
    </button>
    
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: "circOut" }}
        >
          <div className="px-8 pb-8 space-y-8 border-t border-white/5 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Principia
                </h4>
                <p className="text-white/60 leading-relaxed italic border-l-2 pl-4" style={{ borderColor: color }}>
                  "{explanation}"
                </p>
              </div>
              <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col justify-center items-center text-center space-y-2">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Mathematical Formulation</span>
                <p className="text-3xl font-mono font-black text-white tracking-tighter">{equation}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <LineChart className="w-5 h-5 text-white/20" />
                  <p className="text-xs text-white/40 leading-relaxed">Velocity vs. Time curves represent the integration of acceleration vectors.</p>
               </div>
               <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <Box className="w-5 h-5 text-white/20" />
                  <p className="text-xs text-white/40 leading-relaxed">Mass acts as a scalar multiplier for inertial resistance in all reference frames.</p>
               </div>
               <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-center flex flex-col items-center justify-center">
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white uppercase tracking-widest">Interactive Lab Available</div>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ScientificNote = ({ title, content }: any) => (
  <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-6 rounded-[24px] border border-blue-500/10 space-y-2 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
      <Cpu className="w-12 h-12" />
    </div>
    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">{title}</h5>
    <p className="text-xs text-white/50 leading-relaxed">{content}</p>
  </div>
);

export function TheoreticalBasis() {
  const [openCard, setOpenCard] = useState<number | null>(0);

  const lessons = [
    {
      law: "Newton's First Law",
      title: "Law of Inertia",
      explanation: "An object at rest remains at rest, and an object in motion remains in motion unless acted upon by an external force.",
      equation: "ΣF = 0",
      icon: Box,
      color: "#ff85a2"
    },
    {
      law: "Newton's Second Law",
      title: "Force & Acceleration",
      explanation: "The acceleration of an object depends on the applied force and its mass, defined by the product of mass and acceleration.",
      equation: "F = ma",
      icon: Zap,
      color: "#3b82f6"
    },
    {
      law: "Newton's Third Law",
      title: "Action & Reaction",
      explanation: "For every action, there is an equal and opposite reaction. Forces always exist in pairs of equal magnitude.",
      equation: "F₁ = -F₂",
      icon: Atom,
      color: "#10b981"
    },
    {
      law: "Universal Mechanics",
      title: "Conservation of Momentum",
      explanation: "The total momentum of a closed system remains constant if no external forces act upon it during interaction.",
      equation: "p = mv",
      icon: LineChart,
      color: "#a855f7"
    }
  ];

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            Theoretical <span className="text-primary">Basis</span>
          </h2>
          <p className="text-white/40 text-sm font-medium">Understand the scientific principles powering the KINETIQ Engine.</p>
        </div>

        <div className="space-y-6">
          {lessons.map((lesson, idx) => (
            <TheoryCard 
              key={idx}
              {...lesson}
              isOpen={openCard === idx}
              onToggle={() => setOpenCard(openCard === idx ? null : idx)}
            />
          ))}
        </div>
      </div>

      {/* Floating Insights Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden h-fit">
          <div className="flex items-center gap-3">
             <Lightbulb className="w-5 h-5 text-yellow-400" />
             <h3 className="text-sm font-black uppercase tracking-widest text-white">Lab Insights</h3>
          </div>
          
          <div className="space-y-4">
            <ScientificNote 
              title="Experiment 626"
              content="Mass is not just weight; it's a measure of inertia. In zero-gravity, a 50kg object still requires the same force to accelerate as it does on Earth."
            />
            <ScientificNote 
              title="Lab Observation"
              content="Atmospheric drag is non-linear. Doubling your velocity results in a 4x increase in air resistance, creating terminal velocity limits."
            />
            <ScientificNote 
              title="Scientific Insight"
              content="Momentum is conserved even in explosions. The sum of all fragments' velocity vectors weighted by mass always equals the initial state."
            />
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-[#18181b] bg-white/10" />
               ))}
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">12 peer reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}

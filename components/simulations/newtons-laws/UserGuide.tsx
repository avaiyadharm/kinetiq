"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  MousePointer2, 
  BarChart3, 
  Eye, 
  Trophy, 
  ShieldAlert,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const GuideCard = ({ step, title, desc, icon: Icon }: any) => (
  <div className="bg-[#18181b] border border-white/5 rounded-[32px] p-8 space-y-4 group hover:border-white/10 transition-all shadow-xl relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
       <Icon className="w-20 h-20" />
    </div>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary font-black text-xs">
        {step}
      </div>
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
    </div>
    <p className="text-white/40 text-xs leading-relaxed max-w-[80%]">{desc}</p>
  </div>
);

const MetricItem = ({ label, color, desc }: any) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.07] transition-all">
    <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <div className="space-y-1">
      <h5 className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</h5>
      <p className="text-[10px] text-white/40 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);

const MissionCard = ({ title, reward, progress }: any) => (
  <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-[28px] border border-primary/20 space-y-4 relative overflow-hidden">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h5 className="text-xs font-black uppercase tracking-tight text-white">{title}</h5>
        <div className="flex items-center gap-2">
           <Trophy className="w-3 h-3 text-yellow-400" />
           <span className="text-[10px] font-bold text-yellow-400/60 uppercase tracking-widest">{reward}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-white/20" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase">
         <span>Progress</span>
         <span>{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  </div>
);

export function UserGuide() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar">
      <div className="flex-1 space-y-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
            User <span className="text-primary">Guide</span>
          </h2>
          <p className="text-white/40 text-sm font-medium">Learn how to operate the KINETIQ simulation laboratory.</p>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <Info className="w-5 h-5 text-primary" />
             <h4 className="text-sm font-black uppercase tracking-widest text-white/60">Getting Started</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GuideCard 
              step="01"
              title="Calibration"
              desc="Use the sliders to adjust mass and environmental variables before initiating the simulation cycle."
              icon={MousePointer2}
            />
            <GuideCard 
              step="02"
              title="Execution"
              desc="Engage the primary ignition system by clicking and holding the interaction plate. Monitor recoil effects."
              icon={Play}
            />
            <GuideCard 
              step="03"
              title="Telemetry"
              desc="Observe real-time data feeds in the top-left HUD panels. Vectors represent magnitude and direction."
              icon={BarChart3}
            />
            <GuideCard 
              step="04"
              title="Analysis"
              desc="Compare observed motion against theoretical models using the built-in force analysis dashboard."
              icon={Eye}
            />
          </div>
        </section>

        {/* Metric Legend */}
        <section className="space-y-6 bg-[#18181b] rounded-[40px] p-10 border border-white/5 shadow-2xl">
          <div className="space-y-1">
             <h4 className="text-sm font-black uppercase tracking-widest text-white">Visual Taxonomy</h4>
             <p className="text-xs text-white/30">Understanding the color and arrow system used in simulations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricItem label="Primary Thrust" color="#3b82f6" desc="Indicates active energy input. Arrows point in the direction of intended acceleration." />
            <MetricItem label="Opposing Force" color="#ff85a2" desc="Represents friction, drag, or gravity vectors working against primary motion." />
            <MetricItem label="Stabilized State" color="#10b981" desc="Visual confirmation of equilibrium where net forces are perfectly balanced." />
            <MetricItem label="Inertial Trail" color="#ffffff20" desc="Motion history showing the previous path and decay of kinetic energy over time." />
          </div>
        </section>
      </div>

      {/* Lab Missions Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-[#18181b] rounded-[32px] border border-white/5 p-8 space-y-8 shadow-2xl relative overflow-hidden h-fit">
          <div className="flex items-center gap-3">
             <Trophy className="w-5 h-5 text-yellow-400" />
             <h3 className="text-sm font-black uppercase tracking-widest text-white">Lab Missions</h3>
          </div>
          
          <div className="space-y-4">
            <MissionCard title="Orbital Velocity" reward="Badge: Astronaut" progress={65} />
            <MissionCard title="Zero Friction Drift" reward="Badge: Slick Operator" progress={20} />
            <MissionCard title="Perfect Equilibrium" reward="Badge: Master Balancer" progress={0} />
          </div>

          <div className="pt-6 border-t border-white/5 space-y-6">
             <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-[#ff85a2]" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff85a2]">Safety Protocols</h4>
             </div>
             <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                   <div className="w-1 h-1 rounded-full bg-[#ff85a2] mt-1.5 shrink-0" />
                   <p className="text-[10px] text-white/40 leading-relaxed font-medium">Excessive mass may result in non-responsive acceleration thresholds.</p>
                </li>
                <li className="flex gap-3 items-start">
                   <div className="w-1 h-1 rounded-full bg-[#ff85a2] mt-1.5 shrink-0" />
                   <p className="text-[10px] text-white/40 leading-relaxed font-medium">High temporal dilation can cause numerical integration jitter.</p>
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

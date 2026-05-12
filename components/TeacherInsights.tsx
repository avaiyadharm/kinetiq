"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, BarChart3 } from "lucide-react";

export const TeacherInsights = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1280px] mx-auto backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row gap-16 items-center">
        <div className="md:w-1/2 space-y-8">
          <span className="text-cyan-400 text-xs font-bold tracking-widest flex items-center gap-2 uppercase">
            <BarChart3 className="w-4 h-4" /> RESEARCHER PORTAL
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Teacher Insights & Global Analytics
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Monitor student progression, concept mastery, and experimental creativity through our advanced laboratory dashboard.
          </p>
          <ul className="space-y-4">
            {[
              "Real-time student engagement tracking",
              "Automated assessment of physics derivation",
              "Custom curriculum integration",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/90">
                <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:w-1/2 w-full">
          <motion.div 
            initial={{ rotateY: 20, rotateX: 10, opacity: 0 }}
            whileInView={{ rotateY: 0, rotateX: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-white/5 rounded-xl overflow-hidden shadow-2xl relative border border-blue-500/20"
          >
            {/* Dashboard UI Mockup */}
            <div className="bg-white/10 px-6 py-3 flex justify-between items-center border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase">
                Analytics: Simulation Unit 04
              </span>
            </div>
            
            <div className="p-8 grid grid-cols-2 gap-6">
              <div className="col-span-2 backdrop-blur-md bg-white/5 p-6 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 text-xs font-bold tracking-wider uppercase">STUDENT ENGAGEMENT</span>
                  <span className="text-cyan-400 text-xs font-bold">+12.4%</span>
                </div>
                {/* Chart Mockup */}
                <div className="h-32 flex items-end gap-1.5">
                  {[40, 60, 45, 70, 90, 65, 80].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      transition={{ delay: i * 0.1, duration: 1 }}
                      className={`flex-1 rounded-t-sm ${i === 4 ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-blue-500/20"}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="backdrop-blur-md bg-white/5 p-6 rounded-lg border border-white/10">
                <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase block mb-1">ACTIVE USERS</span>
                <span className="text-2xl font-bold text-white">1,248</span>
              </div>
              
              <div className="backdrop-blur-md bg-white/5 p-6 rounded-lg border border-white/10">
                <span className="text-gray-400 text-[10px] font-bold tracking-wider uppercase block mb-1">AVG MASTERY</span>
                <span className="text-2xl font-bold text-cyan-400">84%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

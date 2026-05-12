"use client";

import React from "react";
import { motion } from "framer-motion";
import { FEATURES } from "@/lib/data";
import { Play, Eye, Brain, MousePointer, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  play: Play,
  eye: Eye,
  brain: Brain,
  "mouse-pointer": MousePointer,
  smile: Smile,
};

export const FeatureGrid = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-24 space-y-4">
          <span className="text-blue-400 text-xs font-bold tracking-[0.3em] uppercase">The Kinetiq Advantage</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight font-display">Why Learn with Kinetiq?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We bridge the gap between abstract equations and physical reality through high-fidelity computation and intuitive design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {FEATURES.map((feature, index) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="group p-8 rounded-3xl backdrop-blur-sm bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform">
                  {Icon && <Icon className="w-7 h-7 text-blue-400" />}
                </div>
                <h4 className="text-xl font-bold text-white mb-4 tracking-tight">{feature.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

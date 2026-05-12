"use client";

import React from "react";
import { motion } from "framer-motion";
import { FEATURES } from "@/src/data/mockData";
import { Play, Eye, Brain, MousePointer, Smile } from "lucide-react";
import { Card } from "@/components/ui/card";

const ICON_MAP: Record<string, any> = {
  play: Play,
  eye: Eye,
  brain: Brain,
  "mouse-pointer": MousePointer,
  smile: Smile,
};

interface FeatureGridProps {}

export const FeatureGrid: React.FC<Readonly<FeatureGridProps>> = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-background">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-24 space-y-4">
          <span className="text-primary text-[10px] font-bold tracking-[0.3em] uppercase">The Kinetiq Advantage</span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-display">Why Learn with Kinetiq?</h2>
          <p className="text-foreground/60 max-w-2xl mx-auto text-lg">
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
                className="flex"
              >
                <Card className="group p-8 rounded-2xl lab-card transition-all duration-300 w-full bg-[#18181b] border border-border shadow-sm">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:scale-110 transition-transform">
                    {Icon && <Icon className="w-7 h-7 text-primary" />}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-4 tracking-tight font-display">{feature.title}</h4>
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

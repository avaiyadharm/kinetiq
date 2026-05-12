"use client";

import React from "react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/src/data/mockData";
import { Activity, Waves, Zap, Eye, Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";

const ICON_MAP: Record<string, any> = {
  activity: Activity,
  waves: Waves,
  zap: Zap,
  eye: Eye,
  thermometer: Thermometer,
};

interface CategoryGridProps {}

export const CategoryGrid: React.FC<Readonly<CategoryGridProps>> = () => {
  return (
    <section className="py-24 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4 font-display">Explore by Category</h2>
          <p className="text-gray-500">Dive into specific branches of physics with tailored learning paths.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((category, index) => {
            const Icon = ICON_MAP[category.icon];
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex"
              >
                <Card className="group cursor-pointer backdrop-blur-md bg-white/5 border-white/10 rounded-2xl p-8 text-center hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300 w-full flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors shadow-inner mb-6">
                    {Icon && <Icon className="w-8 h-8 text-white/50 group-hover:text-blue-400 transition-colors" />}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{category.name}</h4>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{category.count}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

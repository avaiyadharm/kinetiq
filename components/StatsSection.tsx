"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { STATS } from "@/lib/data";

const Counter = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.floor(current));

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, spring, value]);

  return (
    <div ref={ref} className="text-4xl md:text-6xl font-bold text-foreground tracking-tighter tabular-nums flex items-center justify-center font-display">
      <motion.span>{display}</motion.span>
      <span className="text-primary">{suffix}</span>
    </div>
  );
};

export const StatsSection = () => {
  return (
    <section className="py-24 bg-black/20 backdrop-blur-sm border-y border-border/50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <Counter value={stat.value} suffix={stat.suffix} />
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

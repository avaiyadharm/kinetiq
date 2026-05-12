"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SIMULATIONS } from "@/src/data/mockData";
import { Play, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SimulationGridProps {}

export const SimulationGrid: React.FC<Readonly<SimulationGridProps>> = () => {
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
              className="flex"
            >
              <Card className="group relative backdrop-blur-md bg-white/5 border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:bg-white/[0.08] transition-all duration-500 flex flex-col w-full">
                {/* Glow Effect on Hover */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="aspect-video overflow-hidden bg-zinc-900 border-b border-white/5 relative">
                  <Image
                    src={sim.image}
                    alt={sim.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <Badge variant="outline" className={cn(
                    "absolute top-4 left-4 backdrop-blur-md border border-white/20",
                    sim.difficulty === "Beginner" ? "text-emerald-400 bg-emerald-400/10" :
                    sim.difficulty === "Intermediate" ? "text-amber-400 bg-amber-400/10" :
                    "text-red-400 bg-red-400/10"
                  )}>
                    {sim.difficulty}
                  </Badge>
                </div>
                
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {sim.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                    {sim.description}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-4 flex items-center justify-between">
                  <Link href={sim.href} passHref>
                    <Button variant="link" className="p-0 h-auto text-blue-400 text-xs font-bold uppercase tracking-widest group/btn">
                      <Play className="w-4 h-4 fill-current mr-2 group-hover/btn:scale-110 transition-transform" /> 
                      Launch Simulation
                    </Button>
                  </Link>
                  <Rocket className="w-5 h-5 text-white/10 group-hover:text-blue-500/50 transition-colors" />
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

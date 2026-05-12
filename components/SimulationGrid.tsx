"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SIMULATIONS } from "@/src/data/mockData";
import { Play, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SimulationGridProps {}

export const SimulationGrid: React.FC<Readonly<SimulationGridProps>> = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-black/20">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-display">Featured Simulations</h2>
            <p className="text-foreground/60 text-lg max-w-xl">
              High-precision computational models designed for intuitive exploration of complex physical phenomena.
            </p>
          </div>
          <Link href="/simulations" className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors text-sm uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
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
              <Card className="group relative lab-card overflow-hidden transition-all duration-500 flex flex-col w-full border border-border shadow-sm">
                <div className="aspect-video overflow-hidden bg-black/40 border-b border-border relative">
                  <Image
                    src={sim.image}
                    alt={sim.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  <Badge variant="outline" className={cn(
                    "absolute top-4 left-4 backdrop-blur-md border shadow-sm",
                    sim.difficulty === "Beginner" ? "text-success border-success/20 bg-black/40" :
                    sim.difficulty === "Intermediate" ? "text-accent border-accent/20 bg-black/40" :
                    "text-red-500 border-red-500/20 bg-black/40"
                  )}>
                    {sim.difficulty}
                  </Badge>
                </div>
                
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors font-display">
                    {sim.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <p className="text-foreground/60 text-sm leading-relaxed line-clamp-2">
                    {sim.description}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-4 flex items-center justify-between border-t border-border/50">
                  <Link href={sim.href} passHref>
                    <Button variant="link" className="p-0 h-auto text-primary text-xs font-bold uppercase tracking-widest group/btn">
                      <Play className="w-4 h-4 fill-current mr-2 group-hover/btn:scale-110 transition-transform" /> 
                      Launch Simulation
                    </Button>
                  </Link>
                  <Rocket className="w-5 h-5 text-white/5 group-hover:text-primary/20 transition-colors" />
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

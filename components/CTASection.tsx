"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {}

export const CTASection: React.FC<Readonly<CTASectionProps>> = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto relative group">
        <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all duration-500" />
        
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[#18181b] p-12 md:p-24 text-center space-y-10 shadow-2xl shadow-black/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-success/5 rounded-full blur-[100px] -z-10" />
          
          <div className="flex justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center p-4 border border-primary/20"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight font-display">
              Ready to See the <br />
              <span className="text-primary">Unseen?</span>
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Join thousands of students and educators who are transforming the way they learn and teach physics through interactive experimentation.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-white px-12 py-8 rounded-xl text-lg font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95">
              Get Started for Free
            </Button>
            <Button size="lg" variant="outline" className="px-12 py-8 rounded-xl text-lg font-bold text-white/80 border-border hover:bg-white/5 transition-all">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all duration-500" />
        
        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl p-12 md:p-24 text-center space-y-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10" />
          
          <div className="flex justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center p-0.5"
            >
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
            </motion.div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight font-display">
              Ready to See the <br />
              <span className="text-blue-500">Unseen?</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Join thousands of students and educators who are transforming the way they learn and teach physics through interactive experimentation.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-black px-12 py-8 rounded-2xl text-lg font-bold hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-2xl active:scale-95">
              Get Started for Free
            </Button>
            <Button size="lg" variant="outline" className="px-12 py-8 rounded-2xl text-lg font-bold text-white border-white/10 hover:bg-white/5 transition-all">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

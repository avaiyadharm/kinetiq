"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { NAVIGATION_LINKS } from "@/src/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavbarProps {}

export const Navbar: React.FC<Readonly<NavbarProps>> = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[98%] max-w-[1600px] rounded-2xl backdrop-blur-xl border border-white/10 bg-black/20 z-50 flex justify-between items-center px-12 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
           <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/></svg>
        </div>
        <span className="text-2xl font-bold tracking-tighter text-white font-display">KINETIQ</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-10">
        {NAVIGATION_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm font-semibold text-gray-400 hover:text-blue-400 transition-all hover:scale-105"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      
      <Button variant="outline" className="bg-white text-black rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300">
        Start Exploring
      </Button>
    </motion.header>
  );
};

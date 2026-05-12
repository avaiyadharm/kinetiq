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
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[98%] max-w-[1600px] rounded-2xl backdrop-blur-md border border-border bg-black/40 z-50 flex justify-between items-center px-12 py-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
           <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/></svg>
        </div>
        <span className="text-2xl font-bold tracking-tighter text-white font-display">KINETIQ</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-10">
        {NAVIGATION_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm font-bold text-white/70 hover:text-primary transition-all"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      
      <Button className="bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm">
        Start Exploring
      </Button>
    </motion.header>
  );
};

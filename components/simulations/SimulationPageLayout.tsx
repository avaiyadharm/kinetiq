"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutGrid, Info, Settings, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SimulationPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const SimulationPageLayout: React.FC<Readonly<SimulationPageLayoutProps>> = ({ title, children }) => {
  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] overflow-hidden text-white selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-[280px] border-r border-white/5 flex flex-col bg-[#0a0a0c] z-30">
        <div className="p-6 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to Gallery
          </Link>
          <h2 className="text-xl font-bold tracking-tight font-display text-white">KINETIQ ENGINE</h2>
          <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">Laboratory Session v1.4</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4 mb-4">Core Modules</div>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl font-bold text-sm border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all">
            <LayoutGrid className="w-4 h-4" /> 
            Kinematics
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" /> 
            Environment
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
            <Info className="w-4 h-4" /> 
            Documentation
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button className="w-full py-4 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
            <RotateCcw className="w-4 h-4" />
            Reset Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/20 backdrop-blur-md">
          <h1 className="text-2xl font-bold tracking-tight font-display">{title}</h1>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Compute Node Active</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutGrid, Info, Settings, RotateCcw, Share2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SimulationPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const SimulationPageLayout: React.FC<Readonly<SimulationPageLayoutProps>> = ({ title, children }) => {
  return (
    <div className="flex h-screen w-full bg-[#091421] overflow-hidden text-[#d9e3f6] font-sans antialiased selection:bg-[#2563eb]/30">
      {/* Sidebar */}
      <aside className="w-[320px] border-r border-white/5 flex flex-col bg-[#050f1c] z-30 shadow-2xl">
        <div className="p-8 space-y-2">
          <Link href="/simulations" className="flex items-center gap-2 text-[#8d90a0] hover:text-[#d9e3f6] transition-colors text-[10px] font-bold uppercase tracking-widest mb-10 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
            Back to Lab Gallery
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-display text-white">KINETIQ</h2>
            <span className="text-[10px] font-bold text-[#2563eb] border border-[#2563eb]/30 px-1.5 py-0.5 rounded uppercase">Engine</span>
          </div>
          <p className="text-[10px] font-bold text-[#c3c6d7] tracking-[0.2em] uppercase opacity-60">Laboratory Session v1.4</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <div className="text-[10px] font-bold text-[#434655] uppercase tracking-[0.3em] px-4 mb-6">Core Modules</div>
          <button className="w-full flex items-center gap-3 px-4 py-4 bg-[#2563eb]/10 text-[#2563eb] rounded-xl font-bold text-sm border border-[#2563eb]/20 shadow-lg shadow-blue-900/10 transition-all">
            <LayoutGrid className="w-4.5 h-4.5" /> 
            Simulation Canvas
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-4 text-[#c3c6d7] hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
            <Settings className="w-4.5 h-4.5 group-hover:rotate-45 transition-transform" /> 
            Environment Config
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-4 text-[#c3c6d7] hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
            <Info className="w-4.5 h-4.5" /> 
            Theoretical Basis
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-4 text-[#c3c6d7] hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
            <HelpCircle className="w-4.5 h-4.5" /> 
            User Guide
          </button>
        </nav>

        <div className="p-8 border-t border-white/5 bg-[#091421]/50">
          <button className="w-full py-4 bg-[#16202e] border border-[#434655] text-[#d9e3f6] hover:bg-[#212b39] font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg">
            <RotateCcw className="w-4 h-4" />
            Reset Laboratory
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between bg-[#050f1c]/80 backdrop-blur-xl z-20">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display text-white">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-[#8d90a0] uppercase tracking-widest">Compute Node: AP-101 Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 text-[#c3c6d7] hover:text-white hover:bg-white/5 rounded-full transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-white/5 mx-2" />
            <div className="flex items-center gap-3 px-4 py-2 bg-[#16202e] rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2563eb]/20 flex items-center justify-center">
                 <span className="text-[10px] font-bold text-[#2563eb]">SJ</span>
              </div>
              <span className="text-xs font-bold text-white">Dr. Sarah</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

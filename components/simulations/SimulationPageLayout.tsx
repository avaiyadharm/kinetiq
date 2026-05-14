"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutGrid, Info, Settings, RotateCcw, Share2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabType = "canvas" | "config" | "theory" | "guide";

interface SimulationPageLayoutProps {
  title: string;
  children: React.ReactNode;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export const SimulationPageLayout: React.FC<Readonly<SimulationPageLayoutProps>> = ({ 
  title, 
  children,
  activeTab = "canvas",
  onTabChange
}) => {
  return (
    <div className="flex h-screen w-full bg-[#09090b] overflow-hidden text-white font-sans antialiased selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-[320px] border-r border-border flex flex-col bg-[#18181b] z-30 shadow-xl">
        <div className="p-8 space-y-2">
          <Link href="/simulations" className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest mb-10 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
            Back to Lab Gallery
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-display text-white">KINETIQ</h2>
            <span className="text-[10px] font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded uppercase">Engine</span>
          </div>
          <p className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">Laboratory Session v1.4</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] px-4 mb-6">Core Modules</div>
          <button 
            onClick={() => onTabChange?.("canvas")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all",
              activeTab === "canvas" 
                ? "bg-primary text-white border border-primary shadow-lg shadow-primary/20" 
                : "text-white/60 hover:text-primary hover:bg-primary/10"
            )}
          >
            <LayoutGrid className="w-4.5 h-4.5" /> 
            Simulation Canvas
          </button>
          <button 
            onClick={() => onTabChange?.("config")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all group",
              activeTab === "config" 
                ? "bg-primary text-white border border-primary shadow-lg shadow-primary/20" 
                : "text-white/60 hover:text-primary hover:bg-primary/10"
            )}
          >
            <Settings className={cn("w-4.5 h-4.5 group-hover:rotate-45 transition-transform", activeTab === "config" ? "rotate-45" : "")} /> 
            Environment Config
          </button>
          <button 
            onClick={() => onTabChange?.("theory")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all",
              activeTab === "theory" 
                ? "bg-primary text-white border border-primary shadow-lg shadow-primary/20" 
                : "text-white/60 hover:text-primary hover:bg-primary/10"
            )}
          >
            <Info className="w-4.5 h-4.5" /> 
            Theoretical Basis
          </button>
          <button 
            onClick={() => onTabChange?.("guide")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all",
              activeTab === "guide" 
                ? "bg-primary text-white border border-primary shadow-lg shadow-primary/20" 
                : "text-white/60 hover:text-primary hover:bg-primary/10"
            )}
          >
            <HelpCircle className="w-4.5 h-4.5" /> 
            User Guide
          </button>
        </nav>

        <div className="p-8 border-t border-border bg-black/20">
          <button className="w-full py-4 bg-[#18181b] border border-border text-white hover:bg-white/5 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
            <RotateCcw className="w-4 h-4" />
            Reset Laboratory
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
        <header className="h-24 border-b border-border px-10 flex items-center justify-between bg-black/40 backdrop-blur-md z-20">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display text-white">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Compute Node: AP-101 Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 text-white/40 hover:text-primary hover:bg-primary/10 rounded-full transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-border mx-2" />
            <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                 <span className="text-[10px] font-bold text-primary">SJ</span>
              </div>
              <span className="text-xs font-bold text-white font-display">Dr. Sarah</span>
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

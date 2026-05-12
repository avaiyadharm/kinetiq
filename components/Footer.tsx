"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full py-24 border-t border-border bg-black/40">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
               <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/></svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tighter uppercase font-display">KINETIQ</span>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs font-medium">
            Advancing scientific literacy through high-precision computational exploration and intuitive interactive design.
          </p>
          <div className="flex gap-6">
            <div className="w-5 h-5 text-white/30 hover:text-primary transition-all cursor-pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </div>
            <div className="w-5 h-5 text-white/30 hover:text-primary transition-all cursor-pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.2-.3 2.4 0 3.5-.73 1.02-1.08 2.25-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </div>
            <MessageSquare className="w-5 h-5 text-white/30 hover:text-primary transition-all cursor-pointer" />
          </div>
        </div>

        <div className="space-y-8">
          <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Platform</h4>
          <ul className="space-y-4">
            {["Simulations", "Categories", "Learn", "Experiments"].map(item => (
              <li key={item}><a href="#" className="text-white/50 text-sm font-medium hover:text-primary transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Company</h4>
          <ul className="space-y-4">
            {["About Us", "Research", "Careers", "Privacy Policy"].map(item => (
              <li key={item}><a href="#" className="text-white/50 text-sm font-medium hover:text-primary transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Laboratory Updates</h4>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-black/40 border border-border rounded-lg text-white px-4 py-3 focus:outline-none focus:border-primary transition-all placeholder:text-white/20 text-sm" 
                placeholder="Laboratory email" 
                type="email"
              />
              <button className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm">Join</button>
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Connecting 5,000+ scientific minds.</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-24 pt-8 border-t border-border/50 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">© 2026 Kinetiq Research Lab. Engineered for discovery.</p>
        <div className="flex gap-8">
          <a href="#" className="text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Terms</a>
          <a href="#" className="text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Security</a>
        </div>
      </div>
    </footer>
  );
};

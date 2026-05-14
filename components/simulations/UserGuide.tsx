"use client";

import React from "react";
import { HelpCircle, Play, Settings, MousePointer2, Keyboard } from "lucide-react";

export const UserGuide: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[#09090b]">
      <div className="max-w-4xl mx-auto space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Interactive Guide</h2>
          </div>
          <p className="text-white/60 leading-relaxed text-lg">
            Welcome to the KINETIQ Projectile Motion Laboratory. This guide will help you understand how to manipulate the environment and analyze your results.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                <Settings className="w-4 h-4" />
                Step 1: Configuration
              </div>
              <p className="text-white/40 text-sm">
                Use the <span className="text-white">Environment Config</span> tab to set your launch parameters. You can adjust the angle, velocity, and gravity using either the sliders or by directly typing values into the input fields.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-success font-bold uppercase tracking-widest text-xs">
                <Play className="w-4 h-4" />
                Step 2: Execution
              </div>
              <p className="text-white/40 text-sm">
                Return to the <span className="text-white">Simulation Canvas</span> and click the large play button to launch the projectile. You can pause at any time to inspect the instantaneous position and velocity.
              </p>
            </section>
          </div>

          <div className="bg-[#18181b] rounded-3xl border border-white/5 p-8 space-y-6">
            <h3 className="text-xl font-bold">Shortcuts & Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center gap-3">
                   <MousePointer2 className="w-4 h-4 text-white/40" />
                   <span className="text-sm">Click to Edit</span>
                </div>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">L-CLICK</kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center gap-3">
                   <Keyboard className="w-4 h-4 text-white/40" />
                   <span className="text-sm">Reset Sim</span>
                </div>
                <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">SPACE</kbd>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Pro Tips</h4>
              <ul className="space-y-2 text-[12px] text-white/40 italic">
                <li>• Higher gravity requires higher initial velocity to reach the same range.</li>
                <li>• Launch angle of 45° yields the maximum horizontal range in a vacuum.</li>
                <li>• Enable "Path" to compare trajectories across different planet settings.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

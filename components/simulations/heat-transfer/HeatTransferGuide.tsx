"use client";

import React from "react";
import { HelpCircle, Sparkles, Paintbrush, Sliders, Info, Heart } from "lucide-react";

export const HeatTransferGuide: React.FC = () => {
  return (
    <div className="flex-1 p-8 bg-[#18181b] overflow-y-auto text-white">
      <div className="max-w-4xl mx-auto w-full space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5" /> User Guide & Instructions
          </h2>
          <p className="text-xs text-white/50 mt-1">Learn how to configure, draw, and analyze 2D heat diffusion patterns.</p>
        </div>

        {/* Quick Start */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/20 border border-white/5 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-bold uppercase tracking-wider text-sm">
              <Paintbrush className="w-4 h-4" /> Painting on the Grid
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Use your mouse or trackpad to click and drag directly onto the simulation canvas.
            </p>
            <ul className="list-disc pl-5 text-xs text-white/60 space-y-1">
              <li>Choose a tool: <strong className="text-rose-400">Source (Hot)</strong> or <strong className="text-cyan-400">Sink (Cold)</strong>.</li>
              <li>Paint structures of custom conductivity using the **Material** brush.</li>
              <li>Clear fixed temperature points or restore default conductivity using the **Eraser**.</li>
              <li>Adjust the brush size using the sidebar slider for detailed drawings.</li>
            </ul>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-sm">
              <Sliders className="w-4 h-4" /> Experiment Presets
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Skip custom setups by launching one of the pre-built physics scenarios:
            </p>
            <ul className="list-disc pl-5 text-xs text-white/60 space-y-1">
              <li><strong>CPU Heatsink:</strong> Watch thermal energy diffuse from a hot silicon chip through high-conductivity fins cooled by ambient air.</li>
              <li><strong>Thermal Bridge:</strong> See how heat leaks from a hot chamber to a cold chamber through an iron bar.</li>
              <li><strong>Corner Heating:</strong> Observe thermal fronts sweeping diagonally across a metal plate.</li>
              <li><strong>Insulated Chamber:</strong> See how poor conductors (insulators) trap hot air and block heat exchange.</li>
            </ul>
          </div>
        </div>

        {/* In-depth features */}
        <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
          <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider font-display">Advanced Analysis Tools</h3>
          
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
              <strong className="text-white block font-display">1D Temperature Profile (Draggable Slice)</strong>
              <p className="text-white/60 leading-relaxed">
                Notice the dotted line traversing the canvas. You can **drag this line** up and down (or left and right) to select a cross-section slice. The chart at the bottom displays the temperature profile along this slice in real time. Perfect for showing linear temperature gradients in 1D heat paths.
              </p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
              <strong className="text-white block font-display">Heat Flux Vector Arrows</strong>
              <p className="text-white/60 leading-relaxed">
                When enabled, small arrows appear across the grid showing the local direction of heat transfer. The length and color of the arrows represent the rate of heat flow (q = -k·∇T). Notice how arrows always point from hot to cold, and travel faster through highly conductive materials.
              </p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
              <strong className="text-white block font-display">Gauss-Seidel Steady State Solver</strong>
              <p className="text-white/60 leading-relaxed">
                Tired of waiting for heat to diffuse? Switch the solver from **Transient (Time-Dependent)** to **Steady State**. The simulator will instantly compute the final thermal equilibrium using relaxation mathematics.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-400" /> Pro-Tips for Experimenting
          </h3>
          <p className="text-xs text-white/70 leading-relaxed">
            - Select **Thermal/Ironbow** color scheme to see details, or **Icefire** to clearly separate hot (red) and cold (blue) zones.
            - Build a "shield" of low-conductivity wood or a pocket of vacuum to see how thermal shielding blocks heat flow.
            - Try increasing the **Ambient Convective Loss** parameter in the Config tab; this models cooling wind blowing across the surface!
          </p>
        </div>
      </div>
    </div>
  );
};

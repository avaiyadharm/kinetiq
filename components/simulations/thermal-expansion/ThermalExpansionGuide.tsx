"use client";

import React from "react";
import { HelpCircle, Play, Flame, ShieldAlert, Sparkles, BookOpen } from "lucide-react";

export const ThermalExpansionGuide: React.FC = () => {
  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-text selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-10 text-white/80 leading-relaxed font-sans pb-16">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
            LABORATORY SESSION USER GUIDE
          </h2>
          <p className="text-sm text-cyan-400 mt-2 font-mono uppercase tracking-wider">
            Step-by-Step Instructions for Performing Thermodynamics Experiments
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            1. Getting Started
          </h3>
          <p>
            Welcome to the Thermal Expansion Lab. This module is split into three interactive zones:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-white/60 font-mono">
            <li><strong>Simulation Canvas:</strong> Macroscopic render of the test piece alongside a real-time microscopic lattice atomic vibration zoom-in.</li>
            <li><strong>Controls & Telemetry:</strong> Burners and cold quench presets to modulate temperature targets, switch materials, and select constraint types.</li>
            <li><strong>Analytics & Graph Engine:</strong> Interactive plotting of state coordinates, regression slopes, logs console, and CSV downloaders.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            2. Guided Experiments
          </h3>

          <div className="space-y-6">
            
            {/* Experiment 1 */}
            <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Experiment A: Bimetallic Switch Calibration
              </span>
              <p className="text-xs text-white/60 leading-relaxed">
                A bimetallic composite bends due to expansion mismatches. Calibration is crucial for thermal switches in household thermostats and oven circuit breakers.
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-[11px] font-mono text-white/40">
                <li>Under <strong>Experiment Mode</strong>, select <strong>5. Bimetallic Strip Bending</strong>.</li>
                <li>Set Top Alloy to <strong>Copper</strong> and Bottom Alloy to <strong>Steel</strong>.</li>
                <li>Slowly raise the Temperature Target to <strong>650 K</strong>. Note the deflection upwards.</li>
                <li>Switch the alloys (Top: Steel, Bottom: Copper). Observe how the direction of curvature flips.</li>
              </ol>
            </div>

            {/* Experiment 2 */}
            <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Experiment B: Thermal Shock limits of Brittle Materials
              </span>
              <p className="text-xs text-white/60 leading-relaxed">
                Brittle materials like standard soda glass or concrete have high Young&apos;s Moduli but extremely low tensile yield strengths. Rapid cooling or heating creates high local thermal gradients, triggering immediate fractures.
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-[11px] font-mono text-white/40">
                <li>Activate <strong>6. Thermal Shock Test</strong> mode. The target temperature begins at a hot oven state of <strong>800 K</strong>.</li>
                <li>In the control panel, click the <strong>Liquid Nitrogen Quench (77K)</strong> shock trigger.</li>
                <li>Observe the canvas. Since borosilicate glass has low thermal conductivity, a massive local stress spike immediately exceeds the yield limit, causing fracture cracks to propagate through the structure.</li>
              </ol>
            </div>

            {/* Experiment 3 */}
            <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Experiment C: Bridge Joint Gap Calibration
              </span>
              <p className="text-xs text-white/60 leading-relaxed">
                Civil engineers place expansion joints on bridges and railway track sleepers. If the joints are too narrow, extreme hot summer heat closes the gaps, building massive compressive stresses that warp the steel rail lines or crack the concrete decks.
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-[11px] font-mono text-white/40">
                <li>Select <strong>3. Bridge Joint Expansion</strong>. Note the gap indicator on the right roller support.</li>
                <li>Gradually slide the Target Temperature burner up. Watch the concrete deck expand and the gap close.</li>
                <li>Observe the telemetry log. If the temperature exceeds 400 K, the gap fully closes. Further heating triggers buckling deformation.</li>
              </ol>
            </div>

          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-400" />
            3. Exporting Datasets
          </h3>
          <p>
            You can export the simulated state path history (length, expansion, stress, energy coordinates) to a standard CSV spreadsheet file by clicking the <strong>Download CSV</strong> icon in the header of the Graph Engine. To save the exact graph curve image frame, click the <strong>Grid</strong> export icon.
          </p>
        </section>

      </div>
    </div>
  );
};

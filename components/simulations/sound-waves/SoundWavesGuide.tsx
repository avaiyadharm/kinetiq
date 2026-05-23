"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, Play, CheckCircle } from "lucide-react";

export const SoundWavesGuide: React.FC = () => {
  const [activeExp, setActiveExp] = useState<number>(1);

  const experiments = [
    {
      id: 1,
      title: "Resonance Modes in Air Columns",
      objective: "Measure standing wave configurations inside open and closed tubes to determine harmonic wavelengths.",
      steps: [
        "Select the 'Air Column Resonance' regime from the Laboratory Mode panel.",
        "Toggle Pipe End Conditions to 'Open-Open' and observe the particle movement and pressure envelope (solid cyan line).",
        "Note the locations of pressure nodes (zero variation) and displacement nodes (zero displacement - dashed purple line). Verify that pressure nodes correspond to displacement antinodes.",
        "Increase the harmonic parameter 'n' to 2 and 3. Verify that the frequency increases matching f_n = n·c / 2L."
      ],
      questions: [
        "For the Open-Closed tube configuration, why are only odd harmonics (n = 1, 3, 5...) mathematically allowed?",
        "If you increase the length of the pipe L, what happens to the natural resonance frequencies? Explain using the wavelength relation."
      ]
    },
    {
      id: 2,
      title: "Supersonic Motion & Mach Shockwaves",
      objective: "Investigate wave compression in moving sources and measure Mach cone angles.",
      steps: [
        "Select the 'Doppler Shift Simulator' regime from the Laboratory Mode panel.",
        "Set the Source Velocity (vs) to 150 m/s (subsonic). Watch the wavefronts compress in front of the source and expand behind it.",
        "Increase vs to 343 m/s (sonic threshold). Note the accumulation of wavefronts at the leading edge.",
        "Increase vs to 450 m/s (supersonic). Observe the V-shaped Mach shockwave envelope forming."
      ],
      questions: [
        "Using vs = 450 m/s and speed of sound c = 343 m/s, calculate the theoretical Mach angle: θ = sin⁻¹(c / vs). Verify if it matches the angle drawn on the canvas.",
        "What physical sensation does an observer experience when a supersonic aircraft's Mach cone passes them? (Hint: Sonic Boom)."
      ]
    },
    {
      id: 3,
      title: "Architectural Acoustics & Reverberation Time",
      objective: "Measure the energy decay curve in a closed room and validate Sabine's reverberation equation.",
      steps: [
        "Select the 'Sabine Room Acoustics' regime from the Laboratory Mode panel.",
        "Note the orange ray path trails bouncing off the room walls. Each collision loses energy based on the Wall Absorption (α).",
        "Set Wall Absorption to 0.10 (reflective room) and look at the bottom-right energy decay graph. Measure how long it takes for the energy to diminish.",
        "Increase Wall Absorption to 0.40 (damped room). Observe how much faster the rays fade and how the decay slope steepens."
      ],
      questions: [
        "Use Sabine's equation T₆₀ = 0.161·V / A to compute the expected decay time. How does this compare with the simulated decay curve?",
        "If you double the room width and height, what happens to the reverberation time? Why?"
      ]
    },
    {
      id: 4,
      title: "Impedance Mismatch and Wave Reflection",
      objective: "Study how waves interact at the interface between different acoustic mediums.",
      steps: [
        "Select the 'Boundary Impedance Mismatch' regime from the Laboratory Mode panel.",
        "Adjust the Medium 2 Impedance Ratio slider. Note that the boundary is located in the center of the canvas.",
        "Set the Impedance Ratio to 3.0x Z₁ (transitioning to a rigid boundary). Note that the reflected wave is in-phase (reflects right-side up).",
        "Set the Impedance Ratio to 0.3x Z₁ (transitioning to a soft boundary). Observe the phase inversion of the reflected wave (reflects upside down)."
      ],
      questions: [
        "Calculate the reflection coefficient R for Z₂ = 3·Z₁. Does a positive reflection coefficient indicate in-phase or out-of-phase reflection?",
        "Why is it difficult for sound to transmit from air into water? Compare their densities and speeds of sound to explain this impedance mismatch."
      ]
    }
  ];

  const currentExp = experiments.find(e => e.id === activeExp) || experiments[0];

  return (
    <div className="flex-1 p-8 bg-[#18181b] overflow-y-auto text-white space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-2">
          <HelpCircle className="w-5 h-5" /> Guided Acoustics Experiments
        </h2>
        <p className="text-xs text-white/50 mt-1">Select an assignment to run in the simulator. Follow the procedures and answer the analysis questions.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Experiment Navigation List */}
        <div className="w-full lg:w-[280px] space-y-2 shrink-0">
          {experiments.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setActiveExp(exp.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3",
                activeExp === exp.id
                  ? "bg-primary/10 border-primary text-white"
                  : "bg-black/20 border-white/5 text-white/55 hover:border-white/10 hover:text-white"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                activeExp === exp.id ? "bg-primary text-white" : "bg-white/5 text-white/40"
              )}>
                {exp.id}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider block">Experiment {exp.id}</span>
                <span className="text-[11px] leading-snug block">{exp.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Experiment Active Details */}
        <div className="flex-1 bg-black/20 border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Active Laboratory Assignment</span>
            <h3 className="text-lg font-bold font-display uppercase text-white">{currentExp.title}</h3>
            <p className="text-xs text-white/60 leading-relaxed italic">
              <strong>Objective:</strong> {currentExp.objective}
            </p>
          </div>

          {/* Procedure steps */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current" /> Procedure Steps
            </h4>
            <ol className="space-y-3 pl-4 list-decimal text-xs text-white/80 leading-relaxed">
              {currentExp.steps.map((step, idx) => (
                <li key={idx} className="pl-1">{step}</li>
              ))}
            </ol>
          </div>

          {/* Analysis Questions */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" /> Lab Report Analysis Questions
            </h4>
            <ul className="space-y-3 pl-4 list-disc text-xs text-white/70 leading-relaxed">
              {currentExp.questions.map((question, idx) => (
                <li key={idx} className="pl-1">{question}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

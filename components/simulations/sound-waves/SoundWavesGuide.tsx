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
      objective: "Measure standing wave configurations inside open and closed tubes to determine harmonic wavelengths and verify node/antinode positions.",
      steps: [
        "Select the 'Air Column Resonance' regime from the Laboratory Mode panel.",
        "Toggle Pipe End Conditions to 'Open-Open' and observe the particle movement and pressure envelope (solid cyan line labeled p(x,t)).",
        "Identify the locations of pressure nodes (marked 'N' above the tube) and displacement nodes (marked 'N' below the tube). Verify that each pressure node corresponds to a displacement antinode, and vice versa.",
        "Check the dashed purple line (\u03BE(x,t)). Confirm visually that it is shifted 90\u00B0 from the cyan pressure curve \u2014 they should never peak at the same position.",
        "Increase the harmonic parameter 'n' to 2 and 3. Verify that the frequency displayed at the bottom matches f_n = n\u00B7c/(2L).",
        "Switch to 'Open-Closed' pipe. Confirm: pressure node at the open end (x=0), pressure antinode at the closed end (x=L). Only odd harmonics n=1,3,5 should be available."
      ],
      questions: [
        "For the Open-Closed tube, compute f\u2081 = c/(4L) for L = 1.5m and c = 343 m/s. Does the simulation match? (Expected: \u224857.2 Hz)",
        "Why are only odd harmonics allowed in the open-closed configuration? Hint: consider what constraint the closed wall places on the displacement field.",
        "If you change the medium to Helium (c = 972 m/s), how do the resonance frequencies change? Predict before switching, then verify."
      ]
    },
    {
      id: 2,
      title: "Supersonic Motion & Mach Shockwaves",
      objective: "Investigate wave compression in moving sources, measure Doppler frequency shifts, and derive Mach cone angles.",
      steps: [
        "Select the 'Doppler Shift Simulator' regime from the Laboratory Mode panel.",
        "Set the Source Velocity (vs) to 150 m/s (subsonic). Watch the wavefronts compress in front of the source and expand behind it.",
        "Read the f_approach and f_recede values displayed on the canvas. Verify them against f' = f\u00B7c/(c \u00B1 vs).",
        "Increase vs to 343 m/s (sonic threshold). Note the accumulation of wavefronts at the leading edge.",
        "Increase vs to 450 m/s (supersonic). Observe the V-shaped Mach shockwave cone and the angle annotation."
      ],
      questions: [
        "Using vs = 450 m/s and c = 343 m/s, calculate the Mach number M = vs/c and theoretical Mach angle: \u03B8 = sin\u207B\u00B9(c/vs) = sin\u207B\u00B9(343/450). Does the canvas annotation match?",
        "At vs = 200 m/s, compute f_approach and f_recede for f = 340 Hz. Show your work using f' = f\u00B7c/(c - vs) and f' = f\u00B7c/(c + vs).",
        "What physical sensation does an observer experience when a supersonic aircraft's Mach cone passes them? (Hint: Sonic Boom)."
      ]
    },
    {
      id: 3,
      title: "Architectural Acoustics & Reverberation Time",
      objective: "Measure the energy decay curve in a closed room and validate Sabine's reverberation equation T\u2086\u2080 = 0.161V/A.",
      steps: [
        "Select the 'Sabine Room Acoustics' regime from the Laboratory Mode panel.",
        "Note the orange ray path trails bouncing off the room walls. Each collision loses energy based on the Wall Absorption (\u03B1).",
        "Set Wall Absorption to 0.10 (reflective room) and look at the bottom-right energy decay graph. Note how slowly the energy decays.",
        "Increase Wall Absorption to 0.40 (damped room). Observe how much faster the rays fade and how the decay slope steepens.",
        "Record the T\u2086\u2080 value displayed on the canvas. Compare it with your manual calculation."
      ],
      questions: [
        "For a room of 10m \u00D7 6m \u00D7 3m (ceiling) with \u03B1 = 0.15, compute: V = 180 m\u00B3, total surface area S = 2(10\u00B76 + 10\u00B73 + 6\u00B73) = 216 m\u00B2, A = S\u00B7\u03B1 = 32.4 Sabines. T\u2086\u2080 = 0.161 \u00D7 180 / 32.4 = 0.894 s. Does the simulator agree?",
        "If you double the room width (20m), what happens to T\u2086\u2080? Predict the change, then verify. Why does a larger room reverberate longer?",
        "What absorption coefficient would you need to achieve T\u2086\u2080 < 0.5 s in this room? Calculate and verify."
      ]
    },
    {
      id: 4,
      title: "Impedance Mismatch and Wave Reflection",
      objective: "Study how waves interact at the interface between different acoustic mediums and verify the reflection/transmission coefficient formulas.",
      steps: [
        "Select the 'Boundary Impedance Mismatch' regime from the Laboratory Mode panel.",
        "Note the R and T coefficient values displayed near the boundary line on the canvas.",
        "Set the Impedance Ratio to 3.0x Z\u2081 (rigid boundary). Note that R > 0: the reflected wave is in-phase with the incident.",
        "Set the Impedance Ratio to 0.3x Z\u2081 (soft boundary). Note that R < 0: the reflected wave has a 180\u00B0 phase inversion.",
        "Verify the energy conservation check displayed on the canvas: R\u00B2 + (Z\u2081/Z\u2082)\u00B7T\u00B2 should equal 1.0000."
      ],
      questions: [
        "Calculate R and T for Z\u2082 = 3\u00B7Z\u2081: R = (3-1)/(3+1) = 0.5, T = 2\u00B73/(3+1) = 1.5. Does R\u00B2 + (1/3)T\u00B2 = 0.25 + 0.75 = 1? Verify on the canvas.",
        "The air-water interface has Z_air \u2248 412 Rayls and Z_water \u2248 1.48\u00D710\u2076 Rayls. Calculate R. Why is it so close to 1.0? What fraction of sound energy is transmitted?",
        "What impedance ratio would produce zero reflection (perfect transmission)? What physical situation does this correspond to?"
      ]
    },
    {
      id: 5,
      title: "Energy Transport & Intensity Measurement",
      objective: "Visualize acoustic energy flow using intensity vectors I(x,t) = p\u00B7v and verify energy density calculations.",
      steps: [
        "Select the 'Longitudinal Propagation' regime and choose 'Acoustic Energy Flow' as the Visualization Mode.",
        "Observe the amber arrow field. For a progressive wave traveling to the right, all arrows should point rightward when I > 0.",
        "Note that the intensity arrows oscillate: they point right during the compressive half-cycle (p > 0, v > 0) and reverse during the rarefactive half.",
        "Check the telemetry sidebar: the time-averaged intensity I = p\u00B2\u2098\u2099\u2098/(Z) should match the Energy Density display multiplied by the speed of sound: I = u\u00B7c.",
        "Increase the source amplitude (p\u2080) and observe that the intensity scales with the square of amplitude: I \u221D p\u2080\u00B2."
      ],
      questions: [
        "For p\u2080 = 2 Pa in air (Z = 412 Rayls), compute the peak intensity: I_peak = p\u2080\u00B2/Z = 4/412 \u2248 9.7 mW/m\u00B2. Does the telemetry value agree?",
        "The energy density has two components: potential u_p = p\u00B2/(2B) and kinetic u_k = \u00BD\u03C1v\u00B2. For a progressive wave, verify that u_p = u_k (equipartition of acoustic energy).",
        "Switch to the 'Particle Velocity Vectors' mode. Note that velocity v is in-phase with pressure p for a progressive wave. Why is this different from a standing wave, where v and p are 90\u00B0 out of phase?"
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

"use client";

import React from "react";
import { BookOpen, Sliders, Activity, Target, ShieldAlert, GitMerge } from "lucide-react";

export const HeatTransferGuide: React.FC = () => {
  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 bg-[#18181b] overflow-y-auto text-white">
      <div className="max-w-[1000px] mx-auto w-full space-y-8 animate-fadeIn pb-24">
        {/* Header */}
        <div className="border-b border-white/5 pb-8">
          <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-teal-500" /> Operational Manual & Best Practices
          </h2>
          <p className="text-sm text-white/50 mt-3 leading-relaxed">
            Comprehensive documentation for domain initialization, numerical stability constraints, and diagnostic post-processing within the 2D Heat Conduction Engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Domain Initialization */}
          <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-teal-400 font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-4">
              <Target className="w-5 h-5" /> Domain Initialization & Constraint Specification
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              The spatial canvas operates as a discretized numerical grid. Boundary conditions (BCs) and material properties are enforced via interactive domain specification.
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
              <li><strong>Dirichlet Constraints:</strong> Utilize the Thermal Source / Sink tools to impose fixed-temperature constraints. These nodes act as infinite thermal reservoirs.</li>
              <li><strong>Material Assignment:</strong> Paint spatially varying thermal conductivities (k) onto the domain to create heterogeneous transport environments.</li>
              <li><strong>Constraint Removal:</strong> The Eraser tool unbinds Dirichlet constraints, reverting the node to standard transient computation.</li>
              <li><strong>Spatial Resolution:</strong> Adjust the structural interaction radius via the system Configuration panel to dictate the footprint of applied constraints.</li>
            </ul>
          </div>

          {/* Benchmark Scenarios */}
          <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400 font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-4">
              <Sliders className="w-5 h-5" /> Pre-Configured Benchmark Scenarios
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Standardized Initial Value Problems (IVPs) are provided to quickly verify distinct transport phenomena and geometric configurations.
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
              <li><strong>CPU Heatsink:</strong> Evaluates forced convective cooling coupled with high-conductivity fin arrays.</li>
              <li><strong>Thermal Bridge:</strong> Demonstrates interfacial flux transmission between heterogeneous boundaries.</li>
              <li><strong>Corner Heating:</strong> Verifies diagonal propagation of thermal wave fronts across an isotropic medium.</li>
              <li><strong>Insulated Chamber:</strong> Highlights the adiabatic blocking behavior of ultra-low conductivity barriers.</li>
            </ul>
          </div>
        </div>

        {/* Diagnostics */}
        <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl">
          <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest font-display border-b border-white/5 pb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Diagnostic & Post-Processing Suite
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
              <strong className="text-white text-xs uppercase tracking-wider block font-display text-emerald-400">Centerline Spatial Gradients</strong>
              <p className="text-sm text-white/60 leading-relaxed">
                The interactive slice plane allows extraction of 1D temperature profiles. This diagnostic is critical for verifying linear gradients in steady-state 1D conduction.
              </p>
            </div>

            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
              <strong className="text-white text-xs uppercase tracking-wider block font-display text-indigo-400">Fourier Flux Vector Fields</strong>
              <p className="text-sm text-white/60 leading-relaxed">
                Visualizes the vector field defined by Fourier&apos;s Law (q = -k∇T). The magnitude and orientation of the vectors provide direct insight into localized transport efficiency.
              </p>
            </div>

            <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
              <strong className="text-white text-xs uppercase tracking-wider block font-display text-rose-400">Asymptotic Steady-State Relaxation</strong>
              <p className="text-sm text-white/60 leading-relaxed">
                Replaces the transient Crank-Nicolson engine with a Gauss-Seidel elliptic solver, rapidly converging the domain to its steady-state harmonic limit (∇²T = 0).
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Numerical Practices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Numerical Stability Guidelines
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              While the Alternating Direction Implicit (ADI) formulation is unconditionally stable, massive timesteps or ultra-fine grid spacings can induce unphysical oscillation due to extreme Fourier Numbers (Fo).
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
              <li>Monitor the <strong>Fourier Number (Fo)</strong> in the Telemetry pane. For optimal temporal accuracy, aim for Fo ≈ 1.</li>
              <li>Exceedingly large Fourier Numbers will cause the ADI solver to heavily dampen transients, masking high-frequency temporal dynamics.</li>
              <li>Decrease the timestep when assessing rapid shock-like heating events to minimize temporal truncation error.</li>
            </ul>
          </div>

          <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
              <GitMerge className="w-4 h-4 text-cyan-400" /> Material Interface Continuity
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              The engine utilizes conservative flux formulation at grid cell boundaries. When a steep gradient in thermal conductivity (k) exists between adjacent nodes (e.g., Copper bordering Air):
            </p>
            <ul className="list-disc pl-5 text-sm text-white/60 space-y-2">
              <li>The solver implicitly computes the <strong>harmonic mean</strong> of the interface conductivities to guarantee strict conservation of thermal energy.</li>
              <li>This prevents artificial accumulation of heat at material discontinuities.</li>
              <li>The Energy Inflow/Outflow telemetry rigorously validates this conservative behavior globally.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

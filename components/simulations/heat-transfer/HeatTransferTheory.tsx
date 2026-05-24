"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, HelpCircle, GraduationCap } from "lucide-react";

export const HeatTransferTheory: React.FC = () => {
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  return (
    <div className="flex-1 p-8 bg-[#18181b] overflow-y-auto text-white">
      <div className="max-w-4xl mx-auto w-full space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-widest text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Theoretical Basis & Thermal Dynamics
            </h2>
            <p className="text-xs text-white/50 mt-1">Explore the governing equations and numerical solvers behind heat conduction.</p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {[
              { id: "beginner", label: "Beginner", icon: HelpCircle },
              { id: "intermediate", label: "Intermediate", icon: BookOpen },
              { id: "advanced", label: "Advanced", icon: GraduationCap },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setLevel(item.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    level === item.id 
                      ? "bg-primary text-white shadow-lg" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Beginner Mode */}
        {level === "beginner" && (
          <div className="space-y-6 w-full animate-fadeIn">
            <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
              <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">What is Heat Transfer?</h3>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                At the microscopic level, temperature represents the average kinetic energy of vibrating atoms and molecules. Heat is the thermal energy transferred between systems due to a temperature difference. Heat naturally flows from regions of hot temperatures (faster atomic vibrations) to cold temperatures (slower vibrations).
              </p>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                There are three fundamental mechanisms of heat transfer:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">1. Conduction</span>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Direct transfer of energy between adjacent atoms through collisions. This is the dominant mode in solids. Metals are excellent conductors because free electrons help carry energy.
                  </p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">2. Convection</span>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Transfer of heat by the physical movement of a fluid (liquid or gas). Warm fluid expands, becomes less dense, rises, and is replaced by cooler fluid, creating convection currents.
                  </p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-2">3. Radiation</span>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Transfer of energy via electromagnetic waves (primarily infrared light). Unlike conduction and convection, radiation requires no physical medium and can travel through a vacuum.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
              <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider font-display">Understanding the 2D Grid Simulation</h3>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                This simulation models 2D Thermal Conduction through a flat sheet of material. By drawing on the grid, you can construct custom experiments:
              </p>
              <div className="space-y-3 text-xs text-white/70">
                <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-400 block">Heat Sources (Red Brush)</strong>
                    Places a fixed-temperature hot node (e.g. 100°C). Heat will flow outward from this region into surrounding cooler cells.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-400 block">Cold Sinks (Blue Brush)</strong>
                    Places a fixed-temperature cold node (e.g. 0°C). These act as thermal drains, absorbing heat and maintaining their low temperature.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-400 block">Conductivity Paint (Material Brush)</strong>
                    Allows you to draw structures with different conductivities: Copper (very fast diffusion), Iron (intermediate), Wood/Insulator (very slow), or Vacuum (zero heat transfer).
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
              <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider font-display">Thermal Equilibrium</h3>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                If you leave the simulation running, heat will diffuse until the system reaches a steady-state (equilibrium). In this state, the temperature at each point no longer changes over time because the heat entering any sub-region is exactly equal to the heat leaving it.
              </p>
            </div>
          </div>
        )}

        {/* Intermediate Mode */}
        {level === "intermediate" && (
          <div className="space-y-6 w-full animate-fadeIn">
            <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
              <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">Fourier's Law & The Heat Equation</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                The physics of thermal conduction is governed by two physical laws:
              </p>
              <div className="space-y-4 pt-2">
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-widest block font-display">1. Fourier's Law of Heat Conduction</span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    The local heat flux density vector q (amount of thermal energy flowing per unit area per unit time, measured in W/m²) is proportional to the negative temperature gradient:
                  </p>
                  <div className="font-mono text-xs text-teal-300 text-center py-2 bg-black/50 rounded-xl">
                    q = -k · ∇T
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Where k is the material's thermal conductivity (W/(m·K)). The negative sign shows that heat flows down the temperature gradient (from hot to cold).
                  </p>
                </div>

                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-widest block font-display">2. Conservation of Energy</span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    By stating that the rate of thermal energy storage in an infinitesimal volume must equal the net heat flow in, we obtain the Heat Diffusion Equation:
                  </p>
                  <div className="font-mono text-xs text-teal-300 text-center py-2 bg-black/50 rounded-xl">
                    ρ · c_p · ∂T/∂t = ∇ · (k · ∇T)
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Where ρ is the material density (kg/m³) and c_p is the specific heat capacity (J/(kg·K)). For a uniform medium where conductivity k is constant, this simplifies to:
                  </p>
                  <div className="font-mono text-xs text-teal-300 text-center py-2 bg-black/50 rounded-xl">
                    ∂T/∂t = α · ∇²T
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Where α = k / (ρ · c_p) is the thermal diffusivity (m²/s). Diffusivity measures how fast a material responds to thermal changes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
              <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wider font-display">Boundary Conditions</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                The evolution and final state of temperature profiles depend entirely on the boundaries of the grid:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <strong className="text-rose-400 block font-display">Fixed Temperature (Dirichlet)</strong>
                  <p className="text-white/60">
                    The boundary is held at a constant temperature (e.g. connected to a reservoir).
                    T(boundary) = T_fixed
                  </p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <strong className="text-amber-400 block font-display">Insulated / Zero-Flux (Neumann)</strong>
                  <p className="text-white/60">
                    No heat can cross the boundary. Mathematically, the normal gradient is zero:
                    ∂T/∂n = 0
                  </p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-1">
                  <strong className="text-cyan-400 block font-display">Convective Cooling (Mixed/Robin)</strong>
                  <p className="text-white/60">
                    Heat is lost to surrounding air at temperature T_amb proportional to heat transfer coefficient h:
                    -k · ∂T/∂n = h · (T - T_amb)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Mode */}
        {level === "advanced" && (
          <div className="space-y-6 w-full animate-fadeIn">
            <div className="bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
              <h3 className="text-base font-bold text-teal-400 uppercase tracking-wider">Numerical Discretization</h3>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                Since analytical solutions to the heat equation only exist for simple geometries, we solve the partial differential equation (PDE) numerically on a grid with spacing Δx = Δy.
              </p>

              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block font-display">1. Transient Solver: FTCS Explicit Scheme</span>
                <p className="text-xs text-white/70 leading-relaxed">
                  We approximate the time derivative with a forward difference, and the spatial laplacian with a central second difference:
                </p>
                <div className="font-mono text-xs text-cyan-300 bg-black/50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
{`T_ij^(n+1) = T_ij^n + Δt · [ (α_R · (T_i+1,j - T_ij) - α_L · (T_ij - T_i-1,j)) / Δx² 
                 + (α_T · (T_i,j+1 - T_ij) - α_B · (T_ij - T_i,j-1)) / Δy² ]`}
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Here, the thermal conductivities are averaged at cell faces (e.g. α_R = (α_i,j + α_i+1,j)/2) to correctly conserve heat energy across interfaces between different materials.
                </p>
              </div>

              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block font-display">2. Stability & The Courant Criterion</span>
                <p className="text-xs text-white/70 leading-relaxed">
                  The explicit Forward-Time Central-Space (FTCS) scheme is conditionally stable. Applying von Neumann stability analysis, we discover that if the time step Δt is too large, round-off errors grow exponentially, leading to numerical divergence (blow-up). The stability limit is:
                </p>
                <div className="font-mono text-xs text-amber-300 text-center py-2 bg-black/50 rounded-xl">
                  r = α · Δt / Δx² ≤ 0.25  (in 2D)
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Our simulation core automatically computes the maximum stable timestep Δt_max = Δx² / (4 · α_max) and restricts the simulator speed to guarantee stability.
                </p>
              </div>

              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block font-display">3. Steady-State Solver: Gauss-Seidel Iteration</span>
                <p className="text-xs text-white/70 leading-relaxed">
                  To find the equilibrium state directly without waiting for slow transient diffusion, we solve the elliptic Laplace equation ∇ · (α · ∇T) = 0. Discretizing this gives an algebraic system where the temperature at each cell is the weighted average of its neighbors:
                </p>
                <div className="font-mono text-xs text-rose-300 bg-black/50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
{`T_ij^(k+1) = [ α_R·T_i+1,j + α_L·T_i-1,j + α_T·T_i,j+1 + α_B·T_i,j-1 ] / (α_R + α_L + α_T + α_B)`}
                </div>
                <p className="text-xs text-white/70 leading-relaxed font-sans">
                  We use Gauss-Seidel relaxation (updating values in-place so newer values are used immediately) to accelerate convergence.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

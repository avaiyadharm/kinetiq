"use client";

import React from "react";

interface KineticEnergyAnalyticsProps {
  subMode: string;
  
  // Translational
  transMass: number;
  transVelocity: number;

  // Rotational
  rotShape: "ring" | "disk" | "sphere" | "rod";
  rotMass: number;
  rotRadius: number;
  rotOmega: number;

  // Relativistic
  relMass: number;
  relBeta: number;

  // Thermal
  thermalTemp: number;
  thermalGas: "He" | "Ar" | "Xe";

  // Quantum
  quantumN: number;
  wellWidth: number;
  quantumParticle: "electron" | "proton";
}

export const KineticEnergyAnalytics: React.FC<Readonly<KineticEnergyAnalyticsProps>> = ({
  subMode,
  transMass,
  transVelocity,
  rotShape,
  rotMass,
  rotRadius,
  rotOmega,
  relMass,
  relBeta,
  thermalTemp,
  thermalGas,
  quantumN,
  wellWidth,
  quantumParticle,
}) => {
  // 1. Translational: Parabolic KE vs Velocity
  const renderTranslationalChart = () => {
    const width = 500;
    const height = 240;
    const padding = 40;

    const points: string[] = [];
    const maxV = 35.0;
    const currentKE = 0.5 * transMass * transVelocity * transVelocity;
    const maxKE = 0.5 * transMass * maxV * maxV;

    // Draw curve
    for (let v = 0; v <= maxV; v += 1) {
      const ke = 0.5 * transMass * v * v;
      const x = padding + (v / maxV) * (width - padding * 2);
      const y = height - padding - (ke / maxKE) * (height - padding * 2);
      points.push(`${x},${y}`);
    }

    // Current point coordinates
    const curX = padding + (Math.abs(transVelocity) / maxV) * (width - padding * 2);
    const curY = height - padding - (currentKE / maxKE) * (height - padding * 2);

    return (
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display uppercase">Energy Profile: KE vs Velocity</h4>
          <p className="text-xs text-white/40">Shows quadratic scaling relationship: $KE \propto v^2$.</p>
        </div>
        <div className="flex justify-center">
          <svg width={width} height={height} className="overflow-visible font-mono text-[9px] fill-zinc-400">
            {/* Grid Lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            
            {/* Parabolic path */}
            <polyline points={points.join(" ")} fill="none" stroke="#06b6d4" strokeWidth={3} strokeLinecap="round" />
            
            {/* Current point indicator */}
            {curX >= padding && curX <= width - padding && (
              <>
                <line x1={curX} y1={height - padding} x2={curX} y2={curY} stroke="rgba(16,185,129,0.3)" strokeDasharray="3,3" />
                <line x1={padding} y1={curY} x2={curX} y2={curY} stroke="rgba(16,185,129,0.3)" strokeDasharray="3,3" />
                <circle cx={curX} cy={curY} r={6} fill="#10b981" className="animate-pulse" />
                <circle cx={curX} cy={curY} r={3} fill="#fff" />
              </>
            )}

            {/* Labels */}
            <text x={width / 2} y={height - 8} textAnchor="middle">Velocity (m/s)</text>
            <text x={10} y={height / 2} transform={`rotate(-90 10 ${height / 2})`} textAnchor="middle">Kinetic Energy (J)</text>

            <text x={padding} y={height - padding + 15} textAnchor="middle">0</text>
            <text x={width - padding} y={height - padding + 15} textAnchor="middle">{maxV}</text>
            <text x={padding - 10} y={height - padding} textAnchor="end">0 J</text>
            <text x={padding - 10} y={padding + 5} textAnchor="end">{maxKE.toFixed(0)} J</text>

            {/* Floating label */}
            <text x={curX + 10} y={curY - 10} className="fill-emerald-400 font-bold">
              {currentKE.toFixed(1)} J
            </text>
          </svg>
        </div>
      </div>
    );
  };

  // 2. Rotational: Moment of Inertia Coefficient Comparison
  const renderRotationalChart = () => {
    const shapes = [
      { name: "Ring", coef: 1.0, color: "#f43f5e" },
      { name: "Disk", coef: 0.5, color: "#3b82f6" },
      { name: "Sphere", coef: 0.4, color: "#10b981" },
      { name: "Rod", coef: 0.083, color: "#eab308" }
    ];

    const currentI = (() => {
      switch (rotShape) {
        case "ring": return rotMass * rotRadius * rotRadius;
        case "disk": return 0.5 * rotMass * rotRadius * rotRadius;
        case "sphere": return 0.4 * rotMass * rotRadius * rotRadius;
        case "rod": return (1/12) * rotMass * rotRadius * rotRadius;
      }
    })();

    const currentKE = 0.5 * currentI * rotOmega * rotOmega;

    return (
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display uppercase">Moment of Inertia Coefficients ($I/MR^2$)</h4>
          <p className="text-xs text-white/40">Compares rotational resistance factor based on shape geometry.</p>
        </div>
        
        <div className="space-y-4">
          {shapes.map((s) => {
            const isCurrent = rotShape === s.name.toLowerCase();
            const shapeI = s.coef * rotMass * rotRadius * rotRadius;
            const shapeKE = 0.5 * shapeI * rotOmega * rotOmega;

            return (
              <div key={s.name} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className={isCurrent ? "font-bold text-cyan-400" : "text-white/60"}>
                    {s.name} {isCurrent && "← Selected"}
                  </span>
                  <span className="text-white/30">
                    Coeff: {s.coef.toFixed(3)} | I: {shapeI.toFixed(2)} kg·m²
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${s.coef * 100}%`,
                        backgroundColor: s.color,
                        opacity: isCurrent ? 1 : 0.4
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono w-16 text-right">
                    {shapeKE.toFixed(1)} J
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 text-[10px] text-zinc-400 font-mono">
          <strong>Selected Rotor Status:</strong> Total Inertia = <span className="text-cyan-400 font-bold">{currentI.toFixed(3)} kg·m²</span> at speed <span className="text-cyan-400 font-bold">{rotOmega.toFixed(1)} rad/s</span> yielding energy <span className="text-emerald-400 font-bold">{currentKE.toFixed(1)} Joules</span>.
        </div>
      </div>
    );
  };

  // 3. Relativistic: Divergence curves Classical vs Relativistic
  const renderRelativisticChart = () => {
    const width = 500;
    const height = 240;
    const padding = 45;

    // We plot Beta v/c on X-axis from 0 to 0.99
    // Y-axis is Kinetic Energy in units of rest mass energy m*c^2
    // Classical: KE = 0.5 * mc^2 * beta^2
    // Relativistic: KE = (gamma - 1) * mc^2
    const maxBeta = 0.95;
    const maxKEVal = 2.5; // in units of rest energy

    const classPoints: string[] = [];
    const relPoints: string[] = [];

    for (let b = 0; b <= maxBeta; b += 0.02) {
      const gamma = 1 / Math.sqrt(1 - b * b);
      const keRel = gamma - 1;
      const keClass = 0.5 * b * b;

      const x = padding + (b / maxBeta) * (width - padding * 2);
      const classY = height - padding - (keClass / maxKEVal) * (height - padding * 2);
      // Clamp Y to prevent drawing off canvas top
      const relY = Math.max(padding - 10, height - padding - (keRel / maxKEVal) * (height - padding * 2));

      classPoints.push(`${x},${classY}`);
      relPoints.push(`${x},${relY}`);
    }

    // Current pointer
    const curX = padding + (relBeta / maxBeta) * (width - padding * 2);
    const curGamma = 1 / Math.sqrt(1 - relBeta * relBeta);
    const curRelKE = curGamma - 1;
    const curClassKE = 0.5 * relBeta * relBeta;

    const curRelY = height - padding - (curRelKE / maxKEVal) * (height - padding * 2);
    const curClassY = height - padding - (curClassKE / maxKEVal) * (height - padding * 2);

    return (
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display uppercase">Relativistic Divergence</h4>
          <p className="text-xs text-white/40">Compares Classical Newtonian energy (dashed) to Einstein&apos;s Relativistic integration (solid).</p>
        </div>
        <div className="flex justify-center">
          <svg width={width} height={height} className="overflow-visible font-mono text-[9px] fill-zinc-400">
            {/* Axis Lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />

            {/* Classical curve (parabolic dashed) */}
            <polyline points={classPoints.join(" ")} fill="none" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3,3" />

            {/* Relativistic curve (asymptotic solid cyan) */}
            <polyline points={relPoints.join(" ")} fill="none" stroke="#06b6d4" strokeWidth={3} />

            {/* RelBeta Marker */}
            {curX >= padding && curX <= width - padding && (
              <>
                <line x1={curX} y1={height - padding} x2={curX} y2={Math.min(curRelY, curClassY)} stroke="rgba(255,255,255,0.2)" strokeDasharray="2,2" />
                {/* Relativistic point indicator */}
                {curRelY >= padding && (
                  <circle cx={curX} cy={curRelY} r={5} fill="#06b6d4" />
                )}
                {/* Classical point indicator */}
                <circle cx={curX} cy={curClassY} r={5} fill="#f43f5e" />
              </>
            )}

            {/* Labels */}
            <text x={width / 2} y={height - 8} textAnchor="middle">Velocity (v/c)</text>
            <text x={12} y={height / 2} transform={`rotate(-90 12 ${height / 2})`} textAnchor="middle">Kinetic Energy (E_k / m_0 c²)</text>

            <text x={padding} y={height - padding + 15} textAnchor="middle">0</text>
            <text x={width - padding} y={height - padding + 15} textAnchor="middle">{maxBeta}c</text>
            <text x={padding - 10} y={height - padding} textAnchor="end">0</text>
            <text x={padding - 10} y={padding + 5} textAnchor="end">{maxKEVal} E₀</text>

            {/* Floating legend text */}
            <text x={width - padding - 80} y={height - padding - 75} className="fill-cyan-400 font-bold">Relativistic</text>
            <text x={width - padding - 80} y={height - padding - 20} className="fill-rose-500 font-bold">Newtonian</text>
            
            <text x={curX} y={Math.max(padding + 10, curRelY - 12)} textAnchor="middle" className="fill-cyan-400 font-bold">
              v={relBeta.toFixed(3)}c | γ={curGamma.toFixed(2)}
            </text>
          </svg>
        </div>
      </div>
    );
  };

  // 4. Thermal: Maxwell-Boltzmann speed distribution curve
  const renderThermalChart = () => {
    const width = 500;
    const height = 240;
    const padding = 45;

    // Molecular mass factor ( Helium = 4u, Argon = 40u, Xenon = 131u )
    const molarMass = thermalGas === "He" ? 4.0 : thermalGas === "Ar" ? 40.0 : 131.0;
    
    // Scale speed bounds
    const maxSpeed = thermalGas === "He" ? 3500 : thermalGas === "Ar" ? 1200 : 600;

    // 2D Maxwell-Boltzmann distribution probability:
    // P(v) = (m / (k_B * T)) * v * exp(-m * v^2 / (2 * k_B * T))
    // Let's calculate standard curves
    const points: string[] = [];
    const step = maxSpeed / 50;

    // Calculate scaling constant based on temperature and mass
    const scaleFactor = molarMass / thermalTemp;
    let maxP = 0;

    // Find peak height to normalize Y
    for (let v = 0; v <= maxSpeed; v += step) {
      const arg = (molarMass * v * v) / (2 * thermalTemp * 100); // scaled argument
      const p = scaleFactor * v * Math.exp(-arg);
      if (p > maxP) maxP = p;
    }

    for (let v = 0; v <= maxSpeed; v += step) {
      const arg = (molarMass * v * v) / (2 * thermalTemp * 100);
      const p = scaleFactor * v * Math.exp(-arg);
      const x = padding + (v / maxSpeed) * (width - padding * 2);
      const y = height - padding - (p / maxP) * (height - padding * 2);
      points.push(`${x},${y}`);
    }

    // RMS Speed indicator
    // vRms = sqrt(3 R T / M_m). Scaled to match chart:
    const kB = 1.3806e-23;
    const NA = 6.022e23;
    const mKg = (molarMass * 1e-3) / NA;
    const vRms = Math.sqrt((3 * kB * thermalTemp) / mKg);
    
    // Visual coordinates for RMS line
    // Estimate standard visual RMS:
    const vRmsVisual = Math.sqrt((2 * thermalTemp * 100) / molarMass);
    const rmsX = padding + (vRmsVisual / maxSpeed) * (width - padding * 2);

    return (
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display uppercase">Maxwell-Boltzmann Distribution ({thermalGas})</h4>
          <p className="text-xs text-white/40">Probability density of molecular velocities. Peak shifts with temperature.</p>
        </div>
        <div className="flex justify-center">
          <svg width={width} height={height} className="overflow-visible font-mono text-[9px] fill-zinc-400">
            {/* Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />

            {/* Distribution Curve */}
            <path d={`M ${points.join(" L ")}`} fill="rgba(6,182,212,0.1)" stroke="#06b6d4" strokeWidth={2.5} />

            {/* RMS velocity marker line */}
            {rmsX >= padding && rmsX <= width - padding && (
              <>
                <line x1={rmsX} y1={padding} x2={rmsX} y2={height - padding} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4,4" />
                <circle cx={rmsX} cy={padding + 10} r={4} fill="#10b981" />
                <text x={rmsX + 6} y={padding + 14} className="fill-emerald-400 font-bold">
                  v_rms = {vRms.toFixed(0)} m/s
                </text>
              </>
            )}

            {/* Labels */}
            <text x={width / 2} y={height - 8} textAnchor="middle">Molecular Velocity (v, m/s)</text>
            <text x={12} y={height / 2} transform={`rotate(-90 12 ${height / 2})`} textAnchor="middle">Probability Density P(v)</text>

            <text x={padding} y={height - padding + 15} textAnchor="middle">0</text>
            <text x={width - padding} y={height - padding + 15} textAnchor="middle">{maxSpeed.toFixed(0)}</text>
            <text x={padding - 10} y={height - padding} textAnchor="end">0</text>
          </svg>
        </div>
      </div>
    );
  };

  // 5. Quantum: Particle in a Box Energy Ladder E_n = n^2 * E_1
  const renderQuantumChart = () => {
    const width = 500;
    const height = 240;
    const padding = 45;

    // Calculate energy factors
    const h = 6.626e-34;
    const m = quantumParticle === "electron" ? 9.109e-31 : 1.673e-27;
    const L = wellWidth * 1e-9;
    const E1_J = (h * h) / (8 * m * L * L);
    const E1_eV = E1_J * 6.242e18;

    // Render 5 ladder levels
    const levels = [1, 2, 3, 4, 5];
    const maxEnergy = 25 * E1_eV; // for n=5

    return (
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display uppercase">Quantum Energy Eigenvalues ($E_n \propto n^2$)</h4>
          <p className="text-xs text-white/40">Discrete energy rungs for a {quantumParticle} confined in a {wellWidth.toFixed(1)} nm box.</p>
        </div>
        <div className="flex justify-center">
          <svg width={width} height={height} className="overflow-visible font-mono text-[9px] fill-zinc-400">
            {/* Axis */}
            <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="rgba(255,255,255,0.15)" />
            <text x={12} y={height / 2} transform={`rotate(-90 12 ${height / 2})`} textAnchor="middle">Energy (eV)</text>

            {/* Ladder levels */}
            {levels.map((n) => {
              const keVal = n * n * E1_eV;
              // Map energy value to height
              const y = height - padding - (keVal / maxEnergy) * (height - padding * 2 - 20);
              const isCurrent = quantumN === n;

              return (
                <g key={n} className="transition-all duration-300">
                  <line 
                    x1={padding} 
                    y1={y} 
                    x2={width - padding} 
                    y2={y} 
                    stroke={isCurrent ? "#06b6d4" : "rgba(255,255,255,0.15)"} 
                    strokeWidth={isCurrent ? 3 : 1.5}
                    strokeDasharray={isCurrent ? "none" : "4,4"}
                  />
                  <text 
                    x={padding - 10} 
                    y={y + 3} 
                    textAnchor="end"
                    className={isCurrent ? "fill-cyan-400 font-bold text-[10px]" : "fill-white/40"}
                  >
                    {keVal.toExponential(2)} eV
                  </text>
                  <text 
                    x={width - padding + 10} 
                    y={y + 3} 
                    className={isCurrent ? "fill-cyan-400 font-bold text-[10px]" : "fill-white/40"}
                  >
                    n = {n} {isCurrent && "★"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-text selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto space-y-8 pb-24">
        <div className="border-b border-zinc-800 pb-5">
          <h2 className="text-xl font-bold text-white tracking-tight uppercase font-display">Data Analytics Telemetry</h2>
          <p className="text-xs text-cyan-400 font-mono mt-1 uppercase tracking-wider">Dynamic mathematical plotting matching active states</p>
        </div>

        {subMode === "translational" && renderTranslationalChart()}
        {subMode === "rotational" && renderRotationalChart()}
        {subMode === "relativistic" && renderRelativisticChart()}
        {subMode === "thermal" && renderThermalChart()}
        {subMode === "quantum" && renderQuantumChart()}
      </div>
    </div>
  );
};

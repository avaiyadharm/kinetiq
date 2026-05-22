import React, { useState, useEffect } from "react";
import { BookOpen, Zap, Activity, Settings, BarChart2, RefreshCw, Info, HelpCircle } from "lucide-react";

// ─── Mathematical Typesetting Components (HTML/CSS) ──────────────────────────
const Frac: React.FC<{ num: React.ReactNode; den: React.ReactNode }> = ({ num, den }) => (
  <span className="inline-flex flex-col items-center align-middle mx-1 font-serif">
    <span className="border-b border-white/20 pb-0.5 px-1.5 text-center text-xs md:text-sm text-white/95">{num}</span>
    <span className="pt-0.5 px-1.5 text-center text-xs md:text-sm text-white/90">{den}</span>
  </span>
);

const Sqrt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center font-serif text-white/95">
    <span className="text-sm md:text-base font-light leading-none -mr-0.5">√</span>
    <span className="border-t border-white/20 pt-0.5 px-1 text-xs md:text-sm">{children}</span>
  </span>
);

const Integral: React.FC<{ lower?: React.ReactNode; upper?: React.ReactNode; expr: React.ReactNode }> = ({ lower, upper, expr }) => (
  <span className="inline-flex items-center mx-1 font-serif text-white/95">
    <span className="relative inline-flex flex-col items-center text-base md:text-lg font-light leading-none mr-1 select-none">
      {upper && <span className="absolute -top-2.5 text-[8px] scale-75 text-white/60">{upper}</span>}
      <span>∫</span>
      {lower && <span className="absolute -bottom-2.5 text-[8px] scale-75 text-white/60">{lower}</span>}
    </span>
    <span className="ml-0.5 text-xs md:text-sm">{expr}</span>
  </span>
);

const Vec2D: React.FC<{ top: React.ReactNode; bot: React.ReactNode }> = ({ top, bot }) => (
  <span className="inline-flex items-center px-1 font-serif text-white/95 select-none">
    <span className="text-lg md:text-xl font-light -mr-0.5">(</span>
    <span className="flex flex-col items-center justify-center text-[9px] md:text-xs leading-none py-0.5 px-1">
      <span>{top}</span>
      <span>{bot}</span>
    </span>
    <span className="text-lg md:text-xl font-light -ml-0.5">)</span>
  </span>
);

const Mat2x2: React.FC<{ 
  a11: React.ReactNode; a12: React.ReactNode; 
  a21: React.ReactNode; a22: React.ReactNode 
}> = ({ a11, a12, a21, a22 }) => (
  <span className="inline-flex items-center px-1 font-serif text-white/95 select-none">
    <span className="text-2xl md:text-3xl font-light -mr-1">[</span>
    <span className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] md:text-xs leading-none py-1 px-1.5 text-center">
      <span>{a11}</span>
      <span>{a12}</span>
      <span>{a21}</span>
      <span>{a22}</span>
    </span>
    <span className="text-2xl md:text-3xl font-light -ml-1">]</span>
  </span>
);

const EqBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-center items-center p-4 my-3 bg-black/50 rounded-2xl border border-white/5 font-mono text-emerald-400 text-sm md:text-base overflow-x-auto shadow-inner">
    {children}
  </div>
);

// ─── Interactive Pedagogical SVG Widgets ──────────────────────────────────────

// Widget A: Rotating Phasor with Time-Trace Waveform
const PhasorWidget: React.FC<{ phi: number; w: number; dampingRatio: number }> = ({ phi, w, dampingRatio }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime(t => (t + 0.02) % (2 * Math.PI));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const cx = 90;
  const cy = 90;
  const R_f = 60;
  const R_x = 50;

  // Force vector angle is time
  const fX = cx + Math.cos(time) * R_f;
  const fY = cy - Math.sin(time) * R_f;

  // Displacement lags by phi
  const dX = cx + Math.cos(time - phi) * R_x;
  const dY = cy - Math.sin(time - phi) * R_x;

  // Generate paths for the rolling wave trace on the right
  const wavePointsF = [];
  const wavePointsX = [];
  const startTraceX = 200;
  const traceWidth = 160;

  for (let i = 0; i <= traceWidth; i++) {
    const x = startTraceX + i;
    const tOffset = (i / traceWidth) * 2 * Math.PI;
    const yF = cy - Math.sin(time - tOffset) * R_f * 0.7;
    const yX = cy - Math.sin(time - phi - tOffset) * R_x * 0.7;
    wavePointsF.push(`${x},${yF}`);
    wavePointsX.push(`${x},${yX}`);
  }

  // Current regime description
  let regime = "Stiffness Dominated (In-Phase)";
  if (Math.abs(phi - Math.PI / 2) < 0.15) {
    regime = "Damping Dominated (Quadrature / Resonance)";
  } else if (phi > Math.PI / 2 + 0.15) {
    regime = "Inertia Dominated (Anti-Phase)";
  }

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/60 font-semibold uppercase tracking-wider">Live Phasor & Wave Projection</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
          {regime}
        </span>
      </div>
      <div className="flex justify-center">
        <svg width="100%" viewBox="0 0 380 180" className="max-w-[380px]">
          {/* Grid background */}
          <line x1="10" y1={cy} x2="370" y2={cy} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
          <line x1={cx} y1="10" x2={cx} y2="170" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
          <circle cx={cx} cy={cy} r={R_f} fill="none" stroke="rgba(255,255,255,0.05)" />
          
          {/* Phasor Vectors */}
          {/* Force Vector (Blue) */}
          <line x1={cx} y1={cy} x2={fX} y2={fY} stroke="#3b82f6" strokeWidth="2.5" />
          <circle cx={fX} cy={fY} r="3" fill="#3b82f6" />
          
          {/* Displacement Vector (Teal) */}
          <line x1={cx} y1={cy} x2={dX} y2={dY} stroke="#14b8a6" strokeWidth="2.5" />
          <circle cx={dX} cy={dY} r="3" fill="#14b8a6" />

          {/* Angle Arc for Phase Lag (phi) */}
          <path 
            d={`M ${cx + 15} ${cy} A 15 15 0 0 ${phi > 0 ? 1 : 0} ${cx + 15 * Math.cos(time - phi)} ${cy - 15 * Math.sin(time - phi)}`} 
            fill="none" 
            stroke="#f43f5e" 
            strokeWidth="1.5" 
          />

          {/* Connecting Dashed Projections */}
          <line x1={fX} y1={fY} x2={startTraceX} y2={cy - Math.sin(time) * R_f * 0.7} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
          <line x1={dX} y1={dY} x2={startTraceX} y2={cy - Math.sin(time - phi) * R_x * 0.7} stroke="#14b8a6" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />

          {/* Divider line for waveform area */}
          <line x1={startTraceX} y1="10" x2={startTraceX} y2="170" stroke="rgba(255,255,255,0.15)" />

          {/* Rolled Traces */}
          <path d={`M ${wavePointsF.join(" L ")}`} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />
          <path d={`M ${wavePointsX.join(" L ")}`} fill="none" stroke="#14b8a6" strokeWidth="2" opacity="0.8" />
          
          {/* Axis Labels */}
          <text x={cx + R_f + 5} y={cy - 4} fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">Re</text>
          <text x={cx + 4} y={20} fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">Im</text>
          <text x={340} y={cy - 5} fill="#3b82f6" fontSize="8" fontWeight="bold">F(t)</text>
          <text x={340} y={cy + 13} fill="#14b8a6" fontSize="8" fontWeight="bold">x(t)</text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
        <div className="p-2 bg-black/20 rounded border border-white/5">
          <span className="block text-white/30 mb-0.5">Live Driver Angle (ωt):</span>
          <span className="text-white font-bold">{time.toFixed(2)} rad</span>
        </div>
        <div className="p-2 bg-black/20 rounded border border-white/5">
          <span className="block text-white/30 mb-0.5">Phase Lag (φ):</span>
          <span className="text-rose-400 font-bold">{(phi * 180 / Math.PI).toFixed(1)}° ({phi.toFixed(2)} rad)</span>
        </div>
      </div>
    </div>
  );
};

// Widget B: Coupled Normal Modes Spring-Mass Simulation
const CoupledModesWidget: React.FC<{ f1: number; f2: number }> = ({ f1, f2 }) => {
  const [mode, setMode] = useState<"symmetric" | "antisymmetric">("symmetric");
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime(t => t + 0.05);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const freq = mode === "symmetric" ? f1 : f2;
  const omega = 2 * Math.PI * freq;
  
  // Oscillating amplitudes
  const amp = 20;
  const x1 = mode === "symmetric" 
    ? Math.cos(time * Math.min(omega, 10)) * amp 
    : Math.cos(time * Math.min(omega, 10)) * amp;
  
  const x2 = mode === "symmetric"
    ? Math.cos(time * Math.min(omega, 10)) * amp
    : -Math.cos(time * Math.min(omega, 10)) * amp;

  // Coordinate positions in SVG
  const leftWall = 20;
  const rightWall = 340;
  const center1 = 110 + x1;
  const center2 = 250 + x2;
  const radius = 16;
  const y = 50;

  // Spring zig-zag path generator
  const getSpringPath = (startX: number, endX: number, yVal: number, coils = 12, height = 8) => {
    const dx = endX - startX;
    const step = dx / (coils * 2 + 2);
    let path = `M ${startX} ${yVal}`;
    path += ` L ${startX + step} ${yVal}`;
    for (let i = 0; i < coils; i++) {
      const cx1 = startX + step + (2 * i + 0.5) * step;
      const cx2 = startX + step + (2 * i + 1.5) * step;
      path += ` L ${cx1} ${yVal - height} L ${cx2} ${yVal + height}`;
    }
    path += ` L ${endX - step} ${yVal} L ${endX} ${yVal}`;
    return path;
  };

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/60 font-semibold uppercase tracking-wider">Coupled Normal Modes Simulator</span>
        <div className="flex gap-1.5">
          <button 
            onClick={() => setMode("symmetric")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${mode === "symmetric" ? "bg-emerald-500 text-black" : "bg-white/5 hover:bg-white/10 text-white/70"}`}
          >
            Symmetric (In-Phase)
          </button>
          <button 
            onClick={() => setMode("antisymmetric")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${mode === "antisymmetric" ? "bg-emerald-500 text-black" : "bg-white/5 hover:bg-white/10 text-white/70"}`}
          >
            Anti-Symmetric (Out-of-Phase)
          </button>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex justify-center">
        <svg width="100%" height="100" viewBox="0 0 360 100" className="max-w-[360px]">
          {/* Wall brackets */}
          <line x1={leftWall} y1="20" x2={leftWall} y2="80" stroke="white" strokeWidth="3" />
          <line x1={rightWall} y1="20" x2={rightWall} y2="80" stroke="white" strokeWidth="3" />
          <line x1="10" y1="50" x2={leftWall} y2="50" stroke="rgba(255,255,255,0.2)" />
          <line x1={rightWall} y1="50" x2="350" y2="50" stroke="rgba(255,255,255,0.2)" />

          {/* Ground surface */}
          <line x1="10" y1="75" x2="350" y2="75" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4,4" />

          {/* Left Spring */}
          <path d={getSpringPath(leftWall, center1 - radius, y)} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
          
          {/* Coupling Middle Spring */}
          <path d={getSpringPath(center1 + radius, center2 - radius, y, 10, 8)} fill="none" stroke="#f43f5e" strokeWidth="1.5" />

          {/* Right Spring */}
          <path d={getSpringPath(center2 + radius, rightWall, y)} fill="none" stroke="#60a5fa" strokeWidth="1.5" />

          {/* Mass 1 */}
          <circle cx={center1} cy={y} r={radius} fill="#14b8a6" stroke="white" strokeWidth="1.5" />
          <text x={center1} y={y + 4} fill="black" fontSize="9" fontWeight="black" textAnchor="middle">m₁</text>

          {/* Mass 2 */}
          <circle cx={center2} cy={y} r={radius} fill="#3b82f6" stroke="white" strokeWidth="1.5" />
          <text x={center2} y={y + 4} fill="black" fontSize="9" fontWeight="black" textAnchor="middle">m₂</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
        <div className="p-2 bg-black/20 rounded border border-white/5">
          <span className="block text-white/30 mb-0.5">Mode Frequency:</span>
          <span className="text-emerald-400 font-bold">{freq.toFixed(3)} Hz</span>
        </div>
        <div className="p-2 bg-black/20 rounded border border-white/5">
          <span className="block text-white/30 mb-0.5">Mode Coordinates:</span>
          <span className="text-white font-bold">
            {mode === "symmetric" ? "q₁ = x₁ + x₂" : "q₂ = x₁ - x₂"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Widget C: Duffing Double-Well Potential & Mathieu Tongues
const NonlinearWidget: React.FC<{ alpha: number; k: number; delta: number; epsilon: number; zeta: number }> = ({ 
  alpha, k, delta, epsilon, zeta 
}) => {
  const [subTab, setSubTab] = useState<"duffing" | "mathieu">("duffing");
  const [ballX, setBallX] = useState(0);

  useEffect(() => {
    let animId: number;
    let time = 0;
    const tick = () => {
      time += 0.05;
      // Animate sliding particle in well
      setBallX(Math.sin(time) * 1.5);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Duffing potential graph
  const renderDuffingPotential = () => {
    const pointsLinear = [];
    const pointsNonlinear = [];
    const width = 300;
    const height = 120;
    const cx = width / 2;
    const cy = height - 30;

    for (let screenX = 20; screenX <= width - 20; screenX++) {
      const physX = (screenX - cx) / 45; // scale factor
      // V_linear = 0.5 * k * x^2
      const V_lin = 0.5 * 10 * physX * physX;
      // V_nonlinear = 0.5 * k * x^2 + 0.25 * alpha * x^4
      const alpha_scaled = alpha * 0.1;
      const V_non = 0.5 * 10 * physX * physX + 0.25 * alpha_scaled * Math.pow(physX, 4);

      const screenY_lin = cy - V_lin * 5;
      const screenY_non = cy - V_non * 5;

      if (screenY_lin > 10 && screenY_lin < height - 5) {
        pointsLinear.push(`${screenX},${screenY_lin}`);
      }
      if (screenY_non > 10 && screenY_non < height - 5) {
        pointsNonlinear.push(`${screenX},${screenY_non}`);
      }
    }

    // Ball coordinate in potential well
    const ballScreenX = cx + ballX * 45;
    const ballPhysX = ballX;
    const alpha_scaled = alpha * 0.1;
    const ballV = 0.5 * 10 * ballPhysX * ballPhysX + 0.25 * alpha_scaled * Math.pow(ballPhysX, 4);
    const ballScreenY = cy - ballV * 5;

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] text-white/50">
          <span>Stiffness Constant: k = {k.toFixed(1)} N/m</span>
          <span>Duffing α = {alpha.toFixed(1)} N/m³ ({alpha > 0 ? "Hardening" : alpha < 0 ? "Softening" : "Linear"})</span>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex justify-center">
          <svg width={width} height={height} className="overflow-visible">
            {/* Axis */}
            <line x1="10" y1={cy} x2={width - 10} y2={cy} stroke="rgba(255,255,255,0.1)" />
            <line x1={cx} y1="10" x2={cx} y2={height - 10} stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
            
            {/* Linear Parabola (dashed blue) */}
            {pointsLinear.length > 0 && (
              <path d={`M ${pointsLinear.join(" L ")}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
            )}

            {/* Duffing Nonlinear Potential (solid green/teal) */}
            {pointsNonlinear.length > 0 && (
              <path d={`M ${pointsNonlinear.join(" L ")}`} fill="none" stroke="#10b981" strokeWidth="2.5" />
            )}

            {/* Sliding Ball */}
            <circle cx={ballScreenX} cy={ballScreenY} r="5" fill="#f43f5e" stroke="white" strokeWidth="1" />
            
            <text x="15" y="20" fill="#3b82f6" fontSize="7" opacity="0.7">Linear Spring Well V(x) = ½kx²</text>
            <text x="15" y="32" fill="#10b981" fontSize="7">Duffing Well V(x) = ½kx² + ¼αx⁴</text>
          </svg>
        </div>
      </div>
    );
  };

  // Mathieu instability tongues
  const renderMathieuTongues = () => {
    // Standard stability diagram: delta on x [0 to 4], epsilon on y [0 to 1.5]
    const width = 300;
    const height = 120;
    const scaleX = (width - 40) / 4; // delta from 0 to 4
    const scaleY = (height - 20) / 1.5; // epsilon from 0 to 1.5
    
    const mapDeltaToX = (d: number) => 20 + d * scaleX;
    const mapEpsToY = (ep: number) => height - 10 - ep * scaleY;

    // Calculate instability boundaries for plotting
    // Primary tongue centered at delta = 1, threshold = 2 * zeta (damping ratio)
    // boundary: (delta - 1)^2 = epsilon^2 - 4 * zeta^2 => delta = 1 +/- sqrt(epsilon^2 - 4 * zeta^2)
    const tongue1Points = [];
    const step = 0.05;
    for (let eps = 2 * zeta; eps <= 1.5; eps += step) {
      const term = Math.sqrt(Math.max(0, eps * eps - 4 * zeta * zeta));
      const dMin = 1 - term;
      const dMax = 1 + term;
      tongue1Points.push({ eps, dMin, dMax });
    }

    // Build the SVG path for the first tongue instability region
    let tonguePath = "";
    if (tongue1Points.length > 0) {
      // Trace up the left side, then down the right side
      const leftHalf = tongue1Points.map(pt => `${mapDeltaToX(pt.dMin)},${mapEpsToY(pt.eps)}`);
      const rightHalf = [...tongue1Points].reverse().map(pt => `${mapDeltaToX(pt.dMax)},${mapEpsToY(pt.eps)}`);
      tonguePath = `M ${leftHalf.join(" L ")} L ${rightHalf.join(" L ")} Z`;
    }

    // Is the current system state in the unstable zone?
    const insideTongue = epsilon > 2 * zeta && Math.abs(delta - 1) < Math.sqrt(epsilon * epsilon - 4 * zeta * zeta);

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] text-white/50 font-mono">
          <span>Parameters: δ = {delta.toFixed(2)}, ε = {epsilon.toFixed(2)}</span>
          <span className={`px-1.5 py-0.5 rounded font-bold ${insideTongue ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-emerald-500/10 text-emerald-400"}`}>
            {insideTongue ? "UNSTABLE (Resonance Growth)" : "STABLE (Bounded Orbit)"}
          </span>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex justify-center">
          <svg width={width} height={height}>
            {/* Grid */}
            <line x1="20" y1={height - 10} x2={width - 20} y2={height - 10} stroke="rgba(255,255,255,0.2)" />
            <line x1="20" y1="10" x2="20" y2={height - 10} stroke="rgba(255,255,255,0.2)" />

            {/* Stable zone label */}
            <text x="120" y={height - 20} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">Stable Region</text>

            {/* Instability Tongue 1 (shaded red) */}
            {tonguePath && (
              <path d={tonguePath} fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="1.5" />
            )}
            {tonguePath && (
              <text x={mapDeltaToX(1.0)} y={mapEpsToY(0.9)} fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">Instability Tongue</text>
            )}

            {/* Current State Marker */}
            <circle cx={mapDeltaToX(Math.max(0, Math.min(4, delta)))} cy={mapEpsToY(Math.max(0, Math.min(1.5, epsilon)))} r="4" fill="#60a5fa" stroke="white" strokeWidth="1.5" />
            <line x1={mapDeltaToX(Math.max(0, Math.min(4, delta)))} y1="10" x2={mapDeltaToX(Math.max(0, Math.min(4, delta)))} y2={height - 10} stroke="rgba(96,165,250,0.3)" strokeDasharray="2,2" />
            <line x1="20" y1={mapEpsToY(Math.max(0, Math.min(1.5, epsilon)))} x2={width - 20} y2={mapEpsToY(Math.max(0, Math.min(1.5, epsilon)))} stroke="rgba(96,165,250,0.3)" strokeDasharray="2,2" />

            {/* Axis labels */}
            <text x={width - 35} y={height - 14} fill="rgba(255,255,255,0.4)" fontSize="7">δ = 4ω₀²/Ω²</text>
            <text x="24" y="20" fill="rgba(255,255,255,0.4)" fontSize="7">ε (Modulation Depth)</text>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button 
          onClick={() => setSubTab("duffing")}
          className={`px-3 py-1 rounded text-xs font-bold transition-all ${subTab === "duffing" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
        >
          Duffing Potential
        </button>
        <button 
          onClick={() => setSubTab("mathieu")}
          className={`px-3 py-1 rounded text-xs font-bold transition-all ${subTab === "mathieu" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
        >
          Mathieu Stability Maps
        </button>
      </div>

      {subTab === "duffing" ? renderDuffingPotential() : renderMathieuTongues()}
    </div>
  );
};

// Widget D: Hamiltonian Phase Space Flow
const PhaseSpaceWidget: React.FC<{ damping: number; w0: number; simMode: string }> = ({ damping, w0, simMode }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime(t => t + 0.05);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const width = 300;
  const height = 150;
  const cx = width / 2;
  const cy = height / 2;

  // Render a family of trajectories
  // If damping = 0, orbits are concentric ellipses. If damping > 0, orbits spiral inwards.
  const orbits = [];
  const numOrbits = 5;

  for (let rIdx = 1; rIdx <= numOrbits; rIdx++) {
    const R_x = rIdx * 25;
    const R_p = rIdx * 12;
    const points = [];

    // Simulate flow along trajectory
    if (damping === 0) {
      // Perfect ellipses (Hamiltonian energy contours)
      for (let theta = 0; theta <= 2 * Math.PI + 0.05; theta += 0.1) {
        const px = cx + Math.cos(theta) * R_x;
        const py = cy - Math.sin(theta) * R_p;
        points.push(`${px},${py}`);
      }
    } else {
      // Damped spirals
      for (let theta = 0; theta <= 4 * Math.PI; theta += 0.1) {
        const decay = Math.exp(-0.1 * damping * theta);
        const px = cx + Math.cos(theta) * R_x * decay;
        const py = cy - Math.sin(theta) * R_p * decay;
        if (R_x * decay > 1) {
          points.push(`${px},${py}`);
        }
      }
    }
    orbits.push(points);
  }

  // Animating phase point on one of the trajectories
  const activeR_x = 75;
  const activeR_p = 37;
  let pX = cx;
  let pY = cy;

  if (damping === 0) {
    pX = cx + Math.cos(time) * activeR_x;
    pY = cy - Math.sin(time) * activeR_p;
  } else {
    const tMod = time % (4 * Math.PI);
    const decay = Math.exp(-0.1 * damping * tMod);
    pX = cx + Math.cos(tMod) * activeR_x * decay;
    pY = cy - Math.sin(tMod) * activeR_p * decay;
  }

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/60 font-semibold uppercase tracking-wider">Phase Space Flow Map (x vs p)</span>
        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">
          {damping === 0 ? "Conservative Symplectic" : "Dissipative Focus"}
        </span>
      </div>
      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex justify-center">
        <svg width={width} height={height}>
          {/* Coordinates */}
          <line x1="10" y1={cy} x2={width - 10} y2={cy} stroke="rgba(255,255,255,0.15)" />
          <line x1={cx} y1="10" x2={cx} y2={height - 10} stroke="rgba(255,255,255,0.15)" />
          
          {/* Orbits contours */}
          {orbits.map((pts, idx) => pts.length > 0 ? (
            <path key={idx} d={`M ${pts.join(" L ")}`} fill="none" stroke="rgba(96,165,250,0.25)" strokeWidth="1" />
          ) : null)}

          {/* Animating State Vector particle */}
          <circle cx={pX} cy={pY} r="4.5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
          <line x1={cx} y1={cy} x2={pX} y2={pY} stroke="#f43f5e" strokeWidth="1.5" opacity="0.5" />

          {/* Labels */}
          <text x={width - 25} y={cy - 5} fill="rgba(255,255,255,0.4)" fontSize="7">Displacement x</text>
          <text x={cx + 5} y="18" fill="rgba(255,255,255,0.4)" fontSize="7">Momentum p</text>
        </svg>
      </div>
      <p className="text-[10px] text-white/50 text-center leading-relaxed">
        {damping === 0 
          ? "Conservative Hamiltonian flow: Trajectories are closed orbits representing conservation of energy contours. Phase volume is strictly preserved (Liouville's theorem)." 
          : "Dissipative system: Flow maps trajectories into a stable focus at (0,0). Phase volume shrinks continuously as thermodynamic dissipation occurs."}
      </p>
    </div>
  );
};

// Widget E: Integrator Energy Drift Chart
const IntegratorWidget: React.FC<{ timeStep: number }> = ({ timeStep }) => {
  const width = 300;
  const height = 120;

  // Generate paths for three integrator schemes
  // RK4: grows slowly or explodes depending on timeStep
  // Symplectic Euler: oscillates but averages to flat
  // Velocity Verlet: oscillates with tiny amplitude, averages to flat
  const rk4Points = [];
  const symEulerPoints = [];
  const verletPoints = [];
  const startX = 20;
  const chartWidth = 260;
  const centerY = height / 2;

  // Scaling drift factors based on step size
  const factor = Math.max(0.1, timeStep * 8.0);
  const isExploded = timeStep > 0.08;

  for (let i = 0; i <= chartWidth; i++) {
    const x = startX + i;
    const t = i * 0.15;
    
    // Verlet (Highly stable second order symplectic, very tiny oscillations)
    const yVerlet = centerY - Math.sin(t * 1.8) * (2 * factor);
    verletPoints.push(`${x},${yVerlet}`);

    // Symplectic Euler (First order symplectic, medium oscillations but bounded)
    const ySym = centerY - Math.sin(t * 0.9) * (8 * factor);
    symEulerPoints.push(`${x},${ySym}`);

    // RK4 (Non-symplectic: exhibits artificial energy growth/drift)
    let yRk = centerY;
    if (isExploded) {
      // Exponential explosion
      const drift = Math.exp(t * 0.1) * 0.5;
      yRk = centerY - drift;
    } else {
      // Slow linear drift
      const drift = t * 0.8 * factor;
      yRk = centerY - Math.sin(t * 1.5) * (4 * factor) - drift;
    }
    
    if (yRk > 5 && yRk < height - 5) {
      rk4Points.push(`${x},${yRk}`);
    }
  }

  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/60 font-semibold uppercase tracking-wider">Long-Term Numerical Energy Conservation</span>
        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[10px]">
          dt = {timeStep.toFixed(3)}s
        </span>
      </div>
      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex justify-center">
        <svg width={width} height={height}>
          {/* Energy baseline */}
          <line x1="20" y1={centerY} x2={width - 20} y2={centerY} stroke="white" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
          <text x="25" y={centerY - 4} fill="white" fontSize="6" opacity="0.6">Analytical Energy E₀</text>

          {/* Symplectic Euler (Cyan) */}
          <path d={`M ${symEulerPoints.join(" L ")}`} fill="none" stroke="#06b6d4" strokeWidth="1.2" opacity="0.8" />
          
          {/* Velocity Verlet (Emerald) */}
          <path d={`M ${verletPoints.join(" L ")}`} fill="none" stroke="#10b981" strokeWidth="2" />

          {/* RK4 (Yellow/Orange) */}
          {rk4Points.length > 0 && (
            <path d={`M ${rk4Points.join(" L ")}`} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray={isExploded ? "none" : "4,2"} />
          )}

          {/* Legend */}
          <g transform="translate(25, 10)">
            <rect x="0" y="0" width="6" height="6" fill="#10b981" />
            <text x="10" y="6" fill="rgba(255,255,255,0.7)" fontSize="7">Velocity Verlet (Symplectic O(dt²))</text>
            
            <rect x="0" y="10" width="6" height="6" fill="#06b6d4" />
            <text x="10" y="16" fill="rgba(255,255,255,0.7)" fontSize="7">Symplectic Euler (Symplectic O(dt))</text>
            
            <rect x="0" y="20" width="6" height="6" fill="#f59e0b" />
            <text x="10" y="26" fill="rgba(255,255,255,0.7)" fontSize="7">
              {isExploded ? "RK4 (Explodes for high dt!)" : "RK4 (Dumps/Drifts Energy O(dt⁴))"}
            </text>
          </g>
        </svg>
      </div>
      <p className="text-[9px] text-white/40 leading-relaxed font-mono">
        Symplectic integrators preserve area-preserving maps in phase space, keeping energy error strictly bounded over long integrations. Non-symplectic methods (like RK4) fail to conserve symplectic forms, leading to systematic artificial energy drift.
      </p>
    </div>
  );
};


// ─── Main Theoretical Basis Component ────────────────────────────────────────

interface ResonanceTheoryProps {
  mass: number;
  springK: number;
  dampingB: number;
  driverAmp: number;
  driverFreq: number;
  simMode: "single" | "coupled" | "duffing" | "parametric" | "beats";
  integrator: "rk4" | "symplectic_euler" | "velocity_verlet" | "adaptive_rk";
  duffingAlpha: number;
  couplingK: number;
  mass2: number;
  dampingB2: number;
  springK2: number;
  couplingB: number;
  driverAmp2: number;
  driverFreq2: number;
  parametricEpsilon: number;
  timeStep: number;
  solverTolerance: number;
  adaptiveStepping: boolean;
  substeps: number;
}

export const ResonanceTheory: React.FC<ResonanceTheoryProps> = ({
  mass,
  springK,
  dampingB,
  driverAmp,
  driverFreq,
  simMode,
  integrator,
  duffingAlpha,
  couplingK,
  mass2,
  dampingB2,
  springK2,
  couplingB,
  driverAmp2,
  driverFreq2,
  parametricEpsilon,
  timeStep,
  solverTolerance,
  adaptiveStepping,
  substeps
}) => {
  const [activeTab, setActiveTab] = useState<string>("core");

  // 1. Core analytical variables computed in real-time
  const m1 = Math.max(0.01, mass);
  const k1 = Math.max(0.01, springK);
  const b1 = Math.max(0, dampingB);
  const F0 = driverAmp;
  const f_d = driverFreq;
  const w_d = 2 * Math.PI * f_d;

  const w0 = Math.sqrt(k1 / m1);
  const f0 = w0 / (2 * Math.PI);
  const beta = b1 / (2 * m1);
  const dampingRatio = beta / w0;

  // Damped resonance peak angular frequency
  const w_r_sq = w0 * w0 - 2 * beta * beta;
  const w_r = w_r_sq > 0 ? Math.sqrt(w_r_sq) : 0;
  const f_r = w_r / (2 * Math.PI);

  // Quality factor
  const Q = b1 > 0 ? Math.sqrt(m1 * k1) / b1 : Infinity;
  const bandwidth = Q > 0 && Q !== Infinity ? f0 / Q : 0;
  const tau = b1 > 0 ? (2 * m1) / b1 : Infinity;

  // Steady-state amplitude & phase lag
  const denom = Math.sqrt(Math.pow(k1 - m1 * w_d * w_d, 2) + Math.pow(b1 * w_d, 2));
  const A_ss = denom > 0 ? F0 / denom : 0;
  const phi = Math.atan2(b1 * w_d, k1 - m1 * w_d * w_d);

  // 2. Coupled Mode analytical variables
  const m2_val = Math.max(0.01, mass2);
  const k2_val = Math.max(0.01, springK2);
  const kc_val = couplingK;

  // Solving det(K - w^2 M) = 0 for 2 DoF:
  // A*lambda^2 + B*lambda + C = 0 where lambda = w^2
  const A_q = m1 * m2_val;
  const B_q = -(m1 * (k2_val + kc_val) + m2_val * (k1 + kc_val));
  const C_q = (k1 + kc_val) * (k2_val + kc_val) - kc_val * kc_val;
  const disc = B_q * B_q - 4 * A_q * C_q;
  let lambda1 = 0, lambda2 = 0;
  if (disc >= 0) {
    lambda1 = (-B_q - Math.sqrt(disc)) / (2 * A_q);
    lambda2 = (-B_q + Math.sqrt(disc)) / (2 * A_q);
  }
  const w_mode1 = Math.sqrt(Math.max(0, lambda1));
  const w_mode2 = Math.sqrt(Math.max(0, lambda2));
  const f_mode1 = w_mode1 / (2 * Math.PI);
  const f_mode2 = w_mode2 / (2 * Math.PI);

  // Eigenvectors ratio R = v2/v1
  // (k1 + kc - m1*lambda)*v1 - kc*v2 = 0 => R = (k1 + kc - m1*lambda)/kc
  const R1 = kc_val > 0 ? (k1 + kc_val - m1 * lambda1) / kc_val : 0;
  const R2 = kc_val > 0 ? (k1 + kc_val - m1 * lambda2) / kc_val : 0;

  // 3. Beats variables
  const f_beat = Math.abs(driverFreq - driverFreq2);
  const T_envelope = f_beat > 0 ? 1 / f_beat : Infinity;

  // 4. Mathieu variables
  const delta_mathieu = w_d > 0 ? (4 * w0 * w0) / (w_d * w_d) : 0;

  // Sidebar chapter items
  const chapters = [
    { id: "core", title: "1. Linear Resonance", desc: "Forced damped equations, natural vs. resonance peaks", icon: BookOpen },
    { id: "phase_energy", title: "2. Phase & Energy flow", desc: "Phase transitions, Q-factor, and thermodynamics", icon: Zap },
    { id: "coupled_beats", title: "3. Coupled Modes & Beats", desc: "Matrix mechanics, splitting, and wave interference", icon: Activity },
    { id: "nonlinear_parametric", title: "4. Nonlinear & Parametric", desc: "Duffing springs, Mathieu tongues, stability, chaos", icon: Settings },
    { id: "hamiltonian", title: "5. Phase Space & Hamiltonians", desc: "Symplectic flow, Liouville, fixed points, separatrices", icon: BarChart2 },
    { id: "numerical", title: "6. Computational Integration", desc: "Symplectic Verlet, timestep limits, units & scaling", icon: RefreshCw },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-24 text-white px-4 md:px-6 pt-6 font-body-md h-full flex flex-col gap-6">
      
      {/* Header Banner */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          PHYSICS RESEARCH CENTER
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
          Computational Mechanics <span className="text-emerald-400">& Resonance Theory</span>
        </h2>
        <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-4xl font-body-md">
          A graduate-level textbook and reference manual deriving equations of motion across physical regimes, normal-mode splittings, nonlinear bistabilities, Hamiltonian geometry, and symplectic integrator stability.
        </p>
      </header>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar (3 cols on lg) */}
        <nav className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 sticky top-6 z-20">
          {chapters.map(c => {
            const Icon = c.icon;
            const active = activeTab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`p-4 rounded-3xl border text-left transition-all flex items-start gap-4 shadow-md ${
                  active 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-white" 
                    : "bg-[#18181b] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                }`}
              >
                <div className={`p-2.5 rounded-2xl ${active ? "bg-emerald-500 text-black" : "bg-white/5"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider">{c.title}</h4>
                  <p className="text-[10px] text-white/40 mt-1 leading-normal">{c.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Content Panel (8 cols on lg) */}
        <main className="lg:col-span-8 bg-[#18181b] p-6 md:p-8 rounded-[36px] border border-white/5 shadow-2xl space-y-8 min-h-[500px]">
          
          {/* CHAPTER 1: LINEAR RESONANCE */}
          {activeTab === "core" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-[2px] bg-emerald-400/50" />
                1. Linear Resonance Physics
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                <p>
                  Oscillatory systems are fundamental to physical systems where a restoring force acts to bring a displacement back to an equilibrium position.
                  By Newton's Second Law, the dynamics of a single mass <span className="italic font-serif">m</span> (kg) subject to a spring restoring force (Hooke's Law <span className="italic font-serif">-kx</span>), viscous velocity damping damping force (<span className="italic font-serif">-bẋ</span>), and periodic external driving force is modeled as:
                </p>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Newtonian Derivation</h4>
                <p>
                  Summing the mechanical forces:
                  <span className="block my-2 text-center text-white font-mono">ΣF = F<sub>driver</sub> + F<sub>restoring</sub> + F<sub>damping</sub> = ma</span>
                  Substitute the forces:
                  <span className="block my-2 text-center text-white font-mono">F₀ cos(ωt) - kx - bẋ = mẍ</span>
                  Grouping terms gives the governing second-order inhomogeneous linear differential equation:
                </p>

                <EqBox>
                  m ẍ + b ẋ + k x = F₀ cos(ω t)
                </EqBox>

                <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-[11px] font-mono text-white/60 space-y-2">
                  <span className="text-white font-bold block text-xs">Parameter Synchronization</span>
                  <div>• Active Mass (<span className="italic">m</span>): <strong className="text-cyan-400">{m1.toFixed(2)} kg</strong></div>
                  <div>• Active Stiffness (<span className="italic">k</span>): <strong className="text-cyan-400">{k1.toFixed(2)} N/m</strong></div>
                  <div>• Active Damping (<span className="italic">b</span>): <strong className="text-cyan-400">{b1.toFixed(2)} N s/m</strong></div>
                  <div>• Active Driver Force (<span className="italic">F₀</span>): <strong className="text-cyan-400">{F0.toFixed(2)} N</strong></div>
                </div>

                <p>
                  To analyze this, we divide by mass <span className="italic font-serif">m</span> to find the normalized parameter form:
                  <span className="block my-2 text-center text-white font-mono font-serif">
                    ẍ + 2β ẋ + ω₀² x = f₀ cos(ω t)
                  </span>
                  where:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Natural angular frequency: <strong>ω₀ = <Sqrt><Frac num="k" den="m" /></Sqrt> = <span className="text-emerald-400 font-bold">{w0.toFixed(2)} rad/s</span></strong> (natural frequency: <strong>f₀ = {f0.toFixed(2)} Hz</strong>)</li>
                  <li>Attenuation rate (damping factor): <strong>β = <Frac num="b" den="2m" /> = <span className="text-emerald-400 font-bold">{beta.toFixed(3)} s⁻¹</span></strong></li>
                  <li>Normalized driver amplitude: <strong>f₀ = F₀/m = {(F0/m1).toFixed(2)} N/kg</strong></li>
                </ul>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Natural Frequency vs. Damped Resonance</h4>
                <p>
                  For an undamped free oscillator (<span className="italic font-serif">b=0</span>), the system oscillates indefinitely at its natural frequency <span className="italic font-serif">ω₀</span>. Damping shifts the physical resonance frequency.
                  For a driven system, the driver frequency which maximizes the steady-state displacement amplitude is the <strong>damped resonance frequency (ω<sub>r</sub>)</strong>, found by maximizing the amplitude denominator:
                </p>

                <EqBox>
                  ω_r = <Sqrt>ω₀² - 2β²</Sqrt>
                </EqBox>

                <p>
                  Plugging in our synchronized parameters:
                  <span className="block my-2 text-center text-white font-mono">
                    f_r = <Frac num={<Sqrt>{(w0*w0).toFixed(2)} - 2({(beta*beta).toFixed(5)})</Sqrt>} den="2π" /> = <strong className="text-emerald-400 text-sm">{f_r.toFixed(3)} Hz</strong>
                  </span>
                  Notice that if the attenuation <span className="italic font-serif">β &gt; ω₀ / √2</span>, the resonance peak frequency becomes imaginary; the amplitude curve becomes monotonic, and maximum response occurs at <span className="italic font-serif">ω = 0</span>.
                </p>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex gap-3 text-xs">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Regime Validity:</strong> The linear equation assumes small displacements where Hooke's Law holds, and damping forces are linear with respect to velocity (valid for low-speed viscous drag in fluids).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CHAPTER 2: PHASE & ENERGY FLOW */}
          {activeTab === "phase_energy" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-[2px] bg-emerald-400/50" />
                2. Phase Lag & Thermodynamic Energy Flow
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                <p>
                  Driven oscillators do not respond instantly to the driver force. A phase lag <span className="italic font-serif">φ</span> develops.
                  Using complex numbers, we express the forcing function as <span className="italic font-serif">F(t) = Re[F₀ e<sup>iωt</sup>]</span> and the displacement as <span className="italic font-serif">x(t) = Re[A e<sup>i(ωt - φ)</sup>]</span>.
                  Substituting into the differential equation and solving yields:
                </p>

                <EqBox>
                  tan(φ) = <Frac num="b ω" den="k - m ω²" /> = <Frac num="2 β ω" den="ω₀² - ω²" />
                </EqBox>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2 text-[10px] font-mono text-center">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-white/40 block mb-0.5">Stiffness-Dominated (ω &lt;&lt; ω₀)</span>
                    <span className="text-cyan-400 font-bold block">φ → 0</span>
                    <span className="text-[9px] text-white/50">Displacement in-phase with driver</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-white/40 block mb-0.5">Damping-Dominated (ω = ω₀)</span>
                    <span className="text-emerald-400 font-bold block">φ = π/2 (90°)</span>
                    <span className="text-[9px] text-white/50">Quadrature. Velocity in-phase (Max Power)</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-white/40 block mb-0.5">Inertia-Dominated (ω &gt;&gt; ω₀)</span>
                    <span className="text-rose-400 font-bold block">φ → π (180°)</span>
                    <span className="text-[9px] text-white/50">Displacement anti-phase with driver</span>
                  </div>
                </div>

                <PhasorWidget phi={phi} w={w_d} dampingRatio={dampingRatio} />

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">The Quality Factor (Q) & Bandwidth</h4>
                <p>
                  The Quality Factor <span className="italic font-serif">Q</span> represents energy conservation efficiency in resonance. It is defined as:
                </p>

                <EqBox>
                  Q = 2π × <Frac num="Energy Stored" den="Energy Dissipated per cycle" /> = <Frac num={<Sqrt>m k</Sqrt>} den="b" /> = <Frac num="f₀" den="Δf" />
                </EqBox>

                <p>
                  For the current setup, <strong>Q = {Q === Infinity ? "∞" : Q.toFixed(2)}</strong>.
                  The half-power bandwidth is <strong>Δf = {bandwidth.toFixed(3)} Hz</strong>.
                  A high-Q system retains energy efficiently, creating a tall, narrow resonance peak, whereas a low-Q system broadens the peak and loses energy rapidly.
                </p>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Thermodynamic Energy Flow & Power Transfer</h4>
                <p>
                  The instantaneous mechanical energy is the sum of Kinetic Energy (<span className="italic font-serif">KE = ½mv²</span>) and Potential Energy (<span className="italic font-serif">PE = ½kx²</span>).
                  The rate at which the driver injects power into the system is:
                  <span className="block my-2 text-center text-white font-mono">P_in(t) = F_drive(t) · v(t) = F₀ cos(ω t) · ẋ(t)</span>
                  The rate at which energy is irreversibly dissipated into heat by viscous damping is:
                  <span className="block my-2 text-center text-white font-mono">P_diss(t) = b · [ẋ(t)]²</span>
                  At steady-state resonance, the average injected power equals the average dissipated power. Because velocity is exactly in-phase with the driving force at <span className="italic font-serif">φ = 90°</span>, the power transfer is maximized.
                </p>
              </div>
            </div>
          )}

          {/* CHAPTER 3: COUPLED SYSTEMS & BEATS */}
          {activeTab === "coupled_beats" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-[2px] bg-emerald-400/50" />
                3. Coupled Oscillators Matrix Mechanics & Beats
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                <p>
                  When multiple oscillating components interact, energy transfers between them. For two coupled masses linked by a spring <span className="italic font-serif">k<sub>c</sub></span>, the equations of motion are coupled:
                </p>

                <EqBox>
                  <div className="text-left space-y-1">
                    <div>m₁ ẍ₁ + b₁ ẋ₁ + (k₁ + k_c) x₁ - k_c x₂ = F₁(t)</div>
                    <div>m₂ ẍ₂ + b₂ ẋ₂ + (k₂ + k_c) x₂ - k_c x₁ = F₂(t)</div>
                  </div>
                </EqBox>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Matrix Eigenvalue Formulation</h4>
                <p>
                  Ignoring damping and driving forces, we look for free harmonic solutions of the form <span className="italic font-serif">x⃗(t) = v⃗ e<sup>iωt</sup></span>.
                  This transforms the differential equations into a matrix eigenvalue system:
                </p>

                <EqBox>
                  ( <Mat2x2 a11="k₁ + k_c" a12="-k_c" a21="-k_c" a22="k₂ + k_c" /> - ω² <Mat2x2 a11="m₁" a12="0" a21="0" a22="m₂" /> ) <Vec2D top="v₁" bot="v₂" /> = <Vec2D top="0" bot="0" />
                </EqBox>

                <p>
                  Solving the characteristic equation <span className="italic font-serif">det(K - ω²M) = 0</span> yields the normal mode frequencies.
                  For our active configuration:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Symmetric-like Mode 1 (In-Phase): <strong>f_mode1 = <span className="text-emerald-400 font-bold">{f_mode1.toFixed(3)} Hz</span></strong> (eigenvector ratio R₁ = {R1.toFixed(3)})</li>
                  <li>Anti-symmetric-like Mode 2 (Out-of-Phase): <strong>f_mode2 = <span className="text-emerald-400 font-bold">{f_mode2.toFixed(3)} Hz</span></strong> (eigenvector ratio R₂ = {R2.toFixed(3)})</li>
                  <li>Mode Splitting Gap: <strong>Δf_split = <span className="text-rose-400 font-bold">{(f_mode2 - f_mode1).toFixed(3)} Hz</span></strong></li>
                </ul>

                <CoupledModesWidget f1={f_mode1} f2={f_mode2} />

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Beats & Wave Interference</h4>
                <p>
                  When a single oscillator is driven by two frequencies <span className="italic font-serif">ω₁</span> and <span className="italic font-serif">ω₂</span> that are very close, the resulting displacement is the superposition:
                  <span className="block my-2 text-center text-white font-serif">
                    x(t) = A cos(ω₁ t) + A cos(ω₂ t) = 2 A cos(<Frac num="ω₁ - ω₂" den="2" /> t) cos(<Frac num="ω₁ + ω₂" den="2" /> t)
                  </span>
                  This represents a fast carrier oscillation modulated by a slow amplitude envelope. The beat frequency is:
                </p>

                <EqBox>
                  f_beat = |f₁ - f₂|
                </EqBox>

                <p>
                  For the current setup, if driven by two signals with difference <strong>|f₁ - f₂| = {f_beat.toFixed(3)} Hz</strong>, the amplitude envelope completes a cycle every <strong>T_envelope = {T_envelope === Infinity ? "∞" : T_envelope.toFixed(2)} s</strong>, showing slow, rhythmic constructive and destructive interference.
                </p>
              </div>
            </div>
          )}

          {/* CHAPTER 4: NONLINEAR & PARAMETRIC */}
          {activeTab === "nonlinear_parametric" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-[2px] bg-emerald-400/50" />
                4. Nonlinear Springs, Parametric Pumping & Chaos
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                <p>
                  Real-world materials often behave nonlinearly. The <strong>Duffing Oscillator</strong> models structural cubic nonlinearities:
                </p>

                <EqBox>
                  m ẍ + b x  + k x + α x³ = F₀ cos(ω t)
                </EqBox>

                <p>
                  where <span className="italic font-serif">α</span> (N/m³) represents the nonlinear spring constant.
                  If <strong>α &gt; 0</strong> (hardening spring, currently <span className="text-emerald-400 font-bold">{duffingAlpha.toFixed(1)}</span>), the effective spring stiffness increases with displacement. This bends the resonance peak to the right, causing:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Bistability:</strong> Multiple stable amplitudes exist for the same frequency.</li>
                  <li><strong>Jump Phenomena & Hysteresis:</strong> Sweeping the driver frequency upwards vs. downwards results in sudden, discontinuous jumps at different frequencies.</li>
                </ul>

                <NonlinearWidget alpha={duffingAlpha} k={k1} delta={delta_mathieu} epsilon={parametricEpsilon} zeta={dampingRatio} />

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Parametric Resonance (Mathieu Equation)</h4>
                <p>
                  Instead of external forcing, <strong>parametric resonance</strong> occurs when a system parameter (like spring stiffness) varies periodically in time:
                  <span className="block my-2 text-center text-white font-serif">
                    m ẍ + b ẋ + k₀ [ 1 + ε cos(Ω t) ] x = 0
                  </span>
                  Here, <span className="italic font-serif">ε</span> is the modulation depth (currently <span className="text-emerald-400 font-bold">{parametricEpsilon.toFixed(2)}</span>) and <span className="italic font-serif">Ω</span> is the parameter pump frequency (2ω<sub>d</sub>).
                  By Floquet theory, energy is pumped directly into the system, causing exponential growth if the pump frequency is near twice the natural frequency:
                </p>

                <EqBox>
                  Ω ≈ 2 ω₀ / n  (for n = 1, 2, 3...)
                </EqBox>

                <p>
                  For the current setup, primary instability occurs near <strong>Ω ≈ {(2 * w0).toFixed(2)} rad/s</strong> (approx. <strong>{ (2 * f0).toFixed(2)} Hz</strong>).
                  Damping raises the threshold: instability only occurs if the modulation depth <strong>ε &gt; 2 / Q = {(2 / Q).toFixed(4)}</strong>.
                </p>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Deterministic Chaos</h4>
                <p>
                  In nonlinear driven systems (like the Duffing oscillator), high driver amplitudes <span className="italic font-serif">F₀</span> and low damping <span className="italic font-serif">b</span> can trigger <strong>deterministic chaos</strong>.
                  Chaotic trajectories exhibit extreme sensitivity to initial conditions (Lyapunov divergence) and trace out strange fractals in phase space (strange attractors), rather than closing into simple limit cycles.
                </p>
              </div>
            </div>
          )}

          {/* CHAPTER 5: HAMILTONIAN PHASE SPACE */}
          {activeTab === "hamiltonian" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-[2px] bg-emerald-400/50" />
                5. Hamiltonian Mechanics & Phase Space
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                <p>
                  Hamiltonian mechanics reformulates second-order differential equations as a system of first-order equations using generalized coordinate <span className="italic font-serif">x</span> and momentum <span className="italic font-serif">p = mẋ</span>.
                  The total mechanical energy is defined by the Hamiltonian function <span className="italic font-serif">H(x, p) = T(p) + V(x)</span>:
                </p>

                <EqBox>
                  H(x, p) = <Frac num="p²" den="2 m" /> + ½ k x²
                </EqBox>

                <p>
                  Hamilton's canonical equations of motion are:
                  <span className="block my-2 text-center text-white font-serif">
                    ẋ = <Frac num="∂H" den="∂p" /> = <Frac num="p" den="m" /> , 
                    ṗ = - <Frac num="∂H" den="∂x" /> = - k x
                  </span>
                  This maps the system into a two-dimensional vector field representing <strong>Phase Space</strong>.
                </p>

                <PhaseSpaceWidget damping={b1} w0={w0} simMode={simMode} />

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Symplectic Geometry & Liouville's Theorem</h4>
                <p>
                  For any conservative system (<span className="italic font-serif">b=0</span>), the phase space trajectories are closed energy contours.
                  According to <strong>Liouville's Theorem</strong>, the volume of any arbitrary region of phase space remains constant under Hamiltonian flow:
                  <span className="block my-2 text-center text-white font-mono">
                    <Frac num="d" den="dt" /> (d³q d³p) = 0
                  </span>
                  This volume preservation is a consequence of the symplectic structure of Hamiltonian systems. Non-conservative forces (viscous damping <span className="italic font-serif">b &gt; 0</span>) break this symmetry, causing phase space volume to contract exponentially as the system energy dissipates.
                </p>
              </div>
            </div>
          )}

          {/* CHAPTER 6: COMPUTATIONAL INTEGRATION */}
          {activeTab === "numerical" && (
            <div className="space-y-6">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-[2px] bg-emerald-400/50" />
                6. Numerical Analysis & Engineering
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                <p>
                  Computational physics engines solve these differential equations step-by-step using discrete timesteps <span className="italic font-serif">Δt</span>.
                  The choice of integrator dictates stability and energy conservation.
                </p>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Comparison of Integration Algorithms</h4>
                <div className="space-y-3 font-mono text-[11px] text-white/60">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <strong className="text-emerald-400 text-xs block mb-1">1. Runge-Kutta 4th Order (RK4)</strong>
                    <p className="leading-relaxed">
                      Explicit, 4th-order algorithm with local error <span className="italic font-serif">O(Δt⁵)</span>. Extremely accurate for short integrations, but lacks symplectic properties, causing energy drift (explosion or artificial damping) over long cycles.
                    </p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <strong className="text-emerald-400 text-xs block mb-1">2. Velocity Verlet</strong>
                    <p className="leading-relaxed">
                      A 2nd-order symplectic integrator that updates coordinates and velocities in steps:
                      <br /><em>x<sub>n+1</sub> = x<sub>n</sub> + v<sub>n</sub> Δt + ½ a<sub>n</sub> Δt²</em>
                      <br /><em>v<sub>n+1</sub> = v<sub>n</sub> + ½ (a<sub>n</sub> + a<sub>n+1</sub>) Δt</em>
                      <br />Crucial for oscillatory physics because it preserves the phase-space area, maintaining bounded energy errors.
                    </p>
                  </div>
                </div>

                <IntegratorWidget timeStep={timeStep} />

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Dimensional & Unit Consistency</h4>
                <p>
                  Physics parameters must align with international standards (SI units). The dimensions of the coefficients in our system are checked below:
                </p>

                <div className="overflow-x-auto bg-black/40 rounded-xl border border-white/5">
                  <table className="min-w-full text-[10px] font-mono text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="p-2">Variable</th>
                        <th className="p-2">Physical Quantity</th>
                        <th className="p-2">SI Unit</th>
                        <th className="p-2">Dimensions (M, L, T)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/70">
                      <tr>
                        <td className="p-2 font-bold text-emerald-400">m</td>
                        <td className="p-2">Inertia (Mass)</td>
                        <td className="p-2">kilogram (kg)</td>
                        <td className="p-2">M</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-emerald-400">k</td>
                        <td className="p-2">Spring Stiffness</td>
                        <td className="p-2">Newtons per meter (N/m)</td>
                        <td className="p-2">M T⁻²</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-emerald-400">b</td>
                        <td className="p-2">Viscous Damping</td>
                        <td className="p-2">Newton seconds per meter (N s/m)</td>
                        <td className="p-2">M T⁻¹</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-emerald-400">F₀</td>
                        <td className="p-2">Driving Force</td>
                        <td className="p-2">Newton (N)</td>
                        <td className="p-2">M L T⁻²</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-emerald-400">Q</td>
                        <td className="p-2">Quality Factor</td>
                        <td className="p-2">Dimensionless</td>
                        <td className="p-2">1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-white font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">Real-World Engineering Connections</h4>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>
                    <strong>Tacoma Narrows Bridge (1940):</strong> Often cited as a resonance failure, though technically a case of aeroelastic flutter (negative aerodynamic damping), causing a self-exciting torsional oscillation that exceeded structural limits.
                  </li>
                  <li>
                    <strong>Tuning Forks & Quartz Crystals:</strong> Designed with high Q-factors (high selectivity) to vibrate at highly stable frequencies, acting as timebases in electronic clocks.
                  </li>
                  <li>
                    <strong>Seismometers & Suspension:</strong> Vehicle shock absorbers use near-critical damping (<span className="italic font-serif">ζ ≈ 0.7</span>) to suppress resonance peak amplitude growth while minimizing transient settling times after impacts.
                  </li>
                  <li>
                    <strong>MEMS Resonators & Lasers:</strong> Micro-electro-mechanical resonators exploit parametric amplification to detect minute mass deposits, while atomic lasers use optical cavity resonance to lock phase-coherent light waves.
                  </li>
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

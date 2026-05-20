"use client";

import React, { useState, useEffect } from "react";
import { StandingWavesCanvas, BoundaryType, RenderMode } from "./StandingWavesCanvas";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { Play, Pause, Waves, Settings, Activity, Maximize2, Layers, HelpCircle, MousePointer2, Settings2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { StandingWavesTheory } from "./StandingWavesTheory";
import StandingWavesEnvironment from "./StandingWavesEnvironment";

// --- ClickableValue: Premium Tactile Slider + Parameter Field ---
interface ClickableValueProps {
  value: number;
  label: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  colorClass?: string;
  format?: (val: number) => string;
}

const ClickableValue = ({ value, label, unit, min, max, step, onChange, colorClass = "text-white", format }: ClickableValueProps) => {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>{format ? format(value) : value.toFixed(1)}</span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div className="relative h-6 flex items-center group cursor-pointer"
           onMouseDown={(e) => {
             setIsDragging(true);
             const rect = e.currentTarget.getBoundingClientRect();
             const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
             onChange(min + percent * (max - min));
           }}
           onMouseMove={(e) => {
             if (isDragging) {
               const rect = e.currentTarget.getBoundingClientRect();
               const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
               // Snap to step
               const rawVal = min + percent * (max - min);
               const snapped = Math.round(rawVal / step) * step;
               onChange(snapped);
             }
           }}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={cn("h-full opacity-50 group-hover:opacity-100 transition-opacity")} style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: "currentColor" }} />
        </div>
        <div 
          className={cn("absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform", isDragging ? "scale-150" : "group-hover:scale-125")}
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
};

const ControlCard = ({ title, icon: Icon, children, color }: any) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl shrink-0 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
       <Icon className="w-24 h-24" style={{ color }} />
    </div>
    <div className="flex items-center gap-3 relative z-10">
       <div className="p-2 rounded-lg bg-white/5" style={{ color }}>
          <Icon className="w-5 h-5" />
       </div>
       <h3 className="text-sm font-black uppercase tracking-widest text-white/90">{title}</h3>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export const StandingWavesSimulator = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);

  // Physics parameters
  const [simMode, setSimMode] = useState<"harmonic" | "driven">("harmonic");
  const [harmonic, setHarmonic] = useState(3);
  const [length, setLength] = useState(2.0); // m
  
  const [boundaryType, setBoundaryType] = useState<BoundaryType | "Partially Reflective">("Fixed-Fixed");
  const [renderMode, setRenderMode] = useState<RenderMode>("Displacement");

  // Environment State
  const [tension, setTension] = useState(120); // T (N)
  const [density, setDensity] = useState(0.003); // μ (kg/m) - Nylon String default
  const [damping, setDamping] = useState(0.15); // β (s⁻¹)
  const [visualAmplitudeFactor, setVisualAmplitudeFactor] = useState(5); // visual scaling factor
  const [boundaryImpedance, setBoundaryImpedance] = useState(25.0); // Z_2 (kg/s)
  const [drivingFrequency, setDrivingFrequency] = useState(25.0); // f_d (Hz)
  const [amplitude, setAmplitude] = useState(1.0); // A (m) - displacement amplitude
  const [preset, setPreset] = useState("Nylon String");

  // Derived Physics
  const waveSpeed = Math.sqrt(tension / density); // v = √(T/μ)
  const Z1 = Math.sqrt(tension * density); // String impedance Z = √(Tμ)

  // Compute boundary reflection coefficient R
  let R = -1;
  if (boundaryType === "Fixed-Fixed") R = -1;
  else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") R = 1;
  else if (boundaryType === "Partially Reflective") {
    R = (boundaryImpedance - Z1) / (boundaryImpedance + Z1);
  }

  // Handlers for physical consistency
  const handleBoundaryChange = (type: any) => {
    setBoundaryType(type);
    if (type === "Fixed-Free" && harmonic % 2 === 0) {
      setHarmonic(Math.max(1, harmonic - 1));
    }
  };

  const handleHarmonicChange = (newVal: number) => {
    if (boundaryType === "Fixed-Free") {
      const val = Math.round(newVal);
      if (val % 2 === 0) {
        if (val > harmonic) {
          setHarmonic(val + 1);
        } else {
          setHarmonic(Math.max(1, val - 1));
        }
      } else {
        setHarmonic(Math.max(1, val));
      }
    } else {
      setHarmonic(Math.max(1, Math.round(newVal)));
    }
  };

  // Visualization parameters
  const [showComponents, setShowComponents] = useState(false);
  const [showNodes, setShowNodes] = useState(true);
  const [showAntinodes, setShowAntinodes] = useState(true);

  // Advanced features state
  const [showPhaseSpace, setShowPhaseSpace] = useState(false);
  const [showFourier, setShowFourier] = useState(false);

  // Telemetry computation
  let lambda = 0;
  let k = 0;
  let frequency = 0;
  let omega = 0;
  let qFactor = 0;
  let bandwidth = 0;
  let baseFuncStr = "sin";

  if (simMode === "harmonic") {
    const activeHarmonic = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
    if (boundaryType === "Fixed-Fixed") {
      lambda = (2 * length) / activeHarmonic;
      k = (2 * Math.PI) / lambda;
      baseFuncStr = "sin";
    } else if (boundaryType === "Free-Free") {
      lambda = (2 * length) / activeHarmonic;
      k = (2 * Math.PI) / lambda;
      baseFuncStr = "cos";
    } else if (boundaryType === "Fixed-Free") {
      lambda = (4 * length) / activeHarmonic;
      k = (2 * Math.PI) / lambda;
      baseFuncStr = "sin";
    } else {
      lambda = (2 * length) / activeHarmonic;
      k = (2 * Math.PI) / lambda;
      baseFuncStr = "sin";
    }
    frequency = waveSpeed / lambda;
    omega = 2 * Math.PI * frequency;
    qFactor = damping > 0 ? omega / (2 * damping) : Infinity;
    bandwidth = damping / Math.PI;
  } else {
    // Driven mode telemetry
    frequency = drivingFrequency;
    omega = 2 * Math.PI * frequency;
    
    // Complex wave number kc = k - i * alpha
    const w_v2 = (omega * omega) / (waveSpeed * waveSpeed);
    const b_w_v2 = (damping * omega) / (waveSpeed * waveSpeed);
    k = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
    lambda = k > 0 ? (2 * Math.PI) / k : 0;
    
    // Find closest natural resonant frequency for Q-factor
    const f1 = waveSpeed / (2 * length);
    const harmonicEstimate = Math.max(1, Math.round(frequency / f1));
    const resonantFreqEstimate = harmonicEstimate * f1;
    qFactor = damping > 0 ? (2 * Math.PI * resonantFreqEstimate) / (2 * damping) : Infinity;
    bandwidth = damping / Math.PI;
  }

  // --- Real-time SVG Resonance Curve Solver ---
  const getResonanceAmplitude = (f_d: number) => {
    const w_d = 2 * Math.PI * f_d;
    const w_v2 = (w_d * w_d) / (waveSpeed * waveSpeed);
    const b_w_v2 = (damping * w_d) / (waveSpeed * waveSpeed);
    const k_val = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
    const alpha_val = k_val > 0 ? (damping * w_d) / (waveSpeed * waveSpeed * k_val) : 0;

    const exp_2aL = Math.exp(-2 * alpha_val * length);
    const den_re = 1 + R * exp_2aL * Math.cos(2 * k_val * length);
    const den_im = - R * exp_2aL * Math.sin(2 * k_val * length);
    const den_mag2 = den_re * den_re + den_im * den_im;

    let maxAmp = 0;
    // Sample 6 spatial points to find the max displacement along the string
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * length;
      const exp_ax = Math.exp(-alpha_val * x);
      const exp_a2Lx = Math.exp(-alpha_val * (2 * length - x));

      const num_re = exp_ax * Math.cos(k_val * x) + R * exp_a2Lx * Math.cos(k_val * (2 * length - x));
      const num_im = - exp_ax * Math.sin(k_val * x) - R * exp_a2Lx * Math.sin(k_val * (2 * length - x));

      const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
      const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;
      const amp = amplitude * Math.sqrt(Y_re * Y_re + Y_im * Y_im) * visualAmplitudeFactor;
      if (amp > maxAmp) maxAmp = amp;
    }
    return maxAmp;
  };

  // Generate sweep SVG points
  const fMin = 1.0;
  const fMax = 120.0;
  const sweepPoints: { f: number; amp: number }[] = [];
  let maxSweepAmp = 0;
  if (simMode === "driven") {
    for (let f = fMin; f <= fMax; f += 2.0) {
      const amp = getResonanceAmplitude(f);
      if (amp > maxSweepAmp) maxSweepAmp = amp;
      sweepPoints.push({ f, amp });
    }
  }

  const svgW = 380;
  const svgH = 100;
  const pad = 12;
  const graphW = svgW - 2 * pad;
  const graphH = svgH - 2 * pad;
  const maxAxisVal = Math.max(1.5 * amplitude * visualAmplitudeFactor, maxSweepAmp * visualAmplitudeFactor);

  const pathD = sweepPoints.map((pt, index) => {
    const x = pad + ((pt.f - fMin) / (fMax - fMin)) * graphW;
    const y = svgH - pad - (pt.amp / maxAxisVal) * graphH;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  const indicatorX = pad + ((drivingFrequency - fMin) / (fMax - fMin)) * graphW;

  // Render loop
  useEffect(() => {
    if (!isPlaying) return;
    let animationId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setTime((t) => t + dt);
      animationId = requestAnimationFrame(render);
    };
    
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const handleReset = () => {
    setTime(0);
    setHarmonic(3);
    setTension(120);
    setDensity(0.003);
    setDamping(0.15);
    setBoundaryImpedance(25.0);
    setDrivingFrequency(25.0);
    setPreset("Nylon String");
    setLength(2.0);
    setAmplitude(1.2);
    setBoundaryType("Fixed-Fixed");
    setRenderMode("Displacement");
    setSimMode("harmonic");
  };

  return (
    <SimulationPageLayout 
      title="Standing Waves & Resonance" 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      {activeTab === "canvas" && (
        <div className="flex-1 flex flex-col xl:flex-row p-6 gap-6 overflow-hidden">
          {/* Main Visualizer */}
          <div className="flex-1 relative flex flex-col bg-[#18181b] rounded-[32px] border border-border shadow-2xl overflow-hidden min-h-[500px]">
             <div className="absolute top-6 left-6 z-20 flex gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-all border border-white/10 shadow-lg"
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                  {isPlaying ? "Pause" : "Run"}
                </button>
                <button 
                  onClick={() => setSimMode(simMode === "harmonic" ? "driven" : "harmonic")}
                  className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/20 transition-all border border-cyan-500/30 shadow-lg"
                >
                  <Waves className="w-4 h-4" />
                  {simMode === "harmonic" ? "Free Vibration" : "Driven Sweep"}
                </button>
             </div>
             <div className="absolute top-6 right-6 z-20 flex gap-2">
                <button 
                  onClick={() => setShowPhaseSpace(!showPhaseSpace)}
                  className={cn("bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-xs uppercase font-bold border transition-all shadow-lg", showPhaseSpace ? "text-fuchsia-400 border-fuchsia-500/50" : "text-white/50 border-white/10 hover:text-white")}
                  title="Toggle Probe Phase-Space Plot"
                >
                  Phase-Space
                </button>
                <button 
                  onClick={() => setShowFourier(!showFourier)}
                  className={cn("bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-xs uppercase font-bold border transition-all shadow-lg", showFourier ? "text-violet-400 border-violet-500/50" : "text-white/50 border-white/10 hover:text-white")}
                  title="Toggle Active Fourier Spectrum"
                >
                  Fourier FFT
                </button>
             </div>
             
             <div className="flex-1 flex items-center justify-center p-4 relative">
                <StandingWavesCanvas 
                  amplitude={amplitude}
                  harmonic={harmonic}
                  waveSpeed={waveSpeed}
                  boundaryType={boundaryType}
                  renderMode={renderMode}
                  showComponents={showComponents}
                  showNodes={showNodes}
                  showAntinodes={showAntinodes}
                  isPlaying={isPlaying}
                  time={time}
                  length={length}
                  tension={tension}
                  density={density}
                  damping={damping}
                  reflection={R}
                  simMode={simMode}
                  drivingFrequency={drivingFrequency}
                  boundaryImpedance={boundaryImpedance}
                  visualAmplitudeFactor={visualAmplitudeFactor}
                />

                {/* --- ADVANCED MODE 1: PHASE SPACE PLOTTER OVERLAY --- */}
                {showPhaseSpace && (
                  <div className="absolute bottom-6 left-6 w-[180px] h-[150px] bg-black/95 backdrop-blur-md border border-fuchsia-500/30 p-3 rounded-2xl flex flex-col gap-1.5 shadow-2xl">
                    <span className="text-[8px] font-black uppercase text-fuchsia-400 tracking-wider">Phase-Space Probe (x = L/2)</span>
                    <div className="flex-1 border border-white/5 relative flex items-center justify-center overflow-hidden bg-black/40 rounded-lg">
                      {/* Generates a parametric orbit of y vs y_dot */}
                      <svg className="w-full h-full">
                        <line x1="0" y1="58" x2="160" y2="58" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="77" y1="0" x2="77" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        {(() => {
                          // Plot parametric spiral/orbit of y vs dy_dt
                          const pts: string[] = [];
                          const x_probe = length / 2;
                          // Sample a loop backwards in time
                          for (let i = 0; i <= 80; i++) {
                            const t_past = time - (i * 0.04);
                            if (t_past < 0) break;
                            const envelope = simMode === "harmonic" ? Math.exp(-damping * t_past) : 1.0;
                            let y_val = 0;
                            let v_val = 0;
                            if (simMode === "harmonic") {
                              const k_val = (harmonic * Math.PI) / length;
                              const w_0 = k_val * waveSpeed;
                              const w_d = Math.sqrt(Math.max(0, w_0 * w_0 - damping * damping));
                              y_val = amplitude * envelope * Math.sin(k_val * x_probe) * Math.cos(w_d * t_past);
                              v_val = -damping * y_val - w_d * amplitude * envelope * Math.sin(k_val * x_probe) * Math.sin(w_d * t_past);
                            } else {
                              const w_d = 2 * Math.PI * drivingFrequency;
                              const w_v2 = (w_d * w_d) / (waveSpeed * waveSpeed);
                              const b_w_v2 = (damping * w_d) / (waveSpeed * waveSpeed);
                              const k_val = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
                              const alpha_val = k_val > 0 ? (damping * w_d) / (waveSpeed * waveSpeed * k_val) : 0;
                              const exp_2aL = Math.exp(-2 * alpha_val * length);
                              const den_re = 1 + R * exp_2aL * Math.cos(2 * k_val * length);
                              const den_im = - R * exp_2aL * Math.sin(2 * k_val * length);
                              const den_mag2 = den_re * den_re + den_im * den_im;
                              const exp_ax = Math.exp(-alpha_val * x_probe);
                              const exp_a2Lx = Math.exp(-alpha_val * (2 * length - x_probe));
                              const num_re = exp_ax * Math.cos(k_val * x_probe) + R * exp_a2Lx * Math.cos(k_val * (2 * length - x_probe));
                              const num_im = - exp_ax * Math.sin(k_val * x_probe) - R * exp_a2Lx * Math.sin(k_val * (2 * length - x_probe));
                              const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
                              const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;
                              y_val = amplitude * (Y_re * Math.cos(w_d * t_past) - Y_im * Math.sin(w_d * t_past));
                              v_val = -w_d * amplitude * (Y_re * Math.sin(w_d * t_past) + Y_im * Math.cos(w_d * t_past));
                            }
                            // Scale
                            const px = 77 + (y_val / amplitude) * 65;
                            const py = 58 - (v_val / (amplitude * (omega || 10))) * 45;
                            pts.push(`${x_probe > 0 ? (i === 0 ? "M" : "L") : "M"} ${px.toFixed(1)} ${py.toFixed(1)}`);
                          }
                          return <path d={pts.join(" ")} fill="none" stroke="#d946ef" strokeWidth="1.5" opacity="0.8" />;
                        })()}
                        {/* Dot at current state */}
                        {(() => {
                          const x_probe = length / 2;
                          let y_val = 0;
                          let v_val = 0;
                          const envelope = simMode === "harmonic" ? Math.exp(-damping * time) : 1.0;
                          if (simMode === "harmonic") {
                            const k_val = (harmonic * Math.PI) / length;
                            const w_0 = k_val * waveSpeed;
                            const w_d = Math.sqrt(Math.max(0, w_0 * w_0 - damping * damping));
                            y_val = amplitude * envelope * Math.sin(k_val * x_probe) * Math.cos(w_d * time);
                            v_val = -damping * y_val - w_d * amplitude * envelope * Math.sin(k_val * x_probe) * Math.sin(w_d * time);
                          } else {
                            const w_d = 2 * Math.PI * drivingFrequency;
                            const w_v2 = (w_d * w_d) / (waveSpeed * waveSpeed);
                            const b_w_v2 = (damping * w_d) / (waveSpeed * waveSpeed);
                            const k_val = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
                            const alpha_val = k_val > 0 ? (damping * w_d) / (waveSpeed * waveSpeed * k_val) : 0;
                            const exp_2aL = Math.exp(-2 * alpha_val * length);
                            const den_re = 1 + R * exp_2aL * Math.cos(2 * k_val * length);
                            const den_im = - R * exp_2aL * Math.sin(2 * k_val * length);
                            const den_mag2 = den_re * den_re + den_im * den_im;
                            const exp_ax = Math.exp(-alpha_val * x_probe);
                            const exp_a2Lx = Math.exp(-alpha_val * (2 * length - x_probe));
                            const num_re = exp_ax * Math.cos(k_val * x_probe) + R * exp_a2Lx * Math.cos(k_val * (2 * length - x_probe));
                            const num_im = - exp_ax * Math.sin(k_val * x_probe) - R * exp_a2Lx * Math.sin(k_val * (2 * length - x_probe));
                            const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
                            const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;
                            y_val = amplitude * (Y_re * Math.cos(w_d * time) - Y_im * Math.sin(w_d * time));
                            v_val = -w_d * amplitude * (Y_re * Math.sin(w_d * time) + Y_im * Math.cos(w_d * time));
                          }
                          const px = 77 + (y_val / amplitude) * 65;
                          const py = 58 - (v_val / (amplitude * (omega || 10))) * 45;
                          return <circle cx={px} cy={py} r="4.5" fill="#d946ef" className="animate-ping" style={{ transformOrigin: `${px}px ${py}px` }} />;
                        })()}
                      </svg>
                    </div>
                    <span className="text-[7px] text-white/40 text-center font-mono">y(L/2) vs dy/dt(L/2)</span>
                  </div>
                )}

                {/* --- ADVANCED MODE 2: REAL-TIME FOURIER ANALYSIS SPECTROGRAM --- */}
                {showFourier && (
                  <div className="absolute bottom-6 right-6 w-[180px] h-[150px] bg-black/95 backdrop-blur-md border border-violet-500/30 p-3 rounded-2xl flex flex-col gap-1.5 shadow-2xl">
                    <span className="text-[8px] font-black uppercase text-violet-400 tracking-wider">Fourier Harmonic Spectrum</span>
                    <div className="flex-1 border border-white/5 flex items-end justify-between p-2 bg-black/40 rounded-lg overflow-hidden">
                      {/* Computes overlap of the current string state with the Fourier modes */}
                      {(() => {
                        const modes = [1, 2, 3, 4, 5, 6];
                        return modes.map((m) => {
                          let weight = 0;
                          if (simMode === "harmonic") {
                            // Weight is 1.0 for active mode, decaying with damping
                            weight = harmonic === m ? Math.exp(-damping * time) : 0.005;
                          } else {
                            // In driven mode, weight is high if driving frequency is close to the mode resonance
                            const f_m = m * (waveSpeed / (2 * length));
                            const delta = Math.abs(drivingFrequency - f_m);
                            weight = 1.0 / (1.0 + Math.pow(delta / (damping + 0.1), 2));
                          }
                          const heightPct = Math.min(100, weight * 85 + 2);
                          return (
                            <div key={m} className="flex flex-col items-center gap-1 w-4.5">
                              <div className="w-full bg-gradient-to-t from-violet-600 to-cyan-400 rounded-t-sm transition-all duration-100" style={{ height: `${heightPct}%` }} />
                              <span className="text-[7px] font-mono text-white/50">n{m}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <span className="text-[7px] text-white/40 text-center font-mono">Relative Mode Activation P(n)</span>
                  </div>
                )}
             </div>
          </div>

          {/* Configuration Panel Sidebar */}
          <div className="w-full xl:w-[460px] flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
            
            {/* Live Scientific Telemetry & Equations */}
            <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl shrink-0 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                 <Activity className="w-32 h-32 text-emerald-500" />
               </div>
               
               <div className="relative z-10 flex flex-col gap-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   Resonance Telemetry
                 </h3>
                 
                 {/* Live Equation Box */}
                 <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                   <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                     {simMode === "harmonic" ? "Governing Wave Profile" : "Steady-State Superposition Matrix"}
                   </div>
                   <div className="font-mono text-xs md:text-sm text-emerald-400 font-bold tracking-tight overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
                     {simMode === "harmonic" ? (
                       <span>y(x,t) = { (amplitude * 2).toFixed(2) } e^(-{damping.toFixed(2)}t) {baseFuncStr}({k.toFixed(2)}x) cos({omega.toFixed(1)}t)</span>
                     ) : (
                       <span>y(x,t) = Re[ Y_re(x) cos({omega.toFixed(1)}t) - Y_im(x) sin({omega.toFixed(1)}t) ]</span>
                     )}
                   </div>
                   {showComponents && (
                     <div className="font-mono text-[10px] text-white/50 tracking-tight mt-1 flex flex-col gap-1 border-t border-white/5 pt-1">
                       <span className="text-cyan-400">y₁_fwd = A_d e^(-αx) {baseFuncStr}(kx - ωt)</span>
                       <span className="text-rose-400">y₂_bwd = R A_d e^(-α(2L-x)) {baseFuncStr}(k(2L-x) - ωt)</span>
                     </div>
                   )}
                 </div>

                 {/* Resonance Curve Graph (Driven Mode) */}
                 {simMode === "driven" && (
                   <div className="bg-black/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 relative overflow-hidden">
                     <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Amplitude vs. Driving Frequency (1 - 120 Hz)</span>
                     <div className="w-full h-[100px] relative">
                       <svg className="w-full h-full" viewBox="0 0 380 100">
                         {/* Grid ticks */}
                         <line x1="12" y1="88" x2="368" y2="88" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                         {/* Resonance peak curve path */}
                         <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" className="drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
                         {/* Bandwidth fills and current indicator */}
                         <line x1={indicatorX} y1="12" x2={indicatorX} y2="88" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                         <circle cx={indicatorX} cy={svgH - pad - (getResonanceAmplitude(drivingFrequency) / maxAxisVal) * graphH} r="4.5" fill="#38bdf8" />
                       </svg>
                     </div>
                     <div className="flex justify-between items-center text-[8px] font-mono text-white/30 uppercase">
                       <span>1.0 Hz</span>
                       <span className="text-cyan-400 font-bold">Indicator: {drivingFrequency.toFixed(1)} Hz</span>
                       <span>120.0 Hz</span>
                     </div>
                   </div>
                 )}

                 {/* Wave Dynamics Matrix */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Resonant Frequency (f)</span>
                     <span className="text-base font-mono font-black text-emerald-400">{frequency.toFixed(1)} <span className="text-xs text-emerald-500/50">Hz</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">f_n = {simMode === 'driven' ? `f_d` : `nv / 2L`}</span>
                   </div>
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-cyan-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wavelength (λ)</span>
                     <span className="text-base font-mono font-black text-cyan-400">{lambda.toFixed(3)} <span className="text-xs text-cyan-500/50">m</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">λ = 2π / k</span>
                   </div>
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-violet-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wave Number (k)</span>
                     <span className="text-base font-mono font-black text-violet-400">{k.toFixed(3)} <span className="text-xs text-violet-500/50">rad/m</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">k = 2π/λ</span>
                   </div>
                   <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-pink-500/30 transition-colors">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Damping Q-Factor</span>
                     <span className="text-base font-mono font-black text-pink-400">{qFactor === Infinity ? "∞" : qFactor.toFixed(1)} <span className="text-xs text-pink-500/50">dim</span></span>
                     <span className="text-[8px] font-mono text-white/30 uppercase mt-1">Q = ω_0 / (2β)</span>
                   </div>
                   
                   <div className="col-span-2 p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center text-[9px] font-mono text-white/40 uppercase">
                     <span>Half-Power Bandwidth (Δf):</span>
                     <span className="text-white/80 font-bold font-mono">{bandwidth.toFixed(3)} Hz</span>
                   </div>
                 </div>
               </div>
            </div>

            <ControlCard title="Boundary & Topology" icon={Settings} color="#10b981">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Boundary Conditions</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Fixed-Fixed", "Free-Free", "Fixed-Free", "Partially Reflective"].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => handleBoundaryChange(mode as any)}
                        className={cn(
                          "px-1 py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all border",
                          boundaryType === mode 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" 
                            : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                        )}
                      >
                        {mode.replace("-", "\n")}
                      </button>
                    ))}
                  </div>
                </div>

                {simMode === "harmonic" ? (
                  <ClickableValue 
                    label="Harmonic Mode (n)"
                    value={harmonic}
                    unit=""
                    min={1}
                    max={8}
                    step={1}
                    onChange={handleHarmonicChange}
                    colorClass="text-emerald-400"
                    format={(v) => `n = ${v}`}
                  />
                ) : (
                  <ClickableValue 
                    label="Driving Frequency (f_d)"
                    value={drivingFrequency}
                    unit="Hz"
                    min={1.0}
                    max={120.0}
                    step={0.5}
                    onChange={setDrivingFrequency}
                    colorClass="text-cyan-400"
                  />
                )}

                {boundaryType === "Partially Reflective" && (
                  <ClickableValue 
                    label="Boundary Impedance (Z₂)"
                    value={boundaryImpedance}
                    unit="kg/s"
                    min={0.0}
                    max={200.0}
                    step={2.5}
                    onChange={setBoundaryImpedance}
                    colorClass="text-fuchsia-400"
                  />
                )}

                <ClickableValue 
                  label="String Length (L)"
                  value={length}
                  unit="m"
                  min={1.0}
                  max={5.0}
                  step={0.05}
                  onChange={setLength}
                  colorClass="text-emerald-400"
                />
              </div>
            </ControlCard>

            <ControlCard title="Medium Dynamics" icon={Waves} color="#3b82f6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Tension (T)</span>
                    <span className="text-sm font-mono font-bold text-white">{tension.toFixed(0)} N</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Linear Density (μ)</span>
                    <span className="text-sm font-mono font-bold text-white">{(density * 1000).toFixed(1)} g/m</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex flex-col">
                    <span className="text-[8px] font-bold uppercase text-white/40">Wave Speed (v)</span>
                    <span className="text-xs font-mono font-black text-blue-400">{waveSpeed.toFixed(1)} m/s</span>
                  </div>
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex flex-col">
                    <span className="text-[8px] font-bold uppercase text-white/40">Impedance (Z₁)</span>
                    <span className="text-xs font-mono font-black text-blue-400">{Z1.toFixed(2)} kg/s</span>
                  </div>
                </div>

                <ClickableValue 
                  label="Generator Amplitude (A)"
                  value={amplitude}
                  unit="m"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  onChange={setAmplitude}
                  colorClass="text-blue-400"
                />
              </div>
            </ControlCard>

            <ControlCard title="Visualization Engine" icon={Layers} color="#8b5cf6">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Rendering Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Displacement", "Energy", "Phase", "Scientific"].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setRenderMode(mode as any)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border",
                          renderMode === mode 
                            ? "bg-violet-500/20 text-violet-400 border-violet-500/50" 
                            : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Component Traveling Waves</span>
                    <button 
                      onClick={() => setShowComponents(!showComponents)}
                      className={cn("w-10 h-5 rounded-full relative transition-colors", showComponents ? "bg-violet-500" : "bg-white/10")}
                    >
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showComponents ? "left-6" : "left-1")} />
                    </button>
                  </label>
                  
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Show Nodes</span>
                    <button 
                      onClick={() => setShowNodes(!showNodes)}
                      className={cn("w-10 h-5 rounded-full relative transition-colors", showNodes ? "bg-rose-500" : "bg-white/10")}
                    >
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showNodes ? "left-6" : "left-1")} />
                    </button>
                  </label>

                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Show Antinodes</span>
                    <button 
                      onClick={() => setShowAntinodes(!showAntinodes)}
                      className={cn("w-10 h-5 rounded-full relative transition-colors", showAntinodes ? "bg-emerald-500" : "bg-white/10")}
                    >
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showAntinodes ? "left-6" : "left-1")} />
                    </button>
                  </label>
                </div>
              </div>
            </ControlCard>

          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <StandingWavesEnvironment
            tension={tension}
            setTension={setTension}
            density={density}
            setDensity={setDensity}
            damping={damping}
            setDamping={setDamping}
            boundaryImpedance={boundaryImpedance}
            setBoundaryImpedance={setBoundaryImpedance}
            preset={preset}
            setPreset={setPreset}
            length={length}
            boundaryType={boundaryType}
            simMode={simMode}
            setSimMode={setSimMode}
          />
        </div>
      )}

      {activeTab === "theory" && (
        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <StandingWavesTheory />
        </div>
      )}

      {activeTab === "guide" && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar bg-black/50">
          <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
            
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                <HelpCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">System Operations Guide</h2>
              <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
                Comprehensive operational manual for the Standing Wave & Resonance computational environment. Learn how to navigate the visualization modes, interpret scientific telemetry, and utilize interactive probing tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Telemetry Guide Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Resonance Telemetry</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  The sidebar dynamically computes real-time constants (k, ω, λ, f). Watch as the exact governing superposition wave equation updates automatically when you modify frequency, amplitude, or boundary parameters.
                </p>
              </div>

              {/* Cursor Probing Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <MousePointer2 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Interactive Probing</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Hover directly over the simulation canvas. The computational engine will lock onto your cursor to measure precise local displacement and identify whether you are near a node or an antinode.
                </p>
              </div>

              {/* Visualization Modes Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-violet-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Layers className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Topology Rendering</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Toggle between 4 different WebGL visualization topologies. Use <strong className="text-white/80">Phase</strong> mode to observe temporal phase shifts, <strong className="text-white/80">Energy</strong> to view localized energy density, or <strong className="text-white/80">Displacement</strong> to observe raw string motion.
                </p>
              </div>

              {/* Boundary Control Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-amber-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Settings2 className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Boundary Conditions</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Switch between <strong className="text-white/80">Fixed-Fixed</strong> (like a guitar string), <strong className="text-white/80">Free-Free</strong>, and <strong className="text-white/80">Fixed-Free</strong> (like a closed pipe). Notice how the boundary conditions alter the fundamental wavelength formulas.
                </p>
              </div>

              {/* Wave Components Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-rose-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <Waves className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Component Waves</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Enable <strong className="text-white/80">Component Traveling Waves</strong> to visualize the left-moving and right-moving waves that sum to create the standing wave. This is a direct visual proof of the superposition principle.
                </p>
              </div>

              {/* Theory Connect Card */}
              <div className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-blue-500/30 transition-all group overflow-hidden relative">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">Theoretical Integration</h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  Switch to the <strong className="text-white/80">Theoretical Basis</strong> tab for mathematical derivations of superposition. Compare the formulas to the live readout of resonant frequencies on the sidebar.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </SimulationPageLayout>
  );
};

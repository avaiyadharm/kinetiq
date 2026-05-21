"use client";

import React, { useState, useEffect } from "react";
import { StandingWavesCanvas, BoundaryType, RenderMode, SystemType, EnergyMode } from "./StandingWavesCanvas";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import {
  Play, Pause, Waves, Settings, Activity, Layers, HelpCircle, MousePointer2,
  Settings2, BookOpen, AlertCircle, ChevronRight, ChevronLeft, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StandingWavesTheory } from "./StandingWavesTheory";
import StandingWavesEnvironment from "./StandingWavesEnvironment";

// ─── ClickableValue ───────────────────────────────────────────────────────────
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
          <span className={cn("text-xs font-mono font-bold", colorClass)}>{format ? format(value) : value.toFixed(2)}</span>
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
            const snapped = Math.round((min + percent * (max - min)) / step) * step;
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

// ─── ControlCard ──────────────────────────────────────────────────────────────
interface ControlCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  color?: string;
}
const ControlCard = ({ title, icon: Icon, children, color }: ControlCardProps) => (
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

// ─── Bessel Zeros ─────────────────────────────────────────────────────────────
const BESSEL_ZEROS: { [m: number]: number[] } = {
  0: [2.4048, 5.5201, 8.6537, 11.7915],
  1: [3.8317, 7.0156, 10.1735, 13.3237],
  2: [5.1356, 8.4172, 11.6198, 14.7960],
  3: [6.3802, 9.7610, 13.0152, 16.2235],
};

// ─── Q-Factor Presets ─────────────────────────────────────────────────────────
const Q_PRESETS = [
  {
    id: "highQ",
    label: "High-Q",
    sublabel: "Tuning Fork",
    tension: 200,
    density: 0.0003,
    damping: 0.001,
    color: "#10b981",
    description: "Q ≈ 120,000 — extremely persistent, very sharp resonance. Ring-down takes minutes.",
  },
  {
    id: "mediumQ",
    label: "Medium-Q",
    sublabel: "Guitar String",
    tension: 120,
    density: 0.003,
    damping: 0.5,
    color: "#38bdf8",
    description: "Q ≈ 628 — musical strings, clear harmonic decay over seconds.",
  },
  {
    id: "criticalQ",
    label: "Critical",
    sublabel: "β = ω₀",
    tension: 120,
    density: 0.003,
    damping: -1, // special: will be computed as ω₀/2
    color: "#f59e0b",
    description: "Q = 0.5 — fastest return to equilibrium without oscillation.",
  },
  {
    id: "heavyDamp",
    label: "Overdamped",
    sublabel: "Heavy damping",
    tension: 120,
    density: 0.003,
    damping: 500,
    color: "#ef4444",
    description: "Q ≪ 1 — wave decays near-instantly. No visible oscillation.",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const StandingWavesSimulator = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);

  // Lab Modules
  const [systemType, setSystemType] = useState<SystemType>("string");
  const [solverType, setSolverType] = useState<"analytical" | "numerical">("analytical");
  const [discreteBeads, setDiscreteBeads] = useState(false);
  const [membraneGeometry, setMembraneGeometry] = useState<"rectangular" | "circular">("rectangular");
  const [m2D, setM2D] = useState(2);
  const [n2D, setN2D] = useState(2);
  const [sandPattern, setSandPattern] = useState(true);
  const [probeX, setProbeX] = useState(1.0);

  // Physics parameters
  const [simMode, setSimMode] = useState<"harmonic" | "driven">("harmonic");
  const [harmonic, setHarmonic] = useState(3);
  const [length, setLength] = useState(2.0);
  const [boundaryType, setBoundaryType] = useState<BoundaryType | "Partially Reflective">("Fixed-Fixed");
  const [renderMode, setRenderMode] = useState<RenderMode>("Displacement");

  // Medium dynamics
  const [tension, setTension] = useState(120);
  const [density, setDensity] = useState(0.003);
  const [damping, setDamping] = useState(0.15);
  const [visualAmplitudeFactor, setVisualAmplitudeFactor] = useState(5);
  const [boundaryImpedance, setBoundaryImpedance] = useState(25.0);
  const [drivingFrequency, setDrivingFrequency] = useState(25.0);
  const [amplitude, setAmplitude] = useState(1.3);
  const [preset, setPreset] = useState("Nylon String");

  // NEW: Visualization controls
  const [showComponents, setShowComponents] = useState(false);
  const [showNodes, setShowNodes] = useState(true);
  const [showAntinodes, setShowAntinodes] = useState(true);
  const [showPhaseSpace, setShowPhaseSpace] = useState(false);
  const [showFourier, setShowFourier] = useState(false);

  // NEW: Time / motion controls
  const [slowMotionFactor, setSlowMotionFactor] = useState(0.04);
  const [manualPhase, setManualPhase] = useState(0);

  // NEW: Energy visualization
  const [energyMode, setEnergyMode] = useState<EnergyMode>("Total");
  const [showEnergyHeatmap, setShowEnergyHeatmap] = useState(false);
  const [showSolverDiagnostics, setShowSolverDiagnostics] = useState(false);

  // Sync probeX with length
  useEffect(() => {
    if (probeX > length) setProbeX(length * 0.5);
  }, [length, probeX]);

  // Time animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => t + dt);
      setManualPhase((p) => p + dt * slowMotionFactor);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, slowMotionFactor]);

  // ─── Derived Physics ─────────────────────────────────────────────────────
  const waveSpeed = Math.min(400, Math.sqrt(tension / density));
  const Z1 = Math.sqrt(tension * density);

  let R = -1;
  if (boundaryType === "Fixed-Fixed") R = -1;
  else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") R = 1;
  else if (boundaryType === "Partially Reflective") R = (boundaryImpedance - Z1) / (boundaryImpedance + Z1);

  const T_coeff = (boundaryImpedance + Z1) > 0 ? (2 * boundaryImpedance) / (boundaryImpedance + Z1) : 0;

  // ─── Telemetry ────────────────────────────────────────────────────────────
  let lambda = 0, k = 0, frequency = 0, omega = 0, qFactor = 0, bandwidth = 0;
  let baseFuncStr = "sin";

  if (simMode === "harmonic") {
    const activeH = boundaryType === "Fixed-Free" && harmonic % 2 === 0 ? harmonic - 1 : harmonic;
    if (boundaryType === "Fixed-Fixed" || boundaryType === "Partially Reflective") {
      lambda = (2 * length) / activeH;
      k = (activeH * Math.PI) / length;
      baseFuncStr = "sin";
    } else if (boundaryType === "Free-Free") {
      lambda = (2 * length) / activeH;
      k = (activeH * Math.PI) / length;
      baseFuncStr = "cos";
    } else if (boundaryType === "Fixed-Free") {
      lambda = (4 * length) / activeH;
      k = (activeH * Math.PI) / (2 * length);
      baseFuncStr = "sin";
    } else {
      lambda = (2 * length) / activeH;
      k = (activeH * Math.PI) / length;
      baseFuncStr = "sin";
    }
    frequency = waveSpeed / lambda;
    omega = 2 * Math.PI * frequency;
    qFactor = damping > 0 ? omega / (2 * damping) : Infinity;
    // Correct bandwidth: Δf = f₀/Q = β/π
    bandwidth = damping / Math.PI;
  } else {
    frequency = drivingFrequency;
    omega = 2 * Math.PI * frequency;
    const w_v2 = (omega * omega) / (waveSpeed * waveSpeed);
    const b_w_v2 = (damping * omega) / (waveSpeed * waveSpeed);
    k = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
    lambda = k > 0 ? (2 * Math.PI) / k : 0;
    const f1 = waveSpeed / (2 * length);
    const hEst = Math.max(1, Math.round(frequency / f1));
    const f0Est = hEst * f1;
    qFactor = damping > 0 ? (2 * Math.PI * f0Est) / (2 * damping) : Infinity;
    bandwidth = damping / Math.PI;
  }

  if (systemType === "membrane") {
    const Lx = 0.44, Ly = 0.36, radius = 0.22;
    if (membraneGeometry === "rectangular") {
      k = Math.sqrt(Math.pow((m2D * Math.PI) / Lx, 2) + Math.pow((n2D * Math.PI) / Ly, 2));
    } else {
      const x_mn = BESSEL_ZEROS[m2D]?.[n2D - 1] || 2.4048;
      k = x_mn / radius;
    }
    omega = waveSpeed * k;
    frequency = omega / (2 * Math.PI);
    lambda = (2 * Math.PI) / k;
    qFactor = damping > 0 ? omega / (2 * damping) : Infinity;
    bandwidth = damping / Math.PI;
  }

  // Derived decay timescales
  const tauDecay = damping > 0 ? 1 / damping : Infinity;
  const tauEnergy = (damping > 0 && omega > 0) ? qFactor / omega : Infinity;

  // Damping regime
  let omega0 = omega;
  if (simMode === "driven" && systemType !== "membrane") {
    const f1 = waveSpeed / (2 * length);
    const hEst = Math.max(1, Math.round(drivingFrequency / f1));
    omega0 = 2 * Math.PI * hEst * f1;
  }
  let dampingRegime: "Undamped" | "Underdamped" | "Critically Damped" | "Overdamped" = "Undamped";
  if (damping === 0) dampingRegime = "Undamped";
  else if (damping < omega0 / 2) dampingRegime = "Underdamped";
  else if (Math.abs(damping - omega0 / 2) < 0.01 * omega0) dampingRegime = "Critically Damped";
  else dampingRegime = "Overdamped";

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleBoundaryChange = (type: BoundaryType | "Partially Reflective") => {
    setBoundaryType(type);
    if (type === "Fixed-Free" && harmonic % 2 === 0) setHarmonic(Math.max(1, harmonic - 1));
  };

  const handleHarmonicChange = (newVal: number) => {
    if (boundaryType === "Fixed-Free") {
      const val = Math.round(newVal);
      if (val % 2 === 0) setHarmonic(newVal > harmonic ? val + 1 : Math.max(1, val - 1));
      else setHarmonic(Math.max(1, val));
    } else {
      setHarmonic(Math.max(1, Math.round(newVal)));
    }
  };

  const applyQPreset = (p: typeof Q_PRESETS[0]) => {
    setTension(p.tension);
    setDensity(p.density);
    const v_preset = Math.min(400, Math.sqrt(p.tension / p.density));
    if (p.damping === -1) {
      // Critical: β = ω₀ (natural freq of fundamental mode)
      const k0 = Math.PI / length;
      const omega0_c = k0 * v_preset;
      setDamping(omega0_c / 2);
    } else {
      setDamping(p.damping);
    }
  };

  // ─── Resonance Curve ──────────────────────────────────────────────────────
  const getResonanceAmplitude = (f_d: number) => {
    const w_d = 2 * Math.PI * f_d;
    const w_v2 = (w_d * w_d) / (waveSpeed * waveSpeed);
    const b_w_v2 = (damping * w_d) / (waveSpeed * waveSpeed);
    const k_val = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
    const alpha_val = k_val > 0 ? (damping * w_d) / (waveSpeed * waveSpeed * k_val) : 0;

    const exp_2aL = Math.exp(-2 * alpha_val * length);
    const den_re = 1 + R * exp_2aL * Math.cos(2 * k_val * length);
    const den_im = -R * exp_2aL * Math.sin(2 * k_val * length);
    const den_mag2 = den_re * den_re + den_im * den_im;

    let maxAmp = 0;
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * length;
      const exp_ax = Math.exp(-alpha_val * x);
      const exp_a2Lx = Math.exp(-alpha_val * (2 * length - x));
      const nr = exp_ax * Math.cos(k_val * x) + R * exp_a2Lx * Math.cos(k_val * (2 * length - x));
      const ni = -exp_ax * Math.sin(k_val * x) - R * exp_a2Lx * Math.sin(k_val * (2 * length - x));
      const Y_re = (nr * den_re + ni * den_im) / den_mag2;
      const Y_im = (ni * den_re - nr * den_im) / den_mag2;
      const amp = amplitude * Math.sqrt(Y_re * Y_re + Y_im * Y_im) * visualAmplitudeFactor;
      if (amp > maxAmp) maxAmp = amp;
    }
    return maxAmp;
  };

  const fMin = 1.0, fMax = 120.0;
  const sweepPoints: { f: number; amp: number }[] = [];
  let maxSweepAmp = 0;
  if (simMode === "driven") {
    for (let f = fMin; f <= fMax; f += 1.5) {
      const amp = getResonanceAmplitude(f);
      if (amp > maxSweepAmp) maxSweepAmp = amp;
      sweepPoints.push({ f, amp });
    }
  }

  const svgW = 380, svgH = 110, pad = 14;
  const graphW = svgW - 2 * pad, graphH = svgH - 2 * pad;
  const maxAxisVal = Math.max(1.5 * amplitude * visualAmplitudeFactor, maxSweepAmp * 1.05);

  const pathD = sweepPoints.map((pt, i) => {
    const x = pad + ((pt.f - fMin) / (fMax - fMin)) * graphW;
    const y = svgH - pad - (pt.amp / maxAxisVal) * graphH;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  const indicatorX = pad + ((drivingFrequency - fMin) / (fMax - fMin)) * graphW;

  // Half-power frequency positions on the resonance curve SVG
  // Half-power points at f₀ ± Δf/2 where Δf = β/π
  const f0_est = simMode === "driven" ? (() => {
    const f1 = waveSpeed / (2 * length);
    const hEst = Math.max(1, Math.round(drivingFrequency / f1));
    return hEst * f1;
  })() : frequency;
  const halfPwrLow = Math.max(fMin, f0_est - bandwidth / 2);
  const halfPwrHigh = Math.min(fMax, f0_est + bandwidth / 2);
  const hpLowX = pad + ((halfPwrLow - fMin) / (fMax - fMin)) * graphW;
  const hpHighX = pad + ((halfPwrHigh - fMin) / (fMax - fMin)) * graphW;
  const f0X = pad + ((f0_est - fMin) / (fMax - fMin)) * graphW;
  const peakAmp = getResonanceAmplitude(f0_est);
  const halfPwrY = svgH - pad - ((peakAmp / Math.SQRT2) / maxAxisVal) * graphH;

  // ─── Math Equation Panel ──────────────────────────────────────────────────
  const renderMathEquation = () => {
    if (systemType === "string") {
      if (simMode === "harmonic") {
        return (
          <div className="flex flex-col gap-2 font-serif text-sm text-emerald-400 bg-black/40 border border-white/5 p-4 rounded-2xl">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">Governing PDE Solution</div>
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap py-1 no-scrollbar text-base">
              <span className="italic">y(x, t)</span>
              <span>=</span>
              <span>A₀ e<sup className="text-[10px]">-βt</sup> {baseFuncStr}(kx) cos(ω_vis t)</span>
            </div>
            <div className="text-[10px] text-white/50 font-sans border-t border-white/5 pt-2 mt-1 grid grid-cols-2 gap-2">
              <div>A₀ = {amplitude.toFixed(2)} m</div>
              <div>β = {damping.toFixed(3)} s⁻¹</div>
              <div>k = {k.toFixed(3)} rad/m</div>
              <div>ω = {omega.toFixed(2)} rad/s</div>
              <div>f₀ = {frequency.toFixed(2)} Hz</div>
              <div>λ = {lambda.toFixed(4)} m</div>
            </div>
            <div className="text-[9px] text-white/30 font-sans mt-1 italic">ω_vis = ω × τ_scale  (slowMotion factor applied to cos(ωt) only)</div>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col gap-2 font-serif text-sm text-emerald-400 bg-black/40 border border-white/5 p-4 rounded-2xl">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">Driven Steady-State Solution</div>
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap py-1 no-scrollbar text-xs">
              <span className="italic">y(x,t)</span>
              <span>= Re [ Y(x) e<sup className="text-[8px]">iω_d t</sup> ]</span>
            </div>
            <div className="text-[10px] text-white/50 font-sans border-t border-white/5 pt-2 mt-1 flex flex-col gap-1">
              <div className="overflow-x-auto whitespace-nowrap no-scrollbar py-0.5">Y(x) = A_d ( e<sup className="-top-1">-αx</sup>e<sup className="-top-1">-ikx</sup> + R·e<sup className="-top-1">-α(2L-x)</sup>e<sup className="-top-1">-ik(2L-x)</sup> ) / Z_denom</div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <div>f_d = {drivingFrequency.toFixed(1)} Hz</div>
                <div>R = {R.toFixed(3)}</div>
                <div>Z₁ = {Z1.toFixed(2)} kg/s</div>
                <div>T_coeff = {T_coeff.toFixed(3)}</div>
              </div>
            </div>
          </div>
        );
      }
    } else if (systemType === "air") {
      return (
        <div className="flex flex-col gap-2 font-serif text-sm text-emerald-400 bg-black/40 border border-white/5 p-4 rounded-2xl">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">Acoustic Pipe — Displacement & Pressure</div>
          <div className="flex flex-col gap-2 py-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-white/40 font-sans text-[9px] w-24">Displacement s:</span>
              <span className="italic">s(x,t) = s₀ {baseFuncStr}(kx) cos(ω_vis t)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40 font-sans text-[9px] w-24">Pressure p:</span>
              <span className="italic">p = -B ∂s/∂x  (90° phase shift)</span>
            </div>
          </div>
          <div className="text-[10px] text-white/50 font-sans border-t border-white/5 pt-2 mt-1 grid grid-cols-2 gap-2">
            <div>s₀ = {amplitude.toFixed(2)} m</div>
            <div>B = ρv² = {(density * waveSpeed * waveSpeed).toFixed(0)} Pa</div>
            <div>k = {k.toFixed(3)} rad/m</div>
            <div>ω = {omega.toFixed(2)} rad/s</div>
          </div>
        </div>
      );
    } else {
      if (membraneGeometry === "rectangular") {
        return (
          <div className="flex flex-col gap-2 font-serif text-sm text-emerald-400 bg-black/40 border border-white/5 p-4 rounded-2xl">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">Rectangular Membrane Mode</div>
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap py-1 no-scrollbar text-xs">
              <span className="italic">w(x,y,t) = A sin(<sup>mπx</sup>/<sub>Lx</sub>) sin(<sup>nπy</sup>/<sub>Ly</sub>) cos(ωt)</span>
            </div>
            <div className="text-[10px] text-white/50 font-sans border-t border-white/5 pt-2 mt-1 grid grid-cols-2 gap-2">
              <div>Mode (m,n) = ({m2D},{n2D})</div>
              <div>A = {amplitude.toFixed(2)} m</div>
              <div>ω = {omega.toFixed(2)} rad/s</div>
              <div>f = {frequency.toFixed(2)} Hz</div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col gap-2 font-serif text-sm text-emerald-400 bg-black/40 border border-white/5 p-4 rounded-2xl">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">Circular Bessel Mode</div>
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap py-1 no-scrollbar text-xs">
              <span className="italic">w(r,θ,t) = A J<sub>m</sub>(k<sub>mn</sub>r) cos(mθ) cos(ωt)</span>
            </div>
            <div className="text-[10px] text-white/50 font-sans border-t border-white/5 pt-2 mt-1 grid grid-cols-2 gap-2">
              <div>Mode (m,n) = ({m2D},{n2D})</div>
              <div>x<sub>mn</sub> = {BESSEL_ZEROS[m2D]?.[n2D - 1] || "N/A"}</div>
              <div>ω = {omega.toFixed(2)} rad/s</div>
              <div>A = {amplitude.toFixed(2)} m</div>
            </div>
          </div>
        );
      }
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setTime(0); setManualPhase(0);
    setHarmonic(3); setTension(120); setDensity(0.003); setDamping(0.15);
    setBoundaryImpedance(25.0); setDrivingFrequency(25.0); setPreset("Nylon String");
    setLength(2.0); setAmplitude(1.3); setBoundaryType("Fixed-Fixed");
    setRenderMode("Displacement"); setSimMode("harmonic"); setSystemType("string");
    setSolverType("analytical"); setDiscreteBeads(false); setMembraneGeometry("rectangular");
    setM2D(2); setN2D(2); setSandPattern(true); setProbeX(1.0);
    setSlowMotionFactor(0.04); setEnergyMode("Total"); setShowEnergyHeatmap(false); setShowSolverDiagnostics(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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

            {/* Top-left controls */}
            <div className="absolute top-6 left-6 z-20 flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-all border border-white/10 shadow-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                {isPlaying ? "Pause" : "Run"}
              </button>
              {/* Frame advance when paused */}
              {!isPlaying && (
                <>
                  <button
                    onClick={() => setManualPhase((p) => p - Math.PI / 8)}
                    className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-amber-400 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                    title="Step back π/8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setManualPhase((p) => p + Math.PI / 8)}
                    className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-amber-400 font-bold text-xs border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                    title="Step forward π/8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-amber-400 font-mono text-[10px] border border-amber-500/30 flex items-center gap-1">
                    φ = {manualPhase.toFixed(2)} rad
                  </div>
                </>
              )}
              <button
                onClick={() => setSimMode(simMode === "harmonic" ? "driven" : "harmonic")}
                className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/20 transition-all border border-cyan-500/30 shadow-lg"
              >
                <Waves className="w-4 h-4" />
                {simMode === "harmonic" ? "Free Vibration" : "Driven Sweep"}
              </button>
            </div>

            {/* Top-right HUD toggles */}
            <div className="absolute top-6 right-6 z-20 flex gap-2">
              <button
                onClick={() => setShowPhaseSpace(!showPhaseSpace)}
                className={cn("bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-xs uppercase font-bold border transition-all shadow-lg", showPhaseSpace ? "text-fuchsia-400 border-fuchsia-500/50" : "text-white/50 border-white/10 hover:text-white")}
              >Phase-Space</button>
              <button
                onClick={() => setShowFourier(!showFourier)}
                className={cn("bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-xs uppercase font-bold border transition-all shadow-lg", showFourier ? "text-violet-400 border-violet-500/50" : "text-white/50 border-white/10 hover:text-white")}
              >Fourier FFT</button>
              <button
                onClick={() => setShowSolverDiagnostics(!showSolverDiagnostics)}
                className={cn("bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl text-xs uppercase font-bold border transition-all shadow-lg", showSolverDiagnostics ? "text-cyan-400 border-cyan-500/50" : "text-white/50 border-white/10 hover:text-white")}
              >PDE Diag</button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative">
              <StandingWavesCanvas
                systemType={systemType}
                solverType={solverType}
                discreteBeads={discreteBeads}
                membraneGeometry={membraneGeometry}
                m2D={m2D}
                n2D={n2D}
                sandPattern={sandPattern}
                probeX={probeX}
                setProbeX={setProbeX}
                showPhaseSpace={showPhaseSpace}
                showFourier={showFourier}
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
                slowMotionFactor={slowMotionFactor}
                showEnergyHeatmap={showEnergyHeatmap}
                energyMode={energyMode}
                showSolverDiagnostics={showSolverDiagnostics}
                manualPhase={isPlaying ? undefined : manualPhase}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-[460px] flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">

            {/* Lab Module Selector */}
            <ControlCard title="Laboratory Module" icon={Settings2} color="#06b6d4">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Medium</label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-2xl border border-white/5">
                    {[{ id: "string", label: "String" }, { id: "air", label: "Air Column" }, { id: "membrane", label: "2D Membrane" }].map(sys => (
                      <button key={sys.id} onClick={() => { setSystemType(sys.id as SystemType); if (sys.id === "membrane") setRenderMode("Displacement"); }}
                        className={cn("py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all", systemType === sys.id ? "bg-cyan-500 text-black shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white")}>
                        {sys.label}
                      </button>
                    ))}
                  </div>
                </div>

                {systemType !== "membrane" && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Solver Core</label>
                    <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[{ id: "analytical", label: "Analytical Model" }, { id: "numerical", label: "Numerical Lab (PDE)" }].map(sol => (
                        <button key={sol.id} onClick={() => setSolverType(sol.id as "analytical" | "numerical")}
                          className={cn("py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border", solverType === sol.id ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "text-white/40 hover:bg-white/5 hover:text-white border-transparent")}>
                          {sol.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {systemType === "string" && solverType === "numerical" && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Coupled Bead-Springs</span>
                    <button onClick={() => setDiscreteBeads(!discreteBeads)} className={cn("w-10 h-5 rounded-full relative transition-colors", discreteBeads ? "bg-amber-500" : "bg-white/10")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", discreteBeads ? "left-6" : "left-1")} />
                    </button>
                  </div>
                )}
              </div>
            </ControlCard>

            {/* Q-Factor Presets */}
            <ControlCard title="Q-Factor Presets" icon={Zap} color="#f59e0b">
              <div className="space-y-3">
                <div className="text-[9px] text-white/40 leading-relaxed">
                  Apply physically calibrated damping regimes. Each preset produces distinct visual behavior — demonstrating the physical meaning of Q.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Q_PRESETS.map(p => (
                    <button key={p.id} onClick={() => applyQPreset(p)}
                      className="flex flex-col gap-1 p-3 rounded-2xl border border-white/5 bg-black/30 hover:border-white/20 hover:bg-black/50 transition-all text-left group">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-[11px] font-bold text-white/80">{p.label}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.sublabel}</span>
                      <p className="text-[8px] text-white/30 leading-relaxed group-hover:text-white/50 transition-colors mt-1">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </ControlCard>

            {/* Resonance Telemetry */}
            <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl shrink-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Activity className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="relative z-10 flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Resonance Telemetry
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider",
                    dampingRegime === "Undamped" && "border-white/20 text-white/60 bg-white/5",
                    dampingRegime === "Underdamped" && "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                    dampingRegime === "Critically Damped" && "border-amber-500/30 text-amber-400 bg-amber-500/10",
                    dampingRegime === "Overdamped" && "border-rose-500/30 text-rose-400 bg-rose-500/10"
                  )}>
                    {dampingRegime}
                  </span>
                </h3>

                {/* Nonlinear warning */}
                {amplitude > 1.2 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex gap-3 text-[10px] text-amber-400 leading-relaxed font-bold animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="uppercase tracking-wider block mb-0.5">Nonlinear Wave Warning</span>
                      Linear approximation breaking down. Second-order tension variations and dispersion effects become dominant.
                    </div>
                  </div>
                )}

                {/* Live equation */}
                {renderMathEquation()}

                {/* Resonance curve (driven mode) */}
                {simMode === "driven" && systemType !== "membrane" && (
                  <div className="bg-black/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Amplitude vs. Driving Frequency</span>
                      <span className="text-[8px] font-mono text-cyan-400">f₀ ≈ {f0_est.toFixed(1)} Hz  |  Δf = {bandwidth.toFixed(3)} Hz</span>
                    </div>
                    <div className="w-full h-[110px] relative">
                      <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`}>
                        {/* Grid */}
                        <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                        <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                        {/* Resonance curve */}
                        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" className="drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]" />

                        {/* f₀ marker */}
                        <line x1={f0X} y1={pad} x2={f0X} y2={svgH - pad} stroke="rgba(16,185,129,0.5)" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={f0X + 2} y={pad + 10} fontSize="6" fill="rgba(16,185,129,0.8)" fontFamily="monospace">f₀</text>

                        {/* Half-power points */}
                        {bandwidth < (fMax - fMin) * 0.8 && (
                          <>
                            <line x1={hpLowX} y1={pad} x2={hpLowX} y2={svgH - pad} stroke="rgba(245,158,11,0.6)" strokeWidth="1" strokeDasharray="2 3" />
                            <line x1={hpHighX} y1={pad} x2={hpHighX} y2={svgH - pad} stroke="rgba(245,158,11,0.6)" strokeWidth="1" strokeDasharray="2 3" />
                            {/* Half-power horizontal line */}
                            <line x1={hpLowX} y1={halfPwrY} x2={hpHighX} y2={halfPwrY} stroke="rgba(245,158,11,0.4)" strokeWidth="1" strokeDasharray="2 2" />
                            {/* Δf annotation */}
                            <text x={(hpLowX + hpHighX) / 2 - 12} y={halfPwrY - 3} fontSize="6" fill="rgba(245,158,11,0.8)" fontFamily="monospace">Δf={bandwidth.toFixed(2)}Hz</text>
                            {/* A/√2 annotation */}
                            <text x={svgW - pad - 42} y={halfPwrY + 10} fontSize="5.5" fill="rgba(245,158,11,0.7)" fontFamily="monospace">A/√2 (-3dB)</text>
                          </>
                        )}

                        {/* Current indicator */}
                        <line x1={indicatorX} y1={pad} x2={indicatorX} y2={svgH - pad} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle
                          cx={indicatorX}
                          cy={Math.max(pad + 4, svgH - pad - (getResonanceAmplitude(drivingFrequency) / maxAxisVal) * graphH)}
                          r="4" fill="#38bdf8"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-white/30">
                      <span>1.0 Hz</span>
                      <span className="text-cyan-400 font-bold">▶ {drivingFrequency.toFixed(1)} Hz</span>
                      <span className="text-amber-400">—— Half-power (Δf = f₀/Q)</span>
                      <span>120 Hz</span>
                    </div>
                  </div>
                )}

                {/* Telemetry matrix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Resonant Freq (f₀)</span>
                    <span className="text-base font-mono font-black text-emerald-400">{frequency.toFixed(2)} <span className="text-xs text-emerald-500/50">Hz</span></span>
                    <span className="text-[8px] font-mono text-white/30 mt-1">f_n = nv / 2L</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-cyan-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Wavelength (λ)</span>
                    <span className="text-base font-mono font-black text-cyan-400">{lambda.toFixed(4)} <span className="text-xs text-cyan-500/50">m</span></span>
                    <span className="text-[8px] font-mono text-white/30 mt-1">λ = 2π/k</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-pink-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Q-Factor</span>
                    <span className="text-base font-mono font-black text-pink-400">{qFactor === Infinity ? "∞" : qFactor.toFixed(1)} <span className="text-xs text-pink-500/50">dim</span></span>
                    <span className="text-[8px] font-mono text-white/30 mt-1">Q = ω₀/(2β)</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-violet-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Bandwidth (Δf)</span>
                    <span className="text-base font-mono font-black text-violet-400">{bandwidth.toFixed(4)} <span className="text-xs text-violet-500/50">Hz</span></span>
                    <span className="text-[8px] font-mono text-white/30 mt-1">Δf = β/π = f₀/Q</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-amber-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Amplitude Decay τ</span>
                    <span className="text-base font-mono font-black text-amber-400">{tauDecay === Infinity ? "∞" : tauDecay.toFixed(3)} <span className="text-xs text-amber-500/50">s</span></span>
                    <span className="text-[8px] font-mono text-white/30 mt-1">τ = 1/β  (A→A/e)</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-rose-500/30 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Energy Lifetime τ_E</span>
                    <span className="text-base font-mono font-black text-rose-400">{tauEnergy === Infinity ? "∞" : tauEnergy.toFixed(4)} <span className="text-xs text-rose-500/50">s</span></span>
                    <span className="text-[8px] font-mono text-white/30 mt-1">τ_E = Q/ω₀ = 1/(2β)</span>
                  </div>
                </div>

                {/* Impedance metrics (partially reflective) */}
                {boundaryType === "Partially Reflective" && systemType === "string" && (
                  <div className="p-3 bg-black/40 rounded-xl border border-fuchsia-500/20 space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-400">Impedance Matching</span>
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-white/60">
                      <div><span className="text-white/30 block">Z₁</span>{Z1.toFixed(2)} kg/s</div>
                      <div><span className="text-white/30 block">Z₂</span>{boundaryImpedance.toFixed(1)} kg/s</div>
                      <div><span className="text-white/30 block">R</span>{R.toFixed(3)}</div>
                      <div><span className="text-white/30 block">T_coeff</span>{T_coeff.toFixed(3)}</div>
                      <div><span className="text-white/30 block">|R|²</span>{(R * R).toFixed(3)}</div>
                      <div><span className="text-white/30 block">|T|²</span>{(1 - R * R).toFixed(3)}</div>
                    </div>
                    <div className="text-[8px] text-white/30 leading-relaxed mt-1">
                      Power reflected = |R|² = {(R * R * 100).toFixed(1)}% | Transmitted = {((1 - R * R) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boundary & Topology */}
            {systemType !== "membrane" ? (
              <ControlCard title="Boundary & Topology" icon={Settings} color="#10b981">
                <div className="space-y-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Boundary Conditions</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(systemType === "air"
                        ? ["Fixed-Fixed", "Free-Free", "Fixed-Free"]
                        : ["Fixed-Fixed", "Free-Free", "Fixed-Free", "Partially Reflective"]
                      ).map(mode => (
                        <button key={mode} onClick={() => handleBoundaryChange(mode as BoundaryType | "Partially Reflective")}
                          className={cn("px-1 py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all border whitespace-pre-line text-center",
                            boundaryType === mode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-white/5 text-white/40 border-transparent hover:bg-white/10")}>
                          {systemType === "air"
                            ? (mode === "Fixed-Fixed" ? "Closed\nClosed" : mode === "Free-Free" ? "Open\nOpen" : "Closed\nOpen")
                            : mode.replace("-", "\n")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {simMode === "harmonic" ? (
                    <ClickableValue label="Harmonic Mode (n)" value={harmonic} unit="" min={1} max={8} step={1}
                      onChange={handleHarmonicChange} colorClass="text-emerald-400" format={(v) => `n = ${v}`} />
                  ) : (
                    <ClickableValue label="Driving Frequency (f_d)" value={drivingFrequency} unit="Hz" min={1.0} max={120.0} step={0.5}
                      onChange={setDrivingFrequency} colorClass="text-cyan-400" />
                  )}

                  {boundaryType === "Partially Reflective" && systemType === "string" && (
                    <ClickableValue label="Boundary Impedance (Z₂)" value={boundaryImpedance} unit="kg/s" min={0} max={200} step={2.5}
                      onChange={setBoundaryImpedance} colorClass="text-fuchsia-400" />
                  )}

                  <ClickableValue label={systemType === "air" ? "Pipe Length (L)" : "String Length (L)"} value={length} unit="m" min={1.0} max={5.0} step={0.05}
                    onChange={setLength} colorClass="text-emerald-400" />
                </div>
              </ControlCard>
            ) : (
              <ControlCard title="Membrane Geometry" icon={Settings} color="#10b981">
                <div className="space-y-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Geometry Type</label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[{ id: "rectangular", label: "Rectangular" }, { id: "circular", label: "Circular" }].map(g => (
                        <button key={g.id} onClick={() => setMembraneGeometry(g.id as "rectangular" | "circular")}
                          className={cn("py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border", membraneGeometry === g.id ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "text-white/40 hover:bg-white/5 hover:text-white border-transparent")}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Chladni Sand Patterns</span>
                    <button onClick={() => setSandPattern(!sandPattern)} className={cn("w-10 h-5 rounded-full relative transition-colors", sandPattern ? "bg-amber-500" : "bg-white/10")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", sandPattern ? "left-6" : "left-1")} />
                    </button>
                  </div>
                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <ClickableValue label={membraneGeometry === "circular" ? "Azimuthal Mode (m)" : "X-Mode (m)"} value={m2D} unit="" min={membraneGeometry === "circular" ? 0 : 1} max={3} step={1}
                      onChange={(v) => setM2D(Math.round(v))} colorClass="text-emerald-400" format={(v) => `m = ${v}`} />
                    <ClickableValue label={membraneGeometry === "circular" ? "Radial Mode (n)" : "Y-Mode (n)"} value={n2D} unit="" min={1} max={4} step={1}
                      onChange={(v) => setN2D(Math.round(v))} colorClass="text-emerald-400" format={(v) => `n = ${v}`} />
                  </div>
                </div>
              </ControlCard>
            )}

            {/* Medium Dynamics */}
            <ControlCard title="Medium Dynamics" icon={Waves} color="#3b82f6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{systemType === "air" ? "Bulk Modulus (B)" : "Tension (T)"}</span>
                    <span className="text-sm font-mono font-bold text-white">{systemType === "air" ? `${(tension * 1000).toFixed(0)} Pa` : `${tension.toFixed(0)} N`}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{systemType === "air" ? "Volumetric Density (ρ)" : "Linear Density (μ)"}</span>
                    <span className="text-sm font-mono font-bold text-white">{systemType === "air" ? `${(density * 100000).toFixed(1)} g/L` : `${(density * 1000).toFixed(1)} g/m`}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex flex-col">
                    <span className="text-[8px] font-bold uppercase text-white/40">Wave Speed (v)</span>
                    <span className="text-xs font-mono font-black text-blue-400">{waveSpeed.toFixed(2)} m/s</span>
                  </div>
                  <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex flex-col">
                    <span className="text-[8px] font-bold uppercase text-white/40">Impedance (Z₁)</span>
                    <span className="text-xs font-mono font-black text-blue-400">{Z1.toFixed(3)} kg/s</span>
                    <span className="text-[7px] text-white/20 mt-0.5">Z = √(Tμ)</span>
                  </div>
                </div>
                <ClickableValue label="Damping Coefficient (β)" value={damping} unit="s⁻¹" min={0} max={50} step={0.05}
                  onChange={setDamping} colorClass="text-rose-400" />
                <ClickableValue label={systemType === "air" ? "Pressure Amplitude (p₀)" : "Generator Amplitude (A)"} value={amplitude} unit={systemType === "air" ? "Pa" : "m"} min={0.1} max={1.5} step={0.05}
                  onChange={setAmplitude} colorClass="text-blue-400" />
              </div>
            </ControlCard>

            {/* Visualization & Temporal Control */}
            <ControlCard title="Visualization Engine" icon={Layers} color="#8b5cf6">
              <div className="space-y-6">
                {/* Rendering mode */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Rendering Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(systemType === "membrane" ? ["Displacement", "Energy"] : ["Displacement", "Energy", "Phase", "Scientific"]).map(mode => (
                      <button key={mode} onClick={() => setRenderMode(mode as RenderMode)}
                        className={cn("px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border", renderMode === mode ? "bg-violet-500/20 text-violet-400 border-violet-500/50" : "bg-white/5 text-white/40 border-transparent hover:bg-white/10")}>
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy mode selector */}
                {renderMode === "Energy" && systemType !== "membrane" && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Energy Component</label>
                    <div className="grid grid-cols-4 gap-1">
                      {(["KE", "PE", "Total", "TimeAvg"] as EnergyMode[]).map(em => (
                        <button key={em} onClick={() => setEnergyMode(em)}
                          className={cn("py-1.5 rounded-lg text-[9px] font-bold transition-all border", energyMode === em ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50" : "text-white/40 border-transparent hover:bg-white/5")}>
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Energy heatmap toggle */}
                {systemType !== "membrane" && (
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between pt-2 border-t border-white/5">
                    <span>Energy Density Heatmap</span>
                    <button onClick={() => setShowEnergyHeatmap(!showEnergyHeatmap)} className={cn("w-10 h-5 rounded-full relative transition-colors", showEnergyHeatmap ? "bg-fuchsia-500" : "bg-white/10")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showEnergyHeatmap ? "left-6" : "left-1")} />
                    </button>
                  </label>
                )}

                {/* Component waves toggle */}
                {systemType !== "membrane" && (
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                    <span>Component Traveling Waves</span>
                    <button onClick={() => setShowComponents(!showComponents)} className={cn("w-10 h-5 rounded-full relative transition-colors", showComponents ? "bg-violet-500" : "bg-white/10")}>
                      <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showComponents ? "left-6" : "left-1")} />
                    </button>
                  </label>
                )}

                {systemType !== "membrane" && (
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                      <span>Show Nodes</span>
                      <button onClick={() => setShowNodes(!showNodes)} className={cn("w-10 h-5 rounded-full relative transition-colors", showNodes ? "bg-rose-500" : "bg-white/10")}>
                        <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showNodes ? "left-6" : "left-1")} />
                      </button>
                    </label>
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-between">
                      <span>Show Antinodes</span>
                      <button onClick={() => setShowAntinodes(!showAntinodes)} className={cn("w-10 h-5 rounded-full relative transition-colors", showAntinodes ? "bg-emerald-500" : "bg-white/10")}>
                        <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", showAntinodes ? "left-6" : "left-1")} />
                      </button>
                    </label>
                  </div>
                )}

                {/* Temporal / slow-motion controls */}
                <div className="flex flex-col gap-4 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Temporal Phase Scale</label>
                  <div className="text-[9px] text-white/30 leading-relaxed -mt-2">
                    Scales the visual oscillation speed. The spatial waveform (k, λ) is unchanged — only cos(ωt) advances at this rate.
                    High-ω waves remain visually perceivable at any scale.
                  </div>
                  <ClickableValue
                    label={<>Slow-Motion Factor (τ_scale)</>}
                    value={slowMotionFactor}
                    unit="×"
                    min={0.001}
                    max={1.0}
                    step={0.001}
                    onChange={setSlowMotionFactor}
                    colorClass="text-amber-400"
                    format={(v) => v.toExponential(2)}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: "Real-time", val: 1.0, color: "text-white" }, { label: "Slow", val: 0.1, color: "text-amber-400" }, { label: "Ultra-Slow", val: 0.01, color: "text-rose-400" }].map(s => (
                      <button key={s.val} onClick={() => setSlowMotionFactor(s.val)}
                        className={cn("py-2 rounded-xl border border-white/5 bg-black/30 hover:border-white/20 transition-all text-[9px] font-bold text-center", s.color)}>
                        {s.label}<br /><span className="opacity-50">{s.val}×</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ControlCard>
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="flex-1 overflow-y-auto p-12 bg-black">
          <StandingWavesEnvironment
            tension={tension} setTension={setTension}
            density={density} setDensity={setDensity}
            damping={damping} setDamping={setDamping}
            boundaryImpedance={boundaryImpedance} setBoundaryImpedance={setBoundaryImpedance}
            preset={preset} setPreset={setPreset}
            length={length} boundaryType={boundaryType}
            simMode={simMode} setSimMode={setSimMode}
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
                Comprehensive operational manual for the Standing Wave & Resonance computational environment.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Activity, color: "emerald", title: "Resonance Telemetry", text: "Real-time telemetry computes k, ω, λ, f, Q, τ_decay, τ_energy, R, T_coeff from first principles. Every value traces directly to an equation." },
                { icon: MousePointer2, color: "cyan", title: "Interactive Probing", text: "Drag the fuchsia probe line along the string to inspect local displacement, velocity, and energy density. Phase-space HUD shows y vs ẏ orbit — collapses at nodes, expands at antinodes." },
                { icon: Layers, color: "violet", title: "Visualization Modes", text: "Displacement, Energy (with KE/PE/Total/TimeAvg), Phase (hue-coded by ωt), Scientific overlay. Energy heatmap colors the string by local u(x,t) = ½μẏ² + ½T(∂y/∂x)²." },
                { icon: Zap, color: "amber", title: "Q-Factor Presets", text: "One-click presets for High-Q (tuning fork, Q≈120k), Medium-Q (guitar, Q≈628), Critically Damped (β=ω₀/2), and Overdamped. See Q-factor physics visually in seconds." },
                { icon: Settings2, color: "emerald", title: "Temporal Controls", text: "Slow-Motion Factor scales the visual oscillation rate independently of spatial waveform. High-frequency waves remain visible. Frame-advance buttons (±π/8) step phase when paused." },
                { icon: BookOpen, color: "blue", title: "PDE Solver Diagnostics", text: "Toggle 'PDE Diag' to reveal the CFL number C = v·dt/dx, grid resolution M, stable timestep dt, and L2 error norm ||y_num − y_analytical||₂ for numerical transparency." },
              ].map(({ icon: Ic, color, title, text }) => (
                <div key={title} className={cn("bg-[#18181b] p-6 rounded-[32px] border border-white/5 shadow-xl space-y-4 hover:border-white/20 transition-all group overflow-hidden relative")}>
                  <div className={`absolute -right-6 -top-6 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-all`} />
                  <div className={`w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center relative z-10`}>
                    <Ic className={`w-6 h-6 text-${color}-400`} />
                  </div>
                  <h3 className="text-lg font-bold text-white relative z-10">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed relative z-10">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SimulationPageLayout>
  );
};

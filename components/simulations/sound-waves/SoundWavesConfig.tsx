"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Activity, Settings2, Shield, BarChart2, Zap, BookOpen, 
  HelpCircle, GraduationCap, AlertTriangle, CheckCircle2, Info
} from "lucide-react";

// ─── SOLVER CONSTANTS (must match SoundWavesCanvas.tsx) ──────────────────────
const GRID_N = 200;
const GRID_DX = 0.02; // m
const DOMAIN_LENGTH = GRID_N * GRID_DX; // 4.0 m
const PML_NODES = 25;

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface SoundWavesConfigProps {
  speedOfSound: number;
  density: number;
  bulkModulus: number;
  damping: number;
  nonlinearBeta: number;
  frequency: number;
  amplitude: number;
  solverType: "fdtd" | "analytical";
  boundaryL: "absorbing" | "reflective" | "pml";
  boundaryR: "absorbing" | "reflective" | "pml";
  impedanceRatio: number;
  telemetry: {
    cflNumber: number;
    timestep: number;
    impedance: number;
    wavelength: number;
    wavenumber: number;
    angularFreq: number;
    soundIntensity: number;
    soundLevelDb: number;
    energyDensity: number;
    pressureAmp: number;
  };
}

// ─── Stat Row Component ──────────────────────────────────────────────────────
const StatRow = ({ label, value, unit, color = "text-white/80", mono = true, border = true, sub }: {
  label: string; value: string; unit?: string; color?: string; mono?: boolean; border?: boolean; sub?: string;
}) => (
  <div className={cn("flex justify-between items-baseline py-2.5 px-1 group", border && "border-b border-white/[0.04]")}>
    <div>
      <span className="text-[11px] text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
      {sub && <div className="text-[9px] text-white/25 mt-0.5">{sub}</div>}
    </div>
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className={cn("text-[12px] font-bold", color, mono && "font-mono")}>{value}</span>
      {unit && <span className="text-[9px] text-white/30 font-sans uppercase">{unit}</span>}
    </div>
  </div>
);

// ─── Section Card Component ──────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, color, children, span = 1 }: {
  title: string; icon: React.ComponentType<{ className?: string }>; color: string;
  children: React.ReactNode; span?: number;
}) => (
  <div className={cn(
    "bg-[#141416] rounded-2xl border border-white/[0.06] overflow-hidden relative group",
    span === 2 && "md:col-span-2", span === 3 && "md:col-span-3"
  )}>
    {/* Top accent line */}
    <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${color}40, ${color}10, transparent)` }} />
    <div className="p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-white/80">{title}</h3>
      </div>
      {children}
    </div>
  </div>
);

// ─── Equation Block Component ────────────────────────────────────────────────
const EquationBlock = ({ equation, label, color = "#38bdf8" }: { equation: string; label?: string; color?: string }) => (
  <div className="bg-black/50 border border-white/[0.04] rounded-xl px-4 py-3 my-3">
    {label && <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 font-bold">{label}</div>}
    <div className="font-mono text-[13px] font-bold text-center leading-relaxed" style={{ color }}>{equation}</div>
  </div>
);

// ─── Status Indicator ────────────────────────────────────────────────────────
const StatusIndicator = ({ status, label }: { status: "stable" | "warning" | "critical"; label: string }) => {
  const colors = {
    stable: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: CheckCircle2 },
    warning: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: AlertTriangle },
    critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", icon: AlertTriangle },
  };
  const c = colors[status];
  const Icon = c.icon;
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider", c.bg, c.text, c.border)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
};

// ─── Mini Canvas Diagram Component ───────────────────────────────────────────
const MiniDiagram = ({ draw, height = 80 }: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; height?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    draw(ctx, rect.width, rect.height);
  }, [draw]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full rounded-lg border border-white/[0.04] bg-black/40"
      style={{ height: `${height}px` }}
    />
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const SoundWavesConfig: React.FC<SoundWavesConfigProps> = (props) => {
  const [educLevel, setEducLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");

  // ─── DERIVED COMPUTATIONS ─────────────────────────────────────────────────
  const c = props.density > 0 ? Math.sqrt(props.bulkModulus / props.density) : props.speedOfSound;
  const Z = props.density * c;
  const wavelength = c / Math.max(1, props.frequency);
  const samplesPerWavelength = wavelength / GRID_DX;
  const cfl = props.telemetry.cflNumber;
  const dt = props.telemetry.timestep;
  
  // Nyquist limits
  const spatialNyquist = 1.0 / (2.0 * GRID_DX); // max spatial frequency (cycles/m)
  const temporalNyquist = dt > 0 ? 1.0 / (2.0 * dt) : 0;
  const maxResolvableFreq = c / (2.0 * GRID_DX); // f_max = c / (2*dx)
  
  // Numerical dispersion estimate for 2nd-order central difference
  // Phase velocity error ~ (k*dx)^2 / 24
  const kdx = (2 * Math.PI / wavelength) * GRID_DX;
  const dispersionError = (kdx * kdx) / 24.0;
  const dispersionPercent = dispersionError * 100;
  
  // Truncation error order
  const truncationOrder = 2; // O(dx^2, dt^2) for central differences
  
  // Stability determination
  const cflStatus: "stable" | "warning" | "critical" = 
    cfl <= 0.85 ? "stable" : cfl <= 0.98 ? "warning" : "critical";
  
  const resolutionStatus: "stable" | "warning" | "critical" =
    samplesPerWavelength >= 20 ? "stable" : samplesPerWavelength >= 10 ? "warning" : "critical";
  
  // Additional thermodynamic parameters
  const gamma = 1.4; // heat capacity ratio for air
  const compressibility = props.bulkModulus > 0 ? 1.0 / props.bulkModulus : 0;
  const attenuationCoeff = props.damping * 0.05; // spatial attenuation (Np/m)
  
  // Reference values
  const pRef = 2e-5; // Pa (20 uPa)
  const IRef = 1e-12; // W/m^2
  
  // Energy quantities
  const peakIntensity = props.amplitude * props.amplitude / (2 * Z);
  const peakEnergyDensity = props.bulkModulus > 0 
    ? props.amplitude * props.amplitude / (2 * props.bulkModulus) 
    : 0;
  
  // Reflection coefficient for boundary
  const Z2 = props.impedanceRatio * Z;
  const R_boundary = Z > 0 ? (Z2 - Z) / (Z2 + Z) : 0;
  const T_boundary = Z + Z2 > 0 ? (2 * Z2) / (Z + Z2) : 0;
  
  // PML parameters
  const pmlSigmaMax = 25.0 * props.damping;
  const pmlThickness = PML_NODES * GRID_DX;
  
  // FFT resolution
  const fftBins = 256;
  const fftResolution = dt > 0 ? 1.0 / (fftBins * dt) : 0;

  // ─── MINI DIAGRAM: FDTD Stencil ──────────────────────────────────────────
  const drawStencil = React.useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const spacing = Math.min(w, h) * 0.28;
    
    // Draw grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * spacing, cy - spacing * 1.5);
      ctx.lineTo(cx + i * spacing, cy + spacing * 1.5);
      ctx.stroke();
    }
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      ctx.moveTo(cx - spacing * 2.5, cy + j * spacing);
      ctx.lineTo(cx + spacing * 2.5, cy + j * spacing);
      ctx.stroke();
    }
    
    // Central stencil nodes
    const nodes = [
      { x: 0, y: 0, label: "p\u1D62\u207F", color: "#06b6d4", active: true },
      { x: -1, y: 0, label: "p\u1D62\u208B\u2081", color: "#38bdf8", active: false },
      { x: 1, y: 0, label: "p\u1D62\u208A\u2081", color: "#38bdf8", active: false },
      { x: 0, y: -1, label: "p\u1D62\u207F\u207B\u00B9", color: "#a855f7", active: false },
      { x: 0, y: 1, label: "p\u1D62\u207F\u207A\u00B9", color: "#10b981", active: false },
    ];
    
    nodes.forEach(({ x, y, label, color, active }) => {
      const nx = cx + x * spacing;
      const ny = cy + y * spacing;
      
      // Connection lines to center
      if (x !== 0 || y !== 0) {
        ctx.strokeStyle = `${color}40`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Node circle
      ctx.fillStyle = active ? color : `${color}80`;
      ctx.beginPath();
      ctx.arc(nx, ny, active ? 8 : 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Node label
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${active ? 9 : 8}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(label, nx, ny + (active ? 22 : 18));
    });
    
    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("x \u2192 (space)", w - 30, cy + spacing + 12);
    
    ctx.save();
    ctx.translate(cx - spacing * 1.8, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("t \u2192 (time)", 0, 0);
    ctx.restore();
  }, []);

  // ─── MINI DIAGRAM: PML Absorption Profile ────────────────────────────────
  const drawPML = React.useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    
    const pad = 15;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad - 5;
    
    // Draw axes
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + plotH);
    ctx.lineTo(pad + plotW, pad + plotH);
    ctx.stroke();
    
    // PML regions shading
    const pmlFrac = PML_NODES / GRID_N;
    
    ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
    ctx.fillRect(pad, pad, plotW * pmlFrac, plotH);
    ctx.fillRect(pad + plotW * (1 - pmlFrac), pad, plotW * pmlFrac, plotH);
    
    // Draw sigma profile (quadratic ramp)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= GRID_N; i++) {
      const x = pad + (i / GRID_N) * plotW;
      let sigma = 0;
      if (i < PML_NODES) {
        const d = (PML_NODES - i) / PML_NODES;
        sigma = d * d;
      } else if (i > GRID_N - PML_NODES) {
        const d = (i - (GRID_N - PML_NODES)) / PML_NODES;
        sigma = d * d;
      }
      const y = pad + plotH - sigma * plotH * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Interior region
    ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
    ctx.fillRect(pad + plotW * pmlFrac, pad, plotW * (1 - 2 * pmlFrac), plotH);
    
    // Labels
    ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PML", pad + plotW * pmlFrac / 2, pad + 12);
    ctx.fillText("PML", pad + plotW * (1 - pmlFrac / 2), pad + 12);
    
    ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
    ctx.fillText("Physical Domain", pad + plotW / 2, pad + 12);
    
    ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
    ctx.font = "7px monospace";
    ctx.fillText("\u03C3(x) = \u03C3\u2098\u2090\u2093 \u00B7 d\u00B2", pad + plotW * pmlFrac / 2, pad + plotH - 5);
    
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "left";
    ctx.fillText("\u03C3\u2098\u2090\u2093", pad + 2, pad + 8);
    ctx.textAlign = "right";
    ctx.fillText("0", pad + plotW - 2, pad + plotH + 10);
  }, []);

  // ─── MINI DIAGRAM: CFL Stability Region ──────────────────────────────────
  const drawCFL = React.useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    const pad = 20;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad;
    
    // Stability region (C <= 1)
    ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
    ctx.fillRect(pad, pad, plotW, plotH);
    
    // Unstable region above C=1
    const cflLine = pad + plotH * (1 - 1.0 / 1.5); // map C=1.0 to y
    ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
    ctx.fillRect(pad, pad, plotW, cflLine - pad);
    
    // CFL = 1 line
    ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(pad, cflLine);
    ctx.lineTo(pad + plotW, cflLine);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Current CFL marker
    const currentY = pad + plotH * (1 - cfl / 1.5);
    ctx.fillStyle = cflStatus === "stable" ? "#10b981" : cflStatus === "warning" ? "#f59e0b" : "#ef4444";
    ctx.beginPath();
    ctx.arc(pad + plotW * 0.6, currentY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Horizontal line from marker
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(pad, currentY);
    ctx.lineTo(pad + plotW * 0.6, currentY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "right";
    ctx.fillText("C = 1.0 (LIMIT)", pad + plotW - 5, cflLine - 4);
    
    ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
    ctx.fillText("STABLE", pad + plotW - 5, pad + plotH - 5);
    
    ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
    ctx.fillText("UNSTABLE", pad + plotW - 5, pad + 12);
    
    const markerColor = cflStatus === "stable" ? "rgba(16, 185, 129, 0.8)" : "rgba(245, 158, 11, 0.8)";
    ctx.fillStyle = markerColor;
    ctx.textAlign = "left";
    ctx.fillText(`C = ${cfl.toFixed(3)}`, pad + plotW * 0.6 + 12, currentY + 4);
    
    // Y-axis
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "left";
    ctx.fillText("CFL", pad, pad - 5);
  }, [cfl, cflStatus]);

  // ─── MINI DIAGRAM: Wave Resolution ────────────────────────────────────────
  const drawResolution = React.useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    const pad = 15;
    const plotW = w - 2 * pad;
    const midY = h / 2;
    
    // Draw continuous wave
    ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= plotW; x++) {
      const y = midY + Math.sin((x / plotW) * 2 * Math.PI * 2) * (h * 0.3);
      if (x === 0) ctx.moveTo(pad + x, y);
      else ctx.lineTo(pad + x, y);
    }
    ctx.stroke();
    
    // Draw grid sample points
    const nSamples = Math.min(40, Math.max(6, Math.round(samplesPerWavelength / 2)));
    const sampleSpacing = plotW / nSamples;
    
    ctx.fillStyle = samplesPerWavelength >= 20 ? "#10b981" : samplesPerWavelength >= 10 ? "#f59e0b" : "#ef4444";
    for (let i = 0; i <= nSamples; i++) {
      const x = pad + i * sampleSpacing;
      const y = midY + Math.sin((i * sampleSpacing / plotW) * 2 * Math.PI * 2) * (h * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Connect samples with lines (showing discrete reconstruction)
    ctx.strokeStyle = `${ctx.fillStyle}60`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= nSamples; i++) {
      const x = pad + i * sampleSpacing;
      const y = midY + Math.sin((i * sampleSpacing / plotW) * 2 * Math.PI * 2) * (h * 0.3);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(samplesPerWavelength)} samples/\u03BB`, w / 2, h - 3);
  }, [samplesPerWavelength]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-[#111113] overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-8">
        
        {/* ─── PAGE HEADER ──────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.25em] mb-1">Computational Acoustics</div>
            <h2 className="text-lg md:text-xl font-black font-display uppercase tracking-widest text-white">
              Solver Configuration Laboratory
            </h2>
            <p className="text-[11px] text-white/40 mt-1.5 max-w-xl leading-relaxed">
              Configure the thermodynamic medium model, FDTD numerical solver, boundary conditions, and diagnostics. 
              All parameters directly drive the simulation physics engine.
            </p>
          </div>
          
          {/* Education Level Selector */}
          <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/[0.06] shrink-0">
            {[
              { id: "beginner", label: "Beginner", icon: HelpCircle },
              { id: "intermediate", label: "Standard", icon: BookOpen },
              { id: "advanced", label: "Expert", icon: GraduationCap },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setEducLevel(item.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all",
                    educLevel === item.id 
                      ? "bg-primary text-white shadow-lg" 
                      : "text-white/35 hover:text-white/70"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── LIVE STATUS BAR ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <StatusIndicator status={cflStatus} label={`CFL: ${cfl.toFixed(3)}`} />
          <StatusIndicator status={resolutionStatus} label={`${Math.round(samplesPerWavelength)} pts/\u03BB`} />
          <StatusIndicator 
            status={dispersionPercent < 1 ? "stable" : dispersionPercent < 5 ? "warning" : "critical"} 
            label={`Dispersion: ${dispersionPercent.toFixed(2)}%`} 
          />
          <StatusIndicator 
            status={props.solverType === "fdtd" ? "stable" : "stable"} 
            label={props.solverType === "fdtd" ? "FDTD Active" : "Analytical Mode"} 
          />
        </div>

        {/* ═══ SECTION A: THERMODYNAMIC MEDIUM MODEL ═══════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* A1: Core Medium Properties */}
          <SectionCard title="Medium Properties" icon={Settings2} color="#0d9488">
            <StatRow 
              label="Medium Density (\u03C1)" 
              value={props.density.toFixed(3)} 
              unit="kg/m\u00B3" 
              color="text-teal-400" 
            />
            <StatRow 
              label="Adiabatic Bulk Modulus (B)" 
              value={props.bulkModulus >= 1e6 ? `${(props.bulkModulus / 1e6).toFixed(3)}` : `${(props.bulkModulus / 1e3).toFixed(2)}`}
              unit={props.bulkModulus >= 1e6 ? "MPa" : "kPa"} 
              color="text-teal-400" 
            />
            <StatRow 
              label="Speed of Sound (c)" 
              value={c.toFixed(1)} 
              unit="m/s" 
              color="text-cyan-400" 
              sub="c = \u221A(B/\u03C1)"
            />
            <StatRow 
              label="Acoustic Impedance (Z\u2080)" 
              value={Z >= 1e6 ? `${(Z / 1e6).toFixed(3)}` : `${Z.toFixed(1)}`}
              unit={Z >= 1e6 ? "MRayl" : "Rayl"} 
              color="text-cyan-400" 
              sub="Z = \u03C1\u00B7c"
            />
            <StatRow 
              label="Compressibility (\u03BA)" 
              value={compressibility.toExponential(3)} 
              unit="Pa\u207B\u00B9" 
              color="text-white/60" 
              sub="\u03BA = 1/B"
            />
            <StatRow 
              label="Heat Capacity Ratio (\u03B3)" 
              value={gamma.toFixed(2)} 
              unit="" 
              color="text-white/60"
              border={false}
              sub="Adiabatic index (air \u2248 1.40)"
            />
            
            {educLevel !== "advanced" && (
              <div className="mt-3 p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    {educLevel === "beginner" 
                      ? "The speed of sound depends on how stiff (B) and how dense (\u03C1) the medium is. Stiffer materials transmit sound faster. Denser materials slow it down."
                      : "Sound speed c = \u221A(B/\u03C1) is derived from linearizing the Euler equations for an adiabatic, inviscid fluid. The bulk modulus B = \u03B3P\u2080 for an ideal gas."
                    }
                  </p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* A2: Derived Acoustic Quantities */}
          <SectionCard title="Wave Parameters" icon={Activity} color="#f59e0b">
            <StatRow 
              label="Source Frequency (f)" 
              value={props.frequency.toFixed(0)} 
              unit="Hz" 
              color="text-amber-400" 
            />
            <StatRow 
              label="Wavelength (\u03BB)" 
              value={wavelength.toFixed(4)} 
              unit="m" 
              color="text-amber-400" 
              sub="\u03BB = c/f"
            />
            <StatRow 
              label="Wavenumber (k)" 
              value={props.telemetry.wavenumber.toFixed(3)} 
              unit="rad/m" 
              color="text-amber-400" 
              sub="k = 2\u03C0/\u03BB"
            />
            <StatRow 
              label="Angular Frequency (\u03C9)" 
              value={props.telemetry.angularFreq.toFixed(1)} 
              unit="rad/s" 
              color="text-amber-400"
              sub="\u03C9 = 2\u03C0f"
            />
            <StatRow 
              label="Source Amplitude (p\u2080)" 
              value={props.amplitude.toFixed(2)} 
              unit="Pa" 
              color="text-amber-400" 
            />
            <StatRow 
              label="Attenuation Coefficient (\u03B1)" 
              value={attenuationCoeff.toFixed(4)} 
              unit="Np/m" 
              color="text-white/60" 
              border={false}
              sub="Spatial dissipation rate"
            />
          </SectionCard>

          {/* A3: Energy & Signal Analysis */}
          <SectionCard title="Energy & Signal" icon={BarChart2} color="#ec4899">
            <StatRow 
              label="Peak Intensity (I)" 
              value={peakIntensity > 0.001 ? `${(peakIntensity * 1000).toFixed(3)}` : peakIntensity.toExponential(3)} 
              unit={peakIntensity > 0.001 ? "mW/m\u00B2" : "W/m\u00B2"} 
              color="text-pink-400"
              sub="I = p\u2080\u00B2 / (2Z)"
            />
            <StatRow 
              label="Energy Density (u)" 
              value={peakEnergyDensity > 0.001 ? `${(peakEnergyDensity * 1000).toFixed(4)}` : peakEnergyDensity.toExponential(3)} 
              unit={peakEnergyDensity > 0.001 ? "mJ/m\u00B3" : "J/m\u00B3"} 
              color="text-pink-400"
              sub="u = p\u2080\u00B2/(2B)"
            />
            <StatRow 
              label="Reference Pressure (p\u2080)" 
              value="20" 
              unit="\u00B5Pa" 
              color="text-white/60" 
              sub="Threshold of hearing (SPL ref)"
            />
            <StatRow 
              label="Reference Intensity (I\u2080)" 
              value="10\u207B\u00B9\u00B2" 
              unit="W/m\u00B2" 
              color="text-white/60"
              sub="Hearing threshold power"
            />
            <StatRow 
              label="SPL for p\u2080 amplitude" 
              value={props.amplitude > 0 ? `${(20 * Math.log10(props.amplitude / pRef)).toFixed(1)}` : "0"} 
              unit="dB SPL" 
              color="text-pink-400"
              sub="20\u00B7log\u2081\u2080(p/20\u00B5Pa)"
            />
            <StatRow 
              label="Nonlinear Parameter (\u03B2)" 
              value={props.nonlinearBeta === 0 ? "Off" : props.nonlinearBeta.toFixed(1)} 
              unit="" 
              color="text-white/60"
              border={false}
              sub="\u03B2 \u2248 1.2 for air"
            />
            
            {educLevel !== "advanced" && (
              <div className="mt-3 p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-pink-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    {educLevel === "beginner" 
                      ? "Sound intensity measures how much energy flows through a surface per second. The decibel scale (dB SPL) is logarithmic because human hearing spans a huge range of pressures."
                      : "Acoustic intensity I = p\u00B7v for progressive waves gives I = p\u00B2_rms/(\u03C1c). The dB SPL scale uses 20\u00B7log\u2081\u2080(p_rms/20\u00B5Pa) because pressure is a field quantity (factor of 20, not 10)."
                    }
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ─── GOVERNING EQUATION ────────────────────────────────────────────── */}
        <SectionCard title="Governing Acoustic Wave Equation" icon={Zap} color="#06b6d4" span={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <EquationBlock 
                equation={"\u2202\u00B2p / \u2202t\u00B2 = c\u00B2 \u2207\u00B2p"} 
                label="Continuous PDE (Linear Wave Equation)" 
                color="#06b6d4" 
              />
              {educLevel !== "advanced" && (
                <p className="text-[10px] text-white/40 leading-relaxed mt-2">
                  {educLevel === "beginner" 
                    ? "This equation says: the way pressure changes over time is proportional to how it varies in space, scaled by the speed of sound squared. It governs all linear acoustic wave propagation."
                    : "Derived from linearized conservation of mass (\u2202\u03C1/\u2202t + \u03C1\u2080\u2207\u00B7v = 0) and momentum (\u03C1\u2080\u2202v/\u2202t + \u2207p = 0) for small perturbations in an inviscid fluid."
                  }
                </p>
              )}
            </div>
            <div>
              <EquationBlock 
                equation={"p\u1D62\u207F\u207A\u00B9 = 2p\u1D62\u207F \u2212 p\u1D62\u207F\u207B\u00B9 + C\u00B2(p\u1D62\u208A\u2081\u207F \u2212 2p\u1D62\u207F + p\u1D62\u208B\u2081\u207F)"} 
                label="Discretized FDTD Update (2nd-order Central)" 
                color="#10b981" 
              />
              {educLevel !== "advanced" && (
                <p className="text-[10px] text-white/40 leading-relaxed mt-2">
                  {educLevel === "beginner" 
                    ? "The computer solves this by breaking space and time into tiny steps. At each step, it calculates new pressure from neighboring values using this formula."
                    : "Central finite differences in both space (\u0394x) and time (\u0394t) give O(\u0394x\u00B2, \u0394t\u00B2) accuracy. The Courant number C = c\u0394t/\u0394x controls stability and numerical dispersion."
                  }
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ═══ SECTION B: PDE SOLVER CONFIGURATION ══════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* B1: Grid & Discretization */}
          <SectionCard title="Spatial Discretization" icon={Settings2} color="#38bdf8">
            <StatRow label="Grid Nodes (N)" value={`${GRID_N}`} unit="nodes" color="text-sky-400" />
            <StatRow label="Grid Spacing (\u0394x)" value={`${(GRID_DX * 1000).toFixed(1)}`} unit="mm" color="text-sky-400" sub={`${GRID_DX} m`} />
            <StatRow label="Domain Length (L)" value={DOMAIN_LENGTH.toFixed(1)} unit="m" color="text-sky-400" sub={`N\u00B7\u0394x = ${GRID_N}\u00D7${GRID_DX}m`} />
            <StatRow label="Physical Interior" value={(DOMAIN_LENGTH - 2 * pmlThickness).toFixed(2)} unit="m" color="text-white/60" sub={`L \u2212 2\u00D7PML = ${DOMAIN_LENGTH}\u22122\u00D7${pmlThickness.toFixed(2)}`} />
            <StatRow label="Samples per \u03BB" value={`${samplesPerWavelength.toFixed(1)}`} unit="pts/\u03BB" color={resolutionStatus === "stable" ? "text-emerald-400" : resolutionStatus === "warning" ? "text-amber-400" : "text-red-400"} border={false} sub={`\u03BB/\u0394x = ${wavelength.toFixed(4)}/${GRID_DX}`} />
            
            {/* Wave resolution diagram */}
            <div className="mt-3">
              <MiniDiagram draw={drawResolution} height={65} />
            </div>
          </SectionCard>

          {/* B2: Temporal Integration */}
          <SectionCard title="Temporal Integration" icon={Zap} color="#a855f7">
            <StatRow label="Timestep (\u0394t)" value={(dt * 1e6).toFixed(2)} unit="\u00B5s" color="text-purple-400" sub={`${dt.toExponential(4)} s`} />
            <StatRow label="Courant Number (C)" value={cfl.toFixed(4)} unit="" color={cflStatus === "stable" ? "text-emerald-400" : "text-amber-400"} sub="C = c\u00B7\u0394t/\u0394x" />
            <StatRow label="CFL Margin" value={`${((1 - cfl) * 100).toFixed(1)}`} unit="%" color={cflStatus === "stable" ? "text-emerald-400" : "text-amber-400"} sub="Distance to instability: (1\u2212C)\u00D7100" />
            <StatRow label="Solver Scheme" value="Central 2nd" unit="" color="text-purple-400" sub="O(\u0394x\u00B2, \u0394t\u00B2)" />
            <StatRow label="Truncation Order" value={`${truncationOrder}`} unit="" color="text-white/60" border={false} />
            
            <EquationBlock equation={"C = c\u00B7\u0394t/\u0394x \u2264 1.0"} label="CFL Stability Condition" color="#a855f7" />
            
            {/* CFL stability diagram */}
            <MiniDiagram draw={drawCFL} height={85} />
          </SectionCard>

          {/* B3: FDTD Stencil Visualization */}
          <SectionCard title="FDTD Computational Stencil" icon={Zap} color="#06b6d4">
            <MiniDiagram draw={drawStencil} height={130} />
            <div className="mt-3 space-y-1.5 text-[10px] text-white/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                <span>Current node p<sub>i</sub><sup>n</sup> (known pressure at position i, time n)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500/60 shrink-0" />
                <span>Spatial neighbors p<sub>i\u00B11</sub> (used for \u2207\u00B2p spatial Laplacian)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500/60 shrink-0" />
                <span>Previous time p<sub>i</sub><sup>n-1</sup> (for 2nd-order time marching)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 shrink-0" />
                <span>Next time p<sub>i</sub><sup>n+1</sup> (computed output)</span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ═══ SECTION C: BOUNDARY CONDITIONS ═══════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* C1: PML Absorbing Boundaries */}
          <SectionCard title="PML Absorbing Boundaries" icon={Shield} color="#ef4444">
            <StatRow label="PML Depth" value={`${PML_NODES}`} unit="nodes" color="text-red-400" sub={`${pmlThickness.toFixed(2)} m physical thickness`} />
            <StatRow label="Damping Profile" value="Quadratic" unit="" color="text-red-400" sub={"\u03C3(x) = \u03C3\u2098\u2090\u2093 \u00B7 (d/d\u2098\u2090\u2093)\u00B2"} />
            <StatRow label="Peak Damping (\u03C3\u2098\u2090\u2093)" value={pmlSigmaMax.toFixed(1)} unit="s\u207B\u00B9" color="text-red-400" sub={`25.0 \u00D7 damping(${props.damping.toFixed(2)})`} />
            <StatRow label="Left Boundary" value={props.boundaryL.toUpperCase()} unit="" color="text-white/60" />
            <StatRow label="Right Boundary" value={props.boundaryR.toUpperCase()} unit="" color="text-white/60" border={false} />
            
            {/* PML absorption profile diagram */}
            <div className="mt-3">
              <MiniDiagram draw={drawPML} height={90} />
            </div>
            
            {educLevel !== "advanced" && (
              <div className="mt-3 p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    {educLevel === "beginner" 
                      ? "PML (Perfectly Matched Layer) is a trick to simulate infinite space. Without it, waves would bounce off the edges of the simulation and corrupt results. PML gradually absorbs waves as they enter the boundary zone."
                      : "The PML introduces a complex-valued coordinate stretch that maps outgoing waves to exponentially decaying solutions. The quadratic \u03C3(x) ramp minimizes spurious reflections at the PML interface while providing strong absorption."
                    }
                  </p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* C2: Impedance & Reflection */}
          <SectionCard title="Impedance & Reflection" icon={Activity} color="#f97316">
            <EquationBlock equation={"R = (Z\u2082 \u2212 Z\u2081) / (Z\u2082 + Z\u2081)"} label="Pressure Reflection Coefficient" color="#f97316" />
            
            <StatRow label="Medium 1 Impedance (Z\u2081)" value={Z.toFixed(1)} unit="Rayl" color="text-orange-400" />
            <StatRow label="Impedance Ratio (Z\u2082/Z\u2081)" value={props.impedanceRatio.toFixed(2)} unit="\u00D7" color="text-orange-400" />
            <StatRow label="Medium 2 Impedance (Z\u2082)" value={Z2.toFixed(1)} unit="Rayl" color="text-orange-400" />
            <StatRow label="Reflection Coeff (R)" value={`${R_boundary >= 0 ? "+" : ""}${R_boundary.toFixed(4)}`} unit="" color={R_boundary >= 0 ? "text-orange-400" : "text-cyan-400"} sub={R_boundary > 0 ? "In-phase reflection (rigid)" : R_boundary < 0 ? "Phase-inverted reflection (soft)" : "No reflection (matched)"} />
            <StatRow label="Transmission Coeff (T)" value={T_boundary.toFixed(4)} unit="" color="text-emerald-400" sub="T = 1 + R (pressure)" />
            <StatRow label="Energy Conservation" value={(R_boundary * R_boundary + (Z / Math.max(0.001, Z2)) * T_boundary * T_boundary).toFixed(6)} unit="" color="text-white/50" border={false} sub="R\u00B2 + (Z\u2081/Z\u2082)T\u00B2 = 1" />
            
            {educLevel === "beginner" && (
              <div className="mt-3 p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    When sound hits a boundary between two materials, some energy bounces back (reflection) and some passes through (transmission). 
                    If the second material has higher impedance (like concrete), most sound reflects. If impedances match, sound passes through perfectly.
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ═══ SECTION D: NUMERICAL ACCURACY ═══════════════════════════════════ */}
        <SectionCard title="Numerical Accuracy & Diagnostics" icon={AlertTriangle} color="#eab308" span={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Dispersion */}
            <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl space-y-2">
              <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Numerical Dispersion</div>
              <div className={cn("text-lg font-mono font-bold", dispersionPercent < 1 ? "text-emerald-400" : dispersionPercent < 5 ? "text-amber-400" : "text-red-400")}>
                {dispersionPercent.toFixed(3)}%
              </div>
              <div className="text-[9px] text-white/30 leading-relaxed">
                Phase velocity error {"\u2248"} (k\u0394x){"\u00B2"}/24 = ({kdx.toFixed(4)}){"\u00B2"}/24
              </div>
              {dispersionPercent < 1 && <div className="text-[9px] text-emerald-400/60">Excellent accuracy</div>}
              {dispersionPercent >= 1 && dispersionPercent < 5 && <div className="text-[9px] text-amber-400/60">Acceptable \u2014 increase grid resolution for better accuracy</div>}
              {dispersionPercent >= 5 && <div className="text-[9px] text-red-400/60">Warning: significant numerical dispersion. Reduce \u0394x or lower frequency.</div>}
            </div>

            {/* Resolution */}
            <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl space-y-2">
              <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Wavelength Resolution</div>
              <div className={cn("text-lg font-mono font-bold", resolutionStatus === "stable" ? "text-emerald-400" : resolutionStatus === "warning" ? "text-amber-400" : "text-red-400")}>
                {samplesPerWavelength.toFixed(1)} pts/{"\u03BB"}
              </div>
              <div className="text-[9px] text-white/30 leading-relaxed">
                {"\u03BB"}/{"\u0394"}x = {wavelength.toFixed(4)} / {GRID_DX} m
              </div>
              {samplesPerWavelength >= 20 && <div className="text-[9px] text-emerald-400/60">Well-resolved ({"\u2265"}20 recommended)</div>}
              {samplesPerWavelength >= 10 && samplesPerWavelength < 20 && <div className="text-[9px] text-amber-400/60">Marginally resolved \u2014 consider lower frequency</div>}
              {samplesPerWavelength < 10 && <div className="text-[9px] text-red-400/60">Under-resolved! Spatial aliasing likely.</div>}
            </div>

            {/* Nyquist */}
            <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl space-y-2">
              <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Nyquist Limits</div>
              <div className="text-[11px] font-mono text-white/70 space-y-1">
                <div>Spatial: <span className="text-sky-400">{spatialNyquist.toFixed(1)}</span> <span className="text-[9px] text-white/30">cycles/m</span></div>
                <div>f<sub>max</sub>: <span className="text-sky-400">{maxResolvableFreq.toFixed(0)}</span> <span className="text-[9px] text-white/30">Hz</span></div>
                <div>Temporal: <span className="text-sky-400">{temporalNyquist > 1e6 ? `${(temporalNyquist/1e6).toFixed(1)}M` : temporalNyquist.toFixed(0)}</span> <span className="text-[9px] text-white/30">Hz</span></div>
              </div>
              <div className="text-[9px] text-white/30">
                Source at {props.frequency.toFixed(0)} Hz = {(props.frequency / maxResolvableFreq * 100).toFixed(1)}% of spatial limit
              </div>
            </div>

            {/* Stability */}
            <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl space-y-2">
              <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Solver Stability</div>
              <div className={cn("text-lg font-mono font-bold", cflStatus === "stable" ? "text-emerald-400" : cflStatus === "warning" ? "text-amber-400" : "text-red-400")}>
                {cflStatus === "stable" ? "STABLE" : cflStatus === "warning" ? "CAUTION" : "UNSTABLE"}
              </div>
              <div className="text-[9px] text-white/30 leading-relaxed">
                CFL = {cfl.toFixed(4)} (limit: 1.0)
              </div>
              <div className="text-[9px] text-white/30">
                Margin: {((1 - cfl) * 100).toFixed(1)}% headroom
              </div>
              {cfl > 0.95 && <div className="text-[9px] text-amber-400/60">Near stability limit \u2014 numerical artifacts possible</div>}
            </div>
          </div>
          
          {educLevel !== "advanced" && (
            <div className="mt-4 p-3 bg-black/40 border border-white/[0.04] rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/40 leading-relaxed">
                  {educLevel === "beginner" 
                    ? "The computer breaks continuous space and time into tiny grid cells. If the cells are too large compared to the wavelength, the simulation becomes inaccurate (dispersion). If the timestep is too large relative to the grid spacing, the simulation becomes unstable and \"blows up\" (CFL violation)."
                    : "The 2nd-order FDTD scheme introduces numerical dispersion proportional to (k\u0394x)\u00B2/24 and requires C = c\u0394t/\u0394x \u2264 1 for von Neumann stability. At least 10\u201320 grid points per wavelength are recommended for <1% phase error. The PML boundary adds additional artificial damping that must be calibrated against physical attenuation."
                  }
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ═══ SECTION E: MEDIUM COMPARISON ═══════════════════════════════════ */}
        <SectionCard title="Medium Comparison Reference" icon={BookOpen} color="#8b5cf6" span={3}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-white/30 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2.5 px-3">Medium</th>
                  <th className="py-2.5 px-3 text-right">{"\u03C1"} (kg/m{"\u00B3"})</th>
                  <th className="py-2.5 px-3 text-right">c (m/s)</th>
                  <th className="py-2.5 px-3 text-right">Z (Rayl)</th>
                  <th className="py-2.5 px-3 text-right">B (kPa)</th>
                  <th className="py-2.5 px-3 text-right">{"\u03BB"} at {props.frequency.toFixed(0)} Hz</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Air (20\u00B0C)", rho: 1.2, c_val: 343, highlight: Math.abs(props.density - 1.2) < 0.1 },
                  { name: "Cold Air (0\u00B0C)", rho: 1.29, c_val: 331, highlight: false },
                  { name: "Helium", rho: 0.18, c_val: 972, highlight: Math.abs(props.density - 0.18) < 0.05 },
                  { name: "Water", rho: 1000, c_val: 1482, highlight: Math.abs(props.density - 1000) < 10 },
                  { name: "Steel", rho: 7800, c_val: 5960, highlight: false },
                  { name: "Rubber", rho: 1100, c_val: 54, highlight: false },
                ].map((med) => {
                  const mZ = med.rho * med.c_val;
                  const mB = med.rho * med.c_val * med.c_val;
                  const mLambda = med.c_val / Math.max(1, props.frequency);
                  return (
                    <tr key={med.name} className={cn(
                      "border-t border-white/[0.04] transition-colors",
                      med.highlight ? "bg-primary/5 text-white" : "text-white/60 hover:bg-white/[0.02]"
                    )}>
                      <td className={cn("py-2.5 px-3 font-bold", med.highlight && "text-primary")}>{med.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{med.rho.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{med.c_val.toFixed(0)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{mZ >= 1e6 ? `${(mZ / 1e6).toFixed(2)}M` : mZ.toFixed(0)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{mB >= 1e6 ? `${(mB / 1e6).toFixed(0)}M` : `${(mB / 1e3).toFixed(0)}`}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{mLambda >= 1 ? `${mLambda.toFixed(2)} m` : `${(mLambda * 100).toFixed(1)} cm`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
};

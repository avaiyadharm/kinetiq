import React, { useState } from "react";
import { 
  BookOpen, HelpCircle, AlertTriangle, ShieldAlert, CheckCircle, Copy, Info, 
  Settings2, Activity, Zap, FileText, ChevronRight, Check
} from "lucide-react";

// ─── Mathematical Typesetting Components (HTML/CSS) ──────────────────────────
const Frac: React.FC<{ num: React.ReactNode; den: React.ReactNode }> = ({ num, den }) => (
  <span className="inline-flex flex-col items-center align-middle mx-1 font-serif">
    <span className="border-b border-white/20 pb-0.5 px-1.5 text-center text-[11px] md:text-xs text-white/95">{num}</span>
    <span className="pt-0.5 px-1.5 text-center text-[11px] md:text-xs text-white/90">{den}</span>
  </span>
);

const Sqrt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center font-serif text-white/95">
    <span className="text-xs md:text-sm font-light leading-none -mr-0.5">√</span>
    <span className="border-t border-white/20 pt-0.5 px-1 text-[11px] md:text-xs">{children}</span>
  </span>
);

const Var: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-serif italic text-white/95 mx-0.5 select-none">{children}</span>
);

const Dot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block relative">
    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold select-none leading-none">.</span>
    {children}
  </span>
);

const DDot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block relative">
    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-bold select-none leading-none">..</span>
    {children}
  </span>
);

const EqBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-center items-center p-3 my-2 bg-black/40 rounded-xl border border-white/5 font-mono text-emerald-400 text-xs md:text-sm overflow-x-auto shadow-inner">
    {children}
  </div>
);

// ─── SVG Interactive Telemetry Visualizers ───────────────────────────────────

// Lab 1 Phasor Diagram
const PhasorSVG: React.FC<{
  mass: number;
  springK: number;
  dampingB: number;
  driverFreq: number;
  driverAmp: number;
}> = ({ mass, springK, dampingB, driverFreq, driverAmp }) => {
  const m = Math.max(0.01, mass);
  const k = Math.max(0.01, springK);
  const b = Math.max(0, dampingB);
  const wd = 2 * Math.PI * driverFreq;
  
  const phi = Math.atan2(b * wd, k - m * wd * wd);
  
  const cx = 100;
  const cy = 100;
  const len = 70;
  
  const fx = cx + len;
  const fy = cy;
  
  const dx = cx + len * Math.cos(-phi);
  const dy = cy - len * Math.sin(-phi);
  
  const vx = cx + len * 0.8 * Math.cos(Math.PI / 2 - phi);
  const vy = cy - len * 0.8 * Math.sin(Math.PI / 2 - phi);

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 font-mono">Dynamic Phasor State</h5>
      <svg width="200" height="200" className="overflow-visible">
        <circle cx={cx} cy={cy} r={len} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
        <circle cx={cx} cy={cy} r={len * 0.5} fill="none" stroke="rgba(255,255,255,0.02)" />
        
        <line x1={cx - 90} y1={cy} x2={cx + 90} y2={cy} stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
        <line x1={cx} y1={cy - 90} x2={cx} y2={cy + 90} stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
        
        {phi > 0.05 && (
          <path
            d={`M ${cx + 20} ${cy} A 20 20 0 0 1 ${cx + 20 * Math.cos(-phi)} ${cy - 20 * Math.sin(-phi)}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />
        )}
        
        <line x1={cx} y1={cy} x2={fx} y2={fy} stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
        <line x1={cx} y1={cy} x2={dx} y2={dy} stroke="#06b6d4" strokeWidth="2.5" markerEnd="url(#arrow-blue)" />
        <line x1={cx} y1={cy} x2={vx} y2={vy} stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
        
        <defs>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
          </marker>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
          </marker>
          <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
          </marker>
        </defs>
        
        <text x={fx + 5} y={fy + 4} fill="#ef4444" className="text-[10px] font-bold font-mono">F₀</text>
        <text x={dx + 5} y={dy - 5} fill="#06b6d4" className="text-[10px] font-bold font-mono">X₀</text>
        <text x={vx + 5} y={vy - 5} fill="#10b981" className="text-[10px] font-bold font-mono">V₀</text>
        <text x={cx + 25} y={cy - 10} fill="#f59e0b" className="text-[9px] font-bold font-mono">φ = {((phi * 180) / Math.PI).toFixed(0)}°</text>
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[9px] text-white/50 text-center font-mono w-full">
        <div><span className="inline-block w-2 h-2 bg-red-500 rounded-sm mr-1"></span>Force (F)</div>
        <div><span className="inline-block w-2 h-2 bg-cyan-500 rounded-sm mr-1"></span>Displ. (x)</div>
        <div><span className="inline-block w-2 h-2 bg-emerald-500 rounded-sm mr-1"></span>Velocity (v)</div>
      </div>
    </div>
  );
};

// Lab 2 Lorentzian Curve
const LorentzianSVG: React.FC<{
  mass: number;
  springK: number;
  dampingB: number;
  driverAmp: number;
  driverFreq: number;
}> = ({ mass, springK, dampingB, driverAmp, driverFreq }) => {
  const m = Math.max(0.01, mass);
  const k = Math.max(0.01, springK);
  const b = Math.max(0.001, dampingB);
  const F0 = driverAmp;

  const width = 240;
  const height = 120;
  const maxF = 4.5;
  
  const w0 = Math.sqrt(k / m);
  const beta = b / (2 * m);
  const w_r_sq = w0 * w0 - 2 * beta * beta;
  const f_r = w_r_sq > 0 ? Math.sqrt(w_r_sq) / (2 * Math.PI) : 0;
  
  const w_r_val = f_r > 0 ? 2 * Math.PI * f_r : 0.01;
  const peak_denom = Math.sqrt(Math.pow(k - m * w_r_val * w_r_val, 2) + Math.pow(b * w_r_val, 2));
  const maxAmp = F0 / peak_denom;
  
  let pathD = "";
  const points = 100;
  for (let i = 0; i <= points; i++) {
    const f = (i / points) * maxF;
    const w = 2 * Math.PI * f;
    const d = Math.sqrt(Math.pow(k - m * w * w, 2) + Math.pow(b * w, 2));
    const amp = F0 / d;
    
    const x = (f / maxF) * width;
    const y = height - (amp / Math.max(1e-4, maxAmp)) * (height - 20) - 10;
    
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  }

  const cur_w = 2 * Math.PI * driverFreq;
  const cur_d = Math.sqrt(Math.pow(k - m * cur_w * cur_w, 2) + Math.pow(b * cur_w, 2));
  const cur_amp = F0 / cur_d;
  const dotX = (driverFreq / maxF) * width;
  const dotY = height - (cur_amp / Math.max(1e-4, maxAmp)) * (height - 20) - 10;

  const f0 = w0 / (2 * Math.PI);
  const Q = Math.sqrt(m * k) / b;
  const bw = f0 / Q;
  const f1 = f0 - bw / 2;
  const f2 = f0 + bw / 2;

  const f1X = (f1 / maxF) * width;
  const f2X = (f2 / maxF) * width;
  const halfPowerY = height - ((maxAmp / Math.sqrt(2)) / Math.max(1e-4, maxAmp)) * (height - 20) - 10;

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 font-mono">Lorentzian Sweep & Bandwidth</h5>
      <svg width={width} height={height} className="overflow-visible">
        <line x1={0} y1={height - 10} x2={width} y2={height - 10} stroke="rgba(255,255,255,0.1)" />
        <line x1={0} y1={10} x2={0} y2={height - 10} stroke="rgba(255,255,255,0.1)" />
        
        {Q > 1.5 && (
          <>
            <line x1={Math.max(0, f1X)} y1={halfPowerY} x2={Math.min(width, f2X)} y2={halfPowerY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
            <text x={Math.max(5, f1X - 10)} y={halfPowerY - 4} fill="#f59e0b" className="text-[8px] font-mono">f₁</text>
            <text x={Math.min(width - 15, f2X + 2)} y={halfPowerY - 4} fill="#f59e0b" className="text-[8px] font-mono">f₂</text>
          </>
        )}

        <line x1={(f0 / maxF) * width} y1={10} x2={(f0 / maxF) * width} y2={height - 10} stroke="rgba(255,255,255,0.1)" strokeDasharray="2,2" />
        
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />
        
        {driverFreq <= maxF && (
          <circle cx={dotX} cy={dotY} r="4" fill="#ef4444" stroke="white" strokeWidth="1" />
        )}
        
        <text x={(f0 / maxF) * width + 4} y="18" fill="rgba(255,255,255,0.4)" className="text-[8px] font-mono">f₀ = {f0.toFixed(2)}Hz</text>
      </svg>
      <div className="mt-2 text-[9px] text-white/50 text-center font-mono w-full flex justify-between">
        <span>0 Hz</span>
        <span className="text-amber-400 font-bold">Active: {driverFreq.toFixed(2)} Hz</span>
        <span>{maxF} Hz</span>
      </div>
    </div>
  );
};

// Lab 3 Energy Flow
const EnergyFlowSVG: React.FC<{
  mass: number;
  springK: number;
  dampingB: number;
  driverAmp: number;
  driverFreq: number;
}> = ({ mass, springK, dampingB, driverAmp, driverFreq }) => {
  const m = Math.max(0.01, mass);
  const k = Math.max(0.01, springK);
  const b = Math.max(0, dampingB);
  const F0 = driverAmp;
  const wd = 2 * Math.PI * driverFreq;

  const denom = Math.sqrt(Math.pow(k - m * wd * wd, 2) + Math.pow(b * wd, 2));
  const A = denom > 0 ? F0 / denom : 0;
  const phi = Math.atan2(b * wd, k - m * wd * wd);

  const Pin = 0.5 * F0 * A * wd * Math.sin(phi);
  const Pdiss = 0.5 * b * wd * wd * A * A;
  
  const KE_max = 0.5 * m * wd * wd * A * A;
  const PE_max = 0.5 * k * A * A;
  const maxVal = Math.max(0.01, KE_max + PE_max);

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5 w-full">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">Energy & Dissipation Flow</h5>
      
      <div className="space-y-2 w-full text-xs font-mono mb-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-white/40">
            <span>Peak Potential Energy (<Var>PE</Var><sub>max</sub>)</span>
            <span className="text-cyan-400 font-bold">{PE_max.toFixed(3)} J</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full transition-all" style={{ width: `${Math.min(100, (PE_max / maxVal) * 100)}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-white/40">
            <span>Peak Kinetic Energy (<Var>KE</Var><sub>max</sub>)</span>
            <span className="text-emerald-400 font-bold">{KE_max.toFixed(3)} J</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(100, (KE_max / maxVal) * 100)}%` }} />
          </div>
        </div>
      </div>

      <svg width="220" height="80" className="overflow-visible">
        <rect x="5" y="15" width="50" height="40" rx="6" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="1" />
        <text x="30" y="32" fill="#f59e0b" textAnchor="middle" className="text-[9px] font-bold font-mono">DRIVER</text>
        <text x="30" y="46" fill="#f59e0b" textAnchor="middle" className="text-[8px] font-mono">{Pin.toFixed(2)} W</text>

        <line x1="55" y1="35" x2="105" y2="35" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-orange)" />
        
        <rect x="110" y="15" width="50" height="40" rx="6" fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1" />
        <text x="135" y="32" fill="#3b82f6" textAnchor="middle" className="text-[9px] font-bold font-mono">SYSTEM</text>
        <text x="135" y="46" fill="#3b82f6" textAnchor="middle" className="text-[8px] font-mono">E_tot</text>

        <path d="M 135 55 Q 135 75 170 75" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow-red-small)" />
        
        <rect x="175" y="55" width="40" height="22" rx="4" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1" />
        <text x="195" y="68" fill="#ef4444" textAnchor="middle" className="text-[8px] font-bold font-mono">HEAT</text>

        <defs>
          <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
          </marker>
          <marker id="arrow-red-small" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
          </marker>
        </defs>
        
        <text x="80" y="27" fill="#f59e0b" textAnchor="middle" className="text-[8px] font-mono">P_in</text>
        <text x="155" y="70" fill="#ef4444" textAnchor="start" className="text-[8px] font-mono">P_diss: {Pdiss.toFixed(2)}W</text>
      </svg>
    </div>
  );
};

// Lab 4 Coupled Splitting
const CoupledModesSVG: React.FC<{
  mass: number;
  springK: number;
  couplingK: number;
  mass2: number;
  springK2: number;
}> = ({ mass, springK, couplingK, mass2, springK2 }) => {
  const m1 = Math.max(0.01, mass);
  const m2 = Math.max(0.01, mass2);
  const k1 = Math.max(0.01, springK);
  const k2 = Math.max(0.01, springK2);
  const kc = couplingK;

  const A_q = m1 * m2;
  const B_q = -(m1 * (k2 + kc) + m2 * (k1 + kc));
  const C_q = (k1 + kc) * (k2 + kc) - kc * kc;
  const disc = B_q * B_q - 4 * A_q * C_q;
  let lambda1 = 0, lambda2 = 0;
  if (disc >= 0) {
    lambda1 = (-B_q - Math.sqrt(disc)) / (2 * A_q);
    lambda2 = (-B_q + Math.sqrt(disc)) / (2 * A_q);
  }
  const f_sym = Math.sqrt(Math.max(0, lambda1)) / (2 * Math.PI);
  const f_asym = Math.sqrt(Math.max(0, lambda2)) / (2 * Math.PI);

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5 w-full">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">Mode Splitting Spectrum</h5>
      <svg width="220" height="90" className="overflow-visible">
        <path d="M 10 80 Q 50 80 60 70 T 80 20 T 100 75 Q 120 80 130 80 T 150 20 T 170 80 T 210 80" fill="none" stroke="#8b5cf6" strokeWidth="2" />
        
        <line x1="80" y1="20" x2="80" y2="80" stroke="rgba(255,255,255,0.15)" strokeDasharray="2,2" />
        <line x1="150" y1="20" x2="150" y2="80" stroke="rgba(255,255,255,0.15)" strokeDasharray="2,2" />
        
        <text x="80" y="14" fill="#a78bfa" textAnchor="middle" className="text-[8px] font-mono">f_sym: {f_sym.toFixed(2)}Hz</text>
        <text x="150" y="14" fill="#a78bfa" textAnchor="middle" className="text-[8px] font-mono">f_asym: {f_asym.toFixed(2)}Hz</text>
        <text x="115" y="55" fill="rgba(255,255,255,0.4)" textAnchor="middle" className="text-[7px] font-mono">Splitting: {(f_asym - f_sym).toFixed(2)}Hz</text>
        
        <line x1="10" y1="80" x2="210" y2="80" stroke="rgba(255,255,255,0.2)" />
      </svg>
    </div>
  );
};

// Lab 5 Duffing Peak Bending
const DuffingHysteresisSVG: React.FC<{
  duffingAlpha: number;
  springK: number;
  mass: number;
}> = ({ duffingAlpha, springK, mass }) => {
  const alpha = duffingAlpha;
  const k = springK;
  const m = mass;
  
  let bend = "right";
  if (alpha < 0) bend = "left";
  if (alpha === 0) bend = "none";
  
  let pathD = "";
  if (bend === "right") {
    pathD = "M 15 80 C 60 80, 80 75, 100 60 C 120 45, 170 15, 170 30 C 170 45, 130 80, 130 80 C 130 80, 110 80, 205 80";
  } else if (bend === "left") {
    pathD = "M 15 80 C 15 80, 90 80, 50 30 C 50 15, 100 45, 120 60 C 140 75, 160 80, 205 80";
  } else {
    pathD = "M 15 80 Q 90 80 110 20 Q 130 80 205 80";
  }

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5 w-full">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">Resonance Bending (Jump)</h5>
      <svg width="220" height="90" className="overflow-visible">
        {bend === "right" && (
          <path d="M 170 30 C 150 50, 130 80, 130 80" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
        )}
        {bend === "left" && (
          <path d="M 50 30 C 70 50, 120 60, 120 60" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
        )}

        <path d={pathD} fill="none" stroke="#ec4899" strokeWidth="2" />
        
        {bend === "right" && (
          <>
            <path d="M 170 32 L 170 78" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrow-red-down)" />
            <text x="174" y="55" fill="#ef4444" className="text-[7px] font-mono">Jump Down</text>
            
            <path d="M 130 78 L 130 52" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#arrow-green-up)" />
            <text x="96" y="65" fill="#10b981" className="text-[7px] font-mono">Jump Up</text>
          </>
        )}

        <defs>
          <marker id="arrow-red-down" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 5 10 L 0 0 L 10 0 z" fill="#ef4444" />
          </marker>
          <marker id="arrow-green-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M 5 0 L 0 10 L 10 10 z" fill="#10b981" />
          </marker>
        </defs>

        <line x1="15" y1="80" x2="205" y2="80" stroke="rgba(255,255,255,0.2)" />
      </svg>
    </div>
  );
};

// Lab 6 Mathieu Stability
const MathieuStabilitySVG: React.FC<{
  parametricEpsilon: number;
  driverFreq: number;
  mass: number;
  springK: number;
}> = ({ parametricEpsilon, driverFreq, mass, springK }) => {
  const epsilon = parametricEpsilon;
  const m = Math.max(0.01, mass);
  const k = Math.max(0.01, springK);
  
  const f0 = Math.sqrt(k / m) / (2 * Math.PI);
  const ratio = driverFreq / (2 * f0);
  
  const width = 220;
  const height = 90;
  
  const dotX = 110 * ratio;
  const dotY = 80 - epsilon * 100;
  
  const tonguePath = "M 110 80 L 88 15 L 132 15 Z";
  const isUnstable = epsilon > 2 * Math.abs(ratio - 1);

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5 w-full">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">Mathieu Stability Chart</h5>
      <svg width={width} height={height} className="overflow-visible">
        <path d={tonguePath} fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
        
        <line x1="110" y1="10" x2="110" y2="80" stroke="rgba(255,255,255,0.15)" strokeDasharray="2,2" />

        {dotX >= 0 && dotX <= width && dotY >= 0 && dotY <= height && (
          <>
            <circle cx={dotX} cy={dotY} r="4" fill={isUnstable ? "#ef4444" : "#10b981"} stroke="white" strokeWidth="1" />
            <text x={dotX + 6} y={dotY + 3} fill={isUnstable ? "#ef4444" : "#10b981"} className="text-[8px] font-bold font-mono">
              {isUnstable ? "UNSTABLE" : "STABLE"}
            </text>
          </>
        )}

        <line x1="10" y1="80" x2="210" y2="80" stroke="rgba(255,255,255,0.2)" />
        <line x1="10" y1="10" x2="10" y2="80" stroke="rgba(255,255,255,0.2)" />
        
        <text x="210" y="76" fill="rgba(255,255,255,0.5)" textAnchor="end" className="text-[7px] font-mono">Ω/2ω₀</text>
        <text x="15" y="18" fill="rgba(255,255,255,0.5)" className="text-[7px] font-mono">Stiffness Mod (ε)</text>
      </svg>
    </div>
  );
};

// Lab 7 Strange Attractor
const ChaosPhasePortraitSVG: React.FC = () => {
  let pathD = "M 110 45";
  const steps = 100;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 4 * Math.PI;
    const x = 1.3 * Math.sin(t) + 0.4 * Math.cos(2.3 * t) * Math.sin(0.7 * t);
    const y = 1.3 * Math.cos(t) + 0.4 * Math.sin(1.9 * t) * Math.cos(0.9 * t);
    const px = 110 + x * 45;
    const py = 45 - y * 18;
    pathD += ` L ${px} ${py}`;
  }

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5 w-full">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">Lyapunov Attractor Map</h5>
      <svg width="220" height="90" className="overflow-visible">
        <line x1="110" y1="5" x2="110" y2="85" stroke="rgba(255,255,255,0.05)" />
        <line x1="10" y1="45" x2="210" y2="45" stroke="rgba(255,255,255,0.05)" />
        
        <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.75" />
        
        <circle cx="120" cy="40" r="2.5" fill="#f43f5e" />
        <circle cx="121" cy="39" r="2.5" fill="#06b6d4" />
        
        <path d="M 120 40 Q 140 25 170 30" fill="none" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2,2" />
        <path d="M 121 39 Q 130 50 160 70" fill="none" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2,2" />
        
        <circle cx="170" cy="30" r="2.5" fill="#f43f5e" />
        <circle cx="160" cy="70" r="2.5" fill="#06b6d4" />
      </svg>
    </div>
  );
};

// Lab 8 Integrator Conservation
const IntegratorStabilitySVG: React.FC<{
  integrator: string;
}> = ({ integrator }) => {
  const cx = 110;
  const cy = 45;
  
  let eulerPath = `M ${cx + 20} ${cy}`;
  for (let i = 0; i < 90; i++) {
    const t = (i / 90) * 4 * Math.PI;
    const r = 20 + i * 0.35;
    const px = cx + r * Math.cos(t);
    const py = cy + r * Math.sin(t);
    eulerPath += ` L ${px} ${py}`;
  }

  let verletPath = `M ${cx + 30} ${cy}`;
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * 2 * Math.PI;
    const px = cx + 30 * Math.cos(t);
    const py = cy + 25 * Math.sin(t);
    verletPath += ` L ${px} ${py}`;
  }

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-2xl border border-white/5 w-full">
      <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 font-mono">Phase-Space Orbital Drift</h5>
      <svg width="220" height="90" className="overflow-visible">
        <path d={eulerPath} fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.5" />
        <text x="180" y="16" fill="#ef4444" className="text-[6px] font-mono">Euler (Drift)</text>

        <path d={verletPath} fill="none" stroke="#10b981" strokeWidth="2" />
        <text x="120" y="55" fill="#10b981" className="text-[6px] font-mono font-bold">Verlet (Symplectic)</text>
        
        <circle cx={cx} cy={cy} r="2" fill="white" />
      </svg>
    </div>
  );
};


// ─── Props Interface ──────────────────────────────────────────────────────────
interface ResonanceGuideProps {
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

export const ResonanceGuide: React.FC<ResonanceGuideProps> = ({
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
  const [activeLab, setActiveLab] = useState<string>("lab1");

  // State for Interactive Lab Report
  const [studentName, setStudentName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [measuredFreq, setMeasuredFreq] = useState("");
  const [measuredAmp, setMeasuredAmp] = useState("");
  const [measuredPhase, setMeasuredPhase] = useState("");
  const [measuredBandwidth, setMeasuredBandwidth] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  // Synchronized analytical theory calculations
  const m1 = Math.max(0.01, mass);
  const k1 = Math.max(0.01, springK);
  const b1 = Math.max(0, dampingB);
  const F0 = driverAmp;
  const f_d = driverFreq;
  const w_d = 2 * Math.PI * f_d;

  const w0 = Math.sqrt(k1 / m1);
  const f0_theo = w0 / (2 * Math.PI);
  const beta = b1 / (2 * m1);
  const dampingRatio = beta / w0;

  // Damped resonance peak
  const w_r_sq = w0 * w0 - 2 * beta * beta;
  const f_r_theo = w_r_sq > 0 ? Math.sqrt(w_r_sq) / (2 * Math.PI) : 0;

  // Amplitude
  const denom = Math.sqrt(Math.pow(k1 - m1 * w_d * w_d, 2) + Math.pow(b1 * w_d, 2));
  const A_theo = denom > 0 ? F0 / denom : 0;

  // Phase lag
  const phi_rad = Math.atan2(b1 * w_d, k1 - m1 * w_d * w_d);
  const phi_deg = (phi_rad * 180) / Math.PI;

  // Q and bandwidth
  const Q_theo = b1 > 0 ? Math.sqrt(m1 * k1) / b1 : Infinity;
  const bw_theo = Q_theo > 0 && Q_theo !== Infinity ? f0_theo / Q_theo : 0;

  // Eigenfrequencies for coupled
  const m2_val = Math.max(0.01, mass2);
  const k2_val = Math.max(0.01, springK2);
  const kc_val = couplingK;
  const A_q = m1 * m2_val;
  const B_q = -(m1 * (k2_val + kc_val) + m2_val * (k1 + kc_val));
  const C_q = (k1 + kc_val) * (k2_val + kc_val) - kc_val * kc_val;
  const disc = B_q * B_q - 4 * A_q * C_q;
  let lambda1 = 0, lambda2 = 0;
  if (disc >= 0) {
    lambda1 = (-B_q - Math.sqrt(disc)) / (2 * A_q);
    lambda2 = (-B_q + Math.sqrt(disc)) / (2 * A_q);
  }
  const f_mode1_theo = Math.sqrt(Math.max(0, lambda1)) / (2 * Math.PI);
  const f_mode2_theo = Math.sqrt(Math.max(0, lambda2)) / (2 * Math.PI);

  const labs = [
    { id: "lab1", title: "Lab 1: Phase Lag Dynamics", icon: Zap },
    { id: "lab2", title: "Lab 2: Spectroscopy & Q", icon: Activity },
    { id: "lab3", title: "Lab 3: Energy Flow Rates", icon: FileText },
    { id: "lab4", title: "Lab 4: Coupled Normal Modes", icon: Settings2 },
    { id: "lab5", title: "Lab 5: Duffing Nonlinearity", icon: HelpCircle },
    { id: "lab6", title: "Lab 6: Parametric Mathieu", icon: BookOpen },
    { id: "lab7", title: "Lab 7: Strange Attractors", icon: AlertTriangle },
    { id: "lab8", title: "Lab 8: Integrator Errors", icon: ShieldAlert },
    { id: "report", title: "Interactive Lab Report", icon: CheckCircle },
  ];

  const handleVerify = () => {
    const measF = parseFloat(measuredFreq);
    const measA = parseFloat(measuredAmp);
    const measP = parseFloat(measuredPhase);
    const measB = parseFloat(measuredBandwidth);

    let errors: any = {};
    let activeLabTheoF = f_r_theo > 0 ? f_r_theo : f0_theo;
    if (simMode === "coupled") {
      activeLabTheoF = f_mode1_theo;
    }

    if (!isNaN(measF)) {
      errors.freq = (Math.abs(measF - activeLabTheoF) / activeLabTheoF) * 100;
    }
    if (!isNaN(measA)) {
      errors.amp = (Math.abs(measA - A_theo) / Math.max(1e-4, A_theo)) * 100;
    }
    if (!isNaN(measP)) {
      errors.phase = (Math.abs(measP - phi_deg) / Math.max(1e-4, phi_deg)) * 100;
    }
    if (!isNaN(measB) && bw_theo > 0) {
      errors.bw = (Math.abs(measB - bw_theo) / bw_theo) * 100;
    }

    let avgError = 0;
    let count = 0;
    Object.keys(errors).forEach(k => {
      avgError += errors[k];
      count++;
    });
    const finalAvg = count > 0 ? avgError / count : 0;

    let grade = "C (Significant Deviation)";
    let style = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    if (finalAvg < 1) {
      grade = "A+ (Outstanding Experimental Precision)";
      style = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    } else if (finalAvg < 5) {
      grade = "A (High Precision Research Work)";
      style = "text-teal-400 bg-teal-500/10 border-teal-500/20";
    } else if (finalAvg < 15) {
      grade = "B (Acceptable Experimental Precision)";
      style = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }

    setVerificationResult({
      errors,
      avg: finalAvg,
      grade,
      style,
      theoF: activeLabTheoF,
      theoA: A_theo,
      theoP: phi_deg,
      theoB: bw_theo
    });
  };

  const handleExport = () => {
    const text = `# SCIENTIFIC LABORATORY REPORT: RESONANCE & OSCILLATIONS
**Date**: ${reportDate || new Date().toLocaleDateString()}
**Investigator**: ${studentName || "Anonymous Researcher"}
**Oscillatory Mode**: ${simMode.toUpperCase()}
**Solver Method**: ${integrator.toUpperCase()} (Δt = ${timeStep}s, Substeps = ${substeps})

## 1. Experimental Objectives
- Verify forced, coupled, or nonlinear resonance equations of motion.
- Quantify energy flows and phase lags across active driving frequencies.
- Evaluate numerical integrator drift and truncation limits.

## 2. Controlled Environment (Simulation Parameters)
- Primary Mass (m₁): ${m1.toFixed(2)} kg
- Primary Spring (k₁): ${k1.toFixed(2)} N/m
- Damping Coefficient (b₁): ${b1.toFixed(2)} N s/m
- Natural Frequency (f₀): ${f0_theo.toFixed(3)} Hz
- Drive Force (F₀): ${F0.toFixed(2)} N
- Drive Frequency (f_d): ${f_d.toFixed(3)} Hz

## 3. Experimental Measurements
- Measured Resonance Frequency: ${measuredFreq || "N/A"} Hz (Theoretical: ${(verificationResult?.theoF || f_r_theo || f0_theo).toFixed(3)} Hz)
- Measured Max Amplitude: ${measuredAmp || "N/A"} m (Theoretical: ${(verificationResult?.theoA || A_theo).toFixed(4)} m)
- Measured Phase Lag: ${measuredPhase || "N/A"}° (Theoretical: ${(verificationResult?.theoP || phi_deg).toFixed(1)}°)
- Measured Bandwidth (Δf): ${measuredBandwidth || "N/A"} Hz (Theoretical: ${(verificationResult?.theoB || bw_theo).toFixed(3)} Hz)

## 4. Uncertainty & Error Analysis
- Average Experimental Relative Error: ${verificationResult ? verificationResult.avg.toFixed(3) + "%" : "Not Calculated"}
- Performance Assessment: ${verificationResult ? verificationResult.grade : "Unverified"}
- Numerical stability safety factor (Δt_crit/Δt): ${((2 / w0) / timeStep).toFixed(2)}

## 5. Physical Discussion & Conclusions
We verified that the driven damped harmonic system exhibits characteristic amplitude peaks and phase shifts. At low driver frequencies, the amplitude is dominated by the spring restoring force, and the displacement vector is in-phase with the driving force. At resonance, the phase angle approaches 90°, indicating a quadrature response where velocity aligns with the forcing engine to maximize instantaneous power injection. Above resonance, inertial forces dominate, and the mass shifts to an anti-phase alignment. Long-term energy conservation was verified by examining numerical drift.
`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 text-white overflow-y-auto h-full px-4 md:px-6 pt-6 font-body-md">
      
      {/* Header */}
      <header className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Interactive Lab Manual & Report System
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
          Experimental Physics <span className="text-blue-400">Laboratory Manual</span>
        </h2>
        <p className="text-sm text-white/50 leading-relaxed max-w-3xl">
          Conduct structured resonance experiments. Analyze physical derivations, perform quantitative measurements, estimate numerical integrator error, and compile professional laboratory reports.
        </p>
      </header>

      {/* Grid Layout for Navigation and Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Deck (4 cols on lg) */}
        <nav className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {labs.map(l => {
            const Icon = l.icon;
            const active = activeLab === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setActiveLab(l.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between shadow-md ${
                  active 
                    ? "bg-blue-500/10 border-blue-500/30 text-white font-bold" 
                    : "bg-[#18181b] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${active ? "bg-blue-500 text-black" : "bg-white/5"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs uppercase tracking-wider font-mono">{l.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </button>
            );
          })}
        </nav>

        {/* Lab Content Sheet (8 cols on lg) */}
        <main className="lg:col-span-8 bg-[#18181b] p-6 md:p-8 rounded-[36px] border border-white/5 shadow-2xl space-y-8">
          
          {/* LAB 1: PHASE LAG DYNAMICS */}
          {activeLab === "lab1" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <Zap className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 1: Phase Lag & Amplitude Resonance Dynamics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Observe the phase angle transition between forced excitation and displacement, verify the quadrature relationship at resonance, and calculate amplitude scaling.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>The phase shift <Var>&phi;</Var> between displacement and forcing harmonic is governed by friction <Var>b</Var>, spring rate <Var>k</Var>, and mass <Var>m</Var> at drive speed <Var>&omega;</Var>:</p>
                    <EqBox>
                      <span>tan(<Var>&phi;</Var>) = <Frac num={<><Var>b</Var><Var>&omega;</Var></>} den={<><Var>k</Var> - <Var>m</Var><Var>&omega;</Var><sup>2</sup></>} /></span>
                    </EqBox>
                    <p className="mt-1">Stiffness dominates at low frequency (in-phase, <Var>&phi;</Var> &rarr; 0&deg;), inertia dominates at high frequency (anti-phase, <Var>&phi;</Var> &rarr; 180&deg;), and damping regulates the amplitude at resonance (quadrature, <Var>&phi;</Var> = 90&deg;).</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Single Oscillator</li>
                      <li>Solver: Velocity Verlet (<Var>&Delta;t</Var> = 0.01 s)</li>
                      <li>SI Coordinates: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m</li>
                      <li>Damping: <Var>b</Var> = 0.50 N s/m (Weak regime)</li>
                      <li>Forcing: <Var>F</Var><sub>0</sub> = 10.00 N</li>
                      <li>Initial Conditions: <Var>x</Var><sub>0</sub> = 0.00 m, <Var>v</Var><sub>0</sub> = 0.00 m/s</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <PhasorSVG mass={mass} springK={springK} dampingB={dampingB} driverFreq={driverFreq} driverAmp={driverAmp} />
                  
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[11px] font-mono space-y-1">
                    <span className="text-blue-400 font-bold block mb-1">Active Targets (SI Units)</span>
                    <div>• Natural Frequency (<Var>f</Var><sub>0</sub>): <strong>{f0_theo.toFixed(3)} Hz</strong></div>
                    <div>• Resonant Peak (<Var>f</Var><sub>r</sub>): <strong>{f_r_theo.toFixed(3)} Hz</strong></div>
                    <div>• Predicted Phase (<Var>&phi;</Var>): <strong>{phi_deg.toFixed(1)}&deg;</strong></div>
                    <div>• Steady Amplitude (<Var>A</Var>): <strong>{A_theo.toFixed(4)} m</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load parameters. Switch simulation view to the **Phasor Diagram**.</li>
                    <li>Set drive frequency to 0.50 Hz. Let transients decay, and measure the angle between driver and mass vectors.</li>
                    <li>Increase frequency slowly to the natural frequency <Var>f</Var><sub>0</sub> = {f0_theo.toFixed(2)} Hz. Record the phase angle.</li>
                    <li>Sweep to 3.50 Hz. Note the anti-phase rotation.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Record the displacement amplitude and phase lag at <Var>f</Var> = 0.50 Hz, <Var>f</Var><sub>0</sub> = {f0_theo.toFixed(2)} Hz, and 3.50 Hz. Submit values to the Report Console.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>At resonance, the velocity aligns with the driver vector. Damping limits the peak amplitude. At high speeds, inertia prevents the mass from keeping up with the driver, causing it to lag by 180&deg;.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>Calculate the phase lag analytically using: <Var>&phi;</Var> = atan2(<Var>b</Var><Var>&omega;</Var>, <Var>k</Var> - <Var>m</Var><Var>&omega;</Var><sup>2</sup>). Note how <Var>&phi;</Var> shifts exactly to 90&deg; at <Var>&omega;</Var> = <Sqrt><Frac num={<Var>k</Var>} den={<Var>m</Var>} /></Sqrt>.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>In practice, measurement before transients completely decay yields transient error. Damping decay period <Var>&tau;</Var> = <Frac num={<>2<Var>m</Var></>} den={<Var>b</Var>} />. Wait at least 10<Var>&tau;</Var> (40 seconds for <Var>b</Var> = 0.5) to achieve 99.9% decay.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>Velocity Verlet provides excellent phase preservation. Check if Explicit Euler exhibits artificial phase-space inflation.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Bridges and structural beams are designed to avoid 90&deg; resonance phase alignment to prevent catastrophically high energy injection rates.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 2: SPECTROSCOPY & BANDWIDTH */}
          {activeLab === "lab2" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <Activity className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 2: Resonance Spectroscopy & Q-Factor Measurement
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Map the resonance response curve, identify half-power spectral bandwidth (FWHM), and calculate the quality factor Q.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>The Quality Factor <Var>Q</Var> defines the selectivity and energy retention of the system. In terms of bandwidth <Var>&Delta;f</Var> at amplitude <Frac num={<><Var>A</Var><sub>max</sub></>} den={<Sqrt>2</Sqrt>} />:</p>
                    <EqBox>
                      <span><Var>Q</Var> = <Frac num={<><Var>f</Var><sub>0</sub></>} den={<><Var>&Delta;f</Var></>} /> = <Frac num={<Sqrt><Var>m</Var><Var>k</Var></Sqrt>} den={<Var>b</Var>} /></span>
                    </EqBox>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Single Oscillator</li>
                      <li>Parameters: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m</li>
                      <li>Damping: <Var>b</Var> = 0.10 N s/m (High-<Var>Q</Var> regime)</li>
                      <li>Initial Conditions: Zero state</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <LorentzianSVG mass={mass} springK={springK} dampingB={dampingB} driverAmp={driverAmp} driverFreq={driverFreq} />
                  
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[11px] font-mono space-y-1">
                    <span className="text-blue-400 font-bold block mb-1">Active Targets</span>
                    <div>• Analytical <Var>Q</Var>-Factor: <strong>{Q_theo === Infinity ? "∞" : Q_theo.toFixed(1)}</strong></div>
                    <div>• Bandwidth (<Var>&Delta;f</Var>): <strong>{bw_theo.toFixed(4)} Hz</strong></div>
                    <div>• Peak Amplitude (<Var>A</Var><sub>max</sub>): <strong>{A_theo.toFixed(4)} m</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load high-<Var>Q</Var> preset parameter settings.</li>
                    <li>Slowly sweep driving frequency from 0.80 Hz to 1.30 Hz in steps of 0.02 Hz.</li>
                    <li>Identify the maximum amplitude peak at resonance.</li>
                    <li>Calculate half-power points at <Var>A</Var><sub>peak</sub> &times; 0.707. Determine the two frequencies <Var>f</Var><sub>1</sub> and <Var>f</Var><sub>2</sub> corresponding to this amplitude.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Measure the peak frequency, bandwidth width, and damping factor. Put these variables in the Lab Report.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>Lower friction coefficient increases energy accumulation, which narrows the peak and sharpens the resonance selectivity.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>Verify that <Var>Q</Var> = <Frac num={<Sqrt><Var>m</Var><Var>k</Var></Sqrt>} den={<Var>b</Var>} />. For low damping, <Var>f</Var><sub>r</sub> is nearly identical to natural frequency <Var>f</Var><sub>0</sub>.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>If you sweep too quickly, transient delay distorts the shape of the peak (causing it to look shifted and lower). This is called the frequency sweep rate error.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>High-<Var>Q</Var> systems require fine resolution. If timestep <Var>&Delta;t</Var> is too large, the peak may be missed due to discretization gaps.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Tuning forks and quartz crystals are built with extremely high Q-factors (~10,000) to maintain extremely precise timing accuracy.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 3: ENERGY FLOW RATES */}
          {activeLab === "lab3" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 3: Thermodynamic Energy Flow Rates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Quantify kinetic and potential energy oscillation, measure average driver power injection, and verify thermal energy conservation.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>Conservation of energy dictates exchange between potential <Var>PE</Var> and kinetic <Var>KE</Var> reservoirs, while friction dissipates thermal power <Var>P</Var><sub>diss</sub>:</p>
                    <EqBox>
                      <span>
                        <Var>KE</Var> = <Frac num="1" den="2" /><Var>m</Var><Var>v</Var><sup>2</sup>
                        <span className="mx-4 text-white/30">|</span>
                        <Var>PE</Var> = <Frac num="1" den="2" /><Var>k</Var><Var>x</Var><sup>2</sup>
                        <span className="mx-4 text-white/30">|</span>
                        <Var>P</Var><sub>diss</sub> = <Var>b</Var><Var>v</Var><sup>2</sup>
                      </span>
                    </EqBox>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Single Oscillator</li>
                      <li>Parameters: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m</li>
                      <li>Damping: <Var>b</Var> = 1.00 N s/m, <Var>F</Var><sub>0</sub> = 10.00 N</li>
                      <li>Drive Speed: <Var>f</Var><sub>d</sub> = <Var>f</Var><sub>0</sub> (Exact resonance)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <EnergyFlowSVG mass={mass} springK={springK} dampingB={dampingB} driverFreq={driverFreq} driverAmp={driverAmp} />
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Select Single mode. Drive exactly at resonance (<Var>f</Var><sub>d</sub> = <Var>f</Var><sub>0</sub>).</li>
                    <li>Observe the Energy bar graph. Pause when displacement <Var>x</Var> is maximum. Record <Var>KE</Var> and <Var>PE</Var>.</li>
                    <li>Observe average power dissipation telemetry <Var>P</Var><sub>diss</sub> at steady state.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Measure maximum kinetic and potential energy values. Verify that total energy matches <Var>E</Var> = <Var>PE</Var><sub>max</sub> = <Var>KE</Var><sub>max</sub> at resonance.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>Energy continuously sloshes between potential (<Var>PE</Var>, restoring spring) and kinetic (<Var>KE</Var>, mass momentum) forms twice per cycle.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>At steady-state resonance, the average injected power <Var>P</Var><sub>in</sub> = <Frac num="1" den="2" /><Var>F</Var><sub>0</sub><Var>A</Var><Var>&omega;</Var> must exactly equal dissipated power <Var>P</Var><sub>diss</sub> = <Frac num="1" den="2" /><Var>b</Var><Var>&omega;</Var><sup>2</sup><Var>A</Var><sup>2</sup>.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>If measured before steady state is reached, the energy balance is unequal as the system stores net incoming energy.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>Check the integration error metric in the HUD to verify if numerical integration introduces artificial energy dissipation.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Vibration energy harvesters use harmonic resonators to accumulate ambient kinetic energy and convert it to electrical power.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 4: COUPLED NORMAL MODES */}
          {activeLab === "lab4" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <Settings2 className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 4: Coupled Normal Modes & Frequency Splitting
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Study eigenvalue mode splitting, symmetric vs antisymmetric frequencies, and coupling beat frequencies.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>Symmetric (in-phase) and antisymmetric (out-of-phase) eigenmodes split according to coupling stiffness <Var>k</Var><sub>c</sub>:</p>
                    <EqBox>
                      <span>
                        <Var>f</Var><sub>sym</sub> = <Frac num={<Sqrt><Frac num={<><Var>k</Var><sub>1</sub></>} den={<><Var>m</Var><sub>1</sub></>} /></Sqrt>} den={<>2<Var>&pi;</Var></>} />
                        <span className="mx-4 text-white/30">|</span>
                        <Var>f</Var><sub>asym</sub> = <Frac num={<Sqrt><Frac num={<><Var>k</Var><sub>1</sub> + 2<Var>k</Var><sub>c</sub></>} den={<><Var>m</Var><sub>1</sub></>} /></Sqrt>} den={<>2<Var>&pi;</Var></>} />
                      </span>
                    </EqBox>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Coupled Oscillators</li>
                      <li>Parameters: <Var>m</Var><sub>1</sub> = <Var>m</Var><sub>2</sub> = 2.00 kg, <Var>k</Var><sub>1</sub> = <Var>k</Var><sub>2</sub> = 100.00 N/m</li>
                      <li>Coupling Spring: <Var>k</Var><sub>c</sub> = 50.00 N/m</li>
                      <li>Damping: <Var>b</Var><sub>1</sub> = <Var>b</Var><sub>2</sub> = 0.05 N s/m (Low damping)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <CoupledModesSVG mass={mass} springK={springK} couplingK={couplingK} mass2={mass2} springK2={springK2} />
                  
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[11px] font-mono space-y-1">
                    <span className="text-blue-400 font-bold block mb-1">Active Split Modes</span>
                    <div>• Symmetric (<Var>f</Var><sub>sym</sub>): <strong>{f_mode1_theo.toFixed(3)} Hz</strong></div>
                    <div>• Antisymmetric (<Var>f</Var><sub>asym</sub>): <strong>{f_mode2_theo.toFixed(3)} Hz</strong></div>
                    <div>• Frequency Split (<Var>&Delta;f</Var>): <strong>{(f_mode2_theo - f_mode1_theo).toFixed(3)} Hz</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load coupled configuration mode.</li>
                    <li>Initialize symmetric mode (masses in phase). Start simulation and measure frequency <Var>f</Var><sub>sym</sub>.</li>
                    <li>Initialize antisymmetric mode (masses in opposite phase). Measure frequency <Var>f</Var><sub>asym</sub>.</li>
                    <li>Initialize beats. Drive Mass 1 (<Var>m</Var><sub>1</sub>) at <Var>f</Var><sub>0</sub> = {f0_theo.toFixed(2)} Hz and record the energy exchange period.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Measure symmetric mode, antisymmetric mode, and beat period. Verify relation: <Var>T</Var><sub>beat</sub> = <Frac num="1" den={<><Var>f</Var><sub>asym</sub> - <Var>f</Var><sub>sym</sub></>} />.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>In symmetric mode, the coupling spring remains unstretched. In antisymmetric mode, the coupling spring is compressed, adding stiffness and increasing mode frequency.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>Derive equations of motion: <Var>m</Var><sub>1</sub><DDot><Var>x</Var></DDot><sub>1</sub> = -<Var>k</Var><sub>1</sub><Var>x</Var><sub>1</sub> - <Var>k</Var><sub>c</sub>(<Var>x</Var><sub>1</sub> - <Var>x</Var><sub>2</sub>) and <Var>m</Var><sub>2</sub><DDot><Var>x</Var></DDot><sub>2</sub> = -<Var>k</Var><sub>2</sub><Var>x</Var><sub>2</sub> - <Var>k</Var><sub>c</sub>(<Var>x</Var><sub>2</sub> - <Var>x</Var><sub>1</sub>).</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>Weak damping mismatch between oscillators will cause mode leakage, preventing complete energy transfer during beats.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>Coupled coordinates require symplectic integration to conserve total system energy and prevent numerical mode instability.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Mode splitting is used in MEMS gyroscopes and helps chemists identify molecular vibration frequencies in CO₂.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 5: DUFFING HYSTERESIS */}
          {activeLab === "lab5" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 5: Nonlinear Duffing Hysteresis & Jump Phenomena
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Observe spring hardening, map nonlinear amplitude hysteresis, and measure amplitude jump boundaries.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>The Duffing system includes a cubic spring term <Var>&alpha;</Var>, which makes spring stiffness dependent on amplitude:</p>
                    <EqBox>
                      <span>
                        <Var>m</Var><DDot><Var>x</Var></DDot> + <Var>b</Var><Dot><Var>x</Var></Dot> + <Var>k</Var><Var>x</Var> + <Var>&alpha;</Var><Var>x</Var><sup>3</sup> = <Var>F</Var><sub>0</sub> cos(<Var>&omega;</Var><Var>t</Var>)
                      </span>
                    </EqBox>
                    <p className="mt-1">For <Var>&alpha;</Var> &gt; 0 (hardening), the peak bends right. For <Var>&alpha;</Var> &lt; 0 (softening), the peak bends left. Hysteresis creates multiple coexisting stable states.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Duffing Nonlinear</li>
                      <li>Parameters: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m</li>
                      <li>Nonlinearity: <Var>&alpha;</Var> = 30.00 N/m³ (Hardening)</li>
                      <li>Damping: <Var>b</Var> = 0.50 N s/m, <Var>F</Var><sub>0</sub> = 15.00 N</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <DuffingHysteresisSVG duffingAlpha={duffingAlpha} springK={springK} mass={mass} />
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load Duffing configuration parameters.</li>
                    <li>Slowly sweep driving frequency <Var>f</Var><sub>d</sub> upwards from 0.80 Hz to 1.60 Hz. Record the jump-down frequency.</li>
                    <li>Sweep frequency <Var>f</Var><sub>d</sub> downwards from 1.60 Hz to 0.80 Hz. Record the jump-up frequency.</li>
                    <li>Mark the hysteresis overlap (bistability) zone.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Identify the bistability boundary interval (<Var>f</Var><sub>jump-up</sub> vs <Var>f</Var><sub>jump-down</sub>) and input them in your laboratory manual.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>Large displacement stretches the cubic spring, making the oscillator stiffer and shifting its resonance peak to a higher frequency.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>Using perturbation analysis, the resonance frequency shifts as: <Var>f</Var><sub>r</sub> &asymp; <Var>f</Var><sub>0</sub> (1 + <Frac num={<>3<Var>&alpha;</Var><Var>A</Var><sup>2</sup></>} den={<>8<Var>k</Var></>} />).</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>Sweep speed must be extremely slow. Moving the driver frequency slider too fast triggers premature jumps, skewing the hysteresis window.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>Bistable transitions are sensitive to solver tolerance. Use Cash-Karp adaptive solver to resolve quick jump boundaries.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>RF micro-resonators utilize Duffing bistability to build high-speed mechanical memory switches and signal filters.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 6: PARAMETRIC MATHIEU */}
          {activeLab === "lab6" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 6: Parametric Resonance & Mathieu Instabilities
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Investigate time-periodic stiffness modulation, measure growth rates, and plot Mathieu instability boundaries.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>The Mathieu equation models periodic stiffness modulation <Var>k</Var>(<Var>t</Var>) = <Var>k</Var><sub>0</sub>[1 + <Var>&epsilon;</Var> cos(<Var>&Omega;</Var><Var>t</Var>)]. Instability occurs near the parametric resonance condition:</p>
                    <EqBox>
                      <span>
                        <Var>m</Var><DDot><Var>x</Var></DDot> + <Var>b</Var><Dot><Var>x</Var></Dot> + <Var>k</Var><sub>0</sub>[1 + <Var>&epsilon;</Var> cos(<Var>&Omega;</Var><Var>t</Var>)]<Var>x</Var> = 0
                        <span className="mx-4 text-white/30">|</span>
                        <Var>&Omega;</Var> &asymp; 2<Var>&omega;</Var><sub>0</sub>
                      </span>
                    </EqBox>
                    <p className="mt-1">Energy is pumped twice per natural cycle, causing exponential amplitude growth if modulation depth <Var>&epsilon;</Var> exceeds critical damping limits.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Parametric Resonance</li>
                      <li>Parameters: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m, <Var>&epsilon;</Var> = 0.30</li>
                      <li>Damping: <Var>b</Var> = 0.10 N s/m (Low threshold)</li>
                      <li>Initial Conditions: <Var>x</Var><sub>0</sub> = 0.05 m (Non-zero seed required)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <MathieuStabilitySVG parametricEpsilon={parametricEpsilon} driverFreq={driverFreq} mass={mass} springK={springK} />
                  
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-[11px] font-mono space-y-1">
                    <span className="text-blue-400 font-bold block mb-1">Instability Telemetry</span>
                    <div>• Modulator Speed (2<Var>f</Var><sub>0</sub>): <strong>{(2 * f0_theo).toFixed(3)} Hz</strong></div>
                    <div>• Modulation Depth (<Var>&epsilon;</Var>): <strong>{parametricEpsilon.toFixed(2)}</strong></div>
                    <div>• Instability Threshold (2/<Var>Q</Var>): <strong>{(2 / Q_theo).toFixed(4)}</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load parametric configuration. Seed the system with initial displacement <Var>x</Var><sub>0</sub>.</li>
                    <li>Set modulator frequency <Var>f</Var><sub>m</sub> to 2.25 Hz (close to 2<Var>f</Var><sub>0</sub>).</li>
                    <li>Observe exponential envelope growth. Measure the amplitude doubling period.</li>
                    <li>Increase damping <Var>b</Var> to 1.80 N s/m. Observe how stability is restored.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Measure amplitude growth rate at frequency <Var>f</Var><sub>m</sub> = 2.25 Hz (modulator speed <Var>&Omega;</Var> = 2<Var>&pi;</Var><Var>f</Var><sub>m</sub>). Verify the threshold condition <Var>&epsilon;</Var> &gt; <Frac num="2" den={<Var>Q</Var>} />.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>Modulating spring rate at twice the natural frequency alters the spring stiffness twice per cycle, pumping energy into the system.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>The stability boundaries of the Mathieu equation are plotted in Floquet space as instability tongues starting at integer fractions of 2<Var>&omega;</Var><sub>0</sub>.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>Numerical integration can add artificial damping. If substeps is too small, instability tongues appear artificially shifted.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>Use Symplectic Verlet to prevent artificial energy accumulation and accurately trace Mathieu boundaries.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Parametric excitation explains child swing dynamics, vertical oil rig heave instability, and quadrupole ion traps.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 7: STRANGE ATTRACTORS */}
          {activeLab === "lab7" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 7: Phase Space, Strange Attractors & Chaos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Map phase space orbits, identify strange attractors, and measure orbit divergence rates (Lyapunov exponent).</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>Deterministic chaos in forced Duffing systems exhibits sensitive dependence on initial conditions, where distance <Var>d</Var> between trajectories grows as:</p>
                    <EqBox>
                      <span><Var>d</Var>(<Var>t</Var>) &asymp; <Var>d</Var><sub>0</sub><Var>e</Var><sup><Var>&lambda;</Var><Var>t</Var></sup></span>
                    </EqBox>
                    <p className="mt-1">If the Lyapunov exponent satisfies <Var>&lambda;</Var> &gt; 0, nearby starting trajectories diverge exponentially over time, forming a fractal strange attractor in phase space.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Duffing Nonlinear</li>
                      <li>Parameters: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m, <Var>&alpha;</Var> = 30.00 N/m³</li>
                      <li>Damping: <Var>b</Var> = 0.05 N s/m (Extremely low)</li>
                      <li>Harmonic Driver: <Var>F</Var><sub>0</sub> = 38.00 N, <Var>f</Var><sub>d</sub> = 1.13 Hz</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <ChaosPhasePortraitSVG />
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load low damping, high drive Duffing parameters.</li>
                    <li>Switch the graph display to **Phase Space** (<Var>x</Var> vs <Var>v</Var>).</li>
                    <li>Observe the non-repeating trajectory orbits.</li>
                    <li>Adjust initial position <Var>x</Var><sub>0</sub> by 0.001 m. Observe how the two orbits diverge over time.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Measure the divergence time where the two trajectories move to opposite attractor wells. Estimate the positive Lyapunov exponent.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>The system oscillates between two potential wells. The non-periodic motion is deterministic but unpredictable over long time scales.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>Deterministic chaos requires at least 3 phase space dimensions. In a driven 1D oscillator, the phase space variables are position <Var>x</Var>, velocity <Var>v</Var>, and driver phase angle <Var>&theta;</Var> = <Var>&omega;</Var><Var>t</Var>.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>Due to the chaotic nature of the system, round-off errors grow exponentially. The trajectory is a statistical attractor rather than a single repeating curve.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>Standard fixed-step solvers fail over long periods. Use the adaptive RK45 solver to capture small attractor boundaries.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Chaos theory is crucial for analyzing buckling structures, electrical circuits, lasers, and weather prediction models.</p>
                </div>
              </div>
            </div>
          )}

          {/* LAB 8: INTEGRATOR ERRORS */}
          {activeLab === "lab8" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
                Lab 8: Computational Physics & Integrator Energy Drift
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">1. Learning Objectives</h4>
                    <p>Compare symplectic vs explicit integration, identify discretization error, and measure energy drift rates.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">2. Physical Theory</h4>
                    <p>Explicit solvers do not conserve phase space area, introducing artificial energy growth. Symplectic integrators preserve the Hamiltonian:</p>
                    <EqBox>
                      <span><Var>H</Var>(<Var>q</Var>, <Var>p</Var>) = const</span>
                    </EqBox>
                    <p className="mt-1">This limits energy drift, keeping the system stable even at larger step sizes <Var>&Delta;t</Var>.</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">3. Experimental Setup</h4>
                    <ul className="list-disc pl-5 font-mono text-[11px] text-white/60 space-y-1">
                      <li>Mode: Single Oscillator</li>
                      <li>Parameters: <Var>m</Var> = 2.00 kg, <Var>k</Var> = 100.00 N/m, <Var>b</Var> = 0.00 N s/m (Undamped)</li>
                      <li>Timestep: <Var>&Delta;t</Var> = 0.08 s (<Var>&Delta;t</Var><sub>crit</sub> = 0.28 s)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <IntegratorStabilitySVG integrator={integrator} />
                  
                  <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-[11px] font-mono space-y-1">
                    <span className="text-red-400 font-bold block mb-1">Integrator Health Indicators</span>
                    <div>• Critical Limit (<Frac num="2" den={<><Var>&omega;</Var><sub>0</sub></>} />): <strong>{(2 / w0).toFixed(4)} s</strong></div>
                    <div>• Timestep (<Var>&Delta;t</Var>): <strong>{timeStep.toFixed(3)} s</strong></div>
                    <div>• Safety Margin: <strong>{((2 / w0) / timeStep).toFixed(1)}x</strong></div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs md:text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">4. Step-by-Step Procedure</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs">
                    <li>Load undamped configuration parameters.</li>
                    <li>Select **Runge-Kutta 4 (RK4)** integrator. Start the simulation.</li>
                    <li>Observe energy trace drift over 30 seconds.</li>
                    <li>Switch to **Velocity Verlet** and observe energy stabilization.</li>
                    <li>Increase timestep <Var>&Delta;t</Var> to 0.15 s. Compare solver stability.</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">5. Measurement Tasks</h4>
                  <p>Record energy drift rates (<Frac num={<><Var>d</Var><Var>E</Var></>} den={<><Var>d</Var><Var>t</Var></>} />) for RK4, Symplectic Euler, and Velocity Verlet. Input results in the Report Console.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">6. Expected Physical Behavior</h4>
                  <p>In an undamped system, energy must remain perfectly constant. Any change in total energy is a numerical artifact.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">7. Mathematical Analysis</h4>
                  <p>Explicit Euler diverges exponentially because its eigenvalues lie outside the unit circle in the complex plane.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">8. Error & Uncertainty Analysis</h4>
                  <p>Global truncation error of RK4 scales as <Var>O</Var>(<Var>&Delta;t</Var><sup>4</sup>), whereas Velocity Verlet scales as <Var>O</Var>(<Var>&Delta;t</Var><sup>2</sup>), but Velocity Verlet restricts energy to a bounded shell.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">9. Numerical Interpretation</h4>
                  <p>If the selected timestep exceeds the critical limit (<Var>&Delta;t</Var> &gt; <Frac num="2" den={<><Var>&omega;</Var><sub>0</sub></>} />), the numerical integration becomes unstable, causing the simulation to explode.</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-1">10. Real-World Engineering Connections</h4>
                  <p>Astrophysicists and molecular dynamics engineers use symplectic integrators to simulate planetary orbits and molecular structures over long timescales.</p>
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE LAB REPORT */}
          {activeLab === "report" && (
            <div className="space-y-6">
              <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-b border-white/5 pb-3">
                <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
                Interactive Scientific Lab Report Console
              </h3>

              <div className="space-y-4 text-xs md:text-sm">
                <p className="text-white/70">
                  Input your experimental measurements from the simulation below. The report console will verify your values against the analytical solver, run an error analysis, and compile a Markdown report.
                </p>

                {/* Lab Report Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/30 p-5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Investigator Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Jane Doe"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-xs text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Date</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026-05-22"
                      value={reportDate}
                      onChange={e => setReportDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-xs text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>

                  <div className="space-y-1 border-t border-white/5 pt-3 sm:col-span-2">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono mb-2">Experimental Measurements</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Measured Resonance Frequency (Hz)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      placeholder="e.g. 1.125"
                      value={measuredFreq}
                      onChange={e => setMeasuredFreq(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-xs text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Measured Peak Amplitude (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      placeholder="e.g. 0.045"
                      value={measuredAmp}
                      onChange={e => setMeasuredAmp(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-xs text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Measured Phase Lag (degrees)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="e.g. 90.0"
                      value={measuredPhase}
                      onChange={e => setMeasuredPhase(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-xs text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Measured Half-Power Bandwidth (Hz)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      placeholder="e.g. 0.040"
                      value={measuredBandwidth}
                      onChange={e => setMeasuredBandwidth(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 font-mono text-xs text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                </div>

                {/* Verification Results Panel */}
                {verificationResult && (
                  <div className={`p-5 rounded-2xl border ${verificationResult.style} space-y-3 font-mono text-xs`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase tracking-wider">Analysis Result:</span>
                      <span className="font-black text-sm uppercase">{verificationResult.grade}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-white/70">
                      <div>• Resonance Freq: <strong>{parseFloat(measuredFreq || "0").toFixed(3)} Hz</strong> (Theoretical: {verificationResult.theoF.toFixed(3)} Hz, Err: {verificationResult.errors.freq?.toFixed(2) || "0.0"}%)</div>
                      <div>• Peak Amplitude: <strong>{parseFloat(measuredAmp || "0").toFixed(4)} m</strong> (Theoretical: {verificationResult.theoA.toFixed(4)} m, Err: {verificationResult.errors.amp?.toFixed(2) || "0.0"}%)</div>
                      <div>• Phase Lag: <strong>{parseFloat(measuredPhase || "0").toFixed(1)}°</strong> (Theoretical: {verificationResult.theoP.toFixed(1)}°, Err: {verificationResult.errors.phase?.toFixed(2) || "0.0"}%)</div>
                      {bw_theo > 0 && (
                        <div>• Bandwidth (Δf): <strong>{parseFloat(measuredBandwidth || "0").toFixed(3)} Hz</strong> (Theoretical: {verificationResult.theoB.toFixed(3)} Hz, Err: {verificationResult.errors.bw?.toFixed(2) || "0.0"}%)</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={handleVerify}
                    className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-black text-xs font-bold transition-all shadow-md font-mono"
                  >
                    Verify & Analyze Measurements
                  </button>
                  <button 
                    onClick={handleExport}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/5 flex items-center gap-2 font-mono"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 font-bold" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Export Markdown Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

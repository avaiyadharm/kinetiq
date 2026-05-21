"use client";

import React, { useState } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { ResonanceCanvas, WaveformType } from "./ResonanceCanvas";
import { ResonanceEnvironment } from "./ResonanceEnvironment";
import { ResonanceTheory } from "./ResonanceTheory";
import { 
  Play, Pause, RotateCcw, Activity, Zap, Info, Settings2, HelpCircle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── ClickableValue Slider Component ─────────────────────────────────────────
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

const ClickableValue = ({ 
  value, 
  label, 
  unit, 
  min, 
  max, 
  step, 
  onChange, 
  colorClass = "text-white", 
  format 
}: ClickableValueProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>
            {format ? format(value) : value.toFixed(2)}
          </span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div 
        className="relative h-6 flex items-center group cursor-pointer"
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
          <div 
            className={cn("h-full opacity-50 group-hover:opacity-100 transition-opacity")} 
            style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: "currentColor" }} 
          />
        </div>
        <div
          className={cn("absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform", 
            isDragging ? "scale-150" : "group-hover:scale-125")}
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
};

// ─── ControlCard Wrapper Component ───────────────────────────────────────────
interface ControlCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  color?: string;
}

const ControlCard = ({ title, icon: Icon, children, color }: ControlCardProps) => (
  <div className="bg-[#18181b] rounded-[32px] p-6 border border-white/5 space-y-6 shadow-xl relative overflow-hidden group">
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

export const ResonanceSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  
  // Physical parameters state
  const [mass, setMass] = useState<number>(2.0);        // kg
  const [springK, setSpringK] = useState<number>(100.0);   // N/m
  const [dampingB, setDampingB] = useState<number>(0.5);    // N s/m
  const [driverAmp, setDriverAmp] = useState<number>(10.0);   // N
  const [driverFreq, setDriverFreq] = useState<number>(1.13); // Hz
  const [waveform, setWaveform] = useState<WaveformType>("sine");

  // Visual/control parameters state
  const [slowMotion, setSlowMotion] = useState<number>(0.1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showPhaseSpace, setShowPhaseSpace] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>("Acoustic Cavity");
  
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Live telemetry state from Canvas
  const [telemetry, setTelemetry] = useState({
    currentAmplitude: 0,
    qFactor: 0,
    phaseLagDeg: 0,
    peakFreqHz: 0,
    naturalFreqHz: 0,
    currentFreqHz: 0,
  });

  const handleReset = () => {
    setResetTrigger(prev => prev + 1);
  };

  return (
    <SimulationPageLayout
      title="Resonance & Forced Oscillations"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      <div className="flex-1 overflow-hidden">
        {activeTab === "canvas" && (
          <div className="h-full flex flex-col xl:flex-row">
            {/* Simulation Canvas Workspace */}
            <div className="flex-1 min-h-[400px] xl:h-full bg-black relative">
              <ResonanceCanvas
                params={{
                  mass,
                  springK,
                  dampingB,
                  driverAmp,
                  driverFreq,
                  waveform,
                  slowMotion,
                  isPlaying,
                  showVectors,
                  showPhaseSpace,
                }}
                onStateUpdate={setTelemetry}
                resetTrigger={resetTrigger}
              />

              {/* Float HUD Header overlay */}
              <div className="absolute top-6 left-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none">
                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">PHYSICAL INTEGRATOR</div>
                <div className="text-sm font-mono text-cyan-400 font-bold">RK-4 Engine: 10 Substeps/Frame</div>
                <div className="text-[9px] text-white/40">Step size: Δt = {(slowMotion / 60).toFixed(4)}s</div>
              </div>
            </div>

            {/* Right Sidebar - controls panel */}
            <aside className="w-full xl:w-[360px] border-t xl:border-t-0 xl:border-l border-border bg-[#18181b] flex flex-col h-1/2 xl:h-full overflow-y-auto shrink-0 select-none">
              
              {/* Playback Controls & Quick resets */}
              <div className="p-6 border-b border-border flex items-center gap-4 bg-black/20">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95",
                    isPlaying 
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                  )}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "PAUSE LABORATORY" : "RUN LABORATORY"}
                </button>
                <button
                  onClick={handleReset}
                  className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-90"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* 1. Driver Engine Configuration */}
                <ControlCard title="Driver Engine" icon={Zap} color="#2563eb">
                  <div className="space-y-5">
                    <ClickableValue
                      label="Driving Frequency (fd)"
                      value={driverFreq}
                      unit="Hz"
                      min={0.1}
                      max={5.0}
                      step={0.01}
                      onChange={(val) => {
                        setDriverFreq(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-blue-400"
                    />
                    <ClickableValue
                      label="Forcing Amplitude (F₀)"
                      value={driverAmp}
                      unit="N"
                      min={0}
                      max={50}
                      step={0.5}
                      onChange={(val) => {
                        setDriverAmp(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-blue-400"
                    />

                    {/* Waveform Selector */}
                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      {(["sine", "square", "triangle"] as WaveformType[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => {
                            setWaveform(w);
                            setActivePreset("Custom");
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                            waveform === w 
                              ? "bg-blue-600 text-white" 
                              : "text-white/40 hover:text-white"
                          )}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </ControlCard>

                {/* 2. Resonator Physical Parameters */}
                <ControlCard title="Resonator Parameters" icon={Settings2} color="#0d9488">
                  <div className="space-y-5">
                    <ClickableValue
                      label="Mass (m)"
                      value={mass}
                      unit="kg"
                      min={0.5}
                      max={10.0}
                      step={0.1}
                      onChange={(val) => {
                        setMass(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400"
                    />
                    <ClickableValue
                      label="Spring constant (k)"
                      value={springK}
                      unit="N/m"
                      min={20}
                      max={500}
                      step={5}
                      onChange={(val) => {
                        setSpringK(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400"
                    />
                    <ClickableValue
                      label="Damping Coefficient (b)"
                      value={dampingB}
                      unit="N s/m"
                      min={0.0}
                      max={80.0}
                      step={0.1}
                      onChange={(val) => {
                        setDampingB(val);
                        setActivePreset("Custom");
                      }}
                      colorClass="text-teal-400"
                    />
                  </div>
                </ControlCard>

                {/* 3. Live Analytical Telemetry */}
                <ControlCard title="Live Diagnostics" icon={Activity} color="#ffb95f">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Q-Factor</div>
                      <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                        {telemetry.qFactor === Infinity ? "∞" : telemetry.qFactor.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Phase Lag</div>
                      <div className="text-lg font-mono font-bold text-teal-400 mt-1">
                        {telemetry.phaseLagDeg.toFixed(1)}°
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Peak Freq</div>
                      <div className="text-lg font-mono font-bold text-blue-400 mt-1">
                        {telemetry.peakFreqHz.toFixed(2)} Hz
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Displacement</div>
                      <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                        {telemetry.currentAmplitude.toFixed(3)} m
                      </div>
                    </div>
                  </div>
                </ControlCard>

                {/* 4. Display Settings / Mechanics HUD toggles */}
                <ControlCard title="Visualization Engine" icon={Sparkles} color="#b4c5ff">
                  <div className="space-y-4">
                    {/* Vectors Toggler */}
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Show Vectors</span>
                      <button
                        onClick={() => setShowVectors(!showVectors)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-200",
                          showVectors ? "bg-blue-600" : "bg-white/10"
                        )}
                      >
                        <div 
                          className={cn("w-4 h-4 rounded-full bg-white transition-all", 
                            showVectors ? "translate-x-6" : "translate-x-0")} 
                        />
                      </button>
                    </div>

                    {/* Plots Toggler: Lissajous vs Waveform */}
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Lissajous Orbit</span>
                      <button
                        onClick={() => setShowPhaseSpace(!showPhaseSpace)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-all duration-200",
                          showPhaseSpace ? "bg-teal-600" : "bg-white/10"
                        )}
                      >
                        <div 
                          className={cn("w-4 h-4 rounded-full bg-white transition-all", 
                            showPhaseSpace ? "translate-x-6" : "translate-x-0")} 
                        />
                      </button>
                    </div>

                    {/* Simulation Speed (Slow-mo) */}
                    <ClickableValue
                      label="Visual Speed Factor"
                      value={slowMotion}
                      unit="x"
                      min={0.01}
                      max={1.00}
                      step={0.01}
                      onChange={setSlowMotion}
                      colorClass="text-indigo-400"
                    />
                  </div>
                </ControlCard>

              </div>
            </aside>
          </div>
        )}

        {activeTab === "config" && (
          <ResonanceEnvironment
            mass={mass}
            setMass={setMass}
            springK={springK}
            setSpringK={setSpringK}
            dampingB={dampingB}
            setDampingB={setDampingB}
            driverAmp={driverAmp}
            setDriverAmp={setDriverAmp}
            waveform={waveform}
            setWaveform={setWaveform}
            activePreset={activePreset}
            setActivePreset={setActivePreset}
          />
        )}

        {activeTab === "theory" && <ResonanceTheory />}

        {activeTab === "guide" && (
          <div className="max-w-4xl mx-auto space-y-12 pb-24 text-white overflow-y-auto h-full px-6 pt-6 font-body-md">
            <header className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Student Guide
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
                Resonance <span className="text-blue-400">Laboratory Guide</span>
              </h2>
              <p className="text-base text-white/50 leading-relaxed max-w-3xl font-body-md">
                Follow these interactive laboratory procedures to explore the physics of resonance and energy transfer.
              </p>
            </header>

            <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-3 relative z-10">
                <span className="w-6 h-[2px] bg-blue-400/50" /> 
                Experiment 1: Finding Resonance & Phase Shift
              </h3>
              <ol className="list-decimal pl-6 space-y-4 text-sm text-white/70">
                <li>
                  Select the <strong>Acoustic Cavity</strong> preset from the <em>Environment Config</em> tab. Note the natural frequency $f_0 \approx 1.38$ Hz.
                </li>
                <li>
                  Return to the <em>Simulation Canvas</em>. Set the <strong>Driving Frequency</strong> to $0.5$ Hz (well below natural resonance).
                </li>
                <li>
                  Observe the motion: the driver slide and the mass block move in phase (together). Look at the bottom time-series graph; the peaks are aligned, and the phase lag $\Phi \approx 10^\circ$.
                </li>
                <li>
                  Slowly increase the frequency to $1.38$ Hz. Notice how the displacement amplitude grows dramatically. At $1.38$ Hz, the phase lag becomes exactly $90^\circ$. Displacement lags driver force by a quarter cycle.
                </li>
                <li>
                  Increase the frequency to $4.0$ Hz. Notice the amplitude drops back down. The displacement is now out-of-phase with the driver ($\Phi \approx 170^\circ$).
                </li>
              </ol>
            </section>

            <section className="space-y-6 bg-[#18181b] p-8 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group">
              <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-3 relative z-10">
                <span className="w-6 h-[2px] bg-blue-400/50" /> 
                Experiment 2: Quality Factor & Bandwidth
              </h3>
              <ol className="list-decimal pl-6 space-y-4 text-sm text-white/70">
                <li>
                  Select the <strong>Tuning Fork</strong> preset. It has extremely small damping ($b = 0.1$), which gives it an exceptionally high Q-factor.
                </li>
                <li>
                  Look at the Lorentzian resonance graph in the canvas. Notice how sharp and narrow the amplitude spike is.
                </li>
                <li>
                  Vary the frequency slightly. Notice how the system response is virtually zero everywhere, except in the immediate vicinity of $f_d \approx f_0 \approx 3.18$ Hz.
                </li>
                <li>
                  Toggle the <strong>Lissajous Orbit</strong> switch. Drag the frequency sliders to trace the shape of the force vs displacement ellipse. At resonance, the ellipse is upright and open.
                </li>
              </ol>
            </section>
          </div>
        )}
      </div>
    </SimulationPageLayout>
  );
};

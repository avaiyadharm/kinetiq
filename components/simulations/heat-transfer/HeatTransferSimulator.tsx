"use client";

import React, { useState } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { HeatTransferCanvas, MATERIALS, DrawTool, ColormapName, Telemetry } from "./HeatTransferCanvas";
import { HeatTransferConfig } from "./HeatTransferConfig";
import { HeatTransferTheory } from "./HeatTransferTheory";
import { HeatTransferGuide } from "./HeatTransferGuide";
import {
  Play, Pause, RotateCcw, Activity, Thermometer, Settings2,
  Sparkles, Sliders, Layers, Paintbrush, Flame, Snowflake, Eraser,
  Zap, Wind, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Slider component ─────────────────────────────────────────────────────────
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
  value, label, unit, min, max, step, onChange,
  colorClass = "text-white", format
}: ClickableValueProps) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
        <div className="flex items-baseline gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
          <span className={cn("text-xs font-mono font-bold", colorClass)}>
            {format ? format(value) : value.toFixed(3)}
          </span>
          <span className="text-[9px] text-white/30 uppercase">{unit}</span>
        </div>
      </div>
      <div
        className="relative h-6 flex items-center group cursor-pointer"
        onMouseDown={(e) => {
          setIsDragging(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onChange(Math.round((min + pct * (max - min)) / step) * step);
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onChange(Math.min(max, Math.max(min, Math.round((min + pct * (max - min)) / step) * step)));
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full opacity-60 group-hover:opacity-100 transition-opacity rounded-full"
            style={{ width: `${((value - min) / (max - min)) * 100}%`, backgroundColor: "currentColor" }}
          />
        </div>
        <div
          className={cn("absolute w-3 h-3 rounded-full bg-white shadow-lg transition-transform",
            isDragging ? "scale-150" : "group-hover:scale-125")}
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const ControlCard = ({
  title, icon: Icon, children, color
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  color?: string;
}) => (
  <div className="bg-[#18181b] rounded-[28px] p-5 border border-white/5 space-y-5 shadow-xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-6 opacity-[0.035] group-hover:opacity-[0.07] transition-opacity">
      <Icon className="w-20 h-20" style={{ color }} />
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <div className="p-2 rounded-lg bg-white/5" style={{ color }}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-white/80">{title}</h3>
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-bold text-white/55 uppercase tracking-wider">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-8 h-4 rounded-full transition-colors",
        checked ? "bg-teal-500" : "bg-white/10"
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all",
        checked ? "left-4.5" : "left-0.5"
      )} />
    </button>
  </div>
);

// ─── Stability Badge ──────────────────────────────────────────────────────────
const StabilityBadge = ({ ratio }: { ratio: number }) => {
  // For ADI CN solver r can exceed 0.25 and remain stable
  // We show a "margin" relative to explicit limit
  const explicitLimit = 0.25;
  const pct = Math.min(1, ratio / explicitLimit);
  const status = ratio < 0.15 ? "SAFE" : ratio < 0.25 ? "MARGINAL" : "ADI-STABLE";
  const color = ratio < 0.15 ? "text-emerald-400" : ratio < 0.25 ? "text-amber-400" : "text-cyan-400";
  const barColor = ratio < 0.15 ? "#10b981" : ratio < 0.25 ? "#f59e0b" : "#22d3ee";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Stability r = α·Δt/Δx²</span>
        <span className={cn("text-[9px] font-bold uppercase tracking-wider", color)}>{status}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex justify-between">
        <span className={cn("text-[10px] font-mono font-bold", color)}>{ratio.toFixed(4)}</span>
        <span className="text-[9px] text-white/25 font-mono">(explicit limit = 0.25)</span>
      </div>
    </div>
  );
};

// ─── Main Simulator ───────────────────────────────────────────────────────────
export const HeatTransferSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePreset, setActivePreset] = useState("CPU Heatsink");

  // Physical parameters
  const [gridSize, setGridSize] = useState(48);
  const [dx, setDx] = useState(0.02);            // 2 cm node spacing
  const [dt, setDt] = useState(0.05);            // 50 ms (ADI is unconditionally stable)
  const [ambientTemp, setAmbientTemp] = useState(22.0);
  const [convectionCoeff, setConvectionCoeff] = useState(5.0);
  const [solverMode, setSolverMode] = useState<"transient" | "steady">("transient");
  const [boundaryType, setBoundaryType] = useState<"insulated" | "fixed" | "convective">("insulated");
  const [stepsPerFrame, setStepsPerFrame] = useState(3);

  // Drawing tools
  const [drawTool, setDrawTool] = useState<DrawTool>("source");
  const [selectedMaterial, setSelectedMaterial] = useState("copper");
  const [brushSize, setBrushSize] = useState(2);

  // Visualization
  const [colormap, setColormap] = useState<ColormapName>("thermal");
  const [showFluxVectors, setShowFluxVectors] = useState(false);
  const [showIsotherms, setShowIsotherms] = useState(true);
  const [showGridLines, setShowGridLines] = useState(false);
  const [showColorbar, setShowColorbar] = useState(true);

  // Live telemetry
  const [telemetry, setTelemetry] = useState<Telemetry>({
    avgTemp: 22, maxTemp: 95, minTemp: 22,
    thermalEnergy: 0, maxFluxMag: 0,
    stabilityRatio: 0, simTime: 0, residual: 0,
    solverIterations: 3, stableTimestepLimit: 0.034,
  });

  const handleReset = () => {
    setIsPlaying(true);
    setGridSize(48); setDx(0.02); setDt(0.05);
    setAmbientTemp(22); setConvectionCoeff(5);
    setSolverMode("transient"); setBoundaryType("insulated");
    setDrawTool("source"); setSelectedMaterial("copper");
    setBrushSize(2); setColormap("thermal");
    setShowFluxVectors(false); setShowIsotherms(true);
    setShowGridLines(false); setShowColorbar(true);
    setStepsPerFrame(3);
    setActivePreset("CPU Heatsink");
  };

  const PRESETS = ["CPU Heatsink", "Thermal Bridge", "Corner Heating", "Insulated Box", "Fins Array"];

  return (
    <SimulationPageLayout
      title="2D Heat Conduction & Boundary Value Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
    >
      <div className="flex-1 overflow-hidden">
        {activeTab === "canvas" && (
          <div className="h-full flex flex-col xl:flex-row">

            {/* Main Canvas */}
            <div className="flex-1 min-h-[450px] xl:h-full bg-black relative">
              <HeatTransferCanvas
                gridSize={gridSize}
                dx={dx}
                dt={dt}
                ambientTemp={ambientTemp}
                convectionCoeff={convectionCoeff}
                solverMode={solverMode}
                boundaryType={boundaryType}
                drawTool={drawTool}
                selectedMaterial={selectedMaterial}
                brushSize={brushSize}
                colormap={colormap}
                showFluxVectors={showFluxVectors}
                showIsotherms={showIsotherms}
                showGridLines={showGridLines}
                showColorbar={showColorbar}
                isPlaying={isPlaying}
                activePreset={activePreset}
                onTelemetryUpdate={setTelemetry}
                stepsPerFrame={stepsPerFrame}
              />

              {/* Solver HUD */}
              <div className="absolute top-5 left-5 p-3.5 bg-black/85 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none z-10">
                <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Active Solver</div>
                <div className="text-[11px] font-mono text-cyan-400 font-bold">
                  {solverMode === "transient"
                    ? "ADI Crank-Nicolson (2nd order)"
                    : "Gauss-Seidel Relaxation (60 iters)"}
                </div>
                <div className="text-[9px] text-white/40 font-mono">
                  t = {telemetry.simTime.toFixed(3)} s
                  {" | "}Δt = {(dt * 1000).toFixed(1)} ms
                  {" | "}N = {gridSize}²
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full xl:w-[355px] border-t xl:border-t-0 xl:border-l border-border bg-[#18181b] flex flex-col h-1/2 xl:h-full overflow-y-auto shrink-0 select-none">

              {/* Playback + Presets */}
              <div className="p-5 border-b border-border flex flex-col gap-4 bg-black/20">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95",
                      isPlaying
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    )}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "PAUSE" : "RUN"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-90"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-white/35 uppercase tracking-widest block">
                    Laboratory Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setActivePreset(preset)}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-[8.5px] font-bold uppercase tracking-wider transition-all text-center",
                          activePreset === preset
                            ? "bg-primary/90 text-white shadow-md"
                            : "text-white/35 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="p-5 space-y-5">

                {/* 1. Solver Mode */}
                <ControlCard title="Solver Configuration" icon={Sliders} color="#3b82f6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Solver Type</label>
                      <select
                        value={solverMode}
                        onChange={(e) => setSolverMode(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/8 rounded-xl p-2.5 text-[11px] text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="transient">Transient — ADI Crank-Nicolson</option>
                        <option value="steady">Steady-State — Gauss-Seidel</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Outer Boundary Condition</label>
                      <select
                        value={boundaryType}
                        onChange={(e) => setBoundaryType(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/8 rounded-xl p-2.5 text-[11px] text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="insulated">Adiabatic (Neumann ∂T/∂n = 0)</option>
                        <option value="fixed">Isothermal Wall (Dirichlet T = T∞)</option>
                        <option value="convective">Convective Cooling (Robin BC)</option>
                      </select>
                    </div>

                    {solverMode === "transient" && (
                      <StabilityBadge ratio={telemetry.stabilityRatio} />
                    )}
                  </div>
                </ControlCard>

                {/* 2. Drawing Tools */}
                <ControlCard title="Grid Painter" icon={Paintbrush} color="#f59e0b">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[
                        { id: "source", label: "Hot", icon: Flame, c: "text-rose-400" },
                        { id: "sink", label: "Cold", icon: Snowflake, c: "text-cyan-400" },
                        { id: "material", label: "Mat.", icon: Layers, c: "text-amber-400" },
                        { id: "erase", label: "Erase", icon: Eraser, c: "text-zinc-400" },
                      ].map(({ id, label, icon: Icon, c }) => (
                        <button
                          key={id}
                          onClick={() => setDrawTool(id as DrawTool)}
                          className={cn(
                            "py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all",
                            drawTool === id ? "bg-white/10 border border-white/10" : "hover:bg-white/5"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", c)} />
                          <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/45">{label}</span>
                        </button>
                      ))}
                    </div>

                    {drawTool === "material" && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Material</label>
                        <select
                          value={selectedMaterial}
                          onChange={(e) => setSelectedMaterial(e.target.value)}
                          className="w-full bg-black/40 border border-white/8 rounded-xl p-2.5 text-[11px] text-white outline-none focus:border-primary font-bold"
                        >
                          {Object.values(MATERIALS).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (k={m.k} W/m·K, α={m.alpha.toExponential(2)} m²/s)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <ClickableValue
                      label="Brush Radius"
                      value={brushSize}
                      unit="cells"
                      min={1} max={6} step={1}
                      onChange={setBrushSize}
                      colorClass="text-amber-400"
                      format={(v) => `${Math.round(v)}`}
                    />
                  </div>
                </ControlCard>

                {/* 3. Visualization */}
                <ControlCard title="Visualization" icon={Sparkles} color="#10b981">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Colormap</label>
                      <select
                        value={colormap}
                        onChange={(e) => setColormap(e.target.value as ColormapName)}
                        className="w-full bg-black/40 border border-white/8 rounded-xl p-2.5 text-[11px] text-white outline-none focus:border-primary font-bold"
                      >
                        <option value="thermal">Thermal (Ironbow)</option>
                        <option value="viridis">Viridis (Perceptual)</option>
                        <option value="icefire">IceFire Contrast</option>
                        <option value="jet">Jet (Rainbow)</option>
                        <option value="grayscale">Grayscale</option>
                      </select>
                    </div>
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <Toggle label="Isotherm Contours" checked={showIsotherms} onChange={setShowIsotherms} />
                      <Toggle label="Heat Flux Vectors (q = -k∇T)" checked={showFluxVectors} onChange={setShowFluxVectors} />
                      <Toggle label="Grid Cell Borders" checked={showGridLines} onChange={setShowGridLines} />
                      <Toggle label="Temperature Colorbar" checked={showColorbar} onChange={setShowColorbar} />
                    </div>
                  </div>
                </ControlCard>

                {/* 4. Physical Parameters */}
                <ControlCard title="Physical Parameters" icon={Thermometer} color="#ec4899">
                  <div className="space-y-4">
                    <ClickableValue
                      label="Ambient Temperature T∞"
                      value={ambientTemp} unit="°C"
                      min={0} max={60} step={1}
                      onChange={setAmbientTemp}
                      colorClass="text-pink-400"
                      format={(v) => v.toFixed(0)}
                    />
                    {boundaryType === "convective" && (
                      <ClickableValue
                        label="Convection Coeff. h"
                        value={convectionCoeff} unit="W/m²·K"
                        min={1} max={100} step={1}
                        onChange={setConvectionCoeff}
                        colorClass="text-pink-400"
                        format={(v) => v.toFixed(0)}
                      />
                    )}
                    <ClickableValue
                      label="Node Spacing Δx"
                      value={dx} unit="m"
                      min={0.005} max={0.05} step={0.005}
                      onChange={setDx}
                      colorClass="text-pink-400"
                    />
                    {solverMode === "transient" && (
                      <>
                        <ClickableValue
                          label="Timestep Δt"
                          value={dt} unit="s"
                          min={0.001} max={5.0} step={0.01}
                          onChange={setDt}
                          colorClass="text-purple-400"
                          format={(v) => v.toFixed(3)}
                        />
                        <ClickableValue
                          label="Steps per Frame"
                          value={stepsPerFrame} unit="iters"
                          min={1} max={20} step={1}
                          onChange={setStepsPerFrame}
                          colorClass="text-violet-400"
                          format={(v) => Math.round(v).toString()}
                        />
                        <ClickableValue
                          label="Grid Resolution"
                          value={gridSize} unit="N×N"
                          min={20} max={80} step={4}
                          onChange={v => setGridSize(Math.round(v))}
                          colorClass="text-indigo-400"
                          format={(v) => `${Math.round(v)}`}
                        />
                      </>
                    )}
                  </div>
                </ControlCard>

                {/* 5. Live Telemetry */}
                <ControlCard title="Thermal Telemetry" icon={Activity} color="#10b981">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "T avg", val: `${telemetry.avgTemp.toFixed(1)} °C`, color: "text-amber-400" },
                      { label: "T max", val: `${telemetry.maxTemp.toFixed(1)} °C`, color: "text-rose-400" },
                      { label: "T min", val: `${telemetry.minTemp.toFixed(1)} °C`, color: "text-cyan-400" },
                      { label: "q max", val: `${(telemetry.maxFluxMag / 1000).toFixed(1)} kW/m²`, color: "text-orange-400" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">{label}</div>
                        <div className={cn("text-[11px] font-mono font-bold mt-1", color)}>{val}</div>
                      </div>
                    ))}
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                      <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">
                        Stored Thermal Energy (above T∞)
                      </div>
                      <div className="text-[11px] font-mono font-bold text-pink-400 mt-1">
                        {telemetry.thermalEnergy >= 0
                          ? `+${telemetry.thermalEnergy.toExponential(3)} J`
                          : `${telemetry.thermalEnergy.toExponential(3)} J`}
                      </div>
                    </div>
                    {solverMode === "steady" && (
                      <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                        <div className="text-[8.5px] text-white/35 uppercase font-bold tracking-wider">Convergence Residual</div>
                        <div className={cn("text-[11px] font-mono font-bold mt-1",
                          telemetry.residual < 0.01 ? "text-emerald-400" : "text-amber-400")}>
                          {telemetry.residual.toExponential(3)} °C
                        </div>
                      </div>
                    )}
                  </div>
                </ControlCard>

              </div>
            </aside>
          </div>
        )}

        {activeTab === "config" && (
          <HeatTransferConfig
            gridSize={gridSize}
            dx={dx}
            dt={dt}
            ambientTemp={ambientTemp}
            convectionCoeff={convectionCoeff}
            solverMode={solverMode}
            boundaryType={boundaryType}
            telemetry={telemetry}
          />
        )}
        {activeTab === "theory" && <HeatTransferTheory />}
        {activeTab === "guide" && <HeatTransferGuide />}
      </div>
    </SimulationPageLayout>
  );
};

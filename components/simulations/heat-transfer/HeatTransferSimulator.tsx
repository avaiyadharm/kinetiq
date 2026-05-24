"use client";

import React, { useState } from "react";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { HeatTransferCanvas, MATERIALS, DrawTool, ColormapName } from "./HeatTransferCanvas";
import { HeatTransferConfig } from "./HeatTransferConfig";
import { HeatTransferTheory } from "./HeatTransferTheory";
import { HeatTransferGuide } from "./HeatTransferGuide";
import { 
  Play, Pause, RotateCcw, Activity, Thermometer, Settings2, Sparkles, Sliders, RefreshCw, Layers, Paintbrush, Flame, Snowflake, Eraser
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── ClickableValue Slider Component (from SoundWavesSimulator.tsx) ───────────
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
            onChange(Math.min(max, Math.max(min, snapped)));
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full opacity-50 group-hover:opacity-100 transition-opacity" 
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

// ─── ControlCard Wrapper Component (from SoundWavesSimulator.tsx) ────────────
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

export const HeatTransferSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");

  // Playback Control States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string>("CPU Heatsink");

  // Grid Physical Settings
  const [gridSize, setGridSize] = useState<number>(40); // N x N nodes
  const [dx, setDx] = useState<number>(0.025); // Cell spatial pitch (m)
  const [dt, setDt] = useState<number>(0.0001); // Solver timestep (s)
  const [ambientTemp, setAmbientTemp] = useState<number>(20.0); // degC
  const [convectionCoeff, setConvectionCoeff] = useState<number>(2.0); // W/m^2K (cooling wind)
  const [solverMode, setSolverMode] = useState<"transient" | "steady">("transient");
  const [boundaryType, setBoundaryType] = useState<"insulated" | "fixed" | "convective">("insulated");

  // Canvas Drawing parameters
  const [drawTool, setDrawTool] = useState<DrawTool>("source");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("copper");
  const [brushSize, setBrushSize] = useState<number>(2);

  // Visualization options
  const [colormap, setColormap] = useState<ColormapName>("thermal");
  const [showFluxVectors, setShowFluxVectors] = useState<boolean>(false);
  const [showIsotherms, setShowIsotherms] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(false);

  // Telemetry updated from HeatTransferCanvas
  const [telemetry, setTelemetry] = useState({
    avgTemp: 20.0,
    maxTemp: 20.0,
    minTemp: 20.0,
    thermalEnergy: 0.0,
    iterations: 1,
    stableTimestepLimit: 0.00015,
  });

  const handleReset = () => {
    setIsPlaying(true);
    setGridSize(40);
    setDx(0.025);
    setDt(0.0001);
    setAmbientTemp(20.0);
    setConvectionCoeff(2.0);
    setSolverMode("transient");
    setBoundaryType("insulated");
    setDrawTool("source");
    setSelectedMaterial("copper");
    setBrushSize(2);
    setColormap("thermal");
    setShowFluxVectors(false);
    setShowIsotherms(true);
    setShowGridLines(false);
    
    // Quick reload CPU preset
    setActivePreset("CPU Heatsink");
  };

  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
  };

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
            {/* Main Canvas Area */}
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
                isPlaying={isPlaying}
                activePreset={activePreset}
                onTelemetryUpdate={setTelemetry}
              />

              {/* HUD Header Overlay */}
              <div className="absolute top-6 left-6 p-4 bg-black/85 backdrop-blur-md rounded-2xl border border-white/5 space-y-1 select-none pointer-events-none z-10">
                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">SOLVER RUNTIME CORE</div>
                <div className="text-sm font-mono text-cyan-400 font-bold uppercase">
                  {solverMode === "transient" 
                    ? "2D Transient Heat Solver (FTCS)" 
                    : "Steady-State Relaxation (Gauss-Seidel)"
                  }
                </div>
                {solverMode === "transient" && (
                  <div className="text-[9px] text-white/40">
                    Timestep: {(dt * 1000).toFixed(2)} ms | Stable Limit: {(telemetry.stableTimestepLimit * 1000).toFixed(2)} ms
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Controls */}
            <aside className="w-full xl:w-[360px] border-t xl:border-t-0 xl:border-l border-border bg-[#18181b] flex flex-col h-1/2 xl:h-full overflow-y-auto shrink-0 select-none">
              
              {/* Playback Controls & Quick Presets */}
              <div className="p-6 border-b border-border flex flex-col gap-4 bg-black/20">
                <div className="flex items-center gap-3">
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
                    {isPlaying ? "PAUSE SIM" : "RUN SIM"}
                  </button>
                  <button
                    onClick={handleReset}
                    title="Reset simulation parameters and state"
                    className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-90"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Scenarios Presets */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Laboratory Presets</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {["CPU Heatsink", "Thermal Bridge", "Corner Heating", "Insulated Box"].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          "py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                          activePreset === preset 
                            ? "bg-primary text-white shadow-md" 
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Modules */}
              <div className="p-6 space-y-6">
                
                {/* 1. Laboratory Solver Mode */}
                <ControlCard title="Conduction Mode" icon={Sliders} color="#3b82f6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Solver type</label>
                      <select 
                        value={solverMode}
                        onChange={(e) => setSolverMode(e.target.value as "transient" | "steady")}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="transient">1. Transient (Time Dependent)</option>
                        <option value="steady">2. Steady-State Relaxation</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Boundary Thermal Insulation</label>
                      <select 
                        value={boundaryType}
                        onChange={(e) => setBoundaryType(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="insulated">Insulated (Adiabatic Neumann)</option>
                        <option value="fixed">Constant Edge (Dirichlet ambient)</option>
                        <option value="convective">Convective Edge Cooling (Robin)</option>
                      </select>
                    </div>
                  </div>
                </ControlCard>

                {/* 2. Interactive Paint Tools */}
                <ControlCard title="Grid Drawing Tools" icon={Paintbrush} color="#f59e0b">
                  <div className="space-y-4">
                    {/* Tool Select buttons */}
                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[
                        { id: "source", label: "Source", icon: Flame, colorClass: "text-rose-400" },
                        { id: "sink", label: "Sink", icon: Snowflake, colorClass: "text-cyan-400" },
                        { id: "material", label: "Material", icon: Layers, colorClass: "text-amber-400" },
                        { id: "erase", label: "Erase", icon: Eraser, colorClass: "text-zinc-400" },
                      ].map((tool) => {
                        const Icon = tool.icon;
                        const isSelected = drawTool === tool.id;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => setDrawTool(tool.id as DrawTool)}
                            title={tool.label}
                            className={cn(
                              "py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
                              isSelected 
                                ? "bg-white/10 border border-white/10 shadow-md" 
                                : "hover:bg-white/5"
                            )}
                          >
                            <Icon className={cn("w-4 h-4", tool.colorClass)} />
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/50">{tool.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Material brush selector */}
                    {drawTool === "material" && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Select Material Conductivity</label>
                        <select 
                          value={selectedMaterial}
                          onChange={(e) => setSelectedMaterial(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                        >
                          {Object.values(MATERIALS).map((mat) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name} (\u03B1 = {mat.conductivity.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Brush size */}
                    <ClickableValue
                      label="Brush Radius size"
                      value={brushSize}
                      unit="cells"
                      min={1}
                      max={5}
                      step={1}
                      onChange={setBrushSize}
                      colorClass="text-amber-400 font-mono"
                      format={(v) => `${Math.round(v)}`}
                    />
                  </div>
                </ControlCard>

                {/* 3. Colormap & Overlays */}
                <ControlCard title="Visualization & Overlays" icon={Sparkles} color="#10b981">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Color Mapping</label>
                      <select 
                        value={colormap}
                        onChange={(e) => setColormap(e.target.value as ColormapName)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-primary font-bold uppercase tracking-wide"
                      >
                        <option value="thermal">Thermal (Ironbow)</option>
                        <option value="icefire">Icefire Contrast</option>
                        <option value="jet">Jet Rainbow</option>
                        <option value="grayscale">Scientific Monochromatic</option>
                      </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Show Isotherm Contours</label>
                        <input 
                          type="checkbox" 
                          checked={showIsotherms}
                          onChange={(e) => setShowIsotherms(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Show Gradient Flow Arrows</label>
                        <input 
                          type="checkbox" 
                          checked={showFluxVectors}
                          onChange={(e) => setShowFluxVectors(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Show Grid Cell Borders</label>
                        <input 
                          type="checkbox" 
                          checked={showGridLines}
                          onChange={(e) => setShowGridLines(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </ControlCard>

                {/* 4. Physical constants config */}
                <ControlCard title="Physical Parameters" icon={Thermometer} color="#ec4899">
                  <div className="space-y-5">
                    <ClickableValue
                      label="Ambient Temperature (T_amb)"
                      value={ambientTemp}
                      unit="\u00B0C"
                      min={0}
                      max={50}
                      step={1}
                      onChange={setAmbientTemp}
                      colorClass="text-pink-400 font-mono"
                    />

                    {boundaryType === "convective" && (
                      <ClickableValue
                        label="Convection Coefficient (h)"
                        value={convectionCoeff}
                        unit="W/m\u00B2K"
                        min={0.1}
                        max={10.0}
                        step={0.1}
                        onChange={setConvectionCoeff}
                        colorClass="text-pink-400 font-mono"
                      />
                    )}

                    <ClickableValue
                      label="Grid Node Spacing (\u0394x)"
                      value={dx}
                      unit="m"
                      min={0.01}
                      max={0.05}
                      step={0.005}
                      onChange={(v) => {
                        setDx(v);
                        // Recalculate stable timestep limit
                        const maxAlpha = 1.0;
                        const stableTimestep = (v * v) / (4.0 * maxAlpha);
                        setDt(Math.min(dt, stableTimestep * 0.9));
                      }}
                      colorClass="text-pink-400 font-mono"
                    />

                    {solverMode === "transient" && (
                      <ClickableValue
                        label="Time Integration (\u0394t)"
                        value={dt}
                        unit="s"
                        min={0.00001}
                        max={telemetry.stableTimestepLimit * 0.99} // prevent unstable blow-up
                        step={0.00001}
                        onChange={setDt}
                        colorClass="text-purple-400 font-mono"
                        format={(v) => v.toFixed(5)}
                      />
                    )}
                  </div>
                </ControlCard>

                {/* 5. Live Telemetry */}
                <ControlCard title="Thermal Telemetry" icon={Activity} color="#10b981">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Avg Temp</div>
                      <div className="text-sm font-mono font-bold text-amber-400 mt-1">
                        {telemetry.avgTemp.toFixed(2)} <span className="text-[9px] text-white/30 font-sans">\u00B0C</span>
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Max / Min</div>
                      <div className="text-[11px] font-mono font-bold text-teal-400 mt-1">
                        {telemetry.maxTemp.toFixed(1)} / {telemetry.minTemp.toFixed(1)} \u00B0C
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl col-span-2">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Stored Thermal Energy</div>
                      <div className="text-sm font-mono font-bold text-pink-400 mt-1">
                        {telemetry.thermalEnergy.toExponential(4)} <span className="text-[9px] text-white/30 font-sans">Joules</span>
                      </div>
                    </div>
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

        {activeTab === "theory" && (
          <HeatTransferTheory />
        )}

        {activeTab === "guide" && (
          <HeatTransferGuide />
        )}
      </div>
    </SimulationPageLayout>
  );
};

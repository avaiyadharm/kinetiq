"use client";

import React from "react";
import { useThermalExpansionStore, StructuralConstraint, ShapeType, SimulationEngineType } from "@/store/thermalExpansionStore";
import { MATERIAL_DATABASE } from "@/lib/physics/thermalExpansion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const ThermalExpansionConfig: React.FC = () => {
  const {
    materialId,
    setMaterialId,
    objectType,
    setObjectType,
    constraint,
    setConstraint,
    engineType,
    L0,
    thickness,
    crossSectionalArea,
    gapSize,
    bimetallicMat1,
    bimetallicMat2,
    atomCount,
    bondStiffness,
    vizSettings,
    graphSettings,
    setConfig,
    setVizSetting,
    setGraphSetting
  } = useThermalExpansionStore();

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMaterialId(e.target.value);
  };

  const handleObjectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setObjectType(e.target.value as ShapeType);
  };

  const handleConstraintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConstraint(e.target.value as StructuralConstraint);
  };

  const handleEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig("engineType", e.target.value as SimulationEngineType);
  };

  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto custom-scrollbar select-none">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">ENVIRONMENT CONFIGURATION</h2>
          <p className="text-sm text-white/40 mt-1 uppercase tracking-wider font-mono">
            Tune scientific boundary limits, custom materials, and solver constraints
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Object & Material Selection */}
          <div className="space-y-6">
            
            {/* Simulation Setup */}
            <Card className="bg-[#18181b] border-white/5 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Simulation Object Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                      Physical Model Representation
                    </Label>
                    <select
                      value={objectType}
                      onChange={handleObjectTypeChange}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="rod">Solid Cylindrical Rod</option>
                      <option value="bridge">Suspended Bridge Deck</option>
                      <option value="railway">Frictionless Railway Track</option>
                      <option value="cube">Isotropic Solid Cube (3D)</option>
                      <option value="plate">Uniform Solid Plate (2D)</option>
                      <option value="ring">Concentric Solid Ring</option>
                      <option value="liquid">Liquid Volumetric Container</option>
                      <option value="bimetallic">Bimetallic Composite Strip</option>
                    </select>
                  </div>

                  {objectType === "bimetallic" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                          Top Alloy Layer
                        </Label>
                        <select
                          value={bimetallicMat1}
                          onChange={(e) => setConfig("bimetallicMat1", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          {Object.entries(MATERIAL_DATABASE).map(([id, m]) => (
                            <option key={id} value={id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                          Bottom Alloy Layer
                        </Label>
                        <select
                          value={bimetallicMat2}
                          onChange={(e) => setConfig("bimetallicMat2", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        >
                          {Object.entries(MATERIAL_DATABASE).map(([id, m]) => (
                            <option key={id} value={id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                        Material Preset
                      </Label>
                      <select
                        value={materialId}
                        onChange={handleMaterialChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                      >
                        {Object.entries(MATERIAL_DATABASE).map(([id, m]) => (
                          <option key={id} value={id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                      Structural Constraint
                    </Label>
                    <select
                      value={constraint}
                      onChange={handleConstraintChange}
                      disabled={objectType === "bimetallic"}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-30"
                    >
                      <option value="free">Free Expansion (Stress = 0)</option>
                      <option value="fixed">Fixed Boundaries (Max Stress)</option>
                      <option value="partial">Pre-set Gap Joint Limit</option>
                      <option value="multi">Damped Spring Supports</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geometry Parameters */}
            <Card className="bg-[#18181b] border-white/5 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Geometric Bounds
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                        Initial Length (L₀)
                      </Label>
                      <span className="text-xs text-white/80 font-mono">{L0} m</span>
                    </div>
                    <Slider
                      value={[L0]}
                      min={1}
                      max={20}
                      step={0.5}
                      onValueChange={(val) => setConfig("L0", val[0])}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                        Cross-Section Thickness
                      </Label>
                      <span className="text-xs text-white/80 font-mono">{(thickness * 100).toFixed(1)} cm</span>
                    </div>
                    <Slider
                      value={[thickness]}
                      min={0.02}
                      max={0.5}
                      step={0.01}
                      onValueChange={(val) => setConfig("thickness", val[0])}
                    />
                  </div>

                  {constraint === "partial" && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                          Expansion Joint Gap Size
                        </Label>
                        <span className="text-xs text-cyan-400 font-mono">{(gapSize * 1000).toFixed(1)} mm</span>
                      </div>
                      <Slider
                        value={[gapSize]}
                        min={0.001}
                        max={0.05}
                        step={0.001}
                        onValueChange={(val) => setConfig("gapSize", val[0])}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Atomic Lattice & Solver Engine */}
          <div className="space-y-6">
            
            {/* Solver Type Selection */}
            <Card className="bg-[#18181b] border-white/5 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Simulation Physics Engine
                </h3>
                
                <div>
                  <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 block">
                    Mathematical Solver Method
                  </Label>
                  <select
                    value={engineType}
                    onChange={handleEngineChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="fea">Finite Element Approximation (Macroscopic Contour)</option>
                    <option value="md">Molecular Dynamics (LJ-Potential Atoms)</option>
                    <option value="statistical">Statistical Thermodynamic Integrator</option>
                    <option value="hybrid">Hybrid Macroscopic-Microscopic Engine</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Atomic Particle Configuration */}
            <Card className="bg-[#18181b] border-white/5 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Microscopic Particle Lattice Config
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                        Atom Mesh Count
                      </Label>
                      <span className="text-xs text-white/80 font-mono">{atomCount} particles</span>
                    </div>
                    <Slider
                      value={[atomCount]}
                      min={40}
                      max={250}
                      step={10}
                      onValueChange={(val) => setConfig("atomCount", val[0])}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                        Interatomic Potential Stiffness
                      </Label>
                      <span className="text-xs text-white/80 font-mono">{bondStiffness.toFixed(1)} N/m</span>
                    </div>
                    <Slider
                      value={[bondStiffness]}
                      min={2.0}
                      max={30.0}
                      step={0.5}
                      onValueChange={(val) => setConfig("bondStiffness", val[0])}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Overlays & HUD Filters */}
            <Card className="bg-[#18181b] border-white/5 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Visualization Overlays
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Thermal Glow
                    </Label>
                    <Switch
                      checked={vizSettings.thermalGlow}
                      onCheckedChange={(val) => setVizSetting("thermalGlow", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Stress Heatmap
                    </Label>
                    <Switch
                      checked={vizSettings.heatmaps}
                      onCheckedChange={(val) => setVizSetting("heatmaps", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Lattice Overlay
                    </Label>
                    <Switch
                      checked={vizSettings.latticeRendering}
                      onCheckedChange={(val) => setVizSetting("latticeRendering", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Deformation Scaling
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={vizSettings.deformationAmplification}
                        onChange={(e) => setVizSetting("deformationAmplification", Number(e.target.value))}
                        className="bg-black border border-white/10 rounded px-1 text-[10px] text-white"
                      >
                        <option value="1">1x</option>
                        <option value="2">2x</option>
                        <option value="5">5x</option>
                        <option value="10">10x</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graphing Engine configuration */}
            <Card className="bg-[#18181b] border-white/5 shadow-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  Telemetry Graph Setup
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Log Scale Y-Axis
                    </Label>
                    <Switch
                      checked={graphSettings.logScale}
                      onCheckedChange={(val) => setGraphSetting("logScale", val)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-white/60 font-bold uppercase tracking-wider">
                      Overlay Ideal Curves
                    </Label>
                    <Switch
                      checked={graphSettings.overlayComparison}
                      onCheckedChange={(val) => setGraphSetting("overlayComparison", val)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
};

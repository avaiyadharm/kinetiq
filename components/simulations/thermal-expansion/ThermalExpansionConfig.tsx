"use client";

import React from "react";
import { useThermalExpansionStore, ConstraintType, ShapeType } from "@/store/thermalExpansionStore";
import { MATERIAL_DB } from "@/lib/physics/thermalExpansion";
import { Settings, Layers, Ruler, Eye, BarChart2 } from "lucide-react";

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-cyan-400">{icon}</span>
    <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest">{title}</h3>
  </div>
);

const ConfigRow: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <div>
      <div className="text-[11px] font-semibold text-white/80">{label}</div>
      {sub && <div className="text-[9px] text-white/30 font-mono mt-0.5">{sub}</div>}
    </div>
    <div className="ml-4">{children}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-10 h-5 rounded-full border transition-all relative ${
      checked ? "bg-cyan-500/20 border-cyan-500/40" : "bg-black/40 border-white/10"
    }`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
      checked ? "left-5 bg-cyan-400" : "left-0.5 bg-white/30"
    }`} />
  </button>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none min-w-[130px]"
  />
);

export const ThermalExpansionConfig: React.FC = () => {
  const {
    materialId,
    setMaterialId,
    objectType,
    setObjectType,
    constraint,
    setConstraint,
    L0,
    thickness,
    diameter,
    gapSize,
    bimetallicMat1,
    bimetallicMat2,
    vizSettings,
    graphSettings,
    setConfig,
    setVizSetting,
    setGraphSetting,
  } = useThermalExpansionStore();

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto custom-scrollbar select-text">
      <div className="max-w-3xl mx-auto p-8 pb-16 space-y-8">

        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">Environment Configuration</h2>
          <p className="text-sm text-cyan-400 mt-1 font-mono uppercase tracking-wider">
            Physics Parameters · Geometry · Visualization
          </p>
        </div>

        {/* Material */}
        <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5">
          <SectionTitle icon={<Layers className="w-4 h-4" />} title="Material Selection" />
          <div className="space-y-0">
            <ConfigRow label="Primary Material" sub="α, E, σ_y are all temperature-dependent">
              <Select value={materialId} onChange={e => setMaterialId(e.target.value)}>
                {Object.entries(MATERIAL_DB).map(([id, m]) => (
                  <option key={id} value={id}>{m.name}</option>
                ))}
              </Select>
            </ConfigRow>
            {materialId && MATERIAL_DB[materialId] && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["α₀", `${(MATERIAL_DB[materialId].alpha0 * 1e6).toFixed(2)} ×10⁻⁶/K`],
                  ["E₀", `${(MATERIAL_DB[materialId].youngsModulus / 1e9).toFixed(0)} GPa`],
                  ["σ_y0", `${(MATERIAL_DB[materialId].yieldStrength / 1e6).toFixed(0)} MPa`],
                  ["ρ", `${MATERIAL_DB[materialId].density} kg/m³`],
                  ["k", `${MATERIAL_DB[materialId].thermalConductivity} W/m·K`],
                  ["T_m", `${MATERIAL_DB[materialId].meltingPoint.toFixed(0)} K`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                    <div className="text-[8px] text-white/30 font-mono">{k}</div>
                    <div className="text-[10px] font-mono text-white/70 font-bold">{v}</div>
                  </div>
                ))}
              </div>
            )}
            <ConfigRow label="Bimetallic Layer 1" sub="Top layer material">
              <Select value={bimetallicMat1} onChange={e => setConfig("bimetallicMat1", e.target.value)}>
                {Object.entries(MATERIAL_DB).map(([id, m]) => (
                  <option key={id} value={id}>{m.name.split(" ")[0]}</option>
                ))}
              </Select>
            </ConfigRow>
            <ConfigRow label="Bimetallic Layer 2" sub="Bottom layer material">
              <Select value={bimetallicMat2} onChange={e => setConfig("bimetallicMat2", e.target.value)}>
                {Object.entries(MATERIAL_DB).map(([id, m]) => (
                  <option key={id} value={id}>{m.name.split(" ")[0]}</option>
                ))}
              </Select>
            </ConfigRow>
          </div>
        </div>

        {/* Geometry */}
        <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5">
          <SectionTitle icon={<Ruler className="w-4 h-4" />} title="Geometry Parameters" />
          <div className="space-y-0">
            <ConfigRow label="Object Shape" sub="Controls which physics renderer activates">
              <Select
                value={objectType}
                onChange={e => setObjectType(e.target.value as ShapeType)}
              >
                <option value="rod">Rod (1D)</option>
                <option value="plate">Plate (2D)</option>
                <option value="ring">Ring / Annulus</option>
                <option value="bridge">Bridge Deck</option>
                <option value="railway">Railway Track</option>
                <option value="bimetallic">Bimetallic Strip</option>
              </Select>
            </ConfigRow>
            <ConfigRow label="Boundary Condition" sub="Determines stress state">
              <Select
                value={constraint}
                onChange={e => setConstraint(e.target.value as ConstraintType)}
              >
                <option value="free">Free (σ=0)</option>
                <option value="fixed">Fixed (ΔL=0)</option>
                <option value="partial">Partial (gap joint)</option>
                <option value="spring">Spring-mounted</option>
              </Select>
            </ConfigRow>
            <ConfigRow
              label="Initial Length L₀"
              sub={`Current: ${L0.toFixed(2)} m`}
            >
              <input
                type="range"
                min={0.1}
                max={50}
                step={0.1}
                value={L0}
                onChange={e => setConfig("L0", Number(e.target.value))}
                className="w-28 accent-cyan-500"
              />
            </ConfigRow>
            <ConfigRow
              label="Section Diameter"
              sub={`d = ${(diameter * 100).toFixed(1)} cm`}
            >
              <input
                type="range"
                min={0.01}
                max={0.3}
                step={0.005}
                value={diameter}
                onChange={e => {
                  const d = Number(e.target.value);
                  setConfig("diameter", d);
                  setConfig("crossSectionalArea", Math.PI * (d / 2) ** 2);
                }}
                className="w-28 accent-cyan-500"
              />
            </ConfigRow>
            <ConfigRow
              label="Strip Thickness"
              sub={`t = ${(thickness * 100).toFixed(1)} cm`}
            >
              <input
                type="range"
                min={0.002}
                max={0.1}
                step={0.001}
                value={thickness}
                onChange={e => setConfig("thickness", Number(e.target.value))}
                className="w-28 accent-cyan-500"
              />
            </ConfigRow>
            <ConfigRow
              label="Expansion Joint Gap"
              sub={`g = ${(gapSize * 1000).toFixed(1)} mm`}
            >
              <input
                type="range"
                min={0.001}
                max={0.1}
                step={0.001}
                value={gapSize}
                onChange={e => setConfig("gapSize", Number(e.target.value))}
                className="w-28 accent-cyan-500"
              />
            </ConfigRow>
          </div>
        </div>

        {/* Visualization */}
        <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5">
          <SectionTitle icon={<Eye className="w-4 h-4" />} title="Visualization Settings" />
          <div className="space-y-0">
            <ConfigRow label="Thermal Gradient Colors" sub="Colors rod by local temperature (blue→orange→white)">
              <Toggle checked={vizSettings.showThermalGradient} onChange={v => setVizSetting("showThermalGradient", v)} />
            </ConfigRow>
            <ConfigRow label="Stress Color Overlay" sub="FEA-style compressive (blue) vs tensile (red)">
              <Toggle checked={vizSettings.showStressColors} onChange={v => setVizSetting("showStressColors", v)} />
            </ConfigRow>
            <ConfigRow label="Atomic Lattice Panel" sub="Anharmonic potential well + vibrational envelopes">
              <Toggle checked={vizSettings.showAtomicLattice} onChange={v => setVizSetting("showAtomicLattice", v)} />
            </ConfigRow>
            <ConfigRow label="Heat Front Propagation" sub="Shows diffusion wave along rod from heated end">
              <Toggle checked={vizSettings.showHeatFront} onChange={v => setVizSetting("showHeatFront", v)} />
            </ConfigRow>
            <ConfigRow label="Auto-Magnification" sub="Automatically scale visual ΔL to 5% of canvas width">
              <Toggle checked={vizSettings.autoMagnification} onChange={v => setVizSetting("autoMagnification", v)} />
            </ConfigRow>
            <ConfigRow
              label="Manual Magnification"
              sub={`×${vizSettings.magnification} (real ΔL × factor = visual)`}
            >
              <input
                type="range"
                min={1}
                max={1000}
                step={1}
                value={vizSettings.magnification}
                onChange={e => {
                  setVizSetting("magnification", Number(e.target.value));
                  setVizSetting("autoMagnification", false);
                }}
                className="w-28 accent-amber-500"
              />
            </ConfigRow>
          </div>
        </div>

        {/* Graph Settings */}
        <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5">
          <SectionTitle icon={<BarChart2 className="w-4 h-4" />} title="Graph Settings" />
          <div className="space-y-0">
            <ConfigRow label="Overlay Ideal (Theoretical) Curve" sub="Show L=L₀(1+αΔT) reference line in green">
              <Toggle checked={graphSettings.overlayIdeal} onChange={v => setGraphSetting("overlayIdeal", v)} />
            </ConfigRow>
            <ConfigRow label="Yield Strength Limit Line" sub="Show σ_y(T) as horizontal reference in stress plots">
              <Toggle checked={graphSettings.showYieldLine} onChange={v => setGraphSetting("showYieldLine", v)} />
            </ConfigRow>
            <ConfigRow label="Critical Buckling Load Line" sub="Show P_cr intersection in buckling plot">
              <Toggle checked={graphSettings.showCriticalLoad} onChange={v => setGraphSetting("showCriticalLoad", v)} />
            </ConfigRow>
          </div>
        </div>

      </div>
    </div>
  );
};

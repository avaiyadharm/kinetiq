"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SimulationPageLayout, TabType } from "@/components/simulations/SimulationPageLayout";
import { KineticEnergyCanvas } from "./KineticEnergyCanvas";
import { KineticEnergyControls } from "./KineticEnergyControls";
import { KineticEnergyTheory } from "./KineticEnergyTheory";
import { KineticEnergyGuide } from "./KineticEnergyGuide";
import { KineticEnergyAnalytics } from "./KineticEnergyAnalytics";
import { Zap, RotateCcw } from "lucide-react";

export type SubModeType = "translational" | "rotational" | "relativistic" | "thermal" | "quantum";

export const KineticEnergySimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("canvas");
  const [subMode, setSubMode] = useState<SubModeType>("translational");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // 1. Translational States
  const [transMass, setTransMass] = useState<number>(5.0); // kg
  const [transVelocity, setTransVelocity] = useState<number>(10.0); // m/s
  const [transFriction, setTransFriction] = useState<number>(0.0); // Coefficient of friction
  const [impulseBoost, setImpulseBoost] = useState<number>(0); // Active impulse booster trigger

  // 2. Rotational States
  const [rotShape, setRotShape] = useState<"ring" | "disk" | "sphere" | "rod">("disk");
  const [rotMass, setRotMass] = useState<number>(2.0); // kg
  const [rotRadius, setRotRadius] = useState<number>(0.5); // m
  const [rotOmega, setRotOmega] = useState<number>(10.0); // rad/s

  // 3. Relativistic States
  const [relMass, setRelMass] = useState<number>(1.0); // in relative units, or 9.11e-31 for electron scale
  const [relBeta, setRelBeta] = useState<number>(0.5); // v/c (0.0 to 0.999)

  // 4. Thermal States
  const [thermalTemp, setThermalTemp] = useState<number>(300.0); // Kelvin
  const [thermalGas, setThermalGas] = useState<"He" | "Ar" | "Xe">("He"); // Helium, Argon, Xenon
  const [particleCount, setParticleCount] = useState<number>(100);

  // 5. Quantum States
  const [quantumN, setQuantumN] = useState<number>(1); // Principal quantum number (1 to 5)
  const [wellWidth, setWellWidth] = useState<number>(1.0); // nm (0.5 to 3.0)
  const [quantumParticle, setQuantumParticle] = useState<"electron" | "proton">("electron");

  // Reset all values to standard defaults
  const handleReset = () => {
    setIsPlaying(true);
    // Translational
    setTransMass(5.0);
    setTransVelocity(10.0);
    setTransFriction(0.0);
    setImpulseBoost(0);
    // Rotational
    setRotShape("disk");
    setRotMass(2.0);
    setRotRadius(0.5);
    setRotOmega(10.0);
    // Relativistic
    setRelMass(1.0);
    setRelBeta(0.5);
    // Thermal
    setThermalTemp(300.0);
    setThermalGas("He");
    setParticleCount(100);
    // Quantum
    setQuantumN(1);
    setWellWidth(1.0);
    setQuantumParticle("electron");
  };

  // Helper calculation for translational KE
  const getTranslationalKE = () => 0.5 * transMass * transVelocity * transVelocity;

  // Moment of Inertia calculations
  const getMomentOfInertia = () => {
    switch (rotShape) {
      case "ring": return rotMass * rotRadius * rotRadius;
      case "disk": return 0.5 * rotMass * rotRadius * rotRadius;
      case "sphere": return 0.4 * rotMass * rotRadius * rotRadius; // Solid sphere: 2/5 MR^2
      case "rod": return (1/12) * rotMass * rotRadius * rotRadius; // Rod pivoting about center: 1/12 ML^2 (using R as length L)
    }
  };

  const getRotationalKE = () => {
    const I = getMomentOfInertia();
    return 0.5 * I * rotOmega * rotOmega;
  };

  // Relativistic calculation: E_k = (gamma - 1) * m * c^2
  // Let's use relative unit where c = 1, so KE = (gamma - 1) * m
  // To make it look like Joules or Electron Volts, let's assume a resting energy E0 = m_e * c^2 = 0.511 MeV for electron
  const getRelativisticStats = () => {
    const gamma = 1 / Math.sqrt(1 - relBeta * relBeta);
    const restEnergyMeV = quantumParticle === "electron" ? 0.511 : 938.27; // Electron vs Proton mass energy in MeV
    const restEnergy = restEnergyMeV * relMass;
    const relativisticKE = (gamma - 1) * restEnergy;
    const classicalKE = 0.5 * restEnergy * relBeta * relBeta;
    return { gamma, classicalKE, relativisticKE, restEnergy, totalEnergy: gamma * restEnergy };
  };

  // Thermal average kinetic energy: E = (d/2) * k_B * T. In 2D, degrees of freedom d = 2, so E = k_B * T
  // Let's represent it in units of electronvolts (eV) or standard Joules scaled up by 1e21
  const getThermalStats = () => {
    const kB = 1.380649e-23; // J/K
    const avgKEJ = 1.5 * kB * thermalTemp; // 3D ideal gas KE
    const avgKE2D = kB * thermalTemp; // 2D ideal gas KE
    // molar mass in kg/mol: He = 4e-3, Ar = 40e-3, Xe = 131e-3
    const molarMass = thermalGas === "He" ? 4.0e-3 : thermalGas === "Ar" ? 40.0e-3 : 131.0e-3;
    const NA = 6.022e23;
    const mParticle = molarMass / NA;
    const vRms = Math.sqrt((3 * kB * thermalTemp) / mParticle);
    return { avgKEJ, avgKEeV: avgKEJ * 6.242e18, vRms, avgKE2D };
  };

  // Quantum Particle in a Box: E_n = n^2 * h^2 / (8 * m * L^2)
  const getQuantumStats = () => {
    const h = 6.626e-34; // J s
    const mElectron = 9.109e-31; // kg
    const mProton = 1.673e-27; // kg
    const m = quantumParticle === "electron" ? mElectron : mProton;
    const L = wellWidth * 1e-9; // meters
    const EJ = (quantumN * quantumN * h * h) / (8 * m * L * L);
    const EeV = EJ * 6.242e18; // to eV
    return { EJ, EeV };
  };

  const renderCanvasTab = () => {
    const transKE = getTranslationalKE();
    const rotKE = getRotationalKE();
    const relStats = getRelativisticStats();
    const thermalStats = getThermalStats();
    const quantumStats = getQuantumStats();

    // Derived HUD stats based on active sub-mode
    const getHudStats = () => {
      switch (subMode) {
        case "translational":
          return [
            { label: "Mass", value: `${transMass.toFixed(1)} kg`, color: "text-white" },
            { label: "Velocity", value: `${transVelocity.toFixed(1)} m/s`, color: "text-cyan-400" },
            { label: "Classical KE", value: `${transKE.toFixed(1)} J`, color: "text-emerald-400 font-bold" },
            { label: "Friction coeff (μ)", value: `${transFriction.toFixed(2)}`, color: "text-amber-400" },
          ];
        case "rotational":
          return [
            { label: "Mass", value: `${rotMass.toFixed(1)} kg`, color: "text-white" },
            { label: "Radius", value: `${rotRadius.toFixed(2)} m`, color: "text-white/60" },
            { label: "Angular speed (ω)", value: `${rotOmega.toFixed(1)} rad/s`, color: "text-cyan-400" },
            { label: "Rotational KE", value: `${rotKE.toFixed(1)} J`, color: "text-emerald-400 font-bold" },
          ];
        case "relativistic":
          return [
            { label: "Beta (v/c)", value: `${relBeta.toFixed(3)}`, color: "text-cyan-400" },
            { label: "Lorentz Factor (γ)", value: `${relStats.gamma.toFixed(4)}`, color: "text-amber-400 font-mono" },
            { label: "Relativistic KE", value: `${relStats.relativisticKE.toFixed(2)} MeV`, color: "text-emerald-400 font-bold" },
            { label: "Classical KE Limit", value: `${relStats.classicalKE.toFixed(2)} MeV`, color: "text-white/40" },
          ];
        case "thermal":
          return [
            { label: "Temperature", value: `${thermalTemp.toFixed(1)} K`, color: "text-cyan-400" },
            { label: "Gas Type", value: thermalGas === "He" ? "Helium-4" : thermalGas === "Ar" ? "Argon-40" : "Xenon-131", color: "text-white" },
            { label: "RMS velocity", value: `${thermalStats.vRms.toFixed(1)} m/s`, color: "text-amber-400" },
            { label: "Avg Kinetic Energy", value: `${(thermalStats.avgKEeV * 1000).toFixed(2)} meV`, color: "text-emerald-400 font-bold" },
          ];
        case "quantum":
          return [
            { label: "State index (n)", value: `${quantumN}`, color: "text-cyan-400" },
            { label: "Well Width (L)", value: `${wellWidth.toFixed(2)} nm`, color: "text-white" },
            { label: "Particle Type", value: quantumParticle.toUpperCase(), color: "text-white/60" },
            { label: "Quantized KE (E_n)", value: `${quantumStats.EeV.toExponential(3)} eV`, color: "text-emerald-400 font-bold" },
          ];
      }
    };

    return (
      <div className="flex-1 flex overflow-hidden relative bg-[#09090b]">
        {/* Blueprint mesh background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(6,182,212,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Left simulation view */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-3 relative">
          
          {/* SubMode Selector Pill Buttons */}
          <div className="flex bg-[#18181b]/80 border border-white/5 p-1 rounded-xl w-fit self-center gap-1 shadow-lg shrink-0">
            {(["translational", "rotational", "relativistic", "thermal", "quantum"] as SubModeType[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSubMode(mode)}
                className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                  subMode === mode
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* HUD statistics display */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {getHudStats().map((item) => (
              <div key={item.label} className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex flex-col min-w-0 shadow-sm">
                <span className="text-[7.5px] text-white/30 uppercase font-black tracking-widest whitespace-nowrap">{item.label}</span>
                <span className={`text-[10.5px] font-mono font-black mt-0.5 whitespace-nowrap ${item.color}`}>{item.value}</span>
              </div>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-xl border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-white/20"}`}
                  style={{ boxShadow: isPlaying ? "0 0 6px rgba(16,185,129,0.6)" : "none" }} />
                <span className="text-[8.5px] font-black text-white/40 uppercase tracking-widest">{isPlaying ? "ACTIVE" : "PAUSED"}</span>
              </div>
            </div>
          </div>

          {/* Simulation canvas viewport */}
          <div className="flex-1 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl min-h-0">
            <KineticEnergyCanvas
              subMode={subMode}
              isPlaying={isPlaying}
              transMass={transMass}
              transVelocity={transVelocity}
              setTransVelocity={setTransVelocity}
              transFriction={transFriction}
              impulseBoost={impulseBoost}
              setImpulseBoost={setImpulseBoost}
              rotShape={rotShape}
              rotMass={rotMass}
              rotRadius={rotRadius}
              rotOmega={rotOmega}
              setRotOmega={setRotOmega}
              relMass={relMass}
              relBeta={relBeta}
              thermalTemp={thermalTemp}
              thermalGas={thermalGas}
              particleCount={particleCount}
              quantumN={quantumN}
              wellWidth={wellWidth}
              quantumParticle={quantumParticle}
            />
          </div>
        </div>

        {/* Right controller and parameter panel */}
        <div className="w-[340px] shrink-0 border-l border-white/5 flex flex-col bg-[#0c0c0e] overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-display font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">
                <Zap className="w-4 h-4 fill-cyan-400/20" />
                <span>Simulation Controls</span>
              </div>
              <KineticEnergyControls
                subMode={subMode}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                transMass={transMass}
                setTransMass={setTransMass}
                transVelocity={transVelocity}
                setTransVelocity={setTransVelocity}
                transFriction={transFriction}
                setTransFriction={setTransFriction}
                setImpulseBoost={setImpulseBoost}
                rotShape={rotShape}
                setRotShape={setRotShape}
                rotMass={rotMass}
                setRotMass={setRotMass}
                rotRadius={rotRadius}
                setRotRadius={setRotRadius}
                rotOmega={rotOmega}
                setRotOmega={setRotOmega}
                relMass={relMass}
                setRelMass={setRelMass}
                relBeta={relBeta}
                setRelBeta={setRelBeta}
                thermalTemp={thermalTemp}
                setThermalTemp={setThermalTemp}
                thermalGas={thermalGas}
                setThermalGas={setThermalGas}
                particleCount={particleCount}
                setParticleCount={setParticleCount}
                quantumN={quantumN}
                setQuantumN={setQuantumN}
                wellWidth={wellWidth}
                setWellWidth={setWellWidth}
                quantumParticle={quantumParticle}
                setQuantumParticle={setQuantumParticle}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SimulationPageLayout
      title="Kinetic Energy Laboratory"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      showAnalyticsTab={true}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {activeTab === "canvas" && renderCanvasTab()}
          {activeTab === "theory" && (
            <KineticEnergyTheory />
          )}
          {activeTab === "guide" && (
            <KineticEnergyGuide />
          )}
          {activeTab === "analytics" && (
            <KineticEnergyAnalytics
              subMode={subMode}
              transMass={transMass}
              transVelocity={transVelocity}
              rotShape={rotShape}
              rotMass={rotMass}
              rotRadius={rotRadius}
              rotOmega={rotOmega}
              relMass={relMass}
              relBeta={relBeta}
              thermalTemp={thermalTemp}
              thermalGas={thermalGas}
              quantumN={quantumN}
              wellWidth={wellWidth}
              quantumParticle={quantumParticle}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </SimulationPageLayout>
  );
};

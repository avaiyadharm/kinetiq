"use client";

import React, { useRef, useEffect, useState } from "react";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { GasEngine } from "@/lib/physics/engine";
import { ThermodynamicsAnalyzer, getTheoreticalMaxwellBoltzmann3D } from "@/lib/physics/thermodynamics";
import { 
  Maximize2, Pause, Play, Download, RefreshCw, Info, Settings2,
  TrendingUp, Activity, BarChart2, Compass, Layers
} from "lucide-react";

// Font configurations for scientific aesthetics
const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

// Type definitions for graph configurations
type GraphType = 
  | "PV"                  // P-V Diagram
  | "VT"                  // V-T Graph
  | "PT"                  // P-T Graph
  | "Entropy"             // Entropy vs Time
  | "MaxwellBoltzmann"    // Velocity distribution
  | "BoltzmannEnergy"     // Kinetic energy distribution
  | "CollisionAnalytics"  // Collision frequency vs density
  | "Diffusion"           // Concentration vs position
  | "DiffusionVariance"   // Variance of position vs time
  | "Compressibility"     // Z factor vs Pressure
  | "PhaseSpace"          // Phase Space scatter plot
  | "OccupancyGrid";      // Coarse-grained density grid

interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface GraphPanelProps {
  regime: "free" | "boyle" | "charles" | "gay-lussac" | "avogadro" | "adiabatic";
  gasPreset: "ideal" | "helium" | "xenon" | "real";
  particleMode: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy";
  simulationMode: "md" | "mc";
  attractiveForce: number;
  particleMass: number;
  particleCount: number;
}

export const GasLawsScientificGraphPanel: React.FC<GraphPanelProps> = ({
  regime,
  gasPreset,
  particleMode,
  simulationMode,
  attractiveForce,
  particleMass,
  particleCount
}) => {
  // Toggle states
  const [autoMap, setAutoMap] = useState<boolean>(true);
  const [primaryType, setPrimaryType] = useState<GraphType>("PV");
  const [secondaryType, setSecondaryType] = useState<GraphType>("MaxwellBoltzmann");
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // References to canvas elements
  const canvasPrimaryRef = useRef<HTMLCanvasElement>(null);
  const canvasSecondaryRef = useRef<HTMLCanvasElement>(null);
  const containerPrimaryRef = useRef<HTMLDivElement>(null);
  const containerSecondaryRef = useRef<HTMLDivElement>(null);

  // Viewport states for Zoom and Pan (in model coordinates)
  const primaryViewport = useRef<Viewport>({ xMin: 0, xMax: 12, yMin: 0, yMax: 8000 });
  const secondaryViewport = useRef<Viewport>({ xMin: 0, xMax: 1200, yMin: 0, yMax: 0.005 });

  // Flags to check if viewport was set by user
  const primaryViewportInitialized = useRef<GraphType | null>(null);
  const secondaryViewportInitialized = useRef<GraphType | null>(null);

  // Hover states for tooltips and crosshairs
  const [primaryHover, setPrimaryHover] = useState<{ px: number; py: number; mx: number; my: number } | null>(null);
  const [secondaryHover, setSecondaryHover] = useState<{ px: number; py: number; mx: number; my: number } | null>(null);

  // Drag state for panning
  const isDraggingPrimary = useRef<boolean>(false);
  const isDraggingSecondary = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Decoupled rolling history buffers inside refs to ensure 60fps performance
  const historyEntropy = useRef<{ s: number; sMax: number; t: number }[]>([]);
  const historyVT = useRef<{ v: number; t: number; time: number }[]>([]);
  const historyPT = useRef<{ p: number; t: number; time: number }[]>([]);
  const historyPV = useRef<{ v: number; p: number; regime: string; preset: string }[]>([]);
  const historyZ = useRef<{ p: number; z: number }[]>([]);
  const historyVariance = useRef<{ val: number; t: number }[]>([]);
  const historyCollision = useRef<{ density: number; freq: number }[]>([]);

  // Time tracker for rolling graphs
  const timeStepCounter = useRef<number>(0);
  const lastUpdateFrame = useRef<number>(0);

  // 1. Intelligence Layer: Map Simulation States to graphs
  useEffect(() => {
    if (!autoMap) return;

    // Determine primary graph
    let prim: GraphType = "PV";
    if (regime === "charles" || regime === "avogadro") {
      prim = "VT";
    } else if (regime === "gay-lussac") {
      prim = "PT";
    } else if (particleMode === "entropy") {
      prim = "Entropy";
    } else if (particleMode === "diffusion") {
      prim = "Diffusion";
    } else if (gasPreset === "real") {
      prim = "PV"; // Real gas VDW curve
    } else if (particleMode === "normal") {
      prim = "PV";
    }

    // Determine secondary graph
    let sec: GraphType = "MaxwellBoltzmann";
    if (regime === "adiabatic") {
      sec = "BoltzmannEnergy"; // internal energy distribution
    } else if (gasPreset === "real") {
      sec = "Compressibility"; // compressibility map Z vs P
    } else if (particleMode === "entropy") {
      sec = "OccupancyGrid"; // microstate cell occupancy
    } else if (particleMode === "diffusion") {
      sec = "DiffusionVariance"; // position variance vs time
    } else if (particleMode === "mean-free-path") {
      sec = "CollisionAnalytics";
    } else {
      sec = "MaxwellBoltzmann";
    }

    setPrimaryType(prim);
    setSecondaryType(sec);
  }, [regime, gasPreset, particleMode, autoMap]);

  // Set default viewports whenever graph type changes
  const resetViewport = (target: "primary" | "secondary", gType: GraphType) => {
    const state = useGasLawsStore.getState();
    const activePMax = Math.max(8000, particleCount * 12);
    
    if (target === "primary") {
      primaryViewportInitialized.current = gType;
      switch (gType) {
        case "PV":
          primaryViewport.current = { xMin: 2.0, xMax: 12.0, yMin: 0, yMax: activePMax };
          break;
        case "VT":
          primaryViewport.current = { xMin: 0, xMax: 900, yMin: 2.0, yMax: 12.0 };
          break;
        case "PT":
          primaryViewport.current = { xMin: 0, xMax: 900, yMin: 0, yMax: activePMax };
          break;
        case "Entropy":
          primaryViewport.current = { xMin: 0, xMax: 300, yMin: 0, yMax: 5.0 };
          break;
        case "MaxwellBoltzmann":
          primaryViewport.current = { xMin: 0, xMax: Math.max(1200, state.v_rms * 2.2), yMin: 0, yMax: 0.005 };
          break;
        case "BoltzmannEnergy":
          primaryViewport.current = { xMin: 0, xMax: 150, yMin: 0, yMax: 0.05 };
          break;
        case "CollisionAnalytics":
          primaryViewport.current = { xMin: 0, xMax: 200, yMin: 0, yMax: 5000 };
          break;
        case "Diffusion":
          primaryViewport.current = { xMin: 0, xMax: 1.0, yMin: 0, yMax: 0.5 };
          break;
        case "DiffusionVariance":
          primaryViewport.current = { xMin: 0, xMax: 300, yMin: 0, yMax: 0.1 };
          break;
        case "Compressibility":
          primaryViewport.current = { xMin: 0, xMax: 15000, yMin: 0.2, yMax: 2.2 };
          break;
        case "PhaseSpace":
          primaryViewport.current = { xMin: 0, xMax: 1.0, yMin: -6, yMax: 6 };
          break;
        case "OccupancyGrid":
          primaryViewport.current = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
          break;
      }
    } else {
      secondaryViewportInitialized.current = gType;
      switch (gType) {
        case "PV":
          secondaryViewport.current = { xMin: 2.0, xMax: 12.0, yMin: 0, yMax: activePMax };
          break;
        case "VT":
          secondaryViewport.current = { xMin: 0, xMax: 900, yMin: 2.0, yMax: 12.0 };
          break;
        case "PT":
          secondaryViewport.current = { xMin: 0, xMax: 900, yMin: 0, yMax: activePMax };
          break;
        case "Entropy":
          secondaryViewport.current = { xMin: 0, xMax: 300, yMin: 0, yMax: 5.0 };
          break;
        case "MaxwellBoltzmann":
          secondaryViewport.current = { xMin: 0, xMax: Math.max(1200, state.v_rms * 2.2), yMin: 0, yMax: 0.005 };
          break;
        case "BoltzmannEnergy":
          secondaryViewport.current = { xMin: 0, xMax: 150, yMin: 0, yMax: 0.05 };
          break;
        case "CollisionAnalytics":
          secondaryViewport.current = { xMin: 0, xMax: 200, yMin: 0, yMax: 5000 };
          break;
        case "Diffusion":
          secondaryViewport.current = { xMin: 0, xMax: 1.0, yMin: 0, yMax: 0.5 };
          break;
        case "DiffusionVariance":
          secondaryViewport.current = { xMin: 0, xMax: 300, yMin: 0, yMax: 0.1 };
          break;
        case "Compressibility":
          secondaryViewport.current = { xMin: 0, xMax: 15000, yMin: 0.2, yMax: 2.2 };
          break;
        case "PhaseSpace":
          secondaryViewport.current = { xMin: 0, xMax: 1.0, yMin: -6, yMax: 6 };
          break;
        case "OccupancyGrid":
          secondaryViewport.current = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
          break;
      }
    }
  };

  // Keep viewports updated on preset type switches
  useEffect(() => {
    resetViewport("primary", primaryType);
  }, [primaryType, particleCount]);

  useEffect(() => {
    resetViewport("secondary", secondaryType);
  }, [secondaryType, particleCount]);

  // Reset all history buffers
  const clearHistory = () => {
    historyEntropy.current = [];
    historyVT.current = [];
    historyPT.current = [];
    historyPV.current = [];
    historyZ.current = [];
    historyVariance.current = [];
    historyCollision.current = [];
    timeStepCounter.current = 0;
  };

  // Clear history on regime or preset change
  useEffect(() => {
    clearHistory();
  }, [regime, gasPreset, particleMode]);

  // 2. Real-time Trajectory and History Pipeline (runs 60fps via requestAnimationFrame loop)
  useEffect(() => {
    let animId: number;

    const canvasPrim = canvasPrimaryRef.current;
    const canvasSec = canvasSecondaryRef.current;
    if (!canvasPrim || !canvasSec) return;

    const ctxPrim = canvasPrim.getContext("2d");
    const ctxSec = canvasSec.getContext("2d");
    if (!ctxPrim || !ctxSec) return;

    // Handle Resize
    const resizeCanvas = (canvas: HTMLCanvasElement, container: HTMLDivElement) => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        const dpr = window.devicePixelRatio || 1;
        const newW = Math.round(w * dpr);
        const newH = Math.round(h * dpr);
        if (canvas.width !== newW || canvas.height !== newH) {
          canvas.width = newW;
          canvas.height = newH;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
          const ctx = canvas.getContext("2d");
          ctx?.scale(dpr, dpr);
        }
      }
    };

    const handleAllResizes = () => {
      if (containerPrimaryRef.current) resizeCanvas(canvasPrim, containerPrimaryRef.current);
      if (containerSecondaryRef.current) resizeCanvas(canvasSec, containerSecondaryRef.current);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleAllResizes();
    });
    if (containerPrimaryRef.current) resizeObserver.observe(containerPrimaryRef.current);
    if (containerSecondaryRef.current) resizeObserver.observe(containerSecondaryRef.current);

    // Initial resize
    handleAllResizes();

    // Render loop
    const tick = () => {
      const storeState = useGasLawsStore.getState();

      // Accumulate physics history if not frozen
      if (!isFrozen) {
        timeStepCounter.current++;
        const currentV = storeState.measuredVolume;
        const currentP = storeState.measuredPressure;
        const currentT = storeState.measuredTemp;
        const currentS = storeState.entropy;
        const currentSMax = storeState.entropyMax;
        const currentZ = storeState.compressibilityZ;

        // 1. PV History
        if (historyPV.current.length === 0 || 
            Math.abs(historyPV.current[historyPV.current.length - 1].v - currentV) > 0.01 || 
            Math.abs(historyPV.current[historyPV.current.length - 1].p - currentP) > 5) {
          historyPV.current.push({ v: currentV, p: currentP, regime, preset: gasPreset });
          if (historyPV.current.length > 500) historyPV.current.shift();
        }

        // 2. VT History
        if (timeStepCounter.current % 5 === 0) {
          historyVT.current.push({ v: currentV, t: currentT, time: timeStepCounter.current });
          if (historyVT.current.length > 300) historyVT.current.shift();

          historyPT.current.push({ p: currentP, t: currentT, time: timeStepCounter.current });
          if (historyPT.current.length > 300) historyPT.current.shift();

          historyEntropy.current.push({ s: currentS, sMax: currentSMax, t: timeStepCounter.current });
          if (historyEntropy.current.length > 300) historyEntropy.current.shift();

          historyZ.current.push({ p: currentP, z: currentZ });
          if (historyZ.current.length > 300) historyZ.current.shift();

          // Calculate variance for diffusion: Var = 1/N * sum((x - mean)^2)
          if (particleMode === "diffusion" && storeState.phaseSpacePoints.length > 0) {
            const points = storeState.phaseSpacePoints;
            const meanX = points.reduce((acc, curr) => acc + curr.x, 0) / points.length;
            const variance = points.reduce((acc, curr) => acc + (curr.x - meanX) ** 2, 0) / points.length;
            historyVariance.current.push({ val: variance, t: timeStepCounter.current });
            if (historyVariance.current.length > 300) historyVariance.current.shift();
          }

          // Calculate Collision history
          const density = particleCount / (currentV || 1);
          historyCollision.current.push({ density, freq: storeState.collisionCount });
          if (historyCollision.current.length > 300) historyCollision.current.shift();
        }
      }

      // Draw Viewports
      drawViewport(canvasPrim, ctxPrim, primaryType, primaryViewport.current, primaryHover, "primary");
      drawViewport(canvasSec, ctxSec, secondaryType, secondaryViewport.current, secondaryHover, "secondary");

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [primaryType, secondaryType, isFrozen, primaryHover, secondaryHover, particleCount, regime, gasPreset, particleMode, showAnnotations]);

  // 3. CORE PLOTTING ROUTINE
  const drawViewport = (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    gType: GraphType, 
    vp: Viewport, 
    hover: typeof primaryHover,
    viewportId: "primary" | "secondary"
  ) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    // Grid layout margins
    const ml = 52, mb = 35, mt = 25, mr = 20;
    const graphW = w - ml - mr;
    const graphH = h - mt - mb;

    // Draw background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(ml, mt, graphW, graphH);

    // Border
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.strokeRect(ml, mt, graphW, graphH);

    // helper to map model -> pixels
    const toPxX = (mx: number) => ml + ((mx - vp.xMin) / (vp.xMax - vp.xMin || 1)) * graphW;
    const toPxY = (my: number) => mt + graphH - ((my - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;

    // helper to map pixels -> model
    const toModelX = (px: number) => vp.xMin + ((px - ml) / graphW) * (vp.xMax - vp.xMin);
    const toModelY = (py: number) => vp.yMin + (1 - (py - mt) / graphH) * (vp.yMax - vp.yMin);

    // Draw Grid Lines and Labels
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.8;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `8px ${FONT_MONO}`;
    ctx.textAlign = "center";

    // X-Axis Grid & Ticks (6 divisions)
    const xDivs = 6;
    for (let i = 0; i <= xDivs; i++) {
      const modelVal = vp.xMin + (i / xDivs) * (vp.xMax - vp.xMin);
      const px = toPxX(modelVal);
      if (px >= ml && px <= ml + graphW) {
        ctx.beginPath();
        ctx.moveTo(px, mt);
        ctx.lineTo(px, mt + graphH);
        ctx.stroke();

        // Ticks
        ctx.strokeStyle = "#27272a";
        ctx.beginPath();
        ctx.moveTo(px, mt + graphH);
        ctx.lineTo(px, mt + graphH + 4);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.03)";

        // Value text
        ctx.fillText(formatScientific(modelVal, gType === "Diffusion" ? 2 : 1), px, mt + graphH + 12);
      }
    }

    // Y-Axis Grid & Ticks (5 divisions)
    const yDivs = 5;
    ctx.textAlign = "right";
    for (let i = 0; i <= yDivs; i++) {
      const modelVal = vp.yMin + (i / yDivs) * (vp.yMax - vp.yMin);
      const py = toPxY(modelVal);
      if (py >= mt && py <= mt + graphH) {
        ctx.beginPath();
        ctx.moveTo(ml, py);
        ctx.lineTo(ml + graphW, py);
        ctx.stroke();

        // Ticks
        ctx.strokeStyle = "#27272a";
        ctx.beginPath();
        ctx.moveTo(ml - 4, py);
        ctx.lineTo(ml, py);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.03)";

        // Value text
        ctx.fillText(formatScientific(modelVal, gType === "MaxwellBoltzmann" ? 4 : 1), ml - 8, py + 3);
      }
    }

    // 4. DRAW GRAPH DATA
    const state = useGasLawsStore.getState();
    const liveV = state.measuredVolume;
    const liveP = state.measuredPressure;
    const liveT = state.measuredTemp;

    // Draw Title & Axis Labels
    drawTitlesAndLabels(ctx, gType, ml, mt, mr, mb, graphW, graphH, w, h);

    // Apply specific plotting logic based on GraphType
    switch (gType) {
      case "PV": {
        // Draw Reference Isotherms
        ctx.lineWidth = 1;
        const refTemps = [200, 400, 600, 800];
        refTemps.forEach((temp) => {
          ctx.strokeStyle = temp === Math.round(liveT / 100) * 100 
            ? "rgba(16, 185, 129, 0.15)" 
            : "rgba(255, 255, 255, 0.025)";
          
          ctx.beginPath();
          let first = true;
          for (let vx = vp.xMin; vx <= vp.xMax; vx += (vp.xMax - vp.xMin) / 100) {
            // PV = N k_B T -> P = (N * K_B * T) / V
            // Microscale volume to macro
            const vM3 = vx / ThermodynamicsAnalyzer.VOL_SCALE;
            const pPa = (particleCount * GasEngine.K_B * temp) / vM3;
            const pKpa = pPa * ThermodynamicsAnalyzer.PRES_SCALE;
            const px = toPxX(vx);
            const py = toPxY(pKpa);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();

          // Label reference isotherms on right edge
          if (showAnnotations) {
            const labelV = vp.xMax - 1.0;
            const vM3 = labelV / ThermodynamicsAnalyzer.VOL_SCALE;
            const pPa = (particleCount * GasEngine.K_B * temp) / vM3;
            const pKpa = pPa * ThermodynamicsAnalyzer.PRES_SCALE;
            const lx = toPxX(labelV);
            const ly = toPxY(pKpa);
            if (lx >= ml && lx <= ml + graphW && ly >= mt && ly <= mt + graphH) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
              ctx.font = `7px ${FONT_MONO}`;
              ctx.textAlign = "left";
              ctx.fillText(`${temp}K (Isotherm)`, lx + 2, ly + 2);
            }
          }
        });

        // If Adiabatic process: show adiabatic expansion curve compared to isothermal
        if (regime === "adiabatic") {
          ctx.strokeStyle = "rgba(236, 72, 153, 0.35)"; // Pink adiabatic path reference
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          // Adiabatic relation: P = P0 * (V0/V)^gamma , gamma = 5/3
          const initialV = 6.0;
          const initialP = (particleCount * GasEngine.K_B * 300) / (initialV / ThermodynamicsAnalyzer.VOL_SCALE) * ThermodynamicsAnalyzer.PRES_SCALE;
          let first = true;
          for (let vx = vp.xMin; vx <= vp.xMax; vx += (vp.xMax - vp.xMin) / 100) {
            const pAdiabatic = initialP * Math.pow(initialV / vx, 5 / 3);
            const px = toPxX(vx);
            const py = toPxY(pAdiabatic);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
          
          if (showAnnotations) {
            ctx.fillStyle = "rgba(236, 72, 153, 0.6)";
            ctx.font = `8px ${FONT_SANS}`;
            ctx.textAlign = "left";
            ctx.fillText("Adiabatic: PV¹·⁶⁷ = C", ml + 10, mt + 45);
          }
        }

        // If Real Gas: Shade the deviation from Ideal Gas
        if (gasPreset === "real" || gasPreset === "xenon") {
          // Under extreme compression/real gas presets, calculate VDW curve:
          // P_vdw = NkT / (V - Nb) - aN^2 / V^2
          ctx.fillStyle = "rgba(245, 158, 11, 0.05)"; // Orange glow
          ctx.beginPath();
          let idealPoints: {x: number, y: number}[] = [];
          let vdwPoints: {x: number, y: number}[] = [];

          for (let vx = vp.xMin; vx <= vp.xMax; vx += (vp.xMax - vp.xMin) / 50) {
            const vM3 = vx / ThermodynamicsAnalyzer.VOL_SCALE;
            
            // 1. Ideal
            const pIdeal = (particleCount * GasEngine.K_B * liveT) / vM3 * ThermodynamicsAnalyzer.PRES_SCALE;
            
            // 2. VDW
            let a_coeff = attractiveForce * 1.5e-42;
            let b_coeff = gasPreset === "xenon" ? 5.0e-25 : 3.0e-25;
            const denominator = vM3 - particleCount * b_coeff;
            const pVdw = denominator > 0
              ? ((particleCount * GasEngine.K_B * liveT) / denominator - (a_coeff * particleCount * particleCount) / (vM3 * vM3)) * ThermodynamicsAnalyzer.PRES_SCALE
              : pIdeal;

            const px = toPxX(vx);
            const pyIdeal = toPxY(pIdeal);
            const pyVdw = toPxY(pVdw);

            if (px >= ml && px <= ml + graphW) {
              idealPoints.push({ x: px, y: Math.max(mt, Math.min(mt + graphH, pyIdeal)) });
              vdwPoints.push({ x: px, y: Math.max(mt, Math.min(mt + graphH, pyVdw)) });
            }
          }

          // Render shaded deviation area
          if (idealPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(idealPoints[0].x, idealPoints[0].y);
            for (let i = 1; i < idealPoints.length; i++) ctx.lineTo(idealPoints[i].x, idealPoints[i].y);
            for (let i = vdwPoints.length - 1; i >= 0; i--) ctx.lineTo(vdwPoints[i].x, vdwPoints[i].y);
            ctx.closePath();
            ctx.fill();

            // Draw theoretical VDW line (dashed orange)
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.moveTo(vdwPoints[0].x, vdwPoints[0].y);
            for (let i = 1; i < vdwPoints.length; i++) ctx.lineTo(vdwPoints[i].x, vdwPoints[i].y);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          if (showAnnotations) {
            ctx.fillStyle = "#f59e0b";
            ctx.font = `8px ${FONT_SANS}`;
            ctx.textAlign = "left";
            ctx.fillText("Van der Waals Shading (Attractive/Repulsive Deviation)", ml + 10, mt + 45);
          }
        }

        // Draw path history
        const hPV = historyPV.current;
        if (hPV.length > 1) {
          ctx.strokeStyle = regime === "adiabatic" ? "#ec4899" : (gasPreset === "real" ? "#f59e0b" : "#10b981");
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hPV.length; i++) {
            const px = toPxX(hPV[i].v);
            const py = toPxY(hPV[i].p);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }

        // Draw Live State Point (Glowing indicator dot)
        const dotX = toPxX(liveV);
        const dotY = toPxY(liveP);
        if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = regime === "adiabatic" ? "#ec4899" : "#10b981";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Outer pulse ring
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 7 + Math.sin(Date.now() / 150) * 2, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Draw compression direction arrows on path
        if (hPV.length > 4 && showAnnotations) {
          const lastIdx = hPV.length - 1;
          const deltaV = hPV[lastIdx].v - hPV[lastIdx - 4].v;
          if (Math.abs(deltaV) > 0.05) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.font = `10px ${FONT_SANS}`;
            ctx.textAlign = "center";
            const textArrow = deltaV < 0 ? "◀ COMPRESSING (W > 0)" : "▶ EXPANDING (W < 0)";
            ctx.fillText(textArrow, ml + graphW / 2, mt + 20);
          }
        }
        break;
      }

      case "VT": {
        // Linear reference Charles's line: V = nR/P * T
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        // Calculate constant slope: V/T = nR/P -> using live values
        const slope = liveV / (liveT || 300);
        ctx.moveTo(toPxX(vp.xMin), toPxY(vp.xMin * slope));
        ctx.lineTo(toPxX(vp.xMax), toPxY(vp.xMax * slope));
        ctx.stroke();
        ctx.setLineDash([]);

        if (showAnnotations) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = `8px ${FONT_SANS}`;
          ctx.fillText("V ∝ T (Charles's Law)", ml + 10, mt + 15);
        }

        // VT History
        const hVT = historyVT.current;
        if (hVT.length > 1) {
          ctx.strokeStyle = "#3b82f6"; // Blue Charles curve
          ctx.lineWidth = 2;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hVT.length; i++) {
            const px = toPxX(hVT[i].t);
            const py = toPxY(hVT[i].v);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }

        // Live state dot
        const dotX = toPxX(liveT);
        const dotY = toPxY(liveV);
        if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 4, 0, 2*Math.PI);
          ctx.fill();
          ctx.strokeStyle = "#3b82f6";
          ctx.stroke();
        }
        break;
      }

      case "PT": {
        // Linear reference Gay-Lussac line: P = nR/V * T
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const slope = liveP / (liveT || 300);
        ctx.moveTo(toPxX(vp.xMin), toPxY(vp.xMin * slope));
        ctx.lineTo(toPxX(vp.xMax), toPxY(vp.xMax * slope));
        ctx.stroke();
        ctx.setLineDash([]);

        if (showAnnotations) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = `8px ${FONT_SANS}`;
          ctx.fillText("P ∝ T (Gay-Lussac's Law)", ml + 10, mt + 15);
        }

        // PT History
        const hPT = historyPT.current;
        if (hPT.length > 1) {
          ctx.strokeStyle = "#a855f7"; // Purple Gay-Lussac curve
          ctx.lineWidth = 2;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hPT.length; i++) {
            const px = toPxX(hPT[i].t);
            const py = toPxY(hPT[i].p);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }

        // Live state dot
        const dotX = toPxX(liveT);
        const dotY = toPxY(liveP);
        if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 4, 0, 2*Math.PI);
          ctx.fill();
          ctx.strokeStyle = "#a855f7";
          ctx.stroke();
        }
        break;
      }

      case "Entropy": {
        // Max entropy reference line
        const maxS = state.entropyMax;
        const pyMaxS = toPxY(maxS);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // Red limit
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ml, pyMaxS);
        ctx.lineTo(ml + graphW, pyMaxS);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
        ctx.font = `7px ${FONT_MONO}`;
        ctx.textAlign = "right";
        ctx.fillText(`Sₘₐₓ = ${maxS.toFixed(3)} k_B`, ml + graphW - 5, pyMaxS - 4);

        // Entropy History plotting (rolling time series)
        const hS = historyEntropy.current;
        if (hS.length > 1) {
          // Map time index to X axis
          const minT = hS[0].t;
          const maxT = Math.max(minT + 100, hS[hS.length - 1].t);
          
          ctx.strokeStyle = "#10b981"; // Emerald Entropy curve
          ctx.lineWidth = 2;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hS.length; i++) {
            const mappedX = ml + ((hS[i].t - minT) / (maxT - minT)) * graphW;
            const mappedY = toPxY(hS[i].s);
            if (mappedX >= ml && mappedX <= ml + graphW && mappedY >= mt && mappedY <= mt + graphH) {
              if (first) { ctx.moveTo(mappedX, mappedY); first = false; }
              else ctx.lineTo(mappedX, mappedY);
            }
          }
          ctx.stroke();

          // Convergence / Equilibrium HUD overlay
          if (showAnnotations && state.isEquilibrium) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
            ctx.fillRect(ml + 10, mt + 10, 160, 20);
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(ml + 10, mt + 10, 160, 20);

            ctx.fillStyle = "#10b981";
            ctx.font = `8px ${FONT_SANS}`;
            ctx.textAlign = "left";
            ctx.fillText("✓ EQUILIBRIUM ACHIEVED (S -> S_max)", ml + 15, mt + 22);
          }
        }
        break;
      }

      case "MaxwellBoltzmann": {
        // Speed distribution histogram & theoretical overlay
        const speedHist = state.speedHistogram || [];
        const binW = state.binWidth || 5;
        const binCount = speedHist.length;

        // Draw actual histogram bars
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 0.8;
        const barW = graphW / (binCount || 1);

        // Normalize Y based on peak of theoretical curve
        const peakHeight = getTheoreticalMaxwellBoltzmann3D(state.v_mostProbable, particleMass, liveT);
        vp.yMax = Math.max(peakHeight * 1.35, 0.002);
        vp.xMax = Math.max(1200, state.v_rms * 2.2);

        for (let i = 0; i < binCount; i++) {
          const density = speedHist[i];
          if (density > 0) {
            const barH = (density / vp.yMax) * graphH;
            const bx = ml + i * barW;
            const by = mt + graphH - barH;
            ctx.fillRect(bx + 0.5, by, barW - 1, barH);
            ctx.strokeRect(bx + 0.5, by, barW - 1, barH);
          }
        }

        // Theoretical 3D Maxwell-Boltzmann Curve Overlay
        if (liveT > 0) {
          ctx.strokeStyle = "#ec4899"; // Pink theoretical curve
          ctx.lineWidth = 2;
          ctx.beginPath();
          let first = true;
          for (let vx = 0; vx <= graphW; vx += 2) {
            const speed = vp.xMin + (vx / graphW) * (vp.xMax - vp.xMin);
            const f_v = getTheoreticalMaxwellBoltzmann3D(speed, particleMass, liveT);
            const py = toPxY(f_v);
            if (py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(ml + vx, py); first = false; }
              else ctx.lineTo(ml + vx, py);
            }
          }
          ctx.stroke();
        }

        // Vertical lines for v_p, v_avg, v_rms
        const drawVLine = (vVal: number, color: string, label: string, yOffset: number) => {
          const px = toPxX(vVal);
          if (px >= ml && px <= ml + graphW) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, mt);
            ctx.lineTo(px, mt + graphH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = color;
            ctx.font = `8px ${FONT_MONO}`;
            ctx.textAlign = "left";
            ctx.fillText(`${label}: ${Math.round(vVal)}m/s`, px + 4, mt + yOffset);
          }
        };

        if (state.v_rms > 0) {
          drawVLine(state.v_mostProbable, "#f43f5e", "v_p", 12);
          drawVLine(state.meanSpeed, "#8b5cf6", "v_avg", 24);
          drawVLine(state.v_rms, "#3b82f6", "v_rms", 36);
        }
        break;
      }

      case "BoltzmannEnergy": {
        // Kinetic Energy distribution
        const energyHist = state.energyHistogram || [];
        const binCount = energyHist.length || 60;
        const eBinW = state.energyBinWidth || 1;

        // Peak energy scaling
        const E_mean = (state.systemEnergy) / (particleCount || 1);
        vp.xMax = Math.max(120, E_mean * 3.5);
        
        let maxHistVal = 0.005;
        for (let i = 0; i < binCount; i++) if (energyHist[i] > maxHistVal) maxHistVal = energyHist[i];
        vp.yMax = maxHistVal * 1.25;

        // Draw Histogram
        ctx.fillStyle = "rgba(59, 130, 246, 0.25)"; // Blue bars
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 0.8;
        const barW = graphW / binCount;

        for (let i = 0; i < binCount; i++) {
          const density = energyHist[i];
          if (density > 0) {
            const barH = (density / vp.yMax) * graphH;
            const bx = ml + i * barW;
            const by = mt + graphH - barH;
            ctx.fillRect(bx + 0.5, by, barW - 1, barH);
            ctx.strokeRect(bx + 0.5, by, barW - 1, barH);
          }
        }

        // Theoretical 3D Boltzmann distribution overlay: P(E) = 2/sqrt(pi) * (1/kT)^1.5 * sqrt(E) * e^-E/kT
        if (liveT > 0) {
          ctx.strokeStyle = "#10b981"; // green theoretical curve
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          let first = true;
          // kT in macro energy scale (equivalent to E_mean = 1.5 * K_B * T * ENERGY_SCALE)
          const kT = E_mean / 1.5;
          const prefactor = 2 / Math.sqrt(Math.PI) * Math.pow(1 / (kT || 1), 1.5);
          
          for (let vx = 0; vx <= graphW; vx += 2) {
            const E = vp.xMin + (vx / graphW) * (vp.xMax - vp.xMin);
            if (E <= 0) continue;
            const P_E = prefactor * Math.sqrt(E) * Math.exp(-E / kT);
            const py = toPxY(P_E);
            if (py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(ml + vx, py); first = false; }
              else ctx.lineTo(ml + vx, py);
            }
          }
          ctx.stroke();
        }

        // Draw average energy line
        const pxAvg = toPxX(E_mean);
        if (pxAvg >= ml && pxAvg <= ml + graphW) {
          ctx.strokeStyle = "#eab308"; // yellow line
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pxAvg, mt);
          ctx.lineTo(pxAvg, mt + graphH);
          ctx.stroke();
          ctx.fillStyle = "#eab308";
          ctx.fillText(`⟨E⟩ = 3/2 kT: ${E_mean.toFixed(1)}J`, pxAvg + 4, mt + 20);
        }
        break;
      }

      case "CollisionAnalytics": {
        // Collision rate vs density scatter/line
        const hC = historyCollision.current;
        if (hC.length > 1) {
          // Dynamic scale
          let maxD = 100, maxF = 3000;
          hC.forEach(pt => {
            if (pt.density > maxD) maxD = pt.density;
            if (pt.freq > maxF) maxF = pt.freq;
          });
          vp.xMax = maxD * 1.15;
          vp.yMax = maxF * 1.15;

          ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
          ctx.strokeStyle = "#a855f7"; // purple collision line
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hC.length; i++) {
            const px = toPxX(hC[i].density);
            const py = toPxY(hC[i].freq);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);

              // small dot
              if (i % 5 === 0) {
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, 2*Math.PI);
                ctx.fill();
              }
            }
          }
          ctx.stroke();

          // Theoretical line (linear relationship)
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(toPxX(0), toPxY(0));
          ctx.lineTo(toPxX(vp.xMax), toPxY(vp.xMax * (state.collisionCount / (particleCount / liveV || 1))));
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      }

      case "Diffusion": {
        // Concentration vs position bar chart: Left compartment vs right compartment, or split into 10 spatial bins
        if (state.phaseSpacePoints.length > 0) {
          const points = state.phaseSpacePoints;
          const binCount = 10;
          const blueBins = new Array(binCount).fill(0);
          const orangeBins = new Array(binCount).fill(0);

          // Categorize particles into 10 spatial columns based on color and fractional position x in [0, 1]
          points.forEach(p => {
            const bIdx = Math.max(0, Math.min(binCount - 1, Math.floor(p.x * binCount)));
            // Check original color class or id to divide them
            if (p.color === "#3b82f6" || p.color === "#60a5fa") {
              blueBins[bIdx]++;
            } else {
              orangeBins[bIdx]++;
            }
          });

          // Draw double bars
          const colW = graphW / binCount;
          const halfBarW = colW * 0.4;
          
          vp.yMax = 0.5; // concentration fraction max
          
          for (let i = 0; i < binCount; i++) {
            const tot = blueBins[i] + orangeBins[i] || 1;
            const fracBlue = blueBins[i] / (particleCount / 2);
            const fracOrange = orangeBins[i] / (particleCount / 2);

            const px = ml + i * colW;

            // Blue bar
            const blueH = (fracBlue / vp.yMax) * graphH;
            ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
            ctx.strokeStyle = "#3b82f6";
            ctx.fillRect(px + 2, mt + graphH - blueH, halfBarW, blueH);
            ctx.strokeRect(px + 2, mt + graphH - blueH, halfBarW, blueH);

            // Orange bar
            const orangeH = (fracOrange / vp.yMax) * graphH;
            ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
            ctx.strokeStyle = "#f97316";
            ctx.fillRect(px + 2 + halfBarW + 1, mt + graphH - orangeH, halfBarW, orangeH);
            ctx.strokeRect(px + 2 + halfBarW + 1, mt + graphH - orangeH, halfBarW, orangeH);
          }

          // Center barrier line
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(ml + graphW / 2, mt);
          ctx.lineTo(ml + graphW / 2, mt + graphH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      }

      case "DiffusionVariance": {
        // Variance of positions vs time
        const hVar = historyVariance.current;
        if (hVar.length > 1) {
          const minT = hVar[0].t;
          const maxT = Math.max(minT + 100, hVar[hVar.length - 1].t);
          
          // Max variance for pure statistical random mix is 1/12 = 0.0833
          vp.yMax = 0.1;
          
          ctx.strokeStyle = "#f97316"; // Orange variance curve
          ctx.lineWidth = 2;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hVar.length; i++) {
            const mappedX = ml + ((hVar[i].t - minT) / (maxT - minT)) * graphW;
            const mappedY = toPxY(hVar[i].val);
            if (mappedX >= ml && mappedX <= ml + graphW && mappedY >= mt && mappedY <= mt + graphH) {
              if (first) { ctx.moveTo(mappedX, mappedY); first = false; }
              else ctx.lineTo(mappedX, mappedY);
            }
          }
          ctx.stroke();

          if (showAnnotations) {
            ctx.fillStyle = "rgba(249, 115, 22, 0.6)";
            ctx.font = `8px ${FONT_SANS}`;
            ctx.textAlign = "left";
            ctx.fillText("Einstein Diffusion Relation: ⟨x²⟩ = 2 D t", ml + 10, mt + 20);
          }
        }
        break;
      }

      case "Compressibility": {
        // Z factor vs Pressure
        // Reference line at Z = 1
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ml, toPxY(1.0));
        ctx.lineTo(ml + graphW, toPxY(1.0));
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillText("Ideal Gas (Z = 1)", ml + graphW - 5, toPxY(1.0) - 4);

        // Theoretical Van der Waals Z curve at current T:
        // Z_vdw = V / (V - Nb) - aN / RTV
        if (gasPreset === "real" || gasPreset === "xenon") {
          ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          let first = true;
          let a_coeff = attractiveForce * 1.5e-42;
          let b_coeff = gasPreset === "xenon" ? 5.0e-25 : 3.0e-25;

          // Plot Z vs Pressure
          for (let pVal = vp.xMin; pVal <= vp.xMax; pVal += (vp.xMax - vp.xMin) / 50) {
            // Find volume solving VDW or approximate
            // V_approx = NkT / P
            const pPa = pVal / ThermodynamicsAnalyzer.PRES_SCALE;
            const vApprox = (particleCount * GasEngine.K_B * liveT) / (pPa || 1);
            const zVal = vApprox / (vApprox - particleCount * b_coeff) - (a_coeff * particleCount) / (GasEngine.K_B * liveT * vApprox || 1);
            
            const px = toPxX(pVal);
            const py = toPxY(zVal);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Trace history
        const hZ = historyZ.current;
        if (hZ.length > 1) {
          ctx.strokeStyle = "#f59e0b"; // Orange Z factor line
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          let first = true;
          for (let i = 0; i < hZ.length; i++) {
            const px = toPxX(hZ[i].p);
            const py = toPxY(hZ[i].z);
            if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }

        // Live state dot
        const dotX = toPxX(liveP);
        const dotY = toPxY(state.compressibilityZ);
        if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(dotX, dotY, 4, 0, 2*Math.PI);
          ctx.fill();
          ctx.strokeStyle = "#f59e0b";
          ctx.stroke();
        }
        break;
      }

      case "PhaseSpace": {
        // Position vs momentum scatter plot
        const points = state.phaseSpacePoints || [];
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        
        // Draw grid baseline
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.moveTo(ml, toPxY(0.0));
        ctx.lineTo(ml + graphW, toPxY(0.0));
        ctx.stroke();

        points.forEach((p) => {
          const px = toPxX(p.x);
          const py = toPxY(p.px);
          if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
            ctx.fillStyle = p.color || "#10b981";
            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
        break;
      }

      case "OccupancyGrid": {
        // Coarse-grained Microstate Occupancy Grid
        const gridDim = 10;
        const cellW = graphW / gridDim;
        const cellH = graphH / gridDim;
        const occupancy = state.microstateOccupancy || [];

        // Determine max occupancy for color scaling
        let maxCount = 1;
        for (let i = 0; i < occupancy.length; i++) if (occupancy[i] > maxCount) maxCount = occupancy[i];

        for (let y = 0; y < gridDim; y++) {
          for (let x = 0; x < gridDim; x++) {
            const count = occupancy[y * gridDim + x] || 0;
            const pct = count / maxCount;
            
            // Draw grid square filled with glowing thermodynamic neon
            ctx.fillStyle = `rgba(16, 185, 129, ${pct * 0.8})`;
            ctx.fillRect(ml + x * cellW + 0.5, mt + y * cellH + 0.5, cellW - 1, cellH - 1);
            
            // Grid cell borders
            ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
            ctx.strokeRect(ml + x * cellW + 0.5, mt + y * cellH + 0.5, cellW - 1, cellH - 1);

            // Display count text inside cell if zoomed/large
            if (count > 0 && cellW > 18) {
              ctx.fillStyle = pct > 0.5 ? "#000" : "rgba(255, 255, 255, 0.4)";
              ctx.font = `6px ${FONT_MONO}`;
              ctx.textAlign = "center";
              ctx.fillText(count.toString(), ml + (x + 0.5) * cellW, mt + (y + 0.6) * cellH);
            }
          }
        }
        break;
      }
    }

    // 5. HOVER CROSSHAIR & TOOLTIP LAYER
    if (hover) {
      const { px, py, mx, my } = hover;
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        // Draw crosshair lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 2]);

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(ml, py);
        ctx.lineTo(ml + graphW, py);
        ctx.stroke();

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(px, mt);
        ctx.lineTo(px, mt + graphH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Interactive inspection glowing point
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2*Math.PI);
        ctx.fill();

        // Render Tooltip box (placed on the side that doesn't overlap cursor)
        const tooltipW = 165;
        const tooltipH = 92;
        const tooltipX = px + tooltipW + 15 > ml + graphW ? px - tooltipW - 10 : px + 10;
        const tooltipY = py + tooltipH + 15 > mt + graphH ? py - tooltipH - 10 : py + 10;

        ctx.fillStyle = "rgba(10, 10, 12, 0.92)";
        ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX, tooltipY, tooltipW, tooltipH);

        // Tooltip values based on graph
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold 8.5px ${FONT_SANS}`;
        ctx.textAlign = "left";
        
        const coords = getCoordinateValues(gType, mx, my);
        ctx.fillText(coords.title, tooltipX + 8, tooltipY + 12);
        
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = `8px ${FONT_MONO}`;
        ctx.fillText(coords.xVal, tooltipX + 8, tooltipY + 28);
        ctx.fillText(coords.yVal, tooltipX + 8, tooltipY + 40);

        // Active Governing Equation
        ctx.fillStyle = "#22d3ee"; // Neon cyan
        ctx.font = `italic bold 8px ${FONT_MONO}`;
        ctx.fillText(coords.equation, tooltipX + 8, tooltipY + 56);

        // Educational explanatory annotation phrase
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = `7.5px ${FONT_SANS}`;
        
        // Wrap educational text into lines
        const words = coords.annotation.split(" ");
        let line = "";
        let lineY = tooltipY + 70;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > tooltipW - 16 && n > 0) {
            ctx.fillText(line, tooltipX + 8, lineY);
            line = words[n] + " ";
            lineY += 9;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, tooltipX + 8, lineY);
      }
    }
  };

  // Helper function to draw axes labels and titles on canvas
  const drawTitlesAndLabels = (
    ctx: CanvasRenderingContext2D,
    gType: GraphType,
    ml: number,
    mt: number,
    mr: number,
    mb: number,
    graphW: number,
    graphH: number,
    w: number,
    h: number
  ) => {
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 9.5px ${FONT_SANS}`;
    ctx.textAlign = "left";

    let titleText = "";
    let xLabel = "";
    let yLabel = "";

    switch (gType) {
      case "PV":
        titleText = "PRESSURE-VOLUME INDICATOR DIAGRAM";
        xLabel = "VOLUME V (Liters)";
        yLabel = "PRESSURE P (kPa)";
        break;
      case "VT":
        titleText = "VOLUME-TEMPERATURE STATE PATH";
        xLabel = "TEMPERATURE T (Kelvin)";
        yLabel = "VOLUME V (Liters)";
        break;
      case "PT":
        titleText = "PRESSURE-TEMPERATURE STATE PATH";
        xLabel = "TEMPERATURE T (Kelvin)";
        yLabel = "PRESSURE P (kPa)";
        break;
      case "Entropy":
        titleText = "STATISTICAL SHANNON ENTROPY VS TIME";
        xLabel = "TIME STEP (t)";
        yLabel = "ENTROPY S (k_B units)";
        break;
      case "MaxwellBoltzmann":
        titleText = "MAXWELL-BOLTZMANN SPEED DISTRIBUTION";
        xLabel = "PARTICLE SPEED v (m/s)";
        yLabel = "PROBABILITY DENSITY f(v)";
        break;
      case "BoltzmannEnergy":
        titleText = "BOLTZMANN KINETIC ENERGY DISTRIBUTION";
        xLabel = "KINETIC ENERGY E (Joules × 10⁻²⁰)";
        yLabel = "PROBABILITY DENSITY P(E)";
        break;
      case "CollisionAnalytics":
        titleText = "COLLISION FREQUENCY VS CHAMBER DENSITY";
        xLabel = "DENSITY N/V (particles/L)";
        yLabel = "COLLISION FREQUENCY (Hz)";
        break;
      case "Diffusion":
        titleText = "SPATIAL CONCENTRATION PROFILE (DIFFUSION)";
        xLabel = "POSITION ALONG CHAMBER (x/L)";
        yLabel = "CONCENTRATION FRACTION";
        break;
      case "DiffusionVariance":
        titleText = "MEAN SQUARED DISPLACEMENT (MSD) VS TIME";
        xLabel = "TIME STEP (t)";
        yLabel = "SPATIAL VARIANCE σ_x²";
        break;
      case "Compressibility":
        titleText = "COMPRESSIBILITY FACTOR MAP (Z VS P)";
        xLabel = "PRESSURE P (kPa)";
        yLabel = "COMPRESSIBILITY Z (PV/NkT)";
        break;
      case "PhaseSpace":
        titleText = "ENSEMBLE PHASE SPACE MAP (x - px)";
        xLabel = "POSITION x (fractional)";
        yLabel = "MOMENTUM px (scaled)";
        break;
      case "OccupancyGrid":
        titleText = "MICROSTATE OCCUPANCY GRID (COARSE-GRAINED)";
        xLabel = "CHAMBER X BINS (10)";
        yLabel = "CHAMBER Y BINS (10)";
        break;
    }

    ctx.fillText(titleText, ml, 14);

    // Axis Labels
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `8px ${FONT_MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(xLabel, ml + graphW / 2, h - 8);

    ctx.save();
    ctx.translate(13, mt + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  };

  // Helper coordinate value inspector for hover analytics tooltip
  const getCoordinateValues = (gType: GraphType, x: number, y: number) => {
    const N = particleCount;
    let title = "";
    let xVal = "";
    let yVal = "";
    let equation = "";
    let annotation = "";

    switch (gType) {
      case "PV":
        title = "P-V State Point";
        xVal = `Volume V = ${x.toFixed(2)} Liters`;
        yVal = `Pressure P = ${Math.round(y)} kPa`;
        equation = gasPreset === "real" ? "(P + aN²/V²)(V - Nb) = NkT" : "PV = NkT";
        annotation = x < 5 ? "High compression raises particle wall collision rate, increasing pressure." : "Gas expansion reduces chamber density, lowering pressure.";
        break;
      case "VT":
        title = "V-T State Point";
        xVal = `Temperature T = ${Math.round(x)} K`;
        yVal = `Volume V = ${y.toFixed(2)} L`;
        equation = "V = (N k_B / P) · T";
        annotation = "Adding heat increases microscopic speeds. Volume expands to maintain constant pressure.";
        break;
      case "PT":
        title = "P-T State Point";
        xVal = `Temperature T = ${Math.round(x)} K`;
        yVal = `Pressure P = ${Math.round(y)} kPa`;
        equation = "P = (N k_B / V) · T";
        annotation = "Adding heat raises molecular velocities, increasing collision momentum transfer.";
        break;
      case "Entropy":
        title = "Shannon Entropy";
        xVal = `Time step t = ${Math.round(x)}`;
        yVal = `Entropy S = ${y.toFixed(4)} k_B`;
        equation = "S = -k_B ∑ Pᵢ ln Pᵢ";
        annotation = "Unconstrained systems spread stochastically to fill all available microstates.";
        break;
      case "MaxwellBoltzmann":
        title = "MB Velocity Spec";
        xVal = `Speed v = ${Math.round(x)} m/s`;
        yVal = `Density f(v) = ${y.toFixed(5)}`;
        equation = "f(v) ∝ v² exp(-mv² / 2kT)";
        annotation = "Distribution peak shifts rightward under high temperature or lower mass.";
        break;
      case "BoltzmannEnergy":
        title = "Energy Distribution";
        xVal = `Energy E = ${x.toFixed(1)} × 10⁻²⁰ J`;
        yVal = `Density P(E) = ${y.toFixed(4)}`;
        equation = "P(E) ∝ √E exp(-E / kT)";
        annotation = "Thermal equipartition maps direct energy states according to degrees of freedom.";
        break;
      case "CollisionAnalytics":
        title = "Collision Tracker";
        xVal = `Density N/V = ${x.toFixed(1)} L⁻¹`;
        yVal = `Frequency = ${Math.round(y)} Hz`;
        equation = "f꜀ = 4√2 π r² (N/V) v_rms";
        annotation = "Density reduction expands mean free path, lowering molecular collision rates.";
        break;
      case "Diffusion":
        title = "Spatial Concentration";
        xVal = `Chamber slice = ${x.toFixed(2)}`;
        yVal = `Fraction = ${y.toFixed(3)}`;
        equation = "∂C/∂t = D ∂²C/∂x²";
        annotation = "Mixing processes driven by concentration gradients minimize free energy.";
        break;
      case "DiffusionVariance":
        title = "Spatial Variance (MSD)";
        xVal = `Time t = ${Math.round(x)}`;
        yVal = `Variance σ² = ${y.toFixed(4)}`;
        equation = "⟨x²⟩ = 2 D t";
        annotation = "Brownian motion shows linear MSD displacement over time prior to saturation.";
        break;
      case "Compressibility":
        title = "Compressibility Factor";
        xVal = `Pressure P = ${Math.round(x)} kPa`;
        yVal = `Z Factor = ${y.toFixed(3)}`;
        equation = "Z = PV / NkT";
        annotation = "Attractive forces pull Z below 1. Exclusive volume pushes Z above 1.";
        break;
      case "PhaseSpace":
        title = "Phase Coordinates";
        xVal = `Position x/L = ${x.toFixed(3)}`;
        yVal = `Momentum p_x = ${y.toFixed(3)}`;
        equation = "dH/dp = dx/dt , dH/dx = -dp/dt";
        annotation = "Thermal orbits show continuous microscopic paths through phase space.";
        break;
      case "OccupancyGrid":
        title = "Occupancy Cell";
        xVal = `Bin X = ${Math.floor(x)}`;
        yVal = `Bin Y = ${Math.floor(y)}`;
        equation = "P_i = N_cell / N_total";
        annotation = "Microscopic density fluctuations are stochastically smoothed out at equilibrium.";
        break;
    }

    return { title, xVal, yVal, equation, annotation };
  };

  // Helper formatting for tick labels
  const formatScientific = (num: number, precision = 1) => {
    if (Math.abs(num) < 1e-3 && num !== 0) {
      return num.toExponential(precision);
    }
    if (num >= 10000) {
      return num.toExponential(precision);
    }
    return num.toFixed(precision);
  };

  // 4. INTERACTION HANDLERS: ZOOM & PAN
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, target: "primary" | "secondary") => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (target === "primary") isDraggingPrimary.current = true;
    else isDraggingSecondary.current = true;
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>, 
    target: "primary" | "secondary"
  ) => {
    const canvas = target === "primary" ? canvasPrimaryRef.current : canvasSecondaryRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const ml = 52, mb = 35, mt = 25, mr = 20;
    const graphW = rect.width - ml - mr;
    const graphH = rect.height - mt - mb;

    const vp = target === "primary" ? primaryViewport.current : secondaryViewport.current;

    // Convert pixel to model coordinate
    const mx = vp.xMin + ((px - ml) / graphW) * (vp.xMax - vp.xMin);
    const my = vp.yMin + (1 - (py - mt) / graphH) * (vp.yMax - vp.yMin);

    if (target === "primary") {
      setPrimaryHover({ px, py, mx, my });
      if (isDraggingPrimary.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const modelDx = (dx / graphW) * (vp.xMax - vp.xMin);
        const modelDy = -(dy / graphH) * (vp.yMax - vp.yMin);

        primaryViewport.current = {
          xMin: vp.xMin - modelDx,
          xMax: vp.xMax - modelDx,
          yMin: vp.yMin - modelDy,
          yMax: vp.yMax - modelDy
        };
      }
    } else {
      setSecondaryHover({ px, py, mx, my });
      if (isDraggingSecondary.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const modelDx = (dx / graphW) * (vp.xMax - vp.xMin);
        const modelDy = -(dy / graphH) * (vp.yMax - vp.yMin);

        secondaryViewport.current = {
          xMin: vp.xMin - modelDx,
          xMax: vp.xMax - modelDx,
          yMin: vp.yMin - modelDy,
          yMax: vp.yMax - modelDy
        };
      }
    }
  };

  const handleMouseUp = (target: "primary" | "secondary") => {
    if (target === "primary") isDraggingPrimary.current = false;
    else isDraggingSecondary.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>, target: "primary" | "secondary") => {
    e.preventDefault();
    const canvas = target === "primary" ? canvasPrimaryRef.current : canvasSecondaryRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const ml = 52, mb = 35, mt = 25, mr = 20;
    const graphW = rect.width - ml - mr;
    const graphH = rect.height - mt - mb;

    const vp = target === "primary" ? primaryViewport.current : secondaryViewport.current;

    // Zoom factor: wheel up is zoom in (0.9), wheel down is zoom out (1.1)
    const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;

    // Mouse coordinates in model space
    const mx = vp.xMin + ((px - ml) / graphW) * (vp.xMax - vp.xMin);
    const my = vp.yMin + (1 - (py - mt) / graphH) * (vp.yMax - vp.yMin);

    const newWidth = (vp.xMax - vp.xMin) * zoomFactor;
    const newHeight = (vp.yMax - vp.yMin) * zoomFactor;

    // Anchor fractions
    const pctX = (px - ml) / graphW;
    const pctY = 1 - (py - mt) / graphH;

    const nextVp = {
      xMin: mx - pctX * newWidth,
      xMax: mx + (1 - pctX) * newWidth,
      yMin: my - pctY * newHeight,
      yMax: my + (1 - pctY) * newHeight
    };

    // Bounds safety checks (prevent infinite zoom or inverted axes)
    if (newWidth > 1e-6 && newHeight > 1e-7 && newWidth < 1e7 && newHeight < 1e7) {
      if (target === "primary") {
        primaryViewport.current = nextVp;
      } else {
        secondaryViewport.current = nextVp;
      }
    }
  };

  // 5. EXPORT AND PNG DOWNLOADING UTILITY
  const handleExportPNG = (target: "primary" | "secondary") => {
    const canvas = target === "primary" ? canvasPrimaryRef.current : canvasSecondaryRef.current;
    if (!canvas) return;

    // Create virtual canvas with dark theme and background for high-quality export
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Copy drawing
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `thermodynamics_chart_${target}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 select-none pointer-events-auto">
      
      {/* ─── Control Header ─── */}
      <header className="bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 flex flex-wrap gap-3 items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Thermodynamic Indicator Engine</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Auto Switch vs Manual Toggle */}
          <button
            onClick={() => setAutoMap(prev => !prev)}
            className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${
              autoMap 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-white/5 border-white/5 text-white/50 hover:text-white"
            }`}
            title="Auto-switch graphs according to selected thermodynamic regimes"
          >
            {autoMap ? "🤖 Auto Mapping" : "⚙️ Manual"}
          </button>

          {/* Annotations Toggle */}
          <button
            onClick={() => setShowAnnotations(prev => !prev)}
            className={`p-1 rounded-md border transition-all ${
              showAnnotations 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "bg-white/5 border-white/5 text-white/40 hover:text-white"
            }`}
            title="Toggle formulas & notes"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Freeze Toggle */}
          <button
            onClick={() => setIsFrozen(prev => !prev)}
            className={`p-1 rounded-md border transition-all ${
              isFrozen 
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400" 
                : "bg-white/5 border-white/5 text-white/40 hover:text-white"
            }`}
            title="Freeze graphing updates"
          >
            {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ─── Primary Graph Panel ─── */}
      <div ref={containerPrimaryRef} className="flex-1 min-h-[220px] relative bg-black/40 border border-white/5 rounded-xl overflow-hidden group">
        
        {/* Graph Tabs Selector (Visible in Manual Mode) */}
        {!autoMap && (
          <div className="absolute top-2.5 right-2.5 z-20 flex gap-1 bg-black/80 p-0.5 rounded-lg border border-white/5">
            {(["PV", "VT", "PT", "Entropy", "Diffusion"] as GraphType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setPrimaryType(tab)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                  primaryType === tab 
                    ? "bg-emerald-500 text-white shadow" 
                    : "text-white/40 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <canvas
          ref={canvasPrimaryRef}
          onMouseDown={(e) => handleMouseDown(e, "primary")}
          onMouseMove={(e) => handleMouseMove(e, "primary")}
          onMouseUp={() => handleMouseUp("primary")}
          onMouseLeave={() => { handleMouseUp("primary"); setPrimaryHover(null); }}
          onWheel={(e) => handleWheel(e, "primary")}
          className="absolute inset-0 block cursor-crosshair"
        />

        {/* Viewport controls (zoom resets, export) */}
        <div className="absolute bottom-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => resetViewport("primary", primaryType)}
            className="p-1 rounded bg-black/85 border border-white/10 hover:border-white/30 text-white/60 hover:text-white"
            title="Reset Zoom"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleExportPNG("primary")}
            className="p-1 rounded bg-black/85 border border-white/10 hover:border-white/30 text-white/60 hover:text-white"
            title="Export Graph Image"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ─── Secondary Graph Panel ─── */}
      <div ref={containerSecondaryRef} className="flex-[0.8] min-h-[175px] relative bg-black/40 border border-white/5 rounded-xl overflow-hidden group">
        
        {/* Graph Tabs Selector (Visible in Manual Mode) */}
        {!autoMap && (
          <div className="absolute top-2.5 right-2.5 z-20 flex gap-1 bg-black/80 p-0.5 rounded-lg border border-white/5">
            {(["MaxwellBoltzmann", "BoltzmannEnergy", "Compressibility", "PhaseSpace", "OccupancyGrid", "CollisionAnalytics"] as GraphType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSecondaryType(tab)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                  secondaryType === tab 
                    ? "bg-emerald-500 text-white shadow" 
                    : "text-white/40 hover:text-white"
                }`}
              >
                {tab === "MaxwellBoltzmann" ? "MB" : tab === "BoltzmannEnergy" ? "Energy" : tab === "CollisionAnalytics" ? "Collisions" : tab}
              </button>
            ))}
          </div>
        )}

        <canvas
          ref={canvasSecondaryRef}
          onMouseDown={(e) => handleMouseDown(e, "secondary")}
          onMouseMove={(e) => handleMouseMove(e, "secondary")}
          onMouseUp={() => handleMouseUp("secondary")}
          onMouseLeave={() => { handleMouseUp("secondary"); setSecondaryHover(null); }}
          onWheel={(e) => handleWheel(e, "secondary")}
          className="absolute inset-0 block cursor-crosshair"
        />

        {/* Viewport controls (zoom resets, export) */}
        <div className="absolute bottom-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => resetViewport("secondary", secondaryType)}
            className="p-1 rounded bg-black/85 border border-white/10 hover:border-white/30 text-white/60 hover:text-white"
            title="Reset Zoom"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleExportPNG("secondary")}
            className="p-1 rounded bg-black/85 border border-white/10 hover:border-white/30 text-white/60 hover:text-white"
            title="Export Graph Image"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

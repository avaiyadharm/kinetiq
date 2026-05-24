"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Play, Pause, RotateCcw, Sliders, Sparkles, Paintbrush, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

// Material Definitions
export interface Material {
  id: string;
  name: string;
  conductivity: number; // Diffusivity alpha
  color: string; // Tailwind color for paint HUD
  canvasColor: string; // RGB color representation
  density: number; // kg/m^3
  specificHeat: number; // J/kg*K
}

export const MATERIALS: Record<string, Material> = {
  copper: { id: "copper", name: "Copper", conductivity: 1.0, color: "bg-orange-500", canvasColor: "rgb(249, 115, 22)", density: 8960, specificHeat: 385 },
  iron: { id: "iron", name: "Iron", conductivity: 0.25, color: "bg-zinc-500", canvasColor: "rgb(115, 115, 115)", density: 7870, specificHeat: 450 },
  glass: { id: "glass", name: "Glass", conductivity: 0.05, color: "bg-sky-400", canvasColor: "rgb(56, 189, 248)", density: 2500, specificHeat: 840 },
  wood: { id: "wood", name: "Wood / Insulator", conductivity: 0.01, color: "bg-amber-800", canvasColor: "rgb(146, 64, 14)", density: 700, specificHeat: 1700 },
  vacuum: { id: "vacuum", name: "Vacuum / Air", conductivity: 0.0, color: "bg-black", canvasColor: "rgb(9, 9, 11)", density: 1.2, specificHeat: 1005 },
};

export type DrawTool = "source" | "sink" | "material" | "erase";
export type ColormapName = "thermal" | "icefire" | "jet" | "grayscale";

interface HeatTransferCanvasProps {
  gridSize: number;
  dx: number;
  dt: number;
  ambientTemp: number;
  convectionCoeff: number;
  solverMode: "transient" | "steady";
  boundaryType: "insulated" | "fixed" | "convective";
  drawTool: DrawTool;
  selectedMaterial: string;
  brushSize: number;
  colormap: ColormapName;
  showFluxVectors: boolean;
  showIsotherms: boolean;
  showGridLines: boolean;
  isPlaying: boolean;
  activePreset: string;
  onTelemetryUpdate: (telemetry: any) => void;
  // Trigger callback when simulation triggers reset internally
  onResetSignal?: () => void;
}

export const HeatTransferCanvas: React.FC<HeatTransferCanvasProps> = ({
  gridSize,
  dx,
  dt,
  ambientTemp,
  convectionCoeff,
  solverMode,
  boundaryType,
  drawTool,
  selectedMaterial,
  brushSize,
  colormap,
  showFluxVectors,
  showIsotherms,
  showGridLines,
  isPlaying,
  activePreset,
  onTelemetryUpdate,
  onResetSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Physical temperature, fixed cell, and conductivity buffers
  const [temp, setTemp] = useState<Float32Array | null>(null);
  const [fixed, setFixed] = useState<Uint8Array | null>(null); // 0 = free, 1 = hot source, 2 = cold sink
  const [conductivity, setConductivity] = useState<Float32Array | null>(null);

  // Cross-section slice state
  const [sliceAxis, setSliceAxis] = useState<"horizontal" | "vertical">("horizontal");
  const [sliceIndex, setSliceIndex] = useState<number>(Math.floor(gridSize / 2));
  const [isDraggingSlice, setIsDraggingSlice] = useState(false);

  // References for render loop (avoids stale state closures)
  const tempRef = useRef<Float32Array | null>(null);
  const fixedRef = useRef<Uint8Array | null>(null);
  const condRef = useRef<Float32Array | null>(null);

  const prevGridSize = useRef(gridSize);

  // Color mapping logic
  const getColormapColor = (t: number, map: ColormapName): { r: number; g: number; b: number } => {
    // Normalize temperature between 0 and 100 degrees Celsius
    const norm = Math.max(0, Math.min(100, t)) / 100;
    
    if (map === "thermal") {
      // Ironbow (Dark purple -> red -> orange -> yellow -> white)
      if (norm < 0.25) {
        const f = norm / 0.25;
        return { r: Math.round(f * 40), g: 0, b: Math.round(f * 150) };
      } else if (norm < 0.5) {
        const f = (norm - 0.25) / 0.25;
        return { r: Math.round(40 + f * 180), g: Math.round(f * 30), b: Math.round(150 - f * 80) };
      } else if (norm < 0.75) {
        const f = (norm - 0.5) / 0.25;
        return { r: 220, g: Math.round(30 + f * 170), b: Math.round(70 - f * 50) };
      } else {
        const f = (norm - 0.75) / 0.25;
        return { r: Math.round(220 + f * 35), g: Math.round(200 + f * 55), b: Math.round(20 + f * 235) };
      }
    } else if (map === "icefire") {
      // Blue -> Cyan -> Dark -> Orange -> Red
      if (norm < 0.25) {
        const f = norm / 0.25;
        return { r: 0, g: Math.round(f * 180), b: 255 };
      } else if (norm < 0.5) {
        const f = (norm - 0.25) / 0.25;
        return { r: 0, g: Math.round(180 - f * 140), b: Math.round(255 - f * 200) };
      } else if (norm < 0.75) {
        const f = (norm - 0.5) / 0.25;
        return { r: Math.round(f * 200), g: Math.round(40 + f * 80), b: 55 };
      } else {
        const f = (norm - 0.75) / 0.25;
        return { r: Math.round(200 + f * 55), g: Math.round(120 - f * 120), b: Math.round(55 - f * 55) };
      }
    } else if (map === "jet") {
      // Rainbow
      if (norm < 0.25) {
        const f = norm / 0.25;
        return { r: 0, g: Math.round(f * 255), b: 255 };
      } else if (norm < 0.5) {
        const f = (norm - 0.25) / 0.25;
        return { r: 0, g: 255, b: Math.round(255 - f * 255) };
      } else if (norm < 0.75) {
        const f = (norm - 0.5) / 0.25;
        return { r: Math.round(f * 255), g: 255, b: 0 };
      } else {
        const f = (norm - 0.75) / 0.25;
        return { r: 255, g: Math.round(255 - f * 255), b: 0 };
      }
    } else {
      // Grayscale
      const val = Math.round(norm * 255);
      return { r: val, g: val, b: val };
    }
  };

  // Preset Configurations Creator
  const loadPreset = (presetName: string, size: number) => {
    const N = size;
    const tGrid = new Float32Array(N * N);
    const fGrid = new Uint8Array(N * N);
    const cGrid = new Float32Array(N * N);

    // Default init values
    tGrid.fill(ambientTemp);
    fGrid.fill(0);
    cGrid.fill(0.25); // default medium conductivity (Iron)

    if (presetName === "CPU Heatsink") {
      // Silicon CPU die in the center, hot (85 degC)
      const cx = Math.floor(N / 2);
      const cy = Math.floor(N / 2);
      const dieW = Math.max(2, Math.floor(N * 0.15));
      const finH = Math.max(4, Math.floor(N * 0.35));

      // Draw heated CPU core
      for (let i = cx - dieW; i <= cx + dieW; i++) {
        for (let j = cy - 2; j <= cy + 2; j++) {
          const idx = j * N + i;
          tGrid[idx] = 95;
          fGrid[idx] = 1; // fixed source
        }
      }

      // Draw high-conductivity fins (Copper) extending outward
      for (let i = cx - dieW - 4; i <= cx + dieW + 4; i += 2) {
        if (i < 1 || i >= N - 1) continue;
        for (let j = cy - finH; j <= cy + finH; j++) {
          if (j < 1 || j >= N - 1) continue;
          // Set to copper
          cGrid[j * N + i] = 1.0;
        }
      }
      
      // Draw copper heat spreader base
      for (let i = cx - dieW - 6; i <= cx + dieW + 6; i++) {
        if (i < 1 || i >= N - 1) continue;
        for (let j = cy - 3; j <= cy + 3; j++) {
          if (j < 1 || j >= N - 1) continue;
          cGrid[j * N + i] = 1.0;
        }
      }

    } else if (presetName === "Thermal Bridge") {
      // Left side wall is hot (100 degC), right side wall is cold (0 degC)
      // Connected by a thin copper bridge surrounded by wood (insulator)
      const cy = Math.floor(N / 2);
      const bridgeW = Math.max(2, Math.floor(N * 0.1));

      // Heat left wall
      for (let j = 0; j < N; j++) {
        const idx = j * N;
        tGrid[idx] = 100;
        fGrid[idx] = 1; // hot
      }

      // Cool right wall
      for (let j = 0; j < N; j++) {
        const idx = j * N + (N - 1);
        tGrid[idx] = 0;
        fGrid[idx] = 2; // cold
      }

      // Fill rest with insulator (wood)
      cGrid.fill(0.01);

      // Draw high conductivity bridge through center (Copper)
      for (let j = cy - bridgeW; j <= cy + bridgeW; j++) {
        for (let i = 0; i < N; i++) {
          cGrid[j * N + i] = 1.0;
        }
      }

    } else if (presetName === "Corner Heating") {
      // Hot top-left corner (100 degC), cold bottom-right corner (0 degC)
      const radius = Math.floor(N * 0.2);

      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const distToTL = Math.sqrt(i * i + j * j);
          const distToBR = Math.sqrt((N - 1 - i) * (N - 1 - i) + (N - 1 - j) * (N - 1 - j));
          const idx = j * N + i;
          
          if (distToTL <= radius) {
            tGrid[idx] = 100;
            fGrid[idx] = 1;
          } else if (distToBR <= radius) {
            tGrid[idx] = 0;
            fGrid[idx] = 2;
          }
        }
      }

    } else if (presetName === "Insulated Box") {
      // Central hot spot (90 degC) surrounded by a wood/insulator square box
      const cx = Math.floor(N / 2);
      const cy = Math.floor(N / 2);
      const boxW = Math.floor(N * 0.25);
      
      // Draw hot center core
      for (let j = cy - 2; j <= cy + 2; j++) {
        for (let i = cx - 2; i <= cx + 2; i++) {
          const idx = j * N + i;
          tGrid[idx] = 90;
          fGrid[idx] = 1;
        }
      }

      // Draw wood insulating frame
      for (let j = cy - boxW; j <= cy + boxW; j++) {
        for (let i = cx - boxW; i <= cx + boxW; i++) {
          // Only outline
          if (Math.abs(j - cy) === boxW || Math.abs(i - cx) === boxW) {
            const idx = j * N + i;
            cGrid[idx] = 0.01; // wood
          }
        }
      }
    }

    setTemp(tGrid);
    setFixed(fGrid);
    setConductivity(cGrid);
    
    // Sync references
    tempRef.current = tGrid;
    fixedRef.current = fGrid;
    condRef.current = cGrid;
  };

  // Re-initialize buffers on grid size change or initial load
  useEffect(() => {
    loadPreset(activePreset, gridSize);
    setSliceIndex(Math.floor(gridSize / 2));
    prevGridSize.current = gridSize;
  }, [gridSize, activePreset]);

  // Sync state values to references
  useEffect(() => {
    if (temp) tempRef.current = temp;
    if (fixed) fixedRef.current = fixed;
    if (conductivity) condRef.current = conductivity;
  }, [temp, fixed, conductivity]);

  // Mouse interaction: drawing onto the grid
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !temp || !fixed || !conductivity) return;

    const rect = canvas.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const cellX = Math.floor(xRatio * gridSize);
    const cellY = Math.floor(yRatio * gridSize);

    if (cellX < 0 || cellX >= gridSize || cellY < 0 || cellY >= gridSize) return;

    // Mutate arrays in-place for direct feedback
    const nextTemp = new Float32Array(temp);
    const nextFixed = new Uint8Array(fixed);
    const nextCond = new Float32Array(conductivity);

    const radius = brushSize - 1;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cellX + dx;
        const ny = cellY + dy;
        
        // Circular brush check
        if (dx * dx + dy * dy > radius * radius) continue;
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;

        const idx = ny * gridSize + nx;

        if (drawTool === "source") {
          nextTemp[idx] = 100;
          nextFixed[idx] = 1; // hot fixed
        } else if (drawTool === "sink") {
          nextTemp[idx] = 0;
          nextFixed[idx] = 2; // cold fixed
        } else if (drawTool === "material") {
          const mat = MATERIALS[selectedMaterial];
          nextCond[idx] = mat.conductivity;
          // Unfix it from being source/sink if we paint material
          nextFixed[idx] = 0;
        } else if (drawTool === "erase") {
          nextTemp[idx] = ambientTemp;
          nextFixed[idx] = 0;
          nextCond[idx] = 0.25; // reset to default iron conductivity
        }
      }
    }

    setTemp(nextTemp);
    setFixed(nextFixed);
    setConductivity(nextCond);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If user clicked close to the slice axis line, start dragging slice line instead
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * gridSize;
    const mouseY = ((e.clientY - rect.top) / rect.height) * gridSize;

    const isHorizontalClose = Math.abs(mouseY - sliceIndex) < 1.5;
    const isVerticalClose = Math.abs(mouseX - sliceIndex) < 1.5;

    if (sliceAxis === "horizontal" && isHorizontalClose) {
      setIsDraggingSlice(true);
    } else if (sliceAxis === "vertical" && isVerticalClose) {
      setIsDraggingSlice(true);
    } else {
      handleCanvasInteraction(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingSlice) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const val = sliceAxis === "horizontal"
        ? ((e.clientY - rect.top) / rect.height) * gridSize
        : ((e.clientX - rect.left) / rect.width) * gridSize;
      
      setSliceIndex(Math.max(0, Math.min(gridSize - 1, Math.floor(val))));
    } else if (e.buttons === 1) {
      handleCanvasInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSlice(false);
  };

  // Physics Simulation Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const solvePhysics = () => {
      const tData = tempRef.current;
      const fData = fixedRef.current;
      const cData = condRef.current;
      if (!tData || !fData || !cData) return;

      const N = gridSize;
      const nextTemp = new Float32Array(tData);

      // Convection coefficient scaling
      const hScale = convectionCoeff * 0.005;

      if (solverMode === "transient") {
        // Explicit 2D Heat Diffusion Solver
        // T_ij^(n+1) = T_ij + dt * (div (k grad T))
        const dtScale = dt / (dx * dx);

        for (let j = 1; j < N - 1; j++) {
          for (let i = 1; i < N - 1; i++) {
            const idx = j * N + i;
            
            // Skip fixed boundary reservoirs
            if (fData[idx] > 0) continue;

            const alpha = cData[idx];

            // Averaged diffusivity coefficients on cell interfaces
            const alphaR = (alpha + cData[idx + 1]) * 0.5;
            const alphaL = (alpha + cData[idx - 1]) * 0.5;
            const alphaT = (alpha + cData[idx + N]) * 0.5;
            const alphaB = (alpha + cData[idx - N]) * 0.5;

            // Gradient fluxes
            const diffX = alphaR * (tData[idx + 1] - tData[idx]) - alphaL * (tData[idx] - tData[idx - 1]);
            const diffY = alphaT * (tData[idx + N] - tData[idx]) - alphaB * (tData[idx] - tData[idx - N]);

            // Convective loss to ambient
            const convLoss = hScale * (tData[idx] - ambientTemp);

            // Update cell temperature
            nextTemp[idx] = tData[idx] + dtScale * (diffX + diffY) - convLoss;
          }
        }
      } else {
        // Steady State Solver (Gauss-Seidel relaxation)
        // Run 40 iterations per frame to converge quickly
        const GS_ITERATIONS = 40;
        
        for (let iter = 0; iter < GS_ITERATIONS; iter++) {
          for (let j = 1; j < N - 1; j++) {
            for (let i = 1; i < N - 1; i++) {
              const idx = j * N + i;
              if (fData[idx] > 0) continue;

              const alpha = cData[idx];
              const alphaR = (alpha + cData[idx + 1]) * 0.5;
              const alphaL = (alpha + cData[idx - 1]) * 0.5;
              const alphaT = (alpha + cData[idx + N]) * 0.5;
              const alphaB = (alpha + cData[idx - N]) * 0.5;

              const sumAlpha = alphaR + alphaL + alphaT + alphaB;
              
              if (sumAlpha > 0.0) {
                // Incorporate ambient convection if present
                const denom = sumAlpha + hScale;
                const numerator = (
                  alphaR * nextTemp[idx + 1] + 
                  alphaL * nextTemp[idx - 1] + 
                  alphaT * nextTemp[idx + N] + 
                  alphaB * nextTemp[idx - N] + 
                  hScale * ambientTemp
                );
                nextTemp[idx] = numerator / denom;
              }
            }
          }
        }
      }

      // Boundary Conditions
      if (boundaryType === "insulated") {
        // Neumann boundaries (adiabatic) - copy neighboring values
        for (let k = 0; k < N; k++) {
          nextTemp[k] = nextTemp[N + k]; // Bottom edge
          nextTemp[(N - 1) * N + k] = nextTemp[(N - 2) * N + k]; // Top edge
          nextTemp[k * N] = nextTemp[k * N + 1]; // Left edge
          nextTemp[k * N + (N - 1)] = nextTemp[k * N + (N - 2)]; // Right edge
        }
      } else if (boundaryType === "fixed") {
        // Dirichlet boundary - held fixed at ambient temperature
        for (let k = 0; k < N; k++) {
          nextTemp[k] = ambientTemp;
          nextTemp[(N - 1) * N + k] = ambientTemp;
          nextTemp[k * N] = ambientTemp;
          nextTemp[k * N + (N - 1)] = ambientTemp;
        }
      } else {
        // Convective Robin boundaries
        // Cells lose heat to ambient directly at borders
        const boundaryConvection = convectionCoeff * 0.1 * dt;
        for (let k = 0; k < N; k++) {
          // Bottom boundary
          nextTemp[k] = nextTemp[N + k] + boundaryConvection * (ambientTemp - nextTemp[k]);
          // Top boundary
          nextTemp[(N - 1) * N + k] = nextTemp[(N - 2) * N + k] + boundaryConvection * (ambientTemp - nextTemp[(N - 1) * N + k]);
          // Left boundary
          nextTemp[k * N] = nextTemp[k * N + 1] + boundaryConvection * (ambientTemp - nextTemp[k * N]);
          // Right boundary
          nextTemp[k * N + (N - 1)] = nextTemp[k * N + (N - 2)] + boundaryConvection * (ambientTemp - nextTemp[k * N + (N - 1)]);
        }
      }

      // Update state buffers
      setTemp(nextTemp);
      tempRef.current = nextTemp;

      // Telemetry computations
      let totalT = 0;
      let maxT = -Infinity;
      let minT = Infinity;
      let thermalEnergySum = 0;

      for (let k = 0; k < N * N; k++) {
        const T_val = nextTemp[k];
        totalT += T_val;
        if (T_val > maxT) maxT = T_val;
        if (T_val < minT) minT = T_val;

        // E_thermal = m * cp * T = rho * V * cp * T = rho * dx * dy * thick * cp * T
        // Assume thickness = 0.01 m
        const thickness = 0.01;
        const cellVol = dx * dx * thickness;
        
        // Find material density and specific heat capacity
        const alpha = cData[k];
        let density = 7870; // default Iron
        let specHeat = 450;
        
        if (alpha > 0.9) { // Copper
          density = 8960; specHeat = 385;
        } else if (alpha < 0.03 && alpha > 0.0) { // Wood
          density = 700; specHeat = 1700;
        } else if (alpha <= 0.0) { // Air/vacuum
          density = 1.2; specHeat = 1005;
        } else if (alpha < 0.1) { // Glass
          density = 2500; specHeat = 840;
        }

        thermalEnergySum += density * cellVol * specHeat * (T_val + 273.15); // convert to Kelvin
      }

      const stableTimestepLimit = (dx * dx) / (4.0 * 1.0); // max stable timestep limit with copper diffusivity

      onTelemetryUpdate({
        avgTemp: totalT / (N * N),
        maxTemp: maxT === -Infinity ? 0 : maxT,
        minTemp: minT === Infinity ? 0 : minT,
        thermalEnergy: thermalEnergySum,
        iterations: solverMode === "steady" ? 40 : 1,
        stableTimestepLimit,
      });
    };

    const loop = (timeNow: number) => {
      const elapsed = timeNow - lastTime;
      
      if (isPlaying) {
        solvePhysics();
      }

      lastTime = timeNow;
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, gridSize, dx, dt, solverMode, boundaryType, convectionCoeff, ambientTemp, onTelemetryUpdate]);

  // Main canvas graphic painting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !temp || !conductivity || !fixed) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cellW = W / gridSize;
    const cellH = H / gridSize;

    // 1. Paint cell backgrounds by temperature
    for (let j = 0; j < gridSize; j++) {
      for (let i = 0; i < gridSize; i++) {
        const idx = j * gridSize + i;
        const tVal = temp[idx];
        const isFixed = fixed[idx];
        const alpha = conductivity[idx];

        const { r, g, b } = getColormapColor(tVal, colormap);

        // Blend cell color with material tints to show structures clearly
        let cellR = r;
        let cellG = g;
        let cellB = b;

        // Apply a material overlay outline/tint if not default Iron
        if (alpha >= 0.9) { // Copper
          // Orange outline tint
          cellR = Math.round(r * 0.7 + 249 * 0.3);
          cellG = Math.round(g * 0.7 + 115 * 0.3);
          cellB = Math.round(b * 0.7 + 22 * 0.3);
        } else if (alpha <= 0.0) { // Vacuum
          // Dark tint
          cellR = Math.round(r * 0.4);
          cellG = Math.round(g * 0.4);
          cellB = Math.round(b * 0.4);
        } else if (alpha < 0.03) { // Wood
          // Brown tint
          cellR = Math.round(r * 0.7 + 146 * 0.3);
          cellG = Math.round(g * 0.7 + 64 * 0.3);
          cellB = Math.round(b * 0.7 + 14 * 0.3);
        } else if (alpha < 0.1) { // Glass
          // Sky blue tint
          cellR = Math.round(r * 0.7 + 56 * 0.3);
          cellG = Math.round(g * 0.7 + 189 * 0.3);
          cellB = Math.round(b * 0.7 + 248 * 0.3);
        }

        ctx.fillStyle = `rgb(${cellR}, ${cellG}, ${cellB})`;
        ctx.fillRect(i * cellW, j * cellH, cellW, cellH);

        // Draw active grid borders if requested
        if (showGridLines) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(i * cellW, j * cellH, cellW, cellH);
        }

        // Draw indicator dots for fixed sources/sinks
        if (isFixed > 0) {
          ctx.fillStyle = isFixed === 1 ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.8)";
          ctx.beginPath();
          ctx.arc(i * cellW + cellW / 2, j * cellH + cellH / 2, Math.max(2, cellW * 0.2), 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // 2. Render Isotherms (Marching Squares-like contours)
    if (showIsotherms) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      
      // Isotherm temperatures: 10, 20, 30, 40, 50, 60, 70, 80, 90 degC
      const isoTemps = [10, 20, 30, 40, 50, 60, 70, 80, 90];

      for (let j = 0; j < gridSize - 1; j++) {
        for (let i = 0; i < gridSize - 1; i++) {
          const idx = j * gridSize + i;
          
          const tTL = temp[idx];
          const tTR = temp[idx + 1];
          const tBL = temp[idx + gridSize];
          const tBR = temp[idx + gridSize + 1];

          isoTemps.forEach((isoT) => {
            // Check if contour crosses cell borders
            // Left border
            const crossLeft = (tTL >= isoT && tBL < isoT) || (tTL < isoT && tBL >= isoT);
            // Right border
            const crossRight = (tTR >= isoT && tBR < isoT) || (tTR < isoT && tBR >= isoT);
            // Top border
            const crossTop = (tTL >= isoT && tTR < isoT) || (tTL < isoT && tTR >= isoT);
            // Bottom border
            const crossBottom = (tBL >= isoT && tBR < isoT) || (tBL < isoT && tBR >= isoT);

            const crossings: { x: number; y: number }[] = [];

            if (crossLeft) {
              const f = (isoT - tTL) / (tBL - tTL);
              crossings.push({ x: i * cellW, y: (j + f) * cellH });
            }
            if (crossRight) {
              const f = (isoT - tTR) / (tBR - tTR);
              crossings.push({ x: (i + 1) * cellW, y: (j + f) * cellH });
            }
            if (crossTop) {
              const f = (isoT - tTL) / (tTR - tTL);
              crossings.push({ x: (i + f) * cellW, y: j * cellH });
            }
            if (crossBottom) {
              const f = (isoT - tBL) / (tBR - tBL);
              crossings.push({ x: (i + f) * cellW, y: (j + 1) * cellH });
            }

            if (crossings.length >= 2) {
              ctx.beginPath();
              ctx.moveTo(crossings[0].x, crossings[0].y);
              ctx.lineTo(crossings[1].x, crossings[1].y);
              ctx.stroke();
            }
          });
        }
      }
    }

    // 3. Render Heat Flux Gradient Vectors
    if (showFluxVectors) {
      // Draw sparse arrows every 3 nodes
      const stride = 3;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1;

      for (let j = 1; j < gridSize - 1; j += stride) {
        for (let i = 1; i < gridSize - 1; i += stride) {
          const idx = j * gridSize + i;
          
          const alpha = conductivity[idx];
          if (alpha <= 0.0) continue; // no flux in vacuum

          // Grad T
          const gx = (temp[idx + 1] - temp[idx - 1]) / 2;
          const gy = (temp[idx + gridSize] - temp[idx - gridSize]) / 2;

          // q = -k grad T
          const qx = -alpha * gx;
          const qy = -alpha * gy;

          const mag = Math.sqrt(qx * qx + qy * qy);
          if (mag < 0.2) continue; // too small to draw

          const cx = i * cellW + cellW / 2;
          const cy = j * cellH + cellH / 2;

          // Cap arrow length at double cell size
          const arrowLen = Math.min(cellW * 2.0, mag * 2.0);
          const angle = Math.atan2(qy, qx);

          const endX = cx + Math.cos(angle) * arrowLen;
          const endY = cy + Math.sin(angle) * arrowLen;

          // Draw line
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Draw small arrowhead
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - 3.5 * Math.cos(angle - Math.PI / 6),
            endY - 3.5 * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - 3.5 * Math.cos(angle + Math.PI / 6),
            endY - 3.5 * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // 4. Render draggable Slice cross-section line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    if (sliceAxis === "horizontal") {
      const sy = sliceIndex * cellH + cellH / 2;
      ctx.moveTo(0, sy);
      ctx.lineTo(W, sy);
    } else {
      const sx = sliceIndex * cellW + cellW / 2;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, H);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw little handles on the edges of the slice line
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    if (sliceAxis === "horizontal") {
      const sy = sliceIndex * cellH + cellH / 2;
      ctx.beginPath();
      ctx.arc(8, sy, 5, 0, 2 * Math.PI);
      ctx.arc(W - 8, sy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else {
      const sx = sliceIndex * cellW + cellW / 2;
      ctx.beginPath();
      ctx.arc(sx, 8, 5, 0, 2 * Math.PI);
      ctx.arc(sx, H - 8, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

  }, [temp, conductivity, fixed, colormap, gridSize, showFluxVectors, showIsotherms, showGridLines, sliceAxis, sliceIndex]);

  // Extract temperature slice profile data for SVG chart
  const sliceProfileData = useMemo(() => {
    if (!temp) return [];
    const profile = [];
    for (let k = 0; k < gridSize; k++) {
      const idx = sliceAxis === "horizontal"
        ? sliceIndex * gridSize + k
        : k * gridSize + sliceIndex;
      profile.push(temp[idx]);
    }
    return profile;
  }, [temp, sliceIndex, sliceAxis, gridSize]);

  // SVG Chart path calculation
  const chartPath = useMemo(() => {
    if (sliceProfileData.length === 0) return "";
    const len = sliceProfileData.length;
    const chartW = 100; // viewBox coords
    const chartH = 100;
    const padding = 10;
    
    const scaleX = (chartW - 2 * padding) / (len - 1);
    // Temp mapped from 0 to 100 degC
    const scaleY = (chartH - 2 * padding) / 100;

    return sliceProfileData.reduce((acc, val, i) => {
      const px = padding + i * scaleX;
      const py = (chartH - padding) - val * scaleY;
      return acc + (i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`);
    }, "");
  }, [sliceProfileData]);

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* 2D Simulation Canvas Box */}
      <div className="flex-1 bg-black rounded-[24px] border border-white/5 relative overflow-hidden flex items-center justify-center min-h-[300px]">
        
        {/* Hover slice instructions overlay */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => {
              setSliceAxis(sliceAxis === "horizontal" ? "vertical" : "horizontal");
              setSliceIndex(Math.floor(gridSize / 2));
            }}
            className="px-3 py-1.5 bg-black/85 backdrop-blur-md rounded-xl border border-white/10 text-[9px] font-bold uppercase tracking-wider hover:bg-white/5 transition-all text-white/60 hover:text-white"
          >
            Toggle Slice Direction
          </button>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          width={500}
          height={500}
          className={cn(
            "max-w-full max-h-full aspect-square bg-[#09090b] shadow-2xl rounded-2xl cursor-crosshair border border-white/5",
            isDraggingSlice && "cursor-ns-resize"
          )}
        />
        
        {/* HUD Info slice overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-black/85 backdrop-blur-md rounded-xl border border-white/5 space-y-1 pointer-events-none select-none">
          <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">Grid slice profile</div>
          <div className="text-xs font-mono font-bold text-teal-400">
            {sliceAxis === "horizontal" 
              ? `Y = ${(sliceIndex * dx).toFixed(3)} m (Cell ${sliceIndex})` 
              : `X = ${(sliceIndex * dx).toFixed(3)} m (Cell ${sliceIndex})`
            }
          </div>
        </div>
      </div>

      {/* SVG Temperature Profile Chart */}
      <div className="h-44 bg-[#141416] rounded-[24px] border border-white/5 p-4 flex flex-col relative">
        <div className="flex justify-between items-center mb-2 px-2 select-none">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              1D Temperature Profile Cross-Section
            </span>
          </div>
          <div className="text-[9px] font-mono text-white/30 uppercase">
            T = 0°C to 100°C | Space = 0 to {(gridSize * dx).toFixed(2)} m
          </div>
        </div>

        <div className="flex-1 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid references */}
            <line x1="10" y1="10" x2="90" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="10" y1="90" x2="90" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            
            {/* Temperature reference markings */}
            <text x="5" y="13" className="text-[4px] fill-white/20 font-mono font-bold text-right">100°C</text>
            <text x="5" y="53" className="text-[4px] fill-white/20 font-mono font-bold text-right">50°C</text>
            <text x="5" y="93" className="text-[4px] fill-white/20 font-mono font-bold text-right">0°C</text>

            {/* Profile Path Line */}
            {chartPath && (
              <path 
                d={chartPath} 
                fill="none" 
                stroke="#14b8a6" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]"
              />
            )}

            {/* Start and end points */}
            {sliceProfileData.length > 0 && (
              <>
                <circle cx="10" cy={100 - 10 - sliceProfileData[0] * 0.8} r="1" fill="#14b8a6" />
                <circle cx="90" cy={100 - 10 - sliceProfileData[sliceProfileData.length - 1] * 0.8} r="1" fill="#14b8a6" />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

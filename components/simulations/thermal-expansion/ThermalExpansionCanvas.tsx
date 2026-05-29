"use client";

import React, { useRef, useEffect } from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DATABASE, ThermalExpansionPhysicsEngine } from "@/lib/physics/thermalExpansion";

export const ThermalExpansionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    temperature,
    materialId,
    objectType,
    constraint,
    gapSize,
    bimetallicMat1,
    bimetallicMat2,
    atomCount,
    bondStiffness,
    vizSettings,
    isBroken,
    isDeformed,
    crackLocations,
    plasticStrain,
    fatigueAccumulated,
    time
  } = useThermalExpansionStore();

  const currentMaterial = MATERIAL_DATABASE[materialId];

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw grid background
    ctx.strokeStyle = "rgba(6, 182, 212, 0.02)";
    ctx.lineWidth = 1;
    const gridStep = 24;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Solve physics states
    const dT = temperature - ThermalExpansionPhysicsEngine.T_REF;
    const alpha = ThermalExpansionPhysicsEngine.getAlphaAtT(currentMaterial, temperature);

    // Total mechanical expansion factor
    let expansionFactor = alpha * dT + plasticStrain;
    if (constraint === "fixed" && objectType !== "bimetallic") {
      expansionFactor = 0; // Length constraint
    } else if (constraint === "partial" && objectType !== "bimetallic") {
      const freeExp = alpha * dT + plasticStrain;
      const gapStrain = gapSize / 10.0; // scaled
      if (freeExp > gapStrain) {
        expansionFactor = gapStrain;
      }
    } else if (constraint === "multi" && objectType !== "bimetallic") {
      expansionFactor = (alpha * dT + plasticStrain) * 0.4;
    }

    // Solve stress/deflection details
    let stress = 0;
    let stressRatio = 0;
    if (objectType !== "bimetallic") {
      const res = ThermalExpansionPhysicsEngine.getStressAndStrain(10.0, currentMaterial, temperature, constraint, gapSize, plasticStrain);
      stress = res.stress;
      stressRatio = Math.min(1.0, Math.abs(stress) / currentMaterial.yieldStrength);
    }

    // Draw Macroscopic Object
    drawMacroObject(ctx, w, h, expansionFactor, stressRatio);

    // Draw Atomic Lattice Overlay Zoom-In
    if (vizSettings.latticeRendering) {
      drawAtomicLattice(ctx, w, h);
    }

    // Draw failure warning labels
    if (isBroken) {
      drawFailureOverlay(ctx, w, h);
    }

  }, [temperature, materialId, objectType, constraint, gapSize, bimetallicMat1, bimetallicMat2, atomCount, bondStiffness, vizSettings, isBroken, isDeformed, crackLocations, plasticStrain, fatigueAccumulated, time]);

  // COLOR MAPPER FOR TEMPERATURE
  const getTempColor = (T: number, alphaMultiplier = 1.0) => {
    // 0K to 1500K
    // Cold: Blue -> Warm: Cyan/Green/Yellow -> Hot: Orange/Red/White
    let r = 0, g = 0, b = 0;
    if (T < 273.15) {
      // Cryogenic blue
      b = 255;
      r = Math.max(0, Math.floor(100 * (T / 273.15)));
      g = Math.max(0, Math.floor(180 * (T / 273.15)));
    } else if (T < 400) {
      // Cyan to yellow-green
      const ratio = (T - 273.15) / 126.85;
      r = Math.floor(ratio * 150);
      g = 200 + Math.floor(ratio * 55);
      b = 255 - Math.floor(ratio * 200);
    } else if (T < 800) {
      // Yellow to deep orange/red
      const ratio = (T - 400) / 400;
      r = 255;
      g = 200 - Math.floor(ratio * 200);
      b = 0;
    } else {
      // Red to white hot
      const ratio = Math.min(1.0, (T - 800) / 700);
      r = 255;
      g = Math.floor(ratio * 255);
      b = Math.floor(ratio * 255);
    }
    return `rgba(${r}, ${g}, ${b}, ${alphaMultiplier})`;
  };

  // GET STRESS COLOR MAPPER
  const getStressColor = (ratio: number, alpha = 0.4) => {
    // Green (0) -> Yellow (0.5) -> Red (1.0)
    let r = 0, g = 255, b = 0;
    if (ratio < 0.5) {
      r = Math.floor((ratio / 0.5) * 255);
      g = 255;
    } else {
      r = 255;
      g = Math.floor((1.0 - (ratio - 0.5) / 0.5) * 255);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // MACROSCOPIC DRAWING ENGINE
  const drawMacroObject = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    expansionFactor: number,
    stressRatio: number
  ) => {
    const objectCenterY = h / 2 - 20;
    const dT = temperature - ThermalExpansionPhysicsEngine.T_REF;

    // Set Fill Glow
    const tGlow = getTempColor(temperature, 0.95);

    switch (objectType) {
      case "rod": {
        // Linear rod centered
        const baseWidth = w * 0.5;
        const expandedWidth = baseWidth * (1 + expansionFactor);
        const rodHeight = 35;
        const rodX = (w - expandedWidth) / 2;
        const rodY = objectCenterY - rodHeight / 2;

        // Render shadow thermal glow
        if (vizSettings.thermalGlow) {
          ctx.save();
          ctx.shadowColor = getTempColor(temperature, 1.0);
          ctx.shadowBlur = 18;
          ctx.fillStyle = getTempColor(temperature, 0.45);
          ctx.fillRect(rodX, rodY, expandedWidth, rodHeight);
          ctx.restore();
        }

        // Main Rod Fill
        ctx.fillStyle = "#1e1e24";
        ctx.fillRect(rodX, rodY, expandedWidth, rodHeight);

        // FEA Stress Heatmap contour overlay
        if (vizSettings.heatmaps && constraint !== "free") {
          ctx.fillStyle = getStressColor(stressRatio, 0.55);
          ctx.fillRect(rodX, rodY, expandedWidth, rodHeight);
        }

        // Core Temp gradient overlay
        const grad = ctx.createLinearGradient(rodX, rodY, rodX + expandedWidth, rodY);
        grad.addColorStop(0, getTempColor(temperature, 0.1));
        grad.addColorStop(0.5, getTempColor(temperature, 0.35));
        grad.addColorStop(1, getTempColor(temperature, 0.1));
        ctx.fillStyle = grad;
        ctx.fillRect(rodX, rodY, expandedWidth, rodHeight);

        // Outer borders
        ctx.strokeStyle = isBroken ? "#ef4444" : "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rodX, rodY, expandedWidth, rodHeight);

        // Drawing Anchor Limits (for constraints)
        drawConstraintAnchors(ctx, rodX, rodY, expandedWidth, rodHeight, baseWidth);

        // Crack propagations
        if (isBroken) {
          drawCracks(ctx, rodX, rodY, expandedWidth, rodHeight);
        }
        break;
      }

      case "bridge": {
        // Suspended Bridge Deck with joints
        const deckX = 60;
        const baseWidth = w - 160;
        const expandedWidth = baseWidth * (1 + expansionFactor);
        const deckHeight = 22;
        const deckY = objectCenterY;

        // Bending upward factor under compression
        let bendOffsetY = 0;
        if (isDeformed && constraint === "partial") {
          bendOffsetY = -25 * vizSettings.deformationAmplification * (Math.abs(expansionFactor * 10) - (gapSize / 10.0));
        }

        // Draw Supports pillars (Left fixed, Right roller spacer)
        ctx.fillStyle = "#27272a";
        ctx.fillRect(deckX - 10, deckY + deckHeight, 25, 45); // Left Pillar
        
        const rightSupportX = deckX + baseWidth;
        ctx.fillRect(rightSupportX - 15, deckY + deckHeight, 25, 45); // Right Pillar

        // Draw Expansion rollers below the right end
        ctx.fillStyle = "#52525b";
        ctx.beginPath();
        ctx.arc(rightSupportX - 10, deckY + deckHeight + 8, 4, 0, Math.PI * 2);
        ctx.arc(rightSupportX, deckY + deckHeight + 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Rollers base plate
        ctx.fillRect(rightSupportX - 18, deckY + deckHeight + 12, 30, 4);

        // Render Bridge Span Deck (curved quadratic path if buckling/deforming)
        ctx.beginPath();
        ctx.moveTo(deckX, deckY);
        
        if (bendOffsetY !== 0) {
          ctx.quadraticCurveTo(deckX + expandedWidth / 2, deckY + bendOffsetY, deckX + expandedWidth, deckY);
          ctx.lineTo(deckX + expandedWidth, deckY + deckHeight);
          ctx.quadraticCurveTo(deckX + expandedWidth / 2, deckY + deckHeight + bendOffsetY, deckX, deckY + deckHeight);
        } else {
          ctx.rect(deckX, deckY, expandedWidth, deckHeight);
        }
        ctx.closePath();

        // Deck filling
        ctx.fillStyle = "#202025";
        ctx.fill();

        // Contour Overlay
        if (vizSettings.heatmaps && stressRatio > 0.05) {
          ctx.fillStyle = getStressColor(stressRatio, 0.45);
          ctx.fill();
        }

        ctx.strokeStyle = isBroken ? "#ef4444" : "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw Gap limit line indicator
        const maxLimitX = deckX + baseWidth + (gapSize * 500); // gap size scaled
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(maxLimitX, deckY - 15); ctx.lineTo(maxLimitX, deckY + deckHeight + 15); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(6, 182, 212, 0.65)";
        ctx.font = "8px monospace";
        ctx.fillText("GAP LIMIT", maxLimitX - 22, deckY - 20);

        if (isBroken) {
          drawCracks(ctx, deckX, deckY + bendOffsetY, expandedWidth, deckHeight);
        }
        break;
      }

      case "railway": {
        // Parallel railway tracks with buckle deform path
        const railX = 50;
        const railLength = w - 100;
        const railY = objectCenterY - 10;
        const railH = 6;

        // Buckling sine wave shape: delta expansion causes severe warping
        let buckleWarp: (x: number) => number = () => 0;
        if (isDeformed) {
          const maxBuckle = 32 * (expansionFactor * 5) * vizSettings.deformationAmplification;
          buckleWarp = (x) => {
            const relX = (x - railX) / railLength;
            if (relX > 0.25 && relX < 0.75) {
              return maxBuckle * Math.sin((relX - 0.25) * 2 * Math.PI);
            }
            return 0;
          };
        }

        // Draw wood/concrete sleepers first
        ctx.fillStyle = "#3f3f46";
        const sleepers = 20;
        for (let i = 0; i <= sleepers; i++) {
          const sx = railX + (i / sleepers) * railLength;
          const sy = railY + buckleWarp(sx);
          ctx.fillRect(sx - 3, sy - 8, 6, 26);
        }

        // Draw Rails steel curves
        ctx.lineWidth = 3;
        ctx.strokeStyle = isBroken ? "#ef4444" : "#a1a1aa";
        
        // Track 1 top rail
        ctx.beginPath();
        for (let x = railX; x <= railX + railLength; x += 5) {
          const y = railY + buckleWarp(x);
          if (x === railX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Track 2 bottom rail
        ctx.beginPath();
        for (let x = railX; x <= railX + railLength; x += 5) {
          const y = railY + 10 + buckleWarp(x);
          if (x === railX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (vizSettings.thermalGlow) {
          ctx.shadowColor = getTempColor(temperature, 0.85);
          ctx.shadowBlur = 10;
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = getTempColor(temperature, 0.45);
          ctx.stroke();
        }
        break;
      }

      case "bimetallic": {
        // Bimetallic strip composed of two layers curved by Timoshenko formula
        const mat1 = MATERIAL_DATABASE[bimetallicMat1];
        const mat2 = MATERIAL_DATABASE[bimetallicMat2];

        // Solve bimetallic deflection curvature
        const bim = ThermalExpansionPhysicsEngine.getBimetallicBending(6.0, 0.12, mat1, mat2, temperature);
        
        // Render bending strip along X axis
        const stripX = w * 0.15;
        const stripLength = w * 0.55;
        const layerHeight = 10;
        const startY = objectCenterY;

        // Apply Timoshenko bending curvature model
        // Curvature kappa = deflection displacement
        // Point along length curves as: y(x) = (kappa * x^2) / 2
        // We will render it as a set of connected quadratic vertices
        const steps = 60;
        const kappa = bim.curvature * 0.1 * vizSettings.deformationAmplification;

        ctx.lineWidth = layerHeight;
        
        // Layer 1: Top alloy
        ctx.beginPath();
        ctx.strokeStyle = getMaterialLayerColor(bimetallicMat1);
        for (let i = 0; i <= steps; i++) {
          const relX = i / steps;
          const x = stripX + relX * stripLength;
          const sLength = relX * stripLength;
          const y = startY - (layerHeight / 2) + (kappa * sLength * sLength) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Layer 2: Bottom alloy
        ctx.beginPath();
        ctx.strokeStyle = getMaterialLayerColor(bimetallicMat2);
        for (let i = 0; i <= steps; i++) {
          const relX = i / steps;
          const x = stripX + relX * stripLength;
          const sLength = relX * stripLength;
          const y = startY + (layerHeight / 2) + (kappa * sLength * sLength) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Base fixed anchor on the left
        ctx.fillStyle = "#27272a";
        ctx.fillRect(stripX - 15, startY - 18, 15, 36);

        // Core Temp gradient glow
        if (vizSettings.thermalGlow) {
          ctx.save();
          ctx.strokeStyle = getTempColor(temperature, 0.5);
          ctx.shadowColor = getTempColor(temperature, 1.0);
          ctx.shadowBlur = 12;
          ctx.lineWidth = layerHeight * 2;
          ctx.stroke();
          ctx.restore();
        }
        break;
      }

      case "cube": {
        // Isometric 3D Cube expanding isotropically
        const size0 = h * 0.35;
        const size = size0 * (1 + expansionFactor);
        
        const cx = w * 0.42;
        const cy = h * 0.54;

        // Isometric coordinates offset
        const drawIsoFace = (p1: number[], p2: number[], p3: number[], p4: number[], color: string) => {
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.lineTo(p3[0], p3[1]);
          ctx.lineTo(p4[0], p4[1]);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.stroke();
        };

        const isoX = (x: number, y: number, z: number) => {
          return cx + (x - y) * Math.cos(Math.PI / 6);
        };
        const isoY = (x: number, y: number, z: number) => {
          return cy - z + (x + y) * Math.sin(Math.PI / 6);
        };

        const s = size / 2;
        const p000 = [isoX(-s, -s, -s), isoY(-s, -s, -s)];
        const p100 = [isoX(s, -s, -s), isoY(s, -s, -s)];
        const p010 = [isoX(-s, s, -s), isoY(-s, s, -s)];
        const p110 = [isoX(s, s, -s), isoY(s, s, -s)];
        
        const p001 = [isoX(-s, -s, s), isoY(-s, -s, s)];
        const p101 = [isoX(s, -s, s), isoY(s, -s, s)];
        const p011 = [isoX(-s, s, s), isoY(-s, s, s)];
        const p111 = [isoX(s, s, s), isoY(s, s, s)];

        // Glow
        if (vizSettings.thermalGlow) {
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = getTempColor(temperature, 0.7);
          drawIsoFace(p001, p101, p111, p011, getTempColor(temperature, 0.35));
          ctx.restore();
        }

        // Draw top face
        drawIsoFace(p001, p101, p111, p011, "#27272c");
        // Draw left face
        drawIsoFace(p000, p010, p011, p001, "#18181c");
        // Draw right face
        drawIsoFace(p100, p110, p111, p101, "#202025");

        // Overlay thermal heat maps
        if (vizSettings.heatmaps && stressRatio > 0.05) {
          ctx.fillStyle = getStressColor(stressRatio, 0.35);
          ctx.fill();
        }
        break;
      }

      case "plate": {
        // Flat 2D Rectangular Plate expanding in Area
        const baseW = w * 0.4;
        const baseH = h * 0.45;
        const currentW = baseW * (1 + expansionFactor);
        const currentH = baseH * (1 + expansionFactor);

        const pxX = (w - currentW) / 2 - 20;
        const pxY = (h - currentH) / 2;

        ctx.fillStyle = "#1c1c22";
        ctx.fillRect(pxX, pxY, currentW, currentH);

        // Heatmap stress overlay
        if (vizSettings.heatmaps && stressRatio > 0.05) {
          ctx.fillStyle = getStressColor(stressRatio, 0.4);
          ctx.fillRect(pxX, pxY, currentW, currentH);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(pxX, pxY, currentW, currentH);

        // Drawing a grid of lines on the plate to visualize area strain expansion
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        const divisions = 6;
        for (let i = 1; i < divisions; i++) {
          const lx = pxX + (i / divisions) * currentW;
          ctx.beginPath(); ctx.moveTo(lx, pxY); ctx.lineTo(lx, pxY + currentH); ctx.stroke();
          
          const ly = pxY + (i / divisions) * currentH;
          ctx.beginPath(); ctx.moveTo(pxX, ly); ctx.lineTo(pxX + currentW, ly); ctx.stroke();
        }
        break;
      }

      case "ring": {
        // Uniform circular ring (Hole expands!)
        const cx = w * 0.4;
        const cy = h * 0.5;
        const rOuter0 = h * 0.28;
        const rInner0 = h * 0.14;

        const rOuter = rOuter0 * (1 + expansionFactor);
        const rInner = rInner0 * (1 + expansionFactor); // Proof: hole expands!

        // Outer Ring Path
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
        ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true); // counterclockwise hole path
        ctx.closePath();

        ctx.fillStyle = "#222227";
        ctx.fill();

        if (vizSettings.thermalGlow) {
          ctx.save();
          ctx.shadowColor = getTempColor(temperature, 0.8);
          ctx.shadowBlur = 15;
          ctx.fillStyle = getTempColor(temperature, 0.2);
          ctx.fill();
          ctx.restore();
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }

      case "liquid": {
        // Glass container with volumetric expansion of liquid rising in a capillary neck
        const cx = w * 0.4;
        const cy = h * 0.7;
        const baseW = 100;
        const baseH = 80;

        // Container linear expansion factor (glass)
        const glassMat = MATERIAL_DATABASE["glass"];
        const glassExpansion = ThermalExpansionPhysicsEngine.getAlphaAtT(glassMat, temperature) * dT;
        const cWidth = baseW * (1 + glassExpansion);
        const cHeight = baseH * (1 + glassExpansion);

        // Volumetric liquid expansion factor (say water or liquid mercury, gamma ~ 1.8e-4)
        const liquidGamma = 2.1e-4; // 1/K
        const liquidExpansion = liquidGamma * dT;

        // Liquid height inside container
        const fillLevel = 0.75 * cHeight * (1 + liquidExpansion - glassExpansion * 2); // ratio changes

        // Beaker glass envelope
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cx - cWidth / 2, cy - cHeight);
        ctx.lineTo(cx - cWidth / 2, cy);
        ctx.lineTo(cx + cWidth / 2, cy);
        ctx.lineTo(cx + cWidth / 2, cy - cHeight);
        ctx.stroke();

        // Draw Liquid volume inside
        ctx.fillStyle = getTempColor(temperature, 0.7);
        const lY = cy - fillLevel;
        ctx.fillRect(cx - cWidth / 2 + 3, lY, cWidth - 6, fillLevel - 2);

        // Volumetric overflow alert
        if (lY < cy - cHeight) {
          ctx.fillStyle = "rgba(239, 68, 110, 0.4)";
          ctx.fillRect(cx - cWidth / 2 - 10, cy - cHeight, cWidth + 20, 5); // liquid overflow spill
        }
        break;
      }
    }
  };

  // ZOOM-IN MICROSCOPIC ATOMIC LATTICE
  const drawAtomicLattice = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Zoom boundary circle at top-right corner
    const zoomX = w - 105;
    const zoomY = h - 95;
    const radius = 80;

    // Draw circular container
    ctx.fillStyle = "#0c0c0e";
    ctx.beginPath(); ctx.arc(zoomX, zoomY, radius, 0, Math.PI * 2); ctx.fill();

    // Border glowing circle
    ctx.strokeStyle = getTempColor(temperature, 0.8);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Circular clipping path for atoms
    ctx.save();
    ctx.beginPath(); ctx.arc(zoomX, zoomY, radius - 2, 0, Math.PI * 2); ctx.clip();

    // Lattice lattice physics properties
    // Vibration amplitude A = sqrt(k_B * T / stiffness)
    const vibeAmp = ThermalExpansionPhysicsEngine.getVibrationAmplitude(temperature, bondStiffness) * 12; // scale factor
    // Spacing spacing r(T) = r0 * (1 + alpha * dT + anharmonic_shift)
    const anharmonicShift = 0.015 * (temperature / 100);
    const spacing = 28 * (1 + anharmonicShift);

    // Create a 5x5 atomic grid
    const cols = 5;
    const rows = 5;
    const startX = zoomX - (cols - 1) * spacing / 2;
    const startY = zoomY - (rows - 1) * spacing / 2;

    const atomPositions: { x: number; y: number }[][] = [];

    // Phase vibration phase for dynamic updates
    const omega = 12.0; // frequency of atomic vibrations
    const phaseShift = time * omega;

    for (let r = 0; r < rows; r++) {
      atomPositions[r] = [];
      for (let c = 0; c < cols; c++) {
        const baseAtomX = startX + c * spacing;
        const baseAtomY = startY + r * spacing;

        // Individual phase offsets to represent statistical random thermal noise
        const individualPhase = (r * 1.7 + c * 2.3 + phaseShift);
        
        // Atom displacement (Simple harmonic oscillator)
        const dx = vibeAmp * Math.sin(individualPhase);
        const dy = vibeAmp * Math.cos(individualPhase * 1.2);

        atomPositions[r][c] = {
          x: baseAtomX + dx,
          y: baseAtomY + dy
        };
      }
    }

    // Render interatomic bond lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const current = atomPositions[r][c];
        
        // Right bond connection
        if (c < cols - 1) {
          const right = atomPositions[r][c + 1];
          ctx.beginPath(); ctx.moveTo(current.x, current.y); ctx.lineTo(right.x, right.y); ctx.stroke();
        }
        // Down bond connection
        if (r < rows - 1) {
          const down = atomPositions[r + 1][c];
          ctx.beginPath(); ctx.moveTo(current.x, current.y); ctx.lineTo(down.x, down.y); ctx.stroke();
        }
      }
    }

    // Render atoms
    const atomRadius = 5.5;
    ctx.fillStyle = getTempColor(temperature, 0.95);
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = atomPositions[r][c];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, atomRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    ctx.restore(); // end circle clipping

    // HUD Zoom tag
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(zoomX - 35, zoomY + radius - 20, 70, 15);
    ctx.fillStyle = getTempColor(temperature, 1.0);
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText("LATTICE ZOOM", zoomX, zoomY + radius - 10);
  };

  // DRAW CONSTRAINT ANCHORS
  const drawConstraintAnchors = (
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    baseWidth: number
  ) => {
    ctx.fillStyle = "#27272a";
    
    // Left boundary wall (always anchoring)
    ctx.fillRect(rx - 15, ry - 15, 15, rh + 30);
    
    // Right boundary anchors depending on mode
    if (constraint === "fixed") {
      const fixedRightX = rx + rw;
      ctx.fillRect(fixedRightX, ry - 15, 15, rh + 30);
    } else if (constraint === "partial") {
      // Small spacing spacer
      const gapAnchorX = (rx + baseWidth) + (gapSize * 500); // scaled spacer
      ctx.fillStyle = "#3f3f46";
      ctx.fillRect(gapAnchorX, ry - 15, 15, rh + 30);

      // Warning dash joint bounds
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(rx, ry - 12, baseWidth, rh + 24);
      ctx.setLineDash([]);
    } else if (constraint === "multi") {
      // Drawing spring structures on the right side
      const rightX = rx + rw;
      ctx.strokeStyle = "#71717a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      let sx = rightX;
      ctx.moveTo(sx, ry + rh / 2);
      for (let i = 0; i < 5; i++) {
        sx += 8;
        const sy = ry + rh / 2 + (i % 2 === 0 ? -12 : 12);
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(sx + 10, ry + rh / 2);
      ctx.stroke();

      // Right pillar anchor
      ctx.fillStyle = "#27272a";
      ctx.fillRect(sx + 8, ry - 15, 15, rh + 30);
    }
  };

  // CRACK RENDERER FOR FAILURE EVENTS
  const drawCracks = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) => {
    ctx.strokeStyle = "#fca5a5"; // Soft red/pink
    ctx.lineWidth = 1.8;
    
    crackLocations.forEach(c => {
      const absoluteX = bx + c.x * bw;
      const absoluteY = by + c.y * bh;
      const size = c.size;

      ctx.beginPath();
      ctx.moveTo(absoluteX, absoluteY);
      
      // Draw a jagged lightning crack
      const segments = 4;
      let curX = absoluteX;
      let curY = absoluteY;
      for (let i = 0; i < segments; i++) {
        const dx = (Math.random() - 0.5) * (size / 2);
        const dy = (Math.random() * (size / 2)) * (i % 2 === 0 ? 1 : -1);
        curX += dx;
        curY += dy;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    });
  };

  // LAYER MATERIAL COLOR MAP (BIMETALLIC)
  const getMaterialLayerColor = (id: string) => {
    switch (id) {
      case "steel": return "#78716c"; // steel stone
      case "copper": return "#b45309"; // copper orange
      case "aluminum": return "#e2e8f0"; // aluminium slate
      case "glass": return "#c084fc"; // purple tint
      case "concrete": return "#64748b"; // grey slate
      case "titanium": return "#ca8a04"; // titanium gold
      case "invar": return "#0891b2"; // invar cyan
      default: return "#ffffff";
    }
  };

  // OVERLAY RENDER FOR FAILURE WARNINGS
  const drawFailureOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
    ctx.fillRect(0, 0, w, h);

    // Warning HUD plate
    const boxW = 190;
    const boxH = 45;
    const boxX = 25;
    const boxY = 25;

    ctx.fillStyle = "rgba(10, 10, 12, 0.85)";
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("STATUS: STRUCTURAL FAILURE", boxX + 12, boxY + 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "7px monospace";
    ctx.fillText("Yield stress exceeded mechanical limits.", boxX + 12, boxY + 28);
    ctx.fillText("Cracking and permanent shear warping induced.", boxX + 12, boxY + 36);
  };

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full select-none"
      />
    </div>
  );
};

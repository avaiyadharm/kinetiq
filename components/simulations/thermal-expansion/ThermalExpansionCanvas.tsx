"use client";

import React, { useRef, useEffect } from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";

// ============================================================
// COLOR UTILITIES
// ============================================================

// Physically accurate thermal color map (black-body radiation inspired)
// Cold (≈77K) = deep blue, Ambient (293K) = neutral grey-blue,
// Warm (600K) = orange, Hot (1000K) = red-white
function thermalColor(T: number, alpha = 1): string {
  const t = Math.max(0, Math.min(1, (T - 77) / (1500 - 77)));
  let r = 0, g = 0, b = 0;
  if (t < 0.15) {
    r = 0;
    g = Math.floor(t / 0.15 * 30);
    b = Math.floor(80 + t / 0.15 * 175);
  } else if (t < 0.35) {
    const x = (t - 0.15) / 0.20;
    r = Math.floor(x * 60);
    g = Math.floor(30 + x * 80);
    b = Math.floor(255 - x * 90);
  } else if (t < 0.55) {
    const x = (t - 0.35) / 0.20;
    r = Math.floor(60 + x * 195);
    g = Math.floor(110 + x * 80);
    b = Math.floor(165 - x * 165);
  } else if (t < 0.75) {
    const x = (t - 0.55) / 0.20;
    r = 255;
    g = Math.floor(190 - x * 140);
    b = 0;
  } else {
    const x = (t - 0.75) / 0.25;
    r = 255;
    g = Math.floor(50 + x * 205);
    b = Math.floor(x * 255);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Stress color: blue (compressive) → grey (zero) → red (tensile/yield)
function stressColor(stress: number, yieldStrength: number, alpha = 0.5): string {
  const ratio = Math.max(-1, Math.min(1, stress / Math.max(yieldStrength, 1)));
  if (ratio < 0) {
    const x = -ratio;
    return `rgba(${Math.floor(20 + x * 20)}, ${Math.floor(60 + x * 30)}, ${Math.floor(150 + x * 105)}, ${alpha})`;
  } else {
    return `rgba(${Math.floor(150 + ratio * 105)}, ${Math.floor(60 - ratio * 50)}, ${Math.floor(20 - ratio * 10)}, ${alpha})`;
  }
}

// ============================================================
// COMPONENT
// ============================================================
export const ThermalExpansionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    avgTemperature,
    thermalProfile,
    materialId,
    bimetallicMat1,
    bimetallicMat2,
    objectType,
    constraint,
    gapSize,
    realDeltaL,
    stressAtConstraint,
    isYielding,
    isFailed,
    crackLocations,
    willBuckle,
    bucklingLoad,
    bucklingCriticalLoad,
    bimetallicCurvature,
    bimetallicDeflection,
    L0,
    thickness,
    diameter,
    crossSectionalArea,
    vizSettings,
    spatialStressProfile,
    nodeDisplacementProfile,
    time,
    
    // 2D fields
    thermalProfile2D,
    nodeDisplacement2D,
    elementStress2D,
    nodePositions2D,
    elementNodeIds2D,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    };

    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(6,182,212,0.025)";
    ctx.lineWidth = 1;
    const gs = 30;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const is2DDataAvailable = nodePositions2D && nodePositions2D.length > 0 && nodeDisplacement2D && nodeDisplacement2D.length > 0;

    // Draw correct shape based on objectType
    if (objectType === "plate" && is2DDataAvailable) {
      drawPlate2D(ctx, W, H);
    } else if (objectType === "bimetallic" && is2DDataAvailable) {
      drawBimetallic2D(ctx, W, H);
    } else {
      switch (objectType) {
        case "rod":        drawRod(ctx, W, H); break;
        case "bridge":     drawBridge(ctx, W, H); break;
        case "railway":    drawRailway(ctx, W, H); break;
        case "ring":       drawRing(ctx, W, H); break;
        default:           drawRod(ctx, W, H);
      }
    }

    // Atomic lattice overlay
    if (vizSettings.showAtomicLattice) {
      drawAtomicLattice(ctx, W, H);
    }

    // Structural failure overlay
    if (isFailed) drawFailureOverlay(ctx, W, H);

    ctx.restore();
  }, [
    avgTemperature, thermalProfile, materialId, objectType, constraint, gapSize,
    realDeltaL, stressAtConstraint, isYielding, isFailed, crackLocations,
    willBuckle, bucklingLoad, bucklingCriticalLoad, bimetallicCurvature, bimetallicDeflection,
    vizSettings, spatialStressProfile, nodeDisplacementProfile, time,
    thermalProfile2D, nodeDisplacement2D, elementStress2D, nodePositions2D
  ]);

  // ── DRAW: 1D ROD ──────────────────────────────────────────
  const drawRod = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const centerY = H * 0.36;
    const rodH = Math.min(48, H * 0.1);
    const rodX = W * 0.15;
    const baseW = W * 0.50;
    const rodY = centerY - rodH / 2;

    const ppm = baseW / L0;
    const N = thermalProfile.length;

    const nodeX: number[] = nodeDisplacementProfile.map((u, i) =>
      rodX + (i / (N - 1)) * baseW + u * ppm * mag
    );

    const rodLeft = nodeX[0];
    const rodRight = Math.max(nodeX[N - 1], rodLeft + 4);
    const visualW = rodRight - rodLeft;

    // Thermal glow
    if (avgTemperature > 700) {
      const glowIntensity = Math.min(1, (avgTemperature - 700) / 800);
      ctx.save();
      ctx.shadowColor = thermalColor(avgTemperature, 1);
      ctx.shadowBlur = 18 + glowIntensity * 40;
      ctx.fillStyle = thermalColor(avgTemperature, 0.12 * glowIntensity);
      ctx.fillRect(rodLeft - 4, rodY - 6, visualW + 8, rodH + 12);
      ctx.restore();
    }

    // Cryo frost
    if (avgTemperature < 200) {
      const frostAlpha = Math.min(0.35, (200 - avgTemperature) / 200 * 0.35);
      ctx.fillStyle = `rgba(147, 210, 255, ${frostAlpha})`;
      ctx.fillRect(rodLeft, rodY - 2, visualW, rodH + 4);
    }

    // Segment coloring
    for (let i = 0; i < N - 1; i++) {
      const x0 = nodeX[i];
      const x1 = nodeX[i + 1];
      const segW = Math.max(0, x1 - x0);
      const T_left = thermalProfile[i];
      const T_right = thermalProfile[i + 1];
      const T_seg = (T_left + T_right) / 2;

      if (vizSettings.showThermalGradient) {
        const g = ctx.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, thermalColor(T_left, 0.88));
        g.addColorStop(1, thermalColor(T_right, 0.88));
        ctx.fillStyle = g;
        ctx.fillRect(x0, rodY, segW, rodH);
      }

      if (vizSettings.showStressColors && spatialStressProfile[i] !== 0) {
        const σ_y = PhysicsEngine.yieldStrength(mat, T_seg);
        ctx.fillStyle = stressColor(spatialStressProfile[i], σ_y, 0.35);
        ctx.fillRect(x0, rodY, segW, rodH);
      }
    }

    if (!vizSettings.showThermalGradient) {
      ctx.fillStyle = "#222228";
      ctx.fillRect(rodLeft, rodY, visualW, rodH);
    }

    // White core glow for extreme heat
    if (avgTemperature > 1200) {
      const whiteAlpha = Math.min(0.5, (avgTemperature - 1200) / 1000);
      const ig = ctx.createLinearGradient(rodLeft, rodY, rodLeft, rodY + rodH);
      ig.addColorStop(0, `rgba(255,255,220,${whiteAlpha * 0.3})`);
      ig.addColorStop(0.5, `rgba(255,255,255,${whiteAlpha})`);
      ig.addColorStop(1, `rgba(255,255,220,${whiteAlpha * 0.3})`);
      ctx.fillStyle = ig;
      ctx.fillRect(rodLeft, rodY, visualW, rodH);
    }

    ctx.strokeStyle = isFailed ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = isFailed ? 2.5 : 1.5;
    ctx.strokeRect(rodLeft, rodY, visualW, rodH);

    drawRodAnchors(ctx, rodLeft, rodY, visualW, rodH, baseW);

    if (isFailed && crackLocations.length > 0) {
      drawCracks(ctx, rodLeft, rodY, visualW, rodH);
    }

    drawDimensionArrows(ctx, rodLeft, rodY, baseW, visualW, rodH);

    if (vizSettings.showHeatFront && constraint !== "fixed") {
      drawHeatFront(ctx, rodLeft, rodY, visualW, rodH);
    }

    if (mag > 1) {
      ctx.fillStyle = "rgba(255,180,0,0.45)";
      ctx.font = "bold 7.5px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`×${mag} visual magnification  real ΔL = ${(realDeltaL * 1000).toFixed(4)} mm`, W - 8, H - 8);
    }
  };

  // ── DRAW: 1D BRIDGE ────────────────────────────────────────
  const drawBridge = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const deckH = 20;
    const deckY = H * 0.36;
    const deckX = W * 0.1;
    const baseW = W * 0.78;
    const N = thermalProfile.length;

    const ppm = baseW / L0;
    
    // Nodal displacement integration (physical expansion gap contact)
    const nodeX: number[] = nodeDisplacementProfile.map((u, i) =>
      deckX + (i / (N - 1)) * baseW + u * ppm * mag
    );
    const deckW = nodeX[N - 1] - nodeX[0];

    // Left pillar (fixed)
    ctx.fillStyle = "#27272a";
    ctx.fillRect(deckX - 12, deckY + deckH, 24, 55);

    // Right pillar (sliding roller support)
    const rightPillarX = deckX + baseW;
    ctx.fillStyle = "#27272a";
    ctx.fillRect(rightPillarX - 12, deckY + deckH, 24, 55);

    // Roller wheels
    ctx.fillStyle = "#52525b";
    [-8, 0, 8].forEach(ox => {
      ctx.beginPath();
      ctx.arc(rightPillarX + ox, deckY + deckH + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gap limit line
    const gapPxSize = gapSize * ppm;
    ctx.strokeStyle = "rgba(6,182,212,0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    const gapX = deckX + baseW + gapPxSize;
    ctx.beginPath(); ctx.moveTo(gapX, deckY - 14); ctx.lineTo(gapX, deckY + deckH + 14); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(6,182,212,0.6)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`GAP ${(gapSize * 1000).toFixed(1)}mm`, gapX, deckY - 20);

    // Draw elements
    for (let i = 0; i < N - 1; i++) {
      const x0 = nodeX[i];
      const x1 = nodeX[i + 1];
      const T_seg = (thermalProfile[i] + thermalProfile[i + 1]) / 2;
      const σ_y = PhysicsEngine.yieldStrength(mat, T_seg);
      
      const gradFill = ctx.createLinearGradient(x0, 0, x1, 0);
      gradFill.addColorStop(0, thermalColor(thermalProfile[i], 0.7));
      gradFill.addColorStop(1, thermalColor(thermalProfile[i + 1], 0.7));
      ctx.fillStyle = gradFill;
      ctx.fillRect(x0, deckY, x1 - x0, deckH);

      if (vizSettings.showStressColors && spatialStressProfile[i] !== 0) {
        ctx.fillStyle = stressColor(spatialStressProfile[i], σ_y, 0.35);
        ctx.fillRect(x0, deckY, x1 - x0, deckH);
      }
    }

    ctx.strokeStyle = isFailed ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(nodeX[0], deckY, deckW, deckH);

    // Visual bridge crush overlay if displacement exceeds gap
    if (nodeX[N - 1] > gapX) {
      ctx.fillStyle = "rgba(239,68,68,0.25)";
      ctx.fillRect(gapX, deckY - 3, nodeX[N - 1] - gapX, deckH + 6);
    }
  };

  // ── DRAW: 1D RAILWAY BUCKLING ──────────────────────────────
  const drawRailway = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const railY = H * 0.36;
    const railX = W * 0.07;
    const railLen = W * 0.86;
    const trackSep = 22;

    const E_avg = PhysicsEngine.youngsModulus(mat, avgTemperature);
    const compressiveLoad = Math.max(0, -stressAtConstraint * crossSectionalArea);
    const bucklingStrain = bucklingLoad > bucklingCriticalLoad
      ? (compressiveLoad - bucklingCriticalLoad) / (E_avg * crossSectionalArea)
      : 0;
    
    // Buckling amplitude based on post-buckling compressive deformation
    const buckleAmp = bucklingLoad > bucklingCriticalLoad
      ? Math.min(55, 30 * Math.sqrt(Math.max(0, bucklingStrain)) * vizSettings.magnification * vizSettings.deformationExaggeration + 8)
      : 0;

    // Ties
    ctx.fillStyle = "#3f3f46";
    const sleeperCount = 22;
    for (let i = 0; i <= sleeperCount; i++) {
      const sx = railX + (i / sleeperCount) * railLen;
      const buckle = getBuckleY(sx, railX, railLen, buckleAmp);
      ctx.fillRect(sx - 4, railY - 12 + buckle, 8, trackSep + 22);
    }

    // Rails
    const N = thermalProfile.length;
    for (let j = 0; j < 2; j++) {
      const yOffset = j === 0 ? 0 : trackSep;
      for (let i = 0; i < N - 1; i++) {
        const x0 = railX + (i / (N - 1)) * railLen;
        const x1 = railX + ((i + 1) / (N - 1)) * railLen;
        const y0 = railY + yOffset + getBuckleY(x0, railX, railLen, buckleAmp);
        const y1 = railY + yOffset + getBuckleY(x1, railX, railLen, buckleAmp);

        ctx.lineWidth = 4;
        ctx.strokeStyle = isFailed ? "rgba(239,68,68,0.8)" : thermalColor((thermalProfile[i] + thermalProfile[i + 1]) / 2, 0.9);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }

    if (willBuckle) {
      ctx.fillStyle = "rgba(239,68,68,0.9)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠ BUCKLING ONSET: P_th > P_cr", W / 2, railY - 20);
    }
  };

  const getBuckleY = (x: number, railX: number, railLen: number, amp: number): number => {
    if (amp === 0) return 0;
    const rel = (x - railX) / railLen;
    if (rel > 0.15 && rel < 0.85) {
      return amp * Math.sin((rel - 0.15) * Math.PI / 0.7);
    }
    return 0;
  };

  // ── DRAW: 2D PLATE ─────────────────────────────────────────
  const drawPlate2D = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const baseW = W * 0.44;
    const ppm = baseW / L0;
    const cx = W / 2 - 20;
    const cy = H / 2;
    
    // Center of the physical coordinates: L0/2, height/2
    const physicsH = L0 * 0.6;
    const offsetX = cx - (L0 / 2) * ppm;
    const offsetY = cy - (physicsH / 2) * ppm;

    // Render deformed elements as discrete polygons
    const numElems = elementStress2D.length;
    const nx = 12; // defined in setupMesh
    const ny = 8;
    
    for (let e = 0; e < numElems; e++) {
      const nodeIds = elementNodeIds2D[e];
      if (!nodeIds) continue;
      const elStress = elementStress2D[e];
      const elNodes = nodeIds.map((id: number) => {
        const orig = nodePositions2D[id];
        const disp = nodeDisplacement2D[id];
        return {
          x: offsetX + ((orig?.x || 0) + (disp?.ux || 0) * mag) * ppm,
          y: offsetY + ((orig?.y || 0) + (disp?.uy || 0) * mag) * ppm
        };
      });
      
      ctx.beginPath();
      ctx.moveTo(elNodes[0].x, elNodes[0].y);
      ctx.lineTo(elNodes[1].x, elNodes[1].y);
      ctx.lineTo(elNodes[2].x, elNodes[2].y);
      ctx.lineTo(elNodes[3].x, elNodes[3].y);
      ctx.closePath();
      
      // Node average temperature
      const elT = nodeIds.reduce((sum: number, id: number) => sum + thermalProfile2D[id], 0) / 4;
      
      let fill = "#333";
      if (vizSettings.showThermalGradient) {
        fill = thermalColor(elT, 0.82);
      } else {
        fill = mat?.color || "#52525b";
      }
      ctx.fillStyle = fill;
      ctx.fill();
      
      if (vizSettings.showStressColors && elStress) {
        const σ_y = PhysicsEngine.yieldStrength(mat, elT);
        ctx.fillStyle = stressColor(elStress.xx, σ_y, 0.35);
        ctx.fill();
      }
      
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // Draw boundary supports indicators
    ctx.strokeStyle = "rgba(6,182,212,0.8)";
    ctx.fillStyle = "rgba(6,182,212,0.8)";
    ctx.lineWidth = 1.5;
    
    if (constraint === "fixed") {
      // Draw hashed wall clamp lines on left and right
      const leftX = offsetX + (nodeDisplacement2D[0].ux * mag) * ppm;
      const rightX = offsetX + (L0 + nodeDisplacement2D[nx].ux * mag) * ppm;
      
      ctx.beginPath();
      ctx.moveTo(leftX, offsetY - 5); ctx.lineTo(leftX, offsetY + physicsH * ppm + 5);
      ctx.moveTo(rightX, offsetY - 5); ctx.lineTo(rightX, offsetY + physicsH * ppm + 5);
      ctx.stroke();
    } else if (constraint === "free") {
      // Draw triangular pin symbol bottom-left, roller circle bottom-right
      const blX = offsetX + (nodeDisplacement2D[0].ux * mag) * ppm;
      const blY = offsetY + (nodeDisplacement2D[0].uy * mag) * ppm;
      ctx.beginPath();
      ctx.moveTo(blX, blY);
      ctx.lineTo(blX - 6, blY + 8);
      ctx.lineTo(blX + 6, blY + 8);
      ctx.closePath();
      ctx.stroke();
      
      const brX = offsetX + (L0 + nodeDisplacement2D[nx].ux * mag) * ppm;
      const brY = offsetY + (nodeDisplacement2D[nx].uy * mag) * ppm;
      ctx.beginPath();
      ctx.arc(brX, brY + 4, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // ── DRAW: 2D BIMETALLIC STRIP BENDING ──────────────────────
  const drawBimetallic2D = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const stripLen = W * 0.65;
    const ppm = stripLen / L0;
    const offsetX = W * 0.12;
    const offsetY = H * 0.38 - (thickness / 2) * ppm;

    const nx = 30; // defined in setupMesh
    const numElems = elementStress2D.length;
    
    // Draw Q4 bimetallic elements
    for (let e = 0; e < numElems; e++) {
      const nodeIds = elementNodeIds2D[e];
      if (!nodeIds) continue;
      const elStress = elementStress2D[e];
      
      const elNodes = nodeIds.map((id: number) => {
        const orig = nodePositions2D[id];
        const disp = nodeDisplacement2D[id];
        return {
          // Bending displacement is exaggerated vertically by vizSettings.deformationExaggeration
          x: offsetX + ((orig?.x || 0) + (disp?.ux || 0) * mag) * ppm,
          y: offsetY + ((orig?.y || 0) + (disp?.uy || 0) * mag * vizSettings.deformationExaggeration) * ppm
        };
      });
      
      ctx.beginPath();
      ctx.moveTo(elNodes[0].x, elNodes[0].y);
      ctx.lineTo(elNodes[1].x, elNodes[1].y);
      ctx.lineTo(elNodes[2].x, elNodes[2].y);
      ctx.lineTo(elNodes[3].x, elNodes[3].y);
      ctx.closePath();
      
      const elT = nodeIds.reduce((sum: number, id: number) => sum + thermalProfile2D[id], 0) / 4;
      const row = Math.floor(e / nx);
      const isTop = row >= 2;
      
      let fill = "#333";
      if (vizSettings.showThermalGradient) {
        fill = thermalColor(elT, 0.82);
      } else {
        fill = isTop
          ? (MATERIAL_DB[bimetallicMat1]?.color || "#ca8a04")
          : (MATERIAL_DB[bimetallicMat2]?.color || "#0891b2");
      }
      ctx.fillStyle = fill;
      ctx.fill();
      
      if (vizSettings.showStressColors && elStress) {
        const m = isTop ? MATERIAL_DB[bimetallicMat1] : MATERIAL_DB[bimetallicMat2];
        const σ_y = PhysicsEngine.yieldStrength(m, elT);
        ctx.fillStyle = stressColor(elStress.xx, σ_y, 0.35);
        ctx.fill();
      }
      
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // Draw solid cantilever wall on left
    ctx.fillStyle = "#27272a";
    ctx.fillRect(offsetX - 18, offsetY - 8, 18, (thickness * ppm) + 16);
    
    // Realtip deflection calculation
    const tipX = offsetX + (L0 + nodeDisplacement2D[nx].ux * mag) * ppm;
    const tipY = offsetY + (thickness / 2 + bimetallicDeflection * mag * vizSettings.deformationExaggeration) * ppm;
    const deflMM = Math.abs(bimetallicDeflection * 1000);
    
    ctx.fillStyle = "rgba(6,182,212,0.8)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`δ = ${deflMM.toFixed(2)} mm`, tipX + 10, tipY + 3);
    
    const radiusMm = bimetallicCurvature !== 0 ? (1 / Math.abs(bimetallicCurvature) * 1000).toFixed(0) : "∞";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "7px monospace";
    ctx.fillText(`R = ${radiusMm} mm`, tipX + 10, tipY + 15);
  };

  // ── DRAW: 1D RING ──────────────────────────────────────────
  const drawRing = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const frac = (realDeltaL * mag) / L0;
    const cx = W * 0.4, cy = H * 0.5;
    const rOuter0 = H * 0.27;
    const rInner0 = H * 0.13;
    const rOuter = rOuter0 * (1 + frac);
    const rInner = rInner0 * (1 + frac);

    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
    ctx.closePath();

    const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    grad.addColorStop(0, thermalColor(avgTemperature, 0.4));
    grad.addColorStop(1, thermalColor(avgTemperature, 0.85));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(6,182,212,0.6)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Hole also expands (r_inner = r₀(1+αΔT))", cx, cy + rOuter + 16);
  };

  // ── DRAW: ANCHORS (1D ROD) ──────────────────────────────────
  const drawRodAnchors = (
    ctx: CanvasRenderingContext2D,
    rx: number, ry: number, rw: number, rh: number,
    baseW: number
  ) => {
    const hashPattern = (x: number) => {
      ctx.save();
      ctx.fillStyle = "#27272a";
      ctx.fillRect(x, ry - 12, 16, rh + 24);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x, ry - 12 + i * ((rh + 24) / 4));
        ctx.lineTo(x + 16, ry - 12 + (i + 1) * ((rh + 24) / 4));
        ctx.stroke();
      }
      ctx.restore();
    };

    hashPattern(rx - 16);

    if (constraint === "fixed") {
      hashPattern(rx + rw);
    } else if (constraint === "partial") {
      const gapPx = gapSize * (baseW / L0);
      const wallX = rx + baseW + gapPx;
      ctx.strokeStyle = "rgba(6,182,212,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry - 8, baseW, rh + 16);
      ctx.setLineDash([]);
      hashPattern(wallX);
      ctx.fillStyle = "rgba(6,182,212,0.55)";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${(gapSize * 1000).toFixed(1)} mm`, wallX - gapPx / 2, ry - 16);
    } else if (constraint === "spring") {
      const sx = rx + rw;
      ctx.strokeStyle = "#71717a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, ry + rh / 2);
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(sx + 6 + i * 9, ry + rh / 2 + (i % 2 === 0 ? -10 : 10));
      }
      ctx.lineTo(sx + 64, ry + rh / 2);
      ctx.stroke();
      hashPattern(sx + 64);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText("spring k", sx + 32, ry - 14);
    }
  };

  // ── DRAW: DIMENSION ARROWS ────────────────────────────────
  const drawDimensionArrows = (
    ctx: CanvasRenderingContext2D,
    rodX: number, rodY: number, baseW: number, visualW: number, rodH: number
  ) => {
    if (Math.abs(realDeltaL) < 1e-12) return;
    const arrowY = rodY + rodH + 22;
    const mag = vizSettings.magnification;

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(rodX, rodY - 8);
    ctx.lineTo(rodX, arrowY + 6);
    ctx.moveTo(rodX + baseW, rodY - 8);
    ctx.lineTo(rodX + baseW, arrowY + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rodX, arrowY);
    ctx.lineTo(rodX + baseW, arrowY);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`L₀ = ${L0.toFixed(1)} m`, rodX + baseW / 2, arrowY - 4);

    const realMM = realDeltaL * 1000;
    const absRealMM = Math.abs(realMM);
    const mmStr = absRealMM >= 1 ? absRealMM.toFixed(2) + " mm" : (Math.abs(realDeltaL) * 1000).toFixed(3) + " mm";

    if (realDeltaL > 0 && visualW > baseW) {
      ctx.strokeStyle = "rgba(6,182,212,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rodX + baseW, arrowY + 12);
      ctx.lineTo(rodX + visualW, arrowY + 12);
      ctx.stroke();
      ctx.fillStyle = "rgba(6,182,212,0.85)";
      ctx.font = "bold 7.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`+ΔL = ${mmStr}  ×${mag} mag`, rodX + baseW + (visualW - baseW) / 2, arrowY + 24);
    } else if (realDeltaL < 0 && visualW < baseW) {
      ctx.strokeStyle = "rgba(96,165,250,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rodX + visualW, arrowY + 12);
      ctx.lineTo(rodX + baseW, arrowY + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rodX + visualW, arrowY + 12);
      ctx.lineTo(rodX + visualW + 6, arrowY + 8);
      ctx.lineTo(rodX + visualW + 6, arrowY + 16);
      ctx.closePath();
      ctx.fillStyle = "rgba(96,165,250,0.7)";
      ctx.fill();
      ctx.fillStyle = "rgba(96,165,250,0.9)";
      ctx.font = "bold 7.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`← contraction  −ΔL = ${mmStr}  ×${mag} mag`, rodX + baseW / 2, arrowY + 24);
    }
  };

  // ── DRAW: HEAT FRONT ───────────────────────────────────────
  const drawHeatFront = (
    ctx: CanvasRenderingContext2D,
    rodX: number, rodY: number, rodW: number, rodH: number
  ) => {
    const N = thermalProfile.length;
    const ambT = 293.15;
    let frontIdx = N - 1;
    for (let i = 1; i < N; i++) {
      if (thermalProfile[i] < ambT + 5) { frontIdx = i; break; }
    }
    if (frontIdx >= N - 1) return;

    const frontX = rodX + (frontIdx / (N - 1)) * rodW;
    ctx.save();
    ctx.strokeStyle = "rgba(255,200,50,0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(frontX, rodY - 10);
    ctx.lineTo(frontX, rodY + rodH + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,200,50,0.7)";
    ctx.font = "7px monospace";
    ctx.textAlign = "center";
    ctx.fillText("→ heat front", frontX, rodY - 16);
    ctx.restore();
  };

  // ── DRAW: CRACKS ───────────────────────────────────────────
  const drawCracks = (
    ctx: CanvasRenderingContext2D,
    bx: number, by: number, bw: number, bh: number
  ) => {
    ctx.save();
    ctx.strokeStyle = "rgba(252,165,165,0.85)";
    ctx.lineWidth = 1.5;
    crackLocations.forEach(c => {
      const cx = bx + c.x * bw;
      const cy = by + c.y * bh;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let px = cx, py = cy;
      for (let i = 0; i < 5; i++) {
        px += (Math.random() - 0.5) * c.size * 0.5;
        py += (Math.random() * 0.5 - 0.1) * c.size * 0.3;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
    ctx.restore();
  };

  // ── DRAW: ATOMIC LATTICE (STOCHASTIC MAXWELL-BOLTZMANN) ──────
  const drawAtomicLattice = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const cx = W - 75;
    const cy = H - 75;
    const radius = 65;

    ctx.fillStyle = "#0c0c10";
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();

    if (avgTemperature > 600) {
      ctx.save();
      ctx.shadowColor = thermalColor(avgTemperature, 1);
      ctx.shadowBlur = 10 + Math.min(20, (avgTemperature - 600) / 50);
      ctx.strokeStyle = thermalColor(avgTemperature, 0.9);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = thermalColor(avgTemperature, 0.85);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2); ctx.clip();

    // ── Quantum zero-point vibration & thermal amplitude ──
    const T_norm = Math.max(1, avgTemperature) / 293.15;
    const E_norm = mat ? Math.max(1e9, mat.youngsModulus) / 200e9 : 1.0;
    
    // Quantum physical constants for zero point limit
    const hbar = 1.054571817e-34;
    const k_bond = mat ? mat.youngsModulus * 1e-10 : 200e9 * 1e-10;
    const m_atom = mat ? mat.density * 1e-30 : 7850 * 1e-30;
    const ampZeroPoint = Math.sqrt(hbar / (2 * Math.sqrt(m_atom * k_bond))) * 1e10; // Å
    
    const ampThermal = 2.5 * Math.sqrt(T_norm / E_norm);
    const ampZP_px = Math.min(1.5, ampZeroPoint * 15); // convert to pixel scale
    const ampPx = Math.min(8, Math.max(ampZP_px, Math.sqrt(ampThermal * ampThermal + ampZP_px * ampZP_px)));

    // Anharmonic lattice spacing growth shift
    const rawShift = mat ? PhysicsEngine.anharmonicShift(avgTemperature, mat.alpha0) * 3000 : 0;
    const shift = Math.min(8, Math.max(-4, rawShift));
    const spacing = Math.max(14, Math.min(30, 22 + shift));

    const cols = 5, rows = 4;
    const startX = cx - (cols - 1) * spacing / 2;
    const startY = cy - (rows - 1) * spacing / 2;

    const vibFreq = 6 + Math.min(12, (avgTemperature - 100) / 100);
    const phase = time * vibFreq;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    // Stochastic vibration (sum of incommensurate frequencies)
    const atomPos: { x: number; y: number }[][] = [];
    const f1 = 1.0, f2 = Math.SQRT2, f3 = Math.PI; // Incommensurate frequencies

    for (let r = 0; r < rows; r++) {
      atomPos[r] = [];
      for (let c = 0; c < cols; c++) {
        const phaseShift = r * 1.9 + c * 2.7;
        
        // Sum of three sine waves creates smooth pseudo-random thermal motion (Maxwell-Boltzmann like)
        const dx_stochastic = ampPx * (
          0.5 * Math.sin(phase * f1 + phaseShift) +
          0.3 * Math.sin(phase * f2 + phaseShift * 1.5) +
          0.2 * Math.sin(phase * f3 + phaseShift * 2.2)
        );
        const dy_stochastic = ampPx * (
          0.5 * Math.cos(phase * f1 * 1.1 + phaseShift) +
          0.3 * Math.cos(phase * f2 * 0.95 + phaseShift * 1.8) +
          0.2 * Math.cos(phase * f3 * 1.05 + phaseShift * 2.4)
        );

        // Morse potential anharmonicity (statistically shifts average spacing outwards)
        const morseA = 0.8;
        const asymmetry = morseA * (ampPx * ampPx * 0.08) * (1.0 + 0.3 * Math.sin(phase * 0.5 + phaseShift));
        
        atomPos[r][c] = {
          x: startX + c * spacing + dx_stochastic + asymmetry + shift * 0.15 * c,
          y: startY + r * spacing + dy_stochastic
        };
      }
    }

    // Draw bonds
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = atomPos[r][c];
        if (c < cols - 1) {
          const next = atomPos[r][c + 1];
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(next.x, next.y); ctx.stroke();
        }
        if (r < rows - 1) {
          const next = atomPos[r + 1][c];
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(next.x, next.y); ctx.stroke();
        }
      }
    }

    // Draw atoms
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = atomPos[r][c];

        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = thermalColor(avgTemperature, 1);
        ctx.beginPath();
        ctx.ellipse(pos.x + ampPx * 0.15, pos.y, ampPx * 1.5, ampPx * 1.0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const atomR = 4.5;
        if (avgTemperature > 700) {
          ctx.save();
          ctx.shadowColor = thermalColor(avgTemperature, 1);
          ctx.shadowBlur = Math.min(12, (avgTemperature - 700) / 60);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, atomR, 0, Math.PI * 2);
          ctx.fillStyle = thermalColor(avgTemperature, 0.95);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, atomR, 0, Math.PI * 2);
          ctx.fillStyle = thermalColor(avgTemperature, 0.95);
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    ctx.restore();

    // Stats box
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(cx - 44, cy + radius - 16, 88, 14);
    ctx.fillStyle = thermalColor(avgTemperature, 0.9);
    ctx.font = "bold 6.5px monospace";
    ctx.textAlign = "center";
    const ampAngstrom = ampPx * 0.04;
    ctx.fillText(`LATTICE  A ≈ ${ampAngstrom.toFixed(2)} Å  (∝ √T)`, cx, cy + radius - 5);

    // Physics annotation
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "5.5px monospace";
    const noteText = avgTemperature < 100
      ? "Cryo: quantum zero-point motion active"
      : "Morse Potential: ⟨r⟩ > r₀ as T↑";
    ctx.fillText(noteText, cx, cy - radius + 12);
  };

  // ── DRAW: FAILURE OVERLAY ─────────────────────────────────
  const drawFailureOverlay = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = "rgba(239,68,68,0.07)";
    ctx.fillRect(0, 0, W, H);

    const bW = 210, bH = 50;
    const bX = 18, bY = 18;
    ctx.fillStyle = "rgba(10,10,12,0.9)";
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.fillRect(bX, bY, bW, bH);
    ctx.strokeRect(bX, bY, bW, bH);

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("⚠ STRUCTURAL FAILURE", bX + 12, bY + 18);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "7px monospace";
    ctx.fillText("Stress exceeded material strength limit.", bX + 12, bY + 29);
    ctx.fillText("Plastic deformation / fracture initiated.", bX + 12, bY + 40);
  };

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full select-none" />
    </div>
  );
};

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useThermalExpansionStore } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";

// ============================================================
// COLOR UTILITIES
// ============================================================

// Physically accurate thermal color map (black-body radiation inspired)
// Cold (≈77K) = deep blue, Ambient (293K) = neutral grey-blue,
// Warm (600K) = orange, Hot (1000K) = red-white
function thermalColor(T: number, alpha = 1): string {
  // Normalize 0–1 across 77K–1500K
  const t = Math.max(0, Math.min(1, (T - 77) / (1500 - 77)));
  let r = 0, g = 0, b = 0;
  if (t < 0.15) {
    // Cryogenic: dark navy → blue
    r = 0;
    g = Math.floor(t / 0.15 * 30);
    b = Math.floor(80 + t / 0.15 * 175);
  } else if (t < 0.35) {
    // Ambient: blue → grey-blue
    const x = (t - 0.15) / 0.20;
    r = Math.floor(x * 60);
    g = Math.floor(30 + x * 80);
    b = Math.floor(255 - x * 90);
  } else if (t < 0.55) {
    // Warm: grey-blue → amber
    const x = (t - 0.35) / 0.20;
    r = Math.floor(60 + x * 195);
    g = Math.floor(110 + x * 80);
    b = Math.floor(165 - x * 165);
  } else if (t < 0.75) {
    // Hot: amber → orange-red
    const x = (t - 0.55) / 0.20;
    r = 255;
    g = Math.floor(190 - x * 140);
    b = 0;
  } else {
    // Incandescent: red → white
    const x = (t - 0.75) / 0.25;
    r = 255;
    g = Math.floor(50 + x * 205);
    b = Math.floor(x * 255);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Stress color: blue (compressive) → grey (zero) → red (tension/yield)
function stressColor(stress: number, yieldStrength: number, alpha = 0.5): string {
  const ratio = Math.max(-1, Math.min(1, stress / Math.max(yieldStrength, 1)));
  if (ratio < 0) {
    // Compressive → blue gradient
    const x = -ratio;
    return `rgba(${Math.floor(20 + x * 20)}, ${Math.floor(60 + x * 30)}, ${Math.floor(150 + x * 105)}, ${alpha})`;
  } else {
    // Tensile → red gradient
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
    bimetallicCurvature,
    bimetallicDeflection,
    L0,
    vizSettings,
    spatialStressProfile,
    nodeDisplacementProfile,
    time,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];

  // Canvas resize observer
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

  // Main render
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

    // Subtle engineering grid
    ctx.strokeStyle = "rgba(6,182,212,0.025)";
    ctx.lineWidth = 1;
    const gs = 30;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Route to the correct drawer
    switch (objectType) {
      case "rod":        drawRod(ctx, W, H); break;
      case "bridge":     drawBridge(ctx, W, H); break;
      case "railway":    drawRailway(ctx, W, H); break;
      case "bimetallic": drawBimetallic(ctx, W, H); break;
      case "plate":      drawPlate(ctx, W, H); break;
      case "ring":       drawRing(ctx, W, H); break;
      default:           drawRod(ctx, W, H);
    }

    // Atomic lattice overlay (bottom-right)
    if (vizSettings.showAtomicLattice) {
      drawAtomicLattice(ctx, W, H);
    }

    // Failure overlay
    if (isFailed) drawFailureOverlay(ctx, W, H);

    ctx.restore();
  }, [
    avgTemperature, thermalProfile, materialId, objectType, constraint, gapSize,
    realDeltaL, stressAtConstraint, isYielding, isFailed, crackLocations,
    willBuckle, bimetallicCurvature, bimetallicDeflection,
    vizSettings, spatialStressProfile, nodeDisplacementProfile, time
  ]);

  // ── DRAW: ROD ──────────────────────────────────────────────
  // Section-by-section: each node is positioned by its real cumulative
  // thermal displacement u(x), so heat-front expansion is physically correct.
  const drawRod = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const centerY = H * 0.36;
    const rodH = Math.min(48, H * 0.1);
    const rodX = W * 0.15;
    const baseW = W * 0.50;
    const rodY = centerY - rodH / 2;

    // Pixels-per-meter conversion for visual displacement
    const ppm = baseW / L0;
    const N = thermalProfile.length;

    // Physical node positions: u[i] is real cumulative displacement (m)
    // Multiplied by mag and ppm for screen pixels
    const nodeX: number[] = nodeDisplacementProfile.map((u, i) =>
      rodX + (i / (N - 1)) * baseW + u * ppm * mag
    );

    const rodLeft = nodeX[0];
    const rodRight = Math.max(nodeX[N - 1], rodLeft + 4);
    const visualW = rodRight - rodLeft;

    // ── High-temperature glow ───────────────────────────────
    if (avgTemperature > 700) {
      const glowIntensity = Math.min(1, (avgTemperature - 700) / 800);
      ctx.save();
      ctx.shadowColor = thermalColor(avgTemperature, 1);
      ctx.shadowBlur = 18 + glowIntensity * 40;
      ctx.fillStyle = thermalColor(avgTemperature, 0.12 * glowIntensity);
      ctx.fillRect(rodLeft - 4, rodY - 6, visualW + 8, rodH + 12);
      ctx.restore();
    }

    // ── Cryogenic frost ─────────────────────────────────────
    if (avgTemperature < 200) {
      const frostAlpha = Math.min(0.35, (200 - avgTemperature) / 200 * 0.35);
      ctx.fillStyle = `rgba(147, 210, 255, ${frostAlpha})`;
      ctx.fillRect(rodLeft, rodY - 2, visualW, rodH + 4);
    }

    // ── Draw each element segment using physical node positions ──
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

    // Base fill if gradient is off
    if (!vizSettings.showThermalGradient) {
      ctx.fillStyle = "#222228";
      ctx.fillRect(rodLeft, rodY, visualW, rodH);
    }

    // ── Incandescent white-core at extreme temperatures ─────
    if (avgTemperature > 1200) {
      const whiteAlpha = Math.min(0.5, (avgTemperature - 1200) / 1000);
      const ig = ctx.createLinearGradient(rodLeft, rodY, rodLeft, rodY + rodH);
      ig.addColorStop(0, `rgba(255,255,220,${whiteAlpha * 0.3})`);
      ig.addColorStop(0.5, `rgba(255,255,255,${whiteAlpha})`);
      ig.addColorStop(1, `rgba(255,255,220,${whiteAlpha * 0.3})`);
      ctx.fillStyle = ig;
      ctx.fillRect(rodLeft, rodY, visualW, rodH);
    }

    // Rod border
    ctx.strokeStyle = isFailed ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = isFailed ? 2.5 : 1.5;
    ctx.strokeRect(rodLeft, rodY, visualW, rodH);

    // Constraint anchors
    drawRodAnchors(ctx, rodLeft, rodY, visualW, rodH, baseW, W, H);

    // Cracks
    if (isFailed && crackLocations.length > 0) {
      drawCracks(ctx, rodLeft, rodY, visualW, rodH);
    }

    // Dimension arrows (expansion or contraction)
    drawDimensionArrows(ctx, rodLeft, rodY, baseW, visualW, rodH, W);

    // Heat front indicator
    if (vizSettings.showHeatFront && constraint !== "fixed") {
      drawHeatFront(ctx, rodLeft, rodY, visualW, rodH);
    }

    // Visual magnification label
    if (mag > 1) {
      ctx.fillStyle = "rgba(255,180,0,0.45)";
      ctx.font = "bold 7.5px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`×${mag} visual magnification  real ΔL = ${(realDeltaL * 1000).toFixed(4)} mm`, W - 8, H - 8);
    }
  };

  // ── DRAW: BRIDGE ───────────────────────────────────────────
  const drawBridge = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const visualDeltaL_frac = (realDeltaL * mag) / L0;
    const deckH = 20;
    const deckY = H * 0.36;
    const deckX = W * 0.1;
    const baseW = W * 0.78;
    const deckW = baseW * (1 + visualDeltaL_frac);
    const N = thermalProfile.length;

    // Pillars
    const pillarH = 55;
    ctx.fillStyle = "#27272a";
    ctx.fillRect(deckX - 12, deckY + deckH, 24, pillarH);

    // Roller support on right
    const rightPillarX = deckX + baseW;
    ctx.fillStyle = "#27272a";
    ctx.fillRect(rightPillarX - 12, deckY + deckH, 24, pillarH);

    // Roller wheels (symbolize expansion joint)
    ctx.fillStyle = "#52525b";
    [-8, 0, 8].forEach(ox => {
      ctx.beginPath();
      ctx.arc(rightPillarX + ox, deckY + deckH + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gap indicator
    const gapPxSize = Math.max(6, gapSize * 2000);
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

    // Bridge deck with thermal gradient
    for (let i = 0; i < N - 1; i++) {
      const x0 = deckX + (i / (N - 1)) * deckW;
      const x1 = deckX + ((i + 1) / (N - 1)) * deckW;
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
    ctx.strokeRect(deckX, deckY, deckW, deckH);

    // Expansion exceeded gap
    if (deckW > baseW + gapPxSize) {
      ctx.fillStyle = "rgba(239,68,68,0.2)";
      ctx.fillRect(deckX + baseW + gapPxSize, deckY - 5, deckW - (baseW + gapPxSize), deckH + 10);
    }
  };

  // ── DRAW: RAILWAY ──────────────────────────────────────────
  const drawRailway = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const railY = H * 0.36;
    const railX = W * 0.07;
    const railLen = W * 0.86;
    const trackSep = 22;

    // Physically driven buckle: proportional to excess thermal strain beyond P_cr
    // Exaggerated for visibility but driven by real ΔL/L0 ratio
    const thermalStrain = Math.abs(realDeltaL / Math.max(L0, 0.001));
    const buckleAmp = willBuckle
      ? Math.min(55, 30 * Math.min(1, thermalStrain * vizSettings.magnification) * vizSettings.deformationExaggeration + 8)
      : 0;

    // Sleepers
    ctx.fillStyle = "#3f3f46";
    const sleeperCount = 22;
    for (let i = 0; i <= sleeperCount; i++) {
      const sx = railX + (i / sleeperCount) * railLen;
      const buckle = getBuckleY(sx, railX, railLen, buckleAmp);
      ctx.fillRect(sx - 4, railY - 12 + buckle, 8, trackSep + 22);
    }

    // Thermal gradient on rails
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

    // Buckling label
    if (willBuckle) {
      ctx.fillStyle = "rgba(239,68,68,0.9)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("EULER BUCKLING INSTABILITY", W / 2, railY - 20);
    }
  };

  // Sine buckle profile
  const getBuckleY = (x: number, railX: number, railLen: number, amp: number): number => {
    if (amp === 0) return 0;
    const rel = (x - railX) / railLen;
    if (rel > 0.15 && rel < 0.85) {
      return amp * Math.sin((rel - 0.15) * Math.PI / 0.7);
    }
    return 0;
  };

  // ── DRAW: BIMETALLIC ───────────────────────────────────────
  const drawBimetallic = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mat1 = MATERIAL_DB[bimetallicMat1];
    const mat2 = MATERIAL_DB[bimetallicMat2];
    if (!mat1 || !mat2) return;

    const stripX = W * 0.12;
    const stripLen = W * 0.65;
    const layerH = 14;
    const anchorY = H * 0.38;
    const steps = 80;

    const κ = bimetallicCurvature * 0.5 * vizSettings.deformationExaggeration;

    // Draw two layers
    [[mat1, bimetallicMat1, -layerH / 2], [mat2, bimetallicMat2, layerH / 2]].forEach(
      ([m, id, yOff]: any, layerIdx) => {
        const color = MATERIAL_DB[id as string]?.color ?? "#888";
        ctx.beginPath();
        ctx.lineWidth = layerH;
        ctx.strokeStyle = color;

        for (let i = 0; i <= steps; i++) {
          const rel = i / steps;
          const s = rel * stripLen;
          const x = stripX + s * Math.cos(0);
          // y offset from curvature: y = κ s² / 2  (arc approximation)
          const y = anchorY + (yOff as number) + κ * s * s * 0.5;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Thermal glow
        if (vizSettings.showThermalGradient) {
          ctx.save();
          ctx.shadowColor = thermalColor(avgTemperature, 0.6);
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = thermalColor(avgTemperature, 0.5);
          for (let i = 0; i <= steps; i++) {
            const rel = i / steps;
            const s = rel * stripLen;
            const x = stripX + s;
            const y = anchorY + (yOff as number) + κ * s * s * 0.5;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    );

    // Fixed anchor
    ctx.fillStyle = "#27272a";
    ctx.fillRect(stripX - 18, anchorY - layerH - 4, 18, layerH * 2 + 8);

    // Deflection label
    const tipY = anchorY + κ * stripLen * stripLen * 0.5;
    const deflMM = Math.abs(bimetallicDeflection * 1000);
    ctx.fillStyle = "rgba(6,182,212,0.8)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`δ = ${deflMM.toFixed(2)} mm`, stripX + stripLen + 10, tipY + 3);

    // Curvature radius label
    const radiusMm = bimetallicCurvature !== 0 ? (1 / Math.abs(bimetallicCurvature) * 1000).toFixed(0) : "∞";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "7px monospace";
    ctx.fillText(`R = ${radiusMm} mm`, stripX + stripLen + 10, tipY + 15);

    // Material labels
    ctx.textAlign = "center";
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = MATERIAL_DB[bimetallicMat1]?.color ?? "#fff";
    ctx.fillText(mat1.name.split(" ")[0], stripX + 40, anchorY - layerH - 2);
    ctx.fillStyle = MATERIAL_DB[bimetallicMat2]?.color ?? "#fff";
    ctx.fillText(mat2.name.split(" ")[0], stripX + 40, anchorY + layerH + 10);
  };

  // ── DRAW: PLATE ────────────────────────────────────────────
  const drawPlate = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const frac = (realDeltaL * mag) / L0;
    const baseW = W * 0.44;
    const baseHt = H * 0.42;
    const pW = baseW * (1 + frac);
    const pH = baseHt * (1 + frac);
    const px = (W - pW) / 2 - 20;
    const py = (H - pH) / 2;

    // Thermal gradient fill
    const grad = ctx.createRadialGradient(px + pW / 2, py + pH / 2, 0, px + pW / 2, py + pH / 2, Math.max(pW, pH) / 2);
    grad.addColorStop(0, thermalColor(avgTemperature, 0.9));
    grad.addColorStop(1, thermalColor(avgTemperature * 0.6 + 293.15 * 0.4, 0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, pW, pH);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(px + (i / 6) * pW, py); ctx.lineTo(px + (i / 6) * pW, py + pH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, py + (i / 6) * pH); ctx.lineTo(px + pW, py + (i / 6) * pH); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, pW, pH);

    // Area label
    const A0 = (L0 * 1) ** 2;
    const A = PhysicsEngine.volumetricExpansion(mat, avgTemperature, A0);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`A = ${A.toFixed(2)} m²  (β ΔT = ${(2 * mat.alpha0 * (avgTemperature - 293.15) * 100).toFixed(4)}%)`, W / 2 - 20, py + pH + 18);
  };

  // ── DRAW: RING ─────────────────────────────────────────────
  const drawRing = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const mag = vizSettings.magnification;
    const frac = (realDeltaL * mag) / L0;
    const cx = W * 0.4, cy = H * 0.5;
    const rOuter0 = H * 0.27;
    const rInner0 = H * 0.13;
    const rOuter = rOuter0 * (1 + frac);
    const rInner = rInner0 * (1 + frac); // Hole also expands — counterintuitive!

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

    // Note: hole expands!
    ctx.fillStyle = "rgba(6,182,212,0.6)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Hole also expands (r_inner = r₀(1+αΔT))", cx, cy + rOuter + 16);
  };

  // ── DRAW: ANCHORS ──────────────────────────────────────────
  const drawRodAnchors = (
    ctx: CanvasRenderingContext2D,
    rx: number, ry: number, rw: number, rh: number,
    baseW: number, W: number, H: number
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

    // Always draw left anchor
    hashPattern(rx - 16);

    if (constraint === "fixed") {
      hashPattern(rx + rw);
    } else if (constraint === "partial") {
      // Draw gap and wall
      const gapPx = Math.max(8, gapSize * 1500);
      const wallX = rx + baseW + gapPx;
      ctx.strokeStyle = "rgba(6,182,212,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry - 8, baseW, rh + 16);
      ctx.setLineDash([]);
      hashPattern(wallX);
      // Gap label
      ctx.fillStyle = "rgba(6,182,212,0.55)";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${(gapSize * 1000).toFixed(1)} mm`, wallX - gapPx / 2, ry - 16);
    } else if (constraint === "spring") {
      // Spring symbol
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
    rodX: number, rodY: number, baseW: number, visualW: number, rodH: number,
    W: number
  ) => {
    if (Math.abs(realDeltaL) < 1e-12) return;
    const arrowY = rodY + rodH + 22;
    const mag = vizSettings.magnification;

    // Draw original length bracket
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

    // Original length arrow
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
      // ── Expansion arrow →
      ctx.strokeStyle = "rgba(6,182,212,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rodX + baseW, arrowY + 12);
      ctx.lineTo(rodX + visualW, arrowY + 12);
      ctx.stroke();
      ctx.fillStyle = "rgba(6,182,212,0.85)";
      ctx.font = "bold 7.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `+ΔL = ${mmStr}  ×${mag} mag`,
        rodX + baseW + (visualW - baseW) / 2,
        arrowY + 24
      );
    } else if (realDeltaL < 0 && visualW < baseW) {
      // ── Contraction arrow ←
      ctx.strokeStyle = "rgba(96,165,250,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rodX + visualW, arrowY + 12);
      ctx.lineTo(rodX + baseW, arrowY + 12);
      ctx.stroke();
      // Arrowhead pointing left
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
      ctx.fillText(
        `← contraction  −ΔL = ${mmStr}  ×${mag} mag`,
        rodX + baseW / 2,
        arrowY + 24
      );
    }
  };

  // ── DRAW: HEAT FRONT ───────────────────────────────────────
  const drawHeatFront = (
    ctx: CanvasRenderingContext2D,
    rodX: number, rodY: number, rodW: number, rodH: number
  ) => {
    // Find transition region between hot and cold
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

  // ── DRAW: ATOMIC LATTICE ───────────────────────────────────
  // Physically correct: amplitude ∝ sqrt(T) from equipartition theorem.
  // Anharmonic asymmetry: atoms spend more time displaced outward at high T.
  const drawAtomicLattice = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const cx = W - 75;
    const cy = H - 75;
    const radius = 65;

    // Background circle — glow border tied to temperature
    ctx.fillStyle = "#0c0c10";
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();

    // High-temp glow on border
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

    // ── Equipartition-based vibration amplitude ────────────
    // From U = ½kA² = ½k_BT → A = sqrt(k_BT / k_bond)
    // k_bond scales with Young's modulus (stiffer material = smaller vibration)
    // We use a dimensionless version scaled to pixels:
    //   ampPx ∝ sqrt(T / E) — physically correct scaling
    const T_norm = Math.max(1, avgTemperature) / 293.15;  // normalized to ambient
    const E_norm = Math.max(1e9, mat.youngsModulus) / 200e9; // normalized to steel
    // sqrt(T) from equipartition, divided by sqrt(E) for bond stiffness
    const ampPx = Math.min(7, Math.max(0.3, 2.5 * Math.sqrt(T_norm / E_norm)));

    // Anharmonic mean position shift (lattice expansion) — bounded
    const rawShift = PhysicsEngine.anharmonicShift(avgTemperature, mat.alpha0) * 3000;
    const shift = Math.min(8, Math.max(-4, rawShift)); // clamp to avoid overflow
    const spacing = Math.max(14, Math.min(30, 22 + shift));

    const cols = 5, rows = 4;
    const startX = cx - (cols - 1) * spacing / 2;
    const startY = cy - (rows - 1) * spacing / 2;

    // Phase for time-based vibration — faster at higher T
    const vibFreq = 6 + Math.min(12, (avgTemperature - 100) / 100); // 6–18 Hz equivalent
    const phase = time * vibFreq;

    // Draw interatomic bonds first
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    const atomPos: { x: number; y: number }[][] = [];
    for (let r = 0; r < rows; r++) {
      atomPos[r] = [];
      for (let c = 0; c < cols; c++) {
        const phaseShift = r * 1.9 + c * 2.7;
        // Anharmonic: atom displacement has a positive bias (asymmetric potential)
        const dx = ampPx * Math.sin(phase + phaseShift);
        // Second harmonic adds anharmonic asymmetry (spend more time at r > r₀)
        const asymmetry = ampPx * 0.28 * Math.sin(2 * (phase + phaseShift));
        const dy = ampPx * Math.cos(phase * 1.1 + phaseShift);
        atomPos[r][c] = {
          x: startX + c * spacing + dx + asymmetry + shift * 0.15 * c,
          y: startY + r * spacing + dy
        };
      }
    }

    // Bonds
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

    // Atoms with vibrational envelope ellipses
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = atomPos[r][c];

        // Vibration envelope — wider on the positive (anharmonic) side
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = thermalColor(avgTemperature, 1);
        ctx.beginPath();
        ctx.ellipse(pos.x + ampPx * 0.15, pos.y, ampPx * 1.5, ampPx * 1.0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Core atom sphere — glow at high temperature
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

    // Label
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(cx - 44, cy + radius - 16, 88, 14);
    ctx.fillStyle = thermalColor(avgTemperature, 0.9);
    ctx.font = "bold 6.5px monospace";
    ctx.textAlign = "center";
    // ampPx represents relative amplitude — show it normalized to Å scale
    const ampAngstrom = ampPx * 0.04; // rough Å scale for display
    ctx.fillText(`LATTICE  A ≈ ${ampAngstrom.toFixed(2)} Å  (∝ √T)`, cx, cy + radius - 5);

    // Physics note
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "5.5px monospace";
    const noteText = avgTemperature < 150 ? "near 0K: quantum zero-point motion" : "anharmonic: ⟨r⟩ > r₀ as T↑";
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

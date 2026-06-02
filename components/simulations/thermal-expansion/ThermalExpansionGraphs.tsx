"use client";

import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { useThermalExpansionStore, HistoryPoint } from "@/store/thermalExpansionStore";
import { MATERIAL_DB, PhysicsEngine } from "@/lib/physics/thermalExpansion";
import { BarChart, ChevronDown, Download, Grid3X3, Eye } from "lucide-react";

// ============================================================
// Experiment-linked graph engine
// Each experiment mode → specific physically meaningful graph
// ============================================================

type PlotType =
  | "length_vs_temp"
  | "stress_vs_temp"
  | "spatial_temp"
  | "buckling_load"
  | "curvature_vs_temp"
  | "damage_vs_cycle"
  | "shock_gradient"
  | "multi_material"
  | "energy_conservation";

interface PlotConfig {
  title: string;
  xLabel: string;
  yLabel: string;
  color: string;
}

const PLOT_CONFIGS: Record<PlotType, PlotConfig> = {
  length_vs_temp:    { title: "Length vs Temperature",          xLabel: "T (K)",     yLabel: "L (m)",         color: "#06b6d4" },
  stress_vs_temp:    { title: "Thermal Stress vs Temperature",  xLabel: "T (K)",     yLabel: "σ (MPa)",       color: "#f97316" },
  spatial_temp:      { title: "Spatial Temperature Profile",    xLabel: "x/L₀",      yLabel: "T (K)",         color: "#eab308" },
  buckling_load:     { title: "Buckling Load vs Temperature",   xLabel: "T (K)",     yLabel: "Load (kN)",     color: "#ef4444" },
  curvature_vs_temp: { title: "Curvature vs Temperature",       xLabel: "T (K)",     yLabel: "κ (m⁻¹)",       color: "#a855f7" },
  damage_vs_cycle:   { title: "Fatigue Damage vs Cycle Count",  xLabel: "Cycles",    yLabel: "Damage D",      color: "#f43f5e" },
  shock_gradient:    { title: "Spatial Temperature (Shock)",    xLabel: "x/L₀",      yLabel: "T (K)",         color: "#fb923c" },
  multi_material:    { title: "Multi-Material Expansion",       xLabel: "T (K)",     yLabel: "ε_th (%)",      color: "#ffffff" },
  energy_conservation: { title: "Thermodynamic Energy Balance", xLabel: "Time (s)", yLabel: "Energy (J)",      color: "#10b981" },
};

// Default graph per experiment mode
const DEFAULT_PLOT: Record<string, PlotType> = {
  free_expansion:   "length_vs_temp",
  fixed_constraint: "stress_vs_temp",
  bridge_gap:       "stress_vs_temp",
  railway_buckling: "buckling_load",
  bimetallic:       "curvature_vs_temp",
  thermal_shock:    "shock_gradient",
  cryogenic:        "stress_vs_temp",
  fatigue:          "damage_vs_cycle",
  spacecraft:       "curvature_vs_temp",
  precision:        "length_vs_temp",
};

export const ThermalExpansionGraphs: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePlot, setActivePlot] = useState<PlotType>("length_vs_temp");
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const {
    history,
    materialId,
    bimetallicMat1,
    bimetallicMat2,
    L0,
    crossSectionalArea,
    diameter,
    experimentMode,
    constraint,
    graphSettings,
    thermalProfile,
    bucklingCriticalLoad,
    avgTemperature,
  } = useThermalExpansionStore();

  const mat = MATERIAL_DB[materialId];

  // Auto-switch plot when experiment mode changes
  useEffect(() => {
    setActivePlot(DEFAULT_PLOT[experimentMode] ?? "length_vs_temp");
  }, [experimentMode]);

  // Canvas resize
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
  }, [activePlot]);

  // Main drawing
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

    const ml = 52, mr = 20, mt = 28, mb = 40;
    const gW = W - ml - mr;
    const gH = H - mt - mb;

    // Background
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(ml, mt, gW, gH);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { const x = ml + (i / 8) * gW; ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, mt + gH); ctx.stroke(); }
    for (let i = 0; i <= 6; i++) { const y = mt + (i / 6) * gH; ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml + gW, y); ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(ml, mt, gW, gH);

    // Route to correct drawing function
    switch (activePlot) {
      case "length_vs_temp":    drawLengthVsTemp(ctx, ml, mt, gW, gH, W, H); break;
      case "stress_vs_temp":    drawStressVsTemp(ctx, ml, mt, gW, gH, W, H); break;
      case "spatial_temp":      drawSpatialTemp(ctx, ml, mt, gW, gH, W, H); break;
      case "buckling_load":     drawBucklingLoad(ctx, ml, mt, gW, gH, W, H); break;
      case "curvature_vs_temp": drawCurvatureVsTemp(ctx, ml, mt, gW, gH, W, H); break;
      case "damage_vs_cycle":   drawDamageVsCycle(ctx, ml, mt, gW, gH, W, H); break;
      case "shock_gradient":    drawSpatialTemp(ctx, ml, mt, gW, gH, W, H); break;
      case "multi_material":    drawMultiMaterial(ctx, ml, mt, gW, gH, W, H); break;
      case "energy_conservation": drawEnergyConservation(ctx, ml, mt, gW, gH, W, H); break;
    }

    ctx.restore();
  }, [history, activePlot, materialId, thermalProfile, bucklingCriticalLoad, hoverPos]);

  // ── PLOT: Length vs Temperature ───────────────────────────────
  const drawLengthVsTemp = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    if (!mat || history.length < 2) { drawNoData(ctx, ml, mt, gW, gH); return; }

    const allT = history.map(p => p.avgTemp);
    // Show ΔL in mm for readability (real values are micrometers to millimeters)
    const allDL = history.map(p => p.deltaL * 1000); // convert m -> mm
    const xMin = Math.min(...allT) - 5;
    const xMax = Math.max(...allT) + 5;
    // Guard against degenerate scale (all-same values)
    const rawMin = Math.min(...allDL);
    const rawMax = Math.max(...allDL);
    const yRange = Math.max(0.0001, rawMax - rawMin); // at least 0.0001 mm range
    const yMin = rawMin - yRange * 0.15;
    const yMax = rawMax + yRange * 0.15;

    const toX = (t: number) => ml + ((t - xMin) / (xMax - xMin)) * gW;
    const toY = (dl: number) => mt + gH - ((dl - yMin) / (yMax - yMin)) * gH;

    // Zero line (ΔL = 0)
    const zeroY = toY(0);
    if (zeroY >= mt && zeroY <= mt + gH) {
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(ml, zeroY); ctx.lineTo(ml + gW, zeroY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "7px monospace";
      ctx.textAlign = "left";
      ctx.fillText("ΔL = 0", ml + 3, zeroY - 3);
    }

    // Ideal theoretical line (ΔL = ∫α(T) dT · L₀)
    if (graphSettings.overlayIdeal) {
      ctx.strokeStyle = "rgba(16,185,129,0.3)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const T = xMin + (i / 60) * (xMax - xMin);
        const dL_mm = PhysicsEngine.deltaL(mat, L0, T) * 1000;
        const px = toX(T), py = toY(dL_mm);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Actual data
    ctx.beginPath();
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    history.forEach((p, i) => {
      const px = toX(p.avgTemp), py = toY(p.deltaL * 1000);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Live dot + readout
    const last = history.at(-1)!;
    drawLiveDot(ctx, toX(last.avgTemp), toY(last.deltaL * 1000), "#06b6d4");

    // Live formula readout inside graph
    const alpha_live = PhysicsEngine.alpha(mat, last.avgTemp);
    const formula_dL = alpha_live * (last.avgTemp - PhysicsEngine.T_REF) * L0 * 1000;
    ctx.fillStyle = "rgba(6,182,212,0.7)";
    ctx.font = "7px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`α(T)·L₀·ΔT = ${formula_dL >= 0 ? "+" : ""}${formula_dL.toFixed(3)} mm`, ml + 4, mt + 10);

    drawAxes(ctx, ml, mt, gW, gH, W, H, xMin, xMax, yMin, yMax,
      "Temperature T (K)", "ΔL (mm)", 4, v => v.toFixed(3));
  };

  // ── PLOT: Stress vs Temperature ────────────────────────────
  const drawStressVsTemp = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    if (!mat || history.length < 2) { drawNoData(ctx, ml, mt, gW, gH); return; }

    const allT = history.map(p => p.avgTemp);
    const allS = history.map(p => p.stress / 1e6);
    const xMin = Math.min(...allT) - 5;
    const xMax = Math.max(...allT) + 5;
    const yMax = Math.max(...allS, mat.yieldStrength / 1e6 * 1.2, 10);
    const yMin = Math.min(...allS, 0, -mat.yieldStrength / 1e6 * 1.2);

    const toX = (t: number) => ml + ((t - xMin) / (xMax - xMin)) * gW;
    const toY = (s: number) => mt + gH - ((s - yMin) / (yMax - yMin)) * gH;

    // Yield strength line
    if (graphSettings.showYieldLine) {
      const σ_y = mat.yieldStrength / 1e6;
      ctx.strokeStyle = "rgba(239,68,68,0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      // Positive yield
      const yY = toY(σ_y);
      ctx.beginPath(); ctx.moveTo(ml, yY); ctx.lineTo(ml + gW, yY); ctx.stroke();
      // Negative yield
      const yYn = toY(-σ_y);
      ctx.beginPath(); ctx.moveTo(ml, yYn); ctx.lineTo(ml + gW, yYn); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(239,68,68,0.55)";
      ctx.font = "7px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`+σ_y = ${σ_y.toFixed(0)} MPa`, ml + gW - 4, yY - 4);
      ctx.fillText(`−σ_y = ${σ_y.toFixed(0)} MPa`, ml + gW - 4, yYn + 9);
    }

    // Zero stress line
    const zeroY = toY(0);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ml, zeroY); ctx.lineTo(ml + gW, zeroY); ctx.stroke();

    // Theoretical line σ = -EαΔT
    if (graphSettings.overlayIdeal && constraint === "fixed") {
      ctx.strokeStyle = "rgba(16,185,129,0.3)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const T = xMin + (i / 60) * (xMax - xMin);
        if (T > mat.meltingPoint) break;
        const E = PhysicsEngine.youngsModulus(mat, T);
        const σ = -E * mat.alpha0 * (T - PhysicsEngine.T_REF) / 1e6;
        const px = toX(T), py = toY(σ);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Actual data
    ctx.beginPath();
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    history.forEach((p, i) => {
      const px = toX(p.avgTemp), py = toY(p.stress / 1e6);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    drawLiveDot(ctx, toX(history.at(-1)!.avgTemp), toY(history.at(-1)!.stress / 1e6), "#f97316");

    drawAxes(ctx, ml, mt, gW, gH, W, H, xMin, xMax, yMin, yMax,
      "Temperature T (K)", "Thermal Stress σ (MPa)", 4, v => v.toFixed(0));
  };

  // ── PLOT: Spatial Temperature Profile ───────────────────────
  const drawSpatialTemp = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    const N = thermalProfile.length;
    const allT = thermalProfile;
    const rawMin = Math.min(...allT);
    const rawMax = Math.max(...allT);
    const yRange = Math.max(1, rawMax - rawMin); // at least 1 K range
    const yMin = rawMin - yRange * 0.08;
    const yMax = rawMax + yRange * 0.08 + 20;

    const toX = (i: number) => ml + (i / (N - 1)) * gW;
    const toY = (T: number) => mt + gH - ((T - yMin) / (yMax - yMin)) * gH;

    // Filled area with temperature-color gradient (left=hot, right=cold or uniform)
    ctx.beginPath();
    ctx.moveTo(toX(0), mt + gH);
    thermalProfile.forEach((T, i) => ctx.lineTo(toX(i), toY(T)));
    ctx.lineTo(toX(N - 1), mt + gH);
    ctx.closePath();
    // Use a horizontal gradient that maps thermalColor
    const grad = ctx.createLinearGradient(ml, 0, ml + gW, 0);
    grad.addColorStop(0, `rgba(251,146,60,0.35)`);
    grad.addColorStop(0.5, `rgba(234,179,8,0.2)`);
    grad.addColorStop(1, `rgba(6,182,212,0.1)`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Curve colored by temperature
    for (let i = 0; i < N - 1; i++) {
      const T_seg = (thermalProfile[i] + thermalProfile[i + 1]) / 2;
      ctx.beginPath();
      ctx.strokeStyle = (() => {
        // Map temperature to a readable color
        const t = Math.max(0, Math.min(1, (T_seg - 77) / (1500 - 77)));
        if (t < 0.35) return `rgba(6,182,212,${0.7 + t})`;
        if (t < 0.6) return `rgba(234,179,8,0.9)`;
        return `rgba(249,115,22,0.9)`;
      })();
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.moveTo(toX(i), toY(thermalProfile[i]));
      ctx.lineTo(toX(i + 1), toY(thermalProfile[i + 1]));
      ctx.stroke();
    }

    // Ambient reference line
    const ambY = toY(293.15);
    if (ambY >= mt && ambY <= mt + gH) {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ml, ambY); ctx.lineTo(ml + gW, ambY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "7px monospace";
      ctx.textAlign = "left";
      ctx.fillText("T_ambient = 293 K", ml + 4, ambY - 4);
    }

    // Target temperature line
    const tgt = thermalProfile[0];
    const tgtY = toY(tgt);
    if (tgtY >= mt && tgtY <= mt + gH) {
      ctx.strokeStyle = "rgba(249,115,22,0.4)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ml, tgtY); ctx.lineTo(ml + gW, tgtY); ctx.stroke();
      ctx.setLineDash([]);
    }

    drawAxes(ctx, ml, mt, gW, gH, W, H, 0, 1, yMin, yMax,
      "Position x/L₀", "Temperature T (K)", 4, v => v.toFixed(0),
      (i, n) => (i / n).toFixed(1));
  };

  // ── PLOT: Buckling Load vs Temperature ─────────────────────
  const drawBucklingLoad = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    if (!mat) { drawNoData(ctx, ml, mt, gW, gH); return; }

    const T_min = 200, T_max = Math.min(mat.meltingPoint, 1200);
    const I = (Math.PI / 64) * Math.pow(0.05, 4);
    const loads: { T: number; Pcr: number; Pth: number }[] = [];

    for (let i = 0; i <= 100; i++) {
      const T = T_min + (i / 100) * (T_max - T_min);
      const E = PhysicsEngine.youngsModulus(mat, T);
      const Pcr = (Math.PI * Math.PI * E * I) / (L0 * L0);
      const Pth = E * mat.alpha0 * (T - PhysicsEngine.T_REF) * crossSectionalArea;
      loads.push({ T, Pcr, Pth });
    }

    const maxLoad = Math.max(...loads.map(l => Math.max(l.Pcr, l.Pth)));
    const yMax = maxLoad * 1.1 / 1e3;
    const yMin = 0;

    const toX = (T: number) => ml + ((T - T_min) / (T_max - T_min)) * gW;
    const toY = (P: number) => mt + gH - ((P / 1e3 - yMin) / (yMax - yMin)) * gH;

    // P_cr line (decreases with T as E decreases)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(6,182,212,0.8)";
    ctx.lineWidth = 2;
    loads.forEach((l, i) => {
      if (i === 0) ctx.moveTo(toX(l.T), toY(l.Pcr)); else ctx.lineTo(toX(l.T), toY(l.Pcr));
    });
    ctx.stroke();
    ctx.fillStyle = "rgba(6,182,212,0.6)";
    ctx.font = "7px monospace";
    ctx.textAlign = "left";
    ctx.fillText("P_cr (Euler)", ml + 4, toY(loads[0].Pcr) - 5);

    // P_thermal line (increases with T)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(239,68,68,0.8)";
    ctx.lineWidth = 2;
    loads.forEach((l, i) => {
      if (i === 0) ctx.moveTo(toX(l.T), toY(l.Pth)); else ctx.lineTo(toX(l.T), toY(l.Pth));
    });
    ctx.stroke();
    ctx.fillStyle = "rgba(239,68,68,0.6)";
    ctx.fillText("P_thermal", ml + 4, toY(loads[5].Pth) + 10);

    // Intersection — buckling onset
    for (let i = 1; i < loads.length; i++) {
      if (loads[i].Pth >= loads[i].Pcr) {
        const tBuckle = loads[i].T;
        const xB = toX(tBuckle);
        ctx.strokeStyle = "rgba(239,68,68,0.5)";
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xB, mt); ctx.lineTo(xB, mt + gH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(239,68,68,0.7)";
        ctx.font = "bold 7.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`T_buckle ≈ ${tBuckle.toFixed(0)} K`, xB, mt + 12);
        break;
      }
    }

    // Current state dot
    const curLoad = loads.find(l => Math.abs(l.T - avgTemperature) < 5);
    if (curLoad) {
      drawLiveDot(ctx, toX(curLoad.T), toY(curLoad.Pth), "#ef4444");
    }

    drawAxes(ctx, ml, mt, gW, gH, W, H, T_min, T_max, yMin, yMax,
      "Temperature T (K)", "Load (kN)", 4, v => v.toFixed(0));
  };

  // ── PLOT: Curvature vs Temperature ────────────────────────
  const drawCurvatureVsTemp = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    if (history.length < 2) { drawNoData(ctx, ml, mt, gW, gH); return; }

    const allT = history.map(p => p.avgTemp);
    const allK = history.map(p => p.curvature);
    const xMin = Math.min(...allT) - 5;
    const xMax = Math.max(...allT) + 5;
    const yRange = Math.max(...allK.map(Math.abs), 0.001);
    const yMin = -yRange * 1.1;
    const yMax = yRange * 1.1;

    const toX = (T: number) => ml + ((T - xMin) / (xMax - xMin)) * gW;
    const toY = (k: number) => mt + gH - ((k - yMin) / (yMax - yMin)) * gH;

    // Zero line
    const zY = toY(0);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ml, zY); ctx.lineTo(ml + gW, zY); ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    history.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(p.avgTemp), toY(p.curvature));
      else ctx.lineTo(toX(p.avgTemp), toY(p.curvature));
    });
    ctx.stroke();
    drawLiveDot(ctx, toX(history.at(-1)!.avgTemp), toY(history.at(-1)!.curvature), "#a855f7");

    drawAxes(ctx, ml, mt, gW, gH, W, H, xMin, xMax, yMin, yMax,
      "Temperature T (K)", "Curvature κ (m⁻¹)", 4, v => v.toFixed(4));
  };

  // ── PLOT: Fatigue Damage vs Cycle ─────────────────────────
  const drawDamageVsCycle = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    if (history.length < 2) { drawNoData(ctx, ml, mt, gW, gH); return; }

    const allC = history.map(p => p.cycleCount);
    const allD = history.map(p => p.damage);
    const xMin = 0;
    const xMax = Math.max(...allC, 10);
    const yMin = 0;
    const yMax = 1.05;

    const toX = (c: number) => ml + ((c - xMin) / (xMax - xMin)) * gW;
    const toY = (d: number) => mt + gH - ((d - yMin) / (yMax - yMin)) * gH;

    // Failure line at D = 1
    const failY = toY(1.0);
    ctx.strokeStyle = "rgba(239,68,68,0.5)";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ml, failY); ctx.lineTo(ml + gW, failY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(239,68,68,0.55)";
    ctx.font = "7px monospace";
    ctx.textAlign = "right";
    ctx.fillText("D = 1.0 (failure)", ml + gW - 4, failY - 4);

    ctx.beginPath();
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    history.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(p.cycleCount), toY(p.damage));
      else ctx.lineTo(toX(p.cycleCount), toY(p.damage));
    });
    ctx.stroke();
    drawLiveDot(ctx, toX(history.at(-1)!.cycleCount), toY(history.at(-1)!.damage), "#f43f5e");

    drawAxes(ctx, ml, mt, gW, gH, W, H, xMin, xMax, yMin, yMax,
      "Cycle Count N", "Damage D (0–1)", 4, v => v.toFixed(2));
  };

  // ── PLOT: Multi-Material Comparison ───────────────────────
  const drawMultiMaterial = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number, W: number, H: number) => {
    const T_min = 77, T_max = 1000;
    const yMin = -0.001, yMax = 0.018;
    const toX = (T: number) => ml + ((T - T_min) / (T_max - T_min)) * gW;
    const toY = (ε: number) => mt + gH - ((ε - yMin) / (yMax - yMin)) * gH;

    const matColors: Record<string, string> = {
      steel: "#94a3b8", aluminum: "#e2e8f0", copper: "#b45309", titanium: "#6366f1",
      invar: "#06b6d4", stainless: "#64748b", glass: "#7dd3fc", carbon_fiber: "#374151",
      silicon: "#818cf8", tungsten: "#52525b", brass: "#ca8a04", concrete: "#a8a29e"
    };

    Object.entries(MATERIAL_DB).forEach(([id, m]) => {
      if (id === "ice") return; // ice melts below range
      ctx.beginPath();
      ctx.strokeStyle = matColors[id] ?? "#ffffff";
      ctx.lineWidth = id === materialId ? 2.5 : 1;
      ctx.setLineDash(id === materialId ? [] : [3, 3]);

      for (let i = 0; i <= 80; i++) {
        const T = T_min + (i / 80) * (T_max - T_min);
        if (T > m.meltingPoint) break;
        const ε = m.alpha0 * (T - PhysicsEngine.T_REF);
        if (i === 0) ctx.moveTo(toX(T), toY(ε)); else ctx.lineTo(toX(T), toY(ε));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Legend (top right)
    let legY = mt + 5;
    ctx.font = "7px monospace";
    ctx.textAlign = "left";
    Object.entries(matColors).slice(0, 8).forEach(([id, color]) => {
      const m = MATERIAL_DB[id];
      if (!m) return;
      ctx.fillStyle = color;
      ctx.fillRect(ml + gW - 110, legY, 7, 7);
      ctx.fillStyle = id === materialId ? "#ffffff" : "rgba(255,255,255,0.4)";
      ctx.fillText(m.name.split(" ")[0].substring(0, 10), ml + gW - 100, legY + 6.5);
      legY += 11;
    });

    drawAxes(ctx, ml, mt, gW, gH, W, H, T_min, T_max, yMin, yMax,
      "Temperature T (K)", "Thermal Strain ε_th", 4, v => (v * 100).toFixed(2) + "%");
  };

  // ── PLOT: Energy Conservation ──────────────────────────────
  const drawEnergyConservation = (
    ctx: CanvasRenderingContext2D,
    ml: number, mt: number, gW: number, gH: number, W: number, H: number
  ) => {
    if (history.length < 2) { drawNoData(ctx, ml, mt, gW, gH); return; }

    const allTime = history.map(p => p.time);
    const allInternal = history.map(p => p.energy);
    const allNet = history.map(p => p.energyInput - p.energyLoss);
    const allResidual = history.map(p => p.energy - (p.energyInput - p.energyLoss));

    const xMin = Math.min(...allTime);
    const xMax = Math.max(...allTime);
    
    const minVal = Math.min(...allInternal, ...allNet, ...allResidual, 0);
    const maxVal = Math.max(...allInternal, ...allNet, ...allResidual, 10);
    const yRange = Math.max(10, maxVal - minVal);
    const yMin = minVal - yRange * 0.1;
    const yMax = maxVal + yRange * 0.1;

    const toX = (t: number) => ml + ((t - xMin) / (xMax - xMin)) * gW;
    const toY = (e: number) => mt + gH - ((e - yMin) / (yMax - yMin)) * gH;

    // 1. Net Input Energy (Q_in - Q_lost) - Blue dotted
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    history.forEach((p, i) => {
      const px = toX(p.time), py = toY(p.energyInput - p.energyLoss);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Internal Thermal Energy (E_thermal) - Green solid
    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    history.forEach((p, i) => {
      const px = toX(p.time), py = toY(p.energy);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // 3. Energy Residual - Cyan thin
    ctx.beginPath();
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1;
    history.forEach((p, i) => {
      const px = toX(p.time), py = toY(p.energy - (p.energyInput - p.energyLoss));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    const last = history.at(-1)!;
    drawLiveDot(ctx, toX(last.time), toY(last.energy), "#10b981");
    drawLiveDot(ctx, toX(last.time), toY(last.energyInput - last.energyLoss), "#3b82f6");
    drawLiveDot(ctx, toX(last.time), toY(last.energy - (last.energyInput - last.energyLoss)), "#06b6d4");

    ctx.font = "7.5px monospace";
    ctx.textAlign = "left";
    
    ctx.fillStyle = "#10b981";
    ctx.fillRect(ml + 15, mt + 12, 10, 6);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`Internal Energy E_th = ${last.energy.toFixed(0)} J`, ml + 30, mt + 17);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(ml + 15, mt + 24, 10, 6);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`Net Heat Supplied Q_net = ${(last.energyInput - last.energyLoss).toFixed(0)} J`, ml + 30, mt + 29);

    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(ml + 15, mt + 36, 10, 6);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`First Law Residual = ${(last.energy - (last.energyInput - last.energyLoss)).toExponential(1)} J`, ml + 30, mt + 41);

    drawAxes(ctx, ml, mt, gW, gH, W, H, xMin, xMax, yMin, yMax,
      "Time (s)", "Energy (J)", 4, v => v.toFixed(0));
  };

  // ── HELPERS ────────────────────────────────────────────────
  const drawLiveDot = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    if (!isFinite(x) || !isFinite(y)) return;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  };

  const drawNoData = (ctx: CanvasRenderingContext2D, ml: number, mt: number, gW: number, gH: number) => {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Adjust temperature to record data…", ml + gW / 2, mt + gH / 2);
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    ml: number, mt: number, gW: number, gH: number, W: number, H: number,
    xMin: number, xMax: number, yMin: number, yMax: number,
    xLabel: string, yLabel: string,
    ticks = 4,
    yFmt: (v: number) => string = v => v.toFixed(2),
    xFmt?: (i: number, n: number) => string
  ) => {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "7.5px monospace";
    ctx.textAlign = "center";

    for (let i = 0; i <= ticks; i++) {
      const xVal = xMin + (i / ticks) * (xMax - xMin);
      const px = ml + (i / ticks) * gW;
      const label = xFmt ? xFmt(i, ticks) : xVal.toFixed(0);
      ctx.fillText(label, px, mt + gH + 12);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, mt + gH); ctx.lineTo(px, mt + gH + 4); ctx.stroke();
    }

    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const yVal = yMin + (i / 4) * (yMax - yMin);
      const py = mt + gH - (i / 4) * gH;
      ctx.fillText(yFmt(yVal), ml - 4, py + 3);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(ml - 4, py); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "7.5px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(xLabel, ml + gW / 2, H - 5);
    ctx.save();
    ctx.translate(10, mt + gH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  };

  // Export
  const handleExportCSV = () => {
    if (history.length === 0) return;
    let csv = "Time(s),Temp(K),DeltaL(m),Stress(MPa),Strain,Energy(J),Curvature(1/m),Damage\n";
    history.forEach(p => {
      csv += `${p.time.toFixed(3)},${p.avgTemp.toFixed(2)},${p.deltaL.toFixed(6)},${(p.stress / 1e6).toFixed(4)},${p.strain.toFixed(6)},${p.energy.toFixed(2)},${p.curvature.toFixed(6)},${p.damage.toFixed(4)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `thermal_exp_${materialId}_${activePlot}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kinetiq_graph_${activePlot}.png`;
    a.click();
  };

  const cfg = PLOT_CONFIGS[activePlot];

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <BarChart className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Graph Engine</span>
        </div>
        <div className="flex gap-1.5 items-center">
          <div className="relative">
            <select
              value={activePlot}
              onChange={e => setActivePlot(e.target.value as PlotType)}
              className="bg-[#18181b] border border-white/10 rounded-lg pl-2 pr-6 py-1.5 text-[9px] font-bold text-white focus:outline-none appearance-none cursor-pointer max-w-[155px]"
            >
              <option value="length_vs_temp">Length vs Temp</option>
              <option value="stress_vs_temp">Stress vs Temp</option>
              <option value="spatial_temp">Spatial T(x) Profile</option>
              <option value="buckling_load">Buckling Load</option>
              <option value="curvature_vs_temp">Curvature vs Temp</option>
              <option value="damage_vs_cycle">Fatigue Damage</option>
              <option value="multi_material">Multi-Material ε</option>
              <option value="energy_conservation">Energy Balance</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-2 w-3 h-3 text-white/40 pointer-events-none" />
          </div>
          <button onClick={handleExportCSV} className="p-1.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg text-white/50 hover:text-white" title="Export CSV">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleExportPNG} className="p-1.5 bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg text-white/50 hover:text-white" title="Export PNG">
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative min-h-0"
        onMouseMove={(e: MouseEvent<HTMLDivElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHoverPos({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onMouseLeave={() => setHoverPos(null)}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-3 py-1.5 bg-black/30 border-t border-white/5 shrink-0 justify-between items-center text-[8.5px] font-mono text-white/30">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-cyan-400" />
          <strong className="text-white/50">{cfg.title}</strong>
        </span>
        <span>{history.length} points</span>
      </div>
    </div>
  );
};

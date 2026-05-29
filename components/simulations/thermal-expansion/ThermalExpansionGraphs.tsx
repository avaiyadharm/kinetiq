"use client";

import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { useThermalExpansionStore, HistoryPoint } from "@/store/thermalExpansionStore";
import { MATERIAL_DATABASE, MaterialData, ThermalExpansionPhysicsEngine } from "@/lib/physics/thermalExpansion";
import { BarChart, ChevronDown, Download, Grid3X3, Eye } from "lucide-react";

type PlotType = "length_temp" | "expansion_temp" | "stress_temp" | "vibe_dist" | "energy_temp" | "multi_material" | "hysteresis";

export const ThermalExpansionGraphs: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePlot, setActivePlot] = useState<PlotType>("length_temp");
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; mx: number; my: number } | null>(null);

  const { history, materialId, L0, thickness, crossSectionalArea, constraint, gapSize, graphSettings, objectType, plasticStrain, bondStiffness } = useThermalExpansionStore();
  const currentMaterial = MATERIAL_DATABASE[materialId];

  // Canvas Resizing
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
  }, [activePlot]);

  // Main drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Padding settings
    const ml = 60;
    const mr = 30;
    const mt = 35;
    const mb = 45;
    const graphW = w - ml - mr;
    const graphH = h - mt - mb;

    // Background Grid
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(ml, mt, graphW, graphH);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    
    const gridCols = 8;
    const gridRows = 6;
    for (let i = 0; i <= gridCols; i++) {
      const x = ml + (i / gridCols) * graphW;
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, mt + graphH); ctx.stroke();
    }
    for (let i = 0; i <= gridRows; i++) {
      const y = mt + (i / gridRows) * graphH;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml + graphW, y); ctx.stroke();
    }

    // Graph Area Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeRect(ml, mt, graphW, graphH);

    // Render logic per plot type
    if (activePlot === "vibe_dist") {
      drawVibeDist(ctx, ml, mt, graphW, graphH, w, h);
    } else if (activePlot === "multi_material") {
      drawMultiMaterial(ctx, ml, mt, graphW, graphH, w, h);
    } else {
      drawStandardPlot(ctx, ml, mt, graphW, graphH, w, h);
    }

  }, [history, activePlot, materialId, L0, thickness, crossSectionalArea, constraint, gapSize, graphSettings, hoverPos]);

  // Export current history as CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    let csv = "Time(s),Temperature(K),Length(m),DeltaL(m),Stress(MPa),Strain,Energy(J),Deflection(m)\n";
    history.forEach(p => {
      csv += `${p.time.toFixed(4)},${p.temp.toFixed(2)},${p.length.toFixed(6)},${p.deltaL.toFixed(6)},${p.stress.toFixed(4)},${p.strain.toFixed(6)},${p.energy.toFixed(2)},${p.deflection.toFixed(6)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kinetiq_thermal_expansion_${materialId}_${activePlot}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export graph frame as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `kinetiq_thermal_chart_${activePlot}.png`;
    link.click();
  };

  // Helper 1: Standard History Curve Drawing (Length, Expansion, Stress, Energy, Hysteresis)
  const drawStandardPlot = (
    ctx: CanvasRenderingContext2D,
    ml: number,
    mt: number,
    graphW: number,
    graphH: number,
    w: number,
    h: number
  ) => {
    if (history.length < 2) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("AWAITING EXPERIMENTAL DATA...", ml + graphW / 2, mt + graphH / 2);
      return;
    }

    // Determine Y value mapping
    const getYVal = (p: HistoryPoint) => {
      switch (activePlot) {
        case "length_temp": return p.length;
        case "expansion_temp": return p.deltaL * 1000; // in mm
        case "stress_temp": return p.stress; // in MPa
        case "energy_temp": return p.energy / 1000; // in kJ
        case "hysteresis": return objectType === "bimetallic" ? p.deflection * 1000 : p.length;
        default: return p.length;
      }
    };

    const getXVal = (p: HistoryPoint) => {
      // For hysteresis, plot against temperature. For others, can be temperature or time.
      return p.temp;
    };

    const allX = history.map(getXVal);
    const allY = history.map(getYVal);

    let xMin = Math.min(...allX);
    let xMax = Math.max(...allX);
    let yMin = Math.min(...allY);
    let yMax = Math.max(...allY);

    // Padding scales
    if (xMax - xMin < 5) { xMin -= 2.5; xMax += 2.5; }
    if (yMax - yMin < 1e-4) { yMin -= 1; yMax += 1; }
    
    // Slight margin offsets
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    xMin -= xRange * 0.05;
    xMax += xRange * 0.05;
    yMin -= yRange * 0.08;
    yMax += yRange * 0.08;

    const toX = (mx: number) => ml + ((mx - xMin) / (xMax - xMin)) * graphW;
    const toY = (my: number) => mt + graphH - ((my - yMin) / (yMax - yMin)) * graphH;

    // Draw reference ideal curve (without plastic hysteresis)
    if (graphSettings.overlayComparison && activePlot === "length_temp") {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      
      const step = (xMax - xMin) / 100;
      for (let i = 0; i <= 100; i++) {
        const temp = xMin + i * step;
        const L_ideal = ThermalExpansionPhysicsEngine.getLength(L0, currentMaterial, temp, 0);
        const pxX = toX(temp);
        const pxY = toY(L_ideal);
        if (i === 0) ctx.moveTo(pxX, pxY);
        else ctx.lineTo(pxX, pxY);
      }
      ctx.stroke();
      ctx.setLineDash([]); // clear dash
    }

    // Plot main curve
    ctx.beginPath();
    ctx.strokeStyle = getPlotColor();
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";

    history.forEach((p, idx) => {
      const pxX = toX(getXVal(p));
      const pxY = toY(getYVal(p));
      if (idx === 0) ctx.moveTo(pxX, pxY);
      else ctx.lineTo(pxX, pxY);
    });
    ctx.stroke();

    // Live dot at the end
    const lastP = history[history.length - 1];
    const dotX = toX(getXVal(lastP));
    const dotY = toY(getYVal(lastP));
    
    if (isFinite(dotX) && isFinite(dotY)) {
      ctx.save();
      ctx.shadowColor = getPlotColor();
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = getPlotColor();
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    // Axes Text Labels
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";

    // X Axis Ticks (5 divisions)
    for (let i = 0; i <= 4; i++) {
      const val = xMin + (i / 4) * (xMax - xMin);
      const px = toX(val);
      ctx.fillText(`${val.toFixed(0)} K`, px, mt + graphH + 12);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath(); ctx.moveTo(px, mt + graphH); ctx.lineTo(px, mt + graphH + 4); ctx.stroke();
    }

    // Y Axis Ticks (5 divisions)
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * (yMax - yMin);
      const py = toY(val);
      ctx.fillText(formatScientific(val), ml - 6, py + 3);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(ml - 4, py); ctx.stroke();
    }

    // Outer Axis Labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("TEMPERATURE T (Kelvin)", ml + graphW / 2, h - 8);

    ctx.save();
    ctx.translate(14, mt + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(getYAxisLabel(), 0, 0);
    ctx.restore();

    // Hover Tooltip
    if (hoverPos) {
      const hoverMX = xMin + ((hoverPos.x - ml) / graphW) * (xMax - xMin);
      
      // Find closest point in history to hover position
      let closestP = history[0];
      let minDist = Infinity;
      history.forEach(p => {
        const dist = Math.abs(getXVal(p) - hoverMX);
        if (dist < minDist) {
          minDist = dist;
          closestP = p;
        }
      });

      if (closestP) {
        const tipX = toX(getXVal(closestP));
        const tipY = toY(getYVal(closestP));

        // Draw crosshair lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(tipX, mt); ctx.lineTo(tipX, mt + graphH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ml, tipY); ctx.lineTo(ml + graphW, tipY); ctx.stroke();
        ctx.setLineDash([]);

        // Tooltip container box
        const tooltipW = 120;
        const tooltipH = 50;
        let tX = tipX + 15;
        let tY = tipY - 25;
        if (tX + tooltipW > w - 10) tX = tipX - tooltipW - 15;
        if (tY < mt + 5) tY = mt + 5;

        ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
        ctx.strokeStyle = getPlotColor();
        ctx.lineWidth = 1.5;
        ctx.fillRect(tX, tY, tooltipW, tooltipH);
        ctx.strokeRect(tX, tY, tooltipW, tooltipH);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`Temp: ${closestP.temp.toFixed(1)} K`, tX + 8, tY + 14);
        ctx.fillText(`${activePlot.replace(/_/g, " ").toUpperCase()}:`, tX + 8, tY + 26);
        ctx.fillStyle = getPlotColor();
        ctx.fillText(formatScientific(getYVal(closestP)), tX + 8, tY + 38);
      }
    }
  };

  // Helper 2: Multi-Material Comparison Curve (Static preview curves for all materials)
  const drawMultiMaterial = (
    ctx: CanvasRenderingContext2D,
    ml: number,
    mt: number,
    graphW: number,
    graphH: number,
    w: number,
    h: number
  ) => {
    const mr = 30;
    // X axis represents temperature range (100K to 1000K)
    const T_min = 100;
    const T_max = 1000;
    
    // Y axis represents Expansion strain ΔL/L₀ = α * dT (unitless / percent)
    // Steel max expansion at 1000K is ~12e-6 * 700 = 8.4e-3
    // Aluminum max expansion at 933K (melting) is ~23e-6 * 640 = 1.47e-2
    // Let's set Y bounds from -0.005 to 0.02 (or -0.5% to 2% expansion strain)
    const y_Min = -0.003;
    const y_Max = 0.016;

    const toX = (mx: number) => ml + ((mx - T_min) / (T_max - T_min)) * graphW;
    const toY = (my: number) => mt + graphH - ((my - y_Min) / (y_Max - y_Min)) * graphH;

    // Draw Curves for each material
    const matColors: Record<string, string> = {
      aluminum: "#f43f5e", // rose
      steel: "#3b82f6",    // blue
      copper: "#f97316",   // orange
      glass: "#a855f7",    // purple
      concrete: "#10b981", // green
      titanium: "#eab308", // yellow
      invar: "#06b6d4"     // cyan
    };

    Object.entries(MATERIAL_DATABASE).forEach(([id, mat]) => {
      ctx.beginPath();
      ctx.strokeStyle = matColors[id] || "#ffffff";
      ctx.lineWidth = materialId === id ? 3 : 1.2;
      ctx.setLineDash(materialId === id ? [] : [2, 2]);

      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const temp = T_min + (i / steps) * (T_max - T_min);
        // Do not draw beyond melting point
        if (temp > mat.meltingPoint) break;
        
        const dT = temp - ThermalExpansionPhysicsEngine.T_REF;
        const alpha = ThermalExpansionPhysicsEngine.getAlphaAtT(mat, temp);
        const strain = alpha * dT;
        
        const pxX = toX(temp);
        const pxY = toY(strain);
        if (i === 0) ctx.moveTo(pxX, pxY);
        else ctx.lineTo(pxX, pxY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw Axes Tick Labels
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";

    for (let i = 0; i <= 4; i++) {
      const val = T_min + (i / 4) * (T_max - T_min);
      const px = toX(val);
      ctx.fillText(`${val.toFixed(0)} K`, px, mt + graphH + 12);
    }

    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = y_Min + (i / 4) * (y_Max - y_Min);
      const py = toY(val);
      ctx.fillText(`${(val * 100).toFixed(2)}%`, ml - 6, py + 3);
    }

    // Outer Axis Labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("TEMPERATURE T (Kelvin)", ml + graphW / 2, h - 8);

    ctx.save();
    ctx.translate(14, mt + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("THERMAL STRAIN ΔL / L₀ (%)", 0, 0);
    ctx.restore();

    // Legend panel inside canvas
    ctx.fillStyle = "rgba(24, 24, 27, 0.85)";
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.fillRect(w - mr - 95, mt + 5, 90, 95);
    ctx.strokeRect(w - mr - 95, mt + 5, 90, 95);

    Object.entries(MATERIAL_DATABASE).forEach(([id, mat], idx) => {
      const legY = mt + 13 + idx * 12;
      ctx.fillStyle = matColors[id];
      ctx.fillRect(w - mr - 90, legY - 5, 6, 6);
      
      ctx.fillStyle = materialId === id ? "#ffffff" : "rgba(255,255,255,0.6)";
      ctx.font = materialId === id ? "bold 7.5px monospace" : "7px monospace";
      ctx.textAlign = "left";
      ctx.fillText(mat.name.substring(0, 12), w - mr - 80, legY);
    });
  };

  // Helper 3: Atomic vibration amplitude probability distribution histogram
  const drawVibeDist = (
    ctx: CanvasRenderingContext2D,
    ml: number,
    mt: number,
    graphW: number,
    graphH: number,
    w: number,
    h: number
  ) => {
    // P(A) = A / (sigma^2) * exp(-A^2 / (2 * sigma^2))  (Rayleigh Distribution for harmonic vibrating atoms)
    const T = useThermalExpansionStore.getState().temperature;
    
    // Thermal vibration variance: sigma = sqrt(k_B * T / bondStiffness)
    const sigma = Math.sqrt((ThermalExpansionPhysicsEngine.K_B * T * 1e20) / (bondStiffness || 1));

    const steps = 100;
    const aMax = Math.max(0.5, sigma * 4.0); // max vibration amplitude range
    
    const toX = (mx: number) => ml + (mx / aMax) * graphW;
    const toY = (my: number) => mt + graphH - (my / 2.8) * graphH; // max probability density scale

    // Plot Theoretical Rayleigh Distribution
    ctx.beginPath();
    ctx.strokeStyle = "#ec4899"; // Pink
    ctx.lineWidth = 2.5;

    for (let i = 0; i <= steps; i++) {
      const A = (i / steps) * aMax;
      let prob = 0;
      if (sigma > 0) {
        prob = (A / (sigma * sigma)) * Math.exp(-(A * A) / (2 * sigma * sigma));
      }
      
      const pxX = toX(A);
      const pxY = toY(prob);
      if (i === 0) ctx.moveTo(pxX, pxY);
      else ctx.lineTo(pxX, pxY);
    }
    ctx.stroke();

    // Draw live particle samples as dots on the baseline
    ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
    const sampleCount = 40;
    for (let i = 0; i < sampleCount; i++) {
      // Sample Rayleigh distribution using Box-Muller-like transform: A = sigma * sqrt(-2 ln U)
      const u1 = Math.max(1e-9, Math.random());
      const A_sample = sigma * Math.sqrt(-2.0 * Math.log(u1));
      
      const dotX = toX(A_sample);
      const dotY = mt + graphH - 2 - Math.random() * 8; // jitter height slightly
      if (dotX >= ml && dotX <= ml + graphW) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Axes Tick Labels
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";

    for (let i = 0; i <= 4; i++) {
      const val = (i / 4) * aMax;
      const px = toX(val);
      ctx.fillText(val.toFixed(2), px, mt + graphH + 12);
    }

    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = (i / 4) * 2.5;
      const py = toY(val);
      ctx.fillText(val.toFixed(1), ml - 6, py + 3);
    }

    // Outer Axis Labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("VIBRATIONAL AMPLITUDE A (Angstroms Å)", ml + graphW / 2, h - 8);

    ctx.save();
    ctx.translate(14, mt + graphH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("PROBABILITY DENSITY P(A)", 0, 0);
    ctx.restore();

    // Add equation annotation in corner
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "italic 8.5px serif";
    ctx.textAlign = "left";
    ctx.fillText("P(A) = [A / σ²] · exp(-A² / 2σ²)", ml + 12, mt + 18);
  };

  // Helper Utilities
  const getPlotColor = () => {
    switch (activePlot) {
      case "length_temp": return "#06b6d4"; // cyan
      case "expansion_temp": return "#eab308"; // yellow
      case "stress_temp": return "#ef4444"; // red
      case "energy_temp": return "#f97316"; // orange
      case "hysteresis": return "#10b981"; // emerald
      default: return "#ffffff";
    }
  };

  const getYAxisLabel = () => {
    switch (activePlot) {
      case "length_temp": return "TOTAL LENGTH L (meters)";
      case "expansion_temp": return "THERMAL EXPANSION ΔL (millimeters)";
      case "stress_temp": return "THERMAL STRESS σ (MPa)";
      case "energy_temp": return "THERMAL HEAT ENERGY Q (kJ)";
      case "hysteresis": return objectType === "bimetallic" ? "BIMETALLIC DEFLECTION δ (mm)" : "TOTAL LENGTH L (meters)";
      default: return "Y-AXIS";
    }
  };

  const formatScientific = (num: number): string => {
    if (Math.abs(num) < 1e-3 && num !== 0) return num.toExponential(3);
    if (num >= 10000) return num.toExponential(2);
    // Dynamic decimal points based on scale
    if (activePlot === "length_temp") return num.toFixed(4);
    if (activePlot === "expansion_temp") return num.toFixed(3);
    return num.toFixed(1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] p-5 select-none">
      
      {/* Header Selector bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 shrink-0 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <BarChart className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
            Scientific Graph Engine
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
          {/* Dropdown plot selector */}
          <div className="relative inline-block w-full sm:w-56">
            <select
              value={activePlot}
              onChange={(e) => setActivePlot(e.target.value as PlotType)}
              className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="length_temp">1. Length vs Temperature</option>
              <option value="expansion_temp">2. Expansion ΔL vs Temperature</option>
              <option value="stress_temp">3. Thermal Stress vs Temp</option>
              <option value="vibe_dist">4. Atomic Amplitude Distribution</option>
              <option value="energy_temp">5. Energy vs Temperature</option>
              <option value="multi_material">6. Multi-Material Comparison</option>
              <option value="hysteresis">7. Expansion-Contraction Hysteresis</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-white/45 pointer-events-none" />
          </div>

          {/* Export CSV / Export PNG */}
          <button
            onClick={handleExportCSV}
            className="p-2 bg-black/40 hover:bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-lg transition-all"
            title="Download CSV dataset"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPNG}
            className="p-2 bg-black/40 hover:bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-lg transition-all"
            title="Save Image Frame"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Plot Canvas */}
      <div 
        ref={containerRef} 
        className="flex-1 relative min-h-[220px]"
        onMouseMove={(e: MouseEvent<HTMLDivElement>) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            mx: e.clientX,
            my: e.clientY
          });
        }}
        onMouseLeave={() => setHoverPos(null)}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
      </div>

      {/* Real-time Legend bar */}
      <div className="flex gap-4 mt-3 bg-black/30 p-2 rounded-lg border border-white/5 shrink-0 justify-between items-center text-[9px] font-mono text-white/40">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          Live Plotting Mode: <strong className="text-white">{activePlot.replace(/_/g, " ").toUpperCase()}</strong>
        </span>
        <span>
          Reference Grid: <strong className="text-white">Active (293.15 K Std)</strong>
        </span>
      </div>
    </div>
  );
};

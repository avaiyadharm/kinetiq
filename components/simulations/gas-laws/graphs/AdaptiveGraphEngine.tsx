"use client";

import React, { useRef, useEffect, useState } from "react";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { GraphType, Viewport, GraphPanelProps, GraphIntelligence } from "@/lib/physics/graphs/GraphIntelligence";
import { 
  RenderContext, drawBackgroundAndAxes, drawTitlesAndLabels, getCoordinateValues, FONT_SANS, FONT_MONO 
} from "@/lib/physics/graphs/utils";
import { renderPV } from "@/lib/physics/graphs/renderers/renderPV";
import { renderVT, renderPT } from "@/lib/physics/graphs/renderers/renderVT";
import { renderMaxwellBoltzmann, renderBoltzmannEnergy, renderCollisionAnalytics } from "@/lib/physics/graphs/renderers/renderDistributions";
import { renderEntropy, renderPhaseSpace, renderOccupancyGrid, renderCompressibility } from "@/lib/physics/graphs/renderers/renderStatMech";
import { renderDiffusion, renderDiffusionVariance } from "@/lib/physics/graphs/renderers/renderDiffusion";

export const AdaptiveGraphEngine: React.FC<GraphPanelProps> = ({
  regime, gasPreset, particleMode, simulationMode, attractiveForce, particleMass, particleCount
}) => {
  const [primaryType, setPrimaryType] = useState<GraphType>("PV");
  const [secondaryType, setSecondaryType] = useState<GraphType>("MaxwellBoltzmann");
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  const canvasPrimaryRef = useRef<HTMLCanvasElement>(null);
  const canvasSecondaryRef = useRef<HTMLCanvasElement>(null);
  const containerPrimaryRef = useRef<HTMLDivElement>(null);
  const containerSecondaryRef = useRef<HTMLDivElement>(null);

  const primaryViewport = useRef<Viewport>({ xMin: 0, xMax: 12, yMin: 0, yMax: 8000 });
  const secondaryViewport = useRef<Viewport>({ xMin: 0, xMax: 1200, yMin: 0, yMax: 0.005 });

  const [primaryHover, setPrimaryHover] = useState<{ px: number; py: number; mx: number; my: number } | null>(null);
  const [secondaryHover, setSecondaryHover] = useState<{ px: number; py: number; mx: number; my: number } | null>(null);

  const isDraggingPrimary = useRef<boolean>(false);
  const isDraggingSecondary = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Rolling history buffers inside refs
  const historyEntropy = useRef<{ s: number; sMax: number; t: number }[]>([]);
  const historyVT = useRef<{ v: number; t: number; time: number }[]>([]);
  const historyPT = useRef<{ p: number; t: number; time: number }[]>([]);
  const historyPV = useRef<{ v: number; p: number; regime: string; preset: string }[]>([]);
  const historyZ = useRef<{ p: number; z: number }[]>([]);
  const historyVariance = useRef<{ val: number; t: number }[]>([]);
  const historyCollision = useRef<{ density: number; freq: number }[]>([]);

  const timeStepCounter = useRef<number>(0);

  useEffect(() => {
    const prim = GraphIntelligence.getPrimaryGraph(regime, gasPreset, particleMode);
    const sec = GraphIntelligence.getSecondaryGraph(regime, gasPreset, particleMode);
    setPrimaryType(prim);
    setSecondaryType(sec);
  }, [regime, gasPreset, particleMode]);

  useEffect(() => {
    const state = useGasLawsStore.getState();
    primaryViewport.current = GraphIntelligence.getDefaultViewport(primaryType, particleCount, state.v_rms);
  }, [primaryType, particleCount]);

  useEffect(() => {
    const state = useGasLawsStore.getState();
    secondaryViewport.current = GraphIntelligence.getDefaultViewport(secondaryType, particleCount, state.v_rms);
  }, [secondaryType, particleCount]);

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

  useEffect(() => { clearHistory(); }, [regime, gasPreset, particleMode]);

  useEffect(() => {
    let animId: number;
    const canvasPrim = canvasPrimaryRef.current;
    const canvasSec = canvasSecondaryRef.current;
    if (!canvasPrim || !canvasSec) return;
    const ctxPrim = canvasPrim.getContext("2d");
    const ctxSec = canvasSec.getContext("2d");
    if (!ctxPrim || !ctxSec) return;

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

    const resizeObserver = new ResizeObserver(() => handleAllResizes());
    if (containerPrimaryRef.current) resizeObserver.observe(containerPrimaryRef.current);
    if (containerSecondaryRef.current) resizeObserver.observe(containerSecondaryRef.current);
    handleAllResizes();

    const tick = () => {
      const storeState = useGasLawsStore.getState();

      if (!isFrozen) {
        timeStepCounter.current++;
        const currentV = storeState.measuredVolume;
        const currentP = storeState.measuredPressure;
        const currentT = storeState.measuredTemp;
        const currentS = storeState.entropy;
        const currentSMax = storeState.entropyMax;
        const currentZ = storeState.compressibilityZ;

        if (historyPV.current.length === 0 || 
            Math.abs(historyPV.current[historyPV.current.length - 1].v - currentV) > 0.01 || 
            Math.abs(historyPV.current[historyPV.current.length - 1].p - currentP) > 5) {
          historyPV.current.push({ v: currentV, p: currentP, regime, preset: gasPreset });
          if (historyPV.current.length > 500) historyPV.current.shift();
        }

        if (timeStepCounter.current % 5 === 0) {
          historyVT.current.push({ v: currentV, t: currentT, time: timeStepCounter.current });
          if (historyVT.current.length > 300) historyVT.current.shift();

          historyPT.current.push({ p: currentP, t: currentT, time: timeStepCounter.current });
          if (historyPT.current.length > 300) historyPT.current.shift();

          historyEntropy.current.push({ s: currentS, sMax: currentSMax, t: timeStepCounter.current });
          if (historyEntropy.current.length > 300) historyEntropy.current.shift();

          historyZ.current.push({ p: currentP, z: currentZ });
          if (historyZ.current.length > 300) historyZ.current.shift();

          if (particleMode === "diffusion" && storeState.phaseSpacePoints.length > 0) {
            const points = storeState.phaseSpacePoints;
            const meanX = points.reduce((acc, curr) => acc + curr.x, 0) / points.length;
            const variance = points.reduce((acc, curr) => acc + (curr.x - meanX) ** 2, 0) / points.length;
            historyVariance.current.push({ val: variance, t: timeStepCounter.current });
            if (historyVariance.current.length > 300) historyVariance.current.shift();
          }

          const density = particleCount / (currentV || 1);
          historyCollision.current.push({ density, freq: storeState.collisionCount });
          if (historyCollision.current.length > 300) historyCollision.current.shift();
        }
      }

      drawViewport(canvasPrim, ctxPrim, primaryType, primaryViewport.current, primaryHover, "primary");
      drawViewport(canvasSec, ctxSec, secondaryType, secondaryViewport.current, secondaryHover, "secondary");

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animId); resizeObserver.disconnect(); };
  }, [primaryType, secondaryType, isFrozen, primaryHover, secondaryHover, particleCount, regime, gasPreset, particleMode, showAnnotations, attractiveForce]);

  const drawViewport = (
    canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, 
    gType: GraphType, vp: Viewport, hover: typeof primaryHover, viewportId: "primary" | "secondary"
  ) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    ctx.clearRect(0, 0, w, h);

    const ml = 52, mb = 35, mt = 25, mr = 20;
    const graphW = w - ml - mr;
    const graphH = h - mt - mb;

    const toPxX = (mx: number) => ml + ((mx - vp.xMin) / (vp.xMax - vp.xMin || 1)) * graphW;
    const toPxY = (my: number) => mt + graphH - ((my - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;

    drawBackgroundAndAxes(ctx, vp, gType, ml, mt, graphW, graphH, w, h, GraphIntelligence.formatScientific);
    drawTitlesAndLabels(ctx, gType, ml, mt, graphW, graphH, h);

    const renderCtx: RenderContext = { ctx, gType, vp, ml, mt, graphW, graphH, w, h, toPxX, toPxY, showAnnotations };
    const state = useGasLawsStore.getState();
    const liveV = state.measuredVolume;
    const liveP = state.measuredPressure;
    const liveT = state.measuredTemp;

    switch (gType) {
      case "PV": renderPV(renderCtx, particleCount, regime, gasPreset, attractiveForce, liveV, liveP, liveT, historyPV.current); break;
      case "VT": renderVT(renderCtx, liveV, liveT, historyVT.current); break;
      case "PT": renderPT(renderCtx, liveP, liveT, historyPT.current); break;
      case "Entropy": renderEntropy(renderCtx, historyEntropy.current); break;
      case "MaxwellBoltzmann": renderMaxwellBoltzmann(renderCtx, particleMass, liveT); break;
      case "BoltzmannEnergy": renderBoltzmannEnergy(renderCtx, particleCount, liveT); break;
      case "CollisionAnalytics": renderCollisionAnalytics(renderCtx, particleCount, liveV, historyCollision.current); break;
      case "Diffusion": renderDiffusion(renderCtx, particleCount); break;
      case "DiffusionVariance": renderDiffusionVariance(renderCtx, historyVariance.current); break;
      case "Compressibility": renderCompressibility(renderCtx, particleCount, gasPreset, attractiveForce, liveT, liveP, historyZ.current); break;
      case "PhaseSpace": renderPhaseSpace(renderCtx); break;
      case "OccupancyGrid": renderOccupancyGrid(renderCtx); break;
    }

    if (hover) {
      const { px, py, mx, my } = hover;
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(ml + graphW, py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, mt); ctx.lineTo(px, mt + graphH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 2*Math.PI); ctx.fill();

        const tooltipW = 165, tooltipH = 92;
        const tooltipX = px + tooltipW + 15 > ml + graphW ? px - tooltipW - 10 : px + 10;
        const tooltipY = py + tooltipH + 15 > mt + graphH ? py - tooltipH - 10 : py + 10;
        ctx.fillStyle = "rgba(10, 10, 12, 0.92)"; ctx.fillRect(tooltipX, tooltipY, tooltipW, tooltipH);
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1; ctx.strokeRect(tooltipX, tooltipY, tooltipW, tooltipH);

        ctx.fillStyle = "#ffffff"; ctx.font = `bold 8.5px ${FONT_SANS}`; ctx.textAlign = "left";
        const coords = getCoordinateValues(gType, mx, my, particleCount, gasPreset);
        ctx.fillText(coords.title, tooltipX + 8, tooltipY + 12);
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `8px ${FONT_MONO}`;
        ctx.fillText(coords.xVal, tooltipX + 8, tooltipY + 28);
        ctx.fillText(coords.yVal, tooltipX + 8, tooltipY + 40);
        ctx.fillStyle = "#22d3ee"; ctx.font = `italic bold 8px ${FONT_MONO}`;
        ctx.fillText(coords.equation, tooltipX + 8, tooltipY + 56);
        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `7.5px ${FONT_SANS}`;
        
        const words = coords.annotation.split(" ");
        let line = "", lineY = tooltipY + 70;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          if (ctx.measureText(testLine).width > tooltipW - 16 && n > 0) {
            ctx.fillText(line, tooltipX + 8, lineY);
            line = words[n] + " "; lineY += 9;
          } else line = testLine;
        }
        ctx.fillText(line, tooltipX + 8, lineY);
      }
    }
  };

  const handleInteraction = (e: React.MouseEvent<HTMLCanvasElement>, action: "down" | "move" | "up" | "leave", target: "primary" | "secondary") => {
    const canvas = target === "primary" ? canvasPrimaryRef.current : canvasSecondaryRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const ml = 52, mb = 35, mt = 25, mr = 20;
    const graphW = rect.width - ml - mr, graphH = rect.height - mt - mb;
    const vp = target === "primary" ? primaryViewport.current : secondaryViewport.current;
    const mx = vp.xMin + ((px - ml) / graphW) * (vp.xMax - vp.xMin);
    const my = vp.yMin + (1 - (py - mt) / graphH) * (vp.yMax - vp.yMin);

    if (action === "down") {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      target === "primary" ? (isDraggingPrimary.current = true) : (isDraggingSecondary.current = true);
    } else if (action === "move") {
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        target === "primary" ? setPrimaryHover({ px, py, mx, my }) : setSecondaryHover({ px, py, mx, my });
      } else {
        target === "primary" ? setPrimaryHover(null) : setSecondaryHover(null);
      }
      
      const isDragging = target === "primary" ? isDraggingPrimary.current : isDraggingSecondary.current;
      if (isDragging) {
        const dx = e.clientX - lastMousePos.current.x, dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        const modelDx = (dx / graphW) * (vp.xMax - vp.xMin), modelDy = -(dy / graphH) * (vp.yMax - vp.yMin);
        const newVp = { xMin: vp.xMin - modelDx, xMax: vp.xMax - modelDx, yMin: vp.yMin - modelDy, yMax: vp.yMax - modelDy };
        target === "primary" ? (primaryViewport.current = newVp) : (secondaryViewport.current = newVp);
      }
    } else {
      target === "primary" ? (isDraggingPrimary.current = false) : (isDraggingSecondary.current = false);
      target === "primary" ? setPrimaryHover(null) : setSecondaryHover(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>, target: "primary" | "secondary") => {
    e.preventDefault();
    const canvas = target === "primary" ? canvasPrimaryRef.current : canvasSecondaryRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const ml = 52, mb = 35, mt = 25, mr = 20;
    const graphW = rect.width - ml - mr, graphH = rect.height - mt - mb;
    if (px < ml || px > ml + graphW || py < mt || py > mt + graphH) return;

    const vp = target === "primary" ? primaryViewport.current : secondaryViewport.current;
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const mx = vp.xMin + ((px - ml) / graphW) * (vp.xMax - vp.xMin);
    const my = vp.yMin + (1 - (py - mt) / graphH) * (vp.yMax - vp.yMin);

    const newVp = {
      xMin: mx - (mx - vp.xMin) * zoomFactor,
      xMax: mx + (vp.xMax - mx) * zoomFactor,
      yMin: my - (my - vp.yMin) * zoomFactor,
      yMax: my + (vp.yMax - my) * zoomFactor
    };
    target === "primary" ? (primaryViewport.current = newVp) : (secondaryViewport.current = newVp);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full pointer-events-auto">
      <div ref={containerPrimaryRef} className="flex-1 relative bg-[#09090b] rounded-2xl border border-white/5 shadow-xl overflow-hidden group">
        <canvas 
          ref={canvasPrimaryRef} 
          className="absolute inset-0 block cursor-crosshair touch-none"
          onMouseDown={(e) => handleInteraction(e, "down", "primary")}
          onMouseMove={(e) => handleInteraction(e, "move", "primary")}
          onMouseUp={(e) => handleInteraction(e, "up", "primary")}
          onMouseLeave={(e) => handleInteraction(e, "leave", "primary")}
          onWheel={(e) => handleWheel(e, "primary")}
        />
      </div>
      <div ref={containerSecondaryRef} className="flex-1 relative bg-[#09090b] rounded-2xl border border-white/5 shadow-xl overflow-hidden group">
        <canvas 
          ref={canvasSecondaryRef} 
          className="absolute inset-0 block cursor-crosshair touch-none"
          onMouseDown={(e) => handleInteraction(e, "down", "secondary")}
          onMouseMove={(e) => handleInteraction(e, "move", "secondary")}
          onMouseUp={(e) => handleInteraction(e, "up", "secondary")}
          onMouseLeave={(e) => handleInteraction(e, "leave", "secondary")}
          onWheel={(e) => handleWheel(e, "secondary")}
        />
      </div>
    </div>
  );
};

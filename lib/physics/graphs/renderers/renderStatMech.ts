import { RenderContext, FONT_MONO, FONT_SANS } from "../utils";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { ThermodynamicsAnalyzer } from "@/lib/physics/thermodynamics";
import { GasEngine } from "@/lib/physics/engine";

export const renderEntropy = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY, showAnnotations }: RenderContext,
  historyEntropy: { s: number; sMax: number; t: number }[]
) => {
  const state = useGasLawsStore.getState();
  const maxS = state.entropyMax;
  const pyMaxS = toPxY(maxS);
  
  ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
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

  if (historyEntropy.length > 1) {
    const minT = historyEntropy[0].t;
    const maxT = Math.max(minT + 100, historyEntropy[historyEntropy.length - 1].t);
    
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyEntropy.length; i++) {
      const mappedX = ml + ((historyEntropy[i].t - minT) / (maxT - minT)) * graphW;
      const mappedY = toPxY(historyEntropy[i].s);
      if (mappedX >= ml && mappedX <= ml + graphW && mappedY >= mt && mappedY <= mt + graphH) {
        if (first) { ctx.moveTo(mappedX, mappedY); first = false; }
        else ctx.lineTo(mappedX, mappedY);
      }
    }
    ctx.stroke();

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
};

export const renderPhaseSpace = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY }: RenderContext
) => {
  const state = useGasLawsStore.getState();
  const points = state.phaseSpacePoints || [];
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  
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
};

export const renderOccupancyGrid = (
  { ctx, vp, ml, mt, graphW, graphH }: RenderContext
) => {
  const state = useGasLawsStore.getState();
  const gridDim = 10;
  const cellW = graphW / gridDim;
  const cellH = graphH / gridDim;
  const occupancy = state.microstateOccupancy || [];

  let maxCount = 1;
  for (let i = 0; i < occupancy.length; i++) if (occupancy[i] > maxCount) maxCount = occupancy[i];

  for (let y = 0; y < gridDim; y++) {
    for (let x = 0; x < gridDim; x++) {
      const count = occupancy[y * gridDim + x] || 0;
      const pct = count / maxCount;
      
      ctx.fillStyle = `rgba(16, 185, 129, ${pct * 0.8})`;
      ctx.fillRect(ml + x * cellW + 0.5, mt + y * cellH + 0.5, cellW - 1, cellH - 1);
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.strokeRect(ml + x * cellW + 0.5, mt + y * cellH + 0.5, cellW - 1, cellH - 1);

      if (count > 0 && cellW > 18) {
        ctx.fillStyle = pct > 0.5 ? "#000" : "rgba(255, 255, 255, 0.4)";
        ctx.font = `6px ${FONT_MONO}`;
        ctx.textAlign = "center";
        ctx.fillText(count.toString(), ml + (x + 0.5) * cellW, mt + (y + 0.6) * cellH);
      }
    }
  }
};

export const renderCompressibility = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY }: RenderContext,
  particleCount: number,
  gasPreset: string,
  attractiveForce: number,
  liveT: number,
  liveP: number,
  historyZ: { p: number; z: number }[]
) => {
  const state = useGasLawsStore.getState();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ml, toPxY(1.0));
  ctx.lineTo(ml + graphW, toPxY(1.0));
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("Ideal Gas (Z = 1)", ml + graphW - 5, toPxY(1.0) - 4);

  if (gasPreset === "real" || gasPreset === "xenon") {
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    let first = true;
    let a_coeff = attractiveForce * 1.5e-42;
    let b_coeff = gasPreset === "xenon" ? 5.0e-25 : 3.0e-25;

    for (let pVal = vp.xMin; pVal <= vp.xMax; pVal += (vp.xMax - vp.xMin) / 50) {
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

  if (historyZ.length > 1) {
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyZ.length; i++) {
      const px = toPxX(historyZ[i].p);
      const py = toPxY(historyZ[i].z);
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

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
};

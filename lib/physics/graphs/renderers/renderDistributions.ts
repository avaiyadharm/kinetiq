import { RenderContext, FONT_MONO } from "../utils";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { getTheoreticalMaxwellBoltzmann3D } from "@/lib/physics/thermodynamics";

export const renderMaxwellBoltzmann = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY }: RenderContext,
  particleMass: number,
  liveT: number
) => {
  const state = useGasLawsStore.getState();
  const speedHist = state.speedHistogram || [];
  const binCount = speedHist.length;

  ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 0.8;
  const barW = graphW / (binCount || 1);

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

  if (liveT > 0) {
    ctx.strokeStyle = "#ec4899";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let vx = 0; vx <= graphW; vx += 2) {
      const speed = vp.xMin + (vx / graphW) * (vp.xMax - vp.xMin);
      const f_v = getTheoreticalMaxwellBoltzmann3D(speed, particleMass, liveT);
      const py = mt + graphH - ((f_v - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;
      if (py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(ml + vx, py); first = false; }
        else ctx.lineTo(ml + vx, py);
      }
    }
    ctx.stroke();
  }

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
};

export const renderBoltzmannEnergy = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY }: RenderContext,
  particleCount: number,
  liveT: number
) => {
  const state = useGasLawsStore.getState();
  const energyHist = state.energyHistogram || [];
  const binCount = energyHist.length || 60;

  const E_mean = (state.systemEnergy) / (particleCount || 1);
  vp.xMax = Math.max(120, E_mean * 3.5);
  
  let maxHistVal = 0.005;
  for (let i = 0; i < binCount; i++) if (energyHist[i] > maxHistVal) maxHistVal = energyHist[i];
  vp.yMax = maxHistVal * 1.25;

  ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
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

  if (liveT > 0) {
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let first = true;
    const kT = E_mean / 1.5;
    const prefactor = 2 / Math.sqrt(Math.PI) * Math.pow(1 / (kT || 1), 1.5);
    
    for (let vx = 0; vx <= graphW; vx += 2) {
      const E = vp.xMin + (vx / graphW) * (vp.xMax - vp.xMin);
      if (E <= 0) continue;
      const P_E = prefactor * Math.sqrt(E) * Math.exp(-E / kT);
      const py = mt + graphH - ((P_E - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;
      if (py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(ml + vx, py); first = false; }
        else ctx.lineTo(ml + vx, py);
      }
    }
    ctx.stroke();
  }

  const pxAvg = toPxX(E_mean);
  if (pxAvg >= ml && pxAvg <= ml + graphW) {
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pxAvg, mt);
    ctx.lineTo(pxAvg, mt + graphH);
    ctx.stroke();
    ctx.fillStyle = "#eab308";
    ctx.fillText(`⟨E⟩ = 3/2 kT: ${E_mean.toFixed(1)}J`, pxAvg + 4, mt + 20);
  }
};

export const renderCollisionAnalytics = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY }: RenderContext,
  particleCount: number,
  liveV: number,
  historyCollision: { density: number; freq: number }[]
) => {
  const state = useGasLawsStore.getState();
  if (historyCollision.length > 1) {
    let maxD = 100, maxF = 3000;
    historyCollision.forEach(pt => {
      if (pt.density > maxD) maxD = pt.density;
      if (pt.freq > maxF) maxF = pt.freq;
    });
    vp.xMax = maxD * 1.15;
    vp.yMax = maxF * 1.15;

    ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyCollision.length; i++) {
      const px = ml + ((historyCollision[i].density - vp.xMin) / (vp.xMax - vp.xMin || 1)) * graphW;
      const py = mt + graphH - ((historyCollision[i].freq - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);

        if (i % 5 === 0) {
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, 2*Math.PI);
          ctx.fill();
        }
      }
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const px0 = ml + ((0 - vp.xMin) / (vp.xMax - vp.xMin || 1)) * graphW;
    const py0 = mt + graphH - ((0 - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;
    const pxMax = ml + ((vp.xMax - vp.xMin) / (vp.xMax - vp.xMin || 1)) * graphW;
    const pyMax = mt + graphH - (((vp.xMax * (state.collisionCount / (particleCount / liveV || 1))) - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;
    ctx.moveTo(px0, py0);
    ctx.lineTo(pxMax, pyMax);
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

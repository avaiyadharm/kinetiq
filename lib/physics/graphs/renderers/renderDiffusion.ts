import { RenderContext, FONT_SANS } from "../utils";
import { useGasLawsStore } from "@/store/gasLawsStore";

export const renderDiffusion = (
  { ctx, vp, ml, mt, graphW, graphH }: RenderContext,
  particleCount: number
) => {
  const state = useGasLawsStore.getState();
  if (state.phaseSpacePoints.length > 0) {
    const points = state.phaseSpacePoints;
    const binCount = 10;
    const blueBins = new Array(binCount).fill(0);
    const orangeBins = new Array(binCount).fill(0);

    points.forEach(p => {
      const bIdx = Math.max(0, Math.min(binCount - 1, Math.floor(p.x * binCount)));
      if (p.color === "#3b82f6" || p.color === "#60a5fa" || p.color === "rgb(59, 130, 246)") {
        blueBins[bIdx]++;
      } else {
        orangeBins[bIdx]++;
      }
    });

    const colW = graphW / binCount;
    const halfBarW = colW * 0.4;
    vp.yMax = 0.5;
    
    for (let i = 0; i < binCount; i++) {
      const fracBlue = blueBins[i] / (particleCount / 2);
      const fracOrange = orangeBins[i] / (particleCount / 2);
      const px = ml + i * colW;

      const blueH = (fracBlue / vp.yMax) * graphH;
      ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
      ctx.strokeStyle = "#3b82f6";
      ctx.fillRect(px + 2, mt + graphH - blueH, halfBarW, blueH);
      ctx.strokeRect(px + 2, mt + graphH - blueH, halfBarW, blueH);

      const orangeH = (fracOrange / vp.yMax) * graphH;
      ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
      ctx.strokeStyle = "#f97316";
      ctx.fillRect(px + 2 + halfBarW + 1, mt + graphH - orangeH, halfBarW, orangeH);
      ctx.strokeRect(px + 2 + halfBarW + 1, mt + graphH - orangeH, halfBarW, orangeH);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(ml + graphW / 2, mt);
    ctx.lineTo(ml + graphW / 2, mt + graphH);
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

export const renderDiffusionVariance = (
  { ctx, vp, ml, mt, graphW, graphH, toPxY, showAnnotations }: RenderContext,
  historyVariance: { val: number; t: number }[]
) => {
  if (historyVariance.length > 1) {
    const minT = historyVariance[0].t;
    const maxT = Math.max(minT + 100, historyVariance[historyVariance.length - 1].t);
    vp.yMax = 0.1;
    
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyVariance.length; i++) {
      const mappedX = ml + ((historyVariance[i].t - minT) / (maxT - minT)) * graphW;
      const mappedY = toPxY(historyVariance[i].val);
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
};

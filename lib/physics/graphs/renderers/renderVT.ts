import { RenderContext, FONT_SANS } from "../utils";

export const renderVT = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY, showAnnotations }: RenderContext,
  liveV: number,
  liveT: number,
  historyVT: { v: number; t: number; time: number }[]
) => {
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const slope = liveV / (liveT || 300);
  ctx.moveTo(toPxX(vp.xMin), toPxY(vp.xMin * slope));
  ctx.lineTo(toPxX(vp.xMax), toPxY(vp.xMax * slope));
  ctx.stroke();
  ctx.setLineDash([]);

  if (showAnnotations) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `8px ${FONT_SANS}`;
    ctx.fillText("V ∝ T (Charles's Law)", ml + 10, mt + 15);
  }

  if (historyVT.length > 1) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyVT.length; i++) {
      const px = toPxX(historyVT[i].t);
      const py = toPxY(historyVT[i].v);
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  const dotX = toPxX(liveT);
  const dotY = toPxY(liveV);
  if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, 2*Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.stroke();
  }
};

export const renderPT = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY, showAnnotations }: RenderContext,
  liveP: number,
  liveT: number,
  historyPT: { p: number; t: number; time: number }[]
) => {
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const slope = liveP / (liveT || 300);
  ctx.moveTo(toPxX(vp.xMin), toPxY(vp.xMin * slope));
  ctx.lineTo(toPxX(vp.xMax), toPxY(vp.xMax * slope));
  ctx.stroke();
  ctx.setLineDash([]);

  if (showAnnotations) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `8px ${FONT_SANS}`;
    ctx.fillText("P ∝ T (Gay-Lussac's Law)", ml + 10, mt + 15);
  }

  if (historyPT.length > 1) {
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyPT.length; i++) {
      const px = toPxX(historyPT[i].t);
      const py = toPxY(historyPT[i].p);
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  const dotX = toPxX(liveT);
  const dotY = toPxY(liveP);
  if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, 2*Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#a855f7";
    ctx.stroke();
  }
};

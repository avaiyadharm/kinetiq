import { RenderContext, FONT_SANS, FONT_MONO } from "../utils";
import { useGasLawsStore } from "@/store/gasLawsStore";
import { ThermodynamicsAnalyzer } from "@/lib/physics/thermodynamics";
import { GasEngine } from "@/lib/physics/engine";

export const renderPV = (
  { ctx, vp, ml, mt, graphW, graphH, toPxX, toPxY, showAnnotations }: RenderContext,
  particleCount: number,
  regime: string,
  gasPreset: string,
  attractiveForce: number,
  liveV: number,
  liveP: number,
  liveT: number,
  historyPV: { v: number; p: number; regime: string; preset: string }[]
) => {
  // Draw Reference Isotherms
  ctx.lineWidth = 1;
  const refTemps = [200, 400, 600, 800];
  refTemps.forEach((temp) => {
    ctx.strokeStyle = temp === Math.round(liveT / 100) * 100 
      ? "rgba(16, 185, 129, 0.15)" 
      : "rgba(255, 255, 255, 0.025)";
    
    ctx.beginPath();
    let first = true;
    for (let vx = vp.xMin; vx <= vp.xMax; vx += (vp.xMax - vp.xMin) / 100) {
      const vM3 = vx / ThermodynamicsAnalyzer.VOL_SCALE;
      const pPa = (particleCount * GasEngine.K_B * temp) / vM3;
      const pKpa = pPa * ThermodynamicsAnalyzer.PRES_SCALE;
      const px = toPxX(vx);
      const py = toPxY(pKpa);
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    if (showAnnotations) {
      const labelV = vp.xMax - 1.0;
      const vM3 = labelV / ThermodynamicsAnalyzer.VOL_SCALE;
      const pPa = (particleCount * GasEngine.K_B * temp) / vM3;
      const pKpa = pPa * ThermodynamicsAnalyzer.PRES_SCALE;
      const lx = toPxX(labelV);
      const ly = toPxY(pKpa);
      if (lx >= ml && lx <= ml + graphW && ly >= mt && ly <= mt + graphH) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = `7px ${FONT_MONO}`;
        ctx.textAlign = "left";
        ctx.fillText(`${temp}K (Isotherm)`, lx + 2, ly + 2);
      }
    }
  });

  // Adiabatic expansion curve comparison
  if (regime === "adiabatic") {
    ctx.strokeStyle = "rgba(236, 72, 153, 0.35)"; // Pink adiabatic path reference
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    const initialV = 6.0;
    const initialP = (particleCount * GasEngine.K_B * 300) / (initialV / ThermodynamicsAnalyzer.VOL_SCALE) * ThermodynamicsAnalyzer.PRES_SCALE;
    let first = true;
    for (let vx = vp.xMin; vx <= vp.xMax; vx += (vp.xMax - vp.xMin) / 100) {
      const pAdiabatic = initialP * Math.pow(initialV / vx, 5 / 3);
      const px = toPxX(vx);
      const py = toPxY(pAdiabatic);
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    if (showAnnotations) {
      ctx.fillStyle = "rgba(236, 72, 153, 0.6)";
      ctx.font = `8px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("Adiabatic: PV¹·⁶⁷ = C", ml + 10, mt + 45);
    }
  }

  // Real Gas Van der Waals Shading
  if (gasPreset === "real" || gasPreset === "xenon") {
    ctx.fillStyle = "rgba(245, 158, 11, 0.05)"; // Orange glow
    ctx.beginPath();
    let idealPoints: {x: number, y: number}[] = [];
    let vdwPoints: {x: number, y: number}[] = [];

    for (let vx = vp.xMin; vx <= vp.xMax; vx += (vp.xMax - vp.xMin) / 50) {
      const vM3 = vx / ThermodynamicsAnalyzer.VOL_SCALE;
      const pIdeal = (particleCount * GasEngine.K_B * liveT) / vM3 * ThermodynamicsAnalyzer.PRES_SCALE;
      
      let a_coeff = attractiveForce * 1.5e-42;
      let b_coeff = gasPreset === "xenon" ? 5.0e-25 : 3.0e-25;
      const denominator = vM3 - particleCount * b_coeff;
      const pVdw = denominator > 0
        ? ((particleCount * GasEngine.K_B * liveT) / denominator - (a_coeff * particleCount * particleCount) / (vM3 * vM3)) * ThermodynamicsAnalyzer.PRES_SCALE
        : pIdeal;

      const px = toPxX(vx);
      const pyIdeal = toPxY(pIdeal);
      const pyVdw = toPxY(pVdw);

      if (px >= ml && px <= ml + graphW) {
        idealPoints.push({ x: px, y: Math.max(mt, Math.min(mt + graphH, pyIdeal)) });
        vdwPoints.push({ x: px, y: Math.max(mt, Math.min(mt + graphH, pyVdw)) });
      }
    }

    if (idealPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(idealPoints[0].x, idealPoints[0].y);
      for (let i = 1; i < idealPoints.length; i++) ctx.lineTo(idealPoints[i].x, idealPoints[i].y);
      for (let i = vdwPoints.length - 1; i >= 0; i--) ctx.lineTo(vdwPoints[i].x, vdwPoints[i].y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(vdwPoints[0].x, vdwPoints[0].y);
      for (let i = 1; i < vdwPoints.length; i++) ctx.lineTo(vdwPoints[i].x, vdwPoints[i].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showAnnotations) {
      ctx.fillStyle = "#f59e0b";
      ctx.font = `8px ${FONT_SANS}`;
      ctx.textAlign = "left";
      ctx.fillText("Van der Waals Deviation", ml + 10, mt + 45);
    }
  }

  // Draw path history
  if (historyPV.length > 1) {
    ctx.strokeStyle = regime === "adiabatic" ? "#ec4899" : (gasPreset === "real" ? "#f59e0b" : "#10b981");
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < historyPV.length; i++) {
      const px = toPxX(historyPV[i].v);
      const py = toPxY(historyPV[i].p);
      if (px >= ml && px <= ml + graphW && py >= mt && py <= mt + graphH) {
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  // Live state dot
  const dotX = toPxX(liveV);
  const dotY = toPxY(liveP);
  if (dotX >= ml && dotX <= ml + graphW && dotY >= mt && dotY <= mt + graphH) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = regime === "adiabatic" ? "#ec4899" : "#10b981";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 7 + Math.sin(Date.now() / 150) * 2, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Draw compression direction arrows on path
  if (historyPV.length > 4 && showAnnotations) {
    const lastIdx = historyPV.length - 1;
    const deltaV = historyPV[lastIdx].v - historyPV[lastIdx - 4].v;
    if (Math.abs(deltaV) > 0.05) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = `10px ${FONT_SANS}`;
      ctx.textAlign = "center";
      const textArrow = deltaV < 0 ? "◀ COMPRESSING (W > 0)" : "▶ EXPANDING (W < 0)";
      ctx.fillText(textArrow, ml + graphW / 2, mt + 20);
    }
  }
};

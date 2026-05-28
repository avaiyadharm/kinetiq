import { GraphType, Viewport } from "./GraphIntelligence";

export const FONT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  gType: GraphType;
  vp: Viewport;
  ml: number;
  mt: number;
  graphW: number;
  graphH: number;
  w: number;
  h: number;
  toPxX: (mx: number) => number;
  toPxY: (my: number) => number;
  showAnnotations: boolean;
}

export const drawBackgroundAndAxes = (
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  gType: GraphType,
  ml: number,
  mt: number,
  graphW: number,
  graphH: number,
  w: number,
  h: number,
  formatScientific: (num: number, prec?: number) => string
) => {
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#0c0c0e";
  ctx.fillRect(ml, mt, graphW, graphH);

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1;
  ctx.strokeRect(ml, mt, graphW, graphH);

  const toPxX = (mx: number) => ml + ((mx - vp.xMin) / (vp.xMax - vp.xMin || 1)) * graphW;
  const toPxY = (my: number) => mt + graphH - ((my - vp.yMin) / (vp.yMax - vp.yMin || 1)) * graphH;

  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 0.8;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `8px ${FONT_MONO}`;
  ctx.textAlign = "center";

  const xDivs = 6;
  for (let i = 0; i <= xDivs; i++) {
    const modelVal = vp.xMin + (i / xDivs) * (vp.xMax - vp.xMin);
    const px = toPxX(modelVal);
    if (px >= ml && px <= ml + graphW) {
      ctx.beginPath();
      ctx.moveTo(px, mt);
      ctx.lineTo(px, mt + graphH);
      ctx.stroke();

      ctx.strokeStyle = "#27272a";
      ctx.beginPath();
      ctx.moveTo(px, mt + graphH);
      ctx.lineTo(px, mt + graphH + 4);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.03)";

      ctx.fillText(formatScientific(modelVal, gType === "Diffusion" ? 2 : 1), px, mt + graphH + 12);
    }
  }

  const yDivs = 5;
  ctx.textAlign = "right";
  for (let i = 0; i <= yDivs; i++) {
    const modelVal = vp.yMin + (i / yDivs) * (vp.yMax - vp.yMin);
    const py = toPxY(modelVal);
    if (py >= mt && py <= mt + graphH) {
      ctx.beginPath();
      ctx.moveTo(ml, py);
      ctx.lineTo(ml + graphW, py);
      ctx.stroke();

      ctx.strokeStyle = "#27272a";
      ctx.beginPath();
      ctx.moveTo(ml - 4, py);
      ctx.lineTo(ml, py);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.03)";

      ctx.fillText(formatScientific(modelVal, gType === "MaxwellBoltzmann" ? 4 : 1), ml - 8, py + 3);
    }
  }
};

export const drawTitlesAndLabels = (
  ctx: CanvasRenderingContext2D,
  gType: GraphType,
  ml: number,
  mt: number,
  graphW: number,
  graphH: number,
  h: number
) => {
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 9.5px ${FONT_SANS}`;
  ctx.textAlign = "left";

  let titleText = "";
  let xLabel = "";
  let yLabel = "";

  switch (gType) {
    case "PV":
      titleText = "PRESSURE-VOLUME INDICATOR DIAGRAM";
      xLabel = "VOLUME V (Liters)";
      yLabel = "PRESSURE P (kPa)";
      break;
    case "VT":
      titleText = "VOLUME-TEMPERATURE STATE PATH";
      xLabel = "TEMPERATURE T (Kelvin)";
      yLabel = "VOLUME V (Liters)";
      break;
    case "PT":
      titleText = "PRESSURE-TEMPERATURE STATE PATH";
      xLabel = "TEMPERATURE T (Kelvin)";
      yLabel = "PRESSURE P (kPa)";
      break;
    case "Entropy":
      titleText = "STATISTICAL SHANNON ENTROPY VS TIME";
      xLabel = "TIME STEP (t)";
      yLabel = "ENTROPY S (k_B units)";
      break;
    case "MaxwellBoltzmann":
      titleText = "MAXWELL-BOLTZMANN SPEED DISTRIBUTION";
      xLabel = "PARTICLE SPEED v (m/s)";
      yLabel = "PROBABILITY DENSITY f(v)";
      break;
    case "BoltzmannEnergy":
      titleText = "BOLTZMANN KINETIC ENERGY DISTRIBUTION";
      xLabel = "KINETIC ENERGY E (Joules × 10⁻²⁰)";
      yLabel = "PROBABILITY DENSITY P(E)";
      break;
    case "CollisionAnalytics":
      titleText = "COLLISION FREQUENCY VS CHAMBER DENSITY";
      xLabel = "DENSITY N/V (particles/L)";
      yLabel = "COLLISION FREQUENCY (Hz)";
      break;
    case "Diffusion":
      titleText = "SPATIAL CONCENTRATION PROFILE (DIFFUSION)";
      xLabel = "POSITION ALONG CHAMBER (x/L)";
      yLabel = "CONCENTRATION FRACTION";
      break;
    case "DiffusionVariance":
      titleText = "MEAN SQUARED DISPLACEMENT (MSD) VS TIME";
      xLabel = "TIME STEP (t)";
      yLabel = "SPATIAL VARIANCE σ_x²";
      break;
    case "Compressibility":
      titleText = "COMPRESSIBILITY FACTOR MAP (Z VS P)";
      xLabel = "PRESSURE P (kPa)";
      yLabel = "COMPRESSIBILITY Z (PV/NkT)";
      break;
    case "PhaseSpace":
      titleText = "ENSEMBLE PHASE SPACE MAP (x - px)";
      xLabel = "POSITION x (fractional)";
      yLabel = "MOMENTUM px (scaled)";
      break;
    case "OccupancyGrid":
      titleText = "MICROSTATE OCCUPANCY GRID (COARSE-GRAINED)";
      xLabel = "CHAMBER X BINS (10)";
      yLabel = "CHAMBER Y BINS (10)";
      break;
  }

  ctx.fillText(titleText, ml, 14);

  // Axis Labels
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `8px ${FONT_MONO}`;
  ctx.textAlign = "center";
  ctx.fillText(xLabel, ml + graphW / 2, h - 8);

  ctx.save();
  ctx.translate(13, mt + graphH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
};

export const getCoordinateValues = (gType: GraphType, x: number, y: number, particleCount: number, gasPreset: string) => {
  let title = "";
  let xVal = "";
  let yVal = "";
  let equation = "";
  let annotation = "";

  switch (gType) {
    case "PV":
      title = "P-V State Point";
      xVal = `Volume V = ${x.toFixed(2)} Liters`;
      yVal = `Pressure P = ${Math.round(y)} kPa`;
      equation = gasPreset === "real" ? "(P + aN²/V²)(V - Nb) = NkT" : "PV = NkT";
      annotation = x < 5 ? "High compression raises particle wall collision rate, increasing pressure." : "Gas expansion reduces chamber density, lowering pressure.";
      break;
    case "VT":
      title = "V-T State Point";
      xVal = `Temperature T = ${Math.round(x)} K`;
      yVal = `Volume V = ${y.toFixed(2)} L`;
      equation = "V = (N k_B / P) · T";
      annotation = "Adding heat increases microscopic speeds. Volume expands to maintain constant pressure.";
      break;
    case "PT":
      title = "P-T State Point";
      xVal = `Temperature T = ${Math.round(x)} K`;
      yVal = `Pressure P = ${Math.round(y)} kPa`;
      equation = "P = (N k_B / V) · T";
      annotation = "Adding heat raises molecular velocities, increasing collision momentum transfer.";
      break;
    case "Entropy":
      title = "Shannon Entropy";
      xVal = `Time step t = ${Math.round(x)}`;
      yVal = `Entropy S = ${y.toFixed(4)} k_B`;
      equation = "S = -k_B ∑ Pᵢ ln Pᵢ";
      annotation = "Unconstrained systems spread stochastically to fill all available microstates.";
      break;
    case "MaxwellBoltzmann":
      title = "MB Velocity Spec";
      xVal = `Speed v = ${Math.round(x)} m/s`;
      yVal = `Density f(v) = ${y.toFixed(5)}`;
      equation = "f(v) ∝ v² exp(-mv² / 2kT)";
      annotation = "Distribution peak shifts rightward under high temperature or lower mass.";
      break;
    case "BoltzmannEnergy":
      title = "Energy Distribution";
      xVal = `Energy E = ${x.toFixed(1)} × 10⁻²⁰ J`;
      yVal = `Density P(E) = ${y.toFixed(4)}`;
      equation = "P(E) ∝ √E exp(-E / kT)";
      annotation = "Thermal equipartition maps direct energy states according to degrees of freedom.";
      break;
    case "CollisionAnalytics":
      title = "Collision Tracker";
      xVal = `Density N/V = ${x.toFixed(1)} L⁻¹`;
      yVal = `Frequency = ${Math.round(y)} Hz`;
      equation = "f꜀ = 4√2 π r² (N/V) v_rms";
      annotation = "Density reduction expands mean free path, lowering molecular collision rates.";
      break;
    case "Diffusion":
      title = "Spatial Concentration";
      xVal = `Chamber slice = ${x.toFixed(2)}`;
      yVal = `Fraction = ${y.toFixed(3)}`;
      equation = "∂C/∂t = D ∂²C/∂x²";
      annotation = "Mixing processes driven by concentration gradients minimize free energy.";
      break;
    case "DiffusionVariance":
      title = "Spatial Variance (MSD)";
      xVal = `Time t = ${Math.round(x)}`;
      yVal = `Variance σ² = ${y.toFixed(4)}`;
      equation = "⟨x²⟩ = 2 D t";
      annotation = "Brownian motion shows linear MSD displacement over time prior to saturation.";
      break;
    case "Compressibility":
      title = "Compressibility Factor";
      xVal = `Pressure P = ${Math.round(x)} kPa`;
      yVal = `Z Factor = ${y.toFixed(3)}`;
      equation = "Z = PV / NkT";
      annotation = "Attractive forces pull Z below 1. Exclusive volume pushes Z above 1.";
      break;
    case "PhaseSpace":
      title = "Phase Coordinates";
      xVal = `Position x/L = ${x.toFixed(3)}`;
      yVal = `Momentum p_x = ${y.toFixed(3)}`;
      equation = "dH/dp = dx/dt , dH/dx = -dp/dt";
      annotation = "Thermal orbits show continuous microscopic paths through phase space.";
      break;
    case "OccupancyGrid":
      title = "Occupancy Cell";
      xVal = `Bin X = ${Math.floor(x)}`;
      yVal = `Bin Y = ${Math.floor(y)}`;
      equation = "P_i = N_cell / N_total";
      annotation = "Microscopic density fluctuations are stochastically smoothed out at equilibrium.";
      break;
  }

  return { title, xVal, yVal, equation, annotation };
};

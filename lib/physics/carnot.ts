export const R = 8.314; // Ideal gas constant J/(mol·K)
export const GAMMA = 5 / 3; // Monatomic ideal gas

export type CycleStage = 
  | "ISOTHERMAL_EXPANSION"
  | "ADIABATIC_EXPANSION"
  | "ISOTHERMAL_COMPRESSION"
  | "ADIABATIC_COMPRESSION";

export interface CarnotState {
  V: number;
  P: number;
  T: number;
  stage: CycleStage;
  progress: number; // 0.0 to 1.0 within the current stage
}

export class CarnotEngineCore {
  private n: number;
  private V1: number;
  private V2: number;
  public TH: number;
  public TC: number;

  constructor(n = 1.0, TH = 500, TC = 300, V1 = 2.0, V2 = 6.0) {
    this.n = n;
    this.TH = TH;
    this.TC = TC;
    this.V1 = V1;
    this.V2 = V2;
  }

  // V3: Volume at end of adiabatic expansion
  get V3(): number {
    return this.V2 * Math.pow(this.TH / this.TC, 1 / (GAMMA - 1));
  }

  // V4: Volume at end of isothermal compression (start of adiabatic compression)
  get V4(): number {
    return this.V1 * Math.pow(this.TH / this.TC, 1 / (GAMMA - 1));
  }
  
  public getPressure(V: number, T: number): number {
    return (this.n * R * T) / V;
  }

  public getTheoreticalEfficiency(): number {
    return 1 - (this.TC / this.TH);
  }

  public getNetWork(): number {
    // W = Q_H - Q_C
    // Q_H = n * R * T_H * ln(V2 / V1)
    // Q_C = n * R * T_C * ln(V3 / V4)
    // For Carnot, V3/V4 = V2/V1, so W = n * R * (T_H - T_C) * ln(V2/V1)
    return this.n * R * (this.TH - this.TC) * Math.log(this.V2 / this.V1);
  }

  public getHeatIn(): number {
    return this.n * R * this.TH * Math.log(this.V2 / this.V1);
  }

  public getStateAt(stage: CycleStage, progress: number): CarnotState {
    let V = 0;
    let T = 0;

    switch (stage) {
      case "ISOTHERMAL_EXPANSION":
        V = this.V1 + (this.V2 - this.V1) * progress;
        T = this.TH;
        break;
      case "ADIABATIC_EXPANSION":
        V = this.V2 + (this.V3 - this.V2) * progress;
        T = this.TH * Math.pow(this.V2 / V, GAMMA - 1);
        break;
      case "ISOTHERMAL_COMPRESSION":
        V = this.V3 + (this.V4 - this.V3) * progress;
        T = this.TC;
        break;
      case "ADIABATIC_COMPRESSION":
        V = this.V4 + (this.V1 - this.V4) * progress;
        T = this.TC * Math.pow(this.V4 / V, GAMMA - 1);
        break;
    }

    return {
      V,
      T,
      P: this.getPressure(V, T),
      stage,
      progress
    };
  }

  // Generates the full path for the PV graph
  public getCyclePath(pointsPerStage = 40): { v: number, p: number }[] {
    const path: { v: number, p: number }[] = [];
    const stages: CycleStage[] = [
      "ISOTHERMAL_EXPANSION", "ADIABATIC_EXPANSION", 
      "ISOTHERMAL_COMPRESSION", "ADIABATIC_COMPRESSION"
    ];

    for (const stage of stages) {
      for (let i = 0; i <= pointsPerStage; i++) {
        const state = this.getStateAt(stage, i / pointsPerStage);
        path.push({ v: state.V, p: state.P });
      }
    }
    return path;
  }
}

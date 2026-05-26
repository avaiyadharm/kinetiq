import { GasEngine, Particle } from './engine';

export interface ThermodynamicsState {
  measuredPressure: number;
  idealPressure: number;
  measuredTemp: number;
  measuredVolume: number; // Volume represented by chamber width
  meanSpeed: number;
  v_rms: number;
  v_mostProbable: number;
  speedHistogram: number[];
  collisionCount: number;
  meanFreePath: number;
  systemEnergy: number;
  entropy: number;
  entropyMax: number;
  compressibilityZ: number;
  binWidth: number;
  diffusionMixing: number;
  vanDerWaalsPressure: number;
  particlesEscaped: number;
  temperatureTarget: number;
}

export class ThermodynamicsAnalyzer {
  private pressureBuffer: { t: number, p: number }[] = [];
  private pvHistory: { v: number, p: number }[] = [];
  private momentumAccumulator = 0;
  private momentumTimer = 0;
  private collisionRateCounter = 0;
  private collisionRateTimer = 0;
  private lastCollisionRate = 0;

  // Smoothing buffers
  private maxBufferSize = 200;
  private lastPressure = 0;

  constructor() {}

  public registerFrameCollisions(momentumTransferred: number, collisionCount: number, dt: number) {
    this.momentumAccumulator += momentumTransferred;
    this.momentumTimer += dt;
    this.collisionRateCounter += collisionCount;
    this.collisionRateTimer += dt;
  }

  public analyze(
    particles: Particle[], 
    targetTemp: number, 
    chamberWidth: number, 
    chamberHeight: number, 
    now: number,
    chamberXMin: number,
    particleMode: string,
    gasPreset: string,
    attractiveForce: number,
    meanFreePathVal: number
  ): ThermodynamicsState {
    const N = particles.length || 1;
    
    // We treat Area as perimeter * 1 (depth=1) for 2D, but in our "3D" pseudo-model,
    // we use a scaling factor to make pressure align visually with ideal gas.
    const perimeter = 2 * (chamberWidth + chamberHeight);
    
    // Calculate volume based on the 3D-ish projection, but we'll stick to a 
    // proportional mapping so it behaves like V for the UI.
    const V = 3.0 + (chamberWidth / 360) * 7.0; // typical scaling from old code

    // 1. Calculate Real Measured Pressure using P = F/A = (dp/dt)/A
    let measuredPressure = this.lastPressure;
    // Update pressure slowly to smooth it out (rolling average over dt = 0.08s)
    if (this.momentumTimer > 0.08) {
       const rawPressure = (this.momentumAccumulator / this.momentumTimer) / perimeter;
       const scaledPressure = rawPressure * 30.0; // Visual scaling factor
       
       this.momentumAccumulator = 0;
       this.momentumTimer = 0;

       const smoothFactor = 0.15;
       measuredPressure = this.lastPressure + (scaledPressure - this.lastPressure) * smoothFactor;
       this.lastPressure = measuredPressure;

       this.pressureBuffer.push({ t: now, p: measuredPressure });
       if (this.pressureBuffer.length > this.maxBufferSize) this.pressureBuffer.shift();

       this.pvHistory.push({ v: V, p: measuredPressure });
       if (this.pvHistory.length > 300) this.pvHistory.shift();
    }

    // Initialize pressure if no history
    if (this.pressureBuffer.length === 0) {
       measuredPressure = (N * GasEngine.K_B * targetTemp) / V;
       this.lastPressure = measuredPressure;
    }

    // 2. Calculate Kinematics (Temperature, RMS, System Energy)
    let totalKE = 0;
    let sumSpeed = 0;
    const speeds: number[] = [];
    const massVal = particles.length > 0 ? particles[0].mass : 1.0;

    for (let i = 0; i < particles.length; i++) {
       const p = particles[i];
       // 3D Speed: sqrt(vx^2 + vy^2 + vz^2)
       const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy + p.vz*p.vz);
       speeds.push(speed);
       sumSpeed += speed;
       totalKE += 0.5 * p.mass * speed * speed;
    }

    // T = (2/3) * (KE / N * k_B)
    const measuredTemp = (2.0 / 3.0) * (totalKE / (N * GasEngine.K_B));
    const meanSpeed = sumSpeed / N;
    
    // v_rms = sqrt(3 k_B T / m)
    const v_rms = Math.sqrt(3 * GasEngine.K_B * measuredTemp / massVal);
    // v_p = sqrt(2 k_B T / m)
    const v_mostProbable = Math.sqrt(2 * GasEngine.K_B * measuredTemp / massVal);

    // 3. Collision Frequency
    if (this.collisionRateTimer > 1.0) {
       this.lastCollisionRate = Math.round(this.collisionRateCounter / this.collisionRateTimer);
       this.collisionRateCounter = 0;
       this.collisionRateTimer = 0;
    }

    // 4. Ideal Gas Law Validation (PV = NkT) -> Z = PV / NkT
    const idealPressure = (N * GasEngine.K_B * targetTemp) / V;
    const compressibilityZ = (measuredPressure * V) / (N * GasEngine.K_B * measuredTemp || 1);

    // 5. 3D Histogram with 60 bins
    const binCount = 60;
    const speedHistogram = new Array(binCount).fill(0);
    const maxSpeedCap = 300; // Expected max visual speed
    const binWidth = maxSpeedCap / binCount;

    for (let i = 0; i < speeds.length; i++) {
       const s = speeds[i];
       const binIndex = Math.min(binCount - 1, Math.floor(s / binWidth));
       speedHistogram[binIndex]++;
    }
    
    // Normalize histogram so area approx 1
    for (let i = 0; i < speedHistogram.length; i++) {
        // density = count / (N * binWidth)
        speedHistogram[i] = speedHistogram[i] / (N * binWidth);
    }

    // 6. Spatial Entropy (Shannon)
    const gridDim = 10; // 10x10 grid
    const cellW = chamberWidth / gridDim;
    const cellH = chamberHeight / gridDim;
    const cellCounts = new Array(gridDim * gridDim).fill(0);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = Math.max(0, Math.min(gridDim - 1, Math.floor((p.x - chamberXMin) / cellW)));
      const cy = Math.max(0, Math.min(gridDim - 1, Math.floor(p.y / cellH)));
      cellCounts[cy * gridDim + cx]++;
    }

    let entropy = 0;
    for (let i = 0; i < cellCounts.length; i++) {
       if (cellCounts[i] > 0) {
          const prob = cellCounts[i] / N;
          entropy -= prob * Math.log(prob);
       }
    }
    const entropyMax = Math.log(gridDim * gridDim);

    // 7. Van der Waals Theoretical Pressure
    let a_coeff = 0;
    let b_coeff = 0;
    if (gasPreset === "real") {
      a_coeff = attractiveForce * 0.05; // Visual scaling factor
      b_coeff = 0.0003; 
    } else if (gasPreset === "xenon") {
      a_coeff = 0;
      b_coeff = 0.0005; 
    }
    const vdwDenominator = V - N * b_coeff;
    const vanDerWaalsPressure = vdwDenominator > 0
      ? (N * GasEngine.K_B * targetTemp) / vdwDenominator - (a_coeff * N * N) / (V * V)
      : idealPressure;

    // 8. Diffusion Mixing Rate
    let diffusionMixing = 0;
    if (particleMode === "diffusion") {
      const center = chamberXMin + chamberWidth * 0.5;
      let leftBlue = 0, leftOrange = 0;
      let rightBlue = 0, rightOrange = 0;

      for (let i = 0; i < particles.length; i++) {
        const part = particles[i];
        const isLeft = part.x < center;
        const isBlue = part.id < particles.length / 2;
        if (isLeft) {
          if (isBlue) leftBlue++;
          else leftOrange++;
        } else {
          if (isBlue) rightBlue++;
          else rightOrange++;
        }
      }
      
      const totalBlue = leftBlue + rightBlue || 1;
      const totalOrange = leftOrange + rightOrange || 1;
      
      const leftBluePct = leftBlue / totalBlue;
      const leftOrangePct = leftOrange / totalOrange;
      const diffIndex = Math.abs(leftBluePct - 0.5) + Math.abs(leftOrangePct - 0.5);
      diffusionMixing = Math.max(0, Math.min(100, (1 - diffIndex) * 100));
    }

    return {
      measuredPressure,
      idealPressure,
      measuredTemp,
      measuredVolume: V,
      meanSpeed,
      v_rms,
      v_mostProbable,
      speedHistogram,
      collisionCount: this.lastCollisionRate,
      meanFreePath: meanFreePathVal,
      systemEnergy: totalKE,
      entropy,
      entropyMax,
      compressibilityZ,
      binWidth,
      diffusionMixing,
      vanDerWaalsPressure,
      particlesEscaped: 0,
      temperatureTarget: targetTemp
    };
  }
  
  public getPVHistory() {
      return this.pvHistory;
  }
}

/**
 * Returns the exact Y value for the theoretical 3D Maxwell-Boltzmann distribution
 */
export function getTheoreticalMaxwellBoltzmann3D(v: number, mass: number, temp: number): number {
    const kbT = GasEngine.K_B * temp;
    // f(v) = 4 * pi * (m / (2 * pi * k * T))^(3/2) * v^2 * e^(-mv^2 / 2kT)
    const prefactor = 4 * Math.PI * Math.pow(mass / (2 * Math.PI * kbT), 1.5);
    const exponent = -(mass * v * v) / (2 * kbT);
    return prefactor * v * v * Math.exp(exponent);
}

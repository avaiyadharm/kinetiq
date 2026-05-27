import { GasEngine, Particle } from './engine';

export interface ThermodynamicsState {
  measuredPressure: number;     // Displayed Pressure in kPa (SI Pa * 1000)
  idealPressure: number;        // Displayed Ideal Pressure in kPa
  measuredTemp: number;         // Displayed Temperature in K
  measuredVolume: number;       // Displayed Volume in Liters (m³ * VOL_SCALE)
  meanSpeed: number;            // In m/s
  v_rms: number;                // In m/s
  v_mostProbable: number;       // In m/s
  speedHistogram: number[];     // Normalized density histogram
  collisionCount: number;       // Collision rate per second
  meanFreePath: number;         // In meters
  systemEnergy: number;         // Scaled kinetic energy in Joules
  entropy: number;              // Shannon entropy in k_B
  entropyMax: number;           // Max Shannon entropy in k_B
  compressibilityZ: number;     // Z factor (dimensionless)
  binWidth: number;             // Width of speed bins in m/s
  diffusionMixing: number;      // Mixing rate (0-100%)
  vanDerWaalsPressure: number;  // Displayed VDW Pressure in kPa
  particlesEscaped: number;
  temperatureTarget: number;

  // New statistical mechanics variables
  energyHistogram: number[];
  energyBinWidth: number;
  phaseSpacePoints: { x: number; px: number; color: string }[];
  microstateOccupancy: number[];
  entropyConvergence: number;
  isEquilibrium: boolean;
  meanFreePathTheory: number;
}

export class ThermodynamicsAnalyzer {
  private pressureBuffer: { t: number, p: number }[] = [];
  private pvHistory: { v: number, p: number }[] = [];
  private momentumAccumulator = 0;
  private momentumTimer = 0;
  private collisionRateCounter = 0;
  private collisionRateTimer = 0;
  private lastCollisionRate = 0;
  private entropyHistory: number[] = [];

  // Temporal smoothing buffers
  private maxBufferSize = 300;
  private lastPressure = 0;


  // Scale factors to map microscopic simulation space to macroscopic laboratory scale
  public static readonly VOL_SCALE = 8.33333e20; // converts m³ to Liters
  public static readonly PRES_SCALE = 1.0;       // converts Pascals to kPa (1:1 mapping due to scale factors)
  public static readonly MOL_SCALE = 0.0013833;   // converts N particles to moles
  public static readonly ENERGY_SCALE = 8.33333e20; // scales J to macro Joules (consistent with PV)

  constructor() {}

  public registerFrameCollisions(momentumTransferred: number, collisionCount: number, dt: number) {
    this.momentumAccumulator += momentumTransferred;
    this.momentumTimer += dt;
    this.collisionRateCounter += collisionCount;
    this.collisionRateTimer += dt;
  }  public analyze(
    particles: Particle[], 
    targetTemp: number, 
    chamberWidth: number,   // in meters (SI)
    chamberHeight: number,  // in meters (SI)
    now: number,
    chamberXMin: number,    // in meters
    particleMode: string,
    gasPreset: string,
    attractiveForce: number,
    meanFreePathVal: number  // in meters
  ): ThermodynamicsState {
    const N = particles.length || 1;
    
    // Total boundary surface area of the 3D-ish slab walls (side boundaries of thickness DEPTH)
    const perimeter = 2 * (chamberWidth + chamberHeight);
    const wallArea = perimeter * GasEngine.DEPTH; // in m² (SI)
    
    // Real volume of the thin microscopic slab
    const V_micro = chamberWidth * chamberHeight * GasEngine.DEPTH; // in m³ (SI)
    const V_macro_L = V_micro * ThermodynamicsAnalyzer.VOL_SCALE;   // Displayed volume in Liters

    // 1. Calculate Real Measured Pressure using P = F/A = (dp/dt)/A (SI Pascals)
    let measuredPressureSI = this.lastPressure;
    
    if (this.momentumTimer > 0.08) {
       // Average force on boundaries: F = dp / dt (SI Newtons)
       // Pressure: P = F / A_wall (SI Pascals)
       const rawPressureSI = (this.momentumAccumulator / this.momentumTimer) / wallArea;
       
       this.momentumAccumulator = 0;
       this.momentumTimer = 0;

       // 78%/22% temporal averaging for more responsive, physically fluctuating pressure readout
       const smoothFactor = 0.22;
       measuredPressureSI = this.lastPressure + (rawPressureSI - this.lastPressure) * smoothFactor;
       this.lastPressure = measuredPressureSI;

       this.pressureBuffer.push({ t: now, p: measuredPressureSI });
       if (this.pressureBuffer.length > this.maxBufferSize) this.pressureBuffer.shift();

       this.pvHistory.push({ v: V_macro_L, p: measuredPressureSI * ThermodynamicsAnalyzer.PRES_SCALE });
       if (this.pvHistory.length > 300) this.pvHistory.shift();
    }

    // Initialize pressure if buffer is empty
    if (this.pressureBuffer.length === 0) {
       measuredPressureSI = (N * GasEngine.K_B * targetTemp) / V_micro;
       this.lastPressure = measuredPressureSI;
    }

    // Add stochastic measurement fluctuations (Brownian-style noise)
    const pNoise = (Math.random() - 0.5) * 0.035 * measuredPressureSI; // 3.5% pressure fluctuations
    const finalPressure = Math.max(5.0, measuredPressureSI + pNoise);

    // 2. Calculate Kinematics (Temperature, RMS, System Energy in SI)
    let totalKE_micro = 0;
    let sumSpeed = 0;
    const speeds: number[] = [];
    const massVal = particles.length > 0 ? particles[0].mass : 1.0;

    for (let i = 0; i < particles.length; i++) {
       const p = particles[i];
       // 3D Speed: sqrt(vx^2 + vy^2 + vz^2)
       const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy + p.vz*p.vz);
       speeds.push(speed);
       sumSpeed += speed;
       // KE = 0.5 * m * v²
       totalKE_micro += 0.5 * p.mass * speed * speed;
    }

    // Equipartition theorem in 3D: T = 2/3 * (KE / N * k_B)
    const rawTemp = (2.0 / 3.0) * (totalKE_micro / (N * GasEngine.K_B));
    const tNoise = (Math.random() - 0.5) * 0.015 * rawTemp; // 1.5% thermal temperature fluctuations
    const finalTemp = Math.max(10.0, rawTemp + tNoise);

    const meanSpeed = sumSpeed / N;
    
    // v_rms = sqrt(3 k_B T / m)
    const v_rms = Math.sqrt(3 * GasEngine.K_B * finalTemp / massVal);
    // v_mostProbable = sqrt(2 k_B T / m)
    const v_mostProbable = Math.sqrt(2 * GasEngine.K_B * finalTemp / massVal);

    // 3. Collision Frequency (responsive rolling update every 0.2s)
    if (this.collisionRateTimer > 0.2) {
       // Convert collisions/frame to collisions/sec in physical time
       this.lastCollisionRate = Math.round(this.collisionRateCounter / this.collisionRateTimer);
       this.collisionRateCounter = 0;
       this.collisionRateTimer = 0;
    }

    // Add Poisson-like stochastic fluctuations to collision rate
    const noisyCollisionCount = this.lastCollisionRate + Math.round((Math.random() - 0.5) * Math.sqrt(this.lastCollisionRate || 1) * 1.5);
    const finalCollisionCount = Math.max(0, noisyCollisionCount);

    // 4. Ideal Gas Law (PV = NkT) -> Z = PV / NkT
    const idealPressureSI = (N * GasEngine.K_B * targetTemp) / V_micro;
    const compressibilityZ = (finalPressure * V_micro) / (N * GasEngine.K_B * finalTemp || 1);

    // 5. Dynamic MB speed cap based on RMS to ensure curve fits perfectly
    const maxSpeedCap = Math.max(100, v_rms * 2.2);
    const binCount = 60;
    const binWidth = maxSpeedCap / binCount;
    const speedHistogram = new Array(binCount).fill(0);

    for (let i = 0; i < speeds.length; i++) {
       const s = speeds[i];
       const binIndex = Math.min(binCount - 1, Math.floor(s / binWidth));
       speedHistogram[binIndex]++;
    }
    
    // Normalize density histogram so the area under the curve equals 1
    for (let i = 0; i < speedHistogram.length; i++) {
        speedHistogram[i] = speedHistogram[i] / (N * binWidth);
    }

    // 5b. Kinetic Energy Histogram & Phase Space Points
    const E_mean = (totalKE_micro * ThermodynamicsAnalyzer.ENERGY_SCALE) / N;
    const maxEnergyCap = Math.max(1e-19 * ThermodynamicsAnalyzer.ENERGY_SCALE, E_mean * 3.0);
    const energyBinWidth = maxEnergyCap / binCount;
    const energyHistogram = new Array(binCount).fill(0);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const speedSq = p.vx*p.vx + p.vy*p.vy + p.vz*p.vz;
      const ke_macro = 0.5 * p.mass * speedSq * ThermodynamicsAnalyzer.ENERGY_SCALE;
      const binIndex = Math.min(binCount - 1, Math.floor(ke_macro / energyBinWidth));
      energyHistogram[binIndex]++;
    }

    for (let i = 0; i < energyHistogram.length; i++) {
      energyHistogram[i] = energyHistogram[i] / (N * energyBinWidth);
    }

    const wVal = chamberWidth || 1e-9;
    const phaseSpacePoints = particles.map(p => ({
      x: Math.max(0.0, Math.min(1.0, (p.x - chamberXMin) / wVal)),
      px: p.mass * p.vx * 1e23, // momentum scaled to order of 1 for plotting
      color: p.color
    }));

    // 6. Spatial Shannon Entropy
    const gridDim = 10;
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

    // Theoretical Maximum Entropy depends on accessible volume cells
    // (If confined to 40% of the chamber, only 40 grid cells are accessible)
    const isConfined = (particleMode === "entropy" && entropy !== 0 && cellCounts.slice(40).reduce((a,b)=>a+b, 0) === 0);
    const accessibleCells = isConfined ? 40 : 100;
    const entropyMax = Math.log(accessibleCells);
    const entropyConvergence = Math.max(0, Math.min(100, (entropy / entropyMax) * 100));

    // Entropy Rolling History for Equilibrium Detection
    this.entropyHistory.push(entropy);
    if (this.entropyHistory.length > 100) this.entropyHistory.shift();

    let isEquilibrium = false;
    if (this.entropyHistory.length >= 80) {
      let sum = 0;
      for (const s of this.entropyHistory) sum += s;
      const mean = sum / this.entropyHistory.length;
      let variance = 0;
      for (const s of this.entropyHistory) variance += (s - mean) ** 2;
      const stdDev = Math.sqrt(variance / this.entropyHistory.length);

      if (stdDev < 0.02 && mean > 0.82 * entropyMax) {
        isEquilibrium = true;
      }
    }

    // 7. Van der Waals Theoretical real gas pressure (Part 6)
    // Microscopic b (excluded volume per particle) and a (attraction parameter)
    let a_coeff = 0;
    let b_coeff = 0;
    if (gasPreset === "real") {
      a_coeff = attractiveForce * 1.5e-42; // Pa m^6
      b_coeff = 3.0e-25; // m^3
    } else if (gasPreset === "xenon") {
      a_coeff = 0;
      b_coeff = 5.0e-25; // m^3
    }
    const vdwDenominator = V_micro - N * b_coeff;
    const vanDerWaalsPressureSI = vdwDenominator > 0
      ? (N * GasEngine.K_B * targetTemp) / vdwDenominator - (a_coeff * N * N) / (V_micro * V_micro)
      : idealPressureSI;

    // 8. Diffusion Mixing Rate (0-100%)
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

    // 9. Theoretical Mean Free Path & Collision Frequency
    const rPart = particles[0]?.radius || 4e-9;
    const meanFreePathTheory = V_micro / (4 * Math.sqrt(2) * N * Math.PI * rPart * rPart || 1e-30);

    return {
      measuredPressure: finalPressure * ThermodynamicsAnalyzer.PRES_SCALE,
      idealPressure: idealPressureSI * ThermodynamicsAnalyzer.PRES_SCALE,
      measuredTemp: finalTemp,
      measuredVolume: V_macro_L,
      meanSpeed,
      v_rms,
      v_mostProbable,
      speedHistogram,
      collisionCount: finalCollisionCount,
      meanFreePath: meanFreePathVal * 1e9, // Convert meters to nanometers (pixels) for UI display
      systemEnergy: totalKE_micro * ThermodynamicsAnalyzer.ENERGY_SCALE,
      entropy,
      entropyMax,
      compressibilityZ,
      binWidth,
      diffusionMixing,
      vanDerWaalsPressure: vanDerWaalsPressureSI * ThermodynamicsAnalyzer.PRES_SCALE,
      particlesEscaped: 0,
      temperatureTarget: targetTemp,

      // New statistical mechanics variables
      energyHistogram,
      energyBinWidth,
      phaseSpacePoints,
      microstateOccupancy: cellCounts,
      entropyConvergence,
      isEquilibrium,
      meanFreePathTheory: meanFreePathTheory * 1e9 // in nm
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
    if (kbT <= 0 || mass <= 0) return 0;
    // f(v) = 4 * pi * (m / (2 * pi * k * T))^(3/2) * v^2 * e^(-mv^2 / 2kT)
    const prefactor = 4 * Math.PI * Math.pow(mass / (2 * Math.PI * kbT), 1.5);
    const exponent = -(mass * v * v) / (2 * kbT);
    return prefactor * v * v * Math.exp(exponent);
}

export interface Particle {
  id: number;
  x: number;      // Position in meters (SI)
  y: number;      // Position in meters (SI)
  vx: number;     // Velocity in m/s (SI)
  vy: number;     // Velocity in m/s (SI)
  vz: number;     // Hidden 3D velocity component in m/s (SI)
  mass: number;   // Mass in kg (SI)
  radius: number; // Radius in meters (SI)
  color: string;
}

export interface Bounds {
  xMin: number;   // In meters
  xMax: number;   // In meters
  yMin: number;   // In meters
  yMax: number;   // In meters
}

export interface EngineConfig {
  temperature: number;
  elasticity: number;
  gravity: number;
  friction: number;
  attractiveForce: number;
  dt: number;     // Physical timestep in seconds (SI)
  particleMode?: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy";
  barrierY?: number;      // In meters
  entropyConstraint?: boolean;
  pistonVel?: number;     // In m/s (SI)
}

/**
 * A Spatial Hash Grid for O(N) broad-phase collision detection in meters.
 */
class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Particle[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  public clear() {
    this.grid.clear();
  }

  private hash(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  public insert(p: Particle) {
    const h = this.hash(p.x, p.y);
    let cell = this.grid.get(h);
    if (!cell) {
      cell = [];
      this.grid.set(h, cell);
    }
    cell.push(p);
  }

  public getNearby(p: Particle): Particle[] {
    const cx = Math.floor(p.x / this.cellSize);
    const cy = Math.floor(p.y / this.cellSize);
    const nearby: Particle[] = [];

    // Check current cell and 8 neighbors
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const h = `${cx + i},${cy + j}`;
        const cell = this.grid.get(h);
        if (cell) {
          for (let k = 0; k < cell.length; k++) {
            nearby.push(cell[k]);
          }
        }
      }
    }
    return nearby;
  }
}

export class GasEngine {
  private particles: Particle[] = [];
  private grid: SpatialGrid;
  private mfpPoints: { x: number; y: number }[] = [];
  
  // Real thermodynamics constants (SI)
  public static readonly K_B = 1.380649e-23; // J/K
  public static readonly NA = 6.02214076e23;  // particles/mol
  public static readonly R = 8.314462618;     // J/(mol K)
  public static readonly DEPTH = 1.111111e-7;  // Depth in meters (SI)
  public static readonly TIME_SCALE = 2.5e-10; // Physical time scale factor (seconds/step)

  constructor() {
    // Cell size of 20nm (20e-9 meters) matches standard particle radii (1.5nm - 4.5nm)
    this.grid = new SpatialGrid(20e-9);
  }

  public setParticles(particles: Particle[]) {
    this.particles = particles;
    this.mfpPoints = [];
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getMfpPoints(): { x: number; y: number }[] {
    return this.mfpPoints;
  }

  public getMeanFreePath(): number {
    if (this.mfpPoints.length < 2) return 0;
    let sumDist = 0;
    for (let i = 1; i < this.mfpPoints.length; i++) {
      const dx = this.mfpPoints[i].x - this.mfpPoints[i-1].x;
      const dy = this.mfpPoints[i].y - this.mfpPoints[i-1].y;
      sumDist += Math.sqrt(dx*dx + dy*dy);
    }
    return sumDist / (this.mfpPoints.length - 1);
  }

  /**
   * Randomizes the fake Z-velocity component according to a 1D Maxwell-Boltzmann distribution
   */
  private thermalizeZVelocity(p: Particle, temp: number) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const stdDev = Math.sqrt((GasEngine.K_B * temp) / p.mass);
    p.vz = z0 * stdDev;
  }

  public thermalizeAllZ(temp: number) {
    for (let i = 0; i < this.particles.length; i++) {
      this.thermalizeZVelocity(this.particles[i], temp);
    }
  }

  /**
   * Steps the physics simulation forward by dt (SI units).
   * Returns total momentum transferred to boundaries and collision count.
   */
  public step(config: EngineConfig, bounds: Bounds): { momentumTransferred: number, collisionCount: number } {
    const { dt, gravity, friction, elasticity, temperature, attractiveForce, particleMode, barrierY, entropyConstraint, pistonVel } = config;
    let momentumTransferred = 0;
    let collisionCount = 0;

    // 1. Clear and populate spatial grid
    this.grid.clear();
    for (let i = 0; i < this.particles.length; i++) {
      this.grid.insert(this.particles[i]);
    }

    // 2. Apply forces & Integrate (Euler)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Gravity (scaled to SI values)
      if (gravity > 0) {
        // gravity parameter is scaled to realistic acceleration in m/s^2
        p.vy += gravity * 9.81 * dt;
      }
      
      // Friction (Air Drag in SI)
      if (friction > 0) {
        const drag = Math.max(0, 1 - friction * dt);
        p.vx *= drag;
        p.vy *= drag;
        p.vz *= drag;
      }

      // Move particle in meters
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      let collidedWithWall = false;

      // Left Wall Collision
      if (p.x < bounds.xMin + p.radius) {
        p.x = bounds.xMin + p.radius;
        p.vx = Math.abs(p.vx) * elasticity;
        momentumTransferred += 2 * p.mass * Math.abs(p.vx);
        collisionCount++;
        collidedWithWall = true;
      } 
      // Right Wall (Piston) Collision
      else if (p.x > bounds.xMax - p.radius) {
        const oldVx = p.vx;
        p.x = bounds.xMax - p.radius;
        
        // Piston Collision Physics: vx' = -vx + 2 * pistonVel
        const pVel = pistonVel || 0;
        p.vx = -Math.abs(p.vx) + 2 * pVel;
        
        // If expansion velocity is too high, avoid particle moving outwards
        if (p.vx > 0) {
          p.vx = -p.vx * elasticity;
        }

        momentumTransferred += p.mass * (Math.abs(p.vx) + Math.abs(oldVx));
        collisionCount++;
        collidedWithWall = true;
      }

      // Top Wall Collision
      if (p.y < bounds.yMin + p.radius) {
        p.y = bounds.yMin + p.radius;
        p.vy = Math.abs(p.vy) * elasticity;
        momentumTransferred += 2 * p.mass * Math.abs(p.vy);
        collisionCount++;
        collidedWithWall = true;
      } 
      // Bottom Wall (Diffuse Thermal plate / heating coil)
      else if (p.y > bounds.yMax - p.radius) {
        const oldVy = p.vy;
        p.y = bounds.yMax - p.radius;
        
        // Diffuse reflection: reflected velocities are sampled from a normal thermal distribution at T
        const stdDev = Math.sqrt((GasEngine.K_B * temperature) / p.mass);
        
        // Normal component vy must point upwards (negative)
        let u1 = 0, u2 = 0;
        while(u1 === 0) u1 = Math.random();
        while(u2 === 0) u2 = Math.random();
        const normSample = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        p.vy = -Math.abs(normSample) * stdDev;
        
        // Tangential components vx and vz are fully thermalized
        let u3 = 0, u4 = 0, u5 = 0, u6 = 0;
        while(u3 === 0) u3 = Math.random();
        while(u4 === 0) u4 = Math.random();
        while(u5 === 0) u5 = Math.random();
        while(u6 === 0) u6 = Math.random();
        p.vx = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4) * stdDev;
        p.vz = Math.sqrt(-2.0 * Math.log(u5)) * Math.cos(2.0 * Math.PI * u6) * stdDev;

        momentumTransferred += p.mass * (Math.abs(p.vy) + Math.abs(oldVy));
        collisionCount++;
        collidedWithWall = true;
      }

      // Sliding Partition Barrier for Diffusion Mode
      if (particleMode === "diffusion" && barrierY !== undefined) {
        const center = bounds.xMin + (bounds.xMax - bounds.xMin) * 0.5;
        if (p.y > barrierY) {
          const boundaryBuffer = p.radius + 0.5e-9; // 0.5 nm buffer
          if (Math.abs(p.x - center) < boundaryBuffer) {
            if (p.vx > 0 && p.x < center) {
              p.x = center - boundaryBuffer;
              p.vx = -Math.abs(p.vx) * elasticity;
              collisionCount++;
              collidedWithWall = true;
            } else if (p.vx < 0 && p.x > center) {
              p.x = center + boundaryBuffer;
              p.vx = Math.abs(p.vx) * elasticity;
              collisionCount++;
              collidedWithWall = true;
            }
          }
        }
      }

      // Entropy Low-Entropy Chamber Constraint (left 40% barrier)
      if (particleMode === "entropy" && entropyConstraint) {
        const partitionX = bounds.xMin + (bounds.xMax - bounds.xMin) * 0.4;
        if (p.x > partitionX - p.radius) {
          p.x = partitionX - p.radius;
          p.vx = -Math.abs(p.vx) * elasticity;
          collisionCount++;
          collidedWithWall = true;
        }
      }

      // Add to mfpPoints if it's the tracer particle colliding with a wall
      if (collidedWithWall && particleMode === "mean-free-path" && p.id === 0) {
        this.mfpPoints.push({ x: p.x, y: p.y });
        if (this.mfpPoints.length > 15) this.mfpPoints.shift();
      }
    }

    // 3. Resolve Particle-Particle Collisions using Spatial Grid
    const checked = new Set<string>();

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      const neighbors = this.grid.getNearby(p1);

      for (let j = 0; j < neighbors.length; j++) {
        const p2 = neighbors[j];
        if (p1.id === p2.id) continue;

        // Ensure we only check each pair once
        const pairId = p1.id < p2.id ? `${p1.id}-${p2.id}` : `${p2.id}-${p1.id}`;
        if (checked.has(pairId)) continue;
        checked.add(pairId);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = p1.radius + p2.radius;

        // Attractive forces (Van der Waals 'a' in SI units)
        // a_coeff represents attractive strength per particle pair in Pa m^6
        if (attractiveForce > 0) {
           const attractionCutoff = 15e-9; // 15 nm cutoff in SI
           const dist = Math.sqrt(distSq);
           if (dist > minDist && dist < attractionCutoff) {
              // Medium-range attractive pull scaled to Newtons: F = attractiveForce * 1e-15 N
              const force = (attractiveForce * 1.5e-14) * (attractionCutoff - dist) / dist;
              const ax = force * dx;
              const ay = force * dy;
              p1.vx += (ax / p1.mass) * dt;
              p1.vy += (ay / p1.mass) * dt;
              p2.vx -= (ax / p2.mass) * dt;
              p2.vy -= (ay / p2.mass) * dt;
           }
        }

        // Hard sphere exclusion (2D elastic molecular dynamics collision resolution)
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.1e-9;
          const nx = dx / dist;
          const ny = dy / dist;

          // Relative velocity in 2D
          const kx = p1.vx - p2.vx;
          const ky = p1.vy - p2.vy;

          // Projection along 2D collision normal
          const vn = kx * nx + ky * ny;

          if (vn > 0) {
            const impulse = (2 * vn) / (p1.mass + p2.mass);
            
            p1.vx = (p1.vx - impulse * p2.mass * nx) * elasticity;
            p1.vy = (p1.vy - impulse * p2.mass * ny) * elasticity;
            
            p2.vx = (p2.vx + impulse * p1.mass * nx) * elasticity;
            p2.vy = (p2.vy + impulse * p1.mass * ny) * elasticity;

            collisionCount++;

            // Mean free path collision tracking for tracer particle
            if (particleMode === "mean-free-path" && (p1.id === 0 || p2.id === 0)) {
              const tracer = p1.id === 0 ? p1 : p2;
              this.mfpPoints.push({ x: tracer.x, y: tracer.y });
              if (this.mfpPoints.length > 15) this.mfpPoints.shift();
            }
          }

          // Positional correction to prevent sticking (push apart in 2D space)
          const overlap = minDist - dist;
          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;
          p2.x += nx * overlap * 0.5;
          p2.y += ny * overlap * 0.5;
        }
      }
    }

    // 4. Thermostat (Berendsen) to maintain target temperature over time
    let totalKE = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      // Full 3D Kinetic Energy
      totalKE += 0.5 * p.mass * (p.vx*p.vx + p.vy*p.vy + p.vz*p.vz);
    }
    
    // Target KE for 3D: (3/2) * N * k_b * T
    const targetKE = 1.5 * this.particles.length * GasEngine.K_B * temperature;
    
    if (totalKE > 0) {
      // Small coupling constant (0.02) to let conduction from the thermal bottom wall drive natural profiles
      const thermostatCoeff = 0.02; 
      const scale = Math.sqrt(1 + (targetKE / totalKE - 1) * thermostatCoeff);
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.vx *= scale;
        p.vy *= scale;
        p.vz *= scale;
      }
    }

    return { momentumTransferred, collisionCount };
  }
}

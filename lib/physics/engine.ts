export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  vz: number; // Simulated 3D component for accurate Maxwell-Boltzmann
  mass: number;
  radius: number;
  color: string;
}

export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface EngineConfig {
  temperature: number;
  elasticity: number;
  gravity: number;
  friction: number;
  attractiveForce: number;
  dt: number;
  particleMode?: "normal" | "diffusion" | "brownian" | "mean-free-path" | "entropy";
  barrierY?: number;
  entropyConstraint?: boolean;
}

/**
 * A Spatial Hash Grid for O(N) broad-phase collision detection.
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
  
  // Real thermodynamics constant representation. 
  // We use a pseudo-scale where k_b = 1.5 allows nice visual speeds at T=300K.
  public static readonly K_B = 1.5; 

  constructor() {
    // Cell size of 20px is generally good for particle radii ~ 3-10px
    this.grid = new SpatialGrid(20);
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
   * for the given temperature to maintain correct 3D thermodynamics without visually moving in Z.
   */
  private thermalizeZVelocity(p: Particle, temp: number) {
    // Generate normally distributed random variable using Box-Muller transform
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // std_dev = sqrt(k_B * T / m)
    const stdDev = Math.sqrt((GasEngine.K_B * temp) / p.mass);
    p.vz = z0 * stdDev;
  }

  public thermalizeAllZ(temp: number) {
    for (let i = 0; i < this.particles.length; i++) {
      this.thermalizeZVelocity(this.particles[i], temp);
    }
  }

  /**
   * Steps the physics simulation forward by dt.
   * Returns the total momentum transferred to walls during this step.
   */
  public step(config: EngineConfig, bounds: Bounds): { momentumTransferred: number, collisionCount: number } {
    const { dt, gravity, friction, elasticity, temperature, attractiveForce, particleMode, barrierY, entropyConstraint } = config;
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

      // Gravity
      if (gravity > 0) {
        p.vy += gravity * 0.25 * dt * 60;
      }
      
      // Friction (Air Drag)
      if (friction > 0) {
        const drag = (1 - friction * 0.25 * dt * 60);
        p.vx *= drag;
        p.vy *= drag;
        p.vz *= drag;
      }

      // Move particle
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      let collidedWithWall = false;

      // Wall Collisions
      if (p.x < bounds.xMin + p.radius) {
        p.x = bounds.xMin + p.radius;
        p.vx = Math.abs(p.vx) * elasticity;
        momentumTransferred += 2 * p.mass * Math.abs(p.vx);
        this.thermalizeZVelocity(p, temperature); // Thermalize hidden dimension on wall hit
        collisionCount++;
        collidedWithWall = true;
      } else if (p.x > bounds.xMax - p.radius) {
        p.x = bounds.xMax - p.radius;
        p.vx = -Math.abs(p.vx) * elasticity;
        momentumTransferred += 2 * p.mass * Math.abs(p.vx);
        this.thermalizeZVelocity(p, temperature);
        collisionCount++;
        collidedWithWall = true;
      }

      if (p.y < bounds.yMin + p.radius) {
        p.y = bounds.yMin + p.radius;
        p.vy = Math.abs(p.vy) * elasticity;
        momentumTransferred += 2 * p.mass * Math.abs(p.vy);
        this.thermalizeZVelocity(p, temperature);
        collisionCount++;
        collidedWithWall = true;
      } else if (p.y > bounds.yMax - p.radius) {
        p.y = bounds.yMax - p.radius;
        p.vy = -Math.abs(p.vy) * elasticity;
        momentumTransferred += 2 * p.mass * Math.abs(p.vy);
        this.thermalizeZVelocity(p, temperature);
        collisionCount++;
        collidedWithWall = true;
      }

      // Sliding Partition Barrier for Diffusion Mode
      if (particleMode === "diffusion" && barrierY !== undefined) {
        const center = bounds.xMin + (bounds.xMax - bounds.xMin) * 0.5;
        if (p.y > barrierY) {
          const boundaryBuffer = p.radius + 1.5;
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

        // Attractive forces (Van der Waals 'a')
        if (attractiveForce > 0) {
           const attractionCutoff = 40;
           const dist = Math.sqrt(distSq);
           if (dist > minDist && dist < attractionCutoff) {
              const force = (attractiveForce * 0.12) * (attractionCutoff - dist) / dist;
              const ax = force * dx;
              const ay = force * dy;
              p1.vx += (ax / p1.mass) * dt;
              p1.vy += (ay / p1.mass) * dt;
              p2.vx -= (ax / p2.mass) * dt;
              p2.vy -= (ay / p2.mass) * dt;
           }
        }

        // Hard sphere exclusion (collision)
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          const kx = p1.vx - p2.vx;
          const ky = p1.vy - p2.vy;
          // Note: we don't resolve kz here because it's a 2D physical collision, 
          // vz is purely for statistical 3D thermodynamics.
          const vn = kx * nx + ky * ny;

          if (vn > 0) {
            const impulse = (2 * vn) / (p1.mass + p2.mass);
            
            p1.vx = (p1.vx - impulse * p2.mass * nx) * elasticity;
            p1.vy = (p1.vy - impulse * p2.mass * ny) * elasticity;
            p2.vx = (p2.vx + impulse * p1.mass * nx) * elasticity;
            p2.vy = (p2.vy + impulse * p1.mass * ny) * elasticity;
            
            // Randomize their internal Z velocity as well to mimic full 3D energy transfer
            this.thermalizeZVelocity(p1, temperature);
            this.thermalizeZVelocity(p2, temperature);

            collisionCount++;

            // Mean free path collision tracking for tracer particle
            if (particleMode === "mean-free-path" && (p1.id === 0 || p2.id === 0)) {
              const tracer = p1.id === 0 ? p1 : p2;
              this.mfpPoints.push({ x: tracer.x, y: tracer.y });
              if (this.mfpPoints.length > 15) this.mfpPoints.shift();
            }
          }

          // Positional correction to prevent sticking
          const overlap = minDist - dist;
          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;
          p2.x += nx * overlap * 0.5;
          p2.y += ny * overlap * 0.5;
        }
      }
    }

    // 4. Thermostat (Berendsen) to maintain exact target temperature over time
    // We scale vx, vy, and vz
    let totalKE = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      // Full 3D Kinetic Energy
      totalKE += 0.5 * p.mass * (p.vx*p.vx + p.vy*p.vy + p.vz*p.vz);
    }
    
    // Target KE for 3D: (3/2) * N * k_b * T
    const targetKE = 1.5 * this.particles.length * GasEngine.K_B * temperature;
    
    if (totalKE > 0) {
      const thermostatCoeff = 0.08; 
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

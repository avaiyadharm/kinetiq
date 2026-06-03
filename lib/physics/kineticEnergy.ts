/**
 * Kinetic Energy Physics Engine
 * Scientifically rigorous calculations for all KE simulation modes.
 * All equations use SI units.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
export const G = 9.81;           // m/s² gravitational acceleration
export const C_LIGHT = 2.998e8;  // m/s speed of light
export const K_B = 1.380649e-23; // J/K Boltzmann constant

// ─── Core KE Formula ─────────────────────────────────────────────────────────
/** KE = ½mv² */
export function kineticEnergy(mass: number, velocity: number): number {
  return 0.5 * mass * velocity * velocity;
}

/** Relativistic KE = (γ - 1)mc² where γ = 1/√(1 - v²/c²) */
export function relativisticKE(mass: number, velocity: number): number {
  const beta = Math.min(Math.abs(velocity) / C_LIGHT, 0.9999999);
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  return (gamma - 1) * mass * C_LIGHT * C_LIGHT;
}

/** Lorentz factor γ */
export function lorentzGamma(velocity: number): number {
  const beta = Math.min(Math.abs(velocity) / C_LIGHT, 0.9999999);
  return 1 / Math.sqrt(1 - beta * beta);
}

/** Rotational KE = ½Iω² */
export function rotationalKE(momentOfInertia: number, omega: number): number {
  return 0.5 * momentOfInertia * omega * omega;
}

/** Gravitational PE = mgh */
export function gravitationalPE(mass: number, height: number): number {
  return mass * G * height;
}

/** Power = ΔKE/Δt = F·v */
export function mechanicalPower(force: number, velocity: number): number {
  return force * velocity;
}

// ─── Moment of Inertia ────────────────────────────────────────────────────────
export type RotShape = "disk" | "ring" | "sphere" | "rod" | "hollowSphere" | "cylinder";

export function momentOfInertia(shape: RotShape, mass: number, radius: number, length = 0): number {
  switch (shape) {
    case "disk":        return 0.5 * mass * radius * radius;
    case "ring":        return mass * radius * radius;
    case "sphere":      return (2 / 5) * mass * radius * radius;
    case "hollowSphere":return (2 / 3) * mass * radius * radius;
    case "cylinder":    return 0.5 * mass * radius * radius;
    case "rod":         return (1 / 12) * mass * (length > 0 ? length : radius * 2) ** 2;
    default:            return 0.5 * mass * radius * radius;
  }
}

// ─── Air Drag ─────────────────────────────────────────────────────────────────
/** Drag force = ½ρCdAv² */
export function dragForce(
  velocity: number,
  dragCoeff = 0.47,
  area = 0.07,
  airDensity = 1.225
): number {
  const dir = velocity >= 0 ? -1 : 1;
  return dir * 0.5 * airDensity * dragCoeff * area * velocity * velocity;
}

// ─── Free Particle (1D) ───────────────────────────────────────────────────────
export interface FreeParticleState {
  x: number;       // position m
  v: number;       // velocity m/s
  t: number;       // time s
  appliedForce: number;  // N
  mass: number;    // kg
  friction: number;// kinetic friction coefficient
  surface: boolean;// on surface?
}

export function stepFreeParticle(s: FreeParticleState, dt: number): FreeParticleState {
  const frictionForce = s.surface && s.v !== 0
    ? -Math.sign(s.v) * s.friction * s.mass * G
    : 0;
  const drag = dragForce(s.v);
  const netForce = s.appliedForce + frictionForce + drag;
  const a = netForce / s.mass;
  // Semi-implicit Euler (velocity first, then position)
  const vNew = s.v + a * dt;
  const xNew = s.x + vNew * dt;
  return { ...s, v: vNew, x: xNew, t: s.t + dt };
}

// ─── Inclined Plane ───────────────────────────────────────────────────────────
export interface InclinedPlaneState {
  x: number;           // distance along ramp m
  v: number;           // velocity along ramp m/s
  t: number;
  mass: number;
  angle: number;       // radians
  mu: number;          // friction coefficient
  height: number;      // current height = x * sin(angle)
  trackLength: number; // max ramp length m
}

export function stepInclinedPlane(s: InclinedPlaneState, dt: number): InclinedPlaneState {
  const sinA = Math.sin(s.angle);
  const cosA = Math.cos(s.angle);
  const gravity = -G * sinA;
  const friction = -Math.sign(s.v || 1) * s.mu * G * cosA;
  const a = gravity + friction;
  const vNew = s.v + a * dt;
  let xNew = s.x + vNew * dt;
  let vFinal = vNew;

  if (xNew <= 0) { xNew = 0; vFinal = 0; }
  if (xNew >= s.trackLength) { xNew = s.trackLength; vFinal = 0; }

  return {
    ...s,
    v: vFinal,
    x: xNew,
    height: xNew * sinA,
    t: s.t + dt,
  };
}

// ─── Projectile (2D) ──────────────────────────────────────────────────────────
export interface ProjectileState {
  x: number; y: number;
  vx: number; vy: number;
  t: number;
  mass: number;
  dragEnabled: boolean;
  launched: boolean;
  landed: boolean;
  maxHeight: number;
  range: number;
}

export function stepProjectile(s: ProjectileState, dt: number): ProjectileState {
  if (!s.launched || s.landed) return s;
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  const dragX = s.dragEnabled ? (speed > 0 ? -0.5 * 1.225 * 0.47 * 0.05 * s.vx * speed / s.mass : 0) : 0;
  const dragY = s.dragEnabled ? (speed > 0 ? -0.5 * 1.225 * 0.47 * 0.05 * s.vy * speed / s.mass : 0) : 0;
  const ax = dragX;
  const ay = -G + dragY;
  const vxNew = s.vx + ax * dt;
  const vyNew = s.vy + ay * dt;
  const xNew = s.x + vxNew * dt;
  const yNew = s.y + vyNew * dt;
  const maxH = Math.max(s.maxHeight, yNew);
  if (yNew <= 0 && s.t > 0.1) {
    return { ...s, x: xNew, y: 0, vx: vxNew, vy: 0, t: s.t + dt, landed: true, maxHeight: maxH, range: xNew };
  }
  return { ...s, x: xNew, y: Math.max(0, yNew), vx: vxNew, vy: vyNew, t: s.t + dt, maxHeight: maxH };
}

// ─── Collision (1D, two-body) ─────────────────────────────────────────────────
export interface CollisionBody {
  x: number;
  v: number;
  mass: number;
  radius: number; // visual m
}

export interface CollisionState {
  b1: CollisionBody;
  b2: CollisionBody;
  e: number;        // coeff of restitution 0-1
  t: number;
  hasCollided: boolean;
  collisionCount: number;
  KEBefore: number;
  KEAfter: number;
  wallBounce: boolean;
  trackWidth: number; // normalized 0-1 → real scale = 10m
}

export function stepCollision(s: CollisionState, dt: number): CollisionState {
  let { b1, b2, e, t, hasCollided, collisionCount, KEBefore, KEAfter, wallBounce } = s;
  const SCALE = s.trackWidth; // m

  // Move
  let x1 = b1.x + b1.v * dt;
  let x2 = b2.x + b2.v * dt;
  let v1 = b1.v, v2 = b2.v;
  let hc = hasCollided, cc = collisionCount, keb = KEBefore, kea = KEAfter;

  // Wall bounces
  if (x1 - b1.radius <= 0) { x1 = b1.radius; v1 = Math.abs(v1) * e; }
  if (x1 + b1.radius >= SCALE) { x1 = SCALE - b1.radius; v1 = -Math.abs(v1) * e; }
  if (x2 - b2.radius <= 0) { x2 = b2.radius; v2 = Math.abs(v2) * e; }
  if (x2 + b2.radius >= SCALE) { x2 = SCALE - b2.radius; v2 = -Math.abs(v2) * e; }

  // Body-body collision
  const gap = Math.abs(x2 - x1) - b1.radius - b2.radius;
  if (gap <= 0) {
    const m1 = b1.mass, m2 = b2.mass;
    keb = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    const v1New = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
    const v2New = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
    v1 = v1New; v2 = v2New;
    kea = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    hc = true;
    cc += 1;
    // Separate overlapping bodies
    const overlap = -(gap);
    x1 -= overlap * 0.5 * Math.sign(x1 - x2);
    x2 += overlap * 0.5 * Math.sign(x2 - x1);
  }

  return {
    ...s,
    b1: { ...b1, x: x1, v: v1 },
    b2: { ...b2, x: x2, v: v2 },
    t: t + dt,
    hasCollided: hc,
    collisionCount: cc,
    KEBefore: keb,
    KEAfter: kea,
  };
}

// ─── Rotational Dynamics ──────────────────────────────────────────────────────
export interface RotationalState {
  theta: number;    // angle rad
  omega: number;    // angular velocity rad/s
  alpha: number;    // angular acceleration rad/s²
  t: number;
  mass: number;
  radius: number;
  shape: RotShape;
  torque: number;   // N·m
  friction: number; // rotational friction (N·m)
  I: number;        // moment of inertia
}

export function stepRotational(s: RotationalState, dt: number): RotationalState {
  const I = momentOfInertia(s.shape, s.mass, s.radius);
  const frictionTorque = -Math.sign(s.omega) * s.friction;
  const netTorque = s.torque + frictionTorque;
  const alpha = I > 0 ? netTorque / I : 0;
  const omegaNew = s.omega + alpha * dt;
  const thetaNew = s.theta + omegaNew * dt;
  return { ...s, I, alpha, omega: omegaNew, theta: thetaNew, t: s.t + dt };
}

// ─── Roller Coaster ───────────────────────────────────────────────────────────
export interface RollerCoasterState {
  s: number;     // arc-length along track m
  v: number;     // speed m/s
  t: number;
  mass: number;
  mu: number;    // rolling friction
  totalLength: number;
}

export interface TrackPoint { x: number; y: number; curvature: number; }

/** Simplified roller coaster on a pre-defined sinusoidal track */
export function getTrackY(trackPoints: TrackPoint[], s: number): number {
  if (trackPoints.length === 0) return 0;
  const total = trackPoints[trackPoints.length - 1].x;
  const t = (s % total + total) % total;
  const idx = trackPoints.findIndex(p => p.x >= t);
  if (idx <= 0) return trackPoints[0]?.y ?? 0;
  const a = trackPoints[idx - 1], b = trackPoints[idx];
  const frac = (t - a.x) / (b.x - a.x);
  return a.y + frac * (b.y - a.y);
}

export function buildRollerCoasterTrack(numPoints = 200, totalLen = 60): TrackPoint[] {
  const pts: TrackPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * totalLen;
    // Design: starts high, loop in middle, valley at end
    const y =
      10 * Math.exp(-x / 8)  +
      4 * Math.sin((x / totalLen) * Math.PI * 2) +
      2 * Math.cos((x / totalLen) * Math.PI * 4) +
      (x < 5 ? (5 - x) * 2 : 0);
    pts.push({ x, y, curvature: 0 });
  }
  // Normalize so minimum is 0
  const minY = Math.min(...pts.map(p => p.y));
  return pts.map(p => ({ ...p, y: p.y - minY }));
}

export function stepRollerCoaster(s: RollerCoasterState, track: TrackPoint[], dt: number): RollerCoasterState {
  const yNow = getTrackY(track, s.s);
  const yAhead = getTrackY(track, s.s + 0.01);
  const slope = (yAhead - yNow) / 0.01; // dy/ds
  const sinTheta = Math.max(-1, Math.min(1, slope / Math.sqrt(1 + slope * slope)));

  const gravityAlong = -G * sinTheta;
  const frictionAlong = -Math.sign(s.v) * s.mu * G * Math.abs(Math.cos(Math.asin(sinTheta)));
  const a = gravityAlong + frictionAlong;

  let vNew = s.v + a * dt;
  if (vNew < 0) vNew = 0; // no backward rolling for simplicity
  let sNew = s.s + vNew * dt;
  if (sNew >= s.totalLength) sNew = 0; // loop

  return { ...s, v: vNew, s: sNew, t: s.t + dt };
}

// ─── History Buffer ───────────────────────────────────────────────────────────
export interface HistoryPoint {
  t: number;
  ke: number;
  pe: number;
  v: number;
  momentum: number;
  power: number;
  totalE: number;
  thermalLoss: number;
}

export function makeHistoryPoint(
  t: number, mass: number, v: number,
  height = 0, thermalLoss = 0, force = 0
): HistoryPoint {
  const ke = kineticEnergy(mass, v);
  const pe = gravitationalPE(mass, height);
  return {
    t, ke, pe, v,
    momentum: mass * v,
    power: mechanicalPower(force, v),
    totalE: ke + pe,
    thermalLoss,
  };
}

// ─── Vehicle Scale Reference ──────────────────────────────────────────────────
export interface VehicleEntry {
  name: string;
  mass: number;     // kg
  speed: number;    // m/s
  color: string;
  icon: string;
}

export const VEHICLES: VehicleEntry[] = [
  { name: "Baseball",   mass: 0.145,    speed: 44.7,  color: "#f59e0b", icon: "⚾" },
  { name: "Human",      mass: 75,       speed: 7,     color: "#06b6d4", icon: "🏃" },
  { name: "Car",        mass: 1500,     speed: 30,    color: "#8b5cf6", icon: "🚗" },
  { name: "Race Car",   mass: 750,      speed: 90,    color: "#ef4444", icon: "🏎️" },
  { name: "Bullet",     mass: 0.004,    speed: 900,   color: "#ec4899", icon: "🔫" },
  { name: "Train",      mass: 500000,   speed: 55,    color: "#10b981", icon: "🚄" },
  { name: "Rocket",     mass: 549054,   speed: 9800,  color: "#f97316", icon: "🚀" },
  { name: "Asteroid",   mass: 1.4e12,   speed: 20000, color: "#6366f1", icon: "☄️" },
];

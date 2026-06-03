import { create } from "zustand";
import {
  FreeParticleState, InclinedPlaneState, ProjectileState, CollisionState,
  RotationalState, RollerCoasterState, HistoryPoint, TrailPt,
  stepFreeParticleVerlet, stepInclinedPlane, stepProjectile, stepCollision,
  stepRotational, stepRollerCoaster, buildRollerCoasterTrack, TrackPoint,
  makeHistoryPoint, kineticEnergy, gravitationalPE, rotationalKE, momentOfInertia,
  addTrailPoint, collisionPreset, CollisionPreset,
  VEHICLES, VehicleEntry,
} from "@/lib/physics/kineticEnergy";

export type KEMode =
  | "freeparticle"
  | "inclinedplane"
  | "projectile"
  | "collision"
  | "rollercoaster"
  | "rotational"
  | "vehicle";

const HISTORY_MAX = 600;
const TRAIL_MAX = 120;

// ─── Callout System ───────────────────────────────────────────────────────────
export interface Callout {
  id: string;
  text: string;
  subtext?: string;
  color: string;
  icon: string;
  expires: number; // performance.now() ms
}

// ─── Shockwave Effect ─────────────────────────────────────────────────────────
export interface ShockwaveEffect {
  x: number; y: number;
  r: number; maxR: number;
  opacity: number;
  color: string;
  active: boolean;
}

// ─── Default States ───────────────────────────────────────────────────────────
const defaultFP: FreeParticleState = {
  x: 0.5, v: 5, t: 0, appliedForce: 20, mass: 5, friction: 0.2, surface: true,
};
const defaultIP: InclinedPlaneState = {
  x: 0, v: 0, t: 0, mass: 5, angle: Math.PI / 6, mu: 0.15,
  height: 0, trackLength: 8,
};
const defaultProj: ProjectileState = {
  x: 0, y: 0, vx: 0, vy: 0, t: 0, mass: 0.5, dragEnabled: true,
  launched: false, landed: false, maxHeight: 0, range: 0,
};
const defaultColl: CollisionState = {
  b1: { x: 2, v: 6, mass: 3, radius: 0.3 },
  b2: { x: 8, v: -3, mass: 5, radius: 0.4 },
  e: 1.0, t: 0, hasCollided: false, collisionCount: 0,
  KEBefore: 0, KEAfter: 0, wallBounce: true, trackWidth: 10,
};
const defaultRot: RotationalState = {
  theta: 0, omega: 0, alpha: 0, t: 0, mass: 5, radius: 0.3,
  shape: "disk", torque: 2, friction: 0.05,
  I: momentOfInertia("disk", 5, 0.3),
};
const defaultRC: RollerCoasterState = {
  s: 0, v: 0.1, t: 0, mass: 10, mu: 0.02, totalLength: 60,
};

// ─── Store Interface ──────────────────────────────────────────────────────────
interface KEStore {
  mode: KEMode;
  isPlaying: boolean;
  playbackSpeed: number;
  globalTime: number;

  // Per-mode physics states
  fp: FreeParticleState;
  ip: InclinedPlaneState;
  proj: ProjectileState;
  coll: CollisionState;
  rot: RotationalState;
  rc: RollerCoasterState;
  rcTrack: TrackPoint[];

  // Projectile launch parameters
  launchAngle: number;
  launchSpeed: number;

  // Vehicle comparison
  selectedVehicles: string[];
  vehicles: VehicleEntry[];

  // History
  history: HistoryPoint[];

  // Trail buffer
  trail: TrailPt[];

  // Camera shake
  shakeIntensity: number;

  // Active callout
  callouts: Callout[];

  // Shockwaves
  shockwaves: ShockwaveEffect[];

  // Previous KE for callout detection
  prevKE: number;
  prevVelocity: number;

  // Collision replay buffer
  collisionReplayBuffer: CollisionState[];
  isReplayMode: boolean;
  replayFrame: number;

  // Visualization toggles
  showVelocityVectors: boolean;
  showForceVectors: boolean;
  showEnergyBar: boolean;
  showGrid: boolean;
  showTrail: boolean;
  showEquationPanel: boolean;
  showCallouts: boolean;
  scientificMode: boolean;
  vehicleLogScale: boolean;

  // ── Actions ──────────────────────────────────────────────────────────
  setMode: (m: KEMode) => void;
  setPlaying: (p: boolean) => void;
  setPlaybackSpeed: (s: number) => void;
  tick: (dt: number) => void;
  reset: () => void;

  // Mode-specific setters
  setFP: (patch: Partial<FreeParticleState>) => void;
  setIP: (patch: Partial<InclinedPlaneState>) => void;
  setProj: (patch: Partial<ProjectileState>) => void;
  setColl: (patch: Partial<CollisionState>) => void;
  setRot: (patch: Partial<RotationalState>) => void;
  setRC: (patch: Partial<RollerCoasterState>) => void;

  setLaunchParams: (angle: number, speed: number) => void;
  launchProjectile: () => void;
  applyCollisionPreset: (preset: CollisionPreset) => void;

  addCallout: (c: Omit<Callout, "id" | "expires">) => void;
  dismissCallout: (id: string) => void;
  addShockwave: (sw: Omit<ShockwaveEffect, "r" | "opacity" | "active">) => void;
  tickEffects: (dt: number) => void;

  startReplay: () => void;
  stopReplay: () => void;

  setToggle: (key: "showVelocityVectors" | "showForceVectors" | "showEnergyBar" | "showGrid" | "showTrail" | "showEquationPanel" | "showCallouts" | "scientificMode" | "vehicleLogScale", val: boolean) => void;
  toggleVehicle: (name: string) => void;

  // Live equation data
  liveEquation: {
    formula: string;
    substituted: string;
    result: string;
    value: number;
  };
}

// ─── Store Implementation ─────────────────────────────────────────────────────
export const useKEStore = create<KEStore>((set, get) => ({
  mode: "freeparticle",
  isPlaying: false,
  playbackSpeed: 1.0,
  globalTime: 0,

  fp: { ...defaultFP },
  ip: { ...defaultIP },
  proj: { ...defaultProj },
  coll: { ...defaultColl },
  rot: { ...defaultRot },
  rc: { ...defaultRC },
  rcTrack: buildRollerCoasterTrack(),

  launchAngle: 45,
  launchSpeed: 20,

  selectedVehicles: ["Car", "Bullet", "Rocket", "Train"],
  vehicles: VEHICLES,

  history: [],
  trail: [],

  shakeIntensity: 0,
  callouts: [],
  shockwaves: [],

  prevKE: 0,
  prevVelocity: 0,

  collisionReplayBuffer: [],
  isReplayMode: false,
  replayFrame: 0,

  showVelocityVectors: true,
  showForceVectors: true,
  showEnergyBar: true,
  showGrid: true,
  showTrail: true,
  showEquationPanel: true,
  showCallouts: true,
  scientificMode: false,
  vehicleLogScale: true,

  liveEquation: {
    formula: "KE = ½mv²",
    substituted: "KE = ½ × ? × ?²",
    result: "KE = ? J",
    value: 0,
  },

  // ── Actions ─────────────────────────────────────────────────────────
  setMode: (m) => set({ mode: m, history: [], trail: [], callouts: [], shakeIntensity: 0 }),
  setPlaying: (p) => set({ isPlaying: p }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),

  setFP: (patch) => set(s => ({ fp: { ...s.fp, ...patch } })),
  setIP: (patch) => set(s => {
    const merged = { ...s.ip, ...patch };
    if ("angle" in patch) merged.height = merged.x * Math.sin(merged.angle);
    return { ip: merged };
  }),
  setProj: (patch) => set(s => ({ proj: { ...s.proj, ...patch } })),
  setColl: (patch) => set(s => ({ coll: { ...s.coll, ...patch } })),
  setRot: (patch) => set(s => ({
    rot: {
      ...s.rot,
      ...patch,
      I: momentOfInertia(
        ("shape" in patch ? patch.shape! : s.rot.shape),
        ("mass" in patch ? patch.mass! : s.rot.mass),
        ("radius" in patch ? patch.radius! : s.rot.radius),
      )
    }
  })),
  setRC: (patch) => set(s => ({ rc: { ...s.rc, ...patch } })),

  setLaunchParams: (angle, speed) => set({ launchAngle: angle, launchSpeed: speed }),
  launchProjectile: () => {
    const { launchAngle, launchSpeed, proj } = get();
    const rad = (launchAngle * Math.PI) / 180;
    set({
      proj: {
        ...proj, x: 0, y: 0,
        vx: launchSpeed * Math.cos(rad),
        vy: launchSpeed * Math.sin(rad),
        t: 0, launched: true, landed: false, maxHeight: 0, range: 0,
      },
      isPlaying: true,
      trail: [],
    });
  },

  applyCollisionPreset: (preset) => {
    const patch = collisionPreset(preset);
    set(s => ({
      coll: { ...s.coll, ...patch, hasCollided: false, collisionCount: 0, KEBefore: 0, KEAfter: 0, t: 0 },
      trail: [], history: [],
    }));
  },

  addCallout: (c) => {
    const id = `callout_${Date.now()}_${Math.random()}`;
    set(s => ({
      callouts: [
        ...s.callouts.filter(x => x.text !== c.text),
        { ...c, id, expires: Date.now() + 3500 }
      ].slice(-3),
    }));
  },

  dismissCallout: (id) => set(s => ({ callouts: s.callouts.filter(c => c.id !== id) })),

  addShockwave: (sw) => set(s => ({
    shockwaves: [...s.shockwaves.filter(w => w.active), { ...sw, r: 0, opacity: 1, active: true }].slice(-4),
  })),

  tickEffects: (dt) => {
    set(s => {
      // Decay shake
      const shake = Math.max(0, s.shakeIntensity - dt * 12);
      // Advance shockwaves
      const sws = s.shockwaves.map(sw => {
        if (!sw.active) return sw;
        const r = sw.r + 280 * dt;
        const opacity = Math.max(0, 1 - r / sw.maxR);
        return { ...sw, r, opacity, active: opacity > 0 };
      });
      // Expire callouts
      const now = Date.now();
      const callouts = s.callouts.filter(c => c.expires > now);
      return { shakeIntensity: shake, shockwaves: sws, callouts };
    });
  },

  startReplay: () => {
    const { collisionReplayBuffer } = get();
    if (collisionReplayBuffer.length > 0) {
      set({ isReplayMode: true, replayFrame: 0, isPlaying: false });
    }
  },
  stopReplay: () => set({ isReplayMode: false }),

  setToggle: (key, val) => set({ [key]: val }),
  toggleVehicle: (name) => set(s => {
    const sel = s.selectedVehicles.includes(name)
      ? s.selectedVehicles.filter(v => v !== name)
      : [...s.selectedVehicles, name];
    return { selectedVehicles: sel };
  }),

  tick: (rawDt) => {
    const s = get();
    if (s.isReplayMode) {
      const nextFrame = s.replayFrame + 1;
      if (nextFrame >= s.collisionReplayBuffer.length) {
        set({ isReplayMode: false, replayFrame: 0 });
        return;
      }
      set({ coll: s.collisionReplayBuffer[nextFrame], replayFrame: nextFrame });
      return;
    }
    if (!s.isPlaying) return;
    const dt = Math.min(rawDt, 0.05) * s.playbackSpeed;

    get().tickEffects(rawDt);

    let histPoint: HistoryPoint | null = null;

    switch (s.mode) {
      case "freeparticle": {
        const fp = stepFreeParticleVerlet(s.fp, dt);
        const x = ((fp.x % 10) + 10) % 10;
        const newFP = { ...fp, x };
        const ke = kineticEnergy(newFP.mass, newFP.v);

        // Callout: velocity doubled → KE quadrupled
        if (s.prevVelocity > 1 && Math.abs(newFP.v) > s.prevVelocity * 1.95 && Math.abs(newFP.v) < s.prevVelocity * 2.05) {
          get().addCallout({ text: "v × 2 → KE × 4!", subtext: `${s.prevVelocity.toFixed(1)} → ${newFP.v.toFixed(1)} m/s`, color: "#f59e0b", icon: "⚡" });
        }

        set({
          fp: newFP, globalTime: newFP.t,
          prevKE: ke, prevVelocity: Math.abs(newFP.v),
          trail: s.showTrail ? addTrailPoint(s.trail, x / 10, 0.5, ke, TRAIL_MAX) : s.trail,
          liveEquation: {
            formula: "KE = ½mv²",
            substituted: `KE = ½ × ${newFP.mass.toFixed(1)} × ${Math.abs(newFP.v).toFixed(2)}²`,
            result: `KE = ${ke.toFixed(3)} J`,
            value: ke,
          },
        });
        histPoint = makeHistoryPoint(newFP.t, newFP.mass, newFP.v, 0, 0, newFP.appliedForce);
        break;
      }

      case "inclinedplane": {
        const ip = stepInclinedPlane(s.ip, dt);
        const ke = kineticEnergy(ip.mass, ip.v);
        const pe = gravitationalPE(ip.mass, ip.height);

        // Callout: block reaches bottom
        if (ip.x < 0.05 && s.ip.x > 0.1 && ip.v > 0.5) {
          get().addCallout({ text: "PE → KE Complete!", subtext: `v = √(2gh) = ${ip.v.toFixed(2)} m/s`, color: "#10b981", icon: "🎯" });
          get().addShockwave({ x: 0.1, y: 0.9, maxR: 120, color: "#3b82f6" });
          set({ shakeIntensity: Math.min(8, ip.v * 0.3) });
        }

        set({
          ip, globalTime: ip.t,
          trail: s.showTrail ? addTrailPoint(s.trail, ip.x / ip.trackLength, 1 - ip.height / 10, ke, TRAIL_MAX) : s.trail,
          liveEquation: {
            formula: "PE + KE = E_total",
            substituted: `${pe.toFixed(1)} + ${ke.toFixed(1)} = ${(pe + ke).toFixed(1)} J`,
            result: `E = ${(pe + ke).toFixed(3)} J`,
            value: pe + ke,
          },
        });
        histPoint = makeHistoryPoint(ip.t, ip.mass, ip.v, ip.height);
        break;
      }

      case "projectile": {
        if (s.proj.landed || !s.proj.launched) return;
        const proj = stepProjectile(s.proj, dt);
        const speed = Math.sqrt(proj.vx ** 2 + proj.vy ** 2);
        const ke = kineticEnergy(proj.mass, speed);
        const pe = gravitationalPE(proj.mass, proj.y);

        if (proj.landed && !s.proj.landed) {
          get().addCallout({ text: "IMPACT!", subtext: `KE = ${ke.toFixed(1)} J at landing`, color: "#ef4444", icon: "💥" });
          get().addShockwave({ x: 0.1, y: 0.9, maxR: 150, color: "#f59e0b" });
          set({ shakeIntensity: Math.min(12, speed * 0.2) });
        }

        set({
          proj, globalTime: proj.t,
          trail: s.showTrail ? addTrailPoint(s.trail, proj.x, proj.y, ke, TRAIL_MAX) : s.trail,
          liveEquation: {
            formula: "KE = ½mv²",
            substituted: `KE = ½ × ${proj.mass.toFixed(2)} × ${speed.toFixed(2)}²`,
            result: `KE = ${ke.toFixed(3)} J`,
            value: ke,
          },
        });
        histPoint = makeHistoryPoint(proj.t, proj.mass, speed, proj.y);
        break;
      }

      case "collision": {
        const prevCollCount = s.coll.collisionCount;
        const coll = stepCollision(s.coll, dt);
        const totalKE = kineticEnergy(coll.b1.mass, coll.b1.v) + kineticEnergy(coll.b2.mass, coll.b2.v);
        const totalMom = coll.b1.mass * coll.b1.v + coll.b2.mass * coll.b2.v;

        // New collision event detected
        if (coll.collisionCount > prevCollCount) {
          const keLost = Math.max(0, coll.KEBefore - coll.KEAfter);
          const contactX = (coll.b1.x + coll.b2.x) / 2 / coll.trackWidth;
          get().addShockwave({ x: contactX, y: 0.5, maxR: 160, color: coll.e === 1 ? "#3b82f6" : "#f97316" });
          const impulse = Math.abs(coll.b1.mass * (coll.b1.v - s.coll.b1.v));
          set({ shakeIntensity: Math.min(15, impulse * 0.5) });

          if (coll.e === 1) {
            get().addCallout({ text: "Elastic Collision!", subtext: "KE conserved: Σ½mv² unchanged", color: "#3b82f6", icon: "⚡" });
          } else if (coll.e === 0) {
            get().addCallout({ text: "Perfectly Inelastic!", subtext: `ΔKE = -${keLost.toFixed(1)} J lost to heat`, color: "#f97316", icon: "🔥" });
          } else {
            get().addCallout({ text: `e = ${coll.e.toFixed(2)}`, subtext: `ΔKE = -${keLost.toFixed(1)} J dissipated`, color: "#f59e0b", icon: "💢" });
          }

          // Buffer last 90 frames for replay
          set({ collisionReplayBuffer: [] });
        }

        // Build replay buffer (record last 90 pre-collision states)
        const newReplayBuffer = coll.collisionCount > 0
          ? [...s.collisionReplayBuffer, coll].slice(-90)
          : [...s.collisionReplayBuffer, coll].slice(-90);

        set({
          coll, globalTime: coll.t,
          collisionReplayBuffer: newReplayBuffer,
          liveEquation: {
            formula: "Σp = m₁v₁ + m₂v₂",
            substituted: `Σp = ${(coll.b1.mass * coll.b1.v).toFixed(2)} + ${(coll.b2.mass * coll.b2.v).toFixed(2)}`,
            result: `Σp = ${totalMom.toFixed(3)} kg·m/s`,
            value: totalMom,
          },
        });
        histPoint = {
          t: coll.t, ke: totalKE, pe: 0,
          v: Math.abs(coll.b1.v),
          momentum: totalMom,
          power: 0, totalE: totalKE,
          thermalLoss: Math.max(0, coll.KEBefore - coll.KEAfter),
        };
        break;
      }

      case "rotational": {
        const rot = stepRotational(s.rot, dt);
        const ke = rotationalKE(rot.I, rot.omega);

        set({
          rot, globalTime: rot.t,
          liveEquation: {
            formula: "KE_rot = ½Iω²",
            substituted: `KE = ½ × ${rot.I.toFixed(4)} × ${rot.omega.toFixed(3)}²`,
            result: `KE = ${ke.toFixed(4)} J`,
            value: ke,
          },
        });
        histPoint = { t: rot.t, ke, pe: 0, v: rot.omega, momentum: rot.I * rot.omega, power: rot.torque * rot.omega, totalE: ke, thermalLoss: 0 };
        break;
      }

      case "rollercoaster": {
        const rc = stepRollerCoaster(s.rc, s.rcTrack, dt);
        const tIdx = Math.round((rc.s / rc.totalLength) * (s.rcTrack.length - 1));
        const tp = s.rcTrack[Math.max(0, Math.min(tIdx, s.rcTrack.length - 1))];
        const ke = kineticEnergy(rc.mass, rc.v);
        const pe = gravitationalPE(rc.mass, tp?.y ?? 0);

        // Callout at valley (max speed)
        const prevTIdx = Math.round((s.rc.s / s.rc.totalLength) * (s.rcTrack.length - 1));
        const prevTp = s.rcTrack[Math.max(0, Math.min(prevTIdx, s.rcTrack.length - 1))];
        if (tp && prevTp && tp.y < 0.5 && prevTp.y > 1 && rc.v > 2) {
          get().addCallout({ text: "Max Speed at Valley!", subtext: `v = ${rc.v.toFixed(2)} m/s`, color: "#3b82f6", icon: "⚡" });
          set({ shakeIntensity: Math.min(6, rc.v * 0.15) });
        }

        set({
          rc, globalTime: rc.t,
          trail: s.showTrail ? addTrailPoint(s.trail, rc.s / rc.totalLength, tp?.y ?? 0, ke, TRAIL_MAX) : s.trail,
          liveEquation: {
            formula: "PE + KE = E₀",
            substituted: `${pe.toFixed(1)} + ${ke.toFixed(1)} = ${(pe + ke).toFixed(1)} J`,
            result: `v = ${rc.v.toFixed(3)} m/s`,
            value: ke,
          },
        });
        histPoint = makeHistoryPoint(rc.t, rc.mass, rc.v, tp?.y ?? 0);
        break;
      }
    }

    if (histPoint) {
      set(st => ({
        history: st.history.length >= HISTORY_MAX
          ? [...st.history.slice(1), histPoint!]
          : [...st.history, histPoint!],
      }));
    }
  },

  reset: () => {
    set({
      isPlaying: false,
      history: [],
      trail: [],
      globalTime: 0,
      shakeIntensity: 0,
      callouts: [],
      shockwaves: [],
      prevKE: 0,
      prevVelocity: 0,
      collisionReplayBuffer: [],
      isReplayMode: false,
      replayFrame: 0,
      fp: { ...defaultFP },
      ip: { ...defaultIP },
      proj: { ...defaultProj },
      coll: { ...defaultColl },
      rot: { ...defaultRot },
      rc: { ...defaultRC },
      liveEquation: {
        formula: "KE = ½mv²",
        substituted: "KE = ½ × ? × ?²",
        result: "KE = ? J",
        value: 0,
      },
    });
  },
}));

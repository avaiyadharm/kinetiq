import { create } from "zustand";
import {
  FreeParticleState, InclinedPlaneState, ProjectileState, CollisionState,
  RotationalState, RollerCoasterState, HistoryPoint,
  stepFreeParticle, stepInclinedPlane, stepProjectile, stepCollision,
  stepRotational, stepRollerCoaster, buildRollerCoasterTrack, TrackPoint,
  makeHistoryPoint, kineticEnergy, gravitationalPE, rotationalKE, momentOfInertia,
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

  // Projectile launch parameters (separate from flying state)
  launchAngle: number;   // degrees
  launchSpeed: number;   // m/s

  // Vehicle comparison
  selectedVehicles: string[];
  vehicles: VehicleEntry[];

  // History
  history: HistoryPoint[];

  // Visualization toggles
  showVelocityVectors: boolean;
  showForceVectors: boolean;
  showEnergyBar: boolean;
  showGrid: boolean;
  showTrail: boolean;

  // Scientific mode
  scientificMode: boolean;

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

  setToggle: (key: "showVelocityVectors" | "showForceVectors" | "showEnergyBar" | "showGrid" | "showTrail" | "scientificMode", val: boolean) => void;
  toggleVehicle: (name: string) => void;
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

  selectedVehicles: ["Car", "Bullet", "Rocket"],
  vehicles: VEHICLES,

  history: [],

  showVelocityVectors: true,
  showForceVectors: true,
  showEnergyBar: true,
  showGrid: true,
  showTrail: true,
  scientificMode: false,

  // ── Actions ─────────────────────────────────────────────────────────
  setMode: (m) => set({ mode: m, history: [] }),
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
        ...proj,
        x: 0, y: 0,
        vx: launchSpeed * Math.cos(rad),
        vy: launchSpeed * Math.sin(rad),
        t: 0, launched: true, landed: false, maxHeight: 0, range: 0,
      },
      isPlaying: true,
    });
  },

  setToggle: (key, val) => set({ [key]: val }),
  toggleVehicle: (name) => set(s => {
    const sel = s.selectedVehicles.includes(name)
      ? s.selectedVehicles.filter(v => v !== name)
      : [...s.selectedVehicles, name];
    return { selectedVehicles: sel };
  }),

  tick: (rawDt) => {
    const s = get();
    if (!s.isPlaying) return;
    const dt = Math.min(rawDt, 0.05) * s.playbackSpeed;

    let histPoint: HistoryPoint | null = null;

    switch (s.mode) {
      case "freeparticle": {
        const fp = stepFreeParticle(s.fp, dt);
        // Wrap position for continuous demo
        const x = ((fp.x % 10) + 10) % 10;
        const newFP = { ...fp, x };
        set({ fp: newFP, globalTime: newFP.t });
        histPoint = makeHistoryPoint(newFP.t, newFP.mass, newFP.v, 0, 0, newFP.appliedForce);
        break;
      }
      case "inclinedplane": {
        const ip = stepInclinedPlane(s.ip, dt);
        set({ ip, globalTime: ip.t });
        histPoint = makeHistoryPoint(ip.t, ip.mass, ip.v, ip.height);
        break;
      }
      case "projectile": {
        if (s.proj.landed || !s.proj.launched) return;
        const proj = stepProjectile(s.proj, dt);
        set({ proj, globalTime: proj.t });
        const speed = Math.sqrt(proj.vx ** 2 + proj.vy ** 2);
        histPoint = makeHistoryPoint(proj.t, proj.mass, speed, proj.y);
        break;
      }
      case "collision": {
        const coll = stepCollision(s.coll, dt);
        set({ coll, globalTime: coll.t });
        const totalKE = kineticEnergy(coll.b1.mass, coll.b1.v) + kineticEnergy(coll.b2.mass, coll.b2.v);
        histPoint = {
          t: coll.t, ke: totalKE, pe: 0,
          v: Math.abs(coll.b1.v),
          momentum: coll.b1.mass * coll.b1.v + coll.b2.mass * coll.b2.v,
          power: 0, totalE: totalKE, thermalLoss: Math.max(0, coll.KEBefore - coll.KEAfter),
        };
        break;
      }
      case "rotational": {
        const rot = stepRotational(s.rot, dt);
        set({ rot, globalTime: rot.t });
        const ke = rotationalKE(rot.I, rot.omega);
        histPoint = { t: rot.t, ke, pe: 0, v: rot.omega, momentum: rot.I * rot.omega, power: rot.torque * rot.omega, totalE: ke, thermalLoss: 0 };
        break;
      }
      case "rollercoaster": {
        const rc = stepRollerCoaster(s.rc, s.rcTrack, dt);
        set({ rc, globalTime: rc.t });
        const trackY = s.rcTrack.length > 0
          ? (s.rcTrack[Math.round((rc.s / rc.totalLength) * (s.rcTrack.length - 1))]?.y ?? 0)
          : 0;
        histPoint = makeHistoryPoint(rc.t, rc.mass, rc.v, trackY);
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
    const { mode } = get();
    set({
      isPlaying: false,
      history: [],
      globalTime: 0,
      fp: { ...defaultFP },
      ip: { ...defaultIP },
      proj: { ...defaultProj },
      coll: { ...defaultColl },
      rot: { ...defaultRot },
      rc: { ...defaultRC },
    });
  },
}));

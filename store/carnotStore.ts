import { create } from "zustand";
import { CycleStage } from "@/lib/physics/carnot";

interface CarnotState {
  TH: number;
  TC: number;
  V1: number;
  V2: number;
  n: number;
  
  isPlaying: boolean;
  playbackSpeed: number; // multiplier
  
  currentStage: CycleStage;
  stageProgress: number; // 0 to 1
  globalTime: number;

  setTH: (t: number) => void;
  setTC: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setPlaybackSpeed: (s: number) => void;
  tick: (dt: number) => void;
  reset: () => void;
}

const STAGES: CycleStage[] = [
  "ISOTHERMAL_EXPANSION", 
  "ADIABATIC_EXPANSION", 
  "ISOTHERMAL_COMPRESSION", 
  "ADIABATIC_COMPRESSION"
];

export const useCarnotStore = create<CarnotState>((set, get) => ({
  TH: 500,
  TC: 300,
  V1: 2.0,
  V2: 6.0,
  n: 1.0,

  isPlaying: true,
  playbackSpeed: 1.0,

  currentStage: "ISOTHERMAL_EXPANSION",
  stageProgress: 0,
  globalTime: 0,

  setTH: (t) => set({ TH: Math.max(t, get().TC + 10) }),
  setTC: (t) => set({ TC: Math.min(t, get().TH - 10) }),
  setPlaying: (p) => set({ isPlaying: p }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),

  tick: (dt) => {
    const state = get();
    if (!state.isPlaying) return;

    // dt is wall time in seconds. We map it to cycle progress.
    // Let's say one full cycle takes 10 seconds at 1.0x speed.
    // So 1 stage takes 2.5 seconds.
    const stageDuration = 2.5 / state.playbackSpeed;
    const progressDelta = dt / stageDuration;

    let newProgress = state.stageProgress + progressDelta;
    let newStage = state.currentStage;

    if (newProgress >= 1.0) {
      newProgress -= 1.0;
      const currentIdx = STAGES.indexOf(newStage);
      newStage = STAGES[(currentIdx + 1) % STAGES.length];
    }

    set({
      stageProgress: newProgress,
      currentStage: newStage,
      globalTime: state.globalTime + dt
    });
  },

  reset: () => set({
    currentStage: "ISOTHERMAL_EXPANSION",
    stageProgress: 0,
    globalTime: 0,
    isPlaying: false
  })
}));

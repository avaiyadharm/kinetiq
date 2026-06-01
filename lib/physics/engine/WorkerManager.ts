// ============================================================
// PHYSICS WORKER MANAGER
// Orchestrates background execution of FEA and PDE solvers.
// ============================================================

import { processPhysicsMessage } from "../physics.worker";

export type WorkerMessage = 
  | { type: "INIT", payload: any }
  | { type: "STEP", dt: number, targetTemp: number }
  | { type: "RESET" }
  | { type: "SET_MATERIAL", materialId: string }
  | { type: "SET_CONSTRAINT", constraint: string };

export type WorkerResponse = 
  | { type: "STATE_UPDATE", payload: any }
  | { type: "LOG", message: string, level: "info" | "warn" | "error" };

export class PhysicsWorkerManager {
  private worker: Worker | null = null;
  private isFallback = false;
  private onStateUpdate: ((state: any) => void) | null = null;
  private onLog: ((msg: string, level: string) => void) | null = null;

  // The main physics loop now runs synchronously via PhysicsEngine.
  // The worker is kept alive for future high-fidelity FEA but its
  // STATE_UPDATE responses do NOT overwrite the thermal profile
  // (the synchronous path owns that state to avoid race conditions).
  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL("../physics.worker.ts", import.meta.url));
      
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        // Only forward LOG messages — do NOT forward STATE_UPDATE as it
        // would overwrite the synchronous physics engine's correct thermal profile.
        if (msg.type === "LOG" && this.onLog) {
          this.onLog(msg.message, msg.level);
        }
        // STATE_UPDATE is intentionally suppressed here.
      };
    } catch (e) {
      console.warn("Worker instantiation failed, falling back to synchronous execution.");
      this.isFallback = true;
    }
  }

  public setCallbacks(onStateUpdate: (s: any) => void, onLog: (msg: string, level: string) => void) {
    this.onStateUpdate = onStateUpdate;
    this.onLog = onLog;
  }

  public send(msg: WorkerMessage) {
    if (this.worker) {
      this.worker.postMessage(msg);
    } else if (this.isFallback) {
      // Synchronous fallback
      processPhysicsMessage(msg, (res: WorkerResponse) => {
        if (res.type === "STATE_UPDATE" && this.onStateUpdate) {
          this.onStateUpdate(res.payload);
        } else if (res.type === "LOG" && this.onLog) {
          this.onLog(res.message, res.level);
        }
      });
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

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

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    // In a real Next.js app, we would load a compiled worker script.
    // For this architectural implementation, we stub the worker logic internally,
    // or load from a bundled public script.
    // Assuming /physics.worker.js is built from a corresponding worker entrypoint.
    
    try {
      this.worker = new Worker(new URL("./physics.worker.ts", import.meta.url));
      
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.type === "STATE_UPDATE" && this.onStateUpdate) {
          this.onStateUpdate(msg.payload);
        } else if (msg.type === "LOG" && this.onLog) {
          this.onLog(msg.message, msg.level);
        }
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

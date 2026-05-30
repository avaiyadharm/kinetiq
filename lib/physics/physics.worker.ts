// ============================================================
// PHYSICS WEB WORKER
// Executes FEA PDE solvers in background thread.
// ============================================================

import { Mesh } from "./engine/mesh/MeshGenerator";
import { ThermalSolver } from "./engine/solvers/ThermalSolver";
import { MechanicalSolver } from "./engine/solvers/MechanicalSolver";

// State
let currentMesh: Mesh | null = null;
let targetT = 293.15;
let heatingMode = "uniform";

export function processPhysicsMessage(msg: any, postMessage: (res: any) => void) {
  try {
    switch (msg.type) {
      case "INIT":
        // Initialize a 1D bar mesh for thermal expansion simulation
        currentMesh = Mesh.generate1DBar(msg.payload.L0, 40, msg.payload.materialId, 293.15);
        // Set constraints based on mode
        if (msg.payload.constraint === "fixed") {
          currentMesh.nodes[0].fixedX = true;
          currentMesh.nodes[currentMesh.nodes.length - 1].fixedX = true;
        } else if (msg.payload.constraint === "free") {
          currentMesh.nodes[Math.floor(currentMesh.nodes.length / 2)].fixedX = true; // Pin center to avoid rigid body motion
        }
        postMessage({ type: "LOG", message: "FEA Mesh Initialized (40 Elements, 1D Truss)", level: "info" });
        break;
        
      case "STEP":
        if (!currentMesh) return;
        
        const { dt } = msg;
        targetT = msg.targetTemp;
        
        // 1. Boundary Conditions
        const N = currentMesh.nodes.length;
        if (heatingMode === "left") {
          currentMesh.nodes[0].fixedT = true;
          currentMesh.nodes[0].T = targetT;
        } else if (heatingMode === "both") {
          currentMesh.nodes[0].fixedT = true;
          currentMesh.nodes[0].T = targetT;
          currentMesh.nodes[N - 1].fixedT = true;
          currentMesh.nodes[N - 1].T = targetT;
        } else {
          // Uniform volumetric heating (source term)
          for (const n of currentMesh.nodes) {
            n.q = (targetT - n.T) * 10.0; // Proportional heating
          }
        }
        
        // 2. Solve Heat Equation (Implicit Euler)
        ThermalSolver.step1DImplicit(currentMesh, dt);
        
        // 3. Solve Mechanical Equilibrium (Static FEA)
        // Assume nominal area = pi*r^2
        MechanicalSolver.solve1DStatic(currentMesh, Math.PI * Math.pow(0.025, 2));
        
        // 4. Extract data arrays for main thread
        const T_array = currentMesh.nodes.map(n => n.T);
        const U_array = currentMesh.nodes.map(n => n.ux);
        const S_array = new Float64Array(N); // Nodal stress by averaging elements
        
        for (let i = 0; i < N; i++) {
          let str = 0;
          let count = 0;
          if (i > 0) { str += currentMesh.elements[i - 1].stressTensor![0]; count++; }
          if (i < N - 1) { str += currentMesh.elements[i].stressTensor![0]; count++; }
          S_array[i] = str / count;
        }
        
        // Average Temp
        const avgT = T_array.reduce((a, b) => a + b, 0) / N;
        // Total displacement (length change)
        const deltaL = currentMesh.nodes[N - 1].ux - currentMesh.nodes[0].ux;
        // Stress at boundary
        const constraintStress = S_array[0];
        
        postMessage({
          type: "STATE_UPDATE",
          payload: {
            thermalProfile: T_array,
            displacementProfile: U_array,
            stressProfile: Array.from(S_array),
            avgTemperature: avgT,
            realDeltaL: deltaL,
            stressAtConstraint: constraintStress
          }
        });
        
        break;
        
      case "SET_MATERIAL":
        if (currentMesh) {
          currentMesh.elements.forEach(el => el.materialId = msg.materialId);
        }
        break;
    }
  } catch (err: any) {
    postMessage({ type: "LOG", message: `Worker Error: ${err.message}`, level: "error" });
  }
}

// Keep the standard web worker listener for environments where it works
if (typeof self !== "undefined" && typeof window === "undefined") {
  self.onmessage = (e: MessageEvent) => {
    processPhysicsMessage(e.data, (res) => self.postMessage(res));
  };
}

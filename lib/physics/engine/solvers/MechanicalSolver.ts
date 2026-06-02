// ============================================================
// FEA MECHANICAL SOLVER
// Solves [K]{u} = {F_thermal} for displacements and computes stresses
// ============================================================

import { Mesh } from "../mesh/MeshGenerator";
import { MatrixBuilder, SparseSolver } from "./SparseSolver";
import { MATERIAL_DB, PhysicsEngine } from "../../thermalExpansion";

export class MechanicalSolver {
  
  // Solves 1D mechanical equilibrium
  // [K]{u} = {F_th} + {F_ext}
  static solve1DStatic(mesh: Mesh, crossSectionArea: number): { iterations: number, error: number } {
    const N = mesh.nodes.length;
    const builder = new MatrixBuilder(N);
    const rhs = new Float64Array(N);
    
    // Assemble global stiffness and thermal load vector
    for (const el of mesh.elements) {
      if (el.type !== "truss1d") continue;
      
      const n1 = mesh.nodes[el.nodeIds[0]];
      const n2 = mesh.nodes[el.nodeIds[1]];
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      const L = Math.abs(n2.x - n1.x);
      const A = crossSectionArea;
      
      // Average element temperature
      const T_el = (n1.T + n2.T) / 2;
      const E = PhysicsEngine.youngsModulus(mat, T_el);
      const alpha = PhysicsEngine.alpha(mat, T_el);
      
      // Elemental Stiffness: Ke = (E*A/L) * [1, -1; -1, 1]
      const k_el = (E * A) / L;
      const Ke = [
        [k_el, -k_el],
        [-k_el, k_el]
      ];
      
      // Thermal Strain & Load
      // F_th = \int B^T E ε_th dV
      const eps_th = alpha * (T_el - PhysicsEngine.T_REF);
      const F_th_mag = E * A * eps_th; // Force magnitude
      const Fe_th = [-F_th_mag, F_th_mag]; // Tension pushes outward
      
      const idx = [n1.id, n2.id];
      
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          builder.add(idx[i], idx[j], Ke[i][j]);
        }
        rhs[idx[i]] += Fe_th[i];
      }
    }
    
    // Apply Boundary Conditions & External Forces
    const penalty = 1e15;
    for (const node of mesh.nodes) {
      if (node.fixedX) {
        builder.add(node.id, node.id, penalty);
        // rhs keeps 0 to enforce u_x = 0
      } else if (node.fx !== 0) {
        rhs[node.id] += node.fx;
      }
      
      if (node.springK !== undefined) {
        builder.add(node.id, node.id, node.springK);
      }
    }
    
    // First solve (predictor)
    let K_csr = builder.toCSR();
    let result = SparseSolver.solveCG(K_csr, rhs, new Float64Array(N));
    
    // Check contact (gap)
    let contactOccurred = false;
    for (const node of mesh.nodes) {
      if (node.gapLimit !== undefined && result.x[node.id] > node.gapLimit) {
        // Enforce displacement = gapLimit
        builder.add(node.id, node.id, penalty);
        rhs[node.id] += penalty * node.gapLimit;
        contactOccurred = true;
      }
    }
    
    // Solve again if contact occurred
    if (contactOccurred) {
      K_csr = builder.toCSR();
      result = SparseSolver.solveCG(K_csr, rhs, new Float64Array(N));
    }
    
    // Update mesh displacements
    for (let i = 0; i < N; i++) {
      mesh.nodes[i].ux = result.x[i];
    }
    
    // Post-processing: Compute elemental stresses and strains
    for (const el of mesh.elements) {
      if (el.type !== "truss1d") continue;
      
      const n1 = mesh.nodes[el.nodeIds[0]];
      const n2 = mesh.nodes[el.nodeIds[1]];
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      const L = Math.abs(n2.x - n1.x);
      const T_el = (n1.T + n2.T) / 2;
      
      const E = PhysicsEngine.youngsModulus(mat, T_el);
      const alpha = PhysicsEngine.alpha(mat, T_el);
      
      // Total Strain = (u2 - u1) / L
      const eps_total = (n2.ux - n1.ux) / L;
      
      // Thermal Strain
      const eps_th = alpha * (T_el - PhysicsEngine.T_REF);
      
      // Mechanical Strain = Total - Thermal
      const eps_mech = eps_total - eps_th;
      
      // Stress (1D Hooke's Law)
      const sigma = E * eps_mech;
      
      // Store in element
      el.stressTensor = [sigma, 0, 0];
      el.strainTensor = [eps_total, 0, 0];
      el.thermalStrain = [eps_th, 0, 0];
      
      // Yield check
      const sigma_y = PhysicsEngine.yieldStrength(mat, T_el);
      el.yielded = Math.abs(sigma) > sigma_y;
    }
    
    return { iterations: result.iterations, error: result.error };
  }
}

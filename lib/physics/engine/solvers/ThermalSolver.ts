// ============================================================
// FEA THERMAL SOLVER
// Solves transient heat equation using Implicit Euler / Crank-Nicolson
// ============================================================

import { Mesh } from "../mesh/MeshGenerator";
import { MatrixBuilder, SparseSolver } from "./SparseSolver";
import { MATERIAL_DB, PhysicsEngine } from "../../thermalExpansion";

export class ThermalSolver {
  
  // Solves 1D heat diffusion using Finite Elements (Linear Bar Elements)
  // [C]{T_dot} + [K]{T} = {F}
  // Implicit Euler: (C + dt*K) T_new = C*T_old + dt*F
  static step1DImplicit(mesh: Mesh, dt: number): void {
    const N = mesh.nodes.length;
    const builder = new MatrixBuilder(N);
    const rhs = new Float64Array(N);
    
    // Assemble global matrices
    for (const el of mesh.elements) {
      if (el.type !== "truss1d") continue;
      
      const n1 = mesh.nodes[el.nodeIds[0]];
      const n2 = mesh.nodes[el.nodeIds[1]];
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      const L = Math.abs(n2.x - n1.x);
      const A = 1.0; // Assume unit area for 1D temperature profile
      
      const k_cond = mat.thermalConductivity;
      const rho_cp = mat.density * mat.specificHeat;
      
      // Elemental Thermal Stiffness (Conduction)
      // Ke = (k*A/L) * [1, -1; -1, 1]
      const k_el = (k_cond * A) / L;
      
      // Elemental Thermal Mass (Capacity)
      // Ce = (rho*cp*A*L/6) * [2, 1; 1, 2]
      const c_el = (rho_cp * A * L) / 6.0;
      
      const idx = [n1.id, n2.id];
      const T_old = [n1.T, n2.T];
      
      // Ke matrix definition
      const Ke = [
        [k_el, -k_el],
        [-k_el, k_el]
      ];
      
      // Ce matrix definition
      const Ce = [
        [2 * c_el, c_el],
        [c_el, 2 * c_el]
      ];
      
      // Assemble (C + dt*K) into LHS, and (C*T_old + dt*Q) into RHS
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const lhs_val = Ce[i][j] + dt * Ke[i][j];
          builder.add(idx[i], idx[j], lhs_val);
          
          rhs[idx[i]] += Ce[i][j] * T_old[j];
        }
      }
    }
    
    // Apply Boundary Conditions (Dirichlet)
    // Penalty method for fixed temperatures
    const penalty = 1e12;
    for (const node of mesh.nodes) {
      if (node.fixedT) {
        builder.add(node.id, node.id, penalty);
        rhs[node.id] += penalty * node.T; // keep at current T
      } else if (node.q !== 0) {
        // Apply nodal heat source
        rhs[node.id] += dt * node.q;
      }
    }
    
    // Solve system
    const A_csr = builder.toCSR();
    const result = SparseSolver.solveCG(A_csr, rhs, new Float64Array(mesh.nodes.map(n => n.T)));
    
    // Update mesh temperatures
    for (let i = 0; i < N; i++) {
      mesh.nodes[i].T = result.x[i];
    }
  }
}

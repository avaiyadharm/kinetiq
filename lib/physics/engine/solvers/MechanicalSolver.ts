// ============================================================
// FEA MECHANICAL SOLVER (1D & 2D)
// Solves [K]{u} = {F_thermal} for displacements and computes stresses
// ============================================================

import { Mesh } from "../mesh/MeshGenerator";
import { MatrixBuilder, SparseSolver } from "./SparseSolver";
import { MATERIAL_DB, PhysicsEngine } from "../../thermalExpansion";

export class MechanicalSolver {
  
  // Solves 1D mechanical equilibrium
  // [K]{u} = {F_th} + {F_ext}
  static solve1DStatic(mesh: Mesh, crossSectionArea: number): { iterations: number; error: number; solveTimeMs: number; yieldedElementCount: number } {
    const t0 = performance.now();
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
      mesh.nodes[i].uy = 0; // 1D is only x
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
      
      const eps_total = (n2.ux - n1.ux) / L;
      const eps_th = alpha * (T_el - PhysicsEngine.T_REF);
      const eps_mech = eps_total - eps_th;
      const sigma = E * eps_mech;
      
      el.stressTensor = [sigma, 0, 0];
      el.strainTensor = [eps_total, 0, 0];
      el.thermalStrain = [eps_th, 0, 0];
      
      const sigma_y = PhysicsEngine.yieldStrength(mat, T_el);
      el.yielded = Math.abs(sigma) > sigma_y;
    }
    
    const yieldedElementCount = mesh.elements.filter(e => e.type === "truss1d" && e.yielded).length;
    return { iterations: result.iterations, error: result.error, solveTimeMs: performance.now() - t0, yieldedElementCount };
  }

  // Solves 2D plane stress mechanics
  // Equations: [K]{u} = {F_th}
  static solve2DStatic(mesh: Mesh, thickness: number): { iterations: number; error: number; solveTimeMs: number; yieldedElementCount: number } {
    const t0 = performance.now();
    const N = mesh.nodes.length;
    const size = 2 * N; // 2 DOFs per node: u_x, u_y
    const builder = new MatrixBuilder(size);
    const rhs = new Float64Array(size);
    
    // Gauss points and weights for 2x2 integration
    const gp = [-1 / Math.sqrt(3), 1 / Math.sqrt(3)];
    
    const shapeDerivatives = (xi: number, eta: number) => ({
      dN_dxi: [
        -0.25 * (1 - eta),
         0.25 * (1 - eta),
         0.25 * (1 + eta),
        -0.25 * (1 + eta)
      ],
      dN_deta: [
        -0.25 * (1 - xi),
        -0.25 * (1 + xi),
         0.25 * (1 + xi),
         0.25 * (1 - xi)
      ]
    });

    // Assemble global stiffness matrix and thermal load vector
    for (const el of mesh.elements) {
      if (el.type !== "quad2d") continue;
      
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      // Get the 4 nodes of the element
      const nodes = el.nodeIds.map(id => mesh.nodes[id]);
      
      // Average element temperature
      const T_el = nodes.reduce((sum, n) => sum + n.T, 0) / 4;
      
      const E = PhysicsEngine.youngsModulus(mat, T_el);
      const alpha = PhysicsEngine.alpha(mat, T_el);
      const nu = mat.poissonsRatio;
      
      // Plane stress constitutive matrix D
      const factor = E / (1 - nu * nu);
      const D = [
        [factor, factor * nu, 0],
        [factor * nu, factor, 0],
        [0, 0, factor * (1 - nu) / 2]
      ];
      
      const Ke = Array.from({ length: 8 }, () => new Float64Array(8));
      const Fe_th = new Float64Array(8);
      
      // 2x2 Gauss Quadrature Integration
      for (let k = 0; k < 2; k++) {
        for (let l = 0; l < 2; l++) {
          const xi = gp[k];
          const eta = gp[l];
          const { dN_dxi, dN_deta } = shapeDerivatives(xi, eta);
          
          let dx_dxi = 0, dy_dxi = 0, dx_deta = 0, dy_deta = 0;
          for (let i = 0; i < 4; i++) {
            dx_dxi += dN_dxi[i] * nodes[i].x;
            dy_dxi += dN_dxi[i] * nodes[i].y;
            dx_deta += dN_deta[i] * nodes[i].x;
            dy_deta += dN_deta[i] * nodes[i].y;
          }
          
          const detJ = dx_dxi * dy_deta - dx_deta * dy_dxi;
          if (Math.abs(detJ) < 1e-15) continue;
          
          const invJ = [
            [ dy_deta / detJ, -dy_dxi / detJ],
            [-dx_deta / detJ,  dx_dxi / detJ]
          ];
          
          const dN_dx = new Array(4);
          const dN_dy = new Array(4);
          for (let i = 0; i < 4; i++) {
            dN_dx[i] = invJ[0][0] * dN_dxi[i] + invJ[0][1] * dN_deta[i];
            dN_dy[i] = invJ[1][0] * dN_dxi[i] + invJ[1][1] * dN_deta[i];
          }
          
          const dVolume = detJ * thickness;
          
          // Strain-displacement matrix B (3x8)
          const B = [
            [dN_dx[0], 0, dN_dx[1], 0, dN_dx[2], 0, dN_dx[3], 0],
            [0, dN_dy[0], 0, dN_dy[1], 0, dN_dy[2], 0, dN_dy[3]],
            [dN_dy[0], dN_dx[0], dN_dy[1], dN_dx[1], dN_dy[2], dN_dx[2], dN_dy[3], dN_dx[3]]
          ];
          
          // Compute D * B (3x8)
          const DB = Array.from({ length: 3 }, () => new Float64Array(8));
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
              for (let m = 0; m < 3; m++) {
                DB[r][c] += D[r][m] * B[m][c];
              }
            }
          }
          
          // Add B^T * D * B to Ke
          for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
              let sum = 0;
              for (let m = 0; m < 3; m++) {
                sum += B[m][i] * DB[m][j];
              }
              Ke[i][j] += sum * dVolume;
            }
          }
          
          // Thermal Load F_th = \int B^T D ε_th dV
          const eps_th = alpha * (T_el - PhysicsEngine.T_REF);
          // For plane stress: D * ε_th = [E*α*ΔT/(1-ν), E*α*ΔT/(1-ν), 0]^T
          const th_factor = (E * eps_th) / (1 - nu);
          const D_eps_th = [th_factor, th_factor, 0];
          
          for (let i = 0; i < 8; i++) {
            let sum = 0;
            for (let m = 0; m < 3; m++) {
              sum += B[m][i] * D_eps_th[m];
            }
            Fe_th[i] += sum * dVolume;
          }
        }
      }
      
      // Global DOF mapping
      const dofs = [
        2 * el.nodeIds[0], 2 * el.nodeIds[0] + 1,
        2 * el.nodeIds[1], 2 * el.nodeIds[1] + 1,
        2 * el.nodeIds[2], 2 * el.nodeIds[2] + 1,
        2 * el.nodeIds[3], 2 * el.nodeIds[3] + 1
      ];
      
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          builder.add(dofs[i], dofs[j], Ke[i][j]);
        }
        rhs[dofs[i]] += Fe_th[i];
      }
    }
    
    // Apply Boundary Conditions & Nodal Constraints
    const penalty = 1e15;
    for (const node of mesh.nodes) {
      const dofX = 2 * node.id;
      const dofY = 2 * node.id + 1;
      
      if (node.fixedX) {
        builder.add(dofX, dofX, penalty);
        // rhs[dofX] is kept 0 to enforce ux = 0
      } else if (node.fx !== 0) {
        rhs[dofX] += node.fx;
      }
      
      if (node.fixedY) {
        builder.add(dofY, dofY, penalty);
        // rhs[dofY] is kept 0 to enforce uy = 0
      } else if (node.fy !== 0) {
        rhs[dofY] += node.fy;
      }
      
      // Spring boundary condition (axial spring in x-direction)
      if (node.springK !== undefined) {
        builder.add(dofX, dofX, node.springK);
      }
    }
    
    // Predictor Pass
    let K_csr = builder.toCSR();
    let result = SparseSolver.solveCG(K_csr, rhs, new Float64Array(size));
    
    // Corrector Pass (Contact gap limits)
    let contactOccurred = false;
    for (const node of mesh.nodes) {
      const dofX = 2 * node.id;
      if (node.gapLimit !== undefined && result.x[dofX] > node.gapLimit) {
        builder.add(dofX, dofX, penalty);
        rhs[dofX] += penalty * node.gapLimit;
        contactOccurred = true;
      }
    }
    
    if (contactOccurred) {
      K_csr = builder.toCSR();
      result = SparseSolver.solveCG(K_csr, rhs, new Float64Array(size));
    }
    
    // Update displacements on mesh nodes
    for (let i = 0; i < N; i++) {
      mesh.nodes[i].ux = result.x[2 * i];
      mesh.nodes[i].uy = result.x[2 * i + 1];
    }
    
    // Post-processing: Compute element stresses and strains at element centers (xi=0, eta=0)
    for (const el of mesh.elements) {
      if (el.type !== "quad2d") continue;
      
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      const nodes = el.nodeIds.map(id => mesh.nodes[id]);
      const T_el = nodes.reduce((sum, n) => sum + n.T, 0) / 4;
      const E = PhysicsEngine.youngsModulus(mat, T_el);
      const alpha = PhysicsEngine.alpha(mat, T_el);
      const nu = mat.poissonsRatio;
      
      // Shape derivatives at center
      const dN_dxi = [-0.25, 0.25, 0.25, -0.25];
      const dN_deta = [-0.25, -0.25, 0.25, 0.25];
      
      let dx_dxi = 0, dy_dxi = 0, dx_deta = 0, dy_deta = 0;
      for (let i = 0; i < 4; i++) {
        dx_dxi += dN_dxi[i] * nodes[i].x;
        dy_dxi += dN_dxi[i] * nodes[i].y;
        dx_deta += dN_deta[i] * nodes[i].x;
        dy_deta += dN_deta[i] * nodes[i].y;
      }
      
      const detJ = dx_dxi * dy_deta - dx_deta * dy_dxi;
      if (Math.abs(detJ) < 1e-15) continue;
      
      const invJ = [
        [ dy_deta / detJ, -dy_dxi / detJ],
        [-dx_deta / detJ,  dx_dxi / detJ]
      ];
      
      const dN_dx = new Array(4);
      const dN_dy = new Array(4);
      for (let i = 0; i < 4; i++) {
        dN_dx[i] = invJ[0][0] * dN_dxi[i] + invJ[0][1] * dN_deta[i];
        dN_dy[i] = invJ[1][0] * dN_dxi[i] + invJ[1][1] * dN_deta[i];
      }
      
      // Compute total strains: eps = B * u
      let eps_xx = 0, eps_yy = 0, gamma_xy = 0;
      for (let i = 0; i < 4; i++) {
        eps_xx += dN_dx[i] * nodes[i].ux;
        eps_yy += dN_dy[i] * nodes[i].uy;
        gamma_xy += dN_dy[i] * nodes[i].ux + dN_dx[i] * nodes[i].uy;
      }
      
      // Thermal strains
      const eps_th = alpha * (T_el - PhysicsEngine.T_REF);
      
      // Mechanical strains = total - thermal
      const eps_mech_xx = eps_xx - eps_th;
      const eps_mech_yy = eps_yy - eps_th;
      const gamma_mech_xy = gamma_xy;
      
      // Calculate stresses (plane stress constitutive relation)
      const factor = E / (1 - nu * nu);
      const sigma_xx = factor * (eps_mech_xx + nu * eps_mech_yy);
      const sigma_yy = factor * (eps_mech_yy + nu * eps_mech_xx);
      const tau_xy = (E / (2 * (1 + nu))) * gamma_mech_xy;
      
      // Von Mises stress: σ_vm = sqrt(σ_xx² - σ_xx*σ_yy + σ_yy² + 3*τ_xy²)
      const sigma_vm = Math.sqrt(
        sigma_xx * sigma_xx - sigma_xx * sigma_yy + sigma_yy * sigma_yy + 3 * tau_xy * tau_xy
      );
      
      // Store elemental tensors
      el.stressTensor = [sigma_xx, sigma_yy, tau_xy];
      el.strainTensor = [eps_xx, eps_yy, gamma_xy];
      el.thermalStrain = [eps_th, eps_th, 0];
      
      const sigma_y = PhysicsEngine.yieldStrength(mat, T_el);
      el.yielded = sigma_vm > sigma_y;
    }
    
    const yieldedElementCount = mesh.elements.filter(e => e.type === "quad2d" && e.yielded).length;
    return { iterations: result.iterations, error: result.error, solveTimeMs: performance.now() - t0, yieldedElementCount };
  }
}

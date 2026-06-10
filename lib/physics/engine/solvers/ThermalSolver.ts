// ============================================================
// FEA THERMAL SOLVER (1D & 2D)
// Solves transient heat equation using Implicit Euler.
// Supports Robin convective cooling and radiative cooling.
// ============================================================

import { Mesh } from "../mesh/MeshGenerator";
import { MatrixBuilder, SparseSolver } from "./SparseSolver";
import { MATERIAL_DB, PhysicsEngine } from "../../thermalExpansion";

export class ThermalSolver {
  
  // Stefan-Boltzmann constant W/(m²·K⁴)
  static readonly SIGMA_SB = 5.670374419e-8;

  // 1D Heat Conduction Solver with surface cooling
  // [C]{T_dot} + [K]{T} = {F}
  // Implicit Euler: (C + dt*K) T_new = C*T_old + dt*(F_source - F_cool)
  static step1DImplicit(
    mesh: Mesh,
    dt: number,
    diameter = 0.05,
    h_conv = 15.0,
    T_ambient = 293.15
  ): { iterations: number; error: number; heatInputRate: number; heatLossRate: number; solveTimeMs: number } {
    const t0 = performance.now();
    const N = mesh.nodes.length;
    const builder = new MatrixBuilder(N);
    const rhs = new Float64Array(N);
    
    // Geometry step size
    const L = Math.abs(mesh.nodes[N - 1].x - mesh.nodes[0].x);
    const dx = L / (N - 1);
    const A_cross = Math.PI * (diameter / 2) ** 2;

    // Assemble global matrices
    for (const el of mesh.elements) {
      if (el.type !== "truss1d") continue;
      
      const n1 = mesh.nodes[el.nodeIds[0]];
      const n2 = mesh.nodes[el.nodeIds[1]];
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      // Local elemental properties — temperature-dependent k(T) and cp(T)
      const T_el = (n1.T + n2.T) / 2;
      const k_cond = PhysicsEngine.thermalConductivity(mat, T_el);
      const rho_cp = PhysicsEngine.densityAtT(mat, T_el) * PhysicsEngine.specificHeatCapacity(mat, T_el);
      
      // Elemental Thermal Stiffness (Conduction)
      const k_el = (k_cond * A_cross) / dx;
      
      // Elemental Thermal Mass (Capacity)
      const c_el = (rho_cp * A_cross * dx) / 6.0;
      
      const idx = [n1.id, n2.id];
      const T_old = [n1.T, n2.T];
      
      const Ke = [
        [k_el, -k_el],
        [-k_el, k_el]
      ];
      
      const Ce = [
        [2 * c_el, c_el],
        [c_el, 2 * c_el]
      ];
      
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const lhs_val = Ce[i][j] + dt * Ke[i][j];
          builder.add(idx[i], idx[j], lhs_val);
          rhs[idx[i]] += Ce[i][j] * T_old[j];
        }
      }
    }
    
    // Add Convective and Radiative Surface Cooling (Robin/Stefan-Boltzmann BCs)
    let totalHeatLoss = 0;
    const perimeter = Math.PI * diameter;
    
    for (let i = 0; i < N; i++) {
      const node = mesh.nodes[i];
      const mat = MATERIAL_DB[mesh.elements[0].materialId];
      const emissivity = mat ? mat.emissivity : 0.5;
      
      // Compute node exposed area
      // Cylinder side area + end cap area for ends
      let nodeArea = perimeter * dx;
      if (i === 0 || i === N - 1) {
        nodeArea = perimeter * (dx / 2) + A_cross;
      }
      
      // Convection rate: q_conv = h * A * (T - T_amb)
      const q_conv = h_conv * nodeArea * (node.T - T_ambient);
      // Radiation rate: q_rad = eps * sigma * A * (T^4 - T_amb^4)
      const q_rad = emissivity * this.SIGMA_SB * nodeArea * (node.T ** 4 - T_ambient ** 4);
      
      const q_lost = q_conv + q_rad;
      rhs[node.id] -= dt * q_lost;
      totalHeatLoss += q_lost;
      
      // Apply direct heat source term (if any)
      if (node.q !== 0 && !node.fixedT) {
        rhs[node.id] += dt * node.q;
      }
    }
    
    // Apply Boundary Conditions (Dirichlet via Penalty Method)
    const penalty = 1e12;
    let totalHeatInput = 0;
    for (const node of mesh.nodes) {
      if (node.fixedT) {
        builder.add(node.id, node.id, penalty);
        rhs[node.id] += penalty * node.T;
      }
    }
    
    // Solve system
    const A_csr = builder.toCSR();
    const T_prev = new Float64Array(mesh.nodes.map(n => n.T));
    const result = SparseSolver.solveCG(A_csr, rhs, T_prev);
    
    // Calculate heat input rate using First Law: Q_in = dE/dt + Q_lost
    // Compute change in internal thermal energy
    let dEnergy = 0;
    for (let i = 0; i < N; i++) {
      const node = mesh.nodes[i];
      const mat = MATERIAL_DB[mesh.elements[0].materialId];
      const rho_cp = mat ? mat.density * mat.specificHeat : 7850 * 490;
      let nodeVol = A_cross * dx;
      if (i === 0 || i === N - 1) nodeVol = A_cross * (dx / 2);
      
      const T_new = result.x[i];
      dEnergy += rho_cp * nodeVol * (T_new - node.T);
      
      // Update mesh temperatures
      node.T = T_new;
    }
    
    totalHeatInput = dEnergy / dt + totalHeatLoss;
    
    return {
      iterations: result.iterations,
      error: result.error,
      heatInputRate: Math.max(0, totalHeatInput),
      heatLossRate: totalHeatLoss,
      solveTimeMs: performance.now() - t0,
    };
  }

  // 2D Heat Conduction Solver
  static step2DImplicit(
    mesh: Mesh,
    dt: number,
    thickness = 0.05,
    h_conv = 15.0,
    T_ambient = 293.15
  ): { iterations: number; error: number; heatInputRate: number; heatLossRate: number; solveTimeMs: number } {
    const t0 = performance.now();
    const N = mesh.nodes.length;
    const builder = new MatrixBuilder(N);
    const rhs = new Float64Array(N);
    
    // Gauss points and weights for 2x2 integration
    const gp = [-1 / Math.sqrt(3), 1 / Math.sqrt(3)];
    const gw = [1, 1];
    
    const shapeFunctions = (xi: number, eta: number): number[] => [
      0.25 * (1 - xi) * (1 - eta),
      0.25 * (1 + xi) * (1 - eta),
      0.25 * (1 + xi) * (1 + eta),
      0.25 * (1 - xi) * (1 + eta)
    ];
    
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

    // Assemble global matrices from Q4 quad elements
    for (const el of mesh.elements) {
      if (el.type !== "quad2d") continue;
      
      const mat = MATERIAL_DB[el.materialId];
      if (!mat) continue;
      
      // Average element temperature for property lookup
      const T_el_avg = mesh.nodes[el.nodeIds[0]].T; // approximation; CG handles non-uniformity
      const k_cond = PhysicsEngine.thermalConductivity(mat, T_el_avg);
      const rho_cp = PhysicsEngine.densityAtT(mat, T_el_avg) * PhysicsEngine.specificHeatCapacity(mat, T_el_avg);
      
      const Ke = Array.from({ length: 4 }, () => new Float64Array(4));
      const Ce = Array.from({ length: 4 }, () => new Float64Array(4));
      
      // Gauss Integration
      for (let k = 0; k < 2; k++) {
        for (let l = 0; l < 2; l++) {
          const xi = gp[k];
          const eta = gp[l];
          const N_val = shapeFunctions(xi, eta);
          const { dN_dxi, dN_deta } = shapeDerivatives(xi, eta);
          
          let dx_dxi = 0, dy_dxi = 0, dx_deta = 0, dy_deta = 0;
          for (let i = 0; i < 4; i++) {
            const nd = mesh.nodes[el.nodeIds[i]];
            dx_dxi += dN_dxi[i] * nd.x;
            dy_dxi += dN_dxi[i] * nd.y;
            dx_deta += dN_deta[i] * nd.x;
            dy_deta += dN_deta[i] * nd.y;
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
          
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
              const cond = k_cond * (dN_dx[i] * dN_dx[j] + dN_dy[i] * dN_dy[j]) * dVolume;
              const cap = rho_cp * N_val[i] * N_val[j] * dVolume;
              
              Ke[i][j] += cond;
              Ce[i][j] += cap;
            }
          }
        }
      }
      
      const idx = el.nodeIds;
      const T_old = idx.map(id => mesh.nodes[id].T);
      
      // Assemble elemental matrices
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const lhs_val = Ce[i][j] + dt * Ke[i][j];
          builder.add(idx[i], idx[j], lhs_val);
          rhs[idx[i]] += Ce[i][j] * T_old[j];
        }
      }
    }

    // Determine boundary node exposure (Robin boundaries on exposed faces & edges)
    // Find boundaries of the structured grid: min/max x and y
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of mesh.nodes) {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }
    
    const L_x = maxX - minX;
    const L_y = maxY - minY;
    
    // Find grid grid spacing
    // We assume a uniform mesh for boundary area allocation
    // nx is number of elements in x, ny is number in y
    let nx = 0, ny = 0;
    const uniqueX = new Set(mesh.nodes.map(n => Math.round(n.x * 10000) / 10000));
    const uniqueY = new Set(mesh.nodes.map(n => Math.round(n.y * 10000) / 10000));
    nx = uniqueX.size - 1;
    ny = uniqueY.size - 1;
    const dx = L_x / Math.max(1, nx);
    const dy = L_y / Math.max(1, ny);
    
    let totalHeatLoss = 0;
    
    for (let i = 0; i < N; i++) {
      const node = mesh.nodes[i];
      const mat = MATERIAL_DB[mesh.elements[0].materialId];
      const emissivity = mat ? mat.emissivity : 0.5;
      
      // Calculate exposed perimeter length for edge cooling
      let perimeterLength = 0;
      const isLeft = Math.abs(node.x - minX) < 1e-6;
      const isRight = Math.abs(node.x - maxX) < 1e-6;
      const isBottom = Math.abs(node.y - minY) < 1e-6;
      const isTop = Math.abs(node.y - maxY) < 1e-6;
      
      // Corner checks
      if ((isLeft || isRight) && (isBottom || isTop)) {
        perimeterLength = (dx + dy) / 2;
      } else if (isLeft || isRight) {
        perimeterLength = dy;
      } else if (isBottom || isTop) {
        perimeterLength = dx;
      }
      
      // Flat face area (front + back faces)
      let faceArea = dx * dy;
      if ((isLeft || isRight) && (isBottom || isTop)) {
        faceArea = (dx * dy) / 4;
      } else if (isLeft || isRight || isBottom || isTop) {
        faceArea = (dx * dy) / 2;
      }
      
      // Total exposed area = edge area (perimeter * thickness) + front/back faces (2 * faceArea)
      const nodeArea = (perimeterLength * thickness) + (2 * faceArea);
      
      // Robin Convective cooling
      const q_conv = h_conv * nodeArea * (node.T - T_ambient);
      // Radiative cooling
      const q_rad = emissivity * this.SIGMA_SB * nodeArea * (node.T ** 4 - T_ambient ** 4);
      
      const q_lost = q_conv + q_rad;
      rhs[node.id] -= dt * q_lost;
      totalHeatLoss += q_lost;
      
      // Volumetric heat source terms (if any)
      if (node.q !== 0 && !node.fixedT) {
        rhs[node.id] += dt * node.q;
      }
    }
    
    // Apply boundary temperatures (Dirichlet via Penalty)
    const penalty = 1e12;
    for (const node of mesh.nodes) {
      if (node.fixedT) {
        builder.add(node.id, node.id, penalty);
        rhs[node.id] += penalty * node.T;
      }
    }
    
    // Solve
    const A_csr = builder.toCSR();
    const T_prev = new Float64Array(mesh.nodes.map(n => n.T));
    const result = SparseSolver.solveCG(A_csr, rhs, T_prev);
    
    // First law energy change
    let dEnergy = 0;
    for (let i = 0; i < N; i++) {
      const node = mesh.nodes[i];
      const mat = MATERIAL_DB[mesh.elements[0].materialId];
      const rho_cp = mat ? mat.density * mat.specificHeat : 7850 * 490;
      
      // Dual volume of the node
      const isLeft = Math.abs(node.x - minX) < 1e-6;
      const isRight = Math.abs(node.x - maxX) < 1e-6;
      const isBottom = Math.abs(node.y - minY) < 1e-6;
      const isTop = Math.abs(node.y - maxY) < 1e-6;
      
      let nodeVol = dx * dy * thickness;
      if ((isLeft || isRight) && (isBottom || isTop)) {
        nodeVol = (dx * dy * thickness) / 4;
      } else if (isLeft || isRight || isBottom || isTop) {
        nodeVol = (dx * dy * thickness) / 2;
      }
      
      const T_new = result.x[i];
      dEnergy += rho_cp * nodeVol * (T_new - node.T);
      node.T = T_new;
    }
    
    const totalHeatInput = dEnergy / dt + totalHeatLoss;
    
    return {
      iterations: result.iterations,
      error: result.error,
      heatInputRate: Math.max(0, totalHeatInput),
      heatLossRate: totalHeatLoss,
      solveTimeMs: performance.now() - t0,
    };
  }
}

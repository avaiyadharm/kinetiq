// ============================================================
// CONSTITUTIVE MATERIAL MODELS
// Tensor representations of Thermo-Elasticity and Plasticity
// ============================================================

import { MATERIAL_DB, PhysicsEngine } from "../../thermalExpansion";

export class ConstitutiveModel {
  
  // ----------------------------------------------------------
  // 2D Plane Stress Elasticity Matrix (D)
  // [ σ_xx ]   [ D11 D12  0  ] [ ε_xx - αΔT ]
  // [ σ_yy ] = [ D21 D22  0  ] [ ε_yy - αΔT ]
  // [ τ_xy ]   [  0   0  D33 ] [ γ_xy       ]
  // ----------------------------------------------------------
  static getPlaneStressMatrix(materialId: string, T: number): number[][] {
    const mat = MATERIAL_DB[materialId];
    if (!mat) throw new Error(`Material ${materialId} not found`);
    
    const E = PhysicsEngine.youngsModulus(mat, T);
    const v = mat.poissonsRatio;
    
    const factor = E / (1 - v * v);
    
    return [
      [factor, factor * v, 0],
      [factor * v, factor, 0],
      [0, 0, factor * (1 - v) / 2]
    ];
  }
  
  // ----------------------------------------------------------
  // Thermal Strain Vector (Plane Stress)
  // [ ε_th_xx, ε_th_yy, γ_th_xy ]
  // ----------------------------------------------------------
  static getThermalStrain(materialId: string, T: number, T_ref: number): [number, number, number] {
    const mat = MATERIAL_DB[materialId];
    if (!mat) return [0, 0, 0];
    
    // For isotropic expansion:
    const alpha = PhysicsEngine.alpha(mat, T);
    const dT = T - T_ref;
    const eps = alpha * dT;
    
    return [eps, eps, 0];
  }
  
  // ----------------------------------------------------------
  // von Mises Equivalent Stress (J2 Invariant)
  // 2D Plane Stress: σ_vm = sqrt(σ_xx² + σ_yy² - σ_xx*σ_yy + 3*τ_xy²)
  // ----------------------------------------------------------
  static vonMisesStress(stress: [number, number, number]): number {
    const [sx, sy, txy] = stress;
    return Math.sqrt(sx * sx + sy * sy - sx * sy + 3 * txy * txy);
  }
  
  // ----------------------------------------------------------
  // Plasticity Check
  // ----------------------------------------------------------
  static checkYield(materialId: string, T: number, stress: [number, number, number]): { yielded: boolean, fs: number, sigma_vm: number } {
    const mat = MATERIAL_DB[materialId];
    if (!mat) return { yielded: false, fs: 999, sigma_vm: 0 };
    
    const sigma_y = PhysicsEngine.yieldStrength(mat, T);
    const sigma_vm = this.vonMisesStress(stress);
    
    return {
      yielded: sigma_vm > sigma_y,
      fs: sigma_vm > 0 ? sigma_y / sigma_vm : 999,
      sigma_vm
    };
  }
}

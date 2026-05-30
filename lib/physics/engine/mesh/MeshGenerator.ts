// ============================================================
// FINITE ELEMENT MESH GENERATOR
// Defines Nodes, Elements, and Mesh topologies.
// ============================================================

export interface Node {
  id: number;
  x: number;
  y: number;
  
  // Nodal State
  T: number;        // Temperature (K)
  ux: number;       // Displacement X
  uy: number;       // Displacement Y
  
  // Boundary Conditions
  fixedX: boolean;
  fixedY: boolean;
  fixedT: boolean;
  
  // Applied Nodal Forces (External)
  fx: number;
  fy: number;
  q: number;        // Heat source
}

export interface Element {
  id: number;
  nodeIds: number[];   // e.g. 2 nodes for 1D truss, 3 for 2D triangle, 4 for 2D quad
  materialId: string;
  type: "truss1d" | "tri2d" | "quad2d";
  
  // Stored Elemental State
  stressTensor?: [number, number, number]; // [σ_xx, σ_yy, τ_xy]
  strainTensor?: [number, number, number]; // [ε_xx, ε_yy, γ_xy]
  thermalStrain?: [number, number, number];
  yielded?: boolean;
}

export class Mesh {
  public nodes: Node[];
  public elements: Element[];
  
  constructor() {
    this.nodes = [];
    this.elements = [];
  }
  
  public addNode(x: number, y: number, T = 293.15): number {
    const id = this.nodes.length;
    this.nodes.push({
      id, x, y, T, ux: 0, uy: 0,
      fixedX: false, fixedY: false, fixedT: false,
      fx: 0, fy: 0, q: 0
    });
    return id;
  }
  
  public addElement(nodeIds: number[], type: Element["type"], materialId: string): number {
    const id = this.elements.length;
    this.elements.push({ id, nodeIds, type, materialId });
    return id;
  }
  
  // Generators
  
  static generate1DBar(length: number, numElements: number, materialId: string, initialTemp = 293.15): Mesh {
    const mesh = new Mesh();
    const dx = length / numElements;
    
    for (let i = 0; i <= numElements; i++) {
      mesh.addNode(i * dx, 0, initialTemp);
    }
    
    for (let i = 0; i < numElements; i++) {
      mesh.addElement([i, i + 1], "truss1d", materialId);
    }
    
    return mesh;
  }
  
  // For plates and thick geometries
  static generate2DQuadGrid(width: number, height: number, nx: number, ny: number, materialId: string, initialTemp = 293.15): Mesh {
    const mesh = new Mesh();
    const dx = width / nx;
    const dy = height / ny;
    
    // Create nodes
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        mesh.addNode(i * dx, j * dy, initialTemp);
      }
    }
    
    // Create Quad elements
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const n1 = j * (nx + 1) + i;
        const n2 = n1 + 1;
        const n3 = (j + 1) * (nx + 1) + i + 1;
        const n4 = (j + 1) * (nx + 1) + i;
        
        mesh.addElement([n1, n2, n3, n4], "quad2d", materialId);
      }
    }
    
    return mesh;
  }
}

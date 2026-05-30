// ============================================================
// SPARSE MATRIX SOLVER (CSR Format)
// Implements Conjugate Gradient (CG) for Symmetric Positive-Definite (SPD) systems.
// ============================================================

export class CSRMatrix {
  public values: number[];
  public colIndices: number[];
  public rowPointers: number[];
  public size: number;

  constructor(size: number) {
    this.size = size;
    this.values = [];
    this.colIndices = [];
    this.rowPointers = new Array(size + 1).fill(0);
  }

  // Multiply matrix by a vector: y = A * x
  public multiplyVector(x: Float64Array | number[]): Float64Array {
    const y = new Float64Array(this.size);
    for (let i = 0; i < this.size; i++) {
      let sum = 0;
      const start = this.rowPointers[i];
      const end = this.rowPointers[i + 1];
      for (let j = start; j < end; j++) {
        sum += this.values[j] * x[this.colIndices[j]];
      }
      y[i] = sum;
    }
    return y;
  }
}

// Helper to build CSR matrices from DOK (Dictionary of Keys) format
export class MatrixBuilder {
  public size: number;
  private entries: Map<number, number>; // key: row * size + col, value: val

  constructor(size: number) {
    this.size = size;
    this.entries = new Map();
  }

  public add(row: number, col: number, val: number) {
    const key = row * this.size + col;
    const existing = this.entries.get(key) || 0;
    this.entries.set(key, existing + val);
  }

  public toCSR(): CSRMatrix {
    const csr = new CSRMatrix(this.size);
    
    // Sort entries by row, then col
    const sortedKeys = Array.from(this.entries.keys()).sort((a, b) => a - b);
    
    let currentRow = -1;
    let nnz = 0;

    for (const key of sortedKeys) {
      const row = Math.floor(key / this.size);
      const col = key % this.size;
      const val = this.entries.get(key)!;

      if (Math.abs(val) < 1e-15) continue; // Prune near-zero elements

      while (currentRow < row) {
        currentRow++;
        csr.rowPointers[currentRow] = nnz;
      }

      csr.values.push(val);
      csr.colIndices.push(col);
      nnz++;
    }

    while (currentRow < this.size) {
      currentRow++;
      csr.rowPointers[currentRow] = nnz;
    }

    return csr;
  }
}

// ============================================================
// CONJUGATE GRADIENT SOLVER
// Solves Ax = b for SPD matrices.
// ============================================================
export class SparseSolver {
  
  static dot(a: Float64Array, b: Float64Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  }

  static solveCG(A: CSRMatrix, b: Float64Array, x0?: Float64Array, maxIter = 1000, tol = 1e-8): { x: Float64Array, iterations: number, error: number } {
    const n = A.size;
    const x = x0 ? new Float64Array(x0) : new Float64Array(n);
    
    // r = b - A*x
    const Ax = A.multiplyVector(x);
    let r = new Float64Array(n);
    for (let i = 0; i < n; i++) r[i] = b[i] - Ax[i];
    
    let p = new Float64Array(r);
    let rsold = this.dot(r, r);
    
    // Check initial residual
    const bNorm = Math.sqrt(this.dot(b, b));
    if (bNorm === 0) return { x: new Float64Array(n), iterations: 0, error: 0 };
    if (Math.sqrt(rsold) / bNorm < tol) return { x, iterations: 0, error: Math.sqrt(rsold) / bNorm };

    for (let i = 0; i < maxIter; i++) {
      const Ap = A.multiplyVector(p);
      const pAp = this.dot(p, Ap);
      if (Math.abs(pAp) < 1e-15) break; // Divergence / Singularity prevention

      const alpha = rsold / pAp;
      
      for (let j = 0; j < n; j++) {
        x[j] += alpha * p[j];
        r[j] -= alpha * Ap[j];
      }

      const rsnew = this.dot(r, r);
      if (Math.sqrt(rsnew) / bNorm < tol) {
        return { x, iterations: i + 1, error: Math.sqrt(rsnew) / bNorm };
      }

      const p_factor = rsnew / rsold;
      for (let j = 0; j < n; j++) {
        p[j] = r[j] + p_factor * p[j];
      }
      
      rsold = rsnew;
    }

    return { x, iterations: maxIter, error: Math.sqrt(rsold) / bNorm };
  }
}

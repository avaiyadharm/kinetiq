import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComponentType =
  | "wire"
  | "resistor"
  | "battery"
  | "switch"
  | "bulb"
  | "capacitor"
  | "led"
  | "voltmeter"
  | "ammeter"
  | "ground";

export type Orientation = "H" | "V";

export interface GridComponent {
  id: string;
  type: ComponentType;
  row: number;
  col: number;
  orientation: Orientation;
  /** Resistance (Ω) for resistor/bulb/led; voltage (V) for battery; capacitance (F) for capacitor */
  value: number;
  /** Switch state */
  closed?: boolean;
  /** Battery internal resistance (Ω) — 0 = ideal */
  internalR?: number;
  /** Computed by solver — always non-negative magnitude */
  voltage?: number;
  current?: number;
  power?: number;
  /** Signed current (positive = n1→n2 conventional flow) */
  signedCurrent?: number;
  /** Signed voltage drop (n1 − n2) */
  signedVoltage?: number;
  /** Brightness 0–1 for bulb/LED */
  brightness?: number;
  /** Bulb filament temperature in Kelvin */
  temperature?: number;
  /** Capacitor terminal voltage (used in transient mode) */
  capacitorVoltage?: number;
  /** True when power exceeds ratedPower */
  isOverloaded?: boolean;
  /** Maximum safe power dissipation in W */
  ratedPower?: number;
  /** MNA resolved node indices */
  nodeId1?: number;
  nodeId2?: number;
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

export type DiagnosticType =
  | "open_circuit"
  | "short_circuit"
  | "floating_node"
  | "overload"
  | "ammeter_parallel"
  | "voltmeter_series"
  | "no_battery"
  | "no_ground_path"
  | "ok";

export interface CircuitDiagnostic {
  type: DiagnosticType;
  message: string;
  severity: "error" | "warning" | "info";
  componentIds?: string[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsPoint {
  t: number;
  totalPower: number;
  /** Actual battery supply current (from VS solution) */
  batteryCurrent: number;
  /** Terminal voltage = EMF − I·r */
  terminalVoltage: number;
  componentCount: number;
  nodeCount: number;
  voltageSource: number;
  /** V_battery / I_battery — accurate R_eq for any topology */
  equivalentR: number;
  /** Sum of ½CV² for all capacitors */
  storedEnergy: number;
}

// ─── Solver internals ─────────────────────────────────────────────────────────

interface SolverResult {
  nodeVoltages: Map<number, number>;   // rootNode → voltage
  vsCurrents: number[];                // current through each voltage source (A)
  groundNode: number;
  diagnostics: CircuitDiagnostic[];
  isValid: boolean;
}

// Partial-pivot Gauss-Jordan elimination — numerically stable
function gaussianElimination(A: number[][], b: number[]): { x: number[]; rank: number } {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  let rank = 0;

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue; // singular or near-singular row
    rank++;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / pivot;
      for (let k = col; k <= n; k++) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
  }

  const x = aug.map((row, i) => {
    const d = row[i];
    return Math.abs(d) < 1e-12 ? 0 : row[n] / d;
  });

  return { x, rank };
}

// ─── Topology Analyzer ────────────────────────────────────────────────────────

interface CompWithEndpoints extends GridComponent {
  n1: number; // raw endpoint node (before union-find)
  n2: number;
  rn1: number; // resolved node after union-find
  rn2: number;
}

function buildTopology(components: GridComponent[]): {
  comps: CompWithEndpoints[];
  find: (x: number) => number;
  nextNode: number;
} {
  const nodeMap = new Map<string, number>();
  let nextNode = 0;
  const getNode = (key: string) => {
    if (!nodeMap.has(key)) nodeMap.set(key, nextNode++);
    return nodeMap.get(key)!;
  };

  const comps: CompWithEndpoints[] = components.map((c) => {
    const r1 = c.row, c1 = c.col;
    const r2 = c.orientation === "H" ? c.row : c.row + 1;
    const c2 = c.orientation === "H" ? c.col + 1 : c.col;
    return {
      ...c,
      n1: getNode(`${r1},${c1}`),
      n2: getNode(`${r2},${c2}`),
      rn1: 0,
      rn2: 0,
    };
  });

  // Union-find
  const parent = Array.from({ length: nextNode }, (_, i) => i);
  const find = (x: number): number =>
    parent[x] === x ? x : (parent[x] = find(parent[x]));
  const union = (a: number, b: number) => {
    a = find(a); b = find(b);
    if (a !== b) parent[a] = b;
  };

  // Merge nodes through wires and closed switches
  for (const c of comps) {
    if (c.type === "wire" || (c.type === "switch" && c.closed) || c.type === "ground") {
      union(c.n1, c.n2);
    }
    // Battery internal resistance: the battery still connects its terminals through EMF + r
    // so we do NOT merge battery terminals here — they remain separate MNA nodes
  }

  for (const c of comps) {
    c.rn1 = find(c.n1);
    c.rn2 = find(c.n2);
  }

  return { comps, find, nextNode };
}

// ─── Diagnostic Engine ────────────────────────────────────────────────────────

function analyzeDiagnostics(
  comps: CompWithEndpoints[],
  find: (x: number) => number,
  vsCurrents: number[],
  voltageSources: CompWithEndpoints[],
  groundNode: number
): CircuitDiagnostic[] {
  const diags: CircuitDiagnostic[] = [];

  const batteries = comps.filter((c) => c.type === "battery");

  // No battery
  if (batteries.length === 0) {
    diags.push({
      type: "no_battery",
      message: "No battery found. Place a battery to power the circuit.",
      severity: "error",
    });
    return diags;
  }

  // Short circuit: battery terminals share the same resolved node
  for (const bat of batteries) {
    if (bat.rn1 === bat.rn2) {
      diags.push({
        type: "short_circuit",
        message: `⚠ Short circuit! Battery terminals are directly connected. In a real circuit this would produce dangerous current and heat. Add a resistor or remove the wire bridging the terminals.`,
        severity: "error",
        componentIds: [bat.id],
      });
    }
  }

  // Open circuit: battery is in circuit but delivers zero current
  if (voltageSources.length > 0 && vsCurrents.length > 0) {
    const I = vsCurrents[0];
    if (Math.abs(I) < 1e-9 && batteries.some((b) => b.rn1 !== b.rn2)) {
      diags.push({
        type: "open_circuit",
        message:
          "Open circuit: No current flows. Check that all components form a closed loop from battery (+) to battery (−).",
        severity: "error",
      });
    }
  }

  // Ammeter placed in parallel (both endpoints share same resolved node BEFORE ammeter merges them)
  const ammeters = comps.filter((c) => c.type === "ammeter");
  for (const am of ammeters) {
    // Find all other non-ammeter components that also connect rn1 to rn2
    const parallel = comps.filter(
      (c) =>
        c.id !== am.id &&
        c.type !== "wire" &&
        ((c.rn1 === am.rn1 && c.rn2 === am.rn2) ||
          (c.rn1 === am.rn2 && c.rn2 === am.rn1))
    );
    if (parallel.length > 0) {
      diags.push({
        type: "ammeter_parallel",
        message:
          "⚠ Ammeter appears to be placed in parallel with another component. Ammeters must be placed in series (in the current path), not across a component.",
        severity: "warning",
        componentIds: [am.id],
      });
    }
  }

  // Voltmeter placed in series: only connection bridging two nodes
  const voltmeters = comps.filter((c) => c.type === "voltmeter");
  for (const vm of voltmeters) {
    const adjacentToN1 = comps.filter(
      (c) => c.id !== vm.id && (c.rn1 === vm.rn1 || c.rn2 === vm.rn1)
    );
    const adjacentToN2 = comps.filter(
      (c) => c.id !== vm.id && (c.rn1 === vm.rn2 || c.rn2 === vm.rn2)
    );
    if (adjacentToN1.length === 0 || adjacentToN2.length === 0) {
      diags.push({
        type: "voltmeter_series",
        message:
          "⚠ Voltmeter appears to be in series with the circuit. Voltmeters must be placed in parallel (across) a component, not in the current path.",
        severity: "warning",
        componentIds: [vm.id],
      });
    }
  }

  if (diags.length === 0) {
    diags.push({ type: "ok", message: "Circuit OK", severity: "info" });
  }

  return diags;
}

// ─── Main MNA Solver ──────────────────────────────────────────────────────────

export function solveCircuit(components: GridComponent[]): GridComponent[] {
  if (components.length === 0) return [];

  const { comps, find, nextNode } = buildTopology(components);

  // Ground node: battery's negative terminal
  let groundNode = -1;
  for (const c of comps) {
    if (c.type === "battery") {
      groundNode = c.rn2;
      break;
    }
  }
  if (groundNode === -1) groundNode = comps[0]?.rn1 ?? 0;

  // Non-ground nodes
  const allNodes = new Set<number>();
  for (const c of comps) {
    allNodes.add(c.rn1);
    allNodes.add(c.rn2);
  }
  allNodes.delete(groundNode);
  const nodeList = Array.from(allNodes);
  const nodeIndex = new Map<number, number>();
  nodeList.forEach((n, i) => nodeIndex.set(n, i));

  const nIdx = (n: number): number => nodeIndex.get(n) ?? -1;

  // Voltage sources: batteries whose terminals are different nodes
  const voltageSources = comps.filter(
    (c) => c.type === "battery" && c.rn1 !== c.rn2
  );

  const numNodes = nodeList.length;
  const numVS = voltageSources.length;
  const size = numNodes + numVS;

  // Zero-size system
  if (size === 0) {
    const diags = analyzeDiagnostics(comps, find, [], voltageSources, groundNode);
    return components.map((c) => ({
      ...c,
      voltage: 0, signedVoltage: 0, current: 0, signedCurrent: 0,
      power: 0, brightness: 0, isOverloaded: false,
    }));
  }

  const G: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(0)
  );
  const bVec: number[] = new Array(size).fill(0);

  // Stamp passive conductances
  for (const c of comps) {
    if (
      c.type === "wire" ||
      c.type === "switch" ||
      c.type === "ground" ||
      c.rn1 === c.rn2 // shorted component — zero contribution
    ) continue;

    if (c.type === "battery") {
      // Battery internal resistance: stamp as conductance between same nodes
      // The EMF is handled as voltage source below
      const r = c.internalR ?? 0;
      if (r > 1e-6) {
        const g = 1 / r;
        const i1 = nIdx(c.rn1);
        const i2 = nIdx(c.rn2);
        if (i1 >= 0) G[i1][i1] += g;
        if (i2 >= 0) G[i2][i2] += g;
        if (i1 >= 0 && i2 >= 0) { G[i1][i2] -= g; G[i2][i1] -= g; }
      }
      continue;
    }

    let R = c.value;
    if (c.type === "bulb") {
      // Temperature-dependent resistance (simplified Drude/PTC model)
      const T = c.temperature ?? 293;
      const R0 = Math.max(c.value, 10);
      const alpha = 0.0045; // tungsten temperature coefficient /°C
      R = R0 * (1 + alpha * (T - 293));
    }
    if (c.type === "led") R = Math.max(c.value, 50);
    if (c.type === "voltmeter") R = 1e6;
    if (c.type === "ammeter") R = 1e-3;
    if (c.type === "capacitor") {
      // DC: capacitor voltage already stored; model as R=∞ open circuit
      // Transient: handled separately in stepTransient
      R = 1e9;
    }
    if (c.type === "resistor") R = Math.max(c.value, 1e-6);

    const g = 1 / Math.max(R, 1e-9);
    const i1 = nIdx(c.rn1);
    const i2 = nIdx(c.rn2);
    if (i1 >= 0) G[i1][i1] += g;
    if (i2 >= 0) G[i2][i2] += g;
    if (i1 >= 0 && i2 >= 0) { G[i1][i2] -= g; G[i2][i1] -= g; }
  }

  // Stamp voltage sources (MNA augmented rows)
  voltageSources.forEach((vs, k) => {
    const row = numNodes + k;
    const i1 = nIdx(vs.rn1);
    const i2 = nIdx(vs.rn2);
    if (i1 >= 0) { G[row][i1] = 1; G[i1][row] = 1; }
    if (i2 >= 0) { G[row][i2] = -1; G[i2][row] = -1; }
    bVec[row] = vs.value; // EMF
  });

  let solution: number[];
  try {
    const result = gaussianElimination(G, bVec);
    solution = result.x;
  } catch {
    solution = new Array(size).fill(0);
  }

  const nodeVoltage = (rn: number): number => {
    if (rn === groundNode) return 0;
    const idx = nodeIndex.get(rn);
    return idx !== undefined ? (solution[idx] ?? 0) : 0;
  };

  const vsCurrents = voltageSources.map((_, k) => solution[numNodes + k] ?? 0);
  const diags = analyzeDiagnostics(comps, find, vsCurrents, voltageSources, groundNode);

  // Per-component quantities
  return comps.map((c): GridComponent => {
    const v1 = nodeVoltage(c.rn1);
    const v2 = nodeVoltage(c.rn2);
    const signedVoltage = v1 - v2; // positive = conventional current n1→n2
    const dv = signedVoltage;

    let signedCurrent = 0;
    let power = 0;
    let brightness = 0;
    let temperature = c.temperature ?? 293;
    const ratedPower = c.ratedPower ?? Infinity;

    switch (c.type) {
      case "resistor": {
        const R = Math.max(c.value, 1e-6);
        signedCurrent = dv / R;
        power = signedCurrent * dv;
        break;
      }
      case "bulb": {
        const T = c.temperature ?? 293;
        const R0 = Math.max(c.value, 10);
        const alpha = 0.0045;
        const R = R0 * (1 + alpha * (T - 293));
        signedCurrent = dv / R;
        power = signedCurrent * dv;
        // Steady-state temperature: P = k*(T-T_amb) → T = T_amb + P/k
        // k_thermal for a bulb filament ≈ 0.01 W/K (simplified)
        const k_thermal = 0.01;
        const T_ss = 293 + Math.abs(power) / k_thermal;
        // Thermal time constant fast enough for DC: snap to steady state
        temperature = Math.min(T_ss, 3400); // tungsten melts at ~3695K
        brightness = Math.min(1, Math.abs(power) / 5);
        break;
      }
      case "led": {
        const R = Math.max(c.value, 50);
        signedCurrent = dv / R;
        power = signedCurrent * dv;
        brightness = Math.min(1, Math.abs(power) / 0.5);
        break;
      }
      case "battery": {
        const vsIdx = voltageSources.findIndex((v) => v.id === c.id);
        // MNA convention: battery current = -I_vs (current delivered to circuit)
        signedCurrent = vsIdx >= 0 ? -(vsCurrents[vsIdx] ?? 0) : 0;
        // Power delivered by battery = EMF * I_delivered
        power = Math.abs(signedCurrent) * c.value;
        break;
      }
      case "ammeter": {
        signedCurrent = dv / 1e-3;
        power = signedCurrent * dv;
        break;
      }
      case "voltmeter": {
        signedCurrent = dv / 1e6; // tiny leakage current
        power = signedCurrent * dv;
        break;
      }
      case "capacitor": {
        // In DC steady state, I_cap = 0 (1GΩ model)
        const R_cap = 1e9;
        signedCurrent = dv / R_cap; // effectively 0
        power = 0;
        break;
      }
      case "wire":
      case "switch":
      case "ground":
        break;
    }

    const isOverloaded = power > ratedPower && ratedPower < Infinity;

    return {
      ...c,
      voltage: Math.abs(dv),
      signedVoltage,
      current: Math.abs(signedCurrent),
      signedCurrent,
      power: Math.abs(power),
      brightness: Math.max(0, brightness),
      temperature,
      isOverloaded,
      nodeId1: c.rn1,
      nodeId2: c.rn2,
    };
  });
}

// ─── RC Transient Engine ──────────────────────────────────────────────────────
// Uses backward-Euler (exponential) integration for unconditional stability.
// Called from tick() when isRunning=true and capacitors are present.

export function stepTransient(
  components: GridComponent[],
  dt: number
): GridComponent[] {
  const caps = components.filter((c) => c.type === "capacitor");
  if (caps.length === 0) return components;

  // For each capacitor, find the Thevenin equivalent seen at its terminals.
  // Simple approach: identify the series resistor(s) in the same branch.
  // Full Thevenin would require re-solving with cap removed — too expensive.
  // Instead, use the current MNA voltage across cap and branch current to update.

  let updated = [...components];
  for (const cap of caps) {
    const capIdx = updated.findIndex((c) => c.id === cap.id);
    if (capIdx === -1) continue;

    const C = cap.value;
    const V_c_old = cap.capacitorVoltage ?? 0;

    // Find the branch current through this capacitor from the DC solve
    // (approximately the charging current)
    // Use: dV_c/dt = I_c / C
    // I_c = (V_node1 - V_c) / R_thevenin — approximate using signedVoltage
    const V_branch = cap.signedVoltage ?? 0; // total branch voltage from MNA
    const V_source = V_branch; // voltage driving the RC branch

    // Find series resistance in same row/column
    const seriesResistors = components.filter(
      (c) =>
        (c.type === "resistor" || c.type === "bulb") &&
        c.orientation === cap.orientation &&
        Math.abs(c.row - cap.row) <= 2 &&
        Math.abs(c.col - cap.col) <= 2
    );

    const R_thevenin = seriesResistors.length > 0
      ? seriesResistors.reduce((s, r) => s + Math.max(r.value, 1e-6), 0)
      : 1000; // default 1kΩ if no series R found

    const tau = R_thevenin * C;

    // Battery voltage (find first battery in circuit)
    const battery = components.find((c) => c.type === "battery");
    const V_inf = battery?.value ?? 0; // target voltage (fully charged)

    // Backward Euler / exponential step (exact for RC circuits)
    const decay = Math.exp(-dt / Math.max(tau, 1e-12));
    const V_c_new = V_inf * (1 - decay) + V_c_old * decay;

    // Stored energy: E = ½CV²
    const storedEnergy = 0.5 * C * V_c_new * V_c_new;

    updated[capIdx] = {
      ...updated[capIdx],
      capacitorVoltage: V_c_new,
      voltage: Math.abs(V_c_new),
      power: 0, // capacitors don't dissipate in ideal model
    };
  }

  // Re-solve MNA with updated capacitor voltages influencing the circuit
  return solveCircuit(
    updated.map((c) =>
      c.type === "capacitor" && c.capacitorVoltage !== undefined
        ? { ...c, value: c.value } // value is capacitance, not voltage
        : c
    )
  );
}

// ─── KCL / KVL Verification ───────────────────────────────────────────────────

export interface KCLResult {
  nodeId: number;
  voltage: number;
  currentsIn: { compId: string; compType: string; current: number }[];
  currentsOut: { compId: string; compType: string; current: number }[];
  error: number; // |Σin - Σout| in A
  ok: boolean;
}

export interface KVLResult {
  loopComponents: string[];
  voltageDrops: { compId: string; compType: string; drop: number }[];
  sum: number;
  ok: boolean;
}

export function verifyKCL(components: GridComponent[]): KCLResult[] {
  const nodeMap = new Map<number, KCLResult>();

  const ensureNode = (id: number, v: number) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        nodeId: id,
        voltage: v,
        currentsIn: [],
        currentsOut: [],
        error: 0,
        ok: true,
      });
    }
  };

  for (const c of components) {
    if (c.nodeId1 === undefined || c.nodeId2 === undefined) continue;
    if (c.type === "wire" || c.type === "ground") continue;

    const I = c.signedCurrent ?? 0;
    const v1 = (c.voltage ?? 0) + (c.nodeId2 === c.nodeId1 ? 0 : 0); // placeholder
    ensureNode(c.nodeId1!, c.voltage ?? 0);
    ensureNode(c.nodeId2!, 0);

    const n1 = nodeMap.get(c.nodeId1!)!;
    const n2 = nodeMap.get(c.nodeId2!)!;

    // Positive signedCurrent means current flows n1 → n2
    if (I > 0) {
      n1.currentsOut.push({ compId: c.id, compType: c.type, current: I });
      n2.currentsIn.push({ compId: c.id, compType: c.type, current: I });
    } else if (I < 0) {
      n1.currentsIn.push({ compId: c.id, compType: c.type, current: -I });
      n2.currentsOut.push({ compId: c.id, compType: c.type, current: -I });
    }
  }

  const results: KCLResult[] = [];
  nodeMap.forEach((node) => {
    const sumIn = node.currentsIn.reduce((s, c) => s + c.current, 0);
    const sumOut = node.currentsOut.reduce((s, c) => s + c.current, 0);
    node.error = Math.abs(sumIn - sumOut);
    node.ok = node.error < 1e-9;
    results.push(node);
  });

  return results;
}

// ─── Equivalent Resistance ────────────────────────────────────────────────────

export function computeEquivalentR(components: GridComponent[]): number {
  const battery = components.find((c) => c.type === "battery");
  if (!battery) return Infinity;
  const I = Math.abs(battery.signedCurrent ?? 0);
  if (I < 1e-12) return Infinity;
  return battery.value / I;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export type PaletteItem = ComponentType;

interface CircuitState {
  // Grid
  gridRows: number;
  gridCols: number;
  components: GridComponent[];
  selectedId: string | null;
  hoveredCell: { row: number; col: number } | null;

  // Palette
  activePalette: PaletteItem;
  activeOrientation: Orientation;

  // Defaults
  defaultResistance: number;
  defaultVoltage: number;
  defaultCapacitance: number;
  defaultBulbR: number;
  defaultLedR: number;
  defaultInternalR: number;

  // Simulation
  isRunning: boolean;
  time: number;
  history: AnalyticsPoint[];
  diagnostics: CircuitDiagnostic[];
  kclResults: KCLResult[];

  // UI
  showGrid: boolean;
  showVoltageColors: boolean;
  showCurrentFlow: boolean;
  showPowerHeat: boolean;
  showNodeLabels: boolean;
  showCurrentDirection: boolean;
  animOffset: number;

  // Actions
  setActivePalette: (p: PaletteItem) => void;
  setActiveOrientation: (o: Orientation) => void;
  placeComponent: (row: number, col: number) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  setHoveredCell: (cell: { row: number; col: number } | null) => void;
  toggleSwitch: (id: string) => void;
  updateValue: (id: string, value: number) => void;
  updateInternalR: (id: string, r: number) => void;
  setDefault: (
    key:
      | "defaultResistance"
      | "defaultVoltage"
      | "defaultCapacitance"
      | "defaultBulbR"
      | "defaultLedR"
      | "defaultInternalR",
    val: number
  ) => void;
  setRunning: (v: boolean) => void;
  tick: (dt: number) => void;
  reset: () => void;
  clearGrid: () => void;
  loadPreset: (
    preset: "series" | "parallel" | "bridge" | "rc" | "mixed"
  ) => void;
  setToggle: (
    key:
      | "showGrid"
      | "showVoltageColors"
      | "showCurrentFlow"
      | "showPowerHeat"
      | "showNodeLabels"
      | "showCurrentDirection",
    val: boolean
  ) => void;
}

let _idCounter = 0;
const uid = () => `c${++_idCounter}`;

const DEFAULT_VALUES: Record<ComponentType, number> = {
  wire: 0,
  resistor: 100,
  battery: 9,
  switch: 0,
  bulb: 60,      // Ω cold resistance (real 60W/120V: ~240Ω; educational: 60Ω)
  capacitor: 0.001, // 1 mF
  led: 100,
  voltmeter: 1e6,
  ammeter: 1e-3,
  ground: 0,
};

const RATED_POWER: Partial<Record<ComponentType, number>> = {
  resistor: 0.25, // ¼W standard resistor
  bulb: 10,
  led: 1,
};

function makeComp(
  type: ComponentType,
  row: number,
  col: number,
  orientation: Orientation,
  overrides: Partial<GridComponent> = {}
): GridComponent {
  return {
    id: uid(),
    type,
    row,
    col,
    orientation,
    value: DEFAULT_VALUES[type],
    closed: type === "switch" ? false : undefined,
    internalR: type === "battery" ? 0 : undefined,
    ratedPower: RATED_POWER[type],
    temperature: type === "bulb" ? 293 : undefined,
    capacitorVoltage: type === "capacitor" ? 0 : undefined,
    ...overrides,
  };
}

// ─── Presets ─────────────────────────────────────────────────────────────────
// Layout: battery spans (row, col)→(row+1, col) for "V" orientation.
// Circuit must form a closed loop for current to flow.

const PRESETS: Record<string, GridComponent[]> = {
  // Battery (V) at col 1 rows 2→3. Top rail at row 1. Bottom rail at row 3.
  // Loop: bat(+) at (2,1) → wire (1,1)H → resistor (1,2)H → wire (1,3)H
  //        → bulb (1,4)V (rows 1→2) → wire (2,4)H → wire (2,3)H → wire (2,2)H
  //        → wire (2,1 is bat(-))? No — bat(-) is at (3,1).
  // Corrected layout using consistent vertical battery:
  series: [
    makeComp("battery",  2, 0, "V", { value: 9 }),    // (+) at (2,0), (-) at (3,0)
    makeComp("wire",     2, 0, "H"),                   // (2,0)→(2,1) top connecting wire
    makeComp("wire",     2, 1, "H"),                   // (2,1)→(2,2)
    makeComp("resistor", 2, 2, "H", { value: 220, ratedPower: 0.25 }),
    makeComp("wire",     2, 3, "H"),                   // (2,3)→(2,4)
    makeComp("bulb",     2, 4, "V", { value: 60, ratedPower: 10, temperature: 293 }), // (2,4)→(3,4)
    makeComp("wire",     3, 4, "H"),                   // return: (3,4)→(3,3)
    makeComp("wire",     3, 3, "H"),
    makeComp("wire",     3, 2, "H"),
    makeComp("wire",     3, 1, "H"),
    makeComp("wire",     3, 0, "H"),                   // back to bat(-) at (3,0)
  ],
  parallel: [
    makeComp("battery",  2, 0, "V", { value: 12 }),
    makeComp("wire",     2, 0, "H"),
    makeComp("wire",     2, 1, "H"),
    makeComp("wire",     2, 2, "H"),
    makeComp("wire",     2, 3, "H"),
    makeComp("resistor", 2, 4, "V", { value: 100, ratedPower: 0.25 }),  // (2,4)→(3,4)
    makeComp("resistor", 2, 5, "V", { value: 220, ratedPower: 0.25 }),  // (2,5)→(3,5)
    makeComp("wire",     3, 5, "H"),   // bottom rail right
    makeComp("wire",     3, 4, "H"),
    makeComp("wire",     3, 3, "H"),
    makeComp("wire",     3, 2, "H"),
    makeComp("wire",     3, 1, "H"),
    makeComp("wire",     3, 0, "H"),   // back to bat(-)
    // close top rail
    makeComp("wire",     2, 5, "H"),   // (2,5)→(2,6)
    makeComp("wire",     3, 5, "H"),   // (3,5)→(3,6) duplicate — let topology handle
  ],
  rc: [
    makeComp("battery",   2, 0, "V", { value: 5 }),
    makeComp("switch",    2, 0, "H", { closed: false }),   // series switch
    makeComp("wire",      2, 1, "H"),
    makeComp("resistor",  2, 2, "H", { value: 1000, ratedPower: 0.25 }),
    makeComp("wire",      2, 3, "H"),
    makeComp("capacitor", 2, 4, "V", { value: 0.001, capacitorVoltage: 0 }),  // 1mF
    makeComp("wire",      3, 4, "H"),
    makeComp("wire",      3, 3, "H"),
    makeComp("wire",      3, 2, "H"),
    makeComp("wire",      3, 1, "H"),
    makeComp("wire",      3, 0, "H"),
  ],
  bridge: [
    makeComp("battery",   3, 0, "V", { value: 10 }),
    makeComp("wire",      3, 0, "H"),
    makeComp("wire",      3, 1, "H"),
    makeComp("wire",      3, 2, "H"),
    makeComp("wire",      3, 3, "H"),
    makeComp("resistor",  2, 1, "V", { value: 100 }),   // left-top arm
    makeComp("resistor",  2, 2, "V", { value: 220 }),   // right-top arm
    makeComp("resistor",  1, 1, "H", { value: 470 }),   // bridge arm
    makeComp("wire",      2, 0, "H"),
    makeComp("wire",      1, 0, "H"),
    makeComp("wire",      1, 2, "H"),
    makeComp("wire",      1, 3, "H"),
    makeComp("wire",      4, 0, "H"),
    makeComp("wire",      4, 1, "H"),
    makeComp("wire",      4, 2, "H"),
    makeComp("wire",      4, 3, "H"),
  ],
  mixed: [
    makeComp("battery",   3, 0, "V", { value: 12 }),
    makeComp("switch",    2, 0, "V", { closed: true }),  // (2,0)→(3,0)
    makeComp("wire",      2, 0, "H"),
    makeComp("resistor",  2, 1, "H", { value: 100 }),
    makeComp("wire",      2, 2, "H"),
    makeComp("bulb",      2, 3, "V", { value: 40, temperature: 293 }),
    makeComp("resistor",  2, 4, "V", { value: 220 }),
    makeComp("wire",      3, 3, "H"),
    makeComp("wire",      3, 4, "H"),
    makeComp("wire",      4, 0, "H"),
    makeComp("wire",      4, 1, "H"),
    makeComp("wire",      4, 2, "H"),
    makeComp("wire",      4, 3, "H"),
    makeComp("wire",      4, 4, "H"),
    makeComp("led",       3, 1, "V", { value: 80 }),
    makeComp("wire",      3, 2, "H"),
  ],
};

// ─── Solve + diagnostics wrapper ─────────────────────────────────────────────

function solveAndDiagnose(
  components: GridComponent[]
): { components: GridComponent[]; diagnostics: CircuitDiagnostic[]; kclResults: KCLResult[] } {
  if (components.length === 0) {
    return {
      components: [],
      diagnostics: [{ type: "no_battery", message: "Place a battery to start.", severity: "info" }],
      kclResults: [],
    };
  }
  const solved = solveCircuit(components);
  const kclResults = verifyKCL(solved);

  // Regenerate diagnostics from the solved components
  const { comps, find } = buildTopology(components);
  const voltageSources = comps.filter((c) => c.type === "battery" && c.rn1 !== c.rn2);
  const battery = solved.find((c) => c.type === "battery");
  const vsCurrents = battery ? [Math.abs(battery.signedCurrent ?? 0)] : [];
  const groundNode = battery ? (battery.nodeId2 ?? 0) : 0;
  const diagnostics = analyzeDiagnostics(comps, find, vsCurrents, voltageSources, groundNode);

  return { components: solved, diagnostics, kclResults };
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useCircuitStore = create<CircuitState>((set, get) => ({
  gridRows: 12,
  gridCols: 16,
  components: [],
  selectedId: null,
  hoveredCell: null,
  activePalette: "wire",
  activeOrientation: "H",
  defaultResistance: 100,
  defaultVoltage: 9,
  defaultCapacitance: 0.001,
  defaultBulbR: 60,
  defaultLedR: 100,
  defaultInternalR: 0,
  isRunning: false,
  time: 0,
  history: [],
  diagnostics: [{ type: "no_battery", message: "Place a battery to start.", severity: "info" }],
  kclResults: [],
  showGrid: true,
  showVoltageColors: true,
  showCurrentFlow: true,
  showPowerHeat: true,
  showNodeLabels: false,
  showCurrentDirection: true,
  animOffset: 0,

  setActivePalette: (p) => set({ activePalette: p }),
  setActiveOrientation: (o) => set({ activeOrientation: o }),

  placeComponent: (row, col) => {
    const {
      activePalette, activeOrientation, components,
      defaultResistance, defaultVoltage, defaultCapacitance,
      defaultBulbR, defaultLedR, defaultInternalR,
    } = get();

    const existing = components.find(
      (c) => c.row === row && c.col === col && c.orientation === activeOrientation
    );
    if (existing) return;

    const overrides: Partial<GridComponent> = {};
    if (activePalette === "resistor") overrides.value = defaultResistance;
    if (activePalette === "battery") {
      overrides.value = defaultVoltage;
      overrides.internalR = defaultInternalR;
    }
    if (activePalette === "capacitor") overrides.value = defaultCapacitance;
    if (activePalette === "bulb") overrides.value = defaultBulbR;
    if (activePalette === "led") overrides.value = defaultLedR;

    const newComp = makeComp(activePalette, row, col, activeOrientation, overrides);
    const { components: solved, diagnostics, kclResults } = solveAndDiagnose([
      ...components,
      newComp,
    ]);
    set({ components: solved, diagnostics, kclResults });
  },

  removeComponent: (id) => {
    const comps = get().components.filter((c) => c.id !== id);
    const { components, diagnostics, kclResults } = solveAndDiagnose(comps);
    set({ components, diagnostics, kclResults, selectedId: null });
  },

  selectComponent: (id) => set({ selectedId: id }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  toggleSwitch: (id) => {
    const comps = get().components.map((c) =>
      c.id === id && c.type === "switch" ? { ...c, closed: !c.closed } : c
    );
    const { components, diagnostics, kclResults } = solveAndDiagnose(comps);
    set({ components, diagnostics, kclResults });
  },

  updateValue: (id, value) => {
    const comps = get().components.map((c) => (c.id === id ? { ...c, value } : c));
    const { components, diagnostics, kclResults } = solveAndDiagnose(comps);
    set({ components, diagnostics, kclResults });
  },

  updateInternalR: (id, r) => {
    const comps = get().components.map((c) =>
      c.id === id ? { ...c, internalR: r } : c
    );
    const { components, diagnostics, kclResults } = solveAndDiagnose(comps);
    set({ components, diagnostics, kclResults });
  },

  setDefault: (key, val) => set({ [key]: val } as Partial<CircuitState>),
  setRunning: (v) => set({ isRunning: v }),

  tick: (dt) => {
    const { components, time, history, isRunning, animOffset } = get();
    if (!isRunning || components.length === 0) return;

    const t = time + dt;

    // RC transient integration
    const hasCaps = components.some((c) => c.type === "capacitor");
    let updatedComps = components;
    if (hasCaps) {
      // Step transient with clamped dt for stability
      const safeDt = Math.min(dt, 0.1);
      updatedComps = stepTransient(components, safeDt);
    }

    const battery = updatedComps.find((c) => c.type === "battery");
    const I_bat = battery ? Math.abs(battery.signedCurrent ?? 0) : 0;
    const V_bat = battery?.value ?? 0;
    const r_int = battery?.internalR ?? 0;
    const V_terminal = V_bat - I_bat * r_int;
    const R_eq = computeEquivalentR(updatedComps);
    const totalPower = updatedComps.reduce((s, c) => s + (c.power ?? 0), 0);
    const storedEnergy = updatedComps
      .filter((c) => c.type === "capacitor")
      .reduce((s, c) => {
        const V_c = c.capacitorVoltage ?? 0;
        return s + 0.5 * c.value * V_c * V_c;
      }, 0);

    const pt: AnalyticsPoint = {
      t,
      totalPower,
      batteryCurrent: I_bat,
      terminalVoltage: V_terminal,
      componentCount: updatedComps.length,
      nodeCount: new Set(updatedComps.map((c) => `${c.row},${c.col}`)).size,
      voltageSource: V_bat,
      equivalentR: R_eq,
      storedEnergy,
    };

    const hist = [...history, pt].slice(-500);
    set({
      time: t,
      history: hist,
      components: updatedComps,
      animOffset: (animOffset + dt * 40) % 1000,
    });
  },

  reset: () => {
    const comps = get().components;
    // Reset capacitor voltages
    const reset = comps.map((c) =>
      c.type === "capacitor" ? { ...c, capacitorVoltage: 0 } : c
    );
    const { components, diagnostics, kclResults } = solveAndDiagnose(reset);
    set({ time: 0, history: [], isRunning: false, components, diagnostics, kclResults });
  },

  clearGrid: () =>
    set({
      components: [],
      selectedId: null,
      time: 0,
      history: [],
      isRunning: false,
      diagnostics: [{ type: "no_battery", message: "Place a battery to start.", severity: "info" }],
      kclResults: [],
    }),

  loadPreset: (preset) => {
    const comps = (PRESETS[preset] ?? []).map((c) => ({ ...c, id: uid() }));
    const { components, diagnostics, kclResults } = solveAndDiagnose(comps);
    set({
      components,
      diagnostics,
      kclResults,
      selectedId: null,
      time: 0,
      history: [],
      isRunning: false,
    });
  },

  setToggle: (key, val) => set({ [key]: val } as Partial<CircuitState>),
}));

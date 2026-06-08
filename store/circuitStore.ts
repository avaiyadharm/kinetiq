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

export type Orientation = "H" | "V"; // Horizontal or Vertical

export interface GridComponent {
  id: string;
  type: ComponentType;
  row: number;
  col: number;
  orientation: Orientation;
  /** For resistor: resistance in Ω; battery: voltage in V; capacitor: capacitance in F */
  value: number;
  /** Switch open/closed */
  closed?: boolean;
  /** Computed by solver */
  voltage?: number;
  current?: number;
  power?: number;
  /** For bulb/LED brightness 0–1 */
  brightness?: number;
}

export interface Node {
  id: string;
  voltage: number;
}

export interface AnalyticsPoint {
  t: number;
  totalPower: number;
  totalCurrent: number;
  componentCount: number;
  nodeCount: number;
  voltageSource: number;
}

// ─── MNA Solver ───────────────────────────────────────────────────────────────
// Simplified MNA: treats battery as ideal voltage source, resistors/bulbs as conductances.
// Returns per-component voltages, currents, power.

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / pivot;
      for (let k = col; k <= n; k++) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
  }
  return aug.map((row, i) => {
    const d = row[i];
    return Math.abs(d) < 1e-12 ? 0 : row[n] / d;
  });
}

export function solveCircuit(components: GridComponent[]): GridComponent[] {
  // Build node map: each unique grid-point touched by a component endpoint gets a node.
  // Wire endpoints merge nodes.
  const nodeMap = new Map<string, number>(); // pointKey -> nodeId
  let nextNode = 0;

  const getOrCreateNode = (key: string): number => {
    if (!nodeMap.has(key)) nodeMap.set(key, nextNode++);
    return nodeMap.get(key)!;
  };

  // Compute endpoints for each component
  type CompWithEndpoints = GridComponent & { n1: number; n2: number };
  const comps: CompWithEndpoints[] = components.map((c) => {
    let r1 = c.row, c1 = c.col, r2 = c.row, c2 = c.col;
    if (c.orientation === "H") {
      c2 = c.col + 1;
    } else {
      r2 = c.row + 1;
    }
    const k1 = `${r1},${c1}`;
    const k2 = `${r2},${c2}`;
    return {
      ...c,
      n1: getOrCreateNode(k1),
      n2: getOrCreateNode(k2),
    };
  });

  // Wire merges nodes (union-find)
  const parent: number[] = Array.from({ length: nextNode }, (_, i) => i);
  const find = (x: number): number =>
    parent[x] === x ? x : (parent[x] = find(parent[x]));
  const union = (a: number, b: number) => {
    a = find(a); b = find(b);
    if (a !== b) parent[a] = b;
  };

  for (const c of comps) {
    if (c.type === "wire" || (c.type === "switch" && c.closed)) {
      union(c.n1, c.n2);
    }
  }

  // Re-map all nodes through union-find
  const remapped = (n: number) => find(n);

  // Find ground node: node connected to any battery negative terminal
  let groundNode = -1;
  for (const c of comps) {
    if (c.type === "battery") {
      groundNode = remapped(c.n2); // negative = ground
      break;
    }
  }
  if (groundNode === -1) {
    // No battery, set first node as ground
    groundNode = remapped(comps[0]?.n1 ?? 0);
  }

  // Collect unique non-ground nodes
  const allNodes = new Set<number>();
  for (const c of comps) {
    allNodes.add(remapped(c.n1));
    allNodes.add(remapped(c.n2));
  }
  allNodes.delete(groundNode);
  const nodeList = Array.from(allNodes);
  const nodeIndex = new Map<number, number>();
  nodeList.forEach((n, i) => nodeIndex.set(n, i));

  // Identify voltage sources (batteries)
  const voltageSources = comps.filter(
    (c) => c.type === "battery" && remapped(c.n1) !== remapped(c.n2)
  );

  const numNodes = nodeList.length;
  const numVS = voltageSources.length;
  const size = numNodes + numVS;
  if (size === 0) return components.map((c) => ({ ...c, voltage: 0, current: 0, power: 0, brightness: 0 }));

  const G: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const bVec: number[] = new Array(size).fill(0);

  const nIdx = (n: number) => nodeIndex.get(remapped(n)) ?? -1;

  // Stamp conductances
  for (const c of comps) {
    if (c.type === "wire" || c.type === "switch" || c.type === "battery" || c.type === "ground") continue;
    let R = c.value;
    if (c.type === "bulb") R = Math.max(c.value, 10); // min 10Ω for bulb
    if (c.type === "led") R = Math.max(c.value, 50);
    if (c.type === "voltmeter") R = 1e6; // very high impedance
    if (c.type === "ammeter") R = 0.001; // very low impedance
    if (c.type === "capacitor") R = 1e9; // DC: capacitor = open circuit
    const g = 1 / Math.max(R, 1e-9);
    const i1 = nIdx(c.n1);
    const i2 = nIdx(c.n2);
    if (i1 >= 0) G[i1][i1] += g;
    if (i2 >= 0) G[i2][i2] += g;
    if (i1 >= 0 && i2 >= 0) { G[i1][i2] -= g; G[i2][i1] -= g; }
  }

  // Stamp voltage sources
  voltageSources.forEach((vs, k) => {
    const row = numNodes + k;
    const i1 = nIdx(vs.n1);
    const i2 = nIdx(vs.n2);
    if (i1 >= 0) { G[row][i1] = 1; G[i1][row] = 1; }
    if (i2 >= 0) { G[row][i2] = -1; G[i2][row] = -1; }
    bVec[row] = vs.value;
  });

  let solution: number[];
  try {
    solution = gaussianElimination(G, bVec);
  } catch {
    solution = new Array(size).fill(0);
  }

  const nodeVoltage = (n: number): number => {
    const rn = remapped(n);
    if (rn === groundNode) return 0;
    const idx = nodeIndex.get(rn);
    return idx !== undefined ? (solution[idx] ?? 0) : 0;
  };

  // Compute per-component quantities
  return comps.map((c) => {
    const v1 = nodeVoltage(c.n1);
    const v2 = nodeVoltage(c.n2);
    const dv = v1 - v2;
    let current = 0;
    let power = 0;
    let brightness = 0;

    if (c.type === "resistor") {
      current = dv / Math.max(c.value, 1e-9);
      power = current * dv;
    } else if (c.type === "bulb") {
      const R = Math.max(c.value, 10);
      current = dv / R;
      power = current * dv;
      brightness = Math.min(1, Math.abs(power) / 5); // 5W = full brightness
    } else if (c.type === "led") {
      const R = Math.max(c.value, 50);
      current = dv / R;
      power = current * dv;
      brightness = Math.min(1, Math.abs(power) / 0.5); // 0.5W = full
    } else if (c.type === "battery") {
      const vsIdx = voltageSources.findIndex((v) => v.id === c.id);
      current = vsIdx >= 0 ? -(solution[numNodes + vsIdx] ?? 0) : 0;
      power = current * c.value;
    } else if (c.type === "ammeter") {
      current = dv / 0.001;
    } else if (c.type === "voltmeter") {
      current = 0;
    }

    return {
      ...c,
      voltage: Math.abs(dv),
      current: Math.abs(current),
      power: Math.abs(power),
      brightness: Math.max(0, brightness),
    };
  });
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

  // Simulation
  isRunning: boolean;
  time: number;
  history: AnalyticsPoint[];

  // UI
  showGrid: boolean;
  showVoltageColors: boolean;
  showCurrentFlow: boolean;
  showPowerHeat: boolean;
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
  setDefault: (key: "defaultResistance" | "defaultVoltage" | "defaultCapacitance" | "defaultBulbR" | "defaultLedR", val: number) => void;
  setRunning: (v: boolean) => void;
  tick: (dt: number) => void;
  reset: () => void;
  clearGrid: () => void;
  loadPreset: (preset: "series" | "parallel" | "bridge" | "rc" | "mixed") => void;
  setToggle: (key: "showGrid" | "showVoltageColors" | "showCurrentFlow" | "showPowerHeat", val: boolean) => void;
}

let _idCounter = 0;
const uid = () => `c${++_idCounter}`;

const DEFAULT_VALUES: Record<ComponentType, number> = {
  wire: 0,
  resistor: 100,
  battery: 9,
  switch: 0,
  bulb: 60,   // Ω
  capacitor: 0.0001,
  led: 100,
  voltmeter: 1e6,
  ammeter: 0.001,
  ground: 0,
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
    ...overrides,
  };
}

// Presets
const PRESETS: Record<string, GridComponent[]> = {
  series: [
    makeComp("battery",   2, 1, "V", { value: 9 }),
    makeComp("wire",      1, 1, "H"),
    makeComp("resistor",  1, 2, "H", { value: 220 }),
    makeComp("wire",      1, 3, "H"),
    makeComp("bulb",      1, 4, "V", { value: 60 }),
    makeComp("wire",      2, 4, "H"),
    makeComp("wire",      2, 3, "H"),
    makeComp("wire",      2, 2, "H"),
    makeComp("wire",      3, 1, "H"),
    makeComp("wire",      3, 2, "H"),
    makeComp("wire",      3, 3, "H"),
    makeComp("wire",      3, 4, "H"),
  ],
  parallel: [
    makeComp("battery",   2, 1, "V", { value: 12 }),
    makeComp("wire",      1, 1, "H"),
    makeComp("wire",      1, 2, "H"),
    makeComp("wire",      1, 3, "H"),
    makeComp("resistor",  1, 4, "V", { value: 100 }),
    makeComp("resistor",  1, 5, "V", { value: 220 }),
    makeComp("wire",      3, 1, "H"),
    makeComp("wire",      3, 2, "H"),
    makeComp("wire",      3, 3, "H"),
    makeComp("wire",      3, 4, "H"),
    makeComp("wire",      3, 5, "H"),
    makeComp("wire",      1, 6, "H"),
    makeComp("wire",      3, 6, "H"),
    makeComp("wire",      2, 6, "V"),
  ],
  rc: [
    makeComp("battery",   2, 1, "V", { value: 5 }),
    makeComp("wire",      1, 1, "H"),
    makeComp("resistor",  1, 2, "H", { value: 1000 }),
    makeComp("wire",      1, 3, "H"),
    makeComp("capacitor", 1, 4, "V", { value: 0.001 }),
    makeComp("wire",      3, 1, "H"),
    makeComp("wire",      3, 2, "H"),
    makeComp("wire",      3, 3, "H"),
    makeComp("wire",      3, 4, "H"),
    makeComp("switch",    2, 0, "V", { closed: false }),
  ],
  bridge: [
    makeComp("battery",   3, 0, "V", { value: 10 }),
    makeComp("wire",      2, 0, "H"),
    makeComp("resistor",  2, 1, "V", { value: 100 }),
    makeComp("resistor",  2, 2, "V", { value: 220 }),
    makeComp("resistor",  1, 1, "H", { value: 470 }),
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
    makeComp("switch",    1, 0, "V", { closed: true }),
    makeComp("wire",      0, 0, "H"),
    makeComp("resistor",  0, 1, "H", { value: 100 }),
    makeComp("wire",      0, 2, "H"),
    makeComp("bulb",      0, 3, "V", { value: 40 }),
    makeComp("resistor",  0, 4, "V", { value: 220 }),
    makeComp("wire",      2, 3, "H"),
    makeComp("wire",      2, 4, "H"),
    makeComp("wire",      4, 0, "H"),
    makeComp("wire",      4, 1, "H"),
    makeComp("wire",      4, 2, "H"),
    makeComp("wire",      4, 3, "H"),
    makeComp("wire",      4, 4, "H"),
    makeComp("led",       2, 1, "V", { value: 80 }),
    makeComp("wire",      2, 0, "H"),
    makeComp("wire",      2, 2, "H"),
  ],
};

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
  isRunning: false,
  time: 0,
  history: [],
  showGrid: true,
  showVoltageColors: true,
  showCurrentFlow: true,
  showPowerHeat: true,
  animOffset: 0,

  setActivePalette: (p) => set({ activePalette: p }),
  setActiveOrientation: (o) => set({ activeOrientation: o }),

  placeComponent: (row, col) => {
    const { activePalette, activeOrientation, components, defaultResistance, defaultVoltage, defaultCapacitance, defaultBulbR, defaultLedR } = get();
    // Prevent duplicate exact placement
    const existing = components.find(
      (c) => c.row === row && c.col === col && c.orientation === activeOrientation
    );
    if (existing) return;

    const valueOverrides: Partial<GridComponent> = {};
    if (activePalette === "resistor") valueOverrides.value = defaultResistance;
    if (activePalette === "battery") valueOverrides.value = defaultVoltage;
    if (activePalette === "capacitor") valueOverrides.value = defaultCapacitance;
    if (activePalette === "bulb") valueOverrides.value = defaultBulbR;
    if (activePalette === "led") valueOverrides.value = defaultLedR;

    const newComp = makeComp(activePalette, row, col, activeOrientation, valueOverrides);
    const updated = solveCircuit([...components, newComp]);
    set({ components: updated });
  },

  removeComponent: (id) => {
    const comps = get().components.filter((c) => c.id !== id);
    const updated = comps.length > 0 ? solveCircuit(comps) : comps;
    set({ components: updated, selectedId: null });
  },

  selectComponent: (id) => set({ selectedId: id }),

  setHoveredCell: (cell) => set({ hoveredCell: cell }),

  toggleSwitch: (id) => {
    const comps = get().components.map((c) =>
      c.id === id && c.type === "switch" ? { ...c, closed: !c.closed } : c
    );
    const updated = solveCircuit(comps);
    set({ components: updated });
  },

  updateValue: (id, value) => {
    const comps = get().components.map((c) => (c.id === id ? { ...c, value } : c));
    const updated = solveCircuit(comps);
    set({ components: updated });
  },

  setDefault: (key, val) => set({ [key]: val } as Partial<CircuitState>),

  setRunning: (v) => set({ isRunning: v }),

  tick: (dt) => {
    const { components, time, history, isRunning, animOffset } = get();
    if (!isRunning || components.length === 0) return;
    const t = time + dt;
    const totalPower = components.reduce((s, c) => s + (c.power ?? 0), 0);
    const totalCurrent = components
      .filter((c) => c.type !== "wire")
      .reduce((s, c) => s + (c.current ?? 0), 0) / Math.max(1, components.filter((c) => c.type !== "wire").length);
    const battery = components.find((c) => c.type === "battery");
    const pt: AnalyticsPoint = {
      t,
      totalPower,
      totalCurrent,
      componentCount: components.length,
      nodeCount: new Set(components.map((c) => `${c.row},${c.col}`)).size,
      voltageSource: battery?.value ?? 0,
    };
    const hist = [...history, pt].slice(-500);
    set({ time: t, history: hist, animOffset: (animOffset + dt * 40) % 1000 });
  },

  reset: () => {
    const comps = get().components;
    const updated = comps.length > 0 ? solveCircuit(comps) : comps;
    set({ time: 0, history: [], isRunning: false, components: updated });
  },

  clearGrid: () => set({ components: [], selectedId: null, time: 0, history: [], isRunning: false }),

  loadPreset: (preset) => {
    const comps = (PRESETS[preset] ?? []).map((c) => ({ ...c, id: uid() }));
    const updated = comps.length > 0 ? solveCircuit(comps) : comps;
    set({ components: updated, selectedId: null, time: 0, history: [], isRunning: false });
  },

  setToggle: (key, val) => set({ [key]: val } as Partial<CircuitState>),
}));

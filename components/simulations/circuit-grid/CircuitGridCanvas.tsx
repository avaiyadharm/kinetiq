"use client";
import React, { useRef, useEffect, useCallback } from "react";
import {
  useCircuitStore,
  GridComponent,
  ComponentType,
} from "@/store/circuitStore";

const CELL = 54;
const PAD = 16;

// ─── Color helpers ─────────────────────────────────────────────────────────────

function voltageColor(v: number, maxV: number): string {
  const t = Math.min(1, Math.abs(v) / Math.max(maxV, 1e-3));
  // Blue (low) → Red (high)
  const r = Math.round(59 + (239 - 59) * t);
  const g = Math.round(130 - 130 * t);
  const b = Math.round(246 - 246 * t);
  return `rgb(${r},${g},${b})`;
}

function powerColor(p: number, maxP: number): string {
  const t = Math.min(1, p / Math.max(maxP, 1e-3));
  const r = Math.round(249 + 6 * t);
  const g = Math.round(115 - 115 * t);
  const b = Math.round(22 - 22 * t);
  return `rgba(${r},${g},${b},${0.15 + 0.55 * t})`;
}

// Map filament temperature (K) to approximate blackbody glow color
function temperatureColor(T: number): string {
  // Simplified: 800K=deep red, 1500K=orange, 2700K=warm white
  const t = Math.min(1, Math.max(0, (T - 800) / (2700 - 800)));
  const r = Math.round(200 + 55 * t);
  const g = Math.round(60 + 140 * t);
  const b = Math.round(0 + 80 * t);
  return `rgb(${r},${g},${b})`;
}

// ─── Component renderer ────────────────────────────────────────────────────────

function drawComponent(
  ctx: CanvasRenderingContext2D,
  c: GridComponent,
  selected: boolean,
  showVoltageColors: boolean,
  showPowerHeat: boolean,
  showCurrentDirection: boolean,
  maxV: number,
  maxP: number,
  animOffset: number,
  showCurrentFlow: boolean
) {
  const x = PAD + c.col * CELL;
  const y = PAD + c.row * CELL;
  const isH = c.orientation === "H";
  const len = CELL;
  const x2 = isH ? x + len : x;
  const y2 = isH ? y : y + len;
  const mx = (x + x2) / 2;
  const my = (y + y2) / 2;

  ctx.save();

  // ── Power heat overlay ────────────────────────────────────────────────────
  if (showPowerHeat && (c.power ?? 0) > 0.001) {
    const heatR = c.isOverloaded ? 26 : 18;
    const grad = ctx.createRadialGradient(mx, my, 0, mx, my, heatR);
    if (c.isOverloaded) {
      grad.addColorStop(0, "rgba(255,30,0,0.45)");
      grad.addColorStop(1, "transparent");
    } else {
      grad.addColorStop(0, powerColor(c.power ?? 0, maxP));
      grad.addColorStop(1, "transparent");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mx, my, heatR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Overload warning ring ─────────────────────────────────────────────────
  if (c.isOverloaded) {
    ctx.strokeStyle = "rgba(255,50,50,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(mx - 20, my - 20, 40, 40);
    ctx.setLineDash([]);
  }

  // ── Wire voltage color ────────────────────────────────────────────────────
  const wireBaseColor =
    showVoltageColors && (c.voltage ?? 0) > 0.01
      ? voltageColor(c.voltage ?? 0, maxV)
      : "rgba(255,255,255,0.15)";

  // ── Current flow animation (directional) ──────────────────────────────────
  if (
    c.type === "wire" &&
    showCurrentFlow &&
    (c.current ?? 0) > 1e-6
  ) {
    // Use signed current to determine direction
    const sc = c.signedCurrent ?? c.current ?? 0;
    const direction = sc >= 0 ? 1 : -1; // +1 = n1→n2, -1 = n2→n1
    ctx.setLineDash([6, 12]);
    // Positive current flows from col→col+1 (H) or row→row+1 (V)
    ctx.lineDashOffset = -(direction * animOffset) % 18;
    ctx.strokeStyle = `rgba(96,165,250,0.55)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Component drawing ─────────────────────────────────────────────────────
  switch (c.type) {
    case "wire": {
      ctx.strokeStyle = wireBaseColor;
      ctx.lineWidth = selected ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Directional arrow on mid-wire
      if (
        showCurrentDirection &&
        (c.current ?? 0) > 1e-6
      ) {
        const sc = c.signedCurrent ?? 0;
        const dir = sc >= 0 ? 1 : -1;
        ctx.save();
        ctx.translate(mx, my);
        if (isH) {
          ctx.rotate(dir > 0 ? 0 : Math.PI);
        } else {
          ctx.rotate(dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        }
        ctx.fillStyle = "rgba(96,165,250,0.8)";
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case "resistor": {
      const rColor = selected ? "#60a5fa" : "#f59e0b";
      ctx.strokeStyle = rColor;
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 14, y);
        ctx.moveTo(mx + 14, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx - 14, y);
        [-14, -10, -6, -2, 2, 6, 10, 14].forEach((px, i) =>
          ctx.lineTo(mx + px, i % 2 === 0 ? y - 8 : y + 8)
        );
        ctx.lineTo(mx + 14, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 14);
        ctx.moveTo(x, my + 14);
        ctx.lineTo(x, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my - 14);
        [-14, -10, -6, -2, 2, 6, 10, 14].forEach((py, i) =>
          ctx.lineTo(i % 2 === 0 ? x - 8 : x + 8, my + py)
        );
        ctx.lineTo(x, my + 14);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(245,158,11,0.9)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `${c.value >= 1000 ? (c.value / 1000).toFixed(1) + "kΩ" : c.value + "Ω"}`,
        mx,
        isH ? y - 14 : x - 18
      );
      if ((c.current ?? 0) > 1e-6) {
        // Show signed current with direction arrow
        const sc = c.signedCurrent ?? 0;
        const arrow = sc >= 0 ? "→" : "←";
        ctx.fillStyle = "rgba(251,191,36,0.7)";
        ctx.fillText(
          `${arrow}${(c.current! * 1000).toFixed(1)}mA`,
          mx,
          isH ? y + 18 : x + 28
        );
      }
      break;
    }

    case "battery": {
      const batColor = selected ? "#60a5fa" : "#10b981";
      ctx.strokeStyle = batColor;
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 10, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 10, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(mx - 10, y - 12);
        ctx.lineTo(mx - 10, y + 12);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx + 10, y - 8);
        ctx.lineTo(mx + 10, y + 8);
        ctx.stroke();
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("+", mx - 10, y - 17);
        ctx.fillText("−", mx + 10, y - 13);
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 10);
        ctx.lineTo(x, y2);
        ctx.stroke();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 12, my - 10);
        ctx.lineTo(x + 12, my - 10);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 8, my + 10);
        ctx.lineTo(x + 8, my + 10);
        ctx.stroke();
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("+", x - 18, my - 9);
        ctx.fillText("−", x - 14, my + 12);
      }
      // Internal resistance indicator
      const r_int = c.internalR ?? 0;
      const I_bat = c.current ?? 0;
      const V_terminal = c.value - I_bat * r_int;
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`${c.value}V`, mx, isH ? y - 16 : x - 20);
      if (r_int > 0) {
        ctx.fillStyle = "rgba(52,211,153,0.6)";
        ctx.font = "bold 8px monospace";
        ctx.fillText(
          `Vt=${V_terminal.toFixed(2)}V`,
          mx,
          isH ? y + 16 : x + 22
        );
      }
      break;
    }

    case "switch": {
      const isOpen = !c.closed;
      ctx.strokeStyle = selected
        ? "#60a5fa"
        : isOpen
        ? "#ef4444"
        : "#22d3ee";
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 8, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 8, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx - 8, y);
        if (isOpen) ctx.lineTo(mx + 4, y - 14);
        else ctx.lineTo(mx + 8, y);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle as string;
        ctx.beginPath();
        ctx.arc(mx - 8, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx + 8, y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 8);
        ctx.lineTo(x, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my - 8);
        if (isOpen) ctx.lineTo(x + 14, my + 4);
        else ctx.lineTo(x, my + 8);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle as string;
        ctx.beginPath();
        ctx.arc(x, my - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, my + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = isOpen ? "#f87171" : "#67e8f9";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        isOpen ? "OPEN" : "CLOSED",
        mx,
        isH ? y - 16 : x - 20
      );
      break;
    }

    case "bulb": {
      const brightness = c.brightness ?? 0;
      const T = c.temperature ?? 293;
      const glowColor =
        brightness > 0.01
          ? temperatureColor(T)
          : "#ffffff20";
      const glow = Math.round(255 * brightness);
      ctx.strokeStyle = selected ? "#60a5fa" : glowColor;
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 12, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 12, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 12);
        ctx.lineTo(x, y2);
        ctx.stroke();
      }
      if (brightness > 0.01) {
        const glowGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 32);
        glowGrad.addColorStop(
          0,
          `rgba(${Math.min(255, 200 + glow)},${Math.round(180 * brightness)},0,${0.35 * brightness})`
        );
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(mx, my, 32, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = selected ? "#60a5fa" : glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx - 6, my - 6);
      ctx.lineTo(mx + 6, my + 6);
      ctx.moveTo(mx + 6, my - 6);
      ctx.lineTo(mx - 6, my + 6);
      ctx.stroke();
      if ((c.power ?? 0) > 0.001) {
        ctx.fillStyle = `rgba(255,200,50,${0.6 + 0.4 * brightness})`;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `${(c.power ?? 0).toFixed(2)}W`,
          mx,
          isH ? y - 16 : x - 22
        );
        // Temperature label
        if (T > 500) {
          ctx.fillStyle = "rgba(255,150,50,0.6)";
          ctx.font = "bold 8px monospace";
          ctx.fillText(
            `${Math.round(T)}K`,
            mx,
            isH ? y + 18 : x + 28
          );
        }
      }
      break;
    }

    case "capacitor": {
      const capVoltage = c.capacitorVoltage ?? 0;
      const maxCapV = c.voltage ?? 0.001;
      const chargeLevel = Math.min(1, Math.abs(capVoltage) / Math.max(maxCapV, 0.001));
      const capColor = selected ? "#60a5fa" : "#a78bfa";
      ctx.strokeStyle = capColor;
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 6, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 6, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        // Plates — color indicates charge level
        ctx.strokeStyle =
          chargeLevel > 0.05
            ? `rgba(167,139,250,${0.4 + 0.6 * chargeLevel})`
            : capColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(mx - 6, y - 12);
        ctx.lineTo(mx - 6, y + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 6, y - 12);
        ctx.lineTo(mx + 6, y + 12);
        ctx.stroke();
        ctx.lineWidth = 2;
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 6);
        ctx.lineTo(x, y2);
        ctx.stroke();
        ctx.strokeStyle =
          chargeLevel > 0.05
            ? `rgba(167,139,250,${0.4 + 0.6 * chargeLevel})`
            : capColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 12, my - 6);
        ctx.lineTo(x + 12, my - 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 12, my + 6);
        ctx.lineTo(x + 12, my + 6);
        ctx.stroke();
        ctx.lineWidth = 2;
      }
      ctx.fillStyle = "#c4b5fd";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      const capLabel =
        c.value >= 0.001
          ? `${(c.value * 1000).toFixed(1)}mF`
          : `${(c.value * 1e6).toFixed(0)}μF`;
      ctx.fillText(capLabel, mx, isH ? y - 16 : x - 22);
      // Show V_C during transient
      if (Math.abs(capVoltage) > 0.001) {
        ctx.fillStyle = "rgba(196,181,253,0.75)";
        ctx.font = "bold 8px monospace";
        ctx.fillText(
          `Vc=${capVoltage.toFixed(2)}V`,
          mx,
          isH ? y + 18 : x + 28
        );
      }
      break;
    }

    case "led": {
      const brightness = c.brightness ?? 0;
      const ledColor =
        brightness > 0.01
          ? `rgba(34,211,238,${0.3 + 0.7 * brightness})`
          : "#22d3ee30";
      ctx.strokeStyle = selected ? "#60a5fa" : "#22d3ee";
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 10, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 10, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx - 8, y - 8);
        ctx.lineTo(mx - 8, y + 8);
        ctx.lineTo(mx + 8, y);
        ctx.closePath();
        ctx.fillStyle = ledColor;
        ctx.fill();
        ctx.strokeStyle = "#22d3ee";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 8, y - 8);
        ctx.lineTo(mx + 8, y + 8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 10);
        ctx.lineTo(x, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, my - 8);
        ctx.lineTo(x + 8, my - 8);
        ctx.lineTo(x, my + 8);
        ctx.closePath();
        ctx.fillStyle = ledColor;
        ctx.fill();
        ctx.strokeStyle = "#22d3ee";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 8, my + 8);
        ctx.lineTo(x + 8, my + 8);
        ctx.stroke();
      }
      if (brightness > 0.01) {
        const glowG = ctx.createRadialGradient(mx, my, 0, mx, my, 22);
        glowG.addColorStop(
          0,
          `rgba(34,211,238,${0.4 * brightness})`
        );
        glowG.addColorStop(1, "transparent");
        ctx.fillStyle = glowG;
        ctx.beginPath();
        ctx.arc(mx, my, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "voltmeter": {
      ctx.strokeStyle = selected ? "#60a5fa" : "#f472b6";
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 12, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 12, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 12);
        ctx.lineTo(x, y2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(244,114,182,0.1)";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f472b6";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("V", mx, my + 4);
      if ((c.voltage ?? 0) > 0.001) {
        ctx.fillStyle = "#f472b6";
        ctx.font = "bold 9px monospace";
        ctx.fillText(
          `${(c.signedVoltage ?? c.voltage ?? 0).toFixed(2)}V`,
          mx,
          isH ? y - 18 : x - 24
        );
      }
      break;
    }

    case "ammeter": {
      ctx.strokeStyle = selected ? "#60a5fa" : "#fb923c";
      ctx.lineWidth = 2;
      if (isH) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx - 12, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + 12, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, my - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, my + 12);
        ctx.lineTo(x, y2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251,146,60,0.1)";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fb923c";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("A", mx, my + 4);
      if ((c.current ?? 0) > 0.0001) {
        const sc = c.signedCurrent ?? 0;
        const arrow = sc >= 0 ? "→" : "←";
        ctx.fillStyle = "#fb923c";
        ctx.font = "bold 9px monospace";
        ctx.fillText(
          `${arrow}${(c.current! * 1000).toFixed(1)}mA`,
          mx,
          isH ? y - 18 : x - 24
        );
      }
      break;
    }

    case "ground": {
      ctx.strokeStyle = selected ? "#60a5fa" : "#6b7280";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 16);
      ctx.stroke();
      [16, 10, 5].forEach((w, i) => {
        const yg = y + 16 + i * 6;
        ctx.beginPath();
        ctx.moveTo(x - w, yg);
        ctx.lineTo(x + w, yg);
        ctx.stroke();
      });
      break;
    }
  }

  // ── Selection highlight ──────────────────────────────────────────────────
  if (selected) {
    ctx.strokeStyle = "rgba(96,165,250,0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(mx - 18, my - 18, 36, 36);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────

export const CircuitGridCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isMouseDown = useRef(false);

  const {
    gridRows,
    gridCols,
    components,
    selectedId,
    hoveredCell,
    showGrid,
    showVoltageColors,
    showCurrentFlow,
    showPowerHeat,
    showNodeLabels,
    showCurrentDirection,
    activePalette,
    activeOrientation,
    animOffset,
    isRunning,
    diagnostics,
    placeComponent,
    removeComponent,
    selectComponent,
    setHoveredCell,
    tick,
    toggleSwitch,
  } = useCircuitStore();

  const W = PAD * 2 + gridCols * CELL;
  const H = PAD * 2 + gridRows * CELL;

  const maxV = Math.max(1, ...components.map((c) => c.voltage ?? 0));
  const maxP = Math.max(1, ...components.map((c) => c.power ?? 0));

  // Animation loop
  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0a0a0f");
    bgGrad.addColorStop(1, "#0d0d18");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    if (showGrid) {
      for (let r = 0; r <= gridRows; r++) {
        for (let cc = 0; cc <= gridCols; cc++) {
          const gx = PAD + cc * CELL;
          const gy = PAD + r * CELL;
          ctx.fillStyle = "rgba(255,255,255,0.07)";
          ctx.beginPath();
          ctx.arc(gx, gy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Node voltage labels at intersections
    if (showNodeLabels && showVoltageColors) {
      const nodeSet = new Map<string, number>();
      for (const c of components) {
        const v = c.voltage ?? 0;
        const sv = c.signedVoltage ?? v;
        const k1 = `${c.row},${c.col}`;
        const k2 =
          c.orientation === "H"
            ? `${c.row},${c.col + 1}`
            : `${c.row + 1},${c.col}`;
        // n1 has voltage v1 = sv + v2, but we approximate with component voltage
        if (!nodeSet.has(k1)) nodeSet.set(k1, Math.abs(sv));
        if (!nodeSet.has(k2)) nodeSet.set(k2, 0);
      }
      // Try to get absolute voltages from battery perspective
      const battery = components.find((c) => c.type === "battery");
      if (battery) {
        const sv = battery.signedVoltage ?? battery.value;
        const k1 = `${battery.row},${battery.col}`;
        nodeSet.set(k1, Math.abs(sv)); // (+) terminal
        const k2 =
          battery.orientation === "H"
            ? `${battery.row},${battery.col + 1}`
            : `${battery.row + 1},${battery.col}`;
        nodeSet.set(k2, 0); // (−) terminal = ground
      }

      ctx.save();
      nodeSet.forEach((voltage, key) => {
        const [rStr, cStr] = key.split(",");
        const r = parseInt(rStr);
        const cc = parseInt(cStr);
        const gx = PAD + cc * CELL;
        const gy = PAD + r * CELL;
        const col = voltageColor(voltage, maxV);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${voltage.toFixed(1)}V`, gx + 6, gy - 5);
      });
      ctx.restore();
    }

    // Hover preview
    if (hoveredCell) {
      const hx = PAD + hoveredCell.col * CELL;
      const hy = PAD + hoveredCell.row * CELL;
      ctx.strokeStyle = "rgba(96,165,250,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const ex =
        activePalette === "ground"
          ? hx
          : activeOrientation === "H"
          ? hx + CELL
          : hx;
      const ey =
        activePalette === "ground"
          ? hy + 28
          : activeOrientation === "H"
          ? hy
          : hy + CELL;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(96,165,250,0.15)";
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw components
    for (const c of components) {
      drawComponent(
        ctx,
        c,
        c.id === selectedId,
        showVoltageColors,
        showPowerHeat,
        showCurrentDirection,
        maxV,
        maxP,
        animOffset,
        showCurrentFlow
      );
    }

    // Diagnostic overlay — red X on shorted battery, warning triangles
    const errors = diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      const shortDiag = diagnostics.find((d) => d.type === "short_circuit");
      if (shortDiag?.componentIds) {
        for (const cid of shortDiag.componentIds) {
          const comp = components.find((c) => c.id === cid);
          if (comp) {
            const cx = PAD + comp.col * CELL;
            const cy = PAD + comp.row * CELL;
            const mx2 =
              comp.orientation === "H"
                ? cx + CELL / 2
                : cx;
            const my2 =
              comp.orientation === "H"
                ? cy
                : cy + CELL / 2;
            ctx.save();
            ctx.fillStyle = "rgba(239,68,68,0.9)";
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "center";
            ctx.fillText("⚡SHORT⚡", mx2, my2 - 24);
            ctx.restore();
          }
        }
      }
    }
  }, [
    components,
    selectedId,
    hoveredCell,
    showGrid,
    showVoltageColors,
    showCurrentFlow,
    showPowerHeat,
    showNodeLabels,
    showCurrentDirection,
    maxV,
    maxP,
    animOffset,
    W,
    H,
    gridRows,
    gridCols,
    activePalette,
    activeOrientation,
    diagnostics,
  ]);

  const getCellFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;
      const col = Math.round((px - PAD) / CELL);
      const row = Math.round((py - PAD) / CELL);
      return { row, col };
    },
    [W, H]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isMouseDown.current = true;
      const { row, col } = getCellFromEvent(e);
      if (row < 0 || col < 0 || row >= gridRows || col >= gridCols) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      const hit = components.find((c) => {
        const cx = PAD + c.col * CELL;
        const cy = PAD + c.row * CELL;
        const ex = c.orientation === "H" ? cx + CELL : cx;
        const ey = c.orientation === "H" ? cy : cy + CELL;
        const mx = (cx + ex) / 2;
        const my = (cy + ey) / 2;
        return Math.hypot(px - mx, py - my) < 24;
      });

      if (hit) {
        if (e.button === 2) {
          removeComponent(hit.id);
        } else if (hit.type === "switch") {
          toggleSwitch(hit.id);
          selectComponent(hit.id);
        } else {
          selectComponent(hit.id);
        }
        return;
      }

      selectComponent(null);
      placeComponent(row, col);
    },
    [
      getCellFromEvent,
      components,
      gridRows,
      gridCols,
      W,
      H,
      placeComponent,
      removeComponent,
      selectComponent,
      toggleSwitch,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { row, col } = getCellFromEvent(e);
      if (row >= 0 && col >= 0 && row < gridRows && col < gridCols) {
        setHoveredCell({ row, col });
        if (isMouseDown.current && activePalette === "wire") {
          placeComponent(row, col);
        }
      } else {
        setHoveredCell(null);
      }
    },
    [
      getCellFromEvent,
      gridRows,
      gridCols,
      setHoveredCell,
      placeComponent,
      activePalette,
    ]
  );

  const handleMouseUp = () => {
    isMouseDown.current = false;
  };
  const handleMouseLeave = () => {
    isMouseDown.current = false;
    setHoveredCell(null);
  };
  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      className="w-full h-full overflow-auto flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 40% 40%, rgba(59,130,246,0.04) 0%, transparent 70%)",
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-white/5 cursor-crosshair shadow-2xl"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};

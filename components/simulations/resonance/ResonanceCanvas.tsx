"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type WaveformType = "sine" | "square" | "triangle";

export interface ResonanceParams {
  mass: number;         // m (kg)
  springK: number;       // k (N/m)
  dampingB: number;      // b (N s/m)
  driverAmp: number;     // F0 (N)
  driverFreq: number;    // fd (Hz)
  waveform: WaveformType;
  slowMotion: number;    // Slow-motion factor (0.01 to 1.0)
  isPlaying: boolean;
  showVectors: boolean;
  showPhaseSpace: boolean;
}

interface ResonanceCanvasProps {
  params: ResonanceParams;
  onStateUpdate: (state: {
    currentAmplitude: number;
    qFactor: number;
    phaseLagDeg: number;
    peakFreqHz: number;
    naturalFreqHz: number;
    currentFreqHz: number;
  }) => void;
  resetTrigger: number;
}

export const ResonanceCanvas: React.FC<ResonanceCanvasProps> = ({
  params,
  onStateUpdate,
  resetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Physical State of the Mass-Spring-Damper system
  // x = displacement from equilibrium (meters), positive is down
  // v = velocity (m/s)
  // t_phys = accumulated physical time (seconds)
  const [state, setState] = useState({ x: 0, v: 0, t_phys: 0 });
  const stateRef = useRef({ x: 0, v: 0, t_phys: 0 });

  // History buffer for time series graph (last 300 frames)
  const historyRef = useRef<{ t: number; drive: number; mass: number }[]>([]);

  // Reset the system state
  useEffect(() => {
    stateRef.current = { x: 0, v: 0, t_phys: 0 };
    historyRef.current = [];
    setState({ x: 0, v: 0, t_phys: 0 });
  }, [resetTrigger, params.mass, params.springK]);

  // Handle physical calculations and rendering loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resizing function
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container && canvas) {
        canvas.width = container.clientWidth * window.devicePixelRatio;
        canvas.height = container.clientHeight * window.devicePixelRatio;
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientHeight}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Forcing Waveform Function
    const getDriverForcing = (t: number, f: number, F0: number, type: WaveformType): number => {
      const theta = 2 * Math.PI * f * t;
      if (type === "sine") {
        return F0 * Math.cos(theta);
      } else if (type === "square") {
        return F0 * Math.sign(Math.cos(theta));
      } else if (type === "triangle") {
        // Standard triangle wave from -F0 to F0
        return (2 * F0 / Math.PI) * Math.asin(Math.sin(theta));
      }
      return 0;
    };

    // RK4 integration step
    const integrateRK4 = (
      x: number,
      v: number,
      t: number,
      dt: number,
      m: number,
      k: number,
      b: number,
      F0: number,
      f: number,
      type: WaveformType
    ) => {
      const accel = (tempX: number, tempV: number, tempT: number) => {
        const F = getDriverForcing(tempT, f, F0, type);
        return (F - b * tempV - k * tempX) / m;
      };

      // k1
      const dx1 = v;
      const dv1 = accel(x, v, t);

      // k2
      const dx2 = v + 0.5 * dt * dv1;
      const dv2 = accel(x + 0.5 * dt * dx1, v + 0.5 * dt * dv1, t + 0.5 * dt);

      // k3
      const dx3 = v + 0.5 * dt * dv2;
      const dv3 = accel(x + 0.5 * dt * dx2, v + 0.5 * dt * dv2, t + 0.5 * dt);

      // k4
      const dx4 = v + dt * dv3;
      const dv4 = accel(x + dt * dx3, v + dt * dv3, t + dt);

      const nextX = x + (dt / 6) * (dx1 + 2 * dx2 + 2 * dx3 + dx4);
      const nextV = v + (dt / 6) * (dv1 + 2 * dv2 + 2 * dv3 + dv4);
      const nextT = t + dt;

      return { x: nextX, v: nextV, t_phys: nextT };
    };

    const renderLoop = (now: number) => {
      // Delta time in seconds (limit to 0.1s to avoid instability on tab blur)
      const dt_wall = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const { mass, springK, dampingB, driverAmp, driverFreq, waveform, slowMotion, isPlaying } = params;

      // Natural characteristics
      const omega_0 = Math.sqrt(springK / mass); // rad/s
      const f_0 = omega_0 / (2 * Math.PI); // Hz
      const beta = dampingB / (2 * mass); // damping factor s^-1
      const q = dampingB > 0 ? (omega_0 * mass) / dampingB : Infinity;

      // Peak frequency of amplitude response:
      const omega_peak = beta * beta * 2 < omega_0 * omega_0 
        ? Math.sqrt(omega_0 * omega_0 - 2 * beta * beta)
        : 0;
      const f_peak = omega_peak / (2 * Math.PI);

      // Phase Lag Analytical (for display)
      const omega_d = 2 * Math.PI * driverFreq;
      let phaseLagRad = Math.atan2(dampingB * omega_d, springK - mass * omega_d * omega_d);
      if (phaseLagRad < 0) phaseLagRad += 2 * Math.PI;
      const phaseLagDeg = (phaseLagRad * 180) / Math.PI;

      // Steady state amplitude analytical
      const denominator = Math.sqrt(
        Math.pow(springK - mass * omega_d * omega_d, 2) + Math.pow(dampingB * omega_d, 2)
      );
      const targetAmp = denominator > 0 ? driverAmp / denominator : 0;

      if (isPlaying) {
        // Physical time advances scaled by slowMotion factor
        const dt_phys = dt_wall * slowMotion;
        
        // Multi-stepping RK4 to ensure absolute numerical stability
        const steps = 10;
        const subDt = dt_phys / steps;
        let currentS = { ...stateRef.current };

        for (let i = 0; i < steps; i++) {
          currentS = integrateRK4(
            currentS.x,
            currentS.v,
            currentS.t_phys,
            subDt,
            mass,
            springK,
            dampingB,
            driverAmp,
            driverFreq,
            waveform
          );
        }

        stateRef.current = currentS;
        
        // Append to history
        const driveVal = getDriverForcing(currentS.t_phys, driverFreq, driverAmp, waveform);
        historyRef.current.push({ t: currentS.t_phys, drive: driveVal, mass: currentS.x });
        if (historyRef.current.length > 400) {
          historyRef.current.shift();
        }
      }

      // Propagate telemetry up to parent React component (throttled slightly or every frame)
      onStateUpdate({
        currentAmplitude: stateRef.current.x,
        qFactor: q,
        phaseLagDeg: phaseLagDeg,
        peakFreqHz: f_peak,
        naturalFreqHz: f_0,
        currentFreqHz: driverFreq
      });

      // RENDER
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      // Draw Grid lines on background
      ctx.strokeStyle = "#1d1f27";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let xG = 0; xG < w; xG += gridSize) {
        ctx.beginPath();
        ctx.moveTo(xG, 0);
        ctx.lineTo(xG, h);
        ctx.stroke();
      }
      for (let yG = 0; yG < h; yG += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, yG);
        ctx.lineTo(w, yG);
        ctx.stroke();
      }

      // SPLIT CANVAS IN TWO PANELS:
      // Left side (60% width): Mechanical simulator
      // Right side (40% width): Analytical plots (Lorentzian resonance, phase plot, etc.)
      const splitX = w * 0.55;

      // Draw Panel Divider
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      // ==========================================
      // PANEL 1: MECHANICAL SYSTEM VISUALIZER
      // ==========================================
      const mechCenterX = splitX / 2;
      const equilibriumY = h * 0.55;
      
      // Scaling factor: map displacement (meters) to canvas pixels
      // Maximum displacement is roughly F0 / k under low freq, let's auto-scale dynamically
      // so the mass doesn't jump off screen.
      const maxF0 = 50;
      const minK = 10;
      const maxPossibleDisp = maxF0 / minK; // 5 meters max
      const scaleY = (h * 0.22) / Math.max(0.1, maxPossibleDisp); // pixels per meter

      const currentX_px = stateRef.current.x * scaleY;
      const massY = equilibriumY + currentX_px;

      // Driver position
      const driverAmp_px = (driverAmp / springK) * scaleY * 0.4; // Scaled driver motion
      const theta_d = 2 * Math.PI * driverFreq * stateRef.current.t_phys;
      let driverDisp = 0;
      if (waveform === "sine") {
        driverDisp = Math.cos(theta_d);
      } else if (waveform === "square") {
        driverDisp = Math.sign(Math.cos(theta_d));
      } else if (waveform === "triangle") {
        driverDisp = (2 / Math.PI) * Math.asin(Math.sin(theta_d));
      }
      const driverDisp_px = driverAmp_px * driverDisp;
      const driverY = h * 0.15 + driverDisp_px;

      // Draw ceiling and motor wheel driving the rod
      const motorX = mechCenterX - 100;
      const motorY = h * 0.15;
      const motorRadius = 30;

      // Outer housing for motor
      ctx.fillStyle = "#18181b";
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(motorX, motorY, motorRadius + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spinning motor wheel
      ctx.save();
      ctx.translate(motorX, motorY);
      ctx.rotate(theta_d);
      
      // Motor face
      ctx.fillStyle = "#27272a";
      ctx.strokeStyle = "#2563eb"; // Science Blue
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, motorRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spoke
      ctx.strokeStyle = "#11131b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(motorRadius - 5, 0);
      ctx.stroke();

      // Pin
      ctx.fillStyle = "#f59e0b"; // Energy Orange
      ctx.beginPath();
      ctx.arc(motorRadius - 10, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Connecting drive rod from motor pin to driver sliding block
      const pinGlobalX = motorX + (motorRadius - 10) * Math.cos(theta_d);
      const pinGlobalY = motorY + (motorRadius - 10) * Math.sin(theta_d);
      const slideX = mechCenterX;
      const slideY = driverY;

      ctx.strokeStyle = "#a1a1aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pinGlobalX, pinGlobalY);
      ctx.lineTo(slideX, slideY);
      ctx.stroke();

      // Driver sliding anchor block
      ctx.fillStyle = "#1d1f27";
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(slideX - 25, slideY - 8, 50, 16);
      ctx.fill();
      ctx.stroke();

      // Label for driver sliding block
      ctx.fillStyle = "#b4c5ff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("DRIVER", slideX, slideY + 3);

      // Draw Springs (coiled line from slide to mass)
      const springStartX = mechCenterX - 15;
      const springStartY = slideY + 8;
      const springEndX = mechCenterX - 15;
      const springEndY = massY - 20; // top of mass block

      ctx.strokeStyle = "#0d9488"; // Teal for spring
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(springStartX, springStartY);

      const numCoils = 15;
      const springLength = springEndY - springStartY;
      const coilStep = springLength / numCoils;
      for (let i = 0; i < numCoils; i++) {
        const currY = springStartY + i * coilStep + coilStep / 2;
        const direction = i % 2 === 0 ? 1 : -1;
        ctx.lineTo(springStartX + 10 * direction, currY);
      }
      ctx.lineTo(springEndX, springEndY);
      ctx.stroke();

      // Draw Damper/Dashpot (cylinder and piston)
      // Cylinder on the right of the mass
      const damperStartX = mechCenterX + 35;
      const damperStartY = slideY + 8;
      const damperEndX = mechCenterX + 35;
      const damperEndY = massY - 20;

      // Piston rod going down
      ctx.strokeStyle = "#a1a1aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(damperStartX, damperStartY);
      ctx.lineTo(damperStartX, damperEndY - 15);
      ctx.stroke();

      // Piston disk
      ctx.strokeStyle = "#e1e2ed";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(damperStartX - 8, damperEndY - 15);
      ctx.lineTo(damperStartX + 8, damperEndY - 15);
      ctx.stroke();

      // Cylinder cup (attached to mass via brackets)
      ctx.strokeStyle = "#ffb95f"; // Orange accent for damper housing
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(damperStartX - 12, damperEndY - 25);
      ctx.lineTo(damperStartX - 12, damperEndY);
      ctx.lineTo(damperStartX + 12, damperEndY);
      ctx.lineTo(damperStartX + 12, damperEndY - 25);
      ctx.stroke();

      // Fluid lines inside cylinder
      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.beginPath();
      ctx.rect(damperStartX - 11, damperEndY - 20, 22, 19);
      ctx.fill();

      // Connect cylinder cup to the mass
      ctx.strokeStyle = "#a1a1aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(damperStartX - 12, damperEndY - 5);
      ctx.lineTo(mechCenterX + 25, damperEndY - 5);
      ctx.stroke();

      // Draw Mass Block (metallic dark box with border and label)
      const massW = 60;
      const massH = 40;
      ctx.fillStyle = "#18181b";
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 3;
      
      // Add subtle glow shadow to mass when moving fast or highly displaced
      ctx.shadowColor = "#2563eb";
      ctx.shadowBlur = Math.min(15, Math.abs(stateRef.current.x) * scaleY * 0.1);
      
      ctx.beginPath();
      ctx.rect(mechCenterX - massW / 2, massY - massH / 2, massW, massH);
      ctx.fill();
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // Equilibrium guide line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(mechCenterX - 100, equilibriumY);
      ctx.lineTo(mechCenterX + 100, equilibriumY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mass label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${mass.toFixed(1)} kg`, mechCenterX, massY + 4);

      // Label equilibrium
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px monospace";
      ctx.fillText("EQUILIBRIUM", mechCenterX, equilibriumY - 4);

      // ==========================================
      // PHYSICAL VECTOR ARROWS OVERLAY
      // ==========================================
      if (params.showVectors) {
        const drawArrow = (
          xStart: number,
          yStart: number,
          lengthVal: number,
          color: string,
          label: string
        ) => {
          if (Math.abs(lengthVal) < 2) return; // don't draw tiny arrows
          
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 2.5;

          const yEnd = yStart + lengthVal;
          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xStart, yEnd);
          ctx.stroke();

          // Arrowhead
          const headSize = 6;
          const dir = Math.sign(lengthVal);
          ctx.beginPath();
          ctx.moveTo(xStart, yEnd);
          ctx.lineTo(xStart - headSize, yEnd - headSize * dir);
          ctx.lineTo(xStart + headSize, yEnd - headSize * dir);
          ctx.closePath();
          ctx.fill();

          // Label
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px monospace";
          ctx.fillText(label, xStart + (lengthVal > 0 ? 15 : -15), yEnd - 2 * dir);
        };

        const arrowStartX = mechCenterX - 50;
        
        // 1. Driving Force Vector (Blue)
        // physical value is F_drive
        const F_drive = getDriverForcing(stateRef.current.t_phys, driverFreq, driverAmp, waveform);
        const arrowLength_F = F_drive * 1.5; // Scale N to px
        drawArrow(arrowStartX, massY, arrowLength_F, "#3b82f6", "F_drive");

        // 2. Spring Restoring Force (Teal)
        // physical value is -k * x
        const F_spring = -springK * stateRef.current.x;
        const arrowLength_K = F_spring * 1.5;
        drawArrow(arrowStartX - 20, massY, arrowLength_K, "#0d9488", "F_spring");

        // 3. Damping Force Vector (Orange)
        // physical value is -b * v
        const F_damping = -dampingB * stateRef.current.v;
        const arrowLength_B = F_damping * 5.0; // scale up damping force
        drawArrow(arrowStartX + 20, massY, arrowLength_B, "#f59e0b", "F_damping");
      }

      // ==========================================
      // PANEL 2: ANALYTICAL GRAPHICS
      // ==========================================
      const graphW = w - splitX - 50;
      const graphH = h * 0.38;
      const graphLeft = splitX + 30;

      // ------------------------------------------
      // GRAPH A (Top): Lorentzian Resonance Curve
      // ------------------------------------------
      const gATop = h * 0.1;
      
      // Graph Box
      ctx.fillStyle = "#0c0e16";
      ctx.beginPath();
      ctx.rect(graphLeft, gATop, graphW, graphH);
      ctx.fill();
      ctx.strokeStyle = "#434655";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("AMPLITUDE (m)", graphLeft + 8, gATop + 15);
      ctx.textAlign = "right";
      ctx.fillText("FREQUENCY fd (Hz) →", graphLeft + graphW - 8, gATop + graphH - 8);

      // Plot the Lorentzian Curve
      const maxF_plot = 5.0;
      const minF_plot = 0.1;
      
      // Let's find maximum amplitude to scale graph vertically
      // Resonance amplitude occurs near omega_0
      // A_res = F0 / (b * omega_0)
      const maxAnalyticalAmp = dampingB > 0 ? driverAmp / (dampingB * omega_0) : driverAmp / minK;
      const maxA_g = Math.max(0.01, maxAnalyticalAmp * 1.2, targetAmp * 1.3);
      
      const getAmpAtF = (f_val: number): number => {
        const omega_d_val = 2 * Math.PI * f_val;
        const denom = Math.sqrt(
          Math.pow(springK - mass * omega_d_val * omega_d_val, 2) + Math.pow(dampingB * omega_d_val, 2)
        );
        return denom > 0 ? driverAmp / denom : 0;
      };

      // Draw Lorentzian curve line
      ctx.strokeStyle = "rgba(180, 197, 255, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      for (let px = 0; px <= graphW; px++) {
        const ratio = px / graphW;
        const f_val = minF_plot + ratio * (maxF_plot - minF_plot);
        const amp = getAmpAtF(f_val);

        // Map to graph pixels
        const gx = graphLeft + px;
        const gy = gATop + graphH - (amp / maxA_g) * (graphH - 25) - 10;
        
        if (px === 0) {
          ctx.moveTo(gx, gy);
        } else {
          ctx.lineTo(gx, gy);
        }
      }
      ctx.stroke();

      // Draw natural resonance frequency line (f_0)
      const f0_ratio = (f_0 - minF_plot) / (maxF_plot - minF_plot);
      if (f0_ratio >= 0 && f0_ratio <= 1) {
        const f0_x = graphLeft + f0_ratio * graphW;
        ctx.strokeStyle = "rgba(13, 148, 136, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(f0_x, gATop);
        ctx.lineTo(f0_x, gATop + graphH);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = "#0d9488";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`f0 = ${f_0.toFixed(2)}Hz`, f0_x, gATop + 10);
      }

      // Draw current driver frequency line (f_d)
      const fd_ratio = (driverFreq - minF_plot) / (maxF_plot - minF_plot);
      const currentTheoreticalAmp = getAmpAtF(driverFreq);
      
      if (fd_ratio >= 0 && fd_ratio <= 1) {
        const fd_x = graphLeft + fd_ratio * graphW;
        const fd_y = gATop + graphH - (currentTheoreticalAmp / maxA_g) * (graphH - 25) - 10;

        // Vertical line
        ctx.strokeStyle = "rgba(37, 99, 235, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fd_x, gATop);
        ctx.lineTo(fd_x, gATop + graphH);
        ctx.stroke();

        // Pulsing cursor on the curve
        ctx.fillStyle = "#2563eb";
        ctx.shadowColor = "#2563eb";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(fd_x, fd_y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`fd = ${driverFreq.toFixed(2)}Hz`, fd_x + 8, fd_y - 2);
      }

      // Draw half-power points / bandwidth (if Q is high and damping > 0)
      // Half-power points: amplitude is A_res / sqrt(2)
      if (dampingB > 0 && q > 1.5) {
        const peakAmp = getAmpAtF(f_0);
        const halfPowerAmp = peakAmp / Math.sqrt(2);
        
        // Analytical half-power points: f1 = f0 - f0/(2Q), f2 = f0 + f0/(2Q)
        // Mathematically f1, f2 roots of A(f) = A_res/sqrt(2)
        const delta_f = f_0 / q;
        const f1 = f_0 - delta_f / 2;
        const f2 = f_0 + delta_f / 2;

        const f1_ratio = (f1 - minF_plot) / (maxF_plot - minF_plot);
        const f2_ratio = (f2 - minF_plot) / (maxF_plot - minF_plot);

        if (f1_ratio >= 0 && f1_ratio <= 1 && f2_ratio >= 0 && f2_ratio <= 1) {
          const f1_x = graphLeft + f1_ratio * graphW;
          const f2_x = graphLeft + f2_ratio * graphW;
          const hp_y = gATop + graphH - (halfPowerAmp / maxA_g) * (graphH - 25) - 10;

          // Bandwidth horizontal line with arrows
          ctx.strokeStyle = "#ffb95f";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(f1_x, hp_y);
          ctx.lineTo(f2_x, hp_y);
          ctx.stroke();

          // Left tick
          ctx.beginPath();
          ctx.moveTo(f1_x, hp_y - 4);
          ctx.lineTo(f1_x, hp_y + 4);
          ctx.stroke();

          // Right tick
          ctx.beginPath();
          ctx.moveTo(f2_x, hp_y - 4);
          ctx.lineTo(f2_x, hp_y + 4);
          ctx.stroke();

          // Label bandwidth Δf
          ctx.fillStyle = "#ffb95f";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`Δf = ${delta_f.toFixed(2)} Hz`, (f1_x + f2_x) / 2, hp_y - 6);
        }
      }

      // Title/Labels for Graph A
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("STEADY-STATE SPECTRUM", graphLeft + graphW / 2, gATop - 6);

      // ------------------------------------------
      // GRAPH B (Bottom): Phase Lag Lissajous OR Time Series
      // ------------------------------------------
      const gBTop = h * 0.55;
      
      // Graph Box
      ctx.fillStyle = "#0c0e16";
      ctx.beginPath();
      ctx.rect(graphLeft, gBTop, graphW, graphH);
      ctx.fill();
      ctx.strokeStyle = "#434655";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (params.showPhaseSpace) {
        // Phase Space Plot: x vs v
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PHASE PORTRAIT (POSITION vs VELOCITY)", graphLeft + graphW / 2, gBTop - 6);

        ctx.fillStyle = "#a1a1aa";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("VELOCITY v (m/s) →", graphLeft + 8, gBTop + 15);
        ctx.fillText("← DISPLACEMENT x (m) →", graphLeft + 8, gBTop + graphH - 8);

        // Draw crosshairs
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphLeft + graphW / 2, gBTop);
        ctx.lineTo(graphLeft + graphW / 2, gBTop + graphH);
        ctx.moveTo(graphLeft, gBTop + graphH / 2);
        ctx.lineTo(graphLeft + graphW, gBTop + graphH / 2);
        ctx.stroke();

        // Scale factors for phase portrait
        const max_v_g = Math.max(0.5, omega_0 * maxPossibleDisp * 0.4);
        const scaleX_g = (graphW * 0.4) / Math.max(0.1, maxPossibleDisp * 0.5);
        const scaleY_g = (graphH * 0.4) / Math.max(0.1, max_v_g);

        // Plot history as a fading line
        const len = historyRef.current.length;
        if (len > 1) {
          ctx.lineWidth = 1.5;
          for (let i = 1; i < len; i++) {
            const pt1 = historyRef.current[i - 1];
            const pt2 = historyRef.current[i];
            
            const x1 = graphLeft + graphW / 2 + pt1.mass * scaleX_g;
            const y1 = gBTop + graphH / 2 - pt1.drive * (scaleY_g / driverAmp) * 5.0; // Draw Lissajous Force vs Disp
            const x2 = graphLeft + graphW / 2 + pt2.mass * scaleX_g;
            const y2 = gBTop + graphH / 2 - pt2.drive * (scaleY_g / driverAmp) * 5.0;

            const alpha = i / len;
            ctx.strokeStyle = `rgba(107, 216, 203, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
        
        ctx.fillStyle = "#6bd8cb";
        ctx.font = "8px monospace";
        ctx.fillText("LISSAJOUS CURVE", graphLeft + graphW - 100, gBTop + 20);

      } else {
        // Time Series Plot: Driver Force vs Mass Displacement
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("TEMPORAL WAVEFORMS & PHASE SHIFT", graphLeft + graphW / 2, gBTop - 6);

        ctx.fillStyle = "#a1a1aa";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText("AMPLITUDE (Normalized)", graphLeft + 8, gBTop + 15);
        ctx.textAlign = "right";
        ctx.fillText("TIME (s) →", graphLeft + graphW - 8, gBTop + graphH - 8);

        // Draw center reference line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphLeft, gBTop + graphH / 2);
        ctx.lineTo(graphLeft + graphW, gBTop + graphH / 2);
        ctx.stroke();

        const len = historyRef.current.length;
        if (len > 1) {
          // Normalize waveforms relative to their maximum limits
          const maxHistDrive = Math.max(1, driverAmp);
          const maxHistMass = Math.max(0.01, stateRef.current.x, targetAmp) * 1.2;

          // 1. Plot Driver Waveform (Blue)
          ctx.strokeStyle = "rgba(37, 99, 235, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < len; i++) {
            const ratio = i / 400; // max length is 400
            const px = graphLeft + ratio * graphW;
            const normVal = historyRef.current[i].drive / maxHistDrive;
            const py = gBTop + graphH / 2 - normVal * (graphH / 2 - 15);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // 2. Plot Mass Waveform (Teal)
          ctx.strokeStyle = "#6bd8cb";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < len; i++) {
            const ratio = i / 400;
            const px = graphLeft + ratio * graphW;
            const normVal = historyRef.current[i].mass / maxHistMass;
            const py = gBTop + graphH / 2 - normVal * (graphH / 2 - 15);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        // Legends
        ctx.fillStyle = "rgba(37, 99, 235, 0.8)";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "left";
        ctx.fillText("■ Driver Force", graphLeft + 15, gBTop + graphH - 12);
        
        ctx.fillStyle = "#6bd8cb";
        ctx.fillText("■ Mass Position", graphLeft + 110, gBTop + graphH - 12);

        // Display phase lag degrees on plot
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`Φ = ${phaseLagDeg.toFixed(1)}°`, graphLeft + graphW - 15, gBTop + 20);
      }

      if (isPlaying) {
        animationId = requestAnimationFrame(renderLoop);
      }
    };

    animationId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [params, resetTrigger]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};

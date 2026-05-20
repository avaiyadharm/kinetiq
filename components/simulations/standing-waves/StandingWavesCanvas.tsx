"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type BoundaryType = "Fixed-Fixed" | "Free-Free" | "Fixed-Free";
export type RenderMode = "Displacement" | "Energy" | "Phase" | "Scientific";

interface StandingWavesCanvasProps {
  amplitude: number;
  harmonic: number;
  waveSpeed: number; // v
  boundaryType: BoundaryType | "Partially Reflective";
  renderMode: RenderMode;
  showComponents: boolean;
  showNodes: boolean;
  showAntinodes: boolean;
  isPlaying: boolean;
  time: number;
  length: number; // L
  tension: number;
  density: number;
  damping: number;
  reflection: number;
  simMode?: "harmonic" | "driven";
  drivingFrequency?: number;
  visualAmplitudeFactor?: number;
}

export const StandingWavesCanvas: React.FC<StandingWavesCanvasProps> = ({
  amplitude,
  harmonic,
  waveSpeed,
  boundaryType,
  renderMode,
  showComponents,
  showNodes,
  showAntinodes,
  isPlaying,
  time,
  length,
  tension,
  density,
  damping,
  reflection,
  simMode = "harmonic",
  drivingFrequency = 10.0,
  visualAmplitudeFactor = 1,
  boundaryImpedance = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mouse inspector
  const [hoverData, setHoverData] = useState({
    visible: false, x: 0, y: 0, px: 0, z: 0, energy: 0, nodeType: "", definition: ""
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // --- Math Setup ---
      const isDriven = simMode === "driven";
      const mu = density; // Linear mass density μ (kg/m)
      const T = tension; // Tension T (N)
      const v = Math.sqrt(T / mu); // Wave speed v = √(T/μ)
      const Z1 = Math.sqrt(T * mu); // Mechanical impedance of string Z = √(Tμ)

      // Boundary R at x = L
      let R = -1; // Default Fixed
      let Z2 = 0;
      if (boundaryType === "Fixed-Fixed") {
        R = -1;
        Z2 = 0;
      } else if (boundaryType === "Free-Free") {
        R = 1;
        Z2 = 1e8; // infinity approximation
      } else if (boundaryType === "Fixed-Free") {
        R = 1; // right boundary is free
        Z2 = 1e8;
      } else if (boundaryType === "Partially Reflective") {
        Z2 = boundaryImpedance !== undefined ? boundaryImpedance : 0;
        R = (Z2 - Z1) / (Z2 + Z1);
      }

      let y_net = (x: number) => 0;
      let y1 = (x: number) => 0;
      let y2 = (x: number) => 0;
      let dy_dt = (x: number) => 0;
      let dy_dx = (x: number) => 0;
      let lambda = 0;
      let k = 0;
      let omega = 0;

      // Scaling for canvas (amplitude * visual scale)
      const maxAxisVal = Math.max(1.5 * amplitude * visualAmplitudeFactor, 1.0);
      const visualScale = (height * 0.4) / maxAxisVal;
      const A_px = amplitude * visualScale;

      if (!isDriven) {
        // --- HARMONIC MODE (FREE VIBRATION) ---
        let n_eff = harmonic;
        if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free") {
          lambda = (2 * length) / harmonic;
          k = (n_eff * Math.PI) / length;
        } else if (boundaryType === "Fixed-Free") {
          const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
          n_eff = oddHarmonic;
          lambda = (4 * length) / oddHarmonic;
          k = (oddHarmonic * Math.PI) / (2 * length);
        }

        const omega_0 = k * v;
        const beta = damping;
        // Damped oscillator angular frequency
        omega = Math.sqrt(Math.max(0, omega_0 * omega_0 - beta * beta));
        const envelope = Math.exp(-beta * time);

        if (boundaryType === "Fixed-Fixed" || boundaryType === "Fixed-Free") {
          y_net = (x: number) => A_px * envelope * Math.sin(k * x) * Math.cos(omega * time);
          y1 = (x: number) => 0.5 * A_px * envelope * Math.sin(k * x - omega * time);
          y2 = (x: number) => 0.5 * A_px * envelope * Math.sin(k * x + omega * time);
          
          dy_dt = (x: number) => {
            const A_t = A_px * envelope;
            const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
            return dA_dt * Math.sin(k * x);
          };
          dy_dx = (x: number) => {
            return k * A_px * envelope * Math.cos(k * x) * Math.cos(omega * time);
          };
        } else if (boundaryType === "Free-Free") {
          y_net = (x: number) => A_px * envelope * Math.cos(k * x) * Math.cos(omega * time);
          y1 = (x: number) => 0.5 * A_px * envelope * Math.cos(k * x - omega * time);
          y2 = (x: number) => 0.5 * A_px * envelope * Math.cos(k * x + omega * time);

          dy_dt = (x: number) => {
            const A_t = A_px * envelope;
            const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
            return dA_dt * Math.cos(k * x);
          };
          dy_dx = (x: number) => {
            return -k * A_px * envelope * Math.sin(k * x) * Math.cos(omega * time);
          };
        }
      } else {
        // --- DRIVEN MODE (FREQUENCY SWEEP) ---
        const f_d = drivingFrequency;
        omega = 2 * Math.PI * f_d;
        const beta = damping;

        // Derived complex wave number: k_c = k - i * alpha
        const w_v2 = (omega * omega) / (v * v);
        const b_w_v2 = (beta * omega) / (v * v);
        k = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
        const alpha = k > 0 ? (beta * omega) / (v * v * k) : 0;
        lambda = k > 0 ? (2 * Math.PI) / k : 0;

        // Complex denominator: Den = 1 + R * e^{-2 alpha L} * e^{-2 i k L}
        const exp_2aL = Math.exp(-2 * alpha * length);
        const den_re = 1 + R * exp_2aL * Math.cos(2 * k * length);
        const den_im = - R * exp_2aL * Math.sin(2 * k * length);
        const den_mag2 = den_re * den_re + den_im * den_im;

        const getComplexY = (x: number) => {
          const exp_ax = Math.exp(-alpha * x);
          const exp_a2Lx = Math.exp(-alpha * (2 * length - x));

          const num_re = exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
          const num_im = - exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));

          const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
          const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;

          return { re: Y_re, im: Y_im };
        };

        const getComplexY1 = (x: number) => {
          const exp_ax = Math.exp(-alpha * x);
          const num_re = exp_ax * Math.cos(k * x);
          const num_im = - exp_ax * Math.sin(k * x);

          const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
          const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;

          return { re: Y_re, im: Y_im };
        };

        const getComplexY2 = (x: number) => {
          const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
          const num_re = R * exp_a2Lx * Math.cos(k * (2 * length - x));
          const num_im = - R * exp_a2Lx * Math.sin(k * (2 * length - x));

          const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
          const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;

          return { re: Y_re, im: Y_im };
        };

        y_net = (x: number) => {
          const Y = getComplexY(x);
          return A_px * (Y.re * Math.cos(omega * time) - Y.im * Math.sin(omega * time));
        };

        y1 = (x: number) => {
          const Y1 = getComplexY1(x);
          return A_px * (Y1.re * Math.cos(omega * time) - Y1.im * Math.sin(omega * time));
        };

        y2 = (x: number) => {
          const Y2 = getComplexY2(x);
          return A_px * (Y2.re * Math.cos(omega * time) - Y2.im * Math.sin(omega * time));
        };

        dy_dt = (x: number) => {
          const Y = getComplexY(x);
          return -omega * A_px * (Y.re * Math.sin(omega * time) + Y.im * Math.cos(omega * time));
        };

        dy_dx = (x: number) => {
          const exp_ax = Math.exp(-alpha * x);
          const exp_a2Lx = Math.exp(-alpha * (2 * length - x));

          const term_re = - exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
          const term_im = exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));

          const num_prime_re = alpha * term_re - k * term_im;
          const num_prime_im = alpha * term_im + k * term_re;

          const Yp_re = (num_prime_re * den_re + num_prime_im * den_im) / den_mag2;
          const Yp_im = (num_prime_im * den_re - num_prime_re * den_im) / den_mag2;

          return A_px * (Yp_re * Math.cos(omega * time) - Yp_im * Math.sin(omega * time));
        };
      }

      const isScientific = renderMode === "Scientific";
      const isEnergyMode = renderMode === "Energy";

      // Draw Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        ctx.moveTo(0, (height / 10) * i);
        ctx.lineTo(width, (height / 10) * i);
        ctx.moveTo((width / 10) * i, 0);
        ctx.lineTo((width / 10) * i, height);
      }
      ctx.stroke();

      // Reference Center-Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isEnergyMode) {
        // --- REAL ENERGY MODEL ---
        // Dynamically compute max energy density for perfect fitting
        const E_ref = 0.5 * mu * Math.pow(amplitude * omega, 2) + 0.5 * T * Math.pow(amplitude * k, 2);
        const visualEnergyScale = (height * 0.3) / Math.max(1e-5, E_ref);

        ctx.lineWidth = 2;
        
        // Draw Kinetic Energy Density (Green/Cyan)
        ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const dy_dt_real = dy_dt(x) / A_px * amplitude;
          const K = 0.5 * mu * Math.pow(dy_dt_real, 2);
          const py = height / 2 - K * visualEnergyScale;
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Elastic Potential Energy Density (Orange)
        ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const dy_dx_real = dy_dx(x) / A_px * amplitude;
          const U = 0.5 * T * Math.pow(dy_dx_real, 2);
          const py = height / 2 - U * visualEnergyScale;
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Total Energy Density (Vibrant Purple)
        ctx.strokeStyle = "#d946ef";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(217, 70, 239, 0.4)";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const dy_dt_real = dy_dt(x) / A_px * amplitude;
          const dy_dx_real = dy_dx(x) / A_px * amplitude;
          const K = 0.5 * mu * Math.pow(dy_dt_real, 2);
          const U = 0.5 * T * Math.pow(dy_dx_real, 2);
          const E = K + U;
          const py = height / 2 - E * visualEnergyScale;
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Draw traveling components if enabled
        if (showComponents) {
          ctx.lineWidth = 1.5;
          
          // Right-traveling wave (Cyan)
          ctx.beginPath();
          for (let px = 0; px <= width; px++) {
            const x = (px / width) * length;
            const py = height / 2 - y1(x);
            if (px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
          ctx.stroke();

          // Left-traveling wave (Rose)
          ctx.beginPath();
          for (let px = 0; px <= width; px++) {
            const x = (px / width) * length;
            const py = height / 2 - y2(x);
            if (px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
          ctx.stroke();
        }

        // Draw Net standing/traveling Wave
        ctx.beginPath();
        for (let px = 0; px <= width; px++) {
          const x = (px / width) * length;
          const py = height / 2 - y_net(x);
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.lineWidth = isScientific ? 2 : 4;
        if (renderMode === "Displacement") {
          ctx.strokeStyle = "#ffffff";
          ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
          ctx.shadowBlur = 10;
        } else if (renderMode === "Phase") {
          const phaseVal = (omega * time) % (2 * Math.PI);
          ctx.strokeStyle = `hsl(${(phaseVal / (2 * Math.PI)) * 360}, 90%, 65%)`;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // --- Analytical Node / Antinode Positions ---
        let nodes: number[] = [];
        let antinodes: number[] = [];

        if (!isDriven) {
          if (boundaryType === "Fixed-Fixed") {
            for (let i = 0; i <= harmonic; i++) nodes.push((i * lambda) / 2);
            for (let i = 0; i < harmonic; i++) antinodes.push(((i + 0.5) * lambda) / 2);
          } else if (boundaryType === "Free-Free") {
            for (let i = 0; i < harmonic; i++) nodes.push(((i + 0.5) * lambda) / 2);
            for (let i = 0; i <= harmonic; i++) antinodes.push((i * lambda) / 2);
          } else if (boundaryType === "Fixed-Free") {
            const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
            for (let m = 0; (m * lambda) / 2 <= length + 0.01; m++) {
              nodes.push((m * lambda) / 2);
            }
            for (let m = 0; (m + 0.5) * lambda / 2 <= length + 0.01; m++) {
              antinodes.push(((m + 0.5) * lambda) / 2);
            }
          }
        } else {
          // Driven mode analytical nodes & antinodes matching R phase
          const phi_R = R < 0 ? Math.PI : 0;
          if (k > 0) {
            // Find nodes
            for (let m = 0; ; m++) {
              const x = length - ((2 * m + 1) * Math.PI + phi_R) / (2 * k);
              if (x < -0.01) break;
              if (x <= length + 0.01) nodes.push(x);
            }
            // Find antinodes
            for (let m = 0; ; m++) {
              const x = length - (2 * m * Math.PI + phi_R) / (2 * k);
              if (x < -0.01) break;
              if (x <= length + 0.01) antinodes.push(x);
            }
          }
        }

        // Draw node markers
        if (showNodes) {
          ctx.fillStyle = isScientific ? "#ffffff" : "#ef4444";
          nodes.forEach((x) => {
            const px = (x / length) * width;
            ctx.beginPath();
            ctx.arc(px, height / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            
            if (!isScientific) {
              ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
              ctx.beginPath();
              ctx.arc(px, height / 2, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ef4444";
            }
          });
        }

        // Draw antinode markers & phase indicators
        if (showAntinodes) {
          antinodes.forEach((x) => {
            const px = (x / length) * width;
            const displacement = y_net(x);
            const py = height / 2 - displacement;

            ctx.fillStyle = isScientific ? "#ffffff" : "#10b981";
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();

            // Dynamic phase arrows representing local wave phase
            let direction = Math.sin(k * x) * Math.cos(omega * time) > 0 ? 1 : -1;
            if (boundaryType === "Free-Free") {
              direction = Math.cos(k * x) * Math.cos(omega * time) > 0 ? 1 : -1;
            } else if (isDriven) {
              // Driven mode phase direction
              direction = y_net(x) > 0 ? 1 : -1;
            }
            
            ctx.strokeStyle = direction > 0 ? "#10b981" : "#f43f5e";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, height / 2);
            ctx.lineTo(px, height / 2 - direction * 35);
            ctx.stroke();

            ctx.fillStyle = direction > 0 ? "#10b981" : "#f43f5e";
            ctx.beginPath();
            ctx.moveTo(px - 4, height / 2 - direction * 30);
            ctx.lineTo(px + 4, height / 2 - direction * 30);
            ctx.lineTo(px, height / 2 - direction * 37);
            ctx.fill();
          });
        }
      }

      // Render boundary condition labels at boundaries
      ctx.fillStyle = "#ffffff";
      // Left boundary (Driver x=0)
      if (isDriven) {
        ctx.fillRect(0, height / 2 - 25, 8, 50);
        ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`DRIVER (f_d = ${drivingFrequency.toFixed(1)}Hz)`, 12, height / 2 + 3);
      } else {
        if (boundaryType.startsWith("Fixed")) {
          ctx.fillRect(0, height / 2 - 25, 8, 50);
          ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
          ctx.font = "bold 9px monospace";
          ctx.fillText("FIXED NODE (π SHIFT)", 12, height / 2 + 3);
        } else {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, height / 2, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
          ctx.font = "bold 9px monospace";
          ctx.fillText("FREE ANTINODE (0 SHIFT)", 12, height / 2 + 3);
        }
      }

      // Right boundary (x=L)
      ctx.fillStyle = "#ffffff";
      if (boundaryType === "Fixed-Fixed") {
        ctx.fillRect(width - 8, height / 2 - 25, 8, 50);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FIXED NODE (π SHIFT)", width - 140, height / 2 + 3);
      } else if (boundaryType === "Free-Free" || boundaryType === "Fixed-Free") {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width, height / 2, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FREE ANTINODE (0 SHIFT)", width - 150, height / 2 + 3);
      } else if (boundaryType === "Partially Reflective") {
        ctx.fillRect(width - 4, height / 2 - 25, 4, 50);
        ctx.fillStyle = "rgba(217, 70, 239, 0.8)";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`IMPEDANCE (Z_2 = ${boundaryImpedance.toFixed(1)}, R = ${R.toFixed(2)})`, width - 210, height / 2 + 3);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [amplitude, harmonic, waveSpeed, boundaryType, renderMode, showComponents, showNodes, showAntinodes, time, length, tension, density, damping, reflection, simMode, drivingFrequency, boundaryImpedance]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const x = u * length;

    const isDriven = simMode === "driven";
    const mu = density;
    const T = tension;
    const v = Math.sqrt(T / mu);
    const Z1 = Math.sqrt(T * mu);

    let R = -1;
    let Z2 = 0;
    if (boundaryType === "Fixed-Fixed") {
      R = -1;
      Z2 = 0;
    } else if (boundaryType === "Free-Free") {
      R = 1;
      Z2 = 1e8;
    } else if (boundaryType === "Fixed-Free") {
      R = 1;
      Z2 = 1e8;
    } else if (boundaryType === "Partially Reflective") {
      Z2 = boundaryImpedance !== undefined ? boundaryImpedance : 0;
      R = (Z2 - Z1) / (Z2 + Z1);
    }

    let y_val = 0;
    let dy_dt_val = 0;
    let dy_dx_val = 0;
    let lambda = 0;
    let k = 0;
    let omega = 0;
    let alpha = 0;
    let exp_2aL = 0;

    const A_px = amplitude * 45;

    if (!isDriven) {
      let n_eff = harmonic;
      if (boundaryType === "Fixed-Fixed" || boundaryType === "Free-Free") {
        lambda = (2 * length) / harmonic;
        k = (n_eff * Math.PI) / length;
      } else if (boundaryType === "Fixed-Free") {
        const oddHarmonic = harmonic % 2 === 0 ? harmonic - 1 : harmonic;
        n_eff = oddHarmonic;
        lambda = (4 * length) / oddHarmonic;
        k = (oddHarmonic * Math.PI) / (2 * length);
      }

      const omega_0 = k * v;
      const beta = damping;
      omega = Math.sqrt(Math.max(0, omega_0 * omega_0 - beta * beta));
      const envelope = Math.exp(-beta * time);

      if (boundaryType === "Fixed-Fixed" || boundaryType === "Fixed-Free") {
        y_val = amplitude * envelope * Math.sin(k * x) * Math.cos(omega * time);
        const A_t = amplitude * envelope;
        const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
        dy_dt_val = dA_dt * Math.sin(k * x);
        dy_dx_val = k * amplitude * envelope * Math.cos(k * x) * Math.cos(omega * time);
      } else if (boundaryType === "Free-Free") {
        y_val = amplitude * envelope * Math.cos(k * x) * Math.cos(omega * time);
        const A_t = amplitude * envelope;
        const dA_dt = -beta * A_t * Math.cos(omega * time) - omega * A_t * Math.sin(omega * time);
        dy_dt_val = dA_dt * Math.cos(k * x);
        dy_dx_val = -k * amplitude * envelope * Math.sin(k * x) * Math.cos(omega * time);
      }
    } else {
      const f_d = drivingFrequency;
      omega = 2 * Math.PI * f_d;
      const beta = damping;

      const w_v2 = (omega * omega) / (v * v);
      const b_w_v2 = (beta * omega) / (v * v);
      k = Math.sqrt((w_v2 + Math.sqrt(w_v2 * w_v2 + 4 * b_w_v2 * b_w_v2)) / 2);
      alpha = k > 0 ? (beta * omega) / (v * v * k) : 0;
      lambda = k > 0 ? (2 * Math.PI) / k : 0;

      exp_2aL = Math.exp(-2 * alpha * length);
      const den_re = 1 + R * exp_2aL * Math.cos(2 * k * length);
      const den_im = - R * exp_2aL * Math.sin(2 * k * length);
      const den_mag2 = den_re * den_re + den_im * den_im;

      const exp_ax = Math.exp(-alpha * x);
      const exp_a2Lx = Math.exp(-alpha * (2 * length - x));

      const num_re = exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
      const num_im = - exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));

      const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
      const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;

      y_val = amplitude * (Y_re * Math.cos(omega * time) - Y_im * Math.sin(omega * time));
      dy_dt_val = -omega * amplitude * (Y_re * Math.sin(omega * time) + Y_im * Math.cos(omega * time));

      const term_re = - exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
      const term_im = exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));

      const num_prime_re = alpha * term_re - k * term_im;
      const num_prime_im = alpha * term_im + k * term_re;

      const Yp_re = (num_prime_re * den_re + num_prime_im * den_im) / den_mag2;
      const Yp_im = (num_prime_im * den_re - num_prime_re * den_im) / den_mag2;

      dy_dx_val = amplitude * (Yp_re * Math.cos(omega * time) - Yp_im * Math.sin(omega * time));
    }

    const local_K = 0.5 * mu * Math.pow(dy_dt_val, 2);
    const local_U = 0.5 * T * Math.pow(dy_dx_val, 2);
    const localEnergy = local_K + local_U;

    // Node classification using true envelope magnitude
    let envelope = 0;
    if (!isDriven) {
      envelope = Math.abs(boundaryType.startsWith("Free") ? Math.cos(k * x) : Math.sin(k * x));
    } else {
      // Driven envelope is |Y(x)| normalized by A_d
      const exp_ax = Math.exp(-alpha * x);
      const exp_a2Lx = Math.exp(-alpha * (2 * length - x));
      const num_re = exp_ax * Math.cos(k * x) + R * exp_a2Lx * Math.cos(k * (2 * length - x));
      const num_im = - exp_ax * Math.sin(k * x) - R * exp_a2Lx * Math.sin(k * (2 * length - x));
      const den_re = 1 + R * exp_2aL * Math.cos(2 * k * length);
      const den_im = - R * exp_2aL * Math.sin(2 * k * length);
      const den_mag2 = den_re * den_re + den_im * den_im;
      const Y_re = (num_re * den_re + num_im * den_im) / den_mag2;
      const Y_im = (num_im * den_re - num_re * den_im) / den_mag2;
      envelope = Math.sqrt(Y_re * Y_re + Y_im * Y_im);
      // Normalize visually against input
      envelope = envelope / Math.max(1, 1 / Math.sqrt(den_mag2));
    }

    let nodeType = "Intermediate Point";
    let definition = "Medium oscillates dynamically. Superposition of propagating wave fronts produces varying local displacement.";
    
    if (envelope < 0.1) {
      nodeType = "Node (Zero Amplitude)";
      definition = "A point along a standing wave with minimum (zero) displacement due to continuous destructive interference.";
    } else if (envelope > 0.9) {
      nodeType = "Antinode (Maximum Amplitude)";
      definition = "A point along a standing wave with maximum displacement due to continuous constructive interference.";
    }

    setHoverData({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      px: x,
      z: y_val,
      energy: localEnergy,
      nodeType,
      definition
    });
  };

  const handleMouseLeave = () => setHoverData((prev) => ({ ...prev, visible: false }));

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#09090b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl cursor-crosshair">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="w-full h-full object-contain"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* HUD Overlays */}
      <div className="absolute top-24 left-6 flex flex-col gap-2 pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
          <span className="text-xs font-mono font-bold text-white/90 tracking-widest uppercase">
            {isPlaying ? 'Simulation Active' : 'Simulation Paused'}
          </span>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg uppercase">
          MODE: {simMode === 'driven' ? 'Driven Wave Generator' : 'Damped Free Harmonic'} | BOUNDARY: {boundaryType} | L: {length.toFixed(2)}m
        </div>
      </div>

      {/* Interactive Probing Tooltip */}
      <AnimatePresence>
        {hoverData.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed pointer-events-none z-50 bg-black/90 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl max-w-[280px]"
            style={{ 
              left: hoverData.x + 20, 
              top: hoverData.y + 20,
              transform: `translate(${hoverData.x > window.innerWidth - 300 ? '-120%' : '0'}, ${hoverData.y > window.innerHeight - 250 ? '-120%' : '0'})` 
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hoverData.nodeType.includes('Node (Zero') ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : hoverData.nodeType.includes('Antinode') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{hoverData.nodeType}</span>
            </div>

            <p className="text-[9px] text-white/50 leading-relaxed mb-3 font-medium">
              {hoverData.definition}
            </p>
            
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Position (x)</span>
                <span className="text-xs font-mono font-bold text-white/80">{hoverData.px.toFixed(3)} m</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Displacement (y)</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{(hoverData.z * 100).toFixed(2)} cm</span>
              </div>
              <div className="flex justify-between items-center gap-6">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Local Energy</span>
                <span className="text-xs font-mono font-bold text-fuchsia-400">{hoverData.energy.toFixed(5)} J/m</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

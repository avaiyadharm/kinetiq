"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface WaveInterferenceCanvasProps {
  frequency: number; // Hz
  separation: number; // Distance between sources (m)
  numSources: number; // 1 or 2
  waveSpeed: number; // m/s
  amplitude: number; // base amplitude
  phaseDifference: number; // radians
  damping: number; // spatial attenuation factor
  renderMode: number; // 0-5
  time: number; // current time in seconds
  isPlaying: boolean;
}

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = (a_position + 1.0) / 2.0;
  }
`;

const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_uv;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_frequency;
  uniform float u_waveSpeed;
  uniform float u_amplitude;
  uniform float u_separation;
  uniform int u_numSources;
  uniform float u_phaseDiff;
  uniform float u_damping;
  uniform int u_renderMode;

  const float PI = 3.14159265359;

  // HSL to RGB helper
  vec3 hsl2rgb(vec3 c) {
      vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
      return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
  }

  void main() {
      // Map screen coordinates to physical coordinates (-5.0 to 5.0 meters)
      // v_uv is 0 to 1
      vec2 uv = v_uv * 10.0 - 5.0;
      
      // Correct aspect ratio if needed (assuming 1:1 canvas for now)
      // uv.x *= u_resolution.x / u_resolution.y;

      float lambda = u_waveSpeed / u_frequency;
      float k = 2.0 * PI / lambda;
      float omega = 2.0 * PI * u_frequency;

      vec2 s1 = vec2(-u_separation / 2.0, 0.0);
      vec2 s2 = vec2(u_separation / 2.0, 0.0);

      float r1 = max(length(uv - s1), 0.001);
      float r2 = max(length(uv - s2), 0.001);

      // Inverse square root law for 2D ripples + exponential damping
      float atten1 = (1.0 / sqrt(r1)) * exp(-u_damping * r1);
      float atten2 = (1.0 / sqrt(r2)) * exp(-u_damping * r2);

      float phase1 = k * r1 - omega * u_time;
      float phase2 = k * r2 - omega * u_time + u_phaseDiff;

      float z1 = u_amplitude * atten1 * sin(phase1);
      float z2 = u_amplitude * atten2 * sin(phase2);

      float z = z1;
      if (u_numSources == 2) {
          z += z2;
      }

      vec3 color = vec3(0.0);

      // 0: Displacement Mode (Cyan/Violet with dark background)
      if (u_renderMode == 0) {
          float normZ = clamp(z * 1.5, -1.0, 1.0);
          if (normZ >= 0.0) {
              color = mix(vec3(0.035, 0.035, 0.043), vec3(0.133, 0.827, 0.933), normZ); // Cyan
          } else {
              color = mix(vec3(0.035, 0.035, 0.043), vec3(0.545, 0.361, 0.965), -normZ); // Violet
          }
      }
      // 1: Intensity Mode (Time-averaged energy distribution)
      else if (u_renderMode == 1) {
          float I1 = u_amplitude * atten1;
          float I2 = u_amplitude * atten2;
          float I = I1 * I1;
          if (u_numSources == 2) {
              I += I2 * I2 + 2.0 * I1 * I2 * cos(k * (r1 - r2) - u_phaseDiff);
          }
          // Mapping intensity to a bright heat-like gradient
          float normI = clamp(I * 1.5, 0.0, 1.0);
          color = mix(vec3(0.0), vec3(1.0, 0.9, 0.7), normI);
      }
      // 2: Phase Mode (Continuous phase coloring)
      else if (u_renderMode == 2) {
          float realPart = u_amplitude * atten1 * cos(phase1);
          float imagPart = u_amplitude * atten1 * sin(phase1);
          if (u_numSources == 2) {
              realPart += u_amplitude * atten2 * cos(phase2);
              imagPart += u_amplitude * atten2 * sin(phase2);
          }
          float netPhase = atan(imagPart, realPart);
          float hue = (netPhase / PI + 1.0) / 2.0;
          float mag = sqrt(realPart*realPart + imagPart*imagPart);
          
          color = hsl2rgb(vec3(hue, 1.0, 0.5));
          color *= clamp(mag * 2.0, 0.0, 1.0); // Fade out where amplitude is zero
      }
      // 3: Scientific Grayscale (Publication style)
      else if (u_renderMode == 3) {
          float normZ = clamp(z * 1.5, -1.0, 1.0);
          color = vec3((normZ + 1.0) / 2.0);
      }
      // 4: Neon Cinematic
      else if (u_renderMode == 4) {
          float normZ = z * 2.0;
          float val = abs(normZ);
          color = mix(vec3(0.0), vec3(0.2, 1.0, 0.5), smoothstep(0.0, 1.0, normZ)); // Neon green
          color += mix(vec3(0.0), vec3(1.0, 0.2, 0.8), smoothstep(0.0, 1.0, -normZ)); // Neon pink
          color += vec3(0.02, 0.05, 0.1) * (1.0 - clamp(val, 0.0, 1.0)); // Ambient blue
      }
      // 5: Wireframe/Contour Mode
      else if (u_renderMode == 5) {
          float normZ = z * 4.0;
          float lines = abs(fract(normZ) - 0.5);
          if (lines < 0.1) {
              color = vec3(0.9, 0.95, 1.0); // Line color
          } else {
              color = (normZ > 0.0) ? vec3(0.0, 0.15, 0.2) : vec3(0.15, 0.0, 0.2);
          }
      }

      // Draw source markers
      if (r1 < 0.08 || (u_numSources == 2 && r2 < 0.08)) {
          color = vec3(1.0); // White dot for sources
      }

      gl_FragColor = vec4(color, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const WaveInterferenceCanvas: React.FC<WaveInterferenceCanvasProps> = ({
  frequency,
  separation,
  numSources,
  waveSpeed,
  amplitude,
  phaseDifference,
  damping,
  renderMode,
  time,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation | null>;
  } | null>(null);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set internal resolution for high-quality rendering
    canvas.width = 1024;
    canvas.height = 1024;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    // Set up full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,  1.0, -1.0,  -1.0,  1.0,
      -1.0,  1.0,  1.0, -1.0,   1.0,  1.0
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_time: gl.getUniformLocation(program, "u_time"),
      u_frequency: gl.getUniformLocation(program, "u_frequency"),
      u_waveSpeed: gl.getUniformLocation(program, "u_waveSpeed"),
      u_amplitude: gl.getUniformLocation(program, "u_amplitude"),
      u_separation: gl.getUniformLocation(program, "u_separation"),
      u_numSources: gl.getUniformLocation(program, "u_numSources"),
      u_phaseDiff: gl.getUniformLocation(program, "u_phaseDiff"),
      u_damping: gl.getUniformLocation(program, "u_damping"),
      u_renderMode: gl.getUniformLocation(program, "u_renderMode"),
    };

    glRef.current = { gl, program, uniforms };

    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  // Render loop update
  useEffect(() => {
    if (!glRef.current) return;
    const { gl, program, uniforms } = glRef.current;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);

    gl.uniform2f(uniforms.u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(uniforms.u_time, time);
    gl.uniform1f(uniforms.u_frequency, frequency);
    gl.uniform1f(uniforms.u_waveSpeed, waveSpeed);
    gl.uniform1f(uniforms.u_amplitude, amplitude);
    gl.uniform1f(uniforms.u_separation, separation);
    gl.uniform1i(uniforms.u_numSources, numSources);
    gl.uniform1f(uniforms.u_phaseDiff, phaseDifference);
    gl.uniform1f(uniforms.u_damping, damping);
    gl.uniform1i(uniforms.u_renderMode, renderMode);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [frequency, separation, numSources, waveSpeed, amplitude, phaseDifference, damping, renderMode, time]);

  const modeNames = ["Displacement", "Intensity", "Phase", "Scientific Grayscale", "Neon Cinematic", "Contour"];

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#09090b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
      <motion.canvas
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      
      {/* HUD Overlays */}
      <div className="absolute top-20 left-6 flex flex-col gap-2 pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
          <span className="text-xs font-mono font-bold text-white/90 tracking-widest uppercase">
            {isPlaying ? 'Simulation Active' : 'Simulation Paused'}
          </span>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/60 shadow-lg">
          GPU RENDER | MODE: {modeNames[renderMode].toUpperCase()} | T: {time.toFixed(2)}s
        </div>
      </div>
      
      {renderMode === 0 && (
        <div className="absolute bottom-6 right-6 flex gap-2 pointer-events-none z-10">
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center shadow-lg">
              <span className="w-4 h-4 rounded-full bg-[#22d3ee] mb-1 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-wider">Crest</span>
           </div>
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center shadow-lg">
              <span className="w-4 h-4 rounded-full bg-[#8b5cf6] mb-1 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-wider">Trough</span>
           </div>
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center shadow-lg">
              <span className="w-4 h-4 rounded-full bg-[#09090b] border border-white/20 mb-1" />
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-wider">Node</span>
           </div>
        </div>
      )}
    </div>
  );
};

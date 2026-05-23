"use client";

import React from "react";
import { SoundWavesSimulator } from "@/components/simulations/sound-waves/SoundWavesSimulator";

export default function SoundWavesPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <SoundWavesSimulator />
    </div>
  );
}

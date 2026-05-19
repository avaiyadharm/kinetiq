"use client";

import React from "react";
import { StandingWavesSimulator } from "@/components/simulations/standing-waves/StandingWavesSimulator";

export default function StandingWavesPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <StandingWavesSimulator />
    </div>
  );
}

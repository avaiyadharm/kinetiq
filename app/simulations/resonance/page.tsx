"use client";

import React from "react";
import { ResonanceSimulator } from "@/components/simulations/resonance/ResonanceSimulator";

export default function ResonancePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <ResonanceSimulator />
    </div>
  );
}

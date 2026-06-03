"use client";

import React from "react";
import { KineticEnergySimulator } from "@/components/simulations/kinetic-energy/KineticEnergySimulator";

export default function KineticEnergyPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <KineticEnergySimulator />
    </div>
  );
}

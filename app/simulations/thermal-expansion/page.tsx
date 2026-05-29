"use client";

import React from "react";
import { ThermalExpansionSimulator } from "@/components/simulations/thermal-expansion/ThermalExpansionSimulator";

export default function ThermalExpansionPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <ThermalExpansionSimulator />
    </div>
  );
}

"use client";

import React from "react";
import { GasLawsSimulator } from "@/components/simulations/gas-laws/GasLawsSimulator";

export default function GasLawsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <GasLawsSimulator />
    </div>
  );
}

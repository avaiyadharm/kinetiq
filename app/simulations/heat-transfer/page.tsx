"use client";

import React from "react";
import { HeatTransferSimulator } from "@/components/simulations/heat-transfer/HeatTransferSimulator";

export default function HeatTransferPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <HeatTransferSimulator />
    </div>
  );
}

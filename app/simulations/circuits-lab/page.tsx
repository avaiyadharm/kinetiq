"use client";

import React from "react";
import { CircuitGridSimulator } from "@/components/simulations/circuit-grid/CircuitGridSimulator";

export default function CircuitsLabPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <CircuitGridSimulator />
    </div>
  );
}

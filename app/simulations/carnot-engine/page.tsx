"use client";

import React from "react";
import { CarnotSimulator } from "@/components/simulations/carnot-engine/CarnotSimulator";

export default function CarnotEnginePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <CarnotSimulator />
    </div>
  );
}

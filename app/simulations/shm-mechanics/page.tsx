import SHMSimulator from "@/components/simulations/shm/SHMSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SHM Simulator | KINETIQ Lab",
  description: "Explore Simple Harmonic Motion in springs and pendulums with real-time energy visualization and kinematic analysis.",
};

export default function SHMPage() {
  return <SHMSimulator />;
}

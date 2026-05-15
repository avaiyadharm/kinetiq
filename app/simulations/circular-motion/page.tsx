import CircularMotionSimulator from "@/components/simulations/circular-motion/CircularMotionSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Circular Motion Simulator | KINETIQ Lab",
  description: "Explore the dynamics of Uniform and Non-Uniform Circular Motion with real-time vector visualization and kinematic analysis.",
};

export default function CircularMotionPage() {
  return <CircularMotionSimulator />;
}

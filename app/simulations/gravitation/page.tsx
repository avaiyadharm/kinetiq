import GravitationSimulator from "@/components/simulations/gravitation/GravitationSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Universal Gravitation | KINETIQ Lab",
  description: "Explore Newton's Law of Universal Gravitation, orbital mechanics, Kepler's Laws, and gravitational energy with real-time simulation.",
};

export default function GravitationPage() {
  return <GravitationSimulator />;
}

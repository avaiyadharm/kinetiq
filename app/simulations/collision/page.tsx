import CollisionSimulator from "@/components/simulations/collision/CollisionSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collision Lab | KINETIQ",
  description: "Explore elastic and inelastic collisions with real-time momentum and energy conservation analysis.",
};

export default function CollisionPage() {
  return <CollisionSimulator />;
}

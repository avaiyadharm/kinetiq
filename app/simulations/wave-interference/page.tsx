import WaveInterferenceSimulator from "@/components/simulations/wave-interference/WaveInterferenceSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wave Interference Lab | KINETIQ",
  description: "Observe constructive and destructive interference from dual point sources in a 2D wave grid.",
};

export default function WaveInterferencePage() {
  return <WaveInterferenceSimulator />;
}

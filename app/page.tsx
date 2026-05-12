import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SimulationGrid } from "@/components/SimulationGrid";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeatureGrid } from "@/components/FeatureGrid";
import { StatsSection } from "@/components/StatsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e1e2ec] selection:bg-blue-500/30 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <StatsSection />
        <SimulationGrid />
        <CategoryGrid />
        <FeatureGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
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

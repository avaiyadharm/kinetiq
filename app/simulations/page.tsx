"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Play, 
  Bookmark, 
  ArrowRight, 
  LayoutGrid, 
  Activity, 
  Zap, 
  Thermometer, 
  Waves, 
  Lightbulb, 
  Atom, 
  TrendingUp,
  Box,
  Compass
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function SimulationGalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const simulations = [
    // Mechanics
    { id: "projectile-motion", title: "Projectile Motion", description: "Analyze trajectory, max height, and range under varying initial conditions.", category: "Mechanics", difficulty: "Easy", views: "12.4k", image: "/images/simulations/projectile-motion.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "newtons-laws", title: "Newton’s Laws", description: "Force, mass, and acceleration relationships in a frictionless environment.", category: "Mechanics", difficulty: "Easy", views: "15.2k", image: "/images/simulations/newtons-laws.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "circular-motion", title: "Circular Motion", description: "Explore centripetal force and velocity in orbital and rotational paths.", category: "Mechanics", difficulty: "Intermediate", views: "9.1k", image: "/images/simulations/circular-motion.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "shm-mechanics", title: "SHM", description: "Simple Harmonic Motion in springs and oscillating systems.", category: "Mechanics", difficulty: "Intermediate", views: "11.2k", image: "/images/simulations/shm-mechanics.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "gravitation", title: "Gravitation", description: "Universal gravitation and planetary orbits simulation.", category: "Mechanics", difficulty: "Advanced", views: "14.8k", image: "/images/simulations/gravitation.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "momentum", title: "Momentum", description: "Conservation of momentum and impulse calculations.", category: "Mechanics", difficulty: "Easy", views: "10.1k", image: "/images/simulations/momentum.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "collision", title: "Collision", description: "Elastic and inelastic collisions in 1D and 2D.", category: "Mechanics", difficulty: "Intermediate", views: "13.4k", image: "/images/simulations/collision.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    
    // Waves & Oscillations
    { id: "wave-interference", title: "Wave Interference", description: "Observe constructive and destructive interference from dual point sources.", category: "Waves & Oscillations", difficulty: "Advanced", views: "5.1k", image: "/images/simulations/wave-interference.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "standing-waves", title: "Standing Waves", description: "Visualize harmonics and nodes on a string under tension.", category: "Waves & Oscillations", difficulty: "Intermediate", views: "6.7k", image: "/images/simulations/standing-waves.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "resonance", title: "Resonance", description: "Frequency matching and amplitude amplification in forced oscillators.", category: "Waves & Oscillations", difficulty: "Advanced", views: "8.9k", image: "/images/simulations/wave-interference.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "sound-waves", title: "Sound Waves", description: "Longitudinal waves, pitch, and volume visualization.", category: "Waves & Oscillations", difficulty: "Easy", views: "14.2k", image: "/images/simulations/wave-interference.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "shm-waves", title: "SHM", description: "Pendulums and springs as oscillators.", category: "Waves & Oscillations", difficulty: "Intermediate", views: "9.5k", image: "/images/simulations/projectile-motion.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "pendulum-lab", title: "Pendulum", description: "Investigate gravity and period with a custom pendulum lab.", category: "Waves & Oscillations", difficulty: "Intermediate", views: "8.2k", image: "/images/simulations/projectile-motion.png", color: "text-amber-400", dotColor: "bg-amber-400" },

    // Thermodynamics
    { id: "heat-transfer", title: "Heat Transfer", description: "Conduction, convection, and radiation in action.", category: "Thermodynamics", difficulty: "Intermediate", views: "10.4k", image: "/images/simulations/thermal-expansion.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "gas-laws", title: "Gas Laws", description: "PV=nRT with interactive volume and temperature controls.", category: "Thermodynamics", difficulty: "Easy", views: "18.2k", image: "/images/simulations/gas-laws.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "carnot-engine", title: "Carnot Engine", description: "Efficiency and cycles of an ideal heat engine.", category: "Thermodynamics", difficulty: "Advanced", views: "6.3k", image: "/images/simulations/gas-laws.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "thermal-expansion", title: "Thermal Expansion", description: "Linear and volumetric expansion of solids and liquids.", category: "Thermodynamics", difficulty: "Easy", views: "8.1k", image: "/images/simulations/thermal-expansion.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "kinetic-theory", title: "Kinetic Theory", description: "Microscopic motion of particles and its relation to temperature.", category: "Thermodynamics", difficulty: "Intermediate", views: "12.7k", image: "/images/simulations/gas-laws.png", color: "text-amber-400", dotColor: "bg-amber-400" },

    // Electricity & Magnetism
    { id: "circuits-lab", title: "Circuits", description: "Build and test complex DC circuits with resistors and bulbs.", category: "Electricity & Magnetism", difficulty: "Intermediate", views: "21.3k", image: "/images/simulations/circuits-lab.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "capacitors", title: "Capacitors", description: "Charge storage, capacitance, and dielectric effects.", category: "Electricity & Magnetism", difficulty: "Intermediate", views: "9.8k", image: "/images/simulations/circuits-lab.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "ohms-law", title: "Ohm’s Law", description: "Voltage, current, and resistance proportionality.", category: "Electricity & Magnetism", difficulty: "Easy", views: "19.5k", image: "/images/simulations/circuits-lab.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "magnetic-fields", title: "Magnetic Fields", description: "Visualize field lines around bar magnets and electromagnets.", category: "Electricity & Magnetism", difficulty: "Easy", views: "14.5k", image: "/images/simulations/magnetic-fields.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "induction", title: "Electromagnetic Induction", description: "Faraday's Law, Lenz's Law, and generator principles.", category: "Electricity & Magnetism", difficulty: "Advanced", views: "7.6k", image: "/images/simulations/magnetic-fields.png", color: "text-rose-400", dotColor: "bg-rose-400" },

    // Optics
    { id: "mirrors", title: "Mirrors", description: "Ray diagrams for plane, convex, and concave mirrors.", category: "Optics", difficulty: "Easy", views: "9.4k", image: "/images/simulations/optics.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "refraction-lenses", title: "Lenses", description: "Snell's Law and focal points in convex and concave lenses.", category: "Optics", difficulty: "Easy", views: "12.8k", image: "/images/simulations/optics.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "refraction-basic", title: "Refraction", description: "Light bending at interfaces and total internal reflection.", category: "Optics", difficulty: "Easy", views: "11.1k", image: "/images/simulations/optics.png", color: "text-emerald-400", dotColor: "bg-emerald-400" },
    { id: "diffraction", title: "Diffraction", description: "Single-slit and circular aperture diffraction patterns.", category: "Optics", difficulty: "Advanced", views: "6.8k", image: "/images/simulations/optics.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "interference-optics", title: "Interference", description: "Young's double-slit and thin-film interference.", category: "Optics", difficulty: "Advanced", views: "7.9k", image: "/images/simulations/optics.png", color: "text-rose-400", dotColor: "bg-rose-400" },

    // Modern Physics
    { id: "photoelectric-effect", title: "Photoelectric Effect", description: "Discover how light ejects electrons from metal surfaces.", category: "Modern Physics", difficulty: "Advanced", views: "7.2k", image: "/images/simulations/photoelectric-effect.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "atomic-models", title: "Atomic Models", description: "From Bohr to Quantum Cloud: visualize the evolution of the atom.", category: "Modern Physics", difficulty: "Advanced", views: "11.6k", image: "/images/simulations/atomic-models.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "radioactivity", title: "Radioactivity", description: "Half-life and decay paths of alpha, beta, and gamma radiation.", category: "Modern Physics", difficulty: "Intermediate", views: "5.9k", image: "/images/simulations/atomic-models.png", color: "text-amber-400", dotColor: "bg-amber-400" },
    { id: "quantum-effects", title: "Quantum Effects", description: "Tunneling, entanglement, and wave-particle duality.", category: "Modern Physics", difficulty: "Advanced", views: "9.2k", image: "/images/simulations/atomic-models.png", color: "text-rose-400", dotColor: "bg-rose-400" },
    { id: "semiconductor-logic", title: "Semiconductor Logic", description: "P-N junctions, transistors, and logic gate physics.", category: "Modern Physics", difficulty: "Intermediate", views: "10.5k", image: "/images/simulations/semiconductor-logic.png", color: "text-amber-400", dotColor: "bg-amber-400" }
  ];

  const categories = [
    { name: "All", icon: <LayoutGrid className="w-4 h-4" /> },
    { name: "Mechanics", icon: <Activity className="w-4 h-4" /> },
    { name: "Waves & Oscillations", icon: <Waves className="w-4 h-4" /> },
    { name: "Thermodynamics", icon: <Thermometer className="w-4 h-4" /> },
    { name: "Electricity & Magnetism", icon: <Zap className="w-4 h-4" /> },
    { name: "Optics", icon: <Lightbulb className="w-4 h-4" /> },
    { name: "Modern Physics", icon: <Atom className="w-4 h-4" /> },
  ];

  const filteredSimulations = activeCategory === "All" 
    ? simulations 
    : simulations.filter(sim => sim.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#091421] text-[#d9e3f6] font-sans antialiased">
      <Navbar />
      
      <main className="w-full max-w-[1600px] mx-auto px-12 py-8 pt-40 pb-24">
        {/* Featured Hero Section */}
        <section className="mb-16 relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#091421] via-[#091421]/80 to-transparent z-10"></div>
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="/images/simulations/projectile-motion.png" 
            alt="Advanced Kinematics"
          />
          <div className="relative z-20 p-12 flex flex-col items-start justify-center h-full max-w-2xl">
            <span className="inline-block bg-[#6bd8cb] text-[#003732] text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">Featured Lab</span>
            <h1 className="text-5xl font-bold font-display text-white mb-4">Advanced Kinematics</h1>
            <p className="text-lg text-[#c3c6d7] mb-8 max-w-lg">Explore complex projectile motion with variable air resistance and multi-body dynamics. Visualize velocity vectors in real-time.</p>
            <Link href="/simulations/projectile-motion">
              <Button className="bg-[#2563eb] text-white px-8 py-6 rounded-xl font-bold shadow-xl hover:scale-95 transition-all flex items-center gap-2 group">
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                Launch Simulation
              </Button>
            </Link>
          </div>
        </section>

        {/* Categories / Filters */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white font-display">Browse by Category</h2>
            <button className="text-[#2563eb] font-bold flex items-center gap-1 hover:text-[#b4c5ff] transition-colors text-sm">
              {filteredSimulations.length} Labs Available <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar items-center">
            {categories.map((cat) => (
              <button 
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  activeCategory === cat.name 
                    ? "bg-[#2563eb] text-white border-transparent shadow-lg shadow-blue-900/20" 
                    : "bg-[#16202e] text-[#c3c6d7] border-white/5 hover:bg-[#212b39] hover:text-white"
                }`}
              >
                {cat.icon}
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Simulation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 min-h-[400px]">
          {filteredSimulations.map((sim) => (
            <Link key={sim.id} href={`/simulations/${sim.id}`} className="group">
              <article className="bg-[#050f1c] rounded-2xl border border-white/5 overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                <div className="relative h-48 overflow-hidden bg-[#16202e]">
                  <img 
                    alt={sim.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    src={sim.image} 
                  />
                  <button className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 hover:text-white transition-colors border border-white/10">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-[#091421]/90 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-white/10">
                      {sim.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#2563eb] transition-colors">{sim.title}</h3>
                  <p className="text-sm text-[#c3c6d7] line-clamp-2 mb-6 flex-1">{sim.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${sim.color}`}>
                      <span className={`w-2 h-2 rounded-full ${sim.dotColor} animate-pulse`}></span> 
                      {sim.difficulty}
                    </span>
                    <div className="flex items-center text-[#8d90a0] text-xs font-mono">
                      <Activity className="w-3.5 h-3.5 mr-1" />
                      {sim.views}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
          {filteredSimulations.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-20 bg-[#050f1c]/50 rounded-3xl border border-dashed border-white/10">
               <Box className="w-12 h-12 text-[#2563eb] mb-4 opacity-20" />
               <p className="text-[#c3c6d7] font-bold">No simulations found for this category.</p>
               <button onClick={() => setActiveCategory("All")} className="text-[#2563eb] text-sm mt-2 hover:underline">View All Labs</button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

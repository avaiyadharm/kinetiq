"use client";

import React from "react";
import Link from "next/link";
import { Search, Play, Bookmark, ArrowRight, MotionPhotosOn, LineChart, Activity, Thermometer, Box, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SimulationGalleryPage() {
  const simulations = [
    {
      id: "projectile-motion",
      title: "Projectile Motion",
      description: "Analyze trajectory, max height, and range under varying initial conditions.",
      category: "Motion",
      difficulty: "Easy",
      views: "12.4k",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCn04kTL64Ew-7UDJX-gXaX53DhmnzaR2BqjP5glx7j02UiIkntpH1HNlEVjFIxF9i__TrXUIeArnCfSi2aQua-9XW2BVEFH6NObetcrYbuASHoA-baIVt4GctmwXqZqTcD-cff-xCWqV5PIMoVIpKvduY8EKKOdbhulwN1QYajGyyfSLOjAE3IdINrhGBB09vCFTfRPCGhqdu5bxDrdpOTVj0-9bRWF0bX2lx5bFHtHtdfmgCAI2u8wy-gkZnVwn0g4Y919ZT4mvU",
      color: "text-emerald-400",
      dotColor: "bg-emerald-400"
    },
    {
      id: "pendulum-lab",
      title: "Pendulum Lab",
      description: "Investigate simple harmonic motion, period, and string length relationships.",
      category: "Motion",
      difficulty: "Intermediate",
      views: "8.2k",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuACHHAFbSu3XodRGJDyANSJ0CSx6caRI9dTzbLNWj6HupaxvqmrHhDuU0aHFC5IF62PESL83AejWJEpPq69XFNynk-VmhHbCBnb8ndTH4hqhBaZRf0Ers3Q7vcVgSvwpDjt4IKeIPckdkFR1Yz9ymhW5Gt_TVwgTnbnZxmrEWJqCWVEqD0RsJKFlLZvya0baq7-vN3u43hf8kZI0jiCUTxAaMphvmakm18E4tfqWXY5pwzbjVc3SR9Z-NuELdqjzMiDAttHfxPC8VU",
      color: "text-amber-400",
      dotColor: "bg-amber-400"
    },
    {
      id: "wave-interference",
      title: "Wave Interference",
      description: "Observe constructive and destructive interference from dual point sources.",
      category: "Waves",
      difficulty: "Advanced",
      views: "5.1k",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAySWnGNsUW7yy0jX_GNhXEbKz7_AtiiL5MssdzHm83VJ3BXdvsmZxCdVeh1QNK8B6_xhwNSYyqCZFKziukwcl8gsh3R5CFcU-WGlCC6DY7PlxBjNs3h6txJZbg42xsugBGUEr6S6k6XvjXfAC0k-wQ0G9LTNVRdZIuSYwd4Xz1K3x8lhVM4MILSuMbTfXhszbdvOiF7Wv5PeX1FCnCiji9RtXfrQsgzg7c5IoJHcsQvmSK8020cpVS3iLRTMSQJaiJdqBkK1U4CcM",
      color: "text-rose-400",
      dotColor: "bg-rose-400"
    },
    {
      id: "energy-skate-park",
      title: "Energy Skate Park",
      description: "Explore conservation of energy, friction, and basic thermodynamics.",
      category: "Energy",
      difficulty: "Easy",
      views: "22.8k",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOQFwNNKPOo4YuXTz5Lkek4Me3U8LyARsLbr3PLowHG0PBV-vpyCGr4GiPBDanc3YZom65JvuhJ8hUwn8_IZdAAI2-wQsWqEze7TC--O1C1c5t-LNsPmfTzF-Ok_x1r_oxhSkolquvEQNlwZ1uQvfkApq8Ni_yc9PqCY0VVmYZCZeMrgwjeSpGqTkkK8vwY36iNjoSNZDA0MrzZtMBEAWaJYkuAr0gZpz0OkORMaYhuOnjt5MJb2uGKY6kl0qbS1hmur3VYoz-Qoo",
      color: "text-emerald-400",
      dotColor: "bg-emerald-400"
    }
  ];

  const categories = [
    { name: "All", icon: <MotionPhotosOn className="w-4 h-4" />, active: true },
    { name: "Motion", icon: <Activity className="w-4 h-4" /> },
    { name: "Waves", icon: <LineChart className="w-4 h-4" /> },
    { name: "Energy", icon: <Zap className="w-4 h-4" /> },
    { name: "Thermal", icon: <Thermometer className="w-4 h-4" /> },
    { name: "Quantum", icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#091421] text-[#d9e3f6] font-sans antialiased">
      <Navbar />
      
      <main className="w-full max-w-7xl mx-auto px-6 py-8 pb-24">
        {/* Featured Hero Section */}
        <section className="mb-16 relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#091421] via-[#091421]/80 to-transparent z-10"></div>
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR9Y7SKx7ZrJMgBfKJ9pnPDpIfJmjzKdHRPk467LkduFaxsiCW-GwaYRxqlvmPBhUmKLuofQwyQgAqGgRzJlB581EyUIsnTXvh_ZCJlAAo2KITGa-oxXxG1TeMzdltncKQyKMUiorjaCVk1ULI1UzDLX9jIuLw_Y5luvpJrFfNlLUKDCOMGQVusoBFHnxuqDOlBoVHoBCDrMS8Jfq_sE9H-WpqS8M3IkqV2dfRWqVnyqI07eU5PhGB8V3xbG9OIk2sGxYT1KfU6hM" 
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
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar items-center">
            {categories.map((cat) => (
              <button 
                key={cat.name}
                className={`whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  cat.active 
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {simulations.map((sim) => (
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

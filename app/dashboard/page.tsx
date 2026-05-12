"use client";

import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Assignment, 
  Science, 
  BarChart, 
  Bookmarks, 
  Settings, 
  Notifications,
  Plus,
  TrendingUp,
  PendingActions,
  RocketLaunch,
  ElectricBolt,
  MoreVertical,
  AddCircle,
  Speed
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherDashboardPage() {
  const stats = [
    { title: "Active Assignments", value: "12", change: "+2 this week", icon: <Assignment className="w-10 h-10 text-[#2563eb]" />, trend: "up" },
    { title: "Student Submissions", value: "148", change: "32 need grading", icon: <Assignment className="w-10 h-10 text-[#6bd8cb]" />, trend: "pending" },
    { title: "Saved Labs", value: "24", change: "Go to Lab Manager →", icon: <Science className="w-10 h-10 text-[#ffb596]" />, trend: "link" }
  ];

  const assignments = [
    { title: "Projectile Motion Challenge", class: "Physics 101", due: "Tomorrow", submitted: "24/30", icon: <RocketLaunch className="w-5 h-5" />, color: "bg-[#2563eb]/20 text-[#2563eb]" },
    { title: "Circuits Basics: Series vs Parallel", class: "Intro to Electronics", due: "3 days", submitted: "5/28", icon: <ElectricBolt className="w-5 h-5" />, color: "bg-[#6bd8cb]/20 text-[#6bd8cb]" }
  ];

  return (
    <div className="min-h-screen bg-[#091421] text-[#d9e3f6] flex flex-col md:flex-row font-sans antialiased">
      {/* Mobile Header */}
      <header className="w-full sticky top-0 bg-[#091421] border-b border-white/5 z-50 md:hidden flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#2563eb] font-display">Kinetiq</span>
          <span className="bg-[#16202e] text-[#c3c6d7] text-[10px] font-bold px-2 py-1 rounded ml-2 uppercase">Teacher</span>
        </div>
        <div className="flex items-center gap-4">
          <Notifications className="w-6 h-6 text-[#d9e3f6]" />
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfwEdnqSPVIX3OQ3RjLqyAJ0hdRTikqjMIUIPIp5PpLpbOhz68soz8QDTf49_vRaVCkcUw-2Qvfj-svhbr4FJMGV6iJNmf6b2e_mbNkkrvRd5vyUuQh1DZ8gmUK4VDTZSFgJcZAFcm5j6IcJZ4EL6r6BzlneKaIpE0Iz9DE_TRclOuFMssAFPojwS6cLuCWr7TOttMeVnv8bnk67iKFqnnqAdXJyHjEUpIX-hOzBd__YlHd4TR64QXjd65T2W2dOiOt2n5Q4ir-ZY" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[320px] bg-[#050f1c] border-r border-white/5 h-screen sticky top-0 p-8 overflow-y-auto">
        <div className="mb-12">
          <span className="text-3xl font-bold text-[#2563eb] font-display block">Kinetiq</span>
          <span className="text-[10px] font-bold text-[#c3c6d7] uppercase tracking-[0.2em] block mt-2 opacity-60">Teacher Portal Portal</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/dashboard" className="bg-[#2563eb]/10 text-[#2563eb] rounded-xl font-bold flex items-center gap-3 p-4 transition-all">
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="#" className="text-[#c3c6d7] hover:bg-white/5 rounded-xl font-medium flex items-center gap-3 p-4 transition-all">
            <Assignment className="w-5 h-5" />
            <span>Assignments</span>
          </Link>
          <Link href="#" className="text-[#c3c6d7] hover:bg-white/5 rounded-xl font-medium flex items-center gap-3 p-4 transition-all">
            <Science className="w-5 h-5" />
            <span>Lab Manager</span>
          </Link>
          <Link href="#" className="text-[#c3c6d7] hover:bg-white/5 rounded-xl font-medium flex items-center gap-3 p-4 transition-all">
            <BarChart className="w-5 h-5" />
            <span>Student Progress</span>
          </Link>
          <Link href="#" className="text-[#c3c6d7] hover:bg-white/5 rounded-xl font-medium flex items-center gap-3 p-4 transition-all">
            <Bookmarks className="w-5 h-5" />
            <span>Bookmarks</span>
          </Link>
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-4">
          <Link href="#" className="text-[#c3c6d7] hover:bg-white/5 rounded-xl font-medium flex items-center gap-3 p-4 transition-all">
            <Settings className="w-5 h-5" />
            <span>Class Settings</span>
          </Link>
          <div className="flex items-center gap-3 p-3 bg-[#091421] rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-lg">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfbHZ5BNpeZBjEqSvNb0PEN1Wi9l2P05yD8bl_bU9_s4mHnpgj1yOcGsu6CD1YhmniVnHa9bg_Eg8ehCwWqwLX77IGlqBj5EDI6ZYe3QIn1dii89TdvriL-Jc7ZRgxC8MmqG_DzrKBcfNnKfBI8Hyf7dH7OaSEnbBsebVdy4dwA6_oXn_0i_iQBDbKeubqyxLvO-BRt_lrJ31fPUsRB5oI5QBzY18oDfyPsjJe-t6rdB3tjHYWWNSE_zfoC7UegUtJSUU-YUjD1ww" alt="Teacher" className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm truncate">Dr. Sarah Jenkins</p>
              <p className="text-[10px] text-[#c3c6d7] uppercase tracking-wider truncate">Physics Dept.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
        <header className="mb-12 hidden md:flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-display">Good morning, Dr. Jenkins</h1>
            <p className="text-lg text-[#c3c6d7]">Here is your physics simulation overview for today.</p>
          </div>
          <Button className="bg-[#2563eb] text-white px-8 py-7 rounded-xl font-bold uppercase tracking-widest hover:bg-[#1d4ed8] hover:scale-95 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Assignment
          </Button>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#050f1c] rounded-2xl p-8 border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                {stat.icon}
              </div>
              <h3 className="text-xs font-bold text-[#c3c6d7] uppercase tracking-[0.2em] mb-4">{stat.title}</h3>
              <p className="text-5xl font-bold text-[#2563eb] font-display">{stat.value}</p>
              <div className={`mt-6 flex items-center gap-1.5 ${stat.trend === 'up' ? 'text-[#6bd8cb]' : stat.trend === 'pending' ? 'text-[#c3c6d7]' : 'text-[#2563eb]'}`}>
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {stat.trend === 'pending' && <PendingActions className="w-4 h-4" />}
                <span className="text-xs font-bold tracking-wide cursor-pointer hover:underline">{stat.change}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Assignments */}
          <div className="lg:col-span-2 flex flex-col gap-12">
            <section className="bg-[#050f1c] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#091421]/50">
                <h2 className="text-2xl font-bold text-white font-display">Current Assignments</h2>
                <button className="text-[#2563eb] text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="divide-y divide-white/5">
                {assignments.map((item, i) => (
                  <div key={i} className="p-8 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`${item.color} p-3 rounded-xl shrink-0 shadow-inner`}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-[#c3c6d7]">{item.class} • Due {item.due}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 sm:ml-auto">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{item.submitted}</p>
                        <p className="text-[10px] text-[#c3c6d7] uppercase font-bold tracking-widest">Submitted</p>
                      </div>
                      <Button className="border-2 border-white/10 bg-transparent text-white hover:border-[#2563eb] hover:text-[#2563eb] px-6 py-2.5 rounded-xl font-bold transition-all">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Progress Bars */}
            <section className="bg-[#050f1c] rounded-2xl border border-white/5 shadow-xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white font-display">Student Progress Overview</h2>
                <MoreVertical className="w-5 h-5 text-[#c3c6d7] cursor-pointer hover:text-white" />
              </div>
              <div className="space-y-8">
                {[
                  { label: "Physics 101 - Midterm Prep", value: 85, color: "bg-[#6bd8cb]" },
                  { label: "AP Physics - Mechanics", value: 60, color: "bg-[#2563eb]" },
                  { label: "Intro to Electronics", value: 30, color: "bg-[#ffb596]" }
                ].map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold mb-3">
                      <span className="text-white">{p.label}</span>
                      <span className="text-white">{p.value}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                      <div className={`${p.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${p.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Quick Lab Manager */}
          <div className="lg:col-span-1">
            <section className="bg-[#050f1c] rounded-2xl border border-white/5 shadow-xl p-8 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-white mb-2 font-display">Quick Lab Manager</h2>
              <p className="text-sm text-[#c3c6d7] mb-8">Browse and assign pre-configured simulation labs.</p>
              
              <div className="flex flex-col gap-6 flex-1">
                {[
                  { title: "Simple Pendulum", concepts: "Gravity, Period, Mass", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrP08iZmVgqf8nWp3iJs5rWrGQZLZwf183ZgVBGvtsecFDv--GfdYs37BTAAJnyH-6yQOSk9sAoTbRprLewbIDWR6LdOhurHkr5gz3A72CzyZlplJI-s-cnDK0vjIzoAMmUw0_Z6kUqUzQacyEgwiqHeCttrHPte6j3sQpYAhtUbNTU5yHWJhKCAcYgUcVtDfX-Bf9LXqEADVHEjDZuhPrid5S6m34pPv5IN7solbGZjVeL3cGwYye6GAJOTcp9mOLvNKBBvcnU3U" },
                  { title: "Friction Surfaces", concepts: "Kinetic/Static Friction", icon: <Speed className="w-8 h-8 text-[#ffb596]" />, color: "bg-[#ffdbcd]" }
                ].map((lab, i) => (
                  <div key={i} className="border border-white/5 rounded-2xl p-4 hover:shadow-2xl hover:border-white/10 transition-all cursor-pointer bg-[#091421] group relative overflow-hidden">
                    <div className="h-32 bg-[#16202e] rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                      {lab.img ? (
                        <img src={lab.img} alt={lab.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full ${lab.color} flex items-center justify-center`}>
                          {lab.icon}
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-white mb-1">{lab.title}</h4>
                    <p className="text-[10px] text-[#c3c6d7] uppercase font-bold tracking-widest mb-4">{lab.concepts}</p>
                    <Button className="w-full bg-[#16202e] text-[#2563eb] border border-[#2563eb]/20 font-bold py-5 rounded-xl group-hover:bg-[#2563eb] group-hover:text-white transition-all flex items-center justify-center gap-2">
                      <AddCircle className="w-4 h-4" /> Quick Assign
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button className="mt-8 w-full border-2 border-[#2563eb] bg-transparent text-[#2563eb] font-bold py-7 rounded-xl hover:bg-[#2563eb] hover:text-white transition-all uppercase tracking-widest text-xs">
                Browse Full Catalog
              </Button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

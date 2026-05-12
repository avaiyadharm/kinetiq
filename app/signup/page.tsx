"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Atom, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const [role, setRole] = React.useState("student");
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#091421] text-[#d9e3f6] flex flex-col antialiased relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Decorative Top Bar */}
      <div className="w-full h-1 bg-[#2563eb] shrink-0 relative z-10"></div>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Branding & Header */}
          <div className="mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                <Atom className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tighter font-display">KINETIQ</span>
            </Link>
            <h1 className="text-3xl font-bold text-white font-display">Create Account</h1>
            <p className="text-sm text-gray-400 mt-2 font-medium">Precision engineering for your laboratory workflow.</p>
          </div>

          {/* Form Container */}
          <div className="bg-[#050f1c]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block" htmlFor="fullName">
                  Full Name
                </label>
                <input 
                  className="w-full bg-[#091421] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" 
                  id="fullName" 
                  placeholder="MARIE CURIE" 
                  type="text"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block" htmlFor="email">
                  Laboratory Email
                </label>
                <input 
                  className="w-full bg-[#091421] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" 
                  id="email" 
                  placeholder="m.curie@kinetiq.lab" 
                  type="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block" htmlFor="password">
                  Security Key
                </label>
                <div className="relative">
                  <input 
                    className="w-full bg-[#091421] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" 
                    id="password" 
                    placeholder="••••••••••••" 
                    type={showPassword ? "text" : "password"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Segmented Control */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  Access Role
                </label>
                <div className="flex p-1 bg-[#091421] border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                      role === "student" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    STUDENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                      role === "teacher" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    TEACHER
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Link href="/dashboard" className="block">
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98] transition-all duration-200 tracking-widest flex items-center justify-center gap-2"
                  type="submit"
                >
                  Initialize Account <CheckCircle2 className="w-4 h-4" />
                </button>
              </Link>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-white/5"></div>
              <span className="text-[10px] font-bold text-gray-600 tracking-[0.2em]">AUTH.METHOD</span>
              <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>

            {/* SSO */}
            <button className="w-full border border-white/10 bg-[#091421] hover:bg-white/5 text-white text-[10px] font-bold uppercase py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 group">
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Laboratory ID
            </button>
          </div>

          {/* Footer Action */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Existing personnel? <Link href="/login" className="font-bold text-blue-500 hover:underline ml-1">Authenticate Here</Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Decorative Glows */}
      <div className="absolute top-[20%] -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] -right-20 w-80 h-80 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}

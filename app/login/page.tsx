"use client";

import React from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Atom } from "lucide-react"; // Using Lucide icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#091421] text-[#d9e3f6] flex flex-col justify-center items-center font-sans antialiased selection:bg-[#b4c5ff]/30 selection:text-white">
      <main className="flex-grow flex flex-col justify-center items-center px-6 py-16 w-full">
        <div className="w-full max-w-md bg-[#050f1c] rounded-xl shadow-2xl p-8 border border-white/5 relative overflow-hidden">
          {/* Decorative geometric top bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#2563eb]"></div>
          
          <div className="flex flex-col items-center mb-8 pt-4">
            <div className="w-16 h-16 bg-[#2563eb]/10 rounded-full flex items-center justify-center mb-4 border border-[#2563eb]/20">
              <Atom className="w-10 h-10 text-[#2563eb]" />
            </div>
            <h1 className="text-3xl font-bold text-[#2563eb] tracking-tight font-display">Kinetiq</h1>
            <p className="text-sm text-[#c3c6d7] mt-2">Welcome back, Scientist!</p>
          </div>

          <form className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-[#d9e3f6] uppercase tracking-wider" htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0] w-5 h-5" />
                <Input 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#434655] bg-[#091421] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-[#d9e3f6] outline-none transition-all" 
                  id="email" 
                  name="email" 
                  placeholder="newton@kinetiq.edu" 
                  required 
                  type="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-[#d9e3f6] uppercase tracking-wider" htmlFor="password">Password</Label>
                <Link className="text-xs font-bold text-[#2563eb] hover:text-[#b4c5ff] transition-colors" href="#">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0] w-5 h-5" />
                <Input 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#434655] bg-[#091421] focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] text-[#d9e3f6] outline-none transition-all" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                />
              </div>
            </div>

            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-[#2563eb] text-white font-bold py-6 rounded-lg shadow-lg hover:bg-[#1d4ed8] active:scale-[0.98] transition-all mt-4 flex justify-center items-center gap-2 group">
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </form>

          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-[#434655]/50"></div>
            <span className="px-4 text-[10px] font-bold text-[#c3c6d7] uppercase tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-[#434655]/50"></div>
          </div>

          <button className="w-full bg-[#16202e] text-[#d9e3f6] py-3 rounded-lg border border-[#434655] shadow-sm hover:bg-[#212b39] active:scale-[0.98] transition-all flex justify-center items-center gap-3" type="button">
            <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"></path>
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.7 5.84 14.12H2.15V16.98C3.96 20.57 7.68 23 12 23Z" fill="#34A853"></path>
              <path d="M5.84 14.12C5.62 13.46 5.49 12.75 5.49 12C5.49 11.25 5.62 10.54 5.84 9.88V7.02H2.15C1.41 8.49 1 10.18 1 12C1 13.82 1.41 15.51 2.15 16.98L5.84 14.12Z" fill="#FBBC05"></path>
              <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.08 14.97 1 12 1C7.68 1 3.43 2.15 7.02L5.84 9.88C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"></path>
            </svg>
            Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-sm text-[#c3c6d7]">
              Don't have an account? <Link className="text-[#2563eb] font-bold hover:underline" href="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

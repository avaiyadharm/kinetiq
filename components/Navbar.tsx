"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { NAVIGATION_LINKS, CATEGORIES, SIMULATIONS } from "@/src/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface NavbarProps {}

export const Navbar: React.FC<Readonly<NavbarProps>> = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[98%] max-w-[1600px] rounded-2xl backdrop-blur-md border border-border bg-black/40 z-50 flex justify-between items-center px-12 py-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
             <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/></svg>
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white font-display">KINETIQ</span>
        </Link>
      </div>
      
      <nav className="hidden md:flex items-center gap-2">
        <NavigationMenu delayDuration={0}>
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-white/70 hover:bg-white/5 hover:text-white data-[state=open]:bg-white/5 data-[state=open]:text-white focus:bg-white/5 px-4 font-bold text-sm h-auto py-2 rounded-lg transition-all duration-300">
                Gallery
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[800px] p-6 bg-[#09090b] border border-border/50 rounded-xl grid grid-cols-3 gap-6 shadow-2xl">
                  {/* Categories Column */}
                  <div className="col-span-1 border-r border-border/50 pr-6">
                     <h4 className="text-white font-bold mb-4 font-display text-lg">Categories</h4>
                     <ul className="flex flex-col gap-1">
                       {CATEGORIES.map((cat) => (
                         <li key={cat.name}>
                           <NavigationMenuLink asChild>
                             <Link href={`/simulations?category=${encodeURIComponent(cat.name)}`} className="text-white/60 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 block">
                               {cat.name}
                             </Link>
                           </NavigationMenuLink>
                         </li>
                       ))}
                     </ul>
                  </div>
                  {/* Featured Simulations Column */}
                  <div className="col-span-2">
                     <h4 className="text-white font-bold mb-4 font-display text-lg">Featured Simulations</h4>
                     <div className="grid grid-cols-2 gap-4">
                        {SIMULATIONS.slice(0, 4).map((sim) => (
                          <NavigationMenuLink asChild key={sim.title}>
                             <Link href={sim.href} className="group flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10">
                                <div className="w-16 h-16 rounded bg-black/40 overflow-hidden flex-shrink-0 relative">
                                   <div className="absolute inset-0 bg-primary/20 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-300 z-10" />
                                   <img src={sim.image} alt={sim.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 relative z-0" />
                                </div>
                                <div className="flex flex-col justify-center">
                                   <h5 className="text-white text-sm font-bold group-hover:text-primary transition-colors duration-300">{sim.title}</h5>
                                   <p className="text-white/50 text-[10px] line-clamp-2 mt-1 leading-snug">{sim.description}</p>
                                </div>
                             </Link>
                          </NavigationMenuLink>
                        ))}
                     </div>
                     <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                       <NavigationMenuLink asChild>
                          <Link href="/simulations" className="text-primary text-xs font-bold hover:underline flex items-center gap-1 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 transition-all duration-300 hover:bg-primary/20 hover:scale-105">
                            Explore All Labs <span aria-hidden="true">&rarr;</span>
                          </Link>
                       </NavigationMenuLink>
                     </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {NAVIGATION_LINKS.filter(l => l.label !== "Gallery").map((link) => (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink asChild>
                  <Link href={link.href} className="text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 px-4 py-2 rounded-lg block">
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/login">
          <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 font-bold transition-all">
            Log In
          </Button>
        </Link>
        <Link href="/signup">
          <Button className="bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-md font-bold px-6">
            Sign Up
          </Button>
        </Link>
      </div>
    </motion.header>
  );
};

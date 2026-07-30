"use client";

import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="fixed top-5 right-0 left-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-7xl rounded-full border border-white/14 bg-slate-950/58 shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <div className="flex h-16 items-center justify-between px-5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black tracking-tight text-white"
          >
            <span className="premium-icon size-9 rounded-full">
              <CalendarDays className="size-5" />
            </span>
            <span>Orvio</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-bold text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-violet-200">
              Features
            </a>

            <a href="#dashboard" className="transition hover:text-blue-200">
              Dashboard
            </a>

            <a href="#features" className="inline-flex items-center gap-1.5 transition hover:text-cyan-200">
              <Sparkles className="size-3.5" />
              Premium
            </a>
          </div>

          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>

            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

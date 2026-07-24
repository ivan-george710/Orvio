"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export default function Navbar() {
  return (
    <header className="fixed top-5 left-0 right-0 z-50 flex justify-center">
      <nav className="w-[95%] max-w-7xl rounded-full border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-lg">
        <div className="flex h-16 items-center justify-between px-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl"
          >
            <CalendarDays className="h-6 w-6 text-indigo-600" />
            <span>Orvio</span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="transition hover:text-indigo-600">
              Features
            </a>

            <a href="#dashboard" className="transition hover:text-indigo-600">
              Dashboard
            </a>

            <a href="#faq" className="transition hover:text-indigo-600">
              FAQ
            </a>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">
                Login
              </Button>
            </Link>

            <Link href="/signup">
              <Button>
                Get Started
              </Button>
            </Link>
          </div>

        </div>
      </nav>
    </header>
  );
}
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="premium-page relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(90deg,rgba(124,58,237,0.22),rgba(99,102,241,0.16),rgba(59,130,246,0.14))] blur-3xl" />

      <div className="premium-container mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-6 pt-16 pb-20 sm:min-h-[calc(100vh-4.5rem)] sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center"
        >
          <div className="premium-kicker px-4 py-2 text-sm font-bold">
            <Sparkles className="size-4 text-violet-200" />
            Orvio Event OS
          </div>

          <h1 className="premium-title mt-8 text-5xl font-black leading-[0.94] sm:text-6xl md:text-8xl">
            Plan Events
            <br />
            <span className="bg-[linear-gradient(100deg,#8b5cf6,#6366f1_48%,#06b6d4)] bg-clip-text text-transparent">
              That Feel Electric.
            </span>
          </h1>

          <p className="premium-text mx-auto mt-8 max-w-2xl text-lg leading-8 sm:text-xl">
            Create, manage and discover events effortlessly. Built for
            organizers, communities and universities.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>

            <Button variant="outline" size="lg">
              Learn More
              <ArrowRight />
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-200">
            {["Open Source", "Fast Setup", "Modern UI"].map((item, index) => (
              <div
                key={item}
                className="animate-rise-in rounded-full border border-white/12 bg-white/8 px-3 py-1.5 shadow-lg shadow-black/20 backdrop-blur-xl"
                style={{ animationDelay: `${index * 90 + 260}ms` }}
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <DashboardPreview />
      </div>
    </section>
  );
}

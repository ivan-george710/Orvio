"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-indigo-50" />

  <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-200/20 blur-3xl" />

  <div className="absolute -left-40 top-60 h-96 w-96 rounded-full bg-violet-200/20 blur-3xl" />

  <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
</div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-40 pb-20">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          className="text-center"
        >

          <div className="inline-flex rounded-full border bg-white px-4 py-2 text-sm shadow-sm">
            🚀 Modern Event Management Platform
          </div>

          <h1 className="mt-8 text-6xl font-black tracking-tight text-slate-900 md:text-7xl">
           Plan Better.

            <br />

            <span className="text-indigo-600">
              Host Smarter.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-slate-600">
            Create, manage and discover events effortlessly.
            Built for organizers, communities and universities.
          </p>

          <div className="mt-10 flex justify-center gap-4">

            <Link href="/signup">
              <Button
  size="lg"
  className="h-12 rounded-xl px-8 text-base shadow-lg"
>
                Get Started
              </Button>
            </Link>

            <Button
  variant="outline"
  size="lg"
  className="h-12 rounded-xl px-8 text-base"
>
              Learn More

              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            

          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-500">

  <div className="flex items-center gap-2">
    <div className="h-2 w-2 rounded-full bg-green-500" />
    Open Source
  </div>

  <div className="flex items-center gap-2">
    <div className="h-2 w-2 rounded-full bg-indigo-500" />
    Fast Setup
  </div>

  <div className="flex items-center gap-2">
    <div className="h-2 w-2 rounded-full bg-violet-500" />
    Modern UI
  </div>

</div>

        </motion.div>

        <DashboardPreview />

      </div>

    </section>
  );
}
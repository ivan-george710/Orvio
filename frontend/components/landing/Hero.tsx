"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div
        className="ambient absolute -right-40 -top-32 h-[850px] w-[850px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 sm:pt-24 lg:pt-28">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="animate-rise-in relative z-10">
            <p className="eyebrow">
              <span className="size-1.5 rounded-full bg-primary" /> A place for
              your next experience
            </p>
            <h1 className="mt-7 text-[clamp(3.7rem,8.5vw,8rem)] font-semibold leading-[.94] tracking-[-.075em]">
              Discover
              <br />
              what&apos;s <span className="text-primary">next.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              Great events bring people together. Find your next experience, or
              create one worth showing up for.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/events" className={buttonVariants({ size: "lg" })}>
                Explore Events <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/events/create"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Create an Event <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div
            className="relative flex h-[280px] items-center justify-center sm:h-[370px] lg:h-[470px]"
            aria-hidden="true"
          >
            <div className="hero-orbit" />
            <div className="hero-orbit !w-[68%] !rotate-[28deg]" />
            <div className="hero-orbit !w-[45%] !rotate-[-48deg]" />
            <span className="absolute text-[clamp(9rem,20vw,18rem)] font-semibold tracking-[-.1em] text-foreground/[.06]">
              O
            </span>
            <div className="absolute left-[7%] top-[20%] border-l-2 border-primary bg-background/90 px-5 py-4 shadow-2xl">
              <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                Find your people
              </p>
              <p className="mt-1 text-xl font-medium tracking-tight">
                Make a connection.
              </p>
            </div>
            <div className="absolute bottom-[16%] right-[3%] border border-border bg-background/95 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[.2em] text-primary">
                Make it happen
              </p>
              <p className="mt-1 text-xl font-medium tracking-tight">
                Create a moment.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground lg:mt-16">
          <p className="uppercase tracking-[.18em]">
            Discover. Connect. Create.
          </p>
          <a
            href="#how-it-works"
            className="inline-flex min-h-11 items-center gap-3 transition-colors hover:text-foreground"
          >
            See how it works <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

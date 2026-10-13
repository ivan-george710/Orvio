import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
export default function CTA() {
  return (
    <section className="relative isolate overflow-hidden border-y border-border bg-secondary/40">
      <div
        className="ambient absolute -left-40 top-0 h-full w-[700px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:py-24">
        <div>
          <p className="eyebrow">02 / Your next chapter</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
            Something great
            <br />
            starts with you.
          </h2>
          <p className="mt-5 max-w-md leading-7 text-muted-foreground">
            Turn an idea into an event. Give your community a reason to come
            together.
          </p>
        </div>
        <Link
          href="/events/create"
          className={buttonVariants({ size: "lg", className: "w-fit" })}
        >
          Create an Event <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

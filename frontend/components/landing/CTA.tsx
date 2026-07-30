import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="premium-page py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="premium-panel rounded-[2rem] px-8 py-16 text-center text-white sm:px-10 sm:py-20">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Ready to host your next event?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300/80">
            Join organizers who are simplifying event management with Orvio.
          </p>

          <Link href="/signup">
            <Button className="mt-10" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="py-28">

      <div className="mx-auto max-w-6xl px-6">

        <div className="rounded-[40px] bg-indigo-600 px-10 py-20 text-center text-white shadow-2xl">

          <h2 className="text-5xl font-bold">
            Ready to host your next event?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg opacity-90">
            Join organizers who are simplifying event
            management with Orvio.
          </p>

          <Link href="/signup">
            <Button
              className="mt-10 bg-white text-indigo-600 hover:bg-slate-100"
              size="lg"
            >
              Get Started
            </Button>
          </Link>

        </div>

      </div>

    </section>
  );
}
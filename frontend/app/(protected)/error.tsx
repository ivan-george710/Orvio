"use client";
import { Button } from "@/components/ui/button";
export default function ProtectedError({ reset }: { reset: () => void }) {
  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-3xl font-semibold">
          We couldn&apos;t load this page.
        </h1>
        <p className="premium-text my-5">
          Please try again in a moment. Your saved events and registrations are
          safe.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}

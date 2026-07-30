"use client";

import { useState, useTransition } from "react";

import { registerForEventAction } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";

type RegisterEventButtonProps = {
  eventId: string;
};

export default function RegisterEventButton({
  eventId,
}: RegisterEventButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState("");

  function handleRegister() {
    setError("");

    startTransition(async () => {
      try {
        await registerForEventAction(eventId);
        setIsRegistered(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to register for event."
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100">
          {error}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={isPending || isRegistered}
        onClick={handleRegister}
      >
        {isRegistered
          ? "Registered Successfully"
          : isPending
            ? "Registering..."
            : "Register for Event"}
      </Button>
    </div>
  );
}

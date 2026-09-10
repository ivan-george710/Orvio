"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  cancelRegistrationAction,
  registerForEventAction,
} from "@/lib/actions/events";
import { Button } from "@/components/ui/button";

type RegisterEventButtonProps = {
  eventId: string;
  initiallyRegistered?: boolean;
  isFull?: boolean;
  disabledReason?: string | null;
};

export default function RegisterEventButton({
  eventId,
  initiallyRegistered = false,
  isFull = false,
  disabledReason = null,
}: RegisterEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRegistered, setIsRegistered] = useState(initiallyRegistered);
  const [error, setError] = useState("");

  function handleRegister() {
    setError("");

    startTransition(async () => {
      const result = await registerForEventAction(eventId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setIsRegistered(true);
      router.refresh();
    });
  }

  function handleCancel() {
    setError("");

    startTransition(async () => {
      const result = await cancelRegistrationAction(eventId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setIsRegistered(false);
      router.refresh();
    });
  }

  if (disabledReason) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3 text-sm font-bold text-slate-200">
        {disabledReason}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100">
          {error}
        </p>
      )}

      {isRegistered ? (
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={handleCancel}
        >
          {isPending ? "Cancelling..." : "Cancel Registration"}
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={isPending || isFull}
          onClick={handleRegister}
        >
          {isFull
            ? "Event is full"
            : isPending
              ? "Registering..."
              : "Register for Event"}
        </Button>
      )}
    </div>
  );
}
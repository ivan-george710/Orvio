"use client";

import { useState, useTransition } from "react";

import { approveEventAction, rejectEventAction } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";

type AdminEventActionsProps = {
  eventId: string;
  onSuccess?: () => void;
};

export default function AdminEventActions({
  eventId,
  onSuccess,
}: AdminEventActionsProps) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function runAction(action: (id: string) => Promise<void>) {
    setError("");

    startTransition(async () => {
      try {
        await action(eventId);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          size="sm"
          variant="success"
          disabled={isPending}
          onClick={() => runAction(approveEventAction)}
        >
          Approve
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => runAction(rejectEventAction)}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

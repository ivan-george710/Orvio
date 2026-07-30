"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { approveEventAction, rejectEventAction } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";

type AdminEventActionsProps = {
  eventId: string;
};

export default function AdminEventActions({ eventId }: AdminEventActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function runAction(action: (id: string) => Promise<void>) {
    setError("");

    startTransition(async () => {
      try {
        await action(eventId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
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

      <div className="flex gap-3">
        <Button
          type="button"
          size="sm"
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

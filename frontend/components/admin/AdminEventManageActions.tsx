"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  adminDeleteEventAction,
  setEventStatusAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/lib/services/server/events";

type AdminEventManageActionsProps = {
  eventId: string;
  status: EventStatus;
};

export default function AdminEventManageActions({
  eventId,
  status,
}: AdminEventManageActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setError("");

    startTransition(async () => {
      const result = await task();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => setEventStatusAction(eventId, "approved"))}
          >
            Approve
          </Button>
        )}

        {status !== "rejected" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => setEventStatusAction(eventId, "rejected"))}
          >
            Reject
          </Button>
        )}

        {status === "approved" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => run(() => setEventStatusAction(eventId, "completed"))}
          >
            Complete
          </Button>
        )}

        {status !== "cancelled" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => setEventStatusAction(eventId, "cancelled"))}
          >
            Cancel
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            if (
              window.confirm(
                "Delete this event? Registrations for it will also be removed if your database cascades deletes."
              )
            ) {
              run(() => adminDeleteEventAction(eventId));
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
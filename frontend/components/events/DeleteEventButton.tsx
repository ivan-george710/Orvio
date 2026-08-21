"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteEventAction } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteEventButtonProps = {
  eventId: string;
};

export default function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError("");

    startTransition(async () => {
      try {
        await deleteEventAction(eventId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete event.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="destructive" size="sm" />}
      >
        Withdraw
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw event?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Only pending events can be withdrawn.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

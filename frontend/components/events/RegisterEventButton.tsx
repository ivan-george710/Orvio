"use client";
import Link from "next/link";
import CapacityIndicator from "@/components/events/CapacityIndicator";
import type { Event } from "@/lib/services/server/events";
import type { RegistrationSummary } from "@/lib/registrations";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import {
  registerForEventAction,
  cancelRegistrationAction,
} from "@/lib/actions/registrations";
import { registrationEligibility } from "@/lib/registrations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  eventId: string;
  event?: Event;
  authenticated: boolean;
  registered: boolean;
  status: string;
  start: string | null;
  remaining: number;
  initialNow: number;
  cancellationOnly?: boolean;
};
export default function RegisterEventButton({
  eventId,
  event,
  authenticated,
  registered,
  status,
  start,
  remaining,
  initialNow,
  cancellationOnly = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmedSummary, setConfirmedSummary] =
    useState<RegistrationSummary | null>(null);
  const snapshot =
    confirmedSummary && confirmedSummary.checked_at >= initialNow
      ? confirmedSummary
      : null;
  const currentlyRegistered = snapshot?.is_registered ?? registered;
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    if (!start || Date.parse(start) <= now) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(Date.parse(start) - Date.now() + 1, 0), 86400000),
    );
    return () => clearTimeout(timer);
  }, [start, now]);
  const eligibility = registrationEligibility(
    status,
    start,
    snapshot?.remaining_spots ?? remaining,
    now,
  );
  const canCancel = !!start && Date.parse(start) > now;
  function change(cancel: boolean) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await (cancel
          ? cancelRegistrationAction(eventId)
          : registerForEventAction(eventId));
        if (!result.ok) {
          setError(result.error);
          router.refresh();
          return;
        }
        setConfirmedSummary(result.summary ?? null);
        setOpen(false);
        setMessage(
          cancel
            ? "Registration cancelled. Your spot has been released."
            : "You're in! Your registration is confirmed.",
        );
      } catch {
        setError(
          "Connection interrupted. Refresh to check your registration before trying again.",
        );
      }
    });
  }
  return (
    <div className="space-y-3" aria-busy={pending}>
      {event && (
        <div className="mb-6">
          <CapacityIndicator
            event={{ ...event, registration: snapshot ?? event.registration }}
          />
        </div>
      )}
      {message && (
        <p
          role="status"
          className="rounded-lg border border-success/25 bg-success/10 p-3 text-sm text-success"
        >
          {message}
        </p>
      )}
      {error && !open && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {currentlyRegistered ? (
        <>
          <p className="flex items-center justify-center gap-2 rounded-lg border border-success/25 bg-success/10 px-4 py-3 font-medium text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            You&apos;re Registered
          </p>
          {canCancel ? (
            <Dialog
              open={open}
              onOpenChange={(value) => {
                if (!pending) setOpen(value);
              }}
            >
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={pending}
                  />
                }
              >
                Cancel Registration
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel your registration?</DialogTitle>
                  <DialogDescription>
                    Your spot will be released. You can register again if space
                    is available before the event starts.
                  </DialogDescription>
                </DialogHeader>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline" disabled={pending} />}
                  >
                    Keep my spot
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => change(true)}
                  >
                    {pending ? "Cancelling..." : "Confirm cancellation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Registration changes are closed.
            </p>
          )}
        </>
      ) : (
        !cancellationOnly &&
        (eligibility === "closed" ? (
          <Button disabled className="w-full">
            Registration Closed
          </Button>
        ) : eligibility === "full" ? (
          <Button disabled className="w-full">
            Event Full
          </Button>
        ) : !authenticated ? (
          <Link
            className="btn-primary inline-flex min-h-12 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold"
            href={`/login?redirectTo=${encodeURIComponent(`/events/${eventId}`)}`}
          >
            Login to Register
          </Link>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => change(false)}
          >
            {pending && (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {pending ? "Registering..." : "Register for Event"}
          </Button>
        ))
      )}
    </div>
  );
}

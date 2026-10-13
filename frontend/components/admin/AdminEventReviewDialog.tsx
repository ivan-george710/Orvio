"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import { useState, type ReactNode } from "react";

import AdminEventActions from "@/components/admin/AdminEventActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Event } from "@/lib/services/server/events";
import { formatEventDate, formatParticipantCap } from "@/lib/utils";

type AdminEventReviewDialogProps = {
  event: Event;
};

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-carbon p-4">
      <p className="text-[10px] font-medium uppercase tracking-[.15em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

export default function AdminEventReviewDialog({
  event,
}: AdminEventReviewDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        Review
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl leading-tight">
            {event.title}
          </DialogTitle>
          <DialogDescription>
            Complete event submission details for admin review.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <DetailItem
            label="Venue"
            value={
              <span className="inline-flex items-center gap-2 [&_svg]:shrink-0">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {event.venue}
              </span>
            }
          />
          <DetailItem
            label="Date & Time"
            value={
              <span className="inline-flex items-center gap-2 [&_svg]:shrink-0">
                <CalendarDays
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                {formatEventDate(event.event_datetime)}
              </span>
            }
          />
          <DetailItem
            label="Participants"
            value={
              <span className="inline-flex items-center gap-2 [&_svg]:shrink-0">
                <Users className="size-4 text-primary" aria-hidden="true" />
                {formatParticipantCap(event.max_participants)}
              </span>
            }
          />
        </div>

        <section className="rounded-lg border border-border bg-carbon p-4">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Description
          </h3>
          <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
            {event.description}
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="Organizer"
            value={event.organizer_name?.trim() || "Unknown Organizer"}
          />
          <DetailItem
            label="Submitted"
            value={new Date(event.created_at).toLocaleString()}
          />
        </div>

        <DialogFooter className="items-stretch sm:items-center">
          <AdminEventActions
            eventId={event.id}
            onSuccess={() => setOpen(false)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

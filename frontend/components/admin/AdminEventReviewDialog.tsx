"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";

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

type AdminEventReviewDialogProps = {
  event: Event;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

export default function AdminEventReviewDialog({
  event,
}: AdminEventReviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        Review
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
          <DialogDescription>
            Complete event submission details for admin review.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <DetailItem
            label="Venue"
            value={
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-cyan-200" aria-hidden="true" />
                {event.venue}
              </span>
            }
          />
          <DetailItem
            label="Date & Time"
            value={
              <span className="inline-flex items-center gap-2">
                <CalendarDays
                  className="size-4 text-violet-200"
                  aria-hidden="true"
                />
                {new Date(event.event_datetime).toLocaleString()}
              </span>
            }
          />
          <DetailItem
            label="Participants"
            value={
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-blue-200" aria-hidden="true" />
                {event.max_participants}
              </span>
            }
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <h3 className="text-sm font-black uppercase text-slate-300">
            Description
          </h3>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-300/80">
            {event.description}
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Creator ID" value={event.created_by} />
          <DetailItem
            label="Submitted"
            value={new Date(event.created_at).toLocaleString()}
          />
        </div>

        <DialogFooter className="items-stretch sm:items-center">
          <AdminEventActions eventId={event.id} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import Link from "next/link";
import CapacityIndicator from "@/components/events/CapacityIndicator";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { Event, EventStatus } from "@/lib/services/server/events";
import EventBanner from "@/components/events/EventBanner";
import { eventCategoryLabel } from "@/lib/event-metadata";
type EventCardProps = { event: Event };
export const statusBadgeClasses: Record<EventStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/25",
  approved: "bg-success/10 text-success border-success/25",
  rejected: "bg-destructive/10 text-destructive border-destructive/25",
  completed: "bg-secondary text-foreground border-border",
  cancelled: "bg-secondary text-muted-foreground border-border",
};
export default function EventCard({ event }: EventCardProps) {
  const date = event.event_datetime ? new Date(event.event_datetime) : null;
  const hasDate = date !== null && !Number.isNaN(date.getTime());
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block h-full rounded-xl focus-visible:outline-offset-4"
    >
      <article className="premium-card event-card flex h-full flex-col rounded-xl p-6">
        <EventBanner url={event.banner_url} title={event.title} compact />
        <div className="flex items-start justify-between gap-4">
          <div className="event-date">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
              {hasDate ? date.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              }) : "Date TBA"}
            </p>
            <p className="mt-1 text-3xl font-medium leading-none tracking-tight">
              {hasDate ? date.toLocaleDateString(undefined, { day: "2-digit" }) : "?"}
            </p>
          </div>
          <span className={`status-badge ${statusBadgeClasses[event.status]}`}>
            {event.status}
          </span>
        </div>
        <h3 className="mt-7 line-clamp-2 break-words text-2xl font-semibold leading-tight tracking-[-.035em] transition-colors group-hover:text-ember-light">
          {event.title}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">{eventCategoryLabel(event.category)}</p>
        <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{event.venue}</span>
        </p>
        <div className="mt-5">
          <CapacityIndicator event={event} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 pt-7">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {hasDate ? date.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            }) : "Time TBA"}
          </p>
          <span className="inline-flex items-center gap-2 text-xs font-medium">
            View event
            <ArrowUpRight className="event-arrow size-4" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}

import type { Event } from "@/lib/services/server/events";
export default function CapacityIndicator({ event }: { event: Event }) {
  const summary = event.registration;
  if (!summary)
    return (
      <p className="text-sm text-muted-foreground">Availability unavailable</p>
    );
  const capacity = Math.max(event.max_participants || 0, 0);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <span>
          {summary.active_count} / {capacity} registered
        </span>
        <span
          className={
            summary.remaining_spots ? "text-muted-foreground" : "text-warning"
          }
        >
          {summary.remaining_spots} spots left
        </span>
      </div>
      <div
        role="meter"
        aria-label="Event capacity"
        aria-valuemin={0}
        aria-valuemax={Math.max(capacity, 1)}
        aria-valuenow={Math.min(summary.active_count, capacity)}
        className="h-1 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${capacity ? Math.min((summary.active_count / capacity) * 100, 100) : 0}%`,
          }}
        />
      </div>
    </div>
  );
}

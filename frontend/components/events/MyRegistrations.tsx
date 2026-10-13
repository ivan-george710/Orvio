import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import RegisterEventButton from "@/components/events/RegisterEventButton";
import type { RegistrationWithEvent } from "@/lib/services/server/registrations";
export default function MyRegistrations({
  registrations,
}: {
  registrations: RegistrationWithEvent[];
}) {
  if (!registrations.length)
    return (
      <div className="premium-empty mt-6 rounded-xl p-8 text-center">
        <p className="text-lg">
          You haven&apos;t registered for any events yet.
        </p>
        <Link
          href="/events"
          className="btn-primary mt-5 inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold"
        >
          Explore Events
        </Link>
      </div>
    );
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {registrations.map((row) => (
        <article key={row.id} className="flex min-w-0 flex-col gap-3">
          <EventCard event={row.event} />
          <div className="premium-panel space-y-3 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              Registered {new Date(row.registered_at).toLocaleString()}
            </p>
            {row.status === "cancelled" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Cancelled{" "}
                  {row.cancelled_at &&
                    new Date(row.cancelled_at).toLocaleString()}
                </p>
                <Link
                  href={`/events/${row.event_id}`}
                  className="inline-flex min-h-11 items-center text-sm text-primary"
                >
                  View event &amp; availability
                </Link>
              </>
            ) : (
              <RegisterEventButton
                initialNow={row.event.registration?.checked_at ?? 0}
                eventId={row.event_id}
                authenticated
                registered
                status={row.event.status}
                start={row.event.event_datetime}
                remaining={row.event.registration?.remaining_spots ?? 0}
                cancellationOnly
              />
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

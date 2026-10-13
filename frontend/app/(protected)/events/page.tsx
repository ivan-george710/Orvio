import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";

import EventCard from "@/components/events/EventCard";
import { getApprovedEvents } from "@/lib/services/server/events";

export default async function EventsPage() {
  const events = await getApprovedEvents();

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <div className="border-b border-border pb-9">
          <p className="eyebrow mb-4">Discover / The event collection</p>
          <h1 className="premium-title text-4xl font-semibold">
            Find your next experience.
          </h1>

          <p className="premium-text mt-2">
            Explore approved events. Find something that brings you closer.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="premium-empty mt-16 flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center">
            <div className="premium-icon size-14">
              <CalendarDays className="size-7" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-foreground">
              No upcoming events.
            </h2>

            <p className="mt-2 text-muted-foreground">
              New experiences are on their way. Check back for newly approved
              events.
            </p>
            <Link
              href="/events/create"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ember-light"
            >
              Create an event <ArrowUpRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

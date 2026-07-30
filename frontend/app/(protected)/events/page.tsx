import { CalendarDays } from "lucide-react";

import EventCard from "@/components/events/EventCard";
import { getApprovedEvents } from "@/lib/services/server/events";

export default async function EventsPage() {
  const events = await getApprovedEvents();

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div>
          <h1 className="premium-title text-4xl font-black">
            Upcoming Events
          </h1>

          <p className="premium-text mt-2">
            Discover events happening around you.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="premium-empty mt-16 flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center">
            <div className="premium-icon size-14">
              <CalendarDays className="size-7" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">
              No upcoming events.
            </h2>

            <p className="mt-2 text-slate-300/75">
              Check back later for newly approved events.
            </p>
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

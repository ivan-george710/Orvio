import { CalendarDays, Search } from "lucide-react";

import EventCard from "@/components/events/EventCard";
import EventsSearchBar from "@/components/events/EventsSearchBar";
import { getApprovedEvents } from "@/lib/services/server/events";

type EventsPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { search } = await searchParams;
  const events = await getApprovedEvents({ search });

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

          <EventsSearchBar />
        </div>

        {events.length === 0 ? (
          <div className="premium-empty mt-16 flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center">
            <div className="premium-icon size-14">
              <CalendarDays className="size-7" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">
              {search ? "No events match your search." : "No upcoming events."}
            </h2>

            <p className="mt-2 text-slate-300/75">
              {search
                ? "Try a different title, or clear the search to see everything."
                : "Check back later for newly approved events."}
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
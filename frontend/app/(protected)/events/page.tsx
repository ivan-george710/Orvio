import { CalendarDays, Search } from "lucide-react";

import EventCard from "@/components/events/EventCard";
import { getApprovedEvents } from "@/lib/services/server/events";

type EventsPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { search } = await searchParams;
  const events = await getApprovedEvents(search);

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="premium-title text-4xl font-black">
              Upcoming Events
            </h1>

            <p className="premium-text mt-2">
              Discover events happening around you.
            </p>
          </div>

          <form className="flex w-full max-w-md gap-2" action="/events">
            <label className="sr-only" htmlFor="event-search">
              Search events
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="event-search"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search by title, venue, or description"
                className="h-11 w-full rounded-xl border border-white/14 bg-white/8 pr-3 pl-10 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-200/40"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/14 bg-white/8 px-4 text-sm font-bold text-slate-100 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-100"
            >
              Search
            </button>
          </form>
        </div>

        {events.length === 0 ? (
          <div className="premium-empty mt-16 flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center">
            <div className="premium-icon size-14">
              <CalendarDays className="size-7" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">
              {search?.trim()
                ? "No events match your search."
                : "No upcoming events."}
            </h2>

            <p className="mt-2 text-slate-300/75">
              {search?.trim()
                ? "Try a different keyword."
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
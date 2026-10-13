import Link from "next/link";
import { formatEventDate, formatParticipantCap } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { statusBadgeClasses } from "@/components/events/EventCard";
import RegisterEventButton from "@/components/events/RegisterEventButton";
import { getEventById } from "@/lib/services/server/events";

type EventDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!event) {
    notFound();
  }

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Events
        </Link>
        <article className="mt-8">
          <div className="border-b border-border pb-10">
            <span
              className={`status-badge ${statusBadgeClasses[event.status]}`}
            >
              {event.status}
            </span>
            <h1 className="premium-title mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              {event.title}
            </h1>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
            <div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex gap-4">
                  <CalendarDays
                    className="mt-1 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="eyebrow !text-muted-foreground">
                      Date &amp; time
                    </p>
                    <p className="mt-2 text-lg font-medium">
                      {formatEventDate(event.event_datetime)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin
                    className="mt-1 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="eyebrow !text-muted-foreground">The venue</p>
                    <p className="mt-2 break-words text-lg font-medium">
                      {event.venue}
                    </p>
                  </div>
                </div>
              </div>
              {event.organizer_name?.trim() && (
                <div className="mt-8 border-t border-border pt-6">
                  <p className="eyebrow !text-muted-foreground">Organized by</p>
                  <p className="mt-2 text-lg font-medium">
                    {event.organizer_name}
                  </p>
                </div>
              )}
              <section className="mt-10 border-t border-border pt-8">
                <h2 className="text-2xl font-semibold tracking-tight">
                  About the event
                </h2>
                <p className="mt-5 whitespace-pre-line break-words leading-8 text-muted-foreground">
                  {event.description}
                </p>
              </section>
            </div>
            <aside className="premium-panel h-fit rounded-xl p-6 sm:p-8">
              <p className="eyebrow">Be part of it</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                Your next experience.
              </h2>
              <div className="my-7 flex items-center gap-3 border-y border-border py-5">
                <Users className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xl font-medium">
                    {formatParticipantCap(event.max_participants)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Maximum participants
                  </p>
                </div>
              </div>
              <RegisterEventButton
                event={event}
                initialNow={event.registration?.checked_at ?? 0}
                eventId={event.id}
                authenticated={!!user}
                registered={event.registration?.is_registered ?? false}
                status={event.status}
                start={event.event_datetime}
                remaining={event.registration?.remaining_spots ?? 0}
              />
              {event.registration?.can_manage && (
                <Link
                  className="mt-5 inline-flex min-h-11 items-center text-sm text-primary"
                  href={`/events/${event.id}/attendees`}
                >
                  View Attendees &rarr;
                </Link>
              )}
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
}

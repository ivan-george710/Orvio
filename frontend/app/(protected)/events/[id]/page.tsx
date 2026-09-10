import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { statusBadgeClasses } from "@/components/events/EventCard";
import RegisterEventButton from "@/components/events/RegisterEventButton";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/services/server/events";
import {
  getEventParticipants,
  getEventRegistrationCount,
  getMyRegistrationForEvent,
} from "@/lib/services/server/registrations";
import { formatEventDate, formatParticipantCap } from "@/lib/utils";

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

  if (!event) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const registrationCount = await getEventRegistrationCount(id);
  const isOrganizer = Boolean(user && user.id === event.created_by);
  const myRegistration = user && !isOrganizer
    ? await getMyRegistrationForEvent(id)
    : null;
  const participants = isOrganizer ? await getEventParticipants(id) : [];
  const isFull =
    event.max_participants != null &&
    registrationCount >= event.max_participants;

  let disabledReason: string | null = null;

  if (event.status !== "approved") {
    disabledReason =
      event.status === "pending"
        ? "This event is awaiting admin approval."
        : `This event is ${event.status} and is not open for registration.`;
  } else if (isOrganizer) {
    disabledReason = "You created this event, so you cannot register for it.";
  } else if (!user) {
    disabledReason = "Log in to register for this event.";
  }

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-4xl px-6 py-10 sm:px-8">
        <Link
          href="/events"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/14 bg-white/8 px-3.5 text-sm font-bold text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-100"
        >
          Back to Events
        </Link>

        <article className="premium-panel mt-8 rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="premium-title text-4xl font-black">
              {event.title}
            </h1>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-sm font-bold capitalize shadow-lg backdrop-blur-xl ${statusBadgeClasses[event.status]}`}
            >
              {event.status}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-slate-200">
              <MapPin className="size-5 text-rose-200" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Venue
                </p>
                <p className="mt-1 text-sm font-bold">{event.venue}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-slate-200">
              <CalendarDays
                className="size-5 text-cyan-200"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Date & Time
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatEventDate(event.event_datetime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-slate-200">
              <Users className="size-5 text-amber-200" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Registered
                </p>
                <p className="mt-1 text-sm font-bold">
                  {registrationCount} / {formatParticipantCap(event.max_participants)}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-white/10 bg-white/8 p-5">
            <h2 className="text-xl font-black text-white">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-300/78">
              {event.description}
            </p>
          </section>

          {isOrganizer && (
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/8 p-5">
              <h2 className="text-xl font-black text-white">Participants</h2>
              {participants.length === 0 ? (
                <p className="mt-3 text-sm text-slate-300/75">
                  No one has registered yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
                    >
                      <span className="font-bold text-white">
                        {participant.full_name}
                      </span>
                      <span className="text-slate-400">
                        {formatEventDate(participant.registered_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            {!user && event.status === "approved" ? (
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/14 bg-white/8 text-sm font-bold text-slate-100 transition-all hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-100"
              >
                Log in to register
              </Link>
            ) : (
              <RegisterEventButton
                eventId={event.id}
                initiallyRegistered={Boolean(myRegistration)}
                isFull={isFull}
                disabledReason={disabledReason}
              />
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
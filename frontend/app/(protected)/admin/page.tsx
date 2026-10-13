import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, MapPin, Users } from "lucide-react";

import AdminEventReviewDialog from "@/components/admin/AdminEventReviewDialog";
import {
  getAdminEventStats,
  getAdminEvents,
  getCurrentUserRole,
  getPendingEvents,
} from "@/lib/services/server/events";

export default async function AdminPage() {
  let role;

  try {
    role = await getCurrentUserRole();
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated.") {
      redirect("/login");
    }

    throw error;
  }

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const [pendingEvents, stats, allEvents] = await Promise.all([
    getPendingEvents(),
    getAdminEventStats(),
    getAdminEvents(),
  ]);

  const statCards = [
    {
      label: "Pending Events",
      value: stats.pending,
      tone: "text-amber-100",
    },
    {
      label: "Approved Events",
      value: stats.approved,
      tone: "text-emerald-100",
    },
    {
      label: "Rejected Events",
      value: stats.rejected,
      tone: "text-red-100",
    },
  ];

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <div className="border-b border-border pb-9">
          <p className="eyebrow mb-4">Administration / Moderation console</p>
          <h1 className="premium-title text-4xl font-semibold">
            Event moderation
          </h1>

          <p className="premium-text mt-2">
            Review and manage event submissions.
          </p>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-carbon p-6"
            >
              <p className="text-sm font-bold text-muted-foreground">
                {stat.label}
              </p>
              <p className={`mt-4 text-5xl font-semibold ${stat.tone}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground">
            Pending Events
          </h2>

          {pendingEvents.length === 0 ? (
            <div className="premium-empty mt-8 rounded-xl px-6 py-14 text-center">
              <h3 className="text-2xl font-semibold text-foreground">
                No pending events
              </h3>
              <p className="mt-2 text-muted-foreground">
                All submitted events have been reviewed.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pendingEvents.map((event) => (
                <article
                  key={event.id}
                  className="premium-card flex min-w-0 flex-col rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-primary">
                        Pending review
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-semibold text-foreground">
                        {event.title}
                      </h3>
                    </div>

                    <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-100">
                      Pending
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-4 leading-7 text-muted-foreground">
                    {event.description}
                  </p>

                  <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 text-sm text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 truncate font-medium">
                        {event.venue}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <CalendarDays
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="font-bold">
                        {new Date(event.event_datetime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Users
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="font-bold">
                        {event.max_participants} max participants
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 mb-5 border-t border-border pt-4 text-xs text-muted-foreground">
                    <p>
                      Submitted{" "}
                      <span className="font-bold text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-1 break-all">
                      Organizer:{" "}
                      <span className="font-bold text-muted-foreground">
                        {event.organizer_name?.trim() || "Unknown Organizer"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary p-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <ClipboardList
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      Review submission
                    </div>

                    <AdminEventReviewDialog event={event} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-14 border-t border-border pt-10">
          <p className="eyebrow">Across every event</p>
          <h2 className="mt-3 text-2xl font-semibold">
            Registration management
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {allEvents.map((event) => (
              <article key={event.id} className="flex min-w-0 flex-col">
                <EventCard event={event} />
                <div className="mt-3 rounded-lg border border-border bg-carbon p-4">
                  <p className="text-sm text-muted-foreground">
                    Organizer:{" "}
                    {event.organizer_name?.trim() || "Unknown Organizer"}
                  </p>
                  <Link
                    href={`/events/${event.id}/attendees`}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary"
                  >
                    View Registrations &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {!allEvents.length && (
            <p className="premium-empty mt-6 rounded-xl p-8">
              No events to inspect yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

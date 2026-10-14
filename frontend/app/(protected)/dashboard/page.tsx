import MyRegistrations from "@/components/events/MyRegistrations";
import { getMyRegistrations } from "@/lib/services/server/registrations";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMyEvents } from "@/lib/services/server/events";

import LogoutButton from "@/components/auth/LogoutButton";
import QuickActions from "@/components/dashboard/QuickActions";
import DeleteEventButton from "@/components/events/DeleteEventButton";
import EventCard from "@/components/events/EventCard";
import { getCurrentProfile } from "@/lib/services/server/profile";
import { profileDisplayName } from "@/lib/profile";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [events, registrations, profile] = await Promise.all([
    getMyEvents(),
    getMyRegistrations(),
    getCurrentProfile(),
  ]);
  const pendingEvents = events.filter((event) => event.status === "pending");
  const approvedEvents = events.filter((event) => event.status === "approved");

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Your personal workspace</p>
            <h1 className="premium-title mt-4 text-4xl font-semibold">
              Welcome, {profileDisplayName(profile.full_name)}
            </h1>
            <p className="premium-text mt-4">
              Your ideas, your events, your next chapter.
            </p>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-y border-border py-6">
          <QuickActions />
          <nav
            aria-label="Workspace navigation"
            className="flex gap-5 text-sm text-muted-foreground"
          >
            <Link className="py-3 hover:text-foreground" href="/registrations">
              My registrations &#8599;
            </Link>
            <Link className="py-3 hover:text-foreground" href="/profile">
              Profile &#8599;
            </Link>
          </nav>
        </div>
        <section className="mt-12">
          <p className="eyebrow">Your plans</p>
          <h2 className="mt-2 text-2xl font-semibold">My Registrations</h2>
          <MyRegistrations registrations={registrations} />
        </section>
        <div className="mt-14 border-t border-border pt-10">
          <p className="eyebrow">Events you created</p>
          <h2 className="mt-2 text-3xl font-semibold">Your events</h2>
        </div>
        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow !text-warning">Awaiting review</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Pending events
              </h2>
            </div>
            <span className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 font-mono text-sm text-warning">
              {pendingEvents.length}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            You can edit or withdraw these events before they are reviewed.
          </p>
          {pendingEvents.length === 0 ? (
            <p className="premium-empty mt-6 rounded-xl px-6 py-10">
              No events awaiting review. Your next idea can start here.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingEvents.map((event) => (
                <div key={event.id} className="flex min-w-0 flex-col">
                  <EventCard event={event} />
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-carbon p-3">
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="btn-secondary inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold"
                    >
                      Edit event
                    </Link>
                    <DeleteEventButton eventId={event.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="section-rule mt-14">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow !text-success">
                Ready to bring people together
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Approved events
              </h2>
            </div>
            <span className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 font-mono text-sm text-success">
              {approvedEvents.length}
            </span>
          </div>
          {approvedEvents.length === 0 ? (
            <p className="premium-empty mt-6 rounded-xl px-6 py-10">
              Your approved events will appear here after review.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {approvedEvents.map((event) => (
                <div key={event.id}>
                  <EventCard event={event} />
                  <Link
                    href={`/events/${event.id}/attendees`}
                    className="mt-3 inline-flex min-h-11 items-center text-sm text-primary"
                  >
                    View Attendees &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Attendee management</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Registration history for all events you created, including past and
            cancelled events.
          </p>
          <div className="mt-5 space-y-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}/attendees`}
                className="premium-panel flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3"
              >
                <span>
                  {event.title}{" "}
                  <span className="text-xs capitalize text-muted-foreground">
                    {event.status}
                  </span>
                </span>
                <span className="text-sm text-primary">
                  View Attendees &rarr;
                </span>
              </Link>
            ))}
            {!events.length && (
              <p className="text-sm text-muted-foreground">
                Your created events will appear here.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

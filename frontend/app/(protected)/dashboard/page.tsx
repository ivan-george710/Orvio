import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMyEvents } from "@/lib/services/server/events";

import LogoutButton from "@/components/auth/LogoutButton";
import QuickActions from "@/components/dashboard/QuickActions";
import DeleteEventButton from "@/components/events/DeleteEventButton";
import EventCard from "@/components/events/EventCard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const events = await getMyEvents();
  const pendingEvents = events.filter((event) => event.status === "pending");
  const approvedEvents = events.filter((event) => event.status === "approved");

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="premium-panel flex flex-col gap-6 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="premium-title text-4xl font-black">
              Welcome, {user.user_metadata.full_name}
            </h1>

            <p className="premium-text mt-2">
              Ready to explore or create your next event?
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="mt-8">
          <QuickActions />
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-white">
            My Pending Events
          </h2>

          {pendingEvents.length === 0 ? (
            <p className="premium-empty mt-4 rounded-3xl px-6 py-10 text-center">
              You don&apos;t have any pending events.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingEvents.map((event) => (
                <div key={event.id} className="space-y-3">
                  <EventCard event={event} />

                  <div className="premium-panel flex gap-3 rounded-2xl p-3">
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10 px-3 text-sm font-bold text-violet-100 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-violet-500/15"
                    >
                      Edit
                    </Link>

                    <DeleteEventButton eventId={event.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-white">
            My Approved Events
          </h2>

          {approvedEvents.length === 0 ? (
            <p className="premium-empty mt-4 rounded-3xl px-6 py-10 text-center">
              You don&apos;t have any approved events.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {approvedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

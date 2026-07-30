import { redirect } from "next/navigation";

import AdminEventActions from "@/components/admin/AdminEventActions";
import EventCard from "@/components/events/EventCard";
import {
  getCurrentUserRole,
  getPendingEvents,
} from "@/lib/services/server/events";

export default async function AdminPage() {
  const role = await getCurrentUserRole();

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const pendingEvents = await getPendingEvents();

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="premium-panel rounded-[2rem] p-6">
          <h1 className="premium-title text-4xl font-black">
            Admin Dashboard
          </h1>

          <p className="premium-text mt-2">
            Review pending events before they appear publicly.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-white">
            Pending Events
          </h2>

          {pendingEvents.length === 0 ? (
            <p className="premium-empty mt-4 rounded-3xl px-6 py-10 text-center">
              There are no pending events to review.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingEvents.map((event) => (
                <div key={event.id} className="space-y-3">
                  <EventCard event={event} />
                  <div className="premium-panel rounded-2xl p-3">
                    <AdminEventActions eventId={event.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

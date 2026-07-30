import { CalendarDays } from "lucide-react";

import EventCard from "@/components/events/EventCard";
import { getMyRegistrations } from "@/lib/services/server/registrations";

export default async function RegistrationsPage() {
  const registrations = await getMyRegistrations();

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div>
          <h1 className="premium-title text-4xl font-black">
            My Registrations
          </h1>

          <p className="premium-text mt-2">
            Track the events you have registered for.
          </p>
        </div>

        {registrations.length === 0 ? (
          <div className="premium-empty mt-16 flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center">
            <div className="premium-icon size-14">
              <CalendarDays className="size-7" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">
              You haven&apos;t registered for any events yet.
            </h2>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {registrations.map((registration) =>
              registration.event ? (
                <div key={registration.id} className="space-y-3">
                  <EventCard event={registration.event} />
                  <p className="premium-panel rounded-2xl px-4 py-3 text-sm text-slate-300/75">
                    Registration status:{" "}
                    <span className="font-bold capitalize text-violet-100">
                      {registration.status}
                    </span>
                  </p>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </main>
  );
}

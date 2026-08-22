import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, MapPin, Users } from "lucide-react";

import AdminEventReviewDialog from "@/components/admin/AdminEventReviewDialog";
import {
  getAdminEventStats,
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

  const [pendingEvents, stats] = await Promise.all([
    getPendingEvents(),
    getAdminEventStats(),
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
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="premium-panel rounded-[2rem] p-6">
          <h1 className="premium-title text-4xl font-black">
            Admin Dashboard
          </h1>

          <p className="premium-text mt-2">
            Review and manage event submissions.
          </p>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="premium-card rounded-3xl p-5"
            >
              <p className="text-sm font-bold text-slate-300/75">
                {stat.label}
              </p>
              <p className={`mt-4 text-4xl font-black ${stat.tone}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-white">
            Pending Events
          </h2>

          {pendingEvents.length === 0 ? (
            <div className="premium-empty mt-8 rounded-3xl px-6 py-14 text-center">
              <h3 className="text-2xl font-black text-white">
                No pending events
              </h3>
              <p className="mt-2 text-slate-300/75">
                All submitted events have been reviewed.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pendingEvents.map((event) => (
                <article
                  key={event.id}
                  className="premium-card flex min-w-0 flex-col rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-violet-200">
                        Pending review
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-black text-white">
                        {event.title}
                      </h3>
                    </div>

                    <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-100">
                      Pending
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-4 leading-7 text-slate-300/78">
                    {event.description}
                  </p>

                  <div className="mt-5 grid gap-3 text-sm text-slate-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-cyan-200" aria-hidden="true" />
                      <span className="truncate font-bold">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        className="size-4 text-violet-200"
                        aria-hidden="true"
                      />
                      <span className="font-bold">
                        {new Date(event.event_datetime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-blue-200" aria-hidden="true" />
                      <span className="font-bold">
                        {event.max_participants} max participants
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">
                    <p>
                      Submitted{" "}
                      <span className="font-bold text-slate-200">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-1 break-all">
                      Creator ID:{" "}
                      <span className="font-bold text-slate-200">
                        {event.created_by}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/8 p-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <ClipboardList
                        className="size-4 text-violet-200"
                        aria-hidden="true"
                      />
                      Ready for review
                    </div>

                    <AdminEventReviewDialog event={event} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

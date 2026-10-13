import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, MapPin, Users } from "lucide-react";

import AdminEventManageActions from "@/components/admin/AdminEventManageActions";
import AdminEventReviewDialog from "@/components/admin/AdminEventReviewDialog";
import AdminUserRoleSelect from "@/components/admin/AdminUserRoleSelect";
import CapacityIndicator from "@/components/events/CapacityIndicator";
import { statusBadgeClasses } from "@/components/events/EventCard";
import { createClient } from "@/lib/supabase/server";
import { getAllUsers } from "@/lib/services/server/admin";
import {
  getAdminEventStats,
  getAllEvents,
  getCurrentUserRole,
  getPendingEvents,
  type EventStatus,
} from "@/lib/services/server/events";
import { formatEventDate, formatParticipantCap } from "@/lib/utils";

type AdminPageProps = {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    q?: string;
  }>;
};

const eventStatuses: Array<EventStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

function isEventStatus(value: string | undefined): value is EventStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "completed" ||
    value === "cancelled"
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
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

  const params = await searchParams;
  const tab =
    params.tab === "events" || params.tab === "users" ? params.tab : "review";
  const eventStatus = isEventStatus(params.status) ? params.status : "all";
  const query = params.q?.trim() ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [pendingEvents, stats, allEvents, users] = await Promise.all([
    getPendingEvents(),
    getAdminEventStats(),
    tab === "events"
      ? getAllEvents({ status: eventStatus, search: query })
      : Promise.resolve([]),
    tab === "users" ? getAllUsers(query) : Promise.resolve([]),
  ]);

  const statCards = [
    { label: "Pending", value: stats.pending, tone: "text-amber-100" },
    { label: "Approved", value: stats.approved, tone: "text-emerald-100" },
    { label: "Rejected", value: stats.rejected, tone: "text-red-100" },
    { label: "Users", value: stats.totalUsers, tone: "text-primary" },
    { label: "All events", value: stats.totalEvents, tone: "text-primary" },
  ];

  const tabs = [
    { id: "review", label: "Review", href: "/admin" },
    { id: "events", label: "All events", href: "/admin?tab=events" },
    { id: "users", label: "Users", href: "/admin?tab=users" },
  ];

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="premium-panel rounded-xl p-6">
          <h1 className="premium-title text-4xl font-semibold">
            Admin Dashboard
          </h1>

          <p className="premium-text mt-2">
            Moderate users and manage every event on the platform.
          </p>
        </div>

        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {statCards.map((stat) => (
            <div key={stat.label} className="premium-card rounded-xl p-5">
              <p className="text-sm font-bold text-muted-foreground">
                {stat.label}
              </p>
              <p className={`mt-4 text-4xl font-semibold ${stat.tone}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <nav
          className="mt-8 flex flex-wrap gap-2"
          aria-label="Admin sections"
        >
          {tabs.map((item) => {
            const isActive = tab === item.id || (tab === "review" && item.id === "review");

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`inline-flex h-10 items-center rounded-xl border px-4 text-sm font-bold transition-all ${
                  isActive
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-secondary text-foreground hover:border-primary/30 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {tab === "review" && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-foreground">Pending Events</h2>

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

                    <div className="mt-5 grid gap-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" aria-hidden="true" />
                        <span className="truncate font-bold">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-bold">
                          {formatEventDate(event.event_datetime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-primary" aria-hidden="true" />
                        <span className="font-bold">
                          {formatParticipantCap(event.max_participants)} max
                          participants
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                      <p>
                        Submitted{" "}
                        <span className="font-bold text-foreground">
                          {formatEventDate(event.created_at)}
                        </span>
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary p-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <ClipboardList
                          className="size-4 text-primary"
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
        )}

        {tab === "events" && (
          <section className="mt-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">All events</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Approve, cancel, complete, or remove any event.
                </p>
              </div>

              <form className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                <input type="hidden" name="tab" value="events" />
                <select
                  name="status"
                  defaultValue={eventStatus}
                  className="h-11 rounded-xl border border-border bg-carbon px-3 text-sm font-bold capitalize text-foreground outline-none focus:border-primary/40"
                >
                  {eventStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search events"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-secondary px-4 text-sm font-bold text-foreground hover:border-primary/40 hover:text-primary"
                >
                  Filter
                </button>
              </form>
            </div>

            {allEvents.length === 0 ? (
              <div className="premium-empty mt-8 rounded-xl px-6 py-14 text-center">
                <h3 className="text-2xl font-semibold text-foreground">
                  No events found
                </h3>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {allEvents.map((event) => (
                  <article
                    key={event.id}
                    className="premium-card flex min-w-0 flex-col rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/events/${event.id}`}
                          className="line-clamp-2 text-xl font-semibold text-foreground hover:text-primary"
                        >
                          {event.title}
                        </Link>
                        <p className="mt-2 truncate text-sm text-muted-foreground">
                          {event.venue} Ã‚Â· {formatEventDate(event.event_datetime)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusBadgeClasses[event.status]}`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {event.description}
                    </p>

                    <div className="mt-5 border-t border-border pt-4">
                      <CapacityIndicator event={event} />
                      <Link
                        href={`/events/${event.id}/attendees`}
                        className="inline-flex min-h-11 items-center text-sm text-primary"
                      >
                        View Attendees &rarr;
                      </Link>
                      <AdminEventManageActions
                        eventId={event.id}
                        status={event.status}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "users" && (
          <section className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Users</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change a member&apos;s role. The last admin cannot be demoted.
                </p>
              </div>

              <form className="flex w-full gap-2 sm:max-w-md">
                <input type="hidden" name="tab" value="users" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-secondary px-4 text-sm font-bold text-foreground hover:border-primary/40 hover:text-primary"
                >
                  Search
                </button>
              </form>
            </div>

            {users.length === 0 ? (
              <div className="premium-empty mt-8 rounded-xl px-6 py-14 text-center">
                <h3 className="text-2xl font-semibold text-foreground">
                  No users found
                </h3>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {users.map((member) => (
                  <article
                    key={member.id}
                    className="premium-card rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-foreground">
                          {member.full_name || "Unnamed member"}
                        </h3>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {member.id}
                        </p>
                      </div>
                      {user?.id === member.id && (
                        <span className="rounded-full border border-primary/30 bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-primary">
                          You
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Joined {formatEventDate(member.created_at)}
                    </p>

                    <div className="mt-4">
                      <AdminUserRoleSelect
                        userId={member.id}
                        role={member.role}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

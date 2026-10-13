import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/services/server/events";
import { getEventAttendees } from "@/lib/services/server/registrations";
import CapacityIndicator from "@/components/events/CapacityIndicator";
export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/login?redirectTo=${encodeURIComponent(`/events/${id}/attendees`)}`,
    );
  const event = await getEventById(id);
  if (!event || !event.registration?.can_manage) notFound();
  const requestedPage = Number((await searchParams).page || 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 100000)
      : 1;
  const rows = await getEventAttendees(id, page);
  const attendees = rows.slice(0, 50);
  const hasNext = rows.length > 50;
  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <Link
          href={`/events/${id}`}
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
        >
          &larr; Back to event
        </Link>
        <div className="mt-6">
          <p className="eyebrow">Attendee management</p>
        </div>
        <h1 className="premium-title mt-4 break-words text-4xl font-semibold">
          {event.title}
        </h1>
        <p className="premium-text mt-4">
          {new Date(event.event_datetime).toLocaleString()} &middot;{" "}
          {event.venue}
        </p>
        <p className="mt-3 text-sm capitalize text-muted-foreground">
          {event.status} &middot; Organizer:{" "}
          {event.organizer_name || "Unknown Organizer"}
        </p>
        <div className="premium-panel my-8 max-w-xl rounded-xl p-6">
          <p className="eyebrow mb-4">Live registration count</p>
          <CapacityIndicator event={event} />
          <p className="mt-3 text-xs text-muted-foreground">
            Cancelled registrations are retained below and do not occupy a spot.
          </p>
        </div>
        <h2 className="text-2xl font-semibold">
          Attendees &amp; registration history
        </h2>
        <p className="mt-3 text-xs text-muted-foreground sm:hidden">
          Swipe the table to see all registration details.
        </p>
        {!attendees.length ? (
          <p className="premium-empty mt-6 rounded-xl p-8">
            No registrations yet. Attendees will appear here when they register.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">
                Attendee names, registration dates and registration status
              </caption>
              <thead className="bg-carbon text-muted-foreground">
                <tr>
                  <th scope="col" className="p-4 font-medium">
                    Attendee
                  </th>
                  <th scope="col" className="p-4 font-medium">
                    Registered
                  </th>
                  <th scope="col" className="p-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee) => (
                  <tr key={attendee.id} className="border-t border-border">
                    <td className="max-w-64 break-words p-4 font-medium">
                      {attendee.full_name?.trim() || "Unknown Attendee"}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(attendee.registered_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`status-badge ${attendee.status === "registered" ? "border-success/25 bg-success/10 text-success" : "border-border bg-secondary text-muted-foreground"}`}
                      >
                        {attendee.status}
                      </span>
                      {attendee.cancelled_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Cancelled{" "}
                          {new Date(attendee.cancelled_at).toLocaleString()}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <nav
          aria-label="Attendee pages"
          className="mt-6 flex items-center gap-6 text-sm"
        >
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="inline-flex min-h-11 items-center text-primary"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground">Page {page}</span>
          {hasNext && (
            <Link
              href={`?page=${page + 1}`}
              className="inline-flex min-h-11 items-center text-primary"
            >
              Next
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}

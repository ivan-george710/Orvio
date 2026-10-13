import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/services/server/events";
import type { RegistrationSummary } from "@/lib/registrations";
import { registrationError } from "@/lib/registrations";

export type RegistrationStatus = "registered" | "cancelled";
export type RegistrationWithEvent = {
  id: string;
  event_id: string;
  status: RegistrationStatus;
  registered_at: string;
  cancelled_at: string | null;
  event: Event;
};
export type Attendee = {
  id: string;
  full_name: string;
  registered_at: string;
  status: RegistrationStatus;
  cancelled_at: string | null;
};
export class RegistrationError extends Error {}
function validateId(id: string) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new RegistrationError(registrationError("INVALID_EVENT"));
}
async function mutate(
  eventId: string,
  operation: "register_for_event" | "cancel_registration",
) {
  validateId(eventId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new RegistrationError(registrationError("AUTH_REQUIRED"));
  // Identity comes from the authenticated database session, never a browser argument.
  const { error } = await supabase.rpc(operation, { p_event_id: eventId });
  if (error) throw new RegistrationError(registrationError(error.message));
}
export async function registerForEvent(eventId: string) {
  await mutate(eventId, "register_for_event");
}
export async function cancelRegistration(eventId: string) {
  await mutate(eventId, "cancel_registration");
}

export async function getRegistrationSummaries(
  ids: string[],
): Promise<Record<string, RegistrationSummary>> {
  if (!ids.length) return {};
  const supabase = await createClient();
  const uniqueIds = [...new Set(ids)];
  const summaries: Record<string, RegistrationSummary> = {};
  for (let offset = 0; offset < uniqueIds.length; offset += 200) {
    const { data, error } = await supabase.rpc("registration_summaries", {
      p_event_ids: uniqueIds.slice(offset, offset + 200),
    });
    if (error)
      throw new Error(
        "Registration availability could not be loaded. Please try again.",
      );
    for (const row of data as RegistrationSummary[])
      summaries[row.event_id] = { ...row, checked_at: Date.now() };
  }
  return summaries;
}
export async function getMyRegistrations(): Promise<RegistrationWithEvent[]> {
  const supabase = await createClient();
  const rows: RegistrationWithEvent[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .rpc("get_my_registrations")
      .range(offset, offset + 499);
    if (error) throw new RegistrationError(registrationError(error.message));
    rows.push(...(data as RegistrationWithEvent[]));
    if (data.length < 500) break;
  }
  const summaries = await getRegistrationSummaries(
    rows.map((row) => row.event_id),
  );
  return rows.map((row) => ({
    ...row,
    event: { ...row.event, registration: summaries[row.event_id] },
  }));
}
export async function getEventAttendees(
  eventId: string,
  page = 1,
): Promise<Attendee[]> {
  validateId(eventId);
  const supabase = await createClient();
  const offset = (Math.max(1, Math.floor(page)) - 1) * 50;
  const { data, error } = await supabase
    .rpc("get_event_attendees", { p_event_id: eventId })
    .range(offset, offset + 50);
  if (error) throw new RegistrationError(registrationError(error.message));
  return data as Attendee[];
}

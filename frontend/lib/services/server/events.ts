import { getRegistrationSummaries } from "@/lib/services/server/registrations";
import type { RegistrationSummary } from "@/lib/registrations";
import { createClient } from "@/lib/supabase/server";
import type { CreateEventInput } from "@/lib/validations/event";

export type EventStatus =
  "pending" | "approved" | "rejected" | "completed" | "cancelled";

export type Event = {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_datetime: string;
  max_participants: number;
  status: EventStatus;
  created_by: string;
  created_at: string;
  organizer_name?: string;
  registration?: RegistrationSummary;
};

export type UserRole = "participant" | "organizer" | "admin";

export type AdminEventStats = {
  pending: number;
  approved: number;
  rejected: number;
};

const eventColumns =
  "id,title,description,venue,event_datetime,max_participants,status,created_by,created_at";

const pendingEventColumns = `${eventColumns},creator:profiles(full_name)`;

type PendingEventRow = Event & {
  creator: {
    full_name: string | null;
  } | null;
};

function getOrganizerDisplayName(name: string | null | undefined) {
  return name?.trim() || "Unknown Organizer";
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  return { supabase, user };
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: UserRole }>();

  if (error) {
    throw error;
  }

  return data?.role ?? null;
}

async function ensureAdmin() {
  const role = await getCurrentUserRole();

  if (role !== "admin") {
    throw new Error("Not authorized.");
  }
}

export async function getMyEvents(): Promise<Event[]> {
  const { supabase, user } = await getAuthenticatedUser();

  const events: Event[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("events")
      .select(eventColumns)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499)
      .returns<Event[]>();
    if (error) throw error;
    events.push(...data);
    if (data.length < 500) break;
  }
  return withRegistrationSummaries(events);
}

export async function getApprovedEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const events: Event[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("events")
      .select(eventColumns)
      .eq("status", "approved")
      .order("event_datetime", { ascending: true })
      .order("id")
      .range(offset, offset + 499)
      .returns<Event[]>();
    if (error) throw error;
    events.push(...data);
    if (data.length < 500) break;
  }
  return withRegistrationSummaries(events);
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(eventColumns)
    .eq("id", id)
    .maybeSingle<Event>();

  if (error) {
    throw error;
  }

  return data ? (await withRegistrationSummaries([data]))[0] : null;
}

export async function getEditableEventById(id: string): Promise<Event | null> {
  const { user } = await getAuthenticatedUser();
  const event = await getEventById(id);

  if (!event || event.created_by !== user.id || event.status !== "pending") {
    return null;
  }

  return event;
}

export async function getPendingEvents(): Promise<Event[]> {
  await ensureAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(pendingEventColumns)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<PendingEventRow[]>();

  if (error) {
    throw error;
  }

  return data.map(({ creator, ...event }) => ({
    ...event,
    organizer_name: getOrganizerDisplayName(creator?.full_name),
  }));
}

export async function getAdminEventStats(): Promise<AdminEventStats> {
  await ensureAdmin();

  const supabase = await createClient();

  async function countByStatus(status: EventStatus) {
    const { count, error } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  const [pending, approved, rejected] = await Promise.all([
    countByStatus("pending"),
    countByStatus("approved"),
    countByStatus("rejected"),
  ]);

  return {
    pending,
    approved,
    rejected,
  };
}

export async function updateEvent(
  id: string,
  data: CreateEventInput,
): Promise<Event> {
  const { supabase, user } = await getAuthenticatedUser();
  const event = await getEventById(id);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.created_by !== user.id) {
    throw new Error("Only the creator can edit this event.");
  }

  if (event.status !== "pending") {
    throw new Error("Only pending events can be edited.");
  }

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update(data)
    .eq("id", id)
    .select(eventColumns)
    .single<Event>();

  if (error) {
    throw error;
  }

  return updatedEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser();
  const event = await getEventById(id);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.created_by !== user.id) {
    throw new Error("Only the creator can delete this event.");
  }

  if (event.status !== "pending") {
    throw new Error("Only pending events can be deleted.");
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function approveEvent(id: string): Promise<Event> {
  await ensureAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .update({ status: "approved" satisfies EventStatus })
    .eq("id", id)
    .select(eventColumns)
    .single<Event>();

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectEvent(id: string): Promise<Event> {
  await ensureAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .update({ status: "rejected" satisfies EventStatus })
    .eq("id", id)
    .select(eventColumns)
    .single<Event>();

  if (error) {
    throw error;
  }

  return data;
}

async function withRegistrationSummaries(events: Event[]): Promise<Event[]> {
  const summaries = await getRegistrationSummaries(
    events.map((event) => event.id),
  );
  return events.map((event) => ({
    ...event,
    registration: summaries[event.id],
    organizer_name: summaries[event.id]?.organizer_name || event.organizer_name,
  }));
}
export async function getAdminEvents(): Promise<Event[]> {
  await ensureAdmin();
  const supabase = await createClient();
  const rows: PendingEventRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("events")
      .select(pendingEventColumns)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499)
      .returns<PendingEventRow[]>();
    if (error)
      throw new Error(
        "Event registrations could not be loaded. Please try again.",
      );
    rows.push(...data);
    if (data.length < 500) break;
  }
  return withRegistrationSummaries(
    rows.map(({ creator, ...event }) => ({
      ...event,
      organizer_name: getOrganizerDisplayName(creator?.full_name),
    })),
  );
}

import { getRegistrationSummaries } from "@/lib/services/server/registrations";
import type { RegistrationSummary } from "@/lib/registrations";
import { createClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/supabase/errors";
import type { CreateEventInput } from "@/lib/validations/event";
import { eventDetailsSchema, ownedBannerUrl, type EventCategory, type EventDetailsInput } from "@/lib/event-metadata";

export type EventStatus =
  "pending" | "approved" | "rejected" | "completed" | "cancelled";

export type Event = {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_datetime: string | null;
  max_participants: number | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
  organizer_name?: string;
  registration?: RegistrationSummary;
  category?: EventCategory;
  banner_url?: string | null;
};

export type UserRole = "participant" | "organizer" | "admin";

export type AdminEventStats = {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
  totalEvents: number;
  totalUsers: number;
};

const eventColumns =
  "id,title,description,venue,event_datetime,max_participants,status,created_by,created_at,category,banner_url";

const pendingEventColumns = `${eventColumns},creator:profiles(full_name)`;

export class EventMutationError extends Error {}

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
    data: { user }, error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new EventMutationError("Not authenticated.");
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
    throwSupabaseError(error, "Failed to load user role.");
  }

  return data?.role ?? null;
}

export async function ensureAdmin() {
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

export async function getApprovedEvents(options?: {
  search?: string;
}): Promise<Event[]> {
  const supabase = await createClient();

  const term = options?.search?.replace(/[,()%_\\]/g, " ").trim();
  const events: Event[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = supabase
      .from("events")
      .select(eventColumns)
      .eq("status", "approved");
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,venue.ilike.%${term}%`,
      );
    }
    const { data, error } = await query
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

export async function getEventDiscovery(options?: { search?: string }) {
  const events = await getApprovedEvents(options);
  return { events, checked_at: Date.now() };
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(eventColumns)
    .eq("id", id)
    .maybeSingle<Event>();

  if (error) {
    throwSupabaseError(error, "Failed to load event.");
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
    throwSupabaseError(error, "Failed to load pending events.");
  }

  return data.map(({ creator, ...event }) => ({
    ...event,
    organizer_name: getOrganizerDisplayName(creator?.full_name),
  }));
}

export async function getAdminEventStats(): Promise<AdminEventStats> {
  await ensureAdmin();

  const supabase = await createClient();

  async function countEvents(status?: EventStatus) {
    let query = supabase.from("events").select("id", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;

    if (error) {
      throwSupabaseError(error, "Failed to count events.");
    }

    return count ?? 0;
  }

  const [
    pending,
    approved,
    rejected,
    cancelled,
    completed,
    totalEvents,
    usersResult,
  ] = await Promise.all([
    countEvents("pending"),
    countEvents("approved"),
    countEvents("rejected"),
    countEvents("cancelled"),
    countEvents("completed"),
    countEvents(),
    supabase.from("profiles").select("id", { count: "exact" }),
  ]);

  if (usersResult.error) {
    throwSupabaseError(usersResult.error, "Failed to count users.");
  }

  return {
    pending,
    approved,
    rejected,
    cancelled,
    completed,
    totalEvents,
    totalUsers: usersResult.count ?? 0,
  };
}

export async function getAllEvents(options?: {
  status?: EventStatus | "all";
  search?: string;
}): Promise<Event[]> {
  await ensureAdmin();

  const supabase = await createClient();
  let query = supabase.from("events").select(eventColumns);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const term = options?.search?.replace(/[,()%_\\]/g, " ").trim();

  if (term) {
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,venue.ilike.%${term}%`
    );
  }

  const events: Event[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499)
      .returns<Event[]>();
    if (error) {
      throwSupabaseError(error, "Failed to load events.");
    }
    events.push(...data);
    if (data.length < 500) break;
  }
  return withRegistrationSummaries(events);
}

export async function adminSetEventStatus(
  id: string,
  status: EventStatus
): Promise<Event> {
  await ensureAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", id)
    .select(eventColumns)
    .single<Event>();

  if (error) {
    throwSupabaseError(error, "Failed to update event status.");
  }

  return data;
}

export async function adminDeleteEvent(id: string): Promise<void> {
  await ensureAdmin();

  const supabase = await createClient();

  // The event foreign key cascades registrations; direct registration writes are denied.
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throwSupabaseError(error, "Failed to delete event.");
  }
}

export async function updateEvent(
  id: string,
  data: CreateEventInput | EventDetailsInput,
): Promise<Event> {
  const { supabase, user } = await getAuthenticatedUser();
  const event = await getEventById(id);

  if (!event) {
    throw new EventMutationError("Event not found.");
  }

  if (event.created_by !== user.id) {
    throw new EventMutationError("Only the creator can edit this event.");
  }

  if (event.status !== "pending") {
    throw new EventMutationError("Only pending events can be edited.");
  }

  const validated = validateEventDetails(data, user.id);

  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update(validated)
    .eq("id", id)
    .select(eventColumns)
    .single<Event>();

  if (error) {
    throw new EventMutationError("Your event could not be updated. Please try again.");
  }

  return updatedEvent;
}

function validateEventDetails(input: unknown, userId: string): EventDetailsInput {
  const result = eventDetailsSchema.safeParse(input);
  if (!result.success) throw new EventMutationError(result.error.issues[0]?.message || "Check your event details.");
  let bannerUrl;
  try {
    bannerUrl = ownedBannerUrl(result.data.banner_url, userId, process.env.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    throw new EventMutationError("Choose a banner uploaded by your account.");
  }
  return {
    ...result.data,
    banner_url: bannerUrl,
  };
}

export async function createOwnedEvent(input: unknown): Promise<Event> {
  const { supabase, user } = await getAuthenticatedUser();
  const details = validateEventDetails(input, user.id);
  const { data, error } = await supabase.from("events")
    .insert({ ...details, created_by: user.id, status: "pending" })
    .select(eventColumns)
    .single<Event>();
  if (error || !data) throw new EventMutationError("Your event could not be created. Please try again.");
  return data;
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
    throwSupabaseError(error, "Failed to delete event.");
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
    throwSupabaseError(error, "Failed to approve event.");
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
    throwSupabaseError(error, "Failed to reject event.");
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

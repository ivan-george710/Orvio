import { createClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/supabase/errors";
import type { CreateEventInput } from "@/lib/validations/event";

export type EventStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

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
  "id,title,description,venue,event_datetime,max_participants,status,created_by,created_at";

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

  const { data, error } = await supabase
    .from("events")
    .select(eventColumns)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .returns<Event[]>();

  if (error) {
    throwSupabaseError(error, "Failed to load your events.");
  }

  return data;
}

export async function getApprovedEvents(options?: {
  search?: string;
}): Promise<Event[]> {
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(eventColumns)
    .eq("status", "approved");

  const search = options?.search?.trim();

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error } = await query
    .order("event_datetime", { ascending: true })
    .returns<Event[]>();

  if (error) {
    throwSupabaseError(error, "Failed to load events.");
  }

  return data;
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

  return data;
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
    .select(eventColumns)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<Event[]>();

  if (error) {
    throwSupabaseError(error, "Failed to load pending events.");
  }

  return data;
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

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .returns<Event[]>();

  if (error) {
    throwSupabaseError(error, "Failed to load events.");
  }

  return data;
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

  const { error: registrationError } = await supabase
    .from("registrations")
    .delete()
    .eq("event_id", id);

  if (registrationError) {
    throwSupabaseError(
      registrationError,
      "Failed to remove registrations for this event."
    );
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throwSupabaseError(error, "Failed to delete event.");
  }
}

export async function updateEvent(
  id: string,
  data: CreateEventInput
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
    throwSupabaseError(error, "Failed to update event.");
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
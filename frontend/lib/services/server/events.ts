import { createClient } from "@/lib/supabase/server";
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
  event_datetime: string;
  max_participants: number;
  status: EventStatus;
  created_by: string;
  created_at: string;
};

export type UserRole = "participant" | "organizer" | "admin";

export type AdminEventStats = {
  pending: number;
  approved: number;
  rejected: number;
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

  const { data, error } = await supabase
    .from("events")
    .select(eventColumns)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .returns<Event[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getApprovedEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(eventColumns)
    .eq("status", "approved")
    .order("event_datetime", { ascending: true })
    .returns<Event[]>();

  if (error) {
    throw error;
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
    throw error;
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
    throw error;
  }

  return data;
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

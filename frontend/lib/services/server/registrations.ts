import { createClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/supabase/errors";
import { getEventById, type Event } from "@/lib/services/server/events";

export type RegistrationWithEvent = {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  event: Event | null;
};

export type EventParticipant = {
  id: string;
  user_id: string;
  registered_at: string;
  full_name: string;
};

const registrationEventColumns =
  "id,event_id,user_id,registered_at,event:events(id,title,description,venue,event_datetime,max_participants,status,created_by,created_at)";

type ProfileEmbed = { full_name: string | null } | { full_name: string | null }[] | null;

type ParticipantRow = {
  id: string;
  user_id: string;
  registered_at: string;
  profiles: ProfileEmbed;
};

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

function profileName(profiles: ProfileEmbed) {
  const row = Array.isArray(profiles) ? profiles[0] : profiles;
  return row?.full_name?.trim() || "Orvio member";
}

export async function getEventRegistrationCount(
  eventId: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("event_registration_count", {
    p_event_id: eventId,
  });

  if (!error) {
    return typeof data === "number" ? data : 0;
  }

  const missingFn =
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.message.toLowerCase().includes("could not find the function");

  if (!missingFn) {
    throwSupabaseError(error, "Failed to count registrations.");
  }

  const { count, error: countError } = await supabase
    .from("registrations")
    .select("id", { count: "exact" })
    .eq("event_id", eventId);

  if (countError) {
    throwSupabaseError(countError, "Failed to count registrations.");
  }

  return count ?? 0;
}

export async function getMyRegistrationForEvent(eventId: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("registrations")
    .select("id,event_id,user_id,registered_at")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      event_id: string;
      user_id: string;
      registered_at: string;
    }>();

  if (error) {
    throwSupabaseError(error, "Failed to load registration.");
  }

  return data;
}

export async function getEventParticipants(
  eventId: string
): Promise<EventParticipant[]> {
  const { supabase, user } = await getAuthenticatedUser();
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.created_by !== user.id) {
    throw new Error("Only the event creator can view participants.");
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("id,user_id,registered_at,profiles(full_name)")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true })
    .returns<ParticipantRow[]>();

  if (!error) {
    return (data ?? []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      registered_at: row.registered_at,
      full_name: profileName(row.profiles),
    }));
  }

  const { data: rows, error: fallbackError } = await supabase
    .from("registrations")
    .select("id,user_id,registered_at")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true })
    .returns<Omit<ParticipantRow, "profiles">[]>();

  if (fallbackError) {
    throwSupabaseError(fallbackError, "Failed to load participants.");
  }

  return (rows ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    registered_at: row.registered_at,
    full_name: "Orvio member",
  }));
}

export async function registerForEvent(eventId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser();
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.status !== "approved") {
    throw new Error("You can only register for approved events.");
  }

  if (event.created_by === user.id) {
    throw new Error("You cannot register for an event you created.");
  }

  const { data: existingRegistration, error: existingRegistrationError } =
    await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();

  if (existingRegistrationError) {
    throwSupabaseError(
      existingRegistrationError,
      "Failed to check existing registration."
    );
  }

  if (existingRegistration) {
    throw new Error("You are already registered for this event.");
  }

  if (event.max_participants != null) {
    const activeRegistrationCount = await getEventRegistrationCount(eventId);

    if (activeRegistrationCount >= event.max_participants) {
      throw new Error("This event has reached its maximum capacity.");
    }
  }

  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You are already registered for this event.");
    }

    throwSupabaseError(error, "Failed to register for event.");
  }
}

export async function cancelRegistration(eventId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throwSupabaseError(error, "Failed to cancel registration.");
  }

  if (!data) {
    throw new Error("You are not registered for this event.");
  }
}

export async function getMyRegistrations(): Promise<RegistrationWithEvent[]> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("registrations")
    .select(registrationEventColumns)
    .eq("user_id", user.id)
    .order("registered_at", { ascending: false })
    .returns<RegistrationWithEvent[]>();

  if (error) {
    throwSupabaseError(error, "Failed to load registrations.");
  }

  return data;
}
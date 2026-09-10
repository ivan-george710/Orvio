import { createClient } from "@/lib/supabase/server";
import { getEventById, type Event } from "@/lib/services/server/events";

export type RegistrationWithEvent = {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  event: Event | null;
};

const registrationEventColumns =
  "id,event_id,user_id,registered_at,event:events(id,title,description,venue,event_datetime,max_participants,status,created_by,created_at)";

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

export async function getEventRegistrationCount(
  eventId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("registrations")
    .select("id", { count: "exact" })
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message || "Failed to count registrations.");
  }

  return count ?? 0;
}

export async function registerForEvent(eventId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser();

  const event = await getEventById(eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  const { data: existingRegistration, error: existingRegistrationError } =
    await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();

  if (existingRegistrationError) {
    throw new Error(existingRegistrationError.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  return data;
}
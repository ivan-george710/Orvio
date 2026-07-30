import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/services/server/events";

export type RegistrationStatus = "pending" | "approved" | "rejected" | "cancelled";

export type RegistrationWithEvent = {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  registered_at: string;
  event: Event | null;
};

const registrationEventColumns =
  "id,event_id,user_id,status,registered_at,event:events(id,title,description,venue,event_datetime,max_participants,status,created_by,created_at)";

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

export async function registerForEvent(eventId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: existingRegistration, error: existingRegistrationError } =
    await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();

  if (existingRegistrationError) {
    throw existingRegistrationError;
  }

  if (existingRegistration) {
    throw new Error("You are already registered for this event.");
  }

  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    user_id: user.id,
    status: "pending" satisfies RegistrationStatus,
  });

  if (error) {
    throw error;
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
    throw error;
  }

  return data;
}

import { createClient } from "@/lib/supabase/client";
import { CreateEventInput } from "@/lib/validations/event";

export async function createEvent(data: CreateEventInput) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { error } = await supabase
    .from("events")
    .insert({
      ...data,
      created_by: user.id,
      status: "pending",
    });

  if (error) {
    throw error;
  }
}
import { createEventAction } from "@/lib/actions/events";
import type { CreateEventInput } from "@/lib/validations/event";
import type { EventDetailsInput } from "@/lib/event-metadata";

export async function createEvent(data: CreateEventInput | EventDetailsInput) {
  const result = await createEventAction(data);
  if (!result.ok) throw new Error(result.message);
  return { id: result.id };
}

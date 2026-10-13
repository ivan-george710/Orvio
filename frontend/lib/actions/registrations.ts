"use server";
import { revalidatePath } from "next/cache";
import {
  registerForEvent,
  cancelRegistration,
  RegistrationError,
  getRegistrationSummaries,
} from "@/lib/services/server/registrations";

async function changeRegistration(
  eventId: string,
  operation: "register" | "cancel",
) {
  try {
    if (operation === "register") await registerForEvent(eventId);
    else await cancelRegistration(eventId);
    for (const path of [
      "/events",
      `/events/${eventId}`,
      `/events/${eventId}/attendees`,
      "/dashboard",
      "/registrations",
      "/admin",
    ])
      revalidatePath(path);
    // Return an authoritative snapshot so the interaction does not depend on a
    // second, potentially overlapping router refresh to show committed state.
    const summaries = await getRegistrationSummaries([eventId]);
    return { ok: true as const, summary: summaries[eventId] };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof RegistrationError
          ? error.message
          : "We could not complete your request. Please try again.",
    };
  }
}
export async function registerForEventAction(eventId: string) {
  return changeRegistration(eventId, "register");
}
export async function cancelRegistrationAction(eventId: string) {
  return changeRegistration(eventId, "cancel");
}

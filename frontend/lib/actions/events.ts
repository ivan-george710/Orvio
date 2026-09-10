"use server";

import { revalidatePath } from "next/cache";

import {
  approveEvent,
  deleteEvent,
  rejectEvent,
  updateEvent,
} from "@/lib/services/server/events";
import {
  cancelRegistration,
  registerForEvent,
} from "@/lib/services/server/registrations";
import type { CreateEventInput } from "@/lib/validations/event";

type ActionResult = { ok: true } | { ok: false; message: string };

function fail(error: unknown, fallback: string): ActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : fallback,
  };
}

export async function registerForEventAction(
  eventId: string
): Promise<ActionResult> {
  try {
    await registerForEvent(eventId);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/registrations");
    return { ok: true };
  } catch (error) {
    return fail(error, "Failed to register for event.");
  }
}

export async function cancelRegistrationAction(
  eventId: string
): Promise<ActionResult> {
  try {
    await cancelRegistration(eventId);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/registrations");
    return { ok: true };
  } catch (error) {
    return fail(error, "Failed to cancel registration.");
  }
}

export async function updateEventAction(id: string, data: CreateEventInput) {
  await updateEvent(id, data);

  revalidatePath("/dashboard");
  revalidatePath(`/events/${id}`);
  revalidatePath(`/events/${id}/edit`);
}

export async function deleteEventAction(id: string) {
  await deleteEvent(id);

  revalidatePath("/dashboard");
  revalidatePath("/events");
}

export async function approveEventAction(id: string) {
  await approveEvent(id);

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

export async function rejectEventAction(id: string) {
  await rejectEvent(id);

  revalidatePath("/admin");
  revalidatePath(`/events/${id}`);
}
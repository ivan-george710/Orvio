"use server";

import { revalidatePath } from "next/cache";

import {
  approveEvent,
  deleteEvent,
  rejectEvent,
  updateEvent,
  createOwnedEvent,
  EventMutationError,
} from "@/lib/services/server/events";

import {
  cancelRegistration,
  registerForEvent,
} from "@/lib/services/server/registrations";
import type { CreateEventInput } from "@/lib/validations/event";
import type { EventDetailsInput } from "@/lib/event-metadata";

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

export async function createEventAction(input: unknown) {
  try {
    const event = await createOwnedEvent(input);
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true as const, id: event.id };
  } catch (error) {
    return { ok: false as const, message: error instanceof EventMutationError ? error.message : "Your event could not be created. Please try again." };
  }
}

export async function updateEventAction(id: string, data: CreateEventInput | EventDetailsInput) {
  try {
    await updateEvent(id, data);
    revalidatePath("/dashboard");
    revalidatePath(`/events/${id}`);
    revalidatePath(`/events/${id}/edit`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: error instanceof EventMutationError ? error.message : "Your event could not be updated. Please try again." };
  }
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

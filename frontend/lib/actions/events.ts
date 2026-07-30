"use server";

import { revalidatePath } from "next/cache";

import {
  approveEvent,
  deleteEvent,
  rejectEvent,
  updateEvent,
} from "@/lib/services/server/events";
import { registerForEvent } from "@/lib/services/server/registrations";
import type { CreateEventInput } from "@/lib/validations/event";

export async function registerForEventAction(eventId: string) {
  await registerForEvent(eventId);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/registrations");
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

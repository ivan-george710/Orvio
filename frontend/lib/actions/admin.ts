"use server";

import { revalidatePath } from "next/cache";

import {
  adminDeleteEvent,
  adminSetEventStatus,
  type EventStatus,
  type UserRole,
} from "@/lib/services/server/events";
import { updateUserRole } from "@/lib/services/server/admin";

type ActionResult = { ok: true } | { ok: false; message: string };

function fail(error: unknown, fallback: string): ActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : fallback,
  };
}

function revalidateAdmin(eventId?: string) {
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/dashboard");

  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
}

export async function setEventStatusAction(
  eventId: string,
  status: EventStatus
): Promise<ActionResult> {
  try {
    await adminSetEventStatus(eventId, status);
    revalidateAdmin(eventId);
    return { ok: true };
  } catch (error) {
    return fail(error, "Failed to update event status.");
  }
}

export async function adminDeleteEventAction(
  eventId: string
): Promise<ActionResult> {
  try {
    await adminDeleteEvent(eventId);
    revalidateAdmin(eventId);
    return { ok: true };
  } catch (error) {
    return fail(error, "Failed to delete event.");
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  try {
    await updateUserRole(userId, role);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return fail(error, "Failed to update user role.");
  }
}
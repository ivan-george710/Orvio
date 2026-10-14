"use server";

import { revalidatePath } from "next/cache";
import { ProfileError, updateCurrentProfile } from "@/lib/services/server/profile";

export async function updateProfileAction(input: unknown) {
  try {
    const profile = await updateCurrentProfile(input);
    for (const path of ["/profile", "/dashboard", "/events", "/admin", "/registrations"]) {
      revalidatePath(path);
    }
    return { ok: true as const, fullName: profile.full_name ?? "" };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof ProfileError
        ? error.message
        : "Your changes could not be saved. Please try again.",
      needsLogin: error instanceof ProfileError && error.code === "auth",
    };
  }
}

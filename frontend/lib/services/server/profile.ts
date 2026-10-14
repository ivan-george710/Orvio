import "server-only";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/profile";

export type Profile = {
  id: string;
  full_name: string | null;
  role: "participant" | "organizer" | "admin";
  created_at: string;
  updated_at: string;
};

export class ProfileError extends Error {
  constructor(
    message: string,
    public readonly code: "auth" | "validation" | "unavailable" | "missing",
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

const columns = "id,full_name,role,created_at,updated_at";

async function authenticatedClient() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    throw new ProfileError("Please log in to manage your profile.", "auth");
  }
  return { client, user };
}

export async function getCurrentProfile(): Promise<Profile & { email: string }> {
  const { client, user } = await authenticatedClient();
  const { data, error } = await client.from("profiles")
    .select(columns)
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (error) {
    throw new ProfileError("Your profile could not be loaded. Please try again.", "unavailable");
  }
  if (!data) {
    throw new ProfileError("Your profile is unavailable. Please contact the event administrator.", "missing");
  }
  return { ...data, email: user.email ?? "" };
}

export async function updateCurrentProfile(input: unknown): Promise<Profile> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ProfileError(parsed.error.issues[0]?.message || "Check your profile details.", "validation");
  }
  const { client, user } = await authenticatedClient();
  // Ownership comes from the verified session. The form cannot choose a user
  // identity, change a role, or submit arbitrary profile columns.
  const { data, error } = await client.from("profiles")
    .update({ full_name: parsed.data.full_name, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select(columns)
    .maybeSingle<Profile>();
  if (error) {
    throw new ProfileError("Your changes could not be saved. Please try again.", "unavailable");
  }
  if (!data) {
    throw new ProfileError("Your profile was not updated. Refresh the page and try again.", "missing");
  }
  return data;
}

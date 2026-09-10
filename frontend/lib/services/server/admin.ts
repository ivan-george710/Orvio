import { createClient } from "@/lib/supabase/server";
import { throwSupabaseError } from "@/lib/supabase/errors";
import {
  ensureAdmin,
  type UserRole,
} from "@/lib/services/server/events";

export type AdminUser = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

const profileColumns = "id,full_name,role,created_at";

export async function getAllUsers(search?: string): Promise<AdminUser[]> {
  await ensureAdmin();

  const supabase = await createClient();
  let query = supabase.from("profiles").select(profileColumns);

  const term = search?.replace(/[,()%_\\]/g, " ").trim();

  if (term) {
    query = query.ilike("full_name", `%${term}%`);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .returns<AdminUser[]>();

  if (error) {
    throwSupabaseError(error, "Failed to load users.");
  }

  return data;
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  await ensureAdmin();

  if (userId === user.id && role !== "admin") {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "admin");

    if (error) {
      throwSupabaseError(error, "Failed to check admin accounts.");
    }

    if ((count ?? 0) <= 1) {
      throw new Error("You cannot remove the last admin.");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throwSupabaseError(error, "Failed to update user role.");
  }
}
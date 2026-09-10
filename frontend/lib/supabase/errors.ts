type SupabaseLikeError = {
  message?: string;
  code?: string;
} | null | undefined;

export function throwSupabaseError(
  error: SupabaseLikeError,
  fallback: string
): never {
  const message = error?.message?.trim();
  throw new Error(message || fallback);
}
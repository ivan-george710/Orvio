export function localEventDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const two = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

export function eventDateTimeForStorage(value: string, previous?: string | null): string {
  // Editing another field must preserve the original instant, including repeated
  // local times during a daylight-saving transition.
  if (previous && localEventDateTime(previous) === value) return new Date(previous).toISOString();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Choose a valid event date and time.");
  return date.toISOString();
}

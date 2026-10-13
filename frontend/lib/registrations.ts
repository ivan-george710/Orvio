export type RegistrationSummary = {
  event_id: string;
  checked_at: number;
  active_count: number;
  remaining_spots: number;
  is_registered: boolean;
  can_manage: boolean;
  organizer_name: string;
};

const messages: Record<string, string> = {
  AUTH_REQUIRED: "Please log in to register for an event.",
  EVENT_NOT_FOUND: "This event is no longer available.",
  EVENT_NOT_APPROVED: "This event is not accepting registrations.",
  EVENT_STARTED:
    "This event has started or is not scheduled. Registration changes are closed.",
  EVENT_FULL: "This event is full. Please explore another event.",
  ALREADY_REGISTERED: "You are already registered for this event.",
  NO_ACTIVE_REGISTRATION:
    "You have no active registration for this event. It may already be cancelled.",
  ATTENDEES_FORBIDDEN: "You do not have permission to view these attendees.",
  INVALID_EVENT: "Please open a valid event and try again.",
};
export function registrationError(code: string | undefined): string {
  return (
    (code && Object.hasOwn(messages, code) ? messages[code] : undefined) ||
    "We could not complete your request. Please try again."
  );
}
export function registrationEligibility(
  status: string,
  start: string | null,
  remaining: number,
  now: number,
) {
  if (
    status !== "approved" ||
    !start ||
    !Number.isFinite(Date.parse(start)) ||
    Date.parse(start) <= now
  )
    return "closed";
  return remaining <= 0 ? "full" : "open";
}
export function safeReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\/(?!\/)/.test(value) ||
    /[\\\x00-\x20]/.test(value)
  )
    return "/dashboard";
  try {
    const decoded = decodeURIComponent(value);
    if (
      !decoded.startsWith("/") ||
      decoded.startsWith("//") ||
      /[\\\x00-\x20]/.test(decoded)
    )
      return "/dashboard";
    return value;
  } catch {
    return "/dashboard";
  }
}

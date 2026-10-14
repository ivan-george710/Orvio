const privateRoots = ["/dashboard", "/registrations", "/admin", "/profile", "/events/create"];

export function protectedPath(pathname: string): boolean {
  if (privateRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))) return true;
  const segments = pathname.split("/");
  return segments[1] === "events" && Boolean(segments[2])
    && (segments[3] === "edit" || segments[3] === "attendees");
}

export function loginRedirectPath(pathname: string, search: string): string {
  return `/login?${new URLSearchParams({ redirectTo: pathname + search })}`;
}

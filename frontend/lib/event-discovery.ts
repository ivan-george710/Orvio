import type { Event } from "@/lib/services/server/events";
import { eventCategory, EVENT_CATEGORY_IDS } from "@/lib/event-metadata";
import { registrationEligibility } from "@/lib/registrations";

export type EventDiscoveryFilters = {
  category: "all" | typeof EVENT_CATEGORY_IDS[number];
  when: "all" | "upcoming" | "past" | "unscheduled";
  availability: "all" | "available" | "full" | "registered";
  sort: "soonest" | "latest" | "title" | "spots";
  venue: string;
};
export type EventSearchParams = Record<string, string | string[] | undefined>;

function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

export function readEventFilters(params: EventSearchParams): EventDiscoveryFilters {
  return {
    category: choice(params.category, ["all", ...EVENT_CATEGORY_IDS], "all"),
    when: choice(params.when, ["all", "upcoming", "past", "unscheduled"], "all"),
    availability: choice(params.availability, ["all", "available", "full", "registered"], "all"),
    sort: choice(params.sort, ["soonest", "latest", "title", "spots"], "soonest"),
    venue: typeof params.venue === "string" ? params.venue.trim().slice(0, 120) : "",
  };
}

export function hasEventFilters(filters: EventDiscoveryFilters): boolean {
  return filters.category !== "all" || filters.when !== "all" || filters.availability !== "all"
    || filters.sort !== "soonest" || Boolean(filters.venue);
}

function timestamp(event: Event): number | null {
  const value = event.event_datetime ? Date.parse(event.event_datetime) : NaN;
  return Number.isFinite(value) ? value : null;
}

export function filterDiscoveryEvents(events: Event[], filters: EventDiscoveryFilters, now: number): Event[] {
  const venue = filters.venue.toLocaleLowerCase();
  const filtered = events.filter((event) => {
    if (filters.category !== "all" && eventCategory(event.category) !== filters.category) return false;
    if (venue && !event.venue.toLocaleLowerCase().includes(venue)) return false;
    const start = timestamp(event);
    if (filters.when === "upcoming" && (start === null || start <= now)) return false;
    if (filters.when === "past" && (start === null || start > now)) return false;
    if (filters.when === "unscheduled" && start !== null) return false;
    const summary = event.registration;
    if (filters.availability === "registered" && !summary?.is_registered) return false;
    if (filters.availability === "available" || filters.availability === "full") {
      if (!summary) return false;
      const eligibility = registrationEligibility(event.status, event.event_datetime, summary.remaining_spots, now);
      if (filters.availability === "available" && (eligibility !== "open" || summary.is_registered)) return false;
      if (filters.availability === "full" && eligibility !== "full") return false;
    }
    return true;
  });
  return filtered.sort((left, right) => {
    let difference = 0;
    if (filters.sort === "title") {
      difference = left.title.localeCompare(right.title, undefined, { sensitivity: "base", numeric: true });
    } else if (filters.sort === "spots") {
      const a = left.registration?.remaining_spots;
      const b = right.registration?.remaining_spots;
      if (a === undefined || b === undefined) difference = a === b ? 0 : a === undefined ? 1 : -1;
      else difference = b - a;
    } else {
      const a = timestamp(left);
      const b = timestamp(right);
      if (a === null || b === null) difference = a === b ? 0 : a === null ? 1 : -1;
      else difference = filters.sort === "latest" ? b - a : a - b;
    }
    return difference || left.id.localeCompare(right.id);
  });
}

export function eventFilterUrl(search: string, filters: EventDiscoveryFilters): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.when !== "all") params.set("when", filters.when);
  if (filters.availability !== "all") params.set("availability", filters.availability);
  if (filters.sort !== "soonest") params.set("sort", filters.sort);
  if (filters.venue) params.set("venue", filters.venue);
  return params.size ? `/events?${params}` : "/events";
}

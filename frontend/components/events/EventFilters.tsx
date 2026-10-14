"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_CATEGORIES } from "@/lib/event-metadata";
import { eventFilterUrl, readEventFilters, hasEventFilters, type EventDiscoveryFilters } from "@/lib/event-discovery";

export default function EventFilters({ filters }: { filters: EventDiscoveryFilters }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const search = params.get("search") || "";
  const control = "min-h-11 w-full rounded-lg border border-border bg-secondary px-3 text-sm";
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = readEventFilters(Object.fromEntries([...data].map(([key, value]) => [key, String(value)])));
    startTransition(() => router.push(eventFilterUrl(search, next)));
  }
  return (
    <form key={JSON.stringify(filters)} onSubmit={apply} className="mt-6 rounded-xl border border-border p-5" aria-label="Event filters" aria-busy={pending}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="filter-category">Category</Label>
          <select id="filter-category" name="category" defaultValue={filters.category} disabled={pending} className={control}>
            <option value="all">All categories</option>
            {EVENT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-when">Date</Label>
          <select id="filter-when" name="when" defaultValue={filters.when} disabled={pending} className={control}>
            <option value="all">Any date</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past events</option>
            <option value="unscheduled">Date to be announced</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-availability">Availability</Label>
          <select id="filter-availability" name="availability" defaultValue={filters.availability} disabled={pending} className={control}>
            <option value="all">Any availability</option>
            <option value="available">Places available</option>
            <option value="full">Event full</option>
            <option value="registered">My registrations</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-sort">Sort by</Label>
          <select id="filter-sort" name="sort" defaultValue={filters.sort} disabled={pending} className={control}>
            <option value="soonest">Date ascending</option>
            <option value="latest">Date descending</option>
            <option value="title">Title</option>
            <option value="spots">Most places available</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-venue">Venue</Label>
          <Input id="filter-venue" name="venue" defaultValue={filters.venue} maxLength={120} disabled={pending} placeholder="Search venues" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Applying..." : "Apply filters"}</Button>
        {hasEventFilters(filters) && <Link href={eventFilterUrl(search, readEventFilters({}))} className="inline-flex min-h-11 items-center text-sm text-muted-foreground">Clear filters</Link>}
      </div>
    </form>
  );
}

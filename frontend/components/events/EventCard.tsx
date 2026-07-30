import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";

import type { Event, EventStatus } from "@/lib/services/server/events";

type EventCardProps = {
  event: Event;
};

export const statusBadgeClasses: Record<EventStatus, string> = {
  pending: "bg-[#F59E0B]/12 text-[#F59E0B] border-[#F59E0B]/25 shadow-[#F59E0B]/10",
  approved: "bg-[#22C55E]/12 text-[#86EFAC] border-[#22C55E]/25 shadow-[#22C55E]/10",
  rejected: "bg-[#EF4444]/12 text-red-100 border-[#EF4444]/25 shadow-[#EF4444]/10",
  completed: "bg-blue-500/12 text-blue-100 border-blue-400/25 shadow-blue-500/10",
  cancelled: "bg-slate-300/10 text-slate-200 border-slate-300/20 shadow-slate-500/10",
};

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <article className="premium-card flex h-full flex-col rounded-3xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="premium-icon mb-4 size-11">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>

            <h3 className="line-clamp-2 text-lg font-black tracking-tight text-white transition-colors group-hover:text-violet-100">
              {event.title}
            </h3>

            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-300/75">
              <MapPin className="size-4 text-violet-200" aria-hidden="true" />
              <span className="truncate">{event.venue}</span>
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold capitalize shadow-lg backdrop-blur-xl ${statusBadgeClasses[event.status]}`}
          >
            {event.status}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-bold text-slate-200">
          <CalendarDays className="size-4 text-blue-200" aria-hidden="true" />
          <span>{new Date(event.event_datetime).toLocaleString()}</span>
        </div>
      </article>
    </Link>
  );
}

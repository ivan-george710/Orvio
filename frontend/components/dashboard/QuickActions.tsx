import Link from "next/link";
import { CalendarSearch, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/events/create" className={buttonVariants({ size: "lg" })}>
        <Plus />
        Create Event
      </Link>
      <Link
        href="/events"
        className={buttonVariants({ size: "lg", variant: "outline" })}
      >
        <CalendarSearch />
        Browse Events
      </Link>
    </div>
  );
}

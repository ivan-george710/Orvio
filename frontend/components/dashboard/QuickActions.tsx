import Link from "next/link";
import { CalendarSearch, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href="/events">
        <Button size="lg">
          <CalendarSearch />
          Browse Events
        </Button>
      </Link>

      <Link href="/events/create">
        <Button size="lg" variant="secondary">
          <Plus />
          Create Event
        </Button>
      </Link>
    </div>
  );
}

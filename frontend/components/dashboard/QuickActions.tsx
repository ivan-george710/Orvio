import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <div className="flex gap-4">

      <Link href="/events">
        <Button size="lg">
          Browse Events
        </Button>
      </Link>

      <Link href="/events/create">
        <Button
          size="lg"
          variant="outline"
        >
          Create Event
        </Button>
      </Link>

    </div>
  );
}
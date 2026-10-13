import Link from "next/link";
import { notFound } from "next/navigation";

import CreateEventForm from "@/components/events/CreateEventForm";
import { getEditableEventById } from "@/lib/services/server/events";
import type { CreateEventInput } from "@/lib/validations/event";

type EditEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function toFormValues(event: Awaited<ReturnType<typeof getEditableEventById>>) {
  if (!event) {
    return null;
  }

  return {
    title: event.title,
    description: event.description,
    venue: event.venue,
    event_datetime: event.event_datetime.slice(0, 16),
    max_participants: event.max_participants,
  } satisfies CreateEventInput;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const event = await getEditableEventById(id);
  const initialValues = toFormValues(event);

  if (!event || !initialValues) {
    notFound();
  }

  return (
    <main className="premium-page py-12 sm:py-16">
      <div className="premium-container mx-auto max-w-4xl px-6 sm:px-8">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-secondary px-3.5 text-sm font-bold text-muted-foreground shadow-lg shadow-black/20 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          Back to Dashboard
        </Link>

        <p className="eyebrow mb-4">Your event / The details</p>
        <h1 className="premium-title mt-8 text-4xl font-semibold">
          Edit Event
        </h1>

        <p className="premium-text mt-2">
          Update your pending event before it is reviewed.
        </p>

        <div className="premium-panel mt-8 rounded-xl p-6 sm:p-10">
          <CreateEventForm eventId={event.id} initialValues={initialValues} />
        </div>
      </div>
    </main>
  );
}

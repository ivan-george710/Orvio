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
    <main className="premium-page py-10">
      <div className="premium-container mx-auto max-w-3xl px-6 sm:px-8">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/14 bg-white/8 px-3.5 text-sm font-bold text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-cyan-200/10 hover:text-cyan-100"
        >
          Back to Dashboard
        </Link>

        <h1 className="premium-title mt-8 text-4xl font-black">
          Edit Event
        </h1>

        <p className="premium-text mt-2">
          Update your pending event before it is reviewed.
        </p>

        <div className="premium-panel mt-8 rounded-[2rem] p-6">
          <CreateEventForm eventId={event.id} initialValues={initialValues} />
        </div>
      </div>
    </main>
  );
}

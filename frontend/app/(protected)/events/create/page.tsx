import CreateEventForm from "@/components/events/CreateEventForm";

export default function CreateEventPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-4xl font-bold">
          Create Event
        </h1>

        <p className="mt-2 text-slate-500">
          Submit your event for approval.
        </p>

        <div className="mt-8">
          <CreateEventForm />
        </div>

      </div>
    </main>
  );
}
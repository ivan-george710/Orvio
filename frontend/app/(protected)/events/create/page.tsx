import CreateEventForm from "@/components/events/CreateEventForm";

export default function CreateEventPage() {
  return (
    <main className="premium-page py-12 sm:py-16">
      <div className="premium-container mx-auto max-w-4xl px-6 sm:px-8">
        <p className="eyebrow mb-4">Your event / The details</p>
        <h1 className="premium-title text-4xl font-semibold">Create Event</h1>

        <p className="premium-text mt-2">Submit your event for approval.</p>

        <div className="premium-panel mt-8 rounded-xl p-6 sm:p-10">
          <CreateEventForm />
        </div>
      </div>
    </main>
  );
}

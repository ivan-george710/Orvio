import CreateEventForm from "@/components/events/CreateEventForm";

export default function CreateEventPage() {
  return (
    <main className="premium-page py-10">
      <div className="premium-container mx-auto max-w-3xl px-6 sm:px-8">
        <h1 className="premium-title text-4xl font-black">
          Create Event
        </h1>

        <p className="premium-text mt-2">
          Submit your event for approval.
        </p>

        <div className="premium-panel mt-8 rounded-[2rem] p-6">
          <CreateEventForm />
        </div>
      </div>
    </main>
  );
}

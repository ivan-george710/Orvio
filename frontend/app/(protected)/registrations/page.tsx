import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyRegistrations from "@/components/events/MyRegistrations";
import { getMyRegistrations } from "@/lib/services/server/registrations";
export default async function RegistrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/registrations");
  const registrations = await getMyRegistrations();
  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <h1 className="premium-title text-4xl font-semibold">
          My Registrations
        </h1>
        <p className="premium-text mt-3">
          Your confirmed plans and registration history.
        </p>
        <MyRegistrations registrations={registrations} />
      </div>
    </main>
  );
}

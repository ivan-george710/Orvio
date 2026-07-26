import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import LogoutButton from "@/components/auth/LogoutButton";
import QuickActions from "@/components/dashboard/QuickActions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-8 py-10">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold">
              Welcome, {user.user_metadata.full_name} 👋
            </h1>

            <p className="mt-2 text-slate-500">
              Ready to explore or create your next event?
            </p>
          </div>

          <LogoutButton />

        </div>

        <div className="mt-10">
          <QuickActions />
        </div>

      </div>

    </main>
  );
}
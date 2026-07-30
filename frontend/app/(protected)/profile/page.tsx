import { redirect } from "next/navigation";
import { Mail, ShieldCheck, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = user.user_metadata.full_name ?? "Orvio Member";

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <div className="premium-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="premium-icon size-16 rounded-3xl">
              <UserRound className="size-8" aria-hidden="true" />
            </div>

            <div>
              <p className="premium-kicker px-3 py-1.5 text-xs font-bold">
                Profile
              </p>

              <h1 className="premium-title mt-4 text-4xl font-black">
                {fullName}
              </h1>

              <p className="premium-text mt-2">
                Your Orvio identity and account access details.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="premium-card rounded-3xl p-6">
            <div className="premium-icon size-12">
              <Mail className="size-6" aria-hidden="true" />
            </div>

            <h2 className="mt-6 text-xl font-black text-white">Email</h2>
            <p className="mt-2 break-all text-slate-300/78">{user.email}</p>
          </section>

          <section className="premium-card rounded-3xl p-6">
            <div className="premium-icon size-12">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>

            <h2 className="mt-6 text-xl font-black text-white">Account ID</h2>
            <p className="mt-2 break-all text-slate-300/78">{user.id}</p>
          </section>
        </div>
      </div>
    </main>
  );
}

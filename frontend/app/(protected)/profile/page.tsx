import { redirect } from "next/navigation";
import { Mail, ShieldCheck, UserRound } from "lucide-react";

import { getCurrentProfile, ProfileError } from "@/lib/services/server/profile";
import { profileDisplayName } from "@/lib/profile";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  let profile;
  try {
    profile = await getCurrentProfile();
  } catch (error) {
    if (error instanceof ProfileError && error.code === "auth") redirect("/login?redirectTo=%2Fprofile");
    throw error;
  }
  const fullName = profileDisplayName(profile.full_name);

  return (
    <main className="premium-page">
      <div className="premium-container mx-auto max-w-5xl px-6 py-12 sm:py-16 sm:px-8">
        <div className="premium-panel rounded-xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="premium-icon size-16 rounded-xl">
              <UserRound className="size-8" aria-hidden="true" />
            </div>

            <div>
              <p className="premium-kicker px-3 py-1.5 text-xs font-bold">
                Profile
              </p>

              <h1 className="premium-title mt-4 text-4xl font-semibold">
                {fullName}
              </h1>

              <p className="premium-text mt-2">
                Your Orvio identity and account access details.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="premium-card rounded-xl p-6">
            <div className="premium-icon size-12">
              <Mail className="size-6" aria-hidden="true" />
            </div>

            <h2 className="mt-6 text-xl font-semibold text-foreground">
              Email
            </h2>
            <p className="mt-2 break-all text-muted-foreground">{profile.email}</p>
          </section>

          <section className="premium-card rounded-xl p-6">
            <div className="premium-icon size-12">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>

            <h2 className="mt-6 text-xl font-semibold text-foreground">
              Account ID
            </h2>
            <p className="mt-2 break-all text-muted-foreground">{profile.id}</p>
          </section>
        </div>
        <ProfileForm initialName={profile.full_name ?? ""} />
      </div>
    </main>
  );
}

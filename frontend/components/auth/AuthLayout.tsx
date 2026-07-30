import { ReactNode } from "react";
import { CalendarDays, ShieldCheck } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <main className="premium-page flex min-h-screen">
      <div className="premium-container hidden w-1/2 items-center justify-center p-12 text-white lg:flex">
        <div className="max-w-md">
          <div className="premium-kicker mb-10 px-3 py-1.5 text-sm font-bold">
            <CalendarDays className="size-4" />
            Orvio
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight">
            Welcome to Orvio
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300/78">
            Manage events, registrations and participants from one modern
            platform.
          </p>

          <div className="premium-panel mt-10 flex items-center gap-3 rounded-3xl p-4 text-sm text-slate-300">
            <ShieldCheck className="size-5 text-emerald-200" />
            Secure access for organizers, participants, and admins.
          </div>
        </div>
      </div>

      <div className="premium-container flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="premium-panel w-full max-w-md rounded-[2rem] p-8">
          <h2 className="text-3xl font-black tracking-tight text-white">
            {title}
          </h2>

          <p className="mt-2 text-slate-300/75">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

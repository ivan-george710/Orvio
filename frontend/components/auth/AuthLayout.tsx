import { ReactNode } from "react";

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
    <main className="flex min-h-screen bg-slate-50">
      {/* Left side */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-12">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold leading-tight">
            Welcome to Orvio
          </h1>

          <p className="mt-6 text-lg opacity-90">
            Manage events, registrations and participants from one modern
            platform.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-bold">{title}</h2>

          <p className="mt-2 text-slate-500">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
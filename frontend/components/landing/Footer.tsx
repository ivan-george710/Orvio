import { CalendarDays } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">

        <div className="flex items-center gap-2">

          <CalendarDays className="h-6 w-6 text-indigo-600" />

          <span className="text-xl font-bold">
            Orvio
          </span>

        </div>

        <p className="text-sm text-slate-500">
          © 2026 Orvio. Built with Next.js & FastAPI.
        </p>

      </div>

    </footer>
  );
}
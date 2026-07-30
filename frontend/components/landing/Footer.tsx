import { CalendarDays } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="premium-icon size-9 rounded-full">
            <CalendarDays className="size-5" />
          </span>

          <span className="text-xl font-black tracking-tight text-white">
            Orvio
          </span>
        </div>

        <p className="text-sm text-slate-400">
          &copy; 2026 Orvio. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}

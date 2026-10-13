import { ReactNode } from "react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
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
    <main className="relative isolate flex flex-1 items-center overflow-hidden">
      <div
        className="ambient absolute -left-56 top-0 h-[850px] w-[850px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-24 lg:py-20">
        <div className="hidden flex-col justify-between py-8 lg:flex">
          <div>
            <p className="eyebrow">
              <CalendarDays className="size-4" aria-hidden="true" /> Your next
              experience starts here
            </p>
            <h2 className="mt-8 text-7xl font-semibold leading-[.98] tracking-[-.065em]">
              Be there.
              <br />
              <span className="text-primary">Be part of it.</span>
            </h2>
            <p className="mt-8 max-w-sm text-lg leading-8 text-muted-foreground">
              Discover something new. Bring people together. Make your next
              moment matter.
            </p>
          </div>
          <div className="mt-16 flex items-center gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
            <ArrowUpRight className="size-5 text-primary" aria-hidden="true" />{" "}
            Events, ideas, and the people behind them.
          </div>
        </div>
        <div className="animate-rise-in mx-auto w-full max-w-md self-center rounded-2xl border border-border bg-secondary/40 p-6 sm:p-10">
          <p className="eyebrow mb-6">ORVIO / Your account</p>
          <h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

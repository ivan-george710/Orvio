"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, LayoutDashboard, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const appHistoryKey = "orvio:has-app-history";
const lastPathKey = "orvio:last-path";
const navLinkClasses =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-slate-200 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-cyan-200/10 hover:text-cyan-100 sm:px-3.5";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(data.session));
      setIsAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const lastPath = window.sessionStorage.getItem(lastPathKey);

    if (lastPath && lastPath !== pathname) {
      window.sessionStorage.setItem(appHistoryKey, "true");
    }

    window.sessionStorage.setItem(lastPathKey, pathname);
  }, [pathname]);

  function handleBack() {
    const hasAppHistory =
      window.sessionStorage.getItem(appHistoryKey) === "true";
    const hasSameOriginReferrer =
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin;

    if (window.history.length > 1 && (hasAppHistory || hasSameOriginReferrer)) {
      router.back();
      return;
    }

    router.push(isAuthenticated ? "/dashboard" : "/events");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-violet-300/15 bg-[#080c19]/75 shadow-2xl shadow-black/25 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-left shadow-lg shadow-black/15 transition-all duration-300 hover:border-violet-300/35 hover:bg-violet-500/10 hover:shadow-violet-500/15 focus-visible:ring-4 focus-visible:ring-violet-400/25 focus-visible:outline-none sm:px-4"
          aria-label="Go back in Orvio"
        >
          
          <span className="truncate text-lg font-black tracking-normal text-white transition-colors duration-300 group-hover:text-violet-100 group-hover:[text-shadow:0_0_22px_rgba(139,92,246,0.45)] sm:text-xl">
            ORVIO
          </span>
        </button>

        <nav
          className="flex min-w-0 items-center justify-end gap-2"
          aria-label="Primary navigation"
        >
          <Link
            href="/events"
            className={navLinkClasses}
          >
            <Sparkles className="hidden size-4 sm:block" aria-hidden="true" />
            Events
          </Link>

          {isAuthReady && isAuthenticated && (
            <Link
              href="/events/create"
              className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-bold text-slate-200 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-violet-500/10 hover:text-violet-100 sm:inline-flex"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              <span className="hidden md:inline">Create</span>
            </Link>
          )}

          {isAuthReady && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(59,130,246,0.16))] text-white shadow-lg shadow-violet-500/15 transition-all hover:-translate-y-0.5 hover:border-violet-200/45 hover:shadow-violet-500/25"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/login"
              className={navLinkClasses}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

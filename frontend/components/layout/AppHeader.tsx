"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  LayoutDashboard,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/services/server/events";

const appHistoryKey = "orvio:has-app-history";
const lastPathKey = "orvio:last-path";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncAuthState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        setIsAuthenticated(false);
        setUserRole(null);
        setIsAuthReady(true);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle<{ role: UserRole }>();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(true);
      setUserRole(data?.role ?? null);
      setIsAuthReady(true);
    }

    syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setUserRole(null);
        setIsAuthReady(true);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle<{ role: UserRole }>();

      setIsAuthenticated(true);
      setUserRole(data?.role ?? null);
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

  const isAdmin = isAuthReady && isAuthenticated && userRole === "admin";

  const isActive = (href: string) =>
    href === "/events"
      ? pathname === href ||
        (pathname.startsWith("/events/") && !pathname.includes("/create"))
      : pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back in Orvio"
            className="group inline-flex min-h-11 items-center gap-3 rounded-md"
          >
            <ArrowLeft
              className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="brand-wordmark">
              ORVIO<span className="text-primary">.</span>
            </span>
          </button>
          <Link href="/" aria-label="ORVIO home" className="nav-link sm:hidden">
            Home
          </Link>
        </div>
        <nav
          className="flex flex-wrap items-center gap-1"
          aria-label="Primary navigation"
        >
          <Link
            href="/events"
            className="nav-link"
            aria-current={isActive("/events") ? "page" : undefined}
          >
            <Compass className="hidden size-4 md:block" aria-hidden="true" />
            Events
          </Link>
          {isAuthReady && isAuthenticated && (
            <Link
              href="/events/create"
              className="nav-link"
              aria-current={isActive("/events/create") ? "page" : undefined}
            >
              <CalendarPlus
                className="hidden size-4 md:block"
                aria-hidden="true"
              />
              Create
            </Link>
          )}
          {isAuthReady && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="nav-link"
              aria-current={isActive("/dashboard") ? "page" : undefined}
            >
              <LayoutDashboard
                className="hidden size-4 md:block"
                aria-hidden="true"
              />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="nav-link"
              aria-current={isActive("/login") ? "page" : undefined}
            >
              Login{" "}
              <span className="text-primary" aria-hidden="true">
                &#8599;
              </span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="nav-link"
              aria-current={isActive("/admin") ? "page" : undefined}
            >
              <ShieldCheck
                className="hidden size-4 md:block"
                aria-hidden="true"
              />
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

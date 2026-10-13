"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function DashboardPreview() {
  return (
    <Link
      href="/dashboard"
      className="premium-panel group flex items-center justify-between gap-6 rounded-xl p-6"
    >
      <div>
        <p className="eyebrow">Your workspace</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Every event. One clear view.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Track submissions and manage your pending events.
        </p>
      </div>
      <ArrowUpRight className="size-6 shrink-0 text-primary" />
    </Link>
  );
}

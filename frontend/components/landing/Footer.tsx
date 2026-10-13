import Link from "next/link";
export default function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="brand-wordmark w-fit">
          ORVIO<span className="text-primary">.</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          A place for what&apos;s next. &copy; 2026 ORVIO.
        </p>
        <nav
          aria-label="Footer navigation"
          className="flex gap-6 text-xs text-muted-foreground"
        >
          <Link href="/events" className="py-3 hover:text-foreground">
            Events
          </Link>
          <Link href="/dashboard" className="py-3 hover:text-foreground">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}

import {
  ArrowUpRight,
  CalendarSearch,
  CalendarPlus,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
const steps = [
  {
    icon: CalendarSearch,
    title: "Find your next event.",
    description:
      "Explore approved events. Get the details, find your venue, and register for an experience that interests you.",
    href: "/events",
    link: "Discover events",
  },
  {
    icon: CalendarPlus,
    title: "Bring your idea to life.",
    description:
      "Choose a date, add your venue, and set your participant limit. Submit your event for review.",
    href: "/events/create",
    link: "Create an event",
  },
  {
    icon: LayoutDashboard,
    title: "Keep everything in view.",
    description:
      "Follow your submissions from pending to approved. Edit or withdraw pending events from your workspace.",
    href: "/dashboard",
    link: "Your dashboard",
  },
];
export default function Features() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="eyebrow">01 / How ORVIO works</p>
          <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-.05em] sm:text-5xl">
            Good experiences.
            <br />
            <span className="text-muted-foreground">Less friction.</span>
          </h2>
        </div>
        <p className="max-w-md text-base leading-7 text-muted-foreground lg:justify-self-end">
          From the first idea to your next registration, a clear path to
          bringing people together.
        </p>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
        {steps.map((step, i) => (
          <article
            key={step.title}
            className="group border-t border-border pt-6"
          >
            <div className="flex items-center justify-between">
              <step.icon className="size-6 text-primary" aria-hidden="true" />
              <span className="font-mono text-xs text-muted-foreground">
                0{i + 1}
              </span>
            </div>
            <h3 className="mt-9 text-xl font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {step.description}
            </p>
            <Link
              href={step.href}
              className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-medium hover:text-primary"
            >
              {step.link}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

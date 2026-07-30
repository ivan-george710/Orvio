import { CalendarDays, ShieldCheck, Users } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Create & Manage Events",
    description:
      "Create professional events with registration limits, approval workflows, and scheduling in minutes.",
    accent: "from-violet-600 to-indigo-500",
  },
  {
    icon: Users,
    title: "Seamless Registration",
    description:
      "Participants can discover, register, and keep track of upcoming events from one dashboard.",
    accent: "from-indigo-600 to-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "Built for Organizers",
    description:
      "Manage registrations, monitor attendance, and collect feedback after every event.",
    accent: "from-violet-700 to-cyan-500",
  },
];

export default function Features() {
  return (
    <section id="features" className="premium-page py-28">
      <div className="premium-container mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="premium-kicker px-4 py-2 text-sm font-bold">
            Features
          </span>

          <h2 className="premium-title mt-6 text-4xl font-black sm:text-5xl">
            Everything you need to run events.
          </h2>

          <p className="premium-text mt-6 text-lg leading-8">
            Whether you&apos;re hosting a workshop, hackathon, seminar or
            meetup, Orvio gives you everything required to organize it.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="premium-card animate-rise-in group rounded-3xl p-7"
              >
                <div className={`flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-2xl shadow-violet-500/20`}>
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-7 text-xl font-black tracking-tight text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-300/75">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import {
  CalendarDays,
  Users,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Create & Manage Events",
    description:
      "Create professional events with registration limits, approval workflows, and scheduling in minutes.",
  },
  {
    icon: Users,
    title: "Seamless Registration",
    description:
      "Participants can discover, register, and keep track of upcoming events from one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Built for Organizers",
    description:
      "Manage registrations, monitor attendance, and collect feedback after every event.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="bg-slate-50 py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-2xl text-center">

          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-600">
            Features
          </span>

          <h2 className="mt-6 text-5xl font-bold tracking-tight">
            Everything you need to run events.
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            Whether you're hosting a workshop, hackathon,
            seminar or meetup, Orvio gives you everything
            required to organize it.
          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="
                  group
                  rounded-3xl
                  border
                  bg-white
                  p-8
                  shadow-sm
                  transition-all
                  duration-300
                  hover:-translate-y-2
                  hover:shadow-xl
                "
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
                  <Icon className="h-7 w-7 text-indigo-600" />
                </div>

                <h3 className="mt-8 text-2xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
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
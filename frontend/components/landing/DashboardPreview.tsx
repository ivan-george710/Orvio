"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  TrendingUp,
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <motion.div
      id="dashboard"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: .3 }}
      className="mt-20 w-full max-w-5xl rounded-3xl border bg-white shadow-2xl"
    >
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-6 p-8 md:grid-cols-3">

        <StatCard
          icon={<CalendarDays />}
          title="Events"
          value="12"
        />

        <StatCard
          icon={<Users />}
          title="Participants"
          value="438"
        />

        <StatCard
          icon={<TrendingUp />}
          title="Success Rate"
          value="98%"
        />

      </div>

      <div className="border-t p-8">

        <h3 className="mb-6 text-lg font-semibold">
          Upcoming Events
        </h3>

        <div className="space-y-4">

          {[
            ["AI Workshop", "124 Registered"],
            ["Hackathon", "89 Registered"],
            ["Design Meetup", "54 Registered"],
          ].map(([title, value]) => (

            <div
              key={title}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-slate-50"
            >
              <span className="font-medium">
                {title}
              </span>

              <span className="text-sm text-slate-500">
                {value}
              </span>
            </div>

          ))}

        </div>

      </div>

    </motion.div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border p-6">
      <div className="mb-4 text-indigo-600">
        {icon}
      </div>

      <p className="text-slate-500">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}
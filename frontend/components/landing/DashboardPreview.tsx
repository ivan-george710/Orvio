"use client";

import { motion } from "framer-motion";
import { CalendarDays, TrendingUp, Users } from "lucide-react";

export default function DashboardPreview() {
  return (
    <motion.div
      id="dashboard"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
      className="premium-panel mt-20 w-full max-w-5xl rounded-[1.75rem]"
    >
      <div className="border-b border-white/10 bg-white/8 p-6">
        <h2 className="text-xl font-black tracking-tight text-white">
          Live Command Center
        </h2>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-3 md:p-8">
        <StatCard icon={<CalendarDays />} title="Events" value="12" />
        <StatCard icon={<Users />} title="Participants" value="438" />
        <StatCard icon={<TrendingUp />} title="Success Rate" value="98%" />
      </div>

      <div className="border-t border-white/10 p-6 md:p-8">
        <h3 className="mb-5 text-lg font-bold text-white">
          Upcoming Events
        </h3>

        <div className="space-y-3">
          {[
            ["AI Workshop", "124 Registered"],
            ["Hackathon", "89 Registered"],
            ["Design Meetup", "54 Registered"],
          ].map(([title, value]) => (
            <div
              key={title}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 p-4 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/12"
            >
              <span className="font-bold text-white">{title}</span>

              <span className="text-sm font-semibold text-blue-200">{value}</span>
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
    <div className="premium-card rounded-3xl p-6">
      <div className="premium-icon mb-4 size-11">
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-300/75">{title}</p>

      <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
        {value}
      </h2>
    </div>
  );
}

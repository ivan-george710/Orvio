"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateUserRoleAction } from "@/lib/actions/admin";
import type { UserRole } from "@/lib/services/server/events";

const roles: UserRole[] = ["participant", "organizer", "admin"];

type AdminUserRoleSelectProps = {
  userId: string;
  role: UserRole;
};

export default function AdminUserRoleSelect({
  userId,
  role,
}: AdminUserRoleSelectProps) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState(role);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(nextRole: UserRole) {
    const previous = currentRole;
    setError("");
    setCurrentRole(nextRole);

    startTransition(async () => {
      const result = await updateUserRoleAction(userId, nextRole);

      if (!result.ok) {
        setCurrentRole(previous);
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`role-${userId}`}>
        User role
      </label>
      <select
        id={`role-${userId}`}
        value={currentRole}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as UserRole)}
        className="h-10 w-full rounded-xl border border-white/14 bg-[#0b1220] px-3 text-sm font-bold capitalize text-white outline-none focus:border-cyan-200/40"
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-bold text-red-200">{error}</p>
      )}
    </div>
  );
}
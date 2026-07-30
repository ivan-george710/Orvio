"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          placeholder="john@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          placeholder="********"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? "Logging in..." : "Login"}
      </Button>

      <p className="text-center text-sm text-slate-300/75">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-bold text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
        >
          Create one
        </Link>
      </p>

    </form>
  );
}

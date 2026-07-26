"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  console.log("Signup button clicked");

  setError("");

  if (password !== confirmPassword) {
    console.log("Passwords don't match");
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);

  console.log("Calling Supabase...");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  console.log("Response:", data, error);

  setLoading(false);

  if (error) {
    console.log("Signup error:", error);
    setError(error.message);
    return;
  }

  console.log("Redirecting...");
  router.push("/dashboard");
}
  return (
    <form onSubmit={handleSignup} className="space-y-5">

      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Confirm Password</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
  type="submit"
  disabled={loading}
  className="w-full"
>
  {loading ? "Creating Account..." : "Create Account"}
</Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:underline"
        >
          Login
        </Link>
      </p>
    </form>
  );
}
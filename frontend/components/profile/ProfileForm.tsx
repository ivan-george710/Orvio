"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileSchema } from "@/lib/profile";
import { updateProfileAction } from "@/lib/actions/profile";

export default function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const changed = name.trim() !== savedName.trim();

  function reset() {
    setName(savedName);
    setError("");
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setSuccess("");
    const parsed = updateProfileSchema.safeParse({ full_name: name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Check your name.");
      return;
    }
    setPending(true);
    try {
      const result = await updateProfileAction(parsed.data);
      if (!result.ok) {
        setError(result.message);
        if (result.needsLogin) router.push("/login?redirectTo=%2Fprofile");
        return;
      }
      setName(result.fullName);
      setSavedName(result.fullName);
      setSuccess("Your profile has been updated.");
      router.refresh();
    } catch {
      setError("Your changes could not be saved. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="premium-card mt-8 rounded-xl p-6 sm:p-8" aria-labelledby="edit-profile-heading">
      <h2 id="edit-profile-heading" className="text-xl font-semibold">Edit profile</h2>
      <p className="premium-text mt-2">Choose the name shown on your events and registration lists.</p>
      <form onSubmit={submit} noValidate className="mt-6 max-w-xl space-y-5" aria-busy={pending}>
        <div className="space-y-2">
          <Label htmlFor="profile-full-name">Display name</Label>
          <Input
            id="profile-full-name"
            name="full_name"
            autoComplete="name"
            value={name}
            maxLength={100}
            disabled={pending}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "profile-name-help profile-error" : "profile-name-help"}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
              setSuccess("");
            }}
          />
          <p id="profile-name-help" className="text-xs text-muted-foreground">Use 2 to 100 characters.</p>
        </div>
        {error && <p id="profile-error" role="alert" className="text-sm text-red-200">{error}</p>}
        {success && <p role="status" className="text-sm text-success">{success}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending || !changed}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" disabled={pending || !changed} onClick={reset}>
            Discard changes
          </Button>
        </div>
        {changed && !pending && <p className="text-xs text-muted-foreground">You have unsaved changes.</p>}
      </form>
    </section>
  );
}

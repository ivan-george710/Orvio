"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/lib/services/events";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validations/event";

export default function CreateEventForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema) as Resolver<CreateEventInput>,
  });

  async function onSubmit(data: CreateEventInput) {
    try {
      setSubmitError("");
      await createEvent(data);
      router.push("/dashboard");
    } catch (err) {
  console.error(err);
  setSubmitError(
    err instanceof Error ? err.message : "Failed to create event."
  );
}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="HackNight 2026" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell people what this event is about."
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          placeholder="Community Hall"
          {...register("venue")}
        />
        {errors.venue && (
          <p className="text-sm text-red-500">{errors.venue.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_datetime">Date and Time</Label>
        <Input
          id="event_datetime"
          type="datetime-local"
          {...register("event_datetime")}
        />
        {errors.event_datetime && (
          <p className="text-sm text-red-500">
            {errors.event_datetime.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_participants">Maximum Participants</Label>
        <Input
          id="max_participants"
          type="number"
          min="1"
          placeholder="50"
          {...register("max_participants")}
        />
        {errors.max_participants && (
          <p className="text-sm text-red-500">
            {errors.max_participants.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-500">{submitError}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Submit Event"}
      </Button>
    </form>
  );
}

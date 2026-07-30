"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateEventAction } from "@/lib/actions/events";
import { createEvent } from "@/lib/services/events";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validations/event";

type CreateEventFormProps = {
  eventId?: string;
  initialValues?: CreateEventInput;
};

export default function CreateEventForm({
  eventId,
  initialValues,
}: CreateEventFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const isEditing = Boolean(eventId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema) as Resolver<CreateEventInput>,
    defaultValues: initialValues,
  });

  async function onSubmit(data: CreateEventInput) {
    try {
      setSubmitError("");
      if (eventId) {
        await updateEventAction(eventId, data);
      } else {
        await createEvent(data);
      }
      router.push("/dashboard");
    } catch (err) {
  console.error(err);
  setSubmitError(
    err instanceof Error
      ? err.message
      : `Failed to ${isEditing ? "update" : "create"} event.`
  );
}
  }

  const errorClassName = "text-sm font-bold text-red-200";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="HackNight 2026" {...register("title")} />
        {errors.title && (
          <p className={errorClassName}>{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell people what this event is about."
          {...register("description")}
        />
        {errors.description && (
          <p className={errorClassName}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          placeholder="Community Hall"
          {...register("venue")}
        />
        {errors.venue && (
          <p className={errorClassName}>{errors.venue.message}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="event_datetime">Date and Time</Label>
        <Input
          id="event_datetime"
          type="datetime-local"
          {...register("event_datetime")}
        />
        {errors.event_datetime && (
          <p className={errorClassName}>
            {errors.event_datetime.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="max_participants">Maximum Participants</Label>
        <Input
          id="max_participants"
          type="number"
          min="1"
          placeholder="50"
          {...register("max_participants")}
        />
        {errors.max_participants && (
          <p className={errorClassName}>
            {errors.max_participants.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
        {isSubmitting
          ? isEditing
            ? "Updating..."
            : "Creating..."
          : isEditing
            ? "Update Event"
            : "Submit Event"}
      </Button>
    </form>
  );
}

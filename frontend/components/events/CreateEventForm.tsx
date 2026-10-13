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
          : `Failed to ${isEditing ? "update" : "create"} event.`,
      );
    }
  }

  const errorClassName = "text-sm font-bold text-red-200";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 sm:grid-cols-2"
    >
      <div className="space-y-2.5 sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          placeholder="HackNight 2026"
          {...register("title")}
        />
        {errors.title && (
          <p id="title-error" role="alert" className={errorClassName}>
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
          placeholder="Tell people what this event is about."
          {...register("description")}
        />
        {errors.description && (
          <p id="description-error" role="alert" className={errorClassName}>
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5 sm:col-span-2">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          aria-invalid={Boolean(errors.venue)}
          aria-describedby={errors.venue ? "venue-error" : undefined}
          placeholder="Community Hall"
          {...register("venue")}
        />
        {errors.venue && (
          <p id="venue-error" role="alert" className={errorClassName}>
            {errors.venue.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="event_datetime">Date and Time</Label>
        <Input
          id="event_datetime"
          aria-invalid={Boolean(errors.event_datetime)}
          aria-describedby={
            errors.event_datetime ? "event_datetime-error" : undefined
          }
          type="datetime-local"
          {...register("event_datetime")}
        />
        {errors.event_datetime && (
          <p id="event_datetime-error" role="alert" className={errorClassName}>
            {errors.event_datetime.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="max_participants">Maximum Participants</Label>
        <Input
          id="max_participants"
          aria-invalid={Boolean(errors.max_participants)}
          aria-describedby={
            errors.max_participants ? "max_participants-error" : undefined
          }
          type="number"
          min="1"
          placeholder="50"
          {...register("max_participants")}
        />
        {errors.max_participants && (
          <p
            id="max_participants-error"
            role="alert"
            className={errorClassName}
          >
            {errors.max_participants.message}
          </p>
        )}
      </div>

      {submitError && (
        <p
          role="alert"
          className="sm:col-span-2 rounded-2xl border border-red-300/30 bg-red-400/12 px-3.5 py-3 text-sm font-bold text-red-100"
        >
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full sm:col-span-2"
      >
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

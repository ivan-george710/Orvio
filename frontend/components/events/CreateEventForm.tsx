"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateEventAction } from "@/lib/actions/events";
import { createEvent } from "@/lib/services/events";
import { EVENT_CATEGORIES, eventCategory, eventDetailsSchema, type EventDetailsInput } from "@/lib/event-metadata";
import { eventDateTimeForStorage, localEventDateTime } from "@/lib/event-datetime";
import BannerUpload from "@/components/events/BannerUpload";

type CreateEventFormProps = {
  eventId?: string;
  initialValues?: EventDetailsInput;
};

export default function CreateEventForm({
  eventId,
  initialValues,
}: CreateEventFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const isEditing = Boolean(eventId);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventDetailsInput>({
    resolver: zodResolver(eventDetailsSchema) as Resolver<EventDetailsInput>,
    defaultValues: {
      ...initialValues,
      category: eventCategory(initialValues?.category),
      banner_url: initialValues?.banner_url ?? null,
      event_datetime: "",
    },
  });
  const bannerUrl = useWatch({ control, name: "banner_url" });
  useEffect(() => {
    if (initialValues?.event_datetime) {
      setValue("event_datetime", localEventDateTime(initialValues.event_datetime));
    }
  }, [initialValues?.event_datetime, setValue]);

  async function onSubmit(data: EventDetailsInput) {
    try {
      setSubmitError("");
      const submission = {
        ...data,
        event_datetime: eventDateTimeForStorage(data.event_datetime, initialValues?.event_datetime),
      };
      if (eventId) {
        const result = await updateEventAction(eventId, submission);
        if (!result.ok) throw new Error(result.message);
      } else {
        await createEvent(submission);
      }
      router.push("/dashboard");
    } catch (err) {
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
        <Label htmlFor="event-category">Category</Label>
        <select id="event-category" {...register("category")} disabled={isSubmitting}
          className="min-h-11 w-full rounded-lg border border-border bg-secondary px-3 text-sm"
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "category-error" : undefined}>
          {EVENT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        {errors.category && <p id="category-error" role="alert" className={errorClassName}>{errors.category.message}</p>}
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

      <BannerUpload value={bannerUrl ?? null} disabled={isSubmitting}
        onBusyChange={setUploadBusy}
        onChange={(value) => setValue("banner_url", value, { shouldDirty: true, shouldValidate: true })} />
      {errors.banner_url && <p role="alert" className={`${errorClassName} sm:col-span-2`}>{errors.banner_url.message}</p>}

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
        <p className="text-xs text-muted-foreground">Times use your device&apos;s local time.</p>
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
        disabled={isSubmitting || uploadBusy}
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

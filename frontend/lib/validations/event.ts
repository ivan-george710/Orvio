import { z } from "zod";

export const createEventSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters.")
    .max(100, "Title cannot exceed 100 characters."),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(1000, "Description cannot exceed 1000 characters."),

  venue: z
    .string()
    .min(2, "Venue is required.")
    .max(100, "Venue cannot exceed 100 characters."),

  event_datetime: z.string().min(1, "Please select a date and time."),

  max_participants: z.coerce
    .number()
    .int()
    .positive("Maximum participants must be greater than 0."),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
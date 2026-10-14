import { z } from "zod";

export const updateProfileSchema = z.strictObject({
  full_name: z.string()
    .trim()
    .min(2, "Enter a name with at least 2 characters.")
    .max(100, "Your name cannot exceed 100 characters.")
    .refine((name) => !/[\x00-\x1f\x7f]/.test(name), {
      message: "Your name cannot contain control characters.",
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function profileDisplayName(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "Orvio Member";
}

import { z } from "zod";
import { createEventSchema } from "@/lib/validations/event";

export const EVENT_CATEGORY_IDS = [
  "technology", "workshop", "cultural", "sports", "community", "other",
] as const;
export type EventCategory = typeof EVENT_CATEGORY_IDS[number];
export const EVENT_CATEGORIES = [
  { value: "technology", label: "Technology" },
  { value: "workshop", label: "Workshop" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
] as const;

export function eventCategory(value: unknown): EventCategory {
  return EVENT_CATEGORY_IDS.includes(value as EventCategory) ? value as EventCategory : "other";
}

export function eventCategoryLabel(value: unknown): string {
  return EVENT_CATEGORIES.find((item) => item.value === eventCategory(value))!.label;
}

export const eventDetailsSchema = createEventSchema.extend({
  category: z.enum(EVENT_CATEGORY_IDS).default("other"),
  banner_url: z.string().url("Choose a valid event banner.").max(2048).nullable().default(null),
}).strict();
export type EventDetailsInput = z.infer<typeof eventDetailsSchema>;

export const EVENT_BANNER_BUCKET = "event-banners";
export const MAX_BANNER_BYTES = 5 * 1024 * 1024;
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const bannerPathPattern = new RegExp(`^${uuid}/${uuid}\\.(jpg|png|webp)$`, "i");

export function bannerPathFromUrl(value: unknown, projectUrl: string | undefined): string | null {
  if (typeof value !== "string" || !projectUrl) return null;
  try {
    const url = new URL(value);
    const project = new URL(projectUrl);
    const prefix = `/storage/v1/object/public/${EVENT_BANNER_BUCKET}/`;
    if (url.origin !== project.origin || url.username || url.password || url.search || url.hash) return null;
    if (!url.pathname.startsWith(prefix)) return null;
    const path = url.pathname.slice(prefix.length);
    return bannerPathPattern.test(path) ? path : null;
  } catch {
    return null;
  }
}

export function ownedBannerUrl(value: string | null, userId: string, projectUrl: string | undefined): string | null {
  if (value === null) return null;
  const path = bannerPathFromUrl(value, projectUrl);
  if (!path || path.split("/")[0] !== userId) throw new Error("Choose a banner uploaded by your account.");
  return value;
}

export async function inspectBannerFile(file: File): Promise<{ extension: "jpg" | "png" | "webp" }> {
  const types = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
  if (!Object.hasOwn(types, file.type)) throw new Error("Choose a JPEG, PNG or WebP image.");
  if (!file.size) throw new Error("The selected image is empty.");
  if (file.size > MAX_BANNER_BYTES) throw new Error("Your banner must be 5 MB or smaller.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const matches = file.type === "image/png" ? png : file.type === "image/jpeg" ? jpeg : webp;
  if (!matches) throw new Error("The file contents do not match its image type. Choose another image.");
  return { extension: types[file.type as keyof typeof types] };
}

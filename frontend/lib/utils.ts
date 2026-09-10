import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEventDate(value: string | null | undefined) {
  if (!value) {
    return "Date TBA";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date TBA";
  }

  return date.toLocaleString();
}

export function formatParticipantCap(value: number | null | undefined) {
  if (value == null) {
    return "Unlimited";
  }

  return String(value);
}
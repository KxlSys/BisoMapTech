import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract a human-readable message from an unknown thrown value.
 * Supabase errors (PostgrestError / AuthError) are plain objects with a
 * `message` field — not `Error` instances — so `err instanceof Error` misses
 * them and swallows the real reason.
 */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue"): string {
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; error_description?: unknown; details?: unknown };
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.error_description === "string" && e.error_description) return e.error_description;
    if (typeof e.details === "string" && e.details) return e.details;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}


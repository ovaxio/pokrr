import { LIMITS } from "./types";

export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/[<>]/g, "");
  if (trimmed.length === 0 || trimmed.length > LIMITS.maxNameLength) return null;
  return trimmed;
}

export function sanitizeStory(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return raw.replace(/[<>]/g, "").slice(0, LIMITS.maxStoryLength);
}

export function sanitizeVoterId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(raw)) return null;
  return raw;
}

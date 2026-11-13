import { LIMITS, type ClientMessage } from "./types";

// "too_big" est contrôlé avant JSON.parse ; null = trame illisible ou sans `type` chaîne.
export function parseClientFrame(raw: unknown): ClientMessage | "too_big" | null {
  if (typeof raw !== "string") return null;
  if (raw.length > LIMITS.maxFrameLength) return "too_big";
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof msg !== "object" || msg === null || typeof (msg as { type?: unknown }).type !== "string") return null;
  return msg as ClientMessage;
}

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

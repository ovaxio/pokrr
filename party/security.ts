import type * as Party from "partykit/server";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_CONNECTIONS = 30;
const ipConnections = new Map<string, number[]>();

export function isRateLimited(ip: string | null): boolean {
  if (!ip) return false;
  const now = Date.now();
  const recent = (ipConnections.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_CONNECTIONS) {
    ipConnections.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipConnections.set(ip, recent);
  if (ipConnections.size > 10_000) {
    for (const [key, ts] of ipConnections) {
      if (ts.length === 0 || now - ts[ts.length - 1] > RATE_WINDOW_MS) {
        ipConnections.delete(key);
      }
    }
  }
  return false;
}

export function isOriginAllowed(req: Party.Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[^/]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/(www\.)?pokrr\.app$/.test(origin)) return true;
  if (process.env.POKRR_ALLOWED_ORIGINS) {
    const allowed = process.env.POKRR_ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    if (allowed.includes(origin)) return true;
  }
  return false;
}

export function clientIp(req: Party.Request): string | null {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return null;
}

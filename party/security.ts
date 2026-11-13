import { LIMITS } from "./types";

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

// Seau à jetons par connexion, temps injecté.
export type FrameBudget = { tokens: number; at: number };

export function newFrameBudget(now: number): FrameBudget {
  return { tokens: LIMITS.frameBurst, at: now };
}

export function spendFrame(budget: FrameBudget, now: number): boolean {
  const elapsed = Math.max(0, now - budget.at);
  budget.tokens = Math.min(LIMITS.frameBurst, budget.tokens + (elapsed / 1000) * LIMITS.framesPerSecond);
  budget.at = now;
  if (budget.tokens < 1) return false;
  budget.tokens -= 1;
  return true;
}

export function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  // localhost n'est une origine valable que si le Worker est lui-même joint en local (wrangler dev).
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    const host = new URL(req.url).hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
  }
  // Projet Vercel pokrr : domaine de prod, previews, alias de branche et d'équipe.
  if (/^https:\/\/pokrr\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/pokrr(-[a-z0-9-]+)?-ovaxios-projects\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/(www\.)?pokrr\.app$/.test(origin)) return true;
  if (process.env.POKRR_ALLOWED_ORIGINS) {
    const allowed = process.env.POKRR_ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    if (allowed.includes(origin)) return true;
  }
  return false;
}

export function clientIp(req: Request): string | null {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return null;
}

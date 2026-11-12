import { afterEach, describe, expect, it, vi } from "vitest";
import { isOriginAllowed, newFrameBudget, spendFrame } from "../../../party/security";

function req(origin: string | null, url = "https://pokrr.codeblend.workers.dev/parties/main/abc"): Request {
  return new Request(url, origin ? { headers: { origin } } : {});
}

describe("isOriginAllowed", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a request without Origin", () => {
    expect(isOriginAllowed(req(null))).toBe(true);
  });

  it.each([
    "https://pokrr.app",
    "https://www.pokrr.app",
    "https://pokrr.vercel.app",
    "https://pokrr-ovaxios-projects.vercel.app",
    "https://pokrr-f0xzgyce0-ovaxios-projects.vercel.app",
    "https://pokrr-git-fix-securite-lot1-ovaxios-projects.vercel.app",
  ])("accepts %s", (origin) => {
    expect(isOriginAllowed(req(origin))).toBe(true);
  });

  it.each([
    "https://evil.vercel.app",
    "https://nimporte-qui.vercel.app",
    "https://pokrr-evil.vercel.app",
    "https://pokrr.app.evil.example",
    "http://pokrr.app",
  ])("rejects %s", (origin) => {
    expect(isOriginAllowed(req(origin))).toBe(false);
  });

  it.each(["http://localhost:3000", "http://127.0.0.1:3000"])("accepts %s only when the Worker is local", (origin) => {
    expect(isOriginAllowed(req(origin, "http://localhost:1999/parties/main/abc"))).toBe(true);
    expect(isOriginAllowed(req(origin, "http://127.0.0.1:1999/parties/main/abc"))).toBe(true);
    expect(isOriginAllowed(req(origin))).toBe(false);
  });

  it("accepts an origin listed in POKRR_ALLOWED_ORIGINS", () => {
    vi.stubEnv("POKRR_ALLOWED_ORIGINS", "https://staging.example, https://autre.example");
    expect(isOriginAllowed(req("https://staging.example"))).toBe(true);
  });
});

describe("frame budget", () => {
  it("lets a 100 burst through, then refuses", () => {
    const b = newFrameBudget(0);
    for (let i = 0; i < 100; i++) expect(spendFrame(b, 0)).toBe(true);
    expect(spendFrame(b, 0)).toBe(false);
  });

  it("refills 40 tokens per second", () => {
    const b = newFrameBudget(0);
    for (let i = 0; i < 100; i++) spendFrame(b, 0);
    for (let i = 0; i < 40; i++) expect(spendFrame(b, 1000)).toBe(true);
    expect(spendFrame(b, 1000)).toBe(false);
  });

  it("never refuses default keyboard repeat (33/s)", () => {
    const b = newFrameBudget(0);
    for (let t = 0; t < 60_000; t += 1000 / 33) expect(spendFrame(b, t)).toBe(true);
  });

  it("refuses the fastest keyboard repeat (66/s) after 3.5 to 4 s", () => {
    const b = newFrameBudget(0);
    let failedAt = -1;
    for (let t = 0; t < 10_000; t += 1000 / 66) {
      if (!spendFrame(b, t)) {
        failedAt = t;
        break;
      }
    }
    expect(failedAt).toBeGreaterThanOrEqual(3500);
    expect(failedAt).toBeLessThanOrEqual(4000);
  });
});

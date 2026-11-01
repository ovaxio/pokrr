import { describe, it, expect } from "vitest";
import { readPositiveMs, DEFAULT_ADMIN_GRACE_MS, DEFAULT_IDLE_TIMEOUT_MS } from "../../../party/config";

const K = "POKRR_TEST_MS";
const FALLBACK = 12345;

describe("readPositiveMs", () => {
  it("returns the fallback when env is undefined", () => {
    expect(readPositiveMs(undefined, K, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback when env is null", () => {
    expect(readPositiveMs(null, K, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback when the key is absent", () => {
    expect(readPositiveMs({}, K, FALLBACK)).toBe(FALLBACK);
  });

  it("parses a numeric string (wrangler vars are strings)", () => {
    expect(readPositiveMs({ [K]: "2000" }, K, FALLBACK)).toBe(2000);
  });

  it("accepts a number", () => {
    expect(readPositiveMs({ [K]: 2000 }, K, FALLBACK)).toBe(2000);
  });

  it("returns the fallback for zero", () => {
    expect(readPositiveMs({ [K]: "0" }, K, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback for a negative value", () => {
    expect(readPositiveMs({ [K]: "-5" }, K, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback for a non-numeric string", () => {
    expect(readPositiveMs({ [K]: "abc" }, K, FALLBACK)).toBe(FALLBACK);
  });

  it("returns the fallback for Infinity", () => {
    expect(readPositiveMs({ [K]: "Infinity" }, K, FALLBACK)).toBe(FALLBACK);
  });
});

describe("default durations", () => {
  it("keeps the decided values (1 min grace, 2 h idle timeout)", () => {
    expect(DEFAULT_ADMIN_GRACE_MS).toBe(60_000);
    expect(DEFAULT_IDLE_TIMEOUT_MS).toBe(7_200_000);
  });
});

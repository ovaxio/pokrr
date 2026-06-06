import { describe, it, expect } from "vitest";
import { sanitizeName, sanitizeStory, sanitizeVoterId } from "../../../party/sanitize";

describe("sanitizeName", () => {
  it("accepts a valid name", () => {
    expect(sanitizeName("Alice")).toBe("Alice");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeName("  Bob  ")).toBe("Bob");
  });

  it("strips < and > characters", () => {
    expect(sanitizeName("<script>")).toBe("script");
  });

  it("rejects non-string input", () => {
    expect(sanitizeName(42)).toBeNull();
    expect(sanitizeName(null)).toBeNull();
    expect(sanitizeName(undefined)).toBeNull();
  });

  it("rejects empty string", () => {
    expect(sanitizeName("")).toBeNull();
  });

  it("rejects whitespace-only string", () => {
    expect(sanitizeName("   ")).toBeNull();
  });

  it("rejects name longer than 24 chars", () => {
    expect(sanitizeName("A".repeat(25))).toBeNull();
  });

  it("accepts name of exactly 24 chars", () => {
    const name = "A".repeat(24);
    expect(sanitizeName(name)).toBe(name);
  });

  it("returns null when XSS makes name empty after stripping", () => {
    expect(sanitizeName("<><>")).toBeNull();
  });
});

describe("sanitizeStory", () => {
  it("accepts valid story", () => {
    expect(sanitizeStory("Auth refactor")).toBe("Auth refactor");
  });

  it("strips < and > characters", () => {
    expect(sanitizeStory("<img onerror=alert(1)>")).toBe("img onerror=alert(1)");
  });

  it("truncates to 200 chars", () => {
    const long = "X".repeat(300);
    expect(sanitizeStory(long)).toHaveLength(200);
  });

  it("accepts empty string", () => {
    expect(sanitizeStory("")).toBe("");
  });

  it("rejects non-string input", () => {
    expect(sanitizeStory(null)).toBeNull();
    expect(sanitizeStory(42)).toBeNull();
  });
});

describe("sanitizeVoterId", () => {
  it("accepts a valid nanoid-style id", () => {
    expect(sanitizeVoterId("abc123_-XYZ")).toBe("abc123_-XYZ");
  });

  it("rejects path traversal attempt", () => {
    expect(sanitizeVoterId("../../etc/passwd")).toBeNull();
  });

  it("rejects ids longer than 64 chars", () => {
    expect(sanitizeVoterId("a".repeat(65))).toBeNull();
  });

  it("accepts id of exactly 64 chars", () => {
    const id = "a".repeat(64);
    expect(sanitizeVoterId(id)).toBe(id);
  });

  it("rejects empty string", () => {
    expect(sanitizeVoterId("")).toBeNull();
  });

  it("rejects non-string input", () => {
    expect(sanitizeVoterId(null)).toBeNull();
    expect(sanitizeVoterId(undefined)).toBeNull();
    expect(sanitizeVoterId(42)).toBeNull();
  });

  it("rejects ids with special characters", () => {
    expect(sanitizeVoterId("voter@domain.com")).toBeNull();
    expect(sanitizeVoterId("voter id")).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { changelog } from "@/content/changelog";

describe("changelog", () => {
  it("les entrées vont de la plus récente à la plus ancienne, avec des dates réelles", () => {
    expect(changelog.length).toBeGreaterThan(0);
    for (const { date } of changelog) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(date);
    }
    for (let i = 1; i < changelog.length; i++) {
      expect(changelog[i - 1].date >= changelog[i].date).toBe(true);
    }
  });

  it("les textes FR et EN sont remplis et sans tiret cadratin", () => {
    for (const entry of changelog) {
      for (const locale of ["fr", "en"] as const) {
        for (const field of ["title", "body"] as const) {
          const text = entry.text[locale][field];
          expect(text.trim().length).toBeGreaterThan(0);
          expect(text).not.toContain("\u2014");
        }
      }
    }
  });
});

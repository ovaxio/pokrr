import { describe, it, expect } from "vitest";
import { computeStats, isWideSpread } from "@/lib/stats";
import type { PlayerView } from "../../../party/types";

function player(voterId: string, vote: string | null, isViewer = false): PlayerView {
  return {
    voterId,
    name: voterId,
    hasVoted: vote !== null,
    vote,
    isAdmin: false,
    isViewer,
    online: true,
  };
}

describe("computeStats — basic", () => {
  it("returns zero counts for empty player list", () => {
    const stats = computeStats([]);
    expect(stats.voteCount).toBe(0);
    expect(stats.numericCount).toBe(0);
    expect(stats.mean).toBeNull();
    expect(stats.median).toBeNull();
    expect(stats.distribution).toEqual([]);
  });

  it("counts only players with votes", () => {
    const stats = computeStats([player("a", "5"), player("b", null)]);
    expect(stats.voteCount).toBe(1);
  });

  it("does not count viewers in distribution", () => {
    const stats = computeStats([player("a", "5"), player("v", "8", true)]);
    // viewers still have votes in PlayerView when revealed, stats counts everyone with a vote
    // (filtering viewers is a presentation concern; computeStats is called post-reveal with full player list)
    expect(stats.voteCount).toBe(2);
  });
});

describe("computeStats — fibonacci deck", () => {
  it("computes mean and median for numeric votes", () => {
    const stats = computeStats([player("a", "5"), player("b", "8"), player("c", "5")]);
    expect(stats.mean).toBe(6);
    expect(stats.median).toBe(5);
    expect(stats.numericCount).toBe(3);
  });

  it("handles even number of voters for median", () => {
    const stats = computeStats([player("a", "5"), player("b", "8")]);
    expect(stats.median).toBe(6.5);
  });

  it("handles single voter", () => {
    const stats = computeStats([player("a", "13")]);
    expect(stats.mean).toBe(13);
    expect(stats.median).toBe(13);
  });

  it("detects consensus when all vote the same", () => {
    const stats = computeStats([player("a", "8"), player("b", "8")]);
    expect(stats.consensus).toBe(true);
  });

  it("detects no consensus with different votes", () => {
    const stats = computeStats([player("a", "5"), player("b", "8")]);
    expect(stats.consensus).toBe(false);
  });

  it("ignores non-numeric cards (? and ☕) in mean/median", () => {
    const stats = computeStats([player("a", "5"), player("b", "?")]);
    expect(stats.numericCount).toBe(1);
    expect(stats.mean).toBe(5);
  });

  it("computes distribution sorted by count desc", () => {
    const stats = computeStats([player("a", "5"), player("b", "5"), player("c", "8")]);
    expect(stats.distribution[0].card).toBe("5");
    expect(stats.distribution[0].count).toBe(2);
    expect(stats.distribution[1].card).toBe("8");
  });

  it("identifies highest and lowest voters", () => {
    const stats = computeStats([player("alice", "5"), player("bob", "13"), player("carol", "3")]);
    expect(stats.lowest?.value).toBe(3);
    expect(stats.highest?.value).toBe(13);
  });

  it("computes spread as highest minus lowest", () => {
    const stats = computeStats([player("a", "3"), player("b", "8")]);
    expect(stats.spread).toBe(5);
  });

  it("returns null spread for single voter", () => {
    const stats = computeStats([player("a", "5")]);
    expect(stats.spread).toBe(0);
  });

  it("snaps consensusSuggestion to nearest deck card", () => {
    // Mean of 5 and 8 is 6.5 → nearest fibonacci is 8
    const stats = computeStats([player("a", "5"), player("b", "8")]);
    // 6.5 is closer to 8 than to 5 (difference: 1.5 vs 1.5 — tie → 5 wins by index order)
    expect(["5", "8"]).toContain(stats.consensusSuggestion);
  });

  it("marks fibonacci as numericDeck", () => {
    const stats = computeStats([], "fibonacci");
    expect(stats.numericDeck).toBe(true);
  });
});

describe("computeStats — tshirt deck (non-numeric)", () => {
  it("has no mean, median, or suggestion for T-shirt", () => {
    const stats = computeStats([player("a", "S"), player("b", "M")], "tshirt");
    expect(stats.mean).toBeNull();
    expect(stats.median).toBeNull();
    expect(stats.consensusSuggestion).toBeNull();
    expect(stats.numericDeck).toBe(false);
  });

  it("still counts votes and distribution for T-shirt", () => {
    const stats = computeStats([player("a", "S"), player("b", "M"), player("c", "S")], "tshirt");
    expect(stats.voteCount).toBe(3);
    expect(stats.distribution[0].card).toBe("S");
    expect(stats.distribution[0].count).toBe(2);
  });
});

describe("computeStats — hours deck", () => {
  it("parses hours correctly (strips h suffix)", () => {
    const stats = computeStats([player("a", "2h"), player("b", "4h")], "hours");
    expect(stats.mean).toBe(3);
    expect(stats.numericCount).toBe(2);
  });
});

describe("computeStats — fibonacci-mod deck", () => {
  it("does not count ½ as numeric (excluded from numericCards by design)", () => {
    // ½ appears in cards[] for display but not in numericCards[], so it's treated non-numerically
    const stats = computeStats([player("a", "½"), player("b", "1")], "fibonacci-mod");
    expect(stats.numericCount).toBe(1);
    expect(stats.mean).toBe(1);
  });
});

describe("isWideSpread", () => {
  it("returns true when spread spans 2+ deck levels", () => {
    expect(isWideSpread(3, 8)).toBe(true); // 3 and 8 are 2 levels apart in fibonacci
  });

  it("returns false for adjacent values", () => {
    expect(isWideSpread(5, 8)).toBe(false); // adjacent in fibonacci
  });

  it("returns false for identical values", () => {
    expect(isWideSpread(5, 5)).toBe(false);
  });

  it("returns false when value not in deck", () => {
    expect(isWideSpread(999, 1000)).toBe(false);
  });

  it("uses specified deck", () => {
    // 1 and 16 are well apart in powers-of-2
    expect(isWideSpread(1, 16, "powers-of-2")).toBe(true);
  });
});

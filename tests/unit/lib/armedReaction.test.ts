import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { getArmedItem, storeArmedItem } from "../../../src/lib/armedReaction";

const KEY = "pokrr:reactionItem";
const OLD_KEY = "pokrr:reactionEmoji";
let data: Record<string, string>;

beforeEach(() => {
  data = {};
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => (k in data ? data[k] : null),
      setItem: (k: string, v: string) => {
        data[k] = v;
      },
      removeItem: (k: string) => {
        delete data[k];
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getArmedItem", () => {
  it("reads back a valid emoji and a paper object", () => {
    data[KEY] = "👏";
    expect(getArmedItem()).toBe("👏");
    data[KEY] = "paper-plane";
    expect(getArmedItem()).toBe("paper-plane");
  });

  it("returns null for an absent key and for corrupted values", () => {
    expect(getArmedItem()).toBeNull();
    for (const bad of ["💩", "plane", "paper-boat", "\u{1F44D}️", '"👍"', ""]) {
      data[KEY] = bad;
      expect(getArmedItem()).toBeNull();
    }
  });

  it("ignores a value stored under the old emoji key", () => {
    data[OLD_KEY] = "👏";
    expect(getArmedItem()).toBeNull();
  });

  it("is null without a window (SSR)", () => {
    vi.unstubAllGlobals();
    expect(getArmedItem()).toBeNull();
  });
});

describe("storeArmedItem", () => {
  it("writes an item and removes the key for null", () => {
    storeArmedItem("paper-ball");
    expect(data[KEY]).toBe("paper-ball");
    storeArmedItem(null);
    expect(KEY in data).toBe(false);
  });

  it("overwrites a corrupted value on the next arming", () => {
    data[KEY] = "💩";
    storeArmedItem("🚀");
    expect(getArmedItem()).toBe("🚀");
  });
});

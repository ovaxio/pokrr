import { describe, it, expect } from "vitest";
import {
  PAPER_ART,
  REACTION_CLIENT_COOLDOWN_MS,
  alternateAnnouncement,
  isPaperItem,
  kindOf,
  planProjectile,
  reactionItemLabel,
  shouldAnnounce,
  simulateFlight,
  type ProjectileKind,
} from "../../../src/lib/projectiles";
import { REACTION_ITEMS } from "../../../party/types";

const KINDS: ProjectileKind[] = ["emoji", "ball", "plane"];
const SIZE: Record<ProjectileKind, { w: number; h: number }> = {
  emoji: { w: 40, h: 40 },
  ball: { w: 28, h: 28 },
  plane: { w: 48, h: 24 },
};
const KEEL = 0.08 * 24;
const PLANE_TOUCH_MS = 950;

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Case = { vw: number; vh: number; left: number; top: number; bottom: number; cx: number; dir: 1 | -1; seed: number };

// Grille réaliste : 3 écrans, cartes 64x96, 3 hauteurs, 5 positions, 2 sens, 8 graines (720 lancers par objet).
function grid(): Case[] {
  const out: Case[] = [];
  for (const [vw, vh] of [
    [360, 640],
    [1280, 800],
    [2560, 1440],
  ]) {
    for (const top of [178, 300, vh - 104]) {
      for (const f of [0, 0.25, 0.5, 0.75, 1]) {
        const left = f * (vw - 64);
        for (const dir of [1, -1] as const) {
          for (let seed = 1; seed <= 8; seed++) {
            out.push({ vw, vh, left, top, bottom: top + 96, cx: left + 32, dir, seed });
          }
        }
      }
    }
  }
  return out;
}

function fly(kind: ProjectileKind, c: Case) {
  const flight = simulateFlight({
    kind,
    target: { left: c.left, top: c.top, width: 64, height: 96 },
    viewport: { width: c.vw, height: c.vh },
    dir: c.dir,
    rng: mulberry32(c.seed * 7919 + c.top),
  });
  if (!flight) throw new Error("flight expected");
  return flight;
}

const CASES = grid();
const each = (fn: (kind: ProjectileKind, c: Case, f: ReturnType<typeof fly>) => void, kinds = KINDS) => {
  for (const kind of kinds) for (const c of CASES) fn(kind, c, fly(kind, c));
};

describe("kindOf / isPaperItem / REACTION_ITEMS", () => {
  it("maps paper items to their kind and everything else to emoji", () => {
    expect(kindOf("paper-plane")).toBe("plane");
    expect(kindOf("paper-ball")).toBe("ball");
    expect(isPaperItem("paper-plane")).toBe(true);
    expect(isPaperItem("paper-ball")).toBe(true);
    for (const item of REACTION_ITEMS.slice(0, 10)) {
      expect(kindOf(item)).toBe("emoji");
      expect(isPaperItem(item)).toBe(false);
    }
  });

  it("has 12 items, the paper objects last (bar order)", () => {
    expect(REACTION_ITEMS).toHaveLength(12);
    expect(REACTION_ITEMS.slice(-2)).toEqual(["paper-plane", "paper-ball"]);
  });
});

describe("reactionItemLabel", () => {
  it("uses the dictionary for paper items and the emoji itself otherwise", () => {
    const labels = { reactionItemPlane: "P", reactionItemBall: "B" };
    expect(reactionItemLabel("paper-plane", labels)).toBe("P");
    expect(reactionItemLabel("paper-ball", labels)).toBe("B");
    expect(reactionItemLabel("👏", labels)).toBe("👏");
  });
});

describe("target outside the viewport", () => {
  it("returns null for simulateFlight and planProjectile (with and without reduced motion)", () => {
    const vp = { width: 1000, height: 800 };
    const boxes = [
      { left: 2000, top: 300, width: 64, height: 96 },
      { left: 300, top: -500, width: 64, height: 96 },
      { left: -200, top: 300, width: 64, height: 96 },
    ];
    for (const kind of KINDS) {
      for (const target of boxes) {
        expect(simulateFlight({ kind, target, viewport: vp, dir: 1, rng: mulberry32(1) })).toBeNull();
        for (const reducedMotion of [false, true]) {
          expect(planProjectile({ kind, target, viewport: vp, reducedMotion, dir: 1, rng: mulberry32(1) })).toBeNull();
        }
      }
    }
  });
});

describe("start and frame list", () => {
  it("starts fully off-screen on the chosen side", () => {
    each((_k, c, f) => {
      const first = f.frames[0];
      expect(first.t).toBe(0);
      if (c.dir === 1) expect(first.x + f.width / 2).toBeLessThan(0);
      else expect(first.x - f.width / 2).toBeGreaterThan(c.vw);
    });
  });

  it("has sorted frames, a final fade and finite values", () => {
    each((_k, _c, f) => {
      for (let i = 1; i < f.frames.length; i++) expect(f.frames[i].t).toBeGreaterThanOrEqual(f.frames[i - 1].t);
      expect(f.frames.at(-1)!.opacity).toBe(0);
      for (const fr of f.frames.slice(0, -1)) expect(fr.opacity).toBe(1);
      for (const fr of f.frames) {
        for (const v of Object.values(fr)) expect(Number.isFinite(v)).toBe(true);
      }
    });
  });

  it("has the documented sprite sizes", () => {
    for (const kind of KINDS) {
      const f = fly(kind, CASES[0]);
      expect(f.width).toBe(SIZE[kind].w);
      expect(f.height).toBe(SIZE[kind].h);
    }
  });
});

describe("contact and rest on the card", () => {
  it("first contact stays within 26 px of the card centre", () => {
    each((_k, c, f) => {
      expect(Math.abs(f.impacts[0].x - c.cx)).toBeLessThanOrEqual(26 + 1e-9);
    });
  });

  it("rests on the card with a bounded drift", () => {
    each((_k, c, f) => {
      const stop = f.frames.at(-1)!.x;
      expect(Math.abs(stop - c.cx)).toBeLessThanOrEqual(26.5);
      expect(Math.abs(stop - f.impacts[0].x)).toBeLessThanOrEqual(40.5);
    });
  });

  it("never sinks below the ground line after the first contact", () => {
    each((_k, c, f) => {
      const last = f.frames.at(-1)!;
      expect(last.y + f.height / 2).toBeCloseTo(c.bottom, 9);
      for (const fr of f.frames) {
        if (fr.t >= f.impacts[0].t) expect(fr.y + (f.height / 2) * fr.scaleY).toBeLessThanOrEqual(c.bottom + 1e-9);
      }
    }, ["emoji", "ball"]);
  });

  it("plane keel rests 1.92 px under the baseline box", () => {
    each((_k, c, f) => {
      const last = f.frames.at(-1)!;
      expect(last.y + f.height / 2 - c.bottom).toBeCloseTo(KEEL, 9);
    }, ["plane"]);
  });

  it("first contact instant and position", () => {
    each((_k, c, f) => {
      expect(f.impacts[0].t).toBe(770);
      const fr = f.frames.find((p) => p.t === 770)!;
      expect(fr.x).toBe(f.impacts[0].x);
      expect(fr.y).toBe(c.bottom - f.height / 2);
      expect(f.impacts[0].speed).toBeGreaterThan(0);
    }, ["emoji", "ball"]);
    each((_k, c, f) => {
      expect(f.impacts[0].t).toBe(PLANE_TOUCH_MS);
      const fr = f.frames.find((p) => p.t === PLANE_TOUCH_MS)!;
      expect(fr.x).toBeCloseTo(f.impacts[0].x, 9);
      expect(fr.y).toBeCloseTo(c.bottom - f.height / 2 + KEEL, 9);
    }, ["plane"]);
  });
});

describe("gravity", () => {
  it("flies on a 0.0039 px/ms² parabola sampled every 16 ms", () => {
    each((_k, _c, f) => {
      const air = f.frames.filter((p) => p.t < 770);
      expect(air.length).toBeGreaterThan(40);
      for (let i = 1; i < air.length; i++) expect(air[i].t - air[i - 1].t).toBe(16);
      for (let i = 2; i < air.length; i++) {
        const ddx = air[i].x - 2 * air[i - 1].x + air[i - 2].x;
        const ddy = air[i].y - 2 * air[i - 1].y + air[i - 2].y;
        expect(Math.abs(ddx)).toBeLessThan(1e-9);
        expect(Math.abs(ddy / 256 - 0.0039) / 0.0039).toBeLessThan(1e-9);
      }
    }, ["emoji", "ball"]);
  });
});

describe("contacts and durations", () => {
  it("counts contacts per object, and the randomness bites", () => {
    const counts: Record<string, Set<number>> = { emoji: new Set(), ball: new Set(), plane: new Set() };
    each((k, _c, f) => {
      const n = f.impacts.length;
      counts[k].add(n);
      if (k === "emoji") expect([2, 3]).toContain(n);
      if (k === "ball") expect(n).toBeGreaterThanOrEqual(2);
      if (k === "ball") expect(n).toBeLessThanOrEqual(4);
      if (k === "plane") expect(n).toBe(1);
    });
    expect(counts["emoji"].has(2) && counts["emoji"].has(3)).toBe(true);
    expect(counts["ball"].has(2) && counts["ball"].has(3)).toBe(true);
  });

  it("keeps durations in the documented ranges", () => {
    const range: Record<ProjectileKind, [number, number]> = { emoji: [1550, 2000], ball: [1600, 2100], plane: [1700, 1950] };
    each((k, _c, f) => {
      const total = f.frames.at(-1)!.t;
      expect(total).toBeGreaterThanOrEqual(range[k][0]);
      expect(total).toBeLessThanOrEqual(range[k][1]);
    });
  });

  it("keeps the apex on screen", () => {
    each((k, c, f) => {
      for (const fr of f.frames) {
        const inside = fr.x - f.width / 2 >= 0 && fr.x + f.width / 2 <= c.vw;
        if (!inside) continue;
        const top = fr.y - f.height / 2;
        if (k === "plane") expect(top).toBeGreaterThanOrEqual(0);
        else expect(top).toBeGreaterThanOrEqual(8 - 1e-6);
      }
    });
  });
});

describe("rotation", () => {
  it("emoji turns twice in the direction of travel then lands upright (4 pi)", () => {
    each((_k, c, f) => {
      const air = f.frames.filter((p) => p.t <= 770);
      for (let i = 1; i < air.length; i++) expect((air[i].angle - air[i - 1].angle) * c.dir).toBeGreaterThanOrEqual(0);
      for (const fr of f.frames.filter((p) => p.t >= 770)) expect(fr.angle).toBe(c.dir * 4 * Math.PI);
    }, ["emoji"]);
  });

  it("ball rolls without slipping after the last contact", () => {
    each((_k, _c, f) => {
      const lastT = f.impacts.at(-1)!.t;
      const rolling = f.frames.filter((p) => p.t >= lastT);
      const ref = rolling[0].angle - rolling[0].x / 14;
      for (const fr of rolling) expect(fr.angle - fr.x / 14).toBeCloseTo(ref, 9);
    }, ["ball"]);
  });

  it("plane keeps the mirror, follows the slope and ends flat", () => {
    each((_k, c, f) => {
      for (const fr of f.frames) {
        expect(fr.scaleX).toBe(c.dir);
        expect(fr.scaleY).toBe(1);
      }
      for (const fr of f.frames.slice(-3)) expect(fr.angle).toBe(0);
      const touch = f.frames.find((p) => p.t === PLANE_TOUCH_MS)!;
      expect(Math.abs(touch.angle)).toBeLessThan(0.6);
    }, ["plane"]);
  });
});

describe("squash", () => {
  it("squashes at every contact with the base kept on the ground", () => {
    each((_k, c, f) => {
      for (const imp of f.impacts) {
        const fr = f.frames.find((p) => p.t > imp.t && p.t <= imp.t + 30)!;
        expect(fr).toBeDefined();
        const s = fr.scaleX - 1;
        expect(s).toBeGreaterThan(0);
        expect(s).toBeLessThanOrEqual(0.05 + 1e-12);
        expect(s).toBeCloseTo(0.05 * Math.min(1, imp.speed / 1.4), 9);
        expect(fr.scaleY).toBeCloseTo(1 - s, 9);
        expect(fr.y + (f.height / 2) * fr.scaleY).toBeCloseTo(c.bottom, 9);
      }
    }, ["emoji", "ball"]);
  });
});

describe("determinism and randomness", () => {
  it("gives identical frames for the same seed", () => {
    for (const kind of KINDS) {
      expect(fly(kind, CASES[10])).toEqual(fly(kind, CASES[10]));
    }
  });

  it("spreads the first contact across seeds on a fixed card", () => {
    for (const kind of KINDS) {
      const xs: number[] = [];
      for (let seed = 1; seed <= 20; seed++) {
        const f = simulateFlight({
          kind,
          target: { left: 600, top: 300, width: 64, height: 96 },
          viewport: { width: 1280, height: 800 },
          dir: 1,
          rng: mulberry32(seed),
        })!;
        xs.push(f.impacts[0].x);
      }
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(6);
    }
  });
});

describe("planProjectile keyframes", () => {
  const RE = /^translate3d\((\S+)px, (\S+)px, 0\) scale\((\S+), (\S+)\) rotate\((\S+)rad\)$/;
  const target = { left: 600, top: 300, width: 64, height: 96 };
  const viewport = { width: 1280, height: 800 };

  it("serialises the simulated frames with one transform shape", () => {
    for (const kind of KINDS) {
      const flight = simulateFlight({ kind, target, viewport, dir: -1, rng: mulberry32(5) })!;
      const plan = planProjectile({ kind, target, viewport, reducedMotion: false, dir: -1, rng: mulberry32(5) })!;
      expect(plan.width).toBe(SIZE[kind].w);
      expect(plan.height).toBe(SIZE[kind].h);
      expect(plan.keyframes).toHaveLength(flight.frames.length);
      expect(plan.durationMs).toBe(flight.frames.at(-1)!.t);
      plan.keyframes.forEach((k, i) => {
        const m = RE.exec(String(k.transform));
        expect(m).not.toBeNull();
        const fr = flight.frames[i];
        expect(Number(m![1])).toBeCloseTo(fr.x - plan.width / 2, 9);
        expect(Number(m![2])).toBeCloseTo(fr.y - plan.height / 2, 9);
        expect(Number(m![3])).toBeCloseTo(fr.scaleX, 9);
        expect(Number(m![4])).toBeCloseTo(fr.scaleY, 9);
        expect(Number(m![5])).toBeCloseTo(fr.angle, 9);
        expect(k.opacity).toBe(fr.opacity);
        if (i > 0) expect(k.offset as number).toBeGreaterThanOrEqual(plan.keyframes[i - 1].offset as number);
      });
      expect(plan.keyframes[0].offset).toBe(0);
      expect(plan.keyframes.at(-1)!.offset).toBe(1);
    }
  });
});

describe("card shake", () => {
  const SHAKE_RE = /^translate\((\S+)px, (\S+)px\) rotate\((\S+)deg\)$/;
  const nums = (k: Keyframe) => {
    const m = SHAKE_RE.exec(String(k.transform));
    expect(m).not.toBeNull();
    return [Number(m![1]), Number(m![2]), Number(m![3])];
  };
  const viewport = { width: 1280, height: 800 };

  it("starts at the first contact and lasts 220 ms with a closed 4-frame loop", () => {
    for (const kind of KINDS) {
      const plan = planProjectile({
        kind,
        target: { left: 600, top: 300, width: 64, height: 96 },
        viewport,
        reducedMotion: false,
        dir: 1,
        rng: mulberry32(42),
      })!;
      expect(plan.shake!.delayMs).toBe(kind === "plane" ? PLANE_TOUCH_MS : 770);
      expect(plan.shake!.durationMs).toBe(220);
      expect(plan.shake!.keyframes).toHaveLength(4);
      expect(plan.shake!.keyframes[0].transform).toBe("translate(0px, 0px) rotate(0deg)");
      expect(plan.shake!.keyframes[3].transform).toBe("translate(0px, 0px) rotate(0deg)");
    }
  });

  it("is full strength (3 px, 1.8 deg) for a fast ballistic contact", () => {
    for (const kind of ["emoji", "ball"] as const) {
      const target = { left: 600, top: 300, width: 64, height: 96 };
      const flight = simulateFlight({ kind, target, viewport, dir: 1, rng: mulberry32(42) })!;
      expect(flight.impacts[0].speed).toBeGreaterThanOrEqual(1.4);
      const plan = planProjectile({ kind, target, viewport, reducedMotion: false, dir: 1, rng: mulberry32(42) })!;
      const [a, b, c] = nums(plan.shake!.keyframes[1]);
      expect(a).toBeCloseTo(3, 9);
      expect(b).toBeCloseTo(2.1, 9);
      expect(c).toBeCloseTo(1.8, 9);
      const [d, e, g] = nums(plan.shake!.keyframes[2]);
      expect(d).toBeCloseTo(-1.5, 9);
      expect(e).toBeCloseTo(0, 9);
      expect(g).toBeCloseTo(-0.9, 9);
    }
  });

  it("is lighter for the plane (0.6 to 1.5 px)", () => {
    const plan = planProjectile({
      kind: "plane",
      target: { left: 600, top: 300, width: 64, height: 96 },
      viewport,
      reducedMotion: false,
      dir: 1,
      rng: mulberry32(42),
    })!;
    const [a] = nums(plan.shake!.keyframes[1]);
    expect(a).toBeGreaterThanOrEqual(0.6);
    expect(a).toBeLessThanOrEqual(1.5);
  });
});

describe("reduced motion", () => {
  it("fades in resting on the baseline, no motion, no shake", () => {
    const target = { left: 600, top: 300, width: 64, height: 96 };
    const bottom = 396;
    for (const kind of KINDS) {
      const plan = planProjectile({
        kind,
        target,
        viewport: { width: 1280, height: 800 },
        reducedMotion: true,
        dir: 1,
        rng: mulberry32(1),
      })!;
      const { w, h } = SIZE[kind];
      const restY = bottom - h / 2 + (kind === "plane" ? KEEL : 0);
      const expected = `translate3d(${632 - w / 2}px, ${restY - h / 2}px, 0)`;
      expect(plan.keyframes).toHaveLength(4);
      for (const k of plan.keyframes) {
        expect(k.transform).toBe(expected);
        expect(String(k.transform)).not.toMatch(/scale|rotate/);
      }
      expect(plan.keyframes.map((k) => k.opacity)).toEqual([0, 1, 1, 0]);
      expect(plan.keyframes.map((k) => k.offset)).toEqual([0, 0.15, 0.8, 1]);
      expect(plan.durationMs).toBe(1300);
      expect(plan.shake).toBeNull();
    }
  });
});

describe("PAPER_ART", () => {
  it("holds the SVG data of the two paper objects, without any style key", () => {
    expect(PAPER_ART["paper-plane"].viewBox).toBe("0 0 48 24");
    expect(PAPER_ART["paper-plane"].paths).toHaveLength(3);
    expect(PAPER_ART["paper-ball"].viewBox).toBe("0 0 30 30");
    expect(PAPER_ART["paper-ball"].paths).toHaveLength(2);
    for (const art of Object.values(PAPER_ART)) {
      for (const p of art.paths) expect("style" in p).toBe(false);
    }
  });
});

describe("shouldAnnounce", () => {
  it("announces first time and after 2 s only", () => {
    expect(shouldAnnounce(5000, null)).toBe(true);
    expect(shouldAnnounce(5000, 3001)).toBe(false);
    expect(shouldAnnounce(5000, 3000)).toBe(true);
  });
});

describe("alternateAnnouncement", () => {
  it("gives two different strings for two identical consecutive texts", () => {
    const text = "Alice a envoyé 👍 à Bob";
    const first = alternateAnnouncement(text, true);
    const second = alternateAnnouncement(text, false);
    expect(first).not.toBe(second);
    expect(first.trim()).toBe(second.trim());
  });
});

describe("REACTION_CLIENT_COOLDOWN_MS", () => {
  it("is the 1 s server cooldown plus a 250 ms margin", () => {
    expect(REACTION_CLIENT_COOLDOWN_MS).toBe(1250);
  });
});

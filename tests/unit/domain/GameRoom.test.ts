import { describe, it, expect } from "vitest";
import { GameRoom } from "../../../party/domain/GameRoom";
import { GameError } from "../../../party/domain/GameError";
import { REACTION_ITEMS } from "../../../party/types";

// trackConnection + join in one call. Omit asViewer to use the game's default.
function join(room: GameRoom, connId: string, voterId: string, name: string, asViewer?: boolean) {
  room.trackConnection(connId);
  room.join(connId, voterId, name, asViewer);
}

describe("GameRoom — join", () => {
  it("first joiner becomes admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    const state = room.snapshot("test");
    expect(state.players[0].isAdmin).toBe(true);
  });

  it("first joiner becomes viewer by default (facilitator pattern)", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice"); // asViewer=undefined → first player defaults to viewer
    expect(room.snapshot("test").players[0].isViewer).toBe(true);
  });

  it("first joiner can opt out of viewer with asViewer=false", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(room.snapshot("test").players[0].isViewer).toBe(false);
  });

  it("subsequent joiners are not viewers by default", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    join(room, "c2", "bob", "Bob");
    const bob = room.snapshot("test").players.find((p) => p.voterId === "bob")!;
    expect(bob.isViewer).toBe(false);
  });

  it("subsequent joiners can opt-in as viewer", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    join(room, "c2", "bob", "Bob", true);
    const bob = room.snapshot("test").players.find((p) => p.voterId === "bob")!;
    expect(bob.isViewer).toBe(true);
  });

  it("reconnecting player does not create a duplicate", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    room.join("c2", "alice", "Alice");
    expect(room.snapshot("test").players).toHaveLength(1);
  });

  it("deduplicates names — second Alice becomes Alice (2)", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    join(room, "c2", "bob", "Alice");
    const bob = room.snapshot("test").players.find((p) => p.voterId === "bob")!;
    expect(bob.name).toBe("Alice (2)");
  });

  it("deduplicates names incrementally — Alice, Alice (2), Alice (3)", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    join(room, "c2", "bob", "Alice");
    join(room, "c3", "carol", "Alice");
    const carol = room.snapshot("test").players.find((p) => p.voterId === "carol")!;
    expect(carol.name).toBe("Alice (3)");
  });

  it("rejects join when room is full", () => {
    const room = new GameRoom();
    for (let i = 0; i < 50; i++) {
      join(room, `c${i}`, `voter-${i}`, `Player ${i}`);
    }
    expect(() => join(room, "c50", "voter-51", "Extra")).toThrow(GameError);
    expect(() => join(room, "c50", "voter-51", "Extra")).toThrow("Salle pleine");
  });

  it("first-connection priority grants admin to late-joining CP", () => {
    const room = new GameRoom();
    // CP connects first but does not join immediately
    room.trackConnection("cp-conn");
    // Dev arrives and joins before CP submits the modal
    join(room, "dev-conn", "dev", "Dev");
    // CP now joins — should still be granted admin
    room.join("cp-conn", "cp", "CP");
    const cp = room.snapshot("test").players.find((p) => p.voterId === "cp")!;
    expect(cp.isAdmin).toBe(true);
  });
});

describe("GameRoom — vote", () => {
  it("records a vote", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // voter+admin
    room.vote("alice", "5");
    const alice = room.snapshot("test").players.find((p) => p.voterId === "alice")!;
    expect(alice.hasVoted).toBe(true);
  });

  it("hides vote value before reveal", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.vote("alice", "5");
    const alice = room.snapshot("test").players.find((p) => p.voterId === "alice")!;
    expect(alice.vote).toBeNull();
  });

  it("rejects vote from viewer", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice"); // first player → viewer by default
    expect(() => room.vote("alice", "5")).toThrow(GameError);
    expect(() => room.vote("alice", "5")).toThrow("spectateurs");
  });

  it("rejects vote after reveal", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // alice = voter+admin
    join(room, "c2", "bob", "Bob"); // bob = voter
    room.vote("alice", "5");
    room.reveal("alice");
    expect(() => room.vote("bob", "8")).toThrow(GameError);
    expect(() => room.vote("bob", "8")).toThrow("après reveal");
  });

  it("rejects card not in current deck", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.vote("alice", "999")).toThrow(GameError);
    expect(() => room.vote("alice", "999")).toThrow("hors deck");
  });

  it("rejects vote from unknown voter", () => {
    const room = new GameRoom();
    expect(() => room.vote("nobody", "5")).toThrow(GameError);
  });
});

describe("GameRoom — unvote", () => {
  it("clears a vote", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.vote("alice", "5");
    room.unvote("alice");
    const alice = room.snapshot("test").players.find((p) => p.voterId === "alice")!;
    expect(alice.hasVoted).toBe(false);
  });

  it("rejects unvote after reveal", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // alice = voter+admin
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "5");
    room.reveal("alice"); // alice is the admin
    expect(() => room.unvote("alice")).toThrow(GameError);
    expect(() => room.unvote("alice")).toThrow("après reveal");
  });

  it("is a no-op if player has not voted", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.unvote("alice")).not.toThrow();
  });
});

describe("GameRoom — reveal", () => {
  it("exposes vote values after reveal", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // voter+admin
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "8");
    room.reveal("alice");
    const alice = room.snapshot("test").players.find((p) => p.voterId === "alice")!;
    expect(alice.vote).toBe("8");
  });

  it("rejects reveal from non-admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // alice = admin
    join(room, "c2", "bob", "Bob"); // bob = voter, not admin
    expect(() => room.reveal("bob")).toThrow(GameError);
    expect(() => room.reveal("bob")).toThrow("admins");
  });

  it("is a no-op if already revealed", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.reveal("alice");
    const v1 = room.snapshot("test").version;
    room.reveal("alice");
    expect(room.snapshot("test").version).toBe(v1);
  });
});

describe("GameRoom — reset", () => {
  it("clears votes and returns to voting phase", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // voter+admin
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "5");
    room.reveal("alice");
    room.reset("alice");
    const state = room.snapshot("test");
    expect(state.phase).toBe("voting");
    expect(state.players.every((p) => !p.hasVoted)).toBe(true);
  });

  it("rejects reset from non-admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    expect(() => room.reset("bob")).toThrow(GameError);
  });
});

describe("GameRoom — auto-reveal", () => {
  it("triggers when all online voters have voted", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.setAutoReveal("alice", true);
    room.vote("alice", "5");
    expect(room.shouldAutoReveal()).toBe(false);
    room.vote("bob", "8");
    expect(room.shouldAutoReveal()).toBe(true);
  });

  it("is disabled by default", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "5");
    room.vote("bob", "8");
    expect(room.shouldAutoReveal()).toBe(false);
    expect(room.snapshot("test").autoReveal).toBe(false);
  });

  it("does not trigger for rooms with only viewers", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice"); // viewer by default (first player)
    room.setAutoReveal("alice", true);
    expect(room.shouldAutoReveal()).toBe(false);
  });

  it("does not trigger when auto-reveal is disabled", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // admin+voter
    join(room, "c2", "bob", "Bob");
    room.setAutoReveal("alice", false);
    room.vote("alice", "5");
    room.vote("bob", "8");
    expect(room.shouldAutoReveal()).toBe(false);
  });

  it("does not trigger in already-revealed phase", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.setAutoReveal("alice", true);
    room.vote("alice", "5");
    room.vote("bob", "8");
    room.doAutoReveal();
    expect(room.shouldAutoReveal()).toBe(false);
  });
});

describe("GameRoom — nextStory", () => {
  it("clears votes, resets phase, updates story", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // voter+admin
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "5");
    room.reveal("alice");
    room.nextStory("alice", "Next ticket");
    const state = room.snapshot("test");
    expect(state.story).toBe("Next ticket");
    expect(state.phase).toBe("voting");
    expect(state.players.every((p) => !p.hasVoted)).toBe(true);
  });
});

describe("GameRoom — setStory", () => {
  it("updates story without resetting votes", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // voter+admin
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "5");
    room.setStory("alice", "Updated title");
    expect(room.snapshot("test").story).toBe("Updated title");
    const alice = room.snapshot("test").players.find((p) => p.voterId === "alice")!;
    expect(alice.hasVoted).toBe(true);
  });

  it("is a no-op if story unchanged", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.setStory("alice", "Title");
    const v1 = room.snapshot("test").version;
    room.setStory("alice", "Title");
    expect(room.snapshot("test").version).toBe(v1);
  });
});

describe("GameRoom — kick", () => {
  it("removes the target player", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // admin
    join(room, "c2", "bob", "Bob");
    room.kick("alice", "bob");
    expect(room.snapshot("test").players.some((p) => p.voterId === "bob")).toBe(false);
  });

  it("returns the connection IDs of the kicked player", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    const connIds = room.kick("alice", "bob");
    expect(connIds).toContain("c2");
  });

  it("rejects self-kick", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.kick("alice", "alice")).toThrow("soi-même");
  });

  it("rejects kick from non-admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    expect(() => room.kick("bob", "alice")).toThrow(GameError);
  });

  it("is a no-op for unknown target (returns empty set)", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    const conns = room.kick("alice", "ghost");
    expect(conns.size).toBe(0);
  });
});

describe("GameRoom — admin management", () => {
  it("transferAdmin grants target and revokes sender", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // admin
    join(room, "c2", "bob", "Bob");
    room.transferAdmin("alice", "bob");
    const state = room.snapshot("test");
    expect(state.players.find((p) => p.voterId === "alice")!.isAdmin).toBe(false);
    expect(state.players.find((p) => p.voterId === "bob")!.isAdmin).toBe(true);
  });

  it("grantAdmin adds a second admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.grantAdmin("alice", "bob");
    const state = room.snapshot("test");
    expect(state.players.find((p) => p.voterId === "alice")!.isAdmin).toBe(true);
    expect(state.players.find((p) => p.voterId === "bob")!.isAdmin).toBe(true);
  });

  it("revokeAdmin removes admin role", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.grantAdmin("alice", "bob");
    room.revokeAdmin("alice", "bob");
    const bob = room.snapshot("test").players.find((p) => p.voterId === "bob")!;
    expect(bob.isAdmin).toBe(false);
  });

  it("rejects revoking the last admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.revokeAdmin("alice", "alice")).toThrow("dernier admin");
  });

  it("rejects transfer to already-admin player", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.grantAdmin("alice", "bob");
    expect(() => room.transferAdmin("alice", "bob")).toThrow("déjà admin");
  });
});

describe("GameRoom — deck", () => {
  it("switches deck when no votes are cast", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.setDeck("alice", "tshirt");
    expect(room.snapshot("test").deckId).toBe("tshirt");
  });

  it("rejects deck change when votes exist", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // admin+voter
    join(room, "c2", "bob", "Bob");
    room.vote("alice", "5");
    expect(() => room.setDeck("alice", "tshirt")).toThrow(GameError);
    expect(() => room.setDeck("alice", "tshirt")).toThrow("après le premier vote");
  });

  it("rejects unknown deck id", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.setDeck("alice", "magic-wand")).toThrow("deckId inconnu");
  });

   it("is a no-op if deck unchanged", () => {
     const room = new GameRoom();
     join(room, "c1", "alice", "Alice", false);
     const v1 = room.snapshot("test").version;
     room.setDeck("alice", "fibonacci"); // default, no change
     expect(room.snapshot("test").version).toBe(v1);
   });

   it("switches to fibonacci-half deck", () => {
     const room = new GameRoom();
     join(room, "c1", "alice", "Alice", false);
     room.setDeck("alice", "fibonacci-half");
     expect(room.snapshot("test").deckId).toBe("fibonacci-half");
   });
 });

describe("GameRoom — timer", () => {
  it("starts a timer", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.startTimer("alice", 60);
    const state = room.snapshot("test");
    expect(state.timer).not.toBeNull();
    expect(state.timer?.durationSec).toBe(60);
  });

  it("rejects out-of-range duration", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.startTimer("alice", 10)).toThrow("Durée invalide");
    expect(() => room.startTimer("alice", 99_999)).toThrow("Durée invalide");
  });

  it("stops a running timer", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.startTimer("alice", 60);
    room.stopTimer("alice");
    expect(room.snapshot("test").timer).toBeNull();
  });

  it("stop is a no-op if no timer is active", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(() => room.stopTimer("alice")).not.toThrow();
  });
});

describe("GameRoom — admin election", () => {
  it("returns null when an admin is still online", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(room.electAdmin()).toBeNull();
  });

  it("elects oldest eligible voter after all admins disconnect", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // admin
    join(room, "c2", "bob", "Bob"); // voter
    join(room, "c3", "carol", "Carol"); // voter
    room.untrackConnection("c1", "alice");
    const elected = room.electAdmin();
    expect(elected).toBe("bob");
    expect(room.snapshot("test").players.find((p) => p.voterId === "bob")!.isAdmin).toBe(true);
  });

  it("does not elect viewers", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false); // admin
    join(room, "c2", "bob", "Bob", true); // viewer
    room.untrackConnection("c1", "alice");
    expect(room.electAdmin()).toBeNull();
  });

  it("isAdminReturning returns true when admin is online", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(room.isAdminReturning("alice")).toBe(true);
  });

  it("isAdminReturning returns false after admin disconnects", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    room.untrackConnection("c1", "alice");
    expect(room.isAdminReturning("alice")).toBe(false);
  });
});

describe("GameRoom — connection tracking", () => {
  it("tracks online status via connections", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    expect(room.isOnline("alice")).toBe(true);
    room.untrackConnection("c1", "alice");
    expect(room.isOnline("alice")).toBe(false);
  });

  it("returns needsElection=false when disconnected voter is not the last online admin", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    room.grantAdmin("alice", "bob");
    const { needsElection } = room.untrackConnection("c1", "alice");
    expect(needsElection).toBe(false);
  });

  it("returns needsElection=true when last admin goes offline", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    const { needsElection } = room.untrackConnection("c1", "alice");
    expect(needsElection).toBe(true);
  });

  it("returns needsElection=false for non-admin disconnect", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    const { needsElection } = room.untrackConnection("c2", "bob");
    expect(needsElection).toBe(false);
  });
});

describe("GameRoom — snapshot", () => {
  it("reflects roomId", () => {
    const room = new GameRoom();
    expect(room.snapshot("my-room").roomId).toBe("my-room");
  });

  it("bumps version on each mutation", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    const v1 = room.snapshot("r").version;
    join(room, "c2", "bob", "Bob");
    expect(room.snapshot("r").version).toBe(v1 + 1);
  });

  it("players are sorted by join time", () => {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice");
    join(room, "c2", "bob", "Bob");
    const vIds = room.snapshot("r").players.map((p) => p.voterId);
    expect(vIds).toEqual(["alice", "bob"]);
  });
});

describe("GameRoom: reactions", () => {
  const T0 = 1_000_000;

  function reactionRoom(): GameRoom {
    const room = new GameRoom();
    join(room, "c1", "alice", "Alice", false);
    join(room, "c2", "bob", "Bob");
    join(room, "c3", "carol", "Carol");
    join(room, "c4", "dave", "Dave", true);
    return room;
  }

  it("reactionsEnabled is true by default in the snapshot", () => {
    expect(reactionRoom().snapshot("r").reactionsEnabled).toBe(true);
  });

  it("setReactionsEnabled flips the flag, bumps version, and is idempotent", () => {
    const room = reactionRoom();
    const v0 = room.snapshot("r").version;
    room.setReactionsEnabled("alice", false);
    const s1 = room.snapshot("r");
    expect(s1.reactionsEnabled).toBe(false);
    expect(s1.version).toBe(v0 + 1);
    room.setReactionsEnabled("alice", false);
    expect(room.snapshot("r").version).toBe(v0 + 1);
  });

  it("setReactionsEnabled is admin only", () => {
    const room = reactionRoom();
    expect(() => room.setReactionsEnabled("bob", false)).toThrowError(GameError);
    try {
      room.setReactionsEnabled("bob", false);
    } catch (e) {
      expect((e as GameError).code).toBe("forbidden");
    }
    try {
      room.setReactionsEnabled("ghost", false);
    } catch (e) {
      expect((e as GameError).code).toBe("not_joined");
    }
    expect(room.snapshot("r").reactionsEnabled).toBe(true);
  });

  it("a valid shot returns the relayed fields", () => {
    const room = reactionRoom();
    expect(room.shootProjectile("bob", "carol", "👍", T0)).toEqual({
      fromVoterId: "bob",
      toVoterId: "carol",
      item: "👍",
    });
  });

  it("a shot does not change the version", () => {
    const room = reactionRoom();
    const v0 = room.snapshot("r").version;
    room.shootProjectile("bob", "carol", "👍", T0);
    expect(room.snapshot("r").version).toBe(v0);
  });

  describe("refusals return null and never throw", () => {
    const cases: Array<[string, (room: GameRoom) => unknown]> = [
      ["item outside the list", (r) => r.shootProjectile("bob", "carol", "💩", T0)],
      ["html item", (r) => r.shootProjectile("bob", "carol", "<b>", T0)],
      ["item with VS16", (r) => r.shootProjectile("bob", "carol", "\u{1F44D}\uFE0F", T0)],
      ["ZWJ sequence", (r) => r.shootProjectile("bob", "carol", "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", T0)],
      ["numeric item", (r) => r.shootProjectile("bob", "carol", 42, T0)],
      ["undefined item", (r) => r.shootProjectile("bob", "carol", undefined, T0)],
      ["unknown target", (r) => r.shootProjectile("bob", "ghost", "👍", T0)],
      ["numeric target", (r) => r.shootProjectile("bob", 42, "👍", T0)],
      ["null target", (r) => r.shootProjectile("bob", null, "👍", T0)],
      ["self target", (r) => r.shootProjectile("bob", "bob", "👍", T0)],
      ["unknown object id", (r) => r.shootProjectile("bob", "carol", "paper-boat", T0)],
      ["incomplete object id", (r) => r.shootProjectile("bob", "carol", "plane", T0)],
      ["uppercase object id", (r) => r.shootProjectile("bob", "carol", "PAPER-PLANE", T0)],
      ["object id with a space", (r) => r.shootProjectile("bob", "carol", " paper-ball", T0)],
      ["viewer targeting itself", (r) => r.shootProjectile("dave", "dave", "👍", T0)],
      [
        "offline viewer target",
        (r) => {
          r.untrackConnection("c4", "dave");
          return r.shootProjectile("bob", "dave", "👍", T0);
        },
      ],
      ["unknown shooter", (r) => r.shootProjectile("ghost", "bob", "👍", T0)],
      [
        "offline target",
        (r) => {
          r.untrackConnection("c3", "carol");
          return r.shootProjectile("bob", "carol", "👍", T0);
        },
      ],
      [
        "reactions disabled",
        (r) => {
          r.setReactionsEnabled("alice", false);
          return r.shootProjectile("bob", "carol", "👍", T0);
        },
      ],
    ];
    it.each(cases)("%s", (_label, run) => {
      expect(run(reactionRoom())).toBeNull();
    });
  });

  it("rate limit: refused at +999 ms, accepted at +1000 ms", () => {
    const room = reactionRoom();
    expect(room.shootProjectile("bob", "carol", "👍", T0)).not.toBeNull();
    expect(room.shootProjectile("bob", "carol", "👍", T0 + 999)).toBeNull();
    expect(room.shootProjectile("bob", "carol", "👍", T0 + 1000)).not.toBeNull();
  });

  it("refusals do not consume the cooldown", () => {
    const room = reactionRoom();
    expect(room.shootProjectile("bob", "carol", "💩", T0)).toBeNull();
    expect(room.shootProjectile("bob", "carol", "👍", T0 + 10)).not.toBeNull();
  });

  it("cooldown is per shooter, not global", () => {
    const room = reactionRoom();
    expect(room.shootProjectile("bob", "alice", "👍", T0)).not.toBeNull();
    expect(room.shootProjectile("carol", "alice", "👍", T0 + 1)).not.toBeNull();
  });

  it("kick clears the cooldown of the kicked player", () => {
    const room = reactionRoom();
    expect(room.shootProjectile("bob", "carol", "👍", T0)).not.toBeNull();
    room.kick("alice", "bob");
    join(room, "c5", "bob", "Bob");
    expect(room.shootProjectile("bob", "carol", "👍", T0 + 10)).not.toBeNull();
  });

  describe("viewers and paper objects", () => {
    it("a viewer can shoot", () => {
      const room = reactionRoom();
      expect(room.shootProjectile("dave", "bob", "👍", T0)).toEqual({
        fromVoterId: "dave",
        toVoterId: "bob",
        item: "👍",
      });
    });

    it("a viewer can be targeted", () => {
      const room = reactionRoom();
      expect(room.shootProjectile("bob", "dave", "paper-plane", T0)).not.toBeNull();
    });

    it("a viewer can target another viewer", () => {
      const room = reactionRoom();
      join(room, "c5", "eve", "Eve", true);
      expect(room.shootProjectile("dave", "eve", "paper-ball", T0)).not.toBeNull();
    });

    it("all 12 items are accepted", () => {
      const room = reactionRoom();
      expect(REACTION_ITEMS).toHaveLength(12);
      REACTION_ITEMS.forEach((item, i) => {
        const shot = room.shootProjectile("bob", "carol", item, T0 + i * 1000);
        expect(shot?.item).toBe(item);
      });
    });

    it("a viewer has its own cooldown", () => {
      const room = reactionRoom();
      expect(room.shootProjectile("dave", "bob", "👍", T0)).not.toBeNull();
      expect(room.shootProjectile("dave", "bob", "👍", T0 + 999)).toBeNull();
      expect(room.shootProjectile("dave", "bob", "👍", T0 + 1000)).not.toBeNull();
    });

    it("the cooldown follows the voterId across a viewer switch", () => {
      const room = reactionRoom();
      expect(room.shootProjectile("bob", "carol", "👍", T0)).not.toBeNull();
      room.setViewer("bob", true);
      expect(room.shootProjectile("bob", "carol", "👍", T0 + 10)).toBeNull();
      expect(room.shootProjectile("bob", "carol", "👍", T0 + 1000)).not.toBeNull();
    });
  });
});

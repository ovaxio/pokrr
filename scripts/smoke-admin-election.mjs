#!/usr/bin/env node
// Smoke test de l'élection admin auto.
// Prérequis : PartyKit dev lancé avec POKRR_ADMIN_GRACE_MS=2000 (ou autre valeur courte).

import { setTimeout as sleep } from "node:timers/promises";

const HOST = process.env.POKRR_HOST ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const PROTO = HOST.startsWith("localhost") || HOST.startsWith("127.") ? "ws" : "wss";
const ROOM_ID = `smoke-elect-${Date.now()}`;
const URL = `${PROTO}://${HOST}/parties/main/${ROOM_ID}`;
const GRACE = Number(process.env.POKRR_ADMIN_GRACE_MS ?? 2000);

function log(label, payload) {
  if (payload.type === "room_state") {
    const summary = {
      v: payload.version,
      phase: payload.phase,
      players: payload.players.map(
        (p) => `${p.name}${p.isAdmin ? "★" : ""}${p.online ? "" : "·offline"}`,
      ),
    };
    console.log(`[${label}]`, JSON.stringify(summary));
  } else {
    console.log(`[${label}]`, JSON.stringify(payload));
  }
}

function connect(label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", (e) => reject(e));
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(String(event.data));
        log(label, data);
        if (data.type === "room_state") ws.lastState = data;
      } catch {
        console.log(`[${label}] raw`, event.data);
      }
    });
  });
}

const send = (ws, msg) => ws.send(JSON.stringify(msg));

function expect(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}`);
    process.exitCode = 1;
  }
}

console.log(`→ Connexion à ${URL} (grace = ${GRACE}ms)`);

const alice = await connect("alice");
const bob = await connect("bob");
const carol = await connect("carol");

console.log("\n→ Joins");
send(alice, { type: "join", voterId: "voter-alice", name: "Alice" });
await sleep(120);
send(bob, { type: "join", voterId: "voter-bob", name: "Bob" });
await sleep(120);
send(carol, { type: "join", voterId: "voter-carol", name: "Carol" });
await sleep(150);

expect(
  alice.lastState.players.find((p) => p.voterId === "voter-alice")?.isAdmin === true,
  "alice est admin initial",
);

console.log("\n→ Alice (admin) ferme sa connexion, attente du timer d'élection");
alice.close();
await sleep(Math.max(GRACE + 800, 1500));

const bobState = bob.lastState;
const newAdmin = bobState.players.find((p) => p.isAdmin);
expect(newAdmin !== undefined, `un nouvel admin a été élu (${newAdmin?.name ?? "—"})`);
expect(
  newAdmin?.voterId === "voter-bob",
  "bob (le plus ancien voter en ligne) est devenu admin",
);
expect(
  bobState.players.find((p) => p.voterId === "voter-alice")?.isAdmin === false,
  "alice (offline) n'est plus admin",
);

console.log("\n→ Alice revient → elle n'écrase pas Bob");
const alice2 = await connect("alice2");
send(alice2, { type: "join", voterId: "voter-alice", name: "Alice" });
await sleep(200);
expect(
  alice2.lastState.players.find((p) => p.voterId === "voter-bob")?.isAdmin === true,
  "bob reste admin après le retour d'Alice",
);
expect(
  alice2.lastState.players.find((p) => p.voterId === "voter-alice")?.isAdmin === false,
  "alice revenue n'est plus admin",
);

console.log("\n→ Alice se reconnecte avant que Bob se déconnecte → pas d'élection si admin revient à temps");
// Bob disconnects, then quickly comes back before GRACE
bob.close();
await sleep(Math.min(GRACE / 3, 500));
const bob2 = await connect("bob2");
send(bob2, { type: "join", voterId: "voter-bob", name: "Bob" });
await sleep(Math.max(GRACE + 500, 1500));
expect(
  bob2.lastState.players.find((p) => p.voterId === "voter-bob")?.isAdmin === true,
  "bob reste admin (revenu avant fin du timer)",
);

console.log(`\n${process.exitCode === 1 ? "❌ FAIL" : "✅ OK"}`);
alice2.close();
bob2.close();
carol.close();
await sleep(100);
process.exit(process.exitCode ?? 0);

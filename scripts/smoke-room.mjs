#!/usr/bin/env node
// Smoke test du serveur PartyKit pokrr.
// Connecte 3 clients, joue un round complet, vérifie l'état final.
// Usage : npm run smoke  (PartyKit doit tourner sur localhost:1999)

import { setTimeout as sleep } from "node:timers/promises";

const HOST = process.env.POKRR_HOST ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const PROTO = HOST.startsWith("localhost") || HOST.startsWith("127.") ? "ws" : "wss";
const ROOM_ID = `smoke-${Date.now()}`;
const URL = `${PROTO}://${HOST}/parties/main/${ROOM_ID}`;

let lastVersion = -1;
const log = (label, payload) => {
  const summary =
    payload.type === "room_state"
      ? {
          version: payload.version,
          phase: payload.phase,
          story: payload.story,
          players: payload.players.map(
            (p) => `${p.name}${p.isAdmin ? "★" : ""}${p.online ? "" : "·offline"}=${p.hasVoted ? (p.vote ?? "?") : "—"}`,
          ),
        }
      : payload;
  console.log(`[${label}]`, JSON.stringify(summary));
  if (payload.type === "room_state") lastVersion = payload.version;
};

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

console.log(`→ Connexion à ${URL}`);
const alice = await connect("alice");
const bob = await connect("bob");
const carol = await connect("carol");

console.log("\n→ Alice join (devient admin)");
send(alice, { type: "join", voterId: "voter-alice", name: "Alice" });
await sleep(120);

console.log("\n→ Bob join");
send(bob, { type: "join", voterId: "voter-bob", name: "Bob" });
await sleep(120);

console.log("\n→ Carol join (avec même pseudo qu'Alice → doit être dédupliqué)");
send(carol, { type: "join", voterId: "voter-carol", name: "Alice" });
await sleep(120);

console.log("\n→ Alice définit la story");
send(alice, { type: "set_story", story: "Refacto auth middleware" });
await sleep(120);

console.log("\n→ Bob essaie de définir la story (doit être refusé)");
send(bob, { type: "set_story", story: "Tentative non-admin" });
await sleep(120);

console.log("\n→ Bob vote 5, Carol vote 8 (pas encore auto-reveal : Alice n'a pas voté)");
send(bob, { type: "vote", value: "5" });
await sleep(80);
send(carol, { type: "vote", value: "8" });
await sleep(150);

console.log("\n→ État courant : devrait être phase=voting, hasVoted=2/3");
const stateBeforeReveal = alice.lastState;
expect(stateBeforeReveal.phase === "voting", "phase = voting");
expect(stateBeforeReveal.players.filter((p) => p.hasVoted).length === 2, "2 joueurs ont voté");
expect(stateBeforeReveal.players.every((p) => p.vote === null), "votes cachés avant reveal");
expect(
  stateBeforeReveal.players.find((p) => p.voterId === "voter-carol")?.name === "Alice (2)",
  "carol renommée 'Alice (2)' (déduplication)",
);

console.log("\n→ Alice vote 13 (auto-reveal devrait déclencher)");
send(alice, { type: "vote", value: "13" });
await sleep(200);

const stateAfter = alice.lastState;
expect(stateAfter.phase === "revealed", "phase = revealed (auto-reveal)");
expect(
  stateAfter.players.find((p) => p.voterId === "voter-alice")?.vote === "13",
  "vote alice révélé = 13",
);
expect(
  stateAfter.players.find((p) => p.voterId === "voter-bob")?.vote === "5",
  "vote bob révélé = 5",
);

console.log("\n→ Bob essaie de revoter (doit être refusé : phase revealed)");
send(bob, { type: "vote", value: "21" });
await sleep(120);
expect(
  alice.lastState.players.find((p) => p.voterId === "voter-bob")?.vote === "5",
  "vote bob inchangé",
);

console.log("\n→ Alice next_story → nouveau round, votes effacés");
send(alice, { type: "next_story", story: "Migration DB" });
await sleep(120);
expect(alice.lastState.phase === "voting", "phase = voting (nouveau round)");
expect(alice.lastState.story === "Migration DB", "story mise à jour");
expect(alice.lastState.players.every((p) => !p.hasVoted), "tous les votes effacés");

console.log("\n→ Alice transfert admin à Bob");
send(alice, { type: "transfer_admin", voterId: "voter-bob" });
await sleep(120);
expect(
  alice.lastState.players.find((p) => p.voterId === "voter-bob")?.isAdmin === true,
  "bob est admin",
);
expect(
  alice.lastState.players.find((p) => p.voterId === "voter-alice")?.isAdmin === false,
  "alice n'est plus admin",
);

console.log("\n→ Alice essaie reveal (doit être refusé)");
send(alice, { type: "reveal" });
await sleep(120);
expect(alice.lastState.phase === "voting", "phase inchangée (alice n'est plus admin)");

console.log("\n→ Bob kick Carol");
send(bob, { type: "kick", voterId: "voter-carol" });
await sleep(200);
expect(
  !alice.lastState.players.some((p) => p.voterId === "voter-carol"),
  "carol retirée de la salle",
);

console.log("\n→ Bob envoie une carte hors deck (doit être refusé)");
send(bob, { type: "vote", value: "999" });
await sleep(120);
expect(
  !alice.lastState.players.find((p) => p.voterId === "voter-bob")?.hasVoted,
  "bob n'a pas voté (carte invalide)",
);

console.log("\n→ Disconnect alice → state broadcast doit refléter online=false");
alice.close();
await sleep(200);
expect(
  bob.lastState.players.find((p) => p.voterId === "voter-alice")?.online === false,
  "alice marquée offline",
);

console.log(`\n${process.exitCode === 1 ? "❌ FAIL" : "✅ OK"} — version finale ${lastVersion}`);

bob.close();
carol.close();
await sleep(80);
process.exit(process.exitCode ?? 0);

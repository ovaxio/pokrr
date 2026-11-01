#!/usr/bin/env node
// Smoke de la coupure d'inactivité. Local uniquement : wrangler dev doit tourner
// avec POKRR_IDLE_TIMEOUT_MS=8000 dans .env (contre la prod la coupure vaut 2 h).

import { setTimeout as sleep } from "node:timers/promises";

const HOST = process.env.POKRR_HOST ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const PROTO = HOST.startsWith("localhost") || HOST.startsWith("127.") ? "ws" : "wss";
const IDLE = Number(process.env.POKRR_IDLE_TIMEOUT_MS ?? 8000);
const ROOM_ID = `smoke-idle-${Date.now()}`;
const PROBE_ROOM = `smoke-idle-probe-${Date.now()}`;
// Code en dur volontaire (un .mjs ne peut pas importer party/types.ts) : si vous
// changez ROOM_EXPIRED_CLOSE_CODE, mettez cette constante à jour, le smoke échouera sinon.
const EXPIRED_CODE = 4001;

const urlFor = (room) => `${PROTO}://${HOST}/parties/main/${room}`;

function connect(label, url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", (e) => reject(e));
    ws.addEventListener("close", (event) => {
      ws.closeCode = event.code;
      ws.closedAt = Date.now();
    });
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === "room_state") {
          ws.firstState ??= data;
          ws.lastState = data;
        } else if (data.type === "error") {
          ws.lastError = data;
        }
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

console.log(`→ Connexion à ${urlFor(ROOM_ID)} (idle = ${IDLE}ms)`);

const alice = await connect("alice", urlFor(ROOM_ID));
send(alice, { type: "join", voterId: "voter-alice", name: "Alice" });
const bob = await connect("bob", urlFor(ROOM_ID)); // volontairement sans join
await sleep(150);

console.log("\n→ Phase active : alice envoie une trame toutes les IDLE/4 pendant 1,5 x IDLE");
const tickEvery = IDLE / 4;
const tickCount = Math.ceil((IDLE * 1.5) / tickEvery);
let lastActivity = Date.now();
for (let i = 0; i < tickCount; i++) {
  await sleep(tickEvery);
  send(alice, { type: "set_story", story: `tick ${i}` });
  lastActivity = Date.now();
}
expect(alice.closeCode === undefined, "alice active n'est pas coupée");
expect(bob.closeCode === undefined, "bob reste connecté pendant l'activité d'alice");

console.log("\n→ Silence : attente de IDLE + 2000 ms");
await sleep(IDLE + 2000);
expect(alice.closeCode === EXPIRED_CODE, `alice fermée avec le code ${EXPIRED_CODE}`);
expect(bob.closeCode === EXPIRED_CODE, `bob (sans join) fermé avec le code ${EXPIRED_CODE}`);
expect(
  alice.closedAt !== undefined && alice.closedAt - lastActivity >= IDLE - 500,
  "pas de coupure prématurée",
);

console.log("\n→ Nouvelle connexion au même code : salle neuve");
const carol = await connect("carol", urlFor(ROOM_ID));
await sleep(300);
expect(carol.firstState?.players.length === 0, "salle vide (aucun joueur)");
expect(carol.firstState?.story === "", "story vide");
carol.close();

console.log("\n→ Session type sonde (set_name sans join)");
const probe = await connect("probe", urlFor(PROBE_ROOM));
send(probe, { type: "set_name", name: "probe" });
await sleep(300);
expect(probe.lastError?.code === "not_joined", "la sonde reçoit not_joined");
probe.close();
await sleep(200);
expect(probe.closeCode !== EXPIRED_CODE, "la sonde n'est jamais fermée en 4001");

console.log(`\n${process.exitCode === 1 ? "❌ FAIL" : "✅ OK"}`);
process.exit(process.exitCode ?? 0);

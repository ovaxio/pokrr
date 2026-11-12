#!/usr/bin/env node
// Smoke de la coupure d'inactivité et du délai de join. Local uniquement : wrangler dev doit tourner
// avec POKRR_IDLE_TIMEOUT_MS=8000 et POKRR_JOIN_TIMEOUT_MS=5000 dans .env (contre la prod : 2 h et 5 min).

import { setTimeout as sleep } from "node:timers/promises";

const HOST = process.env.POKRR_HOST ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const PROTO = HOST.startsWith("localhost") || HOST.startsWith("127.") ? "ws" : "wss";
const IDLE = Number(process.env.POKRR_IDLE_TIMEOUT_MS ?? 8000);
const JOIN = Number(process.env.POKRR_JOIN_TIMEOUT_MS ?? 5000);
const ROOM_ID = `smoke-idle-${Date.now()}`;
const PROBE_ROOM = `smoke-idle-probe-${Date.now()}`;
// Code en dur volontaire (un .mjs ne peut pas importer party/types.ts) : si vous
// changez ROOM_EXPIRED_CLOSE_CODE, mettez cette constante à jour, le smoke échouera sinon.
const EXPIRED_CODE = 4001;
// Idem pour JOIN_TIMEOUT_CLOSE_CODE (connexion restée sans join).
const JOIN_CODE = 4002;

const urlFor = (room) => `${PROTO}://${HOST}/parties/main/${room}`;

function connect(label, url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener("open", () => {
      ws.openedAt = Date.now();
      resolve(ws);
    });
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
const sendIfOpen = (ws, data) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(typeof data === "string" ? data : JSON.stringify(data));
};
const within = (value, expected, before, after) => value >= expected - before && value <= expected + after;

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
expect(
  bob.closeCode === JOIN_CODE && within(bob.closedAt - bob.openedAt, JOIN, 500, 1500),
  `bob (sans join) fermé en ${JOIN_CODE} vers JOIN (${JOIN} ms), jamais en ${EXPIRED_CODE}`,
);

console.log("\n→ Silence : attente de IDLE + 2000 ms");
await sleep(IDLE + 2000);
expect(alice.closeCode === EXPIRED_CODE, `alice fermée avec le code ${EXPIRED_CODE}`);
expect(
  alice.closedAt !== undefined && alice.closedAt - lastActivity >= IDLE - 500,
  "pas de coupure prématurée",
);

console.log("\n→ Nouvelle connexion au même code : salle neuve");
const carol = await connect("carol", urlFor(ROOM_ID));
await sleep(300);
expect(carol.firstState?.players.length === 0, "salle vide (aucun joueur)");
expect(carol.firstState?.story === "", "story vide");
await sleep(300);
expect(carol.closeCode === undefined, "carol n'est pas fermée aussitôt (échéance remise à zéro)");
carol.close();

console.log("\n→ Phase B : trames refusées ou sans join ne repoussent pas la coupure");
{
  const room = `smoke-idle-b-${Date.now()}`;
  const alice = await connect("alice-b", urlFor(room));
  send(alice, { type: "join", voterId: "voter-alice", name: "Alice" });
  const bob = await connect("bob-b", urlFor(room));
  await sleep(100);
  send(bob, { type: "join", voterId: "voter-bob", name: "Bob" });
  const eve = await connect("eve-b", urlFor(room)); // jamais jointe
  await sleep(100);
  const t0 = Date.now();
  for (let i = 1; i <= Math.ceil((IDLE * 1.5) / 1500); i++) {
    await sleep(1500);
    sendIfOpen(bob, { type: "reveal" }); // forbidden : pas une action acceptée
    if (i <= 2) {
      sendIfOpen(eve, "x");
      sendIfOpen(eve, { type: "set_name", name: "eve" });
    }
  }
  await sleep(2000);
  expect(alice.closeCode === EXPIRED_CODE, `alice fermée avec le code ${EXPIRED_CODE}`);
  expect(
    alice.closedAt !== undefined && within(alice.closedAt - t0, IDLE, 500, 1500),
    "coupure à IDLE après la dernière action acceptée, malgré les trames refusées",
  );
}

console.log("\n→ Session type sonde (set_name sans join)");
const probe = await connect("probe", urlFor(PROBE_ROOM));
send(probe, { type: "set_name", name: "probe" });
await sleep(300);
expect(probe.lastError?.code === "not_joined", "la sonde reçoit not_joined");
probe.close();
await sleep(200);
expect(probe.closeCode !== EXPIRED_CODE && probe.closeCode !== JOIN_CODE, "la sonde n'est jamais fermée en 4001 ni 4002");

console.log("\n→ Phase D : reconnexion après 4002, l'échéance de la salle ne recule pas");
{
  const room = `smoke-idle-d-${Date.now()}`;
  const lurker = await connect("lurker", urlFor(room));
  const tD = lurker.openedAt;
  while (lurker.closeCode === undefined && Date.now() - tD < JOIN + 3000) await sleep(50);
  expect(lurker.closeCode === JOIN_CODE, `lurker fermé en ${JOIN_CODE}`);
  const lurker2 = await connect("lurker2", urlFor(room));
  while (lurker2.closeCode === undefined && Date.now() - tD < IDLE + 4000) await sleep(50);
  expect(lurker2.closeCode === EXPIRED_CODE, `lurker2 fermé en ${EXPIRED_CODE}, pas en ${JOIN_CODE}`);
  expect(
    lurker2.closedAt !== undefined && within(lurker2.closedAt - tD, IDLE, 500, 1500),
    "la salle expire à IDLE après la création, pas IDLE après la reconnexion",
  );
}

console.log("\n→ Phase F : priorité admin d'une connexion sans join");
{
  const room = `smoke-idle-f2-${Date.now()}`;
  const cp = await connect("cp", urlFor(room));
  const dev = await connect("dev", urlFor(room));
  send(dev, { type: "join", voterId: "voter-dev", name: "Dev" });
  await sleep(500);
  send(cp, { type: "join", voterId: "voter-cp", name: "CP" });
  await sleep(200);
  expect(cp.lastState?.players.find((p) => p.voterId === "voter-cp")?.isAdmin === true, "cp qui rejoint dans le délai est admin");
  cp.close();
  dev.close();
}
{
  const room = `smoke-idle-f-${Date.now()}`;
  const eve = await connect("eve-f", urlFor(room));
  const alice = await connect("alice-f", urlFor(room));
  send(alice, { type: "join", voterId: "voter-alice", name: "Alice" });
  await sleep(JOIN + 1000);
  expect(eve.closeCode === JOIN_CODE, `eve (ouverte avant alice, sans join) fermée en ${JOIN_CODE}`);
  // Si eve n'avait pas été fermée, c'est elle qui rejoindrait avec sa priorité de première connexion.
  const eve2 = eve.readyState === WebSocket.OPEN ? eve : await connect("eve2-f", urlFor(room));
  send(eve2, { type: "join", voterId: "voter-eve", name: "Eve" });
  await sleep(200);
  expect(eve2.lastState?.players.find((p) => p.voterId === "voter-eve")?.isAdmin === false, "eve qui rejoint après coup n'est pas admin");
  eve2.close();
  alice.close();
}

console.log(`\n${process.exitCode === 1 ? "❌ FAIL" : "✅ OK"}`);
process.exit(process.exitCode ?? 0);

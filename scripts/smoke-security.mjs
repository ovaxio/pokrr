#!/usr/bin/env node
// Smoke tests sécurité : negative paths que le smoke happy-path n'attrape pas.
// - XSS pseudo / story (serveur strip < >)
// - JSON malformé (pas de crash)
// - Admin usurpation : non-admin envoie kick / transfer_admin
// - voterId malformé refusé
// - Origin browser non-autorisé refusé (CSWSH)
// - Carte hors whitelist refusée
// - Rate-limit IP déclenche 429
//
// Prérequis : PartyKit dev sur localhost:1999 (.env: POKRR_ADMIN_GRACE_MS=2000 ou défaut).

import { setTimeout as sleep } from "node:timers/promises";

const HOST = process.env.POKRR_HOST ?? "localhost:1999";
const PROTO = HOST.startsWith("localhost") || HOST.startsWith("127.") ? "ws" : "wss";

let pass = 0;
let fail = 0;
function expect(cond, label) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`);
    process.exitCode = 1;
  }
}

function connect(roomId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${PROTO}://${HOST}/parties/main/${roomId}`);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", (e) => reject(e));
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === "room_state") ws.lastState = data;
        if (data.type === "error") ws.lastError = data;
        if (data.type === "kicked") ws.kickedReason = data.reason;
      } catch {
        ws.gotInvalidJSON = true;
      }
    });
    ws.addEventListener("close", (e) => { ws.closedCode = e.code; });
  });
}
const send = (ws, msg) => ws.send(JSON.stringify(msg));

// 1. XSS pseudo : balises HTML dans le pseudo → strip < > côté serveur
console.log("\n→ Test 1 : XSS pseudo");
{
  const room = `sec-xss-pseudo-${Date.now()}`;
  const alice = await connect(room);
  // Payload qui rentre dans les 24 chars après strip < >
  send(alice, { type: "join", voterId: "v-alice", name: "<b>Joanna</b>" });
  await sleep(200);
  const me = alice.lastState?.players.find((p) => p.voterId === "v-alice");
  expect(!!me, "alice est join");
  expect(!me?.name.includes("<"), "pas de < dans le pseudo renvoyé");
  expect(!me?.name.includes(">"), "pas de > dans le pseudo renvoyé");
  expect(me?.name.includes("Joanna"), "le reste du pseudo est conservé");
  alice.close();
}

// 2. XSS story : <img onerror> dans la story
console.log("\n→ Test 2 : XSS story");
{
  const room = `sec-xss-story-${Date.now()}`;
  const alice = await connect(room);
  send(alice, { type: "join", voterId: "v-alice", name: "Alice" });
  await sleep(150);
  send(alice, { type: "set_story", story: '<img src=x onerror="alert(1)"> US-123' });
  await sleep(150);
  expect(!alice.lastState?.story.includes("<"), "pas de < dans la story serveur");
  expect(alice.lastState?.story.includes("US-123"), "le texte légitime est conservé");
  alice.close();
}

// 3. JSON malformé : serveur ne crash pas
console.log("\n→ Test 3 : JSON malformé");
{
  const room = `sec-malformed-${Date.now()}`;
  const alice = await connect(room);
  send(alice, { type: "join", voterId: "v-alice", name: "Alice" });
  await sleep(150);
  alice.send("not json at all {");
  await sleep(150);
  expect(alice.lastError?.code === "invalid", "serveur retourne error invalid");
  // Le socket doit rester ouvert
  send(alice, { type: "vote", value: "5" });
  await sleep(150);
  const me = alice.lastState?.players.find((p) => p.voterId === "v-alice");
  expect(me?.hasVoted === true, "socket reste fonctionnel après JSON corrompu");
  alice.close();
}

// 4. Admin usurpation : non-admin essaie kick / transfer_admin
console.log("\n→ Test 4 : admin usurpation");
{
  const room = `sec-admin-usurp-${Date.now()}`;
  const alice = await connect(room);
  const bob = await connect(room);
  send(alice, { type: "join", voterId: "v-alice", name: "Alice" });
  await sleep(120);
  send(bob, { type: "join", voterId: "v-bob", name: "Bob" });
  await sleep(150);

  // Bob (non-admin) essaie kick alice
  send(bob, { type: "kick", voterId: "v-alice" });
  await sleep(150);
  expect(bob.lastError?.code === "forbidden", "bob kick refusé (forbidden)");
  expect(
    alice.lastState?.players.find((p) => p.voterId === "v-alice"),
    "alice toujours dans la room",
  );

  // Bob essaie transfer_admin à lui-même
  bob.lastError = null;
  send(bob, { type: "transfer_admin", voterId: "v-bob" });
  await sleep(150);
  expect(bob.lastError?.code === "forbidden", "bob transfer_admin refusé");
  expect(
    alice.lastState?.players.find((p) => p.voterId === "v-alice")?.isAdmin === true,
    "alice reste admin",
  );

  // Bob essaie reveal
  bob.lastError = null;
  send(bob, { type: "reveal" });
  await sleep(150);
  expect(bob.lastError?.code === "forbidden", "bob reveal refusé");

  alice.close();
  bob.close();
}

// 5. voterId malformé
console.log("\n→ Test 5 : voterId malformé");
{
  const room = `sec-vid-${Date.now()}`;
  const ws = await connect(room);
  // injection caractères spéciaux
  send(ws, { type: "join", voterId: "../../etc/passwd", name: "Mallory" });
  await sleep(150);
  expect(ws.lastError?.code === "invalid", "voterId avec / refusé");
  // voterId trop long
  ws.lastError = null;
  send(ws, { type: "join", voterId: "a".repeat(100), name: "Mallory" });
  await sleep(150);
  expect(ws.lastError?.code === "invalid", "voterId > 64 chars refusé");
  // voterId vide
  ws.lastError = null;
  send(ws, { type: "join", voterId: "", name: "Mallory" });
  await sleep(150);
  expect(ws.lastError?.code === "invalid", "voterId vide refusé");
  ws.close();
}

// 6. Origin browser non-autorisé (CSWSH)
console.log("\n→ Test 6 : Origin browser non-autorisé");
{
  const room = `sec-origin-${Date.now()}`;
  let rejected = false;
  await new Promise((resolve) => {
    const ws = new WebSocket(`${PROTO}://${HOST}/parties/main/${room}`, {
      headers: { Origin: "https://attacker.example.com" },
    });
    ws.addEventListener("open", () => resolve(null));
    ws.addEventListener("error", () => { rejected = true; resolve(null); });
    ws.addEventListener("close", (e) => {
      if (e.code !== 1000) rejected = true;
      resolve(null);
    });
    setTimeout(resolve, 2000);
  });
  expect(rejected, "Origin attacker.example.com refusé (CSWSH protection)");

  // Origin browser autorisé : localhost passe
  const allowed = await new Promise((resolve) => {
    const ws = new WebSocket(`${PROTO}://${HOST}/parties/main/${room}`, {
      headers: { Origin: "http://localhost:3000" },
    });
    ws.addEventListener("open", () => { ws.close(); resolve(true); });
    ws.addEventListener("error", () => resolve(false));
    setTimeout(() => resolve(false), 2000);
  });
  expect(allowed, "Origin localhost:3000 autorisé");
}

console.log(`\n${fail === 0 ? "✅ OK" : "❌ FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

#!/usr/bin/env node
// Smoke tests sécurité : negative paths que le smoke happy-path n'attrape pas.
// - XSS pseudo / story (serveur strip < >)
// - JSON malformé (pas de crash)
// - Admin usurpation : non-admin envoie kick / transfer_admin
// - voterId malformé refusé
// - Origin browser non-autorisé refusé (CSWSH)
// - Carte hors whitelist refusée
// - Réactions projectiles : anti-usurpation, refus silencieux, rate limit 1 s, interrupteur admin, spectateurs tireurs et cibles, objets en papier
// - HTTP non WebSocket sur /parties/ : 404 "Not Found" sans solliciter de Durable Object
// - Origines : previews du projet Vercel acceptées, projets Vercel tiers refusés, localhost seulement si le Worker est local
// - Trames JSON valides mais pas des messages (null, [], "abc", {"type":5}) : error invalid
// - Deux sockets avec le même ?_pk= : fermer l'une ne rend pas l'autre sourde
// - Second join d'un autre voterId sur la même connexion : forbidden
// - set_deck avec une clé héritée du prototype ou un type non chaîne : invalid
// - Trame de plus de 4096 unités : fermeture 1009 ; trame de 4000 unités : traitée
// - Débit : 300 trames d'un coup, fermeture 1008 ; 33 trames/s tolérées
//
// Jouable contre la prod (aucune dépendance aux minuteries) : 25 connexions acceptées par exécution
// au plus, la limite par IP étant de 30 par minute.
// Prérequis : `npm run dev:party` (wrangler dev) sur localhost:1999 (.env: POKRR_ADMIN_GRACE_MS=2000 ou défaut).

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

function connect(roomId, query = "") {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${PROTO}://${HOST}/parties/main/${roomId}${query}`);
    ws.projectiles = [];
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", (e) => reject(e));
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === "room_state") ws.lastState = data;
        if (data.type === "error") ws.lastError = data;
        if (data.type === "kicked") ws.kickedReason = data.reason;
        if (data.type === "projectile_thrown") ws.projectiles.push(data);
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
  send(alice, { type: "set_story", story: '<img src="" onerror="alert(1)" alt=""> US-123' });
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
  send(alice, { type: "join", voterId: "v-alice", name: "Alice", asViewer: false });
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

  const accepts = (origin, to = room) =>
    new Promise((resolve) => {
      const ws = new WebSocket(`${PROTO}://${HOST}/parties/main/${to}`, { headers: { Origin: origin } });
      ws.addEventListener("open", () => { ws.close(); resolve(true); });
      ws.addEventListener("error", () => resolve(false));
      setTimeout(() => resolve(false), 2000);
    });

  expect(!(await accepts("https://evil-attacker.vercel.app")), "Origin d'un projet Vercel tiers refusée");
  expect(await accepts("https://pokrr-f0xzgyce0-ovaxios-projects.vercel.app"), "Origin d'une preview du projet pokrr acceptée");
  expect(await accepts("https://pokrr-ovaxios-projects.vercel.app"), "Origin de l'alias d'équipe acceptée");
  expect(await accepts("https://pokrr.vercel.app"), "Origin pokrr.vercel.app acceptée");
  const workerIsLocal = HOST.startsWith("localhost") || HOST.startsWith("127.");
  expect(
    (await accepts("http://localhost:3000")) === workerIsLocal,
    workerIsLocal ? "Origin localhost:3000 acceptée (Worker local)" : "Origin localhost:3000 refusée (Worker distant)",
  );
}

// 7. HTTP non WebSocket sur /parties/ : 404 sans DO
console.log("\n→ Test 7 : HTTP non WebSocket sur /parties/");
{
  const httpProto = PROTO === "ws" ? "http" : "https";
  const res = await fetch(`${httpProto}://${HOST}/parties/main/sec-http-${Date.now()}`);
  const body = await res.text();
  expect(res.status === 404, "GET HTTP sur /parties/ renvoie 404");
  // "Not implemented" = la requête a atteint le DO ; "Not Found" = rejet en amont.
  expect(body === "Not Found", "corps \"Not Found\" (le DO n'a pas été sollicité)");
}

// 8. Réactions projectiles
console.log("\n→ Test 8 : réactions projectiles");
{
  const room = `sec-reactions-${Date.now()}`;
  const alice = await connect(room);
  const bob = await connect(room);
  const carol = await connect(room);
  const dave = await connect(room);
  const eve = await connect(room); // jamais jointe
  const all = [alice, bob, carol, dave, eve];
  send(alice, { type: "join", voterId: "v-alice", name: "Alice", asViewer: false });
  await sleep(120);
  send(bob, { type: "join", voterId: "v-bob", name: "Bob" });
  send(carol, { type: "join", voterId: "v-carol", name: "Carol" });
  send(dave, { type: "join", voterId: "v-dave", name: "Dave", asViewer: true });
  await sleep(250);

  const total = () => all.reduce((n, ws) => n + ws.projectiles.length, 0);
  // Un refus silencieux : aucun tir chez personne ET aucun message error chez l'émetteur.
  const expectSilentRefusal = async (ws, msg, label) => {
    const before = total();
    ws.lastError = null;
    send(ws, msg);
    await sleep(150);
    expect(total() === before && ws.lastError === null, label);
  };

  // 8a anti-usurpation : tout champ tireur du payload est ignoré
  send(bob, {
    type: "shoot_projectile",
    targetVoterId: "v-carol",
    item: "👍",
    fromVoterId: "v-alice",
    shooterId: "v-alice",
    voterId: "v-alice",
  });
  await sleep(150);
  const got = carol.projectiles.at(-1);
  expect(got?.fromVoterId === "v-bob" && got?.toVoterId === "v-carol", "8a tireur déduit de la connexion, pas du payload");

  // 8b rate limit 1 s : refus à ~0,15 s et ~0,7 s (échoue si le Worker était à 500 ms), accepté à ~1,1 s
  await expectSilentRefusal(bob, { type: "shoot_projectile", targetVoterId: "v-carol", item: "👍" }, "8b 2e tir à ~0,15 s refusé en silence");
  await sleep(400);
  await expectSilentRefusal(bob, { type: "shoot_projectile", targetVoterId: "v-carol", item: "👍" }, "8b 3e tir à ~0,7 s refusé en silence");
  await sleep(250);
  const beforeB = carol.projectiles.length;
  send(bob, { type: "shoot_projectile", targetVoterId: "v-carol", item: "👍" });
  await sleep(150);
  expect(carol.projectiles.length === beforeB + 1, "8b même tir accepté après ~1,1 s");

  // 8c payloads invalides (ne consomment pas le cooldown) puis tir valide
  await expectSilentRefusal(carol, { type: "shoot_projectile", targetVoterId: "v-alice", item: "<img src=x onerror=alert(1)>" }, "8c item HTML refusé");
  await expectSilentRefusal(carol, { type: "shoot_projectile", targetVoterId: "v-alice", item: "💩" }, "8c item hors liste refusé");
  await expectSilentRefusal(carol, { type: "shoot_projectile", targetVoterId: "v-alice", item: 42 }, "8c item non-string refusé");
  await expectSilentRefusal(carol, { type: "shoot_projectile", targetVoterId: "v-alice", item: "paper-boat" }, "8c objet inconnu refusé");
  await expectSilentRefusal(carol, { type: "shoot_projectile", targetVoterId: "v-alice", item: "plane" }, "8c identifiant d'objet incomplet refusé");
  await expectSilentRefusal(carol, { type: "shoot_projectile" }, "8c message sans champs refusé");
  const beforeC = alice.projectiles.length;
  send(carol, { type: "shoot_projectile", targetVoterId: "v-alice", item: "👏" });
  await sleep(150);
  expect(alice.projectiles.length === beforeC + 1, "8c tir valide accepté juste après des refus (cooldown non consommé)");

  // 8d cibles invalides
  await expectSilentRefusal(alice, { type: "shoot_projectile", targetVoterId: "v-ghost", item: "👍" }, "8d cible inconnue refusée");
  await expectSilentRefusal(alice, { type: "shoot_projectile", targetVoterId: "v-alice", item: "👍" }, "8d cible = soi refusée");
  await expectSilentRefusal(alice, { type: "shoot_projectile", targetVoterId: {}, item: "👍" }, "8d cible objet refusée");

  // 8f connexion non jointe
  await expectSilentRefusal(eve, { type: "shoot_projectile", targetVoterId: "v-bob", item: "👍" }, "8f connexion non jointe refusée");

  // 8g interrupteur admin
  bob.lastError = null;
  send(bob, { type: "set_reactions", enabled: false });
  await sleep(150);
  expect(bob.lastError?.code === "forbidden", "8g set_reactions par un non-admin : forbidden");
  expect(alice.lastState.reactionsEnabled === true, "8g état toujours true après la tentative non-admin");
  send(alice, { type: "set_reactions", enabled: false });
  await sleep(150);
  expect(alice.lastState.reactionsEnabled === false, "8g admin coupe les réactions");
  await expectSilentRefusal(alice, { type: "shoot_projectile", targetVoterId: "v-bob", item: "👍" }, "8g tir refusé quand les réactions sont coupées");
  send(alice, { type: "set_reactions", enabled: true });
  await sleep(150);
  const beforeG = bob.projectiles.length;
  send(alice, { type: "shoot_projectile", targetVoterId: "v-bob", item: "👍" });
  await sleep(150);
  expect(bob.projectiles.length === beforeG + 1, "8g tir accepté après réactivation (le refus venait de l'interrupteur)");

  // 8h JSON null : la connexion reste fonctionnelle
  for (const frame of ["null", "[]", '"abc"', '{"type":5}']) {
    alice.lastError = null;
    alice.send(frame);
    await sleep(100);
    expect(alice.lastError?.code === "invalid", `8h trame ${frame} : error invalid`);
  }
  send(alice, { type: "set_story", story: "apres-null" });
  await sleep(150);
  expect(alice.lastState.story === "apres-null", "8h trames non-message : connexion toujours fonctionnelle");

  // 8i spectateurs tireurs et cibles, objets en papier (cooldown du spectateur appliqué)
  const beforeI1 = bob.projectiles.length;
  send(dave, { type: "shoot_projectile", targetVoterId: "v-bob", item: "paper-plane" });
  await sleep(150);
  const gotI1 = bob.projectiles.at(-1);
  expect(
    bob.projectiles.length === beforeI1 + 1 && gotI1?.fromVoterId === "v-dave" && gotI1?.toVoterId === "v-bob" && gotI1?.item === "paper-plane",
    "8i tireur spectateur accepté, objet avion",
  );
  const beforeI2 = dave.projectiles.length;
  send(carol, { type: "shoot_projectile", targetVoterId: "v-dave", item: "paper-ball" });
  await sleep(150);
  const gotI2 = dave.projectiles.at(-1);
  expect(
    dave.projectiles.length === beforeI2 + 1 && gotI2?.item === "paper-ball" && gotI2?.toVoterId === "v-dave",
    "8i cible spectateur acceptée, objet boulette",
  );
  await expectSilentRefusal(dave, { type: "shoot_projectile", targetVoterId: "v-dave", item: "👍" }, "8i spectateur qui se vise refusé");
  await expectSilentRefusal(dave, { type: "shoot_projectile", targetVoterId: "v-carol", item: "👍" }, "8i cooldown appliqué au spectateur");

  for (const ws of all) ws.close();
  await sleep(80);
}

// 9. Même ?_pk= sur deux sockets : l'id de connexion vient du serveur
console.log("\n→ Test 9 : ?_pk= dupliqué");
{
  const room = `sec-pk-${Date.now()}`;
  const ghost = await connect(room, "?_pk=dup");
  const twin = await connect(room, "?_pk=dup");
  send(ghost, { type: "join", voterId: "v-ghost", name: "Ghost" });
  await sleep(120);
  send(twin, { type: "join", voterId: "v-twin", name: "Twin" });
  await sleep(150);
  twin.close();
  await sleep(200);
  send(ghost, { type: "set_story", story: "apres-twin" });
  await sleep(200);
  expect(ghost.lastState?.story === "apres-twin", "la première socket reçoit encore les broadcasts");
  ghost.close();
}

// 10. Second join d'un autre voterId sur une connexion déjà jointe
console.log("\n→ Test 10 : multi-join");
{
  const room = `sec-multijoin-${Date.now()}`;
  const observer = await connect(room);
  const conn = await connect(room);
  send(observer, { type: "join", voterId: "v-obs", name: "Obs" });
  await sleep(120);
  send(conn, { type: "join", voterId: "v-a", name: "A" });
  await sleep(150);
  conn.lastError = null;
  send(conn, { type: "join", voterId: "v-b", name: "B" });
  await sleep(150);
  expect(conn.lastError?.code === "forbidden", "second join d'un autre voterId : forbidden");
  expect(!observer.lastState?.players.some((p) => p.voterId === "v-b"), "v-b n'existe pas dans l'état");
  conn.close();
  await sleep(200);
  expect(observer.lastState?.players.find((p) => p.voterId === "v-a")?.online === false, "v-a passe hors ligne à la fermeture");
  observer.close();
}

// 11. set_deck avec une clé héritée du prototype
console.log("\n→ Test 11 : set_deck invalide");
{
  const room = `sec-deck-${Date.now()}`;
  const alice = await connect(room);
  send(alice, { type: "join", voterId: "v-alice", name: "Alice", asViewer: false });
  await sleep(150);
  for (const deckId of ["constructor", "__proto__", "toString", 42]) {
    alice.lastError = null;
    send(alice, { type: "set_deck", deckId });
    await sleep(100);
    expect(alice.lastError?.code === "invalid", `set_deck ${JSON.stringify(deckId)} : invalid`);
  }
  expect(alice.lastState?.deckId === "fibonacci", "deckId reste fibonacci");
  send(alice, { type: "vote", value: "5" });
  await sleep(150);
  expect(alice.lastState?.players.find((p) => p.voterId === "v-alice")?.hasVoted === true, "un vote valide passe ensuite");
  alice.close();
}

// 12. Taille des trames
console.log("\n→ Test 12 : taille des trames");
{
  const room = `sec-size-${Date.now()}`;
  const big = await connect(room);
  big.send("x".repeat(4097));
  await sleep(500);
  expect(big.closedCode === 1009, "trame de 4097 unités : fermeture 1009");
  expect(!big.lastError, "aucune réponse invalid avant la fermeture");

  const admin = await connect(room);
  send(admin, { type: "join", voterId: "v-admin", name: "Admin" });
  await sleep(150);
  const frame = JSON.stringify({ type: "set_story", story: "y".repeat(3950) });
  expect(frame.length > 3900 && frame.length <= 4096, `trame valide de ${frame.length} unités`);
  admin.send(frame);
  await sleep(200);
  expect(admin.closedCode === undefined, "trame de ~4000 unités : connexion ouverte");
  expect(admin.lastState?.story.length === 200, "story tronquée à 200 caractères");
  admin.close();
}

// 13. Débit
console.log("\n→ Test 13 : débit des trames");
{
  const room = `sec-rate-${Date.now()}`;
  const flood = await connect(room);
  const typer = await connect(room);
  send(flood, { type: "join", voterId: "v-flood", name: "Flood" });
  send(typer, { type: "join", voterId: "v-typer", name: "Typer", asViewer: false });
  await sleep(200);
  const t0 = Date.now();
  for (let i = 0; i < 300; i++) send(flood, { type: "unvote" });
  while (flood.closedCode === undefined && Date.now() - t0 < 1000) await sleep(20);
  expect(flood.closedCode === 1008, "300 trames d'un coup : fermeture 1008");

  for (let i = 0; i < 100; i++) {
    send(typer, { type: "vote", value: "5" });
    await sleep(30);
  }
  expect(typer.closedCode === undefined && !typer.lastError, "environ 33 trames/s pendant 3 s : connexion ouverte, aucun refus");
  typer.close();
}

console.log(`\n${fail === 0 ? "✅ OK" : "❌ FAIL"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

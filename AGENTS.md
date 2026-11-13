<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# pokrr : guide pour les agents

> Le bloc ci-dessus est géré par `next dev` (seul le contenu entre ses balises est réécrit). Tout ce qui suit est maintenu à la main.

Planning poker en ligne, gratuit, sans pub, sans inscription : https://pokrr.app. Front Next.js sur Vercel, serveur de salles temps réel sur Cloudflare (Worker PartyServer + Durable Objects). Coût cible : 0 € par mois.

## À savoir avant toute modification

- **Utilisateur réel en production** : l'équipe Boiron s'en sert pour ses refinements. Aucun changement visible (UX, textes, comportement d'une salle) sans accord explicite du mainteneur.
- **Déployer le Worker vide toutes les salles en cours** (`npm run party:deploy` redémarre les Durable Objects). Ne jamais le lancer pendant une session Boiron. Un déploiement Vercel (front) ne touche pas aux salles.
- **Promesses de la copy à respecter** : une salle vit tant qu'un onglet est connecté, se ferme après 2 h sans aucune action (code WebSocket 4001, sans reconnexion), puis disparaît 1 à 3 min après la dernière déconnexion. Ne jamais écrire « 4h », ne jamais promettre de vote asynchrone, aucune donnée côté serveur.
- **Pas de commit ni de push** sans demande explicite. Branches créées depuis `main`, sans tracking vers `origin/main`. `main` est protégée : on passe par une PR, mergée à la main par le mainteneur.
- **Pas de tiret cadratin** dans les textes rédigés (copy, docs, commentaires, messages de commit).

## Architecture

```
navigateur ── HTTPS ──> Vercel : Next.js 16 (App Router, React 19, Tailwind v4)
     │                     └─ src/proxy.ts : locale, CSP à nonce, noindex des previews
     └──── WSS ────> Cloudflare : Worker `pokrr` (PartyServer)
                         └─ 1 Durable Object par salle, état en mémoire uniquement
```

- **Protocole partagé client/serveur** : `party/types.ts` (messages, `LIMITS`). Toute évolution du protocole touche les deux côtés et les smokes.
- **Logique de jeu pure** : `party/domain/GameRoom.ts` (votes, révélation, admins, élection), testée en unitaire. `party/index.ts` ne fait que l'adapter au transport.
- **Client** : `src/lib/usePokrrRoom.ts` ouvre le WebSocket avec `partysocket` (`new PartySocket({ host, room })`, party `main` par défaut, reconnexion automatique infinie).
- **Hôte du Worker** : `NEXT_PUBLIC_PARTYKIT_HOST` (nom historique conservé), lu par le client, la CSP (`src/proxy.ts`) et `/api/health`.

## Arborescence utile

```
party/                       Worker PartyServer (tsconfig dédié : party/tsconfig.json)
  index.ts                   classe PokrrRoom + fetch du Worker (routePartykitRequest)
  domain/GameRoom.ts         logique de jeu, GameError.ts
  security.ts                origine autorisée, IP client, rate limit
  sanitize.ts, types.ts, log.ts
src/app/[lang]/              routes localisées (fr, en) : home, room/[code], blog, status, landings
src/app/room/[code]/         composants de la salle (_RoomClient, _CardDeck, _PlayerList, _ResultsPanel...)
                             importés par src/app/[lang]/room/[code]/page.tsx
src/app/api/health/          GET /api/health (statut + hôte du Worker)
src/i18n/                    dictionnaires typés fr.ts / en.ts, DictContext
src/content/blog/{fr,en}/    articles MDX
src/lib/                     hook temps réel, stats, raccourcis, voterId, thème
scripts/smoke-*.mjs          smokes WebSocket (room, security, admin-election, idle-expiry)
tests/unit/                  vitest (domain, lib, party)
e2e/                         Playwright
wrangler.jsonc               config du Worker (binding Main, migration v1 SQLite)
PRODUCT.md, DESIGN.md        positionnement et design system : à lire avant toute UI
```

## Commandes

```bash
npm run dev               # Next (3000) + wrangler dev (1999) via concurrently
npm run lint
npx tsc --noEmit          # typecheck du front (le Worker en est exclu)
npm run typecheck:party   # génère les types wrangler puis typecheck du Worker
npm run build
npm test                  # vitest
npm run knip              # aussi lancé par le hook pre-commit husky
npm run smoke             # nécessite npm run dev (ou POKRR_HOST=<hôte>)
npm run smoke:security    # jusqu'à 25 connexions
npm run smoke:election    # local uniquement (POKRR_ADMIN_GRACE_MS=2000)
npm run smoke:idle        # local uniquement (POKRR_IDLE_TIMEOUT_MS=8000, POKRR_JOIN_TIMEOUT_MS=5000)
npm run test:e2e          # Playwright, nécessite npm run dev
```

**Avant de proposer un commit**, rejouer ce que fait la CI (`.github/workflows/ci.yml`) : lint, `tsc --noEmit`, `typecheck:party`, build, `npm audit --omit=dev --audit-level=high`, tests unitaires, knip, puis les quatre smokes contre `wrangler dev`. Le critère est « 0 échec », pas un nombre d'assertions figé.

Node 24 (version de la CI ; aucun `.nvmrc` ni `engines` dans le repo). Sur ce poste, vérifier `node -v` : un `node` du PATH peut être une autre version.

## Worker PartyServer : pièges connus

- **Binding `Main`** dans `wrangler.jsonc` : il produit la route `/parties/main/<salle>` attendue par `partysocket`. Tout autre nom casse le client (400).
- **Garde d'accès** : origine autorisée, IP (`CF-Connecting-IP`) et rate limit (30 connexions par minute et par IP, mémoire par isolate) passent par l'option `onBeforeConnect` de `routePartykitRequest`. Origines acceptées : `pokrr.app` (et `www`), `pokrr.vercel.app`, les previews du projet (`pokrr-*-ovaxios-projects.vercel.app`), et localhost seulement quand le Worker est lui-même joint en localhost (`wrangler dev`). Une requête sans en-tête `Origin` est acceptée (nécessaire aux smokes Node). `onBeforeConnect` retire aussi `?_pk=` de l'URL : l'id de connexion doit être généré par le serveur, sinon deux sockets au même `_pk` partagent une entrée de la table des connexions.
- **`onBeforeRequest` répond toujours `404 Not Found`** : aucun client légitime ne fait de HTTP sur `/parties/`, et sans ce garde chaque GET créerait un Durable Object facturé. Le corps `Not Found` le distingue du 404 du DO (`Not implemented`), le smoke de sécurité s'en sert.
- **Pas d'hibernation** (`hibernate: false`) : l'état est en mémoire, l'hibernation l'effacerait. Conséquence : une salle connectée consomme du quota en continu, plafonné par la coupure d'inactivité (`POKRR_IDLE_TIMEOUT_MS`, 2 h par défaut, repoussée seulement par une action acceptée d'un joueur joint ; une reconnexion ne la repousse pas, l'échéance est calculée depuis la dernière action ; minuterie `setTimeout` annulée à la dernière déconnexion).
- **Budget de connexions des smokes** : la limite de 30 connexions par minute et par IP s'applique aussi à `wrangler dev` ; `smoke:security` en ouvre jusqu'à 25, d'où le `sleep 60` avant l'élection en CI et la pause d'environ 1 min à respecter entre smokes en local (sinon 429).
- **Trames et connexions sans `join`** : trame de plus de `LIMITS.maxFrameLength` unités fermée en 1009 avant `JSON.parse` ; seau par connexion (`LIMITS.framesPerSecond`, `LIMITS.frameBurst`) fermé en 1008 ; connexion sans `join` fermée en 4002 après `POKRR_JOIN_TIMEOUT_MS` (5 min par défaut, le client se reconnecte, invisible). Le seau borne chaque connexion, pas le total. Toute minuterie par connexion est annulée à la fermeture, sinon elle retient le DO.
- **Minuterie d'élection d'admin** (`POKRR_ADMIN_GRACE_MS`, 1 min par défaut) : à la déconnexion de l'admin, elle garde le DO actif 1 min (environ 8 GB-s par salle). Le smoke d'élection reste prévu pour le local ; contre la prod il faut passer `POKRR_ADMIN_GRACE_MS=60000` au script.
- **Variables du Worker** : en local via `.env` (ne pas créer de `.dev.vars`, wrangler ignorerait alors `.env`) ; `process.env` fonctionne grâce à `nodejs_compat`. En prod, aucune `vars` n'est définie : défauts du code.
- **Types** : `party/worker-configuration.d.ts` est généré par `npm run party:types` et hors git. Ne jamais remettre `party/index.ts` dans le `tsconfig.json` racine (les types Workers casseraient `next build`).
- Tester un serveur local : arrêter ses propres process par PID, jamais `pkill` ni `killall` (d'autres projets tournent sur ce poste).

## Front Next.js

- **CSP** construite dans `src/proxy.ts` (nonce par requête). `connect-src` dérive de `NEXT_PUBLIC_PARTYKIT_HOST` (`wss://` et `https://`). Les autres en-têtes de sécurité sont dans `next.config.ts`.
- **Dette connue** : la CSP `style-src` bloque les attributs `style="..."` (délais d'animation, largeurs de barres) depuis juin 2026. À traiter dans un chantier dédié, pas en passant. Ce qui reste permis : propriétés posées via CSSOM (`el.style.x = ...`, `style={{}}` sur un élément monté après hydratation) et Web Animations API (`element.animate`). En dev, `style-src` ajoute `'unsafe-inline'` : une violation CSP ne se constate que sur un build de prod.
- **`anim-fade-up` laisse un transform permanent** : avec `animation-fill-mode: both`, les éléments animés (dont les cartes joueur du premier rendu) gardent un transform identité, donc un descendant en `position: fixed` se place par rapport à eux et non au viewport. Mesurer l'origine réelle du bloc conteneur, ou rendre l'élément hors de la carte.
- **Edge Runtime déprécié** : les 5 `opengraph-image.tsx` déclarent `runtime = "edge"`. Suivi prévu : passer au runtime Node.js et vérifier les images de partage en preview.
- **`NEXT_PUBLIC_*` est figé au build** : changer la variable sur Vercel exige un redeploy sans build cache. Sur Vercel, ces variables ne peuvent pas être en visibilité `secret` (utiliser `config`).
- **SEO** : URL du site codée en dur `https://pokrr.app` pour le canonical, le sitemap et robots (jamais `VERCEL_URL`), `/<lang>/room/` et `/api/` exclus dans `src/app/robots.ts`, previews `*.vercel.app` en `noindex` (`src/proxy.ts`).
- **i18n** : tout texte visible passe par `src/i18n/fr.ts` et `en.ts`, les deux à jour ensemble.

## Production et surveillance

- Front : Vercel (déploiement automatique au merge sur `main`). Worker : `npm run party:deploy` (`wrangler deploy`) sur le compte Cloudflare du mainteneur, hôte `pokrr.codeblend.workers.dev`.
- Plan Workers **gratuit** : environ 13 000 GB-s de durée par jour pour les Durable Objects. Un dépassement fait tomber les salles jusqu'à 00:00 UTC.
- Surveillance hors repo (VPS du mainteneur) : une sonde de bout en bout toutes les 10 min (salle `__probe__`, sans `join` pour ne pas déclencher la minuterie d'élection) et un relevé horaire du quota, alertes Telegram. Ne pas renommer la salle `__probe__`, ni changer la réponse `not_joined` à un `set_name` sans `join`, sans mettre la sonde à jour. La sonde ferme sa connexion en quelques secondes et n'envoie qu'une trame, donc ni la coupure d'inactivité de 2 h ni la fermeture à 5 min sans `join` ne la concernent.
- Vérifications rapides : `curl https://pokrr.app/api/health`, page `/fr/status`, `npx wrangler tail pokrr`.

## Glossaire

Termes de domaine, extraits du code réel (`party/types.ts`, `party/domain/GameRoom.ts`). Règle de croissance : un terme de domaine ambigu rencontré 2 fois est défini ici par la session qui le rencontre. Un terme qui disparaît du code est retiré.

- **Salle (room)** : 1 Durable Object Cloudflare par salle, état en mémoire, route `/parties/main/<salle>`. Le code de salle est un nanoid sur alphabet sans 0/O/1/I/l (`src/app/_NewRoomButton.tsx`) pour rester dicible.
- **Deck** : liste ordonnée de cartes (`DECKS`, 6 decks). La carte `?` ("je ne sais pas") est toujours présente, `☕` optionnel. Les stats numériques ne portent que sur `numericCards`.
- **Carte (Card)** : une string. `cardToNumber` parse les cartes numériques (`½` → 0.5, `2h` → 2) et retourne null sinon.
- **Vote** : la valeur d'un `voterId`. Jamais envoyée aux autres clients tant que `phase === "voting"` ; `PlayerView` la nulifie hors viewer.
- **Phase** : `"voting" | "revealed"`. Passage en revealed par l'admin, ou automatique si `autoReveal` quand tous ont voté.
- **Reveal** : la révélation des votes, par l'admin (`reveal`) ou automatique si `autoReveal`. Ne remet rien à zéro : les votes restent visibles jusqu'à `reset` ou `nextStory`.
- **Reset** : vidage des votes de la story courante (`clearVotes`, phase → voting, timer annulé), sans toucher à la story. `nextStory` fait pareil en changeant la story.
- **VoterId** : nanoid 16 généré côté client (`src/lib/voterId.ts`), stocké en localStorage. Identité sans compte, c'est la clé de tout message WS.
- **Admin** : joueur élu (élection après déconnexion, minuterie `POKRR_ADMIN_GRACE_MS`, 1 min par défaut). Peut révéler et kicker.
- **RoomState** : état complet de la salle, broadcast à chaque mutation, champ `version` incrémenté. Un champ optionnel absent = fonction antérieure au déploiement du Worker, le client le traite comme indisponible.
- **LIMITS** : garde-fous partagés serveur et client (`party/types.ts`) : nom 24, story 200, 50 joueurs par salle, timer 30 s à 1 h, cooldown projectile 1 s, trame 4 096 unités, 40 trames par seconde (rafale 100).
- **Projectile** : réaction éphémère lancée par un joueur (votant ou spectateur) vers un autre joueur en ligne, spectateurs compris, jamais vers soi. Liste blanche `REACTION_ITEMS` (`party/types.ts`, dans l'ordre de la barre) : 10 emojis d'un seul code point chacun (égalité de chaîne stricte des deux côtés), puis deux objets en papier d'identifiant ASCII (`paper-plane`, `paper-ball`). Champ `item` de `shoot_projectile` et `projectile_thrown`.
- **not_joined** : code d'erreur renvoyé à toute action sans `join` préalable. La sonde VPS s'y appuie ; ne pas en changer la sémantique sans mettre la sonde à jour.

## Références

- `README.md` : présentation, lancement, déploiement, sécurité.
- `PRODUCT.md` : cible, personnalité de marque, anti-références.
- `DESIGN.md` : couleurs, typographie, composants, motion.
- `.claude/skills/impeccable/` : skill de design front du projet.

# pokrr

Planning poker minimaliste : gratuit, sans pub, sans inscription. Stack Next.js 16 + PartyKit (Cloudflare Workers + Durable Objects). Coût d'hébergement cible 0 €/mois en restant dans les free tiers Cloudflare et Vercel.

## Stack

- **Front** : Next.js 16 App Router, Tailwind v4, React 19. Déployé sur Vercel Hobby.
- **Backend temps réel** : PartyKit (= Cloudflare Workers + Durable Objects, un DO par roomId). Déployé sur ton compte Cloudflare.
- **State** : in-memory dans le DO PartyKit (pas de DB). Les rooms hibernent quand inactives → coût ressources ≈ 0.

## Lancer en local

```bash
npm install
npm run dev
```

- Front : http://localhost:3000
- PartyKit : ws://localhost:1999
- Page status : http://localhost:3000/status

Les deux serveurs tournent en parallèle via `concurrently`.

### Tests

Prérequis : `npm run dev` doit tourner dans un autre terminal (port 3000 + 1999).

```bash
npm run smoke           # 17 assertions backend (happy path)
npm run smoke:election  # 7 assertions élection admin auto (POKRR_ADMIN_GRACE_MS=2000)
npm run smoke:security  # 18 assertions sécurité (CSWSH, XSS, admin usurp, voterId, JSON)
npm run test:e2e        # 1 test Playwright (3 voters, happy path complet)
```

Total : **42 assertions backend + 1 E2E**. CI GitHub Actions (`.github/workflows/ci.yml`) joue automatiquement static checks + smokes sur chaque push.

## Déploiement

### 1. PartyKit → ton compte Cloudflare

```bash
npx partykit login         # OAuth Cloudflare via navigateur
npm run party:deploy       # déploie sur pokrr.<ton-compte>.partykit.dev
```

Note l'URL renvoyée, c'est ton `NEXT_PUBLIC_PARTYKIT_HOST` pour Vercel.

### 2. Front → Vercel

```bash
npx vercel login           # OAuth Vercel
npx vercel                 # premier deploy, prompts → accepter les défauts
# Ajouter la variable d'env côté Vercel (Settings → Environment Variables) :
#   NEXT_PUBLIC_PARTYKIT_HOST = pokrr.<ton-compte>.partykit.dev
#   (optionnel) NEXT_PUBLIC_SITE_URL = https://<ton-domaine>
npx vercel --prod          # production deploy
```

### 3. Custom domain (optionnel)

- **Vercel** : Project → Settings → Domains → ajouter `pokrr.app` (ou autre).
- **PartyKit** : Cloudflare Workers Routes → mapper un sous-domaine type `ws.pokrr.app` vers ton script Worker (sinon garder l'URL `*.partykit.dev`).

### 4. Smoke test prod

```bash
# Sanité de base
curl -sS https://<ton-domaine>/api/health | jq

# Page de statut visuelle
open https://<ton-domaine>/status
```

Ouvre la home, crée une salle, ouvre le lien dans un 2e navigateur, vote, vérifie auto-reveal.

## Variables d'environnement

Voir `.env.example`. Récap :

| Variable | Côté | Rôle |
|---|---|---|
| `NEXT_PUBLIC_PARTYKIT_HOST` | Next | Hostname PartyKit (sans protocole) |
| `NEXT_PUBLIC_SITE_URL` | Next | URL canonique pour `metadataBase` OG/Twitter (optionnel) |
| `POKRR_ADMIN_GRACE_MS` | PartyKit (`.env` ou `partykit.json vars`) | Fenêtre grâce avant élection admin auto (défaut 15 min) |

## Structure

```
src/app/
  page.tsx              # Home (créer / rejoindre)
  layout.tsx            # Metadata OG/Twitter, fonts system
  icon.svg              # Favicon SVG indigo
  opengraph-image.tsx   # OG card 1200×630 générée dynamiquement
  api/health/route.ts   # GET /api/health JSON
  status/               # Page statut publique
  room/[code]/
    page.tsx            # Server shell qui passe le code
    _RoomClient.tsx     # Hub UI (pre-rendered shell + JoinModal overlay)
    _CardDeck.tsx       # 14 cartes Fibonacci + ∞ + ? + ☕, grille 4×4 mobile
    _PlayerList.tsx     # Cartes joueurs avec flip 3D 400ms au reveal
    _ResultsPanel.tsx   # Moyenne, médiane, suggestion Fibonacci, distribution
    _AdminBar.tsx       # Reveal / reset / next story / toggle auto-reveal
    _StoryHeader.tsx    # Édition titre story (admin)
    _JoinModal.tsx      # Pseudo first-time (overlay)
    _ShareDialog.tsx    # Code grand + QR + copier
    _HelpDialog.tsx     # Modal raccourcis clavier
src/lib/
  usePokrrRoom.ts       # Hook PartySocket + state local
  useRoomShortcuts.ts   # Raccourcis 0-9, ?, Space (admin), R (admin)
  voterId.ts            # localStorage voterId nanoid 16
  stats.ts              # Calcul stats post-reveal
party/
  index.ts              # Serveur PartyKit (11 events tracés, rate-limit IP, admin election)
  types.ts              # Protocole partagé client/server
scripts/
  smoke-room.mjs        # Test bout-en-bout (17 assertions)
  smoke-admin-election.mjs # Test élection admin (7 assertions)
```

## Sécurité

- Room ID : `nanoid(10)` dans un alphabet sans ambiguïté visuelle (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`).
- voterId : `nanoid(16)` URL-safe, généré et stocké côté client (`localStorage`).
- Headers (`next.config.ts`) : CSP, X-Frame-Options DENY, X-CTO nosniff, Referrer-Policy, Permissions-Policy, HSTS en prod.
- Rate-limit : 30 connexions WS / min / IP (en mémoire par isolate Worker).
- Validation : whitelist deck côté serveur, strip `<` `>` sur pseudos / titres, max 24 chars pseudo / 200 chars story.
- Cap : 50 voters par salle.

## Observabilité

- `GET /api/health` : status + uptime.
- Page `/status` : check visuel des deux services.
- Logs structurés JSON côté PartyKit (`wrangler tail` en prod, console en dev). voterId tronqué 8 chars (anti-exfiltration).

## Accessibilité (Lighthouse desktop prod : 100/100)

- Keyboard nav : 0-9 votent par position, `?` carte ?, `Space` reveal (admin), `R` reset (admin).
- ARIA : `role="radiogroup"` + `aria-checked` sur le deck, `aria-live` sur le compteur, `sr-only h1`, `aria-label` sur boutons icon-only.
- Contraste WCAG AA partout (`text-neutral-400` minimum sur fond `neutral-950`).
- `prefers-reduced-motion` désactive l'animation flip.

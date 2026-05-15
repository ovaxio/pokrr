# pokrr

Planning poker minimaliste : gratuit, sans pub, sans inscription. Stack Next.js 16 + PartyKit (Cloudflare Workers + Durable Objects).

## Lancer en local

```bash
npm install
npm run dev
```

- Front Next.js : http://localhost:3000
- PartyKit server : ws://localhost:1999

`npm run dev` lance les deux en parallèle via `concurrently`.

## Variables d'environnement

Voir `.env.example`. En local, `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999`.

## Déploiement

- Front : Vercel (auto sur push si connecté).
- PartyKit : `npm run party:deploy` → déploie sur ton compte Cloudflare (free tier).

## Structure

```
src/app/            # Next.js App Router
party/              # PartyKit server (Durable Object par room)
partykit.json       # Config PartyKit
```

## État (étape 0 — squelette)

- Next.js 16 App Router + TypeScript + Tailwind v4.
- PartyKit server hello world (`party/index.ts`) qui broadcast les messages.
- Smoke test sur la home : indicateur de connexion WebSocket en bas de page.

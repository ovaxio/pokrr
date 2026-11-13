// Durées des minuteries du Worker. Les variables d'env (POKRR_*) sont prioritaires.

// Grâce avant élection automatique d'un nouvel admin quand le dernier admin se déconnecte.
export const DEFAULT_ADMIN_GRACE_MS = 60 * 1000;

// Fermeture d'une salle sans aucune action acceptée d'un joueur joint pendant cette durée.
// Si cette valeur change, mettre à jour la copy « 2 h » (src/i18n/fr.ts, en.ts, landing remote).
export const DEFAULT_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

// Une connexion qui n'a pas fait `join` dans ce délai est fermée (le client se reconnecte).
export const DEFAULT_JOIN_TIMEOUT_MS = 5 * 60 * 1000;

export function readPositiveMs(env: unknown, key: string, fallback: number): number {
  if (!env || typeof env !== "object") return fallback;
  const raw = Number((env as Record<string, unknown>)[key]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

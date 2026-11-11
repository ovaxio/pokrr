// Réaction "armée" (emoji ou objet en papier) : choisie une fois dans la barre, mémorisée
// dans le navigateur (préférence d'UI, jamais envoyée au serveur).
import { isReactionItem, type ReactionItem } from "../../party/types";

const ARMED_KEY = "pokrr:reactionItem";

// Une valeur hors liste (saisie à la main, élément retiré depuis, ancienne clé) vaut "rien d'armé".
export function getArmedItem(): ReactionItem | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ARMED_KEY);
  return isReactionItem(raw) ? raw : null;
}

export function storeArmedItem(item: ReactionItem | null): void {
  if (typeof window === "undefined") return;
  if (item === null) window.localStorage.removeItem(ARMED_KEY);
  else window.localStorage.setItem(ARMED_KEY, item);
}

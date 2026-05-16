// Protocole partagé serveur ↔ client. Importé par les deux côtés.

// --- Decks ---
// Chaque deck = liste ordonnée de cartes. Les cartes sont des strings (les numériques
// sont parsés comme nombre côté stats si la deck l'indique). La carte "?" est toujours
// présente (vote "je ne sais pas"). "☕" optionnel selon préférence.

export type Deck = {
  id: string;
  label: string;
  cards: readonly string[];
  numericCards: readonly string[]; // cartes utilisées pour les stats numériques
};

export const DECKS: Record<string, Deck> = {
  fibonacci: {
    id: "fibonacci",
    label: "Fibonacci",
    cards: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "∞", "?", "☕"] as const,
    numericCards: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"] as const,
  },
  "fibonacci-mod": {
    id: "fibonacci-mod",
    label: "Fibonacci modifiée",
    cards: ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "∞", "?", "☕"] as const,
    numericCards: ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"] as const,
  },
  tshirt: {
    id: "tshirt",
    label: "T-shirt",
    cards: ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"] as const,
    numericCards: [] as const, // pas de stats numériques
  },
  "powers-of-2": {
    id: "powers-of-2",
    label: "Powers of 2",
    cards: ["0", "1", "2", "4", "8", "16", "32", "64", "?", "☕"] as const,
    numericCards: ["0", "1", "2", "4", "8", "16", "32", "64"] as const,
  },
  hours: {
    id: "hours",
    label: "Heures",
    cards: ["1h", "2h", "4h", "8h", "16h", "24h", "?", "☕"] as const,
    numericCards: ["1h", "2h", "4h", "8h", "16h", "24h"] as const,
  },
};

export const DEFAULT_DECK_ID = "fibonacci";

// Compat : DECK = cartes du deck par défaut, NUMERIC_CARDS idem.
// Utilisé par les anciens imports (useRoomShortcuts, smoke tests).
export const DECK = DECKS[DEFAULT_DECK_ID].cards;
export type Card = string;
export const NUMERIC_CARDS: ReadonlyArray<string> = DECKS[DEFAULT_DECK_ID].numericCards;

// Parse une carte d'un deck "hours" ou "powers-of-2" en nombre. Retourne null si non parseable.
export function cardToNumber(deck: Deck, card: string): number | null {
  if (!deck.numericCards.includes(card)) return null;
  // Pour "Heures" : strip 'h' final
  if (deck.id === "hours") return Number(card.replace(/h$/, ""));
  // Pour "Fibonacci modifiée" : ½ → 0.5
  if (card === "½") return 0.5;
  const n = Number(card);
  return Number.isFinite(n) ? n : null;
}

export type Phase = "voting" | "revealed";

export const LIMITS = {
  maxNameLength: 24,
  maxStoryLength: 200,
  maxPlayersPerRoom: 50,
  maxVoterIdLength: 64,
  minTimerSec: 30,
  maxTimerSec: 60 * 60, // 1h max
} as const;

// --- Timer ---
export type TimerInfo = {
  startedAt: number; // epoch ms
  durationSec: number;
};

// Vue publique d'un joueur, envoyée à tous les clients.
// La valeur du vote n'est révélée que si phase === "revealed".
export type PlayerView = {
  voterId: string;
  name: string;
  hasVoted: boolean;
  vote: Card | null;
  isAdmin: boolean;
  online: boolean;
};

// État complet d'une salle, broadcasté à chaque mutation.
export type RoomState = {
  type: "room_state";
  roomId: string;
  story: string;
  phase: Phase;
  autoReveal: boolean;
  players: PlayerView[];
  deckId: string;
  timer: TimerInfo | null;
  version: number;
};

export type ErrorCode =
  | "forbidden"
  | "invalid"
  | "room_full"
  | "not_joined"
  | "rate_limited";

export type ErrorMessage = {
  type: "error";
  code: ErrorCode;
  message: string;
};

export type KickedMessage = {
  type: "kicked";
  reason: string;
};

export type ServerMessage = RoomState | ErrorMessage | KickedMessage;

// Messages client → serveur. Tous nécessitent que le client ait fait `join` au préalable
// (sauf `join` lui-même).
export type ClientMessage =
  | { type: "join"; voterId: string; name: string }
  | { type: "set_name"; name: string }
  | { type: "vote"; value: Card }
  | { type: "unvote" }
  | { type: "reveal" } // admin
  | { type: "reset" } // admin — re-vote sur la même story
  | { type: "next_story"; story: string } // admin — nouvelle story, votes effacés
  | { type: "set_story"; story: string } // admin — édition titre sans reset
  | { type: "set_auto_reveal"; enabled: boolean } // admin
  | { type: "kick"; voterId: string } // admin
  | { type: "transfer_admin"; voterId: string } // admin
  | { type: "set_deck"; deckId: string } // admin — change le deck (refusé si vote en cours)
  | { type: "start_timer"; durationSec: number } // admin — démarre / redémarre le timer
  | { type: "stop_timer" }; // admin — arrête le timer

// Protocole partagé serveur ↔ client. Importé par les deux côtés.

// --- Decks ---
// Chaque deck = liste ordonnée de cartes. Les cartes sont des strings (les numériques
// sont parsés comme nombre côté stats si la deck l'indique). La carte "?" est toujours
// présente (vote "je ne sais pas"). "☕" optionnel selon préférence.

type Deck = {
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
  "fibonacci-half": {
    id: "fibonacci-half",
    label: "Fibonacci + ½",
    cards: ["0", "½", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "∞", "?", "☕"] as const,
    numericCards: ["0", "½", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"] as const,
  },
  "fibonacci-mod": {
    id: "fibonacci-mod",
    label: "Fibonacci modifiée",
    cards: ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "∞", "?", "☕"] as const,
    numericCards: ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100"] as const,
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

// Object.hasOwn : un id comme "constructor" ou "__proto__" ne doit pas résoudre un membre hérité.
export function getDeck(id: string): Deck {
  return Object.hasOwn(DECKS, id) ? DECKS[id] : DECKS[DEFAULT_DECK_ID];
}

export type Card = string;

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

// Liste blanche des réactions lançables, dans l'ordre de la barre. Emojis : un seul
// code point chacun (pas de VS16, ZWJ ni teinte) pour une égalité de chaîne stricte
// des deux côtés. Objets en papier : identifiant ASCII. Modifier la liste exige un
// redéploiement du Worker.
export const REACTION_ITEMS = [
  "\u{1F44D}", // pouce haut
  "\u{1F44E}", // pouce bas
  "\u{1F44F}", // applaudissements
  "\u{1F602}", // rire aux larmes
  "\u{1F914}", // réflexion
  "\u{1F62E}", // surprise
  "\u{1F525}", // feu
  "\u{1F3AF}", // cible
  "\u2615", // café
  "\u{1F680}", // fusée
  "paper-plane", // avion en papier
  "paper-ball", // boulette de papier
] as const;

export type ReactionItem = (typeof REACTION_ITEMS)[number];

export function isReactionItem(v: unknown): v is ReactionItem {
  return typeof v === "string" && (REACTION_ITEMS as readonly string[]).includes(v);
}

export const LIMITS = {
  maxNameLength: 24,
  maxStoryLength: 200,
  maxPlayersPerRoom: 50,
  maxVoterIdLength: 64,
  minTimerSec: 30,
  maxTimerSec: 60 * 60, // 1h max
  projectileCooldownMs: 1000, // 1 tir accepté par voterId par seconde
  maxFrameLength: 4096, // unités UTF-16 (raw.length) ; la plus grosse trame légitime en fait environ 1250
  framesPerSecond: 40, // marge pour les onglets d'avant le filtre e.repeat, qui envoient encore la répétition clavier
  frameBurst: 100,
} as const;

// Code de fermeture WebSocket envoyé quand une salle expire faute d'activité.
// Le client ne se reconnecte pas sur ce code (src/lib/usePokrrRoom.ts).
export const ROOM_EXPIRED_CLOSE_CODE = 4001;

// Connexion restée sans `join` trop longtemps. Le client se reconnecte sur ce code,
// comme sur tout code autre que 4001.
export const JOIN_TIMEOUT_CLOSE_CODE = 4002;

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
  isViewer: boolean;
  online: boolean;
};

// État complet d'une salle, broadcasté à chaque mutation.
export type RoomState = {
  type: "room_state";
  roomId: string;
  story: string;
  phase: Phase;
  autoReveal: boolean;
  // Absent sur un Worker antérieur à la fonction réactions : le client traite
  // un champ non booléen comme "fonction indisponible".
  reactionsEnabled?: boolean;
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

type ErrorMessage = {
  type: "error";
  code: ErrorCode;
  message: string;
};

type KickedMessage = {
  type: "kicked";
  reason: string;
};

export type ProjectileThrownMessage = {
  type: "projectile_thrown";
  fromVoterId: string;
  toVoterId: string;
  item: ReactionItem;
};

export type ServerMessage = RoomState | ErrorMessage | KickedMessage | ProjectileThrownMessage;

// Messages client → serveur. Tous nécessitent que le client ait fait `join` au préalable
// (sauf `join` lui-même).
export type ClientMessage =
  | { type: "join"; voterId: string; name: string; asViewer?: boolean }
  | { type: "set_name"; name: string }
  | { type: "vote"; value: Card }
  | { type: "unvote" }
  | { type: "reveal" } // admin
  | { type: "reset" } // admin — re-vote sur la même story
  | { type: "next_story"; story: string } // admin — nouvelle story, votes effacés
  | { type: "set_story"; story: string } // admin — édition titre sans reset
  | { type: "set_auto_reveal"; enabled: boolean } // admin
  | { type: "set_reactions"; enabled: boolean } // admin
  | { type: "shoot_projectile"; targetVoterId: string; item: ReactionItem } // tireur = connexion (votant ou spectateur)
  | { type: "kick"; voterId: string } // admin
  | { type: "transfer_admin"; voterId: string } // admin — alias de grant_admin (compat)
  | { type: "grant_admin"; voterId: string } // admin — promouvoit un voter co-admin
  | { type: "revoke_admin"; voterId: string } // admin — retire le rôle admin (pas de kick)
  | { type: "set_viewer"; isViewer: boolean } // self — toggle spectateur/voter
  | { type: "set_deck"; deckId: string } // admin — change le deck (refusé si vote en cours)
  | { type: "start_timer"; durationSec: number } // admin — démarre / redémarre le timer
  | { type: "stop_timer" }; // admin — arrête le timer

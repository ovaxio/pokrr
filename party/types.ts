// Protocole partagé serveur ↔ client. Importé par les deux côtés.

export const DECK = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "34",
  "55",
  "89",
  "∞",
  "?",
  "☕",
] as const;

export type Card = (typeof DECK)[number];

export const NUMERIC_CARDS: ReadonlyArray<Card> = [
  "0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89",
];

export type Phase = "voting" | "revealed";

export const LIMITS = {
  maxNameLength: 24,
  maxStoryLength: 200,
  maxPlayersPerRoom: 50,
  maxVoterIdLength: 64,
} as const;

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
  | { type: "transfer_admin"; voterId: string }; // admin

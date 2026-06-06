import {
  type Card,
  type Phase,
  type PlayerView,
  type RoomState,
  type TimerInfo,
  DECKS,
  DEFAULT_DECK_ID,
  LIMITS,
} from "../types";
import { GameError } from "./GameError";

type ServerPlayer = {
  voterId: string;
  name: string;
  vote: Card | null;
  joinedAt: number;
  isViewer: boolean;
};

export class GameRoom {
  private story = "";
  private phase: Phase = "voting";
  private autoReveal = true;
  private version = 0;
  private adminVoterIds = new Set<string>();
  private players = new Map<string, ServerPlayer>();
  private connsByVoter = new Map<string, Set<string>>();
  private deckId = DEFAULT_DECK_ID;
  private timer: TimerInfo | null = null;
  private firstConnectionId: string | null = null;

  // --- Connection lifecycle ---

  trackConnection(connId: string): void {
    if (this.players.size === 0 && this.firstConnectionId === null) {
      this.firstConnectionId = connId;
    }
  }

  untrackConnection(connId: string, voterId: string | null): { needsElection: boolean } {
    if (connId === this.firstConnectionId && (!voterId || !this.players.has(voterId))) {
      this.firstConnectionId = null;
    }
    if (!voterId) return { needsElection: false };

    const conns = this.connsByVoter.get(voterId);
    if (conns) {
      conns.delete(connId);
      if (conns.size === 0) this.connsByVoter.delete(voterId);
    }

    const wasLastAdminOnline =
      this.adminVoterIds.has(voterId) &&
      !this.isOnline(voterId) &&
      !Array.from(this.adminVoterIds).some((id) => id !== voterId && this.isOnline(id));

    this.version++;
    return { needsElection: wasLastAdminOnline };
  }

  // Returns true if the returning player is an admin and an election should be cancelled.
  isAdminReturning(voterId: string): boolean {
    return this.adminVoterIds.has(voterId) && this.isOnline(voterId);
  }

  // Elects the oldest eligible voter as admin. Returns the new admin's voterId, or null.
  electAdmin(): string | null {
    if (Array.from(this.adminVoterIds).some((id) => this.isOnline(id))) return null;

    const candidates = Array.from(this.players.values())
      .filter((p) => this.isOnline(p.voterId) && !this.adminVoterIds.has(p.voterId) && !p.isViewer)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    const next = candidates[0];
    if (!next) return null;

    for (const id of this.adminVoterIds) {
      if (!this.isOnline(id)) this.adminVoterIds.delete(id);
    }
    this.adminVoterIds.add(next.voterId);
    this.version++;
    return next.voterId;
  }

  // --- Game commands (throw GameError on invalid) ---

  join(connId: string, voterId: string, name: string, asViewer?: boolean): void {
    const isFirst = this.players.size === 0;
    const effectiveAsViewer = isFirst ? asViewer !== false : asViewer === true;

    const isReconnect = this.players.has(voterId);
    if (!isReconnect && this.players.size >= LIMITS.maxPlayersPerRoom) {
      throw new GameError("room_full", "Salle pleine (max 50 voters)");
    }

    if (!isReconnect) {
      this.players.set(voterId, {
        voterId,
        name: this.dedupeName(name, voterId),
        vote: null,
        joinedAt: Date.now(),
        isViewer: effectiveAsViewer,
      });

      if (isFirst) {
        this.adminVoterIds.add(voterId);
        if (connId === this.firstConnectionId) this.firstConnectionId = null;
      } else if (this.firstConnectionId !== null && connId === this.firstConnectionId) {
        this.adminVoterIds.add(voterId);
        this.firstConnectionId = null;
      }
    }

    const conns = this.connsByVoter.get(voterId) ?? new Set<string>();
    conns.add(connId);
    this.connsByVoter.set(voterId, conns);

    this.version++;
  }

  setName(voterId: string, name: string): void {
    const player = this.requirePlayer(voterId);
    player.name = this.dedupeName(name, voterId);
    this.version++;
  }

  vote(voterId: string, card: Card): void {
    const player = this.requirePlayer(voterId);
    if (player.isViewer) throw new GameError("forbidden", "Les spectateurs ne peuvent pas voter");
    if (this.phase !== "voting") throw new GameError("forbidden", "Vote impossible après reveal");
    if (!this.isCardInCurrentDeck(card)) throw new GameError("invalid", "Carte hors deck");
    player.vote = card;
    this.version++;
  }

  unvote(voterId: string): void {
    const player = this.requirePlayer(voterId);
    if (player.isViewer) return;
    if (this.phase !== "voting") throw new GameError("forbidden", "Pas de unvote après reveal");
    if (player.vote === null) return;
    player.vote = null;
    this.version++;
  }

  reveal(adminVoterId: string): void {
    this.requireAdmin(adminVoterId);
    if (this.phase === "revealed") return;
    this.phase = "revealed";
    this.version++;
  }

  reset(adminVoterId: string): void {
    this.requireAdmin(adminVoterId);
    this.clearVotes();
    this.phase = "voting";
    this.timer = null;
    this.version++;
  }

  nextStory(adminVoterId: string, story: string): void {
    this.requireAdmin(adminVoterId);
    this.story = story;
    this.clearVotes();
    this.phase = "voting";
    this.timer = null;
    this.version++;
  }

  setStory(adminVoterId: string, story: string): void {
    this.requireAdmin(adminVoterId);
    if (this.story === story) return;
    this.story = story;
    this.version++;
  }

  setAutoReveal(adminVoterId: string, enabled: boolean): void {
    this.requireAdmin(adminVoterId);
    if (this.autoReveal === enabled) return;
    this.autoReveal = enabled;
    this.version++;
  }

  kick(adminVoterId: string, targetVoterId: string): Set<string> {
    this.requireAdmin(adminVoterId);
    if (targetVoterId === adminVoterId) {
      throw new GameError("forbidden", "Impossible de se kicker soi-même");
    }
    if (!this.players.has(targetVoterId)) return new Set();

    this.adminVoterIds.delete(targetVoterId);
    this.players.delete(targetVoterId);
    const conns = new Set(this.connsByVoter.get(targetVoterId) ?? []);
    this.connsByVoter.delete(targetVoterId);
    this.version++;
    return conns;
  }

  setViewer(voterId: string, isViewer: boolean): void {
    const player = this.requirePlayer(voterId);
    if (player.isViewer === isViewer) return;
    player.isViewer = isViewer;
    if (isViewer) player.vote = null;
    this.version++;
  }

  setDeck(adminVoterId: string, deckId: string): void {
    this.requireAdmin(adminVoterId);
    if (!(deckId in DECKS)) throw new GameError("invalid", "deckId inconnu");
    if (deckId === this.deckId) return;
    if (Array.from(this.players.values()).some((p) => p.vote !== null)) {
      throw new GameError(
        "forbidden",
        "Impossible de changer le deck après le premier vote — reset ou story suivante d'abord",
      );
    }
    this.deckId = deckId;
    this.version++;
  }

  startTimer(adminVoterId: string, durationSec: number): void {
    this.requireAdmin(adminVoterId);
    const duration = Math.floor(durationSec);
    if (!Number.isFinite(duration) || duration < LIMITS.minTimerSec || duration > LIMITS.maxTimerSec) {
      throw new GameError(
        "invalid",
        `Durée invalide (entre ${LIMITS.minTimerSec}s et ${LIMITS.maxTimerSec}s)`,
      );
    }
    this.timer = { startedAt: Date.now(), durationSec: duration };
    this.version++;
  }

  stopTimer(adminVoterId: string): void {
    this.requireAdmin(adminVoterId);
    if (!this.timer) return;
    this.timer = null;
    this.version++;
  }

  transferAdmin(adminVoterId: string, targetVoterId: string): void {
    this.requireAdmin(adminVoterId);
    if (!this.players.has(targetVoterId)) throw new GameError("invalid", "Joueur cible introuvable");
    if (this.adminVoterIds.has(targetVoterId)) throw new GameError("invalid", "Ce joueur est déjà admin");
    this.adminVoterIds.add(targetVoterId);
    this.adminVoterIds.delete(adminVoterId);
    this.version++;
  }

  grantAdmin(adminVoterId: string, targetVoterId: string): void {
    this.requireAdmin(adminVoterId);
    if (!this.players.has(targetVoterId)) throw new GameError("invalid", "Joueur cible introuvable");
    if (this.adminVoterIds.has(targetVoterId)) return;
    this.adminVoterIds.add(targetVoterId);
    this.version++;
  }

  revokeAdmin(adminVoterId: string, targetVoterId: string): void {
    this.requireAdmin(adminVoterId);
    if (!this.adminVoterIds.has(targetVoterId)) throw new GameError("invalid", "Ce joueur n'est pas admin");
    if (this.adminVoterIds.size <= 1) throw new GameError("forbidden", "Impossible de révoquer le dernier admin");
    this.adminVoterIds.delete(targetVoterId);
    this.version++;
  }

  // --- Derived state queries ---

  shouldAutoReveal(): boolean {
    if (!this.autoReveal || this.phase !== "voting") return false;
    const onlineVoters = Array.from(this.players.values()).filter(
      (p) => this.isOnline(p.voterId) && !p.isViewer,
    );
    return onlineVoters.length > 0 && onlineVoters.every((p) => p.vote !== null);
  }

  doAutoReveal(): void {
    this.phase = "revealed";
    this.version++;
  }

  isOnline(voterId: string): boolean {
    const conns = this.connsByVoter.get(voterId);
    return conns ? conns.size > 0 : false;
  }

  isAdmin(voterId: string): boolean {
    return this.adminVoterIds.has(voterId);
  }

  playerCount(): number {
    return this.players.size;
  }

  getConnectionIds(voterId: string): Set<string> {
    return new Set(this.connsByVoter.get(voterId) ?? []);
  }

  snapshot(roomId: string): RoomState {
    const players: PlayerView[] = Array.from(this.players.values())
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({
        voterId: p.voterId,
        name: p.name,
        hasVoted: !p.isViewer && p.vote !== null,
        vote: !p.isViewer && this.phase === "revealed" ? p.vote : null,
        isAdmin: this.adminVoterIds.has(p.voterId),
        isViewer: p.isViewer,
        online: this.isOnline(p.voterId),
      }));
    return {
      type: "room_state",
      roomId,
      story: this.story,
      phase: this.phase,
      autoReveal: this.autoReveal,
      players,
      deckId: this.deckId,
      timer: this.timer,
      version: this.version,
    };
  }

  // --- Private helpers ---

  private requirePlayer(voterId: string): ServerPlayer {
    const player = this.players.get(voterId);
    if (!player) throw new GameError("not_joined", "Joueur introuvable");
    return player;
  }

  private requireAdmin(voterId: string): void {
    this.requirePlayer(voterId);
    if (!this.adminVoterIds.has(voterId)) {
      throw new GameError("forbidden", "Action réservée aux admins");
    }
  }

  private dedupeName(name: string, ownerVoterId: string): string {
    const taken = new Set<string>();
    for (const [vid, p] of this.players) {
      if (vid !== ownerVoterId) taken.add(p.name);
    }
    if (!taken.has(name)) return name;
    let i = 2;
    while (taken.has(`${name} (${i})`)) i++;
    return `${name} (${i})`;
  }

  private clearVotes(): void {
    for (const player of this.players.values()) {
      player.vote = null;
    }
  }

  private isCardInCurrentDeck(value: string): value is Card {
    const deck = DECKS[this.deckId] ?? DECKS[DEFAULT_DECK_ID];
    return (deck.cards as readonly string[]).includes(value);
  }
}

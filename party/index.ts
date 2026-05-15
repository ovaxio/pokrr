import type * as Party from "partykit/server";
import {
  DECK,
  LIMITS,
  type Card,
  type ClientMessage,
  type ErrorCode,
  type Phase,
  type PlayerView,
  type RoomState,
  type ServerMessage,
} from "./types";

type ServerPlayer = {
  voterId: string;
  name: string;
  vote: Card | null;
  joinedAt: number;
};

type ConnState = { voterId: string | null };

const DECK_SET: ReadonlySet<string> = new Set<string>(DECK);

// ---------- Rate limit (par IP, in-memory, par isolate Worker) ----------
// Pas de garantie cross-instance. Au-delà : passer par une rate-limiter DO
// dédiée ou par Cloudflare Rate Limiting Rules.
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_CONNECTIONS = 30; // 30 connexions/min/IP
const ipConnections = new Map<string, number[]>();

function isRateLimited(ip: string | null): boolean {
  if (!ip) return false;
  const now = Date.now();
  const recent = (ipConnections.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_CONNECTIONS) {
    ipConnections.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipConnections.set(ip, recent);
  // GC opportuniste : si la map dépasse 10k entrées, on purge les IPs sans hit récent.
  if (ipConnections.size > 10_000) {
    for (const [key, ts] of ipConnections) {
      if (ts.length === 0 || now - ts[ts.length - 1] > RATE_WINDOW_MS) {
        ipConnections.delete(key);
      }
    }
  }
  return false;
}

function clientIp(req: Party.Request): string | null {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return null;
}

// ---------- Admin election ----------
// Si l'admin se déconnecte et ne revient pas dans la fenêtre de grâce, le serveur
// élit automatiquement le voter en ligne le plus ancien comme nouvel admin.
// Override via la variable d'env POKRR_ADMIN_GRACE_MS (chargée par PartyKit
// depuis .env ou partykit.json vars).
const DEFAULT_ADMIN_GRACE_MS = 15 * 60 * 1000;

function readAdminGraceMs(env: unknown): number {
  if (!env || typeof env !== "object") return DEFAULT_ADMIN_GRACE_MS;
  const raw = Number((env as Record<string, unknown>).POKRR_ADMIN_GRACE_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_ADMIN_GRACE_MS;
}

function isCard(value: unknown): value is Card {
  return typeof value === "string" && DECK_SET.has(value);
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/[<>]/g, "");
  if (trimmed.length === 0 || trimmed.length > LIMITS.maxNameLength) return null;
  return trimmed;
}

function sanitizeStory(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/[<>]/g, "").slice(0, LIMITS.maxStoryLength);
  return trimmed;
}

function sanitizeVoterId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(raw)) return null;
  return raw;
}

export default class PokrrRoom implements Party.Server {
  options: Party.ServerOptions = { hibernate: false };

  // Rate-limit avant ouverture du WebSocket. Renvoie 429 si trop de connexions
  // depuis la même IP dans la fenêtre.
  static onBeforeConnect(req: Party.Request): Party.Request | Response {
    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      return new Response("Too Many Requests", { status: 429 });
    }
    return req;
  }

  private story = "";
  private phase: Phase = "voting";
  private autoReveal = true;
  private version = 0;
  private adminVoterId: string | null = null;
  private players = new Map<string, ServerPlayer>();
  private connsByVoter = new Map<string, Set<string>>();
  private adminElectionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection<ConnState>) {
    conn.setState({ voterId: null });
    // Pas de broadcast tant que le client n'a pas fait `join`. On lui enverra
    // l'état au moment du join.
    this.sendState(conn);
  }

  onMessage(raw: string, sender: Party.Connection<ConnState>) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      return this.sendError(sender, "invalid", "JSON invalide");
    }

    switch (msg.type) {
      case "join":
        return this.handleJoin(sender, msg.voterId, msg.name);
      case "set_name":
        return this.handleSetName(sender, msg.name);
      case "vote":
        return this.handleVote(sender, msg.value);
      case "unvote":
        return this.handleUnvote(sender);
      case "reveal":
        return this.handleReveal(sender);
      case "reset":
        return this.handleReset(sender);
      case "next_story":
        return this.handleNextStory(sender, msg.story);
      case "set_story":
        return this.handleSetStory(sender, msg.story);
      case "set_auto_reveal":
        return this.handleSetAutoReveal(sender, msg.enabled);
      case "kick":
        return this.handleKick(sender, msg.voterId);
      case "transfer_admin":
        return this.handleTransferAdmin(sender, msg.voterId);
      default:
        return this.sendError(sender, "invalid", "Type de message inconnu");
    }
  }

  onClose(conn: Party.Connection<ConnState>) {
    const voterId = conn.state?.voterId;
    if (!voterId) return;
    const conns = this.connsByVoter.get(voterId);
    if (conns) {
      conns.delete(conn.id);
      if (conns.size === 0) {
        this.connsByVoter.delete(voterId);
      }
    }
    // Si l'admin vient de passer offline, programmer l'élection auto.
    if (voterId === this.adminVoterId && !this.isOnline(voterId)) {
      this.scheduleAdminElection();
    }
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  // ---------- handlers ----------

  private handleJoin(conn: Party.Connection<ConnState>, voterIdRaw: unknown, nameRaw: unknown) {
    const voterId = sanitizeVoterId(voterIdRaw);
    if (!voterId) return this.sendError(conn, "invalid", "voterId invalide");

    const name = sanitizeName(nameRaw);
    if (!name) return this.sendError(conn, "invalid", "Pseudo invalide (1-24 caractères)");

    const isReconnect = this.players.has(voterId);
    if (!isReconnect && this.players.size >= LIMITS.maxPlayersPerRoom) {
      return this.sendError(conn, "room_full", "Salle pleine (max 50 voters)");
    }

    if (isReconnect) {
      // Reconnect : on garde le pseudo existant côté serveur (l'utilisateur peut le
      // re-changer via set_name).
    } else {
      const finalName = this.dedupeName(name, voterId);
      this.players.set(voterId, {
        voterId,
        name: finalName,
        vote: null,
        joinedAt: Date.now(),
      });
      if (!this.adminVoterId) {
        this.adminVoterId = voterId;
      }
    }

    conn.setState({ voterId });
    const conns = this.connsByVoter.get(voterId) ?? new Set<string>();
    conns.add(conn.id);
    this.connsByVoter.set(voterId, conns);

    // L'admin est revenu → annuler l'élection programmée.
    if (voterId === this.adminVoterId && this.adminElectionTimer) {
      clearTimeout(this.adminElectionTimer);
      this.adminElectionTimer = null;
    }

    this.bumpAndBroadcast();
  }

  private handleSetName(conn: Party.Connection<ConnState>, nameRaw: unknown) {
    const voterId = conn.state?.voterId;
    if (!voterId) return this.sendError(conn, "not_joined", "Pas encore joint");
    const player = this.players.get(voterId);
    if (!player) return this.sendError(conn, "not_joined", "Joueur introuvable");

    const name = sanitizeName(nameRaw);
    if (!name) return this.sendError(conn, "invalid", "Pseudo invalide");
    player.name = this.dedupeName(name, voterId);
    this.bumpAndBroadcast();
  }

  private handleVote(conn: Party.Connection<ConnState>, value: unknown) {
    const player = this.requirePlayer(conn);
    if (!player) return;
    if (this.phase !== "voting") {
      return this.sendError(conn, "forbidden", "Vote impossible après reveal");
    }
    if (!isCard(value)) {
      return this.sendError(conn, "invalid", "Carte hors deck");
    }
    player.vote = value;
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  private handleUnvote(conn: Party.Connection<ConnState>) {
    const player = this.requirePlayer(conn);
    if (!player) return;
    if (this.phase !== "voting") {
      return this.sendError(conn, "forbidden", "Pas de unvote après reveal");
    }
    if (player.vote === null) return;
    player.vote = null;
    this.bumpAndBroadcast();
  }

  private handleReveal(conn: Party.Connection<ConnState>) {
    if (!this.requireAdmin(conn)) return;
    if (this.phase === "revealed") return;
    this.phase = "revealed";
    this.bumpAndBroadcast();
  }

  private handleReset(conn: Party.Connection<ConnState>) {
    if (!this.requireAdmin(conn)) return;
    this.clearVotes();
    this.phase = "voting";
    this.bumpAndBroadcast();
  }

  private handleNextStory(conn: Party.Connection<ConnState>, storyRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const story = sanitizeStory(storyRaw);
    if (story === null) return this.sendError(conn, "invalid", "Story invalide");
    this.story = story;
    this.clearVotes();
    this.phase = "voting";
    this.bumpAndBroadcast();
  }

  private handleSetStory(conn: Party.Connection<ConnState>, storyRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const story = sanitizeStory(storyRaw);
    if (story === null) return this.sendError(conn, "invalid", "Story invalide");
    if (this.story === story) return;
    this.story = story;
    this.bumpAndBroadcast();
  }

  private handleSetAutoReveal(conn: Party.Connection<ConnState>, enabled: unknown) {
    if (!this.requireAdmin(conn)) return;
    const value = typeof enabled === "boolean" ? enabled : null;
    if (value === null) return this.sendError(conn, "invalid", "Valeur booléenne attendue");
    if (this.autoReveal === value) return;
    this.autoReveal = value;
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  private handleKick(conn: Party.Connection<ConnState>, targetRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const target = sanitizeVoterId(targetRaw);
    if (!target) return this.sendError(conn, "invalid", "voterId cible invalide");
    if (target === this.adminVoterId) {
      return this.sendError(conn, "forbidden", "L'admin ne peut pas se kicker lui-même");
    }
    if (!this.players.has(target)) return;
    this.players.delete(target);
    this.kickConnections(target, "Vous avez été retiré de la salle par l'admin");
    this.connsByVoter.delete(target);
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  private handleTransferAdmin(conn: Party.Connection<ConnState>, targetRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const target = sanitizeVoterId(targetRaw);
    if (!target) return this.sendError(conn, "invalid", "voterId cible invalide");
    if (!this.players.has(target)) {
      return this.sendError(conn, "invalid", "Joueur cible introuvable");
    }
    if (target === this.adminVoterId) return;
    this.adminVoterId = target;
    this.bumpAndBroadcast();
  }

  // ---------- helpers ----------

  private requirePlayer(conn: Party.Connection<ConnState>): ServerPlayer | null {
    const voterId = conn.state?.voterId;
    if (!voterId) {
      this.sendError(conn, "not_joined", "Pas encore joint");
      return null;
    }
    const player = this.players.get(voterId);
    if (!player) {
      this.sendError(conn, "not_joined", "Joueur introuvable");
      return null;
    }
    return player;
  }

  private requireAdmin(conn: Party.Connection<ConnState>): boolean {
    const player = this.requirePlayer(conn);
    if (!player) return false;
    if (this.adminVoterId !== player.voterId) {
      this.sendError(conn, "forbidden", "Action réservée à l'admin");
      return false;
    }
    return true;
  }

  private dedupeName(name: string, ownerVoterId: string): string {
    const taken = new Set<string>();
    for (const [voterId, p] of this.players) {
      if (voterId !== ownerVoterId) taken.add(p.name);
    }
    if (!taken.has(name)) return name;
    let i = 2;
    while (taken.has(`${name} (${i})`)) i++;
    return `${name} (${i})`;
  }

  private clearVotes() {
    for (const player of this.players.values()) {
      player.vote = null;
    }
  }

  private isOnline(voterId: string): boolean {
    const conns = this.connsByVoter.get(voterId);
    return conns ? conns.size > 0 : false;
  }

  private scheduleAdminElection() {
    if (this.adminElectionTimer) clearTimeout(this.adminElectionTimer);
    const graceMs = readAdminGraceMs(this.room.env);
    this.adminElectionTimer = setTimeout(() => {
      this.adminElectionTimer = null;
      // Si l'admin est revenu entre-temps, ne rien faire.
      if (this.adminVoterId && this.isOnline(this.adminVoterId)) return;
      // Élire le plus ancien joueur en ligne (parmi ceux qui ne sont pas l'admin actuel).
      const candidates = [...this.players.values()]
        .filter((p) => this.isOnline(p.voterId) && p.voterId !== this.adminVoterId)
        .sort((a, b) => a.joinedAt - b.joinedAt);
      const next = candidates[0];
      if (!next) return; // plus personne en ligne, on attendra
      this.adminVoterId = next.voterId;
      this.bumpAndBroadcast();
    }, graceMs);
  }

  private maybeAutoReveal() {
    if (!this.autoReveal) return;
    if (this.phase !== "voting") return;
    const onlinePlayers = [...this.players.values()].filter((p) => this.isOnline(p.voterId));
    if (onlinePlayers.length === 0) return;
    if (onlinePlayers.every((p) => p.vote !== null)) {
      this.phase = "revealed";
      this.bumpAndBroadcast();
    }
  }

  private buildState(): RoomState {
    const players: PlayerView[] = [...this.players.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({
        voterId: p.voterId,
        name: p.name,
        hasVoted: p.vote !== null,
        vote: this.phase === "revealed" ? p.vote : null,
        isAdmin: p.voterId === this.adminVoterId,
        online: this.isOnline(p.voterId),
      }));
    return {
      type: "room_state",
      roomId: this.room.id,
      story: this.story,
      phase: this.phase,
      autoReveal: this.autoReveal,
      players,
      version: this.version,
    };
  }

  private bumpAndBroadcast() {
    this.version++;
    const state = this.buildState();
    const payload = JSON.stringify(state);
    this.room.broadcast(payload);
  }

  private sendState(conn: Party.Connection) {
    const state = this.buildState();
    conn.send(JSON.stringify(state));
  }

  private sendError(conn: Party.Connection, code: ErrorCode, message: string) {
    const err: ServerMessage = { type: "error", code, message };
    conn.send(JSON.stringify(err));
  }

  private kickConnections(voterId: string, reason: string) {
    const conns = this.connsByVoter.get(voterId);
    if (!conns) return;
    for (const connId of conns) {
      const conn = this.room.getConnection(connId);
      if (!conn) continue;
      try {
        conn.send(JSON.stringify({ type: "kicked", reason }));
        conn.close();
      } catch {
        // ignore
      }
    }
  }
}

PokrrRoom satisfies Party.Worker;

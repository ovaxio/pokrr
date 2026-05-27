import type * as Party from "partykit/server";
import {
  type Card,
  type ClientMessage,
  DECKS,
  DEFAULT_DECK_ID,
  type ErrorCode,
  LIMITS,
  type Phase,
  type PlayerView,
  type RoomState,
  type ServerMessage,
  type TimerInfo,
} from "./types";

type ServerPlayer = {
  voterId: string;
  name: string;
  vote: Card | null;
  joinedAt: number;
  isViewer: boolean;
};

type ConnState = { voterId: string | null };

// ---------- Rate limit (par IP, in-memory, par isolate Worker) ----------
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_CONNECTIONS = 30;
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
  if (ipConnections.size > 10_000) {
    for (const [key, ts] of ipConnections) {
      if (ts.length === 0 || now - ts[ts.length - 1] > RATE_WINDOW_MS) {
        ipConnections.delete(key);
      }
    }
  }
  return false;
}

// ---------- Structured logs ----------
function log(event: string, data: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data });
  console.log(line);
}

function truncId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : "—";
}

function clientIp(req: Party.Request): string | null {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return null;
}

// ---------- Origin allowlist (anti CSWSH) ----------
function isOriginAllowed(req: Party.Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[^/]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/(www\.)?pokrr\.app$/.test(origin)) return true;
  if (process.env.POKRR_ALLOWED_ORIGINS) {
    const allowed = process.env.POKRR_ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    if (allowed.includes(origin)) return true;
  }
  return false;
}

// ---------- Admin election ----------
const DEFAULT_ADMIN_GRACE_MS = 15 * 60 * 1000;

function readAdminGraceMs(env: unknown): number {
  if (!env || typeof env !== "object") return DEFAULT_ADMIN_GRACE_MS;
  const raw = Number((env as Record<string, unknown>).POKRR_ADMIN_GRACE_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_ADMIN_GRACE_MS;
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/[<>]/g, "");
  if (trimmed.length === 0 || trimmed.length > LIMITS.maxNameLength) return null;
  return trimmed;
}

function sanitizeStory(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return raw.replace(/[<>]/g, "").slice(0, LIMITS.maxStoryLength);
}

function sanitizeVoterId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(raw)) return null;
  return raw;
}

class PokrrRoom implements Party.Server {
  options: Party.ServerOptions = { hibernate: false };

  static onBeforeConnect(req: Party.Request): Party.Request | Response {
    if (!isOriginAllowed(req)) {
      log("forbidden_origin", { origin: req.headers.get("origin") });
      return new Response("Forbidden Origin", { status: 403 });
    }
    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      log("rate_limited", { ip: ip ? ip.slice(0, 8) : "—" });
      return new Response("Too Many Requests", { status: 429 });
    }
    return req;
  }

  private story = "";
  private phase: Phase = "voting";
  private autoReveal = true;
  private version = 0;
  // Set de tous les admins courants (plusieurs admins possibles).
  private adminVoterIds = new Set<string>();
  private players = new Map<string, ServerPlayer>();
  private connsByVoter = new Map<string, Set<string>>();
  private adminElectionTimer: ReturnType<typeof setTimeout> | null = null;
  private deckId: string = DEFAULT_DECK_ID;
  private timer: TimerInfo | null = null;

  private isCardInCurrentDeck(value: unknown): value is Card {
    if (typeof value !== "string") return false;
    const deck = DECKS[this.deckId] ?? DECKS[DEFAULT_DECK_ID];
    return (deck.cards as readonly string[]).includes(value);
  }

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection<ConnState>) {
    conn.setState({ voterId: null });
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
        return this.handleJoin(sender, msg.voterId, msg.name, msg.asViewer);
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
        return this.handleGrantAdmin(sender, msg.voterId);
      case "grant_admin":
        return this.handleGrantAdmin(sender, msg.voterId);
      case "revoke_admin":
        return this.handleRevokeAdmin(sender, msg.voterId);
      case "set_viewer":
        return this.handleSetViewer(sender, msg.isViewer);
      case "set_deck":
        return this.handleSetDeck(sender, msg.deckId);
      case "start_timer":
        return this.handleStartTimer(sender, msg.durationSec);
      case "stop_timer":
        return this.handleStopTimer(sender);
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
    // Si un admin vient de passer offline et qu'aucun admin n'est plus en ligne,
    // programmer l'élection automatique.
    if (this.adminVoterIds.has(voterId) && !this.isOnline(voterId)) {
      const anyAdminOnline = [...this.adminVoterIds].some((id) => this.isOnline(id));
      if (!anyAdminOnline) {
        this.scheduleAdminElection();
      }
    }
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  // ---------- handlers ----------

  private handleJoin(
    conn: Party.Connection<ConnState>,
    voterIdRaw: unknown,
    nameRaw: unknown,
    asViewerRaw?: unknown,
  ) {
    const voterId = sanitizeVoterId(voterIdRaw);
    if (!voterId) return this.sendError(conn, "invalid", "voterId invalide");

    const name = sanitizeName(nameRaw);
    if (!name) return this.sendError(conn, "invalid", "Pseudo invalide (1-24 caractères)");

    const isFirst = this.players.size === 0;
    // Premier à rejoindre = admin → viewer par défaut (rôle facilitateur).
    // Peut être surchargé en passant explicitement asViewer: false depuis le modal.
    const asViewer = isFirst ? asViewerRaw !== false : asViewerRaw === true;

    const isReconnect = this.players.has(voterId);
    if (!isReconnect && this.players.size >= LIMITS.maxPlayersPerRoom) {
      return this.sendError(conn, "room_full", "Salle pleine (max 50 voters)");
    }

    if (isReconnect) {
      log("player_rejoined", { room: this.room.id, voter: truncId(voterId) });
    } else {
      const finalName = this.dedupeName(name, voterId);
      this.players.set(voterId, {
        voterId,
        name: finalName,
        vote: null,
        joinedAt: Date.now(),
        isViewer: asViewer,
      });
      // Le premier joueur devient admin (viewer ou pas).
      if (isFirst) {
        this.adminVoterIds.add(voterId);
      }
      log("player_joined", {
        room: this.room.id,
        voter: truncId(voterId),
        is_admin: this.adminVoterIds.has(voterId),
        is_viewer: asViewer,
        players: this.players.size,
      });
    }

    conn.setState({ voterId });
    const conns = this.connsByVoter.get(voterId) ?? new Set<string>();
    conns.add(conn.id);
    this.connsByVoter.set(voterId, conns);

    // Un admin revient en ligne → annuler l'élection programmée.
    if (this.adminVoterIds.has(voterId) && this.adminElectionTimer) {
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
    if (player.isViewer) {
      return this.sendError(conn, "forbidden", "Les spectateurs ne peuvent pas voter");
    }
    if (this.phase !== "voting") {
      return this.sendError(conn, "forbidden", "Vote impossible après reveal");
    }
    if (!this.isCardInCurrentDeck(value)) {
      return this.sendError(conn, "invalid", "Carte hors deck");
    }
    player.vote = value;
    log("vote_cast", { room: this.room.id, voter: truncId(player.voterId), value });
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  private handleUnvote(conn: Party.Connection<ConnState>) {
    const player = this.requirePlayer(conn);
    if (!player) return;
    if (player.isViewer) return;
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
    const voted = [...this.players.values()].filter((p) => !p.isViewer && p.vote !== null).length;
    log("revealed_manual", { room: this.room.id, voted, total: this.players.size });
    this.bumpAndBroadcast();
  }

  private handleReset(conn: Party.Connection<ConnState>) {
    if (!this.requireAdmin(conn)) return;
    this.clearVotes();
    this.phase = "voting";
    this.timer = null;
    log("round_reset", { room: this.room.id });
    this.bumpAndBroadcast();
  }

  private handleSetDeck(conn: Party.Connection<ConnState>, deckIdRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    if (typeof deckIdRaw !== "string" || !(deckIdRaw in DECKS)) {
      return this.sendError(conn, "invalid", "deckId inconnu");
    }
    if (deckIdRaw === this.deckId) return;
    const hasVote = [...this.players.values()].some((p) => p.vote !== null);
    if (hasVote) {
      return this.sendError(
        conn,
        "forbidden",
        "Impossible de changer le deck après le premier vote — reset ou story suivante d'abord",
      );
    }
    this.deckId = deckIdRaw;
    log("deck_changed", { room: this.room.id, deck: this.deckId });
    this.bumpAndBroadcast();
  }

  private handleStartTimer(conn: Party.Connection<ConnState>, durationRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const duration = typeof durationRaw === "number" ? Math.floor(durationRaw) : NaN;
    if (
      !Number.isFinite(duration) ||
      duration < LIMITS.minTimerSec ||
      duration > LIMITS.maxTimerSec
    ) {
      return this.sendError(
        conn,
        "invalid",
        `Durée invalide (entre ${LIMITS.minTimerSec}s et ${LIMITS.maxTimerSec}s)`,
      );
    }
    this.timer = { startedAt: Date.now(), durationSec: duration };
    log("timer_started", { room: this.room.id, duration });
    this.bumpAndBroadcast();
  }

  private handleStopTimer(conn: Party.Connection<ConnState>) {
    if (!this.requireAdmin(conn)) return;
    if (!this.timer) return;
    this.timer = null;
    log("timer_stopped", { room: this.room.id });
    this.bumpAndBroadcast();
  }

  private handleNextStory(conn: Party.Connection<ConnState>, storyRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const story = sanitizeStory(storyRaw);
    if (story === null) return this.sendError(conn, "invalid", "Story invalide");
    this.story = story;
    this.clearVotes();
    this.phase = "voting";
    this.timer = null;
    log("next_story", { room: this.room.id, len: story.length });
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
    const senderVoterId = conn.state?.voterId;
    if (target === senderVoterId) {
      return this.sendError(conn, "forbidden", "Impossible de se kicker soi-même");
    }
    if (!this.players.has(target)) return;
    this.adminVoterIds.delete(target);
    this.players.delete(target);
    this.kickConnections(target, "Vous avez été retiré de la salle par un admin");
    this.connsByVoter.delete(target);
    log("player_kicked", { room: this.room.id, target: truncId(target) });
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  private handleSetViewer(conn: Party.Connection<ConnState>, isViewerRaw: unknown) {
    const player = this.requirePlayer(conn);
    if (!player) return;
    if (typeof isViewerRaw !== "boolean") {
      return this.sendError(conn, "invalid", "Valeur booléenne attendue");
    }
    if (player.isViewer === isViewerRaw) return;
    // Si le joueur repasse en voter, on efface son vote hypothétique (null de toute façon).
    player.isViewer = isViewerRaw;
    if (isViewerRaw) player.vote = null;
    log("viewer_toggled", {
      room: this.room.id,
      voter: truncId(player.voterId),
      is_viewer: isViewerRaw,
    });
    this.bumpAndBroadcast();
    this.maybeAutoReveal();
  }

  private handleGrantAdmin(conn: Party.Connection<ConnState>, targetRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const target = sanitizeVoterId(targetRaw);
    if (!target) return this.sendError(conn, "invalid", "voterId cible invalide");
    const targetPlayer = this.players.get(target);
    if (!targetPlayer) {
      return this.sendError(conn, "invalid", "Joueur cible introuvable");
    }
    if (this.adminVoterIds.has(target)) return;
    log("admin_granted", {
      room: this.room.id,
      by: truncId(conn.state?.voterId),
      to: truncId(target),
    });
    this.adminVoterIds.add(target);
    this.bumpAndBroadcast();
  }

  private handleRevokeAdmin(conn: Party.Connection<ConnState>, targetRaw: unknown) {
    if (!this.requireAdmin(conn)) return;
    const target = sanitizeVoterId(targetRaw);
    if (!target) return this.sendError(conn, "invalid", "voterId cible invalide");
    if (!this.adminVoterIds.has(target)) {
      return this.sendError(conn, "invalid", "Ce joueur n'est pas admin");
    }
    if (this.adminVoterIds.size <= 1) {
      return this.sendError(conn, "forbidden", "Impossible de révoquer le dernier admin");
    }
    log("admin_revoked", {
      room: this.room.id,
      by: truncId(conn.state?.voterId),
      from: truncId(target),
    });
    this.adminVoterIds.delete(target);
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
    if (!this.adminVoterIds.has(player.voterId)) {
      this.sendError(conn, "forbidden", "Action réservée aux admins");
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
      // Si un admin est revenu entre-temps, ne rien faire.
      const anyAdminOnline = [...this.adminVoterIds].some((id) => this.isOnline(id));
      if (anyAdminOnline) return;
      // Élire le plus ancien joueur non-viewer non-admin en ligne.
      const candidates = [...this.players.values()]
        .filter(
          (p) =>
            this.isOnline(p.voterId) &&
            !this.adminVoterIds.has(p.voterId) &&
            !p.isViewer,
        )
        .sort((a, b) => a.joinedAt - b.joinedAt);
      const next = candidates[0];
      if (!next) return;
      log("admin_elected", {
        room: this.room.id,
        to: truncId(next.voterId),
        grace_ms: graceMs,
      });
      this.adminVoterIds.add(next.voterId);
      this.bumpAndBroadcast();
    }, graceMs);
  }

  private maybeAutoReveal() {
    if (!this.autoReveal) return;
    if (this.phase !== "voting") return;
    // Seuls les voters en ligne comptent (pas les viewers).
    const onlineVoters = [...this.players.values()].filter(
      (p) => this.isOnline(p.voterId) && !p.isViewer,
    );
    if (onlineVoters.length === 0) return;
    if (onlineVoters.every((p) => p.vote !== null)) {
      this.phase = "revealed";
      log("revealed_auto", {
        room: this.room.id,
        voted: onlineVoters.length,
        total: this.players.size,
      });
      this.bumpAndBroadcast();
    }
  }

  private buildState(): RoomState {
    const players: PlayerView[] = [...this.players.values()]
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
      roomId: this.room.id,
      story: this.story,
      phase: this.phase,
      autoReveal: this.autoReveal,
      players,
      deckId: this.deckId,
      timer: this.timer,
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

export default PokrrRoom satisfies Party.Worker;

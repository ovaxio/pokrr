import { routePartykitRequest, Server, type Connection, type WSMessage } from "partyserver";
import { JOIN_TIMEOUT_CLOSE_CODE, ROOM_EXPIRED_CLOSE_CODE, type ClientMessage, type ErrorCode, type ServerMessage } from "./types";
import { DEFAULT_ADMIN_GRACE_MS, DEFAULT_IDLE_TIMEOUT_MS, DEFAULT_JOIN_TIMEOUT_MS, readPositiveMs } from "./config";
import { GameRoom } from "./domain/GameRoom";
import { GameError } from "./domain/GameError";
import { parseClientFrame, sanitizeName, sanitizeStory, sanitizeVoterId } from "./sanitize";
import { isOriginAllowed, isRateLimited, clientIp, newFrameBudget, spendFrame, type FrameBudget } from "./security";
import { log, truncId } from "./log";

type ConnState = { voterId: string | null };
type ConnGuard = { budget: FrameBudget; joinTimer: ReturnType<typeof setTimeout> };

// Codes WebSocket standards (policy violation, message too big), pas des codes applicatifs comme 4001/4002 de types.ts.
const RATE_LIMIT_CLOSE_CODE = 1008;
const FRAME_TOO_BIG_CLOSE_CODE = 1009;

export class PokrrRoom extends Server<Env> {
  static options = { hibernate: false };

  private game = new GameRoom();
  private electionTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private guards = new Map<string, ConnGuard>();
  // Échéance de la coupure d'inactivité : une reconnexion ne la repousse pas.
  private lastActionAt = Date.now();

  onConnect(conn: Connection<ConnState>): void {
    conn.setState({ voterId: null });
    this.game.trackConnection(conn.id);
    // Armer sans repousser : une simple connexion ne compte pas comme une action.
    if (!this.idleTimer) this.armIdleTimer();
    const joinMs = readPositiveMs(this.env, "POKRR_JOIN_TIMEOUT_MS", DEFAULT_JOIN_TIMEOUT_MS);
    const joinTimer = setTimeout(() => {
      if (conn.state?.voterId) return;
      log("join_timeout", { room: this.name });
      this.forceClose(conn, JOIN_TIMEOUT_CLOSE_CODE, "join_timeout");
    }, joinMs);
    this.guards.set(conn.id, { budget: newFrameBudget(Date.now()), joinTimer });
    conn.send(JSON.stringify(this.game.snapshot(this.name)));
  }

  onMessage(sender: Connection<ConnState>, raw: WSMessage): void {
    const guard = this.guards.get(sender.id);
    if (!guard) return;
    if (!spendFrame(guard.budget, Date.now())) {
      log("frame_rate_limited", { room: this.name });
      this.forceClose(sender, RATE_LIMIT_CLOSE_CODE, "frame_rate_limited");
      return;
    }
    const msg = parseClientFrame(raw);
    if (msg === "too_big") {
      log("frame_too_big", { room: this.name, len: (raw as string).length });
      this.forceClose(sender, FRAME_TOO_BIG_CLOSE_CODE, "frame_too_big");
      return;
    }
    if (!msg) {
      this.sendError(sender, "invalid", "Message invalide");
      return;
    }

    const voterId = sender.state?.voterId ?? null;

    try {
      // Tir éphémère : hors dispatch, ne diffuse jamais de room_state.
      if (msg.type === "shoot_projectile") {
        if (this.handleShot(msg, voterId)) this.touchActivity();
        return;
      }
      this.dispatch(msg, sender, voterId);
      // Seule une action acceptée d'un joueur joint repousse la coupure d'inactivité.
      if (sender.state?.voterId) this.touchActivity();
      this.broadcastWithAutoReveal(msg.type);
    } catch (e) {
      if (e instanceof GameError) {
        this.sendError(sender, e.code, e.message);
        return;
      }
      log("handler_error", {
        room: this.name,
        type: msg.type.slice(0, 32),
        error: e instanceof Error ? e.message : String(e),
      });
      this.sendError(sender, "invalid", "Message invalide");
    }
  }

  onClose(conn: Connection<ConnState>): void {
    this.releaseGuard(conn.id);
    this.clearIdleTimerIfEmpty(conn.id);
    const voterId = conn.state?.voterId ?? null;
    const { needsElection } = this.game.untrackConnection(conn.id, voterId);

    if (!voterId) return;

    if (needsElection) this.scheduleElection();
    this.broadcast(JSON.stringify(this.game.snapshot(this.name)));

    if (this.game.shouldAutoReveal()) {
      this.game.doAutoReveal();
      log("revealed_auto", { room: this.name });
      this.broadcast(JSON.stringify(this.game.snapshot(this.name)));
    }
  }

  onError(conn: Connection<ConnState>, error: unknown): void {
    console.error(conn.id, "connection error", error);
    this.releaseGuard(conn.id);
    this.clearIdleTimerIfEmpty(conn.id);
  }

  // --- Message dispatch ---

  private handleShot(msg: Extract<ClientMessage, { type: "shoot_projectile" }>, voterId: string | null): boolean {
    if (!voterId) return false;
    const shot = this.game.shootProjectile(voterId, msg.targetVoterId, msg.item, Date.now());
    if (!shot) return false;
    this.broadcast(JSON.stringify({ type: "projectile_thrown", ...shot } satisfies ServerMessage));
    return true;
  }

  private dispatch(msg: ClientMessage, conn: Connection<ConnState>, voterId: string | null): void {
    switch (msg.type) {
      case "join": {
        const cleanId = this.valid(sanitizeVoterId(msg.voterId), "voterId invalide");
        const cleanName = this.valid(sanitizeName(msg.name), "Pseudo invalide (1-24 caractères)");
        if (voterId && voterId !== cleanId) {
          throw new GameError("forbidden", "Connexion déjà associée à un autre joueur");
        }
        this.game.join(conn.id, cleanId, cleanName, msg.asViewer);
        conn.setState({ voterId: cleanId });
        const guard = this.guards.get(conn.id);
        if (guard) clearTimeout(guard.joinTimer);
        if (this.electionTimer && this.game.isAdminReturning(cleanId)) {
          clearTimeout(this.electionTimer);
          this.electionTimer = null;
        }
        log("player_joined", {
          room: this.name,
          voter: truncId(cleanId),
          is_admin: this.game.isAdmin(cleanId),
          players: this.game.playerCount(),
        });
        break;
      }
      case "set_name": {
        const name = this.valid(sanitizeName(msg.name), "Pseudo invalide");
        this.game.setName(this.joined(voterId), name);
        break;
      }
      case "vote": {
        this.game.vote(this.joined(voterId), msg.value);
        log("vote_cast", { room: this.name, voter: truncId(voterId), value: msg.value });
        break;
      }
      case "unvote": {
        this.game.unvote(this.joined(voterId));
        break;
      }
      case "reveal": {
        this.game.reveal(this.joined(voterId));
        log("revealed_manual", { room: this.name });
        break;
      }
      case "reset": {
        this.game.reset(this.joined(voterId));
        log("round_reset", { room: this.name });
        break;
      }
      case "next_story": {
        const story = this.valid(sanitizeStory(msg.story), "Story invalide");
        this.game.nextStory(this.joined(voterId), story);
        log("next_story", { room: this.name, len: story.length });
        break;
      }
      case "set_story": {
        const story = this.valid(sanitizeStory(msg.story), "Story invalide");
        this.game.setStory(this.joined(voterId), story);
        break;
      }
      case "set_auto_reveal": {
        if (typeof msg.enabled !== "boolean") throw new GameError("invalid", "Valeur booléenne attendue");
        this.game.setAutoReveal(this.joined(voterId), msg.enabled);
        break;
      }
      case "set_reactions": {
        if (typeof msg.enabled !== "boolean") throw new GameError("invalid", "Valeur booléenne attendue");
        this.game.setReactionsEnabled(this.joined(voterId), msg.enabled);
        log("reactions_toggled", { room: this.name, enabled: msg.enabled });
        break;
      }
      case "kick": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        const connIds = this.game.getConnectionIds(target);
        this.game.kick(this.joined(voterId), target);
        this.kickConnections(connIds, "Vous avez été retiré de la salle par un admin");
        log("player_kicked", { room: this.name, target: truncId(target) });
        break;
      }
      case "set_viewer": {
        if (typeof msg.isViewer !== "boolean") throw new GameError("invalid", "Valeur booléenne attendue");
        this.game.setViewer(this.joined(voterId), msg.isViewer);
        log("viewer_toggled", { room: this.name, voter: truncId(voterId), is_viewer: msg.isViewer });
        break;
      }
      case "set_deck": {
        this.game.setDeck(this.joined(voterId), msg.deckId);
        log("deck_changed", { room: this.name, deck: msg.deckId });
        break;
      }
      case "start_timer": {
        if (typeof msg.durationSec !== "number") throw new GameError("invalid", "Nombre attendu");
        this.game.startTimer(this.joined(voterId), msg.durationSec);
        log("timer_started", { room: this.name, duration: msg.durationSec });
        break;
      }
      case "stop_timer": {
        this.game.stopTimer(this.joined(voterId));
        log("timer_stopped", { room: this.name });
        break;
      }
      case "transfer_admin": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        this.game.transferAdmin(this.joined(voterId), target);
        log("admin_transferred", { room: this.name, from: truncId(voterId), to: truncId(target) });
        break;
      }
      case "grant_admin": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        this.game.grantAdmin(this.joined(voterId), target);
        log("admin_granted", { room: this.name, by: truncId(voterId), to: truncId(target) });
        break;
      }
      case "revoke_admin": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        this.game.revokeAdmin(this.joined(voterId), target);
        log("admin_revoked", { room: this.name, by: truncId(voterId), from: truncId(target) });
        break;
      }
      default:
        throw new GameError("invalid", "Type de message inconnu");
    }
  }

  // --- Infrastructure helpers ---

  private broadcastWithAutoReveal(msgType: ClientMessage["type"]): void {
    this.broadcast(JSON.stringify(this.game.snapshot(this.name)));

    const autoRevealTriggers = new Set<ClientMessage["type"]>([
      "vote", "unvote", "kick", "set_viewer", "set_auto_reveal",
    ]);
    if (autoRevealTriggers.has(msgType) && this.game.shouldAutoReveal()) {
      this.game.doAutoReveal();
      log("revealed_auto", { room: this.name });
      this.broadcast(JSON.stringify(this.game.snapshot(this.name)));
    }
  }

  private scheduleElection(): void {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    const graceMs = readPositiveMs(this.env, "POKRR_ADMIN_GRACE_MS", DEFAULT_ADMIN_GRACE_MS);
    this.electionTimer = setTimeout(() => {
      this.electionTimer = null;
      const elected = this.game.electAdmin();
      if (!elected) return;
      log("admin_elected", { room: this.name, to: truncId(elected), grace_ms: graceMs });
      this.broadcast(JSON.stringify(this.game.snapshot(this.name)));
    }, graceMs);
  }

  private armIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    const idleMs = readPositiveMs(this.env, "POKRR_IDLE_TIMEOUT_MS", DEFAULT_IDLE_TIMEOUT_MS);
    const delay = Math.max(0, this.lastActionAt + idleMs - Date.now());
    this.idleTimer = setTimeout(() => this.expireRoom(idleMs), delay);
  }

  private touchActivity(): void {
    this.lastActionAt = Date.now();
    this.armIdleTimer();
  }

  // Une minuterie par connexion retiendrait le DO en mémoire après la fermeture : toujours l'annuler.
  private releaseGuard(connId: string): void {
    const guard = this.guards.get(connId);
    if (guard) clearTimeout(guard.joinTimer);
    this.guards.delete(connId);
  }

  private forceClose(conn: Connection<ConnState>, code: number, reason: string): void {
    this.releaseGuard(conn.id);
    try {
      conn.close(code, reason);
    } catch {
      // connexion déjà fermée
    }
  }

  // Sans connexion, le timer est inutile et ne doit pas retenir le DO.
  private clearIdleTimerIfEmpty(closingConnId: string): void {
    if (!this.idleTimer) return;
    const remaining = Array.from(this.getConnections()).filter((c) => c.id !== closingConnId);
    if (remaining.length > 0) return;
    clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private expireRoom(idleMs: number): void {
    this.idleTimer = null;
    if (this.electionTimer) {
      clearTimeout(this.electionTimer);
      this.electionTimer = null;
    }
    const conns = Array.from(this.getConnections<ConnState>());
    log("room_expired", { room: this.name, conns: conns.length, idle_ms: idleMs });
    // Remise à zéro avant les close() : les onClose qui suivent ne voient plus
    // ni joueur ni admin, donc pas d'élection ni de broadcast d'ancien état.
    this.game = new GameRoom();
    this.lastActionAt = Date.now();
    for (const conn of conns) {
      try {
        conn.setState({ voterId: null });
      } catch {
        // connexion déjà fermée entre le snapshot et le traitement
      }
      try {
        conn.close(ROOM_EXPIRED_CLOSE_CODE, "room_expired");
      } catch {
        // idem, close déjà effectué
      }
    }
  }

  private kickConnections(connIds: Set<string>, reason: string): void {
    for (const connId of connIds) {
      const conn = this.getConnection<ConnState>(connId);
      if (!conn) continue;
      try {
        conn.send(JSON.stringify({ type: "kicked", reason } satisfies ServerMessage));
        conn.close();
      } catch {
        // connection already closed
      }
    }
  }

  private sendError(conn: Connection, code: ErrorCode, message: string): void {
    conn.send(JSON.stringify({ type: "error", code, message } satisfies ServerMessage));
  }

  private valid<T>(value: T | null, message: string): T {
    if (value === null) throw new GameError("invalid", message);
    return value;
  }

  private joined(voterId: string | null): string {
    if (!voterId) throw new GameError("not_joined", "Pas encore joint");
    return voterId;
  }
}

function onBeforeConnect(req: Request): Request | Response {
  if (!isOriginAllowed(req)) {
    log("forbidden_origin", { origin: req.headers.get("origin") });
    return new Response("Forbidden Origin", { status: 403 });
  }
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    log("rate_limited", { ip: ip ? ip.slice(0, 8) : "-" });
    return new Response("Too Many Requests", { status: 429 });
  }
  // L'id de connexion doit venir du serveur : deux sockets au même ?_pk= partageraient une entrée de la table.
  const url = new URL(req.url);
  if (!url.searchParams.has("_pk")) return req;
  url.searchParams.delete("_pk");
  return new Request(url, req);
}

// Aucun client légitime ne fait de HTTP sur /parties/ (WebSocket uniquement).
// 404 inconditionnel, sans solliciter ni creer de Durable Object. Le corps
// "Not Found" differe du "Not implemented" du DO (le smoke de securite s'en sert).
function onBeforeRequest(): Response {
  return new Response("Not Found", { status: 404 });
}

export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, env, { onBeforeConnect, onBeforeRequest })) ??
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;

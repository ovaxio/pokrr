import type * as Party from "partykit/server";
import type { ClientMessage, ErrorCode, ServerMessage } from "./types";
import { GameRoom } from "./domain/GameRoom";
import { GameError } from "./domain/GameError";
import { sanitizeName, sanitizeStory, sanitizeVoterId } from "./sanitize";
import { isOriginAllowed, isRateLimited, clientIp } from "./security";
import { log, truncId } from "./log";

type ConnState = { voterId: string | null };

const DEFAULT_ADMIN_GRACE_MS = 15 * 60 * 1000;

function readAdminGraceMs(env: unknown): number {
  if (!env || typeof env !== "object") return DEFAULT_ADMIN_GRACE_MS;
  const raw = Number((env as Record<string, unknown>).POKRR_ADMIN_GRACE_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_ADMIN_GRACE_MS;
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

  private game = new GameRoom();
  private electionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection<ConnState>): void {
    conn.setState({ voterId: null });
    this.game.trackConnection(conn.id);
    conn.send(JSON.stringify(this.game.snapshot(this.room.id)));
  }

  onMessage(raw: string, sender: Party.Connection<ConnState>): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      this.sendError(sender, "invalid", "JSON invalide");
      return;
    }

    const voterId = sender.state?.voterId ?? null;

    try {
      this.dispatch(msg, sender, voterId);
      this.broadcastWithAutoReveal(msg.type);
    } catch (e) {
      if (e instanceof GameError) this.sendError(sender, e.code, e.message);
    }
  }

  onClose(conn: Party.Connection<ConnState>): void {
    const voterId = conn.state?.voterId ?? null;
    const { needsElection } = this.game.untrackConnection(conn.id, voterId);

    if (!voterId) return;

    if (needsElection) this.scheduleElection();
    this.room.broadcast(JSON.stringify(this.game.snapshot(this.room.id)));

    if (this.game.shouldAutoReveal()) {
      this.game.doAutoReveal();
      log("revealed_auto", { room: this.room.id });
      this.room.broadcast(JSON.stringify(this.game.snapshot(this.room.id)));
    }
  }

  // --- Message dispatch ---

  private dispatch(msg: ClientMessage, conn: Party.Connection<ConnState>, voterId: string | null): void {
    switch (msg.type) {
      case "join": {
        const cleanId = this.valid(sanitizeVoterId(msg.voterId), "voterId invalide");
        const cleanName = this.valid(sanitizeName(msg.name), "Pseudo invalide (1-24 caractères)");
        this.game.join(conn.id, cleanId, cleanName, msg.asViewer);
        conn.setState({ voterId: cleanId });
        if (this.electionTimer && this.game.isAdminReturning(cleanId)) {
          clearTimeout(this.electionTimer);
          this.electionTimer = null;
        }
        log("player_joined", {
          room: this.room.id,
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
        log("vote_cast", { room: this.room.id, voter: truncId(voterId), value: msg.value });
        break;
      }
      case "unvote": {
        this.game.unvote(this.joined(voterId));
        break;
      }
      case "reveal": {
        this.game.reveal(this.joined(voterId));
        log("revealed_manual", { room: this.room.id });
        break;
      }
      case "reset": {
        this.game.reset(this.joined(voterId));
        log("round_reset", { room: this.room.id });
        break;
      }
      case "next_story": {
        const story = this.valid(sanitizeStory(msg.story), "Story invalide");
        this.game.nextStory(this.joined(voterId), story);
        log("next_story", { room: this.room.id, len: story.length });
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
      case "kick": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        const connIds = this.game.getConnectionIds(target);
        this.game.kick(this.joined(voterId), target);
        this.kickConnections(connIds, "Vous avez été retiré de la salle par un admin");
        log("player_kicked", { room: this.room.id, target: truncId(target) });
        break;
      }
      case "set_viewer": {
        if (typeof msg.isViewer !== "boolean") throw new GameError("invalid", "Valeur booléenne attendue");
        this.game.setViewer(this.joined(voterId), msg.isViewer);
        log("viewer_toggled", { room: this.room.id, voter: truncId(voterId), is_viewer: msg.isViewer });
        break;
      }
      case "set_deck": {
        this.game.setDeck(this.joined(voterId), msg.deckId);
        log("deck_changed", { room: this.room.id, deck: msg.deckId });
        break;
      }
      case "start_timer": {
        if (typeof msg.durationSec !== "number") throw new GameError("invalid", "Nombre attendu");
        this.game.startTimer(this.joined(voterId), msg.durationSec);
        log("timer_started", { room: this.room.id, duration: msg.durationSec });
        break;
      }
      case "stop_timer": {
        this.game.stopTimer(this.joined(voterId));
        log("timer_stopped", { room: this.room.id });
        break;
      }
      case "transfer_admin": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        this.game.transferAdmin(this.joined(voterId), target);
        log("admin_transferred", { room: this.room.id, from: truncId(voterId), to: truncId(target) });
        break;
      }
      case "grant_admin": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        this.game.grantAdmin(this.joined(voterId), target);
        log("admin_granted", { room: this.room.id, by: truncId(voterId), to: truncId(target) });
        break;
      }
      case "revoke_admin": {
        const target = this.valid(sanitizeVoterId(msg.voterId), "voterId cible invalide");
        this.game.revokeAdmin(this.joined(voterId), target);
        log("admin_revoked", { room: this.room.id, by: truncId(voterId), from: truncId(target) });
        break;
      }
      default:
        throw new GameError("invalid", "Type de message inconnu");
    }
  }

  // --- Infrastructure helpers ---

  private broadcastWithAutoReveal(msgType: ClientMessage["type"]): void {
    this.room.broadcast(JSON.stringify(this.game.snapshot(this.room.id)));

    const autoRevealTriggers = new Set<ClientMessage["type"]>([
      "vote", "unvote", "kick", "set_viewer", "set_auto_reveal",
    ]);
    if (autoRevealTriggers.has(msgType) && this.game.shouldAutoReveal()) {
      this.game.doAutoReveal();
      log("revealed_auto", { room: this.room.id });
      this.room.broadcast(JSON.stringify(this.game.snapshot(this.room.id)));
    }
  }

  private scheduleElection(): void {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    const graceMs = readAdminGraceMs(this.room.env);
    this.electionTimer = setTimeout(() => {
      this.electionTimer = null;
      const elected = this.game.electAdmin();
      if (!elected) return;
      log("admin_elected", { room: this.room.id, to: truncId(elected), grace_ms: graceMs });
      this.room.broadcast(JSON.stringify(this.game.snapshot(this.room.id)));
    }, graceMs);
  }

  private kickConnections(connIds: Set<string>, reason: string): void {
    for (const connId of connIds) {
      const conn = this.room.getConnection(connId);
      if (!conn) continue;
      try {
        conn.send(JSON.stringify({ type: "kicked", reason } satisfies ServerMessage));
        conn.close();
      } catch {
        // connection already closed
      }
    }
  }

  private sendError(conn: Party.Connection, code: ErrorCode, message: string): void {
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

export default PokrrRoom satisfies Party.Worker;

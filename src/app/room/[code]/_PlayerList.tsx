"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Check, Eye, Minus, Pencil, Star, X } from "lucide-react";
import type { Phase, PlayerView } from "../../../../party/types";
import { useDict } from "@/i18n/DictContext";
import { interpolate } from "@/i18n/shared";

export default function PlayerList({
  players,
  phase,
  meVoterId,
  amIAdmin,
  onKickAction,
  onGrantAdminAction,
  onRevokeAdminAction,
  onRenameAction,
}: {
  players: PlayerView[];
  phase: Phase;
  meVoterId: string;
  amIAdmin: boolean;
  onKickAction: (voterId: string) => void;
  onGrantAdminAction: (voterId: string) => void;
  onRevokeAdminAction: (voterId: string) => void;
  onRenameAction: (name: string) => void;
}) {
  const d = useDict();
  const [initialIds, setInitialIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (initialIds === null && players.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialIds(new Set(players.map((p) => p.voterId)));
    }
  }, [players, initialIds]);

  if (players.length === 0) {
    return (
      <p className="text-center text-sm text-muted py-6">
        {d.noPlayers}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {players.map((p) => (
        <PlayerCard
          key={p.voterId}
          player={p}
          phase={phase}
          isMe={p.voterId === meVoterId}
          amIAdmin={amIAdmin}
          isInitialPlayer={initialIds?.has(p.voterId) ?? true}
          onKick={() => onKickAction(p.voterId)}
          onGrantAdmin={() => onGrantAdminAction(p.voterId)}
          onRevokeAdmin={() => onRevokeAdminAction(p.voterId)}
          onRename={onRenameAction}
        />
      ))}
    </div>
  );
}

function PlayerCard({
  player,
  phase,
  isMe,
  amIAdmin,
  isInitialPlayer,
  onKick,
  onGrantAdmin,
  onRevokeAdmin,
  onRename,
}: {
  player: PlayerView;
  phase: Phase;
  isMe: boolean;
  amIAdmin: boolean;
  isInitialPlayer: boolean;
  onKick: () => void;
  onGrantAdmin: () => void;
  onRevokeAdmin: () => void;
  onRename: (name: string) => void;
}) {
  const d = useDict();
  const revealed = phase === "revealed";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.name);
  const [pendingAction, setPendingAction] = useState<"kick" | "revoke" | "grant" | null>(null);
  const timerRef = useRef<number | null>(null);
  const armedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const disarm = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPendingAction(null);
  };

  const requestAction = (action: "kick" | "revoke" | "grant") => {
    if (pendingAction === action) {
      if (Date.now() - armedAtRef.current < 200) return;
      disarm();
      if (action === "kick") onKick();
      else if (action === "revoke") onRevokeAdmin();
      else onGrantAdmin();
    } else {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      setPendingAction(action);
      armedAtRef.current = Date.now();
      timerRef.current = window.setTimeout(disarm, 5000);
    }
  };

  const confirmActionLabel = (action: "kick" | "revoke" | "grant") =>
    action === "kick"
      ? interpolate(d.kickConfirmAction, { name: player.name })
      : action === "grant"
        ? interpolate(d.promoteConfirmAction, { name: player.name })
        : interpolate(d.revokeConfirmAction, { name: player.name });

  const startEdit = () => {
    setDraft(player.name);
    setEditing(true);
  };

  const commit = () => {
    const next = draft.trim().slice(0, 24);
    if (next && next !== player.name) onRename(next);
    setEditing(false);
  };

  return (
    <div className={isInitialPlayer ? "anim-fade-up flex w-20 flex-col items-center gap-1.5" : "flex w-20 flex-col items-center gap-1.5"} style={{ '--dur': '320ms' } as CSSProperties}>
      <div className="relative h-24 w-16">
        {player.isViewer ? (
          <div className="h-24 w-16 flex items-center justify-center rounded-xl border-2 border-dashed border-token-strong bg-surface/20">
            <Eye size={24} className="text-faint" aria-label={d.viewerBadge} />
          </div>
        ) : (
          <div className={`flip-card ${revealed && player.vote ? "flipped" : ""}`}>
            {/* Front : dos de carte */}
            <div
              className={
                "flip-face border-2 " +
                (player.hasVoted
                  ? "border-indigo-500 bg-indigo-600/20"
                  : "border-dashed border-token-strong bg-surface/40")
              }
            >
              {player.hasVoted ? (
                <Check size={20} className="text-indigo-500" />
              ) : (
                <Minus size={16} className="text-faint" />
              )}
            </div>
            {/* Back : face de carte révélée */}
            <div className="flip-face flip-face-back border-2 border-indigo-500 bg-neutral-50 dark:bg-neutral-100 text-neutral-900">
              <span className="text-2xl font-bold">{player.vote ?? "—"}</span>
            </div>
          </div>
        )}
        {/* Online dot */}
        <span
          role="img"
          className={
            "absolute top-1 right-1 h-2.5 w-2.5 rounded-full ring-[1.5px] ring-bg " +
            (player.online ? "bg-emerald-500" : "bg-neutral-400 dark:bg-neutral-600")
          }
          aria-label={player.online ? d.statusOnline : d.statusOffline}
        />
      </div>

      <div className="flex w-full flex-col items-center gap-0.5 text-center">
        {isMe && editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commit();
            }}
            className="flex w-full flex-col gap-1"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft(player.name);
                  setEditing(false);
                }
              }}
              maxLength={24}
              aria-label={d.editNameAriaLabel}
              className="w-full rounded border border-indigo-500 bg-surface px-1 py-0.5 text-center text-xs font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            />
          </form>
        ) : (
          <>
            <div className={isMe ? "group relative w-full flex justify-center" : "w-full flex justify-center"}>
              <button
                type="button"
                onClick={isMe ? startEdit : undefined}
                disabled={!isMe}
                title={isMe ? d.editNameAriaLabel : player.name}
                className={
                  "max-w-full line-clamp-3 whitespace-normal break-words text-xs font-medium text-fg " +
                  (isMe ? "cursor-pointer rounded px-1 pr-3.5 hover:bg-surface-2" : "cursor-default")
                }
              >
                {player.name}
              </button>
              {isMe && (
                <Pencil
                  size={8}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0.5 text-muted opacity-0 transition-opacity [@media(hover:hover)]:group-hover:opacity-50"
                />
              )}
            </div>
            {isMe && (
              <span className="text-xs text-fg-soft leading-none">{d.youLabel}</span>
            )}
          </>
        )}
        {(player.isAdmin || (player.isViewer && !player.isAdmin)) && (
          <div className="flex items-center gap-1 text-xs">
            {player.isAdmin && (
              <span className="rounded bg-indigo-500/20 px-1 py-0.5 uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                {d.adminBadge}
              </span>
            )}
            {player.isViewer && !player.isAdmin && (
              <span className="rounded bg-neutral-500/10 px-1 py-0.5 uppercase tracking-wider text-muted">
                {d.viewerBadge}
              </span>
            )}
          </div>
        )}
        {amIAdmin && !isMe && (
          <div className="flex items-center gap-2">
            {player.isAdmin ? (
              <button
                type="button"
                onClick={() => requestAction("revoke")}
                title={pendingAction === "revoke" ? confirmActionLabel("revoke") : d.revokeAdminTitle}
                aria-label={pendingAction === "revoke" ? confirmActionLabel("revoke") : interpolate(d.revokeAdminConfirm, { name: player.name })}
                className={
                  "relative after:absolute after:-inset-1 after:content-[''] flex h-9 w-9 items-center justify-center rounded border transition " +
                  (pendingAction === "revoke"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-token text-indigo-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300")
                }
              >
                {pendingAction === "revoke" ? <Check size={16} /> : <Star size={16} className="fill-current" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requestAction("grant")}
                title={pendingAction === "grant" ? confirmActionLabel("grant") : d.promoteAdminTitle}
                aria-label={pendingAction === "grant" ? confirmActionLabel("grant") : `${d.promoteAdminTitle} ${player.name}`}
                className={
                  "relative after:absolute after:-inset-1 after:content-[''] flex h-9 w-9 items-center justify-center rounded border transition " +
                  (pendingAction === "grant"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-token text-muted hover:bg-surface-2")
                }
              >
                {pendingAction === "grant" ? <Check size={16} /> : <Star size={16} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => requestAction("kick")}
              title={pendingAction === "kick" ? confirmActionLabel("kick") : d.kickTitle}
              aria-label={pendingAction === "kick" ? confirmActionLabel("kick") : interpolate(d.kickConfirm, { name: player.name })}
              className={
                "relative after:absolute after:-inset-1 after:content-[''] flex h-9 w-9 items-center justify-center rounded border transition " +
                (pendingAction === "kick"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-token text-muted hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300")
              }
            >
              {pendingAction === "kick" ? <Check size={16} /> : <X size={16} />}
            </button>
            <span className="sr-only" aria-live="polite">
              {pendingAction === null ? "" : confirmActionLabel(pendingAction)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Eye, Minus, Star, X } from "lucide-react";
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
  onKick,
  onGrantAdmin,
  onRevokeAdmin,
  onRename,
}: {
  player: PlayerView;
  phase: Phase;
  isMe: boolean;
  amIAdmin: boolean;
  onKick: () => void;
  onGrantAdmin: () => void;
  onRevokeAdmin: () => void;
  onRename: (name: string) => void;
}) {
  const d = useDict();
  const revealed = phase === "revealed";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.name);

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
    <div className="flex w-20 flex-col items-center gap-1.5">
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
            "absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-bg " +
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
            <button
              type="button"
              onClick={isMe ? startEdit : undefined}
              disabled={!isMe}
              title={isMe ? d.editNameAriaLabel : undefined}
              className={
                "max-w-full truncate text-xs font-medium text-fg " +
                (isMe ? "cursor-pointer rounded px-1 hover:bg-surface-2" : "cursor-default")
              }
            >
              {player.name}
            </button>
            {isMe && (
              <span className="text-[10px] text-muted leading-none">{d.youLabel}</span>
            )}
          </>
        )}
        <div className="flex items-center gap-1 text-[10px]">
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
          {amIAdmin && !isMe && (
            <>
              {player.isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(interpolate(d.revokeAdminConfirm, { name: player.name }))) onRevokeAdmin();
                  }}
                  title={d.revokeAdminTitle}
                  aria-label={interpolate(d.revokeAdminConfirm, { name: player.name })}
                  className="flex h-8 w-8 items-center justify-center rounded border border-token text-indigo-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Star size={12} className="fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGrantAdmin}
                  title={d.promoteAdminTitle}
                  aria-label={`${d.promoteAdminTitle} ${player.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded border border-token text-muted hover:bg-surface-2"
                >
                  <Star size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(interpolate(d.kickConfirm, { name: player.name }))) onKick();
                }}
                title={d.kickTitle}
                aria-label={interpolate(d.kickConfirm, { name: player.name })}
                className="flex h-8 w-8 items-center justify-center rounded border border-token text-muted hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300"
              >
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

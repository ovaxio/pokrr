"use client";

import type { Phase, PlayerView } from "../../../../party/types";

export default function PlayerList({
  players,
  phase,
  meVoterId,
  amIAdmin,
  onKick,
  onTransfer,
}: {
  players: PlayerView[];
  phase: Phase;
  meVoterId: string;
  amIAdmin: boolean;
  onKick: (voterId: string) => void;
  onTransfer: (voterId: string) => void;
}) {
  if (players.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500 py-6">
        Personne dans la salle pour le moment.
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
          onKick={() => onKick(p.voterId)}
          onTransfer={() => onTransfer(p.voterId)}
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
  onTransfer,
}: {
  player: PlayerView;
  phase: Phase;
  isMe: boolean;
  amIAdmin: boolean;
  onKick: () => void;
  onTransfer: () => void;
}) {
  const revealed = phase === "revealed";

  return (
    <div className="flex w-20 flex-col items-center gap-1.5">
      <div className="relative h-24 w-16">
        <div className={`flip-card ${revealed && player.vote ? "flipped" : ""}`}>
          {/* Front : dos de carte (votant) */}
          <div
            className={
              "flip-face border-2 " +
              (player.hasVoted
                ? "border-indigo-600 bg-indigo-900/60"
                : "border-dashed border-neutral-700 bg-neutral-900/40")
            }
          >
            {player.hasVoted ? (
              <span className="text-2xl text-indigo-300">✓</span>
            ) : (
              <span className="text-3xl text-neutral-700">·</span>
            )}
          </div>
          {/* Back : face de carte (révélée) */}
          <div className="flip-face flip-face-back border-2 border-indigo-400 bg-neutral-100 text-neutral-900">
            <span className="text-2xl font-bold">{player.vote ?? "—"}</span>
          </div>
        </div>
        {/* Online dot */}
        <span
          className={
            "absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-neutral-950 " +
            (player.online ? "bg-emerald-400" : "bg-neutral-600")
          }
          aria-label={player.online ? "en ligne" : "hors ligne"}
        />
      </div>

      <div className="flex w-full flex-col items-center gap-0.5 text-center">
        <span className="max-w-full truncate text-xs font-medium text-neutral-200">
          {player.name}
          {isMe && <span className="text-neutral-500"> (toi)</span>}
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          {player.isAdmin && (
            <span className="rounded bg-indigo-500/20 px-1 py-0.5 uppercase tracking-wider text-indigo-300">
              admin
            </span>
          )}
          {amIAdmin && !isMe && (
            <>
              <button
                type="button"
                onClick={onTransfer}
                title="Transférer admin"
                className="rounded border border-neutral-800 px-1 text-neutral-400 hover:bg-neutral-800"
              >
                ★
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Retirer ${player.name} de la salle ?`)) onKick();
                }}
                title="Kick"
                className="rounded border border-neutral-800 px-1 text-neutral-400 hover:bg-red-900/40 hover:text-red-300"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

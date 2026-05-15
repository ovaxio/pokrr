"use client";

import type { PlayerView, Phase } from "../../../../party/types";

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
  return (
    <ul className="space-y-2">
      {players.map((p) => (
        <li
          key={p.voterId}
          className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2"
        >
          <span
            className={
              "inline-block h-2 w-2 rounded-full " +
              (p.online ? "bg-emerald-400" : "bg-neutral-600")
            }
            aria-label={p.online ? "en ligne" : "hors ligne"}
          />
          <span className="flex-1 truncate text-sm">
            {p.name}
            {p.voterId === meVoterId && <span className="text-neutral-500"> (toi)</span>}
            {p.isAdmin && (
              <span className="ml-2 inline-block rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-indigo-300">
                admin
              </span>
            )}
          </span>
          <span className="text-sm font-mono">
            {phase === "revealed" ? (
              p.vote ?? <span className="text-neutral-600">—</span>
            ) : p.hasVoted ? (
              <span className="text-emerald-400">✓</span>
            ) : (
              <span className="text-neutral-600">—</span>
            )}
          </span>
          {amIAdmin && p.voterId !== meVoterId && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onTransfer(p.voterId)}
                title="Transférer le rôle admin"
                className="rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-neutral-800"
              >
                ★
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Retirer ${p.name} de la salle ?`)) onKick(p.voterId);
                }}
                title="Kick"
                className="rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 hover:bg-red-900/40 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

"use client";

import type { PlayerView } from "../../../../party/types";
import { computeStats, isWideSpread } from "../../../lib/stats";

export default function ResultsPanel({ players }: { players: PlayerView[] }) {
  const stats = computeStats(players);

  if (stats.voteCount === 0) {
    return (
      <div className="rounded-lg border border-token bg-surface/40 p-4 text-sm text-muted">
        Aucun vote enregistré.
      </div>
    );
  }

  const maxCount = stats.distribution.reduce((m, d) => Math.max(m, d.count), 1);
  const wideSpread =
    stats.lowest && stats.highest && isWideSpread(stats.lowest.value, stats.highest.value);

  return (
    <section className="space-y-4 rounded-lg border border-token bg-surface/40 p-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Moyenne" value={fmt(stats.mean)} subdued={stats.numericCount === 0} />
        <Stat label="Médiane" value={fmt(stats.median)} subdued={stats.numericCount === 0} />
        <Stat
          label="Suggestion"
          value={stats.consensusSuggestion ?? "—"}
          accent={stats.consensusSuggestion !== null}
        />
      </div>

      {stats.consensus && (
        <div className="rounded-md border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          Consensus : tout le monde a voté <strong>{stats.distribution[0].card}</strong>.
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Distribution
        </h3>
        <div className="space-y-1.5">
          {stats.distribution.map(({ card, count }) => (
            <div key={card} className="flex items-center gap-3">
              <span className="w-10 text-center font-mono text-sm text-fg">{card}</span>
              <div className="flex-1">
                <div
                  className="h-5 rounded bg-indigo-600/80 transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-muted">
                {count} {count > 1 ? "votes" : "vote"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {wideSpread && stats.lowest && stats.highest && stats.lowest.player.voterId !== stats.highest.player.voterId && (
        <div className="rounded-md border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <strong>{stats.highest.player.name}</strong> ({stats.highest.value}) ↔{" "}
          <strong>{stats.lowest.player.name}</strong> ({stats.lowest.value}) — écart à discuter.
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  subdued,
  accent,
}: {
  label: string;
  value: string;
  subdued?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border px-3 py-2 text-center " +
        (accent
          ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40"
          : "border-token bg-bg")
      }
    >
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div
        className={
          "mt-0.5 text-2xl font-bold " +
          (subdued ? "text-faint" : accent ? "text-indigo-700 dark:text-indigo-200" : "text-fg")
        }
      >
        {value}
      </div>
    </div>
  );
}

function fmt(n: number | null): string {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

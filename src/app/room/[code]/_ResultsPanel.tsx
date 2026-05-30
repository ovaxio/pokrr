"use client";

import { useState } from "react";
import { ArrowLeftRight, Check } from "lucide-react";
import type { PlayerView } from "../../../../party/types";
import { computeStats, isWideSpread } from "@/lib/stats";
import { useDict } from "@/i18n/DictContext";

export default function ResultsPanel({
  players,
  deckId,
  story,
}: {
  players: PlayerView[];
  deckId: string;
  story: string;
}) {
  const d = useDict();
  const stats = computeStats(players, deckId);
  const [copied, setCopied] = useState(false);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown(players, stats, story, d));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard non disponible (contexte non-sécurisé)
    }
  };

  if (stats.voteCount === 0) {
    return (
      <div className="rounded-lg border border-token bg-surface/40 p-4 text-sm text-muted">
        {d.noVotes}
      </div>
    );
  }

  const maxCount = stats.distribution.reduce((m, d) => Math.max(m, d.count), 1);
  const wideSpread =
    stats.lowest && stats.highest && isWideSpread(stats.lowest.value, stats.highest.value, deckId);

  return (
    <section className="space-y-4 rounded-lg border border-token bg-surface/40 p-4">
      <div className="flex items-start justify-between gap-3">
        {stats.numericDeck ? (
          <div className="grid flex-1 grid-cols-3 gap-3">
            <Stat label={d.statMean} value={fmt(stats.mean)} subdued={stats.numericCount === 0} />
            <Stat label={d.statMedian} value={fmt(stats.median)} subdued={stats.numericCount === 0} />
            <Stat
              label={d.statSuggestion}
              value={stats.consensusSuggestion ?? "—"}
              accent={stats.consensusSuggestion !== null}
            />
          </div>
        ) : (
          <div className="flex-1 rounded-md border border-token bg-bg px-3 py-2 text-sm text-muted">
            {d.nonNumericDeck}
          </div>
        )}
        <button
          type="button"
          onClick={copyMarkdown}
          title="Copier les résultats en Markdown"
          className={
            "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition " +
            (copied
              ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
              : "border-token bg-surface text-fg-soft hover:bg-surface-2")
          }
        >
          {copied ? <span className="inline-flex items-center gap-1">{d.copiedMd} <Check size={13} /></span> : d.copyMd}
        </button>
      </div>

      {stats.consensus && (
        <div className="rounded-md border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          {d.consensusPrefix} <strong>{stats.distribution[0].card}</strong>.
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {d.distribution}
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
                {count} {count > 1 ? d.votePlural : d.voteSingular}
              </span>
            </div>
          ))}
        </div>
      </div>

      {wideSpread && stats.lowest && stats.highest && stats.lowest.player.voterId !== stats.highest.player.voterId && (
        <div className="rounded-md border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <strong>{stats.highest.player.name}</strong> ({stats.highest.value}) <ArrowLeftRight size={13} className="inline align-middle" />{" "}
          <strong>{stats.lowest.player.name}</strong> ({stats.lowest.value}) : {d.spreadWarning}.
        </div>
      )}
    </section>
  );
}

function buildMarkdown(
  players: PlayerView[],
  stats: ReturnType<typeof computeStats>,
  story: string,
  d: ReturnType<typeof useDict>,
): string {
  const lines: string[] = [];
  if (story) lines.push(`## ${story}`, "");
  lines.push(`| ${d.mdVoterCol} | ${d.mdVoteCol} |`, "|---|---|");
  for (const p of players) {
    if (p.vote) lines.push(`| ${escapeMd(p.name)} | ${escapeMd(p.vote)} |`);
  }
  lines.push("");
  if (stats.numericDeck) {
    lines.push(
      `**${d.mdMean}** : ${fmt(stats.mean)} · **${d.mdMedian}** : ${fmt(stats.median)} · **${d.mdSuggestion}** : ${stats.consensusSuggestion ?? "—"}`,
    );
  }
  if (stats.consensus) {
    lines.push(`**${d.mdConsensusPrefix}** ${stats.distribution[0].card}.`);
  }
  return lines.join("\n");
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
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

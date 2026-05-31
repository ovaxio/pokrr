"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
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
    <section className="anim-fade-up space-y-4 rounded-lg border border-token bg-surface/40 p-4" style={{ '--dur': '350ms' } as CSSProperties}>
      <div className="flex items-start justify-between gap-3">
        {stats.numericDeck ? (
          <div className="grid flex-1 grid-cols-3 gap-3">
            <Stat
              label={d.statMean}
              value={fmt(stats.mean)}
              countFrom={stats.numericCount > 0 ? stats.mean : null}
              subdued={stats.numericCount === 0}
              animDelay={0}
            />
            <Stat
              label={d.statMedian}
              value={fmt(stats.median)}
              countFrom={stats.numericCount > 0 ? stats.median : null}
              subdued={stats.numericCount === 0}
              animDelay={100}
            />
            <Stat
              label={d.statSuggestion}
              value={stats.consensusSuggestion ?? "—"}
              countFrom={stats.consensusSuggestion ? Number(stats.consensusSuggestion) || null : null}
              accent={stats.consensusSuggestion !== null}
              pulse={stats.consensusSuggestion !== null}
              animDelay={200}
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
          {stats.distribution.map(({ card, count }, i) => (
            <div key={card} className="flex items-center gap-3">
              <span className="w-10 text-center font-mono text-sm text-fg">{card}</span>
              <div className="flex-1">
                <div
                  className="anim-grow-x h-5 rounded bg-indigo-600/80"
                  style={{ width: `${(count / maxCount) * 100}%`, '--delay': `${i * 80}ms`, '--dur': '500ms' } as CSSProperties}
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

// Counts a number from 0 to target over `duration` ms with ease-out-expo.
// Respects prefers-reduced-motion: jumps to final value immediately if set.
function useCountUp(target: number | null, duration = 700, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { const t = setTimeout(() => setValue(target), 0); return () => clearTimeout(t); }
    let rafId: number;
    const timer = setTimeout(() => {
      let start: number | null = null;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const t = Math.min((ts - start) / duration, 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setValue(target * eased);
        if (t < 1) rafId = requestAnimationFrame(tick);
        else setValue(target);
      };
      rafId = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(rafId); };
  }, [target, duration, delay]);
  return value;
}

function Stat({
  label,
  value,
  countFrom,
  subdued,
  accent,
  pulse = false,
  animDelay = 0,
}: {
  label: string;
  value: string;
  countFrom?: number | null;
  subdued?: boolean;
  accent?: boolean;
  pulse?: boolean;
  animDelay?: number;
}) {
  const animated = useCountUp(countFrom ?? null, 700, animDelay);
  const display = (countFrom !== undefined && countFrom !== null) ? fmt(animated) : value;

  return (
    <div
      className={
        "rounded-md border px-3 py-2 text-center " +
        (accent
          ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40" + (pulse ? " anim-suggestion-pulse" : "")
          : "border-token bg-bg")
      }
    >
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div
        className={
          "mt-0.5 text-2xl font-bold tabular-nums " +
          (subdued ? "text-faint" : accent ? "text-indigo-700 dark:text-indigo-200" : "text-fg")
        }
      >
        {display}
      </div>
    </div>
  );
}

function fmt(n: number | null): string {
  if (n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DECKS, type Phase } from "../../../../party/types";
import { useDict } from "@/i18n/DictContext";

const TIMER_PRESETS = [
  { sec: 60, label: "1 min" },
  { sec: 5 * 60, label: "5 min" },
  { sec: 10 * 60, label: "10 min" },
];

export default function AdminBar({
  phase,
  autoReveal,
  deckId,
  timerActive,
  onRevealAction,
  onResetAction,
  onNextStoryAction,
  onToggleAutoRevealAction,
  onSetDeckAction,
  onStartTimerAction,
  onStopTimerAction,
}: {
  phase: Phase;
  autoReveal: boolean;
  deckId: string;
  timerActive: boolean;
  onRevealAction: () => void;
  onResetAction: () => void;
  onNextStoryAction: (story: string) => void;
  onToggleAutoRevealAction: (enabled: boolean) => void;
  onSetDeckAction: (deckId: string) => void;
  onStartTimerAction: (sec: number) => void;
  onStopTimerAction: () => void;
}) {
  const d = useDict();
  const [nextStory, setNextStory] = useState("");

  return (
    <div className="space-y-3 rounded-lg border border-token bg-surface/40 p-4">
      <div className="flex flex-wrap gap-2">
        {phase === "voting" ? (
          <button
            type="button"
            onClick={onRevealAction}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {d.revealNow}
          </button>
        ) : (
          <button
            type="button"
            onClick={onResetAction}
            className="rounded-lg border border-token-strong bg-surface-2 px-4 py-2 text-sm font-medium text-fg hover:bg-surface"
          >
            {d.revoteStory}
          </button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = nextStory.trim().slice(0, 200);
            onNextStoryAction(value);
            setNextStory("");
          }}
          className="flex flex-1 gap-2"
        >
          <input
            value={nextStory}
            onChange={(e) => setNextStory(e.target.value)}
            placeholder={d.nextStoryPlaceholder}
            maxLength={200}
            className="flex-1 rounded-lg border border-token-strong bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          />
          <button
            type="submit"
            className="rounded-lg border border-token-strong bg-surface-2 px-3 py-2 text-sm font-medium text-fg hover:bg-surface"
          >
            <span className="inline-flex items-center gap-1">{d.nextStorySubmit} <ArrowRight size={14} /></span>
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={autoReveal}
            onChange={(e) => onToggleAutoRevealAction(e.target.checked)}
            className="accent-indigo-500"
          />
          {d.autoReveal}
        </label>

        <label className="flex items-center gap-2 text-muted">
          {d.deckLabel} :
          <select
            value={deckId}
            onChange={(e) => onSetDeckAction(e.target.value)}
            className="rounded border border-token bg-surface px-2 py-1 text-xs text-fg outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          >
            {Object.values(DECKS).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1 text-muted">
          <span>{d.timerLabel} :</span>
          {TIMER_PRESETS.map((p) => (
            <button
              key={p.sec}
              type="button"
              onClick={() => onStartTimerAction(p.sec)}
              className="rounded border border-token bg-surface px-2 py-1 text-xs text-fg hover:bg-surface-2"
            >
              {p.label}
            </button>
          ))}
          {timerActive && (
            <button
              type="button"
              onClick={onStopTimerAction}
              className="rounded border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-2 py-1 text-xs text-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/60"
            >
              {d.stop}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DECKS, type Phase } from "../../../../party/types";

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
            Révéler maintenant
          </button>
        ) : (
          <button
            type="button"
            onClick={onResetAction}
            className="rounded-lg border border-token-strong bg-surface-2 px-4 py-2 text-sm font-medium text-fg hover:bg-surface"
          >
            Re-voter cette story
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
            placeholder="Story suivante (titre)…"
            maxLength={200}
            className="flex-1 rounded-lg border border-token-strong bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg border border-token-strong bg-surface-2 px-3 py-2 text-sm font-medium text-fg hover:bg-surface"
          >
            <span className="inline-flex items-center gap-1">Story suivante <ArrowRight size={14} /></span>
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
          Auto-révéler
        </label>

        <label className="flex items-center gap-2 text-muted">
          Deck :
          <select
            value={deckId}
            onChange={(e) => onSetDeckAction(e.target.value)}
            className="rounded border border-token bg-surface px-2 py-1 text-xs text-fg focus:border-indigo-500 outline-none"
          >
            {Object.values(DECKS).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1 text-muted">
          <span>Timer :</span>
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
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

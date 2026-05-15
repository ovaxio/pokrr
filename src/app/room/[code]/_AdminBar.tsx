"use client";

import { useState } from "react";
import type { Phase } from "../../../../party/types";

export default function AdminBar({
  phase,
  autoReveal,
  onReveal,
  onReset,
  onNextStory,
  onToggleAutoReveal,
}: {
  phase: Phase;
  autoReveal: boolean;
  onReveal: () => void;
  onReset: () => void;
  onNextStory: (story: string) => void;
  onToggleAutoReveal: (enabled: boolean) => void;
}) {
  const [nextStory, setNextStory] = useState("");

  return (
    <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="flex flex-wrap gap-2">
        {phase === "voting" ? (
          <button
            type="button"
            onClick={onReveal}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Révéler maintenant
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700"
          >
            Re-voter cette story
          </button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = nextStory.trim().slice(0, 200);
            onNextStory(value);
            setNextStory("");
          }}
          className="flex flex-1 gap-2"
        >
          <input
            value={nextStory}
            onChange={(e) => setNextStory(e.target.value)}
            placeholder="Story suivante (titre)…"
            maxLength={200}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-medium hover:bg-neutral-700"
          >
            Story suivante →
          </button>
        </form>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-400">
        <input
          type="checkbox"
          checked={autoReveal}
          onChange={(e) => onToggleAutoReveal(e.target.checked)}
          className="accent-indigo-500"
        />
        Auto-révéler dès que tout le monde a voté
      </label>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { HistoryEntry } from "../../../lib/storyHistory";

export default function StoryHistory({
  entries,
  onClear,
}: {
  entries: HistoryEntry[];
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group rounded-lg border border-neutral-800 bg-neutral-900/40"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900/60">
        <span className="flex items-center gap-2">
          <span className="text-neutral-500">▸</span>
          <span>
            Historique de la session{" "}
            <span className="text-neutral-500">({entries.length})</span>
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("Effacer l'historique local de cette session ?")) onClear();
          }}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Effacer
        </button>
      </summary>
      <ul className="divide-y divide-neutral-800 border-t border-neutral-800">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate text-neutral-200" title={e.story}>
              {e.story}
            </span>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {e.mean !== null && (
                <span className="text-neutral-500">
                  moy.&nbsp;<span className="text-neutral-300">{fmt(e.mean)}</span>
                </span>
              )}
              <span className="rounded bg-indigo-600/30 px-2 py-0.5 font-mono text-sm font-semibold text-indigo-200">
                {e.finalCard ?? "—"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

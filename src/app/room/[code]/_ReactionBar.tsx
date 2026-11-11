"use client";

import { useId } from "react";
import { REACTION_ITEMS, type ReactionItem } from "../../../../party/types";
import { useDict } from "@/i18n/DictContext";
import { isPaperItem, reactionItemLabel } from "@/lib/projectiles";
import ReactionGlyph from "./_ReactionGlyph";

// Barre des réactions (emojis et objets en papier) : un élément armé reste actif jusqu'à ce
// qu'on re-clique dessus.
// aria-pressed (et non role="radio") : une radio ne se décoche pas au clic.
export default function ReactionBar({
  armed,
  onArmAction,
}: {
  armed: ReactionItem | null;
  onArmAction: (item: ReactionItem) => void;
}) {
  const d = useDict();
  const hintId = useId();

  return (
    <div className="mt-4 flex flex-col items-center gap-1.5">
      <div
        role="group"
        aria-label={d.reactionBarLabel}
        aria-describedby={hintId}
        data-room-shortcuts-off
        className="grid grid-cols-6 gap-1 sm:flex sm:flex-wrap sm:justify-center"
      >
        {REACTION_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={armed === item}
            aria-label={isPaperItem(item) ? reactionItemLabel(item, d) : undefined}
            onClick={() => onArmAction(item)}
            className={
              "flex h-9 w-9 items-center justify-center rounded border text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " +
              (armed === item
                ? "border-indigo-500 bg-indigo-500/20"
                : "border-token bg-surface hover:bg-surface-2")
            }
          >
            <ReactionGlyph item={item} size="bar" />
          </button>
        ))}
      </div>
      <p id={hintId} className="text-xs text-muted">
        {d.reactionBarHint}
      </p>
    </div>
  );
}

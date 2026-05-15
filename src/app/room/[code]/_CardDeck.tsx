"use client";

import { DECK, type Card, type Phase } from "../../../../party/types";

export default function CardDeck({
  selected,
  phase,
  onSelect,
  onUnselect,
}: {
  selected: Card | null;
  phase: Phase;
  onSelect: (card: Card) => void;
  onUnselect: () => void;
}) {
  const disabled = phase === "revealed";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Ta carte</span>
        {selected && !disabled && (
          <button
            type="button"
            onClick={onUnselect}
            className="text-neutral-400 hover:text-neutral-200"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {DECK.map((card) => {
          const isSelected = selected === card;
          return (
            <button
              key={card}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(card)}
              aria-pressed={isSelected}
              className={
                "h-16 min-w-[3rem] flex-1 basis-[calc(25%-0.5rem)] rounded-lg border text-lg font-semibold transition active:scale-95 sm:basis-auto sm:px-4 " +
                (isSelected
                  ? "border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                  : "border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-800") +
                (disabled ? " cursor-not-allowed opacity-40" : "")
              }
            >
              {card}
            </button>
          );
        })}
      </div>
    </div>
  );
}

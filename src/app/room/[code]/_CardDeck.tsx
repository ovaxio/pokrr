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
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{disabled ? "Cartes verrouillées" : "Choisis une carte"}</span>
        {selected && !disabled && (
          <button
            type="button"
            onClick={onUnselect}
            className="text-fg-soft hover:text-fg"
          >
            Effacer
          </button>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label="Deck de cartes Fibonacci"
        className="grid grid-cols-4 gap-2 sm:grid-cols-7"
      >
        {DECK.map((card) => {
          const isSelected = selected === card;
          return (
            <button
              key={card}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Vote ${card}`}
              disabled={disabled}
              onClick={() => onSelect(card)}
              className={
                "flex h-16 items-center justify-center rounded-lg border text-xl font-semibold transition active:scale-95 " +
                (isSelected
                  ? "border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                  : "border-token-strong bg-surface text-fg hover:border-token-strong hover:bg-surface-2") +
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

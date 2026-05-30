"use client";

import type { CSSProperties } from "react";
import { DECKS, DEFAULT_DECK_ID, type Card, type Phase } from "../../../../party/types";
import { useDict } from "@/i18n/DictContext";

export default function CardDeck({
  selected,
  phase,
  deckId,
  onSelectAction,
  onUnselectAction,
}: {
  selected: Card | null;
  phase: Phase;
  deckId: string;
  onSelectAction: (card: Card) => void;
  onUnselectAction: () => void;
}) {
  const d = useDict();
  const disabled = phase === "revealed";
  const deck = DECKS[deckId] ?? DECKS[DEFAULT_DECK_ID];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{disabled ? d.cardsLocked : d.chooseCard}</span>
        {selected && !disabled && (
          <button
            type="button"
            onClick={onUnselectAction}
            className="text-fg-soft hover:text-fg"
          >
            {d.clearCard}
          </button>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label={`Deck ${deck.label}`}
        className="grid grid-cols-4 gap-2 sm:grid-cols-7"
      >
        {deck.cards.map((card, i) => {
          const isSelected = selected === card;
          return (
            <button
              key={card}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Vote ${card}`}
              disabled={disabled}
              onClick={() => onSelectAction(card)}
              style={{ '--delay': `${i * 18}ms`, '--dur': '260ms' } as CSSProperties}
              className={
                "anim-fade-up flex h-16 items-center justify-center rounded-lg border text-xl font-semibold transition active:scale-95 " +
                (isSelected
                  ? "border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                  : "border-token-strong bg-surface text-fg hover:bg-surface-2 " + (!disabled ? "[@media(hover:hover)]:hover:scale-[1.04] motion-reduce:hover:scale-100" : "")) +
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

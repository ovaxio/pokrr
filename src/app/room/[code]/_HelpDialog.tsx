"use client";

import { useEffect } from "react";
import { DECKS, DEFAULT_DECK_ID } from "../../../../party/types";

export default function HelpDialog({
  open,
  deckId,
  onClose,
}: {
  open: boolean;
  deckId: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const deck = DECKS[deckId] ?? DECKS[DEFAULT_DECK_ID];
  const reachableByKey = deck.cards.slice(0, 10);
  const clickOnly = deck.cards.slice(10).filter((c) => c !== "?");
  const hasQuestion = (deck.cards as readonly string[]).includes("?");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aide raccourcis clavier"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl border border-token bg-elevated p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">Raccourcis clavier</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'aide"
            className="text-muted hover:text-fg"
          >
            ×
          </button>
        </div>

        <section className="space-y-3 text-sm">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Voter (deck {deck.label})
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {reachableByKey.map((card, i) => (
                <ShortcutRow key={card} keys={String(i)} label={`Carte ${card}`} />
              ))}
              {hasQuestion && <ShortcutRow keys="?" label="Carte ?" />}
            </div>
            {clickOnly.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Cartes {clickOnly.join(", ")} : clic uniquement.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Admin
            </div>
            <div className="space-y-1">
              <ShortcutRow keys="Space" label="Révéler (phase voting)" />
              <ShortcutRow keys="R" label="Re-voter cette story (phase revealed)" />
            </div>
          </div>

          <div className="rounded-md border border-token bg-surface px-3 py-2 text-xs text-muted">
            Désactivé quand un champ texte est focus.
          </div>
        </section>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <kbd className="inline-flex min-w-[2rem] items-center justify-center rounded border border-token bg-surface px-2 py-0.5 font-mono text-xs text-fg">
        {keys}
      </kbd>
      <span className="text-fg-soft">{label}</span>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { DECK } from "../../../../party/types";

export default function HelpDialog({
  open,
  onClose,
}: {
  open: boolean;
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
        className="w-full max-w-md space-y-4 rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Raccourcis clavier</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'aide"
            className="text-neutral-400 hover:text-neutral-100"
          >
            ×
          </button>
        </div>

        <section className="space-y-3 text-sm">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Voter
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {DECK.slice(0, 10).map((card, i) => (
                <ShortcutRow key={card} keys={String(i)} label={`Carte ${card}`} />
              ))}
              <ShortcutRow keys="?" label="Carte ?" />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Cartes 89, ∞ et ☕ : clic uniquement.
            </p>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Admin
            </div>
            <div className="space-y-1">
              <ShortcutRow keys="Space" label="Révéler (phase voting)" />
              <ShortcutRow keys="R" label="Re-voter cette story (phase revealed)" />
            </div>
          </div>

          <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-neutral-400">
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
      <kbd className="inline-flex min-w-[2rem] items-center justify-center rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 font-mono text-xs text-neutral-200">
        {keys}
      </kbd>
      <span className="text-neutral-300">{label}</span>
    </div>
  );
}

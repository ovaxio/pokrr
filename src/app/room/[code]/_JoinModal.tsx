"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Hand } from "lucide-react";

export default function JoinModal({
  roomId,
  defaultName,
  onSubmitAction,
}: {
  roomId: string;
  defaultName: string;
  onSubmitAction: (name: string, asViewer: boolean) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [asViewer, setAsViewer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = name.trim();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choisir un pseudo"
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/95 backdrop-blur px-4"
    >
      <div className="w-full max-w-md space-y-6 rounded-xl border border-token bg-elevated p-6 shadow-2xl">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted">
            Salle <span className="font-mono text-fg">{roomId}</span>
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Ton pseudo</h2>
          <p className="text-sm text-muted">
            Affiché aux autres voters. Aucune autre information n&apos;est demandée.
          </p>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onSubmitAction(trimmed.slice(0, 24), asViewer);
          }}
          className="space-y-3"
        >
          <label htmlFor="join-name" className="sr-only">
            Pseudo
          </label>
          <input
            id="join-name"
            ref={inputRef}
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Ex. John"
            className="w-full rounded-lg border border-token-strong bg-surface px-4 py-3 text-base text-fg outline-none transition focus:border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-sm transition ${!asViewer ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "border-token bg-surface text-fg-soft hover:bg-surface-2"}`}>
              <input
                type="radio"
                name="join-mode"
                className="sr-only"
                checked={!asViewer}
                onChange={() => setAsViewer(false)}
              />
              <Hand size={20} />
              <span className="font-medium">Voter</span>
            </label>
            <label className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-sm transition ${asViewer ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "border-token bg-surface text-fg-soft hover:bg-surface-2"}`}>
              <input
                type="radio"
                name="join-mode"
                className="sr-only"
                checked={asViewer}
                onChange={() => setAsViewer(true)}
              />
              <Eye size={20} />
              <span className="font-medium">Observer</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={!trimmed}
            className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Entrer dans la salle
          </button>
        </form>
      </div>
    </div>
  );
}

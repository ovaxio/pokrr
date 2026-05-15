"use client";

import { useEffect, useRef, useState } from "react";

export default function JoinModal({
  roomId,
  defaultName,
  onSubmit,
}: {
  roomId: string;
  defaultName: string;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
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
            if (trimmed) onSubmit(trimmed.slice(0, 24));
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
            placeholder="Ex. Guillaume"
            className="w-full rounded-lg border border-token-strong bg-surface px-4 py-3 text-base text-fg outline-none transition focus:border-indigo-500"
          />
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

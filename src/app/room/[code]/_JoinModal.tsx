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
      className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-950/95 backdrop-blur px-4"
    >
      <div className="w-full max-w-md space-y-6 rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            Salle <span className="font-mono text-neutral-200">{roomId}</span>
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Ton pseudo</h2>
          <p className="text-sm text-neutral-400">
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
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-base outline-none transition focus:border-indigo-500"
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

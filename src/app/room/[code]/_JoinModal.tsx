"use client";

import { useState } from "react";

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
  const trimmed = name.trim();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Salle <span className="font-mono text-neutral-300">{roomId}</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Ton pseudo</h1>
          <p className="text-neutral-400 text-sm">
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
          <input
            autoFocus
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
      </main>
    </div>
  );
}

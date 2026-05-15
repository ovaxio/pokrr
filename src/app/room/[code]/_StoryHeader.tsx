"use client";

import { useState } from "react";

export default function StoryHeader({
  story,
  isAdmin,
  onSubmit,
}: {
  story: string;
  isAdmin: boolean;
  onSubmit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(story);

  const startEdit = () => {
    setDraft(story);
    setEditing(true);
  };

  if (editing && isAdmin) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(draft.trim().slice(0, 200));
          setEditing(false);
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder="Titre de la story…"
          className="flex-1 rounded-lg border border-token-strong bg-surface px-3 py-2 text-lg text-fg outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(story);
              setEditing(false);
            }}
            className="rounded-lg border border-token-strong px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <h2 className="flex-1 text-2xl font-semibold tracking-tight text-fg">
        {story || <span className="italic text-faint">Aucune story définie</span>}
      </h2>
      {isAdmin && (
        <button
          type="button"
          onClick={startEdit}
          className="rounded-md border border-token px-3 py-1.5 text-xs text-muted hover:bg-surface-2"
        >
          {story ? "Modifier" : "Définir"}
        </button>
      )}
    </div>
  );
}

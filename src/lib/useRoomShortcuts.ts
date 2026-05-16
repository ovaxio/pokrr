"use client";

import { useEffect } from "react";
import { DECKS, DEFAULT_DECK_ID, type ClientMessage, type RoomState } from "../../party/types";

export type RoomShortcutsConfig = {
  state: RoomState | null;
  isAdmin: boolean;
  send: (msg: ClientMessage) => void;
};

// Raccourcis clavier disponibles dans une salle :
// - 0..9 : sélectionne la carte à la position correspondante du deck courant
// - ?    : sélectionne la carte "?" (si présente dans le deck)
// - Space (admin, phase voting) : reveal
// - R    (admin, phase revealed) : re-voter cette story
// Inactif si focus dans un input/textarea/contenteditable.
export function useRoomShortcuts({ state, isAdmin, send }: RoomShortcutsConfig) {
  useEffect(() => {
    if (!state) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const deck = DECKS[state.deckId] ?? DECKS[DEFAULT_DECK_ID];

      // 0..9 → carte à la position correspondante du deck courant.
      if (/^\d$/.test(e.key) && state.phase === "voting") {
        const idx = parseInt(e.key, 10);
        const card = deck.cards[idx];
        if (card) {
          e.preventDefault();
          send({ type: "vote", value: card });
        }
        return;
      }

      // ? → carte "?"
      if (e.key === "?" && state.phase === "voting") {
        if ((deck.cards as readonly string[]).includes("?")) {
          e.preventDefault();
          send({ type: "vote", value: "?" });
        }
        return;
      }

      // Admin only au-delà.
      if (!isAdmin) return;

      // Espace → reveal pendant la phase voting.
      if (e.key === " " && state.phase === "voting") {
        e.preventDefault();
        send({ type: "reveal" });
        return;
      }

      // R → reset (re-vote) après reveal.
      if ((e.key === "r" || e.key === "R") && state.phase === "revealed") {
        e.preventDefault();
        send({ type: "reset" });
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, isAdmin, send]);
}

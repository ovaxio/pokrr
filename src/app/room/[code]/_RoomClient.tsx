"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePokrrRoom } from "../../../lib/usePokrrRoom";
import { useRoomShortcuts } from "../../../lib/useRoomShortcuts";
import { getStoredName, storeName } from "../../../lib/voterId";
import AdminBar from "./_AdminBar";
import CardDeck from "./_CardDeck";
import HelpDialog from "./_HelpDialog";
import JoinModal from "./_JoinModal";
import PlayerList from "./_PlayerList";
import ResultsPanel from "./_ResultsPanel";
import ShareDialog from "./_ShareDialog";
import StoryHeader from "./_StoryHeader";

export default function RoomClient({ roomId }: { roomId: string }) {
  const [name, setName] = useState<string | null>(null);
  const [nameHydrated, setNameHydrated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Lecture localStorage post-hydration : pas accessible côté SSR.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(getStoredName() || null);
    setNameHydrated(true);
  }, []);

  const room = usePokrrRoom(roomId, name);
  const isAdmin = room.me?.isAdmin ?? false;
  useRoomShortcuts({ state: room.state, isAdmin, send: room.send });

  const players = room.state?.players ?? [];
  const totalCount = players.length;
  const votedCount = players.filter((p) => p.hasVoted).length;
  const isRevealed = room.state?.phase === "revealed";
  const phase = room.state?.phase ?? "voting";
  const story = room.state?.story ?? "";
  const adminPlayer = players.find((p) => p.isAdmin);
  const adminOffline = adminPlayer ? !adminPlayer.online : players.length > 0;
  const isConnecting = !room.state;
  const isKicked = room.status === "kicked";
  const needsName = nameHydrated && !name;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <h1 className="sr-only">Planning poker — Salle {roomId}</h1>

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6 sm:gap-6 sm:py-6">
        <header className="flex items-center justify-between gap-3 text-sm">
          <Link href="/" className="font-bold tracking-tight text-lg hover:text-indigo-400">
            pokrr
          </Link>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="hidden sm:inline">Salle</span>
            <code className="rounded bg-neutral-900 px-2 py-1 font-mono text-neutral-300">
              {roomId}
            </code>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded border border-neutral-800 px-2 py-1 text-neutral-400 transition hover:bg-neutral-800"
            >
              Partager
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Raccourcis clavier"
              title="Raccourcis clavier"
              className="rounded border border-neutral-800 px-2 py-1 font-mono text-neutral-400 transition hover:bg-neutral-800"
            >
              ?
            </button>
          </div>
        </header>

        {room.errorMsg && !isKicked && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            <span>{room.errorMsg}</span>
            <button
              type="button"
              onClick={room.dismissError}
              className="text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        )}

        {adminOffline && !isAdmin && (
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            L&apos;admin {adminPlayer ? <strong>{adminPlayer.name}</strong> : null} est hors ligne.
            Le rôle sera transféré automatiquement au plus ancien voter en ligne après 15 min sans
            retour.
          </div>
        )}

        <StoryHeader
          story={story}
          isAdmin={isAdmin}
          onSubmit={(s) => room.send({ type: "set_story", story: s })}
        />

        <div className="text-sm text-neutral-400" role="status" aria-live="polite">
          {isConnecting
            ? "Connexion en cours…"
            : isRevealed
              ? `Résultats — ${votedCount}/${totalCount} ont voté`
              : `${votedCount}/${totalCount} a voté`}
        </div>

        <section>
          <PlayerList
            players={players}
            phase={phase}
            meVoterId={room.voterId}
            amIAdmin={isAdmin}
            onKick={(voterId) => room.send({ type: "kick", voterId })}
            onTransfer={(voterId) => room.send({ type: "transfer_admin", voterId })}
          />
        </section>

        {isRevealed && <ResultsPanel players={players} />}

        {isAdmin && room.state && (
          <AdminBar
            phase={room.state.phase}
            autoReveal={room.state.autoReveal}
            onReveal={() => room.send({ type: "reveal" })}
            onReset={() => room.send({ type: "reset" })}
            onNextStory={(story) => room.send({ type: "next_story", story })}
            onToggleAutoReveal={(enabled) => room.send({ type: "set_auto_reveal", enabled })}
          />
        )}

        <div className="mt-auto pt-2">
          <CardDeck
            selected={room.mySelectedVote}
            phase={phase}
            onSelect={(value) => room.send({ type: "vote", value })}
            onUnselect={() => room.send({ type: "unvote" })}
          />
        </div>
      </main>

      {needsName && (
        <JoinModal
          roomId={roomId}
          defaultName=""
          onSubmit={(n) => {
            storeName(n);
            setName(n);
          }}
        />
      )}

      {isKicked && (
        <div
          role="alert"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/95 backdrop-blur px-4 text-center text-red-300"
        >
          {room.errorMsg ?? "Vous avez été retiré"}
        </div>
      )}

      <ShareDialog roomId={roomId} open={shareOpen} onClose={() => setShareOpen(false)} />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

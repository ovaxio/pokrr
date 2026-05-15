"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePokrrRoom } from "../../../lib/usePokrrRoom";
import { getStoredName, storeName } from "../../../lib/voterId";
import AdminBar from "./_AdminBar";
import CardDeck from "./_CardDeck";
import JoinModal from "./_JoinModal";
import PlayerList from "./_PlayerList";
import StoryHeader from "./_StoryHeader";

export default function RoomClient({ roomId }: { roomId: string }) {
  const [name, setName] = useState<string | null>(null);
  const [nameHydrated, setNameHydrated] = useState(false);

  // Lecture localStorage post-hydration : pas accessible côté SSR. Le linter recommande
  // useSyncExternalStore mais ici on lit une fois au mount, pas besoin d'abonnement.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(getStoredName() || null);
    setNameHydrated(true);
  }, []);

  const room = usePokrrRoom(roomId, name);

  if (!nameHydrated) return <FullScreen text="Chargement…" />;
  if (!name) {
    return (
      <JoinModal
        roomId={roomId}
        defaultName=""
        onSubmit={(n) => {
          storeName(n);
          setName(n);
        }}
      />
    );
  }

  if (room.status === "kicked") {
    return <FullScreen text={room.errorMsg ?? "Vous avez été retiré"} tone="danger" />;
  }

  if (!room.state) return <FullScreen text="Connexion…" />;

  const isAdmin = room.me?.isAdmin ?? false;
  const players = room.state.players;
  const totalCount = players.length;
  const votedCount = players.filter((p) => p.hasVoted).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3 text-sm">
          <Link href="/" className="font-bold tracking-tight text-lg hover:text-indigo-400">
            pokrr
          </Link>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Salle</span>
            <code className="rounded bg-neutral-900 px-2 py-1 font-mono text-neutral-300">
              {roomId}
            </code>
            <CopyLinkButton />
          </div>
        </header>

        {room.errorMsg && (
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

        <StoryHeader
          story={room.state.story}
          isAdmin={isAdmin}
          onSubmit={(s) => room.send({ type: "set_story", story: s })}
        />

        <div className="text-sm text-neutral-400" role="status" aria-live="polite">
          {room.state.phase === "voting"
            ? `${votedCount}/${totalCount} a voté`
            : `Résultats — ${totalCount} voter${totalCount > 1 ? "s" : ""}`}
        </div>

        <section className="space-y-4">
          <PlayerList
            players={players}
            phase={room.state.phase}
            meVoterId={room.voterId}
            amIAdmin={isAdmin}
            onKick={(voterId) => room.send({ type: "kick", voterId })}
            onTransfer={(voterId) => room.send({ type: "transfer_admin", voterId })}
          />
        </section>

        {isAdmin && (
          <AdminBar
            phase={room.state.phase}
            autoReveal={room.state.autoReveal}
            onReveal={() => room.send({ type: "reveal" })}
            onReset={() => room.send({ type: "reset" })}
            onNextStory={(story) => room.send({ type: "next_story", story })}
            onToggleAutoReveal={(enabled) => room.send({ type: "set_auto_reveal", enabled })}
          />
        )}

        <div className="mt-auto pt-4">
          <CardDeck
            selected={room.mySelectedVote}
            phase={room.state.phase}
            onSelect={(value) => room.send({ type: "vote", value })}
            onUnselect={() => room.send({ type: "unvote" })}
          />
        </div>
      </main>
    </div>
  );
}

function FullScreen({ text, tone }: { text: string; tone?: "danger" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-center text-neutral-100">
      <p className={tone === "danger" ? "text-red-300" : "text-neutral-400"}>{text}</p>
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = window.location.href;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback : sélection cachée + execCommand (legacy mais marche en HTTP non-sécurisé).
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copier le lien"
      className={
        "rounded border px-2 py-1 transition " +
        (copied
          ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
          : "border-neutral-800 text-neutral-400 hover:bg-neutral-800")
      }
    >
      {copied ? "Copié ✓" : "Copier"}
    </button>
  );
}

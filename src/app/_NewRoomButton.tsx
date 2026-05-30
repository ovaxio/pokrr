"use client";

import { useState } from "react";
import { customAlphabet } from "nanoid";
import { useRouter } from "next/navigation";
import { useDict } from "@/i18n/DictContext";

// Alphabet sans 0/O/1/I/l pour lever toute ambiguïté visuelle quand on dicte un code.
const ROOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newRoomId = customAlphabet(ROOM_ALPHABET, 10);

export default function NewRoomButton() {
  const router = useRouter();
  const d = useDict();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        router.push(`/room/${newRoomId()}`);
      }}
      className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin motion-reduce:animate-none rounded-full border-2 border-white/30 border-t-white" />
          {d.createRoom}
        </span>
      ) : d.createRoom}
    </button>
  );
}

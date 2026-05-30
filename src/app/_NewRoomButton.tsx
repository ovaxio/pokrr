"use client";

import { customAlphabet } from "nanoid";
import { useRouter } from "next/navigation";
import { useDict } from "@/i18n/DictContext";

// Alphabet sans 0/O/1/I/l pour lever toute ambiguïté visuelle quand on dicte un code.
const ROOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newRoomId = customAlphabet(ROOM_ALPHABET, 10);

export default function NewRoomButton() {
  const router = useRouter();
  const d = useDict();
  return (
    <button
      type="button"
      onClick={() => router.push(`/room/${newRoomId()}`)}
      className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
    >
      {d.createRoom}
    </button>
  );
}

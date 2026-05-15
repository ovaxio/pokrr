"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinRoomForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const trimmed = code.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) router.push(`/room/${trimmed}`);
      }}
      className="space-y-2"
    >
      <label htmlFor="room-code" className="block text-sm text-neutral-400">
        Rejoindre une salle
      </label>
      <div className="flex gap-2">
        <input
          id="room-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code de la salle"
          autoComplete="off"
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-base font-mono tracking-wider outline-none transition focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-base font-medium transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Rejoindre
        </button>
      </div>
    </form>
  );
}

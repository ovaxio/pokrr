"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDict } from "@/i18n/DictContext";

export default function JoinRoomForm() {
  const router = useRouter();
  const d = useDict();
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
      <label htmlFor="room-code" className="block text-sm text-muted">
        {d.joinRoomLabel}
      </label>
      <div className="flex gap-2">
        <input
          id="room-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={d.joinRoomPlaceholder}
          autoComplete="off"
          className="flex-1 rounded-lg border border-token-strong bg-surface px-3 py-2 text-base font-mono tracking-wider text-fg outline-none transition focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="rounded-lg border border-token-strong bg-surface-2 px-4 py-2 text-base font-medium text-fg transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.joinRoomSubmit}
        </button>
      </div>
    </form>
  );
}

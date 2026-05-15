"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";

export default function HelloPartyKit() {
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    const socket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
      room: "smoke-test",
    });

    socket.addEventListener("open", () => setStatus("open"));
    socket.addEventListener("close", () => setStatus("closed"));
    socket.addEventListener("message", (event) => setLastMessage(String(event.data)));

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="mt-6 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4 text-sm font-mono">
      <div className="flex items-center gap-2">
        <span
          className={
            "inline-block h-2 w-2 rounded-full " +
            (status === "open"
              ? "bg-emerald-400"
              : status === "connecting"
                ? "bg-amber-400 animate-pulse"
                : "bg-red-500")
          }
        />
        <span className="text-neutral-300">PartyKit : {status}</span>
      </div>
      {lastMessage && (
        <pre className="mt-2 overflow-x-auto text-xs text-neutral-400">{lastMessage}</pre>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlarmClock, Timer } from "lucide-react";
import type { TimerInfo } from "../../../../party/types";

export default function TimerDisplay({ timer }: { timer: TimerInfo | null }) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  if (!timer) return null;

  const elapsedSec = Math.floor((now - timer.startedAt) / 1000);
  const remainingSec = Math.max(0, timer.durationSec - elapsedSec);
  const expired = remainingSec === 0;
  const totalSec = timer.durationSec;
  const progress = Math.max(0, Math.min(1, remainingSec / totalSec));
  const isWarning = remainingSec <= 30 && !expired;

  const min = Math.floor(remainingSec / 60);
  const sec = remainingSec % 60;
  const formatted = `${min}:${sec.toString().padStart(2, "0")}`;

  return (
    <div
      role="timer"
      aria-live={expired ? "assertive" : "off"}
      className={
        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm " +
        (expired
          ? "border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200"
          : isWarning
            ? "border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
            : "border-token bg-surface/40 text-fg")
      }
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-base font-semibold tabular-nums">
        {expired ? <><AlarmClock size={16} /> Temps écoulé</> : <><Timer size={16} /> {formatted}</>}
      </span>
      {!expired && (
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className={
              "h-full transition-all duration-1000 ease-linear " +
              (isWarning ? "bg-amber-500" : "bg-indigo-500")
            }
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

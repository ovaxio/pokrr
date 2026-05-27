"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export default function ShareDialog({
  roomId,
  open,
  onCloseAction,
}: {
  roomId: string;
  open: boolean;
  onCloseAction: () => void;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(window.location.href);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseAction();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCloseAction]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard non disponible (contexte non-sécurisé)
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Partager la salle"
      onClick={onCloseAction}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-5 rounded-xl border border-token bg-elevated p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">Partager la salle</h2>
          <button
            type="button"
            onClick={onCloseAction}
            aria-label="Fermer"
            className="text-muted hover:text-fg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center rounded-lg bg-white p-4">
          {url && <QRCodeSVG value={url} size={180} marginSize={1} level="M" />}
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted">
            Code de la salle
          </div>
          <div className="rounded-md border border-token bg-surface px-3 py-2 text-center font-mono text-2xl tracking-widest text-fg">
            {roomId}
          </div>
        </div>

        <button
          type="button"
          onClick={copy}
          className={
            "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition " +
            (copied
              ? "border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
              : "bg-indigo-600 text-white hover:bg-indigo-500")
          }
        >
          {copied ? <span className="inline-flex items-center gap-1">Lien copié <Check size={14} /></span> : "Copier le lien"}
        </button>
      </div>
    </div>
  );
}

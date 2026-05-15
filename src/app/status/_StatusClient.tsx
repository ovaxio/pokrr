"use client";

import { useCallback, useEffect, useState } from "react";

type Health = {
  status: string;
  uptimeMs: number;
  startedAt: string;
  timestamp: string;
  partyKitHost: string | null;
  env: string;
};

type PartyKitCheck = "ok" | "down" | "checking";

export default function StatusClient() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [partyKitCheck, setPartyKitCheck] = useState<PartyKitCheck>("checking");
  const [lastCheck, setLastCheck] = useState<number>(0);

  const probePartyKit = useCallback(async (host: string | null): Promise<PartyKitCheck> => {
    if (!host) return "down";
    try {
      const proto = host.startsWith("localhost") ? "http" : "https";
      // PartyKit répond sur la racine HTTP même sans upgrade WS. En no-cors on
      // n'a pas le statut mais l'absence d'erreur fetch = TCP/TLS handshake OK.
      await fetch(`${proto}://${host}`, { method: "GET", cache: "no-store", mode: "no-cors" });
      return "ok";
    } catch {
      return "down";
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setPartyKitCheck("checking");
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Health;
      setHealth(data);
      setHealthError(null);
      setPartyKitCheck(await probePartyKit(data.partyKitHost));
    } catch (e) {
      setHealthError(e instanceof Error ? e.message : "Erreur");
      setHealth(null);
      setPartyKitCheck("down");
    }
    setLastCheck(Date.now());
  }, [probePartyKit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkHealth();
    const id = window.setInterval(checkHealth, 10_000);
    return () => window.clearInterval(id);
  }, [checkHealth]);

  const frontUp = health !== null;

  return (
    <div className="space-y-4">
      <Card
        label="Frontend (Next.js)"
        up={frontUp}
        detail={
          health
            ? `Uptime ${fmtUptime(health.uptimeMs)} · env ${health.env}`
            : (healthError ?? "—")
        }
      />
      <Card
        label="Serveur de salles (PartyKit)"
        up={partyKitCheck === "ok"}
        checking={partyKitCheck === "checking"}
        detail={health?.partyKitHost ?? "—"}
      />
      <p className="text-xs text-neutral-400">
        Dernière vérification :{" "}
        {lastCheck ? new Date(lastCheck).toLocaleTimeString("fr-FR") : "—"}
      </p>
    </div>
  );
}

function Card({
  label,
  up,
  checking,
  detail,
}: {
  label: string;
  up: boolean;
  checking?: boolean;
  detail: string;
}) {
  const dotColor = checking
    ? "bg-amber-400 animate-pulse"
    : up
      ? "bg-emerald-400"
      : "bg-red-500";
  const badgeColor = checking
    ? "bg-amber-950/40 text-amber-300"
    : up
      ? "bg-emerald-950/40 text-emerald-300"
      : "bg-red-950/40 text-red-300";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="truncate text-xs text-neutral-500">{detail}</div>
      </div>
      <span
        className={
          "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " + badgeColor
        }
      >
        {checking ? "Check…" : up ? "Up" : "Down"}
      </span>
    </div>
  );
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

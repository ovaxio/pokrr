import type { Card } from "../../party/types";

export type HistoryEntry = {
  id: string;
  story: string;
  finalCard: Card | null;
  mean: number | null;
  median: number | null;
  capturedAt: number;
};

const HISTORY_MAX = 50;
const key = (roomId: string) => `pokrr:history:${roomId}`;

export function loadHistory(roomId: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]).slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export function saveHistory(roomId: string, entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(roomId), JSON.stringify(entries.slice(0, HISTORY_MAX)));
  } catch {
    // quota dépassé : on accepte de perdre l'historique
  }
}

export function clearHistory(roomId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(roomId));
}

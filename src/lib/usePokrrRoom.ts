"use client";

import { nanoid } from "nanoid";
import PartySocket from "partysocket";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, ClientMessage, RoomState, ServerMessage } from "../../party/types";
import { computeStats } from "./stats";
import {
  clearHistory as clearHistoryStorage,
  loadHistory,
  saveHistory,
  type HistoryEntry,
} from "./storyHistory";
import { getOrCreateVoterId } from "./voterId";

export type RoomStatus = "connecting" | "joining" | "joined" | "kicked" | "error";

export type UseRoom = {
  state: RoomState | null;
  status: RoomStatus;
  errorMsg: string | null;
  voterId: string;
  me: RoomState["players"][number] | null;
  mySelectedVote: Card | null;
  history: HistoryEntry[];
  dismissError: () => void;
  clearHistory: () => void;
  send: (msg: ClientMessage) => void;
};

export function usePokrrRoom(roomId: string, name: string | null): UseRoom {
  const voterId = useMemo(() => (typeof window === "undefined" ? "" : getOrCreateVoterId()), []);
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mySelectedVote, setMySelectedVote] = useState<Card | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const socketRef = useRef<PartySocket | null>(null);
  const previousStateRef = useRef<RoomState | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory(roomId));
  }, [roomId]);

  useEffect(() => {
    if (!name || !voterId) return;
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
    const socket = new PartySocket({ host, room: roomId });
    socketRef.current = socket;

    const onOpen = () => {
      setStatus("joining");
      socket.send(JSON.stringify({ type: "join", voterId, name } satisfies ClientMessage));
    };

    const onMessage = (event: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        return;
      }

      if (msg.type === "room_state") {
        const prev = previousStateRef.current;
        // Détecte la transition "revealed → voting" avec changement de story → archive.
        if (
          prev &&
          prev.phase === "revealed" &&
          msg.phase === "voting" &&
          prev.story.trim() &&
          prev.story !== msg.story
        ) {
          const stats = computeStats(prev.players);
          const fallbackCard = stats.distribution[0]?.card ?? null;
          const entry: HistoryEntry = {
            id: nanoid(8),
            story: prev.story,
            finalCard: stats.consensusSuggestion ?? fallbackCard,
            mean: stats.mean,
            median: stats.median,
            capturedAt: Date.now(),
          };
          setHistory((h) => {
            const next = [entry, ...h].slice(0, 50);
            saveHistory(roomId, next);
            return next;
          });
        }
        previousStateRef.current = msg;

        setState(msg);
        const me = msg.players.find((p) => p.voterId === voterId);
        if (me) setStatus("joined");
        if (me) {
          if (msg.phase === "voting" && !me.hasVoted) {
            setMySelectedVote(null);
          } else if (msg.phase === "revealed" && me.vote) {
            setMySelectedVote(me.vote);
          }
        }
      } else if (msg.type === "error") {
        setErrorMsg(msg.message);
      } else if (msg.type === "kicked") {
        setStatus("kicked");
        setErrorMsg(msg.reason);
      }
    };

    const onClose = () => setStatus("connecting");

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("close", onClose);
      socket.close();
      socketRef.current = null;
      previousStateRef.current = null;
    };
  }, [roomId, name, voterId]);

  const send = (msg: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (msg.type === "vote") setMySelectedVote(msg.value);
    if (msg.type === "unvote") setMySelectedVote(null);
    socket.send(JSON.stringify(msg));
  };

  const dismissError = () => setErrorMsg(null);
  const clearHistory = () => {
    clearHistoryStorage(roomId);
    setHistory([]);
  };
  const me = state?.players.find((p) => p.voterId === voterId) ?? null;

  return {
    state,
    status,
    errorMsg,
    voterId,
    me,
    mySelectedVote,
    history,
    dismissError,
    clearHistory,
    send,
  };
}

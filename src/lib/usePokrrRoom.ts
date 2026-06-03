"use client";

import PartySocket from "partysocket";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, ClientMessage, RoomState, ServerMessage } from "../../party/types";
import { getOrCreateVoterId } from "./voterId";

type RoomStatus = "connecting" | "joining" | "joined" | "kicked" | "error";

type UseRoom = {
  state: RoomState | null;
  status: RoomStatus;
  errorMsg: string | null;
  voterId: string;
  me: RoomState["players"][number] | null;
  mySelectedVote: Card | null;
  dismissError: () => void;
  send: (msg: ClientMessage) => void;
};

export function usePokrrRoom(roomId: string, name: string | null, asViewer = false): UseRoom {
  const voterId = useMemo(() => (typeof window === "undefined" ? "" : getOrCreateVoterId()), []);
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mySelectedVote, setMySelectedVote] = useState<Card | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    if (!name || !voterId) return;
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
    const socket = new PartySocket({ host, room: roomId });
    socketRef.current = socket;

    const onOpen = () => {
      setStatus("joining");
      socket.send(
        JSON.stringify({
          type: "join",
          voterId,
          name,
          ...(asViewer ? { asViewer: true } : {}),
        } satisfies ClientMessage),
      );
    };

    const onMessage = (event: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        return;
      }
      if (msg.type === "room_state") {
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
    };
  }, [roomId, name, voterId, asViewer]);

  const send = (msg: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (msg.type === "vote") setMySelectedVote(msg.value);
    if (msg.type === "unvote") setMySelectedVote(null);
    socket.send(JSON.stringify(msg));
  };

  const dismissError = () => setErrorMsg(null);
  const me = state?.players.find((p) => p.voterId === voterId) ?? null;

  return { state, status, errorMsg, voterId, me, mySelectedVote, dismissError, send };
}

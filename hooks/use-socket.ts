"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { RoomStateDTO } from "@/lib/queue";
import type { ChatMessageDTO } from "@/types";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socket",
      autoConnect: false,
    });
  }
  return socket;
}

export function useSocket(roomCode: string, userId?: string, guestId?: string) {
  const [state, setState] = useState<RoomStateDTO | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSocket();
    s.connect();

    const onConnect = () => {
      setConnected(true);
      s.emit("join-room", { roomCode, userId, guestId });
    };

    const onRoomState = (data: RoomStateDTO) => setState(data);
    const onChatHistory = (data: ChatMessageDTO[]) => setMessages(data);
    const onChatMessage = (msg: ChatMessageDTO) => setMessages((prev) => [...prev, msg]);
    const onActiveUsers = (count: number) => setActiveUsers(count);
    const onError = (data: { message: string }) => setError(data.message);

    s.on("connect", onConnect);
    s.on("room-state", onRoomState);
    s.on("chat-history", onChatHistory);
    s.on("chat-message", onChatMessage);
    s.on("active-users", onActiveUsers);
    s.on("error", onError);

    if (s.connected) onConnect();

    return () => {
      s.emit("leave-room", { roomCode });
      s.off("connect", onConnect);
      s.off("room-state", onRoomState);
      s.off("chat-history", onChatHistory);
      s.off("chat-message", onChatMessage);
      s.off("active-users", onActiveUsers);
      s.off("error", onError);
    };
  }, [roomCode, userId, guestId]);

  const addToQueue = useCallback(
    (item: { youtubeId: string; title: string; thumbnail: string; channel?: string; duration: number }) =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        getSocket().emit("add-to-queue", { roomCode, ...item, userId, guestId }, resolve);
      }),
    [roomCode, userId, guestId]
  );

  const vote = useCallback(
    (queueItemId: string, type: "UP" | "DOWN") =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        getSocket().emit("vote", { roomCode, queueItemId, type, userId, guestId }, resolve);
      }),
    [roomCode, userId, guestId]
  );

  const sendMessage = useCallback(
    (content: string, guestName?: string) => {
      getSocket().emit("chat-message", { roomCode, content, userId, guestId, guestName });
    },
    [roomCode, userId, guestId]
  );

  const trackEnded = useCallback(() => {
    getSocket().emit("track-ended", { roomCode });
  }, [roomCode]);

  const syncPlayback = useCallback(
    (isPlaying: boolean, currentTime: number) => {
      getSocket().emit("playback-sync", { roomCode, isPlaying, currentTime });
    },
    [roomCode]
  );

  const adminSkip = useCallback(
    () =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        getSocket().emit("admin-skip", { roomCode, userId }, resolve);
      }),
    [roomCode, userId]
  );

  const adminRemove = useCallback(
    (queueItemId: string) =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        getSocket().emit("admin-remove", { roomCode, queueItemId, userId }, resolve);
      }),
    [roomCode, userId]
  );

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`);
      if (res.ok) {
        const data = await res.json();
        setState(data);
        return data as RoomStateDTO;
      }
    } catch {
      getSocket().emit("join-room", { roomCode, userId, guestId });
    }
    return null;
  }, [roomCode, userId, guestId]);

  const applyRoomState = useCallback((newState: RoomStateDTO) => {
    setState(newState);
  }, []);

  return {
    state,
    messages,
    activeUsers,
    connected,
    error,
    addToQueue,
    vote,
    sendMessage,
    trackEnded,
    syncPlayback,
    adminSkip,
    adminRemove,
    refreshState,
    applyRoomState,
  };
}

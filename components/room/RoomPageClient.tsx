"use client";

import { RoomView } from "@/components/room/RoomView";

export function RoomPageClient({ roomCode }: { roomCode: string }) {
  return <RoomView roomCode={roomCode} />;
}

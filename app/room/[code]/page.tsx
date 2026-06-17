import { RoomPageClient } from "@/components/room/RoomPageClient";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomPageClient roomCode={code.toUpperCase()} />;
}

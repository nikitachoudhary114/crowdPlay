import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRoomState, endRoom } from "@/lib/queue";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const state = await getRoomState(code.toUpperCase());
  if (!state) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(state);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        name: body.name,
        description: body.description,
        cooldownMinutes: body.cooldownMinutes,
        queueLocked: body.queueLocked,
        maxQueueSize: body.maxQueueSize,
        voteCooldownSec: body.voteCooldownSec,
      },
    });

    return NextResponse.json({ room: updated });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!room.isActive) return NextResponse.json({ error: "Room already ended" }, { status: 400 });

  await endRoom(room.id);

  const { getIO } = await import("@/server/socket");
  const io = getIO();
  io?.to(code.toUpperCase()).emit("room-ended", { message: "The host has ended this room." });

  return NextResponse.json({ success: true });
}

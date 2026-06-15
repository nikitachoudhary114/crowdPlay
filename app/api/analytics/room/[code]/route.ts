import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { analytics: true },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const topSongs = await prisma.queueItem.groupBy({
    by: ["youtubeId", "title"],
    where: { roomId: room.id },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const votesPerHour = await prisma.vote.count({
    where: {
      queueItem: { roomId: room.id },
      createdAt: { gte: new Date(Date.now() - 3600000) },
    },
  });

  return NextResponse.json({
    analytics: room.analytics,
    topSongs,
    votesPerHour,
    cooldownMinutes: room.cooldownMinutes,
  });
}

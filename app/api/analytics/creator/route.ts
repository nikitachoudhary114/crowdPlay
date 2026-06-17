import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCreatorEarnings, getRevenueSplit, getRoomRevenueFromBoosts } from "@/lib/revenue";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = await prisma.room.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  });

  const revenueByRoom = await getRoomRevenueFromBoosts(rooms.map((r) => r.id));
  const split = await getRevenueSplit();

  const boosts = await prisma.boost.aggregate({
    where: { room: { ownerId: session.user.id } },
    _sum: { amount: true },
    _count: { id: true },
  });

  const tips = await prisma.tip.aggregate({
    where: { receiverId: session.user.id },
    _sum: { amount: true },
  });

  const topSupporters = await prisma.boost.groupBy({
    by: ["userId"],
    where: { room: { ownerId: session.user.id } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const supporterUsers = await prisma.user.findMany({
    where: { id: { in: topSupporters.map((s) => s.userId) } },
    select: { id: true, name: true, image: true },
  });

  const totalBoostAmount = boosts._sum.amount ?? 0;
  const totalTipAmount = tips._sum.amount ?? 0;
  const creatorEarnings =
    (await getCreatorEarnings(totalBoostAmount)) + (await getCreatorEarnings(totalTipAmount));

  return NextResponse.json({
    totalEarnings: creatorEarnings,
    totalRevenue: totalBoostAmount + totalTipAmount,
    boostCount: boosts._count.id,
    splitPercent: split.creatorSharePercent,
    rooms: rooms.map((room) => ({
      ...room,
      grossRevenue: revenueByRoom.get(room.id) ?? 0,
      creatorRevenue: (revenueByRoom.get(room.id) ?? 0) * (split.creatorSharePercent / 100),
    })),
    topSupporters: topSupporters.map((s) => ({
      user: supporterUsers.find((u) => u.id === s.userId),
      amount: s._sum.amount,
    })),
  });
}

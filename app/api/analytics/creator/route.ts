import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = await prisma.room.findMany({
    where: { ownerId: session.user.id },
    include: { analytics: true },
  });

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

  return NextResponse.json({
    totalEarnings: (boosts._sum.amount ?? 0) * 0.7 + (tips._sum.amount ?? 0) * 0.7,
    boostCount: boosts._count.id,
    rooms,
    topSupporters: topSupporters.map((s) => ({
      user: supporterUsers.find((u) => u.id === s.userId),
      amount: s._sum.amount,
    })),
  });
}

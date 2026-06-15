import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      badges: true,
      ownedRooms: { take: 5, orderBy: { createdAt: "desc" } },
      votes: { take: 10, orderBy: { createdAt: "desc" } },
      queueItems: { take: 10, orderBy: { createdAt: "desc" } },
      nftMembership: true,
    },
  });

  const leaderboard = await prisma.vote.groupBy({
    by: ["userId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: leaderboard.map((l) => l.userId!).filter(Boolean) } },
    select: { id: true, name: true, image: true },
  });

  return NextResponse.json({
    user,
    leaderboard: leaderboard.map((l) => ({
      user: users.find((u) => u.id === l.userId),
      votes: l._count.id,
    })),
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [userCount, roomCount, analytics, payments] = await Promise.all([
    prisma.user.count(),
    prisma.room.count({ where: { isActive: true } }),
    prisma.platformAnalytics.findUnique({ where: { id: "platform" } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const dau = await prisma.user.count({
    where: { updatedAt: { gte: new Date(Date.now() - 86400000) } },
  });

  return NextResponse.json({
    dau,
    mau: analytics?.mau ?? userCount,
    totalUsers: userCount,
    activeRooms: roomCount,
    revenue: payments._sum.amount ?? 0,
    tokenTransactions: await prisma.tokenTransaction.count(),
  });
}

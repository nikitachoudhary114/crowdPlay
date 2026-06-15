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

  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { name: true, email: true } },
      analytics: true,
      _count: { select: { queueItems: true } },
    },
  });

  return NextResponse.json({ rooms });
}

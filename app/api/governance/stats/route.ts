import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { getPlatformRevenueBreakdown, getRoomRevenueFromBoosts } from "@/lib/revenue";
import { cacheJson, getCachedJson } from "@/lib/redis";
import { UserRole } from "@/app/generated/prisma";

export const dynamic = "force-dynamic";

type CachedGovernanceStats = {
  breakdown: Awaited<ReturnType<typeof getPlatformRevenueBreakdown>>;
  config: Awaited<ReturnType<typeof prisma.governanceConfig.findUnique>>;
  roomBreakdown: Array<{
    roomName: string;
    roomCode: string;
    isActive: boolean;
    ownerName: string | null;
    totalRevenue: number;
    creatorShare: number;
    platformShare: number;
  }>;
};

export async function GET() {
  const session = await getSession();
  const isAdmin = session?.user?.role === UserRole.PLATFORM_ADMIN;

  const cached = await getCachedJson<CachedGovernanceStats>("governance:stats:v2");
  if (cached) {
    return NextResponse.json({ ...cached, isAdmin });
  }

  const payload = await buildStatsResponse();
  await cacheJson("governance:stats:v2", payload, 30);
  return NextResponse.json({ ...payload, isAdmin });
}

async function buildStatsResponse(): Promise<CachedGovernanceStats> {
  const [breakdown, config, rooms] = await Promise.all([
    getPlatformRevenueBreakdown(),
    prisma.governanceConfig.findUnique({ where: { id: "config" } }),
    prisma.room.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        owner: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const revenueByRoom = await getRoomRevenueFromBoosts(rooms.map((r) => r.id));
  const splitPercent = breakdown.split.creatorSharePercent;

  const roomBreakdown = rooms
    .map((room) => {
      const totalRevenue = revenueByRoom.get(room.id) ?? 0;
      const creatorShare = totalRevenue * (splitPercent / 100);
      return {
        roomName: room.name,
        roomCode: room.code,
        isActive: room.isActive,
        ownerName: room.owner.name,
        totalRevenue,
        creatorShare,
        platformShare: totalRevenue - creatorShare,
      };
    })
    .filter((r) => r.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 20);

  return { breakdown, config, roomBreakdown };
}

const UpdateConfigSchema = z.object({
  creatorSharePercent: z.number().min(50).max(95).optional(),
  platformSharePercent: z.number().min(5).max(50).optional(),
  boostPrice: z.number().min(1).optional(),
  priorityBoostPrice: z.number().min(1).optional(),
  playNextPrice: z.number().min(1).optional(),
  superPriorityPrice: z.number().min(1).optional(),
  cooldownMinutes: z.number().min(0).max(120).optional(),
  maxQueueSize: z.number().min(5).max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = UpdateConfigSchema.parse(await req.json());

    if (body.creatorSharePercent !== undefined) {
      body.platformSharePercent = 100 - body.creatorSharePercent;
    } else if (body.platformSharePercent !== undefined) {
      body.creatorSharePercent = 100 - body.platformSharePercent;
    }

    const config = await prisma.governanceConfig.upsert({
      where: { id: "config" },
      create: { id: "config", ...body },
      update: body,
    });

    const redis = (await import("@/lib/redis")).getRedis();
    await redis.del("governance:stats:v2");

    return NextResponse.json({ config });
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

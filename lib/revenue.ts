import { prisma } from "@/lib/db";

export interface RevenueSplit {
  creatorSharePercent: number;
  platformSharePercent: number;
}

export interface RevenueBreakdown {
  totalRevenue: number;
  creatorPool: number;
  platformPool: number;
  fiatRevenue: number;
  cryptoRevenue: number;
  boostCount: number;
  split: RevenueSplit;
}

export async function getRevenueSplit(): Promise<RevenueSplit> {
  const config = await prisma.governanceConfig.findUnique({ where: { id: "config" } });
  return {
    creatorSharePercent: config?.creatorSharePercent ?? 70,
    platformSharePercent: config?.platformSharePercent ?? 30,
  };
}

export function applyRevenueSplit(total: number, split: RevenueSplit) {
  const creatorPool = total * (split.creatorSharePercent / 100);
  const platformPool = total - creatorPool;
  return { totalRevenue: total, creatorPool, platformPool };
}

export async function getPlatformRevenueBreakdown(): Promise<RevenueBreakdown> {
  const split = await getRevenueSplit();

  const [fiat, crypto, count] = await Promise.all([
    prisma.boost.aggregate({
      where: { method: "FIAT" },
      _sum: { amount: true },
    }),
    prisma.boost.aggregate({
      where: { method: "CRYPTO" },
      _sum: { amount: true },
    }),
    prisma.boost.count(),
  ]);

  const fiatRevenue = fiat._sum.amount ?? 0;
  const cryptoRevenue = crypto._sum.amount ?? 0;
  const totalRevenue = fiatRevenue + cryptoRevenue;
  const { creatorPool, platformPool } = applyRevenueSplit(totalRevenue, split);

  return {
    totalRevenue,
    creatorPool,
    platformPool,
    fiatRevenue,
    cryptoRevenue,
    boostCount: count,
    split,
  };
}

export async function getCreatorEarnings(totalBoostAmount: number): Promise<number> {
  const split = await getRevenueSplit();
  return totalBoostAmount * (split.creatorSharePercent / 100);
}

/** Per-room revenue from actual boost records (source of truth). */
export async function getRoomRevenueFromBoosts(roomIds?: string[]) {
  const groups = await prisma.boost.groupBy({
    by: ["roomId"],
    where: roomIds?.length ? { roomId: { in: roomIds } } : undefined,
    _sum: { amount: true },
  });
  return new Map(groups.map((g) => [g.roomId, g._sum.amount ?? 0]));
}

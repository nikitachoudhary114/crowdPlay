import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Off-chain CROWD balance boosts are disabled. Use CROWD tokens in a room via the Web3 payment option.",
    },
    { status: 410 }
  );
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      nftMembership: true,
      badges: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { walletAddress } = z.object({ walletAddress: z.string() }).parse(await req.json());

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    });

    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

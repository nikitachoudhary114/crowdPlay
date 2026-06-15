import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CROWD_PRICES } from "@/lib/constants";
import { applyBoost } from "@/lib/queue";
import { BoostType, PaymentMethod } from "@/app/generated/prisma";
import { broadcastRoomState } from "@/server/socket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CryptoBoostSchema = z.object({
  roomCode: z.string(),
  queueItemId: z.string(),
  action: z.enum(["VOTE_BOOST", "QUEUE_JUMP", "PLAY_NEXT"]),
  txHash: z.string(),
});

const ACTION_MAP: Record<string, { price: number; boostType: BoostType }> = {
  VOTE_BOOST: { price: CROWD_PRICES.VOTE_BOOST, boostType: BoostType.BOOST },
  QUEUE_JUMP: { price: CROWD_PRICES.QUEUE_JUMP, boostType: BoostType.PRIORITY_BOOST },
  PLAY_NEXT: { price: CROWD_PRICES.PLAY_NEXT, boostType: BoostType.PLAY_NEXT },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = CryptoBoostSchema.parse(await req.json());
    const action = ACTION_MAP[body.action];
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.crowdBalance < action.price) {
      return NextResponse.json({ error: "Insufficient CROWD balance" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { code: body.roomCode.toUpperCase() } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { crowdBalance: { decrement: action.price } },
    });

    await prisma.tokenTransaction.create({
      data: {
        userId: session.user.id,
        amount: -action.price,
        type: body.action,
        txHash: body.txHash,
      },
    });

    await applyBoost({
      roomId: room.id,
      queueItemId: body.queueItemId,
      userId: session.user.id,
      type: action.boostType,
      amount: action.price,
      method: PaymentMethod.CRYPTO,
      txHash: body.txHash,
    });

    await broadcastRoomState(body.roomCode.toUpperCase());
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
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

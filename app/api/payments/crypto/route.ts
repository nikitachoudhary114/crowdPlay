import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress, type Address, type Hash } from "viem";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { applyBoost, getRoomState } from "@/lib/queue";
import { BoostType, PaymentMethod } from "@/app/generated/prisma";
import { broadcastRoomState } from "@/server/socket";
import {
  contractsConfigured,
  crowdPriceForBoost,
  getContractAddresses,
  SUPPORTED_CHAIN_ID,
} from "@/lib/contracts";
import { verifyBoostTransaction } from "@/lib/verify-crypto-payment";
import { CROWD_PRICES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ZERO = "0x0000000000000000000000000000000000000000";

async function resolveCreatorAddress(ownerId: string): Promise<Address> {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { walletAddress: true },
  });
  if (owner?.walletAddress && isAddress(owner.walletAddress)) {
    return owner.walletAddress as Address;
  }
  const fallback = process.env.NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS;
  if (fallback && isAddress(fallback)) return fallback as Address;
  return ZERO as Address;
}

export async function GET(req: NextRequest) {
  const roomCode = req.nextUrl.searchParams.get("roomCode")?.toUpperCase();
  if (!roomCode) {
    return NextResponse.json({ error: "roomCode required" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { code: roomCode } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const creatorAddress = await resolveCreatorAddress(room.ownerId);
  const { crowdToken, queueBoost } = getContractAddresses();

  return NextResponse.json({
    configured: contractsConfigured(),
    chainId: SUPPORTED_CHAIN_ID,
    crowdToken,
    queueBoost,
    creatorAddress,
    prices: CROWD_PRICES,
    cryptoBoostTypes: ["BOOST", "PRIORITY_BOOST", "PLAY_NEXT", "SUPER_PRIORITY"],
  });
}

const VerifySchema = z.object({
  roomCode: z.string(),
  queueItemId: z.string(),
  boostType: z.enum(["BOOST", "PRIORITY_BOOST", "PLAY_NEXT", "SUPER_PRIORITY"]),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  walletAddress: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required for crypto boosts" }, { status: 401 });
    }

    const body = VerifySchema.parse(await req.json());
    if (!isAddress(body.walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { code: body.roomCode.toUpperCase() },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    await verifyBoostTransaction({
      txHash: body.txHash as Hash,
      buyerAddress: body.walletAddress as Address,
      roomCode: body.roomCode.toUpperCase(),
      queueItemId: body.queueItemId,
      boostType: body.boostType as BoostType,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress: body.walletAddress },
    });

    await applyBoost({
      roomId: room.id,
      queueItemId: body.queueItemId,
      userId: session.user.id,
      type: body.boostType as BoostType,
      amount: crowdPriceForBoost(body.boostType as BoostType),
      method: PaymentMethod.CRYPTO,
      txHash: body.txHash,
    });

    await prisma.tokenTransaction.create({
      data: {
        userId: session.user.id,
        amount: -crowdPriceForBoost(body.boostType as BoostType),
        type: `CRYPTO_${body.boostType}`,
        txHash: body.txHash,
      },
    });

    await broadcastRoomState(body.roomCode.toUpperCase());
    const state = await getRoomState(body.roomCode.toUpperCase());
    return NextResponse.json({ success: true, state });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

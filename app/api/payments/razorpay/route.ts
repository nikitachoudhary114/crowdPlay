import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRazorpay, verifyRazorpaySignature } from "@/lib/razorpay";
import { prisma } from "@/lib/db";
import { applyBoost, getRoomState } from "@/lib/queue";
import { BOOST_PRICES } from "@/lib/constants";
import { BoostType, PaymentMethod, PaymentStatus } from "@/app/generated/prisma";
import { broadcastRoomState } from "@/server/socket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateOrderSchema = z.object({
  roomCode: z.string(),
  queueItemId: z.string(),
  boostType: z.enum(["BOOST", "PRIORITY_BOOST", "PLAY_NEXT", "SUPER_PRIORITY"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = CreateOrderSchema.parse(await req.json());
    const amount = BOOST_PRICES[body.boostType];
    const razorpay = getRazorpay();

    if (!razorpay) {
      await applyBoost({
        roomId: (await prisma.room.findUnique({ where: { code: body.roomCode.toUpperCase() } }))!.id,
        queueItemId: body.queueItemId,
        userId: session.user.id,
        type: body.boostType as BoostType,
        amount,
        method: PaymentMethod.FIAT,
        paymentId: "demo_payment",
      });
      await broadcastRoomState(body.roomCode.toUpperCase());
      const state = await getRoomState(body.roomCode.toUpperCase());
      return NextResponse.json({ demo: true, success: true, state });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        method: PaymentMethod.FIAT,
        status: PaymentStatus.PENDING,
        metadata: body,
      },
    });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: payment.id,
      notes: {
        roomCode: body.roomCode,
        queueItemId: body.queueItemId,
        boostType: body.boostType,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { razorpayId: order.id },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

const VerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  paymentId: z.string(),
  roomCode: z.string(),
  queueItemId: z.string(),
  boostType: z.enum(["BOOST", "PRIORITY_BOOST", "PLAY_NEXT", "SUPER_PRIORITY"]),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = VerifySchema.parse(await req.json());

    if (
      !verifyRazorpaySignature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { code: body.roomCode.toUpperCase() } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    await prisma.payment.update({
      where: { id: body.paymentId },
      data: { status: PaymentStatus.COMPLETED, razorpayId: body.razorpay_payment_id },
    });

    await applyBoost({
      roomId: room.id,
      queueItemId: body.queueItemId,
      userId: session.user.id,
      type: body.boostType as BoostType,
      amount: BOOST_PRICES[body.boostType],
      method: PaymentMethod.FIAT,
      paymentId: body.razorpay_payment_id,
    });

    await broadcastRoomState(body.roomCode.toUpperCase());
    const state = await getRoomState(body.roomCode.toUpperCase());
    return NextResponse.json({ success: true, state });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateRoomCode } from "@/lib/queue";

export const dynamic = "force-dynamic";

const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  cooldownMinutes: z.number().min(0).max(120).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rooms = await prisma.room.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { queueItems: true } } },
  });

  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = CreateRoomSchema.parse(await req.json());
    const code = await generateRoomCode();

    const room = await prisma.room.create({
      data: {
        code,
        name: body.name,
        description: body.description,
        cooldownMinutes: body.cooldownMinutes ?? 20,
        ownerId: session.user.id,
        playback: { create: {} },
        analytics: { create: {} },
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

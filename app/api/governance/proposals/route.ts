import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      proposer: { select: { name: true, image: true } },
      _count: { select: { votes: true } },
    },
  });
  const config = await prisma.governanceConfig.findUnique({ where: { id: "config" } });
  return NextResponse.json({ proposals, config });
}

const CreateProposalSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  durationDays: z.number().min(1).max(30).default(7),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = CreateProposalSchema.parse(await req.json());
    const proposal = await prisma.proposal.create({
      data: {
        title: body.title,
        description: body.description,
        proposerId: session.user.id,
        endsAt: new Date(Date.now() + body.durationDays * 86400000),
      },
    });
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

const VoteSchema = z.object({
  proposalId: z.string(),
  support: z.boolean(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = VoteSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { nftMembership: true },
    });
    const weight = user?.nftMembership ? 2 : 1;

    await prisma.proposalVote.upsert({
      where: { proposalId_userId: { proposalId: body.proposalId, userId: session.user.id } },
      create: { proposalId: body.proposalId, userId: session.user.id, support: body.support, weight },
      update: { support: body.support },
    });

    const votes = await prisma.proposalVote.findMany({ where: { proposalId: body.proposalId } });
    const votesFor = votes.filter((v) => v.support).reduce((s, v) => s + v.weight, 0);
    const votesAgainst = votes.filter((v) => !v.support).reduce((s, v) => s + v.weight, 0);

    await prisma.proposal.update({
      where: { id: body.proposalId },
      data: { votesFor, votesAgainst },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

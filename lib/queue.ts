import { prisma } from "@/lib/db";
import { BoostType, QueueItemStatus, VoteType } from "@/app/generated/prisma";
import { BOOST_LEVELS } from "@/lib/constants";
import { customAlphabet } from "nanoid";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export interface QueueItemDTO {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  channel: string | null;
  duration: number;
  voteScore: number;
  boostLevel: number;
  status: QueueItemStatus;
  addedBy: { id: string; name: string | null; image: string | null } | null;
  guestId: string | null;
  createdAt: string;
}

export interface RoomStateDTO {
  room: {
    id: string;
    code: string;
    name: string;
    cooldownMinutes: number;
    queueLocked: boolean;
    maxQueueSize: number;
    voteCooldownSec: number;
    ownerId: string;
    isActive: boolean;
  };
  queue: QueueItemDTO[];
  nowPlaying: QueueItemDTO | null;
  playback: {
    isPlaying: boolean;
    currentTime: number;
    startedAt: string;
  } | null;
}

export async function generateRoomCode(): Promise<string> {
  let code = generateCode();
  let exists = true;
  while (exists) {
    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      exists = false;
    } else {
      code = generateCode();
    }
  }
  return code;
}

export async function getRoomState(roomCode: string): Promise<RoomStateDTO | null> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: {
      playback: true,
      queueItems: {
        where: { status: { in: [QueueItemStatus.QUEUED, QueueItemStatus.PLAYING] } },
        include: { addedBy: { select: { id: true, name: true, image: true } } },
        orderBy: [{ boostLevel: "desc" }, { voteScore: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!room || !room.isActive) return null;

  const mapItem = (item: (typeof room.queueItems)[0]): QueueItemDTO => ({
    id: item.id,
    youtubeId: item.youtubeId,
    title: item.title,
    thumbnail: item.thumbnail,
    channel: item.channel,
    duration: item.duration,
    voteScore: item.voteScore,
    boostLevel: item.boostLevel,
    status: item.status,
    addedBy: item.addedBy,
    guestId: item.guestId,
    createdAt: item.createdAt.toISOString(),
  });

  const nowPlaying = room.queueItems.find((i) => i.status === QueueItemStatus.PLAYING) ?? null;
  const queue = room.queueItems.filter((i) => i.status === QueueItemStatus.QUEUED).map(mapItem);

  return {
    room: {
      id: room.id,
      code: room.code,
      name: room.name,
      cooldownMinutes: room.cooldownMinutes,
      queueLocked: room.queueLocked,
      maxQueueSize: room.maxQueueSize,
      voteCooldownSec: room.voteCooldownSec,
      ownerId: room.ownerId,
      isActive: room.isActive,
    },
    queue,
    nowPlaying: nowPlaying ? mapItem(nowPlaying) : null,
    playback: room.playback
      ? {
          isPlaying: room.playback.isPlaying,
          currentTime: room.playback.currentTime,
          startedAt: room.playback.startedAt.toISOString(),
        }
      : null,
  };
}

export async function isOnCooldown(roomId: string, youtubeId: string): Promise<boolean> {
  const entry = await prisma.cooldownEntry.findUnique({
    where: { roomId_youtubeId: { roomId, youtubeId } },
  });
  if (!entry) return false;
  if (entry.expiresAt < new Date()) {
    await prisma.cooldownEntry.delete({ where: { id: entry.id } });
    return false;
  }
  return true;
}

export async function addToQueue(params: {
  roomId: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  channel?: string;
  duration: number;
  userId?: string;
  guestId?: string;
}) {
  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room) throw new Error("Room not found");
  if (room.queueLocked) throw new Error("Queue is locked");

  const queuedCount = await prisma.queueItem.count({
    where: { roomId: params.roomId, status: QueueItemStatus.QUEUED },
  });
  if (queuedCount >= room.maxQueueSize) throw new Error("Queue is full");

  if (await isOnCooldown(params.roomId, params.youtubeId)) {
    throw new Error("This song is on cooldown");
  }

  return prisma.queueItem.create({
    data: {
      roomId: params.roomId,
      youtubeId: params.youtubeId,
      title: params.title,
      thumbnail: params.thumbnail,
      channel: params.channel,
      duration: params.duration,
      addedById: params.userId,
      guestId: params.guestId,
    },
    include: { addedBy: { select: { id: true, name: true, image: true } } },
  });
}

export async function castVote(params: {
  queueItemId: string;
  type: VoteType;
  userId?: string;
  guestId?: string;
}) {
  const item = await prisma.queueItem.findUnique({
    where: { id: params.queueItemId },
    include: { room: true },
  });
  if (!item || item.status !== QueueItemStatus.QUEUED) throw new Error("Invalid queue item");

  const existing = await prisma.vote.findFirst({
    where: {
      queueItemId: params.queueItemId,
      OR: [
        params.userId ? { userId: params.userId } : {},
        params.guestId ? { guestId: params.guestId } : {},
      ].filter((o) => Object.keys(o).length > 0),
    },
  });

  let scoreDelta = 0;

  if (existing) {
    if (existing.type === params.type) return item;
    await prisma.vote.update({
      where: { id: existing.id },
      data: { type: params.type },
    });
    scoreDelta = params.type === VoteType.UP ? 2 : -2;
  } else {
    await prisma.vote.create({
      data: {
        queueItemId: params.queueItemId,
        userId: params.userId,
        guestId: params.guestId,
        type: params.type,
      },
    });
    scoreDelta = params.type === VoteType.UP ? 1 : -1;
  }

  return prisma.queueItem.update({
    where: { id: params.queueItemId },
    data: { voteScore: { increment: scoreDelta } },
    include: { addedBy: { select: { id: true, name: true, image: true } } },
  });
}

export async function applyBoost(params: {
  roomId: string;
  queueItemId: string;
  userId: string;
  type: BoostType;
  amount: number;
  method: "FIAT" | "CRYPTO";
  paymentId?: string;
  txHash?: string;
}) {
  const targetLevel = BOOST_LEVELS[params.type] ?? 10;

  const current = await prisma.queueItem.findUnique({
    where: { id: params.queueItemId },
    select: { boostLevel: true },
  });
  if (!current) throw new Error("Queue item not found");

  const newLevel = Math.max(current.boostLevel, targetLevel);

  await prisma.boost.create({
    data: {
      roomId: params.roomId,
      queueItemId: params.queueItemId,
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      method: params.method,
      paymentId: params.paymentId,
      txHash: params.txHash,
    },
  });

  const item = await prisma.queueItem.update({
    where: { id: params.queueItemId },
    data: { boostLevel: newLevel },
  });

  await prisma.roomAnalytics.upsert({
    where: { roomId: params.roomId },
    create: { roomId: params.roomId, totalRevenue: params.amount },
    update: { totalRevenue: { increment: params.amount } },
  });

  await applyBoostPlaybackEffect(params.roomId, params.queueItemId, params.type);

  try {
    const { getRedis } = await import("@/lib/redis");
    await getRedis().del("governance:stats:v2");
  } catch {
    // cache optional
  }

  return item;
}

/** Tier-specific playback: only SUPER interrupts; PLAY_NEXT starts if room is idle. */
async function applyBoostPlaybackEffect(roomId: string, queueItemId: string, type: BoostType) {
  switch (type) {
    case BoostType.BOOST:
    case BoostType.PRIORITY_BOOST:
      return;
    case BoostType.PLAY_NEXT:
      await startTopQueuedIfIdle(roomId, queueItemId);
      return;
    case BoostType.SUPER_PRIORITY:
      await forcePlayQueueItem(roomId, queueItemId);
      return;
  }
}

/** Start playback when nothing is playing, only if the given item is first in queue. */
export async function startTopQueuedIfIdle(roomId: string, queueItemId: string) {
  const currentPlaying = await prisma.queueItem.findFirst({
    where: { roomId, status: QueueItemStatus.PLAYING },
  });
  if (currentPlaying) return null;

  const [topQueued] = await prisma.queueItem.findMany({
    where: { roomId, status: QueueItemStatus.QUEUED },
    orderBy: [{ boostLevel: "desc" }, { voteScore: "desc" }, { createdAt: "asc" }],
    take: 1,
  });
  if (!topQueued || topQueued.id !== queueItemId) return null;

  await prisma.queueItem.update({
    where: { id: queueItemId },
    data: { status: QueueItemStatus.PLAYING },
  });

  await prisma.playbackState.upsert({
    where: { roomId },
    create: {
      roomId,
      currentItemId: queueItemId,
      isPlaying: true,
      currentTime: 0,
      startedAt: new Date(),
    },
    update: {
      currentItemId: queueItemId,
      isPlaying: true,
      currentTime: 0,
      startedAt: new Date(),
    },
  });

  return topQueued;
}

/** Auto-start when room is idle and a new song lands in an empty queue. */
export async function autoStartIfIdle(roomId: string, queueItemId: string) {
  const playing = await prisma.queueItem.findFirst({
    where: { roomId, status: QueueItemStatus.PLAYING },
  });
  if (playing) return null;
  return startTopQueuedIfIdle(roomId, queueItemId);
}

/** Stop whatever is playing and immediately play the boosted item. */
export async function forcePlayQueueItem(roomId: string, queueItemId: string) {
  const boosted = await prisma.queueItem.findUnique({ where: { id: queueItemId } });
  if (!boosted || boosted.roomId !== roomId) throw new Error("Queue item not found");
  if (boosted.status === QueueItemStatus.REMOVED || boosted.status === QueueItemStatus.PLAYED) {
    throw new Error("Cannot boost this item");
  }

  if (boosted.status === QueueItemStatus.PLAYING) {
    return boosted;
  }

  const currentPlaying = await prisma.queueItem.findFirst({
    where: { roomId, status: QueueItemStatus.PLAYING },
  });

  if (currentPlaying) {
    await prisma.queueItem.update({
      where: { id: currentPlaying.id },
      data: { status: QueueItemStatus.QUEUED },
    });
  }

  await prisma.queueItem.update({
    where: { id: queueItemId },
    data: { status: QueueItemStatus.PLAYING },
  });

  await prisma.playbackState.upsert({
    where: { roomId },
    create: {
      roomId,
      currentItemId: queueItemId,
      isPlaying: true,
      currentTime: 0,
      startedAt: new Date(),
    },
    update: {
      currentItemId: queueItemId,
      isPlaying: true,
      currentTime: 0,
      startedAt: new Date(),
    },
  });

  return boosted;
}

export async function advancePlayback(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      queueItems: {
        where: { status: { in: [QueueItemStatus.PLAYING, QueueItemStatus.QUEUED] } },
        orderBy: [{ boostLevel: "desc" }, { voteScore: "desc" }, { createdAt: "asc" }],
      },
      playback: true,
    },
  });
  if (!room) return null;

  const current = room.queueItems.find((i) => i.status === QueueItemStatus.PLAYING);
  if (current) {
    await prisma.queueItem.update({
      where: { id: current.id },
      data: { status: QueueItemStatus.PLAYED, playedAt: new Date() },
    });
    await prisma.cooldownEntry.upsert({
      where: { roomId_youtubeId: { roomId, youtubeId: current.youtubeId } },
      create: {
        roomId,
        youtubeId: current.youtubeId,
        expiresAt: new Date(Date.now() + room.cooldownMinutes * 60 * 1000),
      },
      update: {
        expiresAt: new Date(Date.now() + room.cooldownMinutes * 60 * 1000),
      },
    });
  }

  const next = room.queueItems.find((i) => i.status === QueueItemStatus.QUEUED);
  if (!next) {
    await prisma.playbackState.upsert({
      where: { roomId },
      create: { roomId, currentItemId: null, isPlaying: false, currentTime: 0 },
      update: { currentItemId: null, isPlaying: false, currentTime: 0 },
    });
    return null;
  }

  await prisma.queueItem.update({
    where: { id: next.id },
    data: { status: QueueItemStatus.PLAYING },
  });

  await prisma.playbackState.upsert({
    where: { roomId },
    create: { roomId, currentItemId: next.id, isPlaying: true, currentTime: 0, startedAt: new Date() },
    update: { currentItemId: next.id, isPlaying: true, currentTime: 0, startedAt: new Date() },
  });

  return next;
}

export async function skipCurrent(roomId: string) {
  return advancePlayback(roomId);
}

export async function removeQueueItem(itemId: string) {
  return prisma.queueItem.update({
    where: { id: itemId },
    data: { status: QueueItemStatus.REMOVED },
  });
}

export async function endRoom(roomId: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { isActive: false, queueLocked: true },
  });

  const playing = await prisma.queueItem.findFirst({
    where: { roomId, status: QueueItemStatus.PLAYING },
  });
  if (playing) {
    await prisma.queueItem.update({
      where: { id: playing.id },
      data: { status: QueueItemStatus.QUEUED },
    });
  }

  await prisma.playbackState.upsert({
    where: { roomId },
    create: { roomId, currentItemId: null, isPlaying: false, currentTime: 0 },
    update: { currentItemId: null, isPlaying: false, currentTime: 0 },
  });
}

export async function awardBadge(userId: string, type: "TOP_VOTER" | "EARLY_SUPPORTER" | "POWER_LISTENER" | "TOP_CONTRIBUTOR") {
  try {
    await prisma.userBadge.create({ data: { userId, type } });
  } catch {
    // already has badge
  }
}

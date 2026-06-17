import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "@/lib/db";
import {
  addToQueue,
  advancePlayback,
  autoStartIfIdle,
  castVote,
  endRoom,
  getRoomState,
  removeQueueItem,
  skipCurrent,
} from "@/lib/queue";
import { VoteType } from "@/app/generated/prisma";
import { cacheRoomState } from "@/lib/redis";

let io: Server | null = null;

const globalForIo = globalThis as unknown as { crowdplayIo?: Server };

export function getIO(): Server | null {
  return globalForIo.crowdplayIo ?? io;
}

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.NEXTAUTH_URL ?? "*", methods: ["GET", "POST"] },
    path: "/api/socket",
  });
  globalForIo.crowdplayIo = io;

  const roomUsers = new Map<string, Set<string>>();

  io.on("connection", (socket: Socket) => {
    socket.on("join-room", async ({ roomCode, userId, guestId }: { roomCode: string; userId?: string; guestId?: string }) => {
      const room = await prisma.room.findUnique({ where: { code: roomCode } });
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }
      if (!room.isActive) {
        socket.emit("room-ended", { message: "This room has ended." });
        return;
      }

      socket.join(roomCode);
      if (!roomUsers.has(roomCode)) roomUsers.set(roomCode, new Set());
      roomUsers.get(roomCode)!.add(socket.id);

      const state = await getRoomState(roomCode);
      if (state) {
        socket.emit("room-state", state);
        io!.to(roomCode).emit("active-users", roomUsers.get(roomCode)!.size);
      }

      const messages = await prisma.chatMessage.findMany({
        where: { roomId: room.id, isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true, image: true } } },
      });

      socket.emit("chat-history", messages.reverse().map((m) => ({
        id: m.id,
        content: m.content,
        userId: m.userId,
        guestId: m.guestId,
        guestName: m.guestName,
        user: m.user,
        createdAt: m.createdAt.toISOString(),
      })));
    });

    socket.on("leave-room", ({ roomCode }: { roomCode: string }) => {
      socket.leave(roomCode);
      roomUsers.get(roomCode)?.delete(socket.id);
      io!.to(roomCode).emit("active-users", roomUsers.get(roomCode)?.size ?? 0);
    });

    socket.on("add-to-queue", async (data, callback) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
        if (!room) throw new Error("Room not found");
        if (!room.isActive) throw new Error("Room has ended");

        const item = await addToQueue({
          roomId: room.id,
          youtubeId: data.youtubeId,
          title: data.title,
          thumbnail: data.thumbnail,
          channel: data.channel,
          duration: data.duration,
          userId: data.userId,
          guestId: data.guestId,
        });

        await autoStartIfIdle(room.id, item.id);

        const state = await getRoomState(data.roomCode);
        if (state) {
          await cacheRoomState(data.roomCode, state);
          io!.to(data.roomCode).emit("room-state", state);
        }
        callback?.({ success: true, item });
      } catch (e) {
        callback?.({ success: false, error: (e as Error).message });
      }
    });

    socket.on("vote", async (data, callback) => {
      try {
        await castVote({
          queueItemId: data.queueItemId,
          type: data.type === "UP" ? VoteType.UP : VoteType.DOWN,
          userId: data.userId,
          guestId: data.guestId,
        });

        const state = await getRoomState(data.roomCode);
        if (state) {
          await cacheRoomState(data.roomCode, state);
          io!.to(data.roomCode).emit("room-state", state);
        }
        callback?.({ success: true });
      } catch (e) {
        callback?.({ success: false, error: (e as Error).message });
      }
    });

    socket.on("chat-message", async (data) => {
      const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
      if (!room) return;

      const message = await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          userId: data.userId,
          guestId: data.guestId,
          guestName: data.guestName,
          content: data.content.slice(0, 500),
        },
        include: { user: { select: { name: true, image: true } } },
      });

      io!.to(data.roomCode).emit("chat-message", {
        id: message.id,
        content: message.content,
        userId: message.userId,
        guestId: message.guestId,
        guestName: message.guestName,
        user: message.user,
        createdAt: message.createdAt.toISOString(),
      });
    });

    socket.on("playback-sync", async (data) => {
      const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
      if (!room) return;

      await prisma.playbackState.upsert({
        where: { roomId: room.id },
        create: {
          roomId: room.id,
          isPlaying: data.isPlaying,
          currentTime: data.currentTime,
        },
        update: {
          isPlaying: data.isPlaying,
          currentTime: data.currentTime,
        },
      });

      socket.to(data.roomCode).emit("playback-sync", {
        isPlaying: data.isPlaying,
        currentTime: data.currentTime,
      });
    });

    socket.on("track-ended", async (data) => {
      const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
      if (!room) return;

      await advancePlayback(room.id);
      const state = await getRoomState(data.roomCode);
      if (state) io!.to(data.roomCode).emit("room-state", state);
    });

    socket.on("admin-skip", async (data, callback) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
        if (!room) throw new Error("Room not found");
        if (!room.isActive) throw new Error("Room has ended");
        if (room.ownerId !== data.userId) throw new Error("Not authorized");

        await skipCurrent(room.id);
        const state = await getRoomState(data.roomCode);
        if (state) io!.to(data.roomCode).emit("room-state", state);
        callback?.({ success: true });
      } catch (e) {
        callback?.({ success: false, error: (e as Error).message });
      }
    });

    socket.on("admin-remove", async (data, callback) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
        if (!room) throw new Error("Room not found");
        if (!room.isActive) throw new Error("Room has ended");
        if (room.ownerId !== data.userId) throw new Error("Not authorized");

        await removeQueueItem(data.queueItemId);
        const state = await getRoomState(data.roomCode);
        if (state) io!.to(data.roomCode).emit("room-state", state);
        callback?.({ success: true });
      } catch (e) {
        callback?.({ success: false, error: (e as Error).message });
      }
    });

    socket.on("admin-end-room", async (data, callback) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: data.roomCode } });
        if (!room) throw new Error("Room not found");
        if (!room.isActive) throw new Error("Room has ended");
        if (room.ownerId !== data.userId) throw new Error("Not authorized");
        if (!room.isActive) throw new Error("Room already ended");

        await endRoom(room.id);
        io!.to(data.roomCode).emit("room-ended", { message: "The host has ended this room." });
        callback?.({ success: true });
      } catch (e) {
        callback?.({ success: false, error: (e as Error).message });
      }
    });

    socket.on("disconnecting", () => {
      for (const roomCode of socket.rooms) {
        if (roomCode !== socket.id && roomUsers.has(roomCode)) {
          roomUsers.get(roomCode)!.delete(socket.id);
          io!.to(roomCode).emit("active-users", roomUsers.get(roomCode)!.size);
        }
      }
    });
  });

  return io;
}

export async function broadcastRoomState(roomCode: string) {
  const socketIo = getIO();
  if (!socketIo) {
    console.warn("[socket] broadcast skipped — io not initialized");
    return;
  }
  const state = await getRoomState(roomCode);
  if (state) {
    await cacheRoomState(roomCode, state);
    socketIo.to(roomCode).emit("room-state", state);
  }
}

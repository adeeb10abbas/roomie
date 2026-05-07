import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { and, eq, or } from "drizzle-orm";
import { db, matchesTable } from "@workspace/db";
import { verifyToken } from "../middlewares/auth";
import { logger } from "./logger";

type AuthSocket = Socket & { userId: string };

let io: SocketIOServer | null = null;

// Tracks which matchId each authenticated userId is actively viewing.
// Key: userId, Value: matchId they currently have open (or undefined if none).
const userActiveChats = new Map<string, string>();

/**
 * Returns true if the given user currently has the given chat open.
 * Used by message routes to skip push notifications for active readers.
 */
export function isUserViewingChat(userId: string, matchId: string): boolean {
  return userActiveChats.get(userId) === matchId;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Authentication token required"));
      return;
    }
    try {
      const payload = verifyToken(token);
      (socket as AuthSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId } = socket as AuthSocket;
    logger.info({ userId, socketId: socket.id }, "Socket connected");

    socket.on("join_rooms", async (matchIds: unknown) => {
      if (!Array.isArray(matchIds)) return;

      const validIds = matchIds.filter((id): id is string => typeof id === "string");
      if (validIds.length === 0) return;

      const userMatches = await db
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            or(
              eq(matchesTable.user1Id, userId),
              eq(matchesTable.user2Id, userId),
            ),
          ),
        );

      const allowedIds = new Set(userMatches.map((m) => m.id));
      const authorizedIds = validIds.filter((id) => allowedIds.has(id));
      const deniedIds = validIds.filter((id) => !allowedIds.has(id));

      for (const id of authorizedIds) {
        socket.join(id);
      }

      if (deniedIds.length > 0) {
        logger.warn({ userId, deniedIds }, "Socket join_rooms denied for unauthorized match IDs");
      }

      logger.info({ userId, joined: authorizedIds.length }, "Socket joined match rooms");
    });

    // Client emits this when opening or closing a specific chat screen.
    // matchId = string to set active chat, null/undefined to clear it.
    socket.on("set_active_chat", (matchId: unknown) => {
      if (typeof matchId === "string" && matchId.length > 0) {
        userActiveChats.set(userId, matchId);
        logger.debug({ userId, matchId }, "User set active chat");
      } else {
        userActiveChats.delete(userId);
        logger.debug({ userId }, "User cleared active chat");
      }
    });

    socket.on("disconnect", (reason) => {
      userActiveChats.delete(userId);
      logger.info({ userId, socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io server not initialized");
  }
  return io;
}

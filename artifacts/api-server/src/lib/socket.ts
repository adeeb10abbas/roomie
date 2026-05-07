import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { and, eq, or } from "drizzle-orm";
import { db, matchesTable } from "@workspace/db";
import { verifyToken } from "../middlewares/auth";
import { logger } from "./logger";

type AuthSocket = Socket & { userId: string };

let io: SocketIOServer | null = null;

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

    socket.on("disconnect", (reason) => {
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

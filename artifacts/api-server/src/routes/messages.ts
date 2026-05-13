import { Router, type IRouter, type Request } from "express";
import { db, messagesTable, matchesTable, usersTable } from "@workspace/db";
import { SendMessageRequestSchema, MessageSchema, MessagesResponseSchema } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { and, eq, or, asc, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getIO, isUserViewingChat } from "../lib/socket";
import { sendPushNotification } from "../utils/pushNotifications";

const router: IRouter = Router();

async function getMatch(matchId: string, userId: string) {
  return db
    .select()
    .from(matchesTable)
    .where(
      and(
        eq(matchesTable.id, matchId),
        or(
          eq(matchesTable.user1Id, userId),
          eq(matchesTable.user2Id, userId),
        ),
      ),
    )
    .limit(1);
}

router.get(
  "/messages/:matchId",
  requireAuth,
  async (req: Request<{ matchId: string }>, res) => {
    const matchId = String(req.params.matchId);
    const userId = req.userId;

    const match = await getMatch(matchId, userId);
    if (match.length === 0) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.matchId, matchId))
      .orderBy(asc(messagesTable.timestamp));

    sendValidated(res, MessagesResponseSchema, {
      messages: messages.map((m) => ({
        id: m.id,
        matchId: m.matchId,
        senderId: m.senderId,
        text: m.text,
        timestamp: m.timestamp.toISOString(),
        isRead: m.isRead,
      })),
    });
  },
);

router.post(
  "/messages/:matchId",
  requireAuth,
  async (req: Request<{ matchId: string }>, res) => {
    const matchId = String(req.params.matchId);
    const userId = req.userId;

    const match = await getMatch(matchId, userId);
    if (match.length === 0) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const parsed = SendMessageRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid message data", details: parsed.error.issues });
      return;
    }

    const msgId = randomUUID();
    const now = new Date();

    await db.insert(messagesTable).values({
      id: msgId,
      matchId: matchId,
      senderId: userId,
      text: parsed.data.text,
      isRead: false,
      timestamp: now,
    });

    const messagePayload = {
      id: msgId,
      matchId,
      senderId: userId,
      text: parsed.data.text,
      timestamp: now.toISOString(),
      isRead: false,
    };

    try {
      const io = getIO();
      io.to(matchId).emit("new_message", messagePayload);
    } catch {
      req.log.warn({ matchId }, "Socket.io not ready, skipping emit");
    }

    // Send push notification to the other match participant only if they are not
    // actively viewing this chat (tracked via the set_active_chat socket event).
    const recipientId = match[0].user1Id === userId ? match[0].user2Id : match[0].user1Id;

    if (!isUserViewingChat(recipientId, matchId)) {
      const senderRow = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      const senderName = senderRow[0]?.name ?? "Someone";

      void sendPushNotification(
        recipientId,
        `New message from ${senderName}`,
        parsed.data.text.length > 80 ? parsed.data.text.slice(0, 77) + "..." : parsed.data.text,
        { screen: "chat", matchId },
      );
    }

    sendValidated(res, MessageSchema, messagePayload, 201);
  },
);

router.post(
  "/messages/:matchId/read",
  requireAuth,
  async (req: Request<{ matchId: string }>, res) => {
    const matchId = String(req.params.matchId);
    const userId = req.userId;

    const match = await getMatch(matchId, userId);
    if (match.length === 0) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(
        and(
          eq(messagesTable.matchId, matchId),
          ne(messagesTable.senderId, userId),
          eq(messagesTable.isRead, false),
        ),
      );

    res.json({ ok: true });
  },
);

export default router;

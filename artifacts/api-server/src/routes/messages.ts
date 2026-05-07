import { Router, type IRouter, type Request } from "express";
import { db, messagesTable, matchesTable } from "@workspace/db";
import { SendMessageRequestSchema, MessageSchema, MessagesResponseSchema } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { and, eq, or, asc, ne } from "drizzle-orm";
import { randomUUID } from "crypto";

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

    sendValidated(
      res,
      MessageSchema,
      {
        id: msgId,
        matchId,
        senderId: userId,
        text: parsed.data.text,
        timestamp: now.toISOString(),
        isRead: false,
      },
      201,
    );
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

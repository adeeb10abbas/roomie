import { Router, type IRouter, type Request } from "express";
import {
  db, userBlocksTable, userReportsTable, matchesTable,
  messagesTable, swipeActionsTable, housingJoinRequestsTable, usersTable,
} from "@workspace/db";
import {
  CreateBlockSchema, CreateReportSchema,
  BlockedUsersResponseSchema, BlockedUserSchema,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { and, eq, or, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/blocks", requireAuth, async (req, res) => {
  const parsed = CreateBlockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const { blockedId, reason } = parsed.data;
  const blockerId = req.userId;

  if (blockerId === blockedId) {
    res.status(400).json({ error: "cannot_block_self" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(userBlocksTable)
      .values({ blockerId, blockedId, reason })
      .onConflictDoNothing();

    // Find and delete any matches between them
    const matchRows = await tx
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(
        or(
          and(eq(matchesTable.user1Id, blockerId), eq(matchesTable.user2Id, blockedId)),
          and(eq(matchesTable.user1Id, blockedId), eq(matchesTable.user2Id, blockerId)),
        ),
      );

    if (matchRows.length > 0) {
      const matchIds = matchRows.map((m) => m.id);
      await tx.delete(messagesTable).where(inArray(messagesTable.matchId, matchIds));
      await tx.delete(matchesTable).where(inArray(matchesTable.id, matchIds));
    }

    // Delete open housing join requests between them (either direction)
    await tx
      .delete(housingJoinRequestsTable)
      .where(
        and(
          eq(housingJoinRequestsTable.requesterId, blockerId),
        ),
      );

    // Insert reciprocal skip swipes so they never reappear
    await tx
      .insert(swipeActionsTable)
      .values([
        { id: randomUUID(), swiperId: blockerId, swipedId: blockedId, action: "skip" },
        { id: randomUUID(), swiperId: blockedId, swipedId: blockerId, action: "skip" },
      ])
      .onConflictDoUpdate({
        target: [swipeActionsTable.swiperId, swipeActionsTable.swipedId],
        set: { action: "skip" },
      });
  });

  res.json({ ok: true });
});

router.delete("/blocks/:blockedId", requireAuth, async (req: Request<{ blockedId: string }>, res) => {
  await db
    .delete(userBlocksTable)
    .where(
      and(
        eq(userBlocksTable.blockerId, req.userId),
        eq(userBlocksTable.blockedId, String(req.params.blockedId)),
      ),
    );
  res.json({ ok: true });
});

router.get("/blocks", requireAuth, async (req, res) => {
  const rows = await db
    .select({ blockedId: userBlocksTable.blockedId, createdAt: userBlocksTable.createdAt })
    .from(userBlocksTable)
    .where(eq(userBlocksTable.blockerId, req.userId));

  if (rows.length === 0) {
    sendValidated(res, BlockedUsersResponseSchema, { blocked: [] });
    return;
  }

  const ids = rows.map((r) => r.blockedId);
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(inArray(usersTable.id, ids));

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const blocked = rows.map((r) => ({
    id: r.blockedId,
    name: userMap[r.blockedId] ?? "Unknown",
    createdAt: r.createdAt.toISOString(),
  }));

  sendValidated(res, BlockedUsersResponseSchema, { blocked });
});

router.post("/reports", requireAuth, async (req, res) => {
  const parsed = CreateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const { reportedId, matchId, category, description } = parsed.data;

  await db.insert(userReportsTable).values({
    id: randomUUID(),
    reporterId: req.userId,
    reportedId,
    matchId: matchId ?? null,
    category,
    description: description ?? "",
    status: "open",
  });

  req.log.info({ reporterId: req.userId, reportedId, category }, "user report created");
  res.status(201).json({ ok: true });
});

router.delete("/matches/:matchId", requireAuth, async (req: Request<{ matchId: string }>, res) => {
  const matchId = String(req.params.matchId);
  const userId = req.userId;

  const match = await db
    .select()
    .from(matchesTable)
    .where(
      and(
        eq(matchesTable.id, matchId),
        or(eq(matchesTable.user1Id, userId), eq(matchesTable.user2Id, userId)),
      ),
    )
    .limit(1);

  if (match.length === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  await db.delete(messagesTable).where(eq(messagesTable.matchId, matchId));
  await db.delete(matchesTable).where(eq(matchesTable.id, matchId));

  res.status(204).send();
});

export default router;

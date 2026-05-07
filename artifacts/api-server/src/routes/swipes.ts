import { Router, type IRouter } from "express";
import { db, swipeActionsTable, matchesTable, usersTable } from "@workspace/db";
import { SwipeRequestSchema, SwipeResponseSchema } from "@workspace/api-zod";
import { requireUserId } from "../middlewares/userId";
import { sendValidated } from "../utils/validateResponse";
import { and, eq, or, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/swipes", requireUserId, async (req, res) => {
  const parsed = SwipeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid swipe data", details: parsed.error.issues });
    return;
  }

  const { profileId, action } = parsed.data;
  const swiperId = req.userId;

  if (swiperId === profileId) {
    res.status(400).json({ error: "Cannot swipe on yourself" });
    return;
  }

  await db
    .insert(swipeActionsTable)
    .values({
      id: randomUUID(),
      swiperId,
      swipedId: profileId,
      action,
    })
    .onConflictDoUpdate({
      target: [swipeActionsTable.swiperId, swipeActionsTable.swipedId],
      set: { action },
    });

  if (action === "skip") {
    sendValidated(res, SwipeResponseSchema, { matched: false });
    return;
  }

  // Use canonical pair ordering (lower id = user1Id) for all match queries/inserts
  const [canonUser1, canonUser2] = [swiperId, profileId].sort();

  const existingMatch = await db
    .select()
    .from(matchesTable)
    .where(
      or(
        and(eq(matchesTable.user1Id, swiperId), eq(matchesTable.user2Id, profileId)),
        and(eq(matchesTable.user1Id, profileId), eq(matchesTable.user2Id, swiperId)),
      ),
    )
    .limit(1);

  if (existingMatch.length > 0) {
    sendValidated(res, SwipeResponseSchema, { matched: true, matchId: existingMatch[0].id });
    return;
  }

  const reciprocalSwipe = await db
    .select({ action: swipeActionsTable.action })
    .from(swipeActionsTable)
    .where(
      and(
        eq(swipeActionsTable.swiperId, profileId),
        eq(swipeActionsTable.swipedId, swiperId),
        inArray(swipeActionsTable.action, ["like", "shortlist"]),
      ),
    )
    .limit(1);

  if (reciprocalSwipe.length > 0) {
    const matchId = randomUUID();
    await db.insert(matchesTable).values({
      id: matchId,
      user1Id: canonUser1,
      user2Id: canonUser2,
    });
    sendValidated(res, SwipeResponseSchema, { matched: true, matchId });
    return;
  }

  sendValidated(res, SwipeResponseSchema, { matched: false });
});

router.delete("/swipes/:swipedId", requireUserId, async (req, res) => {
  const swipedId = String(req.params.swipedId);
  await db
    .delete(swipeActionsTable)
    .where(
      and(
        eq(swipeActionsTable.swiperId, req.userId),
        eq(swipeActionsTable.swipedId, swipedId),
      ),
    );
  res.json({ ok: true });
});

export default router;

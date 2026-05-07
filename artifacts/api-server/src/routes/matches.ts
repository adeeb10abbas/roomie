import { Router, type IRouter } from "express";
import { db, matchesTable, usersTable, messagesTable } from "@workspace/db";
import { MatchesResponseSchema } from "@workspace/api-zod";
import { requireUserId } from "../middlewares/userId";
import { sendValidated } from "../utils/validateResponse";
import { and, or, eq, desc, count, sql, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/matches", requireUserId, async (req, res) => {
  const userId = req.userId;

  const matchRows = await db
    .select()
    .from(matchesTable)
    .where(
      or(
        eq(matchesTable.user1Id, userId),
        eq(matchesTable.user2Id, userId),
      ),
    )
    .orderBy(desc(matchesTable.matchedAt));

  if (matchRows.length === 0) {
    sendValidated(res, MatchesResponseSchema, { matches: [] });
    return;
  }

  const matchIds = matchRows.map((m) => m.id);
  const otherUserIds = matchRows.map((m) =>
    m.user1Id === userId ? m.user2Id : m.user1Id,
  );

  const [otherUsers, lastMessages, unreadCounts] = await Promise.all([
    db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.id, otherUserIds)),

    db
      .select()
      .from(messagesTable)
      .where(inArray(messagesTable.matchId, matchIds))
      .orderBy(desc(messagesTable.timestamp)),

    db
      .select({
        matchId: messagesTable.matchId,
        count: count(),
      })
      .from(messagesTable)
      .where(
        and(
          inArray(messagesTable.matchId, matchIds),
          eq(messagesTable.isRead, false),
          sql`${messagesTable.senderId} != ${userId}`,
        ),
      )
      .groupBy(messagesTable.matchId),
  ]);

  const userById = Object.fromEntries(otherUsers.map((u) => [u.id, u]));
  const unreadByMatchId = Object.fromEntries(
    unreadCounts.map((r) => [r.matchId, r.count]),
  );

  const lastMsgByMatchId: Record<string, typeof messagesTable.$inferSelect> = {};
  for (const msg of lastMessages) {
    if (!lastMsgByMatchId[msg.matchId]) {
      lastMsgByMatchId[msg.matchId] = msg;
    }
  }

  const matches = matchRows
    .map((match) => {
      const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = userById[otherId];
      if (!otherUser) return null;

      const lastMsg = lastMsgByMatchId[match.id];
      return {
        id: match.id,
        profile: toProfileResponse(otherUser),
        matchedAt: match.matchedAt.toISOString(),
        lastMessage: lastMsg?.text ?? "",
        lastMessageTime: lastMsg?.timestamp.toISOString() ?? "",
        unread: unreadByMatchId[match.id] ?? 0,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  sendValidated(res, MatchesResponseSchema, { matches });
});

function toProfileResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    university: user.university,
    isVerified: user.isVerified,
    bio: user.bio,
    photoIndex: user.photoIndex,
    occupation: user.occupation,
    location: user.location,
    neighborhoods: user.neighborhoods,
    budgetMin: user.budgetMin,
    budgetMax: user.budgetMax,
    moveInDate: user.moveInDate,
    lifestyle: user.lifestyle,
    sameGenderOnly: user.sameGenderOnly,
    language: user.language,
    religion: user.religion,
    prompts: user.prompts,
    tags: user.tags,
    badges: user.badges,
    matchScore: user.matchScore,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;

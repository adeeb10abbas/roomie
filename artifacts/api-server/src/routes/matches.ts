import { Router, type IRouter } from "express";
import { db, matchesTable, usersTable, messagesTable } from "@workspace/db";
import { MatchesResponseSchema } from "@workspace/api-zod";
import { requireAuth, requireVerified } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { and, or, eq, desc, count, sql, inArray } from "drizzle-orm";
import { computeMatchScore, computeMatchBreakdown } from "../utils/matchScore";
import { getBlockedUserIds } from "../utils/blockFilter";

const router: IRouter = Router();

router.get("/matches", requireAuth, requireVerified, async (req, res) => {
  const userId = req.userId;

  const [currentUserRows, matchRows, blockedIds] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
    db
      .select()
      .from(matchesTable)
      .where(
        or(
          eq(matchesTable.user1Id, userId),
          eq(matchesTable.user2Id, userId),
        ),
      )
      .orderBy(desc(matchesTable.matchedAt)),
    getBlockedUserIds(userId),
  ]);

  const currentUser = currentUserRows[0] ?? null;

  const filteredMatchRows = matchRows.filter((m) => {
    const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
    return !blockedIds.has(otherId);
  });

  if (filteredMatchRows.length === 0) {
    sendValidated(res, MatchesResponseSchema, { matches: [] });
    return;
  }

  const matchIds = filteredMatchRows.map((m) => m.id);
  const otherUserIds = filteredMatchRows.map((m) =>
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

  const matches = filteredMatchRows
    .map((match) => {
      const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = userById[otherId];
      if (!otherUser) return null;

      const lastMsg = lastMsgByMatchId[match.id];

      const displayName = otherUser.deactivatedAt
        ? `${otherUser.name} (deactivated)`
        : otherUser.name;

      return {
        id: match.id,
        profile: toProfileResponse({ ...otherUser, name: displayName }, currentUser),
        matchedAt: match.matchedAt.toISOString(),
        lastMessage: lastMsg?.text ?? "",
        lastMessageTime: lastMsg?.timestamp.toISOString() ?? "",
        unread: unreadByMatchId[match.id] ?? 0,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  sendValidated(res, MatchesResponseSchema, { matches });
});

function toProfileResponse(
  user: typeof usersTable.$inferSelect,
  currentUser: typeof usersTable.$inferSelect | null,
) {
  const matchScore = currentUser ? computeMatchScore(currentUser, user) : user.matchScore;
  const matchBreakdown = currentUser ? computeMatchBreakdown(currentUser, user) : undefined;
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    university: user.university,
    isVerified: user.isVerified,
    eduDomain: user.eduDomain ?? null,
    bio: user.bio,
    photoIndex: user.photoIndex,
    photoUrl: user.photoUrl,
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
    matchScore,
    matchBreakdown,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;

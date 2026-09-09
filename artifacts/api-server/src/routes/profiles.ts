import { Router, type IRouter, type Request } from "express";
import { db, usersTable, swipeActionsTable } from "@workspace/db";
import { ProfilesResponseSchema, RoommateProfileSchema } from "@workspace/api-zod";
import { requireAuth, requireVerified } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { eq, ne, notInArray, inArray, isNull, sql } from "drizzle-orm";
import { computeMatchScore, computeMatchBreakdown } from "../utils/matchScore";
import { getBlockedUserIds } from "../utils/blockFilter";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

const router: IRouter = Router();

router.get("/profiles/preview", async (_req, res) => {
  // Fetch a batch of candidates and apply the same visibility rules as /profiles:
  // exclude deactivated accounts and users who opted out of discovery.
  const candidates = await db
    .select()
    .from(usersTable)
    .where(sql`${usersTable.age} > 0 AND LENGTH(${usersTable.name}) > 0 AND ${usersTable.deactivatedAt} IS NULL`)
    .orderBy(sql`RANDOM()`)
    .limit(20);

  const eligible = candidates.filter((u) => {
    const privacy = u.privacy as Record<string, boolean> | null;
    return !privacy?.hideFromSearch;
  });

  if (eligible.length === 0) {
    sendValidated(res, ProfilesResponseSchema, { profiles: [], total: 0, page: 1, limit: 1, totalPages: 0 });
    return;
  }

  sendValidated(res, ProfilesResponseSchema, {
    profiles: [toProfileResponse(eligible[0], null)],
    total: 1,
    page: 1,
    limit: 1,
    totalPages: 1,
  });
});

router.get("/profiles", requireAuth, requireVerified, async (req, res) => {
  const {
    budgetMin,
    budgetMax,
    noiseLevel,
    smokingOk,
    sameGenderOnly,
    shortlistedOnly,
    moveInDateFrom,
    moveInDateTo,
    neighborhoods,
    cleanliness,
    drinking,
    guests,
    pets,
    page: pageStr,
    limit: limitStr,
  } = req.query as Record<string, string>;

  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(limitStr ?? String(PAGE_SIZE_DEFAULT)) || PAGE_SIZE_DEFAULT));
  const offset = (page - 1) * limit;

  const [currentUserRows, swipedRows, blockedIds] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1),
    db
      .select({ swipedId: swipeActionsTable.swipedId, action: swipeActionsTable.action })
      .from(swipeActionsTable)
      .where(eq(swipeActionsTable.swiperId, req.userId)),
    getBlockedUserIds(req.userId),
  ]);

  const currentUser = currentUserRows[0] ?? null;

  const swipedIds = swipedRows.map((r) => r.swipedId);
  const shortlistedIds = swipedRows
    .filter((r) => r.action === "shortlist")
    .map((r) => r.swipedId);

  if (shortlistedOnly === "true") {
    if (shortlistedIds.length === 0) {
      sendValidated(res, ProfilesResponseSchema, {
        profiles: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
      return;
    }
    const profiles = await db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.id, shortlistedIds))
      .limit(limit)
      .offset(offset);
    sendValidated(res, ProfilesResponseSchema, {
      profiles: profiles.map((u) => toProfileResponse(u, currentUser)),
      total: shortlistedIds.length,
      page,
      limit,
      totalPages: Math.ceil(shortlistedIds.length / limit),
    });
    return;
  }

  const excludeIds = [...new Set([...swipedIds, req.userId, ...Array.from(blockedIds)])];

  let rows;
  if (excludeIds.length > 0) {
    rows = await db
      .select()
      .from(usersTable)
      .where(notInArray(usersTable.id, excludeIds));
  } else {
    rows = await db
      .select()
      .from(usersTable)
      .where(ne(usersTable.id, req.userId));
  }

  // Exclude deactivated users and hidden-from-search users
  rows = rows.filter((u) => {
    if (u.deactivatedAt) return false;
    const privacy = u.privacy as Record<string, boolean> | null;
    if (privacy?.hideFromSearch) return false;
    return true;
  });

  let profiles = rows.map((u) => toProfileResponse(u, currentUser));

  // Server-side filter pipeline
  if (budgetMin) {
    const min = parseInt(budgetMin);
    profiles = profiles.filter((p) => p.budgetMax >= min);
  }
  if (budgetMax) {
    const max = parseInt(budgetMax);
    profiles = profiles.filter((p) => p.budgetMin <= max);
  }
  if (noiseLevel) {
    profiles = profiles.filter(
      (p) => (p.lifestyle as { noise?: string }).noise === noiseLevel,
    );
  }
  if (smokingOk === "false") {
    profiles = profiles.filter(
      (p) => !(p.lifestyle as { smoking?: boolean }).smoking,
    );
  }
  if (sameGenderOnly === "true") {
    if (currentUser) {
      profiles = profiles.filter((p) => p.gender === currentUser.gender);
    }
  }
  if (moveInDateFrom) {
    profiles = profiles.filter((p) => !p.moveInDate || p.moveInDate >= moveInDateFrom);
  }
  if (moveInDateTo) {
    profiles = profiles.filter((p) => !p.moveInDate || p.moveInDate <= moveInDateTo);
  }
  if (neighborhoods) {
    const nList = neighborhoods.split(",").map((n) => n.trim().toLowerCase()).filter(Boolean);
    if (nList.length > 0) {
      profiles = profiles.filter((p) =>
        p.neighborhoods.some((n) => nList.includes(n.toLowerCase())),
      );
    }
  }
  if (cleanliness) {
    const cLevel = parseInt(cleanliness);
    profiles = profiles.filter(
      (p) => (p.lifestyle as { cleanliness?: number }).cleanliness === cLevel,
    );
  }
  if (drinking) {
    profiles = profiles.filter(
      (p) => (p.lifestyle as { drinking?: string }).drinking === drinking,
    );
  }
  if (guests) {
    profiles = profiles.filter(
      (p) => (p.lifestyle as { guests?: string }).guests === guests,
    );
  }
  if (pets !== undefined && pets !== "") {
    const petsVal = pets === "true";
    profiles = profiles.filter(
      (p) => (p.lifestyle as { pets?: boolean }).pets === petsVal,
    );
  }

  profiles.sort((a, b) => b.matchScore - a.matchScore);

  const total = profiles.length;
  const paginated = profiles.slice(offset, offset + limit);

  sendValidated(res, ProfilesResponseSchema, {
    profiles: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/profiles/:id", requireAuth, requireVerified, async (req: Request<{ id: string }>, res) => {
  const profileId = String(req.params.id);
  const [user, currentUserRows, blockedIds] = await Promise.all([
    db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, profileId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1),
    getBlockedUserIds(req.userId),
  ]);

  if (!user || blockedIds.has(profileId)) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const currentUser = currentUserRows[0] ?? null;
  sendValidated(res, RoommateProfileSchema, toProfileResponse(user, currentUser));
});

function toProfileResponse(
  user: typeof usersTable.$inferSelect,
  currentUser: typeof usersTable.$inferSelect | null,
) {
  const matchScore = currentUser ? computeMatchScore(currentUser, user) : user.matchScore;
  const matchBreakdown = currentUser ? computeMatchBreakdown(currentUser, user) : undefined;

  const privacy = user.privacy as Record<string, boolean> | null;

  return {
    id: user.id,
    name: user.name,
    age: privacy?.showAge === false ? 0 : user.age,
    gender: user.gender,
    university: privacy?.showUniversity === false ? "" : user.university,
    isVerified: user.isVerified,
    eduDomain: user.eduDomain ?? null,
    bio: user.bio,
    photoIndex: user.photoIndex,
    photoUrl: user.photoUrl,
    profileCompletion: user.profileCompletion,
    occupation: privacy?.showOccupation === false ? "" : user.occupation,
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

export { toProfileResponse };
export default router;

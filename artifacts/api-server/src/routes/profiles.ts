import { Router, type IRouter, type Request } from "express";
import { db, usersTable, swipeActionsTable } from "@workspace/db";
import { ProfilesResponseSchema, RoommateProfileSchema } from "@workspace/api-zod";
import { requireUserId } from "../middlewares/userId";
import { sendValidated } from "../utils/validateResponse";
import { eq, ne, notInArray, inArray, and } from "drizzle-orm";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

const router: IRouter = Router();

router.get("/profiles", requireUserId, async (req, res) => {
  const {
    budgetMin,
    budgetMax,
    noiseLevel,
    smokingOk,
    sameGenderOnly,
    shortlistedOnly,
    page: pageStr,
    limit: limitStr,
  } = req.query as Record<string, string>;

  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(limitStr ?? String(PAGE_SIZE_DEFAULT)) || PAGE_SIZE_DEFAULT));
  const offset = (page - 1) * limit;

  const swipedRows = await db
    .select({ swipedId: swipeActionsTable.swipedId, action: swipeActionsTable.action })
    .from(swipeActionsTable)
    .where(eq(swipeActionsTable.swiperId, req.userId));

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
      profiles: profiles.map(toProfileResponse),
      total: shortlistedIds.length,
      page,
      limit,
      totalPages: Math.ceil(shortlistedIds.length / limit),
    });
    return;
  }

  const excludeIds = [...new Set([...swipedIds, req.userId])];

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

  let profiles = rows.map(toProfileResponse);

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
    const currentUser = await db
      .select({ gender: usersTable.gender })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId))
      .limit(1);
    if (currentUser.length > 0) {
      profiles = profiles.filter((p) => p.gender === currentUser[0].gender);
    }
  }

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

router.get("/profiles/:id", async (req: Request<{ id: string }>, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, String(req.params.id)))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  sendValidated(res, RoommateProfileSchema, toProfileResponse(user));
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

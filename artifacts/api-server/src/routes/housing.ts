import { Router, type IRouter, type Request } from "express";
import { db, housingListingsTable, usersTable, housingMembersTable } from "@workspace/db";
import { HousingListingSchema, HousingResponseSchema } from "@workspace/api-zod";
import { requireAuth, requireVerified } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { eq, inArray, and } from "drizzle-orm";
import { getBlockedUserIds } from "../utils/blockFilter";

const router: IRouter = Router();

router.get("/housing", requireAuth, requireVerified, async (req, res) => {
  const {
    type: typeFilter,
    onlySublets,
    neighborhood,
    moveInFrom,
    moveInTo,
    maxRent,
  } = req.query as Record<string, string>;
  const blockedIds = await getBlockedUserIds(req.userId);

  let rows = await db
    .select()
    .from(housingListingsTable)
    .where(eq(housingListingsTable.status, "active"));

  // Type filter
  if (onlySublets === "true") {
    rows = rows.filter((r) => r.type === "sublet");
  } else if (typeFilter) {
    rows = rows.filter((r) => r.type === typeFilter);
  } else {
    rows = rows.filter((r) => r.type !== "forming_group");
  }

  // Neighborhood filter
  if (neighborhood) {
    rows = rows.filter((r) => r.neighborhood === neighborhood);
  }

  // Rent cap filter
  if (maxRent) {
    const cap = parseInt(maxRent, 10);
    if (!isNaN(cap)) {
      rows = rows.filter((r) => r.rent <= cap);
    }
  }

  // Move-in date filters (YYYY-MM or YYYY-MM-DD)
  if (moveInFrom) {
    rows = rows.filter((r) => r.moveInDate >= moveInFrom);
  }
  if (moveInTo) {
    rows = rows.filter((r) => r.moveInDate <= moveInTo);
  }

  // Exclude listings by blocked users
  rows = rows.filter((r) => !blockedIds.has(r.postedById));

  if (rows.length === 0) {
    sendValidated(res, HousingResponseSchema, { listings: [] });
    return;
  }

  const posterIds = [...new Set(rows.map((r) => r.postedById))];
  const listingIds = rows.map((r) => r.id);

  const [posters, members] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, posterIds)),
    db
      .select()
      .from(housingMembersTable)
      .where(inArray(housingMembersTable.listingId, listingIds)),
  ]);

  const posterById = Object.fromEntries(posters.map((u) => [u.id, u]));

  const memberUserIds = [...new Set(members.map((m) => m.userId))];
  const memberUsers = memberUserIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, memberUserIds))
    : [];
  const memberUserById = Object.fromEntries(memberUsers.map((u) => [u.id, u]));

  const membersByListing: Record<string, typeof memberUsers> = {};
  for (const m of members) {
    if (!membersByListing[m.listingId]) membersByListing[m.listingId] = [];
    const user = memberUserById[m.userId];
    if (user) membersByListing[m.listingId].push(user);
  }

  const listings = rows
    .filter((row) => posterById[row.postedById] !== undefined)
    .map((row) => toListingResponse(row, posterById[row.postedById]!, membersByListing[row.id] ?? []));

  sendValidated(res, HousingResponseSchema, { listings });
});

router.get("/housing/my-membership", requireAuth, requireVerified, async (req, res) => {
  const userId = req.userId;
  const memberRows = await db
    .select()
    .from(housingMembersTable)
    .where(eq(housingMembersTable.userId, userId));

  if (memberRows.length === 0) {
    res.json({ membership: null });
    return;
  }

  // Find the first active listing they belong to
  const listingIds = memberRows.map((r) => r.listingId);
  const [listing] = await db
    .select()
    .from(housingListingsTable)
    .where(
      and(
        inArray(housingListingsTable.id, listingIds),
        eq(housingListingsTable.status, "active"),
      )
    )
    .limit(1);

  if (!listing) {
    res.json({ membership: null });
    return;
  }

  res.json({ membership: { listingId: listing.id } });
});

router.get("/housing/:id", requireAuth, requireVerified, async (req: Request<{ id: string }>, res) => {
  const [row] = await db
    .select()
    .from(housingListingsTable)
    .where(eq(housingListingsTable.id, String(req.params.id)))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const [poster, members] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, row.postedById)).limit(1).then((r) => r[0]),
    db.select().from(housingMembersTable).where(eq(housingMembersTable.listingId, row.id)),
  ]);

  const memberUserIds = members.map((m) => m.userId);
  const memberUsers = memberUserIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, memberUserIds))
    : [];

  sendValidated(res, HousingListingSchema, toListingResponse(row, poster!, memberUsers));
});

function toProfileResponse(user: typeof usersTable.$inferSelect) {
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
    matchScore: user.matchScore,
    createdAt: user.createdAt.toISOString(),
  };
}

function toListingResponse(
  row: typeof housingListingsTable.$inferSelect,
  poster: typeof usersTable.$inferSelect | undefined,
  memberUsers: typeof usersTable.$inferSelect[] = [],
) {
  const currentMembers = memberUsers.map((u) => ({
    id: u.id,
    name: u.name,
    photoIndex: u.photoIndex,
    photoUrl: u.photoUrl,
    isVerified: u.isVerified,
    eduDomain: u.eduDomain ?? null,
  }));

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    address: row.address,
    neighborhood: row.neighborhood,
    rent: row.rent,
    moveInDate: row.moveInDate,
    photoIndex: row.photoIndex,
    description: row.description,
    currentRoommates: row.currentRoommates,
    maxRoommates: row.maxRoommates,
    rules: row.rules,
    tags: row.tags,
    amenities: row.amenities,
    sameGenderOnly: row.sameGenderOnly,
    status: row.status,
    requireRoommateReview: row.requireRoommateReview,
    subletStart: row.subletStart ?? null,
    subletEnd: row.subletEnd ?? null,
    currentMembers,
    postedBy: toProfileResponse(poster!),
  };
}

export default router;

import { Router, type IRouter, type Request } from "express";
import {
  db, housingListingsTable, housingJoinRequestsTable, housingMembersTable,
  matchesTable, usersTable,
} from "@workspace/db";
import {
  CreateHousingListingSchema, HousingListingSchema, HousingResponseSchema,
  JoinRequestsResponseSchema, CreateJoinRequestSchema,
} from "@workspace/api-zod";
import { requireAuth, requireVerified } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { and, eq, or, ne, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { computeMatchScore, computeMatchBreakdown } from "../utils/matchScore";
import { sendPushNotification } from "../utils/pushNotifications";

const router: IRouter = Router();

function toProfileResponse(
  user: typeof usersTable.$inferSelect,
  currentUser: typeof usersTable.$inferSelect | null = null,
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

function toListingResponse(
  row: typeof housingListingsTable.$inferSelect,
  poster: typeof usersTable.$inferSelect,
  currentMembers: Array<{ id: string; name: string; photoIndex: number; photoUrl: string; isVerified: boolean; eduDomain: string | null }> = [],
) {
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
    postedBy: toProfileResponse(poster),
  };
}

// POST /api/housing — create listing
router.post("/housing", requireAuth, requireVerified, async (req, res) => {
  const parsed = CreateHousingListingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const listingId = randomUUID();

  // Force requireRoommateReview = true for permanent rooms
  const requireReview = data.type === "permanent_room" ? true : (data.requireRoommateReview ?? true);

  await db.transaction(async (tx) => {
    await tx.insert(housingListingsTable).values({
      id: listingId,
      type: data.type,
      title: data.title,
      address: data.address,
      neighborhood: data.neighborhood,
      rent: data.rent,
      moveInDate: data.moveInDate,
      description: data.description,
      maxRoommates: data.maxRoommates,
      rules: data.rules,
      tags: data.tags,
      amenities: data.amenities,
      sameGenderOnly: data.sameGenderOnly,
      subletStart: data.subletStart ?? null,
      subletEnd: data.subletEnd ?? null,
      requireRoommateReview: requireReview,
      photoIndex: data.photoIndex,
      postedById: req.userId,
      status: "active",
    });

    await tx.insert(housingMembersTable).values({
      listingId,
      userId: req.userId,
      role: "owner",
    });
  });

  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, listingId)).limit(1);
  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

  sendValidated(res, HousingListingSchema, toListingResponse(listing, poster, []), 201);
});

// PATCH /api/housing/:id — owner edit
router.patch("/housing/:id", requireAuth, requireVerified, async (req: Request<{ id: string }>, res) => {
  const listingId = String(req.params.id);
  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, listingId)).limit(1);
  if (!listing) { res.status(404).json({ error: "not_found" }); return; }
  if (listing.postedById !== req.userId) { res.status(403).json({ error: "forbidden" }); return; }

  const parsed = CreateHousingListingSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request" }); return; }

  await db.update(housingListingsTable).set(parsed.data).where(eq(housingListingsTable.id, listingId));
  const [updated] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, listingId)).limit(1);
  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  sendValidated(res, HousingListingSchema, toListingResponse(updated, poster));
});

// DELETE /api/housing/:id — owner soft delete
router.delete("/housing/:id", requireAuth, requireVerified, async (req: Request<{ id: string }>, res) => {
  const listingId = String(req.params.id);
  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, listingId)).limit(1);
  if (!listing) { res.status(404).json({ error: "not_found" }); return; }
  if (listing.postedById !== req.userId) { res.status(403).json({ error: "forbidden" }); return; }

  await db.update(housingListingsTable).set({ status: "withdrawn" }).where(eq(housingListingsTable.id, listingId));
  res.status(204).send();
});

// POST /api/housing/:id/join-requests
router.post("/housing/:id/join-requests", requireAuth, requireVerified, async (req: Request<{ id: string }>, res) => {
  const listingId = String(req.params.id);
  const requesterId = req.userId;

  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, listingId)).limit(1);
  if (!listing) { res.status(404).json({ error: "not_found" }); return; }
  if (listing.status !== "active") { res.status(400).json({ error: "listing_not_active" }); return; }
  if (listing.postedById === requesterId) { res.status(400).json({ error: "cannot_request_own_listing" }); return; }

  const existingMember = await db
    .select()
    .from(housingMembersTable)
    .where(and(eq(housingMembersTable.listingId, listingId), eq(housingMembersTable.userId, requesterId)))
    .limit(1);
  if (existingMember.length > 0) { res.status(400).json({ error: "already_a_member" }); return; }

  const parsed = CreateJoinRequestSchema.safeParse(req.body);
  const message = parsed.success ? (parsed.data.message ?? "") : "";

  const requestId = randomUUID();

  // Instant join for no-review sublets
  if (!listing.requireRoommateReview) {
    const [canonUser1, canonUser2] = [requesterId, listing.postedById].sort();
    const matchId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(housingJoinRequestsTable).values({
        id: requestId,
        listingId,
        requesterId,
        message,
        status: "approved",
        decidedAt: new Date(),
      }).onConflictDoNothing();

      await tx.insert(housingMembersTable).values({ listingId, userId: requesterId, role: "member" }).onConflictDoNothing();

      await tx.update(housingListingsTable)
        .set({ currentRoommates: listing.currentRoommates + 1 })
        .where(eq(housingListingsTable.id, listingId));

      // Create match between requester and owner
      await tx.insert(matchesTable).values({ id: matchId, user1Id: canonUser1, user2Id: canonUser2 }).onConflictDoNothing();
    });

    void sendPushNotification(listing.postedById, "New roommate joined!", `Someone joined your listing: ${listing.title}`, {});
    res.status(201).json({ status: "approved", matchId });
    return;
  }

  await db.insert(housingJoinRequestsTable).values({
    id: requestId,
    listingId,
    requesterId,
    message,
    status: "pending",
  }).onConflictDoNothing();

  void sendPushNotification(listing.postedById, "New join request", `Someone wants to join: ${listing.title}`, {});
  res.status(201).json({ status: "pending", requestId });
});

// GET /api/housing/:id/join-requests — owner only
router.get("/housing/:id/join-requests", requireAuth, requireVerified, async (req: Request<{ id: string }>, res) => {
  const listingId = String(req.params.id);
  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, listingId)).limit(1);
  if (!listing) { res.status(404).json({ error: "not_found" }); return; }
  if (listing.postedById !== req.userId) { res.status(403).json({ error: "forbidden" }); return; }

  const [currentUserRows, requests] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1),
    db.select().from(housingJoinRequestsTable).where(eq(housingJoinRequestsTable.listingId, listingId)),
  ]);
  const currentUser = currentUserRows[0] ?? null;

  const requesterIds = requests.map((r) => r.requesterId);
  const requesters = requesterIds.length > 0
    ? await db.select().from(usersTable).where(
        or(...requesterIds.map((id) => eq(usersTable.id, id)))
      )
    : [];
  const requesterById = Object.fromEntries(requesters.map((u) => [u.id, u]));

  const formatted = requests.map((r) => ({
    id: r.id,
    listingId: r.listingId,
    requester: toProfileResponse(requesterById[r.requesterId]!, currentUser),
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    decidedAt: r.decidedAt?.toISOString() ?? null,
  })).filter((r) => r.requester);

  sendValidated(res, JoinRequestsResponseSchema, { requests: formatted });
});

// POST /api/housing/join-requests/:requestId/approve
router.post("/housing/join-requests/:requestId/approve", requireAuth, requireVerified, async (req: Request<{ requestId: string }>, res) => {
  const [request] = await db
    .select()
    .from(housingJoinRequestsTable)
    .where(eq(housingJoinRequestsTable.id, String(req.params.requestId)))
    .limit(1);

  if (!request) { res.status(404).json({ error: "not_found" }); return; }

  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, request.listingId)).limit(1);
  if (!listing) { res.status(404).json({ error: "not_found" }); return; }
  if (listing.postedById !== req.userId) { res.status(403).json({ error: "forbidden" }); return; }

  if (request.status !== "pending") { res.status(400).json({ error: "not_pending" }); return; }

  const [canonUser1, canonUser2] = [request.requesterId, listing.postedById].sort();
  const matchId = randomUUID();
  const newCount = listing.currentRoommates + 1;
  const newStatus = newCount >= listing.maxRoommates ? "filled" : "active";

  await db.transaction(async (tx) => {
    await tx.update(housingJoinRequestsTable)
      .set({ status: "approved", decidedAt: new Date() })
      .where(eq(housingJoinRequestsTable.id, request.id));

    await tx.insert(housingMembersTable)
      .values({ listingId: listing.id, userId: request.requesterId, role: "member" })
      .onConflictDoNothing();

    await tx.update(housingListingsTable)
      .set({ currentRoommates: newCount, status: newStatus })
      .where(eq(housingListingsTable.id, listing.id));

    await tx.insert(matchesTable)
      .values({ id: matchId, user1Id: canonUser1, user2Id: canonUser2 })
      .onConflictDoNothing();
  });

  void sendPushNotification(request.requesterId, "Join request approved!", `You've been approved for: ${listing.title}`, {});
  res.json({ ok: true, matchId });
});

// POST /api/housing/join-requests/:requestId/deny
router.post("/housing/join-requests/:requestId/deny", requireAuth, requireVerified, async (req: Request<{ requestId: string }>, res) => {
  const [request] = await db
    .select()
    .from(housingJoinRequestsTable)
    .where(eq(housingJoinRequestsTable.id, String(req.params.requestId)))
    .limit(1);

  if (!request) { res.status(404).json({ error: "not_found" }); return; }

  const [listing] = await db.select().from(housingListingsTable).where(eq(housingListingsTable.id, request.listingId)).limit(1);
  if (listing?.postedById !== req.userId) { res.status(403).json({ error: "forbidden" }); return; }

  await db.update(housingJoinRequestsTable)
    .set({ status: "denied", decidedAt: new Date() })
    .where(eq(housingJoinRequestsTable.id, request.id));

  void sendPushNotification(request.requesterId, "Join request update", `Your request for "${listing?.title}" was not approved.`, {});
  res.json({ ok: true });
});

// DELETE /api/housing/join-requests/:requestId — requester withdraw
router.delete("/housing/join-requests/:requestId", requireAuth, async (req: Request<{ requestId: string }>, res) => {
  const [request] = await db
    .select()
    .from(housingJoinRequestsTable)
    .where(and(
      eq(housingJoinRequestsTable.id, String(req.params.requestId)),
      eq(housingJoinRequestsTable.requesterId, req.userId),
    ))
    .limit(1);

  if (!request) { res.status(404).json({ error: "not_found" }); return; }
  if (request.status !== "pending") { res.status(400).json({ error: "cannot_withdraw" }); return; }

  await db.update(housingJoinRequestsTable)
    .set({ status: "withdrawn" })
    .where(eq(housingJoinRequestsTable.id, request.id));

  res.json({ ok: true });
});

// GET /api/housing/mine — owner's own listings with pending request counts
router.get("/housing/mine", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(housingListingsTable)
    .where(and(
      eq(housingListingsTable.postedById, req.userId),
      ne(housingListingsTable.status, "withdrawn"),
    ));

  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (!poster) { sendValidated(res, HousingResponseSchema, { listings: [] }); return; }

  const listingIds = rows.map((r) => r.id);

  const [allMembers, pendingRequests] = await Promise.all([
    listingIds.length > 0
      ? db.select().from(housingMembersTable).where(inArray(housingMembersTable.listingId, listingIds))
      : Promise.resolve([]),
    listingIds.length > 0
      ? db.select().from(housingJoinRequestsTable).where(
          and(
            inArray(housingJoinRequestsTable.listingId, listingIds),
            eq(housingJoinRequestsTable.status, "pending"),
          )
        )
      : Promise.resolve([]),
  ]);

  const memberUserIds = [...new Set(allMembers.map((m) => m.userId))];
  const memberUsers = memberUserIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, memberUserIds))
    : [];
  const memberUserById = Object.fromEntries(memberUsers.map((u) => [u.id, u]));

  const membersByListing: Record<string, Array<{ id: string; name: string; photoIndex: number; photoUrl: string; isVerified: boolean; eduDomain: string | null }>> = {};
  for (const m of allMembers) {
    if (!membersByListing[m.listingId]) membersByListing[m.listingId] = [];
    const u = memberUserById[m.userId];
    if (u) membersByListing[m.listingId].push({ id: u.id, name: u.name, photoIndex: u.photoIndex, photoUrl: u.photoUrl ?? "", isVerified: u.isVerified, eduDomain: u.eduDomain ?? null });
  }

  const pendingCountByListing: Record<string, number> = {};
  for (const r of pendingRequests) {
    pendingCountByListing[r.listingId] = (pendingCountByListing[r.listingId] ?? 0) + 1;
  }

  const listings = rows.map((row) => ({
    ...toListingResponse(row, poster, membersByListing[row.id] ?? []),
    pendingRequestCount: pendingCountByListing[row.id] ?? 0,
  }));

  sendValidated(res, HousingResponseSchema, { listings });
});

// GET /api/housing/my-groups — listings where caller is an approved member (not owner)
router.get("/housing/my-groups", requireAuth, async (req, res) => {
  const memberships = await db
    .select()
    .from(housingMembersTable)
    .where(and(
      eq(housingMembersTable.userId, req.userId),
      eq(housingMembersTable.role, "member"),
    ));

  if (memberships.length === 0) { sendValidated(res, HousingResponseSchema, { listings: [] }); return; }

  const listingIds = memberships.map((m) => m.listingId);
  const rows = await db
    .select()
    .from(housingListingsTable)
    .where(and(
      inArray(housingListingsTable.id, listingIds),
      ne(housingListingsTable.status, "withdrawn"),
    ));

  if (rows.length === 0) { sendValidated(res, HousingResponseSchema, { listings: [] }); return; }

  const posterIds = [...new Set(rows.map((r) => r.postedById))];
  const [posters, allMembers] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, posterIds)),
    db.select().from(housingMembersTable).where(inArray(housingMembersTable.listingId, listingIds)),
  ]);

  const posterById = Object.fromEntries(posters.map((u) => [u.id, u]));
  const memberUserIds = [...new Set(allMembers.map((m) => m.userId))];
  const memberUsers = memberUserIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, memberUserIds))
    : [];
  const memberUserById = Object.fromEntries(memberUsers.map((u) => [u.id, u]));

  const membersByListing: Record<string, Array<{ id: string; name: string; photoIndex: number; photoUrl: string; isVerified: boolean; eduDomain: string | null }>> = {};
  for (const m of allMembers) {
    if (!membersByListing[m.listingId]) membersByListing[m.listingId] = [];
    const u = memberUserById[m.userId];
    if (u) membersByListing[m.listingId].push({ id: u.id, name: u.name, photoIndex: u.photoIndex, photoUrl: u.photoUrl ?? "", isVerified: u.isVerified, eduDomain: u.eduDomain ?? null });
  }

  const listings = rows
    .filter((row) => posterById[row.postedById])
    .map((row) => toListingResponse(row, posterById[row.postedById]!, membersByListing[row.id] ?? []));

  sendValidated(res, HousingResponseSchema, { listings });
});

// GET /api/housing/my-requests
router.get("/housing/my-requests", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(housingJoinRequestsTable)
    .where(eq(housingJoinRequestsTable.requesterId, req.userId));

  res.json({ requests: rows });
});

export default router;

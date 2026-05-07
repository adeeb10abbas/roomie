import { Router, type IRouter, type Request } from "express";
import { db, housingListingsTable, usersTable } from "@workspace/db";
import { HousingListingSchema, HousingResponseSchema } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/housing", requireAuth, async (_req, res) => {
  const rows = await db.select().from(housingListingsTable);

  if (rows.length === 0) {
    sendValidated(res, HousingResponseSchema, { listings: [] });
    return;
  }

  const posterIds = [...new Set(rows.map((r) => r.postedById))];
  const posters = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.id, posterIds));
  const posterById = Object.fromEntries(posters.map((u) => [u.id, u]));

  const listings = rows
    .filter((row) => posterById[row.postedById] !== undefined)
    .map((row) => toListingResponse(row, posterById[row.postedById]!));

  sendValidated(res, HousingResponseSchema, { listings });
});

router.get("/housing/:id", requireAuth, async (req: Request<{ id: string }>, res) => {
  const [row] = await db
    .select()
    .from(housingListingsTable)
    .where(eq(housingListingsTable.id, String(req.params.id)))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const [poster] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, row.postedById))
    .limit(1);

  sendValidated(res, HousingListingSchema, toListingResponse(row, poster));
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

function toListingResponse(
  row: typeof housingListingsTable.$inferSelect,
  poster: typeof usersTable.$inferSelect | undefined,
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
    postedBy: toProfileResponse(poster!),
  };
}

export default router;

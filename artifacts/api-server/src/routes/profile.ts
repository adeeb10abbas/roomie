import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { UpsertProfileSchema, UserProfileSchema } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";

const router: IRouter = Router();

router.get("/profile/me", requireAuth, async (req, res) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  if (user.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  sendValidated(res, UserProfileSchema, toProfileResponse(user[0]));
});

router.put("/profile/me", requireAuth, async (req, res) => {
  const parsed = UpsertProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      id: req.userId,
      name: data.name ?? "",
      age: data.age ?? 0,
      gender: (data.gender as string) ?? "prefer_not_to_say",
      university: data.university ?? "",
      isVerified: data.isVerified ?? false,
      bio: data.bio ?? "",
      photoIndex: data.photoIndex ?? 0,
      occupation: data.occupation ?? "",
      location: data.location ?? "",
      neighborhoods: (data.neighborhoods as string[]) ?? [],
      budgetMin: data.budgetMin ?? 0,
      budgetMax: data.budgetMax ?? 5000,
      moveInDate: data.moveInDate ?? "",
      lifestyle: (data.lifestyle as Record<string, unknown>) ?? {},
      sameGenderOnly: data.sameGenderOnly ?? false,
      language: data.language ?? "",
      religion: data.religion ?? "",
      prompts: (data.prompts as { question: string; answer: string }[]) ?? [],
      tags: (data.tags as string[]) ?? [],
      badges: (data.badges as string[]) ?? [],
      matchScore: data.matchScore ?? 0,
    });
  } else {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.university !== undefined) updateData.university = data.university;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.photoIndex !== undefined) updateData.photoIndex = data.photoIndex;
    if (data.occupation !== undefined) updateData.occupation = data.occupation;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.neighborhoods !== undefined) updateData.neighborhoods = data.neighborhoods;
    if (data.budgetMin !== undefined) updateData.budgetMin = data.budgetMin;
    if (data.budgetMax !== undefined) updateData.budgetMax = data.budgetMax;
    if (data.moveInDate !== undefined) updateData.moveInDate = data.moveInDate;
    if (data.lifestyle !== undefined) updateData.lifestyle = data.lifestyle;
    if (data.sameGenderOnly !== undefined) updateData.sameGenderOnly = data.sameGenderOnly;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.religion !== undefined) updateData.religion = data.religion;
    if (data.prompts !== undefined) updateData.prompts = data.prompts;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.badges !== undefined) updateData.badges = data.badges;
    if (data.matchScore !== undefined) updateData.matchScore = data.matchScore;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, req.userId));
    }
  }

  const updated = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  sendValidated(res, UserProfileSchema, toProfileResponse(updated[0]));
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

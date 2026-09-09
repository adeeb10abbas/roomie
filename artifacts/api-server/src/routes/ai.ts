import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { BioGenerationResponseSchema } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

// In-memory rate limiter: 5 generations per user per hour
// TODO: swap for Redis post-MVP
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => t > oneHourAgo);
  if (timestamps.length >= 5) return false;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

router.post("/ai/bio", requireAuth, async (req, res) => {
  if (!checkRateLimit(req.userId)) {
    res.status(429).json({ error: "rate_limited", message: "Max 5 bio generations per hour" });
    return;
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  if (user.length === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const u = user[0];
  const lf = (u.lifestyle ?? {}) as Record<string, unknown>;

  const facts = [
    u.age ? `Age: ${u.age}` : null,
    u.university ? `University: ${u.university}` : null,
    u.occupation ? `Occupation: ${u.occupation}` : null,
    u.neighborhoods?.length ? `Neighborhood preferences: ${u.neighborhoods.join(", ")}` : null,
    lf.cleanliness ? `Cleanliness: ${lf.cleanliness}/5` : null,
    lf.sleepSchedule ? `Sleep: ${String(lf.sleepSchedule).replace(/_/g, " ")}` : null,
    lf.noise ? `Noise: ${lf.noise}` : null,
    lf.smoking === false ? "Smoking: no" : lf.smoking === true ? "Smoking: yes" : null,
    u.tags?.length ? `Tags: ${u.tags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n- ");

  const prompt = `You are writing a short roommate-profile bio in first person.
Use only these facts. 2-4 sentences. Friendly, specific, no clichés ("looking for a chill roommate"), no emoji, no hashtags. Max 280 chars.

FACTS:
- ${facts}

Return JSON ONLY: {"bio": "..."}`;

  const apiKey =
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey) {
    res.status(503).json({ error: "ai_unavailable", message: "AI bio generation not configured" });
    return;
  }

  try {
    const client = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    // Strip markdown code fences (```json ... ```) if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let bio = "";
    try {
      const parsed = JSON.parse(cleaned) as { bio?: string };
      bio = parsed.bio ?? cleaned;
    } catch {
      bio = cleaned;
    }

    bio = bio.slice(0, 280);
    sendValidated(res, BioGenerationResponseSchema, { bio });
  } catch (err) {
    req.log.error({ err }, "AI bio generation failed");
    res.status(503).json({ error: "ai_error" });
  }
});

export default router;

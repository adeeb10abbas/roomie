import { Router, type IRouter } from "express";
import { db, usersTable, emailVerificationsTable } from "@workspace/db";
import {
  RequestVerificationSchema,
  ConfirmVerificationSchema,
  VerificationStatusSchema,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { isEduDomain, extractDomain } from "../utils/eduDomain";
import { computeProfileCompletion } from "../utils/profileCompletion";
import { eq, and, isNull, gt, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.post("/verification/request", requireAuth, async (req, res) => {
  const parsed = RequestVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const { eduEmail } = parsed.data;

  if (!isEduDomain(eduEmail)) {
    res.status(400).json({ error: "edu_required" });
    return;
  }

  // Rate limit: check last verification request within 1 minute
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentRows = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.userId, req.userId),
        gt(emailVerificationsTable.createdAt, oneMinuteAgo),
        isNull(emailVerificationsTable.consumedAt),
      ),
    )
    .limit(1);

  if (recentRows.length > 0) {
    res.status(429).json({ error: "rate_limited", message: "Wait 1 minute before requesting another code" });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  await db.insert(emailVerificationsTable).values({
    id: randomUUID(),
    userId: req.userId,
    eduEmail,
    codeHash,
    expiresAt,
  });

  if (process.env.NODE_ENV !== "production") {
    req.log.info({ code, eduEmail }, "edu verification code (dev only)");
  }

  // Email sending (console default — swap EMAIL_PROVIDER for real sends)
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  if (provider === "console") {
    req.log.info({ eduEmail, code: process.env.NODE_ENV !== "production" ? code : "[redacted]" }, "EDU verification email (console mode)");
  }
  // TODO: add resend/sendgrid providers here

  sendValidated(res, VerificationStatusSchema, {
    isVerified: false,
    eduEmail,
    eduDomain: extractDomain(eduEmail),
    pendingRequest: true,
  });
});

router.post("/verification/confirm", requireAuth, async (req, res) => {
  const parsed = ConfirmVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_code" });
    return;
  }

  const { code } = parsed.data;
  const now = new Date();

  const rows = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.userId, req.userId),
        isNull(emailVerificationsTable.consumedAt),
        gt(emailVerificationsTable.expiresAt, now),
      ),
    )
    .orderBy(desc(emailVerificationsTable.createdAt))
    .limit(1);

  if (rows.length === 0) {
    res.status(400).json({ error: "no_pending_verification" });
    return;
  }

  const row = rows[0];

  await db
    .update(emailVerificationsTable)
    .set({ attempts: row.attempts + 1 })
    .where(eq(emailVerificationsTable.id, row.id));

  if (row.attempts + 1 > 5) {
    res.status(400).json({ error: "max_attempts_exceeded" });
    return;
  }

  const match = await bcrypt.compare(code, row.codeHash);
  if (!match) {
    res.status(400).json({ error: "invalid_code" });
    return;
  }

  await db
    .update(emailVerificationsTable)
    .set({ consumedAt: now })
    .where(eq(emailVerificationsTable.id, row.id));

  const domain = extractDomain(row.eduEmail);

  const [userRows] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1),
  ]);
  const existing = userRows[0] ?? null;
  const currentBadges: string[] = (existing?.badges as string[] | null) ?? [];
  const newBadges = currentBadges.includes("verified_student")
    ? currentBadges
    : [...currentBadges, "verified_student"];

  await db
    .update(usersTable)
    .set({
      isVerified: true,
      eduEmail: row.eduEmail,
      eduDomain: domain,
      verifiedAt: now,
      badges: newBadges,
    })
    .where(eq(usersTable.id, req.userId));

  // Recompute profile completion
  const updated = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
  if (updated[0]) {
    const completion = computeProfileCompletion(updated[0]);
    await db.update(usersTable).set({ profileCompletion: completion }).where(eq(usersTable.id, req.userId));
  }

  res.json({ verified: true });
});

router.post("/verification/resend", requireAuth, async (req, res) => {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentRows = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.userId, req.userId),
        gt(emailVerificationsTable.createdAt, oneMinuteAgo),
        isNull(emailVerificationsTable.consumedAt),
      ),
    )
    .limit(1);

  if (recentRows.length > 0) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }

  const lastRow = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.userId, req.userId),
        isNull(emailVerificationsTable.consumedAt),
      ),
    )
    .orderBy(desc(emailVerificationsTable.createdAt))
    .limit(1);

  if (lastRow.length === 0) {
    res.status(400).json({ error: "no_pending_verification" });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  await db.insert(emailVerificationsTable).values({
    id: randomUUID(),
    userId: req.userId,
    eduEmail: lastRow[0].eduEmail,
    codeHash,
    expiresAt,
  });

  if (process.env.NODE_ENV !== "production") {
    req.log.info({ code }, "edu verification resend code (dev only)");
  }

  res.json({ sent: true });
});

router.get("/verification/status", requireAuth, async (req, res) => {
  const user = await db
    .select({ isVerified: usersTable.isVerified, eduEmail: usersTable.eduEmail, eduDomain: usersTable.eduDomain })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1);

  const now = new Date();
  const pending = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.userId, req.userId),
        isNull(emailVerificationsTable.consumedAt),
        gt(emailVerificationsTable.expiresAt, now),
      ),
    )
    .limit(1);

  sendValidated(res, VerificationStatusSchema, {
    isVerified: user[0]?.isVerified ?? false,
    eduEmail: user[0]?.eduEmail ?? null,
    eduDomain: user[0]?.eduDomain ?? null,
    pendingRequest: pending.length > 0,
  });
});

export default router;

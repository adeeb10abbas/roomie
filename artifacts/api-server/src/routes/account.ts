import { Router, type IRouter } from "express";
import { db, usersTable, refreshTokensTable } from "@workspace/db";
import { DeleteAccountSchema, CreateFeedbackSchema } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { eq, isNull, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { feedbackTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/account/deactivate", requireAuth, async (req, res) => {
  await db
    .update(usersTable)
    .set({ deactivatedAt: new Date() })
    .where(eq(usersTable.id, req.userId));
  res.json({ ok: true });
});

router.post("/account/reactivate", requireAuth, async (req, res) => {
  await db
    .update(usersTable)
    .set({ deactivatedAt: null })
    .where(eq(usersTable.id, req.userId));
  res.json({ ok: true });
});

router.delete("/account", requireAuth, async (req, res) => {
  const parsed = DeleteAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  // Revoke all refresh tokens
  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokensTable.userId, req.userId), isNull(refreshTokensTable.revokedAt)),
    );

  // Hard delete — cascade handles related rows
  await db.delete(usersTable).where(eq(usersTable.id, req.userId));

  req.log.info({ userId: req.userId }, "account deleted");
  res.status(204).send();
});

router.post("/feedback", requireAuth, async (req, res) => {
  const parsed = CreateFeedbackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.issues });
    return;
  }

  const { category, body, appVersion } = parsed.data;

  await db.insert(feedbackTable).values({
    id: randomUUID(),
    userId: req.userId,
    category,
    body,
    appVersion: appVersion ?? null,
  });

  req.log.info({ userId: req.userId, category }, "feedback submitted");
  res.status(201).json({ ok: true });
});

export default router;

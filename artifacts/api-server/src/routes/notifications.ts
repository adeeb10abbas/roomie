import { Router, type IRouter } from "express";
import { db, expoPushTokensTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/notifications/register", requireAuth, async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== "string" || token.trim().length === 0) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  const userId = req.userId;

  await db
    .insert(expoPushTokensTable)
    .values({ id: randomUUID(), userId, token: token.trim(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [expoPushTokensTable.userId],
      set: { token: token.trim(), updatedAt: new Date() },
    });

  res.json({ ok: true });
});

router.delete("/notifications/register", requireAuth, async (req, res) => {
  await db
    .delete(expoPushTokensTable)
    .where(eq(expoPushTokensTable.userId, req.userId));
  res.json({ ok: true });
});

router.put("/notifications/preferences", requireAuth, async (req, res) => {
  const enabled = req.body?.enabled;
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "Invalid payload: enabled must be boolean" });
    return;
  }

  await db
    .update(usersTable)
    .set({ notificationsEnabled: enabled })
    .where(eq(usersTable.id, req.userId));

  res.json({ ok: true });
});

export default router;

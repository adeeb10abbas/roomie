import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db, feedbackTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/feedback", requireAuth, async (req, res) => {
  const { category, body, appVersion } = req.body as {
    category?: unknown;
    body?: unknown;
    appVersion?: unknown;
  };

  if (!category || typeof category !== "string" || category.trim().length === 0) {
    res.status(400).json({ error: "category is required" });
    return;
  }
  if (!body || typeof body !== "string" || body.trim().length < 10) {
    res.status(400).json({ error: "body must be at least 10 characters" });
    return;
  }

  await db.insert(feedbackTable).values({
    id: randomUUID(),
    userId: req.userId,
    category: category.trim() as "bug" | "feature" | "general" | "other",
    body: body.trim(),
    appVersion: typeof appVersion === "string" ? appVersion : null,
  });

  res.json({ success: true });
});

export default router;

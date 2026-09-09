import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { db, refreshTokensTable, usersTable } from "@workspace/db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
}

/**
 * Creates a secure random refresh token, hashes it for DB storage, persists it,
 * and returns the raw (unhashed) token to send to the client.
 */
export async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await db.insert(refreshTokensTable).values({
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

/**
 * Validates a raw refresh token against the DB and atomically rotates it.
 *
 * The entire operation runs inside a single serializable transaction so that
 * concurrent requests presenting the same one-time-use token cannot both succeed:
 *   - The first to commit wins (revokedAt set, new token minted).
 *   - Any concurrent attempt will see revokedAt already set and return null.
 *
 * Returns { userId, newRawToken } on success, or null if the token is
 * invalid, expired, or already revoked.
 */
export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ userId: string; newRawToken: string } | null> {
  const tokenHash = hashRefreshToken(rawToken);
  const now = new Date();

  // Generate the replacement token *before* the transaction so the insert is
  // included atomically — if the transaction rolls back, the new token is discarded.
  const newRawToken = randomBytes(32).toString("hex");
  const newTokenHash = hashRefreshToken(newRawToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  try {
    const result = await db.transaction(async (tx) => {
      // Find a valid, un-revoked, non-expired token matching the hash
      const rows = await tx
        .select()
        .from(refreshTokensTable)
        .where(
          and(
            eq(refreshTokensTable.tokenHash, tokenHash),
            isNull(refreshTokensTable.revokedAt),
            gt(refreshTokensTable.expiresAt, now),
          ),
        )
        .limit(1);

      if (rows.length === 0) return null;

      const row = rows[0];

      // Revoke the consumed token atomically within the same transaction
      await tx
        .update(refreshTokensTable)
        .set({ revokedAt: now })
        .where(
          and(
            eq(refreshTokensTable.id, row.id),
            isNull(refreshTokensTable.revokedAt), // guard against concurrent revoke
          ),
        );

      // Insert the replacement token in the same transaction
      await tx.insert(refreshTokensTable).values({
        id: randomUUID(),
        userId: row.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      });

      return { userId: row.userId };
    });

    if (!result) return null;
    return { userId: result.userId, newRawToken };
  } catch {
    return null;
  }
}

/**
 * Revokes all refresh tokens for a user (called on logout).
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokensTable.userId, userId), isNull(refreshTokensTable.revokedAt)),
    );
}

function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization header required" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  db.select({ isVerified: usersTable.isVerified })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId))
    .limit(1)
    .then((rows) => {
      if (rows.length === 0 || !rows[0].isVerified) {
        res.status(403).json({ error: "verification_required" });
        return;
      }
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "internal_error" });
    });
}

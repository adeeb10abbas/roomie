import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, authCredentialsTable } from "@workspace/db";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  OAuthRequestSchema,
  AuthResponseSchema,
  RefreshRequestSchema,
  RefreshResponseSchema,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";
import { signToken, createRefreshToken, rotateRefreshToken, revokeAllRefreshTokens, requireAuth } from "../middlewares/auth";
import { sendValidated } from "../utils/validateResponse";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const REFRESH_COOKIE = "refresh_token";
const REFRESH_COOKIE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Returns true when this request was NOT made by a browser.
 *
 * Browsers always include an Origin header on POST/PUT/PATCH/DELETE requests
 * (both same-origin and cross-origin) as of current browser engines.  This header
 * is controlled by the browser itself and cannot be suppressed by page-level JS,
 * so an XSS attack cannot fake a "native" context by removing Origin.
 *
 * Native Expo apps (iOS / Android) do not set Origin at all.
 *
 * Use for login / register / oauth — endpoints where a new refresh token is being
 * issued for the first time.
 */
function isNativeOriginCheck(req: Request): boolean {
  return !req.headers["origin"];
}

/**
 * For /auth/refresh ONLY: use the transport mechanism itself as the discriminator.
 *
 * If the client supplied the refresh token in the request body it must have known
 * the raw value — something a browser-based XSS attack cannot achieve because the
 * refresh token is stored in an httpOnly cookie that JS cannot read.  Therefore, a
 * non-empty bodyToken is proof of a native client.
 *
 * If the token arrived only via the httpOnly cookie (bodyToken is absent), the
 * request came from a browser → never return raw refreshToken in the JSON body.
 */
function isNativeRefreshTransport(bodyToken: string | undefined): boolean {
  return !!bodyToken;
}

/**
 * Sets the refresh token as an httpOnly, Secure, SameSite=Strict cookie.
 * This prevents JS on the web client from reading the token (XSS mitigation).
 */
function setRefreshCookie(res: Response, rawToken: string): void {
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_TTL_MS,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { email, password, name } = parsed.data;

  const existing = await db
    .select()
    .from(authCredentialsTable)
    .where(eq(authCredentialsTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = randomUUID();
  const credId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(usersTable).values({
      id: userId,
      name: name.trim(),
      age: 0,
      gender: "prefer_not_to_say",
      university: "",
      isVerified: false,
      bio: "",
      photoIndex: 0,
      occupation: "",
      location: "New York, NY",
      neighborhoods: [],
      budgetMin: 0,
      budgetMax: 5000,
      moveInDate: "",
      lifestyle: {},
      sameGenderOnly: false,
      language: "",
      religion: "",
      prompts: [],
      tags: [],
      badges: [],
      matchScore: 0,
    });

    await tx.insert(authCredentialsTable).values({
      id: credId,
      userId,
      email: email.toLowerCase(),
      passwordHash,
      provider: "email",
    });
  });

  const token = signToken({ userId, email: email.toLowerCase() });
  const refreshToken = await createRefreshToken(userId);

  setRefreshCookie(res, refreshToken);
  sendValidated(res, AuthResponseSchema, {
    token,
    // Only include raw refresh token in body for native clients (Origin absent → native)
    ...(isNativeOriginCheck(req) ? { refreshToken } : {}),
    userId,
    email: email.toLowerCase(),
    hasProfile: false,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { email, password } = parsed.data;

  const creds = await db
    .select()
    .from(authCredentialsTable)
    .where(
      and(
        eq(authCredentialsTable.email, email.toLowerCase()),
        eq(authCredentialsTable.provider, "email"),
      ),
    )
    .limit(1);

  if (creds.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const cred = creds[0];

  if (!cred.passwordHash) {
    res.status(401).json({ error: "This account uses a different sign-in method" });
    return;
  }

  const valid = await bcrypt.compare(password, cred.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, cred.userId))
    .limit(1);

  const hasProfile = user.length > 0 && user[0].age > 0 && user[0].name.trim().length > 0;

  const token = signToken({ userId: cred.userId, email: cred.email });
  const refreshToken = await createRefreshToken(cred.userId);

  setRefreshCookie(res, refreshToken);
  sendValidated(res, AuthResponseSchema, {
    token,
    ...(isNativeOriginCheck(req) ? { refreshToken } : {}),
    userId: cred.userId,
    email: cred.email,
    hasProfile,
  });
});

/**
 * Refresh access + refresh tokens.
 *
 * Accepts the current refresh token from EITHER:
 *   - Request body `{ refreshToken }` — used by native mobile clients
 *   - httpOnly cookie `refresh_token`  — used by web clients (set automatically by browser)
 *
 * Revokes the consumed token (rotation) and issues a new token pair.
 * Returns 401 if the refresh token is invalid, expired, or already revoked.
 */
router.post("/auth/refresh", async (req, res) => {
  // Validate the body (refreshToken is optional — web clients send empty body)
  const parsed = RefreshRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  // Prefer body token (native) over cookie (web) — both are supported
  const rawToken: string | undefined =
    parsed.data.refreshToken || (req.cookies as Record<string, string>)[REFRESH_COOKIE];

  if (!rawToken) {
    res.status(401).json({ error: "Refresh token required" });
    return;
  }

  const result = await rotateRefreshToken(rawToken);
  if (!result) {
    clearRefreshCookie(res);
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  // Fetch email for the new access token payload
  const creds = await db
    .select()
    .from(authCredentialsTable)
    .where(eq(authCredentialsTable.userId, result.userId))
    .limit(1);

  const email = creds[0]?.email ?? "";
  const token = signToken({ userId: result.userId, email });

  // Set the new refresh token as an httpOnly cookie (for web)
  setRefreshCookie(res, result.newRawToken);

  sendValidated(res, RefreshResponseSchema, {
    token,
    // Body-supplied token means the client knew the raw value → native transport
    // (web clients cannot read httpOnly cookies, so cannot supply body token)
    ...(isNativeRefreshTransport(parsed.data.refreshToken) ? { refreshToken: result.newRawToken } : {}),
  });
});

/**
 * Logout — revokes all refresh tokens for the user and clears the cookie.
 * Requires a valid access token so we know who is logging out.
 */
router.post("/auth/logout", requireAuth, async (req, res) => {
  await revokeAllRefreshTokens(req.userId);
  clearRefreshCookie(res);
  res.json({ ok: true });
});

/**
 * Verifies a Google ID token via Google's tokeninfo endpoint and enforces `aud`.
 * Returns { sub, email } or throws with a descriptive message.
 */
async function verifyGoogleIdToken(
  idToken: string,
): Promise<{ sub: string; email: string }> {
  const verifyRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );

  if (!verifyRes.ok) {
    throw new Error("Invalid Google ID token");
  }

  const payload = (await verifyRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: string;
    aud?: string;
    iss?: string;
    exp?: string;
  };

  if (!payload.sub || !payload.email) {
    throw new Error("Google token missing required fields (sub, email)");
  }

  // Validate issuer
  if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
    throw new Error("Invalid Google token issuer");
  }

  // Validate expiry (tokeninfo also checks this, but be explicit)
  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
    throw new Error("Google token has expired");
  }

  // Enforce audience — if GOOGLE_CLIENT_ID is configured, token must be for that app
  const configuredClientId = process.env.GOOGLE_CLIENT_ID;
  if (configuredClientId && payload.aud) {
    const allowedAudiences = configuredClientId.split(",").map((s) => s.trim());
    if (!allowedAudiences.includes(payload.aud)) {
      throw new Error("Google token audience does not match configured client ID");
    }
  }

  if (payload.email_verified !== "true") {
    throw new Error("Google email not verified");
  }

  return { sub: payload.sub, email: payload.email.toLowerCase() };
}

/**
 * Apple JWK type returned from https://appleid.apple.com/auth/keys
 */
interface AppleJwk {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

/** In-memory cache for Apple JWKS to avoid fetching on every request */
let applJwksCache: { keys: AppleJwk[]; fetchedAt: number } | null = null;

async function getApplePublicKeys(): Promise<AppleJwk[]> {
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  if (applJwksCache && Date.now() - applJwksCache.fetchedAt < CACHE_TTL_MS) {
    return applJwksCache.keys;
  }
  const res = await fetch("https://appleid.apple.com/auth/keys");
  if (!res.ok) throw new Error("Failed to fetch Apple public keys");
  const data = (await res.json()) as { keys: AppleJwk[] };
  applJwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

/**
 * Verifies an Apple ID token via Apple's JWKS endpoint.
 * Validates signature, issuer, audience (if APPLE_CLIENT_ID is set), and expiry.
 */
async function verifyAppleIdToken(
  idToken: string,
): Promise<{ sub: string; email: string | null }> {
  // Decode header to get kid + alg
  const [headerB64] = idToken.split(".");
  const header = JSON.parse(
    Buffer.from(headerB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
  ) as { kid?: string; alg?: string };

  if (!header.kid) throw new Error("Apple token missing key ID in header");

  // Fetch Apple's public keys and find the matching key
  const keys = await getApplePublicKeys();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching Apple public key found for kid: " + header.kid);

  // Build Node.js public key from JWK (supported since Node 15)
  const { createPublicKey } = await import("crypto");
  const publicKey = createPublicKey({ key: jwk as unknown as import("crypto").JsonWebKeyInput["key"], format: "jwk" });

  // Verify signature + standard claims with jsonwebtoken
  const jwt = await import("jsonwebtoken");
  const payload = jwt.default.verify(idToken, publicKey, {
    algorithms: ["RS256", "ES256"],
    issuer: "https://appleid.apple.com",
    ...(process.env.APPLE_CLIENT_ID ? { audience: process.env.APPLE_CLIENT_ID } : {}),
  }) as { sub?: string; email?: string; email_verified?: boolean | string };

  // sub is always required; email is ONLY present on the first sign-in
  if (!payload.sub) {
    throw new Error("Apple token missing required field: sub");
  }

  return {
    sub: payload.sub,
    email: payload.email ? payload.email.toLowerCase() : null,
  };
}

/**
 * OAuth sign-in / sign-up.
 * Accepts a Google or Apple ID token, verifies it server-side via JWKS/tokeninfo,
 * then creates (or retrieves) a user and returns a signed JWT + refresh token.
 *
 * Google: verified via Google tokeninfo (enforces aud if GOOGLE_CLIENT_ID is set).
 * Apple: verified via Apple JWKS endpoint with full signature + claim validation.
 */
router.post("/auth/oauth", async (req, res) => {
  const parsed = OAuthRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { provider, idToken, name } = parsed.data;

  let providerUserId: string;
  // Apple only sends email on the FIRST sign-in; subsequent tokens omit it.
  // Google always includes email (required by tokeninfo verification).
  let oauthEmail: string | null;

  if (provider === "google") {
    try {
      const verified = await verifyGoogleIdToken(idToken);
      providerUserId = verified.sub;
      oauthEmail = verified.email;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google token verification failed";
      res.status(401).json({ error: msg });
      return;
    }
  } else if (provider === "apple") {
    try {
      const verified = await verifyAppleIdToken(idToken);
      providerUserId = verified.sub;
      oauthEmail = verified.email; // null on repeat sign-ins — that is fine
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Apple token verification failed";
      res.status(401).json({ error: msg });
      return;
    }
  } else {
    res.status(400).json({ error: "Unsupported provider" });
    return;
  }

  // Step 1: Look up existing credential by provider + providerUserId (primary path).
  // This handles all repeat sign-ins, including Apple without email.
  const existingCred = await db
    .select()
    .from(authCredentialsTable)
    .where(
      and(
        eq(authCredentialsTable.provider, provider),
        eq(authCredentialsTable.providerUserId, providerUserId),
      ),
    )
    .limit(1);

  if (existingCred.length > 0) {
    const cred = existingCred[0];
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, cred.userId))
      .limit(1);

    const hasProfile = user.length > 0 && user[0].age > 0;
    const token = signToken({ userId: cred.userId, email: cred.email });
    const refreshToken = await createRefreshToken(cred.userId);

    setRefreshCookie(res, refreshToken);
    sendValidated(res, AuthResponseSchema, {
      token,
      ...(isNativeOriginCheck(req) ? { refreshToken } : {}),
      userId: cred.userId,
      email: cred.email,
      hasProfile,
    });
    return;
  }

  // Step 2: No existing credential by providerUserId.
  // For new account creation, email is required.
  if (!oauthEmail) {
    // Apple omitting email on a non-first sign-in but no existing credential
    // means the account was created elsewhere or the token is stale.
    res.status(401).json({
      error:
        "Unable to link account: email not provided by Apple. Please sign in with your original method.",
    });
    return;
  }

  const email = oauthEmail;

  // Step 3: Check if email already exists (link accounts by email — e.g. existing
  // email/password account being linked to OAuth provider).
  const existingEmailCred = await db
    .select()
    .from(authCredentialsTable)
    .where(eq(authCredentialsTable.email, email))
    .limit(1);

  if (existingEmailCred.length > 0) {
    const cred = existingEmailCred[0];
    // Add a new OAuth credential row for this provider, linking it to the
    // existing userId. This lets one user have multiple providers without
    // overwriting any existing credential row.
    await db.insert(authCredentialsTable).values({
      id: randomUUID(),
      userId: cred.userId,
      email,
      passwordHash: null,
      provider,
      providerUserId,
    }).onConflictDoNothing();

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, cred.userId))
      .limit(1);

    const token = signToken({ userId: cred.userId, email });
    const refreshToken = await createRefreshToken(cred.userId);

    setRefreshCookie(res, refreshToken);
    sendValidated(res, AuthResponseSchema, {
      token,
      ...(isNativeOriginCheck(req) ? { refreshToken } : {}),
      userId: cred.userId,
      email,
      hasProfile: user.length > 0 && user[0].age > 0,
    });
    return;
  }

  // Step 4: Truly new user — create account
  const userId = randomUUID();
  const credId = randomUUID();
  const displayName = name ?? email.split("@")[0];

  await db.transaction(async (tx) => {
    await tx.insert(usersTable).values({
      id: userId,
      name: displayName,
      age: 0,
      gender: "prefer_not_to_say",
      university: "",
      isVerified: true,
      bio: "",
      photoIndex: 0,
      occupation: "",
      location: "New York, NY",
      neighborhoods: [],
      budgetMin: 0,
      budgetMax: 5000,
      moveInDate: "",
      lifestyle: {},
      sameGenderOnly: false,
      language: "",
      religion: "",
      prompts: [],
      tags: [],
      badges: [],
      matchScore: 0,
    });

    await tx.insert(authCredentialsTable).values({
      id: credId,
      userId,
      email,
      passwordHash: null,
      provider,
      providerUserId,
    });
  });

  logger.info({ provider, userId }, "New OAuth user created");

  const token = signToken({ userId, email });
  const refreshToken = await createRefreshToken(userId);

  setRefreshCookie(res, refreshToken);
  sendValidated(res, AuthResponseSchema, {
    token,
    ...(isNativeOriginCheck(req) ? { refreshToken } : {}),
    userId,
    email,
    hasProfile: false,
  });
});

export default router;

import { Page, expect, APIRequestContext, request as pwRequest } from '@playwright/test';
import { Client } from 'pg';

export const BASE_URL = 'http://localhost:80';
export const TEST_EMAIL = 'test@roomie.app';
export const TEST_PASSWORD = 'password123';
export const TEST_USER_ID = 'test-user-01';

/**
 * Open a short-lived pg client. Callers must close it.
 * DATABASE_URL is injected by the Replit environment.
 */
export async function dbClient(): Promise<Client> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — cannot run e2e fixtures');
  const c = new Client({ connectionString: url });
  await c.connect();
  return c;
}

/**
 * Wipe all swipes & matches & messages for the test user, so the discover
 * deck is full and there are no stale matches from prior runs.
 */
export async function resetTestUserState(): Promise<void> {
  const c = await dbClient();
  try {
    // Delete messages from matches involving the test user
    await c.query(
      `DELETE FROM messages WHERE match_id IN (
         SELECT id FROM matches WHERE user1_id=$1 OR user2_id=$1
       )`,
      [TEST_USER_ID],
    );
    await c.query(`DELETE FROM matches WHERE user1_id=$1 OR user2_id=$1`, [TEST_USER_ID]);
    await c.query(`DELETE FROM swipe_actions WHERE swiper_id=$1 OR swiped_id=$1`, [TEST_USER_ID]);
    await c.query(`DELETE FROM user_blocks WHERE blocker_id=$1 OR blocked_id=$1`, [TEST_USER_ID]);
    await c.query(`DELETE FROM user_reports WHERE reporter_id=$1 OR reported_id=$1`, [TEST_USER_ID]);
  } finally {
    await c.end();
  }
}

/**
 * Set the test user's is_verified flag. Used to exercise the unverified-user
 * paths (verify nudge, OTP request flow) deterministically.
 */
export async function setTestUserVerified(isVerified: boolean): Promise<void> {
  const c = await dbClient();
  try {
    await c.query(
      `UPDATE users SET is_verified=$1, edu_email=NULL, edu_domain=NULL, verified_at=NULL WHERE id=$2`,
      [isVerified, TEST_USER_ID],
    );
    if (!isVerified) {
      // Also drop any pending verification rows so the screen returns to the
      // initial "enter your .edu email" step, not "enter your code".
      await c.query(`DELETE FROM email_verifications WHERE user_id=$1`, [TEST_USER_ID]);
    }
  } finally {
    await c.end();
  }
}

/**
 * Make the discover deck deterministic: the test user has already skipped
 * every seed profile EXCEPT `keepUserId`, so `keepUserId` is the only card
 * remaining in the deck. Useful for driving a deterministic UI swipe.
 */
export async function skipAllExcept(keepUserId: string): Promise<void> {
  const c = await dbClient();
  try {
    const r = await c.query<{ id: string }>(
      `SELECT id FROM users WHERE id <> $1 AND id <> $2`,
      [TEST_USER_ID, keepUserId],
    );
    for (const row of r.rows) {
      await c.query(
        `INSERT INTO swipe_actions (id, swiper_id, swiped_id, action, created_at)
         VALUES ($1, $2, $3, 'skip', NOW())
         ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET action='skip'`,
        [`skip-${TEST_USER_ID}-${row.id}`, TEST_USER_ID, row.id],
      );
    }
  } finally {
    await c.end();
  }
}

/**
 * Seed: another user (seedUserId) has already "liked" the test user.
 * When the test user later likes them back, the API will create a match.
 */
export async function seedIncomingLike(seedUserId: string): Promise<void> {
  const c = await dbClient();
  try {
    await c.query(
      `INSERT INTO swipe_actions (id, swiper_id, swiped_id, action, created_at)
       VALUES ($1, $2, $3, 'like', NOW())
       ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET action='like'`,
      [`seed-${seedUserId}-${TEST_USER_ID}-${Date.now()}`, seedUserId, TEST_USER_ID],
    );
  } finally {
    await c.end();
  }
}

/**
 * Seed: create a deterministic match row between the test user and another
 * user, with canonical (lexicographically ordered) user1/user2.
 * Returns the match id.
 */
export async function seedMatch(otherUserId: string): Promise<string> {
  const c = await dbClient();
  try {
    const [u1, u2] = [TEST_USER_ID, otherUserId].sort();
    const id = `match-e2e-${u1}-${u2}`;
    await c.query(
      `INSERT INTO matches (id, user1_id, user2_id, matched_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user1_id, user2_id) DO NOTHING`,
      [id, u1, u2],
    );
    // Also satisfy any reciprocal-swipe queries the UI might rely on
    await c.query(
      `INSERT INTO swipe_actions (id, swiper_id, swiped_id, action, created_at)
       VALUES ($1, $2, $3, 'like', NOW())
       ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET action='like'`,
      [`seed-self-${Date.now()}`, TEST_USER_ID, otherUserId],
    );
    await c.query(
      `INSERT INTO swipe_actions (id, swiper_id, swiped_id, action, created_at)
       VALUES ($1, $2, $3, 'like', NOW())
       ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET action='like'`,
      [`seed-other-${Date.now()}`, otherUserId, TEST_USER_ID],
    );
    // Look up the actual match id (might pre-exist with a different id)
    const r = await c.query(
      `SELECT id FROM matches WHERE user1_id=$1 AND user2_id=$2 LIMIT 1`,
      [u1, u2],
    );
    return r.rows[0]?.id ?? id;
  } finally {
    await c.end();
  }
}

export async function loginAsTestUser(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
  await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
  await page.getByText('Sign In').last().click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
}

/**
 * Register a brand-new account (always unverified). Returns the email used.
 * The new user lands on /onboarding; caller may navigate away as needed.
 */
export async function registerFreshUser(page: Page): Promise<string> {
  const email = `tester+${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('First name').fill('Fresh Tester');
  await page.getByPlaceholder('you@example.com').fill(email);
  const pwInputs = await page.locator('input[type="password"]').all();
  if (pwInputs.length >= 2) {
    await pwInputs[0].fill('securePass123');
    await pwInputs[1].fill('securePass123');
  } else {
    await page.getByPlaceholder('••••••••').first().fill('securePass123');
  }
  await page.getByText('Create Account', { exact: true }).last().click();
  await page.waitForURL(u => u.pathname.includes('/onboarding'), { timeout: 15000 });
  return email;
}

export async function getAuthToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('auth_token'));
}

export async function navigateToTab(page: Page, tab: 'Discover' | 'Housing' | 'Messages' | 'Profile') {
  const tabLabels: Record<string, string> = {
    Discover: 'Match', Housing: 'Housing', Messages: 'Messages', Profile: 'Profile',
  };
  await page.getByText(tabLabels[tab]).last().click();
  await page.waitForTimeout(500);
}

export function uniqueEmail() {
  return `tester+${Date.now()}@example.com`;
}

/**
 * Build an authed API context using the JWT currently stored in the page's
 * localStorage. Caller must dispose.
 */
export async function authedApi(page: Page): Promise<APIRequestContext> {
  const token = await getAuthToken(page);
  return pwRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

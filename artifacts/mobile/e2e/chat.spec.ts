import { test, expect } from '@playwright/test';
import {
  loginAsTestUser, resetTestUserState, seedIncomingLike, seedMatch,
  skipAllExcept,
} from './helpers';

const SEED_USER = 'p2'; // Marcus Williams

test.describe('Match & chat flow', () => {
  test('messages tab shows inbox header', async ({ page }) => {
    await resetTestUserState();
    await loginAsTestUser(page);
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Messages').first()).toBeVisible({ timeout: 8000 });
  });

  test('UI like on the top card creates a reciprocal match and shows the match modal', async ({ page }) => {
    // Make the deck deterministic: skip every seed user EXCEPT Marcus, then
    // seed an incoming like from Marcus. The only card the test user can see
    // is Marcus, and the next UI "like" closes the loop into a match.
    await resetTestUserState();
    await skipAllExcept(SEED_USER);
    await seedIncomingLike(SEED_USER);
    await loginAsTestUser(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const likeBtn = page.locator('[data-testid="like-btn"]');
    await expect(likeBtn).toBeVisible({ timeout: 10000 });

    // Confirm only Marcus is in the visible card stack — eliminates any chance
    // we're liking someone else.
    await expect(page.getByText('Marcus', { exact: false }).first()).toBeVisible({ timeout: 5000 });

    // Click like → server returns matched=true → MatchModal opens.
    await likeBtn.click();

    // The MatchModal must appear (UI assertion, not API).
    await expect(page.getByText("It's a Match!")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Send a Message')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Keep Browsing')).toBeVisible({ timeout: 3000 });
  });

  test('open a seeded conversation, send a message via UI, and see it in the thread', async ({ page }) => {
    await resetTestUserState();
    const matchId = await seedMatch(SEED_USER);
    await loginAsTestUser(page);

    // Chat polls /api/messages, so it never reaches networkidle.
    await page.goto(`/chat/${matchId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const input = page.locator('[data-testid="msg-input"]');
    const sendBtn = page.locator('[data-testid="send-btn"]');
    await expect(input).toBeVisible({ timeout: 10000 });
    await expect(sendBtn).toBeVisible({ timeout: 5000 });

    const body = `e2e ui hello ${Date.now()}`;

    // Wait for the POST /api/messages call to fire as a result of the click,
    // proving the UI really wired the send button to the API. Exclude the
    // /read endpoint (mark-as-read also POSTs to /api/messages/:id/read but
    // has no body, and fires on chat mount).
    const postReq = page.waitForRequest(
      (r) =>
        r.method() === 'POST' &&
        r.url().includes(`/api/messages/${matchId}`) &&
        !r.url().endsWith('/read'),
      { timeout: 10000 },
    );

    await input.fill(body);
    await sendBtn.click();

    const req = await postReq;
    const raw = req.postData();
    expect(raw, 'POST /api/messages must include a body').toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.text).toBe(body);

    // The sent message must appear in the chat thread (UI assertion).
    await expect(page.getByText(body)).toBeVisible({ timeout: 8000 });

    // And the "me" bubble specifically must contain it.
    const myBubble = page.locator('[data-testid="msg-bubble-me"]').filter({ hasText: body });
    await expect(myBubble.first()).toBeVisible({ timeout: 5000 });
  });
});

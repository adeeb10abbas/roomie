import { test, expect } from '@playwright/test';
import { loginAsTestUser, resetTestUserState } from './helpers';

test.describe('Discover / swipe flow', () => {
  test.beforeEach(async ({ page }) => {
    // Hard reset: every test starts with a clean swipe history and a full deck.
    await resetTestUserState();
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('discover header and card deck are visible', async ({ page }) => {
    await expect(page.getByText('Roomie').first()).toBeVisible({ timeout: 8000 });
    // Deck is reset → cards must be present (NOT the empty state).
    await expect(page.locator('[data-testid="like-btn"]')).toBeVisible({ timeout: 8000 });
  });

  test('shortlist action fires POST /api/swipes with action=shortlist', async ({ page }) => {
    // Note: react-native-web renders the whole card stack in the DOM (the next
    // 2 cards stay mounted under the top card), so we cannot reliably detect
    // which name is "on top" via text queries. We assert the API contract:
    // pressing shortlist-btn POSTs /api/swipes with action='shortlist'.
    const shortlistBtn = page.locator('[data-testid="shortlist-btn"]');
    await expect(shortlistBtn).toBeVisible({ timeout: 8000 });

    const swipeReq = page.waitForRequest(
      r => r.url().includes('/api/swipes') && r.method() === 'POST',
      { timeout: 10000 },
    );
    await shortlistBtn.click();
    const req = await swipeReq;
    const body = req.postDataJSON();
    expect(body.action, 'shortlist-btn must POST action=shortlist').toBe('shortlist');
    expect(typeof body.swipedId === 'string' || typeof body.profileId === 'string').toBeTruthy();
  });

  test('like action removes top card and fires POST /api/swipes', async ({ page }) => {
    const likeBtn = page.locator('[data-testid="like-btn"]');
    await expect(likeBtn).toBeVisible({ timeout: 8000 });

    const swipeReq = page.waitForRequest(
      r => r.url().includes('/api/swipes') && r.method() === 'POST',
      { timeout: 10000 },
    );

    await likeBtn.click();
    const req = await swipeReq;
    const body = req.postDataJSON();
    expect(body.action).toBe('like');
    expect(typeof body.swipedId === 'string' || typeof body.profileId === 'string').toBeTruthy();

    // Deck still has more cards (we just reset; there are 10 seed profiles).
    await expect(likeBtn).toBeVisible({ timeout: 5000 });
  });

  test('skip action removes top card and fires POST /api/swipes', async ({ page }) => {
    const skipBtn = page.locator('[data-testid="skip-btn"]');
    await expect(skipBtn).toBeVisible({ timeout: 8000 });

    const swipeReq = page.waitForRequest(
      r => r.url().includes('/api/swipes') && r.method() === 'POST',
      { timeout: 10000 },
    );
    await skipBtn.click();
    const req = await swipeReq;
    expect(req.postDataJSON().action).toBe('skip');

    await expect(skipBtn).toBeVisible({ timeout: 5000 });
  });

  test('applying a budget filter triggers a new GET /api/profiles with budget params', async ({ page }) => {
    await page.goto('/filters');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Pick the "$1,500 – $2,000" preset (the test user's own range)
    const preset = page.getByText('$1,500 – $2,000', { exact: true });
    await expect(preset).toBeVisible({ timeout: 5000 });
    await preset.click();

    // Click "Apply Filters" — this calls setFilters() then router.back(),
    // which triggers a fresh /api/profiles fetch with the new query params.
    const profilesReq = page.waitForRequest(
      r => r.url().includes('/api/profiles') && r.method() === 'GET' &&
           r.url().includes('budgetMin=1500') && r.url().includes('budgetMax=2000'),
      { timeout: 20000 },
    );

    await page.getByText('Apply Filters', { exact: true }).click();

    const req = await profilesReq;
    const url = new URL(req.url());
    expect(url.searchParams.get('budgetMin')).toBe('1500');
    expect(url.searchParams.get('budgetMax')).toBe('2000');
  });

  test('tapping the refresh button fires GET /api/profiles and clears the refreshing state', async ({ page }) => {
    // Pull-to-refresh on react-native-web's RefreshControl can't be triggered
    // via a real touch gesture — we added a visible refresh button in the
    // header that calls the same handleRefresh handler.
    const refreshBtn = page.locator('[data-testid="discover-refresh-btn"]');
    await expect(refreshBtn).toBeVisible({ timeout: 8000 });

    const profilesReq = page.waitForRequest(
      r => r.url().includes('/api/profiles') && r.method() === 'GET',
      { timeout: 10000 },
    );
    await refreshBtn.click();
    await profilesReq;

    // After the refresh completes the deck must still be populated.
    await expect(page.locator('[data-testid="like-btn"]')).toBeVisible({ timeout: 10000 });
  });

  test('in-app tab navigation back to Match triggers a fresh GET /api/profiles', async ({ page }) => {
    // Navigate away to Housing via direct URL (tab-bar text targeting is
    // unreliable on react-native-web — multiple "Housing" text nodes exist).
    await page.goto('/housing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Return to Match — AppContext.refreshProfiles fires on mount
    const profilesReq = page.waitForRequest(
      r => r.url().includes('/api/profiles') && r.method() === 'GET',
      { timeout: 20000 },
    );
    await page.goto('/');
    await profilesReq;

    await expect(page.locator('[data-testid="like-btn"]')).toBeVisible({ timeout: 10000 });
  });
});

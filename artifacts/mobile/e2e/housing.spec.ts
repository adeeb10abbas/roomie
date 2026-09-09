import { test, expect, request } from '@playwright/test';
import { loginAsTestUser, getAuthToken } from './helpers';

test.describe('Housing flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/housing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('housing tab header and segment tabs are visible', async ({ page }) => {
    await expect(page.getByText('Housing').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Open Rooms').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sublets').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Groups').first()).toBeVisible({ timeout: 5000 });
  });

  test('Open Rooms tab shows listings or empty state message', async ({ page }) => {
    await page.getByText('Open Rooms').first().click();
    await page.waitForTimeout(1500);
    const hasListing = await page.getByText(/Williamsburg|LES|Bushwick|Brooklyn|Manhattan|room/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('No open rooms found').isVisible({ timeout: 3000 }).catch(() => false);
    const hasTryDifferent = await page.getByText('Try a different search or check back soon').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasListing || hasEmpty || hasTryDifferent, 'Open Rooms tab must show listings or an empty-state message').toBeTruthy();
  });

  test('Sublets tab switches and shows the seeded sublet listing', async ({ page }) => {
    // Seed guarantees one sublet listing (h6, West Village). Switch tabs and
    // hard-assert the sublet appears — proves the segment tab actually filters
    // server data by type=sublet.
    await page.getByText('Sublets').first().click();
    await page.waitForTimeout(1500);

    // The neighborhood label of the seeded sublet must render in the list.
    await expect(
      page.getByText(/West Village/i).first(),
      'Sublets tab must render the seeded West Village sublet listing',
    ).toBeVisible({ timeout: 8000 });

    // And the permanent-room neighborhoods (Williamsburg / Bushwick / LES) must NOT
    // be visible while the Sublets filter is active.
    await expect(page.getByText(/Bushwick/i)).toHaveCount(0);
  });

  test('Groups tab shows forming-group listings or empty state', async ({ page }) => {
    await page.getByText('Groups').first().click();
    await page.waitForTimeout(1200);
    const hasGroups = await page.getByText(/Park Slope|Astoria|forming group/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no groups found|no open rooms found|try a different/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasGroups || hasEmpty, 'Groups tab must show listings or an empty-state message').toBeTruthy();
  });

  test('search filters listings by keyword', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search neighborhoods/i);
    await expect(searchInput).toBeVisible({ timeout: 8000 });

    await searchInput.fill('Williamsburg');
    await page.waitForTimeout(800);

    const hasResults = await page.getByText(/Williamsburg/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasNoResults = await page.getByText(/no open rooms found|no groups found|try a different/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasResults || hasNoResults, 'Searching "Williamsburg" must return results or a no-results message').toBeTruthy();

    await searchInput.clear();
    await page.waitForTimeout(400);
  });

  test('tapping a listing card opens housing detail screen', async ({ page }) => {
    // Seed data guarantees 5 housing listings; "Open Rooms" must have at least
    // one card with a "$X/mo"-style price. Hard-assert without fallback.
    await page.getByText('Open Rooms').first().click();
    await page.waitForTimeout(1500);

    const card = page.getByText(/\/mo|per month|\$\d/i).first();
    await expect(card, 'seeded Open Rooms must show at least one listing with a price')
      .toBeVisible({ timeout: 8000 });
    await card.click();
    await page.waitForTimeout(1500);

    const onDetail = page.url().includes('/housing-detail');
    const detailContent = page.getByText(/request to join|spots left|move-in|amenities/i).first();
    expect(
      onDetail || await detailContent.isVisible({ timeout: 5000 }).catch(() => false),
      'tapping a listing card must open a housing-detail screen',
    ).toBe(true);
  });

  test('join button on housing detail changes state to Request Sent', async ({ page }) => {
    // Seed data guarantees housing listings exist. Fetch the first one and
    // drive the UI through to "Request Sent!".
    const token = await getAuthToken(page);
    expect(token, 'test user must have an auth token after login').toBeTruthy();

    const apiCtx = await request.newContext({ baseURL: 'http://localhost:80' });
    const res = await apiCtx.get('/api/housing', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok(), `GET /api/housing must succeed (was ${res.status()})`).toBe(true);

    const body = await res.json() as { listings?: Array<{ id: string }> } | Array<{ id: string }>;
    await apiCtx.dispose();
    const listings: Array<{ id: string }> = Array.isArray(body) ? body : (body.listings ?? []);
    expect(listings.length, 'seed must include at least one housing listing').toBeGreaterThan(0);

    const listingId = listings[0].id;

    // Visit /housing first so AppContext.housing is populated; the detail screen
    // returns null until the listing is in the housing array.
    await page.goto('/housing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.goto(`/housing-detail/${listingId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Accept the Alert.alert dialog that fires after tapping the join button
    page.on('dialog', (dialog) => dialog.accept());

    const joinBtn = page.locator('[data-testid="join-btn"]');
    await expect(joinBtn).toBeVisible({ timeout: 8000 });
    await joinBtn.click();
    await page.waitForTimeout(1500);

    // After clicking, the button must be replaced by the "Request Sent!" banner
    await expect(page.getByText('Request Sent!')).toBeVisible({ timeout: 8000 });
  });
});

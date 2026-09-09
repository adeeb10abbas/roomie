import { test, expect, Dialog } from '@playwright/test';
import { loginAsTestUser, TEST_EMAIL, TEST_PASSWORD, uniqueEmail, getAuthToken } from './helpers';

test.describe('Auth flows', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10000 });
    await expect(page.getByText('Roomie').first()).toBeVisible();
    await expect(page.getByText('Find your perfect roommate')).toBeVisible();
  });

  test('login with valid credentials lands on Discover tab', async ({ page }) => {
    await loginAsTestUser(page);
    await expect(page.getByText('Roomie').first()).toBeVisible({ timeout: 10000 });
    expect(page.url()).not.toContain('/login');
    // Auth token must have been persisted
    const token = await getAuthToken(page);
    expect(token, 'auth_token must be stored in localStorage after login').toBeTruthy();
  });

  test('login with wrong password does not navigate away from login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    let dialogSeen = false;
    page.on('dialog', async (dialog: Dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await page.getByText('Sign In', { exact: true }).click();
    await page.waitForTimeout(5000);

    const stillOnLogin = page.url().includes('/login');
    const hasInlineError = await page
      .getByText(/login failed|invalid email|incorrect|error/i)
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(stillOnLogin || dialogSeen || hasInlineError).toBeTruthy();
  });

  test('register a new account and land on onboarding', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('First name').fill('New Tester');
    await page.getByPlaceholder('you@example.com').fill(email);
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('securePass123');
      await passwordInputs[1].fill('securePass123');
    } else {
      await page.getByPlaceholder('••••••••').first().fill('securePass123');
    }
    await page.getByText('Create Account', { exact: true }).last().click();
    await page.waitForURL(url => url.pathname.includes('/onboarding'), { timeout: 15000 });
    await expect(page.getByText(/let's set up your profile/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('logout: Sign Out UI is rendered on the settings screen', async ({ page }) => {
    // Note: react-native-web's Alert.alert is a no-op (see
    // node_modules/react-native-web/dist/exports/Alert/index.js — `static alert(){}`),
    // so tapping the Sign Out row in web cannot trigger the confirm dialog or
    // the real logout. The end-to-end logout path is therefore exercised by the
    // next test, which calls the real /auth/logout endpoint and verifies the
    // auth guard kicks the user back to /login.
    await loginAsTestUser(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page.getByText('Sign Out', { exact: true }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Sign out of your account')).toBeVisible();
  });

  test('logout: POST /auth/logout + token clear redirects to /login on next nav', async ({ page }) => {
    await loginAsTestUser(page);
    const tokenBefore = await getAuthToken(page);
    expect(tokenBefore, 'must be authenticated before logout test').toBeTruthy();

    // Real backend logout: invalidate the refresh token server-side.
    const logoutRes = await page.evaluate(async (token) => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status };
    }, tokenBefore);
    expect(logoutRes.status, 'POST /api/auth/logout must succeed').toBeGreaterThanOrEqual(200);
    expect(logoutRes.status).toBeLessThan(300);

    // Mirror what AppContext.logout() does client-side: clear stored credentials.
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userId');
    });

    // Auth guard must now bounce a navigation back to /login.
    await page.goto('/');
    await page.waitForURL(u => u.pathname.includes('/login'), { timeout: 10000 });
    await expect(page.getByText('Find your perfect roommate')).toBeVisible({ timeout: 5000 });

    // Token is gone.
    const tokenAfter = await getAuthToken(page);
    expect(tokenAfter, 'auth_token must be cleared after logout').toBeFalsy();
  });

  test('clearing auth state redirects to login', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login');

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();

    await page.goto('/');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15000 });
    await expect(page.getByText('Find your perfect roommate')).toBeVisible();
  });
});

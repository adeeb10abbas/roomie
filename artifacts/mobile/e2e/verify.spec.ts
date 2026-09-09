import { test, expect } from '@playwright/test';
import {
  loginAsTestUser, setTestUserVerified, resetTestUserState,
} from './helpers';

test.describe('Verification flow', () => {
  test.afterAll(async () => {
    // Restore the canonical state so other specs see a verified test user.
    await setTestUserVerified(true);
  });

  test('verify-edu screen loads for an unverified user', async ({ page }) => {
    await setTestUserVerified(false);
    await loginAsTestUser(page);
    await page.goto('/verify-edu');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(
      page.getByText(/verify student status|enter your .edu email|verify/i).first()
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible({ timeout: 5000 });
  });

  test('submitting a .edu email fires POST /verification/request and shows OTP step', async ({ page }) => {
    await setTestUserVerified(false);
    await loginAsTestUser(page);
    await page.goto('/verify-edu');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const emailInput = page.getByPlaceholder('you@university.edu');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill(`tester-${Date.now()}@nyu.edu`);

    const reqPromise = page.waitForResponse(
      r => r.url().includes('/api/verification/request') && r.request().method() === 'POST',
      { timeout: 10000 },
    );
    await page.getByText('Send Verification Code').click();
    const res = await reqPromise;
    expect(res.status(), 'verification request must succeed').toBe(200);

    // The UI must transition to the OTP input step. Strict assertion — the
    // 6-digit code input is the canonical marker of the OTP step.
    await expect(
      page.getByPlaceholder('000000'),
      'OTP step must render the 6-digit code input after a successful request',
    ).toBeVisible({ timeout: 10000 });
  });

  test('submitting a non-.edu email shows a validation error and does NOT advance', async ({ page }) => {
    await setTestUserVerified(false);
    await loginAsTestUser(page);
    await page.goto('/verify-edu');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const emailInput = page.getByPlaceholder('you@university.edu');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill('tester@gmail.com');
    await page.getByText('Send Verification Code').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/\.edu email|valid \.edu/i).first()).toBeVisible({ timeout: 5000 });
    // Still on email step (no OTP input)
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible();
  });

  test('verify nudge appears on discover for unverified user and navigates to /verify-edu', async ({ page }) => {
    test.setTimeout(60000);
    await resetTestUserState();
    await setTestUserVerified(false);
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    const nudge = page.getByText('Verify your .edu email to boost your profile');
    await expect(nudge).toBeVisible({ timeout: 15000 });

    await nudge.click();
    await page.waitForURL(u => u.pathname.includes('/verify-edu'), { timeout: 10000 });
    await expect(page.getByPlaceholder('you@university.edu')).toBeVisible({ timeout: 10000 });
  });
});

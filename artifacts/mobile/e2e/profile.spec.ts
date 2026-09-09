import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Profile & settings flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('profile tab shows own profile info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Profile').first()).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByText(/about me|budget|move-in|edit profile|profile completion|lifestyle/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('edit profile screen loads with bio field', async ({ page }) => {
    await page.goto('/edit-profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(
      page.getByText(/edit profile|bio|budget|save changes/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('edit profile: change bio and save', async ({ page }) => {
    await page.goto('/edit-profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const bioInput = page.getByPlaceholder(/bio|about you|great roommate|tell us/i);
    await expect(bioInput).toBeVisible({ timeout: 8000 });

    await bioInput.clear();
    await bioInput.fill('Updated bio from e2e test run.');

    const saveBtn = page.getByText(/save|done|update/i).last();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(1000);
  });

  test('settings screen loads from profile tab', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page.getByText(/notifications|privacy|account/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('settings: blocked-users screen loads', async ({ page }) => {
    await page.goto('/blocked-users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(
      page.getByText(/blocked users|no blocked/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('settings: privacy screen loads', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(
      page.getByText(/privacy settings|profile visibility|show/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('settings: help screen loads with FAQ section', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(
      page.getByText(/help & support|frequently asked|faq|contact/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('settings: feedback screen loads with category options', async ({ page }) => {
    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(
      page.getByText(/send feedback|category|bug/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('feedback form: select category, write message, submit, and see success', async ({ page }) => {
    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Select the "Bug" category chip
    const categoryChip = page.getByText('Bug', { exact: true });
    await expect(categoryChip).toBeVisible({ timeout: 8000 });
    await categoryChip.click();
    await page.waitForTimeout(300);

    // Fill in the feedback textarea
    const textArea = page.locator('textarea').or(page.getByPlaceholder(/feedback|tell us|message|mind/i)).first();
    await expect(textArea).toBeVisible({ timeout: 5000 });
    await textArea.fill('This is an automated e2e test feedback submission to verify the full flow works.');

    // Verify the character counter updates (proves input was accepted)
    await expect(page.getByText(/\d+ characters/)).toBeVisible({ timeout: 3000 });

    // Submit the feedback by listening for the POST /api/feedback call
    const feedbackReqPromise = page.waitForResponse(
      (r) => r.url().includes('/api/feedback') && r.request().method() === 'POST',
      { timeout: 10000 },
    );
    const sendBtn = page.getByText('Send Feedback', { exact: true }).last();
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
    await sendBtn.click();

    const feedbackRes = await feedbackReqPromise;
    // API returns 201 Created on success; accept the 2xx success range strictly.
    const status = feedbackRes.status();
    expect(
      status >= 200 && status < 300,
      `POST /api/feedback must succeed (2xx) for a valid category + body, got ${status}`,
    ).toBe(true);

    // Hard-assert the success UI state actually renders after a 200.
    await expect(page.getByText('Thank you!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/helps us improve RoomieMatch/i)).toBeVisible({ timeout: 5000 });
  });
});

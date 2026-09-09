import { test, expect } from '@playwright/test';
import { uniqueEmail } from './helpers';

test.describe('Onboarding flow', () => {
  test('freshly registered user completes all steps and reaches app', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('First name').fill('Onboard Tester');
    await page.getByPlaceholder('you@example.com').fill(email);
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].fill('securePassword123');
      await passwordInputs[1].fill('securePassword123');
    } else {
      await page.getByPlaceholder('••••••••').fill('securePassword123');
    }
    await page.getByText('Create Account', { exact: true }).last().click();
    await page.waitForURL(url => url.pathname.includes('/onboarding'), { timeout: 15000 });

    await expect(page.getByText("Let's set up your profile")).toBeVisible({ timeout: 8000 });

    // Step 1: basic info — name + age are required.
    const nameInput = page.getByPlaceholder('First name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Onboard Tester');
    const ageInput = page.getByPlaceholder(/e\.g\. 24|age/i);
    await expect(ageInput).toBeVisible({ timeout: 5000 });
    await ageInput.fill('25');
    await page.getByText(/continue|next/i).last().click();

    // Step 2: university.
    const uniInput = page.getByPlaceholder(/nyu|columbia|university/i);
    await expect(uniInput).toBeVisible({ timeout: 5000 });
    await uniInput.fill('NYU');
    await page.getByText(/continue|next/i).last().click();

    // Step 3: location + budget.
    const neighborhoodBtn = page.getByText('Williamsburg').first();
    await expect(neighborhoodBtn).toBeVisible({ timeout: 5000 });
    await neighborhoodBtn.click();
    const minBudget = page.getByPlaceholder('1000');
    await expect(minBudget).toBeVisible({ timeout: 5000 });
    await minBudget.fill('1200');
    const maxBudget = page.getByPlaceholder('2000');
    await expect(maxBudget).toBeVisible({ timeout: 5000 });
    await maxBudget.fill('2000');
    await page.getByText(/continue|next/i).last().click();

    // Step 3: core lifestyle — defaults are fine; just advance.
    const step3Continue = page.getByText(/continue|next/i).last();
    await expect(step3Continue).toBeVisible({ timeout: 5000 });
    await step3Continue.click();

    // Step 4: extended lifestyle — defaults are fine; just advance.
    const step4Continue = page.getByText(/continue|next/i).last();
    await expect(step4Continue).toBeVisible({ timeout: 5000 });
    await step4Continue.click();

    // Step 5: bio + finish.
    const bioInput = page.getByPlaceholder(/what makes you|bio|about/i);
    await expect(bioInput).toBeVisible({ timeout: 5000 });
    await bioInput.fill('Love clean spaces and good vibes.');

    const finishBtn = page.getByText(/find my roommate|get started|finish|done/i).last();
    await expect(finishBtn).toBeVisible({ timeout: 5000 });
    await finishBtn.click();

    // Strict: must leave onboarding and land in the app shell.
    await page.waitForURL(url => !url.pathname.includes('/onboarding'), { timeout: 20000 });
    await expect(page.getByText('Roomie').first()).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Mode switching', () => {
  test('mock -> standalone shell -> mock roundtrip', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/mock mode/i)).toBeVisible({ timeout: 10_000 });

    const loginButton = page.getByRole('button', { name: /login \(real data\)/i });
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    test.skip(!hasLoginButton, 'Standalone login button is hidden when AAD env is not configured.');

    await loginButton.click();
    await expect(page.getByText(/standalone mode/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /return to mock mode/i }).click();
    await expect(page.getByText(/mock mode/i)).toBeVisible({ timeout: 10_000 });
  });
});

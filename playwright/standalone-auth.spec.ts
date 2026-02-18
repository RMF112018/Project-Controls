import { test, expect } from '@playwright/test';

test.describe('Standalone auth shell', () => {
  test('login shell is reachable from mock mode', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const loginButton = page.getByRole('button', { name: /login \(real data\)/i });
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    test.skip(!hasLoginButton, 'Standalone login button is hidden when AAD env is not configured.');

    await loginButton.click();
    await expect(page.getByRole('heading', { name: /hbc project controls/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/standalone mode/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible({ timeout: 10_000 });
  });
});

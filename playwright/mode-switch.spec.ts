import { test, expect } from '@playwright/test';

test.describe('Mode switching', () => {
  test('mock -> standalone shell -> mock roundtrip', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Mode badge is visible in header without opening the menu
    await expect(page.getByText(/mock mode/i)).toBeVisible({ timeout: 10_000 });

    // Open header user menu to access mode switch
    await page.locator('[data-testid="role-switcher"]').click();
    const loginButton = page.getByRole('menuitem', { name: /login \(real data\)/i });
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    test.skip(!hasLoginButton, 'Standalone login button is hidden when AAD env is not configured.');

    await loginButton.click();
    await expect(page.getByText(/live data/i)).toBeVisible({ timeout: 10_000 });

    // Open header menu again to return to mock mode
    await page.locator('[data-testid="role-switcher"]').click();
    await page.getByRole('menuitem', { name: /return to mock mode/i }).click();
    await expect(page.getByText(/mock mode/i)).toBeVisible({ timeout: 10_000 });
  });
});

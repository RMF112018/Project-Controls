import { test, expect } from './fixtures/roleFixture';

test.describe('Mode switching', () => {
  test('mock -> standalone shell -> mock roundtrip', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    // Mode badge is visible in header without opening the menu
    await expect(page.locator('[data-testid="role-switcher"]').getByText(/mock mode/i)).toBeVisible({ timeout: 10_000 });

    // Open header user menu to access mode switch
    await page.locator('[data-testid="role-switcher"]').click();
    const loginButton = page.getByRole('menuitem', { name: /login \(real data\)/i });
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    test.skip(!hasLoginButton, 'Standalone login button is hidden when AAD env is not configured.');

    await loginButton.click();
    await expect(page.getByText(/standalone mode/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /sign in with microsoft/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /return to mock mode/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /return to mock mode/i }).click();

    // Open header menu again to return to mock mode
    await expect(page.locator('[data-testid="role-switcher"]').getByText(/mock mode/i)).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from './fixtures/roleFixture';

test.describe('TanStack Router Wave 4 — admin/accounting parity', () => {
  test('pilot flag OFF preserves legacy deep links for admin/accounting', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/accounting-queue');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/admin/performance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  });

  test('pilot flag ON routes admin/accounting deep links via TanStack and blocks unauthorized role', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/admin?tab=flags');
    await page.waitForLoadState('networkidle');

    const routerFlagRow = page.locator('tr', { hasText: 'TanStack Router Enabled' }).first();
    await expect(routerFlagRow).toBeVisible({ timeout: 15_000 });
    await routerFlagRow.locator('button').first().click({ force: true });
    await page.waitForTimeout(400);

    await page.goto('/#/accounting-queue');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/admin/telemetry');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await switchRole('Marketing');
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/#\/access-denied$/);
  });
});

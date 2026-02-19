import { test, expect } from './fixtures/roleFixture';

test.describe('TanStack Router Wave 5 — system route parity', () => {
  test('pilot flag OFF keeps legacy marketing and access-denied routes operational', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('Marketing');

    await page.goto('/#/marketing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/access-denied');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible({ timeout: 10_000 });
  });

  test('pilot flag ON routes system paths via TanStack and preserves guard/catch-all behavior', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/admin?tab=flags');
    await page.waitForLoadState('networkidle');

    const routerFlagRow = page.locator('tr', { hasText: 'TanStack Router Pilot' }).first();
    await expect(routerFlagRow).toBeVisible({ timeout: 15_000 });
    await routerFlagRow.locator('button').first().click({ force: true });
    await page.waitForTimeout(400);

    await page.goto('/#/marketing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/route-that-does-not-exist');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible({ timeout: 10_000 });

    await switchRole('OperationsTeam');
    await page.goto('/#/marketing');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/#\/access-denied$/);
  });
});

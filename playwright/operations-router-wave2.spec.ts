import { test, expect } from './fixtures/roleFixture';

test.describe('TanStack Router Wave 2 — operations deep-link parity', () => {
  test('pilot flag OFF keeps legacy project-required UX', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/operations/project-settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /no project selected/i })).toBeVisible({ timeout: 10_000 });
  });

  test('pilot flag ON routes operations deep link through TanStack redirect UX', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/admin?tab=flags');
    await page.waitForLoadState('networkidle');

    const routerFlagRow = page.locator('tr', { hasText: 'TanStack Router Pilot' }).first();
    await expect(routerFlagRow).toBeVisible({ timeout: 15_000 });
    await routerFlagRow.locator('button').first().click();
    await page.waitForTimeout(400);

    await page.goto('/#/operations/project-settings');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/#\/operations$/);
    await expect(page.getByRole('heading', { name: /no project selected/i })).not.toBeVisible();
  });
});


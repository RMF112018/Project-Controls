import { test, expect } from './fixtures/roleFixture';

test.describe('TanStack Router Wave 3 — precon/lead/job-request parity', () => {
  test('pilot flag OFF preserves legacy deep links for precon and lead', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/lead/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  });

  test('pilot flag ON keeps precon/lead/job-request deep links operational', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/admin?tab=flags');
    await page.waitForLoadState('networkidle');

    const routerFlagRow = page.locator('tr', { hasText: 'TanStack Router Pilot' }).first();
    await expect(routerFlagRow).toBeVisible({ timeout: 15_000 });
    await routerFlagRow.locator('button').first().click();
    await page.waitForTimeout(400);

    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/preconstruction/pursuit/1/interview');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/lead/1/gonogo');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/job-request');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  });
});


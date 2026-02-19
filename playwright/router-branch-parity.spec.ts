import { test, expect } from './fixtures/roleFixture';

test.describe('Router branch parity', () => {
  test('TanStack routing preserves critical deep links', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/operations/project');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/admin?tab=flags');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  });
});

import { expect, test } from '@playwright/test';

test.describe('Sprint 3 virtualized/infinite smoke', () => {
  test('compliance and operations log routes render with default paging fallback', async ({ page }) => {
    const routes = [
      '/#/admin',
      '/#/admin/compliance',
      '/#/operations/buyout-log',
      '/#/operations/constraints-log',
      '/#/operations/permits-log',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
    }
  });
});

import { expect, test } from '@playwright/test';

test.describe('Sprint 3 virtualized/infinite smoke', () => {
  test('virtualized routes remain stable after Stage 11 lazy branch navigation', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hbc-dev-selected-role', 'Administrator');
        localStorage.setItem('hbc-last-seen-version', '1.0.0');
      } catch {
        // no-op
      }
    });

    const lazyRoutes = [
      '/#/shared-services/marketing',
      '/#/operations/logs/monthly-reports',
      '/#/admin',
    ];

    for (const route of lazyRoutes) {
      const startedAt = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      expect(Date.now() - startedAt, `Expected ${route} to render within 20s`).toBeLessThan(20_000);
    }

    const routes = [
      '/#/operations/logs/buyout',
      '/#/operations/logs/constraints',
      '/#/operations/logs/permits',
      '/#/operations/project',
    ];

    for (const route of routes) {
      const startedAt = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      expect(Date.now() - startedAt, `Expected ${route} to render within 20s`).toBeLessThan(20_000);
    }
  });
});

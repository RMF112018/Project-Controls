import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/roleFixture';

async function assertLazyBranchNavigation(page: Page, route: string, maxMs: number): Promise<void> {
  await page.locator('#webpack-dev-server-client-overlay').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
  const startedAt = Date.now();
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  const elapsedMs = Date.now() - startedAt;

  await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expect(elapsedMs, `Expected ${route} to load in under ${maxMs}ms`).toBeLessThan(maxMs);
}

test.describe('Router branch parity', () => {
  test('TanStack routing preserves critical deep links', async ({ page }) => {
    test.setTimeout(120_000);

    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hbc-dev-selected-role', 'Administrator');
        localStorage.setItem('hbc-last-seen-version', '1.0.0');
      } catch {
        // no-op
      }
    });

    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const routes = [
      '/#/operations/project',
      '/#/shared-services/marketing',
      '/#/operations/logs/monthly-reports',
      '/#/admin',
      '/#/preconstruction',
    ];

    for (const route of routes) {
      await assertLazyBranchNavigation(page, route, 15_000);
    }
  });
});

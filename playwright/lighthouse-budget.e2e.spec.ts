import { test, expect } from './fixtures/roleFixture';

test.describe('Stage 4 Lighthouse-style budgets', () => {
  test('hub route meets basic perf/accessibility budgets', async ({ page, switchRole }) => {
    // Stage 4 (sub-task 4): app-scope Lighthouse-style assertions inside Playwright.
    await page.goto('/#/');
    await switchRole('Leadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const navTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return {
        domInteractive: nav?.domInteractive ?? 0,
        loadEventEnd: nav?.loadEventEnd ?? 0,
      };
    });

    const hasMain = await page.locator('main, [role="main"]').count();
    const hasH1 = await page.locator('h1').count();

    expect(navTiming.domInteractive).toBeGreaterThan(0);
    expect(navTiming.domInteractive).toBeLessThan(2000);
    expect(navTiming.loadEventEnd).toBeGreaterThan(0);
    expect(navTiming.loadEventEnd).toBeLessThan(4000);
    expect(hasMain).toBeGreaterThan(0);
    expect(hasH1).toBeGreaterThan(0);
  });
});

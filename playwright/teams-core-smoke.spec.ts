import { test, expect } from '@playwright/test';

test.describe('Teams embed core smoke', () => {
  test('critical pages render inside iframe embed shell', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.setContent('<iframe id="teams-shell" src="/#/" style="width: 1280px; height: 900px; border: 0;"></iframe>');

    const frame = page.frameLocator('#teams-shell');
    await expect(frame.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });

    const routes = [
      '/#/operations',
      '/#/operations/project',
      '/#/operations/constraints-log',
      '/#/preconstruction',
      '/#/admin',
      '/#/admin/compliance',
      '/#/marketing',
    ];

    for (const route of routes) {
      const iframe = page.locator('#teams-shell');
      await iframe.evaluate((node, nextRoute) => {
        (node as HTMLIFrameElement).src = `http://localhost:3000${nextRoute}`;
      }, route);
      await expect(frame.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
    }
  });
});

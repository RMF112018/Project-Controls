import { test, expect } from './fixtures/roleFixture';

test.describe('Stage 4 load time guardrails', () => {
  const routes = ['/#/', '/#/preconstruction', '/#/operations', '/#/shared-services'];

  for (const route of routes) {
    test(`route ${route} interactive under 2s`, async ({ page, switchRole }) => {
      // Stage 4 (sub-task 4): enforce load-time budget on key workspaces.
      await page.goto('/#/');
      await switchRole('Leadership');
      const start = Date.now();
      await page.goto(route);
      await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 10000 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });
  }
});

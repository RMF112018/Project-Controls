import { test, expect } from './fixtures/roleFixture';

test.describe('Stage 4 console cleanliness', () => {
  test('critical routes emit no console errors', async ({ page, switchRole }) => {
    // Stage 4 (sub-task 4): production-readiness signal for runtime hygiene.
    await page.goto('/#/');
    await switchRole('Administrator');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    const routes = ['/#/', '/#/preconstruction', '/#/operations', '/#/shared-services', '/#/admin'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.locator('main, [role="main"]').first().waitFor({ state: 'visible', timeout: 10000 });
    }

    expect(errors, `Console errors detected:\n${errors.join('\n')}`).toEqual([]);
  });
});

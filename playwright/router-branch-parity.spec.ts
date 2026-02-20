import { test, expect } from './fixtures/roleFixture';

test.describe('Router branch parity', () => {
  test('TanStack routing preserves critical deep links', async ({ page, switchRole }) => {
    test.setTimeout(90_000);
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await switchRole('SuperAdmin');

    const assertDeepLink = async (target: string, expected: RegExp): Promise<void> => {
      const routePage = await page.context().newPage();
      await routePage.goto(target, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await routePage.waitForURL(expected, { timeout: 15_000 });
      await routePage.waitForTimeout(800);
      await routePage.close();
    };

    await assertDeepLink('/#/operations/project', /#\/operations(\/[^/]+\/project)?$/);
    await assertDeepLink('/#/admin?tab=flags', /#\/admin\?tab=flags$/);
    await assertDeepLink('/#/preconstruction', /#\/preconstruction$/);

    await expect(page.url()).toContain('/#/');
  });
});

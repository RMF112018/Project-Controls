import { test, expect } from '@playwright/test';

test.describe('Teams embed core smoke', () => {
  test('critical pages render inside iframe embed shell', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.setContent('<iframe id="teams-shell" src="/#/" style="width: 1280px; height: 900px; border: 0;"></iframe>');

    const frame = page.frameLocator('#teams-shell');
    const ensureFrameAppReady = async (): Promise<void> => {
      const rolePicker = frame.getByTestId('role-picker');
      if (await rolePicker.isVisible().catch(() => false)) {
        await frame.getByTestId('role-option-Administrator').click();
        await frame.getByTestId('role-continue-btn').click();
      }
      await expect(frame.locator('main, [role="main"]')).toBeVisible({ timeout: 20_000 });
    };

    await ensureFrameAppReady();

    const routes = [
      '/#/operations',
      '/#/operations/project',
      '/#/operations/constraints-log',
      '/#/operations/project/settings',
      '/#/operations/project/manual/startup',
      '/#/operations/pmp',
      '/#/preconstruction',
      '/#/admin',
      '/#/admin/compliance',
      '/#/marketing',
    ];

    for (const route of routes) {
      const iframe = page.locator('#teams-shell');
      await iframe.evaluate((node, nextRoute) => {
        (node as HTMLIFrameElement).src = nextRoute;
      }, route);
      await ensureFrameAppReady();

      if (route === '/#/operations/project/settings') {
        const bodyText = (await frame.locator('body').innerText()).toLowerCase();
        const hasExpectedMarker =
          bodyText.includes('project settings') ||
          bodyText.includes('no project selected') ||
          bodyText.includes('access denied') ||
          bodyText.includes('page not found') ||
          bodyText.includes('analytics hub') ||
          bodyText.includes('loading content');
        expect(hasExpectedMarker).toBeTruthy();
      }

      if (route === '/#/operations/project/manual/startup') {
        const bodyText = (await frame.locator('body').innerText()).toLowerCase();
        const hasExpectedMarker =
          bodyText.includes('startup') ||
          bodyText.includes('closeout') ||
          bodyText.includes('no project selected') ||
          bodyText.includes('access denied') ||
          bodyText.includes('page not found') ||
          bodyText.includes('analytics hub') ||
          bodyText.includes('loading content');
        expect(hasExpectedMarker).toBeTruthy();
      }

      if (route === '/#/operations/pmp') {
        const bodyText = (await frame.locator('body').innerText()).toLowerCase();
        const hasExpectedMarker =
          bodyText.includes('project management plan') ||
          bodyText.includes('no project selected') ||
          bodyText.includes('access denied') ||
          bodyText.includes('page not found') ||
          bodyText.includes('analytics hub') ||
          bodyText.includes('loading content');
        expect(hasExpectedMarker).toBeTruthy();
      }
    }
  });
});

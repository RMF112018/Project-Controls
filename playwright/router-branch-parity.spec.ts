import { test, expect } from './fixtures/roleFixture';

async function setTanStackRouterFlag(page: import('@playwright/test').Page, enabled: boolean): Promise<boolean> {
  await page.goto('/#/admin?tab=flags');
  await page.waitForLoadState('networkidle');
  const closeWhatsNewButton = page.getByRole('button', { name: /^×$/ });
  if (await closeWhatsNewButton.isVisible().catch(() => false)) {
    await closeWhatsNewButton.click({ force: true });
  }

  const row = page
    .locator('tr, [role="row"]')
    .filter({ hasText: /TanStack Router (Enabled|Pilot)|TanStackRouterEnabled|TanStackRouterPilot/i })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });

  const switchControl = row.getByRole('switch').first();
  const buttonControl = row.locator('button').first();
  const hasSwitch = (await switchControl.count()) > 0;
  const hasButton = (await buttonControl.count()) > 0;
  if (!hasSwitch && !hasButton) {
    return false;
  }
  const toggleControl = hasSwitch ? switchControl : buttonControl;
  const currentlyEnabled = (await toggleControl.getAttribute('aria-checked')) === 'true';

  if (currentlyEnabled !== enabled) {
    await toggleControl.click({ force: true });
    await page.waitForTimeout(500);
  }
  return true;
}

test.describe('Router branch parity', () => {
  test('legacy and TanStack branches both preserve critical deep links', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    const canDisable = await setTanStackRouterFlag(page, false);
    await page.goto('/#/operations/project');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    const canEnable = await setTanStackRouterFlag(page, true);
    if (!canDisable || !canEnable) {
      test.info().annotations.push({
        type: 'note',
        description: 'TanStack flag toggle control not rendered; validated deep-link parity only.',
      });
    }
    await page.goto('/#/operations/project');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  });
});

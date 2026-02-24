import { test, expect } from './fixtures/roleFixture';

/**
 * Dismiss the "What's New" modal that auto-opens on first load
 * when localStorage doesn't have the current version stamp.
 */
async function dismissWhatsNew(page: import('@playwright/test').Page): Promise<void> {
  const closeButton = page.locator('button:has-text("×")').first();
  try {
    await closeButton.waitFor({ state: 'visible', timeout: 3_000 });
    await closeButton.click();
    await page.waitForTimeout(300);
  } catch {
    // Modal didn't appear — already dismissed or version already seen
  }
}

test.describe('Provisioning Saga', () => {
  test('admin provisioning page renders with KPI cards and table', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/provisioning');
    await page.waitForLoadState('networkidle');

    // KPI cards should be visible
    await expect(page.locator('text=Total Provisioned')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=In Progress')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Failed')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Avg Duration')).toBeVisible({ timeout: 5_000 });
  });

  test('ProvisioningSaga feature flag visible in admin', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/feature-flags');
    await page.waitForLoadState('networkidle');

    // The ProvisioningSaga flag should be visible in the Feature Flags page
    const flagSwitch = page.getByRole('switch', { name: 'Toggle Provisioning Saga' });
    await expect(flagSwitch).toBeVisible({ timeout: 15_000 });
  });

  test('provisioning page shows text progress when saga flag OFF', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    // Ensure ProvisioningSaga flag is OFF (default)
    await page.goto('/#/admin/provisioning');
    await page.waitForLoadState('networkidle');

    // Should show text-based progress "X / 7 steps" (not stepper)
    await expect(page.locator('text=/\\d+ \\/ 7 steps/').first()).toBeVisible({ timeout: 10_000 });
  });
});

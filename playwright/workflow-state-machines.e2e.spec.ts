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

test.describe('Workflow State Machines', () => {
  test('feature flag toggle exposes machine actions', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/feature-flags');
    await page.waitForLoadState('networkidle');

    // FeatureFlagsPage uses Fluent UI Switch components (not table rows).
    // Each Switch has aria-label="Toggle {DisplayName}".
    const flagSwitch = page.getByRole('switch', { name: 'Toggle Workflow State Machine' });
    await expect(flagSwitch).toBeVisible({ timeout: 15_000 });
    await flagSwitch.click();

    // Navigate to Go/No-Go page — machine actions should now be visible
    await page.goto('/#/preconstruction/bd/go-no-go');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid^="gonogo-machine-action-"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('machine path still renders status rows', async ({ page, switchRole }) => {
    // Start at home, dismiss modal, switch role, then navigate
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('BDRepresentative');

    await page.goto('/#/preconstruction/bd/go-no-go');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="gonogo-workflow-status"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('project hub uses canonical scorecard component', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/project-hub/precon/go-no-go');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
  });
});

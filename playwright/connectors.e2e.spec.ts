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

test.describe('Connector Management Panel', () => {
  // 1. Admin sees connector cards
  test('admin sees connector cards for Procore and BambooHR', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const grid = page.locator('[data-testid="connector-grid"]');
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // At least 2 connector cards should be visible (Procore + BambooHR from mock data)
    const cards = page.locator('[data-testid^="connector-card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // 2. Test Connection updates status
  test('test connection button re-enables after click', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const testButton = page.locator('[data-testid^="connector-test-"]').first();
    await expect(testButton).toBeVisible({ timeout: 10_000 });
    // force: true bypasses the dev RoleSwitcher overlay that may intercept pointer events
    await testButton.click({ force: true });

    // Button should re-enable after test connection completes
    await expect(testButton).toBeEnabled({ timeout: 10_000 });
  });

  // 3. Sync Now triggers sync
  test('sync now button re-enables after click', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const syncButton = page.locator('[data-testid^="connector-sync-"]').first();
    await expect(syncButton).toBeVisible({ timeout: 10_000 });
    await syncButton.click({ force: true });

    // Button should re-enable after sync completes
    await expect(syncButton).toBeEnabled({ timeout: 10_000 });
  });

  // 4. History drawer opens
  test('history drawer opens when clicking history button', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const historyButton = page.locator('[data-testid^="connector-history-"]').first();
    await expect(historyButton).toBeVisible({ timeout: 10_000 });
    await historyButton.click({ force: true });

    // Sync history drawer should become visible
    const drawer = page.locator('[data-testid="sync-history-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 5_000 });
  });

  // 5. Non-admin denied
  test('non-admin cannot see connector grid', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('BDRepresentative');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    // Connector grid should NOT be visible for non-admin role
    const grid = page.locator('[data-testid="connector-grid"]');
    await expect(grid).not.toBeVisible({ timeout: 5_000 });
  });
});

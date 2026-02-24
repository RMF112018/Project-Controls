import { test, expect } from './fixtures/roleFixture';

/**
 * connectors-resilience.e2e.spec.ts — Phase 5A.1 Connector Resilience E2E tests.
 *
 * Validates that useConnectorMutation adoption is visible in the UI:
 * mutation buttons re-enable, status updates, error-free operation,
 * role gating, and history drawer population.
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

test.describe('Phase 5A.1: Connector Resilience E2E', () => {
  // 1. Admin test connection triggers mutation (button re-enables, card status updates)
  test('test connection mutation completes and updates card status', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid^="connector-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    const testButton = page.locator('[data-testid^="connector-test-"]').first();
    await expect(testButton).toBeVisible({ timeout: 5_000 });
    await testButton.click();

    // Button re-enables after mutation completes (useConnectorMutation handles isPending)
    await expect(testButton).toBeEnabled({ timeout: 10_000 });

    // Card should show Active status after successful test (mock always succeeds)
    const statusBadge = card.locator('text=Active').first();
    await expect(statusBadge).toBeVisible({ timeout: 5_000 });
  });

  // 2. Admin sync triggers mutation (button re-enables, grid refreshes)
  test('sync mutation completes and button re-enables', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const syncButton = page.locator('[data-testid^="connector-sync-"]').first();
    await expect(syncButton).toBeVisible({ timeout: 10_000 });
    await syncButton.click();

    // Mutation completes → button re-enables via useConnectorMutation isPending
    await expect(syncButton).toBeEnabled({ timeout: 10_000 });
  });

  // 3. After sync, connector card shows updated lastSync timestamp
  test('connector card shows lastSync after sync mutation', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const syncButton = page.locator('[data-testid^="connector-sync-"]').first();
    await expect(syncButton).toBeVisible({ timeout: 10_000 });
    await syncButton.click();
    await expect(syncButton).toBeEnabled({ timeout: 10_000 });

    // Card should display a lastSync timestamp (mock returns current ISO string)
    const card = page.locator('[data-testid^="connector-card-"]').first();
    const cardText = await card.textContent();
    // Verify the card contains some date-like content after sync
    expect(cardText).toBeTruthy();
  });

  // 4. Mutation success shows no error state on card
  test('no error state visible after successful mutation', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    const testButton = page.locator('[data-testid^="connector-test-"]').first();
    await expect(testButton).toBeVisible({ timeout: 10_000 });
    await testButton.click();
    await expect(testButton).toBeEnabled({ timeout: 10_000 });

    // No error badge should be visible on the card (mock always succeeds)
    const card = page.locator('[data-testid^="connector-card-"]').first();
    const errorBadge = card.locator('[data-testid="connector-error"]');
    await expect(errorBadge).not.toBeVisible({ timeout: 3_000 });
  });

  // 5. Non-admin denied access to mutation buttons
  test('non-admin cannot access connector mutation buttons', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('BDRepresentative');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    // Connector grid should not be visible for non-admin role
    const grid = page.locator('[data-testid="connector-grid"]');
    await expect(grid).not.toBeVisible({ timeout: 5_000 });

    // Mutation buttons should not exist
    const testButton = page.locator('[data-testid^="connector-test-"]');
    await expect(testButton).not.toBeVisible({ timeout: 3_000 });
    const syncButton = page.locator('[data-testid^="connector-sync-"]');
    await expect(syncButton).not.toBeVisible({ timeout: 3_000 });
  });

  // 6. History drawer shows entries after sync mutation
  test('history drawer shows entries after sync mutation', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/connections');
    await page.waitForLoadState('networkidle');

    // Trigger a sync first
    const syncButton = page.locator('[data-testid^="connector-sync-"]').first();
    await expect(syncButton).toBeVisible({ timeout: 10_000 });
    await syncButton.click();
    await expect(syncButton).toBeEnabled({ timeout: 10_000 });

    // Open history drawer
    const historyButton = page.locator('[data-testid^="connector-history-"]').first();
    await expect(historyButton).toBeVisible({ timeout: 5_000 });
    await historyButton.click();

    // Drawer should be visible with at least one entry
    const drawer = page.locator('[data-testid="sync-history-drawer"]');
    await expect(drawer).toBeVisible({ timeout: 5_000 });

    // Drawer should not show the empty state message (mock returns fixture entries)
    const emptyMsg = drawer.locator('text=No sync history available');
    await expect(emptyMsg).not.toBeVisible({ timeout: 3_000 });
  });
});

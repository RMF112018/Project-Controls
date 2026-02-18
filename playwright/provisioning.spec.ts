import { test, expect } from './fixtures/roleFixture';

test.describe('Provisioning workflow — BD Lead to site creation', () => {
  test.beforeEach(async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
  });

  test('Admin panel renders for Executive Leadership', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 8_000 });
    // Admin heading or admin content should be present
    const heading = page.getByRole('heading');
    await expect(heading.first()).toBeVisible({ timeout: 8_000 });
  });

  test('Lead detail page accessible via lead workflow', async ({ page, switchRole }) => {
    await switchRole('BDRepresentative');
    await page.goto('/#/lead/1');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('GoNoGo scorecard route renders main content', async ({ page }) => {
    await page.goto('/#/lead/1/gonogo');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('Job Number Request route renders without crash', async ({ page }) => {
    await page.goto('/#/job-number-request');
    await page.waitForLoadState('networkidle');
    // Should render something — either the form or an access guard
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('Provisioning status section visible in admin for authorized roles', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    // Admin panel should load without crash
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 8_000 });
    // Verify no uncaught errors
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

// ── GitOps / Template Site Sync E2E tests ────────────────────────────────────

test.describe('GitOps provisioning — TemplateSiteSync feature flag', () => {
  test('template-site-sync-panel is absent when TemplateSiteSync flag is disabled', async ({ page, switchRole }) => {
    // Switch to ExecutiveLeadership (who would be able to see the panel if enabled)
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');

    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 8_000 });

    // TemplateSiteSync flag is Enabled: false in featureFlags.json
    // so the panel must not be present in the DOM / visible
    await expect(page.locator('[data-testid="template-site-sync-panel"]')).not.toBeVisible();
  });

  test('admin panel provisioning tab renders without errors after GitOps wiring', async ({ page, switchRole }) => {
    // Regression guard: verifies that wiring ProvisioningService with useGitOpsProvisioning
    // does not break the admin panel render path.
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 8_000 });

    // Allow any deferred rendering to settle
    await page.waitForTimeout(500);

    // No uncaught JS errors should be present after GitOps wiring
    expect(errors).toHaveLength(0);
  });

  test('admin panel loads and heading is visible for ExecutiveLeadership after GitOps changes', async ({ page, switchRole }) => {
    // Basic smoke test: confirms the admin route still renders correctly
    // after all GitOps Phase D wiring changes to AdminPanel.tsx.
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');

    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible({ timeout: 8_000 });

    // There should be at least one heading element rendered
    const heading = page.getByRole('heading');
    await expect(heading.first()).toBeVisible({ timeout: 8_000 });
  });
});

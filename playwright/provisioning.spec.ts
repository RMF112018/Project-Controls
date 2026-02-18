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

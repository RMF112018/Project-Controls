/**
 * telemetry.spec.ts — E2E tests for the TelemetryDashboard page.
 *
 * Relies on the dev server (npm run dev) with MockDataService.
 * The TelemetryDashboard feature flag is enabled by default in featureFlags.json.
 */
import { test, expect } from './fixtures/roleFixture';

test.describe('Telemetry Dashboard', () => {
  test('Executive Leadership sees Telemetry nav item', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');

    // The nav item "Telemetry" should appear in the sidebar (Admin group expanded)
    await expect(
      page.locator('nav').getByText('Telemetry')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Telemetry dashboard renders page title and 8 chart sections', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');

    // Navigate to telemetry page
    await page.goto('/#/admin/telemetry');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // allow MockDataService async resolution

    // Page title visible
    await expect(page.getByRole('heading', { name: /telemetry dashboard/i })).toBeVisible({ timeout: 10_000 });

    // All 8 ChartCard containers rendered
    const chartCards = page.locator('[data-testid="chart-card"]');
    await expect(chartCards).toHaveCount(8, { timeout: 10_000 });
  });

  test('KPI row is visible on telemetry dashboard', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');

    await page.goto('/#/admin/telemetry');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // At least one KPI card label should be visible
    await expect(page.getByText('Avg Load Time')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Active Users (30d)')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Provisioning Success')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Total Events')).toBeVisible({ timeout: 10_000 });
  });

  test('BD Representative does not see Telemetry nav item', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('BDRepresentative');

    // BD Rep should NOT see the Telemetry nav item (role-gated + feature-flag restricted to Exec/Admin)
    await expect(
      page.getByRole('navigation').getByText('Telemetry')
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('BD Representative navigating to telemetry route sees not-found or is redirected', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('BDRepresentative');

    await page.goto('/#/admin/telemetry');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should NOT see the TelemetryDashboard title — either not found or access denied
    await expect(
      page.getByRole('heading', { name: /telemetry dashboard/i })
    ).not.toBeVisible({ timeout: 5_000 });
  });
});
